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

  // Forms send to Formspree; until a real form ID replaces FORM_ID_PENDING, nothing is sent.
  var forms = document.querySelectorAll('form[data-formspree]');
  for (var k = 0; k < forms.length; k++) {
    forms[k].addEventListener('submit', function (e) {
      var f = e.currentTarget;
      if (f.getAttribute('action').indexOf('FORM_ID_PENDING') !== -1) {
        e.preventDefault();
        var notice = f.querySelector('.notice');
        if (notice) { notice.classList.add('is-visible'); notice.focus(); }
      }
    });
  }
})();
