/* ECHOES — shared table view toggle (column <-> stacked dictionary-entry
 * view) + themed horizontal scroll indicator.
 *
 * Prototyped in dev-tools/artifacts/table-view-toggle-demo.html - this is
 * that same behavior, generalized to run across every .tbl-wrap on the
 * page rather than two demo tables. See that file's comments for the
 * design reasoning (why .tbl-scroll is a separate element from .tbl-wrap,
 * why the scrollbar is custom instead of native, etc.).
 *
 * A .tbl-wrap that doesn't have the .tbl-toolbar/.tbl-scroll structure
 * (the Actions table in rules.html, which uses a fixed 2-column layout
 * that's designed to never need horizontal scroll or a stacked view) is
 * left completely alone - this script no-ops on it.
 *
 * Usage: add `<script src="assets/table-view-toggle.js"></script>` near
 * the end of the page, after the .tbl-wrap markup it operates on.
 */
(function(){
  var ICON_COLUMNS =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
    '<line x1="4" y1="2" x2="4" y2="14"/><line x1="8" y1="2" x2="8" y2="14"/><line x1="12" y1="2" x2="12" y2="14"/>' +
    '</svg>';
  var ICON_STACKED =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
    '<line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/>' +
    '</svg>';

  // Auto-populate data-label on every non-first <td> from that column's
  // <th> text, so the stacked view's line labels need zero per-cell
  // markup edits anywhere in rules.html / echo-events.html.
  function labelCells(wrap){
    var headers = Array.prototype.map.call(wrap.querySelectorAll('thead th'), function(th){ return th.textContent.trim(); });
    wrap.querySelectorAll('tbody tr').forEach(function(tr){
      Array.prototype.forEach.call(tr.children, function(td, i){
        if (i === 0) return;
        td.setAttribute('data-label', headers[i] || '');
      });
    });
  }

  function currentMode(wrap){
    // "auto" resolves to whatever the CSS breakpoint currently renders;
    // the toggle's icon should reflect what's ACTUALLY showing right now.
    var mode = wrap.getAttribute('data-mode');
    if (mode !== 'auto') return mode;
    return window.matchMedia('(max-width: 640px)').matches ? 'stacked' : 'table';
  }

  function syncIcon(wrap, btn){
    var showing = currentMode(wrap);
    btn.innerHTML = showing === 'stacked' ? ICON_STACKED : ICON_COLUMNS;
    btn.title = showing === 'stacked'
      ? 'Showing stacked view — click for column table'
      : 'Showing column table — click for stacked view';
  }

  // Custom horizontal scrollbar: sizes/positions .hbar-thumb as a
  // percentage of .tbl-scroll's own scrollable range, and hides the
  // whole track when there's nothing to scroll (table fits, or the
  // view is stacked - stacked content never overflows horizontally).
  function syncHbar(wrap){
    var scroller = wrap.querySelector('.tbl-scroll');
    var track = wrap.querySelector('.hbar-track');
    var thumb = wrap.querySelector('.hbar-thumb');
    if (!scroller || !track || !thumb) return;

    var scrollable = scroller.scrollWidth - scroller.clientWidth;
    if (scrollable <= 1) {
      track.style.display = 'none';
      return;
    }
    track.style.display = 'block';
    var thumbPct = Math.max((scroller.clientWidth / scroller.scrollWidth) * 100, 6);
    var leftPct = (scroller.scrollLeft / scrollable) * (100 - thumbPct);
    thumb.style.width = thumbPct + '%';
    thumb.style.left = leftPct + '%';
  }

  function init(){
    document.querySelectorAll('.tbl-wrap').forEach(function(wrap){
      var btn = wrap.querySelector('.view-toggle');
      var scroller = wrap.querySelector('.tbl-scroll');
      if (!btn || !scroller) return; // opted-out table (e.g. Actions) - leave alone

      labelCells(wrap);
      syncIcon(wrap, btn);
      syncHbar(wrap);

      btn.addEventListener('click', function(){
        var next = currentMode(wrap) === 'stacked' ? 'table' : 'stacked';
        wrap.setAttribute('data-mode', next);
        syncIcon(wrap, btn);
        syncHbar(wrap);
      });
      scroller.addEventListener('scroll', function(){ syncHbar(wrap); }, { passive: true });
      window.addEventListener('resize', function(){ syncIcon(wrap, btn); syncHbar(wrap); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
