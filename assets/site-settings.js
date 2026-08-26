/* ECHOES — shared site settings (background / contrast / text size).
 *
 * Applies to the informational pages only — index.html, rules.html,
 * echo-events.html, assets.html. Mini-game pages keep their fixed
 * gradient-glow background always. terminal.html keeps its own CRT
 * theme always.
 *
 * Usage:
 *   1. Put `<script src="assets/site-settings.js"></script>` as the
 *      FIRST thing inside <head> (before the page's own <style> block)
 *      so saved settings apply before first paint, with no flash.
 *   2. Somewhere on the page — bottom of the sidebar nav, or in the
 *      footer — add an empty `<div id="echo-settings-slot"></div>`.
 *      The gear icon gets injected there once the DOM is ready.
 *
 * Everything (options, look, behavior) lives in this one file, so it
 * only needs editing once to change on every page that includes it.
 */
(function(){
  var STORE_KEY = 'echoSiteSettings';

  var BACKGROUNDS = {
    flat: { label: 'Flat Dark', value: '#0a0c0f' },
    gradient: {
      label: 'Gradient Glow',
      value: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(79,195,247,0.06) 0%, transparent 60%), '
        + 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(232,115,42,0.06) 0%, transparent 60%), '
        + 'linear-gradient(160deg, #030508 0%, #070b12 45%, #05080d 100%)'
    },
    black: { label: 'Pure Black', value: '#000000' }
  };
  var BG_ORDER = ['flat', 'gradient', 'black'];

  var CONTRAST = {
    normal: { label: 'Normal', filter: 'none' },
    high: { label: 'High', filter: 'contrast(1.2) brightness(1.08)' }
  };
  var CONTRAST_ORDER = ['normal', 'high'];

  var TEXT_SIZES = {
    small: { label: 'A', zoom: '0.9', px: '12px' },
    medium: { label: 'A', zoom: '1', px: '15px' },
    large: { label: 'A', zoom: '1.15', px: '19px' }
  };
  var TEXT_ORDER = ['small', 'medium', 'large'];

  var DEFAULTS = { bg: 'flat', contrast: 'normal', textSize: 'medium' };

  function load(){
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      var parsed = JSON.parse(raw);
      return {
        bg: BACKGROUNDS[parsed.bg] ? parsed.bg : DEFAULTS.bg,
        contrast: CONTRAST[parsed.contrast] ? parsed.contrast : DEFAULTS.contrast,
        textSize: TEXT_SIZES[parsed.textSize] ? parsed.textSize : DEFAULTS.textSize
      };
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function save(settings){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  function apply(settings){
    var html = document.documentElement;
    html.style.setProperty('--bg', BACKGROUNDS[settings.bg].value);
    html.style.filter = CONTRAST[settings.contrast].filter;
    html.style.zoom = TEXT_SIZES[settings.textSize].zoom;
  }

  var settings = load();
  apply(settings);

  function buildPanel(){
    var slot = document.getElementById('echo-settings-slot');
    if (!slot) return;

    var CSS = ''
      + '.echo-settings-gear{background:transparent;border:1px solid rgba(255,255,255,0.18);border-radius:50%;'
      + 'width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;'
      + 'color:rgba(255,255,255,0.5);transition:color 0.15s,border-color 0.15s;padding:0;}'
      + '.echo-settings-gear:hover,.echo-settings-gear.active{color:var(--accent,#E8732A);border-color:var(--accent,#E8732A);}'
      + '.echo-settings-gear svg{width:15px;height:15px;}'
      + '#echo-settings-panel{position:fixed;bottom:16px;right:16px;z-index:99999;width:210px;'
      + 'background:rgba(10,12,15,0.95);border:1px solid rgba(232,115,42,0.4);border-radius:4px;padding:12px 14px;'
      + 'font-family:"Share Tech Mono",monospace;display:none;}'
      + '#echo-settings-panel.open{display:block;}'
      + '#echo-settings-panel .es-label{font-size:9px;letter-spacing:0.14em;text-transform:uppercase;'
      + 'color:rgba(255,255,255,0.4);margin-bottom:6px;}'
      + '#echo-settings-panel .es-group{margin-bottom:12px;}'
      + '#echo-settings-panel .es-group:last-child{margin-bottom:0;}'
      + '#echo-settings-panel .es-row{display:flex;gap:5px;}'
      + '#echo-settings-panel .es-btn{flex:1;font-family:"Share Tech Mono",monospace;font-size:9px;'
      + 'letter-spacing:0.04em;text-transform:uppercase;color:var(--accent,#E8732A);background:transparent;'
      + 'border:1px solid var(--accent,#E8732A);border-radius:2px;padding:6px 4px;cursor:pointer;text-align:center;}'
      + '#echo-settings-panel .es-btn:hover{background:rgba(232,115,42,0.12);}'
      + '#echo-settings-panel .es-btn.active{background:var(--accent,#E8732A);color:#0a0c0f;font-weight:bold;}'
      + '#echo-settings-panel .es-btn.es-a-small{font-size:11px;}'
      + '#echo-settings-panel .es-btn.es-a-medium{font-size:14px;}'
      + '#echo-settings-panel .es-btn.es-a-large{font-size:18px;}'
      + '#echo-settings-panel .es-sep{height:1px;background:rgba(255,255,255,0.1);margin:0 0 10px;}';

    var styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    var gear = document.createElement('button');
    gear.className = 'echo-settings-gear';
    gear.setAttribute('aria-label', 'Site settings');
    gear.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
      + '<circle cx="12" cy="12" r="3"/>'
      + '<path d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10a1.65 1.65 0 0 0 1-1.51V4a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10a1.65 1.65 0 0 0 1.51 1H20a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
      + '</svg>';

    var panel = document.createElement('div');
    panel.id = 'echo-settings-panel';

    function group(label, order, table, key, applyFn, extraClass){
      var wrap = document.createElement('div');
      wrap.className = 'es-group';
      var lab = document.createElement('div');
      lab.className = 'es-label';
      lab.textContent = '// ' + label;
      var row = document.createElement('div');
      row.className = 'es-row';
      order.forEach(function(id){
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'es-btn' + (extraClass ? ' ' + extraClass + id : '') + (settings[key] === id ? ' active' : '');
        btn.textContent = table[id].label;
        btn.addEventListener('click', function(){
          settings[key] = id;
          apply(settings);
          save(settings);
          row.querySelectorAll('.es-btn').forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
        });
        row.appendChild(btn);
      });
      wrap.appendChild(lab);
      wrap.appendChild(row);
      return wrap;
    }

    panel.appendChild(group('Background', BG_ORDER, BACKGROUNDS, 'bg'));
    var sep1 = document.createElement('div'); sep1.className = 'es-sep'; panel.appendChild(sep1);
    panel.appendChild(group('Contrast', CONTRAST_ORDER, CONTRAST, 'contrast'));
    var sep2 = document.createElement('div'); sep2.className = 'es-sep'; panel.appendChild(sep2);
    panel.appendChild(group('Text Size', TEXT_ORDER, TEXT_SIZES, 'textSize', null, 'es-a-'));

    gear.addEventListener('click', function(){
      panel.classList.toggle('open');
      gear.classList.toggle('active', panel.classList.contains('open'));
    });
    document.addEventListener('click', function(e){
      if (!panel.contains(e.target) && e.target !== gear && !gear.contains(e.target)){
        panel.classList.remove('open');
        gear.classList.remove('active');
      }
    });

    slot.appendChild(gear);
    document.body.appendChild(panel);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', buildPanel);
  } else {
    buildPanel();
  }
})();
