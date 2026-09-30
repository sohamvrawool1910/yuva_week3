/**
 * Automated accessibility audit (Playwright). A lightweight, local complement to
 * Lighthouse / WAVE / axe – it checks a subset of WCAG 2.1 AA rules.
 * Usage: node tools/audit.js before/index.html after/index.html
 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const path = require('path');

async function audit(page, file) {
  await page.goto('file://' + path.resolve(file));
  return page.evaluate(() => {
    const out = [];
    const add = (rule, wcag, pass, detail) => out.push({ rule, wcag, pass, detail });
    const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden'; };

    // --- colour helpers ---
    const parse = c => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] === undefined ? 1 : m[3] }; };
    const over = (top, bot) => ({ r: top.r*top.a + bot.r*(1-top.a), g: top.g*top.a + bot.g*(1-top.a), b: top.b*top.a + bot.b*(1-top.a), a: 1 });
    const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }; return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b); };
    const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05); };
    const bgOf = el => { const chain = []; for (let e = el; e; e = e.parentElement) chain.unshift(e); let bg = { r:255,g:255,b:255,a:1 }; chain.forEach(e => { bg = over(parse(getComputedStyle(e).backgroundColor), bg); }); return bg; };

    // 3.1.1 / 2.4.2 / 1.4.4
    add('Page language set', '3.1.1', !!document.documentElement.lang, document.documentElement.lang || 'missing');
    add('Descriptive page title', '2.4.2', document.title.trim().split(/\s+/).length >= 3, document.title);
    const vp = (document.querySelector('meta[name=viewport]') || {}).content || '';
    add('Zoom not disabled', '1.4.4', !/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/.test(vp), vp);

    // Landmarks
    const has = s => document.querySelector(s);
    add('Landmarks (banner, nav, main, contentinfo)', '1.3.1 / 2.4.1', !!(has('header,[role=banner]') && has('nav,[role=navigation]') && has('main,[role=main]') && has('footer,[role=contentinfo]')), 'header:' + !!has('header') + ' nav:' + !!has('nav') + ' main:' + !!has('main') + ' footer:' + !!has('footer'));
    add('Skip link present', '2.4.1', !!document.querySelector('a[href^="#"]:first-of-type') && /skip/i.test((document.querySelector('a') || {}).textContent || ''), (document.querySelector('a') || {}).textContent || 'none');

    // Headings
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
    let skipped = false; hs.forEach((l, i) => { if (i === 0 ? l !== 1 : l - hs[i-1] > 1) skipped = true; });
    add('Exactly one h1', '1.3.1', hs.filter(l => l === 1).length === 1, 'h1 count ' + hs.filter(l => l === 1).length);
    add('Heading levels not skipped', '1.3.1 / 2.4.6', !skipped && hs.length > 0, 'sequence h' + hs.join(',h'));

    // Images
    const imgs = [...document.querySelectorAll('img')];
    const noAlt = imgs.filter(i => !i.hasAttribute('alt'));
    add('Images have alt text', '1.1.1', noAlt.length === 0, noAlt.length + ' of ' + imgs.length + ' missing alt');

    // Form controls
    const ctrls = [...document.querySelectorAll('input:not([type=hidden]):not([type=submit]),select,textarea')];
    const unnamed = ctrls.filter(c => !(c.labels && c.labels.length) && !c.getAttribute('aria-label') && !c.getAttribute('aria-labelledby'));
    add('Form controls have programmatic labels', '1.3.1 / 3.3.2 / 4.1.2', unnamed.length === 0, unnamed.length + ' of ' + ctrls.length + ' unlabeled (placeholder is not a label)');

    // Custom "buttons" made from non-interactive elements
    const fake = [...document.querySelectorAll('[onclick]')].filter(e => !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(e.tagName) && !e.getAttribute('role') && e.tabIndex < 0);
    add('Interactive controls are real, focusable elements', '2.1.1 / 4.1.2', fake.length === 0, fake.length + ' non-semantic click targets');
    const pointers = [...document.querySelectorAll('body *')].filter(e => vis(e) && getComputedStyle(e).cursor === 'pointer' && e.tabIndex < 0 && !e.closest('a,button,label'));
    add('Nothing clickable is unreachable by keyboard', '2.1.1', pointers.length === 0, pointers.length + ' cursor:pointer elements not focusable');

    // Link text
    const vague = [...document.querySelectorAll('a')].filter(a => /^(click here|here|read more|more)$/i.test(a.textContent.trim()));
    add('Link text is descriptive', '2.4.4', vague.length === 0, vague.length + ' vague links');

    // Duplicate ids
    const ids = [...document.querySelectorAll('[id]')].map(e => e.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    add('No duplicate ids', '4.1.1', dup.length === 0, dup.join(',') || 'none');

    // Contrast (text elements with direct text)
    const bad = []; let checked = 0;
    document.querySelectorAll('body *').forEach(el => {
      if (!vis(el)) return;
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
      if (el.closest('.sr-only')) return;
      const s = getComputedStyle(el); const fg = over(parse(s.color), bgOf(el)); const bg = bgOf(el);
      const px = parseFloat(s.fontSize), bold = +s.fontWeight >= 700; const large = px >= 24 || (px >= 18.66 && bold);
      const need = large ? 3 : 4.5; const r = ratio(fg, bg); checked++;
      if (r < need) bad.push(el.tagName.toLowerCase() + '.' + (el.className || '') + ' ' + r.toFixed(2) + ':1');
    });
    add('Text contrast ≥ 4.5:1 (3:1 large)', '1.4.3', bad.length === 0, bad.length + ' of ' + checked + ' text elements fail' + (bad.length ? ' (e.g. ' + bad.slice(0, 3).join('; ') + ')' : ''));

    // Focus visibility: CSS-level rule check
    const ss = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } });
    const killsOutline = ss.some(r => r.selectorText && /^:focus\b/.test(r.selectorText) && /outline:\s*none|outline-style:\s*none/.test(r.cssText));
    add('Focus outline is not removed', '2.4.7', !killsOutline, killsOutline ? ':focus { outline:none } found' : 'ok');
    return out;
  });
}

async function keyboard(page, file) {
  await page.goto('file://' + path.resolve(file));
  const stops = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return null;
      const s = getComputedStyle(e);
      const visible = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none';
      return { name: (e.getAttribute('aria-label') || e.textContent || e.placeholder || e.tagName).trim().slice(0, 30), visible };
    });
    if (!info || stops.some(s => s.name === info.name && s.i > 0 && i > 10)) break;
    stops.push({ ...info, i });
  }
  return stops;
}

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  for (const file of process.argv.slice(2)) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const res = await audit(page, file);
    const kb = await keyboard(page, file);
    const pass = res.filter(r => r.pass).length;
    console.log('\n=== ' + file + ' ===');
    res.forEach(r => console.log((r.pass ? 'PASS' : 'FAIL') + ' | ' + r.rule + ' [WCAG ' + r.wcag + '] – ' + r.detail));
    const invisible = kb.filter(k => !k.visible).length;
    console.log((kb.length > 0 && invisible === 0 ? 'PASS' : 'FAIL') + ' | Keyboard: ' + kb.length + ' tab stops reached, ' + invisible + ' without a visible focus indicator [WCAG 2.4.7]');
    console.log('SCORE: ' + pass + '/' + res.length + ' rule checks passed; keyboard tab stops = ' + kb.length);
    await page.close();
  }
  await browser.close();
})();
