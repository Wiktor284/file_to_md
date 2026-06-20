const http = require("http");
const fs = require("fs");
const path = require("path");
const { extractText } = require("./extract");
const { cleanText } = require("./clean");
const { checkMathAvailable, warmupMathModels } = require("./math");

const PORT = 8765;
const ROOT = __dirname;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
    ...CORS,
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  console.log(`  ${req.socket.remoteAddress || "?"} — ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    res.writeHead(200, CORS);
    res.end();
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const content = fs.readFileSync(path.join(ROOT, "index.html"));
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": content.length,
    });
    res.end(content);
    return;
  }

  if (req.method === "GET" && req.url === "/status") {
    const math = await checkMathAvailable();
    sendJson(res, 200, { pdf: true, docx: true, ocr: true, math });
    return;
  }

  if (req.method === "POST") {
    let body;
    try {
      body = JSON.parse((await readBody(req)).toString("utf8"));
    } catch {
      sendJson(res, 400, { error: "Nieprawidłowe JSON." });
      return;
    }

    if (req.url === "/api/extract") {
      try {
        const mode = body.mode === "standard" ? "standard" : "math";
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
          onProgress,
          { mode }
        );
        sendJson(res, 200, { text, chars: text.length, method });
      } catch (err) {
        sendJson(res, 500, { error: String(err.message || err) });
      }
      return;
    }

    if (req.url === "/api/clean") {
      try {
        const light = body.light === true || body.method === "pix2text";
        const text = cleanText(String(body.text || ""), { light });
        sendJson(res, 200, { text, chars: text.length });
      } catch (err) {
        sendJson(res, 500, { error: String(err.message || err) });
      }
      return;
    }
  }

  res.writeHead(404);
  res.end();
});

async function start() {
  console.log("=".repeat(54));
  console.log("  Document Parser — lokalny");
  console.log("=".repeat(54));

  const math = await checkMathAvailable();
  if (math) {
    console.log("  Pix2Text:  ✅ wzory + tekst");
    warmupMathModels();
  } else {
    console.log("  Pix2Text:  ⚠️  brak (npm run setup:python)");
  }
  console.log("  PDF/DOCX:  ✅");
  console.log("  Tesseract: ✅ PL+EN (tryb standardowy)");
  console.log(`\n  http://localhost:${PORT}\n`);

  server.listen(PORT, "localhost");
}

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`  Port ${PORT} zajęty — zamknij poprzedni serwer (Ctrl+C)`);
    process.exit(1);
  }
  throw err;
});

process.on("SIGINT", () => process.exit(0));

start();
