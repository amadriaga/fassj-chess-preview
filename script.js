// FASSJ Chess Club: site behaviour
(function () {
  // Mobile menu
  var toggle = document.querySelector('.menu-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Footer year
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // Parent / guardian name: shown and required only when "Under 18" is chosen.
  var reg = document.getElementById('register-form');
  if (reg) {
    var guardian = document.getElementById('guardian-section');
    var gInputs = reg.querySelectorAll('[data-guardian]');
    var sync = function () {
      var minor = !!reg.querySelector('#r-minor:checked');
      if (guardian) guardian.classList.toggle('hidden', !minor);
      for (var i = 0; i < gInputs.length; i++) gInputs[i].required = minor;
    };
    var ages = reg.querySelectorAll('input[name="age_group"]');
    for (var j = 0; j < ages.length; j++) ages[j].addEventListener('change', sync);
    sync();
  }

  // Register: sign-ups go to the club's Google Sheet (no email). Nothing is sent until the address replaces SHEET_URL_PENDING.
  var sheetForm = document.querySelector('form[data-sheet]');
  if (sheetForm) {
    var show = function (id, msg) {
      ['form-notice', 'form-done', 'form-error'].forEach(function (n) { var el = document.getElementById(n); if (el) el.classList.remove('is-visible'); });
      var el = document.getElementById(id); if (msg) el.textContent = msg; el.classList.add('is-visible'); el.focus();
    };
    sheetForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = sheetForm.getAttribute('action');
      if (url.indexOf('SHEET_URL_PENDING') !== -1) { show('form-notice'); return; }
      var btn = sheetForm.querySelector('button[type=submit]'); btn.disabled = true;
      var body = new URLSearchParams(new FormData(sheetForm));
      fetch(url, { method: 'POST', body: body })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) { sheetForm.reset(); sheetForm.querySelectorAll('[data-guardian]').forEach(function (i) { i.required = false; }); document.getElementById('guardian-section').classList.add('hidden'); show('form-done'); }
          else show('form-error', res.error || 'Something went wrong. Please try again.');
        })
        .catch(function () { show('form-error', 'We couldn\u2019t send your sign-up. Please try again, or register on our Facebook page.'); })
        .then(function () { btn.disabled = false; });
    });
  }

  // Forms send to Formspree in the background and say thank you on the same page.
  // Until a real form ID replaces FORM_ID_PENDING, nothing is sent. Without this script, Formspree's own thank-you page is the fallback.
  var forms = document.querySelectorAll('form[data-formspree]');
  for (var k = 0; k < forms.length; k++) {
    forms[k].addEventListener('submit', function (e) {
      var f = e.currentTarget;
      e.preventDefault();
      var say = function (id, msg) {
        ['form-notice', 'form-done', 'form-error'].forEach(function (n) { var el = f.querySelector('#' + n); if (el) el.classList.remove('is-visible'); });
        var el = f.querySelector('#' + id); if (!el) return; if (msg) el.textContent = msg; el.classList.add('is-visible'); el.focus();
      };
      if (f.getAttribute('action').indexOf('FORM_ID_PENDING') !== -1) { say('form-notice'); return; }
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      fetch(f.getAttribute('action'), { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok) { f.reset(); say('form-done'); }
          else say('form-error', (res.j && res.j.errors && res.j.errors.map(function (x) { return x.message; }).join(' ')) || 'Something went wrong. Please try again.');
        })
        .catch(function () { say('form-error', 'We couldn\u2019t send your message. Please try again, or message us on Facebook.'); })
        .then(function () { btn.disabled = false; });
    });
  }
})();
