/* ECHOES — shared mini-game loading bar.
 *
 * Include this as the FIRST thing inside <body> (right after the opening
 * tag, before any real page content):
 *
 *   <body>
 *   <script src="loading-bar.js"></script>
 *   ...rest of the page...
 *
 * It injects a full-viewport overlay (centered bar + "LOADING..." label)
 * on top of everything, runs a scripted fill, then snaps the overlay out
 * of view and lets the real page underneath show through — the page's
 * own content was already there the whole time, this is a purely
 * cosmetic delay so every mini-game feels consistent, and there's only
 * one file to edit to change the look/feel/timing everywhere it's used.
 * If this script fails to run for any reason, the real page is still
 * fully present underneath — worst case is just no loading bar.
 *
 * Settings live in CFG below — this is the single source of truth for
 * every mini-game page that includes this file.
 */
(function(){
  var CFG = {
    loadTimeMinS: 0.3, loadTimeMaxS: 2,
    stutterCountMin: 1, stutterCountMax: 4,
    stutterLenMinMs: 500, stutterLenMaxMs: 1000,
    stripe: false,
    failChance: 0,
    failColorize: true,
    fadeMinS: 1, fadeMaxS: 1.5
  };

  var CSS = ''
    + '#echo-lb-overlay{position:fixed;inset:0;z-index:99999;background:#000;'
    + 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;'
    + 'font-family:"Share Tech Mono",monospace;opacity:1;}'
    + '#echo-lb-overlay.echo-lb-hide{opacity:0;pointer-events:none;}'
    + '#echo-lb-bar{position:relative;width:min(420px,70vw);height:44px;border:4px solid #fff;}'
    + '#echo-lb-bar.errored{border-color:#ff4d5e;}'
    + '#echo-lb-fill{position:absolute;top:0;left:0;bottom:0;width:0%;background:#fff;}'
    + '#echo-lb-fill.stutter{background:repeating-linear-gradient(135deg,#fff 0 10px,#cfcfcf 10px 20px);}'
    + '#echo-lb-label{color:#E8732A;font-size:14px;letter-spacing:0.4em;text-transform:uppercase;text-indent:0.4em;}'
    + '#echo-lb-label.errored{color:#ff4d5e;letter-spacing:0.1em;text-indent:0;font-size:12px;}'
    + '#echo-lb-label .echo-lb-dots{display:inline-block;width:1.3em;text-align:left;}'
    + '#echo-lb-pct{color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:0.18em;margin-top:-16px;}';

  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  var overlay = document.createElement('div');
  overlay.id = 'echo-lb-overlay';
  overlay.innerHTML =
    '<div id="echo-lb-bar"><div id="echo-lb-fill"></div></div>' +
    '<div id="echo-lb-label">LOADING<span class="echo-lb-dots" id="echo-lb-dots"></span></div>' +
    '<div id="echo-lb-pct">0%</div>';

  // Inserted as the very first element in <body> — this script tag is
  // itself the first child at the point it runs, so this lands before
  // any real content that follows it in the markup.
  document.body.insertBefore(overlay, document.body.firstChild);

  var prevOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';

  var bar = document.getElementById('echo-lb-bar');
  var fill = document.getElementById('echo-lb-fill');
  var label = document.getElementById('echo-lb-label');
  var dots = document.getElementById('echo-lb-dots');
  var pct = document.getElementById('echo-lb-pct');

  var dotsTimer = setInterval(function(){
    var n = ((dots.textContent.length + 1) % 4);
    dots.textContent = '.'.repeat(n);
  }, 400);

  function rand(a, b){ return a + Math.random() * (b - a); }
  function randInt(a, b){ return Math.round(rand(a, b)); }

  function finish(){
    clearInterval(dotsTimer);
    var fadeMs = rand(CFG.fadeMinS, CFG.fadeMaxS) * 1000;
    overlay.style.transition = 'opacity ' + fadeMs + 'ms ease';
    // force reflow so the transition applies before the class change
    void overlay.offsetWidth;
    overlay.classList.add('echo-lb-hide');
    setTimeout(function(){
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.documentElement.style.overflow = prevOverflow;
    }, fadeMs);
  }

  function run(){
    var loadTimeMs = rand(CFG.loadTimeMinS, CFG.loadTimeMaxS) * 1000;
    var stutterCount = randInt(CFG.stutterCountMin, CFG.stutterCountMax);
    var willFail = Math.random() * 100 < CFG.failChance;
    var failAtPct = willFail ? (35 + Math.random() * 45) : null;

    var stutterPoints = [];
    for (var i = 0; i < stutterCount; i++) stutterPoints.push(5 + Math.random() * 90);
    stutterPoints.sort(function(a, b){ return a - b; });
    var nextStutterIdx = 0;
    var pausedUntil = 0;
    var productiveElapsed = 0;
    var lastTs = null;

    function tick(ts){
      if (lastTs === null) lastTs = ts;
      var dt = ts - lastTs;
      lastTs = ts;

      if (ts < pausedUntil){
        requestAnimationFrame(tick);
        return;
      }
      fill.classList.remove('stutter');

      productiveElapsed += dt;
      var p = Math.min(100, (productiveElapsed / loadTimeMs) * 100);

      if (willFail && p >= failAtPct){
        fill.style.width = failAtPct.toFixed(1) + '%';
        clearInterval(dotsTimer);
        if (CFG.failColorize){ bar.classList.add('errored'); label.classList.add('errored'); }
        label.textContent = 'CONNECTION LOST';
        pct.style.display = 'none';
        setTimeout(finish, 500);
        return;
      }

      if (nextStutterIdx < stutterPoints.length && p >= stutterPoints[nextStutterIdx]){
        nextStutterIdx++;
        var stutterMs = CFG.stutterLenMinMs + Math.random() * (CFG.stutterLenMaxMs - CFG.stutterLenMinMs);
        pausedUntil = ts + stutterMs;
        if (CFG.stripe) fill.classList.add('stutter');
      }

      fill.style.width = p + '%';
      pct.textContent = Math.floor(p) + '%';

      if (p < 100){
        requestAnimationFrame(tick);
      } else {
        finish();
      }
    }
    requestAnimationFrame(tick);
  }

  run();
})();
