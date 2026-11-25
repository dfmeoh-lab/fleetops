# Seller guide: GitHub + Gumroad

This file is for the product seller. It is not required by customers.

## Recommended selling model

Sell the application as a **downloadable desktop-style web app**, not as a hosted multi-user SaaS. The customer receives a ZIP, extracts it and opens `index.html` in a browser. No hosting or server payments are required to serve that buyer.

### GitHub

1. Create a **private** repository named something like `fleetops-control-center`.
2. Upload the source files from this folder. Keep change history and version tags there.
3. To provide a free demo, create a **separate public repository** with limited example features/data. Do not publish the entire paid application source as a public repository if you intend to reserve it for customers.
4. GitHub Pages should not be used as the production host for a commercial SaaS/e-commerce business under its applicable terms. Verify current GitHub rules before hosting any demo.

### Gumroad

1. Create a digital product with a clear name and screenshot previews.
2. Upload the **customer ZIP** (include `index.html`, `styles.css`, `engine.js`, `app.js`, `data/`, `assets/`, and `README.md`). You can omit `tests/`, this seller guide and development-only files from the customer package.
3. Explain prominently that this is a **one-time downloadable offline browser app**, not a hosted service.
4. Explain local storage and the need to export JSON backups.
5. Set your license/refund/support terms. If implementing online license enforcement, you need a secure server-side component; a purely client-side ZIP cannot reliably prevent copying.
6. Point buyers to **Settings & data → Start fresh · empty workspace** after they review the sample dataset.
7. Provide a version number, changelog and a contact route for support requests.

## Suggested short product copy

**FleetOps Control Center PRO** is an offline maritime fleet planning application for technical managers, superintendents and ship operators. Maintain vessel and superintendent registers, plan date-based coverage, manage technical activities, review a colour-coded yearly fleet timeline, monitor superintendent capacity and track budget versus actual spending—all from one browser-based workspace. Includes fictional sample data and downloadable backups. No recurring subscription or online account required.

## Suggested customer expectations

- Browser-based local software for one device at a time
- Offline operation and manual backups
- Import/restore JSON; export registers to CSV
- Non-certified planning and reporting tool
- No cloud synchronization, user logins or collaboration in v1

## Before charging customers

- Test the extracted customer ZIP on a **fresh Windows computer** in Chrome/Edge and on macOS if advertising macOS support.
- Test adding/editing/removing a vessel, superintendent, assignment and activity.
- Test overlap rejection, month switching, Gantt, workload and budget recalc.
- Test JSON backup, browser restart, and backup restore.
- Test exports in Excel and handle any spreadsheet import prompts.
- Add your own branding, support email, EULA/licensing/refund terms, and a reliable update-delivery process.
- Replace or clearly identify all fictional demo data.

This package is an implementation and development starting point. It has not undergone independent third-party security auditing or production customer acceptance testing.
