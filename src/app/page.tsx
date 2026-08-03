'use client';

import { useEffect, useRef } from 'react';
import { initCardConstructor, THEME_GROUPS } from '@/lib/card-constructor';
import './card-constructor.css';

const FORMATS = [
  { value: 'auto', label: 'Стандартный (Компактный)' },
  { value: 'aspect-4-5', label: 'Instagram / Telegram (4:5)' },
  { value: 'aspect-9-16', label: 'Stories / Reels (9:16)' },
];

const FORMAT_BTNS = [
  { fmt: 'bold', label: 'B', title: 'Жирный' },
  { fmt: 'italic', label: 'I', title: 'Курсив' },
  { fmt: 'underline', label: 'U', title: 'Подчёркнутый' },
  { fmt: 'strikethrough', label: 'S', title: 'Зачёркнутый' },
];

const MODAL_ROWS = [
  { key: 'title', label: 'Заголовок', defaultSize: 24, hasStyleControls: true },
  { key: 'subtitle', label: 'Подзаголовок', defaultSize: 18, hasStyleControls: true },
  { key: 'text', label: 'Основной текст', defaultSize: 16, hasStyleControls: true },
  { key: 'list', label: 'Список', defaultSize: 16, hasStyleControls: true },
  { key: 'listNumber', label: 'Нумерация списка', defaultSize: 16, hasStyleControls: false },
  { key: 'footer', label: 'Итоговый вывод', defaultSize: 14, hasStyleControls: true },
  { key: 'cta', label: 'Кнопка / CTA', defaultSize: 16, hasStyleControls: true },
];

const PRESETS = [
  '#0f172a', '#4f46e5', '#2563eb', '#059669',
  '#ea580c', '#dc2626', '#ec4899', '#7c3aed',
];

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    return initCardConstructor(rootRef.current);
  }, []);

  return (
    <div className="cc-root" ref={rootRef}>
      <div className="app-layout">
        {/* ================= Сайдбар ================= */}
        <aside className="editor-sidebar collapsed" id="editorSidebar">
          <h1 className="editor-title">✨ Дизайн Карточек</h1>

          <div className="form-group">
            <label htmlFor="themeSelect">🎨 Стиль предпросмотра (48 тем):</label>
            <select id="themeSelect" defaultValue="default">
              {THEME_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.themes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="formatSelect">📐 Формат / Соотношение сторон:</label>
            <select id="formatSelect" defaultValue="auto">
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <hr />

          <div
            id="editorCardsList"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          />

          <button className="btn-add" id="addCardBtn">
            + Добавить карточку
          </button>

          <div className="sidebar-extra-actions">
            <button className="btn-secondary" id="undoBtn" title="Отменить (Ctrl+Z)">
              ↶ Отменить
            </button>
            <button className="btn-secondary" id="redoBtn" title="Повторить (Ctrl+Y)">
              ↷ Повторить
            </button>
            <button className="btn-secondary" id="exportJsonBtn" title="Сохранить в файл">
              ⬆ Экспорт
            </button>
            <button className="btn-secondary" id="importJsonBtn" title="Загрузить из файла">
              ⬇ Импорт
            </button>
            <input
              type="file"
              id="importJsonInput"
              accept="application/json,.json"
              style={{ display: 'none' }}
            />
          </div>

          <button className="btn-primary" id="saveChangesBtn" style={{ marginTop: 12 }}>
            💾 Сохранить изменения
          </button>
        </aside>

        <div className="sidebar-backdrop" id="sidebarBackdrop" />

        <button
          className="toggle-sidebar-btn"
          id="toggleSidebarBtn"
          aria-label="Показать/скрыть панель редактора"
          title="Показать/скрыть панель"
        >
          ☰
        </button>

        {/* ================= Превью ================= */}
        <main className="preview-workspace" id="previewWorkspace">
          <div className="workspace-header">
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              Предпросмотр карточек
            </h2>
            <button className="btn-primary" id="saveAll">
              Скачать все PNG
            </button>
          </div>
          <div className="cards-container" id="cardsArea" />
        </main>
      </div>

      {/* ================= Модалка палитры ================= */}
      <div className="modal-overlay" id="colorModal" role="dialog" aria-modal="true">
        <div className="modal-card">
          <div className="modal-header">
            <h3 id="modalCardTitle">🎨 Настройка стилей карточки</h3>
            <button className="modal-close" id="closeModalBtn" aria-label="Закрыть">
              ×
            </button>
          </div>

          <div className="palette-presets-section">
            <div className="palette-presets-title">
              Быстрые цвета для: <span className="active-target" id="presetTargetLabel">Заголовок</span>
            </div>
            <div className="palette-swatches">
              {PRESETS.map((c) => (
                <div
                  key={c}
                  className="color-swatch"
                  data-preset={c}
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="color-picker-grid">
            {MODAL_ROWS.map((row) => (
              <div className="color-picker-row" data-row-field={row.key} key={row.key}>
                <span className="color-picker-label">{row.label}</span>
                <div className="color-picker-controls">
                  <span className="color-hex-text is-auto" id={`hex-${row.key}`}>
                    АВТО
                  </span>
                  <input
                    type="color"
                    className="color-picker-input"
                    id={`col-${row.key}`}
                    data-field={row.key}
                    aria-label={`Цвет: ${row.label}`}
                  />
                  <button
                    className="btn-reset-single"
                    data-reset={row.key}
                    title="Сбросить цвет"
                    aria-label={`Сбросить цвет: ${row.label}`}
                  >
                    ✕
                  </button>
                </div>
                {row.hasStyleControls && (
                  <div className="section-style-controls">
                    <div className="text-format-controls">
                      {FORMAT_BTNS.map((b) => (
                        <button
                          key={b.fmt}
                          className="format-btn-section"
                          data-field={row.key}
                          data-format={b.fmt}
                          title={b.title}
                          type="button"
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                    <div className="size-control-section">
                      <input
                        type="range"
                        className="size-slider-section"
                        data-field={row.key}
                        min={10}
                        max={48}
                        defaultValue={row.defaultSize}
                      />
                      <span className="size-value-section" data-field={row.key}>
                        {row.defaultSize}px
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" id="resetCardColorsBtn">
              Сбросить всё
            </button>
            <button className="btn-primary" id="applyColorsBtn" style={{ padding: '8px 20px' }}>
              Готово
            </button>
          </div>
        </div>
      </div>

      {/* ================= Попап настройки слова ================= */}
      <div className="word-style-popup" id="wordStylePopup" role="dialog" aria-label="Настройка слова">
        <div className="popup-section">
          <div className="popup-section-title">
            <span>ТЕКСТ</span>
          </div>
          <div className="popup-section-content">
            <div className="text-format-controls">
              {FORMAT_BTNS.map((b) => (
                <button
                  key={b.fmt}
                  className="format-btn"
                  data-format={b.fmt}
                  title={b.title}
                  type="button"
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div className="size-control-section">
              <input type="range" id="sizeSlider" min={10} max={48} defaultValue={16} />
              <span id="sizeValue">16px</span>
            </div>
          </div>
        </div>
        <div className="popup-section">
          <div className="popup-section-title">
            <span>ЦВЕТ</span>
          </div>
          <div className="popup-section-content">
            <div className="color-presets">
              {PRESETS.map((c) => (
                <div
                  key={c}
                  className="color-preset"
                  data-color={c}
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="popup-section">
          <div className="popup-section-title">
            <span>СТИЛИ СЛОВ</span>
          </div>
          <div className="popup-section-content">
            <div id="wordStyleList" className="word-style-list" />
          </div>
        </div>
      </div>

      <div id="toast" className="toast" aria-live="polite" />
    </div>
  );
}
