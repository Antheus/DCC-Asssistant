# Environment Setup for convert-pdf-to-md

Follow these steps exactly, in order, before running `scripts/convert_pdf_to_md.py`
for the first time in a given environment. Don't skip steps or improvise
alternatives — they're written to be deterministic and safe to re-run.

## 1. Check Python is available (3.10+)

```powershell
python --version
```

- If this fails (command not found), install Python 3.10 or newer:
  - Windows: `winget install --id Python.Python.3.12 -e`
  - macOS: `brew install python@3.12`
  - Linux (Debian/Ubuntu): `sudo apt-get update && sudo apt-get install -y python3 python3-pip python-is-python3`
- If the reported version is older than 3.10, install a newer Python using
  the same command above (PyMuPDF4LLM requires 3.10+).

## 2. Check pip is available

```powershell
python -m pip --version
```

- If this fails, bootstrap pip:

```powershell
python -m ensurepip --upgrade
```

## 3. Install PyMuPDF4LLM and PyMuPDF

Use the `scripts/requirements.txt` file bundled with this skill to install
compatible versions of the dependencies:

```powershell
python -m pip install -r scripts/requirements.txt
```

PyMuPDF4LLM provides layout-aware reading order for multi-column documents.
It installs its matching PyMuPDF version, which the script also uses to extract
embedded images.

## 4. Verify the install

```powershell
python -c "import pymupdf4llm, fitz; print('pymupdf4llm + pymupdf OK')"
```

Expect to see `pymupdf4llm + pymupdf OK` printed with no errors. If you see a
`ModuleNotFoundError`, repeat step 3 — pip may be installing into a
different Python environment than the one being invoked (check
`python -m pip --version` shows the same path as `python --version`'s
interpreter).

## Notes

- This setup only needs to be done once per environment/virtual environment,
  not once per conversion.
- `convert_pdf_to_md.py` itself also checks for `pymupdf4llm` and `fitz` at
  startup and prints a pointer back to this file if either is missing, so
  re-running setup is safe and idempotent.
- Only `.pdf` is supported by this skill; use the sibling skills for Word or
  Excel documents.
- Scanned/image-only PDFs (no embedded text layer) will produce little or
  no text unless OCR is available. The images themselves will still be
  extracted and appended, but the text body may be empty or near-empty in
  that case — mention this to the user if it happens.
