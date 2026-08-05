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
    label: 'Светлые темы',
    themes: [
      { value: 'default', label: '1. Clean Minimal (Notion / Apple)' },
      { value: 'editorial-paper', label: '2. Editorial Warm Paper' },
      { value: 'pastel-gradient', label: '3. Soft Pastel Gradient' },
      { value: 'fresh-mint', label: '4. Fresh Sage Mint' },
      { value: 'warm-peach', label: '5. Warm Peach Sunset' },
      { value: 'neo-brutalist', label: '6. Neo-Brutalist' },
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
    label: 'Тёмные темы',
    themes: [
      { value: 'dark-slate', label: '7. Dark Slate Cyan' },
      { value: 'obsidian-gold', label: '8. Obsidian Gold' },
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
  {
    label: 'Градиентные темы',
    themes: [
      { value: 'grad-aurora', label: '49. Aurora' },
      { value: 'grad-sunset-glow', label: '50. Sunset Glow' },
      { value: 'grad-ocean-depth', label: '51. Ocean Depth' },
      { value: 'grad-peach-sorbet', label: '52. Peach Sorbet' },
      { value: 'grad-mint-lagoon', label: '53. Mint Lagoon' },
      { value: 'grad-lavender-mist', label: '54. Lavender Mist' },
      { value: 'grad-golden-sand', label: '55. Golden Sand' },
      { value: 'grad-rose-gold', label: '56. Rose Gold' },
      { value: 'grad-midnight-sky', label: '57. Midnight Sky' },
      { value: 'grad-coral-blaze', label: '58. Coral Blaze' },
      { value: 'grad-forest-mist', label: '59. Forest Mist' },
      { value: 'grad-berry-smoothie', label: '60. Berry Smoothie' },
      { value: 'grad-desert-dawn', label: '61. Desert Dawn' },
      { value: 'grad-glacier', label: '62. Glacier' },
      { value: 'grad-volcanic', label: '63. Volcanic' },
      { value: 'grad-cotton-sky', label: '64. Cotton Sky' },
      { value: 'grad-emerald-night', label: '65. Emerald Night' },
      { value: 'grad-amber-warmth', label: '66. Amber Warmth' },
      { value: 'grad-frost-berry', label: '67. Frost Berry' },
      { value: 'grad-cosmic-dust', label: '68. Cosmic Dust' },
      { value: 'grad-aurora-borealis', label: '69. Aurora Borealis' },
      { value: 'grad-sakura-bloom', label: '70. Sakura Bloom' },
      { value: 'grad-deep-ocean', label: '71. Deep Ocean' },
      { value: 'grad-warm-sunset', label: '72. Warm Sunset' },
      { value: 'grad-northern-lights', label: '73. Northern Lights' },
      { value: 'grad-rose-quartz-dream', label: '74. Rose Quartz Dream' },
      { value: 'grad-amber-glow', label: '75. Amber Glow' },
      { value: 'grad-mint-fresh', label: '76. Mint Fresh' },
      { value: 'grad-twilight-blaze', label: '77. Twilight Blaze' },
      { value: 'grad-ice-crystal', label: '78. Ice Crystal' },
      { value: 'grad-velvet-night', label: '79. Velvet Night' },
      { value: 'grad-citrus-burst', label: '80. Citrus Burst' },
      { value: 'grad-storm-cloud', label: '81. Storm Cloud' },
      { value: 'grad-tropical-paradise', label: '82. Tropical Paradise' },
      { value: 'grad-wine-cellar', label: '83. Wine Cellar' },
      { value: 'grad-frost-morning', label: '84. Frost Morning' },
      { value: 'grad-neon-pulse', label: '85. Neon Pulse' },
      { value: 'grad-earth-tones', label: '86. Earth Tones' },
      { value: 'grad-mystic-forest', label: '87. Mystic Forest' },
      { value: 'grad-pearl-shimmer', label: '88. Pearl Shimmer' },
    ],
  },
  {
    label: 'Без фона',
    themes: [
      { value: 'nobg-dark', label: '89. Тёмный текст (для светлого фона)' },
      { value: 'nobg-light', label: '90. Светлый текст (для тёмного фона)' },
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
  listNumber: 'Цвет цифры',
  listNumBg: 'Цвет фона фигуры',
  listNumBorder: 'Цвет рамки фигуры',
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
  { key: 'listNumber', label: 'Цвет цифры', defaultSize: 16, hasStyleControls: false },
  { key: 'listNumBg', label: 'Цвет фона фигуры', defaultSize: 16, hasStyleControls: false },
  { key: 'listNumBorder', label: 'Цвет рамки фигуры', defaultSize: 16, hasStyleControls: false },
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

  /* ---------- Измерение производительности ---------- */
  const perfEnabled = typeof performance !== 'undefined' && performance.mark;
  const perfCounts: Record<string, number> = {};
  const perfTimes: Record<string, number> = {};
  function perfMark(label: string): () => void {
    if (!perfEnabled) return () => {};
    const start = performance.now();
    return () => {
      const dur = performance.now() - start;
      perfCounts[label] = (perfCounts[label] || 0) + 1;
      perfTimes[label] = (perfTimes[label] || 0) + dur;
      if (dur > 16) {
        // Логируем только медленные вызовы (> 1 кадр)
        console.warn('[Cardcraft:perf] Slow ' + label + ': ' + dur.toFixed(1) + 'ms');
      }
    };
  }
  function perfReport(): void {
    if (!perfEnabled) return;
    Object.keys(perfCounts).forEach((label) => {
      const count = perfCounts[label];
      const avg = (perfTimes[label] / count).toFixed(1);
      console.log('[Cardcraft:perf] ' + label + ': ' + count + ' calls, avg ' + avg + 'ms');
    });
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
  const themeDropdown = $<HTMLElement>('#themeDropdown');
  const themeDropdownTrigger = $<HTMLButtonElement>('#themeDropdownTrigger');
  const themeDropdownLabel = $<HTMLElement>('#themeDropdownLabel');
  const gradientAngleSlider = $<HTMLInputElement>('#gradientAngleSlider');
  const gradientAngleValue = $<HTMLElement>('#gradientAngleValue');
  const numberingToggle = $<HTMLInputElement>('#numberingToggle');
  const progressBarToggle = $<HTMLInputElement>('#progressBarToggle');
  const progressBarStyleSelect = $<HTMLSelectElement>('#progressBarStyleSelect');
  const listStyleSelect = $<HTMLSelectElement>('#listStyleSelect');
  const charLimitToggle = $<HTMLInputElement>('#charLimitToggle');
  const charCounter = $<HTMLElement>('#charCounter');
  const charCounterText = $<HTMLElement>('#charCounterText');
  const listNumSizeSlider = $<HTMLInputElement>('#listNumSizeSlider');
  const listNumSizeValue = $<HTMLElement>('#listNumSizeValue');
  const resizeDividerH = $<HTMLElement>('#resizeDividerH');
  const resizeDividerV = $<HTMLElement>('#resizeDividerV');
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
  const saveAllBtn = $<HTMLButtonElement>('#saveAll');
  const deleteAllBtn = $<HTMLButtonElement>('#deleteAllBtn');
  const confirmOverlay = $<HTMLElement>('#confirmOverlay');
  const confirmOk = $<HTMLButtonElement>('#confirmOk');
  const confirmCancel = $<HTMLButtonElement>('#confirmCancel');
  const undoBtn = $<HTMLButtonElement>('#undoBtn');
  const redoBtn = $<HTMLButtonElement>('#redoBtn');
  const modalCardThemeDropdown = $<HTMLElement>('#modalCardThemeDropdown');
  const modalCardThemeTrigger = $<HTMLButtonElement>('#modalCardThemeTrigger');
  const modalCardThemeLabel = $<HTMLElement>('#modalCardThemeLabel');
  const wordPopupHeader = $<HTMLElement>('#wordPopupHeader');
  const cardCountBadge = $<HTMLElement>('#cardCountBadge');

  /* ---------- Состояние ---------- */
  let cards: Card[] = [createEmptyCard()];
  let currentTheme = 'default';
  let currentFormat = 'auto';
  let gradientAngle = 135; // угол градиента для градиентных тем (0-360)
  let showCardNumbers = true; // Task 7: отображение нумерации карточек
  let showProgressBar = true; // Улучшение#5: отдельный переключатель шкалы прогресса
  let progressBarStyle = 'default'; // стиль шкалы прогресса
  let listStyleType = 'numbers'; // Task 9: стиль списков (numbers/bullets/dashes/circles/squares/decorative)
  let charLimitEnabled = false; // ограничение символов для соцсетей

  // Лимиты символов по форматам
  const FORMAT_CHAR_LIMITS: Record<string, number> = {
    'aspect-4-5': 2200,   // Instagram
    'telegram': 2048,
    'whatsapp': 700,
    'vk': 200,
    'aspect-9-16': 2200,  // Stories — same as Instagram
  };
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
        localStorage.setItem('flashcard-show-numbers', String(showCardNumbers));
        localStorage.setItem('flashcard-show-progress', String(showProgressBar));
        localStorage.setItem('flashcard-progress-style', progressBarStyle);
        localStorage.setItem('flashcard-list-style', listStyleType);
        localStorage.setItem('flashcard-gradient-angle', String(gradientAngle));
        localStorage.setItem('flashcard-char-limit', String(charLimitEnabled));
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
    const savedShowNumbers = localStorage.getItem('flashcard-show-numbers');
    const savedShowProgress = localStorage.getItem('flashcard-show-progress');
    const savedProgressBarStyle = localStorage.getItem('flashcard-progress-style');
    const savedListStyle = localStorage.getItem('flashcard-list-style');
    const savedGradientAngle = localStorage.getItem('flashcard-gradient-angle');
    const savedCharLimit = localStorage.getItem('flashcard-char-limit');
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
    if (savedShowNumbers !== null) {
      showCardNumbers = savedShowNumbers === 'true';
      if (numberingToggle) numberingToggle.checked = showCardNumbers;
    }
    if (savedShowProgress !== null) {
      showProgressBar = savedShowProgress === 'true';
      if (progressBarToggle) progressBarToggle.checked = showProgressBar;
    }
    if (savedProgressBarStyle) {
      progressBarStyle = savedProgressBarStyle;
      if (progressBarStyleSelect) progressBarStyleSelect.value = savedProgressBarStyle;
    }
    if (savedListStyle) {
      listStyleType = savedListStyle;
      if (listStyleSelect) listStyleSelect.value = savedListStyle;
    }
    if (savedGradientAngle) {
      gradientAngle = Number(savedGradientAngle) || 135;
      if (gradientAngleSlider) gradientAngleSlider.value = String(gradientAngle);
      if (gradientAngleValue) gradientAngleValue.textContent = `${gradientAngle}°`;
    }
    if (savedCharLimit !== null) {
      charLimitEnabled = savedCharLimit === 'true';
      if (charLimitToggle) charLimitToggle.checked = charLimitEnabled;
    }
    applyThemeToWorkspace();
    applyNumberingVisibility();
    applyProgressBarVisibility();
    applyListStyle();
    applyProgressBarStyle();
    applyCharLimit();
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
    applyGradientAngle();
    syncThemeDropdown();
  }

  /* ---------- Применение угла градиента ---------- */
  // Устанавливает CSS-переменную --gradient-angle на workspace.
  // Градиентные темы используют calc() с этой переменной для динамического угла.
  function applyGradientAngle(): void {
    if (!previewWorkspace) return;
    previewWorkspace.style.setProperty('--gradient-angle', `${gradientAngle}deg`);
  }

  /* ---------- Task 7: Применение отображения нумерации карточек ---------- */
  function applyNumberingVisibility(): void {
    if (!root) return;
    root.classList.toggle('no-card-numbers', !showCardNumbers);
  }

  /* ---------- Применение видимости и стиля шкалы прогресса ---------- */
  function applyProgressBarVisibility(): void {
    if (!root) return;
    root.classList.toggle('no-progress-bar', !showProgressBar);
  }
  function applyProgressBarStyle(): void {
    if (!root) return;
    root.setAttribute('data-progress-style', progressBarStyle);
  }

  /* ---------- Генерация HTML шкалы прогресса ---------- */
  // Для bar-стилей (solid, dashed) — fill bar
  // Для shape-стилей (circles, squares, diamonds, hexagons, stars) — N дискретных элементов
  function buildProgressBarHtml(index: number, total: number): string {
    const isShapeStyle = ['circles', 'squares', 'diamonds', 'hexagons', 'stars'].includes(progressBarStyle);
    if (isShapeStyle) {
      const items: string[] = [];
      for (let i = 0; i < total; i++) {
        const filled = i <= index;
        items.push(`<span class="ps-item${filled ? ' filled' : ''}"></span>`);
      }
      return `<div class="progress progress-shapes">${items.join('')}</div>`;
    }
    // bar-стиль (solid, dashed)
    const percent = Math.round(((index + 1) / total) * 100);
    return `<div class="progress"><div class="progress-fill" style="width:${percent}%;"></div></div>`;
  }

  /* ---------- Применение ограничения символов ---------- */
  function applyCharLimit(): void {
    if (!editorCardsList) return;
    const limit = charLimitEnabled ? (FORMAT_CHAR_LIMITS[currentFormat] || 0) : 0;
    editorCardsList.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[data-field], textarea[data-field]').forEach((el) => {
      if (limit > 0) {
        el.setAttribute('maxlength', String(limit));
      } else {
        // Восстанавливаем исходный maxlength из EDITOR_FIELDS
        const field = el.dataset.field;
        const f = EDITOR_FIELDS.find((ef) => ef.key === field);
        if (f) el.setAttribute('maxlength', String(f.maxlength));
      }
    });
    // Скрываем/показываем счётчик
    if (charCounter) {
      charCounter.style.display = charLimitEnabled && limit > 0 ? '' : 'none';
    }
  }

  function updateCharCounter(idx: number): void {
    if (!charLimitEnabled || !charCounterText || !charCounter) return;
    const limit = FORMAT_CHAR_LIMITS[currentFormat] || 0;
    if (limit <= 0) {
      charCounter.style.display = 'none';
      return;
    }
    // Считаем общее количество символов во всех текстовых полях карточки
    const card = cards[idx];
    if (!card) return;
    const totalChars =
      (card.title?.length || 0) +
      (card.subtitle?.length || 0) +
      (card.text?.length || 0) +
      (card.listItems?.length || 0) +
      (card.footer?.length || 0) +
      (card.cta?.length || 0);
    charCounterText.textContent = `${totalChars} / ${limit}`;
    charCounter.classList.toggle('near-limit', totalChars >= limit * 0.9);
  }

  /* ---------- Task 9: Применение стиля списков ---------- */
  function applyListStyle(): void {
    if (!root) return;
    root.setAttribute('data-list-style', listStyleType);
  }

  /* ---------- Синхронизация кастомного dropdown темы ---------- */
  function syncThemeDropdown(): void {
    if (!themeDropdownLabel || !themeDropdown) return;
    // Найти label для текущего значения
    let label = '1. Clean Minimal';
    for (const g of THEME_GROUPS) {
      for (const t of g.themes) {
        if (t.value === currentTheme) {
          label = t.label;
          break;
        }
      }
    }
    themeDropdownLabel.textContent = label;
    // Подсветить выбранный элемент
    themeDropdown.querySelectorAll<HTMLElement>('.theme-item').forEach((item) => {
      if (item.dataset.value === currentTheme) item.classList.add('selected');
      else item.classList.remove('selected');
    });
  }

  /* ---------- Рендер редактора ---------- */
  function renderEditor(): void {
    if (!editorCardsList) return;
    editorCardsList.innerHTML = '';
    cards.forEach((card, index) => {
      const block = document.createElement('div');
      block.className = 'card-editor-block';

      const cardTitlePreview = `Карточка ${index + 1}`;

      block.innerHTML = `
        <div class="card-editor-header">
          <button class="btn-icon card-collapse-toggle" data-action="collapse" data-index="${index}" title="Свернуть/развернуть" aria-label="Свернуть" type="button">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="card-editor-title-group">
            <span class="card-editor-num-badge">${index + 1}</span>
            <h3 title="${cardTitlePreview}">${cardTitlePreview}</h3>
          </div>
          <div class="card-editor-actions">
            <button class="btn-icon" data-action="duplicate" data-index="${index}" title="Дублировать" aria-label="Дублировать"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
            <button class="btn-icon" data-action="move" data-index="${index}" data-dir="-1" title="Переместить выше" aria-label="Выше" ${index === 0 ? 'disabled' : ''}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg></button>
            <button class="btn-icon" data-action="move" data-index="${index}" data-dir="1" title="Переместить ниже" aria-label="Ниже" ${index === cards.length - 1 ? 'disabled' : ''}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
            ${cards.length > 1 ? `<button class="btn-delete" data-action="delete" data-index="${index}" title="Удалить карточку" aria-label="Удалить"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>` : ''}
          </div>
        </div>
        <div class="card-editor-body">
          <button class="btn-card-editor-palette" data-action="palette" data-index="${index}" title="Цвета и стили карточки">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
            <span>Стили</span>
          </button>
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
        </div>
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
          // Оптимизация: точечное обновление вместо полной перестройки
          updatePreviewField(idx, field as string);
          // Обновление счётчика символов
          updateCharCounter(idx);
          scheduleSave({ silent: true });
          scheduleHistoryPush();
        });

        // Обновление счётчика при фокусе
        el.addEventListener('focus', function () {
          updateCharCounter(Number(this.dataset.index));
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
          // Оптимизация: точечное обновление вместо полной перестройки
          updatePreviewField(idx, field);
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
      } else if (action === 'collapse') {
        // Сворачивание/разворачивание тела карточки
        btn.addEventListener('click', function () {
          const block = this.closest('.card-editor-block');
          if (!block) return;
          block.classList.toggle('collapsed');
          // Поворачиваем chevron
          const svg = this.querySelector('svg');
          if (svg) svg.style.transform = block.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
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
      }
    });

    // Закрытие dropdown'ов при клике вне обрабатывается в document click handler
  }

  /* ---------- Конфигурация полей для точечного создания/удаления ---------- */
  // Порядок полей внутри каждого контейнера — для корректной вставки
  const FIELD_CONFIG: Record<string, {
    tag: string;
    cls: string;
    container: 'top' | 'bottom';
    order: number;
  }> = {
    title: { tag: 'h2', cls: 'card-title', container: 'top', order: 0 },
    subtitle: { tag: 'p', cls: 'card-subtitle', container: 'top', order: 1 },
    text: { tag: 'p', cls: 'card-text', container: 'top', order: 2 },
    list: { tag: 'ul', cls: 'card-list', container: 'top', order: 3 },
    footer: { tag: 'div', cls: 'card-footer-text', container: 'bottom', order: 0 },
    cta: { tag: 'div', cls: 'accent-btn', container: 'bottom', order: 1 },
  };

  /* ---------- Точечное обновление поля превью (без полной перестройки) ---------- */
  // Оптимизация: при вводе текста обновляем только конкретный элемент,
  // а не перестраиваем весь cardsArea. O(1) вместо O(n) на каждое нажатие.
  // Поддерживает: обновление in-place, создание (empty→content), удаление (content→empty).
  function updatePreviewField(cardIndex: number, field: string): void {
    const end = perfMark('updatePreviewField');
    try {
      const card = cards[cardIndex];
      if (!card || !cardsArea) {
        renderPreview();
        return;
      }
      const cardNode = document.getElementById(`card-node-${card.id}`);
      if (!cardNode) {
        renderPreview();
        return;
      }

      const value = (card[field as keyof Card] as string) || '';

      // listItems → list: специальная обработка (несколько <li>)
      if (field === 'listItems') {
        updatePreviewList(cardNode, card, cardIndex);
        updateEmptyHint(cardNode, card);
        return;
      }

      // БАГ#4: listNumber/listNumBg/listNumBorder/listNumSize — независимые параметры нумерации
      // Обновляем CSS-переменные на существующих .card-list-num элементах
      if (field === 'listNumber' || field === 'listNumBg' || field === 'listNumBorder' || field === 'listNumSize') {
        const nums = cardNode.querySelectorAll<HTMLElement>('.card-list-num');
        const c = card.colors || {};
        nums.forEach((num) => {
          // Цвет цифры
          if (c.listNumber) num.style.setProperty('--num-color', c.listNumber);
          else num.style.removeProperty('--num-color');
          // Цвет фона фигуры
          if (c.listNumBg) num.style.setProperty('--num-bg', c.listNumBg);
          else num.style.removeProperty('--num-bg');
          // Цвет рамки фигуры
          if (c.listNumBorder) num.style.setProperty('--num-border', c.listNumBorder);
          else num.style.removeProperty('--num-border');
          // Размер фигуры
          if (c.listNumSize) num.style.setProperty('--num-size', `${c.listNumSize}px`);
          else num.style.removeProperty('--num-size');
        });
        return;
      }

      const el = cardNode.querySelector<HTMLElement>(`[data-field="${field}"]`);

      // Случай 1: есть контент, элемент существует → обновляем in-place
      if (value && el) {
        const styled = applyWordStylesToText(value, card.wordStyles, field);
        el.innerHTML = field === 'subtitle' || field === 'text' ? styled.replace(/\n/g, '<br>') : styled;
        updateEmptyHint(cardNode, card);
        return;
      }

      // Случай 2: есть контент, элемент НЕ существует → создаём и вставляем
      if (value && !el) {
        createFieldElement(cardNode, card, cardIndex, field, value);
        updateEmptyHint(cardNode, card);
        return;
      }

      // Случай 3: контент пуст, элемент существует → удаляем
      if (!value && el) {
        el.remove();
        updateEmptyHint(cardNode, card);
        return;
      }

      // Случай 4: контент пуст, элемент не существует → ничего не делаем
    } catch (err) {
      console.error('[Cardcraft] Error in updatePreviewField:', err);
      renderPreview();
    } finally {
      end();
    }
  }

  /* ---------- Точечное обновление поля со стилями (без полной перестройки) ---------- */
  // Используется при изменении стилей слова/секции — пересчитывает innerHTML + style
  // только для конкретного поля конкретной карточки. O(1) вместо O(n).
  function updateCardField(cardIndex: number, field: string): void {
    const end = perfMark('updateCardField');
    try {
      const card = cards[cardIndex];
      if (!card || !cardsArea) {
        renderPreview();
        end();
        return;
      }
      const cardNode = document.getElementById(`card-node-${card.id}`);
      if (!cardNode) {
        renderPreview();
        end();
        return;
      }

      // Обновляем секцию списка
      if (field === 'list') {
        updatePreviewList(cardNode, card, cardIndex);
        end();
        return;
      }

      // БАГ#4: listNumber/listNumBg/listNumBorder/listNumSize — независимые параметры нумерации
      // Обновляем CSS-переменные на существующих .card-list-num элементах
      if (field === 'listNumber' || field === 'listNumBg' || field === 'listNumBorder' || field === 'listNumSize') {
        const nums = cardNode.querySelectorAll<HTMLElement>('.card-list-num');
        const c = card.colors || {};
        nums.forEach((num) => {
          if (c.listNumber) num.style.setProperty('--num-color', c.listNumber);
          else num.style.removeProperty('--num-color');
          if (c.listNumBg) num.style.setProperty('--num-bg', c.listNumBg);
          else num.style.removeProperty('--num-bg');
          if (c.listNumBorder) num.style.setProperty('--num-border', c.listNumBorder);
          else num.style.removeProperty('--num-border');
          if (c.listNumSize) num.style.setProperty('--num-size', `${c.listNumSize}px`);
          else num.style.removeProperty('--num-size');
        });
        end();
        return;
      }

      const el = cardNode.querySelector<HTMLElement>(`[data-field="${field}"]`);
      const value = (card[field as keyof Card] as string) || '';

      if (el && value) {
        // Обновляем style attribute (color/fontWeight/fontSize/etc)
        const styleStr = buildSectionStyle(card, field);
        const styleValue = styleStr ? styleStr.replace(/^style="/, '').replace(/"$/, '') : '';
        if (styleValue) el.setAttribute('style', styleValue);
        else el.removeAttribute('style');

        // Пересчитываем innerHTML (стилизация слов могла измениться)
        const styled = applyWordStylesToText(value, card.wordStyles, field);
        el.innerHTML = field === 'subtitle' || field === 'text' ? styled.replace(/\n/g, '<br>') : styled;
      }
      end();
    } catch (err) {
      console.error('[Cardcraft] Error in updateCardField:', err);
      renderPreview();
      end();
    }
  }

  /* ---------- Точечное обновление темы карточки (без полной перестройки) ---------- */
  function updateCardTheme(cardIndex: number): void {
    const end = perfMark('updateCardTheme');
    try {
      const card = cards[cardIndex];
      if (!card) {
        renderPreview();
        end();
        return;
      }
      const cardNode = document.getElementById(`card-node-${card.id}`);
      if (!cardNode) {
        renderPreview();
        end();
        return;
      }
      const cardTheme = card.theme && card.theme !== 'default' ? card.theme : currentTheme;
      if (cardTheme !== 'default') cardNode.setAttribute('data-theme', cardTheme);
      else cardNode.removeAttribute('data-theme');
      end();
    } catch (err) {
      console.error('[Cardcraft] Error in updateCardTheme:', err);
      renderPreview();
      end();
    }
  }

  /* ---------- Создание элемента поля и вставка в правильную позицию ---------- */
  function createFieldElement(
    cardNode: HTMLElement,
    card: Card,
    cardIndex: number,
    field: string,
    value: string,
  ): void {
    const cfg = FIELD_CONFIG[field];
    if (!cfg) {
      // Неизвестное поле — fallback на полную перестройку
      renderPreview();
      return;
    }

    const containerSel = cfg.container === 'top' ? '.card-top-content' : '.card-bottom-content';
    const container = cardNode.querySelector<HTMLElement>(containerSel);
    if (!container) {
      renderPreview();
      return;
    }

    // Создаём элемент
    const el = document.createElement(cfg.tag);
    el.className = cfg.cls;
    el.setAttribute('data-field', field);
    el.setAttribute('data-index', String(cardIndex));

    // Применяем стили секции
    const styleStr = buildSectionStyle(card, field);
    if (styleStr) el.setAttribute('style', styleStr.replace('style="', '').replace(/"$/, ''));

    // Контент
    const styled = applyWordStylesToText(value, card.wordStyles, field);
    el.innerHTML = field === 'subtitle' || field === 'text' ? styled.replace(/\n/g, '<br>') : styled;

    // Находим позицию для вставки: перед следующим существующим полем
    const fieldsInOrder = Object.keys(FIELD_CONFIG)
      .filter((k) => FIELD_CONFIG[k].container === cfg.container)
      .sort((a, b) => FIELD_CONFIG[a].order - FIELD_CONFIG[b].order);

    const myOrder = cfg.order;
    let insertBefore: HTMLElement | null = null;
    for (const f of fieldsInOrder) {
      if (FIELD_CONFIG[f].order > myOrder) {
        const nextEl = container.querySelector<HTMLElement>(`[data-field="${f}"]`);
        // Для list — специальный случай (data-field="list" на .card-list-text, не на ul)
        if (f === 'list') {
          const listEl = container.querySelector<HTMLElement>('.card-list');
          if (listEl) {
            insertBefore = listEl;
            break;
          }
        } else if (nextEl) {
          insertBefore = nextEl;
          break;
        }
      }
    }

    if (insertBefore) {
      container.insertBefore(el, insertBefore);
    } else {
      container.appendChild(el);
    }
  }

  // Перестройка только списка внутри карточки
  function buildListNumStyle(card: Card): string {
    const c = card.colors || {};
    const vars: string[] = [];
    if (c.listNumber) vars.push(`--num-color:${escapeHtml(c.listNumber)}`);
    if (c.listNumBg) vars.push(`--num-bg:${escapeHtml(c.listNumBg)}`);
    if (c.listNumBorder) vars.push(`--num-border:${escapeHtml(c.listNumBorder)}`);
    if (c.listNumSize) vars.push(`--num-size:${escapeHtml(c.listNumSize)}px`);
    return vars.length ? `style="${vars.join(';')}"` : '';
  }

  function updatePreviewList(cardNode: HTMLElement, card: Card, cardIndex: number): void {
    const listStyle = buildSectionStyle(card, 'list');
    const listNumStyle = buildListNumStyle(card);

    let listHtml = '';
    if ((card.listItems || '').trim()) {
      const items = card.listItems.split('\n').filter((i) => i.trim());
      listHtml = items
        .map(
          (it, idx) => `<li class="card-list-item" ${listStyle}>
            <span class="card-list-num" ${listNumStyle}>${idx + 1}</span>
            <span class="card-list-text" ${listStyle} data-field="list" data-index="${cardIndex}">${applyWordStylesToText(it, card.wordStyles, 'list')}</span>
          </li>`,
        )
        .join('');
    }

    const existingList = cardNode.querySelector<HTMLElement>('.card-list');
    const topContent = cardNode.querySelector<HTMLElement>('.card-top-content');

    if (existingList) {
      if (listHtml) {
        existingList.innerHTML = listHtml;
      } else {
        existingList.remove();
      }
    } else if (listHtml && topContent) {
      // Вставляем список в конец top-content
      const ul = document.createElement('ul');
      ul.className = 'card-list';
      ul.innerHTML = listHtml;
      topContent.appendChild(ul);
    }
  }

  // Обновление плейсхолдера пустой карточки
  function updateEmptyHint(cardNode: HTMLElement, card: Card): void {
    const hasContent =
      card.title || card.subtitle || card.text || (card.listItems || '').trim() || card.footer || card.cta;
    const existingHint = cardNode.querySelector<HTMLElement>('.card-empty-hint');
    if (hasContent && existingHint) {
      existingHint.remove();
    } else if (!hasContent && !existingHint) {
      const topContent = cardNode.querySelector<HTMLElement>('.card-top-content');
      if (topContent) {
        const hint = document.createElement('div');
        hint.className = 'card-empty-hint';
        hint.textContent = 'Карточка пуста — заполните поля в редакторе';
        topContent.appendChild(hint);
      }
    }
  }

  /* ---------- Рендер превью (полная перестройка) ---------- */
  function renderPreview(): void {
    const end = perfMark('renderPreview');
    try {
    if (!cardsArea) return;
    cardsArea.innerHTML = '';
    const total = cards.length;

    cards.forEach((card, index) => {
      const cardNum = String(index + 1).padStart(2, '0');
      const totalNum = String(total).padStart(2, '0');
      const progressHtml = buildProgressBarHtml(index, total);

      const titleStyle = buildSectionStyle(card, 'title');
      const subtitleStyle = buildSectionStyle(card, 'subtitle');
      const textStyle = buildSectionStyle(card, 'text');
      const listStyle = buildSectionStyle(card, 'list');
      const listNumStyle = buildListNumStyle(card);
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
                <span class="card-list-num" ${listNumStyle}>${idx + 1}</span>
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
            ${progressHtml}
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
          <button class="btn-card-action" data-action="download" data-card-id="card-node-${card.id}" data-filename="card-${index + 1}.png" title="Скачать" aria-label="Скачать"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
          <button class="btn-card-action" data-action="copy" data-card-id="card-node-${card.id}" title="Копировать" aria-label="Копировать"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
          <button class="btn-card-action btn-card-action-danger" data-action="delete-preview" data-index="${index}" title="Удалить" aria-label="Удалить"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>
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

    // Удаление карточки из превью
    cardsArea.querySelectorAll<HTMLElement>('[data-action="delete-preview"]').forEach((btn) =>
      btn.addEventListener('click', function () {
        const idx = Number(this.dataset.index);
        deleteCard(idx);
      }),
    );

    // Двойной клик по текстовым элементам превью — делегирование событий
    // (работает для текущих и будущих элементов, созданных через createFieldElement)
    if (!cardsArea.__dblclickBound) {
      cardsArea.__dblclickBound = true;
      cardsArea.addEventListener('dblclick', function (e) {
        const target = e.target as HTMLElement;
        const el = target.closest<HTMLElement>('[data-field]');
        if (!el) return;
        const selection = window.getSelection();
        const text = selection ? selection.toString().trim() : '';
        const field = el.dataset.field || '';
        const cardIndex = Number(el.dataset.index);
        if (text.length > 0) {
          const rect = el.getBoundingClientRect();
          openWordStylePopup(rect.left, rect.top + 24, text, field, cardIndex);
        }
        e.stopPropagation();
      });
    }

    // Обновление счётчика карточек в заголовке воркспейса
    if (cardCountBadge) {
      const n = cards.length;
      const word = n === 1 ? 'карточка' : n >= 2 && n <= 4 ? 'карточки' : 'карточек';
      cardCountBadge.textContent = `${n} ${word}`;
      cardCountBadge.style.display = n > 0 ? '' : 'none';
    }
    } catch (err) {
      console.error('[Cardcraft] Error in renderPreview:', err);
    } finally {
      end();
    }
  }

  /* ---------- Действия с карточками ---------- */
  function addCard(): void {
    cards.push(createEmptyCard());
    renderEditor();
    renderPreview();
    // Новая карточка — свёрнутая по умолчанию
    const blocks = editorCardsList?.querySelectorAll<HTMLElement>('.card-editor-block');
    const lastBlock = blocks?.[blocks.length - 1];
    lastBlock?.classList.add('collapsed');
    const chevron = lastBlock?.querySelector<HTMLElement>('.card-collapse-toggle svg');
    if (chevron) chevron.style.transform = 'rotate(-90deg)';
    pushHistory();
    scheduleSave({ silent: true });
    showToast('Карточка добавлена');
  }

  function deleteCard(idx: number): void {
    if (cards.length <= 1) return;
    if (idx < 0 || idx >= cards.length) return;
    cards.splice(idx, 1);
    // Полная перестройка редактора и превью — гарантирует синхронизацию
    // data-index, обработчиков и массива cards
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
    // Синхронизация темы карточки в модалке
    const cardThemeVal = cards[index].theme && cards[index].theme !== 'default' ? cards[index].theme : 'default';
    let cardThemeLbl = 'По умолчанию';
    if (cards[index].theme && cards[index].theme !== 'default') {
      for (const g of THEME_GROUPS) {
        for (const t of g.themes) {
          if (t.value === cardThemeVal) { cardThemeLbl = t.label; break; }
        }
      }
    }
    if (modalCardThemeLabel) modalCardThemeLabel.textContent = cardThemeLbl;
    modalCardThemeDropdown?.querySelectorAll<HTMLElement>('.modal-card-theme-item').forEach((item) => {
      item.classList.toggle('selected', item.dataset.modalCardTheme === cardThemeVal);
    });

    // Синхронизация ползунка размера фигуры нумерации
    const savedNumSize = cards[index].colors?.listNumSize;
    if (listNumSizeSlider) listNumSizeSlider.value = String(savedNumSize || 22);
    if (listNumSizeValue) listNumSizeValue.textContent = `${savedNumSize || 22}px`;
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
  /* ---------- Перетаскивание попапа слова ---------- */
  let dragCleanup: (() => void) | null = null;
  function makeWordPopupDraggable(): void {
    if (!wordStylePopup || !wordPopupHeader) return;
    if (dragCleanup) return; // уже инициализирован

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let popupStartX = 0;
    let popupStartY = 0;

    const onPointerDown = (e: PointerEvent) => {
      // Не начинаем drag при клике по интерактивным элементам внутри header
      if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = wordStylePopup!.getBoundingClientRect();
      popupStartX = rect.left;
      popupStartY = rect.top;
      wordPopupHeader!.style.cursor = 'grabbing';
      wordStylePopup!.style.userSelect = 'none';
      e.preventDefault();
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const pad = 8;
      const rect = wordStylePopup!.getBoundingClientRect();
      let newLeft = popupStartX + dx;
      let newTop = popupStartY + dy;
      // Clamp к viewport
      newLeft = Math.min(Math.max(pad, newLeft), window.innerWidth - rect.width - pad);
      newTop = Math.min(Math.max(pad, newTop), window.innerHeight - rect.height - pad);
      wordStylePopup!.style.left = `${newLeft}px`;
      wordStylePopup!.style.top = `${newTop}px`;
    };

    const onPointerUp = () => {
      isDragging = false;
      if (wordPopupHeader) wordPopupHeader.style.cursor = 'grab';
      wordStylePopup!.style.userSelect = '';
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    wordPopupHeader.style.cursor = 'grab';
    wordPopupHeader.addEventListener('pointerdown', onPointerDown);

    dragCleanup = () => {
      wordPopupHeader.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }

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
        // Точечное обновление поля, к которому принадлежало слово
        const [field] = splitOnce(key, '::');
        if (field) updateCardField(activeCardIndexForWord, field);
        else renderPreview();
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
    // Точечное обновление только конкретного поля карточки
    updateCardField(activeCardIndexForWord, activeFieldForWord);
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

  // Проверка: тема карточки "без фона" (прозрачный экспорт)
  function isNoBgTheme(card: Card): boolean {
    const theme = card.theme && card.theme !== 'default' ? card.theme : currentTheme;
    return theme.startsWith('nobg-');
  }

  async function generateAndDownloadPng(node: HTMLElement, filename: string): Promise<void> {
    try {
      // Для тем "без фона" — экспорт с прозрачным фоном (html-to-image по умолчанию)
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

  /* ---------- Задача#2: Вертикальный resize (высота fixed-header / scroll-area) ---------- */
  let vResizeCleanup: (() => void) | null = null;
  function initVerticalResize(): void {
    if (!resizeDividerH || !editorSidebar || vResizeCleanup) return;
    const fixedHeader = editorSidebar.querySelector<HTMLElement>('.sidebar-fixed-header');
    if (!fixedHeader) return;

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      startY = e.clientY;
      startHeight = fixedHeader.getBoundingClientRect().height;
      resizeDividerH.classList.add('dragging');
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dy = e.clientY - startY;
      const sidebarHeight = editorSidebar!.getBoundingClientRect().height;
      // Минимум 60px для каждой области, максимум — sidebarHeight - 60
      const newHeight = Math.min(Math.max(60, startHeight + dy), sidebarHeight - 60);
      fixedHeader!.style.height = `${newHeight}px`;
      fixedHeader!.style.flex = 'none';
    };

    const onPointerUp = () => {
      isDragging = false;
      resizeDividerH!.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      // Сохраняем высоту
      try {
        localStorage.setItem('flashcard-header-height', String(fixedHeader!.getBoundingClientRect().height));
      } catch {
        /* ignore */
      }
    };

    // Восстанавливаем сохранённую высоту
    try {
      const saved = localStorage.getItem('flashcard-header-height');
      if (saved) {
        const h = Number(saved);
        if (h >= 80) {
          fixedHeader.style.height = `${h}px`;
          fixedHeader.style.flex = 'none';
        }
      }
    } catch {
      /* ignore */
    }

    resizeDividerH.addEventListener('pointerdown', onPointerDown);
    vResizeCleanup = () => {
      resizeDividerH.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }

  /* ---------- БАГ#2: Горизонтальный resize (ширина floating sidebar) ---------- */
  // Sidebar — position: fixed, не влияет на workspace. Resize меняет только ширину панели.
  let hResizeCleanup: (() => void) | null = null;
  function initHorizontalResize(): void {
    if (!resizeDividerV || !editorSidebar || hResizeCleanup) return;

    let isDragging = false;
    let startX = 0;
    let startWidth = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (editorSidebar!.classList.contains('collapsed')) return;
      isDragging = true;
      startX = e.clientX;
      startWidth = editorSidebar!.getBoundingClientRect().width;
      resizeDividerV.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      // Минимум 260px, максимум 520px
      const newWidth = Math.min(Math.max(260, startWidth + dx), 520);
      editorSidebar!.style.width = `${newWidth}px`;
      editorSidebar!.style.transition = 'none';
    };

    const onPointerUp = () => {
      isDragging = false;
      resizeDividerV!.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      editorSidebar!.style.transition = '';
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      // Сохраняем ширину
      try {
        localStorage.setItem('flashcard-sidebar-width', String(editorSidebar!.getBoundingClientRect().width));
      } catch {
        /* ignore */
      }
    };

    // Восстанавливаем сохранённую ширину
    try {
      const saved = localStorage.getItem('flashcard-sidebar-width');
      if (saved) {
        const w = Number(saved);
        if (w >= 260 && w <= 520) {
          editorSidebar.style.width = `${w}px`;
        }
      }
    } catch {
      /* ignore */
    }

    resizeDividerV.addEventListener('pointerdown', onPointerDown);
    hResizeCleanup = () => {
      resizeDividerV.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }

  function bindStatic(): void {
    // Инициализация перетаскивания попапа слова
    makeWordPopupDraggable();

    // Тема / формат (hidden native select change — вызывается программно из dropdown)
    themeSelect?.addEventListener('change', (e) => {
      currentTheme = (e.target as HTMLSelectElement).value;
      applyThemeToWorkspace();
      renderPreview();
      scheduleSave({ silent: true });
    });
    formatSelect?.addEventListener('change', (e) => {
      currentFormat = (e.target as HTMLSelectElement).value;
      applyCharLimit();
      renderPreview();
      scheduleSave({ silent: true });
    });

    // Переключатель лимита символов
    charLimitToggle?.addEventListener('change', function () {
      charLimitEnabled = this.checked;
      applyCharLimit();
      updateCharCounter(0);
      scheduleSave({ silent: true });
    });

    // Ползунок угла градиента — real-time обновление CSS-переменной
    gradientAngleSlider?.addEventListener('input', function () {
      gradientAngle = Number(this.value);
      if (gradientAngleValue) gradientAngleValue.textContent = `${gradientAngle}°`;
      applyGradientAngle();
    });

    // Task 7: Переключатель нумерации карточек
    numberingToggle?.addEventListener('change', function () {
      showCardNumbers = this.checked;
      applyNumberingVisibility();
      scheduleSave({ silent: true });
    });

    // Улучшение#5: Переключатель видимости шкалы прогресса
    progressBarToggle?.addEventListener('change', function () {
      showProgressBar = this.checked;
      applyProgressBarVisibility();
      scheduleSave({ silent: true });
    });

    // Выбор стиля шкалы прогресса
    progressBarStyleSelect?.addEventListener('change', function () {
      progressBarStyle = this.value;
      applyProgressBarStyle();
      // Для shape-стилей нужно перестроить HTML прогресс-бара
      renderPreview();
      scheduleSave({ silent: true });
    });

    // Task 9: Выбор стиля списков
    listStyleSelect?.addEventListener('change', function () {
      listStyleType = this.value;
      applyListStyle();
      scheduleSave({ silent: true });
    });

    // БАГ#4: Ползунок размера фигуры нумерации (круг/квадрат)
    listNumSizeSlider?.addEventListener('input', function () {
      const size = Number(this.value);
      if (listNumSizeValue) listNumSizeValue.textContent = `${size}px`;
      if (activeCardIndexForColors !== null) {
        if (!cards[activeCardIndexForColors].colors) cards[activeCardIndexForColors].colors = {};
        cards[activeCardIndexForColors].colors.listNumSize = String(size);
        updateCardField(activeCardIndexForColors, 'listNumSize');
        scheduleSave({ silent: true });
      }
    });

    // Задача#2: Вертикальный resize (высота верхней/нижней области sidebar)
    initVerticalResize();

    // Задача#3: Горизонтальный resize (ширина sidebar)
    initHorizontalResize();

    // Кастомный аккордеон-dropdown темы: открытие/закрытие
    themeDropdownTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!themeDropdown) return;
      themeDropdown.classList.toggle('open');
      const isOpen = themeDropdown.classList.contains('open');
      themeDropdownTrigger.setAttribute('aria-expanded', String(isOpen));
    });

    // Раскрытие/сворачивание групп
    themeDropdown?.querySelectorAll<HTMLElement>('.theme-group-header').forEach((header) => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const group = header.closest('.theme-group');
        group?.classList.toggle('expanded');
        const isExpanded = group?.classList.contains('expanded');
        header.setAttribute('aria-expanded', String(isExpanded));
      });
    });

    // Выбор темы из dropdown
    themeDropdown?.querySelectorAll<HTMLElement>('.theme-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = item.dataset.value || 'default';
        // Синхронизируем скрытый native select и вызываем change
        if (themeSelect) {
          themeSelect.value = value;
          themeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        // Закрываем dropdown
        themeDropdown?.classList.remove('open');
        themeDropdownTrigger?.setAttribute('aria-expanded', 'false');
      });
    });

    // Кнопки сайдбара
    addCardBtn?.addEventListener('click', addCard);
    saveAllBtn?.addEventListener('click', downloadAllPng);

    // Удалить все — с подтверждением
    deleteAllBtn?.addEventListener('click', () => {
      if (cards.length <= 1) {
        showToast('Нельзя удалить единственную карточку');
        return;
      }
      confirmOverlay?.classList.add('active');
    });
    confirmCancel?.addEventListener('click', () => {
      confirmOverlay?.classList.remove('active');
    });
    confirmOverlay?.addEventListener('click', (e) => {
      if (e.target === confirmOverlay) confirmOverlay?.classList.remove('active');
    });
    confirmOk?.addEventListener('click', () => {
      confirmOverlay?.classList.remove('active');
      // Оставляем одну пустую карточку
      cards = [createEmptyCard()];
      renderEditor();
      renderPreview();
      pushHistory();
      scheduleSave({ silent: true });
      showToast('Все карточки удалены');
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
        // Точечное обновление конкретного поля карточки
        updateCardField(activeCardIndexForColors, f.key);
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
        // Точечное обновление конкретного поля карточки
        updateCardField(activeCardIndexForColors, f);
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
        // Точечное обновление конкретного поля карточки
        updateCardField(activeCardIndexForColors, f);
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
        // Точечное обновление конкретного поля карточки
        updateCardField(activeCardIndexForColors, field);
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
        // Точечное обновление конкретного поля карточки
        updateCardField(activeCardIndexForColors, field);
        scheduleSave({ silent: true });
      });
    });

    // Улучшение#2: Аккордеон в редакторе стилей
    root.querySelectorAll<HTMLElement>('[data-accordion-toggle]').forEach((header) => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const group = header.closest('.modal-accordion-group');
        group?.classList.toggle('expanded');
      });
    });

    // Улучшение: Аккордеоны верхних секций sidebar
    root.querySelectorAll<HTMLElement>('[data-sidebar-toggle]').forEach((header) => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const accordion = header.closest('.sidebar-accordion');
        accordion?.classList.toggle('expanded');
      });
    });

    // Тема карточки в модалке стилей
    modalCardThemeTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      modalCardThemeDropdown?.classList.toggle('open');
    });
    modalCardThemeDropdown?.querySelectorAll<HTMLElement>('.theme-group-header').forEach((header) => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        header.closest('.theme-group')?.classList.toggle('expanded');
      });
    });
    modalCardThemeDropdown?.querySelectorAll<HTMLElement>('.modal-card-theme-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeCardIndexForColors === null) return;
        const val = item.dataset.modalCardTheme || 'default';
        const label = item.dataset.label || 'По умолчанию';
        cards[activeCardIndexForColors].theme = val === 'default' ? undefined : val;
        if (modalCardThemeLabel) modalCardThemeLabel.textContent = label;
        modalCardThemeDropdown?.querySelectorAll('.modal-card-theme-item').forEach((it) => {
          it.classList.toggle('selected', it === item);
        });
        modalCardThemeDropdown?.classList.remove('open');
        updateCardTheme(activeCardIndexForColors);
        pushHistory();
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
      // Точечное обновление всех полей карточки
      MODAL_FIELDS.forEach((f) => updateCardField(activeCardIndexForColors, f.key));
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
      // Точечное обновление конкретного поля карточки
      updateCardField(activeCardIndexForWord, activeFieldForWord);
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
      // Закрытие dropdown темы при клике вне
      const t = e.target as HTMLElement;
      if (themeDropdown?.classList.contains('open') && !themeDropdown.contains(t)) {
        themeDropdown.classList.remove('open');
        themeDropdownTrigger?.setAttribute('aria-expanded', 'false');
      }
      // Закрытие per-card dropdown'ов тем при клике вне
      editorCardsList?.querySelectorAll('.theme-dropdown.open').forEach((d) => {
        if (!d.contains(t)) d.classList.remove('open');
      });
      // Закрытие modal card theme dropdown при клике вне
      if (modalCardThemeDropdown?.classList.contains('open') && !modalCardThemeDropdown.contains(t)) {
        modalCardThemeDropdown.classList.remove('open');
      }

      if (!wordStylePopup?.classList.contains('active')) return;
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
        // Закрываем per-card dropdown'ы тем
        const openCardDropdowns = editorCardsList?.querySelectorAll('.theme-dropdown.open');
        if (openCardDropdowns && openCardDropdowns.length > 0) {
          openCardDropdowns.forEach((d) => d.classList.remove('open'));
        } else if (themeDropdown?.classList.contains('open')) {
          themeDropdown.classList.remove('open');
          themeDropdownTrigger?.setAttribute('aria-expanded', 'false');
        } else if (wordStylePopup?.classList.contains('active')) {
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
  guard('applyCharLimit', applyCharLimit);
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
  // Экспонируем perfReport для тестирования из консоли
  (window as unknown as { cardcraftPerfReport?: () => void }).cardcraftPerfReport = perfReport;

  // Возврат функции очистки (для React Strict Mode в dev)
  return () => {
    docListeners.forEach(({ type, fn }) => document.removeEventListener(type, fn));
    window.removeEventListener('beforeunload', saveOnUnload);
    window.removeEventListener('error', errorHandler);
    window.removeEventListener('unhandledrejection', unhandledRejection);
    if (dragCleanup) dragCleanup();
    if (vResizeCleanup) vResizeCleanup();
    if (hResizeCleanup) hResizeCleanup();
    if (saveTimer) clearTimeout(saveTimer);
    if (historyTimer) clearTimeout(historyTimer);
    if (toastTimer) clearTimeout(toastTimer);
  };
}
