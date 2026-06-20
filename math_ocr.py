#!/usr/bin/env python3
"""Lokalne OCR przez Pix2Text — tekst + wzory → Markdown/LaTeX."""

import base64
import contextlib
import json
import os
import sys
import tempfile
from pathlib import Path

_P2T = None


@contextlib.contextmanager
def silence_stdout():
    old = sys.stdout
    sys.stdout = sys.stderr
    try:
        yield
    finally:
        sys.stdout = old


def get_p2t():
    global _P2T
    if _P2T is None:
        with silence_stdout():
            from pix2text import Pix2Text
            _P2T = Pix2Text(
                total_configs={"text_formula": {"languages": ("pl", "en")}}
            )
    return _P2T


def to_markdown(result) -> str:
    with tempfile.TemporaryDirectory() as tmp:
        if hasattr(result, "to_markdown"):
            return (result.to_markdown(tmp, markdown_fn=None) or "").strip()
        return str(result).strip()


def recognize_file(path: str) -> str:
    p2t = get_p2t()
    ext = Path(path).suffix.lower()

    with silence_stdout():
        result = p2t.recognize_pdf(path) if ext == ".pdf" else p2t.recognize_page(path)

    text = to_markdown(result)
    if not text or text.startswith(("Document(", "Page(")):
        raise RuntimeError("Pix2Text nie zwrócił tekstu.")
    return text


def main() -> None:
    if len(sys.argv) > 1:
        if sys.argv[1] == "--check":
            try:
                with silence_stdout():
                    from pix2text import Pix2Text  # noqa: F401
                sys.exit(0)
            except ImportError:
                sys.exit(1)
        if sys.argv[1] == "--warmup":
            try:
                get_p2t()
                sys.exit(0)
            except Exception as exc:
                print(str(exc), file=sys.stderr)
                sys.exit(1)

    req = json.loads(sys.stdin.read())
    filename = req.get("filename", "image.png")
    data = base64.b64decode(req.get("data", ""))
    ext = Path(filename).suffix or ".png"
    tmp_path = None

    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as handle:
            handle.write(data)
            tmp_path = handle.name

        text = recognize_file(tmp_path)
        sys.stdout.write(
            json.dumps({"text": text, "chars": len(text), "method": "pix2text"}, ensure_ascii=False)
        )
        sys.stdout.flush()
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == "__main__":
    main()
