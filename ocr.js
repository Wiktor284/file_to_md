const { createWorker } = require("tesseract.js");

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "bmp", "tif", "tiff"]);

function isImageExt(ext) {
  return IMAGE_EXT.has(ext);
}

async function createOcrWorker(onProgress) {
  const worker = await createWorker("pol+eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress({ phase: "ocr", page: m.page || 0, progress: m.progress });
      }
    },
  });
  await worker.setParameters({
    tessedit_pageseg_mode: "6",
    preserve_interword_spaces: "1",
  }).catch(() => {});
  return worker;
}

async function recognizeBuffer(worker, image, onProgress, page, total) {
  if (onProgress) onProgress({ phase: "ocr", page, total });
  const { data } = await worker.recognize(image);
  return data.text.trim();
}

async function ocrImage(data, onProgress) {
  const worker = await createOcrWorker(onProgress);
  try {
    const text = await recognizeBuffer(worker, data, onProgress, 1, 1);
    if (!text) throw new Error("OCR nie rozpoznał tekstu na obrazie.");
    return text;
  } finally {
    await worker.terminate();
  }
}

async function ocrPdf(data, onProgress) {
  const { pdf } = await import("pdf-to-img");
  const document = await pdf(data, { scale: 3 });
  const worker = await createOcrWorker(onProgress);
  const pages = [];
  let pageNum = 0;

  try {
    for await (const image of document) {
      pageNum += 1;
      const text = await recognizeBuffer(worker, image, onProgress, pageNum, document.length);
      if (text) pages.push(`--- Strona ${pageNum} ---\n${text}`);
    }
  } finally {
    await worker.terminate();
    await document.destroy();
  }

  if (!pages.length) throw new Error("OCR nie rozpoznał tekstu w PDF.");
  return pages.join("\n\n");
}

module.exports = { ocrPdf, ocrImage, isImageExt };
