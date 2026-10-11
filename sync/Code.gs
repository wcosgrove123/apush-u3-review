/* APUSH Unit III review: progress sync for a Google Sheet.
   Bound to a Google Sheet (Extensions > Apps Script). Deploy as a web app with
   Execute as: Me and Who has access: Anyone, then paste the /exec URL into
   config.js as syncUrl. Each event a student's browser sends becomes one row
   on the "Progress" tab. Run buildSummary() for one row per student. */

var SHEET = 'Progress';
var HEAD = ['Received', 'Student', 'Class code', 'Game', 'Event', 'Score', 'Total', 'Details', 'Sent at'];
var GAMES = { tl: 'Timeline Game', el: 'Eight Lenses', cr: 'Chain Reaction' };

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet();
    var body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var d = JSON.parse(body);
    var list = Array.isArray(d.events) ? d.events : [d];
    list.forEach(function (ev) {
      sh.appendRow([
        new Date(),
        String(ev.name || '').slice(0, 80),
        String(ev.classCode || '').slice(0, 40),
        GAMES[ev.game] || String(ev.game || ''),
        String(ev.event || '').slice(0, 40),
        ev.score == null ? '' : ev.score,
        ev.total == null ? '' : ev.total,
        JSON.stringify(ev.detail || {}).slice(0, 500),
        ev.at || ''
      ]);
    });
    return out({ ok: true, rows: list.length });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return out({ ok: true, message: 'APUSH Unit III progress sync is running.' });
}

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
  if (sh.getLastRow() === 0) { sh.appendRow(HEAD); sh.setFrozenRows(1); }
  return sh;
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* Rebuilds the "Summary" tab: one row per student (and class code) with distinct
   chains built, distinct lenses checked, best Name the lens round, timeline games
   played and the best one, and when they were last seen. Run it from the editor,
   or add a time-driven trigger so it refreshes on its own. */
function buildSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rows = sheet().getDataRange().getValues().slice(1), by = {};
  rows.forEach(function (r) {
    var name = r[1] || '(no name)', code = r[2] || '', key = code + '\t' + name;
    var s = by[key] || (by[key] = { name: name, code: code, chains: {}, lenses: {}, quiz: -1, quizT: 0, tlGames: 0, tlBest: -1, tlT: 0, last: null });
    var ev = r[4], score = r[5], total = r[6], det = {};
    try { det = JSON.parse(r[7] || '{}'); } catch (e) {}
    if (ev === 'chain_complete' && det.chain) s.chains[det.chain] = true;
    if (ev === 'lens_checked' && det.term) s.lenses[det.term + '/' + det.theme] = true;
    if (ev === 'quiz_complete' && score !== '' && Number(score) > s.quiz) { s.quiz = Number(score); s.quizT = Number(total); }
    if (ev === 'timeline_complete') {
      s.tlGames++;
      if (total && (s.tlBest < 0 || Number(score) / Number(total) > s.tlBest / s.tlT)) { s.tlBest = Number(score); s.tlT = Number(total); }
    }
    if (r[0] && (!s.last || r[0] > s.last)) s.last = r[0];
  });
  var sh = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  sh.clearContents();
  sh.appendRow(['Student', 'Class code', 'Chains built (of 11)', 'Lenses checked (of 128)', 'Best Name the lens', 'Timeline games', 'Best timeline game', 'Last seen']);
  Object.keys(by).sort().forEach(function (k) {
    var s = by[k];
    sh.appendRow([s.name, s.code, Object.keys(s.chains).length, Object.keys(s.lenses).length,
      s.quiz < 0 ? '' : s.quiz + ' of ' + s.quizT, s.tlGames, s.tlBest < 0 ? '' : s.tlBest + ' of ' + s.tlT, s.last]);
  });
  sh.setFrozenRows(1);
}
