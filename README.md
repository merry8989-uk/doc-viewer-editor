# DocForge — Offline Document Viewer & Editor

A single-page, **offline-first** web app that opens, views, edits, converts, compresses, merges, enhances and scans documents — entirely in the browser. No install, no server, no uploads: your files never leave your device.

**359 file formats** registered, spanning documents, spreadsheets, presentations, eBooks, web, data, code, images, design/RAW and archives. Audio/video are view-only.

> **Live:** open `index.html`, or serve the folder and install it as a PWA. Everything runs client-side.

---

## Why a browser app?

* **Truly offline** — plain HTML/CSS/JS with no build step. Works from `file://`, and installs as a PWA (service worker caches the app shell *and* the on-demand libraries).
* **Private** — files are read with the File API and processed on-device. Nothing is transmitted anywhere.
* **Portable** — any modern browser on Windows, macOS, Linux, Android, iOS.

---

## What it can do

### Documents
| Format | Behaviour |
|---|---|
| `.txt .text .md .markdown .rst .adoc .org .tex .latex .bib .rtf .srt .vtt` | Full text editor: line numbers, word/char/line counts, tab-to-spaces, save in any text format, **Save as DOCX** |
| `.docx .docm .dotx .dot .doc .odt .ott .sxw .wpd .wps .abw .pages .xps .djvu .chm` | Text/structure extracted into the editor (best-effort, no server); convert to `.docx .txt .html .pdf` |
| `.pdf` | pdf.js viewer + **PDF Studio** (below) |

### PDF Studio (real page editing)
Rotate pages · delete pages · reorder (move a page) · extract a range · split every N pages into a ZIP · add a text **watermark** · add **page numbers** · **insert pages from another PDF** · export pages as **PNG**. Built on pdf-lib.

### Spreadsheets
`.csv .tsv .tab` → editable **grid** with add row/column, export CSV / TSV / **XLSX** / JSON.
`.xlsx .xlsm .xlsb .xls .ods .numbers .et .gnumeric .123 .wks` → imported into the grid via SheetJS.

### Presentations
`.pptx .pptm .ppsx .pps .potx .ppt .odp .otp .sxi .key .dps` → **presentation editor**: edit slide title, bullets and speaker notes, add/duplicate/reorder/delete slides, live slide preview, and export a real **.pptx** (PptxGenJS) or **.pdf** (jsPDF). Start from a **blank deck** too.

### eBooks & comics
`.epub` (epub.js reader), plus `.mobi .azw .azw3 .fb2 .lit .cbz .cbr` and more → extract/convert.

### Web
`.html .htm .xhtml .shtml .mhtml` → split editor with **live rendered preview**, save HTML, **Save as DOCX**, print → PDF.
`.css .scss .less .js .ts .jsx .tsx .xml .xsl .php .jsp .rss .atom` … → code/text editor.

### Data & code
`.json .jsonl .yaml .toml .ini .sql .ipynb .parquet .arrow` … → text editor + convert.
All major programming languages → syntax-preserving text editor.

### Images & design
`.png .jpg .jpeg .webp .gif .bmp .tif .svg .avif .heic .ico` … → canvas editor: rotate, flip, crop, resize, **live filters** (brightness/contrast/saturation/grayscale/sepia/invert/blur + presets) and **annotation** (pen, highlight, box, arrow, text), export PNG/JPG/WebP/BMP/PDF.
`.psd .ai .eps .indd .xcf .sketch .fig .cdr .raw .cr2 .nef .arw .dng` → composite/preview + flatten & convert.

### Archives
`.zip` → browse, extract one file or extract-all (repacked). `.tar .gz .bz2 .xz .7z .rar .cab .iso` … → convert/best-effort.

### Tools
Convert / change file type · compress (quality + scale) · resize · DPI · quality · extract text + **OCR** · enhance (sharpen/contrast) · merge (images→PDF, PDFs→PDF, or bundle→ZIP) · create ZIP · **camera document scanner** with filters.

### Blank documents
`.txt .md .html .csv .json .svg` · blank **image canvas** · blank **PDF** · blank **presentation**.

---

## Run it

**Simplest:** open `index.html` in a browser.

**As an installable offline app (recommended):**

```bash
python3 -m http.server 8080
# open http://localhost:8080 and use "Install app"
```

A local server is required for the service worker (browsers block SWs on `file://`).

---

## Project layout

```
doc-viewer-editor/
├── index.html              app shell + UI
├── manifest.webmanifest    PWA manifest
├── sw.js                   offline service worker
├── css/styles.css          all styling
├── js/
│   ├── util.js             helpers, lazy CDN library loader
│   ├── registry.js         the format catalog (359 extensions)
│   ├── image.js            canvas image editor + annotation + camera + JPEG DPI
│   ├── docx.js             real .docx writer (text/HTML/markdown -> Word)
│   ├── pdfstudio.js        PDF page operations (pdf-lib)
│   ├── present.js          PPTX presentation editor (PptxGenJS)
│   ├── editors.js          text / markdown / HTML / sheet editors
│   ├── viewers.js          pdf, media, archive, ebook, hex viewers
│   ├── tools.js            convert, compress, resize, extract, enhance, merge
│   └── app.js              controller: open, route, blank docs, wiring
└── docs/FORMATS.md         full supported-format reference
```

### How routing works
`registry.js` maps every extension to a **kind** (`text`, `sheet`, `html`, `image`, `pdf`, `slides`, `audio`, `video`, `archive`, `ebook`, `binary`) plus an `editable` flag and `convert` targets. `app.js` reads the file, looks up its kind, and mounts the matching viewer/editor. Adding a format is usually a one-line registry entry.

---

## Libraries used (loaded on demand, cached offline)
pdf.js · pdf-lib · JSZip · SheetJS (xlsx) · jsPDF · PptxGenJS · Tesseract.js · epub.js

---

## Honest limits (see [`ROADMAP.md`](ROADMAP.md))
Still best-effort or stubbed: **full-fidelity PSD layer editing, in-place PDF content editing (text edits inside the page), RAW demosaicing, Apple Pages/Numbers round-trip, and proprietary archives (RAR/7z/SIT)**. Word/PowerPoint editing is at the text/paragraph/slide level, not a pixel-perfect round-trip of the original file. Audio/video remain view-only by design.

## License
MIT — see [`LICENSE`](LICENSE).
