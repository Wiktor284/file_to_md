const { spawn } = require("child_process");
const path = require("path");

const PYTHON = process.env.PYTHON || "python";
const SCRIPT = path.join(__dirname, "math_ocr.py");

let mathAvailable = null;
let warmupStarted = false;
let pythonQueue = Promise.resolve();

function parseJsonOutput(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) throw new Error("Pusty wynik z Pythona.");

  try {
    return JSON.parse(trimmed);
  } catch {
    /* mixed output — szukaj JSON na końcu */
  }

  const lines = trimmed.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith("{")) continue;
    try {
      return JSON.parse(line);
    } catch {
      /* keep searching */
    }
  }

  const start = trimmed.lastIndexOf('{"');
  if (start >= 0) {
    try {
      return JSON.parse(trimmed.slice(start));
    } catch {
      /* fall through */
    }
  }

  throw new Error(
    `Nieprawidłowa odpowiedź Pythona: ${trimmed.slice(0, 160)}...`
  );
}

function runPython(args, stdin) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, [SCRIPT, ...args], {
      cwd: __dirname,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUNBUFFERED: "1",
        HF_HUB_DISABLE_PROGRESS_BARS: "1",
        TQDM_DISABLE: "1",
      },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    proc.stderr.on("data", (chunk) => {
      const line = chunk.toString("utf8");
      stderr += line;
      for (const part of line.split("\n")) {
        const t = part.trim();
        if (!t || t.startsWith("{")) continue;
        console.log(`  [Pix2Text] ${t}`);
      }
    });

    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code !== 0) {
        let msg = stderr.trim();
        try {
          const errJson = JSON.parse(stderr.trim().split("\n").pop());
          if (errJson.error) msg = errJson.error;
        } catch {
          /* use stderr as-is */
        }
        reject(new Error(msg || stdout.trim() || `Python exit ${code}`));
        return;
      }
      resolve(stdout);
    });

    if (stdin) proc.stdin.write(stdin);
    proc.stdin.end();
  });
}

function enqueuePython(fn) {
  const run = pythonQueue.then(fn, fn);
  pythonQueue = run.catch(() => {});
  return run;
}

async function checkMathAvailable() {
  if (mathAvailable !== null) return mathAvailable;
  try {
    await runPython(["--check"]);
    mathAvailable = true;
  } catch {
    mathAvailable = false;
  }
  return mathAvailable;
}

function warmupMathModels() {
  if (warmupStarted || !mathAvailable) return;
  warmupStarted = true;
  console.log("  Pix2Text — ładowanie modeli (pierwszy raz ~1–2 min)...");
  enqueuePython(() => runPython(["--warmup"])).catch((err) => {
    console.log(`  Pix2Text warmup: ${err.message}`);
  });
}

async function recognizeMath(filename, data) {
  const stdout = await enqueuePython(() =>
    runPython(
      [],
      JSON.stringify({
        filename,
        data: data.toString("base64"),
      })
    )
  );

  const parsed = parseJsonOutput(stdout);
  if (parsed.error) throw new Error(parsed.error);
  return parsed;
}

module.exports = {
  checkMathAvailable,
  warmupMathModels,
  recognizeMath,
};
