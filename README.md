# Week 3 – Accessibility Enhancement (Daily Bytes blog)

Reworks an inaccessible blog page to meet WCAG 2.1 AA and ARIA best practices.

```
before/            Original, deliberately inaccessible page
after/             Accessible version (index.html, css/, js/, assets/)
tools/audit.js     Local Playwright accessibility audit
REPORT.md          Audit, improvements, standards mapping
docs/              Word version of the report
```

## Run
Open `after/index.html` (or `before/index.html`) in a browser. No build step.

## Audit
```bash
npm i playwright && npx playwright install chromium
node tools/audit.js before/index.html after/index.html
```
Also run Lighthouse and WAVE and record the scores in REPORT.md section 7.

## Try it with the keyboard
Tab (skip link first), Shift+Tab, Enter/Space on buttons, Escape closes the mobile menu.

## Publish
```bash
git init && git add . && git commit -m "Week 3: accessibility enhancement"
git branch -M main
git remote add origin https://github.com/sohamvrawool1910/week3-accessibility.git
git push -u origin main
```
