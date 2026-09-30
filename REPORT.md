# Week 3 – Accessibility Report

## 1. Project and goal
The project is **Daily Bytes**, a small blog / information portal. `before/` is a deliberately typical, inaccessible page (div-based, low contrast, click-only controls). `after/` is the same content reworked to meet WCAG 2.1 AA and the WAI-ARIA Authoring Practices. Both pages have identical content so the audit results can be compared fairly.

## 2. Audit method
- **Automated:** `tools/audit.js` (Playwright) runs 15 rule checks mapped to WCAG success criteria, computes real contrast ratios from rendered styles, and tabs through the page to test focus indicators.
- **Manual keyboard test:** Tab, Shift+Tab, Enter, Space, Escape on both pages at desktop and 390px widths.
- **Public tools:** Lighthouse (Chrome DevTools > Lighthouse > Accessibility) and WAVE (wave.webaim.org or the browser extension) should also be run by the reviewer. Their scores are not included here because they could not be run in the build environment; a fill-in table is in section 7.

Run the local audit with: `node tools/audit.js before/index.html after/index.html`

## 3. Audit results (measured)
| Check | WCAG | Before | After |
|---|---|---|---|
| Page language | 3.1.1 | Fail (missing) | Pass (`en`) |
| Descriptive title | 2.4.2 | Fail ("Blog") | Pass |
| Zoom not disabled | 1.4.4 | Fail (`user-scalable=no`) | Pass |
| Landmarks | 1.3.1 / 2.4.1 | Fail (none) | Pass (header, nav, main, footer, search) |
| Skip link | 2.4.1 | Fail | Pass |
| One h1 / heading order | 1.3.1 / 2.4.6 | Fail (no h1, h4 only) | Pass (h1, h2, h3) |
| Image alt text | 1.1.1 | Fail (6 of 6 missing) | Pass (0 missing) |
| Form labels | 1.3.1 / 3.3.2 | Fail (2 of 2 unlabeled) | Pass |
| Real interactive elements | 2.1.1 / 4.1.2 | Fail (10 div/span click targets) | Pass (0) |
| Keyboard reachable | 2.1.1 | Fail (9 unreachable) | Pass (0) |
| Descriptive link text | 2.4.4 | Fail (6 "click here") | Pass |
| Text contrast | 1.4.3 | Fail (37 of 38 elements) | Pass (0 of 59) |
| Focus outline kept | 2.4.7 | Fail (`:focus{outline:none}`) | Pass |
| Visible focus on tab stops | 2.4.7 | 0 of 8 visible | 21 of 21 visible |
| Duplicate ids | 4.1.1 | Pass | Pass |
| **Rule checks passed** | | **1 / 15** (plus keyboard check fails) | **15 / 15** |

Note: these counts come from a custom script covering a subset of WCAG. Passing it does not prove full conformance; manual testing with a screen reader is still recommended.

## 4. Improvements made and why they help
### 4.1 Semantic structure
- `lang="en"`, a meaningful `<title>`, and `<header>`, `<nav>`, `<main>`, `<footer>`, `role="search"` landmarks. Screen reader users can jump between regions instead of listening to the whole page.
- A single `<h1>` and an ordered h2/h3 outline. Headings are the main navigation method for many blind users.
- Cards are `<article>` elements inside a `<ul>`, so a screen reader announces "list, 6 items".
- A **skip link** and a focusable `<main>` let keyboard users bypass the header (WCAG 2.4.1).

### 4.2 ARIA for dynamic content
- **Menu toggle:** a real `<button>` with `aria-expanded` and `aria-controls`; Escape closes it and returns focus to the button.
- **Topic filter:** buttons with `aria-pressed` inside a labelled `role="group"`. A `role="status"` live region announces "Showing 2 of 6 articles in Code" without moving focus (WCAG 4.1.3).
- **Newsletter form:** `<label>`, `aria-describedby` for hint and error, `aria-invalid` on error, and focus moved to the field. Error text includes an icon and words, not colour only (WCAG 1.4.1, 3.3.1). Success is announced through a status region.
- `aria-current="page"` marks the current navigation item. Native semantics are preferred; ARIA is added only where HTML has no equivalent (first rule of ARIA).

### 4.3 Keyboard navigation and focus
- All controls are native `<a>` and `<button>` elements, so Enter and Space work with no extra code.
- A high-visibility focus style (3px outline plus a contrasting ring) on every control, with a light variant on the dark header (WCAG 2.4.7, 2.4.11).
- Logical tab order equals DOM order; hidden cards use the `hidden` attribute, which removes them from the tab order.
- Interactive targets are at least 44px high (WCAG 2.5.8).

### 4.4 Colour and contrast
- Body text `#1a1a1a` on white is about 17:1; muted text `#4d4d4d` is about 8:1; brand blue `#0b4fbf` is about 7.6:1. The original used `#999` on white (2.8:1) and `#bbb` (about 1.9:1).
- Links are underlined and the selected filter shows a checkmark, so nothing depends on colour alone.

### 4.5 Responsive and adaptive
- Relative units (`rem`) so text scales with the user's browser setting; zoom is allowed and the layout reflows to one column at 720px (WCAG 1.4.4, 1.4.10).
- `prefers-reduced-motion` and `forced-colors` (Windows High Contrast) rules.
- **Progressive enhancement:** without JavaScript the navigation stays visible and every article remains readable.

### 4.6 Images
- Each image has a meaningful `alt`, explicit `width` and `height`, and `loading="lazy"`.
- "Read more" links include hidden text naming the article, so a list of links out of context is still understandable (WCAG 2.4.4).

## 5. Functional testing (after page)
| Test | Result |
|---|---|
| First Tab stop is "Skip to main content"; Enter moves focus to main | Pass |
| Menu button toggles `aria-expanded`; Escape closes and focuses button | Pass |
| Filter "Code" shows 2 of 6 and updates the live region | Pass |
| Empty submit shows error, sets `aria-invalid`, focuses the field | Pass |
| Valid email shows a success status message | Pass |
| No JavaScript errors in the console | Pass |

## 6. Standards mapping
The changes address WCAG 2.1 success criteria 1.1.1, 1.3.1, 1.4.1, 1.4.3, 1.4.4, 1.4.10, 2.1.1, 2.4.1, 2.4.2, 2.4.4, 2.4.6, 2.4.7, 3.1.1, 3.3.1, 3.3.2, 4.1.2 and 4.1.3, plus 2.4.11 and 2.5.8 from WCAG 2.2.

## 7. Public tool scores (to fill in)
| Tool | Before | After |
|---|---|---|
| Lighthouse Accessibility | ___ / 100 | ___ / 100 |
| WAVE errors / contrast errors | ___ | ___ |

## 8. Limitations and next steps
- Test with NVDA (Windows), VoiceOver (macOS/iOS) and TalkBack to confirm announcements.
- The search form is a placeholder and does not filter results.
- Add captions or transcripts if video or audio is introduced.
