'use client';

/**
 * Конструктор текстовых карточек — императивная логика (перенос из vanilla JS).
 * Применены все исправления из ревью (критические, UX, чистка кода, улучшения).
 *
 * Экспортирует THEMES (для статического <select> в page.tsx) и initCardConstructor(root),
 * который настраивает приложение и возвращает функцию очистки.
 */
import { toPng, toBlob } from 'html-to-image';

/* ============================ ТИПЫ ============================ */
interface SectionStyle {
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  fontSize?: number;
}
interface WordStyle {
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  fontSize?: number | string;
  color?: string;
}
interface Card {
  id: string;
  title: string;
  subtitle: string;
  text: string;
  listItems: string;
  footer: string;
  cta: string;
  colors: Record<string, string>;
  wordStyles: Record<string, WordStyle>;
  sectionStyles: Record<string, SectionStyle>;
  theme?: string; // фикс #28: индивидуальная тема карточки
}
interface Snapshot {
  cards: Card[];
  theme: string;
  format: string;
}

/* ============================ ТЕМЫ ============================ */
export const THEME_GROUPS: { label: string; themes: { value: string; label: string }[] }[] = [
  {
    label: 'Оригинальные светлые',
    themes: [
      { value: 'default', label: '1. Clean Minimal (Notion / Apple)' },
      { value: 'editorial-paper', label: '2. Editorial Warm Paper' },
      { value: 'pastel-gradient', label: '3. Soft Pastel Gradient' },
      { value: 'fresh-mint', label: '4. Fresh Sage Mint' },
      { value: 'warm-peach', label: '5. Warm Peach Sunset' },
      { value: 'neo-brutalist', label: '6. Neo-Brutalist' },
    ],
  },
  {
    label: 'Оригинальные тёмные',
    themes: [
      { value: 'dark-slate', label: '7. Dark Slate Cyan' },
      { value: 'obsidian-gold', label: '8. Obsidian Gold' },
    ],
  },
  {
    label: 'Новые светлые (9–31)',
    themes: [
      { value: 'ocean-breeze', label: '9. Ocean Breeze' },
      { value: 'golden-hour', label: '10. Golden Hour' },
      { value: 'rose-quartz', label: '11. Rose Quartz' },
      { value: 'lavender-dreams', label: '12. Lavender Dreams' },
      { value: 'sandy-beach', label: '13. Sandy Beach' },
      { value: 'spring-meadow', label: '14. Spring Meadow' },
      { value: 'arctic-frost', label: '15. Arctic Frost' },
      { value: 'terracotta-clay', label: '16. Terracotta Clay' },
      { value: 'candy-pop', label: '17. Candy Pop' },
      { value: 'seafoam-mist', label: '18. Seafoam Mist' },
      { value: 'retro-diner', label: '19. Retro Diner' },
      { value: 'blush-nude', label: '20. Blush Nude' },
      { value: 'peach-fuzz', label: '21. Peach Fuzz' },
      { value: 'monochrome-graphite', label: '22. Monochrome Graphite' },
      { value: 'cotton-candy', label: '23. Cotton Candy' },
      { value: 'creamy-vanilla', label: '24. Creamy Vanilla' },
      { value: 'spearmint-fresh', label: '25. Spearmint Fresh' },
      { value: 'vintage-sepia', label: '26. Vintage Sepia' },
      { value: 'aquamarine-dream', label: '27. Aquamarine Dream' },
      { value: 'honey-glaze', label: '28. Honey Glaze' },
      { value: 'nordic-fjord', label: '29. Nordic Fjord' },
      { value: 'coral-reef', label: '30. Coral Reef' },
      { value: 'zen-garden', label: '31. Zen Garden' },
    ],
  },
  {
    label: 'Новые тёмные (32–48)',
    themes: [
      { value: 'midnight-plum', label: '32. Midnight Plum' },
      { value: 'forest-canopy', label: '33. Forest Canopy' },
      { value: 'charcoal-crimson', label: '34. Charcoal & Crimson' },
      { value: 'electric-violet', label: '35. Electric Violet' },
      { value: 'noir-ink', label: '36. Noir Ink' },
      { value: 'warm-amber', label: '37. Warm Amber' },
      { value: 'slate-blue', label: '38. Slate Blue' },
      { value: 'cyber-lime', label: '39. Cyber Lime' },
      { value: 'sunset-boulevard', label: '40. Sunset Boulevard' },
      { value: 'moss-bark', label: '41. Moss & Bark' },
      { value: 'espresso-shot', label: '42. Espresso Shot' },
      { value: 'electric-blue', label: '43. Electric Blue' },
      { value: 'twilight-violet', label: '44. Twilight Violet' },
      { value: 'plum-velvet', label: '45. Plum Velvet' },
      { value: 'neon-noir', label: '46. Neon Noir' },
      { value: 'galaxy-core', label: '47. Galaxy Core' },
      { value: 'midnight-forest', label: '48. Midnight Forest' },
    ],
  },
];

/* ============================ КОНФИГУРАЦИЯ ============================ */
const CONFIG = {
  SAVE_DEBOUNCE_MS: 400,
  HISTORY_DEBOUNCE_MS: 700,
  EXPORT_PIXEL_RATIO: 2,
  MAX_HISTORY: 50,
};

const FIELD_LABELS: Record<string, string> = {
  title: 'Заголовок',
  subtitle: 'Подзаголовок',
  text: 'Основной текст',
  list: 'Список',
  listItems: 'Список',
  listNumber: 'Нумерация списка',
  footer: 'Итоговый вывод',
  cta: 'Кнопка / CTA',
};

// Поля, которые редактируются как текст (в сайдбаре). listNumber — только цвет (без текста).
const EDITOR_FIELDS: {
  key: 'title' | 'subtitle' | 'text' | 'listItems' | 'footer' | 'cta';
  label: string;
  multiline: boolean;
  maxlength: number;
}[] = [
  { key: 'title', label: 'Заголовок', multiline: false, maxlength: 200 },
  { key: 'subtitle', label: 'Подзаголовок', multiline: true, maxlength: 500 },
  { key: 'text', label: 'Основной текст', multiline: true, maxlength: 1000 },
  { key: 'listItems', label: 'Список', multiline: true, maxlength: 1000 },
  { key: 'footer', label: 'Итоговый вывод', multiline: false, maxlength: 200 },
  { key: 'cta', label: 'Кнопка / CTA', multiline: false, maxlength: 100 },
];

// Поля в модалке цветов. listNumber — только цвет (фикс #6/#25: без форматных контролов).
const MODAL_FIELDS: {
  key: string;
  label: string;
  defaultSize: number;
  hasStyleControls: boolean;
}[] = [
  { key: 'title', label: 'Заголовок', defaultSize: 24, hasStyleControls: true },
  { key: 'subtitle', label: 'Подзаголовок', defaultSize: 18, hasStyleControls: true },
  { key: 'text', label: 'Основной текст', defaultSize: 16, hasStyleControls: true },
  { key: 'list', label: 'Список', defaultSize: 16, hasStyleControls: true },
  { key: 'listNumber', label: 'Нумерация списка', defaultSize: 16, hasStyleControls: false },
  { key: 'footer', label: 'Итоговый вывод', defaultSize: 14, hasStyleControls: true },
  { key: 'cta', label: 'Кнопка / CTA', defaultSize: 16, hasStyleControls: true },
];

const PRESET_COLORS = [
  '#0f172a',
  '#4f46e5',
  '#2563eb',
  '#059669',
  '#ea580c',
  '#dc2626',
  '#ec4899',
  '#7c3aed',
];

/* ============================ УТИЛИТЫ ============================ */
// фикс #5: коллизия идентификаторов — используем crypto.randomUUID()
function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      /* fall through */
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function splitOnce(s: string, sep: string): [string, string] {
  const i = s.indexOf(sep);
  if (i === -1) return [s, ''];
  return [s.slice(0, i), s.slice(i + sep.length)];
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

const isWordChar = (c: string) => /[\p{L}\p{N}_]/u.test(c);

// Получение выделенного слова в input/textarea (фикс #1).
// Не манипулирует DOM — только возвращает текст выделения/слова под курсором.
function getSelectedWord(el: HTMLInputElement | HTMLTextAreaElement): string {
  const s = el.selectionStart ?? 0;
  const e = el.selectionEnd ?? 0;
  let word = el.value.substring(s, e).trim();
  if (word) return word;
  const val = el.value;
  let start = s;
  let end = e;
  while (start > 0 && isWordChar(val[start - 1])) start--;
  while (end < val.length && isWordChar(val[end])) end++;
  return val.substring(start, end).trim();
}

/* ============================ ГЛАВНАЯ ФУНКЦИЯ ============================ */
export function initCardConstructor(root: HTMLElement): () => void {
  /* ---------- Ловушки ошибок (console error traps) ---------- */
  const errorHandler = (e: ErrorEvent) => {
    console.error('[Cardcraft] Runtime error:', e.message, e.filename + ':' + e.lineno);
  };
  const unhandledRejection = (e: PromiseRejectionEvent) => {
    console.error('[Cardcraft] Unhandled promise rejection:', e.reason);
  };
  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', unhandledRejection);

  /* ---------- Защитный логгер ---------- */
  function guard<T>(label: string, fn: () => T): T | undefined {
    try {
      return fn();
    } catch (err) {
      console.error('[Cardcraft] Error in ' + label + ':', err);
      return undefined;
    }
  }

  /* ---------- Ссылки на статические элементы ---------- */
  const $ = <T extends Element = HTMLElement>(sel: string): T | null => root.querySelector<T>(sel);
  const editorSidebar = $<HTMLElement>('#editorSidebar');
  const toggleSidebarBtn = $<HTMLButtonElement>('#toggleSidebarBtn');
  const sidebarBackdrop = $<HTMLElement>('#sidebarBackdrop');
  const editorCardsList = $<HTMLElement>('#editorCardsList');
  const cardsArea = $<HTMLElement>('#cardsArea');
  const themeSelect = $<HTMLSelectElement>('#themeSelect');
  const formatSelect = $<HTMLSelectElement>('#formatSelect');
  const previewWorkspace = $<HTMLElement>('#previewWorkspace');
  const toast = $<HTMLElement>('#toast');

  const colorModal = $<HTMLElement>('#colorModal');
  const closeModalBtn = $<HTMLButtonElement>('#closeModalBtn');
  const applyColorsBtn = $<HTMLButtonElement>('#applyColorsBtn');
  const resetCardColorsBtn = $<HTMLButtonElement>('#resetCardColorsBtn');
  const modalCardTitle = $<HTMLElement>('#modalCardTitle');

  const wordStylePopup = $<HTMLElement>('#wordStylePopup');
  const sizeSlider = $<HTMLInputElement>('#sizeSlider');
  const sizeValue = $<HTMLElement>('#sizeValue');
  const wordStyleList = $<HTMLElement>('#wordStyleList');

  const addCardBtn = $<HTMLButtonElement>('#addCardBtn');
  const saveChangesBtn = $<HTMLButtonElement>('#saveChangesBtn');
  const saveAllBtn = $<HTMLButtonElement>('#saveAll');
  const exportJsonBtn = $<HTMLButtonElement>('#exportJsonBtn');
  const importJsonBtn = $<HTMLButtonElement>('#importJsonBtn');
  const importJsonInput = $<HTMLInputElement>('#importJsonInput');
  const undoBtn = $<HTMLButtonElement>('#undoBtn');
  const redoBtn = $<HTMLButtonElement>('#redoBtn');
  const wordPopupHeader = $<HTMLElement>('#wordPopupHeader');
  const cardCountBadge = $<HTMLElement>('#cardCountBadge');

  /* ---------- Состояние ---------- */
  let cards: Card[] = [createEmptyCard()];
  let currentTheme = 'default';
  let currentFormat = 'auto';
  let activeCardIndexForColors: number | null = null;
  let lastActiveField = 'title';

  // Состояние сайдбара до открытия модалки (фикс #9)
  let sidebarWasCollapsedBeforeModal = true;

  // Настройка слова
  let activeWordStyles: WordStyle & { text?: string } = { text: '' };
  let activeFieldForWord: string | null = null;
  let activeCardIndexForWord: number | null = null;

  // История (фикс #27)
  let history: Snapshot[] = [];
  let histIndex = -1;

  // Таймеры
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let historyTimer: ReturnType<typeof setTimeout> | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  /* ---------- Создание карточки ---------- */
  function createEmptyCard(): Card {
    return {
      id: generateId(),
      title: '',
      subtitle: '',
      text: '',
      listItems: '',
      footer: '',
      cta: '',
      colors: {},
      wordStyles: {},
      sectionStyles: {},
    };
  }

  /* ---------- Toast (с очередью, без перекрытий) ---------- */
  const toastQueue: { msg: string; duration: number }[] = [];
  let toastShowing = false;

  function showToast(msg: string, duration = 2500): void {
    if (!toast) return;
    // Если текущий toast — прогресс пакетного скачивания (длинный), заменяем сразу
    if (toastShowing && duration < 10000) {
      toastQueue.push({ msg, duration });
      return;
    }
    toast.textContent = msg;
    toast.classList.add('show');
    toastShowing = true;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      toastShowing = false;
      if (toastQueue.length > 0) {
        const next = toastQueue.shift()!;
        setTimeout(() => showToast(next.msg, next.duration), 200);
      }
    }, duration);
  }

  /* ---------- Сохранение / загрузка ---------- */
  function scheduleSave(opts: { silent?: boolean } = {}): void {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveCardsToLocalStorage(opts), CONFIG.SAVE_DEBOUNCE_MS);
  }

  function saveCardsToLocalStorage({ silent = false } = {}): void {
    try {
      const cardsToSave = cards.map((c) => {
        const cleaned: Record<string, unknown> = { ...c };
        if (cleaned.wordStyles && Object.keys(cleaned.wordStyles as object).length === 0)
          delete cleaned.wordStyles;
        if (cleaned.sectionStyles && Object.keys(cleaned.sectionStyles as object).length === 0)
          delete cleaned.sectionStyles;
        if (cleaned.colors && Object.keys(cleaned.colors as object).length === 0)
          delete cleaned.colors;
        if (!cleaned.theme) delete cleaned.theme;
        return cleaned;
      });
      const dataStr = JSON.stringify(cardsToSave);
      const dataSize = new Blob([dataStr]).size;
      try {
        localStorage.setItem('flashcard-cards', dataStr);
        localStorage.setItem('flashcard-theme', currentTheme);
        localStorage.setItem('flashcard-format', currentFormat);
        if (!silent) showToast('Карточки успешно сохранены!');
      } catch (quotaError) {
        const err = quotaError as Error;
        if (err.name === 'QuotaExceededError') {
          if (!silent)
            showToast(
              `Недостаточно места (${(dataSize / 1024).toFixed(2)} KB). Удалите старые карточки.`,
            );
        } else {
          throw quotaError;
        }
      }
    } catch {
      if (!silent) showToast('Ошибка при сохранении карточек');
    }
  }

  function loadCardsFromLocalStorage(): void {
    const savedCards = localStorage.getItem('flashcard-cards');
    const savedTheme = localStorage.getItem('flashcard-theme');
    const savedFormat = localStorage.getItem('flashcard-format');
    if (savedCards) {
      try {
        const parsed = JSON.parse(savedCards) as Card[];
        cards = (Array.isArray(parsed) && parsed.length ? parsed : [createEmptyCard()]).map(
          migrateCard,
        );
      } catch {
        localStorage.removeItem('flashcard-cards');
        localStorage.removeItem('flashcard-theme');
        localStorage.removeItem('flashcard-format');
        showToast('Сохранённые данные повреждены, сброшено на значения по умолчанию');
      }
    }
    if (savedTheme) {
      currentTheme = savedTheme;
      if (themeSelect) themeSelect.value = savedTheme;
    }
    if (savedFormat) {
      currentFormat = savedFormat;
      if (formatSelect) formatSelect.value = savedFormat;
    }
    applyThemeToWorkspace();
  }

  function migrateCard(card: Partial<Card>): Card {
    const migrated: Card = {
      id: card.id || generateId(),
      title: card.title || '',
      subtitle: card.subtitle || '',
      text: card.text || '',
      listItems: card.listItems || '',
      footer: card.footer || '',
      cta: card.cta || '',
      colors: card.colors || {},
      wordStyles: {},
      sectionStyles: card.sectionStyles || {},
      theme: card.theme,
    };
    // Миграция wordStyles: старые ключи (без ::) -> новые (с field::), по умолчанию title
    if (card.wordStyles) {
      Object.keys(card.wordStyles).forEach((key) => {
        if (key.includes('::')) {
          migrated.wordStyles[key] = card.wordStyles![key];
        } else {
          migrated.wordStyles[`title::${key}`] = card.wordStyles![key];
        }
      });
    }
    // Миграция sectionStyles
    if (card.sectionStyles) {
      Object.keys(card.sectionStyles).forEach((field) => {
        const old = card.sectionStyles![field] as Record<string, unknown> & SectionStyle;
        const ns: SectionStyle = {};
        if (old.bold === 'bold' || old.fontWeight === 'bold') ns.fontWeight = 'bold';
        if (old.italic === 'italic' || old.fontStyle === 'italic') ns.fontStyle = 'italic';
        const deco = (old.textDecoration as string) || '';
        const parts: string[] = [];
        if (old.underline || deco.includes('underline')) parts.push('underline');
        if (old.strikethrough || deco.includes('line-through')) parts.push('line-through');
        if (parts.length) ns.textDecoration = parts.join(' ');
        if (old.fontSize) ns.fontSize = Number(old.fontSize);
        migrated.sectionStyles[field] = ns;
      });
    }
    return migrated;
  }

  /* ---------- Очистка «осиротевших» стилей слов (фикс #14) ---------- */
  function pruneOrphanWordStyles(card: Card): void {
    if (!card.wordStyles) return;
    const fieldTexts: Record<string, string> = {
      title: card.title,
      subtitle: card.subtitle,
      text: card.text,
      list: card.listItems,
      footer: card.footer,
      cta: card.cta,
    };
    let changed = false;
    Object.keys(card.wordStyles).forEach((key) => {
      const [kf, word] = splitOnce(key, '::');
      const fieldText = fieldTexts[kf] ?? '';
      // Проверяем, существует ли слово как отдельное слово в актуальном тексте
      if (!word || !containsWholeWord(fieldText, word)) {
        delete card.wordStyles[key];
        changed = true;
      }
    });
    if (changed && activeCardIndexForWord !== null && activeFieldForWord) {
      // Если попап открыт — обновим список стилей
      renderWordStyleList();
    }
  }

  function containsWholeWord(text: string, word: string): boolean {
    if (!word) return false;
    let idx = 0;
    while ((idx = text.indexOf(word, idx)) !== -1) {
      const before = text[idx - 1];
      const after = text[idx + word.length];
      if ((!before || !isWordChar(before)) && (!after || !isWordChar(after))) return true;
      idx += word.length;
    }
    return false;
  }

  /* ---------- Применение стилей слов к тексту (фикс #2: корректная работа с & и спецсимволами) ---------- */
  function applyWordStylesToText(text: string, wordStyles: Record<string, WordStyle>, field: string): string {
    if (!text) return '';
    if (!wordStyles || Object.keys(wordStyles).length === 0) return escapeHtml(text);

    // Собираем применимые стили: {word, styleStr}
    const applicable: { word: string; styleStr: string }[] = [];
    Object.keys(wordStyles).forEach((key) => {
      const [kf, word] = splitOnce(key, '::');
      const keyField = key.includes('::') ? kf : '*';
      if (keyField !== field && keyField !== '*') return;
      const styles = wordStyles[key];
      let styleStr = '';
      if (styles.fontWeight) styleStr += `font-weight:${styles.fontWeight};`;
      if (styles.fontStyle) styleStr += `font-style:${styles.fontStyle};`;
      if (styles.textDecoration) styleStr += `text-decoration:${styles.textDecoration};`;
      if (styles.fontSize) styleStr += `font-size:${styles.fontSize}px;`;
      if (styles.color) styleStr += `color:${escapeHtml(styles.color)};`;
      if (styleStr && word) applicable.push({ word, styleStr });
    });

    if (applicable.length === 0) return escapeHtml(text);

    // Находим все вхождения слов (по индексам, с проверкой границ)
    const ranges: { start: number; end: number; styleStr: string }[] = [];
    applicable.forEach(({ word, styleStr }) => {
      let idx = 0;
      while ((idx = text.indexOf(word, idx)) !== -1) {
        const before = text[idx - 1];
        const after = text[idx + word.length];
        if ((!before || !isWordChar(before)) && (!after || !isWordChar(after))) {
          ranges.push({ start: idx, end: idx + word.length, styleStr });
        }
        idx += word.length;
      }
    });

    if (ranges.length === 0) return escapeHtml(text);

    // Сортируем по началу; при пересечении выигрывает более раннее
    ranges.sort((a, b) => a.start - b.start || a.end - b.end);

    let html = '';
    let pos = 0;
    for (const r of ranges) {
      if (r.start < pos) continue; // пересечение — пропускаем
      html += escapeHtml(text.slice(pos, r.start));
      // фикс #13: маркер стилизованного слова (скрывается при экспорте через .exporting)
      html += `<span class="cc-styled-word" style="${r.styleStr}">${escapeHtml(
        text.slice(r.start, r.end),
      )}</span>`;
      pos = r.end;
    }
    html += escapeHtml(text.slice(pos));
    return html;
  }

  /* ---------- Стиль секции для превью ---------- */
  function buildSectionStyle(card: Card, field: string): string {
    const c = card.colors || {};
    const s = card.sectionStyles || {};
    let styleStr = '';
    if (c[field]) styleStr += `color:${escapeHtml(c[field])} !important;`;
    if (s[field]) {
      if (s[field]!.fontSize) styleStr += `font-size:${s[field]!.fontSize}px;`;
      if (s[field]!.fontWeight) styleStr += `font-weight:${s[field]!.fontWeight};`;
      if (s[field]!.fontStyle) styleStr += `font-style:${s[field]!.fontStyle};`;
      if (s[field]!.textDecoration) styleStr += `text-decoration:${s[field]!.textDecoration};`;
    }
    return styleStr ? `style="${styleStr}"` : '';
  }

  /* ---------- Тема воркспейса ---------- */
  function applyThemeToWorkspace(): void {
    if (!previewWorkspace) return;
    if (currentTheme === 'default') previewWorkspace.removeAttribute('data-theme');
    else previewWorkspace.setAttribute('data-theme', currentTheme);
  }

  /* ---------- Рендер редактора ---------- */
  function renderEditor(): void {
    if (!editorCardsList) return;
    editorCardsList.innerHTML = '';
    cards.forEach((card, index) => {
      const block = document.createElement('div');
      block.className = 'card-editor-block';

      // Опции тем для индивидуальной темы карточки (фикс #28)
      const themeOptionsHtml = THEME_GROUPS.map(
        (g) =>
          `<optgroup label="${escapeHtml(g.label)}">${g.themes
            .map(
              (t) =>
                `<option value="${t.value}"${card.theme === t.value ? ' selected' : ''}>${escapeHtml(
                  t.label,
                )}</option>`,
            )
            .join('')}</optgroup>`,
      ).join('');

      block.innerHTML = `
        <div class="card-editor-header">
          <h3>Карточка ${index + 1}</h3>
          <div class="card-editor-actions">
            <button class="btn-icon" data-action="duplicate" data-index="${index}" title="Дублировать" aria-label="Дублировать"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
            <button class="btn-icon" data-action="move" data-index="${index}" data-dir="-1" title="Переместить выше" aria-label="Выше" ${index === 0 ? 'disabled' : ''}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg></button>
            <button class="btn-icon" data-action="move" data-index="${index}" data-dir="1" title="Переместить ниже" aria-label="Ниже" ${index === cards.length - 1 ? 'disabled' : ''}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
            ${cards.length > 1 ? `<button class="btn-delete" data-action="delete" data-index="${index}" title="Удалить карточку" aria-label="Удалить"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>` : ''}
          </div>
        </div>
        <button class="btn-card-editor-palette" data-action="palette" data-index="${index}" title="Цвета и стили карточки">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          <span>Стили</span>
        </button>
        <div class="form-group">
          <label>Тема карточки</label>
          <select data-action="card-theme" data-index="${index}">
            <option value="default"${!card.theme || card.theme === 'default' ? ' selected' : ''}>По умолчанию</option>
            ${themeOptionsHtml}
          </select>
        </div>
        ${EDITOR_FIELDS.map(
          (f) => `
          <div class="form-group">
            <label>${f.label}</label>
            ${
              f.multiline
                ? `<textarea data-field="${f.key}" data-index="${index}" maxlength="${f.maxlength}" placeholder="${f.label}…">${escapeHtml(card[f.key])}</textarea>`
                : `<input type="text" data-field="${f.key}" data-index="${index}" maxlength="${f.maxlength}" placeholder="${f.label}…" value="${escapeHtml(card[f.key])}">`
            }
          </div>`,
        ).join('')}
      `;
      editorCardsList.appendChild(block);
    });

    // Обработчики ввода текста
    editorCardsList
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[data-field], textarea[data-field]')
      .forEach((el) => {
        el.addEventListener('input', function () {
          const idx = Number(this.dataset.index);
          const field = this.dataset.field as keyof Card;
          cards[idx][field] = this.value as never;
          // фикс #14: очистка «осиротевших» стилей слов
          pruneOrphanWordStyles(cards[idx]);
          renderPreview();
          scheduleSave({ silent: true });
          scheduleHistoryPush();
        });

        // фикс #1: двойной клик в поле ввода — выделяем слово без манипуляций DOM
        el.addEventListener('dblclick', function (e) {
          const text = getSelectedWord(this);
          const field = this.dataset.field || '';
          const cardIndex = Number(this.dataset.index);
          if (text.length > 0) {
            const rect = (this as HTMLElement).getBoundingClientRect();
            openWordStylePopup(rect.left, rect.top + 24, text, field, cardIndex);
          }
          e.stopPropagation();
        });

        // Жёсткая очистка при вставке
        el.addEventListener('paste', function (e) {
          e.preventDefault();
          const text = (e.clipboardData || window.clipboardData).getData('text');
          const field = this.dataset.field || '';
          const multiline = ['subtitle', 'text', 'listItems'].includes(field);
          const cleanText = multiline ? text : text.replace(/\s+/g, ' ').trim();
          const start = (this as HTMLInputElement).selectionStart ?? 0;
          const end = (this as HTMLInputElement).selectionEnd ?? 0;
          const cur = (this as HTMLInputElement).value;
          (this as HTMLInputElement).value = cur.substring(0, start) + cleanText + cur.substring(end);
          const idx = Number(this.dataset.index);
          (cards[idx][field as keyof Card] as string) = (this as HTMLInputElement).value;
          pruneOrphanWordStyles(cards[idx]);
          renderPreview();
          scheduleSave({ silent: true });
          scheduleHistoryPush();
        });
      });

    // Кнопки действий
    editorCardsList.querySelectorAll<HTMLElement>('[data-action]').forEach((btn) => {
      const action = btn.dataset.action;
      if (action === 'palette') {
        btn.addEventListener('click', function () {
          openColorModal(Number(this.dataset.index));
        });
      } else if (action === 'delete') {
        btn.addEventListener('click', function () {
          deleteCard(Number(this.dataset.index));
        });
      } else if (action === 'duplicate') {
        btn.addEventListener('click', function () {
          duplicateCard(Number(this.dataset.index));
        });
      } else if (action === 'move') {
        btn.addEventListener('click', function () {
          moveCard(Number(this.dataset.index), Number(this.dataset.dir));
        });
      } else if (action === 'card-theme') {
        btn.addEventListener('change', function () {
          const idx = Number(this.dataset.index);
          const val = (this as HTMLSelectElement).value;
          cards[idx].theme = val === 'default' ? undefined : val;
          renderPreview();
          pushHistory();
          scheduleSave({ silent: true });
        });
      }
    });
  }

  /* ---------- Рендер превью ---------- */
  function renderPreview(): void {
    if (!cardsArea) return;
    cardsArea.innerHTML = '';
    const total = cards.length;

    cards.forEach((card, index) => {
      const percent = Math.round(((index + 1) / total) * 100);
      const cardNum = String(index + 1).padStart(2, '0');
      const totalNum = String(total).padStart(2, '0');

      const titleStyle = buildSectionStyle(card, 'title');
      const subtitleStyle = buildSectionStyle(card, 'subtitle');
      const textStyle = buildSectionStyle(card, 'text');
      const listStyle = buildSectionStyle(card, 'list');
      const listNumberStyle = card.colors?.listNumber
        ? `style="--custom-color:${escapeHtml(card.colors.listNumber)};"`
        : '';
      const listNumberDataAttr = card.colors?.listNumber ? 'data-custom-color="true"' : '';
      const footerStyle = buildSectionStyle(card, 'footer');
      const ctaStyle = buildSectionStyle(card, 'cta');

      // Список
      let listHtml = '';
      if ((card.listItems || '').trim()) {
        const items = card.listItems.split('\n').filter((i) => i.trim());
        listHtml = `<ul class="card-list">${items
          .map(
            (it, idx) => `
              <li class="card-list-item" ${listStyle}>
                <span class="card-list-num" ${listNumberStyle} ${listNumberDataAttr}>${idx + 1}.</span>
                <span class="card-list-text" ${listStyle} data-field="list" data-index="${index}">${applyWordStylesToText(
                  it,
                  card.wordStyles,
                  'list',
                )}</span>
              </li>`,
          )
          .join('')}</ul>`;
      }

      // фикс #28: индивидуальная тема карточки перекрывает глобальную
      const cardTheme = card.theme && card.theme !== 'default' ? card.theme : currentTheme;
      const themeAttr = cardTheme !== 'default' ? `data-theme="${cardTheme}"` : '';
      const formatAttr = currentFormat !== 'auto' ? `data-format="${currentFormat}"` : '';

      // Плейсхолдер для пустой карточки
      const hasContent =
        card.title || card.subtitle || card.text || (card.listItems || '').trim() || card.footer || card.cta;
      const emptyHint = !hasContent
        ? `<div class="card-empty-hint">Карточка пуста — заполните поля в редакторе</div>`
        : '';

      const wrapper = document.createElement('div');
      wrapper.className = 'card-wrapper';
      wrapper.innerHTML = `
        <div class="card" id="card-node-${card.id}" ${themeAttr} ${formatAttr}>
          <div class="card-top-content" style="display:flex;flex-direction:column;gap:16px;">
            <div class="progress"><div class="progress-fill" style="width:${percent}%;"></div></div>
            <div class="tag"><span>${cardNum} / ${totalNum}</span><span></span></div>
            ${emptyHint}
            ${
              card.title
                ? `<h2 class="card-title" ${titleStyle} data-field="title" data-index="${index}">${applyWordStylesToText(
                    card.title,
                    card.wordStyles,
                    'title',
                  )}</h2>`
                : ''
            }
            ${
              card.subtitle
                ? `<p class="card-subtitle" ${subtitleStyle} data-field="subtitle" data-index="${index}">${applyWordStylesToText(
                    card.subtitle,
                    card.wordStyles,
                    'subtitle',
                  ).replace(/\n/g, '<br>')}</p>`
                : ''
            }
            ${
              card.text
                ? `<p class="card-text" ${textStyle} data-field="text" data-index="${index}">${applyWordStylesToText(
                    card.text,
                    card.wordStyles,
                    'text',
                  ).replace(/\n/g, '<br>')}</p>`
                : ''
            }
            ${listHtml}
          </div>
          <div class="card-bottom-content" style="display:flex;flex-direction:column;gap:16px;">
            ${
              card.footer
                ? `<div class="card-footer-text" ${footerStyle} data-field="footer" data-index="${index}">${applyWordStylesToText(
                    card.footer,
                    card.wordStyles,
                    'footer',
                  )}</div>`
                : ''
            }
            ${
              card.cta
                ? `<div class="accent-btn" ${ctaStyle} data-field="cta" data-index="${index}">${applyWordStylesToText(
                    card.cta,
                    card.wordStyles,
                    'cta',
                  )}</div>`
                : ''
            }
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-card-action" data-action="download" data-card-id="card-node-${card.id}" data-filename="card-${index + 1}.png">Скачать PNG</button>
          <button class="btn-card-action" data-action="copy" data-card-id="card-node-${card.id}">Копировать</button>
        </div>
      `;
      cardsArea.appendChild(wrapper);
    });

    // Скачать / копировать
    cardsArea.querySelectorAll<HTMLElement>('[data-action="download"]').forEach((btn) =>
      btn.addEventListener('click', async function () {
        const node = document.getElementById(this.dataset.cardId || '');
        if (node) await generateAndDownloadPng(node, this.dataset.filename || 'card.png');
      }),
    );
    cardsArea.querySelectorAll<HTMLElement>('[data-action="copy"]').forEach((btn) =>
      btn.addEventListener('click', async function () {
        const node = document.getElementById(this.dataset.cardId || '');
        if (node) await copyCardToClipboard(node);
      }),
    );

    // Двойной клик по текстовым элементам превью
    cardsArea.querySelectorAll<HTMLElement>('[data-field]').forEach((el) => {
      el.addEventListener('dblclick', function (e) {
        const selection = window.getSelection();
        const text = selection ? selection.toString().trim() : '';
        const field = this.dataset.field || '';
        const cardIndex = Number(this.dataset.index);
        if (text.length > 0) {
          const rect = (this as HTMLElement).getBoundingClientRect();
          openWordStylePopup(rect.left, rect.top + 24, text, field, cardIndex);
        }
        e.stopPropagation();
      });
    });

    // Обновление счётчика карточек в заголовке воркспейса
    if (cardCountBadge) {
      const n = cards.length;
      const word = n === 1 ? 'карточка' : n >= 2 && n <= 4 ? 'карточки' : 'карточек';
      cardCountBadge.textContent = `${n} ${word}`;
      cardCountBadge.style.display = n > 0 ? '' : 'none';
    }
  }

  /* ---------- Действия с карточками ---------- */
  function addCard(): void {
    cards.push(createEmptyCard());
    renderEditor();
    renderPreview();
    pushHistory();
    scheduleSave({ silent: true });
    showToast('Карточка добавлена');
  }

  function deleteCard(idx: number): void {
    if (cards.length <= 1) return;
    cards.splice(idx, 1);
    renderEditor();
    renderPreview();
    pushHistory();
    scheduleSave({ silent: true });
    showToast('Карточка удалена');
  }

  // фикс #26: дублирование карточки
  function duplicateCard(idx: number): void {
    const copy = deepClone(cards[idx]);
    copy.id = generateId();
    cards.splice(idx + 1, 0, copy);
    renderEditor();
    renderPreview();
    pushHistory();
    scheduleSave({ silent: true });
    showToast('Карточка дублирована');
  }

  function moveCard(idx: number, dir: number): void {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= cards.length) return;
    [cards[idx], cards[newIdx]] = [cards[newIdx], cards[idx]];
    renderEditor();
    renderPreview();
    pushHistory();
    scheduleSave({ silent: true });
  }

  /* ---------- Модальное окно палитры ---------- */
  let lastFocusedBeforeModal: HTMLElement | null = null;

  function selectRowField(field: string): void {
    lastActiveField = field;
    const label = $<HTMLElement>('#presetTargetLabel');
    if (label) label.textContent = FIELD_LABELS[field] || 'Заголовок';
    root.querySelectorAll<HTMLElement>('.color-picker-row').forEach((row) => {
      if (row.dataset.rowField === field) row.classList.add('selected');
      else row.classList.remove('selected');
    });
    // фикс #12: синхронизируем цветовой инпут с активным полем для пресетов
    syncPresetIndicator(field);
  }

  function syncPresetIndicator(_field: string): void {
    // Подсветка строки уже управляется .selected; дополнительно подсветим активный свотч
    const activeColor =
      activeCardIndexForColors !== null
        ? cards[activeCardIndexForColors].colors?.[_field]
        : undefined;
    root.querySelectorAll<HTMLElement>('.color-swatch').forEach((sw) => {
      if (activeColor && sw.dataset.preset === activeColor) sw.classList.add('active');
      else sw.classList.remove('active');
    });
  }

  function openColorModal(index: number): void {
    activeCardIndexForColors = index;
    if (modalCardTitle) modalCardTitle.textContent = `Стили · Карточка ${index + 1}`;

    // фикс #9: запоминаем состояние сайдбара, не меняем его
    sidebarWasCollapsedBeforeModal = editorSidebar?.classList.contains('collapsed') ?? true;

    const currentColors = cards[index].colors || {};
    const currentSectionStyles = cards[index].sectionStyles || {};

    MODAL_FIELDS.forEach((f) => {
      const input = $<HTMLInputElement>(`#col-${f.key}`);
      const hexText = $<HTMLElement>(`#hex-${f.key}`);
      if (currentColors[f.key]) {
        if (input) input.value = currentColors[f.key];
        if (hexText) {
          hexText.textContent = currentColors[f.key];
          hexText.classList.remove('is-auto');
        }
      } else {
        // фикс #7: при сбросе показываем «АВТО», не #0f172a
        if (input) input.value = '#000000';
        if (hexText) {
          hexText.textContent = 'АВТО';
          hexText.classList.add('is-auto');
        }
      }
      if (!f.hasStyleControls) return;
      const formatBtns = root.querySelectorAll<HTMLElement>(
        `.format-btn-section[data-field="${f.key}"]`,
      );
      const sl = $<HTMLInputElement>(`.size-slider-section[data-field="${f.key}"]`);
      const sv = $<HTMLElement>(`.size-value-section[data-field="${f.key}"]`);
      const styles = currentSectionStyles[f.key];
      formatBtns.forEach((btn) => {
        const fmt = btn.dataset.format;
        btn.classList.remove('active');
        if (!styles) return;
        if (fmt === 'bold' && styles.fontWeight === 'bold') btn.classList.add('active');
        else if (fmt === 'italic' && styles.fontStyle === 'italic') btn.classList.add('active');
        else if (fmt === 'underline' && styles.textDecoration?.includes('underline'))
          btn.classList.add('active');
        else if (fmt === 'strikethrough' && styles.textDecoration?.includes('line-through'))
          btn.classList.add('active');
      });
      if (sl && sv) {
        const sz = styles?.fontSize ?? f.defaultSize;
        sl.value = String(sz);
        sv.textContent = `${sz}px`;
      }
    });

    selectRowField('title');
    colorModal?.classList.add('active');
    previewWorkspace?.classList.add('modal-open');
    // Фокус-менеджмент: переносим фокус в модалку
    lastFocusedBeforeModal = document.activeElement as HTMLElement;
    setTimeout(() => closeModalBtn?.focus(), 50);
  }

  function closeColorModal(): void {
    colorModal?.classList.remove('active');
    previewWorkspace?.classList.remove('modal-open');
    activeCardIndexForColors = null;
    // фикс #9: восстанавливаем состояние сайдбара, а не принудительно открываем
    if (editorSidebar) {
      if (sidebarWasCollapsedBeforeModal) {
        editorSidebar.classList.add('collapsed');
        root.classList.remove('sidebar-open');
      } else {
        editorSidebar.classList.remove('collapsed');
        root.classList.add('sidebar-open');
      }
    }
    // Возвращаем фокус на элемент, который открыл модалку
    lastFocusedBeforeModal?.focus?.();
    lastFocusedBeforeModal = null;
  }

  /* ---------- Попап настройки слова ---------- */
  function openWordStylePopup(
    x: number,
    y: number,
    selectedText: string,
    field: string,
    cardIndex: number,
  ): void {
    activeFieldForWord = field;
    activeCardIndexForWord = cardIndex;
    activeWordStyles = { text: selectedText };

    // Заголовок попапа: показываем стилизуемое слово и поле
    if (wordPopupHeader) {
      const fieldLabel = FIELD_LABELS[field] || field;
      const displayWord = selectedText.length > 28 ? selectedText.slice(0, 27) + '…' : selectedText;
      wordPopupHeader.innerHTML = `<span class="wp-header-label">${escapeHtml(fieldLabel)}:</span> <span class="wp-header-word">${escapeHtml(displayWord)}</span>`;
    }

    const key = `${field}::${selectedText}`;
    const existing = cards[cardIndex].wordStyles?.[key];
    if (existing) Object.assign(activeWordStyles, existing);

    // Синхронизация кнопок формата
    root.querySelectorAll<HTMLElement>('.format-btn').forEach((btn) => {
      const fmt = btn.dataset.format;
      btn.classList.remove('active');
      if (fmt === 'bold' && activeWordStyles.fontWeight === 'bold') btn.classList.add('active');
      else if (fmt === 'italic' && activeWordStyles.fontStyle === 'italic')
        btn.classList.add('active');
      else if (fmt === 'underline' && activeWordStyles.textDecoration?.includes('underline'))
        btn.classList.add('active');
      else if (
        fmt === 'strikethrough' &&
        activeWordStyles.textDecoration?.includes('line-through')
      )
        btn.classList.add('active');
    });
    // Цветовые пресеты
    root.querySelectorAll<HTMLElement>('.color-preset').forEach((p) => {
      if (activeWordStyles.color && p.dataset.color === activeWordStyles.color)
        p.classList.add('active');
      else p.classList.remove('active');
    });
    if (sizeSlider && sizeValue) {
      const sz = activeWordStyles.fontSize
        ? Number(activeWordStyles.fontSize)
        : 16;
      sizeSlider.value = String(sz);
      sizeValue.textContent = `${sz}px`;
    }

    renderWordStyleList();

    if (wordStylePopup) {
      // Позиционирование с clamp к viewport
      const pad = 12;
      wordStylePopup.classList.add('active');
      wordStylePopup.style.visibility = 'hidden';
      const rect = wordStylePopup.getBoundingClientRect();
      wordStylePopup.style.visibility = '';
      const left = Math.min(Math.max(pad, x), window.innerWidth - rect.width - pad);
      const top = Math.min(Math.max(pad, y), window.innerHeight - rect.height - pad);
      wordStylePopup.style.left = `${left}px`;
      wordStylePopup.style.top = `${top}px`;
    }
  }

  function closeWordStylePopup(): void {
    wordStylePopup?.classList.remove('active');
    activeFieldForWord = null;
    activeCardIndexForWord = null;
    activeWordStyles = { text: '' };
  }

  // фикс #32: список стилизованных слов для активного поля с возможностью удаления
  function renderWordStyleList(): void {
    if (!wordStyleList || activeCardIndexForWord === null || !activeFieldForWord) {
      if (wordStyleList) wordStyleList.innerHTML = '';
      return;
    }
    const card = cards[activeCardIndexForWord];
    const field = activeFieldForWord;
    const entries = Object.keys(card.wordStyles || {})
      .filter((k) => {
        const [kf] = splitOnce(k, '::');
        return k.includes('::') ? kf === field : true;
      })
      .map((k) => ({ key: k, word: splitOnce(k, '::')[1] || k }));
    if (entries.length === 0) {
      wordStyleList.innerHTML = '<div class="word-list-empty">Стилизованных слов нет</div>';
      return;
    }
    wordStyleList.innerHTML =
      '<div class="word-list-title">Стили слов поля:</div>' +
      entries
        .map(
          (e) =>
            `<div class="word-list-item"><span class="word-list-word">${escapeHtml(
              e.word,
            )}</span><button class="word-list-remove" data-word-key="${escapeHtml(
              e.key,
            )}" title="Удалить стиль">✕</button></div>`,
        )
        .join('');
    wordStyleList.querySelectorAll<HTMLElement>('.word-list-remove').forEach((btn) =>
      btn.addEventListener('click', function () {
        const key = this.dataset.wordKey || '';
        if (activeCardIndexForWord === null) return;
        delete cards[activeCardIndexForWord].wordStyles[key];
        renderPreview();
        renderWordStyleList();
        pushHistory();
        scheduleSave({ silent: true });
      }),
    );
  }

  function commitWordStyle(): void {
    if (activeCardIndexForWord === null || !activeWordStyles.text || !activeFieldForWord) return;
    if (!cards[activeCardIndexForWord].wordStyles) cards[activeCardIndexForWord].wordStyles = {};
    const key = `${activeFieldForWord}::${activeWordStyles.text}`;
    const { text: _omit, ...rest } = activeWordStyles;
    void _omit;
    cards[activeCardIndexForWord].wordStyles[key] = rest;
    renderPreview();
    renderWordStyleList();
    scheduleSave({ silent: true });
    scheduleHistoryPush();
  }

  /* ---------- Экспорт PNG ---------- */
  async function withExportMode<T>(node: HTMLElement, fn: () => Promise<T>): Promise<T> {
    root.classList.add('exporting');
    try {
      await document.fonts.ready;
      return await fn();
    } finally {
      root.classList.remove('exporting');
    }
  }

  async function generateAndDownloadPng(node: HTMLElement, filename: string): Promise<void> {
    try {
      const dataUrl = await withExportMode(node, () =>
        toPng(node, { pixelRatio: CONFIG.EXPORT_PIXEL_RATIO, cacheBust: true }),
      );
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      showToast('Карточка успешно скачана!');
    } catch {
      showToast('Ошибка при скачивании');
    }
  }

  async function copyCardToClipboard(node: HTMLElement): Promise<void> {
    try {
      if (!window.isSecureContext) {
        showToast('Копирование требует HTTPS. Скачиваю PNG вместо копирования…');
        await generateAndDownloadPng(node, 'card-copy.png');
        return;
      }
      const blob = await withExportMode(node, () =>
        toBlob(node, { pixelRatio: CONFIG.EXPORT_PIXEL_RATIO, cacheBust: true }),
      );
      if (!blob) {
        showToast('Не удалось создать изображение');
        return;
      }
      if (!navigator.clipboard || !window.ClipboardItem) {
        showToast('Буфер обмена не поддерживается. Скачиваю PNG…');
        await generateAndDownloadPng(node, 'card-copy.png');
        return;
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Карточка скопирована в буфер!');
    } catch (err) {
      // Часто падает из-за отсутствия user-gesture или прав — фолбэк на скачивание
      const name = (err as Error)?.name || '';
      if (name === 'NotAllowedError') {
        showToast('Нет прав на буфер обмена. Скачиваю PNG…');
      } else {
        showToast('Копирование не удалось. Скачиваю PNG…');
      }
      try {
        await generateAndDownloadPng(node, 'card-copy.png');
      } catch {
        /* уже показали ошибку */
      }
    }
  }

  // фикс #19: прогресс при пакетном скачивании
  async function downloadAllPng(): Promise<void> {
    const total = cards.length;
    showToast(`Генерация PNG: 0 из ${total}...`, 60000);
    for (let i = 0; i < total; i++) {
      const node = document.getElementById(`card-node-${cards[i].id}`);
      if (node) {
        await generateAndDownloadPngSilent(node, `card-${i + 1}.png`);
        showToast(`Скачано ${i + 1} из ${total}...`, 60000);
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    showToast(`Готово! Скачано ${total} из ${total} карточек.`);
  }

  async function generateAndDownloadPngSilent(node: HTMLElement, filename: string): Promise<void> {
    try {
      const dataUrl = await withExportMode(node, () =>
        toPng(node, { pixelRatio: CONFIG.EXPORT_PIXEL_RATIO, cacheBust: true }),
      );
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch {
      /* игнорируем, продолжаем пакет */
    }
  }

  /* ---------- Экспорт / Импорт JSON (фикс #29) ---------- */
  function exportJSON(): void {
    const data = JSON.stringify({ cards, theme: currentTheme, format: currentFormat }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `cards-${new Date().toISOString().slice(0, 10)}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Данные экспортированы в JSON');
  }

  function importJSON(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.cards || !Array.isArray(parsed.cards)) throw new Error('bad');
        cards = parsed.cards.map(migrateCard);
        if (parsed.theme) {
          currentTheme = parsed.theme;
          if (themeSelect) themeSelect.value = parsed.theme;
        }
        if (parsed.format) {
          currentFormat = parsed.format;
          if (formatSelect) formatSelect.value = parsed.format;
        }
        applyThemeToWorkspace();
        renderEditor();
        renderPreview();
        pushHistory();
        scheduleSave({ silent: true });
        showToast('Данные импортированы из JSON');
      } catch {
        showToast('Не удалось прочитать JSON-файл');
      }
    };
    reader.readAsText(file);
  }

  /* ---------- История (фикс #27) ---------- */
  function snapshot(): Snapshot {
    return { cards: deepClone(cards), theme: currentTheme, format: currentFormat };
  }
  function pushHistory(): void {
    history = history.slice(0, histIndex + 1);
    history.push(snapshot());
    if (history.length > CONFIG.MAX_HISTORY) {
      history.shift();
    } else {
      histIndex++;
    }
    updateUndoRedoButtons();
  }
  function scheduleHistoryPush(): void {
    if (historyTimer) clearTimeout(historyTimer);
    historyTimer = setTimeout(pushHistory, CONFIG.HISTORY_DEBOUNCE_MS);
  }
  function restore(s: Snapshot): void {
    cards = deepClone(s.cards);
    currentTheme = s.theme;
    currentFormat = s.format;
    if (themeSelect) themeSelect.value = s.theme;
    if (formatSelect) formatSelect.value = s.format;
    applyThemeToWorkspace();
    renderEditor();
    renderPreview();
    scheduleSave({ silent: true });
    updateUndoRedoButtons();
  }
  function undo(): void {
    if (histIndex <= 0) return;
    histIndex--;
    restore(history[histIndex]);
    showToast('Действие отменено');
  }
  function redo(): void {
    if (histIndex >= history.length - 1) return;
    histIndex++;
    restore(history[histIndex]);
    showToast('Действие повторено');
  }
  function updateUndoRedoButtons(): void {
    if (undoBtn) undoBtn.disabled = histIndex <= 0;
    if (redoBtn) redoBtn.disabled = histIndex >= history.length - 1;
  }

  /* ---------- Сайдбар ---------- */
  function setSidebarOpen(open: boolean): void {
    if (!editorSidebar) return;
    if (open) {
      editorSidebar.classList.remove('collapsed');
      root.classList.add('sidebar-open');
    } else {
      editorSidebar.classList.add('collapsed');
      root.classList.remove('sidebar-open');
    }
  }

  /* ---------- Навешивание статических обработчиков ---------- */
  const docListeners: { type: string; fn: (e: Event) => void }[] = [];

  function addDoc<K extends keyof DocumentEventMap>(
    type: K,
    fn: (e: DocumentEventMap[K]) => void,
  ): void {
    document.addEventListener(type, fn as EventListener);
    docListeners.push({ type, fn: fn as (e: Event) => void });
  }

  function bindStatic(): void {
    // Тема / формат
    themeSelect?.addEventListener('change', (e) => {
      currentTheme = (e.target as HTMLSelectElement).value;
      applyThemeToWorkspace();
      renderPreview();
      scheduleSave({ silent: true });
    });
    formatSelect?.addEventListener('change', (e) => {
      currentFormat = (e.target as HTMLSelectElement).value;
      renderPreview();
      scheduleSave({ silent: true });
    });

    // Кнопки сайдбара
    addCardBtn?.addEventListener('click', addCard);
    saveChangesBtn?.addEventListener('click', () => saveCardsToLocalStorage({ silent: false }));
    saveAllBtn?.addEventListener('click', downloadAllPng);
    exportJsonBtn?.addEventListener('click', exportJSON);
    importJsonBtn?.addEventListener('click', () => importJsonInput?.click());
    importJsonInput?.addEventListener('change', (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) importJSON(f);
      (e.target as HTMLInputElement).value = '';
    });
    undoBtn?.addEventListener('click', undo);
    redoBtn?.addEventListener('click', redo);

    // Тоггл сайдбара (фикс #3: кнопка смещается через CSS-класс .sidebar-open)
    toggleSidebarBtn?.addEventListener('click', () => {
      const open = editorSidebar?.classList.contains('collapsed');
      setSidebarOpen(!!open);
    });
    sidebarBackdrop?.addEventListener('click', () => setSidebarOpen(false));

    // Модалка
    closeModalBtn?.addEventListener('click', closeColorModal);
    applyColorsBtn?.addEventListener('click', closeColorModal);
    colorModal?.addEventListener('click', (e) => {
      if (e.target === colorModal) closeColorModal();
    });

    // Строки цветов в модалке
    root.querySelectorAll<HTMLElement>('.color-picker-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.btn-reset-single')) return;
        const f = row.dataset.rowField;
        if (f) selectRowField(f);
      });
    });

    // Цветовые инпуты
    MODAL_FIELDS.forEach((f) => {
      const input = $<HTMLInputElement>(`#col-${f.key}`);
      const hexText = $<HTMLElement>(`#hex-${f.key}`);
      input?.addEventListener('input', function () {
        if (activeCardIndexForColors === null) return;
        if (!cards[activeCardIndexForColors].colors) cards[activeCardIndexForColors].colors = {};
        cards[activeCardIndexForColors].colors[f.key] = this.value;
        if (hexText) {
          hexText.textContent = this.value;
          hexText.classList.remove('is-auto');
        }
        selectRowField(f.key);
        renderPreview();
        scheduleSave({ silent: true });
      });
    });

    // Сброс одного цвета (фикс #7)
    root.querySelectorAll<HTMLElement>('[data-reset]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const f = btn.dataset.reset || '';
        if (activeCardIndexForColors === null) return;
        delete cards[activeCardIndexForColors].colors?.[f];
        const hexText = $<HTMLElement>(`#hex-${f}`);
        const input = $<HTMLInputElement>(`#col-${f}`);
        if (hexText) {
          hexText.textContent = 'АВТО';
          hexText.classList.add('is-auto');
        }
        if (input) input.value = '#000000';
        selectRowField(f);
        renderPreview();
        scheduleSave({ silent: true });
      });
    });

    // Пресеты (быстрые цвета)
    root.querySelectorAll<HTMLElement>('.color-swatch, .color-preset[data-color]').forEach((sw) => {
      if (sw.classList.contains('color-preset') && wordStylePopup?.contains(sw)) return; // попап-пресеты ниже
      sw.addEventListener('click', () => {
        if (activeCardIndexForColors === null) return;
        const hex = sw.dataset.preset || sw.dataset.color || '';
        const f = lastActiveField || 'title';
        if (!cards[activeCardIndexForColors].colors) cards[activeCardIndexForColors].colors = {};
        cards[activeCardIndexForColors].colors[f] = hex;
        const input = $<HTMLInputElement>(`#col-${f}`);
        const hexText = $<HTMLElement>(`#hex-${f}`);
        if (input) input.value = hex;
        if (hexText) {
          hexText.textContent = hex;
          hexText.classList.remove('is-auto');
        }
        selectRowField(f);
        renderPreview();
        scheduleSave({ silent: true });
      });
    });

    // Форматные кнопки секций в модалке
    root.querySelectorAll<HTMLElement>('.format-btn-section').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const field = btn.dataset.field || '';
        const fmt = btn.dataset.format || '';
        if (activeCardIndexForColors === null) return;
        if (!cards[activeCardIndexForColors].sectionStyles)
          cards[activeCardIndexForColors].sectionStyles = {};
        if (!cards[activeCardIndexForColors].sectionStyles[field])
          cards[activeCardIndexForColors].sectionStyles[field] = {};
        const styles = cards[activeCardIndexForColors].sectionStyles[field]!;
        if (fmt === 'bold') {
          if (styles.fontWeight === 'bold') {
            delete styles.fontWeight;
            btn.classList.remove('active');
          } else {
            styles.fontWeight = 'bold';
            btn.classList.add('active');
          }
        } else if (fmt === 'italic') {
          if (styles.fontStyle === 'italic') {
            delete styles.fontStyle;
            btn.classList.remove('active');
          } else {
            styles.fontStyle = 'italic';
            btn.classList.add('active');
          }
        } else if (fmt === 'underline') {
          const d = styles.textDecoration || '';
          if (d.includes('underline')) {
            styles.textDecoration = d.replace('underline', '').trim();
            btn.classList.remove('active');
          } else {
            styles.textDecoration = (d + ' underline').trim();
            btn.classList.add('active');
          }
        } else if (fmt === 'strikethrough') {
          const d = styles.textDecoration || '';
          if (d.includes('line-through')) {
            styles.textDecoration = d.replace('line-through', '').trim();
            btn.classList.remove('active');
          } else {
            styles.textDecoration = (d + ' line-through').trim();
            btn.classList.add('active');
          }
        }
        renderPreview();
        scheduleSave({ silent: true });
        scheduleHistoryPush();
      });
    });

    // Слайдеры размера секций
    root.querySelectorAll<HTMLInputElement>('.size-slider-section').forEach((sl) => {
      sl.addEventListener('input', (e) => {
        e.stopPropagation();
        const field = sl.dataset.field || '';
        const size = Number(sl.value);
        if (activeCardIndexForColors === null) return;
        if (!cards[activeCardIndexForColors].sectionStyles)
          cards[activeCardIndexForColors].sectionStyles = {};
        if (!cards[activeCardIndexForColors].sectionStyles[field])
          cards[activeCardIndexForColors].sectionStyles[field] = {};
        cards[activeCardIndexForColors].sectionStyles[field]!.fontSize = size;
        const sv = $<HTMLElement>(`.size-value-section[data-field="${field}"]`);
        if (sv) sv.textContent = `${size}px`;
        renderPreview();
        scheduleSave({ silent: true });
      });
    });

    // Сброс всех цветов
    resetCardColorsBtn?.addEventListener('click', () => {
      if (activeCardIndexForColors === null) return;
      cards[activeCardIndexForColors].colors = {};
      cards[activeCardIndexForColors].sectionStyles = {};
      MODAL_FIELDS.forEach((f) => {
        const hexText = $<HTMLElement>(`#hex-${f.key}`);
        const input = $<HTMLInputElement>(`#col-${f.key}`);
        if (hexText) {
          hexText.textContent = 'АВТО';
          hexText.classList.add('is-auto');
        }
        if (input) input.value = '#000000';
        root
          .querySelectorAll<HTMLElement>(`.format-btn-section[data-field="${f.key}"]`)
          .forEach((b) => b.classList.remove('active'));
        const sl = $<HTMLInputElement>(`.size-slider-section[data-field="${f.key}"]`);
        const sv = $<HTMLElement>(`.size-value-section[data-field="${f.key}"]`);
        if (sl && sv) {
          sl.value = String(f.defaultSize);
          sv.textContent = `${f.defaultSize}px`;
        }
      });
      renderPreview();
      pushHistory();
      scheduleSave({ silent: true });
      showToast('Все кастомные цвета и стили карточки сброшены');
    });

    // Кнопка «Сбросить стиль слова» — убирает все стили с текущего слова
    $<HTMLButtonElement>('#wordClearBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeCardIndexForWord === null || !activeWordStyles.text || !activeFieldForWord) return;
      const key = `${activeFieldForWord}::${activeWordStyles.text}`;
      delete cards[activeCardIndexForWord].wordStyles?.[key];
      // Сбрасываем активные стили
      activeWordStyles = { text: activeWordStyles.text };
      root.querySelectorAll<HTMLElement>('.format-btn').forEach((b) => b.classList.remove('active'));
      root.querySelectorAll<HTMLElement>('.color-preset').forEach((p) => p.classList.remove('active'));
      if (sizeSlider && sizeValue) {
        sizeSlider.value = '16';
        sizeValue.textContent = '16px';
      }
      renderPreview();
      renderWordStyleList();
      pushHistory();
      scheduleSave({ silent: true });
      showToast('Стиль слова сброшен');
    });

    // Попап слова: форматы
    root.querySelectorAll<HTMLElement>('.format-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fmt = btn.dataset.format || '';
        btn.classList.toggle('active');
        const active = btn.classList.contains('active');
        if (fmt === 'bold') activeWordStyles.fontWeight = active ? 'bold' : 'normal';
        else if (fmt === 'italic') activeWordStyles.fontStyle = active ? 'italic' : 'normal';
        else if (fmt === 'underline') {
          const d = activeWordStyles.textDecoration || '';
          activeWordStyles.textDecoration = active
            ? (d + ' underline').trim()
            : d.replace('underline', '').trim();
        } else if (fmt === 'strikethrough') {
          const d = activeWordStyles.textDecoration || '';
          activeWordStyles.textDecoration = active
            ? (d + ' line-through').trim()
            : d.replace('line-through', '').trim();
        }
        commitWordStyle();
      });
    });

    // Слайдер размера слова
    sizeSlider?.addEventListener('input', () => {
      activeWordStyles.fontSize = Number(sizeSlider.value);
      if (sizeValue) sizeValue.textContent = `${sizeSlider.value}px`;
      commitWordStyle();
    });

    // Цветовые пресеты попапа
    root.querySelectorAll<HTMLElement>('.color-preset[data-color]').forEach((p) => {
      p.addEventListener('click', (e) => {
        e.stopPropagation();
        root
          .querySelectorAll<HTMLElement>('.color-preset')
          .forEach((x) => x.classList.remove('active'));
        p.classList.add('active');
        activeWordStyles.color = p.dataset.color || '';
        commitWordStyle();
      });
    });

    // Сворачивание секций попапа
    root.querySelectorAll<HTMLElement>('.popup-section-title').forEach((title) => {
      title.addEventListener('click', () => {
        title.closest('.popup-section')?.classList.toggle('collapsed');
      });
    });

    // фикс #24: закрытие попапа при клике вне (но не по сайдбару/модалке/интерактивным элементам)
    addDoc('click', (e) => {
      if (!wordStylePopup?.classList.contains('active')) return;
      const t = e.target as HTMLElement;
      if (wordStylePopup.contains(t)) return;
      if (editorSidebar?.contains(t)) return;
      if (colorModal?.contains(t)) return;
      if (t.closest('.cc-styled-word')) return;
      if (t.closest('input, textarea, select, button')) {
        // не закрываем при клике по интерактивным элементам управления
        return;
      }
      closeWordStylePopup();
    });

    // Escape
    addDoc('keydown', (e) => {
      if (e.key === 'Escape') {
        if (wordStylePopup?.classList.contains('active')) {
          closeWordStylePopup();
        } else if (colorModal?.classList.contains('active')) {
          closeColorModal();
        }
      }
      // фикс #31: горячие клавиши
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveCardsToLocalStorage({ silent: false });
      } else if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
      } else if (mod && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        redo();
      }
    });

    // фикс #21: сохранение при закрытии вкладки
    window.addEventListener('beforeunload', saveOnUnload);
  }

  function saveOnUnload(): void {
    saveCardsToLocalStorage({ silent: true });
  }

  /* ---------- Инициализация (с защитой) ---------- */
  guard('loadCardsFromLocalStorage', loadCardsFromLocalStorage);
  guard('bindStatic', bindStatic);
  guard('renderEditor', renderEditor);
  guard('renderPreview', renderPreview);
  // Стартовый снимок истории
  history = [snapshot()];
  histIndex = 0;
  updateUndoRedoButtons();
  // Сайдбар открыт на desktop, скрыт на mobile (как в Linear/Vercel)
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
    setSidebarOpen(true);
  } else {
    setSidebarOpen(false);
  }
  console.log('[Cardcraft] Initialized successfully:', cards.length, 'cards loaded');

  // Возврат функции очистки (для React Strict Mode в dev)
  return () => {
    docListeners.forEach(({ type, fn }) => document.removeEventListener(type, fn));
    window.removeEventListener('beforeunload', saveOnUnload);
    window.removeEventListener('error', errorHandler);
    window.removeEventListener('unhandledrejection', unhandledRejection);
    if (saveTimer) clearTimeout(saveTimer);
    if (historyTimer) clearTimeout(historyTimer);
    if (toastTimer) clearTimeout(toastTimer);
  };
}
