/**
 * Тестовый сценарий для Agent Browser — проверка ключевых потоков Cardcraft.
 * Запускается через agent-browser eval с встроенным тестовым набором.
 *
 * Использование: agent-browser open http://localhost:3000 && agent-browser eval "$(cat tests/smoke-test.js)"
 */
(function testCardcraft() {
  'use strict';
  var results = [];
  var passed = 0;
  var failed = 0;

  function assert(name, cond, detail) {
    if (cond) {
      passed++;
      results.push('  ✓ ' + name);
    } else {
      failed++;
      results.push('  ✗ ' + name + (detail ? ' — ' + detail : ''));
    }
  }

  function q(s) { return document.querySelector(s); }
  function qa(s) { return document.querySelectorAll(s); }

  try {
    results.push('=== CARDCRAFT SMOKE TEST ===');

    // 1. Структура DOM
    assert('Top bar существует', !!q('.top-bar'));
    assert('Brand "Cardcraft" существует', q('.brand-name')?.textContent === 'Cardcraft');
    assert('Toggle в top bar (не плавающий)', !!q('.top-bar .sidebar-toggle') && !q('.toggle-sidebar-btn'));
    assert('Sidebar существует', !!q('#editorSidebar'));
    assert('Workspace существует', !!q('#previewWorkspace'));
    assert('Cards area существует', !!q('#cardsArea'));
    assert('Modal существует', !!q('#colorModal'));
    assert('Word popup существует', !!q('#wordStylePopup'));
    assert('Toast существует', !!q('#toast'));

    // 2. Нет эмодзи в UI chrome
    var uiText = (q('.top-bar')?.textContent || '') + (q('.editor-sidebar')?.textContent || '');
    var emojiPattern = /[\u{1F300}-\u{1F9FF}]|✨|🎨|📐|💾|📋/u;
    assert('Нет эмодзи в top bar и sidebar', !emojiPattern.test(uiText), uiText.substring(0, 80));

    // 3. На desktop сайдбар уже открыт при загрузке
    var sidebarInitiallyOpen = !q('#editorSidebar').classList.contains('collapsed');
    assert('Сайдбар открыт на desktop при загрузке', sidebarInitiallyOpen);
    // Тестируем toggle: закрываем, потом открываем
    q('#toggleSidebarBtn').click();
    assert('Toggle закрывает сайдбар', q('#editorSidebar').classList.contains('collapsed'));
    q('#toggleSidebarBtn').click();
    assert('Toggle открывает сайдбар', !q('#editorSidebar').classList.contains('collapsed'));

    // 4. Карточка рендерится
    assert('Превью карточки рендерится', qa('.card').length >= 1);
    assert('Тег карточки содержит "01"', /01/.test(q('.tag')?.textContent || ''));

    // 5. Заполним первую карточку (state-independent: работаем с тем что есть)
    var titleInput = qa('input[data-field="title"]')[0];
    if (titleInput) {
      titleInput.value = 'Тестовый заголовок';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    assert('Заголовок обновляется в превью', q('.card-title')?.textContent === 'Тестовый заголовок');
    // Проверяем плейсхолдер именно первой карточки
    var firstCard = q('.card');
    var firstCardHint = firstCard?.querySelector('.card-empty-hint');
    assert('Плейсхолдер исчезает при заполнении', !firstCardHint);

    // 6. Добавление карточки
    var before = qa('.card').length;
    q('#addCardBtn').click();
    assert('Карточка добавляется', qa('.card').length === before + 1);
    var expectedBadge = (before + 1) === 1 ? '1 карточка' : (before + 1) <= 4 ? (before + 1) + ' карточки' : (before + 1) + ' карточек';
    assert('Бейдж счётчика обновляется', q('#cardCountBadge')?.textContent.trim() === expectedBadge,
      'got "' + q('#cardCountBadge')?.textContent.trim() + '" expected "' + expectedBadge + '"');

    // 7. Структура card editor block
    var block = q('.card-editor-block');
    assert('Card editor block существует', !!block);
    assert('Кнопка Стили — отдельная полноширинная', !!block.querySelector('.btn-card-editor-palette'));
    assert('В header только иконки (нет Стили)', !block.querySelector('.card-editor-header .btn-palette'));
    assert('Кнопка дублировать есть', !!block.querySelector('[data-action="duplicate"]'));
    assert('Кнопки перемещения есть', block.querySelectorAll('[data-action="move"]').length === 2);

    // 8. Проверка геометрии — кнопки не выходят за границу блока
    var blockRect = block.getBoundingClientRect();
    var actions = block.querySelector('.card-editor-actions');
    var actionsRect = actions.getBoundingClientRect();
    var h3Rect = block.querySelector('.card-editor-header h3').getBoundingClientRect();
    assert('Кнопки не выходят за блок', actionsRect.right <= blockRect.right + 1,
      'actions right=' + Math.round(actionsRect.right) + ' block right=' + Math.round(blockRect.right));
    assert('Заголовок не налезает на кнопки', h3Rect.right <= actionsRect.left + 1,
      'h3 right=' + Math.round(h3Rect.right) + ' actions left=' + Math.round(actionsRect.left));

    // 9. Дублирование
    before = qa('.card').length;
    block.querySelector('[data-action="duplicate"]').click();
    assert('Дублирование работает', qa('.card').length === before + 1);

    // 10. Undo
    q('#undoBtn').click();
    assert('Undo работает', qa('.card').length === before);

    // 11. Модалка стилей
    q('[data-action="palette"]').click();
    assert('Модалка открывается', q('#colorModal').classList.contains('active'));
    assert('Заголовок модалки без эмодзи', !/🎨/.test(q('#modalCardTitle')?.textContent));
    assert('Заголовок содержит "Стили"', /Стили/.test(q('#modalCardTitle')?.textContent));

    // listNumber — нет форматных контролов
    var lnRow = q('.color-picker-row[data-row-field="listNumber"]');
    assert('listNumber без форматных контролов', lnRow?.querySelectorAll('.format-btn-section').length === 0);
    assert('title имеет форматные контролы', q('.color-picker-row[data-row-field="title"]')?.querySelectorAll('.format-btn-section').length === 4);

    // Закрыть модалку
    q('#applyColorsBtn').click();
    assert('Модалка закрывается', !q('#colorModal').classList.contains('active'));

    // 12. Смена темы
    var ts = q('#themeSelect');
    ts.value = 'obsidian-gold';
    ts.dispatchEvent(new Event('change', { bubbles: true }));
    assert('Тема применяется к workspace', q('#previewWorkspace').getAttribute('data-theme') === 'obsidian-gold');

    // 13. Стилизация слов — ТОЛЬКО в превью, не в полях ввода редактора
    // 13a. Сначала убедимся, что dblclick в поле ввода редактора НЕ открывает попап
    var editorInput = qa('input[data-field="title"]')[0] || qa('textarea[data-field="title"]')[0];
    if (editorInput) {
      editorInput.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    }
    assert('Dblclick в поле редактора НЕ открывает попап', !q('#wordStylePopup').classList.contains('active'));

    // 13b. Dblclick в превью — открывает попап
    var titleEl = q('.card-title');
    if (titleEl) {
      var tn = titleEl.firstChild;
      var word = 'заголовок';
      var idx = titleEl.textContent.toLowerCase().indexOf(word);
      if (idx !== -1 && tn) {
        var range = document.createRange();
        range.setStart(tn, idx);
        range.setEnd(tn, idx + word.length);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        titleEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      }
    }
    assert('Попап слова открывается из превью', q('#wordStylePopup').classList.contains('active'));
    assert('Заголовок попапа показывает слово', !!q('#wordPopupHeader')?.textContent.trim());

    // Применить жирный
    var boldBtn = q('#wordStylePopup .format-btn[data-format="bold"]');
    if (boldBtn) boldBtn.click();
    assert('Стиль слова применяется', !!q('.card-title .cc-styled-word'));

    // Сброс стиля слова
    q('#wordClearBtn')?.click();
    assert('Сброс стиля слова работает', !q('.card-title .cc-styled-word'));

    // 14. Экспорт/импорт кнопки имеют SVG (не эмодзи)
    assert('Undo имеет SVG', !!q('#undoBtn svg'));
    assert('Redo имеет SVG', !!q('#redoBtn svg'));
    assert('Export имеет SVG', !!q('#exportJsonBtn svg'));
    assert('Import имеет SVG', !!q('#importJsonBtn svg'));

    // 15. Удаление карточки
    before = qa('.card').length;
    if (before > 1) {
      q('[data-action="delete"]')?.click();
      assert('Удаление работает', qa('.card').length === before - 1);
    } else {
      results.push('  ⚠ Удаление пропущено (одна карточка)');
    }

    results.push('');
    results.push('=== ИТОГ: ' + passed + ' passed, ' + failed + ' failed ===');
    console.log(results.join('\n'));
    return JSON.stringify({ passed: passed, failed: failed, results: results });
  } catch (err) {
    results.push('  ✗ FATAL: ' + err.message);
    console.error(results.join('\n'));
    return JSON.stringify({ passed: passed, failed: failed + 1, results: results, error: err.message });
  }
})();
