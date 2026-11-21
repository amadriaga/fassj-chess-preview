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

  // Register (spec §28): any age group under 18 shows the parent/guardian name and the parent's signature box;
  // adults sign for themselves. The typed signature must match the name it signs for (checked again by the sheet script).
  var reg = document.getElementById('register-form');
  var isMinor = function () { var a = document.getElementById('r-age'); return !!(a && a.value && a.value !== 'Adult (18+)'); };
  if (reg) {
    var guardian = document.getElementById('guardian-section');
    var gInputs = reg.querySelectorAll('[data-guardian]');
    var sm = document.getElementById('sign-member'), sg = document.getElementById('sign-guardian');
    var smIn = document.getElementById('r-sign-member'), sgIn = document.getElementById('r-sign-guardian');
    var preview = document.getElementById('sign-preview'), br = document.getElementById('r-browser');
    if (br) br.value = navigator.userAgent.slice(0, 300);
    var norm = function (v) { return String(v || '').trim().replace(/\s+/g, ' ').toLowerCase(); };
    var today = function () { return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); };
    var sync = function () {
      var minor = isMinor();
      if (guardian) guardian.classList.toggle('hidden', !minor);
      for (var i = 0; i < gInputs.length; i++) gInputs[i].required = minor;
      if (sm && sg) { sm.classList.toggle('hidden', minor); sg.classList.toggle('hidden', !minor); smIn.required = !minor; sgIn.required = minor; }
      sign();
    };
    var sign = function () {
      if (!preview || !smIn) return;
      var minor = isMinor(), typed = (minor ? sgIn : smIn).value.trim();
      var want = minor ? document.getElementById('r-guardian').value : document.getElementById('r-name').value;
      var match = typed && norm(typed) === norm(want);
      (minor ? sgIn : smIn).setCustomValidity(typed && !match ? (minor ? 'Please type the parent or guardian\u2019s full name exactly as above.' : 'Please type the player\u2019s full name exactly as above.') : '');
      preview.classList.toggle('hidden', !match);
      if (match) preview.textContent = 'Signed electronically by ' + typed + ' \u00b7 ' + today();
    };
    var age = document.getElementById('r-age');
    if (age) age.addEventListener('change', sync);
    ['r-name', 'r-guardian', 'r-sign-member', 'r-sign-guardian'].forEach(function (id) { var x = document.getElementById(id); if (x) x.addEventListener('input', sign); });
    reg.addEventListener('reset', function () { setTimeout(sync, 0); });
    sync();
  }

  // Register: extra shirts. 1-4 = one size drop-down per shirt (each required); "5 or more" = one text box pre-filled
  // "Please call me for the sizes". The choices are joined into the hidden extra_sizes field (spec §22).
  var extra = document.getElementById('r-extra'), extraBox = document.getElementById('extra-sizes');
  if (extra && extraBox) {
    var many = document.getElementById('extra-many'), manyIn = document.getElementById('r-extra-many'), joined = document.getElementById('r-extra-sizes');
    var rows = extraBox.querySelectorAll('[data-extra-row]');
    var syncExtra = function () {
      var v = extra.value, n = v === '5 or more' ? 5 : Number(v);
      extraBox.classList.toggle('hidden', n === 0);
      for (var i = 0; i < rows.length; i++) {
        var on = n >= 1 && n <= 4 && i < n, sel = rows[i].querySelector('select');
        rows[i].classList.toggle('hidden', !on); sel.required = on;
      }
      many.classList.toggle('hidden', n !== 5); manyIn.required = n === 5;
      if (n === 5 && !manyIn.value.trim()) manyIn.value = 'Please call me for the sizes';
    };
    var joinSizes = function () {
      var v = extra.value, n = v === '5 or more' ? 5 : Number(v), out = [];
      if (n === 5) { joined.value = manyIn.value.trim(); return; }
      for (var i = 0; i < n; i++) out.push('Shirt ' + (i + 1) + ': ' + rows[i].querySelector('select').value);
      joined.value = out.join('; ');
    };
    extra.addEventListener('change', syncExtra); syncExtra();
    var rf = document.getElementById('register-form');
    rf.addEventListener('submit', joinSizes, true);            // runs before the form is sent
    rf.addEventListener('reset', function () { setTimeout(syncExtra, 0); });
  }

  // Register: "Who's registered" list (opt-in names only, spec §27). Hidden if the list can't load.
  var roster = document.getElementById('roster'), regForm = document.querySelector('form[data-sheet="register"]');
  if (roster && regForm) {
    var minorNote = document.getElementById('list-minor-note');
    var ageSel = document.getElementById('r-age');
    if (ageSel) ageSel.addEventListener('change', function () { if (minorNote) minorNote.hidden = !isMinor(); });
    var rurl = regForm.getAttribute('action');
    if (rurl.indexOf('SHEET_URL_PENDING') === -1) {
      fetch(rurl + '?action=roster').then(function (r) { return r.json(); }).then(function (res) {
        if (!res || !res.ok) return;
        var body = document.getElementById('roster-body'), list = res.players || [];
        document.getElementById('roster-count').textContent = res.total === 1 ? '1 player has registered so far.' : res.total + ' players have registered so far.';
        body.innerHTML = list.length ? list.map(function (p) {
          var d = document.createElement('tr'), a = document.createElement('td'), b = document.createElement('td');
          a.textContent = p.name; b.textContent = p.level || '\u2014'; d.appendChild(a); d.appendChild(b); return d.outerHTML;
        }).join('') : '<tr><td colspan="2">No one has chosen to be listed yet. Be the first!</td></tr>';
        roster.classList.remove('hidden');
      }).catch(function () {});
    }
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
            var pdfA = f.querySelector('#form-pdf'), idS = f.querySelector('#form-done-id');
            if (pdfA && res.pdf) {
              var bin = atob(res.pdf), bytes = new Uint8Array(bin.length);
              for (var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
              pdfA.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
              pdfA.setAttribute('download', 'FASSJ-Chess-Club-membership-form-' + (res.formId || 'signed') + '.pdf');
              pdfA.classList.remove('hidden');
            }
            if (idS) idS.textContent = res.formId ? 'Your form number is ' + res.formId + '.' : '';
            f.reset();
            var g = document.getElementById('guardian-section');
            if (g && f.contains(g)) { g.classList.add('hidden'); f.querySelectorAll('[data-guardian]').forEach(function (i) { i.required = false; }); }
            if (extraBox && f.contains(extraBox)) { extraBox.classList.add('hidden'); }
            say('form-done');
          } else say('form-error', res.error || 'Something went wrong. Please try again.');
        })
        .catch(function () { say('form-error', 'We couldn\u2019t send this. Please try again, or message us on our Facebook page.'); })
        .then(function () { btn.disabled = false; });
    });
  }

  // Bigger picture in a pop-up: any element with data-lightbox="<image>" (also gallery items added later).
  var box = document.querySelector('dialog.lightbox');
  if (box && box.showModal) {
    var last = null, img = box.querySelector('img'), cap = box.querySelector('.lightbox-caption');
    document.addEventListener('click', function (e) {
      var opener = e.target.closest && e.target.closest('[data-lightbox]');
      if (!opener) return;
      last = opener;
      img.src = opener.getAttribute('data-lightbox');
      img.alt = (opener.querySelector('img') || {}).alt || '';
      cap.textContent = opener.getAttribute('data-caption') || '';
      box.showModal();
    });
    box.querySelector('.lightbox-close').addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });   // click outside the picture
    box.addEventListener('close', function () { if (last) last.focus(); });
  }

  // 2028 shirt contest page: gallery + vote, entry form (spec §25). The address comes from <main data-contest-api>.
  var cmain = document.querySelector('main[data-contest-api]');
  if (cmain) {
    var api = cmain.getAttribute('data-contest-api'), pending = api.indexOf('SHEET_URL_PENDING') !== -1;
    var status = document.getElementById('contest-status'), grid = document.getElementById('contest-grid');
    var state = { entriesOpen: false, votingOpen: false, choice: null, choiceTitle: '' };
    var esc = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
    var post = function (data) {
      return fetch(api, { method: 'POST', body: new URLSearchParams(data) }).then(function (r) { return r.json(); });
    };
    var note = function (el, msg, ok) { el.textContent = msg; el.classList.toggle('notice--ok', !!ok); el.classList.add('is-visible'); el.focus(); };
    var showStatus = function () {
      if (pending) { status.innerHTML = 'The contest opens soon. Check back here, or follow our <a href="https://www.facebook.com/profile.php?id=61596920540950" rel="noopener">Facebook page</a>.'; return; }
      status.innerHTML = '<b>Entries:</b> ' + (state.entriesOpen ? 'open' : 'not open yet') + ' &middot; <b>Voting:</b> ' + (state.votingOpen ? 'open' : 'not open yet');
    };
    var castBtn = document.getElementById('v-cast'), codeIn = document.getElementById('v-code');
    var syncCast = function () { castBtn.disabled = !(state.votingOpen && state.choice && /^\d{6}$/.test(codeIn.value.trim())); };
    var render = function (list) {
      if (!list.length) { grid.innerHTML = '<p class="note">No designs in the gallery yet. They appear here once a club officer has checked them.</p>'; return; }
      grid.innerHTML = list.map(function (x) {
        return '<article class="card contest-card">' +
          '<button class="contest-pic" type="button" data-lightbox="' + esc(x.img) + '" data-caption="' + esc(x.title + ' by ' + x.name) + '"><img src="' + esc(x.img) + '" alt="' + esc('T-shirt design: ' + x.title) + '" loading="lazy"></button>' +
          '<h3>' + esc(x.title) + '</h3><p>by ' + esc(x.name) + '</p>' +
          (state.votingOpen ? '<label class="check vote-tick"><input type="radio" name="entry" value="' + esc(x.id) + '" data-title="' + esc(x.title) + '"> Vote for this design</label>' : '') +
          '</article>';
      }).join('');
      grid.querySelectorAll('input[name=entry]').forEach(function (r) {
        r.addEventListener('change', function () {
          state.choice = r.value; state.choiceTitle = r.getAttribute('data-title');
          document.getElementById('vote-choice').innerHTML = 'Your choice: <b>' + esc(state.choiceTitle) + '</b>';
          syncCast();
        });
      });
    };
    var load = function () {
      if (pending) { showStatus(); return; }
      fetch(api + '?action=gallery').then(function (r) { return r.json(); }).then(function (res) {
        state.entriesOpen = !!res.entriesOpen; state.votingOpen = !!res.votingOpen;
        showStatus(); render(res.entries || []);
        document.getElementById('vote-form').classList.toggle('hidden', !state.votingOpen);
      }).catch(function () { status.textContent = 'We couldn\u2019t load the gallery right now. Please try again later.'; });
    };
    load();

    // Entry form
    var ef = document.getElementById('entry-form'), emsg = document.getElementById('entry-msg');
    var eg = document.getElementById('e-guardian'), egIn = ef.querySelectorAll('[data-eg]');
    ef.querySelectorAll('input[name=age_group]').forEach(function (r) { r.addEventListener('change', function () {
      var minor = !!ef.querySelector('#e-minor:checked'); eg.classList.toggle('hidden', !minor); egIn.forEach(function (i) { i.required = minor; });
    }); });
    var fileIn = document.getElementById('e-file'), prev = document.getElementById('e-preview'), dataUrl = '';
    fileIn.addEventListener('change', function () {
      dataUrl = ''; prev.classList.add('hidden');
      var f = fileIn.files[0]; if (!f) return;
      if (!/^image\/(png|jpeg)$/.test(f.type)) { note(emsg, 'Please choose a PNG or JPG image.'); fileIn.value = ''; return; }
      if (f.size > 5 * 1024 * 1024) { note(emsg, 'That image is larger than 5 MB. Please make it smaller.'); fileIn.value = ''; return; }
      var rd = new FileReader(); rd.onload = function () { dataUrl = rd.result; prev.src = dataUrl; prev.classList.remove('hidden'); }; rd.readAsDataURL(f);
    });
    ef.addEventListener('submit', function (e) {
      e.preventDefault();
      if (pending || !state.entriesOpen) { note(emsg, 'Contest entries are not open yet.'); return; }
      if (!ef.checkValidity()) { ef.reportValidity(); return; }
      if (!dataUrl) { note(emsg, 'Please choose your design image.'); return; }
      var btn = ef.querySelector('button[type=submit]'); btn.disabled = true;
      var data = new URLSearchParams(new FormData(ef)); data.set('form', 'entry'); data.set('image', dataUrl); data.set('source', location.hostname);
      fetch(api, { method: 'POST', body: data }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.ok) { ef.reset(); dataUrl = ''; prev.classList.add('hidden'); eg.classList.add('hidden'); note(emsg, 'Thank you! Your design was received. It will appear in the gallery once a club officer has checked it.', true); }
        else note(emsg, res.error || 'Something went wrong. Please try again.');
      }).catch(function () { note(emsg, 'We couldn\u2019t send your design. Please try again.'); }).then(function () { btn.disabled = false; });
    });

    // Vote: email -> code -> cast
    var vf = document.getElementById('vote-form'), vmsg = document.getElementById('vote-msg'), vEmail = document.getElementById('v-email');
    document.getElementById('v-send').addEventListener('click', function () {
      var em = vEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { note(vmsg, 'Please enter the email you registered with.'); return; }
      post({ form: 'code', email: em, source: location.hostname }).then(function (res) {
        if (res.ok) { document.getElementById('v-code-field').classList.remove('hidden'); note(vmsg, 'We emailed you a 6-digit code. It works for 15 minutes (check your spam folder too).', true); codeIn.focus(); }
        else note(vmsg, res.error || 'Something went wrong. Please try again.');
      }).catch(function () { note(vmsg, 'We couldn\u2019t send the code. Please try again.'); });
    });
    codeIn.addEventListener('input', syncCast);
    vf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!state.choice) { note(vmsg, 'Please tick a design in the gallery first.'); return; }
      castBtn.disabled = true;
      post({ form: 'vote', email: vEmail.value.trim(), code: codeIn.value.trim(), entry: state.choice, source: location.hostname }).then(function (res) {
        if (res.ok) { note(vmsg, 'Thank you! Your vote for \u201c' + state.choiceTitle + '\u201d is in. Results are announced when voting closes.', true); vf.querySelectorAll('input,button').forEach(function (x) { x.disabled = true; }); }
        else { note(vmsg, res.error || 'Something went wrong. Please try again.'); syncCast(); }
      }).catch(function () { note(vmsg, 'We couldn\u2019t record your vote. Please try again.'); syncCast(); });
    });
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
