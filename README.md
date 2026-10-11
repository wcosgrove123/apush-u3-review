# APUSH Unit III review games

Three study games for the New Republic unit (1786 to 1824), packaged as a static site for GitHub Pages. No build step, no accounts, no server.

**Live site:** https://wcosgrove123.github.io/apush-u3-review/

## What is here

| File | What it is |
|---|---|
| `index.html` | The page students open. Links to the three games, shows each student's own progress, and builds a plain-text progress report they can copy and send you. |
| `timeline.html` | New Republic Timeline Game. 60 dated cards; place each one on the line. |
| `chain-reaction.html` | Chain Reaction. 11 cause-and-effect chains. |
| `eight-lenses.html` | Eight Lenses. 16 terms through the 8 AP themes, plus Name the lens and the Class round. |
| `share.html` | For the projector: the link as a QR code plus direct links to each game. Not linked from the student pages. |
| `progress.js` | The shared progress store the games write to and the home page reads. |
| `config.js` | The only settings file. Leave it alone unless you turn on the Google Sheet sync below. |
| `sync/Code.gs` | Optional Google Apps Script that collects progress in a Google Sheet. |

## Sharing it with students

- Give them the link above, or open `share.html` on the projector for a QR code:
  https://wcosgrove123.github.io/apush-u3-review/share.html
- Each game also has its own link (`timeline.html`, `chain-reaction.html`, `eight-lenses.html`), but the home page is the better one to share because it shows progress and links to everything.

## How progress tracking works

- Progress is saved in the student's browser (localStorage) on the device they play on. Nothing to log into. If they switch devices or browsers, or clear site data, it starts fresh on the new one.
- What is tracked:
  - Timeline Game: every game finished (settings and score), and for each of the 60 events whether it has ever been placed correctly.
  - Chain Reaction: every chain built, with links right on the first try and hints used.
  - Eight Lenses: which model answers have been revealed per term, the student's self-ratings and their written sentences (so they can come back to them), and every Name the lens round.
- The home page shows a dashboard and a **progress report** (plain text). Students type their name, press "Copy the report," and paste it into Canvas, an email, or whatever you ask for. A screenshot of the home page works too.
- "Erase my progress" in the footer clears everything on that device after a confirmation.

## Optional: see everyone's progress in a Google Sheet

With this turned on, every finished chain, revealed lens, self-rating, quiz round, and timeline game is also posted to a Google Sheet you own, as it happens. Written sentences are never sent. Setup takes about five minutes.

1. Create a new Google Sheet (any name, for example "APUSH Unit III progress").
2. In the sheet, open **Extensions > Apps Script**. Delete the sample code, paste in the contents of `sync/Code.gs`, and save.
3. Click **Deploy > New deployment**. Choose type **Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Click Deploy and approve the permissions it asks for (it only touches this one sheet).
4. Copy the **Web app URL** (it ends in `/exec`). Open `config.js` in this repo, paste the URL into `syncUrl`, and optionally set `classCode` to a label such as `"Period 3"`. Commit and push.
5. Test it: open the live site, finish one chain in Chain Reaction, and a row should appear on the "Progress" tab of your sheet within a few seconds.
6. For a one-row-per-student view, run `buildSummary` from the Apps Script editor (Run menu). It rebuilds a "Summary" tab with chains built, lenses checked, best quiz round, and best timeline game per student. To keep it fresh automatically, add a time-driven trigger for `buildSummary` under the clock icon (Triggers) in the editor.

Things to know:

- Students are identified only by the name they type on the home page. Tell them what you want there (first name and last initial, or a code you assign).
- The sync URL sits in a public file, so anyone who finds it could post rows to the sheet. It is write-only and the sheet itself stays private to you, so the worst case is junk rows. If that ever happens, make a new deployment and update `config.js`.
- If you edit `Code.gs` later, choose **Deploy > New deployment** again; saving alone does not update the live web app.

## Updating the site

Edit the files, then commit and push to `main`. GitHub Pages redeploys within a minute or two.

```bash
git add -A && git commit -m "Describe the change" && git push
```

To preview locally before pushing:

```bash
python -m http.server 8773
```

then open http://localhost:8773/

## Student-facing rules this site follows

- Nothing on any page hints at what is on the test.
- Content is drawn evenly from the unit, with no packet numbers or credit lines.
- No student names are stored anywhere unless you turn on the Google Sheet sync, and then only the name the student types.

## What is deliberately not here

This repository is public. The teacher notes, the test item bank, answer keys, and the content tally are kept out of it on purpose. Keep those in your own files, not in this repo.
