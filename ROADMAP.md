# Roadmap

DocForge aims to be a genuine "open and edit almost any document, offline" tool. Audio and video are intentionally **view-only**. Here's what's done, what's partial, and what's next.

## ✅ Working now
- **359 formats registered** across documents, spreadsheets, presentations, eBooks, web, data, code, images, design/RAW and archives
- Text / code / script editing (line numbers, stats, tab handling)
- Markdown editor with live preview
- HTML editor with live rendered preview
- **DOCX writer** — real `.docx` export from text, markdown or HTML (Office Open XML, via JSZip)
- **PDF Studio** — rotate, delete, reorder, extract range, split every N, watermark, page numbers, insert pages from another PDF, pages → PNG (pdf-lib + pdf.js)
- **Presentation editor** — edit slides (title/bullets/notes), add/duplicate/reorder/delete slides, export real `.pptx` (PptxGenJS) or `.pdf` (jsPDF); blank deck
- CSV / TSV grid editor with XLSX / JSON export; XLSX/XLS/ODS import
- Word/OOXML text extraction (docx/odt/wps/wpd) and PPTX/PPT/ODP slide-text import
- Image viewer/editor: rotate, flip, crop, resize, live filters + presets
- **Image annotation**: pen, highlight, box, arrow, text
- JPEG DPI metadata writing
- PDF viewing (pdf.js), text extraction, page→PNG
- EPUB reading (epub.js)
- ZIP browsing, single-file extract, extract-all repack; hex preview fallback for any binary
- Tools: convert, compress, resize/DPI/quality, extract text, OCR, enhance, merge, create-ZIP
- Camera document scanner with filters
- Blank documents: txt, md, html, csv, json, svg, image canvas, PDF, presentation
- PWA offline support

## 🟡 Partial / best-effort
- **PSD** — composite preview + flatten/export. No layer tree, no layer-level editing.
- **RAW** (`cr2/nef/arw/dng`) — embedded-preview decode; no true demosaicing.
- **In-place PDF content editing** — page operations are full; editing the *text inside* a page is not yet possible.
- **Office round-trip** — Word/PowerPoint editing is at the text/paragraph/slide level, not a pixel-perfect round-trip.
- **Apple Pages/Numbers**, **DjVu**, **CHM** — package/binary formats; extraction is best-effort.
- **Proprietary archives** (`.rar .7z .arj .sit .sitx .cab .iso`) — limited in-browser support.
- **Audio/video** — playback only (by design).

## 🔜 Next
1. **PDF in-place editing** — edit existing text, add text boxes/images, redact, fill forms.
2. **PSD/RAW via WASM** — real layer parsing (ag-psd) and RAW demosaicing.
3. **PPTX fidelity** — images, layouts, themes, and reading back an edited deck with formatting.
4. **DOCX fidelity** — tables, images and styles in the writer; better import.
5. **Batch operations** — apply a tool across many files at once.
6. **Vector editing** — SVG path editing UI.
7. **Undo/redo** across all editors, and a session store (IndexedDB).
8. **Signatures & stamps** — draw/type a signature, place it on PDFs and images.
9. **Deskew & auto-crop** for the camera scanner (edge detection).
10. **Convert to Markdown** from HTML/PDF; document diff.

## Ideas / wishlist
- Annotations & highlights layer on PDFs
- Side-by-side document diff
- Print layouts and page imposition
- Full keyboard shortcut set

Contributions and issue reports welcome.
