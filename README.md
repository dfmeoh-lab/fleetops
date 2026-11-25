# FleetOps Control Center PRO

Professional, offline-first fleet operations planning software. It runs entirely in your browser with **no installer, paid service, API key, account, or internet connection**.

## Launch in 30 seconds

1. Extract the full ZIP into a normal folder.
2. Open **`index.html`** with a recent version of Chrome, Edge, Firefox, or Safari.
3. Explore the fictional demonstration data.
4. Go to **Settings & data → Start fresh · empty workspace** when you are ready to enter your own fleet. This clears the fictional sample records after confirmation.
5. Add vessels and superintendents first, then assignments and activities. Use **Restore sample data** in Settings if you want to revisit the examples.

Keep the files together. `index.html` loads `styles.css`, `engine.js`, `app.js`, `data/demo.js`, and `assets/icon.svg` from relative paths.

> Browser security rules for `file://` pages vary. If local storage is unavailable, the app can still be explored, but changes may not persist. Always export a full JSON backup. For most predictable persistence, serve the folder from a normal local HTTP server or a trusted static host.

## What the software does

| Module | Functions |
| --- | --- |
| Overview | Live vessel/assignment KPIs, activity outlook, capacity, annual budget, data quality |
| Fleet register | Add, edit and remove vessel master records (with protected references) |
| Superintendents | Team records and per-person vessel capacity |
| Assignments | Date-based vessel coverage; prevents overlapping assignments for the same vessel |
| Activities | Technical events, owner, date ranges, priority, status, budget and actual cost |
| Fleet timeline | Yearly 12-month Gantt with category colours |
| Workload matrix | Vessel activity matrix and superintendent monthly-load matrix |
| Budget control | Annual budget, actual spend and remaining balance by category |
| Reports & exports | Management summary, data-integrity checks, CSV exports and JSON backup |
| Settings & data | Company name, currency, month selector, backup import, empty-workspace start and demo reset |

## Data ownership and backups

- Your records are kept **in the browser on this device**, not in a cloud account.
- No information is transmitted to an external server by the included application.
- Export **Reports & exports → Complete backup (.json)** after meaningful changes.
- A JSON backup includes all records and settings; use **Restore from backup** to move to another browser/computer.
- CSV exports are available separately for vessels, staff, assignments and activities. CSV is for spreadsheets/reporting; it is **not** a full application backup.
- Clearing browser data or switching the file origin may remove locally stored records.

## Important calculation rules

1. A vessel is counted as assigned in a month when any assignment overlaps that month.
2. Assignment dates are inclusive. Overlapping coverage of the same vessel is prevented during editing.
3. A superintendent's monthly utilisation counts unique vessels with overlapping assignments.
4. An activity counts in every month touched by its start/end date. Cancelled activities are excluded from monthly charts and annual budgets.
5. Budgets are grouped into years by each activity's **start date**.
6. “Unspent” means recorded budget minus recorded actual. It is **not** a final project variance forecast.
7. The included names and amounts are **fictional examples** for training and product demonstrations.

## Limits of version 1.0.0

- Single-browser, single-device records; no user accounts, permissions, shared cloud database or real-time collaboration.
- Not connected to class, flag, PMS, ERP, procurement or vessel telemetry systems.
- No automated notifications or reminders when the browser is closed.
- No financial audit trail or role-based approval workflow.
- This is a planning and reporting tool, not a certified safety-management, class-compliance or accounting system. Verify data and calculations before operational use.
- Data-entry capacities are based on browser storage (not hard-coded workbook row limits); very large datasets may impact browser performance.

## Development and GitHub

The complete source is readable and editable: HTML, CSS and vanilla JavaScript. There are no runtime dependencies. A modern Node.js installation is useful for automated tests but not required to run the app.

Run the calculation tests:

```bash
node --test tests/engine.test.cjs
```

For a local HTTP preview, you can use any static server. For example, if Python is already installed:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Product version

FleetOps Control Center PRO 1.0.0 · Fictional sample data · Client-side, offline-capable · No external services.

