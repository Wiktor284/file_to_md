const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const iconv = require("iconv-lite");
const { ocrPdf, ocrImage, isImageExt } = require("./ocr");

const MIN_CHARS_PER_PAGE = 40;

function looksLikeScan(result) {
  const text = (result.text || "").trim();
  if (!text) return true;
  return text.length / Math.max(result.numpages || 1, 1) < MIN_CHARS_PER_PAGE;
}

function formatPdfPages(text) {
  const pages = [];
  for (const [i, chunk] of text.split("\f").entries()) {
    const pageText = chunk.trim();
    if (pageText) pages.push(`--- Strona ${i + 1} ---\n${pageText}`);
  }
  return pages.length ? pages.join("\n\n") : text.trim();
}

async function extractPdf(data, onProgress) {
  const result = await pdfParse(data);
  if (!looksLikeScan(result)) {
    return { text: formatPdfPages(result.text), method: "pdf-text" };
  }
  if (onProgress) onProgress({ message: "Skan PDF — OCR..." });
  return { text: await ocrPdf(data, onProgress), method: "pdf-ocr" };
}

async function extractDocx(data) {
  const result = await mammoth.extractRawText({ buffer: data });
  return { text: result.value || "", method: "docx" };
}

function extractPlain(data) {
  if (data[0] === 0xff && data[1] === 0xfe) {
    return { text: data.slice(2).toString("utf16le"), method: "plain" };
  }
  if (data[0] === 0xfe && data[1] === 0xff) {
    return { text: iconv.decode(data.slice(2), "utf16be"), method: "plain" };
  }
  for (const enc of ["utf8", "cp1250", "iso-8859-2", "latin1"]) {
    try {
      const text = iconv.decode(data, enc);
      if (!text.includes("\ufffd") || enc === "latin1") {
        return { text, method: "plain" };
      }
    } catch {
      /* next */
    }
  }
  return { text: data.toString("utf8"), method: "plain" };
}

async function extractImage(data, onProgress) {
  if (onProgress) onProgress({ message: "OCR obrazu..." });
  return { text: await ocrImage(data, onProgress), method: "image-ocr" };
}

async function extractText(filename, data, onProgress) {
  const ext = filename.includes(".") ? filename.split(".").pop().toLowerCase() : "";

  if (ext === "pdf") return extractPdf(data, onProgress);
  if (isImageExt(ext)) return extractImage(data, onProgress);
  if (ext === "docx" || ext === "doc") return extractDocx(data);
  return extractPlain(data);
}

module.exports = { extractText };
