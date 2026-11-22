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
      reg.querySelectorAll('.guardian-extra, .minor-opt').forEach(function (x) { x.classList.toggle('hidden', !minor); });   // spec §48
      reg.querySelectorAll('.adult-req').forEach(function (x) { x.classList.toggle('hidden', minor); });
      ['r-email', 'r-phone'].forEach(function (id) { var x = document.getElementById(id); if (x) x.required = !minor; });
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
              ['r-em-phone', function () { var g = document.getElementById('r-guardian-phone'); return g ? g.value : ''; }]];   // spec §48: parent's phone
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
    ['r-guardian', 'r-guardian-phone'].forEach(function (id) { var x = document.getElementById(id); if (x) x.addEventListener('input', emFill); });
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
          var d = document.createElement('tr'), fid = document.createElement('td'), a = document.createElement('td'), g = document.createElement('td'), b = document.createElement('td'), ms = document.createElement('td');
          fid.textContent = p.id || '\u2014'; ms.textContent = String(p.since || '\u2014').replace(/ member$/i, '');   // spec §44: Form ID first, Member since last
          a.textContent = p.name; var ag = p.age || '', m = /\((?:ages )?([^)]+)\)/.exec(ag); g.textContent = m ? m[1] : (ag || '\u2014'); if (ag) g.title = ag; b.textContent = String(p.level || '\u2014').replace(/ player$/i, ''); d.appendChild(fid); d.appendChild(a); d.appendChild(g); d.appendChild(b); d.appendChild(ms); return d.outerHTML;
        }).join('') : '<tr><td colspan="5">No one has chosen to be listed yet. Be the first!</td></tr>';
        var tally = document.getElementById('age-tally');   // spec §53: scoreboard-style tally (numbers only, no names)
        if (tally && res.byAge) {
          var groups = [['Early Learners (ages 4–6)', 'Early Learners', '4–6'], ['Elementary / Youth (ages 7–11)', 'Elementary / Youth', '7–11'], ['Middle & High School (ages 12–17)', 'Middle & High School', '12–17'], ['Adult (18+)', 'Adults', '18+']];
          var total = groups.reduce(function (t, g) { return t + (res.byAge[g[0]] || 0); }, 0);
          var mk = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
          var tile = function (label, value, sub, cls) { var t = mk('div', 'tb-tile' + (cls ? ' ' + cls : '')); t.appendChild(mk('span', 'tb-label', label)); t.appendChild(mk('b', 'tb-value', value)); if (sub) t.appendChild(mk('small', 'tb-sub', sub)); return t; };
          tally.innerHTML = '';
          tally.appendChild(mk('h4', 'tb-title', 'Founding Season Tally'));
          var grid = mk('div', 'tb-grid');
          grid.appendChild(tile('Players registered', String(total), '', 'tb-main'));
          groups.forEach(function (g) { var n = res.byAge[g[0]] || 0; grid.appendChild(tile(g[1], String(n), 'ages ' + g[2], n ? '' : 'tb-zero')); });
          var days = Math.ceil((Date.UTC(2027, 0, 11, 5) - Date.now()) / 86400000);
          grid.appendChild(days >= 0 ? tile('Days to opening night', String(days), 'Mon, Jan 11, 2027', 'tb-count') : tile('Club nights', 'Mon', '6:00–8:30 PM', 'tb-count'));
          tally.appendChild(grid);
          var weeks = res.byWeek || [];
          if (weeks.length) {
            var chart = mk('div', 'tb-chart'), max = Math.max.apply(null, weeks.map(function (w) { return w.count; })) || 1;
            chart.appendChild(mk('span', 'tb-label', 'Sign-ups per week'));
            var bars = mk('div', 'tb-bars'); bars.setAttribute('role', 'list');
            weeks.forEach(function (w) {
              var col = mk('div', 'tb-col'), bar = mk('span', 'tb-bar'), tip = 'Week of ' + w.label + ': ' + w.count + (w.count === 1 ? ' sign-up' : ' sign-ups');
              col.setAttribute('role', 'listitem'); col.tabIndex = 0; col.setAttribute('aria-label', tip); col.setAttribute('data-tip', tip);
              bar.style.height = Math.max(4, Math.round(100 * w.count / max)) + '%';
              col.appendChild(mk('span', 'tb-n', String(w.count))); col.appendChild(bar); col.appendChild(mk('span', 'tb-week', w.label)); bars.appendChild(col);
            });
            chart.appendChild(bars); tally.appendChild(chart);
          }
          tally.appendChild(mk('p', 'tb-foot', 'Live from registrations · numbers only, no names'));
          tally.classList.remove('hidden');
          var rc = document.getElementById('roster-count'); if (rc) rc.hidden = true;
        }
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
    var reqForm = document.getElementById('request');
    var signOut = function (m) { tok(''); opan.classList.add('hidden'); olog.classList.remove('hidden'); if (reqForm) reqForm.classList.remove('hidden'); say(lmsg, m || ''); };
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
        var onone = document.getElementById('officers-none'); if (onone) onone.classList.toggle('hidden', !!res.canInvite);
        if (reqForm) reqForm.classList.add('hidden');
        var has = function (a) { return (res.roles || []).indexOf(a) !== -1; };   // spec §52: tabs by area
        ['registrations', 'contest', 'documents', 'officers'].forEach(function (id) { var tb = document.getElementById('tab-' + id); if (tb) tb.hidden = !has(id); });
        var cur = document.querySelector('#officer-panel .tab[aria-selected="true"]');
        if (!cur || cur.hidden) { var first = document.querySelector('#officer-panel .tab:not([hidden])'); if (first) first.click(); }
        if (has('contest')) loadEntries();
        if (has('documents')) loadDocs();
        if (has('officers')) { loadRequests(); loadOfficers(); }
        olog.classList.add('hidden'); opan.classList.remove('hidden'); obody.innerHTML = '';
        if (!res.forms.length) { var tr0 = document.createElement('tr'); cell(tr0, 'No signed forms yet.').colSpan = 6; obody.appendChild(tr0); return; }
        res.forms.sort(function (x, y) { return x.id < y.id ? -1 : x.id > y.id ? 1 : 0; });   // by Form ID, lowest first (spec §43)
        res.forms.forEach(function (f) {
          var tr = document.createElement('tr'), b = document.createElement('button'), box = document.createElement('input'), lab = document.createElement('label'), by = document.createElement('span');
          cell(tr, f.id); cell(tr, f.name + (f.guardian ? ' (parent: ' + f.guardian + ')' : '')); cell(tr, f.age); var sc = cell(tr, f.signedAt.replace(/ at .*/, '')); if (f.revision > 1) { var up = document.createElement('span'); up.className = 'by'; up.textContent = 'Updated ' + f.updatedAt + ' (rev ' + f.revision + ')'; sc.appendChild(up); }
          if (f.signed === false) {   // spec §43: not signed yet -> nothing to view or approve
            cell(tr, 'Not signed yet');
            var wait = document.createElement('span'); wait.className = 'by'; wait.textContent = 'Waiting for the member to complete and sign it (Change my registration)';
            cell(tr, wait); obody.appendChild(tr); return;
          }
          b.type = 'button'; b.className = 'link'; b.textContent = 'View'; b.addEventListener('click', function () { openPdf(f.id, b); }); cell(tr, b);
          if (f.pdfOk === false) {   // spec §43: the row's PDF belongs to another form -> rebuild it from the row
            var warn = document.createElement('span'), rb = document.createElement('button');
            warn.className = 'by'; warn.textContent = 'PDF belongs to another form'; rb.type = 'button'; rb.className = 'link'; rb.textContent = 'Rebuild PDF';
            rb.addEventListener('click', function () {
              rb.disabled = true; say(omsg, 'Rebuilding ' + f.id + '…', true);
              post({ form: 'officer_rebuild_pdf', token: tok(), id: f.id }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                say(omsg, res.ok ? res.note : res.error, res.ok); if (res.ok) { warn.remove(); rb.remove(); } else rb.disabled = false;
              }).catch(function () { rb.disabled = false; say(omsg, 'Couldn’t rebuild. Please try again.'); });
            });
            b.parentNode.appendChild(warn); b.parentNode.appendChild(rb);
          }
          box = document.createElement('span'); box.className = 'officer-actions'; by.className = 'by';   // spec §45: Approve · Reply · Deny
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
          var last = document.createElement('span'); last.className = 'by'; if (f.note) last.textContent = 'Last: ' + f.note;
          var act = function (label, cls) { var x = document.createElement('button'); x.type = 'button'; x.className = 'btn btn-sm ' + cls; x.textContent = label; box.appendChild(x); return x; };
          lab.appendChild(box); lab.appendChild(by); lab.appendChild(last);
          if (f.status === 'Approved') { done(f.approvedBy, f.emailed); cell(tr, lab); obody.appendChild(tr); return; }
          if (f.status === 'Denied' || f.status === 'Closed') { var dn = document.createElement('span'); dn.className = 'denied-tick'; dn.textContent = '\u2715 ' + f.status; lab.replaceChild(dn, box); cell(tr, lab); obody.appendChild(tr); return; }
          var bA = act('Approve', 'btn-primary'), bR = act('Reply', 'btn-outline'), bD = act('Deny', 'btn-outline btn-deny'), bC = act('Close as duplicate', 'btn-outline');
          var busy = function (on) { bA.disabled = bR.disabled = bD.disabled = bC.disabled = on; };
          bC.addEventListener('click', function () {   // spec §50: no email; needs the form that replaces it
            if (tr.nextSibling && tr.nextSibling.className === 'reply-row') tr.parentNode.removeChild(tr.nextSibling);
            var row = document.createElement('tr'), td = document.createElement('td'), lb = document.createElement('label'), ta = document.createElement('textarea'), go = document.createElement('button'), no = document.createElement('button'), bar = document.createElement('div');
            row.className = 'reply-row'; td.colSpan = 6; td.className = 'reply-cell';
            lb.textContent = 'Close ' + f.id + ' (' + f.name + ') as a duplicate. No email is sent. Give the form that replaces it:';
            ta.rows = 2; ta.className = 'reply-text'; ta.value = 'Replaced by RF' + f.id.slice(2, 7) + ''; lb.appendChild(ta);
            go.type = 'button'; go.className = 'btn btn-sm btn-primary'; go.textContent = 'Close form';
            no.type = 'button'; no.className = 'btn btn-sm btn-outline'; no.textContent = 'Cancel';
            bar.className = 'officer-actions'; bar.appendChild(go); bar.appendChild(no);
            td.appendChild(lb); td.appendChild(bar); row.appendChild(td); tr.parentNode.insertBefore(row, tr.nextSibling);
            ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
            no.addEventListener('click', function () { row.parentNode.removeChild(row); });
            go.addEventListener('click', function () {
              busy(true); go.disabled = no.disabled = true; say(omsg, 'Closing ' + f.id + '…', true);
              post({ form: 'officer_close', token: tok(), id: f.id, message: ta.value.trim() }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                if (!res.ok) { busy(false); go.disabled = no.disabled = false; return say(omsg, res.error); }
                row.parentNode.removeChild(row); last.textContent = 'Last: ' + res.note;
                var dn3 = document.createElement('span'); dn3.className = 'denied-tick'; dn3.textContent = '\u2715 Closed'; box.parentNode.replaceChild(dn3, box);
                say(omsg, f.id + ' closed (no email sent).', true);
              }).catch(function () { busy(false); go.disabled = no.disabled = false; say(omsg, 'Couldn’t close. Please try again.'); });
            });
          });
          if (f.nameOk === false) { var nw = document.createElement('span'); nw.className = 'by warn'; nw.textContent = 'Name doesn\u2019t look like a real name: use Reply to ask for it, or Deny.'; lab.insertBefore(nw, by); }
          bA.addEventListener('click', function () {
            if (!window.confirm('Approve form ' + f.id + ' for ' + f.name + '?\n\nThis signs the approval electronically in your name.')) return;
            busy(true); say(omsg, 'Approving ' + f.id + '…', true);
            post({ form: 'officer_approve', token: tok(), id: f.id }).then(function (res) {
              if (res.signedOut) return signOut(res.error);
              if (!res.ok) { busy(false); return say(omsg, res.error); }
              done(res.approvedBy, res.emailNote); last.textContent = ''; say(omsg, f.id + ' approved. The approved PDF is saved. ' + (res.emailNote || '') + '.', true);
            }).catch(function () { busy(false); say(omsg, 'Couldn’t save. Please try again.'); });
          });
          var first = String(f.name || '').split(/[\s_]+/)[0];
          var suggest = function (deny) {   // spec §45: pre-filled, editable
            if (f.nameOk === false) return deny
              ? 'We can\u2019t accept this membership form because the player\u2019s name (\u201c' + f.name + '\u201d) isn\u2019t a real first and last name. You\u2019re very welcome to sign up again using the player\u2019s real name.'
              : 'Thank you for signing up! The player\u2019s name on the form (\u201c' + f.name + '\u201d) looks like a username. For club records, membership forms need the player\u2019s real first and last name. Could you please update it on the Change my registration page (link below)? We\u2019ll approve the form as soon as it\u2019s updated.';
            return deny
              ? 'We\u2019re sorry, but we can\u2019t approve this membership form because '
              : 'Thank you for signing up for the FASSJ Chess Club! Before we approve the form, could you please ';
          };
          var send = function (kind) {
            var deny = kind === 'deny';
            if (tr.nextSibling && tr.nextSibling.className === 'reply-row') tr.parentNode.removeChild(tr.nextSibling);
            var row = document.createElement('tr'), td = document.createElement('td'), lb = document.createElement('label'), ta = document.createElement('textarea'), go = document.createElement('button'), no = document.createElement('button'), bar = document.createElement('div');
            row.className = 'reply-row'; td.colSpan = 6; td.className = 'reply-cell';
            lb.textContent = (deny ? 'Reason for denying ' : 'Reply about ') + f.id + ' (' + f.name + '). Emailed to the address on the form; edit as you like:';
            ta.rows = 5; ta.value = suggest(deny); ta.className = 'reply-text'; lb.appendChild(ta);
            go.type = 'button'; go.className = 'btn btn-sm ' + (deny ? 'btn-outline btn-deny' : 'btn-primary'); go.textContent = deny ? 'Deny and send' : 'Send reply';
            no.type = 'button'; no.className = 'btn btn-sm btn-outline'; no.textContent = 'Cancel';
            var tst = document.createElement('button'); tst.type = 'button'; tst.className = 'btn btn-sm btn-outline'; tst.textContent = 'Send me a test';
            bar.className = 'officer-actions'; bar.appendChild(go); bar.appendChild(tst); bar.appendChild(no);
            tst.addEventListener('click', function () {   // spec §45: same email with [TEST], to the signed-in officer only
              var tmsg = ta.value.trim(); if (!tmsg) return say(omsg, 'Please type your message.');
              tst.disabled = true; say(omsg, 'Sending a test to you…', true);
              post({ form: deny ? 'officer_deny' : 'officer_reply', token: tok(), id: f.id, message: tmsg, site: location.origin, test: 'yes' }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                tst.disabled = false; say(omsg, res.ok ? res.note : res.error, res.ok);
              }).catch(function () { tst.disabled = false; say(omsg, 'Couldn’t send the test. Please try again.'); });
            });
            td.appendChild(lb); td.appendChild(bar); row.appendChild(td); tr.parentNode.insertBefore(row, tr.nextSibling);
            ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
            no.addEventListener('click', function () { row.parentNode.removeChild(row); });
            go.addEventListener('click', function () {
              var msg = ta.value.trim();
              if (!msg) return say(omsg, deny ? 'Please give the reason.' : 'Please type your message.');
              if (deny && !window.confirm('Deny form ' + f.id + ' for ' + f.name + '?\n\nThe member is emailed your reason and the form leaves the public list.')) return;
              busy(true); go.disabled = no.disabled = true; say(omsg, (deny ? 'Denying ' : 'Sending reply for ') + f.id + '…', true);
              post({ form: deny ? 'officer_deny' : 'officer_reply', token: tok(), id: f.id, message: msg, site: location.origin }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                if (!res.ok) { busy(false); go.disabled = no.disabled = false; return say(omsg, res.error); }
                row.parentNode.removeChild(row); last.textContent = 'Last: ' + res.note;
                if (deny) { var dn2 = document.createElement('span'); dn2.className = 'denied-tick'; dn2.textContent = '\u2715 Denied'; box.parentNode.replaceChild(dn2, box); } else busy(false);
                say(omsg, f.id + ': ' + (deny ? 'denied' : 'reply sent') + ' to ' + res.sentTo + '.', true);
              }).catch(function () { busy(false); go.disabled = no.disabled = false; say(omsg, 'Couldn’t send. Please try again.'); });
            });
          };
          bR.addEventListener('click', function () { send('reply'); });
          bD.addEventListener('click', function () { send('deny'); });
          cell(tr, lab); obody.appendChild(tr);
        });
      }).catch(function () { say(omsg, 'Couldn’t load the forms. Please try again.'); });
    };
    document.getElementById('officer-out').addEventListener('click', function () { signOut('Signed out.'); });
    // spec §52: auto-refresh every 60 s while signed in and visible; never while the officer is typing or replying
    var busy = function () {
      if (opan.querySelector('.reply-row')) return true;
      var tas = opan.querySelectorAll('textarea');
      for (var i = 0; i < tas.length; i++) if (tas[i].value.trim() || tas[i] === document.activeElement) return true;
      return false;
    };
    var stamp = function () {
      var h = document.querySelector('#officer-panel .officer-head p'), u = document.getElementById('officer-updated');
      if (!h) return; if (!u) { u = document.createElement('span'); u.id = 'officer-updated'; u.className = 'by'; h.appendChild(u); }
      u.textContent = 'Updated ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' · refreshes every minute';
    };
    var autoRefresh = function () {
      if (document.hidden || !tok() || opan.classList.contains('hidden') || busy()) return;
      var y = window.scrollY; load(); setTimeout(function () { window.scrollTo(0, y); stamp(); }, 1500);
    };
    setInterval(autoRefresh, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) autoRefresh(); });
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
    // spec §52 phase 1: Board documents (view, download, comments) and officer access requests
    var dlist = document.getElementById('doc-list'), dmsg = document.getElementById('doc-msg');
    var b64Blob = function (data, mime) { var bin = atob(data), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return new Blob([bytes], { type: mime }); };
    var docOpen = function (d, btn, download) {
      btn.disabled = true; say(dmsg, 'Opening ' + d.name + '…', true);
      post({ form: 'officer_doc', token: tok(), id: d.id }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) return say(dmsg, res.error);
        var a = document.createElement('a'); a.href = URL.createObjectURL(b64Blob(res.data, res.mime)); a.rel = 'noopener';
        if (download || d.kind !== 'pdf') a.download = res.name; else a.target = '_blank';
        document.body.appendChild(a); a.click(); a.remove(); say(dmsg, '');
      }).catch(function () { say(dmsg, 'Couldn’t open the document. Please try again.'); }).then(function () { btn.disabled = false; });
    };
    var loadDocs = function () {
      if (!dlist) return;
      post({ form: 'officer_docs', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        if (!res.ok) { dlist.innerHTML = ''; return say(dmsg, res.error); }
        dlist.innerHTML = '';
        if (!res.docs.length) { var none = document.createElement('p'); none.className = 'note'; none.textContent = 'No documents yet.'; dlist.appendChild(none); return; }
        res.docs.forEach(function (d) {
          var card = document.createElement('div'), head = document.createElement('div'), nm = document.createElement('b'), when = document.createElement('span'), acts = document.createElement('span');
          card.className = 'doc-card-o'; head.className = 'doc-head'; when.className = 'by'; acts.className = 'officer-actions';
          nm.textContent = d.name; when.textContent = d.kind.toUpperCase() + ' · updated ' + d.updated;
          var v = document.createElement('button'); v.type = 'button'; v.className = 'btn btn-sm btn-primary'; v.textContent = d.kind === 'pdf' ? 'View' : 'Download';
          v.addEventListener('click', function () { docOpen(d, v, d.kind !== 'pdf'); }); acts.appendChild(v);
          if (d.kind === 'pdf') { var dl = document.createElement('button'); dl.type = 'button'; dl.className = 'btn btn-sm btn-outline'; dl.textContent = 'Download'; dl.addEventListener('click', function () { docOpen(d, dl, true); }); acts.appendChild(dl); }
          acts.classList.add('doc-open'); head.appendChild(nm); head.appendChild(when); card.appendChild(head); card.appendChild(acts);   // spec §52: View/Download on their own row
          var list = document.createElement('ul'); list.className = 'doc-comments';
          var addC = function (c) { var li = document.createElement('li'), w = document.createElement('span'); w.className = 'by'; w.textContent = c.officer + ' · ' + c.when; li.appendChild(w); li.appendChild(document.createTextNode(c.text)); list.appendChild(li); };
          d.comments.forEach(addC); card.appendChild(list);
          // spec §52: each officer's latest decision, then Approve / Revise / Not approved (note from the comment box)
          var dl2 = document.createElement('ul'); dl2.className = 'doc-decisions';
          var cls = { 'Approved': 'd-approved', 'Revise': 'd-revise', 'Not approved': 'd-not' };
          var shown = {};
          var addD = function (x) {
            if (shown[x.officer]) dl2.removeChild(shown[x.officer]);
            var li = document.createElement('li'); li.className = cls[x.decision] || ''; li.textContent = x.officer + ': ' + x.decision + (x.note ? ' (\u201c' + x.note + '\u201d)' : '') + ' · ' + x.when;
            dl2.appendChild(li); shown[x.officer] = li;
          };
          (d.decisions || []).forEach(addD); card.appendChild(dl2);
          var ta = document.createElement('textarea'), send = document.createElement('button');
          ta.rows = 2; ta.className = 'reply-text'; ta.placeholder = 'Comment, or the note for your decision…'; ta.setAttribute('aria-label', 'Comment or note on ' + d.name);
          send.type = 'button'; send.className = 'btn btn-sm btn-outline'; send.textContent = 'Add comment';
          send.addEventListener('click', function () {
            if (!ta.value.trim()) return say(dmsg, 'Please type your comment.');
            send.disabled = true;
            post({ form: 'officer_doc_comment', token: tok(), id: d.id, comment: ta.value }).then(function (res) {
              if (res.signedOut) return signOut(res.error);
              if (!res.ok) return say(dmsg, res.error);
              addC(res.comment); ta.value = ''; say(dmsg, 'Comment added.', true);
            }).catch(function () { say(dmsg, 'Couldn’t save the comment. Please try again.'); }).then(function () { send.disabled = false; });
          });
          var dacts = document.createElement('div'); dacts.className = 'officer-actions doc-actions';
          dacts.appendChild(send);
          [['Approve', 'Approved', 'btn-primary'], ['Revise', 'Revise', 'btn-outline'], ['Not approved', 'Not approved', 'btn-outline btn-deny']].forEach(function (b) {
            var x = document.createElement('button'); x.type = 'button'; x.className = 'btn btn-sm ' + b[2]; x.textContent = b[0];
            x.addEventListener('click', function () {
              var note = ta.value.trim();
              if (b[1] !== 'Approved' && !note) return say(dmsg, 'Please write what to change or why in the box first, then press ' + b[0] + '.');
              if (!window.confirm(b[0] + ': ' + d.name + (note ? '\n\nNote: ' + note : '') + '\n\nThis records your decision with your name and the time.')) return;
              x.disabled = true;
              post({ form: 'officer_doc_decide', token: tok(), id: d.id, decision: b[1], note: note }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                if (!res.ok) return say(dmsg, res.error);
                addD(res.decision); ta.value = ''; say(dmsg, 'Your decision is recorded: ' + res.decision.decision + '.', true);
              }).catch(function () { say(dmsg, 'Couldn’t save your decision. Please try again.'); }).then(function () { x.disabled = false; });
            });
            dacts.appendChild(x);
          });
          card.appendChild(ta); card.appendChild(dacts); dlist.appendChild(card);
        });
      }).catch(function () { say(dmsg, 'Couldn’t load the documents. Please try again.'); });
    };
    var AREA_NAMES = [['registrations', 'Registrations'], ['contest', 'T-shirt contest'], ['documents', 'Board documents'], ['officers', 'Officers']];
    var areaText = function (r) { return r === 'all' ? 'Everything' : String(r || 'documents').split(/\s*,\s*/).map(function (a) { var n = AREA_NAMES.filter(function (x) { return x[0] === a; })[0]; return n ? n[1] : a; }).join(', '); };
    var roleChooser = function (current, canInv) {   // tick boxes for areas (only the club account invites, spec §52 v39)
      var box = document.createElement('div'); box.className = 'role-chooser';
      var cur = current === 'all' ? AREA_NAMES.map(function (x) { return x[0]; }) : String(current || 'documents').split(/\s*,\s*/);
      AREA_NAMES.forEach(function (a) { var l = document.createElement('label'), c = document.createElement('input'); c.type = 'checkbox'; c.value = a[0]; c.checked = cur.indexOf(a[0]) !== -1; l.appendChild(c); l.appendChild(document.createTextNode(' ' + a[1])); box.appendChild(l); });
      box.values = function () { return { roles: Array.prototype.filter.call(box.querySelectorAll('input:not(.can-invite)'), function (c) { return c.checked; }).map(function (c) { return c.value; }).join(',') || 'documents', canInvite: '' }; };
      return box;
    };
    var olistBody = document.getElementById('officer-list');
    var loadOfficers = function () {   // spec §52: current officers
      if (!olistBody) return;
      post({ form: 'officer_list', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        olistBody.innerHTML = '';
        if (!res.ok || !res.officers.length) { var tr0 = document.createElement('tr'); cell(tr0, res.ok ? 'No officers yet.' : res.error).colSpan = 5; olistBody.appendChild(tr0); return; }
        res.officers.forEach(function (o) {
          var tr = document.createElement('tr'); cell(tr, o.name); cell(tr, o.email);
          var stc = cell(tr, o.status); stc.className = o.status === 'Active' ? 'st-active' : 'st-pending';
          var rc2 = cell(tr, areaText(o.roles));
          if (res.canRemove && !o.owner) {
            var ed = document.createElement('button'); ed.type = 'button'; ed.className = 'link'; ed.textContent = 'Edit';
            ed.addEventListener('click', function () {
              if (rc2.querySelector('.role-chooser')) return;
              var ch = roleChooser(o.roles, o.canInvite), sv = document.createElement('button'); sv.type = 'button'; sv.className = 'btn btn-sm btn-primary'; sv.textContent = 'Save';
              sv.addEventListener('click', function () { var v = ch.values(); sv.disabled = true; post({ form: 'officer_set_role', token: tok(), email: o.email, roles: v.roles, canInvite: v.canInvite }).then(function (r3) { if (r3.signedOut) return signOut(r3.error); if (!r3.ok) { sv.disabled = false; return say(rmsg, r3.error); } say(rmsg, o.name + ': role saved.', true); loadOfficers(); }).catch(function () { sv.disabled = false; }); });
              rc2.appendChild(ch); rc2.appendChild(sv);
            });
            rc2.appendChild(document.createTextNode(' ')); rc2.appendChild(ed);
          }
          var ic = cell(tr, o.invited || 'by System Administrator');
          if (res.canRemove && !o.owner && o.email !== res.me) {
            var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'link'; rm.textContent = 'Remove';
            rm.addEventListener('click', function () {
              if (!window.confirm('Remove ' + o.name + ' (' + o.email + ') as an officer?\n\nTheir sign-in stops working; their past decisions and comments stay.')) return;
              rm.disabled = true;
              post({ form: 'officer_remove', token: tok(), email: o.email }).then(function (r2) { if (r2.signedOut) return signOut(r2.error); if (!r2.ok) { rm.disabled = false; return say(rmsg, r2.error); } loadOfficers(); })
                .catch(function () { rm.disabled = false; });
            });
            ic.appendChild(document.createTextNode(' ')); ic.appendChild(rm);
          }
          olistBody.appendChild(tr);
        });
      }).catch(function () {});
    };
    var rbox = document.getElementById('request-review'), rlist = document.getElementById('request-list'), rmsg = document.getElementById('request-msg');
    var loadRequests = function () {
      if (!rbox) return;
      post({ form: 'officer_requests', token: tok() }).then(function (res) {
        if (res.signedOut) return signOut(res.error);
        rlist.innerHTML = ''; rbox.classList.toggle('hidden', !(res.ok && res.requests.length));
        (res.requests || []).forEach(function (q) {
          var card = document.createElement('div'), txt = document.createElement('div'), acts = document.createElement('span');
          card.className = 'doc-card-o req-card'; acts.className = 'officer-actions';
          var nm = document.createElement('p'), mt = document.createElement('p'); nm.className = 'req-name'; mt.className = 'req-meta';
          nm.textContent = q.name + (q.position ? ' · ' + q.position : '');
          mt.textContent = q.email + (q.note ? ' · “' + q.note + '”' : '') + ' · asked ' + q.when;
          txt.appendChild(nm); txt.appendChild(mt);
          if (q.already) { var al = document.createElement('p'); al.className = 'req-already'; al.textContent = q.email + ' is already an active officer of the club.'; card.appendChild(txt); card.appendChild(al); rlist.appendChild(card); return; }
          var qch = roleChooser('documents', false);
          [['Send invitation', 'invite', 'btn-primary'], ['Decline', 'decline', 'btn-outline']].forEach(function (b) {
            var x = document.createElement('button'); x.type = 'button'; x.className = 'btn btn-sm ' + b[2]; x.textContent = b[0];
            x.addEventListener('click', function () {
              if (!window.confirm(b[0] + ' for ' + q.name + ' (' + q.email + ')?')) return;
              x.disabled = true;
              var qv = qch ? qch.values() : {};
              post({ form: 'officer_request_decide', token: tok(), id: q.id, decision: b[1], site: location.origin, roles: qv.roles || 'documents', canInvite: qv.canInvite || '' }).then(function (res) {
                if (res.signedOut) return signOut(res.error);
                if (!res.ok) { x.disabled = false; return say(rmsg, res.error); }
                say(rmsg, q.name + ': ' + (res.status === 'Invited' ? 'invitation sent.' : 'declined.'), true); loadRequests();
              }).catch(function () { x.disabled = false; say(rmsg, 'Couldn’t save. Please try again.'); });
            });
            acts.appendChild(x);
          });
          card.appendChild(txt); card.appendChild(qch); card.appendChild(acts); rlist.appendChild(card);
        });
      }).catch(function () {});
    };
    if (reqForm) {
      var qmsg = document.getElementById('request-form-msg');
      if (location.hash === '#request') { reqForm.scrollIntoView(); var fn = reqForm.querySelector('input[name=name]'); if (fn) fn.focus(); }
      reqForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = reqForm.querySelector('button'); btn.disabled = true; say(qmsg, 'Sending…', true);
        post(Object.assign({ form: 'officer_request' }, Object.fromEntries(new FormData(reqForm)))).then(function (res) {
          say(qmsg, res.ok ? 'Thank you. An officer will check your request and email you a link to set up your sign-in.' : res.error, res.ok);
          if (res.ok) reqForm.reset();
        }).catch(function () { say(qmsg, 'Couldn’t send. Please try again.'); }).then(function () { btn.disabled = false; });
      });
    }
    var inv = document.getElementById('invite-form'), imsg = document.getElementById('invite-msg');
    var invChooser = null;
    if (inv) { var slot = inv.querySelector('.role-slot'); if (slot) { invChooser = roleChooser('documents', false); slot.appendChild(invChooser); } }
    inv.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = inv.querySelector('button'); btn.disabled = true; say(imsg, 'Sending…', true);
      post(Object.assign({ form: 'officer_invite', token: tok(), name: inv.name.value, email: inv.email.value, site: location.origin }, invChooser ? invChooser.values() : { roles: 'documents' })).then(function (res) {
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
        ['name', 'age_bracket', 'guardian_name', 'guardian_email', 'guardian_phone', 'email', 'phone', 'experience', 'uscf_id', 'medical', 'emergency_name', 'emergency_relationship', 'emergency_phone', 'shirt_size', 'heard_about_us', 'note', 'photos', 'news_by', 'show_on_list'].forEach(function (k) { set(k, d[k] || ''); });
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
