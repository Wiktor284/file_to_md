# Document Parser

Aplikacja webowa do ekstrakcji tekstu z PDF, DOCX i obrazów (JPG/PNG) oraz czyszczenia go do czytelnego Markdown.

OCR: Tesseract (polski + angielski). Bez Pythona, bez kluczy API.

## Live demo / Działająca aplikacja

Otwórz link w przeglądarce — nie trzeba nic instalować ani uruchamiać lokalnie.

**https://document-parser-7ho7.onrender.com/**

Uwaga: na darmowym hostingu po ok. 15 minutach bez ruchu serwis zasypia. Pierwsze otwarcie może potrwać 30–60 sekund.

---

## Polish / Polski

### Co robi

1. Wgrywasz plik albo wklejasz tekst.
2. Aplikacja wyciąga treść (PDF tekstowy, skan z OCR, DOCX, obraz).
3. Czyści artefakty (numery stron, stopki, zbędne przerwy).
4. Dostajesz czysty Markdown do skopiowania.

### Jak korzystać

- **Przez internet:** otwórz [działającą aplikację](https://document-parser-7ho7.onrender.com/).
- **Lokalnie (dla deweloperów):** patrz sekcja poniżej.

### Wymagania (tylko lokalnie)

- [Node.js](https://nodejs.org/) w wersji 20 lub nowszej

### Uruchomienie lokalne

```bash
git clone https://github.com/Wiktor284/file_to_md
cd file_to_md
npm install
npm run dev
```

Otwórz w przeglądarce: [http://localhost:8765](http://localhost:8765)

Zatrzymanie: `Ctrl+C`

### Obsługiwane formaty

| Format | Jak działa |
|--------|------------|
| PDF (z tekstem) | bezpośrednia ekstrakcja |
| PDF (skan) | OCR |
| JPG, PNG, WEBP | OCR |
| DOCX | ekstrakcja tekstu |
| TXT, MD, RTF | odczyt pliku |

### Struktura projektu

```
server.js       serwer HTTP
public/         interfejs (UI)
lib/            ekstrakcja, OCR, czyszczenie tekstu
package.json    zależności Node.js
```

### Rozwiązywanie problemów

**Port 8765 zajęty**

```bash
netstat -ano | findstr :8765
taskkill /PID NUMER_PID /F
```

Potem ponownie: `npm run dev`

**Serwer nie startuje**

Sprawdź, czy masz Node.js 20+:

```bash
node -v
```

---

## English

### What it does

1. Upload a file or paste text.
2. The app extracts content (text PDF, scanned PDF via OCR, DOCX, images).
3. It cleans artifacts (page numbers, footers, extra blank lines).
4. You get clean Markdown ready to copy.

### How to use

- **Online:** open the [live app](https://document-parser-7ho7.onrender.com/).
- **Locally (for developers):** see the section below.

### Requirements (local only)

- [Node.js](https://nodejs.org/) 20 or newer

### Run locally

```bash
git clone https://github.com/Wiktor284/file_to_md
cd file_to_md
npm install
npm run dev
```

Open in your browser: [http://localhost:8765](http://localhost:8765)

Stop: `Ctrl+C`

### Supported formats

| Format | How it works |
|--------|--------------|
| PDF (text) | direct extraction |
| PDF (scan) | OCR |
| JPG, PNG, WEBP | OCR |
| DOCX | text extraction |
| TXT, MD, RTF | file read |

### Project structure

```
server.js       HTTP server
public/         user interface
lib/            extraction, OCR, text cleaning
package.json    Node.js dependencies
```

### Troubleshooting

**Port 8765 already in use**

```bash
netstat -ano | findstr :8765
taskkill /PID PID_NUMBER /F
```

Then run `npm run dev` again.

**Server will not start**

Check Node.js version (20+ required):

```bash
node -v
```
