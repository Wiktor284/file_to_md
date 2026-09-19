const http = require("http");
const fs = require("fs");
const path = require("path");
const { extractText } = require("./lib/extract");
const { cleanText } = require("./lib/clean");

const PORT = Number(process.env.PORT) || 8765;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC = path.join(__dirname, "public");

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res, code, obj) {
  const payload = Buffer.from(JSON.stringify(obj), "utf8");
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": payload.length,
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const content = fs.readFileSync(path.join(PUBLIC, "index.html"));
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": content.length,
    });
    res.end(content);
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(404);
    res.end();
    return;
  }

  let body;
  try {
    body = JSON.parse((await readBody(req)).toString("utf8"));
  } catch {
    sendJson(res, 400, { error: "Nieprawidłowe JSON." });
    return;
  }

  if (req.url === "/api/extract") {
    try {
      const onProgress = (info) => {
        if (info.phase === "ocr" && info.page) {
          console.log(`  OCR — strona ${info.page}/${info.total || "?"}`);
        } else if (info.message) {
          console.log(`  ${info.message}`);
        }
      };
      const { text, method } = await extractText(
        body.filename || "file.txt",
        Buffer.from(body.data || "", "base64"),
        onProgress
      );
      sendJson(res, 200, { text, chars: text.length, method });
    } catch (err) {
      sendJson(res, 500, { error: String(err.message || err) });
    }
    return;
  }

  if (req.url === "/api/clean") {
    try {
      const text = cleanText(String(body.text || ""));
      sendJson(res, 200, { text, chars: text.length });
    } catch (err) {
      sendJson(res, 500, { error: String(err.message || err) });
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} zajęty`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  console.log(`Document Parser → http://localhost:${PORT}`);
});
