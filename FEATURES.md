# BlankNotes

> A desktop study workspace where every PDF or slide page has a permanent companion notes panel beside it. Open a document, annotate the page on the left, take notes on the right — your notes never get disconnected from the source material.

## What we're trying to build

Students study from PDFs and lecture slides, but their notes end up scattered across notebooks, Word docs, and apps that lose context. **BlankNotes binds each page to its own notes workspace**, so revisiting page 14 of last week's lecture always brings back the exact annotations, highlights, and notes you took on that page.

The experience is a single side-by-side workspace:

```
┌──────────────────────────┬──────────────────────────┐
│                          │                          │
│      PDF / Slide page    │   Notes + images +       │
│      (with highlights    │   highlights + bullet    │
│       & sticky notes)    │   lists, rich text       │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
       LEFT pane                    RIGHT pane
```

PPTX files get converted internally to PDF (via LibreOffice) so there's one unified rendering and annotation pipeline regardless of the original format.

**Offline-first, local-first.** Everything lives in `userData/`: the SQLite database, the imported PDFs, and your image attachments. No cloud, no account, no telemetry.

---

## Phase 1 — what's working today

### Documents

- **Import PDF** — open any PDF; it's copied into the app's storage so the original file can move or be deleted without breaking the workspace.
- **Import PPTX** — converted to PDF via LibreOffice, then handled identically to a PDF. If LibreOffice isn't installed, a setup dialog appears with a link to download it. PDFs work with no extra software.
- **Recent files** — every imported document appears on the welcome screen. Click to reopen, or × to remove from the list.
- **Missing-file detection** — if a document's underlying PDF file is gone (manually deleted, moved, etc.), the recent list shows it with a ⚠ marker and "File missing — remove and re-import"; the app won't try to open a broken document.
- **Auto-restore** — the last opened document reopens on next launch.

### PDF viewing

- **Page-by-page navigation** — toolbar arrows, page-number input, sidebar thumbnail strip.
- **Zoom** — 50%–300% with toolbar buttons.
- **Sidebar thumbnails** — collapsible left rail; click any thumbnail to jump to that page.
- **Resizable split** — drag the divider between the PDF pane and the notes pane to set your preferred ratio (persisted to settings).

### Annotations *on the PDF*

A canvas overlay sits on top of the rendered PDF. Three tools, with visually distinct toolbar icons:

- **↖ Pointer** — select / move / resize / delete existing annotations.
- **▬ Highlight** — click-and-drag on the page to sweep out a highlight of any size, in either yellow or pink. The color swatch in the toolbar shows the current highlight color.
- **T Sticky note** — click anywhere on the page to drop an inline editable note that starts in edit mode.

All annotations:
- Persist immediately to SQLite, keyed by document + page.
- Can be moved, resized, and recolored after creation.
- Delete with the `Delete` / `Backspace` key while selected.
- Are stored as normalized 0–1 coordinates, so they reposition correctly at any zoom level and travel through to PDF export.

### Notes editor (per page)

Each page has its own dedicated rich-text editor (TipTap). Notes auto-save with a 1-second debounce.

**Formatting (deliberately constrained — not Microsoft Word):**

- **Bold**
- **Text color** — black, blue, green
- **Highlight** — yellow or pink (or none)
- **Font size** — Small / Medium / Large (13 / 16 / 20 px)
- **Font family** — Inter, IBM Plex Sans, Source Sans 3
- **Bullet list**

**Editor behavior:**

- **Click anywhere in the editor area** — even empty space below the last line — to put the cursor there and start typing.
- **Inline images** that you can resize and reposition:
  - **Toolbar Image button** opens a native file picker; chosen images are inserted at the current cursor position.
  - **Paste (Ctrl+V)** — any image in the clipboard is intercepted and inserted at the cursor (instead of base64-embedded). Plain-text paste still falls through to the editor normally.
  - **Drag-drop a file** onto the editor — image is inserted at the drop point.
  - **Click an image** to select it; drag the blue handle in the bottom-right corner to resize. Width persists across save/reload.
  - **Drag a selected image** to a different position in the document (ProseMirror native).

### Export

Export the document and its notes as a **single interleaved PDF**:

```
Output page 1   ← original PDF page 1, with all annotations baked in
Output page 2   ← formatted notes for page 1
Output page 3   ← original PDF page 2, with annotations
Output page 4   ← formatted notes for page 2
...
```

- Annotations are drawn directly onto the original page using pdf-lib (the normalized coordinates make this exact).
- Notes pages render the TipTap content (paragraphs, bold, color, highlights, bullet lists, images) using embedded fonts.
- A progress modal shows phase + page count + percentage during export.

### App-level

- **Keyboard shortcuts:** `←/→` page nav, `H` highlight, `T` sticky note, `Esc` pointer, `Ctrl+O` open document (works from any screen), `Ctrl+E` export, `Delete` removes selected annotation.
- **Menu:** File → Open / Export / Quit, plus standard Edit and View menus.
- **Toast notifications** for export success / errors.
- **Error boundary** wraps the app to catch and display unexpected React errors instead of crashing to white screen.

---

## Architecture

### Tech stack

| Concern             | Choice                          | Why                                                                  |
|---------------------|---------------------------------|----------------------------------------------------------------------|
| Desktop framework   | **Electron 36**                 | Mature, full Node access, PDF.js works natively in the renderer       |
| Frontend            | **React 19 + TypeScript**       | Type safety, component model, large ecosystem                         |
| Build               | **electron-vite**               | Fast HMR, separate pipelines for main / preload / renderer            |
| Database            | **sql.js** (WASM SQLite)        | No native compilation step — works on Windows without VS build tools  |
| State               | **Zustand**                     | Lightweight, no boilerplate                                           |
| PDF rendering       | **react-pdf** (pdfjs-dist 4.8.69) | Native PDF.js in React; version pinned to match react-pdf internally |
| Annotation canvas   | **Fabric.js v6**                | Object model + serialization. Pinned to v6 — v7 breaks the storage format |
| Notes editor        | **TipTap**                      | Headless rich text; extensions exactly match the formatting set      |
| Export              | **pdf-lib**                     | Programmatic PDF creation, font embedding                            |
| PPTX → PDF          | **libreoffice-convert**         | Highest conversion quality, free, offline                            |
| Packaging           | **electron-builder**            | NSIS for Windows, DMG for macOS                                       |

### Data model (SQLite)

- `documents` — id, title, original path, stored PDF path, page count, timestamps
- `page_notes` — id, document_id, page_number, content_json (TipTap JSON), timestamps (unique on document_id + page_number)
- `annotations` — id, document_id, page_number, type, fabric_json, normalized bounding box (norm_x/y/width/height), color, optional text
- `image_attachments` — id, note_id, document_id, page_number, file_name, stored_path, mime, size
- `app_settings` — singleton row with theme, default font, split ratio, last opened document id, LibreOffice path override
- `notes_fts` — FTS5 virtual table (Phase 2 search; schema exists, queries deferred)

### File layout under `userData/`

```
{userData}/blanknotes/
├── blanknotes.db          ← sql.js exports here after every write
├── documents/             ← imported PDFs (and PPTX → PDF outputs), one per UUID
│   └── <uuid>.pdf
└── attachments/           ← inline note images, one per UUID
    └── <uuid>.<ext>
```

### IPC + security

- `contextIsolation: true`, `nodeIntegration: false`
- All renderer ↔ main communication goes through a single typed `window.api` exposed via `contextBridge`
- IPC channel names: `blanknotes:<domain>:<action>` (`document:`, `note:`, `annotation:`, `attachment:`, `export:`, `settings:`, `system:`)
- Custom **`bn-file://`** protocol serves local files (PDFs, attachments) to the renderer. This bypasses the default file:// origin restrictions that block pdfjs/`<img>` from loading local files in dev mode, while still being scoped to `userData/`.

---

## What's deferred — the roadmap

### Phase 2 — power-user features
- Full-text search across all notes (FTS5 table is already created — just needs UI + query layer)
- Bookmarks per page
- Document outline from `PDFDocument.getOutline()`
- Multi-document tabs
- Improved navigation (go-to-page history, recently-viewed pages)

### Phase 3 — AI assistance
- Voice-to-notes via Web Audio API + Whisper (local, via Ollama)
- AI note cleanup / summarization
- Concept detection across notes
- *(Only after Phase 1 is fully stable and battle-tested.)*

### Phase 4 — study workflow
- Flashcards from notes (SM-2 spaced repetition)
- Revision mode (hide notes, quiz yourself on each page)
- Focus mode (minimize UI chrome)
- Math rendering (KaTeX as a TipTap extension)
- Advanced export options (notes-only PDF, side-by-side layout, etc.)

---

## Running locally

```bash
npm install
npm run dev          # launches electron-vite dev server + Electron
npm run build        # builds main + preload + renderer to out/
npm run package:win  # produces an NSIS installer in dist/
```

Requires Node.js 20+ and (for PPTX import) LibreOffice installed somewhere on PATH.

---

## Design principles

1. **Local-first.** No account, no cloud, no telemetry. Everything's a file on your disk.
2. **One unified pipeline.** PDF and PPTX flow through the same rendering, annotation, and export code.
3. **Calm, academic UI.** No heavy shadows, no glowing CTAs. Reading is the activity; the app gets out of the way.
4. **Intentionally limited formatting.** The notes editor isn't trying to be Word. The small, opinionated set of formatting options keeps notes consistent and readable across hundreds of pages.
5. **Notes are bound to pages, forever.** The page number is the index — pages don't get renamed or reordered, so notes stay where they were taken.
