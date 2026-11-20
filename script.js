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

  // Register: the "sizes for the extra shirts" box appears (and is required) only when extra shirts > 0.
  var extra = document.getElementById('r-extra'), extraBox = document.getElementById('extra-sizes');
  if (extra && extraBox) {
    var syncExtra = function () {
      var more = Number(extra.value) > 0;
      extraBox.classList.toggle('hidden', !more);
      extraBox.querySelector('input').required = more;
    };
    extra.addEventListener('change', syncExtra); syncExtra();
  }

  // Register and Partners/Advertise forms go to the club's Google Sheet (no email). A form stays "not open yet"
  // until its address replaces SHEET_URL_PENDING (scripts/set-chess-links.py).
  var sheetForms = document.querySelectorAll('form[data-sheet]');
  for (var sf = 0; sf < sheetForms.length; sf++) {
    sheetForms[sf].addEventListener('submit', function (e) {
      var f = e.currentTarget;
      e.preventDefault();
      var say = function (id, msg) {
        ['form-notice', 'form-done', 'form-error'].forEach(function (n) { var el = f.querySelector('#' + n); if (el) el.classList.remove('is-visible'); });
        var el = f.querySelector('#' + id); if (!el) return; if (msg) el.textContent = msg; el.classList.add('is-visible'); el.focus();
      };
      var url = f.getAttribute('action');
      if (url.indexOf('SHEET_URL_PENDING') !== -1) { say('form-notice'); return; }
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true;
      fetch(url, { method: 'POST', body: new URLSearchParams(new FormData(f)) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) {
            f.reset();
            var g = document.getElementById('guardian-section');
            if (g && f.contains(g)) { g.classList.add('hidden'); f.querySelectorAll('[data-guardian]').forEach(function (i) { i.required = false; }); }
            if (extraBox && f.contains(extraBox)) { extraBox.classList.add('hidden'); extraBox.querySelector('input').required = false; }
            say('form-done');
          } else say('form-error', res.error || 'Something went wrong. Please try again.');
        })
        .catch(function () { say('form-error', 'We couldn\u2019t send this. Please try again, or message us on our Facebook page.'); })
        .then(function () { btn.disabled = false; });
    });
  }

  // Bigger picture in a pop-up: any element with data-lightbox="<image>" (Pay & Donate T-shirt card).
  var box = document.querySelector('dialog.lightbox');
  if (box && box.showModal) {
    var last = null, img = box.querySelector('img'), cap = box.querySelector('.lightbox-caption');
    var openers = document.querySelectorAll('[data-lightbox]');
    for (var lb = 0; lb < openers.length; lb++) {
      openers[lb].addEventListener('click', function (e) {
        last = e.currentTarget;
        img.src = last.getAttribute('data-lightbox');
        img.alt = (last.querySelector('img') || {}).alt || '';
        cap.textContent = last.getAttribute('data-caption') || '';
        box.showModal();
      });
    }
    box.querySelector('.lightbox-close').addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });   // click outside the picture
    box.addEventListener('close', function () { if (last) last.focus(); });
  }

  // Partners page tabs (Partners / Donors / Advertise). Without this script all three sections simply show in turn.
  var tabs = document.querySelectorAll('.tab[role=tab]');
  if (tabs.length) {
    var show = function (id, focus) {
      for (var i = 0; i < tabs.length; i++) {
        var on = tabs[i].getAttribute('aria-controls') === id;
        tabs[i].setAttribute('aria-selected', on ? 'true' : 'false'); tabs[i].tabIndex = on ? 0 : -1;
        document.getElementById(tabs[i].getAttribute('aria-controls')).hidden = !on;
        if (on && focus) tabs[i].focus();
      }
    };
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function (e) { var id = e.currentTarget.getAttribute('aria-controls'); show(id); history.replaceState(null, '', '#' + id); });
      tabs[t].addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var list = Array.prototype.slice.call(tabs), i = list.indexOf(e.currentTarget);
        var next = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
        show(next.getAttribute('aria-controls'), true);
      });
    }
    var fromHash = function () { var id = (location.hash || '').slice(1); show(document.getElementById(id) && document.getElementById('tab-' + id) ? id : tabs[0].getAttribute('aria-controls')); };
    window.addEventListener('hashchange', fromHash);
    fromHash();
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
