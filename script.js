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
    // Under-18s: the parent/guardian is the default emergency contact (spec §28.3b). A field the person edits is left alone.
    var em = [['r-em-name', function () { return document.getElementById('r-guardian').value; }],
              ['r-em-rel', function () { return 'Parent/guardian'; }],
              ['r-em-phone', function () { return document.getElementById('r-phone').value; }]];
    var emNote = document.getElementById('em-auto-note');
    var emFill = function () {
      var minor = isMinor(), any = false;
      em.forEach(function (e) {
        var f = document.getElementById(e[0]); if (!f || f.dataset.edited === '1') return;
        if (minor) { f.value = e[1](); f.dataset.auto = '1'; any = true; }
        else if (f.dataset.auto === '1') { f.value = ''; delete f.dataset.auto; }
      });
      if (emNote) emNote.classList.toggle('hidden', !(minor && any));
    };
    em.forEach(function (e) {
      var f = document.getElementById(e[0]);
      if (f) f.addEventListener('input', function () { f.dataset.edited = '1'; delete f.dataset.auto; });
    });
    ['r-guardian', 'r-phone'].forEach(function (id) { var x = document.getElementById(id); if (x) x.addEventListener('input', emFill); });
    reg.addEventListener('reset', function () { em.forEach(function (e) { var f = document.getElementById(e[0]); if (f) { delete f.dataset.edited; delete f.dataset.auto; } }); setTimeout(emFill, 0); });
    var age = document.getElementById('r-age');
    if (age) age.addEventListener('change', function () { sync(); emFill(); });
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
          var d = document.createElement('tr'), a = document.createElement('td'), g = document.createElement('td'), b = document.createElement('td');
          a.textContent = p.name; var ag = p.age || '', m = /\((?:ages )?([^)]+)\)/.exec(ag); g.textContent = m ? m[1] : (ag || '\u2014'); if (ag) g.title = ag; b.textContent = p.level || '\u2014'; d.appendChild(a); d.appendChild(g); d.appendChild(b); return d.outerHTML;
        }).join('') : '<tr><td colspan="3">No one has chosen to be listed yet. Be the first!</td></tr>';
        roster.classList.remove('hidden');
      }).catch(function () {});
    }
  }

  // Register: officers sign in with email + Google Authenticator code and approve forms with a tick (spec §28.5a).
  var obox = document.getElementById('officer-box'), omain = document.querySelector('main[data-approve-api]');
  if (obox && omain) {
    var oapi = omain.getAttribute('data-approve-api'), olog = document.getElementById('officer-login'), opan = document.getElementById('officer-panel');
    var omsg = document.getElementById('officer-msg'), lmsg = document.getElementById('officer-login-msg'), obody = document.getElementById('officer-body');
    var tok = function (v) { try { if (v === undefined) return sessionStorage.getItem('fassjOfficer') || ''; if (v) sessionStorage.setItem('fassjOfficer', v); else sessionStorage.removeItem('fassjOfficer'); } catch (e) { return ''; } };
    var post = function (data) { return fetch(oapi, { method: 'POST', body: new URLSearchParams(data) }).then(function (r) { return r.json(); }); };
    var say = function (el, m, good) { el.textContent = m || ''; el.classList.toggle('ok', !!good); };
    var signOut = function (m) { tok(''); opan.classList.add('hidden'); olog.classList.remove('hidden'); say(lmsg, m || ''); };
    var cell = function (tr, x) { var td = document.createElement('td'); if (typeof x === 'string') td.textContent = x; else if (x) td.appendChild(x); tr.appendChild(td); return td; };
    var openPdf = function (id, btn) {
      btn.disabled = true; say(omsg, 'Opening ' + id + '…', true);
      post({ form: 'officer_pdf', token: tok(), id: id }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) return say(omsg, res.error);
        var bin = atob(res.pdf), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.download = 'FASSJ-Chess-Club-form-' + id + '.pdf'; document.body.appendChild(a); a.click(); a.remove();
        say(omsg, '');
      }).catch(function () { say(omsg, 'Couldn’t open the PDF. Please try again.'); }).then(function () { btn.disabled = false; });
    };
    var load = function () {
      post({ form: 'officer_forms', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) return say(omsg, res.error);
        document.getElementById('officer-name').textContent = res.name;
        document.getElementById('invite-form').classList.toggle('hidden', !res.canInvite);
        loadEntries();
        olog.classList.add('hidden'); opan.classList.remove('hidden'); obody.innerHTML = '';
        if (!res.forms.length) { var tr0 = document.createElement('tr'); cell(tr0, 'No signed forms yet.').colSpan = 6; obody.appendChild(tr0); return; }
        res.forms.forEach(function (f) {
          var tr = document.createElement('tr'), b = document.createElement('button'), box = document.createElement('input'), lab = document.createElement('label'), by = document.createElement('span');
          cell(tr, f.id); cell(tr, f.name + (f.guardian ? ' (parent: ' + f.guardian + ')' : '')); cell(tr, f.age); var sc = cell(tr, f.signedAt.replace(/ at .*/, '')); if (f.revision > 1) { var up = document.createElement('span'); up.className = 'by'; up.textContent = 'Updated ' + f.updatedAt + ' (rev ' + f.revision + ')'; sc.appendChild(up); }
          if (f.signed === false) {   // spec §43: not signed yet -> nothing to view or approve
            cell(tr, 'Not signed yet');
            var wait = document.createElement('span'); wait.className = 'by'; wait.textContent = 'Waiting for the member to complete and sign it (Change my registration)';
            cell(tr, wait); obody.appendChild(tr); return;
          }
          b.type = 'button'; b.className = 'link'; b.textContent = 'View'; b.addEventListener('click', function () { openPdf(f.id, b); }); cell(tr, b);
          box.type = 'checkbox'; box.setAttribute('aria-label', 'Approve form ' + f.id); by.className = 'by';
          var mailNote = document.createElement('span'), mailBtn = document.createElement('button');
          mailNote.className = 'by'; mailBtn.type = 'button'; mailBtn.className = 'link'; mailBtn.textContent = 'Email copy';
          mailBtn.addEventListener('click', function () {   // spec §43: send (again) the approved PDF to the form's email
            if (!window.confirm('Email the approved form ' + f.id + ' to the email on the form?')) return;
            mailBtn.disabled = true; say(omsg, 'Emailing ' + f.id + '…', true);
            post({ form: 'officer_email_approved', token: tok(), id: f.id }).then(function (res) {
              if (res.signedOut) return signOut(res.error);
              mailBtn.disabled = false; mailNote.textContent = res.emailNote || res.error || '';
              say(omsg, res.ok ? f.id + ': ' + res.emailNote + '.' : res.error, res.ok);
            }).catch(function () { mailBtn.disabled = false; say(omsg, 'Couldn’t send. Please try again.'); });
          });
          var done = function (who, note) { var t = document.createElement('span'); t.className = 'ok-tick'; t.textContent = '\u2713 Approved'; if (box.parentNode) box.parentNode.replaceChild(t, box); else box = t; by.textContent = 'by ' + who; mailNote.textContent = note || 'Not emailed yet'; lab.appendChild(mailNote); lab.appendChild(mailBtn); };
          lab.appendChild(box); lab.appendChild(by);
          if (f.status === 'Approved') done(f.approvedBy, f.emailed);
          box.addEventListener('change', function () {
            if (!box.checked) return;
            if (!window.confirm('Approve form ' + f.id + ' for ' + f.name + '?\n\nThis signs the approval electronically in your name.')) { box.checked = false; return; }
            box.disabled = true; say(omsg, 'Approving ' + f.id + '…', true);
            post({ form: 'officer_approve', token: tok(), id: f.id }).then(function (res) {
              if (res.signedOut) return signOut(res.error);
              if (!res.ok) { box.checked = false; box.disabled = false; return say(omsg, res.error); }
              done(res.approvedBy, res.emailNote); say(omsg, f.id + ' approved. The approved PDF is saved. ' + (res.emailNote || '') + '.', true);
            }).catch(function () { box.checked = false; box.disabled = false; say(omsg, 'Couldn’t save. Please try again.'); });
          });
          cell(tr, lab); obody.appendChild(tr);
        });
      }).catch(function () { say(omsg, 'Couldn’t load the forms. Please try again.'); });
    };
    document.getElementById('officer-out').addEventListener('click', function () { signOut('Signed out.'); });
    olog.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = olog.querySelector('button'); btn.disabled = true; say(lmsg, '');
      post({ form: 'officer_login', email: olog.email.value, code: olog.code.value }).then(function (res) {
        if (!res.ok) return say(lmsg, res.error);
        tok(res.token); olog.reset(); load();
      }).catch(function () { say(lmsg, 'Couldn’t sign in. Please try again.'); }).then(function () { btn.disabled = false; });
    });
    // 2028 shirt contest entries: view, approve, reject (spec §25a).
    var elist = document.getElementById('entry-list'), emsg3 = document.getElementById('entry-msg');
    var statusText = function (e) {
      if (e.status === 'approved') return '✓ Approved' + (e.reviewedBy ? ' by ' + e.reviewedBy : '') + (e.reviewedAt ? ', ' + e.reviewedAt : '');
      if (e.status === 'rejected') return '✗ Rejected' + (e.reviewedBy ? ' by ' + e.reviewedBy : '') + (e.reviewedAt ? ', ' + e.reviewedAt : '');
      return 'Waiting for review';
    };
    var loadEntries = function () {
      if (!elist) return;
      post({ form: 'officer_entries', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) { elist.textContent = res.error || 'Couldn’t load the entries.'; return; }
        elist.innerHTML = '';
        if (!res.entries.length) { var none = document.createElement('p'); none.className = 'note'; none.textContent = 'No contest entries yet.'; elist.appendChild(none); return; }
        res.entries.forEach(function (e) {
          var card = document.createElement('div'); card.className = 'entry-card entry-' + e.status;
          var pic = document.createElement('div'); pic.className = 'entry-pic';
          var vb = document.createElement('button'); vb.type = 'button'; vb.className = 'btn btn-outline btn-sm'; vb.textContent = 'View design'; pic.appendChild(vb);
          vb.addEventListener('click', function () {
            vb.disabled = true; vb.textContent = 'Loading…';
            post({ form: 'officer_entry_image', token: tok(), id: e.id }).then(function (r) {
              if (r.signedOut) return signOut(r.error);
              if (!r.ok) { vb.disabled = false; vb.textContent = 'View design'; say(emsg3, r.error); return; }
              var img = document.createElement('img'); img.alt = 'Design ' + e.id + ': ' + e.title; img.src = 'data:' + r.type + ';base64,' + r.data;
              img.setAttribute('data-lightbox', img.src); img.setAttribute('data-caption', e.id + ' · ' + e.title);
              pic.innerHTML = ''; pic.appendChild(img);
            }).catch(function () { vb.disabled = false; vb.textContent = 'View design'; say(emsg3, 'Couldn’t load the design.'); });
          });
          var info = document.createElement('div'); info.className = 'entry-info';
          var h = document.createElement('h4'); h.textContent = e.id + ' · ' + e.title; info.appendChild(h);
          [['By', e.name + (e.age ? ' (' + e.age + ')' : '')], ['Parent/guardian', e.guardian ? e.guardian + (e.guardianOk === 'yes' ? ', gave OK' : '') : ''], ['Printed name if it wins', e.credit], ['About', e.about], ['Received', e.received]].forEach(function (kv) {
            if (!kv[1]) return; var p2 = document.createElement('p'); var b2 = document.createElement('b'); b2.textContent = kv[0] + ': '; p2.appendChild(b2); p2.appendChild(document.createTextNode(kv[1])); info.appendChild(p2);
          });
          var st = document.createElement('p'); st.className = 'entry-status'; st.textContent = statusText(e); info.appendChild(st);
          var acts = document.createElement('div'); acts.className = 'entry-actions';
          [['approve', 'Approve', 'btn btn-primary btn-sm', 'approved'], ['reject', 'Reject', 'btn btn-outline btn-sm', 'rejected']].forEach(function (d) {
            if (e.status === d[3]) return;
            var bt = document.createElement('button'); bt.type = 'button'; bt.className = d[2]; bt.textContent = d[1];
            bt.addEventListener('click', function () {
              var q = d[0] === 'approve' ? 'Approve ' + e.id + ' “' + e.title + '”? It will appear in the public gallery straight away.' : 'Reject ' + e.id + ' “' + e.title + '”? It will not be shown' + (e.status === 'approved' ? ' and is taken out of the gallery' : '') + '.';
              if (!window.confirm(q)) return;
              acts.querySelectorAll('button').forEach(function (x) { x.disabled = true; }); say(emsg3, 'Saving…', true);
              post({ form: 'officer_entry_review', token: tok(), id: e.id, decision: d[0] }).then(function (r) {
                if (r.signedOut) return signOut(r.error);
                if (!r.ok) { say(emsg3, r.error); acts.querySelectorAll('button').forEach(function (x) { x.disabled = false; }); return; }
                say(emsg3, e.id + (r.status === 'approved' ? ' approved: it is now in the gallery.' : ' rejected.'), true); loadEntries();
              }).catch(function () { say(emsg3, 'Couldn’t save. Please try again.'); acts.querySelectorAll('button').forEach(function (x) { x.disabled = false; }); });
            });
            acts.appendChild(bt);
          });
          info.appendChild(acts); card.appendChild(pic); card.appendChild(info); elist.appendChild(card);
        });
      }).catch(function () { elist.textContent = 'Couldn’t load the entries.'; });
    };
    var inv = document.getElementById('invite-form'), imsg = document.getElementById('invite-msg');
    inv.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = inv.querySelector('button'); btn.disabled = true; say(imsg, 'Sending…', true);
      post({ form: 'officer_invite', token: tok(), name: inv.name.value, email: inv.email.value, site: location.origin }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) return say(imsg, res.error);
        say(imsg, 'Invitation sent to ' + inv.email.value + '. The link works for 48 hours.', true); inv.reset();
      }).catch(function () { say(imsg, 'Couldn’t send. Please try again.'); }).then(function () { btn.disabled = false; });
    });
    if (tok()) load();
  }

  // Officer setup page (spec §28.5c): show the invited officer's Google Authenticator QR code, then confirm with one code.
  var smain = document.querySelector('main[data-officer-api]');
  if (smain) {
    var sapi = smain.getAttribute('data-officer-api'), t = new URLSearchParams(location.search).get('t') || '';
    var smsg = document.getElementById('setup-msg'), scard = document.getElementById('setup-card'), serr = document.getElementById('setup-err');
    var spost = function (d) { return fetch(sapi, { method: 'POST', body: new URLSearchParams(d) }).then(function (r) { return r.json(); }); };
    var fail = function (m) { smsg.textContent = m; smsg.classList.add('is-visible'); scard.classList.add('hidden'); };
    if (!t) fail('This page needs the link from your invitation email. Please open the link in that email.');
    else spost({ form: 'officer_setup', t: t }).then(function (res) {
      if (!res.ok) return fail(res.error);
      document.getElementById('setup-name').textContent = res.name;
      document.getElementById('setup-email').textContent = res.email;
      document.getElementById('setup-key').textContent = res.key.replace(/(.{4})/g, '$1 ').trim();
      var q = qrcode(0, 'M'); q.addData(res.uri); q.make();
      document.getElementById('setup-qr').innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
      smsg.classList.add('hidden'); smsg.classList.remove('is-visible'); scard.classList.remove('hidden');
      try { history.replaceState(null, '', location.pathname + '?t=' + t); } catch (e) {}
    }).catch(function () { fail('Couldn’t load your invitation. Please try again in a moment.'); });
    var setupForm = document.getElementById('setup-form');
    if (setupForm) setupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = setupForm.querySelector('button'); btn.disabled = true; serr.textContent = '';
      spost({ form: 'officer_setup_confirm', t: t, code: setupForm.code.value }).then(function (res) {
        if (!res.ok) { serr.textContent = res.error; return; }
        scard.classList.add('hidden'); document.getElementById('setup-qr').innerHTML = '';
        var dn = document.getElementById('setup-done'); dn.classList.remove('hidden'); dn.classList.add('is-visible');
      }).catch(function () { serr.textContent = 'Couldn’t check the code. Please try again.'; }).then(function () { btn.disabled = false; });
    });
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
            if (f.querySelector('input[name=t]')) { f.classList.add('edit-done'); }
            var pdfA = f.querySelector('#form-pdf'), idS = f.querySelector('#form-done-id');
            if (pdfA && res.pdf) {
              var bin = atob(res.pdf), bytes = new Uint8Array(bin.length);
              for (var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
              pdfA.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
              pdfA.setAttribute('download', 'FASSJ-Chess-Club-membership-form-' + (res.formId || 'signed') + '.pdf');
              pdfA.classList.remove('hidden');
            }
            if (idS) idS.textContent = res.formId ? (res.revision ? 'Registration ' + res.formId + ' is updated (revision ' + res.revision + ').' : 'Your form number is ' + res.formId + '.') : '';
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


  // Change my registration (docs/player-edit-workflow.md): request page, and edit mode on the Register page (?edit=<code>).
  var ereq = document.getElementById('edit-request');
  if (ereq) {
    var eapi = document.querySelector('main[data-edit-api]').getAttribute('data-edit-api'), emsg2 = document.getElementById('edit-msg');
    ereq.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = ereq.querySelector('button'); btn.disabled = true; emsg2.textContent = 'Sending…'; emsg2.classList.add('ok');
      fetch(eapi, { method: 'POST', body: new URLSearchParams({ form: 'edit_request', email: ereq.email.value, name: ereq.name.value, site: location.origin }) })
        .then(function (r) { return r.json(); }).then(function (res) {
          emsg2.classList.toggle('ok', !!res.ok);
          emsg2.textContent = res.ok ? 'We\u2019ve sent a link to ' + (res.sent || ereq.email.value) + '. It works for 15 minutes (check your spam folder too).' : res.error;
          if (res.notFound) { emsg2.appendChild(document.createTextNode(' ')); var ra = document.createElement('a'); ra.href = '/register.html'; ra.textContent = 'Register now \u2192'; emsg2.appendChild(ra); }
        }).catch(function () { emsg2.classList.remove('ok'); emsg2.textContent = 'Couldn’t send. Please try again.'; })
        .then(function () { btn.disabled = false; });
    });
  }
  var editCode = new URLSearchParams(location.search).get('edit');
  if (reg && editCode && /^[0-9a-f]{32}$/.test(editCode)) {
    var title = document.getElementById('form-title'), intro = document.getElementById('form-intro');
    var set = function (name, v) {
      var els = reg.querySelectorAll('[name="' + name + '"]');
      els.forEach(function (el) {
        if (el.type === 'radio') el.checked = el.value === v;
        else if (el.type === 'checkbox') el.checked = name === 'news_by' ? String(v).split(', ').indexOf(el.value) !== -1 : v === 'yes';
        else el.value = v;
        el.dispatchEvent(new Event('change', { bubbles: true })); el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    };
    title.textContent = 'Change your registration'; intro.textContent = 'Loading your registration…';
    fetch(reg.getAttribute('action'), { method: 'POST', body: new URLSearchParams({ form: 'edit_load', t: editCode }) })
      .then(function (r) { return r.json(); }).then(function (res) {
        if (!res.ok) { intro.innerHTML = ''; intro.textContent = res.error + ' '; var a = document.createElement('a'); a.href = '/edit.html'; a.textContent = 'Ask for a new link'; intro.appendChild(a); reg.querySelector('.form-grid').classList.add('hidden'); reg.querySelector('.form-actions').classList.add('hidden'); return; }
        title.textContent = 'Change your registration ' + res.formId;
        intro.textContent = 'Change what you need, then tick the agreements and type the name again to sign. This link works for about ' + res.minutesLeft + ' more minutes. After you save, a club officer approves the form again.';
        var d = res.data;
        ['name', 'age_bracket', 'guardian_name', 'email', 'phone', 'experience', 'uscf_id', 'medical', 'emergency_name', 'emergency_relationship', 'emergency_phone', 'shirt_size', 'heard_about_us', 'note', 'photos', 'news_by', 'show_on_list'].forEach(function (k) { set(k, d[k] || ''); });
        ['r-em-name', 'r-em-rel', 'r-em-phone'].forEach(function (id) { var x = document.getElementById(id); if (x) { x.dataset.edited = '1'; delete x.dataset.auto; } });
        var ex = document.getElementById('r-extra');
        if (ex) {
          ex.value = d.extra_shirts || '0'; ex.dispatchEvent(new Event('change'));
          if (ex.value === '5 or more') { var m = document.getElementById('r-extra-many'); if (m) m.value = d.extra_sizes || ''; }
          else (d.extra_sizes || '').split('; ').forEach(function (part, i) { var sel = document.getElementById('r-extra-' + (i + 1)); if (sel) sel.value = part.replace(/^Shirt \d+: /, ''); });
        }
        [['form', 'edit_save'], ['t', editCode]].forEach(function (kv) { var h = document.createElement('input'); h.type = 'hidden'; h.name = kv[0]; h.value = kv[1]; reg.appendChild(h); });
        var b = reg.querySelector('button[type=submit]'); if (b) b.textContent = 'Save and sign';
        var dn = document.querySelector('#form-done b'); if (dn) dn.textContent = 'Thank you, your changes are signed and saved!';
      }).catch(function () { intro.textContent = 'Couldn’t load your registration. Please try the link again.'; });
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
        if (res.ok) {
          // Voted (spec §25): keep the thank-you, then reset everything for the next voter (one vote per email is checked by the script).
          var votedFor = state.choiceTitle;
          state.choice = null; state.choiceTitle = '';
          grid.querySelectorAll('input[name=entry]').forEach(function (r) { r.checked = false; r.disabled = false; });
          vEmail.value = ''; codeIn.value = ''; document.getElementById('v-code-field').classList.add('hidden');
          document.getElementById('vote-choice').textContent = 'No design chosen yet.';
          vf.querySelectorAll('input,button').forEach(function (x) { x.disabled = false; });
          syncCast();
          note(vmsg, 'Thank you! Your vote for \u201c' + votedFor + '\u201d is in. Results are announced when voting closes. Another member can vote now.', true);
        }
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
