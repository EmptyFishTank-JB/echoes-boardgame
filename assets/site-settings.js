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

  // `themeColor` is a flat approximation for the mobile browser chrome /
  // Android system nav bar (<meta name="theme-color">), which only
  // accepts a solid color — it can't render `value`'s gradient layers.
  // Without an explicit theme-color, Chrome on Android samples the
  // actual pixel color at the bottom edge of the page to extend into
  // the system nav bar; a gradient's bottom edge isn't a single flat
  // color, so that auto-sampling falls back to white. Stating a color
  // here keeps the nav bar dark for Gradient Glow too.
  var BACKGROUNDS = {
    flat: { label: 'Flat Dark', value: '#0a0c0f', themeColor: '#0a0c0f' },
    gradient: {
      label: 'Gradient Glow',
      // The diagonal sweep is decorative only — the Android system nav
      // bar color comes from the separate background-color declaration
      // in each page's `body` rule (see themeColor / --bg-solid), not
      // from anything about this gradient's shape.
      value: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(79,195,247,0.06) 0%, transparent 60%), '
        + 'radial-gradient(ellipse 70% 50% at 50% 82%, rgba(232,115,42,0.06) 0%, transparent 55%), '
        + 'linear-gradient(160deg, #030508 0%, #070b12 45%, #05080d 82%, #05080d 100%)',
      themeColor: '#05080d'
    },
    black: { label: 'Pure Black', value: '#000000', themeColor: '#000000' }
  };
  var BG_ORDER = ['flat', 'gradient', 'black'];

  // High contrast forces a pure-black background and swaps in a
  // dramatically brightened text palette (overriding whatever --text
  // vars the page itself defines), rather than a blanket CSS filter.
  var CONTRAST = {
    normal: { label: 'Normal' },
    high: {
      label: 'High',
      bg: '#000000',
      text: '#ffffff',
      textDim: '#d6dbe6',
      textBright: '#ffffff'
    }
  };
  var CONTRAST_ORDER = ['normal', 'high'];

  var TEXT_SIZES = {
    small: { label: 'A', zoom: '0.9', px: '12px' },
    medium: { label: 'A', zoom: '1', px: '15px' },
    large: { label: 'A', zoom: '1.15', px: '19px' }
  };
  var TEXT_ORDER = ['small', 'medium', 'large'];

  // Both off by default - purely decorative, opt-in extras.
  var FILM_GRAIN = { off: { label: 'Off' }, on: { label: 'On' } };
  var FILM_GRAIN_ORDER = ['off', 'on'];

  var AUTO_GLITCH = { off: { label: 'Off' }, on: { label: 'On' } };
  var AUTO_GLITCH_ORDER = ['off', 'on'];

  var DEFAULTS = { bg: 'flat', contrast: 'normal', textSize: 'medium', filmGrain: 'off', autoGlitch: 'off' };

  function load(){
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      var parsed = JSON.parse(raw);
      return {
        bg: BACKGROUNDS[parsed.bg] ? parsed.bg : DEFAULTS.bg,
        contrast: CONTRAST[parsed.contrast] ? parsed.contrast : DEFAULTS.contrast,
        textSize: TEXT_SIZES[parsed.textSize] ? parsed.textSize : DEFAULTS.textSize,
        filmGrain: FILM_GRAIN[parsed.filmGrain] ? parsed.filmGrain : DEFAULTS.filmGrain,
        autoGlitch: AUTO_GLITCH[parsed.autoGlitch] ? parsed.autoGlitch : DEFAULTS.autoGlitch
      };
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function save(settings){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  // Forcibly brightens the footer text on every page, including spans
  // that hardcode a low-opacity color instead of using --text-dim.
  // The dev-tools icon is deliberately excluded and pinned back to its
  // normal dim/low-opacity look - it's meant to stay easy to miss even
  // in high contrast, not get brightened along with the footer text.
  var HC_STYLE_ID = 'echo-hc-footer-override';
  function ensureHcStyle(){
    if (document.getElementById(HC_STYLE_ID)) return;
    var el = document.createElement('style');
    el.id = HC_STYLE_ID;
    el.textContent =
      'html.echo-hc footer, html.echo-hc footer *{color:#f5f7fb !important;opacity:1 !important;}' +
      'html.echo-hc #devToolsLink,html.echo-hc #devToolsLink *{color:rgba(238,240,245,0.45) !important;opacity:0.22 !important;}' +
      'html.echo-hc #devToolsLink:hover,html.echo-hc #devToolsLink:hover *{color:var(--accent) !important;opacity:1 !important;}';
    (document.head || document.documentElement).appendChild(el);
  }

  // Film Grain + Auto Glitch, ported from the dev-tools/artifacts/
  // rules-fx-demo.html reference build (same markup, CSS, and SVG
  // filter, just renamed to an echo-fx-* prefix) rather than a
  // from-scratch approximation - that demo is the source of truth for
  // what these two are supposed to look like.
  //
  // Film Grain is a real fixed <div>, not a pseudo-element: tiled SVG
  // turbulence noise, mix-blend-mode:screen (screen reliably brightens
  // against a near-black page; normal/overlay blending barely shows),
  // oversized on all sides via top/left/right/bottom so its own box
  // edges stay off-screen, with the "moving grain" look coming from
  // animating background-position (tile shift) rather than translating
  // the box itself.
  //
  // Auto Glitch is a genuine chromatic-aberration burst: an SVG filter
  // (feColorMatrix splits R/G/B, feOffset shifts red/blue apart,
  // feBlend recombines with screen mode) applied via CSS filter:url(),
  // paired with a brief horizontal jitter so it reads as a tear rather
  // than a clean color fringe. This is NOT the same thing as the
  // per-title RGB-split glitch some pages run on their logo text (that
  // one duplicates the title into colored layers) - this is a true
  // whole-page pixel-level effect, which is what makes it work on
  // arbitrary content.
  var FX_STYLE_ID = 'echo-fx-style';
  function ensureFxStyle(){
    if (document.getElementById(FX_STYLE_ID)) return;
    var el = document.createElement('style');
    el.id = FX_STYLE_ID;
    el.textContent =
      '#echo-fx-grain{position:fixed;top:-25%;left:-25%;right:-25%;bottom:-25%;' +
      'z-index:9998;pointer-events:none;display:none;' +
      'opacity:0.10;mix-blend-mode:screen;' +
      'background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/></svg>");' +
      'background-size:220px 220px;background-repeat:repeat;' +
      'animation:echoGrainShift 0.5s steps(4) infinite;}' +
      'html.echo-film-grain #echo-fx-grain{display:block;}' +
      '@keyframes echoGrainShift{' +
      '0%{background-position:0 0;}25%{background-position:-30px 15px;}' +
      '50%{background-position:15px -15px;}75%{background-position:-15px 30px;}' +
      '100%{background-position:0 0;}}' +
      'html.echo-glitch-pulse body{filter:url(#echo-fx-glitch-filter);animation:echoGlitchJitter 0.12s steps(2) 1;}' +
      '@keyframes echoGlitchJitter{' +
      '0%{transform:translateX(0);}30%{transform:translateX(-3px);}' +
      '60%{transform:translateX(2px);}100%{transform:translateX(0);}}';
    (document.head || document.documentElement).appendChild(el);
  }

  // The grain div and the glitch SVG filter need real DOM nodes (a
  // <style> block alone can't create either), so they're built once
  // DOM is ready, same gate as the settings-gear panel below.
  var FX_DOM_READY = false;
  function ensureFxDom(){
    if (FX_DOM_READY || !document.body) return;
    FX_DOM_READY = true;

    var grain = document.createElement('div');
    grain.id = 'echo-fx-grain';
    document.body.appendChild(grain);

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('style', 'position:absolute;');
    svg.innerHTML =
      '<filter id="echo-fx-glitch-filter" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="fxRed"/>' +
      '<feOffset in="fxRed" dx="-6" dy="0" result="fxRedOff"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="fxGreen"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="fxBlue"/>' +
      '<feOffset in="fxBlue" dx="6" dy="0" result="fxBlueOff"/>' +
      '<feBlend in="fxRedOff" in2="fxGreen" mode="screen" result="fxRG"/>' +
      '<feBlend in="fxRG" in2="fxBlueOff" mode="screen"/>' +
      '</filter>';
    document.body.appendChild(svg);
  }

  var autoGlitchTimer = null;
  function fireGlitchPulse(){
    var html = document.documentElement;
    // Force a reflow between remove/re-add so the burst restarts
    // cleanly even if it's re-triggered mid-animation.
    html.classList.remove('echo-glitch-pulse');
    void html.offsetWidth;
    html.classList.add('echo-glitch-pulse');
    setTimeout(function(){ html.classList.remove('echo-glitch-pulse'); }, 160);
  }
  function scheduleAutoGlitch(){
    autoGlitchTimer = setTimeout(function(){
      fireGlitchPulse();
      scheduleAutoGlitch();
    }, (6 + Math.random() * 10) * 1000);
  }
  function setAutoGlitch(enabled){
    clearTimeout(autoGlitchTimer);
    autoGlitchTimer = null;
    document.documentElement.classList.remove('echo-glitch-pulse');
    if (enabled) scheduleAutoGlitch();
  }

  function setThemeColor(color){
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta){
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      (document.head || document.documentElement).appendChild(meta);
    }
    meta.setAttribute('content', color);
  }

  function apply(settings){
    var html = document.documentElement;
    var hc = settings.contrast === 'high';

    ensureHcStyle();
    html.classList.toggle('echo-hc', hc);

    if (hc){
      html.style.setProperty('--bg', CONTRAST.high.bg);
      html.style.setProperty('--bg-solid', CONTRAST.high.bg);
      html.style.setProperty('--text', CONTRAST.high.text);
      html.style.setProperty('--text-dim', CONTRAST.high.textDim);
      html.style.setProperty('--text-bright', CONTRAST.high.textBright);
      setThemeColor(CONTRAST.high.bg);
    } else {
      html.style.setProperty('--bg', BACKGROUNDS[settings.bg].value);
      // --bg-solid stays a flat color always, even when --bg is a
      // gradient — anything using --bg as a proxy for "the app's dark
      // color" in a `color:` declaration (not a `background:`) needs
      // this instead, since a gradient is an invalid <color> value and
      // silently drops the whole declaration.
      html.style.setProperty('--bg-solid', BACKGROUNDS[settings.bg].themeColor);
      html.style.removeProperty('--text');
      html.style.removeProperty('--text-dim');
      html.style.removeProperty('--text-bright');
      setThemeColor(BACKGROUNDS[settings.bg].themeColor);
    }

    html.style.zoom = TEXT_SIZES[settings.textSize].zoom;

    ensureFxStyle();
    ensureFxDom();
    html.classList.toggle('echo-film-grain', settings.filmGrain === 'on');
    setAutoGlitch(settings.autoGlitch === 'on');

    fixNavPadding();
  }

  // The sidebar bookmarks nav is `position:fixed; height:100vh` with its
  // own top/bottom padding, but the footer sits on top of it as a fixed
  // bar — so the nav's last items get covered unless its bottom padding
  // also clears the footer's actual (possibly zoomed/wrapped) height.
  function fixNavPadding(){
    var nav = document.getElementById('siteNav');
    var footer = document.querySelector('footer');
    if (!nav || !footer) return;
    var zoomFactor = parseFloat(document.documentElement.style.zoom) || 1;
    var topPadLocal = parseFloat(getComputedStyle(nav).paddingTop) || 0;

    // Start from a reasonable estimate (footer height + the same
    // padding already given at the top)...
    var footerRenderedH = footer.getBoundingClientRect().height;
    nav.style.paddingBottom = ((footerRenderedH + topPadLocal * zoomFactor) / zoomFactor) + 'px';

    // ...then measure the real, still-visible gap once scrolled all
    // the way down and close it directly. `zoom` scales an element's
    // own rendered box without changing how vh/scrollHeight resolve,
    // so estimating the right padding analytically is unreliable —
    // measuring the actual leftover overlap and correcting for it
    // works regardless of the underlying zoom math.
    var lastChild = nav.lastElementChild;
    if (!lastChild) return;
    var prevScrollTop = nav.scrollTop;
    nav.scrollTop = nav.scrollHeight;
    var gap = lastChild.getBoundingClientRect().bottom - footer.getBoundingClientRect().top;
    if (gap > 0){
      var current = parseFloat(nav.style.paddingBottom) || 0;
      nav.style.paddingBottom = (current + gap / zoomFactor + 4) + 'px';
    }
    nav.scrollTop = prevScrollTop;
  }

  var settings = load();
  apply(settings);

  window.addEventListener('resize', fixNavPadding);
  window.addEventListener('load', fixNavPadding);

  function buildPanel(){
    var slot = document.getElementById('echo-settings-slot');
    if (!slot) return;

    var CSS = ''
      + '.echo-settings-gear{background:transparent;border:1px solid var(--text-dim,#6b7080);border-radius:50%;'
      + 'width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;'
      + 'color:var(--text-dim,#6b7080);transition:color 0.15s,border-color 0.15s;padding:0;}'
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
      + '#echo-settings-panel .es-sep{height:1px;background:rgba(255,255,255,0.1);margin:0 0 10px;}'
      + '#echo-settings-panel .es-reset{width:100%;font-family:"Share Tech Mono",monospace;font-size:9px;'
      + 'letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.4);background:transparent;'
      + 'border:1px solid rgba(255,255,255,0.2);border-radius:2px;padding:6px 4px;cursor:pointer;text-align:center;}'
      + '#echo-settings-panel .es-reset:hover{color:#fff;border-color:rgba(255,255,255,0.5);}';

    var styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    var gear = document.createElement('button');
    gear.className = 'echo-settings-gear';
    gear.setAttribute('aria-label', 'Site settings');
    // Precise 8-tooth gear, computed with trigonometry (evenly spaced,
    // symmetric teeth) rather than hand-drawn — filled silhouette with
    // a punched hub hole via fill-rule="evenodd".
    gear.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd">'
      + '<path d="M 10.31 1.84 L 13.69 1.84 L 13.31 4.11 L 16.65 5.49 L 17.99 3.62 L 20.38 6.01 L 18.51 7.35 L 19.89 10.69 L 22.16 10.31 L 22.16 13.69 L 19.89 13.31 L 18.51 16.65 L 20.38 17.99 L 17.99 20.38 L 16.65 18.51 L 13.31 19.89 L 13.69 22.16 L 10.31 22.16 L 10.69 19.89 L 7.35 18.51 L 6.01 20.38 L 3.62 17.99 L 5.49 16.65 L 4.11 13.31 L 1.84 13.69 L 1.84 10.31 L 4.11 10.69 L 5.49 7.35 L 3.62 6.01 L 6.01 3.62 L 7.35 5.49 L 10.69 4.11 Z '
      + 'M 15.4 12 A 3.4 3.4 0 1 0 8.6 12 A 3.4 3.4 0 1 0 15.4 12 Z"/>'
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
        btn.dataset.key = key;
        btn.dataset.id = id;
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
    var sep2b = document.createElement('div'); sep2b.className = 'es-sep'; panel.appendChild(sep2b);
    panel.appendChild(group('Film Grain', FILM_GRAIN_ORDER, FILM_GRAIN, 'filmGrain'));
    var sep2c = document.createElement('div'); sep2c.className = 'es-sep'; panel.appendChild(sep2c);
    panel.appendChild(group('Auto Glitch', AUTO_GLITCH_ORDER, AUTO_GLITCH, 'autoGlitch'));

    var sep3 = document.createElement('div'); sep3.className = 'es-sep'; panel.appendChild(sep3);
    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'es-reset';
    resetBtn.textContent = 'Reset to Defaults';
    resetBtn.addEventListener('click', function(){
      Object.keys(DEFAULTS).forEach(function(k){ settings[k] = DEFAULTS[k]; });
      apply(settings);
      save(settings);
      panel.querySelectorAll('.es-btn').forEach(function(b){
        b.classList.toggle('active', settings[b.dataset.key] === b.dataset.id);
      });
    });
    panel.appendChild(resetBtn);

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

  function onDomReady(){
    ensureFxDom();
    buildPanel();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', onDomReady);
  } else {
    onDomReady();
  }
})();
