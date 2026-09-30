/**
 * Daily Bytes – accessibility behaviours.
 * 1) Mobile menu toggle (aria-expanded, Escape to close, focus return)
 * 2) Topic filter (aria-pressed + live-region result count)
 * 3) Newsletter validation (aria-invalid, aria-describedby, focus to error)
 */
(function () {
  'use strict';

  /* ---------- 1. Navigation toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    // Escape closes the menu and returns focus to the button
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setOpen(false); }
    });
  }

  /* ---------- 2. Topic filter ---------- */
  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var cards = [].slice.call(document.querySelectorAll('#post-list .card'));
  var count = document.getElementById('result-count');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var cat = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      var shown = 0;
      cards.forEach(function (card) {
        var match = cat === 'all' || card.getAttribute('data-cat') === cat;
        card.hidden = !match;          // hidden removes from a11y tree AND tab order
        if (match) { shown++; }
      });
      // Live region announces the result without moving focus (WCAG 4.1.3)
      count.textContent = 'Showing ' + shown + ' of ' + cards.length + ' articles' +
        (cat === 'all' ? '' : ' in ' + cat);
    });
  });

  /* ---------- 3. Newsletter form ---------- */
  var form = document.getElementById('news-form');
  var email = document.getElementById('email');
  var error = document.getElementById('email-error');
  var status = document.getElementById('news-status');
  if (form && email && error) {
    var showError = function (msg) {
      error.textContent = msg;
      error.hidden = false;
      email.setAttribute('aria-invalid', 'true');
      email.focus();                               // WCAG 3.3.1: take user to the problem
    };
    var clearError = function () {
      error.hidden = true; error.textContent = '';
      email.removeAttribute('aria-invalid');
    };
    email.addEventListener('input', clearError);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      var v = email.value.trim();
      if (!v) { return showError('Enter your email address.'); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        return showError('Enter an email address in the format name@example.com.');
      }
      clearError();
      status.textContent = 'Thank you! You are subscribed as ' + v + '.';
      form.reset();
    });
  }
})();
