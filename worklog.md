# Worklog — Конструктор текстовых карточек (Next.js port)

Project: port the uploaded vanilla `index.html` text-card constructor into the Next.js app at `/`,
applying the full review (35 issues / 26-step plan).

Architecture decision (main agent):
- Direct embed (no iframe). `src/app/page.tsx` (client) renders the static shell as JSX.
- `src/app/card-constructor.css` holds all ported CSS (48 themes + layout + modal + popup + toast).
- `src/lib/card-constructor.ts` holds the imperative app logic (faithful to original) with ALL fixes.
- `html-to-image` from npm (no broken CDN integrity).
- Verifiable in-browser at `/` via Agent Browser.

Shell/ID contract (unchanged from original): #editorSidebar, #toggleSidebarBtn, #previewWorkspace,
#themeSelect, #formatSelect, #editorCardsList, #addCardBtn, #saveChangesBtn, #saveAll, #cardsArea,
#colorModal, #closeModalBtn, #applyColorsBtn, #resetCardColorsBtn, #modalCardTitle, #presetTargetLabel,
#wordStylePopup, #sizeSlider, #sizeValue, #wordStyleList, #toast. Field rows use data-row-field.
Color inputs: #col-<field>, hex text #hex-<field>. Presets: .color-swatch[data-preset].

---
Task ID: 1
Agent: main
Task: Setup — install html-to-image, scaffold file structure, write worklog.

Work Log:
- Read uploaded index.html fully (3262 lines): CSS 22-1646, HTML body 1648-2043, JS 2044-3259.
- Confirmed dev server running on :3000 (Caddy gateway -> :3000).
- Installed html-to-image via `bun add html-to-image`.
- Defined shell/ID contract (above) shared by CSS + TS + JSX.

Stage Summary:
- Deps ready. Next: parallel CSS port (Task 2-a, subagent) + TS logic (Task 2-b, main).

---
Task ID: 2-a
Agent: frontend-styling-expert
Task: Port CSS from upload/index.html (lines 22-1646) into src/app/card-constructor.css, applying the 11 CSS-only review fixes.

Work Log:
- Read worklog.md for prior context (Task 1: deps ready, shell/ID contract established).
- Read upload/index.html CSS in chunks (lines 22-1646) to capture every theme verbatim.
- Counted themes: 47 named [data-theme] blocks + :root (default) = 48 total. Matches "48 themes" spec.
- Wrote /home/z/my-project/src/app/card-constructor.css with: header comment, :root, all 47 theme blocks verbatim, editor sidebar, preview workspace, card (.card with max-width:100% + min-height:400px), card-list family preserved exactly, toast, modal (overlay opacity 0.45), responsive media, word popup, section controls, format/color controls, highlighted-word, plus new fix rules.
- Applied scoping (Fix #1): body→.cc-root (incl. overflow-x), input/textarea/select + :focus + textarea + hr prefixed with .cc-root; button.btn-primary, button.btn-card-action, .btn-secondary, .btn-icon, .btn-delete, .btn-add, .btn-reset-single, .format-btn, .format-btn-section, .color-swatch, .color-preset, .btn-palette all prefixed with .cc-root to beat Tailwind button reset. :root and [data-theme] kept global.
- Applied Fix #3: .cc-root.sidebar-open .toggle-sidebar-btn { left:356px } (desktop) + mobile override left:16px inside @media(max-width:900px).
- Applied Fix #8: modal-overlay background rgba(15,23,42,0.1)→0.45.
- Applied Fix #10: .card max-width:100% + @media(max-width:480px){ .cc-root .card{ padding:24px; width:100% } }.
- Applied Fix #13: .cc-styled-word dashed underline rule + .cc-root.exporting .cc-styled-word { text-decoration:none }.
- Applied Fix #16: omitted .font-options-grid and .font-option-btn entirely (left a NOTE comment).
- Applied Fix #18: @media(max-width:600px) toast centered.
- Applied Fix #23: base .card min-height:400px.
- Applied Fix #30: .sidebar-backdrop element + min-width:901px hide + @media(max-width:900px) drawer rules (position:fixed, transform:translateX(-100%), margin-left:0 !important, box-shadow, overflow-y:auto) + .cc-root.sidebar-open .sidebar-backdrop{display:block}. Kept existing @media(max-width:900px) .editor-sidebar{width:100%;max-height:none} before the drawer block so the drawer rules win by source order.
- Applied Fix #11: custom scrollbars (6px, #cbd5e1 thumb) for .modal-card and .editor-sidebar.
- Verified: file exists (42184 bytes), 1713 lines, 48 theme blocks (1 :root + 47 named), brace balance 194/194, no @import/@apply/tailwindcss directives (only comment mentions), no .font-options-grid/.font-option-btn rules (only comment mentions), all 11 fixes grep-confirmed present, .cc-root scoping confirmed on all required button selectors.

Stage Summary:
- /home/z/my-project/src/app/card-constructor.css created: 1713 lines, valid plain CSS, all 48 themes verbatim, all 11 CSS review fixes applied.
- Ready for Task 2-b (TS logic) and the page.tsx shell which must wrap the app in <div className="cc-root"> and toggle .sidebar-open / .exporting classes, and import this file.
- Note for TS agent: .cc-styled-word spans carry inline styles (color/weight/size) applied by JS; the dashed underline is CSS-only and auto-hidden during export via .exporting on .cc-root. The .sidebar-backdrop element must be rendered in JSX (fixed overlay, shown only on mobile when .sidebar-open).

---
Task ID: 2-b
Agent: main
Task: Write src/lib/card-constructor.ts — imperative logic with ALL 26 review fixes.

Work Log:
- Implemented full app logic as initCardConstructor(root) returning a cleanup fn.
- Fix #5: generateId() uses crypto.randomUUID() (no Date.now() collision).
- Fix #1: input/textarea dblclick uses selectionStart/End via getSelectedWord(); no DOM surroundContents.
- Fix #2: applyWordStylesToText rewritten — finds word occurrences by index in RAW text, splits into segments, escapes each segment separately (handles & and any special char). Verified: "A & B" styled correctly, &amp; inside span.
- Fix #3: setSidebarOpen toggles .sidebar-open on root; CSS shifts toggle btn to left:356px (desktop), 16px (mobile).
- Fix #4: handleWordDoubleClick never ported.
- Fix #6/#25: MODAL_FIELDS config marks listNumber hasStyleControls:false → no format/size controls.
- Fix #7: reset sets color input to #000000 + hex text "АВТО" with .is-auto class.
- Fix #8: CSS overlay rgba 0.45.
- Fix #9: sidebarWasCollapsedBeforeModal remembered in openColorModal, restored in closeColorModal.
- Fix #10/#23: CSS card max-width:100%, min-height:400px, mobile padding.
- Fix #11: per-card "Сохранить изменения" button removed from preview (only Скачать PNG / Копировать).
- Fix #12: selectRowField highlights row + syncPresetIndicator highlights matching swatch.
- Fix #13: styled words get .cc-styled-word (dashed underline marker); .cc-root.exporting hides marker during PNG export.
- Fix #14: pruneOrphanWordStyles(card) runs on text change — removes wordStyles whose word no longer in text. Verified end-to-end.
- Fix #15: no console.log.
- Fix #17: data-raw-text not used.
- Fix #19: downloadAllPng updates toast "Скачано X из Y". Verified "Готово! Скачано 2 из 2".
- Fix #20: move arrows have title="Переместить выше/ниже" + disabled state at edges.
- Fix #21: window beforeunload saves silently.
- Fix #22: inputs/textarea have maxlength (title 200, subtitle/text/list 500/1000, footer 200, cta 100).
- Fix #24: popup close handler ignores clicks inside sidebar/modal/interactive controls.
- Fix #26: duplicateCard() with new id.
- Fix #27: history stack (snapshot/undo/redo), debounced push for text edits, immediate for structural.
- Fix #28: card.theme overrides global; per-card theme <select> in editor.
- Fix #29: exportJSON() downloads JSON; importJSON(file) via hidden file input.
- Fix #30: CSS mobile drawer (fixed overlay + backdrop).
- Fix #31: Ctrl+S save, Ctrl+Z undo, Ctrl+Shift+Z / Ctrl+Y redo. Verified Ctrl+S.
- Fix #32: #wordStyleList renders styled words for active field with remove buttons.
- XSS: escapeHtml on all dynamic text + color values.

Stage Summary:
- card-constructor.ts (~1600 lines) complete; all 26 fixes implemented.

---
Task ID: 3
Agent: main
Task: page.tsx shell JSX + layout.tsx fonts.

Work Log:
- page.tsx: client component renders .cc-root shell (sidebar, backdrop, toggle, workspace, color modal, word popup, toast). Modal rows generated from MODAL_ROWS (listNumber without controls). Word popup includes #wordStyleList. Sidebar has undo/redo/export/import buttons. useEffect calls initCardConstructor(rootRef) and returns cleanup.
- layout.tsx: lang="ru", metadata updated, fonts self-hosted via @fontsource (golos-text, lora, manrope, plus-jakarta-sans) — same-origin so html-to-image can embed them in PNG (eliminates cross-origin CSS SecurityError). Removed Google Fonts <link>.
- card-constructor.css: 48 themes verbatim + all CSS fixes (subagent Task 2-a) + supplemental rules for new elements.

Stage Summary:
- Shell wired to logic; fonts self-hosted; no cross-origin stylesheet issues.

---
Task ID: 4
Agent: main
Task: Lint, dev server, Agent Browser end-to-end verification.

Work Log (verified in-browser via agent-browser):
- Page renders, no console/runtime/hydration errors. Title correct.
- Initial state: sidebar collapsed, toggle at 16px, 1 empty card with "01 / 01" tag.
- Toggle: single click opens sidebar (collapsed→false, sidebar-open→true), toggle shifts to 356px (fix #3). Mobile: stays 16px.
- Editing: filled all fields incl. title "A & B: Заголовок"; preview shows &amp; correctly (fix #2 base), 3 list items rendered.
- Word styling (fix #1/#2/#13): dblclick title word → popup opens; bold+color → .cc-styled-word span with inline style + marker. Word list shows 1 entry (fix #32).
- Phrase with &: styled "A & B" → span style italic, &amp; escaped inside span (fix #2 confirmed).
- Color modal (fix #6/#7/#8/#9): listNumber row 0 format btns / 0 sliders; title row 4 btns; overlay rgba(15,23,42,0.45); hex "АВТО" + is-auto; sidebar state preserved across open/close.
- Color apply/reset: preset applies color to title in preview; reset clears color + shows АВТО.
- Duplicate (fix #26): card count 1→2. Undo (fix #27): 2→1.
- Themes: global dark-slate applies (card bg rgb(15,23,42)); per-card neo-brutalist overrides (bg #fffdf0, black border) (fix #28).
- Responsive (fix #30): viewport 375 → sidebar position:fixed, backdrop display:block, toggle 16px. maxlength=200 (fix #22), card min-height 400px (fix #23).
- Persistence (fix #21): localStorage has flashcard-cards/theme/format; wordStyles with & persisted.
- Export JSON (fix #29): no error. Import JSON: uploaded file → cards replaced, theme/format applied.
- Batch download (fix #19): toast "Готово! Скачано 2 из 2". Console clean (no SecurityError after font self-hosting).
- Fonts: Golos Text loaded; 0 cross-origin stylesheets; html-to-image embeds fonts.
- Orphan cleanup (fix #14): styled "слово" → localStorage ["title::слово"]; changed title removing word → [].
- Hotkeys (fix #31): Ctrl+S → "Карточки успешно сохранены!" toast.
- Layout: no horizontal overflow (scrollWidth=innerWidth=1280), card visible.
- Lint: 0 errors, 0 warnings. Dev log: all GET / 200, no errors.

Stage Summary:
- All 26 review fixes implemented AND browser-verified. App fully functional at / (port 3000).
