# DocForge — Offline Document Viewer & Editor

A single-page, **offline-first** web app that opens, views, edits, converts, compresses, merges, enhances and scans a very wide range of file types — entirely in the browser. No install, no server, no uploads: your files never leave your device.

> **Live concept:** open `index.html` directly, or serve the folder and install it as a PWA. Everything runs client-side.

---

## Why a browser app?

* **Truly offline** — plain HTML/CSS/JS with no build step. Works from `file://`, and installs as a PWA (service worker caches the app shell *and* the on-demand libraries).
* **Private** — files are read with the File API and processed on-device. Nothing is transmitted anywhere.
* **Portable** — runs on any modern browser on Windows, macOS, Linux, Android, iOS.

---

## What it can do

### View & edit
| Category | Behaviour |
|---|---|
| Text, code, scripts (`.txt .md .json .py .js .ts .c .cpp .java .sh .bat .sql` …) | Full text editor with line numbers, word/char counts, tab-to-spaces, save in any text format |
| Markdown (`.md`) | Split editor with **live HTML preview**, export `.md` or `.html` |
| Web (`.html .htm .xhtml`) | Split editor with **live rendered preview**, save HTML, print → PDF |
| Sheets (`.csv .tsv`) | Editable spreadsheet **grid**, add rows/columns, export CSV / TSV / **XLSX** / JSON |
| Office (`.xlsx .xls .ods`) | Read into the grid editor via SheetJS |
| Word / OOXML (`.docx .odt .wps .wpd`) | Package text extracted and opened in the text editor (best-effort, no server) |
| Slides (`.pptx .ppt .odp`) | Slide text extracted and opened in the text editor |
| Images (`.png .jpg .jpeg .webp .gif .bmp .tif .svg .avif` …) | Canvas editor: rotate, flip, crop, resize, **live filters** (brightness/contrast/saturation/grayscale/sepia/invert/blur + presets), export PNG/JPG/WebP/BMP |
| Design (`.psd .ai .eps .raw .cr2 .nef .arw .dng`) | Composite/preview + flatten & convert (best-effort) |
| PDF | pdf.js viewer: multi-page render, zoom, **extract text**, save a page as PNG |
| Audio / Video (`.mp3 .wav .ogg .aac .mp4 .webm .mov` …) | Native player |
| Archives (`.zip`) | Browse contents, extract one file or **extract-all** (repacked as ZIP) |
| eBooks (`.epub`) | epub.js reader with page navigation |
| Anything else | Hex preview (always works) + convert tools |

### Tools
* **Convert / change file type** — image→image, image→PDF, text/HTML→PDF, sheet→XLSX, anything→TXT or ZIP
* **Compress / reduce size** — quality + scale sliders with before/after size report
* **Resize · DPI · quality** — exact pixel size, print DPI (writes real JPEG DPI metadata), output format & quality
* **Extract text** — PDF text layer, or **OCR on images** (Tesseract.js, in-browser)
* **Enhance document** — brightness/contrast + convolution **sharpen** for clean scans
* **Merge / combine** — many images→one PDF, many PDFs→one PDF, or bundle anything→ZIP
* **Create ZIP** from the open file
* **Scan with camera** — live camera capture with document filters (B&W high-contrast, brighten, sepia…) → PNG

### Blank documents
Start from scratch: `.txt`, `.md`, `.html`, `.csv`, `.json`, `.svg`, a blank **image canvas**, or a blank **PDF** — then build it up manually.

---

## Run it

**Simplest:** open `index.html` in a browser.

**As an installable offline app (recommended):**

```bash
# any static server works
python3 -m http.server 8080
# then open http://localhost:8080 and use "Install app"
```

A local server is required for the service worker (browsers block SWs on `file://`). Once loaded, DocForge keeps working with no network — the shell and libraries are cached.

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
│   ├── registry.js         the format catalog (viewer/editor/convert map)
│   ├── image.js            canvas image editor + camera scanner + JPEG DPI
│   ├── editors.js          text / markdown / HTML / sheet editors
│   ├── viewers.js          pdf, media, archive, ebook, hex viewers
│   ├── tools.js            convert, compress, resize, extract, enhance, merge
│   └── app.js              controller: open, route, blank docs, wiring
└── docs/FORMATS.md         full supported-format reference
```

### How routing works
`registry.js` maps every extension to a **kind** (`text`, `sheet`, `html`, `image`, `pdf`, `audio`, `video`, `archive`, `ebook`, `binary`) plus an `editable` flag and a list of `convert` targets. `app.js` reads the file, looks up its kind, and mounts the matching viewer/editor. Adding a format is usually a one-line entry in the registry.

---

## Libraries used (loaded on demand, cached offline)
pdf.js · pdf-lib · JSZip · SheetJS (xlsx) · jsPDF · Tesseract.js · epub.js

They load lazily the first time a tool needs them and are then cached by the service worker, so subsequent use is offline.

---

## Honest limits (and what's on the roadmap)
This is a strong, working foundation, but a few "edit any format" goals need more than a browser currently gives — see [`ROADMAP.md`](ROADMAP.md). In short: **full-fidelity PSD layer editing, PPT authoring, in-place PDF page editing, RAW demosaicing, and audio/video transcoding** are stubbed or best-effort today. The architecture is built so those can be added (e.g. ffmpeg.wasm, WASM image codecs, a slide renderer).

## License
MIT — see [`LICENSE`](LICENSE).
