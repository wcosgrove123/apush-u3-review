/* Shared progress store for the APUSH Unit III review games.
   One record per student, saved in this browser's localStorage under one key.
   Each game writes to it as the student plays; index.html reads it to show a
   dashboard and to build a plain-text progress report. If config.js sets a
   syncUrl, each event is also posted there (fire and forget). */
(function () {
  'use strict';
  var KEY = 'apush3.progress', V = 1, PREFIX = 'apush3.';
  var cfg = window.APUSH_CONFIG || {};

  function fresh() {
    return {
      v: V, name: '', started: new Date().toISOString(), updated: null,
      cr: { total: 0, chains: {} },
      el: { total: 0, themes: 8, terms: {}, quiz: [] },
      tl: { total: 0, cards: {}, games: [] }
    };
  }
  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o && o.v === V) {
        var f = fresh();
        ['cr', 'el', 'tl'].forEach(function (k) { if (!o[k] || typeof o[k] !== 'object') o[k] = f[k]; });
        if (!o.cr.chains) o.cr.chains = {};
        if (!o.el.terms) o.el.terms = {};
        if (!o.el.quiz) o.el.quiz = [];
        if (!o.tl.cards) o.tl.cards = {};
        if (!o.tl.games) o.tl.games = [];
        return o;
      }
    } catch (e) {}
    return fresh();
  }
  var P = load();
  function save(quiet) { if (!quiet) P.updated = new Date().toISOString(); try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
  function update(fn) { try { fn(P); } catch (e) {} save(); return P; }

  /* Optional sync to the teacher's sheet. A plain-text body avoids a CORS
     preflight; no-cors means the reply is never read, which is fine here. */
  function post(body) {
    var url = cfg.syncUrl; if (!url) return;
    try {
      if (window.fetch) fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body: body }).catch(function () {});
      else if (navigator.sendBeacon) navigator.sendBeacon(url, body);
    } catch (e) {}
  }
  function event(game, name, o) {
    if (!cfg.syncUrl) return;
    o = o || {};
    post(JSON.stringify({
      at: new Date().toISOString(), name: P.name || '', classCode: cfg.classCode || '',
      game: game, event: name,
      score: o.score == null ? null : o.score, total: o.total == null ? null : o.total,
      detail: o.detail || {}
    }));
  }

  var SCOPE = { all: 'Whole unit', a: '1786 to 1800', b: '1800 to 1824' }, LEVEL = { std: 'Years', hard: 'Months too' };
  function settings(g) { return (SCOPE[g.scope] || g.scope) + ', ' + g.len + ' cards, ' + (LEVEL[g.level] || g.level); }

  function summary() {
    var s = { name: P.name || '', updated: P.updated, started: P.started };
    /* Chain Reaction */
    var ch = P.cr.chains, ids = Object.keys(ch), links = 0, clean = 0;
    ids.forEach(function (id) { links += ch[id].total || 0; clean += Math.max(0, ch[id].best || 0); });
    s.cr = { built: ids.length, total: P.cr.total || 11, links: links, clean: clean };
    /* Eight Lenses */
    var T = P.el.terms, themes = P.el.themes || 8, checked = 0, full = 0, had = 0, close = 0, miss = 0;
    Object.keys(T).forEach(function (id) {
      var t = T[id] || {}, sh = t.shown || {}, n = 0;
      Object.keys(sh).forEach(function (k) { if (sh[k]) n++; });
      checked += n; if (n >= themes) full++;
      var r = t.rate || {};
      Object.keys(r).forEach(function (k) { if (r[k] === 'had') had++; else if (r[k] === 'close') close++; else if (r[k] === 'miss') miss++; });
    });
    var qz = P.el.quiz || [], qbest = null;
    qz.forEach(function (q) { if (qbest === null || q.score > qbest.score) qbest = q; });
    s.el = { terms: P.el.total || 16, full: full, checked: checked, lenses: (P.el.total || 16) * themes, had: had, close: close, miss: miss, rounds: qz.length, best: qbest, last: qz.length ? qz[qz.length - 1] : null };
    /* Timeline */
    var G = P.tl.games || [], solo = G.filter(function (g) { return !g.teams || g.teams === 1; }), best = null, right = 0, placed = 0;
    solo.forEach(function (g) {
      right += g.score || 0; placed += g.total || 0;
      var pct = g.total ? g.score / g.total : 0, bp = best && best.total ? best.score / best.total : -1;
      if (best === null || pct > bp || (pct === bp && g.total > best.total)) best = g;
    });
    var C = P.tl.cards || {}, mastered = 0, seen = 0;
    Object.keys(C).forEach(function (id) { seen++; if (C[id].ok > 0) mastered++; });
    s.tl = { games: G.length, solo: solo.length, best: best, bestLabel: best ? settings(best) : '', right: right, placed: placed, mastered: mastered, seen: seen, total: P.tl.total || 60 };
    return s;
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function when(iso) { try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso || ''; } }

  function report() {
    var s = summary(), L = [];
    L.push('APUSH Unit III review: progress report');
    L.push('Student: ' + (s.name || '(no name entered)'));
    L.push('As of: ' + when(new Date().toISOString()));
    L.push('');
    if (s.tl.solo) {
      L.push('Timeline Game: ' + plural(s.tl.solo, 'game') + ' played; best ' + s.tl.best.score + ' of ' + s.tl.best.total + ' (' + s.tl.bestLabel + '); ' + s.tl.right + ' of ' + s.tl.placed + ' cards placed correctly overall; ' + s.tl.mastered + ' of ' + s.tl.total + ' events placed correctly at least once.');
    } else L.push('Timeline Game: not played yet.');
    if (s.el.checked || s.el.rounds) {
      var e = 'Eight Lenses: ' + s.el.full + ' of ' + s.el.terms + ' terms fully checked; ' + s.el.checked + ' of ' + s.el.lenses + ' lenses checked';
      if (s.el.had + s.el.close + s.el.miss) e += '; self-rated ' + s.el.had + ' had it, ' + s.el.close + ' close, ' + s.el.miss + ' missed';
      if (s.el.rounds) e += '; Name the lens: ' + plural(s.el.rounds, 'round') + ', best ' + s.el.best.score + ' of ' + s.el.best.total;
      L.push(e + '.');
    } else L.push('Eight Lenses: not started yet.');
    if (s.cr.built) L.push('Chain Reaction: ' + s.cr.built + ' of ' + s.cr.total + ' chains built; ' + s.cr.clean + ' of ' + s.cr.links + ' links right on the first try.');
    else L.push('Chain Reaction: not started yet.');
    return L.join('\n');
  }

  function reset() {
    var gone = [];
    try {
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(PREFIX) === 0) gone.push(k); }
      gone.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
    P = fresh(); save(); return P;
  }

  window.Progress = {
    get: function () { return P; },
    reload: function () { P = load(); return P; },
    update: update,
    save: save,
    event: event,
    name: function (v) { if (v !== undefined) { P.name = String(v).replace(/\s+/g, ' ').trim().slice(0, 60); save(true); } return P.name; },
    reset: reset,
    summary: summary,
    report: report,
    when: when,
    config: cfg,
    key: KEY
  };
})();
