# Terminal tests

Browser tests for `terminal.html`. Each suite opens the terminal in headless Chromium, types commands, clicks, and checks
what comes back. They are how changes to the engine, the data files and the author tools get checked.

## Run them

```
npm install --no-save playwright      # once, if Playwright is not already installed
npx playwright install chromium       # once, unless CHROMIUM_PATH points at a browser
node dev-tools/tests/run-all.js       # every suite, about 15 minutes
node dev-tools/tests/run-all.js ui5   # one or more suites by name
```

`run-all.js` starts its own web server, so nothing else needs to be running. One suite on its own needs the site served
and `ECHOES_URL` set (default `http://localhost:8803`):

```
python3 -m http.server 8803 &
node dev-tools/tests/ui5.js
```

Environment: `ECHOES_URL` (site address), `CHROMIUM_PATH` (use this browser instead of Playwright's).

## What is in here

| File | Role |
|---|---|
| `env.js` | Finds Playwright and a browser, and the site address. |
| `lib.js` | Shared harness: opens the page with fast typing, powers on, `send`, `out`, `check`. `open({ stubs: true })` adds five planned-but-empty stub docs to the data, for the tests of the stub feature. |
| `run-all.js` | Runs the suites in order and prints one line each. Exit code 1 if any fail. |
| `<name>.js` | One suite each. The list in `run-all.js` says what each covers. |

The tests read the live data in `terminal-data/`. When a document, command or label changes on purpose, the suite that
checks it needs the same change. A failing line prints the check name and what it saw.
