# Document Parser — LLM Prep Engine

Lokalna aplikacja do ekstrakcji i czyszczenia dokumentów PDF/DOCX/JPG.
**100% offline** — pliki nie wychodzą z komputera, bez klucza API.

---

## Szybki start

### 1. Wymagania
- **Node.js** 20+ — https://nodejs.org/
- **Python** 3.10+ — https://www.python.org/ (zaznacz „Add to PATH”)

### 2. Instalacja (tylko raz)

```powershell
cd c:\Users\Asus\Desktop\wikiwikxon\odczyt_plik_md
npm install
npm run setup:python
```

`setup:python` instaluje **Pix2Text** (~2 GB modeli przy pierwszym uruchomieniu).

### 3. Uruchomienie

```powershell
npm run dev
```

### 4. Otwórz aplikację

**http://localhost:8765**

---

## Tryby OCR

| Tryb | Kiedy używać | Silnik |
|------|--------------|--------|
| **Matematyka (Pix2Text)** ✅ domyślny dla JPG/PDF | Egzaminy, wzory, skany | Python + Pix2Text |
| **Standardowy** | Zwykły tekst, szybciej | Tesseract |

Zaznacz/odznacz **„Tryb matematyka (Pix2Text)”** nad formularzem.

---

## Jak to działa

```
Twój plik (JPG / PDF / DOCX)
       ↓
  [Node.js serwer]
       ↓
  JPG/PDF + tryb math → [Python Pix2Text] → Markdown + LaTeX
  JPG/PDF + tryb standard → [Tesseract OCR]
  DOCX → [mammoth]
       ↓
  Czysty Markdown
```

---

## Obsługiwane formaty

| Format | Standard | Matematyka (Pix2Text) |
|--------|----------|------------------------|
| JPG, PNG | OCR Tesseract | ✅ **Zalecane** |
| PDF (skan) | OCR Tesseract | ✅ **Zalecane** |
| PDF (tekst) | pdf-parse | Pix2Text |
| DOCX | mammoth | — |
| TXT, MD, RTF | wbudowane | — |

---

## Ważne

- **Pierwsze uruchomienie Pix2Text** — pobiera modele (~1–2 GB), potrzebny internet **tylko raz**
- **Czas** — Pix2Text: 1–3 min na stronę; Tesseract: ~30–90 s
- **RAM** — Pix2Text potrzebuje ok. 2–4 GB

---

## Rozwiązywanie problemów

**Pix2Text — brak / czerwony chip**
```powershell
npm run setup:python
```

**Port zajęty**
```powershell
netstat -ano | findstr :8765
taskkill /PID <numer> /F
```

**Zrestartuj serwer** po instalacji Pythona: `Ctrl+C`, potem `npm run dev`
