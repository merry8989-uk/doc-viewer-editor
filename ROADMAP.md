# Roadmap

DocForge aims to be a genuine "open and edit almost anything, offline" tool. Here's what's done, what's partial, and what's next.

## ✅ Working now
- Text / code / script editing (line numbers, stats, tab handling)
- Markdown editor with live preview
- HTML editor with live rendered preview
- CSV / TSV spreadsheet grid editor with XLSX export
- XLSX / XLS / ODS import into the grid
- DOCX / ODT / WPS text extraction into the text editor
- PPTX / PPT / ODP slide-text extraction
- Image viewer/editor: rotate, flip, crop, resize, live filters + presets, multi-format export
- JPEG DPI metadata writing
- PDF viewing (pdf.js), text extraction, page→PNG
- Audio & video playback
- ZIP browsing, single-file extract, extract-all repack
- EPUB reading (epub.js)
- Hex preview fallback for any binary
- Tools: convert, compress, resize/DPI/quality, extract text, OCR, enhance, merge, create-ZIP
- Camera document scanner with filters
- Blank document creation (txt/md/html/csv/json/svg/image/pdf)
- PWA offline support

## 🟡 Partial / best-effort
- **PSD** — composite preview + flatten/export. No layer tree, no layer-level editing.
- **RAW** (`cr2/nef/arw/dng`) — relies on the browser's decoder or an embedded preview JPEG; no true demosaicing.
- **PDF editing** — viewing, extracting and merging are solid; per-page content editing is not yet possible.
- **Office formats** — text/structure extraction works; round-trip fidelity editing does not.
- **Non-ZIP archives** (`.rar .7z .arj .arc .sit .hqx .z`) — proprietary/legacy; browse support is limited, convert only.
- **Audio/video** — playback works; format conversion/trimming is not yet implemented.

## 🔜 Next
1. **ffmpeg.wasm** → real audio/video transcoding, trimming, and GIF/video→frame extraction.
2. **PDF page editing** — reorder/delete/rotate pages, add text/annotations, redact (pdf-lib).
3. **Image codecs in WASM** — true TIFF, HEIC and RAW decode; PSD layer parsing (via `psd.js`/ag-psd).
4. **PPTX authoring** — render slides and allow text/image editing with a PPTX writer (PptxGenJS).
5. **Docx round-trip** — proper Word editing via a docx parser/writer (docx.js / mammoth + a writer).
6. **Batch operations** — apply a tool across many files at once.
7. **Vector editing** — SVG path editing UI.
8. **Undo/redo** across all editors, and a project/session store (IndexedDB).
9. **Signatures & stamps** — draw/type a signature, place it on PDFs and images.
10. **Deskew & auto-crop** for the camera scanner (edge detection).

## Ideas / wishlist
- Annotations & highlights layer
- Form filling for PDFs
- Side-by-side document diff
- Convert to Markdown from HTML/PDF
- Print layouts and page imposition
- Full keyboard shortcut set

Contributions and issue reports welcome.
