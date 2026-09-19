const PAGE_MARKER = /^---\s*Strona\s+\d+\s*---\s*$/i;
const PAGE_NUM = /^\s*(?:Strona|Page)\s+\d+\s*(?:z|of|\/)\s*\d+\s*$/i;
const FOOTER = /^(?:©|Copyright|\u00a9).*(?:Strona|Page)\s+\d+/i;
const SEPARATOR = /^[━─═\-_*\s]{4,}$/;

function cleanText(raw) {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const kept = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      kept.push("");
      continue;
    }
    if (PAGE_MARKER.test(t) || PAGE_NUM.test(t) || FOOTER.test(t) || SEPARATOR.test(t)) {
      continue;
    }
    if (/^CONFIDENTIAL$/i.test(t)) continue;
    kept.push(line.replace(/[ \t]+$/g, ""));
  }

  let text = kept.join("\n");
  text = text.replace(/([\p{L}])-\n([\p{Ll}])/gu, "$1$2");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (
        t.length >= 4 &&
        t.length <= 80 &&
        t === t.toUpperCase() &&
        /[A-ZĄĆĘŁŃÓŚŹŻ]/.test(t) &&
        !/^\d/.test(t) &&
        !t.includes("|") &&
        !/[=^$\\]/.test(t)
      ) {
        return "## " + t;
      }
      return line;
    })
    .join("\n");
  text = text.replace(/^[\t ]*[•·]\s+/gm, "- ");

  return text.trim();
}

module.exports = { cleanText };
