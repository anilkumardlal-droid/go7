/*
 * AVAVA Car — main script
 *
 * Table of contents
 *   01. Helpers
 *   02. Artboard units (--u)
 *   03. Theme toggle and inherited accent
 *   04. Navigation: dropdowns and mobile menu
 *   05. Toggle chips and save buttons
 *   06. Featured rail
 *   07. Body type quiz
 *   08. Car of the week: countdown and thumbnails
 *   09. Finance calculator
 *   10. Reviews
 *   11. Newsletter forms
 *   12. Sign in / sign up popup
 *   13. Preloader
 *   14. Showroom maps (About, Contact)
 *   15. Service page: membership cards, booking form, FAQ
 *   16. Pricing page: plans, compare, buyer fees, add-ons, flip FAQ
 *   17. Help centre (FAQ page): search, questions, popular, contact, guides
 *   18. Contact page: hours, call-back, message form, departments
 *   19. Terms page: summary jumps, search, reading progress, copy link, versions
 *   20. Listing v1: search console, results (grid / list), pagination, sourcing request
 *   21. Listing Single v1 / v2: gallery, lightbox, reserve, equipment, condition map, VIN, finance, hours, nav
 *   22. Shop v1–v3 + Shop single v1: catalogs, storefront, product page, cart drawer
 *   23. 404 page: requested path, site search, broken-link report
 *   24. Init
 */
(function () {
  'use strict';

  /* 01. Helpers ------------------------------------------------------- */
  var root = document.documentElement;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function money(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function thousands(n) {
    return '$' + Math.round(n / 1000) + 'k';
  }

  function setText(sel, text) {
    $$(sel).forEach(function (el) {
      el.textContent = text;
    });
  }

  function press(btn, on) {
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  /* 02. Artboard units ------------------------------------------------ */
  // The desktop layout is drawn on a 2560px artboard: 1u = viewport / 2560.
  // clientWidth excludes the scrollbar, which 100vw does not.
  var DESKTOP = 1200;

  // On 1200–1999px screens the hero also fills the window height: --hs scales its
  // contents (1 … 1.25). Wider screens keep the artboard proportions untouched.
  var HERO_FIT_MAX = 2000;

  function syncUnits() {
    var w = root.clientWidth;
    if (w >= DESKTOP) {
      root.style.setProperty('--u', (w / 2560) + 'px');
      root.style.setProperty('--uw', (w / 2560) + 'px');
    } else {
      root.style.removeProperty('--u');
      root.style.removeProperty('--uw');
    }
    var hs = 1;
    if (w >= DESKTOP && w < HERO_FIT_MAX && document.querySelector('.hero')) {
      hs = Math.min(1.25, Math.max(1, window.innerHeight / (1200 * w / 2560)));
    }
    root.style.setProperty('--hs', hs.toFixed(4));
  }

  /* 03. Theme toggle -------------------------------------------------- */
  function setTheme(dark, keep) {
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (keep !== false) {
      try {
        window.localStorage.setItem('avava-theme', dark ? 'dark' : 'light');
      } catch (e) {
        // storage can be blocked inside the preview iframe — the switch still works
      }
    }
    $$('.js-theme-set').forEach(function (b) {
      b.setAttribute('aria-pressed', (b.getAttribute('data-theme-set') === 'dark') === dark ? 'true' : 'false');
    });
  }

  function initTheme() {
    // Listing Map v3: a sun / moon segmented switch sets the theme explicitly
    $$('.js-theme-set').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTheme(btn.getAttribute('data-theme-set') === 'dark');
      });
    });
    if ($('.js-theme-set')) {
      setTheme(root.getAttribute('data-theme') === 'dark', false);
    }
    $$('.js-theme').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dark = root.getAttribute('data-theme') !== 'dark';
        root.setAttribute('data-theme', dark ? 'dark' : 'light');
        try {
          window.localStorage.setItem('avava-theme', dark ? 'dark' : 'light');
        } catch (e) {
          // storage can be blocked inside the preview iframe — the toggle still works
        }
      });
    });
  }

  // Inner pages (data-accent="inherit"): "Home" links lead to the Home version
  // whose accent the page wears, and a change made in another tab is picked up.
  // v3 (Cobalt) has no Home of its own — it is picked on account › Preferences, so its Home link stays on Home v1
  var HOMES = { v1: ['', 'index.html'], v2: ['green', 'index-v2.html'], v3: ['blue', 'index.html'] };

  function applyAccent(key) {
    var home = HOMES[key] || HOMES.v1;
    if (home[0]) {
      root.setAttribute('data-skin', home[0]);
    } else {
      root.removeAttribute('data-skin');
    }
    $$('.js-home').forEach(function (a) {
      a.setAttribute('href', home[1]);
    });
  }

  function initAccent() {
    if (root.getAttribute('data-accent') !== 'inherit') {
      return;
    }
    var key = null;
    try {
      key = window.localStorage.getItem('avava-accent');
    } catch (e) {
      key = null;
    }
    applyAccent(key);
    window.addEventListener('storage', function (e) {
      if (e.key === 'avava-accent') {
        applyAccent(e.newValue);
      }
      if (e.key === 'avava-theme' && e.newValue) {
        var os = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', e.newValue === 'dark' || (e.newValue === 'system' && os) ? 'dark' : 'light');
      }
      if (e.key === 'avava-motion') {
        if (e.newValue === 'reduce') {
          root.setAttribute('data-motion', 'reduce');
        } else {
          root.removeAttribute('data-motion');
        }
      }
    });
  }

  /* 04. Navigation ---------------------------------------------------- */
  function initNav() {
    var items = $$('.nav__item');
    var hover = window.matchMedia('(hover: hover) and (min-width: ' + DESKTOP + 'px)');
    var timer = null;

    function setGroup(it, grp) {
      $$('.dd__grp', it).forEach(function (g) {
        var on = g === grp;
        g.classList.toggle('is-open', on);
        $('.dd__link--grp', g).setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    }

    // desktop: the first group is open by default; the mobile sheet starts collapsed
    function resetGroups(it) {
      var first = $('.dd__grp', it);
      setGroup(it, hover.matches ? first : null);
    }

    function open(it, on) {
      it.classList.toggle('is-open', on);
      $('.nav__btn', it).setAttribute('aria-expanded', on ? 'true' : 'false');
      if (!on) {
        resetGroups(it);
      }
    }

    function close(except) {
      items.forEach(function (it) {
        if (it !== except && it.classList.contains('is-open')) {
          open(it, false);
        }
      });
    }

    // rows the arrow keys walk through: top-level rows, or the rows of an open sub-panel
    function rows(list) {
      return $$(':scope > li > .dd__link', list);
    }

    function move(list, from, step) {
      var r = rows(list);
      var i = r.indexOf(from);
      var next = r[(i + step + r.length) % r.length];
      if (next) {
        next.focus();
      }
    }

    items.forEach(function (it) {
      var btn = $('.nav__btn', it);
      var panel = $('.dd > .dd__list', it);
      resetGroups(it);

      btn.addEventListener('click', function () {
        var on = !it.classList.contains('is-open');
        close(it);
        open(it, on);
      });

      btn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          close(it);
          open(it, true);
          rows(panel)[0].focus();
        }
      });

      it.addEventListener('mouseenter', function () {
        if (hover.matches) {
          window.clearTimeout(timer);
          close(it);
          open(it, true);
        }
      });

      it.addEventListener('mouseleave', function () {
        if (hover.matches) {
          timer = window.setTimeout(function () {
            open(it, false);
          }, 120);
        }
      });

      $$('.dd__grp', it).forEach(function (grp) {
        var gbtn = $('.dd__link--grp', grp);
        var sub = $('.dd__list--sub', grp);

        grp.addEventListener('mouseenter', function () {
          if (hover.matches) {
            setGroup(it, grp);
          }
        });

        gbtn.addEventListener('click', function () {
          setGroup(it, grp.classList.contains('is-open') && !hover.matches ? null : grp);
        });

        gbtn.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            setGroup(it, grp);
            rows(sub)[0].focus();
          }
        });

        sub.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            gbtn.focus();
          } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            move(sub, e.target.closest('.dd__link'), e.key === 'ArrowDown' ? 1 : -1);
          }
        });
      });

      panel.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          var row = e.target.closest('.dd__link');
          if (row && row.parentElement.parentElement === panel) {
            e.preventDefault();
            move(panel, row, e.key === 'ArrowDown' ? 1 : -1);
          }
        } else if (e.key === 'Escape') {
          open(it, false);
          btn.focus();
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav__item')) {
        close(null);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        close(null);
        setMenu(false);
      }
    });

    hover.addEventListener('change', function () {
      items.forEach(resetGroups);
    });

    var burger = $('.js-burger');

    function setMenu(on) {
      if (!burger) {
        return;
      }
      root.classList.toggle('is-menu', on);
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
      burger.setAttribute('aria-label', on ? 'Close menu' : 'Open menu');
    }

    if (burger) {
      burger.addEventListener('click', function () {
        setMenu(!root.classList.contains('is-menu'));
      });
      window.addEventListener('resize', function () {
        if (root.clientWidth >= DESKTOP) {
          setMenu(false);
        }
      });
    }
  }

  /* 05. Toggle chips and save buttons --------------------------------- */
  function initChips() {
    $$('.js-chips').forEach(function (group) {
      var btns = $$('button', group);
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btns.forEach(function (b) {
            press(b, b === btn);
          });
        });
      });
    });

    $$('.js-save').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
  }

  /* 06. Featured rail ------------------------------------------------- */
  function initRail() {
    var rail = $('.js-rail');
    if (!rail) {
      return;
    }
    var nav = $('.js-railnav');
    var cur = $('.js-rail-cur');
    var bar = $('.js-rail-bar');
    var cards = $$('.car', rail);

    function step() {
      return cards.length ? cards[0].getBoundingClientRect().width : rail.clientWidth;
    }

    function update() {
      var i = Math.min(cards.length, Math.round(rail.scrollLeft / step()) + 1);
      if (cur) {
        cur.textContent = (i < 10 ? '0' : '') + i;
      }
      if (bar) {
        bar.style.width = Math.min(100, (rail.scrollLeft + rail.clientWidth) / rail.scrollWidth * 100) + '%';
      }
    }

    if (nav) {
      $('.js-prev', nav).addEventListener('click', function () {
        rail.scrollBy({ left: -step(), behavior: 'smooth' });
      });
      $('.js-next', nav).addEventListener('click', function () {
        rail.scrollBy({ left: step(), behavior: 'smooth' });
      });
    }
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* 07. Body type quiz ------------------------------------------------ */
  function initQuiz() {
    var box = $('.js-quiz');
    var out = $('.js-quiz-out');
    if (!box || !out) {
      return;
    }
    var btns = $$('button', box);

    function update() {
      var n = btns.filter(function (b) {
        return b.classList.contains('is-on');
      }).length;
      var matches = n ? Math.max(2, 26 - n * 4) : 110;
      out.textContent = n + ' selected · ' + matches + ' matches';
    }

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        press(btn, !btn.classList.contains('is-on'));
        update();
      });
    });
  }

  /* 08. Car of the week ----------------------------------------------- */
  function initWeek() {
    var timer = $('.js-timer');
    if (timer) {
      // the offer ends at midnight between Sunday and Monday, every week
      var end = new Date();
      end.setHours(24, 0, 0, 0);
      end.setDate(end.getDate() + ((8 - end.getDay()) % 7));
      var pad = function (n) {
        return (n < 10 ? '0' : '') + n;
      };
      var tick = function () {
        var s = Math.max(0, Math.floor((end - Date.now()) / 1000));
        setText('.js-t-d', pad(Math.floor(s / 86400)));
        setText('.js-t-h', pad(Math.floor(s % 86400 / 3600)));
        setText('.js-t-m', pad(Math.floor(s % 3600 / 60)));
        setText('.js-t-s', pad(s % 60));
      };
      tick();
      window.setInterval(tick, 1000);
    }

    $$('.js-thumbs').forEach(function (list) {
      var btns = $$('button', list);
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btns.forEach(function (b) {
            press(b, b === btn);
          });
          // Home v1: a studio angle replaces the stage photo
          var cw = btn.hasAttribute('data-angle') && btn.closest('.cw');
          if (cw) {
            cw.setAttribute('data-angle', btn.getAttribute('data-angle'));
          }
        });
      });
    });
  }

  /* 09. Finance calculator -------------------------------------------- */
  function initFinance() {
    var form = $('.js-fin');
    if (!form) {
      return;
    }
    var CIRC = 2 * Math.PI * 54;
    var inputs = {};
    $$('.js-fin-in', form).forEach(function (el) {
      inputs[el.name] = el;
    });
    var state = {
      price: +inputs.price.value,
      down: +inputs.down.value,
      term: +inputs.term.value,
      trade: +inputs.trade.value,
      apr: 5.9,
      name: 'Serpent Roadster 427'
    };
    var cars = $$('.js-fin-car');
    var presets = $$('.js-fin-pre');
    var tiers = $$('.js-fin-tier');

    function pay(loan, r, n) {
      return r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
    }

    function slider(key) {
      var el = inputs[key];
      var pct = (el.value - el.min) / (el.max - el.min) * 100 + '%';
      $$('.js-fin-fill-' + key).forEach(function (f) {
        f.style.width = pct;
      });
      $$('.js-fin-knob-' + key).forEach(function (k) {
        k.style.left = pct;
      });
    }

    function render() {
      var s = state;
      var dp = Math.round(s.price * s.down / 100);
      var tr = Math.min(s.trade, s.price - dp);
      var loan = Math.max(s.price - dp - tr, 0);
      var r = s.apr / 1200;
      var m = pay(loan, r, s.term);
      var interest = m * s.term - loan;
      var dealer = pay(loan, 8.9 / 1200, s.term) * s.term - loan;
      var save = Math.max(dealer - interest, 0);
      var total = m * s.term + dp + tr;

      setText('.js-fin-out-price', money(s.price));
      setText('.js-fin-out-down', s.down + '% · ' + thousands(dp));
      setText('.js-fin-out-term', s.term + ' mo');
      setText('.js-fin-out-trade', s.trade ? money(tr) : '$0');
      setText('.js-fin-name', s.name);
      setText('.js-fin-price', money(s.price));
      setText('.js-fin-monthly', Math.round(m).toLocaleString('en-US'));
      setText('.js-fin-apr', s.apr + '% APR · ' + s.term + ' mo');
      setText('.js-fin-summary', money(loan) + ' financed over ' + s.term + ' months at ' + s.apr + '% APR.');
      setText('.js-fin-save', 'You save ' + money(save) + ' vs 8.9% dealer avg');

      ['price', 'down', 'term', 'trade'].forEach(slider);

      var parts = { down: dp, trade: tr, loan: loan, int: interest };
      var offset = 0;
      Object.keys(parts).forEach(function (k) {
        var share = total ? parts[k] / total : 0;
        var seg = $('.js-sp-' + k);
        if (seg) {
          seg.style.width = (share * 100).toFixed(2) + '%';
        }
        var arc = $('.js-dn-' + k);
        if (arc) {
          var len = share * CIRC;
          arc.style.strokeDasharray = len.toFixed(2) + ' ' + (CIRC - len + 0.01).toFixed(2);
          arc.style.strokeDashoffset = (-offset).toFixed(2);
        }
        offset += share * CIRC;
      });
    }

    Object.keys(inputs).forEach(function (key) {
      inputs[key].addEventListener('input', function () {
        state[key] = +inputs[key].value;
        if (key === 'price') {
          state.name = 'Custom price';
          cars.forEach(function (b) {
            press(b, false);
          });
        }
        if (key === 'down' || key === 'term') {
          presets.forEach(function (b) {
            press(b, false);
          });
        }
        render();
      });
    });

    cars.forEach(function (btn) {
      btn.addEventListener('click', function () {
        cars.forEach(function (b) {
          press(b, b === btn);
        });
        state.price = +btn.getAttribute('data-price');
        state.name = btn.firstChild.textContent.trim();
        inputs.price.value = state.price;
        render();
      });
    });

    presets.forEach(function (btn) {
      btn.addEventListener('click', function () {
        presets.forEach(function (b) {
          press(b, b === btn);
        });
        state.down = +btn.getAttribute('data-down');
        state.term = +btn.getAttribute('data-term');
        inputs.down.value = state.down;
        inputs.term.value = state.term;
        render();
      });
    });

    tiers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tiers.forEach(function (b) {
          press(b, b === btn);
        });
        state.apr = +btn.getAttribute('data-apr');
        render();
      });
    });

    render();
  }

  /* 10. Reviews ------------------------------------------------------- */
  function initReviews() {
    var cards = $$('.js-rv');
    var bg = $('.js-rv-bg');
    if (!cards.length || !bg) {
      return;
    }

    function show(btn) {
      var d = btn.dataset;
      bg.className = 'rvf__bg js-rv-bg' + (d.img ? ' has-photo has-photo--' + d.img : '');
      var av = $('.js-rv-av');
      if (av) {
        av.className = 'av av--52 js-rv-av' + (d.av ? ' av--p-' + d.av : '');
      }
      setText('.js-rv-q', d.q);
      setText('.js-rv-n', d.n);
      setText('.rvf .js-rv-city', d.c);
      setText('.js-rv-car', d.car);
      setText('.js-rv-t', d.t);
      setText('.js-rv-story', 'Watch ' + d.n.split(' ')[0] + '’s story · 0:48');
      cards.forEach(function (b) {
        var on = b === btn;
        b.closest('.rv').classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    cards.forEach(function (btn) {
      btn.addEventListener('click', function () {
        show(btn);
      });
    });

    var sec = bg.closest('.revs');
    var prev = sec && $('.js-prev', sec);
    var next = sec && $('.js-next', sec);

    function shift(dir) {
      var i = cards.findIndex(function (b) {
        return b.getAttribute('aria-pressed') === 'true';
      });
      show(cards[(i + dir + cards.length) % cards.length]);
    }

    if (prev && next) {
      prev.addEventListener('click', function () {
        shift(-1);
      });
      next.addEventListener('click', function () {
        shift(1);
      });
    }
  }

  /* 11. Newsletter forms ---------------------------------------------- */
  function initNews() {
    $$('.js-news').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = $('input[type="email"]', form);
        if (!input || !input.checkValidity()) {
          return;
        }
        var field = input.closest('.field');
        if (field) {
          field.classList.add('is-done');
        }
        input.value = '';
        input.placeholder = 'Thanks — you’re on the list';
      });
    });
  }

  /* 12. Sign in / sign up popup -------------------------------------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function initials(name) {
    var parts = name.trim().split(/[\s._-]+/).filter(Boolean);
    var out = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] || 'AV').slice(0, 2);
    return out.toUpperCase();
  }

  function showUser(name) {
    $$('.js-signin').forEach(function (el) {
      el.hidden = true;
    });
    $$('.js-me').forEach(function (el) {
      el.hidden = false;
      el.setAttribute('aria-label', 'Your account: ' + name);
    });
    setText('.js-me-initials', initials(name));
  }

  // The header's Account circle shows the photo saved on the profile page (localStorage "avava-profile").
  function paintHeaderAvatar() {
    var ph = (shopGet('avava-profile', null) || {}).ph || '';
    // the dealer pages show the dealership's logo instead (parts.header)
    $$('.hd__acc:not(.hd__acc--dealer)').forEach(function (a) {
      a.style.backgroundImage = ph ? 'url("' + ph + '")' : '';
      a.classList.toggle('has-ph', !!ph);
    });
  }

  function initAuth() {
    var dlg = $('.js-auth');
    if (!dlg || typeof dlg.showModal !== 'function') {
      return;
    }
    var tabs = $$('.js-auth-tab', dlg);
    var forms = $$('.js-auth-form', dlg);
    var panels = $$('.js-auth-panel', dlg);
    var TEXT = [
      ['Welcome', 'back.', 'Sign in to see saved cars, offers and deliveries.'],
      ['Create your', 'account.', 'Save cars, get price alerts and pre-approval in 2 minutes.']
    ];

    try {
      var saved = window.sessionStorage.getItem('avava-user');
      if (saved) {
        showUser(saved);
      }
    } catch (e) {
      // storage blocked in the preview iframe — the popup still works
    }

    function field(input) {
      return input.closest('.js-afield');
    }

    function message(input, text, note) {
      var f = field(input);
      var msg = $('.afield__msg', f);
      f.classList.toggle('is-error', !!text && !note);
      msg.classList.toggle('is-note', !!note);
      msg.textContent = text || '';
    }

    function refresh(input) {
      var f = field(input);
      var v = input.value.trim();
      f.classList.toggle('is-filled', v !== '');
      if (input.type === 'email') {
        f.classList.toggle('is-valid', EMAIL.test(v));
      }
    }

    function strength(input) {
      var v = input.value;
      var score = 0;
      if (v.length >= 8) { score++; }
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) { score++; }
      if (/\d/.test(v)) { score++; }
      if (/[^A-Za-z0-9]/.test(v)) { score++; }
      if (v && !score) { score = 1; }
      var meter = $('.js-auth-meter', dlg);
      $$('.meter__s', meter).forEach(function (seg, i) {
        seg.classList.toggle('is-on', i < score);
      });
      meter.classList.toggle('is-weak', score > 0 && score < 3);
      meter.classList.toggle('is-ok', score >= 3);
      setText('.js-auth-strength', v ? ['Weak', 'Weak', 'Fair', 'Good', 'Strong'][score] : 'Strength');
    }

    function setTab(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, k) {
        p.hidden = k !== i;
      });
      setText('.js-auth-t1', TEXT[i][0]);
      setText('.js-auth-t2', TEXT[i][1]);
      setText('.js-auth-sub', TEXT[i][2]);
      if (focus) {
        tabs[i].focus();
      }
    }

    function open(e) {
      e.preventDefault();
      if (!$('.js-me[hidden]')) {
        window.location.href = e.currentTarget.getAttribute('href');
        return;
      }
      setTab(0);
      dlg.showModal();
      root.classList.add('is-modal');
      $('#auth-email').focus();
    }

    function close() {
      dlg.close();
      root.classList.remove('is-modal');
    }

    $$('.js-auth-open').forEach(function (a) {
      a.addEventListener('click', open);
    });
    $$('.js-auth-close', dlg).forEach(function (b) {
      b.addEventListener('click', close);
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) {
        close();
      }
    });
    dlg.addEventListener('close', function () {
      root.classList.remove('is-modal');
    });

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        setTab(i);
      });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          setTab(i ? 0 : 1, true);
        }
      });
    });
    $$('.js-auth-switch', dlg).forEach(function (b) {
      b.addEventListener('click', function () {
        setTab(+b.getAttribute('data-tab'));
      });
    });

    $$('.afield__in', dlg).forEach(function (input) {
      input.addEventListener('input', function () {
        refresh(input);
        message(input, '');
        if (input.id === 'auth-new-pass') {
          strength(input);
        }
      });
    });

    $$('.js-auth-show', dlg).forEach(function (b) {
      b.addEventListener('click', function () {
        var input = document.getElementById(b.getAttribute('aria-controls'));
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        b.textContent = show ? 'Hide' : 'Show';
        b.setAttribute('aria-pressed', show ? 'true' : 'false');
      });
    });

    var forgot = $('.js-auth-forgot', dlg);
    if (forgot) {
      forgot.addEventListener('click', function () {
        var email = $('#auth-email');
        if (EMAIL.test(email.value.trim())) {
          message($('#auth-pass'), 'Reset link sent to ' + email.value.trim(), true);
        } else {
          message(email, 'Enter your email and we will send a reset link');
          email.focus();
        }
      });
    }

    function done(btn, name) {
      btn.classList.add('is-loading');
      btn.disabled = true;
      window.setTimeout(function () {
        btn.classList.remove('is-loading');
        btn.disabled = false;
        try {
          window.sessionStorage.setItem('avava-user', name);
        } catch (e) {
          // not saved — the header still shows the avatar until reload
        }
        showUser(name);
        forms.forEach(function (f) {
          f.reset();
          $$('.js-afield', f).forEach(function (fl) {
            fl.classList.remove('is-filled', 'is-valid', 'is-error');
          });
          $$('.afield__msg', f).forEach(function (m) {
            m.textContent = '';
          });
        });
        close();
      }, 900);
    }

    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var up = form.getAttribute('data-mode') === 'up';
        var bad = [];
        $$('.afield__in', form).forEach(function (input) {
          var v = input.value.trim();
          var err = '';
          if (!v) {
            err = 'This field is required';
          } else if (input.type === 'email' && !EMAIL.test(v)) {
            err = 'Enter a valid email address';
          } else if (input.name === 'password' && v.length < (up ? 8 : 6)) {
            err = up ? 'Use at least 8 characters' : 'Password is too short';
          }
          message(input, err);
          if (err) {
            bad.push(input);
          }
        });
        if (bad.length) {
          bad[0].focus();
          return;
        }
        var name = up ? $('#auth-first').value + ' ' + $('#auth-last').value : $('#auth-email').value.split('@')[0];
        done($('.auth__go', form), name);
      });
    });

    $$('.js-auth-social', dlg).forEach(function (b) {
      b.addEventListener('click', function () {
        var form = forms.filter(function (f) {
          return !f.closest('.js-auth-panel').hidden;
        })[0];
        done($('.auth__go', form), 'Avava Driver');
      });
    });
  }

  /* 13. Preloader ----------------------------------------------------- */
  // hide once the page has loaded and the logo has finished filling (~2.3 s)
  function initPreloader() {
    var pre = $('.js-pre');
    if (!pre) {
      return;
    }
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var minTime = reduce ? 300 : 2400;

    function hide() {
      var wait = Math.max(0, minTime - window.performance.now());
      window.setTimeout(function () {
        pre.classList.add('is-done');
      }, wait);
    }

    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide);
    }
  }

  /* 14. Showroom map ------------------------------------------------- */
  // Leaflet with OpenStreetMap tiles: no API key, no billing account. The
  // tiles are muted in CSS (and inverted in the dark theme); the attribution
  // is required by the OpenStreetMap licence and must stay visible.
  // Until the tiles arrive — or when they never do — the drawn map shows.
  function initMap() {
    if (typeof window.L === 'undefined') {
      return;
    }
    $$('.js-map').forEach(mapOne);
  }

  // data-lat / data-lng / data-zoom — the spot; data-pan — where the pin sits across
  // the box on desktops (0.5 = centre); data-pin — "rings" (About) or "label" (Contact)
  function mapOne(el) {
    var L = window.L;
    var box = el.parentElement;
    var spot = [parseFloat(el.getAttribute('data-lat')), parseFloat(el.getAttribute('data-lng'))];
    var zoom = parseInt(el.getAttribute('data-zoom'), 10) || 16;
    var panX = parseFloat(el.getAttribute('data-pan') || '0.5');
    var panY = parseFloat(el.getAttribute('data-pan-y') || '0.5');
    var touch = window.matchMedia('(hover: none)').matches;
    var label = el.getAttribute('data-label');
    var labelSkin = el.getAttribute('data-label-skin');
    function txt(t) {
      return t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    }
    // data-label-skin: Listing Single shows one of the two texts by <html data-skin> (.lsg-e / .lsg-s)
    var tag = label && labelSkin ?
      '<span class="lsg-e">' + txt(label) + '</span><span class="lsg-s">' + txt(labelSkin) + '</span>' : label ? txt(label) : '';
    var pin = label ?
      '<span class="lpin"><span class="lsg-pin__tag">' + tag + '</span><span class="lsg-pin__stem"></span><span class="lsg-pin__dot"></span></span>' :
      el.getAttribute('data-pin') === 'label' ?
      '<span class="lpin"><span class="lpin__tag">Avava showroom <span class="lpin__st js-cn-pinstate">· open</span></span><span class="lpin__stem"></span><span class="lpin__dot"></span></span>' :
      '<span class="vpin__r vpin__r--3"></span><span class="vpin__r vpin__r--2"></span><span class="vpin__r vpin__r--1"></span><span class="vpin__dot"></span>';

    var map = L.map(el, {
      scrollWheelZoom: false, // the page scrolls past the map
      dragging: !touch,       // one finger scrolls the page on phones
      zoomControl: false,
      attributionControl: false
    });

    L.control.attribution({ position: 'topright', prefix: false }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale({ position: 'topleft', imperial: false, maxWidth: 90 }).addTo(map);

    var tiles = L.tileLayer('../../../tile.openstreetmap.org/%7bz%7d/%7bx%7d/%7by%7d.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    tiles.once('load', function () {
      box.classList.add('is-live');
    });

    L.marker(spot, {
      icon: L.divIcon({ className: el.getAttribute('data-pin') === 'label' ? 'lpin-wrap' : 'vpin', html: pin, iconSize: [0, 0] }),
      keyboard: false,
      interactive: false
    }).addTo(map);

    // data-you="lat,lng" — the visitor, with the drive time (Listing Single)
    var you = el.getAttribute('data-you');
    if (you) {
      L.marker(you.split(',').map(parseFloat), {
        icon: L.divIcon({ className: 'lsg-you-wrap', html: '<span class="lsg-you"></span><span class="lsg-you__tag">' + (el.getAttribute('data-you-label') || 'You') + '</span>', iconSize: [0, 0] }),
        keyboard: false,
        interactive: false
      }).addTo(map);
    }

    function frame() {
      map.invalidateSize();
      map.setView(spot, zoom, { animate: false });
      if (root.clientWidth >= DESKTOP) {
        map.panBy([-(panX - 0.5) * el.clientWidth, -(panY - 0.5) * el.clientHeight], { animate: false });
      }
    }

    frame();
    var t = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(t);
      t = window.setTimeout(frame, 150);
    });
    el.dispatchEvent(new CustomEvent('avava:map', { bubbles: true }));
  }

  /* 15. Service page -------------------------------------------------- */
  // Membership cards: one is selected; the comparison list follows it.
  function initPackages() {
    var wrap = $('.pkg__cards');
    if (!wrap) {
      return;
    }
    var cards = $$('.js-pk', wrap);
    var feats = $$('.pkf');

    function pick(card) {
      var n = parseInt(card.getAttribute('data-n'), 10);
      var per = card.getAttribute('data-per');
      cards.forEach(function (c) {
        var on = c === card;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      wrap.setAttribute('data-pk', card.getAttribute('data-pk'));
      feats.forEach(function (f, i) {
        f.classList.toggle('is-on', i < n);
      });
      setText('.js-pk-num', '0' + (parseInt(card.getAttribute('data-pk'), 10) + 1));
      setText('.js-pk-name', card.getAttribute('data-name') + ' · ' + card.getAttribute('data-price') + (per === 'one-off' ? '' : ' / mo'));
      setText('.js-pk-desc', card.getAttribute('data-desc'));
      setText('.js-pk-cta', 'Choose ' + card.getAttribute('data-name'));
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        pick(card);
      });
    });
  }

  // Booking: a live form on the left, the ticket on the right.
  // Availability is a sample rule — wire it to the real calendar.
  var BK_SERVICES = [['150-point inspection', 149], ['Detailing', 290], ['Scheduled service', 220],
    ['Tyres & wheels', 95], ['Ceramic & PPF', 890], ['Car storage', 190]];
  var BK_DAYS = [['Tue', 'Tue 30 Sep'], ['Wed', 'Wed 1 Oct'], ['Thu', 'Thu 2 Oct'], ['Fri', 'Fri 3 Oct'], ['Sat', 'Sat 4 Oct']];
  var BK_TIMES = ['09:00', '10:30', '12:00', '14:00', '16:30', '18:00'];
  var BK_MAKERS = { WP0: 'Porsche', ZFF: 'Ferrari', '5YJ': 'Tesla', WDD: 'Mercedes-Benz', WBA: 'BMW', '1FA': 'Ford' };
  var BK_YEARS = 'ABCDEFGHJKLMNPRSTVWXY';

  function bkBusy(d, t) {
    return (d * 7 + t * 3) % 5 === 0 || (d === 4 && t > 3);
  }

  function initBooking() {
    var form = $('.js-book');
    if (!form) {
      return;
    }
    var carIn = $('.js-bk-car', form);
    var go = $('.js-bk-go', form);
    var done = false;

    function val(name) {
      var el = $('input[name="' + name + '"]:checked', form);
      return el ? parseInt(el.value, 10) : 0;
    }

    function money(n) {
      return '$' + n.toLocaleString('en-US');
    }

    function decode(c) {
      var raw = c.replace(/\s/g, '');
      if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(raw)) {
        return '';
      }
      var y = BK_YEARS.indexOf(raw.charAt(9).toUpperCase());
      return (BK_MAKERS[raw.slice(0, 3).toUpperCase()] || 'Vehicle') + ' · ' + (2010 + (y >= 0 ? y : 14));
    }

    // a busy slot on the new day: jump to the first free one
    function syncTimes() {
      var day = val('day');
      var picked = null;
      $$('input[name="time"]', form).forEach(function (r, i) {
        r.disabled = bkBusy(day, i);
        if (r.checked && !r.disabled) {
          picked = r;
        }
      });
      if (!picked) {
        var first = $('input[name="time"]:not(:disabled)', form);
        if (first) {
          first.checked = true;
        }
      }
      setText('.js-bk-free', String(BK_TIMES.filter(function (t, i) {
        return !bkBusy(day, i);
      }).length));
    }

    function render() {
      var c = carIn.value.trim();
      var decoded = decode(c);
      var ok = c.length >= 3;
      var svc = val('service');
      var day = val('day');
      var time = val('time');
      var mode = val('handover');
      var price = BK_SERVICES[svc][1];
      var tax = Math.round(price * 0.095);
      var when = BK_DAYS[day][1] + ' · ' + BK_TIMES[time];
      var vin = $('.js-bk-vin', form);
      var status = $('.js-bk-status', form);
      var seed = (svc * 13 + day * 7 + time * 3) || 1;
      var bars = '';
      var i;

      vin.textContent = decoded ? '✓ VIN decoded · ' + decoded : (c.length >= 11 && /\d/.test(c) ? 'Looks like a VIN…' : '');
      vin.classList.toggle('is-ok', !!decoded);
      setText('.js-bk-count', decoded ? '17 / 17 VIN' : (c.length ? c.length + ' chars' : ''));

      $$('.bkf__step', form).forEach(function (s, k) {
        s.classList.toggle('is-on', k === 0 || (k < 3 && ok) || (k === 3 && done));
      });

      setText('.js-bk-code', String(4000 + svc * 131 + day * 17 + time * 7));
      setText('.js-bk-carshow', c || 'Your car');
      setText('.js-bk-carsub', decoded || (c ? 'Entered manually' : 'Type a car or VIN'));
      setText('.js-bk-rsvc', BK_SERVICES[svc][0]);
      setText('.js-bk-rwhen', when);
      setText('.js-bk-rmode', mode ? 'Drop-off · 1200 S Figueroa' : 'Pick-up at your door');
      setText('.js-bk-lsvc', money(price));
      setText('.js-bk-lpick', mode ? 'n/a' : '$0');
      setText('.js-bk-ltax', money(tax));
      setText('.js-bk-total', money(price + tax));
      setText('.js-bk-stampday', when);
      $('.js-bk-stamp', form).classList.toggle('is-on', done);

      go.disabled = !ok;
      go.classList.toggle('is-done', done);
      setText('.js-bk-golabel', done ? 'Booked · add to calendar' : 'Book ' + BK_DAYS[day][0] + ' ' + BK_TIMES[time]);
      status.textContent = done ? 'Confirmed · driver details by text' : (ok ? 'Slot held for 10 min' : 'Enter your car to book');
      status.classList.toggle('is-held', ok && !done);
      status.classList.toggle('is-done', done);

      for (i = 0; i < 34; i++) {
        bars += '<span class="tkt__bar' + (i % 2 ? ' tkt__bar--gap' : '') + ' tkt__bar--w' + (((i * 7 + seed) % 3) + 1) + '"></span>';
      }
      $('.js-bk-bars', form).innerHTML = bars;
    }

    // any edit re-opens the booking
    function edit() {
      done = false;
      render();
    }

    carIn.addEventListener('input', edit);
    $$('.js-bk', form).forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.name === 'day') {
          syncTimes();
        }
        edit();
      });
    });
    $$('.js-bk-try', form).forEach(function (b) {
      b.addEventListener('click', function () {
        carIn.value = b.textContent;
        edit();
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (carIn.value.trim().length >= 3) {
        done = true;
        render();
      }
    });

    // service cards above pre-select their service here
    $$('.js-svc-pick').forEach(function (a) {
      a.addEventListener('click', function () {
        var r = $('input[name="service"][value="' + a.getAttribute('data-svc') + '"]', form);
        if (r) {
          r.checked = true;
          edit();
        }
      });
    });

    render();
  }

  // FAQ: live search, topics, one open answer, prev / next, a helpful vote.
  function initServiceFaq() {
    var box = $('.fqa__box');
    if (!box) {
      return;
    }
    var rows = $$('.js-fq-row', box);
    var panels = $$('.fqp', box);
    var input = $('.js-fq-q');
    var topic = 'All';
    var cur = 0;

    function visible() {
      var q = input.value.trim().toLowerCase();
      return rows.map(function (r, i) {
        var p = panels[i];
        var hay = (r.textContent + ' ' + p.textContent).toLowerCase();
        var ok = (topic === 'All' || r.getAttribute('data-topic') === topic) && (!q || hay.indexOf(q) >= 0);
        r.parentNode.hidden = !ok;
        return ok ? i : -1;
      }).filter(function (i) {
        return i >= 0;
      });
    }

    function open(i) {
      cur = i;
      rows.forEach(function (r, k) {
        r.classList.toggle('is-on', k === i);
        r.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
      panels.forEach(function (p, k) {
        p.hidden = k !== i;
        p.classList.toggle('is-on', k === i);
      });
      setText('.js-fq-num', '0' + (i + 1));
      setText('.js-fq-ghost', '0' + (i + 1));
      setText('.js-fq-topicname', panels[i].getAttribute('data-topic'));
    }

    function filter() {
      var vis = visible();
      var q = input.value.trim();
      setText('.js-fq-hits', q ? vis.length + ' found' : '');
      setText('.js-fq-term', q);
      $('.js-fq-empty').hidden = vis.length > 0;
      if (vis.length && vis.indexOf(cur) < 0) {
        open(vis[0]);
      }
    }

    function step(d) {
      var vis = visible();
      var pool = vis.length ? vis : rows.map(function (r, i) {
        return i;
      });
      var k = pool.indexOf(cur);
      open(pool[(k + d + pool.length) % pool.length]);
    }

    rows.forEach(function (r, i) {
      r.addEventListener('click', function () {
        open(i);
      });
    });
    $$('.js-fq-go', box).forEach(function (b) {
      b.addEventListener('click', function () {
        open(parseInt(b.getAttribute('data-i'), 10));
      });
    });
    $$('.js-fq-topic').forEach(function (b) {
      b.addEventListener('click', function () {
        topic = b.getAttribute('data-topic');
        $$('.js-fq-topic').forEach(function (x) {
          press(x, x === b);
        });
        filter();
      });
    });
    input.addEventListener('input', filter);
    $('.js-fq-prev').addEventListener('click', function () {
      step(-1);
    });
    $('.js-fq-next').addEventListener('click', function () {
      step(1);
    });

    // a Yes adds one to the count; pressing the other answer undoes it
    panels.forEach(function (p) {
      var base = parseInt(p.getAttribute('data-votes'), 10);
      var btns = $$('.js-fq-vote', p);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var yes = b.getAttribute('data-v') === '1';
          btns.forEach(function (x) {
            var on = x === b;
            x.setAttribute('aria-pressed', on ? 'true' : 'false');
            x.textContent = on ? (x.getAttribute('data-v') === '1' ? 'Thanks!' : 'Noted') : (x.getAttribute('data-v') === '1' ? 'Yes' : 'No');
          });
          $('.js-fq-count', p).textContent = String(base + (yes ? 1 : 0));
        });
      });
    });
  }

  /* 16. Pricing page -------------------------------------------------- */
  // Sample figures — keep them in step with _dev/build_pricing.py.
  function usd(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  // widths and angles the markup carries as data (no inline styles in the HTML)
  function applyData(ctx) {
    $$('[data-w]', ctx).forEach(function (el) {
      el.style[el.classList.contains('carsl__knob') ? 'left' : 'width'] = el.getAttribute('data-w') + '%';
    });
    $$('[data-l]', ctx).forEach(function (el) {
      el.style.left = el.getAttribute('data-l') + '%';
    });
    $$('[data-deg]', ctx).forEach(function (el) {
      el.style.transform = 'rotate(' + el.getAttribute('data-deg') + 'deg)';
    });
    $$('[data-dash]', ctx).forEach(function (el) {
      el.style.strokeDasharray = el.getAttribute('data-dash') + ' 999';
    });
  }

  function initPlans() {
    var box = $('.js-plans');
    if (!box) {
      return;
    }
    var plans = $$('.js-plan', box);
    var range = $('.js-pl-range');
    var yearly = false;
    var sel = parseInt(box.getAttribute('data-sel'), 10);
    var cars = parseInt(range.value, 10);
    var NAMES = ['Private', 'Dealer', 'Dealer Pro'];

    function mo(v) {
      return yearly ? Math.round(v * 0.8) : v;
    }

    function fit() {
      return cars <= 1 ? 0 : (cars <= 25 ? 1 : 2);
    }

    function render() {
      var cur = parseInt(plans[sel].getAttribute('data-price'), 10);
      var save = cur ? cur * 12 - Math.round(cur * 0.8) * 12 : 0;
      var saveEl = $('.js-pl-save');
      var pct = (cars - 1) / 59 * 100;
      saveEl.textContent = save ? usd(save) + ' / yr' + (yearly ? ' ✓' : '') : '—';
      saveEl.classList.toggle('is-ok', yearly && save > 0);
      $$('.js-pl-bill').forEach(function (b) {
        press(b, (b.getAttribute('data-yearly') === '1') === yearly);
      });
      setText('.js-pl-carsv', String(cars));
      setText('.js-pl-unit', cars >= 60 ? 'cars +' : (cars === 1 ? 'car' : 'cars'));
      setText('.js-pl-rec', NAMES[fit()]);
      $('.js-pl-fill').style.width = pct + '%';
      $('.js-pl-knob').style.left = pct + '%';

      plans.forEach(function (p, i) {
        var v = parseInt(p.getAttribute('data-price'), 10);
        var lim = parseInt(p.getAttribute('data-limit'), 10);
        var over = cars > lim;
        var on = i === sel;
        var meter = lim > 999 ? Math.min(100, cars / 60 * 100) : Math.min(100, cars / lim * 100);
        p.classList.toggle('is-on', on);
        $('.js-plan-pick', p).setAttribute('aria-pressed', on ? 'true' : 'false');
        $('.plan__fit', p).classList.toggle('is-on', i === fit());
        $('.js-pl-price', p).textContent = v ? usd(mo(v)) : '$0';
        $('.js-pl-per', p).textContent = v === 0 ? 'forever' : (yearly ? '/ mo · yearly' : '/ month');
        $('.js-pl-old', p).textContent = v && yearly ? usd(v) : '';
        $('.js-pl-cars', p).textContent = String(cars);
        var pc = $('.js-pl-percar', p);
        pc.textContent = v === 0 ? (over ? 'Only 1 car' : 'Free') : (over ? 'Over limit' : '≈ ' + usd(mo(v) / Math.max(1, cars)) + ' / car');
        pc.classList.toggle('is-over', over);
        var used = $('.js-pl-used', p);
        used.textContent = lim > 999 ? cars + ' / ∞' : (over ? lim + ' / ' + lim + ' · need ' + (cars - lim) + ' more' : Math.min(cars, lim) + ' / ' + lim);
        used.classList.toggle('is-over', over);
        var mf = $('.js-pl-meter', p);
        mf.style.width = meter + '%';
        mf.classList.toggle('is-over', over);
      });
    }

    $$('.js-pl-bill').forEach(function (b) {
      b.addEventListener('click', function () {
        yearly = b.getAttribute('data-yearly') === '1';
        render();
      });
    });
    range.addEventListener('input', function () {
      cars = parseInt(range.value, 10);
      render();
    });
    $('.js-pl-pickrec').addEventListener('click', function () {
      sel = fit();
      render();
    });
    plans.forEach(function (p, i) {
      $('.js-plan-pick', p).addEventListener('click', function () {
        sel = i;
        render();
      });
    });
    render();
  }

  function initCompare() {
    var table = $('.js-cpt');
    if (!table) {
      return;
    }
    var st = { all: false, diff: false, grp: 'All', closed: {} };
    var groups = $$('.cpt__g', table);
    var total = $$('.cpt__row', table).length;

    function render() {
      var shown = 0;
      groups.forEach(function (g) {
        var name = g.getAttribute('data-grp');
        var closed = !!st.closed[name];
        var n = 0;
        var inGroup = st.grp === 'All' || st.grp === name;
        $$('.cpt__row', g).forEach(function (r) {
          var ok = inGroup && (st.all || st.grp !== 'All' || r.getAttribute('data-key') === '1') &&
            (!st.diff || r.getAttribute('data-same') !== '1');
          if (ok) {
            n++;
          }
          r.hidden = !ok || closed;
        });
        g.hidden = n === 0;
        shown += closed ? 0 : n;
        $('.js-cp-cnt', g).textContent = String(n);
        $('.js-cp-open', g).setAttribute('aria-expanded', closed ? 'false' : 'true');
      });
      setText('.js-cp-count', shown + ' of ' + total + ' features');
      setText('.js-cp-alltxt', st.all ? 'Show less' : 'Show all ' + total);
      $('.js-cp-all').setAttribute('aria-pressed', st.all ? 'true' : 'false');
      $('.js-cp-diff').setAttribute('aria-pressed', st.diff ? 'true' : 'false');
      $$('.js-cp-grp').forEach(function (c) {
        press(c, c.getAttribute('data-grp') === st.grp);
      });
    }

    $('.js-cp-all').addEventListener('click', function () {
      st.all = !st.all;
      render();
    });
    $('.js-cp-diff').addEventListener('click', function () {
      st.diff = !st.diff;
      render();
    });
    $$('.js-cp-grp').forEach(function (c) {
      c.addEventListener('click', function () {
        st.grp = c.getAttribute('data-grp');
        render();
      });
    });
    groups.forEach(function (g) {
      $('.js-cp-open', g).addEventListener('click', function () {
        var name = g.getAttribute('data-grp');
        st.closed[name] = !st.closed[name];
        render();
      });
    });
    $$('.js-cp-pick', table).forEach(function (b) {
      b.addEventListener('click', function () {
        table.setAttribute('data-sel', b.getAttribute('data-i'));
        $$('.js-cp-pick', table).forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
      });
    });
    render();
  }

  function initFees() {
    var reveal = $('.js-fe-reveal');
    if (!reveal) {
      return;
    }
    var car = 1;
    var shown = 0;
    var timer = null;
    var HIDDEN = [3, 4, 5];

    function dealer(price) {
      var tax = Math.round(price * 0.095);
      return [price * 1.03, 1495, 699, 895, price * 0.04, 649, tax * 1.07];
    }

    function render() {
      var btn = $$('.js-fe-car')[car];
      var price = parseInt(btn.getAttribute('data-price'), 10);
      var tax = Math.round(price * 0.095);
      var avT = price + 85 + tax;
      var D = dealer(price);
      var lines = $$('.fdl__ln');
      var dlT = 0;
      var full = 0;
      var hiddenSum = 0;
      var allOpen = shown >= HIDDEN.length;
      var bars = '';
      var i;

      D.forEach(function (v, k) {
        var hid = HIDDEN.indexOf(k);
        var vis = hid < 0 || hid < shown;
        full += v;
        if (hid >= 0) {
          hiddenSum += v;
        }
        if (vis) {
          dlT += v;
        }
        lines[k].classList.toggle('is-hidden', !vis);
        $('.js-fe-dl', lines[k]).textContent = vis ? usd(v) : '$ ? ? ?';
      });
      var diff = Math.max(0, dlT - avT);

      $$('.js-fe-car').forEach(function (b, k) {
        b.classList.toggle('is-on', k === car);
        b.setAttribute('aria-pressed', k === car ? 'true' : 'false');
      });
      setText('.js-fe-inv', String(4000 + car * 317));
      setText('.js-fe-avprice', usd(price));
      setText('.js-fe-avtax', usd(tax));
      setText('.js-fe-avtotal', usd(avT));
      setText('.js-fe-dltotal', usd(dlT));
      setText('.js-fe-note', allOpen ? '+ ' + usd(hiddenSum) + ' at signing' : 'Before the fine print');
      setText('.js-fe-shown', allOpen ? '7 lines · 3 hidden' : shown + ' / 3 revealed');
      setText('.js-fe-save', usd(diff));
      setText('.js-fe-pct', Math.round(diff / Math.max(1, dlT) * 100) + '%');
      $('.js-fe-gauge').style.transform = 'rotate(' + (-225 + Math.min(1, diff / Math.max(1, full - avT)) * 180) + 'deg)';
      var buys = [Math.max(0, Math.round(diff / 2400)) + ' yr', String(Math.round(diff / 70)), Math.round(diff / 89) + ' mo'];
      $$('.js-fe-buy').forEach(function (el, k) {
        el.textContent = buys[k];
      });
      setText('.js-fe-revtxt', allOpen ? 'Hide fine print' : 'Reveal fine print');
      reveal.setAttribute('aria-pressed', allOpen ? 'true' : 'false');
      for (i = 0; i < 44; i++) {
        bars += '<span class="fbar' + (i % 2 ? ' fbar--gap' : '') + ' fbar--w' + (((i * 7 + car * 3) % 3) + 1) + '"></span>';
      }
      $('.js-fe-bars').innerHTML = bars;
    }

    $$('.js-fe-car').forEach(function (b, k) {
      b.addEventListener('click', function () {
        car = k;
        render();
      });
    });
    // the fine print comes out one line every 450 ms
    reveal.addEventListener('click', function () {
      window.clearInterval(timer);
      if (shown >= HIDDEN.length) {
        shown = 0;
        render();
        return;
      }
      timer = window.setInterval(function () {
        shown++;
        render();
        if (shown >= HIDDEN.length) {
          window.clearInterval(timer);
        }
      }, 450);
    });
    render();
  }

  function initAddons() {
    var cells = $$('.js-ad');
    if (!cells.length) {
      return;
    }
    var q = {};
    cells.forEach(function (c, i) {
      q[i] = c.classList.contains('is-on') ? parseInt($('.js-ad-qty', c) ? $('.js-ad-qty', c).textContent : '1', 10) : 0;
    });

    function render() {
      var picked = [];
      var sub = 0;
      cells.forEach(function (c, i) {
        var n = q[i];
        var on = n > 0;
        var hasQty = c.getAttribute('data-qty') === '1';
        var step = $('.adn__step', c);
        c.classList.toggle('is-on', on);
        $('.js-ad-hit', c).setAttribute('aria-pressed', on ? 'true' : 'false');
        if (step) {
          step.hidden = !on;
          $('.js-ad-qty', c).textContent = String(Math.max(n, 1));
        }
        $('.adn__plus', c).hidden = on && hasQty;
        if (on) {
          picked.push([c.getAttribute('data-name'), n, parseInt(c.getAttribute('data-price'), 10)]);
          sub += n * parseInt(c.getAttribute('data-price'), 10);
        }
      });
      var bundle = picked.length >= 3;
      var disc = bundle ? sub * 0.15 : 0;
      var html = picked.map(function (p) {
        return '<li><span>' + (p[1] > 1 ? p[1] + '× ' : '') + p[0] + '</span><span>' + usd(p[2] * p[1]) + '</span></li>';
      }).join('');
      if (bundle) {
        html += '<li class="is-disc"><span>Bundle −15%</span><span>−' + usd(disc) + '</span></li>';
      }
      $('.js-ad-lines').innerHTML = html;
      $('.js-ad-empty').hidden = picked.length > 0;
      setText('.js-ad-count', String(picked.length));
      setText('.js-ad-ghost', String(picked.length));
      setText('.js-ad-total', usd(sub - disc));
      var old = $('.js-ad-old');
      old.textContent = usd(sub);
      old.classList.toggle('is-on', bundle);
      var bt = $('.js-ad-bundle');
      bt.textContent = bundle ? 'Bundle applied · −15% ✓' : 'Add ' + Math.max(0, 3 - picked.length) + ' more · save 15%';
      bt.classList.toggle('is-ok', bundle);
      $('.adn__segs').classList.toggle('is-ok', bundle);
      $$('.adn__seg').forEach(function (s, k) {
        s.classList.toggle('is-on', k < picked.length);
      });
    }

    cells.forEach(function (c, i) {
      $('.js-ad-hit', c).addEventListener('click', function () {
        q[i] = q[i] ? 0 : 1;
        render();
      });
      var inc = $('.js-ad-inc', c);
      var dec = $('.js-ad-dec', c);
      if (inc) {
        inc.addEventListener('click', function () {
          q[i] = Math.min(9, q[i] + 1);
          render();
        });
        dec.addEventListener('click', function () {
          q[i] = Math.max(0, q[i] - 1);
          render();
        });
      }
    });
    render();
  }

  function initFlipFaq() {
    var tiles = $$('.js-pft');
    if (!tiles.length) {
      return;
    }
    var flip = {};
    var seen = {};
    tiles.forEach(function (t, i) {
      flip[i] = t.classList.contains('is-flip');
      seen[i] = t.classList.contains('is-seen');
    });

    function render() {
      var read = 0;
      var all = true;
      tiles.forEach(function (t, i) {
        t.classList.toggle('is-flip', !!flip[i]);
        t.classList.toggle('is-seen', !!seen[i]);
        $('.js-pf-hit', t).setAttribute('aria-pressed', flip[i] ? 'true' : 'false');
        $('.js-pf-lbl', t).textContent = seen[i] ? 'Read' : 'Tap to flip';
        read += seen[i] ? 1 : 0;
        all = all && !!flip[i];
      });
      setText('.js-pf-read', String(read));
      $$('.pfq__seg').forEach(function (s, i) {
        s.classList.toggle('is-on', !!seen[i]);
      });
      setText('.js-pf-all', all ? 'Reset' : 'Flip all');
    }

    function toggle(i) {
      flip[i] = !flip[i];
      seen[i] = true;
      render();
    }

    function go(d) {
      var cur = 0;
      tiles.forEach(function (t, i) {
        if (flip[i]) {
          cur = i;
        }
      });
      var n = (cur + d + tiles.length) % tiles.length;
      flip = {};
      flip[n] = true;
      seen[n] = true;
      render();
    }

    tiles.forEach(function (t, i) {
      t.addEventListener('click', function (e) {
        if (!e.target.closest('a')) {
          toggle(i);
        }
      });
      $('.js-pf-hit', t).addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(i);
        }
      });
    });
    $('.js-pf-prev').addEventListener('click', function () {
      go(-1);
    });
    $('.js-pf-next').addEventListener('click', function () {
      go(1);
    });
    $('.js-pf-all').addEventListener('click', function () {
      var all = tiles.every(function (t, i) {
        return flip[i];
      });
      tiles.forEach(function (t, i) {
        flip[i] = !all;
        if (!all) {
          seen[i] = true;
        }
      });
      render();
    });
    render();
  }

  /* 17. Help centre --------------------------------------------------- */
  // One state for the whole page: the search, the open topic and question,
  // votes and what has been read. The questions themselves live in the markup.
  function esc(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function marked(text, lq) {
    var i = lq ? text.toLowerCase().indexOf(lq) : -1;
    if (i < 0) {
      return esc(text);
    }
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + lq.length)) + '</mark>' + esc(text.slice(i + lq.length));
  }

  function initHelp() {
    var input = $('.js-hf-q');
    if (!input) {
      return;
    }
    var rows = $$('.js-hf-row');
    var names = $$('.hrail__name').map(function (n) {
      return n.textContent;
    });
    var icons = $$('.js-hf-tile .htile__ico').map(function (n) {
      return n.innerHTML;
    });
    var all = rows.map(function (r) {
      return {
        id: r.getAttribute('data-id'),
        t: parseInt(r.getAttribute('data-t'), 10),
        q: $('.js-hf-qtext', r).textContent,
        a: $('.hrow__a', r).textContent,
        row: r
      };
    });
    var byId = {};
    all.forEach(function (x) {
      byId[x.id] = x;
    });
    var st = { q: '', topic: 0, open: '0-0', votes: {}, read: { '0-0': true }, exp: false };

    function lq() {
      return st.q.trim().toLowerCase();
    }

    function hits() {
      var w = lq();
      return w ? all.filter(function (x) {
        return (x.q + ' ' + x.a + ' ' + names[x.t]).toLowerCase().indexOf(w) >= 0;
      }) : [];
    }

    function setOpen(id) {
      st.open = id;
      if (id) {
        st.read[id] = true;
      }
    }

    function goTo(x) {
      st.topic = x.t;
      st.q = '';
      input.value = '';
      setOpen(x.id);
      render();
    }

    function voteUi(btns, id) {
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', st.votes[id] === b.getAttribute('data-v') ? 'true' : 'false');
      });
    }

    function voteText(id) {
      var v = st.votes[id];
      return v ? (v === 'y' ? 'Thanks — glad it helped' : 'Thanks — we’ll improve it') : 'Was this helpful?';
    }

    function render() {
      var w = lq();
      var h = hits();
      var field = $('.js-hf-field');
      var searching = !!w;

      // 01 · search box, results, popular chips, tiles, answer card
      field.classList.toggle('is-typing', searching);
      setText('.js-hf-hits', searching ? h.length + ' found' : '');
      setText('.js-hf-hits2', h.length + ' found');
      setText('.js-hf-term', st.q.trim());
      $('.js-hf-drop').hidden = !searching;
      $('.js-hf-go').setAttribute('aria-label', searching ? 'Clear the search' : 'Search');
      $('.js-hf-none').hidden = !(searching && !h.length);
      $('.js-hf-results').innerHTML = h.slice(0, 5).map(function (x) {
        return '<li><button class="hsr__rb js-hf-res" type="button" data-id="' + x.id + '"><span class="hsr__ri">' + icons[x.t] +
          '</span><span class="hsr__rq">' + marked(x.q, w) + '</span><span class="hsr__rt">' + esc(names[x.t]) + ' →</span></button></li>';
      }).join('');
      var top = h[0] || all[0];
      setText('.js-hf-topq', top.q);
      setText('.js-hf-topa', top.a);
      $('.js-hf-topgo').setAttribute('data-id', top.id);
      $$('.js-hf-try').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-q') === w ? 'true' : 'false');
      });
      $$('.js-hf-tile').forEach(function (t, i) {
        var on = i === st.topic && !searching;
        t.classList.toggle('is-on', on);
        $('.js-hf-topic', t).setAttribute('aria-pressed', on ? 'true' : 'false');
        $$('.js-hf-open', t).forEach(function (b) {
          b.classList.toggle('is-cur', b.getAttribute('data-id') === st.open);
        });
      });
      var ans = $('.js-hf-ans');
      var ox = byId[st.open];
      ans.hidden = !ox || searching;
      if (ox) {
        setText('.js-hf-anstopic', names[ox.t]);
        setText('.js-hf-anspos', (all.indexOf(ox) + 1) + ' of ' + all.length);
        setText('.js-hf-ansq', ox.q);
        setText('.js-hf-ansa', ox.a);
        $('.hans__vt').textContent = voteText(ox.id);
        voteUi($$('.js-hf-vote', ans), ox.id);
      }

      // 02 · progress ring, topic rail, accordion
      var readN = Object.keys(st.read).length;
      var done = names.filter(function (n, ti) {
        return all.filter(function (x) {
          return x.t === ti;
        }).every(function (x) {
          return st.read[x.id];
        });
      }).length;
      setText('.js-hf-readn', String(readN));
      setText('.js-hf-topicsdone', done + ' of 6 topics done');
      $('.js-hf-ring').style.strokeDasharray = (2 * Math.PI * 32 * readN / all.length).toFixed(1) + ' 999';
      var exp = $('.js-hf-expand');
      exp.textContent = st.exp ? 'Collapse all' : 'Expand all';
      exp.setAttribute('aria-pressed', st.exp ? 'true' : 'false');
      $$('.hrail__it').forEach(function (b, ti) {
        var on = ti === st.topic && !searching;
        var n = 0;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        $$('.hrail__dot', b).forEach(function (d, k) {
          var r = !!st.read[ti + '-' + k];
          d.classList.toggle('is-read', r);
          n += r ? 1 : 0;
        });
        $('.js-hf-railtxt', b).textContent = n ? n + ' / 5 read' : '5 questions';
      });
      var src = searching ? h : all.filter(function (x) {
        return x.t === st.topic;
      });
      $('.hrows').classList.toggle('is-search', searching);
      all.forEach(function (x) {
        var k = src.indexOf(x);
        var r = x.row;
        var open = k >= 0 && (st.exp || x.id === st.open);
        r.hidden = k < 0;
        if (k < 0) {
          r.classList.remove('is-open');
          $('.hrow__panel', r).hidden = true;
          return;
        }
        $('.js-hf-n', r).textContent = (k < 9 ? '0' : '') + (k + 1);
        $('.js-hf-qtext', r).innerHTML = marked(x.q, w);
        r.classList.toggle('is-open', open);
        r.classList.toggle('is-read', !!st.read[x.id]);
        $('.js-hf-toggle', r).setAttribute('aria-expanded', open ? 'true' : 'false');
        $('.hrow__panel', r).hidden = !open;
        $('.js-hf-votetxt', r).textContent = voteText(x.id);
        voteUi($$('.js-hf-vote', r), x.id);
      });
      setText('.js-hf-listtitle', searching ? h.length + ' results for “' + st.q.trim() + '”' : names[st.topic]);
      setText('.js-hf-listsub', searching ? 'Across all topics' : src.length + ' questions');
      $('.js-hf-listicon').innerHTML = searching ? '<svg class="ico i26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5"/></svg>' : icons[st.topic];
      $('.js-hf-nohits').hidden = !(searching && !h.length);

      // 03 · the card of the open question lifts
      renderPopSel();
    }

    function renderPopSel() {
      var cards = $$('.js-hf-pop');
      var sel = null;
      cards.forEach(function (c) {
        var on = c.getAttribute('data-id') === st.open;
        c.classList.toggle('is-sel', on);
        $('.js-hf-cta', c).textContent = on ? 'Open in 02' : 'Read answer';
        if (on) {
          sel = c;
        }
      });
      sel = sel || $('.js-hf-pop');
      setText('.js-hf-selq', $('.hpc__q', sel).textContent);
      setText('.js-hf-sels', $('.hpc__short', sel).textContent);
      setText('.js-hf-selt', $('.hpc__topic', sel).textContent);
    }

    input.addEventListener('input', function () {
      st.q = input.value;
      render();
    });
    $('.js-hf-go').addEventListener('click', function () {
      if (st.q) {
        st.q = '';
        input.value = '';
        render();
      }
      input.focus();
    });
    // "/" jumps to the search, as the key hint says
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        input.focus();
      }
    });
    $$('.js-hf-try').forEach(function (b) {
      b.addEventListener('click', function () {
        var wd = b.getAttribute('data-q');
        st.q = lq() === wd ? '' : wd;
        input.value = st.q;
        render();
      });
    });
    $('.js-hf-results').addEventListener('click', function (e) {
      var b = e.target.closest('.js-hf-res');
      if (b) {
        goTo(byId[b.getAttribute('data-id')]);
      }
    });
    $('.js-hf-topgo').addEventListener('click', function () {
      goTo(byId[this.getAttribute('data-id')]);
    });
    $$('.js-hf-topic').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = parseInt(b.getAttribute('data-t'), 10);
        st.topic = t;
        st.q = '';
        st.exp = false;
        input.value = '';
        setOpen(t + '-0');
        render();
      });
    });
    $$('.js-hf-open').forEach(function (b) {
      b.addEventListener('click', function () {
        setOpen(b.getAttribute('data-id'));
        render();
      });
    });
    $('.js-hf-next').addEventListener('click', function () {
      var ox = byId[st.open] || all[0];
      var nx = all[(all.indexOf(ox) + 1) % all.length];
      st.topic = nx.t;
      setOpen(nx.id);
      render();
    });
    $$('.js-hf-ans .js-hf-vote').forEach(function (b) {
      b.addEventListener('click', function () {
        st.votes[st.open] = b.getAttribute('data-v');
        render();
      });
    });
    $('.js-hf-expand').addEventListener('click', function () {
      st.exp = !st.exp;
      render();
    });

    function visibleList() {
      return all.filter(function (x) {
        return !x.row.hidden;
      });
    }

    all.forEach(function (x) {
      var r = x.row;
      $('.js-hf-toggle', r).addEventListener('click', function () {
        if (st.exp) {
          st.exp = false;
          setOpen(x.id);
        } else if (st.open === x.id) {
          st.open = '';
        } else {
          setOpen(x.id);
        }
        render();
      });
      $$('.js-hf-vote', r).forEach(function (b) {
        b.addEventListener('click', function () {
          st.votes[x.id] = b.getAttribute('data-v');
          render();
        });
      });
      $('.js-hf-copy', r).addEventListener('click', function () {
        var btn = this;
        var url = window.location.href.split('#')[0] + '#hq-' + x.id;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).catch(function () {});
        }
        btn.textContent = 'Link copied ✓';
        btn.classList.add('is-done');
        window.setTimeout(function () {
          btn.textContent = 'Copy link';
          btn.classList.remove('is-done');
        }, 1600);
      });
      $('.js-hf-prev', r).addEventListener('click', function () {
        var list = visibleList();
        setOpen(list[(list.indexOf(x) - 1 + list.length) % list.length].id);
        st.exp = false;
        render();
      });
      $('.js-hf-nextq', r).addEventListener('click', function () {
        var list = visibleList();
        setOpen(list[(list.indexOf(x) + 1) % list.length].id);
        st.exp = false;
        render();
      });
    });

    // 03 · popular: the period re-ranks the four cards
    var POP_VIEWS = [[4200, 3800, 3100, 2600], [15800, 14900, 12100, 11200], [182000, 151000, 163000, 98000]];
    var POP_SPARK = [[9, 11, 10, 14, 13, 17, 20], [12, 12, 14, 13, 15, 15, 17], [10, 12, 11, 12, 13, 12, 14], [7, 8, 9, 9, 11, 12, 13]];
    var grid = $('.js-hf-popgrid');
    var cards = $$('.js-hf-pop', grid);

    function kk(v) {
      return v >= 100000 ? Math.round(v / 1000) + 'k' : (v / 1000).toFixed(1) + 'k';
    }

    function rank(vs) {
      return [0, 1, 2, 3].sort(function (a, b) {
        return vs[b] - vs[a];
      });
    }

    function setPeriod(per) {
      var vs = POP_VIEWS[per];
      var ord = rank(vs);
      var prevOrd = rank(POP_VIEWS[per === 0 ? 1 : per - 1]);
      ord.forEach(function (i, r) {
        var c = cards.filter(function (x) {
          return parseInt(x.getAttribute('data-i'), 10) === i;
        })[0];
        var mv = prevOrd.indexOf(i) - r;
        var sp = POP_SPARK[i].map(function (y, j) {
          return y * (1 + per * 0.2 * j / 6);
        });
        var mn = Math.min.apply(null, sp);
        var mx = Math.max.apply(null, sp);
        var pts = sp.map(function (y, j) {
          return [j * 21 + 2, +(36 - (y - mn) / ((mx - mn) || 1) * 30).toFixed(1)];
        });
        var line = pts.map(function (p) {
          return p.join(',');
        }).join(' ');
        var last = pts[pts.length - 1];
        var move = $('.js-hf-move', c);
        grid.appendChild(c);
        c.classList.toggle('is-hot', r === 0);
        $('.js-hf-popn', c).textContent = '0' + (r + 1);
        $('.js-hf-views', c).textContent = kk(vs[i]);
        move.textContent = mv > 0 ? '▲ ' + mv : (mv < 0 ? '▼ ' + (-mv) : '— same');
        move.classList.toggle('is-up', mv > 0);
        move.classList.toggle('is-down', mv < 0);
        $('.js-hf-line', c).setAttribute('points', line);
        $('.js-hf-area', c).setAttribute('points', '2,40 ' + line + ' ' + last[0] + ',40');
        $('.js-hf-pt', c).setAttribute('cx', last[0]);
        $('.js-hf-pt', c).setAttribute('cy', last[1]);
      });
      setText('.js-hf-total', kk(vs.reduce(function (a, b) {
        return a + b;
      }, 0)));
      setText('.js-hf-pername', ['this week', 'this month', 'all time'][per]);
      $$('.js-hf-per').forEach(function (b) {
        var on = parseInt(b.getAttribute('data-p'), 10) === per;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      cards = $$('.js-hf-pop', grid);
      renderPopSel();
    }

    $$('.js-hf-per').forEach(function (b) {
      b.addEventListener('click', function () {
        setPeriod(parseInt(b.getAttribute('data-p'), 10));
      });
    });
    cards.forEach(function (c) {
      $('.js-hf-popgo', c).addEventListener('click', function () {
        st.topic = parseInt(c.getAttribute('data-t'), 10);
        st.q = '';
        st.exp = false;
        input.value = '';
        setOpen(c.getAttribute('data-id'));
        render();
        var target = $('#questions');
        window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 20, behavior: 'smooth' });
      });
    });

    // a shared link to a question opens it
    var m = window.location.hash.match(/^#hq-(\d-\d)$/);
    if (m && byId[m[1]]) {
      st.topic = byId[m[1]].t;
      setOpen(m[1]);
    }
    render();
  }

  // 04 · contact: LA opening hours, specialists, channels, call-back
  function initHelpContact() {
    var band = $('.hct__band');
    if (!band) {
      return;
    }
    var OPEN = 8;
    var CLOSE = 22;

    function tick() {
      var now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
      var hh = now.getHours();
      var mm = now.getMinutes();
      var open = hh >= OPEN && hh < CLOSE;
      var st = $('.js-hf-openst');
      setText('.js-hf-time', (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm);
      $('.js-hf-mark').style.left = ((hh + mm / 60) / 24 * 100).toFixed(1) + '%';
      st.textContent = open ? 'Open · until ' + CLOSE + ':00' : 'Closed · opens ' + OPEN + ':00';
      st.classList.toggle('is-closed', !open);
    }
    tick();
    window.setInterval(tick, 60000);

    var agents = $$('.js-hf-agent', band);
    agents.forEach(function (a) {
      a.addEventListener('click', function () {
        agents.forEach(function (x) {
          var on = x === a;
          var s = $('.hag__s', x);
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
          s.textContent = on ? 'Selected' : s.getAttribute('data-st');
        });
        setText('.js-hf-agentline', 'You’ll talk to ' + $('.hag__n', a).textContent);
        setText('.js-hf-chatcta', 'Chat with ' + a.getAttribute('data-name'));
      });
    });

    var chans = $$('.js-hf-ch', band);
    chans.forEach(function (c) {
      $('.js-hf-chpick', c).addEventListener('click', function () {
        chans.forEach(function (x) {
          x.classList.toggle('is-on', x === c);
          $('.js-hf-chpick', x).setAttribute('aria-pressed', x === c ? 'true' : 'false');
        });
      });
    });

    var form = $('.js-hf-cb', band);
    var phone = $('.js-hf-phone', form);
    var lbl = $('.js-hf-cblbl', form);
    var go = $('.js-hf-cbgo', form);

    function reset() {
      lbl.textContent = 'Call me back';
      lbl.classList.remove('is-err', 'is-ok');
      go.textContent = 'Call me';
      go.classList.remove('is-done');
    }
    phone.addEventListener('input', reset);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = phone.value.replace(/\D/g, '').length >= 10;
      lbl.textContent = ok ? 'Calling you in 5 min ✓' : 'Enter 10 digits';
      lbl.classList.toggle('is-ok', ok);
      lbl.classList.toggle('is-err', !ok);
      go.textContent = ok ? 'Booked ✓' : 'Call me';
      go.classList.toggle('is-done', ok);
    });
  }

  // 05 · guides: a topic swaps the three guides; ♡ saves one for later
  function initHelpGuides() {
    var guides = $$('.js-hf-guide');
    if (!guides.length) {
      return;
    }
    var filters = $$('.js-hf-gf');

    function show(cat) {
      var n = 0;
      guides.forEach(function (g) {
        var ok = (!cat || g.getAttribute('data-cat') === cat) && n < 3;
        g.hidden = !ok;
        g.classList.toggle('is-first', ok && n === 0);
        if (ok) {
          n++;
          $('.js-hf-gn', g).textContent = '0' + n;
          $('.js-hf-gn2', g).textContent = '0' + n;
        }
      });
    }

    filters.forEach(function (f) {
      f.addEventListener('click', function () {
        filters.forEach(function (x) {
          press(x, x === f);
        });
        show(f.getAttribute('data-cat'));
      });
    });
    guides.forEach(function (g) {
      $('.js-hf-save', g).addEventListener('click', function () {
        var on = this.getAttribute('aria-pressed') !== 'true';
        this.setAttribute('aria-pressed', on ? 'true' : 'false');
        var saved = $$('.js-hf-save[aria-pressed="true"]').length;
        setText('.js-hf-saved', saved ? saved + ' saved for later' : 'Save any guide ♡');
      });
    });
  }

  /* 18. Contact page ------------------------------------------------- */
  // Showroom and phone hours in Los Angeles time; Monday first, Sunday by appointment.
  var CN_HOURS = [[9, 20], [9, 20], [9, 20], [9, 20], [9, 20], [10, 18], [0, 0]];
  var CN_TOPICS = ['Buying', 'Selling', 'Financing', 'Service', 'Other'];

  function laNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  }

  function initContactHours() {
    var rows = $$('.js-cn-hour');
    if (!rows.length) {
      return;
    }

    function tick() {
      var now = laNow();
      var hh = now.getHours();
      var mm = now.getMinutes();
      var wd = (now.getDay() + 6) % 7;
      var day = CN_HOURS[wd];
      var open = day[1] > 0 && hh >= day[0] && hh < day[1];
      var txt = open ? 'Open now · until ' + day[1] + ':00' :
        (day[1] ? 'Closed · opens ' + day[0] + ':00' : 'Closed today · by appointment');
      setText('.js-cn-time', (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm);
      setText('.js-cn-opentxt', txt);
      setText('.js-cn-phonetxt', open ? 'Open now · no wait' : 'Closed · leave a call-back');
      setText('.js-cn-pinstate', open ? '· open' : '· closed');
      $$('.js-cn-open, .js-cn-phonest').forEach(function (el) {
        el.classList.toggle('is-closed', !open);
      });
      $$('.js-cn-mark').forEach(function (el) {
        el.style.left = ((hh + mm / 60) / 24 * 100).toFixed(1) + '%';
      });
      rows.forEach(function (r, i) {
        r.classList.toggle('is-today', i === wd);
        r.classList.toggle('is-open', i === wd && open);
      });
    }
    tick();
    window.setInterval(tick, 60000);
    // the live map draws its own pin: give it the same open / closed word
    document.addEventListener('avava:map', tick);
  }

  // Call me back: ten digits book the call, fewer ask for the rest
  function initContactCallback() {
    var form = $('.js-cn-cb');
    if (!form) {
      return;
    }
    var input = $('.js-cn-cbin', form);
    var go = $('.js-cn-cbgo', form);
    var note = $('.js-cn-cbnote', form);

    input.addEventListener('input', function () {
      form.classList.remove('is-err', 'is-ok');
      go.textContent = 'Call me';
      note.textContent = 'Free · US numbers';
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = input.value.replace(/\D/g, '').length >= 10;
      form.classList.toggle('is-ok', ok);
      form.classList.toggle('is-err', !ok);
      go.textContent = ok ? 'Booked ✓' : 'Call me';
      note.textContent = ok ? 'We’ll call you within 5 minutes' : 'Enter a 10-digit number';
    });
  }

  // Message form: the car field only for buying and selling; checks start after the first send
  function initContactForm() {
    var form = $('.js-cn-form');
    if (!form) {
      return;
    }
    var done = $('.js-cn-done');
    var carWrap = $('.js-cn-carwrap', form);
    var msg = form.elements.message;
    var tried = false;

    function topic() {
      var t = $('.js-cn-topic:checked', form);
      return t ? parseInt(t.value, 10) : 0;
    }

    function syncTopic() {
      var car = topic() < 2;
      carWrap.hidden = !car;
      setText('.js-cn-msgn', car ? '06' : '05');
    }

    function errors() {
      return {
        'cn-name': form.elements.name.value.trim().length < 2 ? 'Required' : '',
        'cn-email': /.+@.+\..+/.test(form.elements.email.value) ? '' : 'Check email',
        'cn-msg': msg.value.trim().length < 10 ? 'Min 10 characters ·' : ''
      };
    }

    function check() {
      var errs = errors();
      Object.keys(errs).forEach(function (id) {
        var bad = tried && !!errs[id];
        var field = document.getElementById(id);
        field.classList.toggle('is-bad', bad);
        field.setAttribute('aria-invalid', bad ? 'true' : 'false');
        $$('.js-cn-err[data-for="' + id + '"]', form).forEach(function (e) {
          e.textContent = bad ? errs[id] : '';
        });
      });
      $('.js-cn-cnt', form).classList.toggle('is-bad', tried && !!errs['cn-msg']);
      return !errs['cn-name'] && !errs['cn-email'] && !errs['cn-msg'];
    }

    $$('.js-cn-topic', form).forEach(function (r) {
      r.addEventListener('change', syncTopic);
    });
    msg.addEventListener('input', function () {
      setText('.js-cn-len', String(msg.value.length));
    });
    form.addEventListener('input', check);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      if (!check()) {
        var bad = $('.is-bad', form);
        if (bad) {
          bad.focus();
        }
        return;
      }
      setText('.js-cn-first', form.elements.name.value.trim().split(' ')[0] || 'there');
      setText('.js-cn-topicname', CN_TOPICS[topic()].toLowerCase());
      setText('.js-cn-mail', form.elements.email.value.trim());
      setText('.js-cn-ref', 'AV-' + (4000 + Math.floor(Math.random() * 5999)));
      form.hidden = true;
      done.hidden = false;
      $('.js-cn-step0').classList.add('is-on');
      done.focus();
    });
    $('.js-cn-again').addEventListener('click', function () {
      tried = false;
      msg.value = '';
      setText('.js-cn-len', '0');
      check();
      done.hidden = true;
      form.hidden = false;
      $('.js-cn-step0').classList.remove('is-on');
      form.elements.name.focus();
    });

    // departments: "Message ↑" picks the topic and brings the form into view
    $$('.js-cn-pick').forEach(function (b) {
      b.addEventListener('click', function () {
        var r = $('.js-cn-topic[value="' + b.getAttribute('data-topic') + '"]', form);
        done.hidden = true;
        form.hidden = false;
        $('.js-cn-step0').classList.remove('is-on');
        r.checked = true;
        syncTopic();
        var top = $('#message').getBoundingClientRect().top + window.pageYOffset - 20;
        window.scrollTo({ top: top, behavior: 'smooth' });
        window.setTimeout(function () {
          r.focus({ preventScroll: true });
        }, 400);
      });
    });

    syncTopic();
  }

  /* 19. Terms page --------------------------------------------------- */
  // Twelve clauses live in the markup. The active clause is the one last jumped to;
  // "read" counts the clauses opened or jumped to (the first one is read on arrival).
  function initTerms() {
    var clauses = $$('.js-tm-clause');
    if (!clauses.length) {
      return;
    }
    var rows = $$('.js-tm-toc');
    var nav = $('.js-tm-tocnav');
    var navBtn = $('.js-tm-tocbtn');
    var input = $('.js-tm-q');
    var seen = [0];
    var cur = 0;
    var q = '';

    // the original text of every searchable piece, so highlights can be undone
    var texts = clauses.map(function (c) {
      return $$('.js-tm-text', c).map(function (el) {
        return { el: el, text: el.textContent };
      });
    });

    function hay(i) {
      return ($('.tmt__t', clauses[i]).textContent + ' ' + texts[i].map(function (t) {
        return t.text;
      }).join(' ')).toLowerCase();
    }

    function paint() {
      var hits = 0;
      clauses.forEach(function (c, i) {
        var on = i === cur;
        var match = !q || hay(i).indexOf(q) > -1;
        var tag = $('.js-tm-tag', rows[i]);
        if (match) {
          hits++;
        }
        c.classList.toggle('is-on', on);
        c.classList.toggle('is-dim', !match);
        rows[i].classList.toggle('is-on', on);
        rows[i].classList.toggle('is-dim', !match);
        if (on) {
          rows[i].setAttribute('aria-current', 'true');
        } else {
          rows[i].removeAttribute('aria-current');
        }
        tag.textContent = q ? (match ? 'match' : '') : (seen.indexOf(i) > -1 ? '✓' : '');
        tag.classList.toggle('is-match', !!q);
      });
      var pct = Math.round(seen.length / clauses.length * 100);
      setText('.js-tm-cur', String(cur + 1));
      setText('.js-tm-pct', pct + '%');
      $('.js-tm-fill').style.width = pct + '%';
      setText('.js-tm-toccur', $('.tmt__rn', rows[cur]).textContent + ' · ' + $('.tmt__rt', rows[cur]).textContent);
      setText('.js-tm-hits', q ? hits + (hits === 1 ? ' clause' : ' clauses') : '');
      $('.js-tm-none').hidden = !q || hits > 0;
    }

    // wraps the first match in each piece of text in <mark>, built from text nodes only
    function highlight() {
      texts.forEach(function (list) {
        list.forEach(function (t) {
          var at = q ? t.text.toLowerCase().indexOf(q) : -1;
          t.el.textContent = '';
          if (at < 0) {
            t.el.textContent = t.text;
            return;
          }
          var mark = document.createElement('mark');
          mark.textContent = t.text.slice(at, at + q.length);
          t.el.appendChild(document.createTextNode(t.text.slice(0, at)));
          t.el.appendChild(mark);
          t.el.appendChild(document.createTextNode(t.text.slice(at + q.length)));
        });
      });
    }

    function jump(i, smooth) {
      cur = i;
      if (seen.indexOf(i) < 0) {
        seen.push(i);
      }
      paint();
      if (window.history && history.replaceState) {
        history.replaceState(null, '', '#' + clauses[i].id);
      }
      var top = clauses[i].getBoundingClientRect().top + window.pageYOffset - 30;
      window.scrollTo({ top: top, behavior: smooth === false ? 'auto' : 'smooth' });
    }

    $$('.js-tm-jump, .js-tm-toc').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          navBtn.setAttribute('aria-expanded', 'false');
        }
        jump(parseInt(a.getAttribute('data-clause'), 10));
      });
    });

    navBtn.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    input.addEventListener('input', function () {
      q = input.value.trim().toLowerCase();
      setText('.js-tm-qtxt', input.value.trim());
      highlight();
      paint();
    });

    $$('.js-tm-copy').forEach(function (b) {
      var label = b.textContent;
      var timer = null;
      b.addEventListener('click', function () {
        var url = location.href.split('#')[0] + '#clause-' + b.getAttribute('data-clause');
        function done() {
          b.textContent = 'Link copied ✓';
          b.classList.add('is-done');
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            b.textContent = label;
            b.classList.remove('is-done');
          }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, done);
        } else {
          done();
        }
      });
    });

    // 03 · a version: its dot grows, the accent line runs up to it
    var vers = $$('.js-tm-ver');
    vers.forEach(function (v, i) {
      v.addEventListener('click', function () {
        vers.forEach(function (x, k) {
          x.classList.toggle('is-on', k === i);
          x.classList.toggle('is-past', k <= i);
          x.setAttribute('aria-pressed', k === i ? 'true' : 'false');
        });
        $('.js-tm-verbar').style.width = (i / (vers.length - 1) * 100) + '%';
      });
    });

    $$('.js-tm-print').forEach(function (b) {
      b.addEventListener('click', function () {
        window.print();
      });
    });

    // a shared link (#clause-NN) opens on that clause
    var m = /^#clause-(\d\d)$/.exec(location.hash);
    if (m && clauses[parseInt(m[1], 10) - 1]) {
      jump(parseInt(m[1], 10) - 1, false);
    } else {
      paint();
    }
  }

  /* 20. Listing v1 --------------------------------------------------- */
  // Sample figures for a 98-car inventory (as in the handoff). The segment options and
  // their counts live in the markup; keep LS_* in step with _dev/build_listing.py.
  var LS_SUG = [['Porsche 911 GT3', 'Model', 6], ['Porsche Taycan', 'Model', 4], ['Porsche', 'Make', 14], ['Serpent Roadster 427', 'Model', 3],
    ['Lucid Air Sapphire', 'Model', 5], ['Lucid', 'Make', 5], ['Mercedes-AMG G 63', 'Model', 2], ['Ferrari Dino 246 GT', 'Model', 3],
    ['Lamborghini Huracán', 'Model', 4], ['Aston Martin DB11', 'Model', 4], ['Jaguar E-Type', 'Model', 3]];
  var LS_POP = [['Porsche 911', 'Model', 6], ['Electric under $1,500/mo', 'Search', 11], ['Serpent Roadster 427', 'Model', 3], ['Convertibles', 'Body', 11], ['Porsche', 'Make', 14]];
  var LS_CHIPS = [15, 44, 14, 29, 8];
  var LS_CONDS = [98, 22, 61, 15];
  var LS_AVG = [1850, 790, 1190, 1790, 3100];

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function initListing() {
    var pill = $('.js-ls-pill');
    if (!pill) {
      // Listing v4 has no search console: only the results and the request
      if ($('.js-ln-grid')) {
        initListingResults();
      }
      return;
    }
    var st = { cond: 0, kw: '', focus: false, open: '', vals: {}, chips: [], saved: false, act: -1 };
    var segs = $$('.js-ls-seg');
    var kw = $('.js-ls-kw');
    var drop = $('.js-ls-drop');
    var list = $('.js-ls-dl');
    var sheetBtn = $('.js-ls-filters');
    var shown = [];
    segs.forEach(function (g) {
      st.vals[g.getAttribute('data-key')] = 0;
    });

    function optsOf(g) {
      return $$('.js-ls-opt', g);
    }

    function optCount(o) {
      return parseInt($('.lsc__on', o).textContent, 10);
    }

    function count() {
      var q = st.kw.trim().toLowerCase();
      var n = 98;
      segs.forEach(function (g) {
        var v = st.vals[g.getAttribute('data-key')];
        if (v) {
          n = Math.min(n, optCount(optsOf(g)[v]));
        }
      });
      st.chips.forEach(function (i) {
        n = Math.max(1, Math.round(n * LS_CHIPS[i] / 98 * 1.6));
      });
      if (q) {
        var exact = LS_SUG.filter(function (s) { return s[0].toLowerCase() === q; })[0];
        if (exact) {
          n = Math.min(n, exact[2]);
        } else {
          var sum = LS_SUG.filter(function (s) { return s[0].toLowerCase().indexOf(q) > -1; })
            .slice(0, 5).reduce(function (a, s) { return a + s[2]; }, 0);
          n = Math.max(1, Math.min(n, sum || 0));
        }
      }
      if (pill.getAttribute('data-cond') === 'scope') {
        // Listing v3: a condition tab never shows more than its own total
        return st.cond ? Math.min(LS_CONDS[st.cond], Math.max(1, Math.round(n * LS_CONDS[st.cond] / 98))) : n;
      }
      return st.cond ? Math.max(1, Math.round(n * LS_CONDS[st.cond] / 98 * 1.3)) : n;
    }

    function exactKw() {
      var q = st.kw.trim().toLowerCase();
      return q && LS_SUG.some(function (s) { return s[0].toLowerCase() === q; });
    }

    function renderDrop() {
      var q = st.kw.trim().toLowerCase();
      shown = q ? LS_SUG.filter(function (s) { return s[0].toLowerCase().indexOf(q) > -1; }).slice(0, 5) : LS_POP;
      var open = st.focus && !st.open && !exactKw() && shown.length > 0;
      drop.hidden = !open;
      if (!open) {
        return;
      }
      $('.js-ls-dt').textContent = q ? shown.length + ' suggestions' : 'Popular right now';
      list.innerHTML = shown.map(function (s, i) {
        var t = esc(s[0]);
        var at = q ? s[0].toLowerCase().indexOf(q) : -1;
        if (at > -1) {
          t = esc(s[0].slice(0, at)) + '<mark>' + esc(s[0].slice(at, at + q.length)) + '</mark>' + esc(s[0].slice(at + q.length));
        }
        var ic = s[1] === 'Make' ? 'M' : s[1] === 'Body' ? 'B' : s[1] === 'Search' ? '↻' : '◇';
        return '<li><button class="lsc__sug' + (i === st.act ? ' is-act' : '') + '" type="button" data-i="' + i + '">' +
          '<span class="lsc__si' + (s[1] === 'Search' ? ' lsc__si--ok' : '') + '" aria-hidden="true">' + ic + '</span>' +
          '<span class="lsc__st"><span class="lsc__sn">' + t + '</span><span class="lsc__sk">' + s[1] + '</span></span>' +
          '<span class="lsc__sr"><span class="lsc__bar"><span data-w="' + Math.round(s[2] / 14 * 100) + '"></span></span><span class="lsc__sc">' + s[2] + ' cars</span></span></button></li>';
      }).join('');
      applyData(list);
    }

    function render() {
      var n = count();
      var active = [];
      pill.classList.toggle('is-focus', st.focus || !!st.open);
      $$('.js-ls-cond').forEach(function (b, i) {
        b.classList.toggle('is-on', i === st.cond);
        b.setAttribute('aria-pressed', i === st.cond ? 'true' : 'false');
      });
      var condBtn = $$('.js-ls-cond')[st.cond];
      if (st.cond) {
        active.push([condBtn.getAttribute('data-name') || condBtn.firstChild.textContent, function () { st.cond = 0; }]);
      }
      // Listing v3: the tab re-scopes the placeholder and the count label
      if (condBtn.hasAttribute('data-ph')) {
        kw.placeholder = condBtn.getAttribute('data-ph');
        setText('.js-ls-condname', condBtn.getAttribute('data-name').toLowerCase());
      }
      if (st.kw.trim()) {
        active.push(['“' + st.kw.trim() + '”', function () { st.kw = ''; kw.value = ''; }]);
      }
      var set = 0;
      segs.forEach(function (g) {
        var key = g.getAttribute('data-key');
        var v = st.vals[key];
        var open = st.open === key;
        var opts = optsOf(g);
        var btn = $('.js-ls-segbtn', g);
        g.classList.toggle('is-open', open);
        g.classList.toggle('is-set', v > 0);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        $('.js-ls-pick', g).hidden = !open;
        $('.js-ls-segval', g).textContent = $('.lsc__ot', opts[v]).textContent;
        var share = $('.js-ls-share', g);
        if (share) {
          share.style.width = Math.round(optCount(opts[v]) / 98 * 100) + '%';
          $('.js-ls-sharetxt', g).textContent = optCount(opts[v]) + ' of 98 cars';
        }
        opts.forEach(function (o, j) {
          o.classList.toggle('is-on', j === v);
          o.setAttribute('aria-pressed', j === v ? 'true' : 'false');
        });
        if (v) {
          set++;
          active.push([$('.lsc__ot', opts[v]).textContent, function () { st.vals[key] = 0; }]);
        }
      });
      $$('.js-ls-chip').forEach(function (c, i) {
        var on = st.chips.indexOf(i) > -1;
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) {
          active.push([c.childNodes[1].textContent, function () {
            st.chips = st.chips.filter(function (x) { return x !== i; });
          }]);
        }
      });
      $('.js-ls-clear').hidden = !st.kw;
      setText('.js-ls-count', String(n));
      setText('.js-ls-est', '≈ $' + (LS_AVG[st.vals.price] || 1850).toLocaleString('en-US') + '/mo avg');
      var fn = $('.js-ls-fn');
      fn.hidden = !set;
      fn.textContent = String(set);

      var box = $('.js-ls-active');
      var ul = $('.js-ls-acts');
      box.hidden = !active.length;
      ul.innerHTML = '';
      active.forEach(function (a) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.className = 'lsc__ac';
        b.type = 'button';
        b.setAttribute('aria-label', 'Remove filter ' + a[0]);
        b.appendChild(document.createTextNode(a[0]));
        var x = document.createElement('span');
        x.className = 'lsc__acx';
        x.setAttribute('aria-hidden', 'true');
        x.textContent = '×';
        b.appendChild(x);
        b.addEventListener('click', function () {
          a[1]();
          render();
        });
        li.appendChild(b);
        ul.appendChild(li);
      });
      renderDrop();
    }

    $$('.js-ls-cond').forEach(function (b, i) {
      b.addEventListener('click', function () {
        st.cond = i;
        render();
      });
    });

    kw.addEventListener('focus', function () {
      st.focus = true;
      st.open = '';
      st.act = -1;
      render();
    });
    kw.addEventListener('input', function () {
      st.kw = kw.value;
      st.open = '';
      st.act = -1;
      render();
    });
    kw.addEventListener('keydown', function (e) {
      if (drop.hidden) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        st.act = (st.act + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length;
        renderDrop();
      } else if (e.key === 'Enter' && st.act > -1) {
        e.preventDefault();
        pickSug(st.act);
      }
    });

    function pickSug(i) {
      var s = shown[i];
      if (s[1] === 'Body' || s[1] === 'Search') {
        st.kw = '';
        if (s[1] === 'Body') {
          st.vals.body = 4;
        } else {
          st.chips = [0, 1];
        }
      } else {
        st.kw = s[0];
      }
      kw.value = st.kw;
      st.focus = false;
      st.act = -1;
      render();
    }

    list.addEventListener('click', function (e) {
      var b = e.target.closest('.lsc__sug');
      if (b) {
        pickSug(parseInt(b.getAttribute('data-i'), 10));
      }
    });

    $('.js-ls-clear').addEventListener('click', function () {
      st.kw = '';
      kw.value = '';
      kw.focus();
      render();
    });

    segs.forEach(function (g) {
      var key = g.getAttribute('data-key');
      $('.js-ls-segbtn', g).addEventListener('click', function () {
        // a set segment clears on click (the × in its dot); otherwise it opens its picker
        if (st.vals[key] && st.open !== key) {
          st.vals[key] = 0;
        } else {
          st.open = st.open === key ? '' : key;
        }
        st.focus = false;
        render();
      });
      optsOf(g).forEach(function (o, j) {
        o.addEventListener('click', function () {
          st.vals[key] = j;
          st.open = '';
          render();
          $('.js-ls-segbtn', g).focus();
        });
      });
    });

    // clicks outside the console and Esc close the open panel
    document.addEventListener('click', function (e) {
      if (!pill.contains(e.target) && (st.focus || st.open)) {
        st.focus = false;
        st.open = '';
        render();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && (st.focus || st.open)) {
        var back = st.open ? $('.js-ls-seg[data-key="' + st.open + '"] .js-ls-segbtn') : null;
        st.focus = false;
        st.open = '';
        render();
        if (back) {
          back.focus();
        }
      }
    });

    sheetBtn.addEventListener('click', function () {
      var open = !pill.classList.contains('is-sheet');
      pill.classList.toggle('is-sheet', open);
      sheetBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    $$('.js-ls-chip').forEach(function (c, i) {
      c.addEventListener('click', function () {
        var at = st.chips.indexOf(i);
        if (at > -1) {
          st.chips.splice(at, 1);
        } else {
          st.chips.push(i);
        }
        render();
      });
    });

    // Save search (v1) / price alert (v2); Listing v3 has neither
    $$('.js-ls-save').forEach(function (btn) {
      btn.addEventListener('click', function () {
        st.saved = !st.saved;
        btn.setAttribute('aria-pressed', st.saved ? 'true' : 'false');
        setText('.js-ls-saveic', st.saved ? '✓' : '♡');
        setText('.js-ls-savetxt', st.saved ? 'Saved · alerts on' : 'Save search');
        // Listing v2: the price-alert card swaps its texts by class
        $$('.js-ls-alert').forEach(function (a) {
          a.classList.toggle('is-on', st.saved);
        });
      });
    });

    // Listing v2: a recent search applies its keyword and filters
    $$('.js-ls-recent').forEach(function (b) {
      b.addEventListener('click', function () {
        st.kw = b.getAttribute('data-kw') || '';
        kw.value = st.kw;
        st.cond = 0;
        st.chips = [];
        Object.keys(st.vals).forEach(function (k) {
          st.vals[k] = parseInt(b.getAttribute('data-' + k), 10) || 0;
        });
        st.open = '';
        st.focus = false;
        render();
      });
    });

    $('.js-ls-reset').addEventListener('click', function () {
      st.cond = 0;
      st.kw = '';
      kw.value = '';
      st.chips = [];
      Object.keys(st.vals).forEach(function (k) {
        st.vals[k] = 0;
      });
      render();
    });

    pill.addEventListener('submit', function (e) {
      e.preventDefault();
      st.focus = false;
      st.open = '';
      render();
      var top = $('#results').getBoundingClientRect().top + window.pageYOffset - 20;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });

    initListingResults();
    render();
  }

  // Results: both views carry the same nine cars; favourites, compare (max 4),
  // the photo index and the page are shared between them.
  function initListingResults() {
    var grid = $('.js-ln-grid');
    var rows = $('.js-ln-list');
    var fav = [0];
    var cmp = [];
    var ph = {};
    var page = 1;
    var TOTAL = 98;
    // page size: the grid's data-per (Listing v7 = 8), otherwise the nine sample cars; Show N changes it (avava:per)
    var size = parseInt(grid.getAttribute('data-per'), 10) || 9;
    var PAGES = Math.ceil(TOTAL / size);
    // sort order of the sample cars; Listing v4's toolbar changes it through the avava:sort event
    var byCar = function (a, b) {
      return a.getAttribute('data-car') - b.getAttribute('data-car');
    };
    var order = byCar;
    var num = function (el, k) {
      return parseFloat(el.getAttribute('data-' + k)) || 0;
    };
    var SORTS = [byCar,
      function (a, b) { return num(b, 'price') - num(a, 'price'); },
      function (a, b) { return num(a, 'price') - num(b, 'price'); },
      function (a, b) { return num(b, 'year') - num(a, 'year'); },
      function (a, b) { return num(a, 'mi') - num(b, 'mi'); },
      byCar];

    function each(sel, i, fn) {
      $$(sel + '[data-car="' + i + '"]').forEach(fn);
    }

    $$('.js-ls-view').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-view');
        $$('.js-ls-view').forEach(function (x) {
          x.classList.toggle('is-on', x === b);
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        grid.hidden = v === '1';
        rows.hidden = v !== '1';
      });
    });

    // clicks are delegated, so cards added by Load more (Listing Map v1) work as well
    function toggleFav(b) {
      var i = parseInt(b.getAttribute('data-car'), 10);
      var at = fav.indexOf(i);
      if (at > -1) {
        fav.splice(at, 1);
      } else {
        fav.push(i);
      }
      each('.js-ln-fav', i, function (x) {
        x.setAttribute('aria-pressed', at > -1 ? 'false' : 'true');
      });
    }

    function paintCmp() {
      var full = cmp.length >= 4;
      $$('.js-ln-cmp').forEach(function (b) {
        var i = parseInt(b.getAttribute('data-car'), 10);
        var on = cmp.indexOf(i) > -1;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.classList.toggle('is-full', full && !on);
        b.setAttribute('aria-disabled', full && !on ? 'true' : 'false');
        b.textContent = on ? 'In compare ✓' : full ? 'Compare full' : '+ Compare';
      });
      $$('.js-ln-item').forEach(function (it) {
        it.classList.toggle('is-cmp', cmp.indexOf(parseInt(it.getAttribute('data-car'), 10)) > -1);
      });
    }

    function toggleCmp(b) {
      var i = parseInt(b.getAttribute('data-car'), 10);
      var at = cmp.indexOf(i);
      if (at > -1) {
        cmp.splice(at, 1);
      } else if (cmp.length < 4) {
        cmp.push(i);
      }
      paintCmp();
    }

    // gallery: 48 photos per car in production; the counter, rail and thumbnails follow the index
    function paintPhoto(i) {
      var n = ph[i] || 1;
      each('.js-ln-gal', i, function (g) {
        $$('.js-ln-cnt', g).forEach(function (c) {
          c.textContent = n + ' / 48';
        });
        $$('.js-ln-dots span', g).forEach(function (d, j) {
          d.classList.toggle('is-on', Math.floor((n - 1) / 8) === j);
        });
        $$('.js-ln-th', g).forEach(function (t, k) {
          var v = (n + k) % 48 + 1;
          t.setAttribute('data-n', v);
          t.setAttribute('aria-label', 'Photo ' + v);
          $('.js-ln-thn', t).textContent = v;
        });
      });
    }

    $$('.js-ln-gal').forEach(function (g) {
      paintPhoto(parseInt(g.getAttribute('data-car'), 10));
    });

    document.addEventListener('click', function (e) {
      var b = e.target.closest('.js-ln-fav, .js-ln-cmp, .js-ln-prev, .js-ln-next, .js-ln-th');
      if (!b) {
        return;
      }
      if (b.classList.contains('js-ln-fav')) {
        toggleFav(b);
        return;
      }
      if (b.classList.contains('js-ln-cmp')) {
        toggleCmp(b);
        return;
      }
      var g = b.closest('.js-ln-gal');
      var i = parseInt(g.getAttribute('data-car'), 10);
      if (b.classList.contains('js-ln-th')) {
        ph[i] = parseInt(b.getAttribute('data-n') || b.getAttribute('data-step'), 10) || 1;
      } else {
        ph[i] = ((ph[i] || 1) - 1 + (b.classList.contains('js-ln-next') ? 1 : -1) + 48) % 48 + 1;
      }
      paintPhoto(i);
    });

    // delivery dates from today
    $$('.js-ln-eta').forEach(function (el) {
      var d = new Date();
      d.setDate(d.getDate() + parseInt(el.getAttribute('data-days'), 10));
      var pre = el.hasAttribute('data-prefix') ? el.getAttribute('data-prefix') : 'Arrives ';
      el.textContent = pre + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
    });

    // pages: the sample shows the same nine cars rotated, numbered through the inventory; a page bigger than
    // the sample is filled with copies (they share data-car, so favourites and compare stay in sync)
    function paintPage(scroll) {
      [grid, rows].forEach(function (box) {
        $$('.js-ln-copy', box).forEach(function (c) { c.remove(); });
        var items = $$('.js-ln-item', box).sort(order);
        var rot = ((page - 1) * 4) % items.length;
        items = items.slice(rot).concat(items.slice(0, rot));
        for (var k = 0; k < Math.max(size, items.length); k++) {
          var it = items[k];
          if (k >= items.length) {
            it = items[k % items.length].cloneNode(true);
            it.classList.add('js-ln-copy');
          }
          var num = (page - 1) * size + k + 1;
          box.appendChild(it);
          it.hidden = k >= size || num > TOTAL;
          $$('.js-ln-n', it).forEach(function (el) {
            el.textContent = (num < 10 ? '0' : '') + num;
          });
        }
      });
      setText('.js-ln-page', String(page));
      setText('.js-ln-pagesn', String(PAGES));
      setText('.js-ln-range', ((page - 1) * size + 1) + '–' + Math.min(TOTAL, page * size));
      $('.js-ln-pprev').disabled = page === 1;
      $('.js-ln-pnext').disabled = page === PAGES;
      var set = [1];
      for (var x = page - 1; x <= page + 1; x++) {
        if (x > 1 && x < PAGES) {
          set.push(x);
        }
      }
      set.push(PAGES);
      var html = '';
      set.forEach(function (p, j) {
        if (j && p - set[j - 1] > 1) {
          html += '<span class="lpg__gap" aria-hidden="true">…</span>';
        }
        html += '<button class="lpg__num" type="button" data-p="' + p + '"' + (p === page ? ' aria-current="page"' : '') + ' aria-label="Page ' + p + '">' + p + '</button>';
      });
      $('.js-ln-pages').innerHTML = html;
      if (scroll) {
        var top = $('#results').getBoundingClientRect().top;
        if (top < 0) {
          window.scrollTo({ top: top + window.pageYOffset - 20, behavior: 'smooth' });
        }
      }
    }

    function go(p) {
      if (p < 1 || p > PAGES || p === page) {
        return;
      }
      page = p;
      paintPage(true);
    }

    paintCmp();
    initListingRequest();
    if (!$('.js-ln-pprev')) {
      // Listing Map v1 has Load more instead of pages
      initLoadMore(grid, rows, paintCmp);
      return;
    }

    $('.js-ln-pprev').addEventListener('click', function () { go(page - 1); });
    $('.js-ln-pnext').addEventListener('click', function () { go(page + 1); });
    $('.js-ln-pages').addEventListener('click', function (e) {
      var b = e.target.closest('.lpg__num');
      if (b) {
        go(parseInt(b.getAttribute('data-p'), 10));
      }
    });

    document.addEventListener('avava:sort', function (e) {
      order = SORTS[e.detail] || byCar;
      page = 1;
      paintPage(true);
    });
    document.addEventListener('avava:per', function (e) {
      size = e.detail;
      PAGES = Math.ceil(TOTAL / size);
      page = 1;
      paintPage(true);
    });

    paintPage(false);
  }

  // 04 · sourcing request: make (2+ characters), budget slider, email
  function initListingRequest() {
    var form = $('.js-rq-form');
    if (!form) {
      return;
    }
    var done = $('.js-rq-done');
    var make = $('.js-rq-make');
    var mail = $('.js-rq-mail');
    var range = $('.js-rq-b');
    var tried = false;
    var sent = false;
    var hots = $$('.js-rq-hot');
    var steps = $$('.js-rq-st');

    function budget() {
      var b = parseInt(range.value, 10);
      return { b: b, mo: Math.round((500 + b / 100 * 4500) / 50) * 50, any: b >= 100 };
    }

    function errs() {
      return { make: make.value.trim().length < 2 ? 'Required' : '', mail: /.+@.+\..+/.test(mail.value) ? '' : 'Check email' };
    }

    function paint() {
      var bd = budget();
      var e = errs();
      var label = bd.any ? 'No limit' : 'Up to $' + bd.mo.toLocaleString('en-US') + ' / mo';
      setText('.js-rq-bv', label);
      range.setAttribute('aria-valuetext', bd.any ? 'No budget limit' : 'Up to $' + bd.mo.toLocaleString('en-US') + ' a month');
      $('.js-rq-fill').style.width = bd.b + '%';
      $('.js-rq-knob').style.left = bd.b + '%';
      var stock = Math.max(0, Math.round(98 * Math.min(1, (bd.mo - 400) / 4600)));
      setText('.js-rq-sub', bd.any ? 'no budget limit' : stock + ' in stock already match');
      setText('.js-rq-n1', e.make ? '01' : '✓');
      setText('.js-rq-n3', e.mail ? '03' : '✓');
      setText('.js-rq-emake', tried ? e.make : '');
      setText('.js-rq-email', tried ? e.mail : '');
      make.setAttribute('aria-invalid', tried && e.make ? 'true' : 'false');
      mail.setAttribute('aria-invalid', tried && e.mail ? 'true' : 'false');
      form.classList.toggle('is-err', tried && !!(e.make || e.mail));
      hots.forEach(function (h) {
        h.setAttribute('aria-pressed', h.textContent === make.value ? 'true' : 'false');
      });
      [!e.make && !e.mail, sent, false].forEach(function (on, i) {
        steps[i].classList.toggle('is-on', on);
        $('.lrq__sn', steps[i]).textContent = on ? '✓' : String(i + 1);
      });
    }

    [make, mail, range].forEach(function (el) {
      el.addEventListener('input', paint);
    });
    hots.forEach(function (h) {
      h.addEventListener('click', function () {
        make.value = make.value === h.textContent ? '' : h.textContent;
        paint();
      });
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var e = errs();
      if (e.make || e.mail) {
        tried = true;
        paint();
        (e.make ? make : mail).focus();
        return;
      }
      var bd = budget();
      var d = new Date();
      d.setDate(d.getDate() + 2);
      sent = true;
      setText('.js-rq-dmake', make.value.trim());
      setText('.js-rq-dbudget', bd.any ? 'with no budget limit' : 'under $' + bd.mo.toLocaleString('en-US') + '/mo');
      setText('.js-rq-dmail', mail.value.trim());
      setText('.js-rq-id', 'AV-H' + (1000 + Math.floor(Math.random() * 8999)));
      setText('.js-rq-eta', d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', ''));
      form.hidden = true;
      done.hidden = false;
      paint();
      done.focus();
    });

    $('.js-rq-new').addEventListener('click', function () {
      make.value = '';
      mail.value = '';
      range.value = '40';
      tried = false;
      sent = false;
      done.hidden = true;
      form.hidden = false;
      paint();
      make.focus();
    });

    paint();
  }

  // Listing v4: toolbar (condition, save, sort, per page) and the filter sidebar.
  // Condition lives only in the toolbar; the sidebar count reads it.
  var SB_COND = [1, 0.22, 0.62, 0.15];

  function initListingSidebar() {
    var side = $('.js-sb');
    if (!side) {
      return;
    }
    var cond = 0;
    var per = parseInt(($('.js-ln-grid') || side).getAttribute('data-per'), 10) || 9;
    var dds = $$('.js-sb-dd', side);
    var incs = $$('.js-sb-inc', side);
    var openBtn = $('.js-sb-open');
    var scrim = $('.js-sb-scrim');

    function val(dd) {
      return dd.getAttribute('data-val') || '';
    }

    function ddOf(key) {
      return $('.js-sb-dd[data-key="' + key + '"]', side);
    }

    function countOf(dd) {
      var on = $('.js-sb-opt.is-on', dd);
      return on ? parseInt($('.l4dd__on', on).textContent, 10) || 0 : 0;
    }

    function total() {
      var t = Math.round(98 * SB_COND[cond]);
      var make = ddOf('make');
      var model = ddOf('model');
      var set = dds.filter(function (d) { return val(d); }).length;
      if (val(make)) {
        t = countOf(make) || 10;
      }
      if (val(model)) {
        t = Math.min(t, countOf(model) || 3);
      }
      var extra = set - (val(make) ? 1 : 0) - (val(model) ? 1 : 0);
      var on = incs.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).length;
      return Math.max(1, t - Math.max(0, extra) * 2 - Math.max(0, on - 1));
    }

    function paint() {
      var set = 0;
      dds.forEach(function (d) {
        var v = val(d);
        var btn = $('.js-sb-ddbtn', d);
        d.classList.toggle('is-set', !!v);
        if (v) {
          set++;
        }
        $('.js-sb-val', d).textContent = v || d.getAttribute('data-any');
        $$('.js-sb-opt', d).forEach(function (o) {
          var on = o.getAttribute('data-v') === v;
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        btn.setAttribute('aria-label', btn.textContent.replace(/[×\s]+$/, '').trim() + (v ? ' — press to clear' : ''));
      });
      // the model depends on the make
      var make = val(ddOf('make'));
      var model = ddOf('model');
      model.classList.toggle('is-dis', !make);
      $('.js-sb-ddbtn', model).disabled = !make;
      model.setAttribute('data-any', make ? 'Any ' + make + ' model' : 'Choose a make first');
      $('.l4dd__ot', $('.js-sb-opt', model)).textContent = model.getAttribute('data-any');
      if (!val(model)) {
        $('.js-sb-val', model).textContent = model.getAttribute('data-any');
      }
      $$('li[data-make]', model).forEach(function (li) {
        li.hidden = li.getAttribute('data-make') !== make;
      });
      var anyChecked = $$('.l4chk__in:checked', side).length;
      $('.js-sb-reset').disabled = !set && !anyChecked && !incs.some(function (b) { return b.getAttribute('aria-pressed') === 'true'; });
      setText('.js-sb-total', String(total()));
      var fn = $('.js-sb-fn');
      fn.hidden = !set;
      fn.textContent = String(set);
    }

    function closeAll(except) {
      dds.forEach(function (d) {
        if (d !== except) {
          d.classList.remove('is-open');
          $('.js-sb-pop', d).hidden = true;
          $('.js-sb-ddbtn', d).setAttribute('aria-expanded', 'false');
        }
      });
    }

    dds.forEach(function (d) {
      var btn = $('.js-sb-ddbtn', d);
      var pop = $('.js-sb-pop', d);
      var q = $('.js-sb-q', d);
      btn.addEventListener('click', function () {
        var open = d.classList.contains('is-open');
        // a set field clears on click (its ×); otherwise it opens its list
        if (val(d) && !open) {
          d.setAttribute('data-val', '');
          if (d.getAttribute('data-key') === 'make') {
            ddOf('model').setAttribute('data-val', '');
          }
          paint();
          return;
        }
        closeAll(d);
        d.classList.toggle('is-open', !open);
        pop.hidden = open;
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (!open && q) {
          q.value = '';
          q.dispatchEvent(new Event('input'));
          q.focus();
        }
      });
      $$('.js-sb-opt', d).forEach(function (o) {
        o.addEventListener('click', function () {
          d.setAttribute('data-val', o.getAttribute('data-v'));
          if (d.getAttribute('data-key') === 'make') {
            ddOf('model').setAttribute('data-val', '');
          }
          closeAll(null);
          paint();
          btn.focus();
        });
      });
      if (q) {
        q.addEventListener('input', function () {
          var s = q.value.trim().toLowerCase();
          $$('.js-sb-opt', d).forEach(function (o, i) {
            o.parentNode.hidden = i > 0 && s !== '' && o.textContent.toLowerCase().indexOf(s) < 0;
          });
        });
      }
    });

    incs.forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        paint();
      });
    });
    $$('.l4chk__in', side).forEach(function (c) {
      c.addEventListener('change', paint);
    });

    $('.js-sb-reset').addEventListener('click', function () {
      dds.forEach(function (d) {
        d.setAttribute('data-val', '');
      });
      incs.forEach(function (b) {
        b.setAttribute('aria-pressed', 'false');
      });
      $$('.l4chk__in', side).forEach(function (c) {
        c.checked = false;
      });
      paint();
    });

    $('.js-sb-more').addEventListener('click', function () {
      var open = this.getAttribute('aria-expanded') !== 'true';
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
      this.textContent = open ? '− Fewer filters' : '+ More filters · colour, drive, seats';
      $$('.js-sb-adv', side).forEach(function (d) {
        d.hidden = !open;
      });
    });

    // below 1200px the sidebar is a slide-over sheet
    function sheet(open) {
      side.classList.toggle('is-open', open);
      scrim.hidden = !open;
      document.body.classList.toggle('is-locked', open);
      openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        $('.js-sb-close').focus();
      }
    }
    openBtn.addEventListener('click', function () { sheet(true); });
    $('.js-sb-close').addEventListener('click', function () { sheet(false); openBtn.focus(); });
    scrim.addEventListener('click', function () { sheet(false); });

    $('.js-sb-go').addEventListener('click', function () {
      if (side.classList.contains('is-open')) {
        sheet(false);
      }
      var top = $('#results').getBoundingClientRect().top + window.pageYOffset - 20;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });

    // toolbar
    function range() {
      var n = parseInt($$('.js-tb-cond')[cond].getAttribute('data-n'), 10);
      setText('.js-tb-total', String(n));
      setText('.js-tb-end', String(Math.min(per, n)));
      setText('.js-tb-pern', String(per));
    }

    $$('.js-tb-cond').forEach(function (b, i) {
      b.addEventListener('click', function () {
        cond = i;
        $$('.js-tb-cond').forEach(function (x, k) {
          x.classList.toggle('is-on', k === i);
          x.setAttribute('aria-pressed', k === i ? 'true' : 'false');
        });
        range();
        paint();
      });
    });

    // Save search (Listing v7 has none)
    var save = $('.js-tb-save');
    if (save) {
      save.addEventListener('click', function () {
        var on = this.getAttribute('aria-pressed') !== 'true';
        this.setAttribute('aria-pressed', on ? 'true' : 'false');
        setText('.js-tb-saveic', on ? '✓' : '♡');
        setText('.js-tb-savetxt', on ? 'Saved' : 'Save search');
      });
    }

    var pops = [[$('.js-tb-sortbtn'), $('.js-tb-sortpop')], [$('.js-tb-perbtn'), $('.js-tb-perpop')]];

    function closePops(except) {
      pops.forEach(function (p) {
        if (p[1] !== except) {
          p[1].hidden = true;
          p[0].setAttribute('aria-expanded', 'false');
          p[0].classList.remove('is-open');
        }
      });
    }

    pops.forEach(function (p) {
      p[0].addEventListener('click', function () {
        var open = p[1].hidden;
        closePops(p[1]);
        p[1].hidden = !open;
        p[0].setAttribute('aria-expanded', open ? 'true' : 'false');
        p[0].classList.toggle('is-open', open);
      });
    });

    $$('.js-tb-sort').forEach(function (o, i) {
      o.addEventListener('click', function () {
        $$('.js-tb-sort').forEach(function (x, k) {
          x.classList.toggle('is-on', k === i);
          x.setAttribute('aria-pressed', k === i ? 'true' : 'false');
        });
        setText('.js-tb-sortname', $('.l4t__sn', o).textContent);
        $('.js-tb-sortic').innerHTML = $('.l4t__si', o).innerHTML;
        closePops(null);
        document.dispatchEvent(new CustomEvent('avava:sort', { detail: i }));
      });
    });

    $$('.js-tb-per').forEach(function (o) {
      o.addEventListener('click', function () {
        per = parseInt(o.getAttribute('data-n'), 10);
        $$('.js-tb-per').forEach(function (x) {
          x.classList.toggle('is-on', x === o);
          x.setAttribute('aria-pressed', x === o ? 'true' : 'false');
        });
        range();
        closePops(null);
        document.dispatchEvent(new CustomEvent('avava:per', { detail: per }));
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.js-sb-dd')) {
        closeAll(null);
      }
      if (!e.target.closest('.l4t__dd')) {
        closePops(null);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAll(null);
        closePops(null);
        if (side.classList.contains('is-open')) {
          sheet(false);
          openBtn.focus();
        }
      }
    });

    range();
    paint();
  }

  // Listing Map v1: Load more appends the next nine (the sample repeats the nine cars,
  // numbered on through the inventory), a progress line counts up to the total.
  function initLoadMore(grid, rows, paintCmp) {
    var btn = $('.js-ln-more');
    if (!btn) {
      return;
    }
    var TOTAL = 98;
    var base = [grid, rows].map(function (box) {
      return $$('.js-ln-item', box);
    });
    var shown = base[0].length;

    function number(it, num) {
      $$('.js-ln-n', it).forEach(function (el) {
        el.textContent = (num < 10 ? '0' : '') + num;
      });
    }

    function paint() {
      setText('.js-ln-shown', String(shown));
      $('.js-ln-bar').style.width = (shown / TOTAL * 100) + '%';
      btn.hidden = shown >= TOTAL;
    }

    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-loading')) {
        return;
      }
      btn.classList.add('is-loading');
      setText('.js-ln-moretxt', 'Loading…');
      window.setTimeout(function () {
        var add = Math.min(9, TOTAL - shown);
        [grid, rows].forEach(function (box, b) {
          var per = base[b].length / 9;  // the list holds two row styles per car
          base[b].slice(0, add * per).forEach(function (it, k) {
            var c = it.cloneNode(true);
            number(c, shown + Math.floor(k / per) + 1);
            box.appendChild(c);
          });
        });
        shown += add;
        btn.classList.remove('is-loading');
        setText('.js-ln-moretxt', 'Load more cars');
        paintCmp();
        paint();
        document.dispatchEvent(new CustomEvent('avava:more'));
      }, 450);
    });
    paint();
  }

  // Listing Map v1: Grid / Map layout switch and the price-pin map (Leaflet + OpenStreetMap).
  // Hover is synced both ways: a card lights its pin, a pin lights its card; a pin click
  // scrolls to the car. The drawn map under the tiles stays until they load.
  function initListingMap() {
    var box = $('.js-lm');
    if (!box) {
      return;
    }
    var map = null;
    var pins = {};
    var refit = null;  // set once the map exists; a hidden map cannot measure itself

    $$('.js-lm-mode').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('data-mode') === '1';
        box.classList.toggle('is-map', on);
        $$('.js-lm-mode').forEach(function (x) {
          x.classList.toggle('is-on', x === b);
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        if (on && refit) {
          window.setTimeout(refit, 50);
        }
      });
    });

    function hot(car, on) {
      if (pins[car]) {
        var el = pins[car].getElement();
        if (el) {
          el.classList.toggle('is-on', on);
        }
        pins[car].setZIndexOffset(on ? 1000 : 0);
      }
      $$('.js-ln-item[data-car="' + car + '"]').forEach(function (it) {
        it.classList.toggle('is-hot', on);
      });
    }

    // cards and rows → pins (delegated: Load more adds cards)
    var res = $('.js-lm-res');
    res.addEventListener('mouseover', function (e) {
      var it = e.target.closest('.js-ln-item');
      if (it && !it.contains(e.relatedTarget)) {
        hot(it.getAttribute('data-car'), true);
      }
    });
    res.addEventListener('mouseout', function (e) {
      var it = e.target.closest('.js-ln-item');
      if (it && !it.contains(e.relatedTarget)) {
        hot(it.getAttribute('data-car'), false);
      }
    });

    // below 1200px the map is a full-screen layer toggled by a floating Map / List button
    var fab = $('.js-lm-fab');
    fab.addEventListener('click', function () {
      var on = !box.classList.contains('is-full');
      box.classList.toggle('is-full', on);
      document.body.classList.toggle('is-locked', on);
      fab.setAttribute('aria-pressed', on ? 'true' : 'false');
      setText('.js-lm-fabtxt', on ? 'List' : 'Map');
      if (on && refit) {
        window.setTimeout(refit, 60);
      }
    });

    var L = window.L;
    var el = $('.js-lm-live');
    if (typeof L === 'undefined' || !el) {
      return;
    }
    var touch = window.matchMedia('(hover: none)').matches;
    map = L.map(el, { scrollWheelZoom: false, dragging: !touch, zoomControl: false, attributionControl: false });
    map.setView([33.95, -118.3], 9);  // a start view, so a hidden map still has bounds
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);
    var tiles = L.tileLayer('../../../tile.openstreetmap.org/%7bz%7d/%7bx%7d/%7by%7d.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    tiles.once('load', function () {
      box.classList.add('is-live');
    });

    var pts = [];
    var seen = {};
    $$('.js-ln-grid .js-ln-item').forEach(function (it) {
      var car = it.getAttribute('data-car');
      if (seen[car]) {
        return;
      }
      seen[car] = true;
      var ll = [parseFloat(it.getAttribute('data-lat')), parseFloat(it.getAttribute('data-lng'))];
      pts.push(ll);
      var m = L.marker(ll, {
        icon: L.divIcon({ className: 'lmpin-wrap', html: '<span class="lmpin">' + esc(it.getAttribute('data-mo')) + '</span>', iconSize: [0, 0] }),
        keyboard: false,
        title: $('.lcd__name', it).textContent
      }).addTo(map);
      m.on('mouseover', function () { hot(car, true); });
      m.on('mouseout', function () { hot(car, false); });
      m.on('click', function () {
        var t = $('.js-ln-item[data-car="' + car + '"]:not([hidden])', res);
        var list = $('.js-ln-list', res);
        if (list && !list.hidden) {
          t = $('.js-ln-item[data-car="' + car + '"]', list) || t;
        }
        if (t) {
          window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 30, behavior: 'smooth' });
        }
      });
      pins[car] = m;
    });

    function fit() {
      map.invalidateSize();
      if (el.clientWidth && el.clientHeight) {
        map.fitBounds(pts, { padding: [40, 40] });
      }
    }

    // how many pins the current view holds
    function count() {
      var b = map.getBounds();
      var n = pts.filter(function (ll) { return b.contains(ll); }).length;
      setText('.js-lm-count', String(n));
    }

    map.on('moveend', count);
    map.on('dragend', function () {
      $('.js-lm-area').hidden = false;
    });
    $('.js-lm-area').addEventListener('click', function () {
      this.hidden = true;
      count();
    });
    $('.js-lm-zin').addEventListener('click', function () { map.zoomIn(); });
    $('.js-lm-zout').addEventListener('click', function () { map.zoomOut(); });

    refit = fit;
    fit();
    count();
    // fonts and the sticky box settle after DOMContentLoaded: measure again once the page has loaded
    window.addEventListener('load', fit);
    var t = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(t);
      t = window.setTimeout(fit, 200);
    });
  }

  // Listing Map v2: the command bar. The count is the smallest set option (as in the
  // prototype) scaled by the condition; Model depends on Make; a set filter clears on click.
  function initCommandBar() {
    var bar = $('.js-cb');
    if (!bar) {
      return;
    }
    var dds = $$('.js-cb-dd', bar);
    var cond = 0;
    var vals = {};
    var COND = [98, 22, 61];
    dds.forEach(function (d) {
      vals[d.getAttribute('data-key')] = 0;
    });

    function dd(key) {
      return $('.js-cb-dd[data-key="' + key + '"]', bar);
    }

    function opts(d) {
      return $$('.js-cb-opt', d);
    }

    function optOf(d, i) {
      return opts(d).filter(function (o) { return parseInt(o.getAttribute('data-i'), 10) === i; })[0];
    }

    function n(o) {
      return parseInt($('.js-cb-n', o).textContent, 10) || 0;
    }

    function paint() {
      var make = vals.make;
      var model = dd('model');
      var set = 0;
      // Model: only the chosen make's models (no brand prefix), or every model with it
      $$('li[data-make]', model).forEach(function (li) {
        li.hidden = make > 0 && li.getAttribute('data-make') !== String(make);
      });
      model.classList.toggle('is-scoped', make > 0);
      $('.js-cb-n', optOf(model, 0)).textContent = make ? n(optOf(dd('make'), make)) : 98;

      var count = 98;
      dds.forEach(function (d) {
        var key = d.getAttribute('data-key');
        var v = vals[key];
        var on = optOf(d, v);
        d.classList.toggle('is-set', v > 0);
        if (v > 0) {
          set++;
          count = Math.min(count, n(on));
        }
        var label = $('.lsc__ot', on).textContent.trim();
        if (key === 'model' && v > 0 && make > 0) {
          label = label.replace($('.lcb__brand', on).textContent, '').trim();
        }
        $('.js-cb-val', d).textContent = v > 0 ? label : (key === 'loc' ? 'Anywhere' : 'Any');
        opts(d).forEach(function (o) {
          var sel = o === on;
          o.classList.toggle('is-on', sel);
          o.setAttribute('aria-pressed', sel ? 'true' : 'false');
        });
      });
      if (cond) {
        count = Math.max(1, Math.round(count * COND[cond] / 98 * 1.3));
      }
      setText('.js-cb-count', String(count));
      var fn = $('.js-cb-fn');
      fn.hidden = !set;
      fn.textContent = String(set);
    }

    function close(except) {
      dds.forEach(function (d) {
        if (d !== except) {
          d.classList.remove('is-open');
          $('.js-cb-pop', d).hidden = true;
          $('.js-cb-btn', d).setAttribute('aria-expanded', 'false');
        }
      });
    }

    dds.forEach(function (d) {
      var key = d.getAttribute('data-key');
      var btn = $('.js-cb-btn', d);
      btn.addEventListener('click', function () {
        var open = d.classList.contains('is-open');
        if (vals[key] > 0 && !open) {
          vals[key] = 0;
          if (key === 'make') {
            vals.model = 0;
          }
          paint();
          return;
        }
        close(d);
        d.classList.toggle('is-open', !open);
        $('.js-cb-pop', d).hidden = open;
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
      opts(d).forEach(function (o) {
        o.addEventListener('click', function () {
          vals[key] = parseInt(o.getAttribute('data-i'), 10);
          if (key === 'make') {
            vals.model = 0;  // a new make resets the model
          }
          close(null);
          paint();
          btn.focus();
        });
      });
    });

    $$('.js-cb-cond', bar).forEach(function (b, i) {
      b.addEventListener('click', function () {
        cond = i;
        $$('.js-cb-cond', bar).forEach(function (x, k) {
          x.classList.toggle('is-on', k === i);
          x.setAttribute('aria-pressed', k === i ? 'true' : 'false');
        });
        paint();
      });
    });

    // Save search — Listing Map v3 has a theme switch in its place
    $$('.js-cb-save').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        setText('.js-cb-saveic', on ? '✓' : '♡');
        setText('.js-cb-savetxt', on ? 'Saved · alerts on' : 'Save search');
      });
    });

    // below 1200px the filters fold into a sheet under the bar
    var sheet = $('.js-cb-sheet');
    sheet.addEventListener('click', function () {
      var open = !bar.classList.contains('is-sheet');
      bar.classList.toggle('is-sheet', open);
      sheet.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.js-cb-dd')) {
        close(null);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var open = $('.js-cb-dd.is-open', bar);
        close(null);
        if (open) {
          $('.js-cb-btn', open).focus();
        }
      }
    });

    paint();
  }

  /* 21. Listing Single v1 ---------------------------------------------- */
  // One car. Gallery frames 1–6 are photos, the rest show a slot with their size until the
  // real photos arrive. Every price on the page follows one finance state:
  //   amount = price − down − trade;  monthly = amount · r / (1 − (1 + r)^−n),  r = APR / 1200
  // In production, read the car from the inventory API and the quote from the finance API,
  // and keep favourites / compare in the account.
  var LSG_TRADE = 38000;

  function initListingSingle() {
    var main = $('.js-sg-main');
    if (main) {
      initSingleGallery(main);
      initSingleFinance();
    }
    if (main || $('.js-sv') || $('.js-s3') || $('.js-s4') || $('.js-s5') || $('.js-s6')) {
      initSingleBits();
    }
  }

  function initSingleGallery(main) {
    var frames = parseInt(main.getAttribute('data-frames'), 10);
    // two photo sets: Ember (no data-skin) and the green skin
    var sets = [main.getAttribute('data-photos').split(','), main.getAttribute('data-photos-skin').split(',')];
    var names = [main.getAttribute('data-name'), main.getAttribute('data-name-skin')];
    var which = 0;
    var photos = sets[0];
    var labelSets = [main.getAttribute('data-labels').split('|'), main.getAttribute('data-labels-skin').split('|')];
    var labels = labelSets[0];
    var img = $('.js-sg-img');
    var slot = $('.js-sg-slot');
    var box = $('.js-sg-box');
    var spin = $('.js-sg-spin');
    var cur = 0;
    var timer = null;

    function label(i) {
      return labels[i] || 'Detail ' + String(i + 1).padStart(2, '0');
    }

    function src(i) {
      return 'assets/img/' + photos[i] + '.webp';
    }

    function show(i) {
      cur = (i + frames) % frames;
      var real = cur < photos.length;
      img.hidden = !real;
      slot.hidden = real;
      if (real) {
        img.src = src(cur);
        img.alt = names[which] + ' — ' + label(cur);
        // warm up the neighbours
        [cur + 1, cur - 1].forEach(function (k) {
          k = (k + frames) % frames;
          if (k < photos.length) {
            new Image().src = src(k);
          }
        });
      } else {
        setText('.js-sg-slotlbl', label(cur));
        // the slot shows the size the photo is drawn at on the 2560 artboard
        var u = main.clientWidth / 1500;
        setText('.js-sg-slotsz', '1500 × ' + Math.round(main.clientHeight / u));
      }
      if (box) {
        $('.js-sg-bimg').hidden = !real;
        $('.js-sg-bslot').hidden = real;
        if (real) {
          $('.js-sg-bimg').src = src(cur);
          $('.js-sg-bimg').alt = label(cur);
        }
        setText('.js-sg-bslotlbl', label(cur));
      }
      setText('.js-sg-num', String(cur + 1).padStart(2, '0'));
      setText('.js-sg-lbl', label(cur));
      $$('.js-sg-th').forEach(function (b, k) {
        press(b, k === cur);
      });
    }

    // pick the set for the accent in use; the accent can change in another tab
    function pickSet() {
      which = root.getAttribute('data-skin') ? 1 : 0;
      photos = sets[which];
      labels = labelSets[which];
      var lsg = $('.lsg');
      if (lsg && lsg.getAttribute('data-title')) {
        document.title = lsg.getAttribute(which ? 'data-title-skin' : 'data-title');
      }
      $$('.js-sg-th img').forEach(function (im, k) {
        im.src = src(k);
      });
      $$('.js-sg-stkth').forEach(function (im) {
        im.src = src(0);
      });
      show(cur);
    }

    pickSet();
    new MutationObserver(pickSet).observe(root, { attributes: true, attributeFilter: ['data-skin'] });

    function stopSpin() {
      window.clearInterval(timer);
      timer = null;
      if (spin) {
        spin.setAttribute('aria-pressed', 'false');
      }
    }

    $$('.js-sg-prev').forEach(function (b) {
      b.addEventListener('click', function () {
        stopSpin();
        show(cur - 1);
      });
    });
    $$('.js-sg-next').forEach(function (b) {
      b.addEventListener('click', function () {
        stopSpin();
        show(cur + 1);
      });
    });
    $$('.js-sg-th').forEach(function (b) {
      b.addEventListener('click', function () {
        stopSpin();
        show(parseInt(b.getAttribute('data-i'), 10));
      });
    });

    // 360°: walks round the four exterior frames until pressed again (a spin viewer replaces it)
    if (spin) {
      spin.addEventListener('click', function () {
        if (timer) {
          stopSpin();
          return;
        }
        spin.setAttribute('aria-pressed', 'true');
        show(cur < 3 ? cur + 1 : 0);
        timer = window.setInterval(function () {
          show(cur < 3 ? cur + 1 : 0);
        }, 900);
      });
    }

    // lightbox: the main photo or "All photos"; arrows, Esc and swipe
    if (box && typeof box.showModal === 'function') {
      var open = function () {
        stopSpin();
        show(cur);
        box.showModal();
      };
      $('.js-sg-all').addEventListener('click', open);
      img.addEventListener('click', open);
      img.classList.add('is-zoom');
      $('.js-sg-close').addEventListener('click', function () {
        box.close();
      });
      box.addEventListener('click', function (e) {
        if (e.target === box) {
          box.close();
        }
      });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          show(cur + (e.key === 'ArrowLeft' ? -1 : 1));
        }
      });
      var x0 = null;
      box.addEventListener('touchstart', function (e) {
        x0 = e.touches[0].clientX;
      }, { passive: true });
      box.addEventListener('touchend', function (e) {
        if (x0 === null) {
          return;
        }
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) {
          show(cur + (dx > 0 ? -1 : 1));
        }
        x0 = null;
      });
    } else {
      $('.js-sg-all').addEventListener('click', function () {
        show(cur + 1);
      });
    }
  }

  function initSingleFinance() {
    var card = $('.js-sg-fin');
    if (!card) {
      return;
    }
    var price = 0;
    var s = { dp: 20, term: 60, apr: 5.49, trade: false, cash: false };
    var range = $('.js-sg-range');

    function paint() {
      var down = Math.round(price * s.dp / 100);
      var trade = s.trade ? LSG_TRADE : 0;
      var amt = Math.max(0, price - down - trade);
      var r = s.apr / 1200;
      var mo = amt ? amt * r / (1 - Math.pow(1 + r, -s.term)) : 0;
      var it = Math.max(0, mo * s.term - amt);
      var tot = price + it;
      setText('.js-sg-mo', money(mo));
      setText('.js-sg-mo2', money(mo));
      setText('.js-sg-termn', s.term);
      setText('.js-sg-amt', money(amt));
      setText('.js-sg-int', money(it));
      setText('.js-sg-apr', s.apr + '%');
      setText('.js-sg-aprn', s.apr);
      setText('.js-sg-down', money(down));
      setText('.js-sg-cash', money(price));
      setText('.js-sg-dp', s.dp);
      var parts = { down: down, trade: trade, fin: amt, int: it };
      $$('.js-sg-seg').forEach(function (el) {
        var v = parts[el.getAttribute('data-k')];
        el.hidden = !v;
        el.style.width = (v / tot * 100).toFixed(2) + '%';
        $('.js-sg-segv', el).textContent = money(v);
      });
      $$('.js-sg-leg').forEach(function (el) {
        var v = parts[el.getAttribute('data-k')];
        el.hidden = !v;
        $('.js-sg-legv', el).textContent = money(v);
      });
      // the hero price: the same quote, or the cash total
      $('.js-sg-price').classList.toggle('is-cash', s.cash);
      setText('.js-sg-big', s.cash ? money(price) : money(mo));
      setText('.js-sg-unit', s.cash ? 'total' : '/ mo');
      setText('.js-sg-note', s.cash ? 'Includes inspection, detailing & 7-day return' :
        s.term + ' mo · ' + money(down) + ' down · ' + s.apr + '% APR' + (trade ? ' · trade-in applied' : ''));
    }

    // the car follows the accent: Ember has its own price, the green skin another
    function pickPrice() {
      price = parseFloat(card.getAttribute(root.getAttribute('data-skin') ? 'data-price-skin' : 'data-price'));
      paint();
    }
    new MutationObserver(pickPrice).observe(root, { attributes: true, attributeFilter: ['data-skin'] });

    range.addEventListener('input', function () {
      s.dp = parseInt(range.value, 10);
      paint();
    });
    $$('.js-sg-term').forEach(function (b, k, all) {
      b.addEventListener('click', function () {
        s.term = parseInt(b.getAttribute('data-term'), 10);
        all.forEach(function (x) {
          press(x, x === b);
        });
        paint();
      });
    });
    $$('.js-sg-tier').forEach(function (b, k, all) {
      b.addEventListener('click', function () {
        s.apr = parseFloat(b.getAttribute('data-apr'));
        all.forEach(function (x) {
          press(x, x === b);
        });
        paint();
      });
    });
    $('.js-sg-trade').addEventListener('click', function () {
      s.trade = !s.trade;
      this.setAttribute('aria-pressed', s.trade ? 'true' : 'false');
      paint();
    });
    $$('.js-sg-pay').forEach(function (b, k, all) {
      b.addEventListener('click', function () {
        s.cash = b.getAttribute('data-pay') === '1';
        all.forEach(function (x) {
          press(x, x === b);
        });
        paint();
      });
    });
    pickPrice();
  }

  function initSingleBits() {
    // reserve: the hero button and the sticky one share the state
    var res = false;
    $$('.js-sg-res').forEach(function (b) {
      b.addEventListener('click', function () {
        res = !res;
        $$('.js-sg-res').forEach(function (x) {
          x.setAttribute('aria-pressed', res ? 'true' : 'false');
        });
        setText('.js-sg-restxt', res ? '✓ Reserved · 48 h hold' : 'Reserve for $500');
      });
    });

    $$('.js-sg-fav').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        $('.js-sg-favi', b).textContent = on ? '♥' : '♡';
      });
    });
    $$('.js-sg-cmp').forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      });
    });

    // equipment tabs (arrow keys move between them) and "Show all"
    var tabs = $$('.js-sg-tab');
    var panels = $$('.js-sg-eq');
    function pick(i, focus) {
      tabs.forEach(function (t, k) {
        t.classList.toggle('is-on', k === i);
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
        t.tabIndex = k === i ? 0 : -1;
        panels[k].hidden = k !== i;
      });
      if (focus) {
        tabs[i].focus();
      }
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () {
        pick(k);
      });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          pick((k + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length, true);
        }
      });
    });
    $$('.js-sg-eqall').forEach(function (b) {
      b.addEventListener('click', function () {
        var all = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', all ? 'true' : 'false');
        $('.js-sg-eqs').classList.toggle('is-all', all);
        $('.js-sg-eqtxt', b).textContent = all ? 'Show by category' : 'Show all 64 options';
        if (all) {
          panels.forEach(function (p) {
            p.hidden = false;
          });
        } else {
          pick(tabs.findIndex(function (t) {
            return t.classList.contains('is-on');
          }));
        }
      });
    });

    // VIN copy
    $$('.js-sg-copy').forEach(function (b) {
      var t = null;
      b.addEventListener('click', function () {
        // two profiles in the markup: copy the VIN that is on screen
        var vin = $$('.js-sg-vin').filter(function (v) {
          return v.offsetParent !== null;
        }).concat($$('.js-sg-vin'))[0].textContent;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(vin).catch(function () {});
        }
        b.textContent = '✓ Copied';
        b.classList.add('is-done');
        window.clearTimeout(t);
        t = window.setTimeout(function () {
          b.textContent = 'Copy';
          b.classList.remove('is-done');
        }, 1600);
      });
    });

    // the report prints the page (save as PDF); in production link the inspection PDF
    $$('.js-sg-print').forEach(function (b) {
      b.addEventListener('click', function () {
        window.print();
      });
    });

    // opening hours: today's row
    var day = String(new Date().getDay());
    $$('.js-sg-hour').forEach(function (li) {
      li.classList.toggle('is-today', li.getAttribute('data-days').split(',').indexOf(day) > -1);
    });

    // sticky bar: in once the hero's bottom edge has scrolled out of view
    var hero = $('.js-sg-hero');
    var stk = $('.js-sg-stk');
    if (hero && stk) {
      var on = false;
      var check = function () {
        var now = hero.getBoundingClientRect().bottom < 0;
        if (now === on) {
          return;
        }
        on = now;
        stk.classList.toggle('is-on', on);
        stk.inert = !on;
        stk.setAttribute('aria-hidden', on ? 'false' : 'true');
      };
      window.addEventListener('scroll', check, { passive: true });
      check();
    }
  }

  /* Listing Single v2: the car as a story. Same finance formula and the same two cars as v1
     (Ember = Serpent Roadster 427, green = GTR); reserve, ♡, VIN copy, print and hours run
     through initSingleBits. The balance after k payments:
       balance_k = amount · ((1 + r)^n − (1 + r)^k) / ((1 + r)^n − 1)                    */
  var LSV_MARKET_APR = 7.9;

  function initListingSingle2() {
    var page = $('.js-sv');
    if (!page) {
      return;
    }
    var skin = function () {
      return root.getAttribute('data-skin') ? 1 : 0;
    };
    var title = function () {
      document.title = page.getAttribute(skin() ? 'data-title-skin' : 'data-title');
    };
    title();
    new MutationObserver(title).observe(root, { attributes: true, attributeFilter: ['data-skin'] });
    initSv2Gallery(skin);
    initSv2Finance(skin);
    initSv2Nav();
    initSv2Bits();
  }

  function svEsc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function initSv2Gallery(skin) {
    var mos = $('.js-sv-mos');
    var box = $('.js-sv-box');
    if (!mos) {
      return;
    }
    var sets = [JSON.parse(mos.getAttribute('data-frames')), JSON.parse(mos.getAttribute('data-frames-skin'))];
    var sizes = mos.getAttribute('data-sizes').split('|');
    var cat = 'All';
    var list = [];
    var cur = 0;
    var timer = null;

    function pad(n) {
      return String(n).padStart(2, '0');
    }

    // the same markup as build_listing_single2.tile()
    function render() {
      var all = sets[skin()];
      list = cat === 'All' ? all : all.filter(function (f) {
        return f[2] === cat;
      });
      mos.innerHTML = list.slice(0, 7).map(function (f, i) {
        var big = i === 0;
        var hasMore = i === 6 && list.length > 7;
        var inner = f[0] ? '<img src="assets/img/' + f[0] + '.webp" alt="" width="3000" height="2000" loading="lazy">' :
          hasMore ? '' : '<span class="lsv-tile__slot">' + svEsc(f[1]) + ' · ' + (big ? sizes[0] : sizes[1]) + '</span>';
        var more = hasMore ? '<span class="lsv-tile__more"><span class="lsv-tile__mn">+' + (list.length - 7) +
          '</span><span class="lsv-tile__mv">View all</span></span>' : '';
        return '<li class="lsv-mos__li' + (big ? ' lsv-mos__li--big' : '') + '"><button class="lsv-tile js-sv-tile" type="button" data-i="' + i +
          '" aria-label="Open photo ' + (i + 1) + ': ' + svEsc(f[1]) + '">' + inner + '<span class="lsv-tile__l">' + svEsc(f[1]) + '</span>' + more + '</button></li>';
      }).join('');
    }

    function show(i) {
      cur = (i + list.length) % list.length;
      var f = list[cur];
      var im = $('.js-sv-bimg');
      im.hidden = !f[0];
      $('.js-sv-bslot').hidden = !!f[0];
      if (f[0]) {
        im.src = 'assets/img/' + f[0] + '.webp';
        im.alt = f[1];
        [cur + 1, cur - 1].forEach(function (k) {
          var g = list[(k + list.length) % list.length];
          if (g[0]) {
            new Image().src = 'assets/img/' + g[0] + '.webp';
          }
        });
      }
      setText('.js-sv-bslotlbl', f[1]);
      setText('.js-sv-bnum', pad(cur + 1) + ' / ' + pad(list.length));
      setText('.js-sv-blbl', f[1]);
    }

    function stopSpin() {
      window.clearInterval(timer);
      timer = null;
      $$('.js-sv-spin').forEach(function (b) {
        b.setAttribute('aria-pressed', 'false');
      });
    }

    function open(i) {
      if (!box || typeof box.showModal !== 'function') {
        return;
      }
      show(i);
      if (!box.open) {
        box.showModal();
      }
    }

    $$('.js-sv-cat').forEach(function (b, k, all) {
      b.addEventListener('click', function () {
        cat = b.getAttribute('data-cat');
        all.forEach(function (x) {
          press(x, x === b);
        });
        render();
      });
    });
    mos.addEventListener('click', function (e) {
      var t = e.target.closest('.js-sv-tile');
      if (t) {
        open(parseInt(t.getAttribute('data-i'), 10));
      }
    });
    // the markup ships the Ember set: draw the mosaic for the accent in use, and again when it changes
    render();
    new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['data-skin'] });

    if (!box) {
      return;
    }
    // 360°: the lightbox walks round the four exterior frames until stopped (a spin viewer replaces it)
    $$('.js-sv-spin').forEach(function (b) {
      b.addEventListener('click', function () {
        if (timer) {
          stopSpin();
          return;
        }
        cat = 'All';
        $$('.js-sv-cat').forEach(function (x) {
          press(x, x.getAttribute('data-cat') === 'All');
        });
        render();
        open(0);
        b.setAttribute('aria-pressed', 'true');
        timer = window.setInterval(function () {
          show(cur < 3 ? cur + 1 : 0);
        }, 900);
      });
    });
    $('.js-sv-bprev').addEventListener('click', function () {
      stopSpin();
      show(cur - 1);
    });
    $('.js-sv-bnext').addEventListener('click', function () {
      stopSpin();
      show(cur + 1);
    });
    $('.js-sv-bclose').addEventListener('click', function () {
      box.close();
    });
    box.addEventListener('close', stopSpin);
    box.addEventListener('click', function (e) {
      if (e.target === box) {
        box.close();
      }
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        stopSpin();
        show(cur + (e.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    var x0 = null;
    box.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) {
        return;
      }
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) {
        stopSpin();
        show(cur + (dx > 0 ? -1 : 1));
      }
      x0 = null;
    });
  }

  function initSv2Finance(skin) {
    var card = $('.js-sv-fin');
    if (!card) {
      return;
    }
    var s = { dp: 20, term: 60, apr: 5.49, trade: false };
    var price = 0;
    var range = $('.js-sv-range');
    var names = ['Roadster 427', 'GTR'];

    function pay(amt, n, apr) {
      var r = apr / 1200;
      return amt ? amt * r / (1 - Math.pow(1 + r, -n)) : 0;
    }

    function paint() {
      var down = Math.round(price * s.dp / 100);
      var trade = s.trade ? LSG_TRADE : 0;
      var amt = Math.max(0, price - down - trade);
      var mo = pay(amt, s.term, s.apr);
      var it = Math.max(0, mo * s.term - amt);
      var tot = price + it;
      var mkt = pay(amt, s.term, LSV_MARKET_APR) - mo;
      setText('.js-sv-mo', money(mo));
      setText('.js-sg-cash', money(price));
      setText('.js-sv-pnote', s.term + ' mo · ' + money(down) + ' down · ' + s.apr + '% APR' + (trade ? ' · trade-in applied' : ''));
      setText('.js-sv-below', mkt > 0 ? money(mkt) + '/mo below avg. ' + names[skin()] + ' financing' : 'At market rate');
      setText('.js-sv-off', new Date(2026, 9 + s.term, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' }));
      setText('.js-sv-termn', s.term);
      setText('.js-sv-aprn', s.apr);
      setText('.js-sv-amt', money(amt));
      setText('.js-sv-down', money(down));
      setText('.js-sv-dp', s.dp);
      range.value = s.dp;

      // where the money goes: each part grows with its amount, never narrower than its label
      var parts = { down: down, trade: trade, fin: amt, int: it };
      $$('.js-sv-seg').forEach(function (el) {
        var v = parts[el.getAttribute('data-k')];
        el.hidden = !v;
        el.style.flexGrow = Math.round(v);
        $('.js-sv-segp', el).textContent = Math.round(v / tot * 100) + '%';
        $('.js-sv-segv', el).textContent = money(v);
      });

      // the balance curve on a 1000 × 200 box
      var r = s.apr / 1200;
      var gro = Math.pow(1 + r, s.term);
      var pts = [];
      for (var k = 0; k <= s.term; k++) {
        var bal = amt ? amt * (gro - Math.pow(1 + r, k)) / (gro - 1) : 0;
        pts.push((k / s.term * 1000).toFixed(1) + ',' + (200 - (amt ? bal / amt : 0) * 190).toFixed(1));
      }
      var line = 'M' + pts.join(' L');
      $('.js-sv-line').setAttribute('d', line);
      $('.js-sv-area').setAttribute('d', line + ' L1000,200 L0,200 Z');
      var years = '';
      for (var y = 0; y <= s.term / 12; y++) {
        var tx = y === 0 ? '0' : y * 12 === s.term ? '-100%' : '-50%';
        years += '<span data-x="' + (y * 12 / s.term * 100) + '" data-tx="' + tx + '">' + (2026 + y) + '</span>';
      }
      var yb = $('.js-sv-years');
      yb.innerHTML = years;
      $$('span', yb).forEach(function (sp) {
        sp.style.left = sp.getAttribute('data-x') + '%';
        sp.style.transform = 'translateX(' + sp.getAttribute('data-tx') + ')';
      });
    }

    function pick() {
      price = parseFloat(card.getAttribute(skin() ? 'data-price-skin' : 'data-price'));
      paint();
    }

    function sync() {
      $$('.js-sv-term').forEach(function (x) {
        press(x, parseInt(x.getAttribute('data-term'), 10) === s.term);
      });
      $$('.js-sv-tier').forEach(function (x) {
        press(x, parseFloat(x.getAttribute('data-apr')) === s.apr);
      });
      $('.js-sv-trade').setAttribute('aria-pressed', s.trade ? 'true' : 'false');
      paint();
    }

    range.addEventListener('input', function () {
      s.dp = parseInt(range.value, 10);
      paint();
    });
    $('.js-sv-dpm').addEventListener('click', function () {
      s.dp = Math.max(0, s.dp - 5);
      paint();
    });
    $('.js-sv-dpp').addEventListener('click', function () {
      s.dp = Math.min(60, s.dp + 5);
      paint();
    });
    $$('.js-sv-term').forEach(function (b) {
      b.addEventListener('click', function () {
        s.term = parseInt(b.getAttribute('data-term'), 10);
        sync();
      });
    });
    $$('.js-sv-tier').forEach(function (b) {
      b.addEventListener('click', function () {
        s.apr = parseFloat(b.getAttribute('data-apr'));
        sync();
      });
    });
    $('.js-sv-trade').addEventListener('click', function () {
      s.trade = !s.trade;
      sync();
    });
    $('.js-sv-reset').addEventListener('click', function () {
      s = { dp: 20, term: 60, apr: 5.49, trade: false };
      sync();
    });
    new MutationObserver(pick).observe(root, { attributes: true, attributeFilter: ['data-skin'] });
    pick();
  }

  // the section nav: the last section whose top has passed under the bar is active
  function initSv2Nav() {
    var bar = $('.js-sv-navbar');
    var links = $$('.js-sv-nav');
    if (!bar || !links.length) {
      return;
    }
    var secs = links.map(function (a) {
      return document.getElementById(a.getAttribute('href').slice(1));
    });
    var act = -2;
    function check() {
      var lim = bar.offsetHeight * 2.6;
      var now = -1;
      secs.forEach(function (sec, i) {
        if (sec && sec.getBoundingClientRect().top < lim) {
          now = i;
        }
      });
      if (now === act) {
        return;
      }
      act = now;
      links.forEach(function (a, i) {
        a.classList.toggle('is-on', i === now);
        if (i === now) {
          a.setAttribute('aria-current', 'true');
        } else {
          a.removeAttribute('aria-current');
        }
      });
      // on phones the links scroll sideways: keep the active one in view
      var box = links[0].parentNode;
      if (now > -1 && box.scrollWidth > box.clientWidth) {
        box.scrollTo({ left: links[now].offsetLeft - 16, behavior: 'smooth' });
      }
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  function initSv2Bits() {
    // accordion: one group open at a time; the open one closes on a second click
    var groups = $$('.js-sv-acc');
    groups.forEach(function (g) {
      $('.js-sv-accb', g).addEventListener('click', function () {
        var opening = !g.classList.contains('is-open');
        groups.forEach(function (x) {
          var on = opening && x === g;
          x.classList.toggle('is-open', on);
          $('.js-sv-accb', x).setAttribute('aria-expanded', on ? 'true' : 'false');
          $('.lsv-acc__ul', x).hidden = !on;
        });
      });
    });

    // condition map: a point on the photo and its row in the list are the same choice
    $$('.js-sv-spot').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = b.getAttribute('data-i');
        $$('.js-sv-spot').forEach(function (x) {
          var on = x.getAttribute('data-i') === i;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        $$('.lsv-det__body').forEach(function (body) {
          $$('.js-sv-note', body).forEach(function (n, k) {
            n.hidden = String(k) !== i;
          });
        });
      });
    });

    initSvRibbon();
  }

  /* Listing Single v3: the guided tour. The stage photo follows the section being read
     (data-ph on each section; -1 = the condition map); a thumbnail overrides it only while
     that section stays active. Finance, delivery and the bar share one state. */
  function initListingSingle3() {
    var page = $('.js-s3');
    if (!page) {
      return;
    }
    var skin = function () {
      return root.getAttribute('data-skin') ? 1 : 0;
    };
    var title = function () {
      document.title = page.getAttribute(skin() ? 'data-title-skin' : 'data-title');
    };
    title();
    new MutationObserver(title).observe(root, { attributes: true, attributeFilter: ['data-skin'] });
    var stage = initS3Stage(skin);
    initS3Finance(skin);
    initS3Bits(stage);
    initSvRibbon();
  }

  function initS3Stage(skin) {
    var st = $('.js-s3-stage');
    var split = $('.js-s3-split');
    var secs = $$('.js-s3-sec');
    var bar = $('.js-s3-bar');
    var labels = st.getAttribute('data-labels').split('|');
    var names = st.getAttribute('data-names').split('|');
    var act = -1;
    var ovr = null;
    var shown = null;

    function photo() {
      return ovr && ovr.sec === act ? ovr.ph : parseInt(secs[act].getAttribute('data-ph'), 10);
    }

    function paint() {
      var ph = photo();
      if (ph === shown) {
        return;
      }
      shown = ph;
      var map = ph === -1;
      $$('.js-s3-layer').forEach(function (l) {
        l.classList.toggle('is-on', !map && parseInt(l.getAttribute('data-i'), 10) === ph);
      });
      $('.js-s3-cmap').classList.toggle('is-on', map);
      $('.js-s3-cmap').inert = !map;
      setText('.js-s3-lbl', map ? 'Condition map' : labels[ph]);
      $$('.js-s3-th').forEach(function (b) {
        press(b, parseInt(b.getAttribute('data-i'), 10) === ph);
      });
    }

    function check() {
      var vh = window.innerHeight;
      var now = 0;
      secs.forEach(function (s, i) {
        if (s.getBoundingClientRect().top < vh * 0.45) {
          now = i;
        }
      });
      if (now !== act) {
        act = now;
        setText('.js-s3-num', String(act).padStart(2, '0'));
        setText('.js-s3-name', names[act]);
        $$('.lst-prog__s').forEach(function (g, i) {
          g.classList.toggle('is-on', i <= act);
        });
        paint();
      }
      // the bar shows while the split view is on screen
      var r = split.getBoundingClientRect();
      var on = r.top < vh * 0.6 && r.bottom > vh * 0.5;
      if (bar && bar.classList.contains('is-on') !== on) {
        bar.classList.toggle('is-on', on);
        bar.inert = !on;
        bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      }
    }

    $$('.js-s3-th').forEach(function (b) {
      b.addEventListener('click', function () {
        ovr = { sec: act, ph: parseInt(b.getAttribute('data-i'), 10) };
        paint();
      });
    });
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();

    // lightbox: "All 24 photos" opens at the photo on the stage; 360° walks the exterior frames
    var box = $('.js-s3-box');
    var lb = box && typeof box.showModal === 'function' ? svBox(box, 's3', function () {
      return JSON.parse(box.getAttribute(skin() ? 'data-frames-skin' : 'data-frames'));
    }) : null;
    $$('.js-s3-all').forEach(function (b) {
      b.addEventListener('click', function () {
        if (lb) {
          lb.open(Math.max(0, photo()));
        }
      });
    });
    $$('.js-s3-spin').forEach(function (b) {
      b.addEventListener('click', function () {
        if (lb) {
          lb.spin(b);
        }
      });
    });
    return { check: check };
  }

  // a lightbox over a frame list [file, label, category]; hooks js-<p>-b*
  function svBox(box, p, frames) {
    var list = [];
    var cur = 0;
    var timer = null;
    var spinBtn = null;
    function pad(n) {
      return String(n).padStart(2, '0');
    }
    function show(i) {
      cur = (i + list.length) % list.length;
      var f = list[cur];
      var im = $('.js-' + p + '-bimg', box);
      im.hidden = !f[0];
      $('.js-' + p + '-bslot', box).hidden = !!f[0];
      if (f[0]) {
        im.src = 'assets/img/' + f[0] + '.webp';
        im.alt = f[1];
      }
      $('.js-' + p + '-bslotlbl', box).textContent = f[1];
      $('.js-' + p + '-bnum', box).textContent = pad(cur + 1) + ' / ' + pad(list.length);
      $('.js-' + p + '-blbl', box).textContent = f[1];
    }
    function stop() {
      window.clearInterval(timer);
      timer = null;
      if (spinBtn) {
        spinBtn.setAttribute('aria-pressed', 'false');
      }
    }
    function open(i) {
      list = frames();
      show(i);
      if (!box.open) {
        box.showModal();
      }
    }
    $('.js-' + p + '-bprev', box).addEventListener('click', function () {
      stop();
      show(cur - 1);
    });
    $('.js-' + p + '-bnext', box).addEventListener('click', function () {
      stop();
      show(cur + 1);
    });
    $('.js-' + p + '-bclose', box).addEventListener('click', function () {
      box.close();
    });
    box.addEventListener('close', stop);
    box.addEventListener('click', function (e) {
      if (e.target === box) {
        box.close();
      }
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        stop();
        show(cur + (e.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    var x0 = null;
    box.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) {
        return;
      }
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) {
        stop();
        show(cur + (dx > 0 ? -1 : 1));
      }
      x0 = null;
    });
    return {
      open: open,
      spin: function (btn) {
        if (timer) {
          stop();
          return;
        }
        spinBtn = btn;
        open(0);
        btn.setAttribute('aria-pressed', 'true');
        timer = window.setInterval(function () {
          show(cur < 3 ? cur + 1 : 0);
        }, 900);
      }
    };
  }

  function initS3Finance(skin) {
    var card = $('.js-s3-fin');
    if (!card) {
      return;
    }
    var s = { dp: 20, term: 60, apr: 5.49, trade: false };
    var price = 0;
    var range = $('.js-s3-range');
    function paint() {
      var down = Math.round(price * s.dp / 100);
      var trade = s.trade ? LSG_TRADE : 0;
      var amt = Math.max(0, price - down - trade);
      var r = s.apr / 1200;
      var mo = amt ? amt * r / (1 - Math.pow(1 + r, -s.term)) : 0;
      setText('.js-s3-mo', money(mo));
      setText('.js-sg-cash', money(price));
      setText('.js-s3-note2', s.term + ' mo · ' + money(down) + ' down · ' + s.apr + '% APR' + (trade ? ' · trade-in applied' : ''));
      setText('.js-s3-off', new Date(2026, 9 + s.term, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' }));
      setText('.js-s3-down', money(down));
      setText('.js-s3-dp', s.dp);
      range.value = s.dp;
    }
    function pick() {
      price = parseFloat(card.getAttribute(skin() ? 'data-price-skin' : 'data-price'));
      paint();
    }
    range.addEventListener('input', function () {
      s.dp = parseInt(range.value, 10);
      paint();
    });
    $$('.js-s3-term').forEach(function (b, k, all) {
      b.addEventListener('click', function () {
        s.term = parseInt(b.getAttribute('data-term'), 10);
        all.forEach(function (x) {
          press(x, x === b);
        });
        paint();
      });
    });
    $$('.js-s3-tier').forEach(function (b, k, all) {
      b.addEventListener('click', function () {
        s.apr = parseFloat(b.getAttribute('data-apr'));
        all.forEach(function (x) {
          press(x, x === b);
        });
        paint();
      });
    });
    $('.js-s3-trade').addEventListener('click', function () {
      s.trade = !s.trade;
      this.setAttribute('aria-pressed', s.trade ? 'true' : 'false');
      paint();
    });
    new MutationObserver(pick).observe(root, { attributes: true, attributeFilter: ['data-skin'] });
    pick();
  }

  function initS3Bits() {
    // condition: a point on the stage and its row are one choice
    $$('.js-s3-spot').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = b.getAttribute('data-i');
        $$('.js-s3-spot').forEach(function (x) {
          var on = x.getAttribute('data-i') === i;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        $$('.js-s3-condlist').forEach(function (l) {
          $$('.js-s3-note', l).forEach(function (n, k) {
            n.hidden = String(k) !== i;
          });
        });
      });
    });

    // all 64 options
    $$('.js-s3-opts').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        $('#' + b.getAttribute('aria-controls')).hidden = !open;
        $('.js-s3-optstxt', b).textContent = open ? 'Hide options −' : 'All 64 options +';
      });
    });

    // pickup or delivery → the chip in the bar
    $$('.js-s3-del').forEach(function (r) {
      r.addEventListener('change', function () {
        if (r.checked) {
          setText('.js-s3-delshort', r.getAttribute('data-short'));
        }
      });
    });
  }

  // ribbon arrows (v2 / v3): one card at a time
  function initSvRibbon() {
    function step(dir) {
      var rib = $$('.js-sv-rib').filter(function (r) {
        return r.offsetParent !== null;
      })[0];
      if (!rib || !rib.firstElementChild) {
        return;
      }
      var gap = parseFloat(getComputedStyle(rib).columnGap) || 0;
      rib.scrollBy({ left: dir * (rib.firstElementChild.offsetWidth + gap), behavior: 'smooth' });
    }
    $$('.js-sv-ribp').forEach(function (b) {
      b.addEventListener('click', function () {
        step(-1);
      });
    });
    $$('.js-sv-ribn').forEach(function (b) {
      b.addEventListener('click', function () {
        step(1);
      });
    });
  }

  /* Listing Single v4: the decision dashboard. One finance state drives the price tile, the
     finance strip, the "Monthly" row of the comps and the all-in cost; the cost-to-own lines are
     base + rate × miles (data-model on each car's list). Figures are illustrative. */
  function initListingSingle4() {
    var page = $('.js-s4');
    if (!page) {
      return;
    }
    var skin = function () {
      return root.getAttribute('data-skin') ? 1 : 0;
    };
    var title = function () {
      document.title = page.getAttribute(skin() ? 'data-title-skin' : 'data-title');
    };
    title();
    new MutationObserver(title).observe(root, { attributes: true, attributeFilter: ['data-skin'] });
    initS4Gallery(skin);
    initS4Money(skin);
    initS4Bits();
  }

  function initS4Gallery(skin) {
    var main = $('.js-s4-main');
    if (!main) {
      return;
    }
    var frames = parseInt(main.getAttribute('data-frames'), 10);
    var sets = [main.getAttribute('data-photos').split(','), main.getAttribute('data-photos-skin').split(',')];
    var labelSets = [main.getAttribute('data-labels').split('|'), main.getAttribute('data-labels-skin').split('|')];
    var img = $('.js-s4-img');
    var slot = $('.js-s4-slot');
    var cur = 0;

    function label(i) {
      return labelSets[skin()][i] || 'Detail ' + String(i + 1).padStart(2, '0');
    }

    function show(i) {
      cur = (i + frames) % frames;
      var photos = sets[skin()];
      var real = cur < photos.length;
      img.hidden = !real;
      slot.hidden = real;
      if (real) {
        img.src = 'assets/img/' + photos[cur] + '.webp';
        img.alt = label(cur);
      } else {
        setText('.js-s4-slotlbl', label(cur));
      }
      setText('.js-s4-num', String(cur + 1).padStart(2, '0'));
      setText('.js-s4-lbl', label(cur));
      $$('.js-s4-dot').forEach(function (d, k) {
        press(d, k === cur);
      });
    }

    $$('.js-s4-prev').forEach(function (b) {
      b.addEventListener('click', function () {
        show(cur - 1);
      });
    });
    $$('.js-s4-next').forEach(function (b) {
      b.addEventListener('click', function () {
        show(cur + 1);
      });
    });
    $$('.js-s4-dot').forEach(function (d) {
      d.addEventListener('click', function () {
        show(parseInt(d.getAttribute('data-i'), 10));
      });
    });
    show(0);
    new MutationObserver(function () {
      show(cur);
    }).observe(root, { attributes: true, attributeFilter: ['data-skin'] });

    var box = $('.js-s4-box');
    var lb = box && typeof box.showModal === 'function' ? svBox(box, 's4', function () {
      return JSON.parse(box.getAttribute(skin() ? 'data-frames-skin' : 'data-frames'));
    }) : null;
    if (lb) {
      $$('.js-s4-all').forEach(function (b) {
        b.addEventListener('click', function () {
          lb.open(cur);
        });
      });
      img.addEventListener('click', function () {
        lb.open(cur);
      });
      $$('.js-s4-spin').forEach(function (b) {
        b.addEventListener('click', function () {
          lb.spin(b);
        });
      });
    }
  }

  function initS4Money(skin) {
    var card = $('.js-s4-fin');
    if (!card) {
      return;
    }
    var s = { dp: 20, term: 60, apr: 5.49, mi: 7500 };
    var price = 0;
    var range = $('.js-s4-range');

    function pay(p) {
      var amt = Math.max(0, p - Math.round(p * s.dp / 100));
      var r = s.apr / 1200;
      return amt ? amt * r / (1 - Math.pow(1 + r, -s.term)) : 0;
    }

    function paint() {
      var down = Math.round(price * s.dp / 100);
      var mo = pay(price);
      setText('.js-s4-mo', money(mo));
      setText('.js-sg-cash', money(price));
      setText('.js-s4-note', s.term + ' mo · ' + money(down) + ' down · ' + s.apr + '% APR');
      setText('.js-s4-down', money(down));
      setText('.js-s4-dp', s.dp);
      setText('.js-s4-termn', s.term);
      range.value = s.dp;
      $$('.js-s4-cmo').forEach(function (c) {
        $('.lsx-cmp__v', c).textContent = money(pay(parseFloat(c.getAttribute('data-price'))));
      });
      // cost to own for the car on screen
      var running = 0;
      $$('.js-s4-cost').forEach(function (list) {
        var model = JSON.parse(list.getAttribute('data-model'));
        var vals = model.map(function (m) {
          return m[0] + m[1] * s.mi;
        });
        var top = Math.max.apply(null, vals);
        $$('.js-s4-cfill', list).forEach(function (f, k) {
          f.style.width = (vals[k] / top * 100).toFixed(1) + '%';
        });
        $$('.js-s4-cval', list).forEach(function (v, k) {
          v.textContent = money(vals[k]);
        });
        if (list.offsetParent !== null || !running) {
          running = vals.reduce(function (t, v) {
            return t + v;
          }, 0);
        }
      });
      setText('.js-s4-runmo', money(running / 12));
      setText('.js-s4-runyr', money(running));
      setText('.js-s4-allin', money(running / 12 + mo));
    }

    function pick() {
      price = parseFloat(card.getAttribute(skin() ? 'data-price-skin' : 'data-price'));
      paint();
    }

    function group(sel, key, attr, parse) {
      $$(sel).forEach(function (b, k, all) {
        b.addEventListener('click', function () {
          s[key] = parse(b.getAttribute(attr));
          all.forEach(function (x) {
            press(x, x === b);
          });
          paint();
        });
      });
    }

    range.addEventListener('input', function () {
      s.dp = parseInt(range.value, 10);
      paint();
    });
    group('.js-s4-term', 'term', 'data-term', function (v) {
      return parseInt(v, 10);
    });
    group('.js-s4-tier', 'apr', 'data-apr', parseFloat);
    group('.js-s4-mi', 'mi', 'data-mi', function (v) {
      return parseInt(v, 10);
    });
    // the visible cost list changes with the car (offsetParent reads the new styles at once)
    new MutationObserver(pick).observe(root, { attributes: true, attributeFilter: ['data-skin'] });
    pick();
  }

  function initS4Bits() {
    // share: copy the address
    $$('.js-s4-share').forEach(function (b) {
      var t = null;
      b.addEventListener('click', function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(location.href).catch(function () {});
        }
        $('.js-s4-sharetxt', b).textContent = '✓ Link copied';
        window.clearTimeout(t);
        t = window.setTimeout(function () {
          $('.js-s4-sharetxt', b).textContent = 'Share';
        }, 1600);
      });
    });
    // compare: initSingleBits flips aria-pressed first, this keeps the label in step
    $$('.js-s4-cmp').forEach(function (b) {
      b.addEventListener('click', function () {
        $('.js-s4-cmptxt', b).textContent = b.getAttribute('aria-pressed') === 'true' ? '✓ In compare' : '⇄ Compare';
      });
    });
    // price alert
    $$('.js-s4-alert').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        $('.js-s4-alerttxt', b).textContent = on ? '✓ Alert on · we’ll email you' : 'Alert me if the price drops';
      });
    });
    // equipment: one group open at a time, full width
    var groups = $$('.js-s4-eq');
    groups.forEach(function (g) {
      $('.js-s4-eqb', g).addEventListener('click', function () {
        var opening = !g.classList.contains('is-open');
        groups.forEach(function (x) {
          var on = opening && x === g;
          x.classList.toggle('is-open', on);
          $('.js-s4-eqb', x).setAttribute('aria-expanded', on ? 'true' : 'false');
        });
      });
    });
    // test-drive slot
    $$('.js-s4-slot').forEach(function (b, k, all) {
      b.addEventListener('click', function () {
        all.forEach(function (x) {
          press(x, x === b);
        });
        setText('.js-s4-slotcta', 'Book ' + $('.lsx-slot__d', b).textContent.toLowerCase() + ' · ' + $('.lsx-slot__h', b).textContent);
      });
    });
    // quick questions fill the input; a second tap clears it
    var input = $('.js-s4-askin');
    $$('.js-s4-q').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        $$('.js-s4-q').forEach(function (x) {
          press(x, on && x.getAttribute('data-i') === b.getAttribute('data-i') && x.parentNode === b.parentNode);
        });
        if (input) {
          input.value = on ? b.textContent : '';
        }
      });
    });
    // the question goes on to the contact page (wire it to chat in production)
    $$('.lsx-ask').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        location.href = 'contact.html';
      });
    });
    // bottom bar on small screens: once the price tile has left the screen
    var bar = $('.js-s4-mbar');
    var tile = $('.lsx-price');
    if (bar && tile) {
      var check = function () {
        var on = tile.getBoundingClientRect().bottom < 0;
        if (bar.classList.contains('is-on') !== on) {
          bar.classList.toggle('is-on', on);
          bar.inert = !on;
          bar.setAttribute('aria-hidden', on ? 'false' : 'true');
        }
      };
      window.addEventListener('scroll', check, { passive: true });
      check();
    }
  }

  /* Listing Single v5: the cinematic story. Add-ons are real checkboxes; the summary lists the
     base car and every ticked add-on, and finances the total on the default terms:
       monthly = (total − base · 20 % − trade) · r / (1 − (1 + r)^−60),  r = 5.49 / 1200 */
  var LSW_TERMS = { dp: 20, term: 60, apr: 5.49 };

  function initListingSingle5() {
    var page = $('.js-s5');
    if (!page) {
      return;
    }
    var skin = function () {
      return root.getAttribute('data-skin') ? 1 : 0;
    };
    var r = LSW_TERMS.apr / 1200;
    var per = function (v) {
      return v > 0 ? v * r / (1 - Math.pow(1 + r, -LSW_TERMS.term)) : 0;
    };
    var sum = $('.js-s5-sum');
    var adds = $$('.js-s5-add');

    function paint() {
      document.title = page.getAttribute(skin() ? 'data-title-skin' : 'data-title');
      var base = parseFloat(sum.getAttribute(skin() ? 'data-price-skin' : 'data-price'));
      var down = Math.round(base * LSW_TERMS.dp / 100);
      setText('.js-sg-cash', money(base));
      setText('.js-s5-mo', money(per(base - down)));
      // the summary: base line stays, add-on lines follow the ticks
      var list = $('.js-s5-lines');
      $$('.lsw-sum__l--add', list).forEach(function (li) {
        li.remove();
      });
      var total = base;
      adds.forEach(function (a) {
        if (!a.checked) {
          return;
        }
        var p = parseFloat(a.getAttribute('data-price'));
        total += p;
        var li = document.createElement('li');
        li.className = 'lsw-sum__l lsw-sum__l--add';
        li.innerHTML = '<span class="lsw-sum__lk"></span><span></span>';
        li.firstChild.textContent = a.getAttribute(skin() ? 'data-name-skin' : 'data-name');
        li.lastChild.textContent = '+' + money(p);
        list.appendChild(li);
      });
      setText('.js-s5-total', money(total));
      setText('.js-s5-summo', money(per(total - down)));
      setText('.js-s5-monote', LSW_TERMS.term + ' mo · ' + LSW_TERMS.dp + ' % down · ' + LSW_TERMS.apr + ' % APR');
      $$('.js-s5-pm').forEach(function (s) {
        s.textContent = money(per(parseFloat(s.getAttribute('data-price'))));
      });
    }
    adds.forEach(function (a) {
      a.addEventListener('change', paint);
    });
    new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ['data-skin'] });
    paint();

    // film strip: arrows by one frame, the counter from the scroll position
    function strip() {
      return $$('.js-s5-film').filter(function (f) {
        return f.offsetParent !== null;
      })[0];
    }
    function step() {
      var f = strip();
      if (!f || !f.firstElementChild) {
        return 0;
      }
      return f.firstElementChild.offsetWidth + (parseFloat(getComputedStyle(f).columnGap) || 0);
    }
    function count() {
      var f = strip();
      if (!f) {
        return;
      }
      var n = f.children.length;
      var i = Math.min(n - 1, Math.round(f.scrollLeft / (step() || 1)));
      setText('.js-s5-fnum', String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0'));
    }
    $$('.js-s5-film').forEach(function (f) {
      f.addEventListener('scroll', count, { passive: true });
    });
    $$('.js-s5-fprev').forEach(function (b) {
      b.addEventListener('click', function () {
        strip().scrollBy({ left: -step(), behavior: 'smooth' });
      });
    });
    $$('.js-s5-fnext').forEach(function (b) {
      b.addEventListener('click', function () {
        strip().scrollBy({ left: step(), behavior: 'smooth' });
      });
    });

    var box = $('.js-s5-box');
    if (box && typeof box.showModal === 'function') {
      var lb = svBox(box, 's5', function () {
        return JSON.parse(box.getAttribute(skin() ? 'data-frames-skin' : 'data-frames'));
      });
      $$('.js-s5-frame').forEach(function (b) {
        b.addEventListener('click', function () {
          lb.open(parseInt(b.getAttribute('data-i'), 10));
        });
      });
    }

    // small screens: the price pill becomes a bottom bar once the hero has gone
    var bar = $('.js-s5-mbar');
    var hero = $('.js-sg-hero');
    if (bar && hero) {
      var check = function () {
        var on = hero.getBoundingClientRect().bottom < 0;
        if (bar.classList.contains('is-on') !== on) {
          bar.classList.toggle('is-on', on);
          bar.inert = !on;
          bar.setAttribute('aria-hidden', on ? 'false' : 'true');
        }
      };
      window.addEventListener('scroll', check, { passive: true });
      check();
    }
  }

  /* Listing Single v6: questions + the advisor chat. The chat answers locally from the car's
     knowledge base (data-kb, per car). To use a real assistant, set data-endpoint on the chat:
     the page POSTs { facts, messages: [{ role: 'user' | 'assistant', content }] } and expects
     { reply } back — keep the "only these facts" rule on the server and label the chat as AI. */
  function initListingSingle6() {
    var page = $('.js-s6');
    if (!page) {
      return;
    }
    var skin = function () {
      return root.getAttribute('data-skin') ? 1 : 0;
    };
    var s = { dp: 20, term: 60, apr: 5.49 };
    var fin = $('.js-s6-fin');
    var range = $('.js-s6-range');
    var mo = 0;

    function paint() {
      document.title = page.getAttribute(skin() ? 'data-title-skin' : 'data-title');
      var price = parseFloat(fin.getAttribute(skin() ? 'data-price-skin' : 'data-price'));
      var down = Math.round(price * s.dp / 100);
      var amt = price - down;
      var r = s.apr / 1200;
      mo = amt * r / (1 - Math.pow(1 + r, -s.term));
      setText('.js-s6-mo', money(mo));
      setText('.js-sg-cash', money(price));
      setText('.js-s6-down', money(down));
      setText('.js-s6-dp', s.dp);
      setText('.js-s6-termn', s.term);
      setText('.js-s6-aprn', s.apr);
      setText('.js-s6-off', new Date(2026, 9 + s.term, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' }));
      range.value = s.dp;
    }
    range.addEventListener('input', function () {
      s.dp = parseInt(range.value, 10);
      paint();
    });
    [['.js-s6-term', 'term', 'data-term'], ['.js-s6-tier', 'apr', 'data-apr']].forEach(function (g) {
      $$(g[0]).forEach(function (b, k, all) {
        b.addEventListener('click', function () {
          s[g[1]] = parseFloat(b.getAttribute(g[2]));
          all.forEach(function (x) {
            press(x, x === b);
          });
          paint();
        });
      });
    });
    new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ['data-skin'] });
    paint();

    // all 64 options
    $$('.js-s6-opts').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        $('#' + b.getAttribute('aria-controls')).hidden = !open;
        $('.js-s6-optstxt', b).textContent = open ? 'Hide options −' : 'All 64 options +';
      });
    });
    // test-drive slot
    $$('.js-s6-slot').forEach(function (b, k, all) {
      b.addEventListener('click', function () {
        all.forEach(function (x) {
          press(x, x === b);
        });
        setText('.js-s6-slotcta', 'Book ' + $('.lsy-slot__d', b).textContent.toLowerCase() + ' · ' + $('.lsy-slot__h', b).textContent);
      });
    });
    // the drive video plays in its tile: the clip of the car on screen
    $$('.js-s6-video').forEach(function (tile) {
      var vids = $$('.js-s6-v', tile); // [Ember car, green car]
      $('.js-s6-play', tile).addEventListener('click', function () {
        var v = vids[skin()];
        vids.forEach(function (x) {
          x.hidden = x !== v;
        });
        tile.classList.add('is-playing');
        v.play().catch(function () {});
      });
      // the accent changed while a clip was open: stop it and show the other car's poster
      new MutationObserver(function () {
        vids.forEach(function (x) {
          x.pause();
          x.hidden = true;
        });
        tile.classList.remove('is-playing');
      }).observe(root, { attributes: true, attributeFilter: ['data-skin'] });
    });

    initS6Chat(skin, function () {
      return { mo: money(mo), dp: s.dp, term: s.term, apr: s.apr };
    });
    initSvRibbon();
  }

  function initS6Chat(skin, live) {
    var chat = $('.js-s6-chat');
    if (!chat) {
      return;
    }
    var list = $('.js-s6-msgs');
    var input = $('.js-s6-in');
    var go = $('.js-s6-go');
    var fab = $('.js-s6-fab');
    var welcome = list.innerHTML;
    var history = [];
    var busy = false;

    function add(role, text) {
      var li = document.createElement('li');
      li.className = 'lsy-msg lsy-msg--' + (role === 'user' ? 'me' : 'bot');
      var b = document.createElement('span');
      b.className = 'lsy-msg__b';
      b.textContent = text;
      li.appendChild(b);
      list.appendChild(li);
      list.scrollTop = list.scrollHeight;
      return li;
    }

    function local(q) {
      var kb = JSON.parse(chat.getAttribute(skin() ? 'data-kb-skin' : 'data-kb'));
      var v = live();
      var hit = kb.rules.filter(function (rule) {
        return new RegExp(rule[0], 'i').test(q);
      })[0];
      return (hit ? hit[1] : kb.fallback).replace('{mo}', v.mo).replace('{dp}', v.dp).replace('{term}', v.term).replace('{apr}', v.apr);
    }

    function remote(endpoint) {
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facts: chat.getAttribute(skin() ? 'data-facts-skin' : 'data-facts'),
          messages: history.map(function (m) {
            return { role: m.role, content: m.text };
          })
        })
      }).then(function (r) {
        return r.json();
      }).then(function (d) {
        return d.reply;
      });
    }

    function ask(text) {
      var q = (text || '').trim();
      if (!q || busy) {
        return;
      }
      busy = true;
      go.disabled = true;
      add('user', q);
      history.push({ role: 'user', text: q });
      var typing = document.createElement('li');
      typing.className = 'lsy-msg lsy-msg--bot';
      typing.innerHTML = '<span class="lsy-msg__b lsy-typing" aria-label="Jordan is typing"><span></span><span></span><span></span></span>';
      list.appendChild(typing);
      list.scrollTop = list.scrollHeight;
      var endpoint = chat.getAttribute('data-endpoint');
      var answer = endpoint ? remote(endpoint) : new Promise(function (res) {
        window.setTimeout(function () {
          res(local(q));
        }, 700 + Math.min(900, q.length * 12));
      });
      answer.catch(function () {
        return 'Sorry — I can’t reach my notes right now. Call me on +1 310 555 0142 and I’ll answer straight away.';
      }).then(function (reply) {
        typing.remove();
        add('assistant', reply);
        history.push({ role: 'assistant', text: reply });
        busy = false;
        go.disabled = false;
      });
    }

    function open() {
      chat.classList.add('is-open');
      if (fab) {
        fab.setAttribute('aria-expanded', 'true');
      }
    }

    $('.js-s6-form').addEventListener('submit', function (e) {
      e.preventDefault();
      ask(input.value);
      input.value = '';
    });
    $$('.js-s6-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        ask(b.textContent);
      });
    });
    $$('.js-s6-heroform').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var hin = $('.js-s6-heroin', f);
        ask(hin.value || 'What should I know before buying this car?');
        hin.value = '';
        open();
        if (window.matchMedia('(min-width: 1200px)').matches) {
          chat.scrollIntoView({ block: 'nearest' });
        }
      });
    });
    $$('.js-s6-new').forEach(function (b) {
      b.addEventListener('click', function () {
        if (busy) {
          return;
        }
        list.innerHTML = welcome;
        history = [];
      });
    });
    // phones: the chat is a bottom sheet behind the floating button
    if (fab) {
      fab.addEventListener('click', function () {
        open();
        input.focus();
      });
    }
    function close() {
      if (!chat.classList.contains('is-open')) {
        return;
      }
      chat.classList.remove('is-open');
      if (fab) {
        fab.setAttribute('aria-expanded', 'false');
        fab.focus();
      }
    }
    $$('.js-s6-close').forEach(function (b) {
      b.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        close();
      }
    });
  }

  /* 22. Shop v1 ------------------------------------------------------- */
  // The catalog is data on .js-shp (data-catalog). Fitment (sample): with "Fits my car" on, Parts
  // show only items that fit the chosen car; a car without fitment data shows universal items only;
  // Care / Accessories / Merch always show. The cart is { id: qty } in localStorage "avava-cart".
  var SHP_FREE = 150;
  var SHP_SHIP = 12;
  var SHP_TAX = 0.095;

  function initShop() {
    var box = $('.js-shp');
    if (!box) {
      return;
    }
    var data = JSON.parse(box.getAttribute('data-catalog'));
    var P = data.products.map(function (p) {
      return { id: p[0], name: p[1], brand: p[2], cat: p[3], price: p[4], was: p[5], fits: !!p[6], rt: p[7], rn: p[8], badge: p[9], stock: !!p[10], img: p[11] };
    });
    var s = { q: '', make: 'Sportcar-AMG', model: 'GTR', year: '2019', fit: true, stock: false, cat: [], br: [], pr: -1, sort: 0, n: data.per };
    var grid = $('.js-shp-grid');
    var selMake = $('.js-shp-make');
    var selModel = $('.js-shp-model');
    var selYear = $('.js-shp-year');
    var fitOk = 'M5 12.5l4.5 4.5L19 7.5';
    var fitNo = 'M12 8v5M12 16.5v.01';
    var cart = shopLoad();

    function car() {
      var any = s.make === 'Any make';
      return { any: any, mine: s.make === data.fit[0] && s.model === data.fit[1], name: any ? 'No car selected' : s.year + ' ' + s.make + ' ' + s.model };
    }

    function list() {
      var c = car();
      var q = s.q.toLowerCase();
      var band = s.pr > -1 ? data.prices[s.pr] : null;
      var L = P.filter(function (p) {
        return (!s.cat.length || s.cat.indexOf(p.cat) > -1) &&
          (!s.br.length || s.br.indexOf(p.brand) > -1) &&
          (!band || (p.price >= band[1] && p.price < band[2])) &&
          (!s.stock || p.stock) &&
          (!s.fit || c.any || p.fits || p.cat !== 'Parts' || c.mine) &&
          (!q || (p.name + ' ' + p.brand + ' ' + p.cat).toLowerCase().indexOf(q) > -1);
      });
      if (s.fit && !c.any && !c.mine) {
        L = L.filter(function (p) {
          return p.cat !== 'Parts' && !p.fits;
        });
      }
      var by = [function (a, b) { return b.rn - a.rn; }, function (a, b) { return a.price - b.price; },
        function (a, b) { return b.price - a.price; }, function (a, b) { return (b.badge === 'New') - (a.badge === 'New') || b.rn - a.rn; }];
      return L.slice().sort(by[s.sort]);
    }

    // the same markup as build_shop1.card()
    function cardHtml(p) {
      var c = car();
      var uni = p.cat !== 'Parts' && !p.fits;
      var ok = uni || (c.mine && p.fits);
      var fit = uni ? 'Universal' : ok ? 'Fits your ' + s.model : c.any ? 'Select a car to check fit' : 'Check fitment';
      var n = cart[p.id] || 0;
      var badges = (p.was ? '<span class="shp-badge shp-badge--sale">−' + Math.round((1 - p.price / p.was) * 100) + '%</span>' : '') +
        (p.badge ? '<span class="shp-badge' + (p.badge === 'New' ? ' shp-badge--new' : '') + '">' + svEsc(p.badge) + '</span>' : '');
      return '<li class="shp-card js-shp-card' + (n ? ' is-in' : '') + '" data-id="' + p.id + '"><span class="shp-card__ph">' + shopImg(p.img, 'shp-card__img', '<span class="shp-card__slot">488 × 320 · @2x 976 × 640</span>') +
        '<span class="shp-badges">' + badges + '</span></span><span class="shp-card__b"><span class="shp-card__meta"><span>' + svEsc(p.brand) + '</span><span>★ ' + p.rt +
        ' <span class="shp-card__rn">(' + p.rn + ')</span></span></span><span class="shp-card__n">' + svEsc(p.name) + '</span>' +
        '<span class="shp-card__fit' + (ok ? ' is-ok' : '') + '"><svg class="ico i14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' +
        (ok ? fitOk : fitNo) + '"/></svg>' + fit + '</span><span class="shp-card__foot"><span class="shp-card__price"><span class="shp-card__v' + (p.was ? ' is-sale' : '') + '">' + money(p.price) + '</span>' +
        (p.was ? '<s class="shp-card__was">' + money(p.was) + '</s>' : '') + '</span><button class="shp-add js-shp-add' + (n ? ' is-in' : '') + '" type="button" data-id="' + p.id +
        '"><span class="js-shp-addtxt">' + (n ? '✓ In cart · ' + n : 'Add') + '</span></button></span></span></li>';
    }

    function paint() {
      var c = car();
      var L = list();
      var shown = Math.min(L.length, s.n);
      grid.innerHTML = L.slice(0, shown).map(cardHtml).join('');
      setText('.js-shp-count', L.length);
      setText('.js-shp-shown', shown);
      $('.js-shp-empty').hidden = L.length > 0;
      $('.js-shp-more').hidden = shown >= L.length;
      // the car status
      var chip = $('.js-shp-carchip');
      chip.classList.toggle('is-ok', c.mine);
      chip.classList.toggle('is-none', c.any);
      setText('.js-shp-cartxt', c.any ? 'No car selected' : (c.mine ? '✓ ' : '') + c.name);
      setText('.js-shp-carsub', c.any ? 'Pick your car to see only parts that fit.' : c.mine ?
        'Parts are filtered to fit your car — care, accessories and merch are universal.' : 'Fitment data for this model is limited — showing universal products only.');
      setText('.js-shp-fitsub', c.any ? 'Select a car above' : c.name);
      $('.js-shp-fit').setAttribute('aria-pressed', s.fit ? 'true' : 'false');
      $('.js-shp-stock').setAttribute('aria-pressed', s.stock ? 'true' : 'false');
      // filters ↔ controls
      $$('.js-shp-cat').forEach(function (b) {
        b.setAttribute('aria-pressed', s.cat.length === 1 && s.cat[0] === b.getAttribute('data-cat') ? 'true' : 'false');
      });
      $$('input[id^="shp-cat-"]').forEach(function (i) {
        i.checked = s.cat.indexOf(i.value) > -1;
      });
      $$('input[id^="shp-brand-"]').forEach(function (i) {
        i.checked = s.br.indexOf(i.value) > -1;
      });
      $$('.js-shp-pr').forEach(function (b) {
        press(b, parseInt(b.getAttribute('data-i'), 10) === s.pr);
      });
      $$('.js-shp-sort').forEach(function (b) {
        press(b, parseInt(b.getAttribute('data-i'), 10) === s.sort);
      });
      // active chips: each × removes its filter
      var act = s.cat.map(function (t) { return ['cat', t, t]; })
        .concat(s.br.map(function (t) { return ['br', t, t]; }))
        .concat(s.pr > -1 ? [['pr', '', data.prices[s.pr][0]]] : [])
        .concat(s.stock ? [['stock', '', 'In stock']] : [])
        .concat(s.q ? [['q', '', '“' + s.q + '”']] : []);
      $('.js-shp-active').innerHTML = act.map(function (a) {
        return '<li><button class="shp-active__b js-shp-x" type="button" data-k="' + a[0] + '" data-v="' + svEsc(a[1]) + '">' + svEsc(a[2]) +
          '<span class="shp-active__x" aria-hidden="true">×</span><span class="sr-only">Remove filter</span></button></li>';
      }).join('');
      var fn = $('.js-shp-fn');
      fn.textContent = act.length;
      fn.hidden = !act.length;
    }

    function setMake(make) {
      s.make = make;
      var models = data.makes[make] || ['Any model'];
      selModel.innerHTML = models.map(function (m) { return '<option>' + svEsc(m) + '</option>'; }).join('');
      var years = make === 'Any make' ? ['Any year'] : data.years;
      selYear.innerHTML = years.map(function (y) { return '<option>' + y + '</option>'; }).join('');
      s.model = models[0];
      s.year = make === data.fit[0] ? '2019' : years[0];
      selYear.value = s.year;
    }

    function toggle(arr, v) {
      var i = arr.indexOf(v);
      if (i > -1) {
        arr.splice(i, 1);
      } else {
        arr.push(v);
      }
    }

    function reset() {
      s.cat = [];
      s.br = [];
      s.pr = -1;
      s.stock = false;
      s.q = '';
      s.n = data.per;
      $('.js-shp-q').value = '';
      paint();
    }

    // search + car
    $('.js-shp-q').addEventListener('input', function () {
      s.q = this.value.trim();
      s.n = data.per;
      paint();
    });
    $('.js-shp-search').addEventListener('submit', function (e) {
      e.preventDefault();
    });
    selMake.addEventListener('change', function () {
      setMake(selMake.value);
      s.n = data.per;
      paint();
    });
    selModel.addEventListener('change', function () {
      s.model = selModel.value;
      paint();
    });
    selYear.addEventListener('change', function () {
      s.year = selYear.value;
      paint();
    });
    // category tiles: the only active category, again to clear; then down to the catalog
    $$('.js-shp-cat').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-cat');
        s.cat = s.cat.length === 1 && s.cat[0] === t ? [] : [t];
        s.n = data.per;
        paint();
        var el = document.getElementById('sh-catalog');
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 20, behavior: 'smooth' });
      });
    });
    // filters
    $('.js-shp-fit').addEventListener('click', function () {
      s.fit = !s.fit;
      s.n = data.per;
      paint();
    });
    $('.js-shp-stock').addEventListener('click', function () {
      s.stock = !s.stock;
      paint();
    });
    $$('input[id^="shp-cat-"]').forEach(function (i) {
      i.addEventListener('change', function () {
        toggle(s.cat, i.value);
        s.n = data.per;
        paint();
      });
    });
    $$('input[id^="shp-brand-"]').forEach(function (i) {
      i.addEventListener('change', function () {
        toggle(s.br, i.value);
        s.n = data.per;
        paint();
      });
    });
    $$('.js-shp-pr').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(b.getAttribute('data-i'), 10);
        s.pr = s.pr === i ? -1 : i;
        s.n = data.per;
        paint();
      });
    });
    $$('.js-shp-sort').forEach(function (b) {
      b.addEventListener('click', function () {
        s.sort = parseInt(b.getAttribute('data-i'), 10);
        paint();
      });
    });
    $$('.js-shp-reset').forEach(function (b) {
      b.addEventListener('click', reset);
    });
    $('.js-shp-active').addEventListener('click', function (e) {
      var b = e.target.closest('.js-shp-x');
      if (!b) {
        return;
      }
      var k = b.getAttribute('data-k');
      var v = b.getAttribute('data-v');
      if (k === 'cat') {
        toggle(s.cat, v);
      } else if (k === 'br') {
        toggle(s.br, v);
      } else if (k === 'pr') {
        s.pr = -1;
      } else if (k === 'stock') {
        s.stock = false;
      } else {
        s.q = '';
        $('.js-shp-q').value = '';
      }
      paint();
    });
    $('.js-shp-more').addEventListener('click', function () {
      s.n += data.per;
      paint();
    });
    // phones: filters live in a bottom sheet
    var sheet = $('.js-shp-filters');
    var fopen = $('.js-shp-fopen');
    function sheetTo(on) {
      sheet.classList.toggle('is-open', on);
      fopen.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    fopen.addEventListener('click', function () {
      sheetTo(true);
    });
    $('.js-shp-fclose').addEventListener('click', function () {
      sheetTo(false);
      fopen.focus();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('is-open')) {
        sheetTo(false);
      }
    });
    // a tap on the dimmed page closes the sheet
    document.addEventListener('click', function (e) {
      if (sheet.classList.contains('is-open') && !sheet.contains(e.target) && !fopen.contains(e.target)) {
        sheetTo(false);
      }
    });

    initShopCart(cart, function () {
      paint();
    });
    paint();
  }

  // localStorage may be blocked (private mode) — the shop still works for this visit
  function shopGet(key, empty) {
    try {
      var v = JSON.parse(window.localStorage.getItem(key));
      // a stored false / 0 is a real answer; only a missing or empty value falls back
      return v === null || v === undefined ? empty : v;
    } catch (e) {
      return empty;
    }
  }

  function shopSet(key, val) {
    try {
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      // storage blocked
    }
  }

  // a product photo ([slug, width, height] from the page data) or the size slot when the product has none
  function shopImg(img, cls, slot) {
    return img ? '<img class="' + cls + '" src="assets/img/shop-p-' + img[0] + '.webp" alt="" width="' + img[1] + '" height="' + img[2] + '" loading="lazy" decoding="async">' : slot;
  }

  function shopLoad() {
    var drawer = $('.js-shp-drawer');
    return shopGet((drawer && drawer.getAttribute('data-key')) || 'avava-cart', {});
  }

  // The cart drawer shared by the shop pages. Options on the markup: data-key on the drawer (storage key),
  // data-autohide on the FAB (hidden while empty), .js-shp-discrow (Avava Club −10 % once "avava-club" is set),
  // .js-ts-toast (an "Added to cart" toast for the add buttons).
  function initShopCart(cart, repaint) {
    var drawer = $('.js-shp-drawer');
    var fab = $('.js-shp-open');
    var items = JSON.parse(drawer.getAttribute('data-items'));
    var key = drawer.getAttribute('data-key') || 'avava-cart';
    var discRow = $('.js-shp-discrow');
    var toast = $('.js-ts-toast');
    var timer = null;
    var toastTimer = null;

    function set(id, n) {
      if (n <= 0) {
        delete cart[id];
      } else {
        cart[id] = n;
      }
      shopSet(key, cart);
      paint();
      repaint();
    }

    function paint() {
      var ids = Object.keys(cart).filter(function (id) {
        return items[id];
      });
      var sub = 0;
      var cnt = 0;
      $('.js-shp-lines').innerHTML = ids.map(function (id) {
        var it = items[id];
        var q = cart[id];
        sub += it[2] * q;
        cnt += q;
        return '<li class="shp-line"><span class="shp-line__ph" aria-hidden="true">' + shopImg(it[3], 'shp-line__img', '110²') + '</span><span class="shp-line__b"><span class="shp-line__brand">' + svEsc(it[1]) +
          '</span><span class="shp-line__n">' + svEsc(it[0]) + '</span><span class="shp-qty"><button class="shp-qty__b js-shp-dec" type="button" data-id="' + id +
          '" aria-label="One less">−</button><span class="shp-qty__n">' + q + '</span><button class="shp-qty__b js-shp-inc" type="button" data-id="' + id +
          '" aria-label="One more">+</button></span></span><span class="shp-line__t">' + money(it[2] * q) + '</span></li>';
      }).join('');
      $('.js-shp-cartempty').hidden = ids.length > 0;
      var disc = discRow && shopGet('avava-club', false) ? Math.round(sub * 0.1) : 0;
      var ship = sub === 0 || sub >= SHP_FREE ? 0 : SHP_SHIP;
      var tax = Math.round((sub - disc) * SHP_TAX);
      setText('.js-shp-n', cnt);
      setText('.js-shp-sub', sub ? money(sub) : '');
      setText('.js-shp-subt', money(sub));
      if (discRow) {
        discRow.hidden = !disc;
        setText('.js-shp-disc', '−' + money(disc));
      }
      // Shop single: free install line while pads are in the cart and the install toggle is on
      var instRow = $('.js-shp-instrow');
      if (instRow) {
        instRow.hidden = !(shopGet('avava-install', true) && ids.some(function (id) { return id.indexOf('bp') === 0; }));
      }
      setText('.js-shp-shipv', ship ? money(ship) : 'Free');
      setText('.js-shp-tax', money(tax));
      setText('.js-shp-total', money(sub - disc + ship + tax));
      setText('.js-shp-shiptxt', sub >= SHP_FREE ? '✓ Free shipping unlocked' : sub ? money(SHP_FREE - sub) + ' away from free shipping' : 'Free shipping over $150');
      var fill = $('.js-shp-shipfill');
      fill.style.width = Math.min(100, sub / SHP_FREE * 100) + '%';
      fill.classList.toggle('is-ok', sub >= SHP_FREE);
      if (fab.hasAttribute('data-autohide')) {
        fab.classList.toggle('is-empty', !cnt);
      }
      // kit buttons (product cards repaint with the catalog)
      $$('.js-shp-add[data-kit]').forEach(function (b) {
        var n = cart[b.getAttribute('data-id')] || 0;
        b.classList.toggle('is-in', n > 0);
        $('.js-shp-addtxt', b).textContent = n ? '✓ Added · ' + n : 'Add kit';
      });
    }

    function showToast(name) {
      if (!toast) {
        return;
      }
      $('.js-ts-toastn', toast).textContent = name;
      toast.classList.add('is-on');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(function () {
        toast.classList.remove('is-on');
      }, 2400);
    }

    document.addEventListener('click', function (e) {
      var add = e.target.closest('.js-shp-add, .js-ts-add, .js-g2-add');
      if (add) {
        var id = add.getAttribute('data-id');
        set(id, (cart[id] || 0) + 1);
        showToast(items[id] ? items[id][0] : '');
        fab.classList.add('is-bump');
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          fab.classList.remove('is-bump');
        }, 300);
        return;
      }
      var inc = e.target.closest('.js-shp-inc');
      var dec = e.target.closest('.js-shp-dec');
      if (inc || dec) {
        var lid = (inc || dec).getAttribute('data-id');
        set(lid, (cart[lid] || 0) + (inc ? 1 : -1));
      }
    });
    if (typeof drawer.showModal === 'function') {
      fab.addEventListener('click', function () {
        drawer.showModal();
      });
      $('.js-shp-close').addEventListener('click', function () {
        drawer.close();
      });
      drawer.addEventListener('click', function (e) {
        if (e.target === drawer) {
          drawer.close();
        }
      });
    }
    document.addEventListener('avava:club', paint);
    paint();
    // used by pages that add items themselves (Shop single)
    return {
      add: function (id, n, toastName) {
        set(id, (cart[id] || 0) + n);
        if (toastName) {
          showToast(toastName);
        }
      },
      open: function () {
        if (typeof drawer.showModal === 'function') {
          drawer.showModal();
        }
      },
      paint: paint
    };
  }

  /* Shop v2 — the catalog with every filter in the sticky bar: category tiles, live search, Brand / Price dropdowns,
     toggles, sort, grid / list, pages of 20, promo tile. State is mirrored to the URL. Cards and rows are rendered
     with the same markup as build_shop2.card() / row() / promo(). */
  function initShop2() {
    var box = $('.js-g2');
    if (!box) {
      return;
    }
    var data = JSON.parse(box.getAttribute('data-shop'));
    var P = data.products.map(function (p) {
      return { id: p[0], name: p[1], brand: p[2], cat: p[3], price: p[4], was: p[5], fits: !!p[6], stock: !!p[7], rt: p[8], rn: p[9], tag: p[10], img: p[11] };
    });
    var NAME = {};
    data.cats.forEach(function (c) {
      NAME[c[0]] = c[1];
    });
    var s = { cat: 'all', q: '', br: [], pr: -1, rt: false, st: false, fit: false, sort: 0, view: 'grid', pg: 0 };
    var cart = shopLoad();
    var fav = shopGet('avava-fav-v2', {});
    var notify = shopGet('avava-notify-v2', {});
    var OK = '<svg class="ico i14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    var grid = $('.js-g2-grid');
    var listEl = $('.js-g2-list');
    var q = $('.js-g2-q');

    // read the URL once (?cat=brakes&brand=OEM,XPEL&price=1&rt=1&st=1&fit=1&sort=2&view=list&page=2&q=pads)
    var u = new URLSearchParams(window.location.search);
    if (NAME[u.get('cat')]) {
      s.cat = u.get('cat');
    }
    s.q = u.get('q') || '';
    s.br = u.get('brand') ? u.get('brand').split(',') : [];
    s.pr = u.has('price') ? Math.min(3, parseInt(u.get('price'), 10) || 0) : -1;
    s.rt = u.get('rt') === '1';
    s.st = u.get('st') === '1';
    s.fit = u.get('fit') === '1';
    s.sort = Math.min(3, parseInt(u.get('sort'), 10) || 0);
    s.view = u.get('view') === 'list' ? 'list' : 'grid';
    s.pg = Math.max(0, (parseInt(u.get('page'), 10) || 1) - 1);
    q.value = s.q;

    function toUrl() {
      var o = new URLSearchParams();
      if (s.cat !== 'all') { o.set('cat', s.cat); }
      if (s.q) { o.set('q', s.q); }
      if (s.br.length) { o.set('brand', s.br.join(',')); }
      if (s.pr > -1) { o.set('price', s.pr); }
      if (s.rt) { o.set('rt', '1'); }
      if (s.st) { o.set('st', '1'); }
      if (s.fit) { o.set('fit', '1'); }
      if (s.sort) { o.set('sort', s.sort); }
      if (s.view === 'list') { o.set('view', 'list'); }
      if (s.pg) { o.set('page', s.pg + 1); }
      var str = o.toString();
      window.history.replaceState(null, '', window.location.pathname + (str ? '?' + str : '') + window.location.hash);
    }

    function inCat() {
      return P.filter(function (p) {
        return s.cat === 'all' || p.cat === s.cat;
      });
    }

    function list() {
      var band = s.pr > -1 ? data.prices[s.pr] : null;
      var qq = s.q.toLowerCase();
      var L = inCat().filter(function (p) {
        return (!s.br.length || s.br.indexOf(p.brand) > -1) && (!band || (p.price >= band[1] && p.price < band[2])) &&
          (!s.rt || p.rt >= 4.7) && (!s.st || p.stock) && (!s.fit || p.fits) && (!qq || (p.name + ' ' + p.brand).toLowerCase().indexOf(qq) > -1);
      });
      var by = [function (a, b) { return b.rn - a.rn; }, function (a, b) { return a.price - b.price; },
        function (a, b) { return b.price - a.price; }, function (a, b) { return b.rt - a.rt || b.rn - a.rn; }];
      return L.sort(by[s.sort]);
    }

    function badges(p) {
      return (p.was ? '<span class="g2-badge g2-badge--sale">−' + Math.round((1 - p.price / p.was) * 100) + '%</span>' : '') +
        (p.tag ? '<span class="g2-badge' + (p.tag === 'New' ? ' g2-badge--new' : '') + '">' + svEsc(p.tag) + '</span>' : '');
    }
    function stockTxt(p) {
      return p.stock ? (p.fits ? 'In stock · fits GTR' : 'In stock · universal') : 'Back in stock Oct 30';
    }
    function priceHtml(p, cls) {
      return '<span class="' + cls + '"><span class="g2-price__v' + (p.was ? ' is-sale' : '') + '">' + money(p.price) + '</span>' +
        (p.was ? '<s class="g2-price__was">' + money(p.was) + '</s>' : '') + '</span>';
    }
    function actionHtml(p, cls) {
      if (!p.stock) {
        var on = !!notify[p.id];
        return '<button class="' + cls + ' is-out js-g2-notify" type="button" data-id="' + p.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + (on ? '✓ We’ll email you' : 'Notify me') + '</button>';
      }
      var n = cart[p.id] || 0;
      return '<button class="' + cls + (n ? ' is-in' : '') + ' js-g2-add" type="button" data-id="' + p.id + '">' + (n ? '✓ ' + n : 'Add') + '</button>';
    }
    function cardHtml(p) {
      var f = !!fav[p.id];
      return '<li class="g2-card js-g2-card' + (p.stock ? '' : ' is-out') + (cart[p.id] ? ' is-in' : '') + '" data-id="' + p.id + '"><span class="g2-card__ph">' + shopImg(p.img, 'g2-card__img', '<span class="g2-card__slot">475 × 360 · @2x 950 × 720</span>') +
        '<span class="g2-badges">' + badges(p) + '</span><button class="g2-fav js-g2-fav" type="button" data-id="' + p.id + '" aria-pressed="' + (f ? 'true' : 'false') + '" aria-label="Save ' + svEsc(p.name) + '">' + (f ? '♥' : '♡') + '</button></span>' +
        '<span class="g2-card__b"><span class="g2-card__meta"><span>' + svEsc(p.brand) + '</span><span>★ ' + p.rt + ' (' + p.rn + ')</span></span>' +
        '<span class="g2-card__n">' + svEsc(p.name) + '</span><span class="g2-st' + (p.stock ? ' is-ok' : '') + '">' + OK + stockTxt(p) + '</span>' +
        '<span class="g2-card__foot">' + priceHtml(p, 'g2-price') + actionHtml(p, 'g2-add') + '</span></span></li>';
    }
    function rowHtml(p, last) {
      return '<li class="g2-row js-g2-card' + (p.stock ? '' : ' is-out') + (last ? ' is-last' : '') + '" data-id="' + p.id + '"><span class="g2-row__ph">' + shopImg(p.img, 'g2-row__img', '240 × 180 · @2x 480 × 360') + '</span>' +
        '<span class="g2-row__main"><span class="g2-row__meta"><span>' + svEsc(p.brand) + '</span><span>· ' + svEsc(NAME[p.cat]) + '</span><span>· ★ ' + p.rt + ' (' + p.rn + ')</span></span>' +
        '<span class="g2-row__n">' + svEsc(p.name) + '</span><span class="g2-row__d">' + svEsc(data.desc[p.cat]) + '</span><span class="g2-badges g2-badges--row">' + badges(p) + '</span></span>' +
        '<span class="g2-row__st"><span class="g2-st' + (p.stock ? ' is-ok' : '') + '">' + OK + stockTxt(p) + '</span><span class="g2-row__ship">' + (p.stock ? 'Ships tomorrow' : 'Pre-order') + '</span></span>' +
        '<span class="g2-row__buy">' + priceHtml(p, 'g2-price g2-price--row') + actionHtml(p, 'g2-add g2-add--row') + '</span></li>';
    }
    function promoHtml() {
      var m = data.promo[s.cat] || data.promo.all;
      var act = s.cat === 'merch' ? 'data-add="' + data.gift + '"' : 'data-cat="' + m[4] + '"';
      return '<li class="g2-promo"><span class="g2-promo__big" aria-hidden="true">' + m[5] + '</span><span class="g2-promo__eb">' + svEsc(m[0]) + '</span>' +
        '<span class="g2-promo__txt"><span class="g2-promo__t">' + svEsc(m[1]) + '</span><span class="g2-promo__d">' + svEsc(m[2]) + '</span></span>' +
        '<button class="g2-promo__cta js-g2-promo" type="button" ' + act + '>' + svEsc(m[3]) + '</button></li>';
    }

    // brand options follow the category; price counts too
    function options() {
      var C = inCat();
      var brands = [];
      C.forEach(function (p) {
        if (brands.indexOf(p.brand) < 0) {
          brands.push(p.brand);
        }
      });
      $('.js-g2-opts-brand').innerHTML = brands.map(function (b, i) {
        var n = C.filter(function (p) { return p.brand === b; }).length;
        return '<li><input class="g2-opt__in" type="checkbox" id="g2-brand-' + i + '" name="g2-brand" value="' + svEsc(b) + '"' + (s.br.indexOf(b) > -1 ? ' checked' : '') + '>' +
          '<label class="g2-opt g2-opt--brand" for="g2-brand-' + i + '"><span class="g2-opt__box" aria-hidden="true"></span>' + svEsc(b) + '<span class="g2-opt__n">' + n + '</span></label></li>';
      }).join('');
      $$('.js-g2-opts-price li').forEach(function (li, i) {
        var band = data.prices[i];
        $('.g2-opt__n', li).textContent = C.filter(function (p) { return p.price >= band[1] && p.price < band[2]; }).length;
        $('input', li).checked = i === s.pr;
      });
    }

    function paint() {
      var L = list();
      var pages = Math.max(1, Math.ceil(L.length / data.per));
      s.pg = Math.min(s.pg, pages - 1);
      var slice = L.slice(s.pg * data.per, s.pg * data.per + data.per);
      var isGrid = s.view === 'grid';
      if (isGrid) {
        var cards = slice.map(cardHtml);
        if (cards.length > data.promoAt && s.cat !== 'lighting') {
          cards.splice(data.promoAt, 0, promoHtml());
        }
        grid.innerHTML = cards.join('');
      } else {
        listEl.innerHTML = slice.map(function (p, i) { return rowHtml(p, i === slice.length - 1); }).join('');
      }
      grid.hidden = !isGrid || !L.length;
      listEl.hidden = isGrid || !L.length;
      $('.js-g2-empty').hidden = L.length > 0;
      setText('.js-g2-catname', NAME[s.cat]);
      setText('.js-g2-count', L.length);
      q.placeholder = 'Search ' + (s.cat === 'all' ? 'all products' : NAME[s.cat].toLowerCase()) + '…';
      setText('.js-g2-range', L.length ? 'Showing ' + (s.pg * data.per + 1) + '–' + Math.min(L.length, s.pg * data.per + data.per) + ' of ' + L.length : '');
      var nums = '';
      for (var i = 0; i < pages; i++) {
        nums += '<li><button class="g2-pg__n js-g2-page' + (i === s.pg ? ' is-on' : '') + '" type="button" data-p="' + i + '"' + (i === s.pg ? ' aria-current="page"' : '') + '>' + (i + 1) + '</button></li>';
      }
      $('.js-g2-pages').innerHTML = nums;
      $('.js-g2-prev').disabled = s.pg === 0;
      $('.js-g2-next').disabled = s.pg >= pages - 1;
      // controls
      $$('.js-g2-cat').forEach(function (b) {
        var on = b.getAttribute('data-cat') === s.cat;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $$('.js-g2-tog').forEach(function (b) {
        b.setAttribute('aria-pressed', s[b.getAttribute('data-k')] ? 'true' : 'false');
      });
      $$('.js-g2-sort').forEach(function (b) {
        press(b, parseInt(b.getAttribute('data-i'), 10) === s.sort);
      });
      $$('.js-g2-view').forEach(function (b) {
        press(b, b.getAttribute('data-v') === s.view);
      });
      $$('.js-g2-dd').forEach(function (d) {
        var k = d.getAttribute('data-k');
        var set = k === 'brand' ? s.br.length > 0 : s.pr > -1;
        $('.js-g2-ddb', d).classList.toggle('is-on', set);
        $('.js-g2-ddt', d).textContent = k === 'brand' ? 'Brand' + (s.br.length ? ' · ' + s.br.length : '') : s.pr > -1 ? data.prices[s.pr][0] : 'Price';
      });
      // active chips
      var act = s.br.map(function (b) { return ['br', b, b]; })
        .concat(s.pr > -1 ? [['pr', '', data.prices[s.pr][0]]] : [])
        .concat(s.rt ? [['rt', '', '★ 4.7+']] : [])
        .concat(s.st ? [['st', '', 'In stock']] : [])
        .concat(s.fit ? [['fit', '', 'Fits GTR']] : [])
        .concat(s.q ? [['q', '', '“' + s.q + '”']] : []);
      $('.js-g2-active').innerHTML = act.map(function (a) {
        return '<li><button class="g2-active__b js-g2-x" type="button" data-k="' + a[0] + '" data-v="' + svEsc(a[1]) + '">' + svEsc(a[2]) +
          '<span class="g2-active__x" aria-hidden="true">×</span><span class="sr-only">Remove filter</span></button></li>';
      }).join('');
      $('.g2-clear.js-g2-reset').hidden = !act.length;
      var fn = $('.js-g2-fn');
      fn.textContent = act.length;
      fn.hidden = !act.length;
      toUrl();
    }

    function toTop() {
      var el = document.getElementById('g2-top');
      var bar = $('.js-g2-bar');
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 16, behavior: 'smooth' });
    }

    function reset() {
      s.br = [];
      s.pr = -1;
      s.rt = s.st = s.fit = false;
      s.q = '';
      s.pg = 0;
      q.value = '';
      options();
      paint();
    }

    // dropdowns: one open at a time; a click elsewhere or Esc closes
    function closeDd(except) {
      $$('.js-g2-dd').forEach(function (d) {
        if (d !== except) {
          $('.js-g2-ddb', d).setAttribute('aria-expanded', 'false');
          $('.js-g2-ddp', d).hidden = true;
        }
      });
    }
    $$('.js-g2-dd').forEach(function (d) {
      var b = $('.js-g2-ddb', d);
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') !== 'true';
        closeDd(d);
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        $('.js-g2-ddp', d).hidden = !open;
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.js-g2-dd')) {
        closeDd(null);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeDd(null);
        sheetTo(false);
      }
    });
    $('.js-g2-opts-brand').addEventListener('change', function (e) {
      var v = e.target.value;
      var i = s.br.indexOf(v);
      if (i > -1) {
        s.br.splice(i, 1);
      } else {
        s.br.push(v);
      }
      s.pg = 0;
      paint();
    });
    // price is single-choice; a click on the chosen band clears it
    $$('.js-g2-opts-price input').forEach(function (inp, i) {
      inp.addEventListener('click', function () {
        s.pr = s.pr === i ? -1 : i;
        inp.checked = s.pr === i;
        s.pg = 0;
        paint();
        if (!window.matchMedia('(max-width: 1199px)').matches) {
          closeDd(null);
        }
      });
    });

    $$('.js-g2-cat').forEach(function (b) {
      b.addEventListener('click', function () {
        s.cat = b.getAttribute('data-cat');
        s.br = [];
        s.pg = 0;
        options();
        paint();
      });
    });
    q.addEventListener('input', function () {
      s.q = q.value.trim();
      s.pg = 0;
      paint();
    });
    $$('.js-g2-tog').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k');
        s[k] = !s[k];
        s.pg = 0;
        paint();
      });
    });
    $$('.js-g2-sort').forEach(function (b) {
      b.addEventListener('click', function () {
        s.sort = parseInt(b.getAttribute('data-i'), 10);
        paint();
      });
    });
    $$('.js-g2-view').forEach(function (b) {
      b.addEventListener('click', function () {
        s.view = b.getAttribute('data-v');
        paint();
      });
    });
    $$('.js-g2-reset').forEach(function (b) {
      b.addEventListener('click', reset);
    });
    $('.js-g2-active').addEventListener('click', function (e) {
      var b = e.target.closest('.js-g2-x');
      if (!b) {
        return;
      }
      var k = b.getAttribute('data-k');
      if (k === 'br') {
        s.br.splice(s.br.indexOf(b.getAttribute('data-v')), 1);
        options();
      } else if (k === 'pr') {
        s.pr = -1;
        options();
      } else if (k === 'q') {
        s.q = '';
        q.value = '';
      } else {
        s[k] = false;
      }
      s.pg = 0;
      paint();
    });
    $('.js-g2-pages').addEventListener('click', function (e) {
      var b = e.target.closest('.js-g2-page');
      if (b) {
        s.pg = parseInt(b.getAttribute('data-p'), 10);
        paint();
        toTop();
      }
    });
    $('.js-g2-prev').addEventListener('click', function () {
      s.pg -= 1;
      paint();
      toTop();
    });
    $('.js-g2-next').addEventListener('click', function () {
      s.pg += 1;
      paint();
      toTop();
    });
    box.addEventListener('click', function (e) {
      var f = e.target.closest('.js-g2-fav');
      var nt = e.target.closest('.js-g2-notify');
      var pm = e.target.closest('.js-g2-promo');
      if (f) {
        fav[f.getAttribute('data-id')] = !fav[f.getAttribute('data-id')];
        shopSet('avava-fav-v2', fav);
        paint();
      } else if (nt) {
        notify[nt.getAttribute('data-id')] = !notify[nt.getAttribute('data-id')];
        shopSet('avava-notify-v2', notify);
        paint();
      } else if (pm && pm.hasAttribute('data-cat')) {
        s.cat = pm.getAttribute('data-cat');
        s.br = [];
        s.pg = 0;
        options();
        paint();
        toTop();
      }
    });

    // phones: filters in a bottom sheet
    var sheet = $('.js-g2-fl');
    var fopen = $('.js-g2-fopen');
    function sheetTo(on) {
      sheet.classList.toggle('is-open', on);
      fopen.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    fopen.addEventListener('click', function (e) {
      e.stopPropagation();
      sheetTo(true);
    });
    $$('.js-g2-fclose').forEach(function (b) {
      b.addEventListener('click', function () {
        sheetTo(false);
        fopen.focus();
      });
    });
    document.addEventListener('click', function (e) {
      if (sheet.classList.contains('is-open') && !sheet.contains(e.target)) {
        sheetTo(false);
      }
    });

    initShopCart(cart, paint);
    options();
    paint();
  }

  /* Shop v3 — the storefront: slider, ribbon, trending tabs, catalog chips / sort / Load more, favourites,
     Avava Club signup. Cards are rendered with the same markup as build_shop3.card(). */
  var TS_AUTOPLAY = 7000;

  function initShop3() {
    var box = $('.js-ts');
    if (!box) {
      return;
    }
    var data = JSON.parse(box.getAttribute('data-shop'));
    var P = data.products.map(function (p) {
      return { id: p[0], name: p[1], brand: p[2], cat: p[3], price: p[4], was: p[5], rt: p[6], rn: p[7], tag: p[8], img: p[9] };
    });
    var s = { tab: 0, cat: 'all', sort: 0, n: data.per };
    var cart = shopLoad();
    var fav = shopGet('avava-fav-v3', {});
    var SIZE = { t: '475 × 420 · @2x 950 × 840', g: '598 × 440 · @2x 1196 × 880' };

    function cardHtml(p, kind) {
      var n = cart[p.id] || 0;
      var f = !!fav[p.id];
      var badges = (p.was ? '<span class="ts-badge ts-badge--sale">−' + Math.round((1 - p.price / p.was) * 100) + '%</span>' : '') +
        (p.tag ? '<span class="ts-badge ts-badge--new">' + svEsc(p.tag) + '</span>' : '') +
        (p.rn > data.best ? '<span class="ts-badge">Bestseller</span>' : '');
      return '<li class="ts-card js-ts-card' + (n ? ' is-in' : '') + '" data-id="' + p.id + '"><span class="ts-card__ph ts-card__ph--' + kind + '">' + shopImg(p.img, 'ts-card__img', '<span class="ts-card__slot">' + SIZE[kind] + '</span>') +
        '<span class="ts-badges">' + badges + '</span><button class="ts-fav js-ts-fav" type="button" data-id="' + p.id + '" aria-pressed="' + (f ? 'true' : 'false') + '" aria-label="Save ' + svEsc(p.name) + '">' + (f ? '♥' : '♡') + '</button></span>' +
        '<span class="ts-card__b"><span class="ts-card__meta"><span>' + svEsc(p.brand) + '</span><span><span class="acc">★</span> ' + p.rt + ' (' + p.rn + ')</span></span>' +
        '<span class="ts-card__n">' + svEsc(p.name) + '</span><span class="ts-card__foot"><span class="ts-card__price"><span class="ts-card__v' + (p.was ? ' is-sale' : '') + '">' + money(p.price) + '</span>' +
        (p.was ? '<s class="ts-card__was">' + money(p.was) + '</s>' : '') + '</span><button class="ts-add js-ts-add' + (n ? ' is-in' : '') + '" type="button" data-id="' + p.id + '">' + (n ? '✓ ' + n : 'Add') + '</button></span></span></li>';
    }

    function tabList(i) {
      if (i === 1) {
        return P.filter(function (p) { return p.tag === 'New'; });
      }
      if (i === 2) {
        return P.filter(function (p) { return p.was; });
      }
      return P.slice().sort(function (a, b) { return b.rn - a.rn; });
    }

    function catalog() {
      var L = P.filter(function (p) {
        return s.cat === 'all' || p.cat === s.cat;
      });
      if (s.sort === 1) {
        return L.sort(function (a, b) { return a.price - b.price; });
      }
      if (s.sort === 2) {
        return L.sort(function (a, b) { return b.price - a.price; });
      }
      if (s.sort === 3) {
        return L.filter(function (p) { return p.tag === 'New'; }).concat(L.filter(function (p) { return p.tag !== 'New'; }));
      }
      return L.sort(function (a, b) { return b.rn - a.rn; });
    }

    function paint() {
      $('.js-ts-trend').innerHTML = tabList(s.tab).slice(0, data.trend).map(function (p) { return cardHtml(p, 't'); }).join('');
      var L = catalog();
      var shown = Math.min(L.length, s.n);
      $('.js-ts-grid').innerHTML = L.slice(0, shown).map(function (p) { return cardHtml(p, 'g'); }).join('');
      setText('.js-ts-shown', shown);
      setText('.js-ts-count', L.length);
      $('.js-ts-more').hidden = shown >= L.length;
      $$('.js-ts-tab').forEach(function (b) {
        press(b, parseInt(b.getAttribute('data-i'), 10) === s.tab);
      });
      $$('.js-ts-sort').forEach(function (b) {
        press(b, parseInt(b.getAttribute('data-i'), 10) === s.sort);
      });
      $$('.js-ts-chip').forEach(function (b) {
        press(b, b.getAttribute('data-cat') === s.cat);
      });
      // the brand rows
      $$('.ts-br .js-ts-add').forEach(function (b) {
        var n = cart[b.getAttribute('data-id')] || 0;
        b.classList.toggle('is-in', n > 0);
        b.textContent = n ? '✓ ' + n : 'Add';
      });
    }

    // hero slider: autoplay 7 s, paused on hover / focus / hidden tab and for reduced motion; swipe
    var hero = $('.js-ts-hero');
    var slides = $$('.js-ts-sl');
    var si = 0;
    var auto = null;
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function goSlide(i) {
      si = (i + slides.length) % slides.length;
      slides.forEach(function (el, k) {
        el.classList.toggle('is-on', k === si);
        el.classList.toggle('is-past', k < si);
        el.inert = k !== si;
      });
      $$('.js-ts-dot').forEach(function (d, k) {
        d.classList.toggle('is-on', k === si);
        d.setAttribute('aria-pressed', k === si ? 'true' : 'false');
      });
      setText('.js-ts-num', '0' + (si + 1) + ' / 0' + slides.length);
    }
    function play() {
      window.clearInterval(auto);
      if (!calm) {
        auto = window.setInterval(function () {
          if (!document.hidden) {
            goSlide(si + 1);
          }
        }, TS_AUTOPLAY);
      }
    }
    function stop() {
      window.clearInterval(auto);
    }
    $('.js-ts-prev').addEventListener('click', function () {
      goSlide(si - 1);
    });
    $('.js-ts-next').addEventListener('click', function () {
      goSlide(si + 1);
    });
    $$('.js-ts-dot').forEach(function (d) {
      d.addEventListener('click', function () {
        goSlide(parseInt(d.getAttribute('data-i'), 10));
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', play);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', play);
    var x0 = null;
    hero.addEventListener('pointerdown', function (e) {
      x0 = e.clientX;
    });
    hero.addEventListener('pointerup', function (e) {
      if (x0 !== null && Math.abs(e.clientX - x0) > 50) {
        goSlide(si + (e.clientX < x0 ? 1 : -1));
      }
      x0 = null;
    });
    play();

    // category ribbon arrows: one card per click
    var ribbon = $('.js-ts-ribbon');
    function step(d) {
      var li = ribbon.querySelector('li');
      var gap = parseFloat(getComputedStyle(ribbon).columnGap) || 0;
      ribbon.scrollBy({ left: d * (li.getBoundingClientRect().width + gap), behavior: 'smooth' });
    }
    $('.js-ts-rprev').addEventListener('click', function () {
      step(-1);
    });
    $('.js-ts-rnext').addEventListener('click', function () {
      step(1);
    });

    // slides, category cards and "Shop all" open the catalog on a category
    $$('.js-ts-go').forEach(function (b) {
      b.addEventListener('click', function () {
        s.cat = b.getAttribute('data-cat');
        s.n = data.per;
        paint();
        var el = document.getElementById('ts-catalog');
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 10, behavior: 'smooth' });
      });
    });
    $$('.js-ts-tab').forEach(function (b) {
      b.addEventListener('click', function () {
        s.tab = parseInt(b.getAttribute('data-i'), 10);
        paint();
      });
    });
    $$('.js-ts-sort').forEach(function (b) {
      b.addEventListener('click', function () {
        s.sort = parseInt(b.getAttribute('data-i'), 10);
        paint();
      });
    });
    $$('.js-ts-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        s.cat = b.getAttribute('data-cat');
        s.n = data.per;
        paint();
      });
    });
    $('.js-ts-more').addEventListener('click', function () {
      s.n += data.per;
      paint();
    });
    box.addEventListener('click', function (e) {
      var f = e.target.closest('.js-ts-fav');
      if (f) {
        var id = f.getAttribute('data-id');
        fav[id] = !fav[id];
        shopSet('avava-fav-v3', fav);
        paint();
      }
    });

    // Avava Club: a valid email swaps the form for the code and takes 10 % off in the cart
    var form = $('.js-ts-club');
    var err = $('.js-ts-err');
    var email = $('.js-ts-email');
    function joined() {
      form.hidden = true;
      err.hidden = true;
      $('.js-ts-clubok').hidden = false;
    }
    if (shopGet('avava-club', false)) {
      joined();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.value.trim())) {
        shopSet('avava-club', true);
        joined();
        document.dispatchEvent(new CustomEvent('avava:club'));
      } else {
        err.textContent = 'Please enter a valid email address';
        email.setAttribute('aria-invalid', 'true');
        email.focus();
      }
    });
    email.addEventListener('input', function () {
      err.textContent = '';
      email.removeAttribute('aria-invalid');
    });

    initShopCart(cart, paint);
    paint();
  }

  /* Shop single v1 — the product page: gallery with hover zoom, variants (axle × compound) shared by the buy column,
     the bundle, the Details switch and the specs; fitment by car or VIN; live same-day cut-off; reviews carousel and
     the write-a-review dialog. Variant texts / fills / photos are swapped by CSS from data-axle / data-comp on .js-pd. */
  // The write-a-review dialog of both product pages (build_shop_single1.overlays): stars, live checks, publish.
  // carIdx() gives the car picked on the page; publish(rate, name, car, text, initials) puts the card in the page's list.
  function initPdReview(D, carIdx, publish) {
    var dlg = $('.js-pd-wr');
    var form = $('.js-pd-wrform');
    var done = $('.js-pd-wrdone');
    var labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
    var rate = 0;
    var tried = false;
    var f = { title: $('.js-pd-wrtitle'), text: $('.js-pd-wrtext'), name: $('.js-pd-wrname'), car: $('.js-pd-wrcar') };
    function lit(n) {
      $$('.pd-wr__s', dlg).forEach(function (l) { l.classList.toggle('is-lit', +l.getAttribute('data-n') <= n); });
      setText('.js-pd-wrratet', labels[n] || 'Tap to rate');
    }
    function message() {
      var t = f.text.value.trim();
      var m = !rate ? 'Pick a star rating' : !f.title.value.trim() ? 'Add a title' : t.length < 20 ? 'Review needs at least 20 characters' : !f.name.value.trim() ? 'Add your name' : '';
      var msg = $('.js-pd-wrmsg');
      msg.textContent = tried ? m : 'All fields required · min. 20 characters';
      msg.classList.toggle('is-err', tried && !!m);
      $('.js-pd-wrpub').classList.toggle('is-dim', !!m);
      return !m;
    }
    $$('.js-pd-wropen').forEach(function (b) {
      b.addEventListener('click', function () {
        form.hidden = false;
        done.hidden = true;
        f.car.value = String(carIdx());
        tried = false;
        message();
        if (typeof dlg.showModal === 'function') {
          dlg.showModal();
        }
      });
    });
    $$('.js-pd-wrclose', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) {
        dlg.close();
      }
    });
    $$('.pd-wr__s', dlg).forEach(function (l) {
      l.addEventListener('mouseenter', function () { lit(+l.getAttribute('data-n')); });
      l.addEventListener('mouseleave', function () { lit(rate); });
    });
    $$('.pd-wr__si', dlg).forEach(function (r) {
      r.addEventListener('change', function () { rate = +r.value; lit(rate); message(); });
    });
    [f.title, f.text, f.name].forEach(function (el) { el.addEventListener('input', message); });
    f.text.addEventListener('input', function () { setText('.js-pd-wrlen', f.text.value.length + ' / 1000'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      if (!message()) {
        return;
      }
      var name = f.name.value.trim();
      var car = D.cars[+f.car.value][0].replace(/^(\d{4}) Sportcar-AMG /, '$1 ');
      var ini = name.replace(/\./g, '').split(/\s+/).map(function (x) { return x.charAt(0); }).join('');
      publish(rate, name, car, f.text.value.trim(), ini);
      setText('.js-pd-rvcount', +$('.js-pd-rvcount').textContent + 1);
      form.reset();
      rate = 0;
      tried = false;
      lit(0);
      setText('.js-pd-wrlen', '0 / 1000');
      form.hidden = true;
      done.hidden = false;
    });
  }

  function initShopSingle1() {
    var box = $('.js-pd');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-pd'));
    var s = { axle: 0, comp: 0, qty: 1, img: 0, car: 0, vinOk: null, rv: 0 };
    var cart = shopLoad();
    var api = null;
    var fmt = function (n) {
      return '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
    };
    var pad = function (n) {
      return (n < 10 ? '0' : '') + n;
    };

    function price() {
      return D.prices[s.axle] + (s.comp ? D.track : 0);
    }
    function mainId() {
      return 'bp' + s.axle + s.comp;
    }
    function mainName() {
      return D.name + ' · ' + (s.axle ? 'rear' : 'front') + (s.comp ? ' · Track' : '');
    }
    function fits() {
      return s.vinOk === null ? !!D.cars[s.car][2] : s.vinOk;
    }

    function render() {
      var p = price();
      var stock = D.stock[s.axle];
      s.qty = Math.min(s.qty, stock);
      box.setAttribute('data-axle', s.axle);
      box.setAttribute('data-comp', s.comp);
      setText('.js-pd-price', fmt(p));
      setText('.js-pd-pay4', fmt(p / 4));
      setText('.js-pd-sku', 'AV-BP-' + (s.axle ? '4413R' : '4412F') + (s.comp ? '-T' : ''));
      setText('.js-pd-axlet', s.axle ? 'Rear axle' : 'Front axle');
      setText('.js-pd-compt', s.comp ? 'Track compound' : 'Street compound');
      setText('.js-pd-qty', s.qty);
      setText('.js-pd-stock', stock);
      setText('.js-pd-addt', fmt(p * s.qty));
      $('.js-pd-dec').disabled = s.qty <= 1;
      $('.js-pd-inc').disabled = s.qty >= stock;
      $$('.js-pd-axle').forEach(function (r) { r.checked = +r.value === s.axle; });
      $$('.js-pd-comp').forEach(function (r) { r.checked = +r.value === s.comp; });
      $$('.js-pd-sw').forEach(function (b) { press(b, +b.getAttribute('data-i') === s.comp); });
      // fitment: the buy-column card and the Details tile
      var car = D.cars[s.car];
      var ok = fits();
      var vin = s.vinOk !== null;
      $('.js-pd-fit').classList.toggle('is-no', !car[2]);
      setText('.js-pd-fiti', car[2] ? '✓' : '!');
      setText('.js-pd-fitk', car[2] ? 'Guaranteed fit' : 'Not compatible');
      setText('.js-pd-fitt', (car[2] ? 'Fits your ' : 'Doesn’t fit ') + car[0]);
      $('.js-pd-car').value = String(s.car);
      $('.js-pd-ft').classList.toggle('is-no', !ok);
      setText('.js-pd-ftbig', ok ? '✓' : '✕');
      setText('.js-pd-ftsrc', vin ? 'By VIN' : 'By model');
      setText('.js-pd-fthead', vin ? (ok ? 'VIN verified — it fits.' : 'VIN doesn’t match.') : (ok ? 'Fits your ' + car[1] + '.' : 'Doesn’t fit ' + car[1] + '.'));
      setText('.js-pd-ftsub', ok ? (vin ? 'Build data shows carbon-ceramic brakes. We’ll attach this check to your order.' : car[0] + ' with carbon-ceramic brakes. Free return if it’s wrong.') :
        'These pads are for carbon-ceramic discs only. Try the steel-disc set or ask our parts team.');
      $$('.js-pd-carchip').forEach(function (b) { press(b, !vin && +b.getAttribute('data-i') === s.car); });
      $$('.js-pd-tl').forEach(function (r) { r.classList.toggle('is-me', !vin && +r.getAttribute('data-r') === car[3]); });
      // bundle
      var prices = [p, D.sensor, D.fluid];
      var n = 0;
      var total = 0;
      $$('.js-pd-bt').forEach(function (c, i) {
        $$('.js-pd-bti')[i].classList.toggle('is-off', !c.checked);
        if (c.checked) {
          n += 1;
          total += prices[i];
        }
      });
      setText('.js-pd-btp0', fmt(p));
      setText('.js-pd-btn', n);
      setText('.js-pd-bttotal', fmt(total));
      setText('.js-pd-btlbl', n ? 'Add ' + n + ' to cart' : 'Select items');
      $('.js-pd-btadd').disabled = !n;
      // similar cards follow the cart
      $$('.pd-sim .js-ts-add').forEach(function (b) {
        var q = cart[b.getAttribute('data-id')] || 0;
        b.classList.toggle('is-in', q > 0);
        b.textContent = q ? '✓ ' + q : 'Add';
        b.closest('.ts-card').classList.toggle('is-in', q > 0);
      });
    }

    // gallery: thumbs, prev / next, hover zoom
    var frames = $$('.js-pd-frame');
    function show(i) {
      s.img = (i + frames.length) % frames.length;
      frames.forEach(function (f, k) { f.classList.toggle('is-on', k === s.img); });
      $$('.js-pd-th').forEach(function (b, k) { b.classList.toggle('is-on', k === s.img); b.setAttribute('aria-pressed', k === s.img ? 'true' : 'false'); });
      setText('.js-pd-num', pad(s.img + 1) + ' / ' + pad(frames.length));
    }
    $$('.js-pd-th').forEach(function (b) {
      b.addEventListener('click', function () { show(+b.getAttribute('data-i')); });
    });
    $('.js-pd-prev').addEventListener('click', function () { show(s.img - 1); });
    $('.js-pd-next').addEventListener('click', function () { show(s.img + 1); });
    var main = $('.js-pd-main');
    var zoom = $('.js-pd-zoom');
    main.addEventListener('mousemove', function (e) {
      if (e.target.closest('button')) {
        main.classList.remove('is-zoom');
        return;
      }
      var r = main.getBoundingClientRect();
      zoom.style.transformOrigin = Math.round((e.clientX - r.left) / r.width * 100) + '% ' + Math.round((e.clientY - r.top) / r.height * 100) + '%';
      main.classList.add('is-zoom');
    });
    main.addEventListener('mouseleave', function () { main.classList.remove('is-zoom'); });
    $('.js-pd-fav').addEventListener('click', function () {
      var on = this.getAttribute('aria-pressed') !== 'true';
      this.setAttribute('aria-pressed', on ? 'true' : 'false');
      this.textContent = on ? '♥' : '♡';
    });
    $('.js-pd-torv').addEventListener('click', function (e) {
      e.preventDefault();
      var el = document.getElementById('pd-reviews');
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 20, behavior: 'smooth' });
    });

    // variants, qty, fitment
    $$('.js-pd-axle').forEach(function (r) {
      r.addEventListener('change', function () { s.axle = +r.value; s.qty = 1; render(); });
    });
    $$('.js-pd-comp').forEach(function (r) {
      r.addEventListener('change', function () { s.comp = +r.value; render(); });
    });
    $$('.js-pd-sw').forEach(function (b) {
      b.addEventListener('click', function () { s.comp = +b.getAttribute('data-i'); render(); });
    });
    $('.js-pd-dec').addEventListener('click', function () { s.qty = Math.max(1, s.qty - 1); render(); });
    $('.js-pd-inc').addEventListener('click', function () { s.qty += 1; render(); });
    $('.js-pd-car').addEventListener('change', function () { s.car = +this.value; s.vinOk = null; render(); });
    $$('.js-pd-carchip').forEach(function (b) {
      b.addEventListener('click', function () { s.car = +b.getAttribute('data-i'); s.vinOk = null; render(); });
    });
    // VIN: 17 characters, no I / O / Q; the prototype rule — a VIN starting with W fits (swap for a VIN-decode API)
    var vin = $('.js-pd-vin');
    vin.addEventListener('input', function () {
      vin.value = vin.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);
      setText('.js-pd-vinn', vin.value.length + '/17');
    });
    $('.js-pd-vinf').addEventListener('submit', function (e) {
      e.preventDefault();
      if (vin.value.length === 17) {
        s.vinOk = vin.value.charAt(0) === 'W';
        render();
      } else {
        vin.focus();
      }
    });

    // cart: add, buy now, bundle, install
    api = initShopCart(cart, render);
    $('.js-pd-add').addEventListener('click', function () { api.add(mainId(), s.qty, mainName()); });
    $('.js-pd-buy').addEventListener('click', function () { api.add(mainId(), s.qty); api.open(); });
    $('.js-pd-btadd').addEventListener('click', function () {
      var ids = [mainId(), 'ws' + s.axle, 'bf'];
      var picked = $$('.js-pd-bt').filter(function (c) { return c.checked; });
      picked.forEach(function (c, k) {
        var id = ids[+c.value];
        api.add(id, 1, k === picked.length - 1 ? (picked.length > 1 ? picked.length + ' items added' : (+c.value === 0 ? mainName() : '')) : '');
      });
    });
    $$('.js-pd-bt').forEach(function (c) { c.addEventListener('change', render); });
    var inst = $('.js-pd-inst');
    inst.checked = shopGet('avava-install', true);
    inst.addEventListener('change', function () { shopSet('avava-install', inst.checked); api.paint(); });

    // the same-day cut-off, the next service slot and the arrival date tick every second
    function tick() {
      var d = new Date();
      var cut = new Date(d);
      cut.setHours(D.cutoff, 0, 0, 0);
      if (cut <= d) {
        cut.setDate(cut.getDate() + 1);
      }
      var today = cut.getDate() === d.getDate();
      var left = Math.floor((cut - d) / 1000);
      var ar = new Date(cut);
      var bd = 0;
      while (bd < 2) {
        ar.setDate(ar.getDate() + 1);
        if (ar.getDay() % 6) {
          bd += 1;
        }
      }
      var slot = new Date(d);
      slot.setDate(slot.getDate() + 1);
      while (!(slot.getDay() % 6)) {
        slot.setDate(slot.getDate() + 1);
      }
      var opt = { weekday: 'short', month: 'short', day: 'numeric' };
      var hh = Math.floor(left / 3600);
      setText('.js-pd-shipline', today ? 'Order within ' + (hh ? hh + ' h ' : '') + pad(Math.floor(left % 3600 / 60)) + ' min — ships today from LA' : 'Cut-off passed — ships tomorrow from LA');
      setText('.js-pd-slot', slot.toLocaleDateString('en-US', opt));
      setText('.js-pd-shipk', today ? 'Ships today' : 'Ships tomorrow');
      setText('.js-pd-shippre', today ? 'Order within this window — arrives' : 'Cut-off passed. Order now — ships tomorrow, arrives');
      setText('.js-pd-arrive', ar.toLocaleDateString('en-US', opt));
      setText('.js-pd-cd', pad(hh) + ':' + pad(Math.floor(left % 3600 / 60)) + ':' + pad(left % 60));
    }
    tick();
    window.setInterval(tick, 1000);

    // reviews carousel
    var track = $('.js-pd-track');
    function cards() {
      return $$('.pd-rv', track);
    }
    function rv(i) {
      var list = cards();
      s.rv = (i + list.length) % list.length;
      var step = list[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
      track.style.transform = 'translateX(' + (-s.rv * step) + 'px)';
      list.forEach(function (c, k) {
        c.classList.toggle('is-on', k === s.rv);
        c.classList.toggle('is-past', k < s.rv);
      });
      setText('.js-pd-rvnum', pad(s.rv + 1) + ' / ' + pad(list.length));
      $('.js-pd-rvprog').style.width = ((s.rv + 1) / list.length * 100) + '%';
    }
    $('.js-pd-rvprev').addEventListener('click', function () { rv(s.rv - 1); });
    $('.js-pd-rvnext').addEventListener('click', function () { rv(s.rv + 1); });
    window.addEventListener('resize', function () { rv(s.rv); });
    rv(0);

    // write-a-review dialog: a published review opens the carousel
    initPdReview(D, function () { return s.car; }, function (rate, name, car, text, ini) {
      var li = document.createElement('li');
      li.className = 'pd-rv';
      li.innerHTML = '<span class="pd-rv__mark" aria-hidden="true">“</span><blockquote class="pd-rv__q"><p>' + svEsc(text) + '</p></blockquote>' +
        '<p class="pd-rv__foot"><span class="pd-rv__av" aria-hidden="true">' + svEsc(ini) + '</span><span class="pd-rv__who"><span class="pd-rv__n">' + svEsc(name) + '</span>' +
        '<span class="pd-rv__car">' + svEsc(car) + ' · Pending verification</span></span><span class="pd-rv__stars"><span aria-hidden="true">' +
        '★★★★★'.slice(0, rate) + '☆☆☆☆☆'.slice(0, 5 - rate) + '</span><span class="sr-only">' + rate + ' out of 5</span></span></p>';
      track.insertBefore(li, track.firstChild);
      rv(0);
    });

    // recently viewed: Clear is remembered
    function clearRecent(on) {
      $('.js-pd-recent').hidden = on;
      $('.js-pd-rcempty').hidden = !on;
      $('.js-pd-rcclear').disabled = on;
    }
    clearRecent(shopGet('avava-recent-cleared', false));
    $('.js-pd-rcclear').addEventListener('click', function () {
      shopSet('avava-recent-cleared', true);
      clearRecent(true);
    });

    render();
  }

  /* Shop single v2 — showroom hero (thumb rail, Photos / 360° / Video stage, price × qty), kit builder with tiered
     add-on savings, details bento, reviews by ownership stage, pill strip. Markup: build_shop_single2.py. */
  function initShopSingle2() {
    var box = $('.js-p2');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-pd'));
    var s = { axle: 0, comp: 0, qty: 1, img: 0, car: 0, kit: [0, 1, 2], stage: 0, f: 'All' };
    var cart = shopLoad();
    var api = null;
    var addTimer = null;
    var kitTimer = null;
    var fmt = function (n) {
      return '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
    };
    // the kit shows whole dollars (the prototype); cart lines keep the cents
    var fmtR = function (n) {
      return fmt(Math.round(n));
    };
    var pad = function (n) {
      return (n < 10 ? '0' : '') + n;
    };
    function price() {
      return D.prices[s.axle] + (s.comp ? D.track : 0);
    }
    function mainId() {
      return 'bp' + s.axle + s.comp;
    }
    function mainName() {
      return D.name + ' · ' + (s.axle ? 'rear' : 'front') + (s.comp ? ' · Track' : '');
    }
    // the kit: add-on prices (the sensor follows the axle), the tier rate for n items
    function rate(n) {
      return D.rates[n] || 0;
    }
    function kitSum(ids) {
      var p = price();
      var add = 0;
      var mins = 90;
      ids.forEach(function (i) {
        if (i) {
          add += D.kit[i][1];
          mins += D.kit[i][2];
        }
      });
      var disc = Math.round(add * rate(ids.length) * 100) / 100;
      return { sub: p + add, disc: disc, total: p + add - disc, mins: mins };
    }

    function render() {
      var p = price();
      var stock = D.stock[s.axle];
      s.qty = Math.min(s.qty, stock);
      box.setAttribute('data-axle', s.axle);
      box.setAttribute('data-comp', s.comp);
      box.setAttribute('data-stage', s.stage);
      setText('.js-p2-total', fmt(p * s.qty));
      setText('.js-p2-variant', (s.axle ? 'Rear' : 'Front') + ' axle · ' + (s.comp ? 'Track' : 'Street') + ' · × ' + s.qty);
      setText('.js-pd-pay4', fmt(p * s.qty / 4));
      setText('.js-pd-sku', 'AV-BP-' + (s.axle ? '4413R' : '4412F') + (s.comp ? '-T' : ''));
      setText('.js-pd-axlet', s.axle ? 'Rear axle' : 'Front axle');
      setText('.js-pd-compt', s.comp ? 'Track compound' : 'Street compound');
      setText('.js-p2-qty', s.qty);
      setText('.js-p2-stock', stock);
      $('.js-p2-dec').disabled = s.qty <= 1;
      $('.js-p2-inc').disabled = s.qty >= stock;
      if (!addTimer) {
        setText('.js-p2-addt', 'Add to cart · ' + fmt(p * s.qty));
      }
      $$('.js-p2-padp').forEach(function (el) { el.textContent = fmt(p); });
      // fitment: the buy column and the bento tile
      var car = D.cars[s.car];
      var ok = !!car[2];
      $('.js-p2-fit').classList.toggle('is-no', !ok);
      setText('.js-p2-fiti', ok ? '✓' : '!');
      setText('.js-p2-fitt', (ok ? 'Fits your ' : 'Doesn’t fit ') + car[0]);
      $('.js-p2-bf').classList.toggle('is-no', !ok);
      setText('.js-p2-bfbig', ok ? '✓' : '✕');
      setText('.js-p2-bft', (ok ? 'Fits your ' : 'Doesn’t fit ') + car[0]);
      $$('.js-p2-car').forEach(function (b) { press(b, +b.getAttribute('data-i') === s.car); });
      $$('.js-p2-fm').forEach(function (r) { r.classList.toggle('is-me', +r.getAttribute('data-r') === car[3]); });
      // kit
      var k = kitSum(s.kit);
      $$('.js-p2-kin').forEach(function (c) { c.checked = s.kit.indexOf(+c.value) > -1; });
      $$('.js-p2-ki').forEach(function (li) { li.classList.toggle('is-on', s.kit.indexOf(+li.getAttribute('data-i')) > -1); });
      $$('.js-p2-line').forEach(function (li) { li.hidden = s.kit.indexOf(+li.getAttribute('data-i')) < 0; });
      $$('.js-p2-pre').forEach(function (b) {
        var ids = b.getAttribute('data-items').split(',').map(Number);
        var on = ids.length === s.kit.length && ids.every(function (i) { return s.kit.indexOf(i) > -1; });
        var pk = kitSum(ids);
        press(b, on);
        $('.js-p2-prep', b).textContent = fmtR(pk.total);
        $('.js-p2-presave', b).textContent = pk.disc ? 'Save ' + fmtR(pk.disc) : 'No discount';
      });
      $$('.js-p2-tier').forEach(function (t) {
        var n = +t.getAttribute('data-n');
        t.classList.toggle('is-on', n === 1 ? s.kit.length < 3 : n === s.kit.length);
      });
      box.setAttribute('data-kit', s.kit.length);
      setText('.js-p2-kn', s.kit.length);
      setText('.js-p2-ksum', fmtR(k.sub));
      setText('.js-p2-kdisc', k.disc ? '−' + fmtR(k.disc) : '—');
      setText('.js-p2-kmin', k.mins);
      setText('.js-p2-ktotal', fmtR(k.total));
      if (!kitTimer) {
        setText('.js-p2-kaddt', 'Add kit · ' + fmtR(k.total));
      }
      // the strip follows the cart
      var n = 0;
      var t = 0;
      var items = JSON.parse($('.js-shp-drawer').getAttribute('data-items'));
      Object.keys(cart).forEach(function (id) {
        if (items[id]) {
          n += cart[id];
          t += items[id][2] * cart[id];
        }
      });
      setText('.js-p2-cartn', n);
      setText('.js-p2-cartt', fmtR(t));
      $$('.js-p2-pill').forEach(function (li) {
        var b = $('.js-ts-add', li);
        var q = cart[b.getAttribute('data-id')] || 0;
        li.classList.toggle('is-in', q > 0);
        b.textContent = q ? '✓' : '+';
        $('.js-p2-cnt', li).textContent = q ? '×' + q : '';
      });
    }

    // stage: photos (thumbs with progress, prev / next), 360° range, video
    var frames = $$('.js-p2-frame');
    function show(i) {
      s.img = (i + frames.length) % frames.length;
      frames.forEach(function (f, k) { f.classList.toggle('is-on', k === s.img); });
      $$('.js-p2-th').forEach(function (b, k) { b.classList.toggle('is-on', k === s.img); b.setAttribute('aria-pressed', k === s.img ? 'true' : 'false'); });
      setText('.js-p2-num', pad(s.img + 1) + ' / ' + pad(frames.length));
    }
    $$('.js-p2-th').forEach(function (b) {
      b.addEventListener('click', function () { show(+b.getAttribute('data-i')); });
    });
    $('.js-p2-prev').addEventListener('click', function () { show(s.img - 1); });
    $('.js-p2-next').addEventListener('click', function () { show(s.img + 1); });
    $$('.js-p2-mode').forEach(function (r) {
      r.addEventListener('change', function () { box.setAttribute('data-mode', r.value); });
    });
    var ang = $('.js-p2-angin');
    ang.addEventListener('input', function () {
      setText('.js-p2-ang', ang.value);
      setText('.js-p2-fno', Math.floor(ang.value / 10) + 1);
    });
    $('.js-p2-fav').addEventListener('click', function () {
      var on = this.getAttribute('aria-pressed') !== 'true';
      this.setAttribute('aria-pressed', on ? 'true' : 'false');
      this.textContent = on ? '♥' : '♡';
    });
    $('.js-p2-torv').addEventListener('click', function (e) {
      e.preventDefault();
      var el = document.getElementById('p2-reviews');
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 20, behavior: 'smooth' });
    });

    // variants, qty, fitment
    $$('.js-p2-axle').forEach(function (r) {
      r.addEventListener('change', function () { s.axle = +r.value; s.qty = 1; render(); });
    });
    $$('.js-p2-comp').forEach(function (r) {
      r.addEventListener('change', function () { s.comp = +r.value; render(); });
    });
    $('.js-p2-dec').addEventListener('click', function () { s.qty = Math.max(1, s.qty - 1); render(); });
    $('.js-p2-inc').addEventListener('click', function () { s.qty += 1; render(); });
    $$('.js-p2-car').forEach(function (b) {
      b.addEventListener('click', function () { s.car = +b.getAttribute('data-i'); render(); });
    });

    // kit: presets and items (the pads stay in)
    $$('.js-p2-pre').forEach(function (b) {
      b.addEventListener('click', function () { s.kit = b.getAttribute('data-items').split(',').map(Number); render(); });
    });
    $$('.js-p2-kin').forEach(function (c) {
      c.addEventListener('change', function () {
        s.kit = $$('.js-p2-kin').filter(function (x) { return x.checked; }).map(function (x) { return +x.value; });
        render();
      });
    });

    // cart
    api = initShopCart(cart, render);
    var add = $('.js-p2-add');
    add.addEventListener('click', function () {
      api.add(mainId(), s.qty, mainName());
      add.classList.add('is-done');
      setText('.js-p2-addt', '✓ Added · ' + (cart[mainId()] || 0) + ' in cart');
      window.clearTimeout(addTimer);
      addTimer = window.setTimeout(function () {
        addTimer = null;
        add.classList.remove('is-done');
        render();
      }, 1800);
    });
    $('.js-p2-buy').addEventListener('click', function () { api.add(mainId(), s.qty); api.open(); });
    var kadd = $('.js-p2-kadd');
    kadd.addEventListener('click', function () {
      // add-ons go in kit-priced (the discount is in their unit price)
      var n = s.kit.length;
      var suffix = rate(n) ? '-k' + n : '';
      var ids = [mainId(), 'ws' + s.axle, 'bf', 'bc'];
      s.kit.slice().sort().forEach(function (i, k) {
        api.add(ids[i] + (i ? suffix : ''), 1, k === n - 1 ? (n > 1 ? 'Kit · ' + n + ' items' : mainName()) : '');
      });
      kadd.classList.add('is-done');
      setText('.js-p2-kaddt', '✓ Kit added · ' + Object.keys(cart).reduce(function (t, id) { return t + cart[id]; }, 0) + ' in cart');
      window.clearTimeout(kitTimer);
      kitTimer = window.setTimeout(function () {
        kitTimer = null;
        kadd.classList.remove('is-done');
        render();
      }, 1800);
    });
    var inst = $('.js-pd-inst');
    inst.checked = shopGet('avava-install', true);
    box.classList.toggle('is-noinst', !inst.checked);
    inst.addEventListener('change', function () {
      shopSet('avava-install', inst.checked);
      box.classList.toggle('is-noinst', !inst.checked);
      api.paint();
    });

    // ship line (cut-off) and the install slots (next business days), once a minute
    function tick() {
      var d = new Date();
      setText('.js-p2-ship', d.getHours() < D.cutoff ? 'ships today from LA' : 'ships tomorrow from LA');
      $$('.js-p2-slotd').forEach(function (el) {
        var day = new Date(d);
        var left = +el.getAttribute('data-days');
        while (left) {
          day.setDate(day.getDate() + 1);
          if (day.getDay() % 6) {
            left -= 1;
          }
        }
        el.textContent = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      });
    }
    tick();
    window.setInterval(tick, 60000);

    // reviews by ownership stage
    function stage(i) {
      s.stage = i;
      $$('.js-p2-st').forEach(function (b) { press(b, +b.getAttribute('data-s') === i); });
      $$('.js-p2-lt').forEach(function (c) { c.hidden = +c.getAttribute('data-s') !== i; });
      box.setAttribute('data-stage', i);
    }
    $$('.js-p2-st').forEach(function (b) {
      b.addEventListener('click', function () { stage(+b.getAttribute('data-s')); });
    });
    stage(0);
    initPdReview(D, function () { return s.car; }, function (rate, name, car, text, ini) {
      var li = document.createElement('li');
      li.className = 'p2-lt js-p2-lt';
      li.setAttribute('data-s', '0');
      li.innerHTML = '<span class="p2-lt__m">⟶ just now</span><blockquote class="p2-lt__q"><p>“' + svEsc(text) + '”</p></blockquote>' +
        '<p class="p2-lt__foot"><span class="p2-lt__av" aria-hidden="true">' + svEsc(ini) + '</span><span class="p2-lt__who"><span class="p2-lt__n">' + svEsc(name) + '</span>' +
        '<span class="p2-lt__car">' + svEsc(car) + ' · Pending verification</span></span></p>';
      var list = $('.js-p2-lts');
      list.insertBefore(li, list.firstChild);
      var n = $('.js-p2-st[data-s="0"] .js-p2-stn');
      n.textContent = +n.textContent + 1;
      stage(0);
    });

    // pill strip: filters, prev / next
    var strip = $('.js-p2-strip');
    $$('.js-p2-yf').forEach(function (b) {
      b.addEventListener('click', function () {
        s.f = b.getAttribute('data-f');
        $$('.js-p2-yf').forEach(function (x) { press(x, x === b); });
        $$('.js-p2-pill').forEach(function (li) { li.hidden = s.f !== 'All' && li.getAttribute('data-cat') !== s.f; });
        strip.scrollLeft = 0;
      });
    });
    $('.js-p2-yprev').addEventListener('click', function () { strip.scrollBy({ left: -900, behavior: 'smooth' }); });
    $('.js-p2-ynext').addEventListener('click', function () { strip.scrollBy({ left: 900, behavior: 'smooth' }); });

    show(0);
    render();
  }

  /* Checkout — one page, four steps always open, the only Pay button in the sticky summary. The cart is read from every
     shop cart key (each catalog of the data, see build_checkout.catalogs) and written back on +/−/Remove. Payment,
     VIN decoding and slots are mocked: a card ending in 0002 is declined (swap for real processor errors). */
  function initCheckout() {
    var box = $('.js-ck');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-ck'));
    var keys = Object.keys(D.cats);
    var s = { method: 0, speed: 0, day: -1, time: -1, pay: 0, car: 0, promo: false, promoTried: false, placing: false, err: '' };
    var carts = {};
    var fresh = keys.every(function (k) { return shopGet(k, null) === null; });
    keys.forEach(function (k) {
      carts[k] = fresh ? (D.sample[k] || {}) : shopGet(k, {});
    });
    if (fresh) {
      shopSet('avava-cart-pd', carts['avava-cart-pd']);
    }
    var F = {};
    $$('.js-ck-in').forEach(function (el) { F[el.getAttribute('data-k')] = el; });
    var NAMES = ['Contact', 'Your car', 'Delivery', 'Payment'];
    var HELP = $$('.js-ck-sum').map(function (el) { return el.getAttribute('data-help'); });
    var tpl = $('.js-ck-tpl');
    var fmt = function (n) {
      return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    var r2 = function (n) {
      return Math.round(n * 100) / 100;
    };
    var v = function (k) {
      return F[k].value.trim();
    };
    function bday(n) {
      var x = new Date();
      var k = 0;
      while (k < n) {
        x.setDate(x.getDate() + 1);
        if (x.getDay() % 6) {
          k += 1;
        }
      }
      return x;
    }
    var DAYS = [1, 2, 3, 4, 5].map(bday);
    var dstr = function (d) {
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    function lines() {
      var out = [];
      keys.forEach(function (k) {
        Object.keys(carts[k]).forEach(function (id) {
          var it = D.cats[k][id];
          if (it && carts[k][id] > 0) {
            out.push({ key: k, id: id, q: carts[k][id], it: it });
          }
        });
      });
      return out;
    }
    function setQ(k, id, n) {
      if (n > 0) {
        carts[k][id] = n;
      } else {
        delete carts[k][id];
      }
      shopSet(k, carts[k]);
      render();
    }
    function money() {
      var L = lines();
      var sub = r2(L.reduce(function (t, l) { return t + l.it[2] * l.q; }, 0));
      var disc = s.promo ? r2(sub * 0.1) : 0;
      var ship = s.method === 0 ? (s.speed === 1 ? 24 : (sub >= D.free ? 0 : 12)) : 0;
      var tax = r2((sub - disc) * D.tax);
      return { L: L, sub: sub, disc: disc, ship: ship, tax: tax, total: r2(sub - disc + ship + tax),
        cnt: L.reduce(function (t, l) { return t + l.q; }, 0) };
    }
    function hasParts(L) {
      return L.some(function (l) { return !/gift card/i.test(l.it[0]); });
    }
    function validate(i) {
      var e = {};
      if (i === 0) {
        if (!/^\S+@\S+\.\S+$/.test(v('email'))) { e.email = 'Enter a valid email'; }
        if (v('phone').replace(/\D/g, '').length < 10) { e.phone = 'Enter a 10-digit phone'; }
      }
      if (i === 1 && v('vin') && v('vin').length !== 17) {
        e.vin = 'VIN must be 17 characters';
      }
      if (i === 2 && s.method === 0) {
        if (!v('first')) { e.first = 'Required'; }
        if (!v('last')) { e.last = 'Required'; }
        if (v('addr').length < 5) { e.addr = 'Enter street and number'; }
        if (!v('city')) { e.city = 'Required'; }
        if (v('zip').length !== 5) { e.zip = '5 digits'; }
      }
      if (i === 2 && s.method === 2 && (s.day < 0 || s.time < 0)) {
        e.slot = 'Pick a day and time';
      }
      if (i === 3 && s.pay === 0) {
        if (v('card').replace(/\s/g, '').length !== 16) { e.card = 'Card number must be 16 digits'; }
        if (!/^(0[1-9]|1[0-2]) \/ \d{2}$/.test(v('exp'))) { e.exp = 'MM / YY'; }
        if (v('cvc').length < 3) { e.cvc = '3–4 digits'; }
        if (!v('holder')) { e.holder = 'Required'; }
        if (!$('.js-ck-same').checked && v('bill').length < 5) { e.bill = 'Enter billing address'; }
      }
      return e;
    }
    function summary(i, m) {
      if (i === 0) { return v('email') + ' · ' + v('phone'); }
      if (i === 1) { return D.cars[s.car][0] + (v('vin') ? ' · VIN ' + v('vin').slice(-6) : ''); }
      if (i === 2) {
        return s.method === 0 ? v('addr') + ', ' + v('city') + ' · ' + (s.speed ? 'Express' : 'Standard') :
          s.method === 1 ? 'Pickup · Avava Showroom LA' : 'Install · ' + dstr(DAYS[s.day]) + ' ' + D.times[s.time];
      }
      return ['Card', 'Apple Pay', 'Avava Pay · 4 payments', 'PayPal'][s.pay] + (s.pay === 0 ? ' ·•• ' + v('card').slice(-4) : '');
    }

    function render() {
      var m = money();
      var parts = hasParts(m.L);
      var order = parts ? [0, 1, 2, 3] : [0, 2, 3];
      // lines
      var list = $('.js-ck-lines');
      list.innerHTML = '';
      m.L.forEach(function (l) {
        var li = tpl.content.firstElementChild.cloneNode(true);
        $('.ck-line__ph', li).innerHTML = shopImg(l.it[3], 'ck-line__img', '<span class="ck-line__slot">110²</span>');
        $('.ck-line__brand', li).textContent = l.it[1];
        $('.ck-line__n', li).textContent = l.it[0];
        $('.ck-line__q', li).textContent = l.q;
        $('.ck-line__t', li).textContent = fmt(r2(l.it[2] * l.q));
        $('.js-ck-dec', li).addEventListener('click', function () { setQ(l.key, l.id, l.q - 1); });
        $('.js-ck-inc', li).addEventListener('click', function () { setQ(l.key, l.id, l.q + 1); });
        $('.js-ck-rm', li).addEventListener('click', function () { setQ(l.key, l.id, 0); });
        list.appendChild(li);
      });
      $('.js-ck-empty').hidden = m.L.length > 0;
      setText('.js-ck-count', m.cnt);
      // totals
      setText('.js-ck-sub', fmt(m.sub));
      $('.js-ck-discrow').hidden = !m.disc;
      setText('.js-ck-disc', '−' + fmt(m.disc));
      setText('.js-ck-shipk', ['Shipping', 'Pickup', 'Install at Avava Service'][s.method]);
      setText('.js-ck-ship', m.ship ? fmt(m.ship) : 'Free');
      $('.js-ck-shiprow').classList.toggle('ck-ok', !m.ship);
      setText('.js-ck-tax', fmt(m.tax));
      setText('.js-ck-total', fmt(m.total));
      $$('.js-ck-q4').forEach(function (el) { el.textContent = fmt(r2(m.total / 4)); });
      var freeShip = m.sub >= D.free ? 'Free' : '$12.00';
      $$('.js-ck-mp').forEach(function (el) {
        var p = el.getAttribute('data-i') === '0' ? freeShip : 'Free';
        el.textContent = p;
        el.classList.toggle('ck-ok', p === 'Free');
      });
      var spp = $('.js-ck-spp[data-i="0"]');
      spp.textContent = freeShip;
      spp.classList.toggle('ck-ok', freeShip === 'Free');
      var ft = s.method !== 0 ? '✓ No shipping fee for ' + (s.method === 1 ? 'pickup' : 'installation') :
        m.sub >= D.free ? '✓ Free standard shipping unlocked' : fmt(r2(D.free - m.sub)) + ' away from free shipping';
      var fok = s.method !== 0 || m.sub >= D.free;
      setText('.js-ck-freet', ft);
      var fill = $('.js-ck-freef');
      fill.style.width = (s.method !== 0 ? 100 : Math.min(100, m.sub / D.free * 100)) + '%';
      fill.classList.toggle('is-ok', fok);
      // panes
      $$('.js-ck-pane').forEach(function (p) { p.hidden = +p.getAttribute('data-m') !== s.method; });
      $$('.js-ck-pp').forEach(function (p) { p.hidden = +p.getAttribute('data-p') !== s.pay; });
      $('.js-ck-bill').hidden = $('.js-ck-same').checked;
      $$('.js-ck-step')[1].hidden = !parts;
      var pads = m.L.some(function (l) { return /pads/i.test(l.it[0]); });
      $$('.ck-car__f.is-no').forEach(function (el) { el.textContent = pads ? '✕ Pads don’t fit' : '✕ Check fitment'; });
      // steps, errors, progress
      var bad = [];
      var cur = -1;
      [0, 1, 2, 3].forEach(function (i) {
        var e = validate(i);
        var ok = !Object.keys(e).length;
        var st = $$('.js-ck-step')[i];
        if (order.indexOf(i) > -1 && !ok) {
          bad.push(i);
          if (cur < 0) {
            cur = i;
          }
        }
        Object.keys(F).forEach(function (k) {
          if (+F[k].closest('.js-ck-step').getAttribute('data-s') !== i) {
            return;
          }
          var show = e[k] && F[k].value.trim().length > 2 ? e[k] : '';
          F[k].classList.toggle('is-err', !!show);
          F[k].setAttribute('aria-invalid', show ? 'true' : 'false');
          setText('#ck-e-' + k, show);
        });
        st.classList.toggle('is-ok', ok);
        $('.js-ck-n', st).textContent = ok ? '✓' : String(order.indexOf(i) + 1);
        $('.js-ck-sum', st).textContent = ok ? summary(i, m) : HELP[i];
      });
      setText('.js-ck-slote', s.method === 2 && (s.day >= 0 || s.time >= 0) && (s.day < 0 || s.time < 0) ? 'Pick a day and time' : '');
      var pgN = 0;
      $$('.js-ck-pg').forEach(function (li) {
        var i = +li.getAttribute('data-s');
        li.hidden = order.indexOf(i) < 0;
        if (li.hidden) {
          return;
        }
        pgN += 1;
        var ok = bad.indexOf(i) < 0;
        li.classList.toggle('is-ok', ok);
        li.classList.toggle('is-cur', i === cur);
        $('.ck-pg__n', li).textContent = ok ? '✓' : String(pgN);
      });
      // pay button
      var agree = $('.js-ck-agree').checked;
      var off = bad.length > 0 || !agree || !m.L.length;
      var btn = $('.js-ck-paybtn');
      btn.classList.toggle('is-on', !off);
      btn.classList.toggle('is-busy', s.placing);
      btn.setAttribute('aria-disabled', off ? 'true' : 'false');
      setText('.js-ck-payt', s.placing ? 'Processing…' : s.pay === 2 ? 'Pay ' + fmt(r2(m.total / 4)) + ' today' : 'Pay ' + fmt(m.total));
      var hint = $('.js-ck-hint');
      hint.textContent = s.err ? s.err : !m.L.length ? 'Your cart is empty' : bad.length ? 'Fill in: ' + bad.map(function (i) { return NAMES[i]; }).join(', ') :
        agree ? 'Secure payment · 256-bit SSL' : 'Tick “I agree to the Terms” above';
      hint.classList.toggle('is-err', !!s.err);
      return m;
    }

    // dates are computed once: arrival days, the next five business days
    $$('.js-ck-arr').forEach(function (el) { el.textContent = dstr(bday(+el.getAttribute('data-days'))); });
    $$('.js-ck-dw').forEach(function (el) { el.textContent = DAYS[+el.getAttribute('data-i')].toLocaleDateString('en-US', { weekday: 'short' }); });
    $$('.js-ck-dn').forEach(function (el) { el.textContent = DAYS[+el.getAttribute('data-i')].getDate(); });

    // input masks
    var masks = {
      vin: function (x) { return x.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17); },
      zip: function (x) { return x.replace(/\D/g, '').slice(0, 5); },
      card: function (x) { return x.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); },
      exp: function (x) { var d = x.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; },
      cvc: function (x) { return x.replace(/\D/g, '').slice(0, 4); }
    };
    Object.keys(F).forEach(function (k) {
      F[k].addEventListener('input', function () {
        if (masks[k]) {
          F[k].value = masks[k](F[k].value);
        }
        s.err = '';
        render();
      });
    });
    [['method', 'method'], ['speed', 'speed'], ['day', 'day'], ['time', 'time'], ['pay', 'pay'], ['car', 'car']].forEach(function (p) {
      $$('.js-ck-' + p[0]).forEach(function (r) {
        r.addEventListener('change', function () { s[p[1]] = +r.value; s.err = ''; render(); });
      });
    });
    ['same', 'agree', 'news', 'valet'].forEach(function (k) {
      $('.js-ck-' + k).addEventListener('change', function () { s.err = ''; render(); });
    });
    $('.js-ck-promo').addEventListener('submit', function (e) {
      e.preventDefault();
      var code = $('.js-ck-promoin').value.trim().toUpperCase();
      s.promo = code === 'AVAVA10';
      var msg = $('.js-ck-promom');
      msg.textContent = s.promo ? '✓ AVAVA10 applied · −10 %' : 'Code not recognised · try AVAVA10';
      msg.classList.toggle('ck-ok', s.promo);
      msg.classList.toggle('is-err', !s.promo);
      render();
    });
    $('.js-ck-promoin').addEventListener('input', function () { this.value = this.value.toUpperCase(); });

    // pay → mock processing → confirmation
    var dlg = $('.js-ck-done');
    $('.js-ck-paybtn').addEventListener('click', function () {
      if (this.getAttribute('aria-disabled') === 'true' || s.placing) {
        return;
      }
      s.placing = true;
      s.err = '';
      render();
      window.setTimeout(function () {
        s.placing = false;
        if (s.pay === 0 && v('card').replace(/\s/g, '').slice(-4) === '0002') {
          s.err = 'Your card was declined. Try another card or payment method.';
          render();
          return;
        }
        var m = money();
        var paid = s.pay === 2 ? fmt(r2(m.total / 4)) + ' today' : fmt(m.total);
        setText('.js-ck-no', 'AV-' + (100000 + Math.floor(Math.random() * 899999)));
        setText('.js-ck-name', v('first') || v('email').split('@')[0] || 'there');
        setText('.js-ck-mail', v('email'));
        setText('.js-ck-paid', paid);
        var slot = s.method === 2 ? dstr(DAYS[s.day]) + ' at ' + D.times[s.time] : '';
        var NX = [['Confirmation email', 'Receipt and order details, now'],
          s.method === 2 ? ['We prep your parts', 'Parts reserved for your slot'] : ['Packed in LA', 'Fitment checked before packing'],
          s.method === 0 ? ['On its way', 'Tracking link by SMS'] : s.method === 1 ? ['Ready for pickup', 'We’ll text when it’s ready'] : ['Install day', slot]];
        $$('.js-ck-nxt').forEach(function (el, i) { el.textContent = NX[i][0]; });
        $$('.js-ck-nxd').forEach(function (el, i) { el.textContent = NX[i][1]; });
        $('.js-ck-cal').hidden = s.method !== 2;
        // the order is placed: every shop cart is emptied
        keys.forEach(function (k) {
          carts[k] = {};
          shopSet(k, {});
        });
        render();
        if (typeof dlg.showModal === 'function') {
          dlg.showModal();
        }
      }, 1600);
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) {
        dlg.close();
      }
    });
    // the order is placed: closing the confirmation (Esc / backdrop) also goes back to the shop
    dlg.addEventListener('close', function () {
      window.location.href = 'shop-v2.html';
    });
    // install day → a calendar file (90 minutes at Avava Service LA)
    $('.js-ck-cal').addEventListener('click', function () {
      var d = new Date(DAYS[s.day]);
      var hm = D.times[s.time].split(':');
      d.setHours(+hm[0], +hm[1], 0, 0);
      var end = new Date(d.getTime() + 90 * 60000);
      var z = function (x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Avava//Checkout//EN', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@avava',
        'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(d), 'DTEND:' + z(end), 'SUMMARY:Install at Avava Service', 'LOCATION:8420 Melrose Ave, Los Angeles, CA 90069',
        'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.download = 'avava-install.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    render();
  }

  /* Shop v4 — compact catalog: car pickers (Make → Year / Model), stock switch, category / brand checkboxes,
     price chips, sort, spec-sheet cards eight a page. State ↔ URL (replaceState). Cards are cloned from the
     <template> rendered by build_shop4.card(); the cart is Shop v1's ("avava-cart"). */
  function initShop4() {
    var box = $('.js-sh4');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-shop'));
    var P = D.products.map(function (p) {
      return { id: p[0], name: p[1], brand: p[2], cat: p[3], price: p[4], was: p[5], fits: !!p[6], rt: p[7], rn: p[8], badge: p[9], stock: !!p[10], img: p[11] };
    });
    var s = { make: D.car[0], year: D.car[1], model: D.car[2], stock: false, cat: [], br: [], pr: -1, sort: 0, pg: 1, dd: '' };
    var cart = shopLoad();
    var grid = $('.js-sh4-grid');
    var tpl = $('.js-sh4-tpl');
    var fmt = function (n) {
      return '$' + n.toLocaleString('en-US');
    };
    var pad = function (n) {
      return (n < 10 ? '0' : '') + n;
    };

    // read the URL once (?make=Porsche&year=2021&model=Taycan&stock=1&cat=Parts,Merch&brand=OEM&price=1&sort=2&page=2)
    var u = new URLSearchParams(window.location.search);
    if (D.makes[u.get('make')]) {
      s.make = u.get('make');
      s.model = D.makes[s.make].indexOf(u.get('model')) > -1 ? u.get('model') : D.makes[s.make][0];
      s.year = D.years.indexOf(u.get('year')) > -1 ? u.get('year') : D.years[0];
    }
    s.stock = u.get('stock') === '1';
    s.cat = u.get('cat') ? u.get('cat').split(',') : [];
    s.br = u.get('brand') ? u.get('brand').split(',') : [];
    s.pr = u.has('price') ? Math.min(D.prices.length - 1, parseInt(u.get('price'), 10) || 0) : -1;
    s.sort = Math.min(3, parseInt(u.get('sort'), 10) || 0);
    s.pg = Math.max(1, parseInt(u.get('page'), 10) || 1);

    function toUrl() {
      var o = new URLSearchParams();
      if (s.make !== D.car[0] || s.year !== D.car[1] || s.model !== D.car[2]) {
        o.set('make', s.make);
        if (s.make !== 'Any make') {
          o.set('year', s.year);
          o.set('model', s.model);
        }
      }
      if (s.stock) { o.set('stock', '1'); }
      if (s.cat.length) { o.set('cat', s.cat.join(',')); }
      if (s.br.length) { o.set('brand', s.br.join(',')); }
      if (s.pr > -1) { o.set('price', s.pr); }
      if (s.sort) { o.set('sort', s.sort); }
      if (s.pg > 1) { o.set('page', s.pg); }
      var str = o.toString();
      window.history.replaceState(null, '', window.location.pathname + (str ? '?' + str : ''));
    }

    var anyCar = function () { return s.make === 'Any make'; };
    var myCar = function () { return s.make === 'Sportcar-AMG' && s.model === 'GTR'; };
    function list() {
      var L = P.filter(function (p) {
        if (s.cat.length && s.cat.indexOf(p.cat) < 0) { return false; }
        if (s.br.length && s.br.indexOf(p.brand) < 0) { return false; }
        if (s.pr > -1 && (p.price < D.prices[s.pr][1] || p.price >= D.prices[s.pr][2])) { return false; }
        if (s.stock && !p.stock) { return false; }
        // a car without fitment data: universal products only
        if (!anyCar() && !myCar() && (p.cat === 'Parts' || p.fits)) { return false; }
        return true;
      });
      var by = [function (a, b) { return b.rn - a.rn; }, function (a, b) { return a.price - b.price; },
        function (a, b) { return b.price - a.price; }, function (a, b) { return (b.badge === 'New') - (a.badge === 'New') || b.rn - a.rn; }][s.sort];
      return L.sort(by);
    }
    function fill(li, p, n) {
      var q = cart[p.id] || 0;
      var uni = p.cat !== 'Parts' && !p.fits;
      var ok = uni || (myCar() && p.fits);
      li.setAttribute('data-id', p.id);
      $('.s4c__n', li).textContent = pad(n);
      $('.s4c__sku', li).textContent = 'AV-' + (1000 + p.id * 37);
      var ph = $('.s4c__ph', li);
      var old = $('.s4c__img, .s4c__slot', ph);
      var tmp = document.createElement('span');
      tmp.innerHTML = shopImg(p.img, 's4c__img', '<span class="s4c__slot">420 × 300 · @2x 840 × 600</span>');
      ph.replaceChild(tmp.firstChild, old);
      var b = '';
      if (p.was) { b += '<span class="s4c__bdg s4c__bdg--sale">−' + Math.round((1 - p.price / p.was) * 100) + '%</span>'; }
      if (p.badge) { b += '<span class="s4c__bdg' + (p.badge === 'New' ? ' s4c__bdg--new' : '') + '">' + svEsc(p.badge) + '</span>'; }
      $('.s4c__bdgs', li).innerHTML = b;
      $('.s4c__ey', li).textContent = p.brand + ' · ' + p.cat;
      $('.s4c__name', li).textContent = p.name;
      $('.s4c__tb dd', li).innerHTML = '<span class="acc">★</span> ' + p.rt + ' · ' + p.rn;
      var fit = $('.s4c__fit', li);
      fit.textContent = uni ? 'Universal' : ok ? '✓ ' + s.model : anyCar() ? 'Select car' : 'Check fit';
      fit.classList.toggle('is-ok', ok);
      $('.s4c__v', li).textContent = fmt(p.price);
      $('.s4c__v', li).classList.toggle('is-sale', !!p.was);
      var was = $('.s4c__was', li);
      if (p.was && !was) {
        was = document.createElement('s');
        was.className = 's4c__was';
        $('.s4c__price', li).appendChild(was);
      }
      if (was) {
        was.hidden = !p.was;
        was.textContent = p.was ? fmt(p.was) : '';
      }
      var add = $('.s4c__add', li);
      add.setAttribute('data-id', p.id);
      add.setAttribute('aria-label', 'Add ' + p.name + ' to cart');
      add.classList.toggle('is-in', q > 0);
      $('.s4c__addt', add).textContent = q ? 'In cart · ' + q : 'Add';
      $('.s4c__disc', add).textContent = q ? '✓' : '+';
    }

    function render() {
      var L = list();
      var pages = Math.max(1, Math.ceil(L.length / D.per));
      s.pg = Math.min(s.pg, pages);
      var from = (s.pg - 1) * D.per;
      var page = L.slice(from, from + D.per);
      grid.innerHTML = '';
      page.forEach(function (p, k) {
        var li = tpl.content.firstElementChild.cloneNode(true);
        fill(li, p, from + k + 1);
        grid.appendChild(li);
      });
      grid.hidden = !L.length;
      $('.js-sh4-empty').hidden = L.length > 0;
      $('.js-sh4-pg').hidden = !L.length;
      setText('.js-sh4-count', L.length);
      setText('.js-sh4-range', L.length ? (from + 1) + '–' + (from + page.length) : '0');
      setText('.js-sh4-page', s.pg);
      setText('.js-sh4-pages', pages);
      $('.js-sh4-prev').disabled = s.pg <= 1;
      $('.js-sh4-next').disabled = s.pg >= pages;
      var nums = '';
      for (var n = 1; n <= pages; n++) {
        nums += '<button class="s4pg__num" type="button" data-p="' + n + '"' + (n === s.pg ? ' aria-current="page"' : '') + ' aria-label="Page ' + n + '">' + n + '</button>';
      }
      $('.js-sh4-nums').innerHTML = nums;
      // sidebar
      $('.js-sh4-stock').checked = s.stock;
      $$('.js-sh4-cat').forEach(function (c) { c.checked = s.cat.indexOf(c.value) > -1; });
      $$('.js-sh4-brand').forEach(function (c) { c.checked = s.br.indexOf(c.value) > -1; });
      $$('.js-sh4-price').forEach(function (b) { press(b, +b.getAttribute('data-i') === s.pr); });
      $$('.js-sh4-sort').forEach(function (b) { press(b, +b.getAttribute('data-i') === s.sort); });
      var vals = { make: s.make, year: anyCar() ? 'Any year' : s.year, model: anyCar() ? 'Any model' : s.model };
      var opts = { make: Object.keys(D.makes), year: D.years, model: D.makes[s.make] || [] };
      $$('.js-sh4-dd').forEach(function (d) {
        var k = d.getAttribute('data-k');
        var b = $('.js-sh4-ddb', d);
        var open = s.dd === k;
        b.disabled = k !== 'make' && anyCar();
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        b.setAttribute('aria-label', k.charAt(0).toUpperCase() + k.slice(1) + ': ' + vals[k]);
        d.classList.toggle('is-open', open);
        d.classList.toggle('is-set', !b.disabled && vals[k] !== 'Any make');
        $('.js-sh4-ddv', d).textContent = vals[k];
        var m = $('.js-sh4-ddm', d);
        m.hidden = !open;
        m.innerHTML = open ? opts[k].map(function (o) {
          var on = o === vals[k];
          return '<li><button class="s4dd__o' + (on ? ' is-on' : '') + '" type="button" data-v="' + svEsc(o) + '" aria-pressed="' + (on ? 'true' : 'false') + '"><span>' + svEsc(o) + '</span><span class="s4dd__tick" aria-hidden="true">' + (on ? '✓' : '') + '</span></button></li>';
        }).join('') : '';
      });
      // active chips
      var act = [];
      s.cat.forEach(function (c) { act.push(['cat', c]); });
      s.br.forEach(function (c) { act.push(['br', c]); });
      if (s.pr > -1) { act.push(['pr', D.prices[s.pr][0]]); }
      if (s.stock) { act.push(['stock', 'In stock']); }
      $('.js-sh4-act').innerHTML = act.map(function (a) {
        return '<li><button class="s4act__b" type="button" data-k="' + a[0] + '" data-v="' + svEsc(a[1]) + '" aria-label="Remove ' + svEsc(a[1]) + '">' + svEsc(a[1]) + '<span class="s4act__x" aria-hidden="true">×</span></button></li>';
      }).join('');
      toUrl();
    }

    function go(p) {
      s.pg = p;
      render();
      var top = $('#sh-catalog').getBoundingClientRect().top + window.pageYOffset - 20;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
    function changed() {
      s.pg = 1;
      render();
    }
    function reset() {
      s = { make: 'Any make', year: D.years[0], model: D.makes['Any make'][0], stock: false, cat: [], br: [], pr: -1, sort: 0, pg: 1, dd: '' };
      render();
    }
    function toggle(arr, v) {
      var at = arr.indexOf(v);
      if (at > -1) {
        arr.splice(at, 1);
      } else {
        arr.push(v);
      }
    }

    box.addEventListener('click', function (e) {
      var t = e.target;
      var ddb = t.closest('.js-sh4-ddb');
      var opt = t.closest('.s4dd__o');
      if (ddb) {
        var k = ddb.closest('.js-sh4-dd').getAttribute('data-k');
        s.dd = s.dd === k ? '' : k;
        render();
        return;
      }
      if (opt) {
        var key = opt.closest('.js-sh4-dd').getAttribute('data-k');
        var v = opt.getAttribute('data-v');
        if (key === 'make') {
          s.make = v;
          s.model = D.makes[v][0];
          s.year = D.years[0];
        } else {
          s[key] = v;
        }
        s.dd = '';
        changed();
        $('.js-sh4-dd[data-k="' + key + '"] .js-sh4-ddb').focus();
        return;
      }
      if (t.closest('.js-sh4-reset')) {
        reset();
        return;
      }
      var pr = t.closest('.js-sh4-price');
      if (pr) {
        var i = +pr.getAttribute('data-i');
        s.pr = s.pr === i ? -1 : i;
        changed();
        return;
      }
      var so = t.closest('.js-sh4-sort');
      if (so) {
        s.sort = +so.getAttribute('data-i');
        changed();
        return;
      }
      var chip = t.closest('.s4act__b');
      if (chip) {
        var ck = chip.getAttribute('data-k');
        var cv = chip.getAttribute('data-v');
        if (ck === 'cat') { toggle(s.cat, cv); }
        if (ck === 'br') { toggle(s.br, cv); }
        if (ck === 'pr') { s.pr = -1; }
        if (ck === 'stock') { s.stock = false; }
        changed();
        return;
      }
      var num = t.closest('.s4pg__num');
      if (num) {
        go(+num.getAttribute('data-p'));
        return;
      }
      if (t.closest('.js-sh4-prev')) {
        go(s.pg - 1);
      } else if (t.closest('.js-sh4-next')) {
        go(s.pg + 1);
      }
    });
    box.addEventListener('change', function (e) {
      var t = e.target;
      if (t.classList.contains('js-sh4-stock')) { s.stock = t.checked; }
      if (t.classList.contains('js-sh4-cat')) { toggle(s.cat, t.value); }
      if (t.classList.contains('js-sh4-brand')) { toggle(s.br, t.value); }
      changed();
    });
    // an open car menu closes on an outside click or Esc
    document.addEventListener('click', function (e) {
      if (s.dd && !e.target.closest('.js-sh4-dd')) {
        s.dd = '';
        render();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && s.dd) {
        var k = s.dd;
        s.dd = '';
        render();
        $('.js-sh4-dd[data-k="' + k + '"] .js-sh4-ddb').focus();
      }
    });

    // below 1200 px the filters fold behind a button
    var ftog = $('.js-sh4-ftog');
    ftog.addEventListener('click', function () {
      var open = ftog.getAttribute('aria-expanded') !== 'true';
      ftog.setAttribute('aria-expanded', open ? 'true' : 'false');
      $('.js-sh4-side').classList.toggle('is-open', open);
    });

    initShopCart(cart, render);
    render();
  }

  /* Blog list — every post is in the markup (build_blog.py); search, topic and tag filter them, pages of two,
     numbering continues across pages, state ↔ URL. The spec-sheet sidebar sticks until the feed ends:
     top = min(20, viewport − sidebar − 20), so a sidebar taller than the window scrolls to its bottom and holds. */
  // The spec-sheet sidebar of the blog list and the article: the newsletter and the sticky offset —
  // top = min(20, viewport − sidebar − 20), so a sidebar taller than the window scrolls to its bottom and holds.
  function initBlogSide() {
    var side = $('.js-bl-side');
    if (!side) {
      return function () {};
    }
    function stick() {
      side.style.top = Math.min(20, window.innerHeight - side.offsetHeight - 20) + 'px';
    }
    // E · Dispatch
    var news = $('.js-bl-news');
    var email = $('.js-bl-email');
    news.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = /^\S+@\S+\.\S+$/.test(email.value.trim());
      $('.js-bl-newsrow').classList.toggle('is-err', !ok);
      email.setAttribute('aria-invalid', ok ? 'false' : 'true');
      setText('.js-bl-newse', ok ? '' : 'Enter a valid email');
      if (ok) {
        news.hidden = true;
        $('.js-bl-newsok').hidden = false;
        stick();
      }
    });
    email.addEventListener('input', function () {
      $('.js-bl-newsrow').classList.remove('is-err');
      setText('.js-bl-newse', '');
    });

    window.addEventListener('resize', stick);
    stick();
    return stick;
  }

  function initBlog() {
    var box = $('.js-bl');
    if (!box) {
      return;
    }
    var posts = $$('.js-bl-post', box);
    var per = parseInt(box.getAttribute('data-per'), 10) || 2;
    var cats = $$('.js-bl-cat').map(function (b) { return $('.blcat__t', b).textContent; });
    var s = { q: '', cat: 0, tag: '', pg: 1 };
    var qin = $('.js-bl-q');

    var u = new URLSearchParams(window.location.search);
    s.q = u.get('q') || '';
    s.cat = Math.max(0, cats.indexOf(u.get('topic') || ''));
    s.tag = $$('.js-bl-tag').some(function (b) { return b.getAttribute('data-t') === u.get('tag'); }) ? u.get('tag') : '';
    s.pg = Math.max(1, parseInt(u.get('page'), 10) || 1);
    qin.value = s.q;

    function toUrl() {
      var o = new URLSearchParams();
      if (s.q) { o.set('q', s.q); }
      if (s.cat) { o.set('topic', cats[s.cat]); }
      if (s.tag) { o.set('tag', s.tag); }
      if (s.pg > 1) { o.set('page', s.pg); }
      var str = o.toString();
      window.history.replaceState(null, '', window.location.pathname + (str ? '?' + str : ''));
    }

    function render() {
      var q = s.q.trim().toLowerCase();
      var L = posts.filter(function (p) {
        return (!s.cat || p.getAttribute('data-cat') === cats[s.cat]) &&
          (!s.tag || (' ' + p.getAttribute('data-tags') + ' ').indexOf(' ' + s.tag + ' ') > -1) &&
          (!q || p.getAttribute('data-text').indexOf(q) > -1);
      });
      var pages = Math.max(1, Math.ceil(L.length / per));
      s.pg = Math.min(s.pg, pages);
      var from = (s.pg - 1) * per;
      posts.forEach(function (p) { p.hidden = true; });
      L.slice(from, from + per).forEach(function (p, k) {
        p.hidden = false;
        var n = from + k + 1;
        $$('.js-bl-n', p).forEach(function (el) { el.textContent = (n < 10 ? '0' : '') + n; });
      });
      var filtered = !!(s.cat || s.tag || q);
      $('.js-bl-clearrow').hidden = !filtered || !L.length;
      $('.js-bl-empty').hidden = L.length > 0;
      $('.js-bl-pg').hidden = pages < 2;
      var last = Math.min(L.length, from + per);
      setText('.js-bl-range', !L.length ? '0' : last === from + 1 ? String(last) : (from + 1) + '–' + last);
      setText('.js-bl-count', L.length);
      setText('.js-bl-page', s.pg);
      setText('.js-bl-pages', pages);
      $('.js-bl-prev').disabled = s.pg <= 1;
      $('.js-bl-next').disabled = s.pg >= pages;
      var nums = '';
      for (var n = 1; n <= pages; n++) {
        nums += '<button class="s4pg__num" type="button" data-p="' + n + '"' + (n === s.pg ? ' aria-current="page"' : '') + ' aria-label="Page ' + n + '">' + n + '</button>';
      }
      $('.js-bl-nums').innerHTML = nums;
      $$('.js-bl-cat').forEach(function (b) { press(b, +b.getAttribute('data-i') === s.cat); });
      $$('.js-bl-tag').forEach(function (b) { press(b, b.getAttribute('data-t') === s.tag); });
      toUrl();
      stick();
    }


    function go(p) {
      s.pg = p;
      render();
      var top = box.getBoundingClientRect().top + window.pageYOffset - 20;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
    function changed() {
      s.pg = 1;
      render();
    }

    qin.addEventListener('input', function () {
      s.q = qin.value;
      changed();
    });
    box.addEventListener('click', function (e) {
      var t = e.target;
      var cat = t.closest('.js-bl-cat');
      var tag = t.closest('.js-bl-tag');
      var num = t.closest('.s4pg__num');
      if (cat) {
        s.cat = +cat.getAttribute('data-i');
        changed();
      } else if (tag) {
        var v = tag.getAttribute('data-t');
        s.tag = s.tag === v ? '' : v;
        changed();
      } else if (t.closest('.js-bl-clear')) {
        s = { q: '', cat: 0, tag: '', pg: 1 };
        qin.value = '';
        render();
      } else if (num) {
        go(+num.getAttribute('data-p'));
      } else if (t.closest('.js-bl-prev')) {
        go(s.pg - 1);
      } else if (t.closest('.js-bl-next')) {
        go(s.pg + 1);
      }
    });

    var stick = initBlogSide();
    render();
  }

  /* Blog post — the active section follows the scroll (the last § heading above 35 % of the window), the rail's
     progress line, the gauge and "min left" follow it; LINK copies the address, SAVE toggles. Comments are rendered
     from data-cm: sort Best (likes + 3 × replies) / Helpful / Newest, one like each, fold threads, reply, post. */
  function initBlogPost() {
    var rail = $('.js-bp-rail');
    if (!rail) {
      return;
    }
    initBlogSide();
    var heads = [$('#bp-s0')].concat($$('.js-bp-sec'));
    var total = heads.length;
    var mins = 8;
    var cur = -1;
    function paint(sec) {
      if (sec === cur) {
        return;
      }
      cur = sec;
      var pct = Math.round((sec + 1) / total * 100);
      $('.js-bp-prog').style.height = pct + '%';
      setText('.js-bp-pct', pct + '%');
      setText('.js-bp-left', Math.max(0, Math.round(mins * (1 - (sec + 1) / total))));
      var lit = Math.round(12 * (sec + 1) / total);
      $$('.bpg__s', rail).forEach(function (s, i) { s.classList.toggle('is-on', i < lit); });
      $$('.bptoc', rail).forEach(function (a) { a.classList.toggle('is-on', +a.getAttribute('data-sec') === sec); });
      $$('.js-bp-sec').forEach(function (h) { h.classList.toggle('is-on', +h.getAttribute('data-sec') === sec); });
    }
    var queued = false;
    function onScroll() {
      if (queued) {
        return;
      }
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        var line = window.innerHeight * 0.35;
        var sec = 0;
        heads.forEach(function (h, i) {
          if (h.getBoundingClientRect().top < line) {
            sec = i;
          }
        });
        paint(sec);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint(0);
    onScroll();

    var toast = $('.js-bp-toast');
    var tt = null;
    function say(t) {
      toast.textContent = t;
      window.clearTimeout(tt);
      tt = window.setTimeout(function () { toast.textContent = ''; }, 2000);
    }
    $('.js-bp-link').addEventListener('click', function () {
      var url = window.location.href.split('#')[0];
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { say('Link copied'); }, function () { say(url); });
      } else {
        say(url);
      }
    });
    $('.js-bp-save').addEventListener('click', function () {
      var on = this.getAttribute('aria-pressed') !== 'true';
      this.setAttribute('aria-pressed', on ? 'true' : 'false');
      this.textContent = on ? 'SAVED' : 'SAVE';
      say(on ? 'Saved to your journal' : 'Removed');
    });

    initComments();
  }

  function initComments() {
    var box = $('.js-cm');
    if (!box) {
      return;
    }
    var list = JSON.parse(box.getAttribute('data-cm'));
    var ROLES = ['Owner', 'Thinking of buying', 'Just curious'];
    var AV = ['av-ink', 'av-ok', 'av-blue', 'av-acc', 'av-grey'];
    var ui = { sort: 0, role: 0, replyTo: null, liked: {}, fold: {}, flash: null };
    var form = $('.js-cm-form');
    var ta = $('.js-cm-text');
    var nameIn = $('.js-cm-name');
    var mail = $('.js-cm-email');
    var ini = function (n) {
      return n.split(/[ .]+/).filter(Boolean).map(function (x) { return x.charAt(0); }).join('').slice(0, 2).toUpperCase();
    };
    var lk = function (c) { return c.likes + (ui.liked[c.id] ? 1 : 0); };

    function render() {
      var by = [function (x, y) { return (lk(y) + y.replies.length * 3) - (lk(x) + x.replies.length * 3); },
        function (x, y) { return lk(y) - lk(x); }, function (x, y) { return x.ts - y.ts; }][ui.sort];
      var sorted = list.slice().sort(by);
      $('.js-cm-list').innerHTML = sorted.map(function (c, i) {
        var on = !!ui.liked[c.id];
        var open = ui.fold[c.id] !== false;
        var n = c.replies.length;
        var reps = n && open ? '<ol class="cmr">' + c.replies.map(function (r, j) {
          return '<li class="cmr__i' + (r.staff ? ' is-staff' : '') + '"><span class="cmav cmav--s ' + (r.staff ? 'av-acc' : AV[(c.id + j + 1) % AV.length]) + '" aria-hidden="true">' + svEsc(ini(r.name)) + '</span>' +
            '<div class="cmr__b"><p class="cmr__h"><span class="cmr__n">' + svEsc(r.name) + '</span>' + (r.staff ? '<span class="cmr__staff">Avava team</span>' : '') + '<span class="cm__ago">' + svEsc(r.ago) + '</span></p>' +
            '<p class="cmr__t">' + svEsc(r.t) + '</p></div></li>';
        }).join('') + '</ol>' : '';
        return '<li class="cmc' + (ui.flash === c.id ? ' is-flash' : '') + '"><div class="cmc__g"><span class="cmav ' + AV[c.id % AV.length] + '" aria-hidden="true">' + svEsc(ini(c.name)) + '</span>' +
          '<span class="cmc__no">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' + (n ? '<span class="cmc__thread" aria-hidden="true"></span>' : '') + '</div>' +
          '<div class="cmc__b"><p class="cmc__h"><span class="cmc__n">' + svEsc(c.name) + '</span>' + (c.role && c.role !== 'Just curious' ? '<span class="cmc__role">' + svEsc(c.role) + '</span>' : '') +
          '<span class="cm__ago">' + svEsc(c.ago) + '</span></p><p class="cmc__t">' + svEsc(c.t) + '</p>' +
          '<p class="cmc__acts"><button class="cmc__like" type="button" data-id="' + c.id + '" aria-pressed="' + (on ? 'true' : 'false') + '"><span class="cmc__heart" aria-hidden="true">' + (on ? '♥' : '♡') + '</span>Helpful · ' + lk(c) + '</button>' +
          '<button class="cmc__reply" type="button" data-id="' + c.id + '">Reply</button>' +
          (n ? '<button class="cmc__fold" type="button" data-id="' + c.id + '" aria-expanded="' + (open ? 'true' : 'false') + '">' + (open ? 'Hide replies' : 'Show ' + n + (n === 1 ? ' reply' : ' replies')) + '</button>' : '') + '</p>' + reps + '</div></li>';
      }).join('');
      setText('.js-cm-count', list.reduce(function (t, c) { return t + 1 + c.replies.length; }, 0));
      var people = {};
      list.forEach(function (c) { people[c.name] = 1; c.replies.forEach(function (r) { people[r.name] = 1; }); });
      setText('.js-cm-people', Object.keys(people).length);
      $('.js-cm-faces').innerHTML = list.slice(0, 5).map(function (c) {
        return '<span class="cmav cmav--f ' + AV[c.id % AV.length] + '">' + svEsc(ini(c.name)) + '</span>';
      }).join('');
      $$('.js-cm-sort').forEach(function (b) { press(b, +b.getAttribute('data-i') === ui.sort); });
      composer();
    }

    function composer() {
      var t = ta.value;
      var reply = ui.replyTo ? list.filter(function (c) { return c.id === ui.replyTo; })[0] : null;
      $('.js-cm-replyrow').hidden = !reply;
      setText('.js-cm-replyto', reply ? 'Replying to ' + reply.name : '');
      setText('.js-cm-postt', reply ? 'Post reply' : 'Post comment');
      setText('.js-cm-me', nameIn.value.trim() ? ini(nameIn.value.trim()) : 'You');
      setText('.js-cm-n', t.length);
      var cnt = $('.js-cm-cnt');
      cnt.classList.toggle('is-ok', t.length > 0 && t.length <= 540);
      cnt.classList.toggle('is-max', t.length > 540);
      $('.js-cm-fill').style.width = Math.min(100, t.length / 6) + '%';
      $('.js-cm-post').classList.toggle('is-on', t.trim().length >= 3);
      $$('.js-cm-role').forEach(function (b) { press(b, +b.getAttribute('data-i') === ui.role); });
    }
    function open(on) {
      form.classList.toggle('is-open', on);
      $('.js-cm-more').hidden = !on;
    }

    ta.addEventListener('focus', function () { open(true); });
    [ta, nameIn, mail].forEach(function (el) {
      el.addEventListener('input', function () {
        setText('.js-cm-err', '');
        composer();
      });
    });
    box.addEventListener('click', function (e) {
      var t = e.target;
      var b = t.closest('button');
      if (!b) {
        return;
      }
      var id = +b.getAttribute('data-id');
      if (b.classList.contains('js-cm-sort')) {
        ui.sort = +b.getAttribute('data-i');
      } else if (b.classList.contains('js-cm-role')) {
        ui.role = +b.getAttribute('data-i');
        composer();
        return;
      } else if (b.classList.contains('cmc__like')) {
        ui.liked[id] = !ui.liked[id];
      } else if (b.classList.contains('cmc__fold')) {
        ui.fold[id] = ui.fold[id] === false;
      } else if (b.classList.contains('cmc__reply')) {
        ui.replyTo = id;
        open(true);
        ta.focus();
      } else if (b.classList.contains('js-cm-cancel')) {
        ui.replyTo = null;
      } else {
        return;
      }
      render();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameIn.value.trim();
      var text = ta.value.trim();
      var err = !name ? 'Add your name' : !/^\S+@\S+\.\S+$/.test(mail.value.trim()) ? 'Enter a valid email' : text.length < 3 ? 'Write a little more' : '';
      setText('.js-cm-err', err);
      if (err) {
        return;
      }
      list.forEach(function (c) { c.ts += 1; });
      if (ui.replyTo) {
        var id = ui.replyTo;
        list.forEach(function (c) {
          if (c.id === id) {
            c.replies.push({ name: name, staff: false, t: text, ago: 'just now' });
          }
        });
        ui.fold[id] = true;
        ui.flash = id;
        ui.replyTo = null;
      } else {
        var nid = Date.now();
        list.unshift({ id: nid, name: name, t: text, ago: 'just now', likes: 0, ts: 0, role: ROLES[ui.role], replies: [] });
        ui.flash = nid;
        ui.sort = 2;
      }
      ta.value = '';
      open(false);
      render();
      window.setTimeout(function () {
        ui.flash = null;
        var f = $('.cmc.is-flash');
        if (f) {
          f.classList.remove('is-flash');
        }
      }, 1600);
    });

    render();
  }

  /* Account · Profile — the sidebar menu switches sections (Profile is the form; the rest show a coming-soon panel),
     groups fold, the form validates on blur (and everything on save), tracks dirty state against the last save,
     previews a photo (drop or browse) and keeps the saved profile in localStorage ("avava-profile"). */
  /* Account pages (profile.html, garage.html): the shared sidebar — rows that are pages are links, the others switch the
     content to the coming-soon panel; groups fold; log out. */
  function initAccount() {
    var box = $('.js-up');
    if (!box) {
      return;
    }
    var main = parseInt(box.getAttribute('data-main'), 10) || 0;
    var titles = $$('.upm').map(function (b) { return $('.upm__t', b).textContent; });
    // sidebar: sections, folding groups, the "next" hint, log out
    function go(i) {
      $$('.upm').forEach(function (b) {
        var on = +b.getAttribute('data-i') === i;
        b.classList.toggle('is-on', on);
        if (on) {
          b.setAttribute('aria-current', 'page');
        } else {
          b.removeAttribute('aria-current');
        }
      });
      setText('.js-up-sect', titles[i]);
      setText('.js-up-soont', titles[i]);
      $('.js-up-hdx').hidden = i !== main;
      $$('.js-up-pane').forEach(function (p) { p.hidden = (p.getAttribute('data-pane') === 'main') !== (i === main); });
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.js-up-go');
      if (b) {
        go(+b.getAttribute('data-i'));
        var top = box.getBoundingClientRect().top + window.pageYOffset - 20;
        if (box.getBoundingClientRect().top < 0) {
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
        return;
      }
      var f = e.target.closest('.js-up-fold');
      if (f) {
        var open = f.getAttribute('aria-expanded') !== 'true';
        f.setAttribute('aria-expanded', open ? 'true' : 'false');
        f.closest('.js-up-grp').classList.toggle('is-shut', !open);
        $('.upg__m', f).textContent = open ? '−' : '+';
      }
    });
    $('.js-up-out').addEventListener('click', function () {
      try {
        window.sessionStorage.removeItem('avava-user');
      } catch (er) {
        // storage blocked
      }
      window.location.href = 'index.html';
    });

    document.addEventListener('avava:account', function (e) { go(e.detail); });
    // the top menu links sections without a page as profile.html#up-<slug>
    function fromHash() {
      var b = $$('.js-up-go').filter(function (x) { return location.hash === '#up-' + x.getAttribute('data-slug'); })[0];
      if (b) {
        go(+b.getAttribute('data-i'));
      }
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
    // pages without the form: the identity block follows the saved profile
    if (!$('.js-up-form')) {
      var st = shopGet('avava-profile', null);
      var v = st && st.v;
      if (v) {
        setText('.js-up-name', (v.first + ' ' + v.last).trim());
        setText('.js-up-mail', v.email || '');
        setText('.js-up-ini', st.ph ? '' : ((v.first.charAt(0) || '') + (v.last.charAt(0) || '')).toUpperCase());
        $('.js-up-av').style.backgroundImage = st.ph ? 'url("' + st.ph + '")' : '';
      }
    }
  }

  function initProfile() {
    var form = $('.js-up-form');
    if (!form) {
      return;
    }
    var BASE = JSON.parse(form.getAttribute('data-user'));
    var store = shopGet('avava-profile', null);
    var saved = store && store.v ? store.v : BASE;
    var savedPh = store && store.ph ? store.ph : null;
    var ph = savedPh;
    var touched = {};
    var justSaved = false;
    var F = {};
    $$('.js-up-in').forEach(function (el) {
      F[el.getAttribute('data-k')] = el;
      el.value = saved[el.getAttribute('data-k')] || '';
    });

    function vals() {
      var v = {};
      Object.keys(F).forEach(function (k) { v[k] = F[k].value; });
      return v;
    }
    function check(k, x) {
      if (k === 'email' && !/^\S+@\S+\.\S+$/.test(x.trim())) { return 'Enter a valid email'; }
      if (k === 'zip' && x && !/^\d{5}$/.test(x.trim())) { return '5 digits'; }
      if (k === 'birth' && x && !/^\d{2} ?\/ ?\d{2} ?\/ ?\d{4}$/.test(x.trim())) { return 'MM / DD / YYYY'; }
      if ((k === 'first' || k === 'last') && !x.trim()) { return 'Required'; }
      return '';
    }
    function ini(v) {
      return ((v.first.trim().charAt(0) || '') + (v.last.trim().charAt(0) || '')).toUpperCase() || '?';
    }

    function render() {
      var v = vals();
      var errs = {};
      Object.keys(v).forEach(function (k) { errs[k] = check(k, v[k]); });
      var anyErr = Object.keys(errs).some(function (k) { return errs[k]; });
      var dirty = Object.keys(v).some(function (k) { return v[k] !== (saved[k] || ''); }) || ph !== savedPh;
      if (dirty) {
        justSaved = false;
      }
      $$('.js-up-f').forEach(function (cell) {
        var k = cell.getAttribute('data-k');
        var e = touched[k] ? errs[k] : '';
        cell.classList.toggle('is-err', !!e);
        F[k].setAttribute('aria-invalid', e ? 'true' : 'false');
        setText('#up-e-' + k, e);
      });
      $$('.js-up-sec').forEach(function (sec) {
        var keys = sec.getAttribute('data-keys').split(' ');
        var n = keys.filter(function (k) { return v[k].trim(); }).length;
        var d = $('.js-up-done', sec);
        d.textContent = n === keys.length ? '✓ COMPLETE' : n + ' / ' + keys.length;
        d.classList.toggle('is-ok', n === keys.length);
      });
      // photo card + sidebar identity (the sidebar shows what is saved)
      var pre = $('.js-up-pre');
      pre.style.backgroundImage = ph ? 'url("' + ph + '")' : '';
      $('.js-up-rm').hidden = !ph;
      setText('.js-up-pini', ph ? '' : ini(v));
      setText('.js-up-fname', (v.first.trim() + ' ' + v.last.trim()).trim() || 'Your name');
      $('.js-up-av').style.backgroundImage = savedPh ? 'url("' + savedPh + '")' : '';
      setText('.js-up-ini', savedPh ? '' : ini(saved));
      setText('.js-up-name', (saved.first + ' ' + saved.last).trim());
      setText('.js-up-mail', saved.email || '');
      // profile strength: the photo + 8 fields = 9 points; the checklist follows the form as it is typed
      var pts = ['first', 'last', 'email', 'phone', 'birth', 'addr', 'licence', 'bio'].filter(function (k) { return v[k].trim(); }).length + (ph ? 1 : 0);
      var pct = Math.round(pts / 9 * 100) + '%';
      setText('.js-up-pct', pct);
      $('.js-up-pbar').style.width = pct;
      var ok = { ph: !!ph, email: true, phone: !!v.phone.trim(), addr: !!v.addr.trim(), licence: !!v.licence.trim() };
      $$('.js-up-ck').forEach(function (li) { li.classList.toggle('is-ok', ok[li.getAttribute('data-c')]); });
      // status, header button, bar
      var st = $('.js-up-st');
      st.textContent = dirty ? '● UNSAVED CHANGES' : justSaved ? '✓ SAVED' : 'ALL CHANGES SAVED';
      st.classList.toggle('is-dirty', dirty);
      var hs = $('.js-up-hsave');
      hs.classList.toggle('is-dirty', dirty);
      hs.classList.toggle('is-saved', justSaved);
      hs.textContent = justSaved ? '✓ Saved' : 'Save changes';
      var bar = $('.js-up-bar2');
      bar.classList.toggle('is-dirty', dirty);
      bar.classList.toggle('is-saved', justSaved);
      setText('.js-up-bart', anyErr && dirty ? 'Fix the highlighted fields' : dirty ? 'You have unsaved changes' : justSaved ? '✓ Profile saved' : 'Everything is up to date');
      $('.js-up-reset').disabled = !dirty;
      setText('.js-up-savet', justSaved ? '✓ Saved' : 'Save changes');
      return { v: v, anyErr: anyErr, dirty: dirty };
    }

    Object.keys(F).forEach(function (k) {
      F[k].addEventListener('input', render);
      F[k].addEventListener('blur', function () {
        touched[k] = true;
        render();
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = render();
      if (r.anyErr) {
        Object.keys(F).forEach(function (k) { touched[k] = true; });
        render();
        var bad = $('.js-up-f.is-err .js-up-in');
        if (bad) {
          bad.focus();
        }
        return;
      }
      if (!r.dirty) {
        return;
      }
      saved = r.v;
      savedPh = ph;
      justSaved = true;
      shopSet('avava-profile', { v: saved, ph: savedPh });
      paintHeaderAvatar();
      render();
    });
    $('.js-up-reset').addEventListener('click', function () {
      Object.keys(F).forEach(function (k) { F[k].value = saved[k] || ''; });
      ph = savedPh;
      touched = {};
      render();
    });

    // photo: drop or browse, preview with FileReader (production: upload, crop square, check size)
    var drop = $('.js-up-drop');
    function load(file) {
      setText('.js-up-pherr', '');
      if (!file) {
        return;
      }
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        setText('.js-up-pherr', 'Use a JPG, PNG or WEBP image');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setText('.js-up-pherr', 'The photo is over 5 MB');
        return;
      }
      var rd = new FileReader();
      rd.onload = function () {
        // a square 512 px crop is what the avatar needs and what fits in localStorage
        var im = new Image();
        im.onload = function () {
          var side = Math.min(im.naturalWidth, im.naturalHeight);
          var c = document.createElement('canvas');
          c.width = c.height = Math.min(512, side);
          c.getContext('2d').drawImage(im, (im.naturalWidth - side) / 2, (im.naturalHeight - side) / 2, side, side, 0, 0, c.width, c.height);
          ph = c.toDataURL('image/jpeg', 0.88);
          render();
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(file);
    }
    $('.js-up-file').addEventListener('change', function () { load(this.files && this.files[0]); this.value = ''; });
    ['dragenter', 'dragover'].forEach(function (t) {
      drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-drag'); });
    });
    drop.addEventListener('dragleave', function () { drop.classList.remove('is-drag'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.classList.remove('is-drag');
      load(e.dataTransfer.files[0]);
    });
    $('.js-up-rm').addEventListener('click', function () {
      ph = null;
      render();
    });

    render();
  }

  /* My garage — car pills switch the cars, 6M / 1Y / 3Y switch the value chart, Book service books Thursday 10:30,
     the service ring is drawn from data-p. */
  function initGarage() {
    var box = $('.js-gr');
    if (!box) {
      return;
    }
    var toast = $('.js-gr-toast');
    var tt = null;
    function say(t) {
      toast.textContent = t;
      toast.classList.add('is-on');
      window.clearTimeout(tt);
      tt = window.setTimeout(function () { toast.classList.remove('is-on'); }, 5000);
    }
    function thursday() {
      var d = new Date();
      do {
        d.setDate(d.getDate() + 1);
      } while (d.getDay() !== 4);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    $$('.js-gr-ring', box).forEach(function (r) { r.style.setProperty('--p', r.getAttribute('data-p') + '%'); });

    box.addEventListener('click', function (e) {
      var t = e.target;
      var tab = t.closest('.js-gr-tab');
      var rg = t.closest('.js-gr-range');
      var book = t.closest('.js-gr-book');
      if (tab) {
        var i = +tab.getAttribute('data-car');
        $$('.js-gr-tab', box).forEach(function (x) {
          var on = x === tab;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        $$('.js-gr-sheet', box).forEach(function (sh) { sh.hidden = +sh.getAttribute('data-car') !== i; });
      } else if (rg) {
        var sh = rg.closest('.js-gr-sheet');
        var r = rg.getAttribute('data-r');
        $$('.js-gr-range', sh).forEach(function (x) { press(x, x === rg); });
        $$('.js-gr-r', sh).forEach(function (c) { c.hidden = c.getAttribute('data-r') !== r; });
      } else if (book) {
        var on = book.getAttribute('aria-pressed') !== 'true';
        book.setAttribute('aria-pressed', on ? 'true' : 'false');
        book.textContent = on ? '✓ Booked · Thu 10:30' : 'Book service';
        if (on) {
          say('Service booked at Avava Service LA — ' + thursday() + ', 10:30. We’ll text a reminder the day before.');
        }
      }
    });
  }

    /* Saved cars — filters with live counts, sorts, unsave with undo, compare up to four (sold cars can't be picked)
     with a sticky tray and a side-by-side dialog, saved-search alert toggles. KPIs and the price alert follow the list. */
  function initSaved() {
    var box = $('.js-sd');
    if (!box) {
      return;
    }
    var grid = $('.js-sd-grid');
    var cars = $$('.js-sd-car', grid);
    var s = { f: 0, so: 0, rm: {}, cmp: [] };
    var toast = $('.js-sd-toast');
    var tt = null;
    var num = function (el, k) { return parseFloat(el.getAttribute('data-' + k)); };
    var FILTERS = [function () { return true; }, function (c) { return num(c, 'drop') < 0; },
      function (c) { return c.getAttribute('data-status') === 'Available'; }, function (c) { return c.getAttribute('data-status') === 'Sold'; }];
    var SORTS = [function (a, b) { return num(a, 'age') - num(b, 'age'); }, function (a, b) { return num(a, 'price') - num(b, 'price'); },
      function (a, b) { return num(b, 'price') - num(a, 'price'); }, function (a, b) { return num(a, 'drop') - num(b, 'drop'); }];
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    function say(html) {
      toast.innerHTML = html;
      toast.classList.add('is-on');
      window.clearTimeout(tt);
      tt = window.setTimeout(function () { toast.classList.remove('is-on'); }, 5000);
    }

    function render() {
      var live = cars.filter(function (c) { return !s.rm[c.getAttribute('data-id')]; });
      $$('.js-sd-fn').forEach(function (el, i) { el.textContent = live.filter(FILTERS[i]).length; });
      var L = live.filter(FILTERS[s.f]).sort(SORTS[s.so]);
      cars.forEach(function (c) { c.hidden = true; });
      L.forEach(function (c, k) {
        c.hidden = false;
        grid.appendChild(c);
        $('.js-sd-n', c).textContent = pad(k + 1);
      });
      $('.js-sd-empty').hidden = L.length > 0;
      // KPIs and the price alert
      var drops = live.filter(FILTERS[1]);
      setText('.js-sd-k0', pad(live.length));
      setText('.js-sd-k1', pad(drops.length));
      setText('.js-sd-k2', pad(live.filter(FILTERS[2]).length));
      setText('.js-sd-k3', pad(s.cmp.length));
      $('.js-sd-alert').hidden = !drops.length;
      setText('.js-sd-dn', drops.length);
      setText('.js-sd-ds', fmt(-drops.reduce(function (t, c) { return t + num(c, 'drop'); }, 0)));
      $$('.js-sd-f').forEach(function (b) { press(b, +b.getAttribute('data-f') === s.f); });
      $$('.js-sd-s').forEach(function (b) { press(b, +b.getAttribute('data-s') === s.so); });
      // compare
      var full = s.cmp.length >= 4;
      cars.forEach(function (c) {
        var id = c.getAttribute('data-id');
        var on = s.cmp.indexOf(id) > -1;
        var b = $('.js-sd-cmp', c);
        c.classList.toggle('is-cmp', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = on ? '✓ In compare' : '+ Compare';
        // sold cars can't be compared; four picked cars lock the rest
        b.disabled = c.getAttribute('data-status') === 'Sold' || (full && !on);
      });
      $('.js-sd-tray').hidden = !s.cmp.length;
      setText('.js-sd-cn', s.cmp.length);
      $('.js-sd-chips').innerHTML = s.cmp.map(function (id) {
        var c = $('.js-sd-car[data-id="' + id + '"]', grid);
        return '<li class="sdtray__chip"><img class="sdtray__img" src="' + $('.sdc__img', c).getAttribute('src') + '" alt="" width="1376" height="864">' +
          '<button class="sdtray__x" type="button" data-id="' + id + '" aria-label="Remove ' + svEsc(c.getAttribute('data-name')) + ' from compare">×</button></li>';
      }).join('');
    }

    function compareTable() {
      var picked = s.cmp.map(function (id) { return $('.js-sd-car[data-id="' + id + '"]', grid); });
      var rows = [['Car', function (c) { return '<img class="sdcmp__img" src="' + $('.sdc__img', c).getAttribute('src') + '" alt="" width="1376" height="864"><span class="sdcmp__n">' + svEsc(c.getAttribute('data-name')) + '</span>'; }],
        ['Price', function (c) { return fmt(num(c, 'price')); }],
        ['Since saved', function (c) { var d = num(c, 'drop'); return d < 0 ? '▼ ' + fmt(-d) : d > 0 ? '▲ ' + fmt(d) : 'No change'; }],
        ['Details', function (c) { return svEsc(c.getAttribute('data-meta')); }],
        ['Status', function (c) { return c.getAttribute('data-status'); }]];
      $('.js-sd-table').innerHTML = '<table class="sdcmp__tb"><tbody>' + rows.map(function (r) {
        return '<tr><th scope="row">' + r[0] + '</th>' + picked.map(function (c) { return '<td>' + r[1](c) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
    }

    box.addEventListener('click', function (e) {
      var t = e.target;
      var f = t.closest('.js-sd-f');
      var so = t.closest('.js-sd-s');
      var cmp = t.closest('.js-sd-cmp');
      var un = t.closest('.js-sd-un');
      var x = t.closest('.sdtray__x');
      var al = t.closest('.js-sd-al');
      if (f) {
        s.f = +f.getAttribute('data-f');
      } else if (so) {
        s.so = +so.getAttribute('data-s');
      } else if (t.closest('.js-sd-drops')) {
        s.f = 1;
      } else if (cmp) {
        var id = cmp.closest('.js-sd-car').getAttribute('data-id');
        var at = s.cmp.indexOf(id);
        if (at > -1) {
          s.cmp.splice(at, 1);
        } else if (s.cmp.length < 4) {
          s.cmp.push(id);
        }
      } else if (x) {
        s.cmp = s.cmp.filter(function (v) { return v !== x.getAttribute('data-id'); });
      } else if (un) {
        var car = un.closest('.js-sd-car');
        var cid = car.getAttribute('data-id');
        s.rm[cid] = true;
        s.cmp = s.cmp.filter(function (v) { return v !== cid; });
        say(svEsc(car.getAttribute('data-name')) + ' removed from saved cars. <button class="sd__undo" type="button" data-id="' + cid + '">Undo</button>');
      } else if (t.closest('.sd__undo')) {
        delete s.rm[t.closest('.sd__undo').getAttribute('data-id')];
        toast.classList.remove('is-on');
      } else if (al) {
        var on = al.getAttribute('aria-pressed') !== 'true';
        al.setAttribute('aria-pressed', on ? 'true' : 'false');
        $('.js-sd-alt', al).textContent = on ? 'Alerts on' : 'Alerts off';
        return;
      } else if (t.closest('.js-sd-go')) {
        compareTable();
        var dlg = $('.js-sd-dlg');
        if (typeof dlg.showModal === 'function') {
          dlg.showModal();
        }
        return;
      } else if (t.closest('.js-sd-close')) {
        $('.js-sd-dlg').close();
        return;
      } else {
        return;
      }
      render();
    });
    // a note per car, kept in this browser
    var notes = shopGet('avava-saved-notes', {});
    cars.forEach(function (c) {
      var inp = $('.js-sd-note', c);
      var k = c.getAttribute('data-name');
      inp.value = notes[k] || '';
      inp.addEventListener('change', function () {
        notes[k] = inp.value.trim();
        shopSet('avava-saved-notes', notes);
      });
    });
    $('.js-sd-dlg').addEventListener('click', function (e) {
      if (e.target === this) {
        this.close();
      }
    });
    render();
  }

  /* My listings — status tabs (paused listings stay under Active), inline price editor with the market gauge, offers
     (accept / counter at the midpoint rounded to $500 / decline), boost, pause / resume, mark as sold, delete with undo,
     and a bill-of-sale download for sold cars. Bar heights and gauge positions come from data-h / data-l / data-w. */
  function initListings() {
    var box = $('.js-mlw');
    if (!box) {
      return;
    }
    var sheets = $$('.js-ml', box);
    var tab = 0;
    var toast = $('.js-ml-toast');
    var tt = null;
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    var TABS = [function (s) { return /Live|Paused/.test(s); }, function (s) { return s === 'Draft'; }, function (s) { return s === 'Review'; },
      function (s) { return s === 'Sold'; }, function () { return true; }];

    $$('[data-h]', box).forEach(function (el) { el.style.height = 'calc(var(--u) * ' + el.getAttribute('data-h') + ')'; });
    $$('[data-l]', box).forEach(function (el) { el.style.left = el.getAttribute('data-l') + '%'; });
    $$('[data-w]', box).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });

    function say(html) {
      toast.innerHTML = html;
      toast.classList.add('is-on');
      window.clearTimeout(tt);
      tt = window.setTimeout(function () { toast.classList.remove('is-on'); }, 5000);
    }
    function status(sh) {
      return sh.getAttribute('data-status');
    }
    function setStatus(sh, st) {
      sh.setAttribute('data-status', st);
      $('.js-ml-chipt', sh).textContent = st;
    }
    function gauge(sh) {
      var lo = +sh.getAttribute('data-lo');
      var hi = +sh.getAttribute('data-hi');
      var p = +sh.getAttribute('data-price');
      var a0 = lo * 0.92;
      var a1 = hi * 1.08;
      var mk = $('.js-ml-mk', sh);
      mk.style.left = Math.max(0, Math.min(100, (p - a0) / (a1 - a0) * 100)) + '%';
      var mks = $('.js-ml-mks', sh);
      var sold = status(sh) === 'Sold';
      var fair = p >= lo && p <= hi;
      var tone = sold ? 'sold' : fair ? 'ok' : 'out';
      mks.textContent = sold ? 'Sold at ' + fmt(p) : fair ? 'Fair price · in market range' : p > hi ? 'Above market · may sell slower' : 'Below market · consider raising';
      mks.className = 'mlg__s js-ml-mks mlg__s--' + tone;
      mk.className = 'mlg__mk js-ml-mk mlg__mk--' + tone;
      $$('.js-ml-offer', sh).forEach(function (o) {
        var d = +o.getAttribute('data-amt') - p;
        var el = $('.js-ml-diff', o);
        el.textContent = d === 0 ? 'At asking' : (d > 0 ? '+' : '−') + fmt(Math.abs(d)) + ' vs. asking';
        el.classList.toggle('is-ok', d >= -5000);
      });
    }
    function render() {
      var alive = sheets.filter(function (sh) { return !sh.classList.contains('is-gone'); });
      $$('.js-ml-tn', box).forEach(function (el, i) {
        el.textContent = alive.filter(function (sh) { return TABS[i](status(sh)); }).length;
      });
      var vis = 0;
      alive.forEach(function (sh) {
        var on = TABS[tab](status(sh));
        sh.hidden = !on;
        if (on) {
          vis += 1;
        }
      });
      sheets.filter(function (sh) { return sh.classList.contains('is-gone'); }).forEach(function (sh) { sh.hidden = true; });
      $('.js-ml-empty', box).hidden = vis > 0;
      $$('.js-ml-tab', box).forEach(function (b) {
        var on = +b.getAttribute('data-t') === tab;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var open = $$('.js-ml-offer', box).filter(function (o) { return !o.classList.contains('is-done') && !o.closest('.is-gone'); }).length;
      setText('.js-ml-k0', '0' + alive.filter(function (sh) { return /Live|Paused/.test(status(sh)); }).length);
      setText('.js-ml-k2', (open < 10 ? '0' : '') + open);
      $('.js-ml-k2', box).classList.toggle('is-hot', open > 0);
      setText('.js-ml-k2t', open ? 'Reply to keep buyers' : 'All answered');
    }

    box.addEventListener('click', function (e) {
      var t = e.target;
      var tb = t.closest('.js-ml-tab');
      if (tb) {
        tab = +tb.getAttribute('data-t');
        render();
        return;
      }
      var sh = t.closest('.js-ml');
      if (!sh) {
        if (t.closest('.ml__undo')) {
          var back = $('.js-ml[data-id="' + t.closest('.ml__undo').getAttribute('data-id') + '"]', box);
          back.classList.remove('is-gone');
          toast.classList.remove('is-on');
          render();
        }
        return;
      }
      var name = sh.getAttribute('data-name');
      if (t.closest('.js-ml-edit')) {
        $('.js-ml-pform', sh).hidden = false;
        $('.js-ml-price', sh).hidden = true;
        t.closest('.js-ml-edit').hidden = true;
        var inp = $('.js-ml-pin', sh);
        inp.focus();
        inp.select();
      } else if (t.closest('.js-ml-acc, .js-ml-ctr, .js-ml-dec')) {
        var o = t.closest('.js-ml-offer');
        var amt = +o.getAttribute('data-amt');
        var res = $('.js-ml-res', o);
        var kind = t.closest('.js-ml-acc') ? 'a' : t.closest('.js-ml-ctr') ? 'c' : 'd';
        res.textContent = kind === 'a' ? '✓ Accepted' : kind === 'c' ? '↺ Counter sent · ' + fmt(Math.round((amt + +sh.getAttribute('data-price')) / 2 / 500) * 500) : '✕ Declined';
        res.className = 'mlo__res js-ml-res mlo__res--' + kind;
        res.hidden = false;
        $('.js-ml-oacts', o).hidden = true;
        o.classList.add('is-done');
        o.classList.remove('is-new');
        var left = $$('.js-ml-offer', sh).filter(function (x) { return !x.classList.contains('is-done'); });
        setText('.js-ml-open', left.length);
        if (left[0]) {
          left[0].classList.add('is-new');
        }
        render();
      } else if (t.closest('.js-ml-boost')) {
        var bb = t.closest('.js-ml-boost');
        if (bb.getAttribute('aria-pressed') !== 'true') {
          bb.setAttribute('aria-pressed', 'true');
          bb.textContent = '✓ Boosted · 7 d';
          say(svEsc(name) + ' is boosted to the top of search for 7 days · $19 added to your next invoice.');
        }
      } else if (t.closest('.js-ml-pause')) {
        var pb = t.closest('.js-ml-pause');
        var paused = status(sh) === 'Paused';
        setStatus(sh, paused ? 'Live' : 'Paused');
        pb.textContent = paused ? 'Pause' : 'Resume';
        pb.setAttribute('aria-pressed', paused ? 'false' : 'true');
        render();
      } else if (t.closest('.js-ml-sold')) {
        setStatus(sh, 'Sold');
        sh.classList.add('is-sold');
        $('.js-ml-listed', sh).textContent = 'SOLD TODAY';
        $$('.js-ml-pause, .js-ml-boost, .js-ml-sold, .js-ml-edit', sh).forEach(function (b) { b.disabled = true; });
        gauge(sh);
        say(svEsc(name) + ' marked as sold at ' + fmt(+sh.getAttribute('data-price')) + '.');
        render();
      } else if (t.closest('.js-ml-del')) {
        sh.classList.add('is-gone');
        say(svEsc(name) + ' deleted. <button class="ml__undo" type="button" data-id="' + sh.getAttribute('data-id') + '">Undo</button>');
        render();
      } else if (t.closest('.js-ml-bill')) {
        var txt = ['AVAVA CAR MARKETPLACE — BILL OF SALE', '', 'Listing: ' + sh.getAttribute('data-id'), 'Vehicle: ' + name,
          'Price: ' + fmt(+sh.getAttribute('data-price')), 'Seller: Alex Rivera', 'Date: 14 Mar 2026', '', 'Sample document generated by the template.'].join('\r\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
        a.download = 'bill-of-sale-' + sh.getAttribute('data-id') + '.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    });
    box.addEventListener('submit', function (e) {
      var f = e.target.closest('.js-ml-pform');
      if (!f) {
        return;
      }
      e.preventDefault();
      var sh = f.closest('.js-ml');
      var v = parseInt($('.js-ml-pin', f).value.replace(/\D/g, ''), 10);
      if (v > 0) {
        sh.setAttribute('data-price', v);
        $('.js-ml-price', sh).textContent = fmt(v);
        gauge(sh);
      }
      f.hidden = true;
      $('.js-ml-price', sh).hidden = false;
      $('.js-ml-edit', sh).hidden = false;
    });
    box.addEventListener('input', function (e) {
      if (e.target.classList.contains('js-ml-pin')) {
        e.target.value = e.target.value.replace(/\D/g, '');
      }
    });
    render();
  }

  // A one-page PDF with plain text lines (Helvetica) — enough for a sample invoice without a library.
  function textPdf(lines) {
    var esc = function (t) { return String(t).replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7e]/g, '-'); };
    var body = 'BT /F1 11 Tf 56 780 Td 15 TL\n' + lines.map(function (l, i) {
      return (i ? 'T* ' : '') + '(' + esc(l) + ') Tj';
    }).join('\n') + '\nET';
    var objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Length ' + body.length + ' >>\nstream\n' + body + '\nendstream'];
    var out = '%PDF-1.4\n';
    var offs = [];
    objs.forEach(function (o, i) {
      offs.push(out.length);
      out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n';
    });
    var x = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(function (n) { return ('000000000' + n).slice(-10) + ' 00000 n \n'; }).join('') +
      'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF';
    return new Blob([out], { type: 'application/pdf' });
  }

  /* Orders — tabs × status chips × search filter the table (the active car order and returns follow the handoff's rules),
     rows expand, actions confirm in place, BUY AGAIN fills the shop carts, INVOICE downloads a PDF, RESCHEDULE moves the
     delivery to Sat 11 Oct. */
  function initOrders() {
    var box = $('.js-uo');
    if (!box) {
      return;
    }
    var rows = $$('.js-uo-row', box);
    var s = { tab: 0, sf: 0, q: '' };
    var toast = $('.js-uo-toast');
    var tt = null;
    var TB = [function () { return true; }, function (r) { return r.getAttribute('data-kind') === 'Car'; }, function (r) { return r.getAttribute('data-kind') === 'Shop'; }];
    var SF = [function () { return true; }, function (r) { return /progress|transit/.test(r.getAttribute('data-st')); },
      function (r) { return r.getAttribute('data-st') === 'delivered'; }, function (r) { return r.getAttribute('data-st') === 'return'; },
      function (r) { return r.getAttribute('data-st') === 'cancelled'; }];
    var fmt = function (n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); };

    function say(t) {
      toast.textContent = t;
      toast.classList.add('is-on');
      window.clearTimeout(tt);
      tt = window.setTimeout(function () { toast.classList.remove('is-on'); }, 4000);
    }
    function render() {
      var q = s.q.trim().toLowerCase();
      var n = 0;
      rows.forEach(function (r) {
        var on = TB[s.tab](r) && SF[s.sf](r) && (!q || r.getAttribute('data-text').indexOf(q) > -1);
        r.hidden = !on;
        if (on) {
          n += 1;
        }
      });
      $('.js-uo-empty', box).hidden = n > 0;
      $('.js-uo-active', box).hidden = !(s.tab !== 2 && s.sf <= 1 && !q);
      $('.js-uo-ret', box).hidden = !(s.tab !== 1 && (s.sf === 0 || s.sf === 3));
      $$('.js-uo-tab', box).forEach(function (b) {
        var on = +b.getAttribute('data-t') === s.tab;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $$('.js-uo-sf', box).forEach(function (b) { press(b, +b.getAttribute('data-s') === s.sf); });
    }

    $('.js-uo-q', box).addEventListener('input', function () {
      s.q = this.value;
      render();
    });
    box.addEventListener('click', function (e) {
      var t = e.target;
      var tb = t.closest('.js-uo-tab');
      var sf = t.closest('.js-uo-sf');
      var tog = t.closest('.js-uo-tog');
      var row = t.closest('.js-uo-row');
      if (tb) {
        s.tab = +tb.getAttribute('data-t');
        render();
      } else if (sf) {
        s.sf = +sf.getAttribute('data-s');
        render();
      } else if (tog) {
        var open = tog.getAttribute('aria-expanded') !== 'true';
        tog.setAttribute('aria-expanded', open ? 'true' : 'false');
        row.classList.toggle('is-open', open);
      } else if (t.closest('.js-uo-resch')) {
        var rb = t.closest('.js-uo-resch');
        var on = rb.getAttribute('aria-pressed') !== 'true';
        rb.setAttribute('aria-pressed', on ? 'true' : 'false');
        rb.textContent = on ? '✓ Rescheduled' : 'Reschedule';
        setText('.js-uo-eta', on ? 'Sat 11 Oct' : 'Thu 9 Oct');
        setText('.js-uo-etas', on ? 'Rescheduled · 9:00–12:00' : 'Enclosed transport · 9:00–12:00');
      } else if (t.closest('.js-uo-once')) {
        var b = t.closest('.js-uo-once');
        b.textContent = b.getAttribute('data-done');
        b.classList.add(b.getAttribute('data-tone') === 'amber' ? 'is-amber' : 'is-done');
        b.disabled = true;
      } else if (t.closest('.js-uo-again')) {
        var ab = t.closest('.js-uo-again');
        JSON.parse(row.getAttribute('data-cart')).forEach(function (c) {
          var cart = shopGet(c[0], {});
          cart[c[1]] = (cart[c[1]] || 0) + 1;
          shopSet(c[0], cart);
        });
        ab.textContent = ab.getAttribute('data-done');
        ab.classList.add('is-done');
        ab.disabled = true;
        say('Items from ' + row.getAttribute('data-id') + ' are in your cart — check out when you’re ready.');
      } else if (t.closest('.js-uo-track')) {
        var st = row.getAttribute('data-st');
        say(st === 'progress' ? 'Inspection done · shipping in enclosed transport, est. 06 Oct.' : 'Parts arrive at Avava Service LA before your install, Thu 9 Oct 10:30.');
      } else if (t.closest('.js-uo-pdf')) {
        var d = JSON.parse(row.getAttribute('data-pdf'));
        var lines = ['AVAVA CAR MARKETPLACE', 'Invoice ' + d.id + ' - ' + d.date, '', 'Billed to: Alex Rivera, 1200 Sunset Blvd, Los Angeles, CA 90028', ''];
        d.lines.forEach(function (l) { lines.push(l[0] + '  x' + l[1] + '  ' + (l[2] ? fmt(l[2] * l[1]) : 'Free')); });
        lines.push('', 'Shipping: ' + (d.ship ? fmt(d.ship) : 'Free'), 'Tax: ' + fmt(d.tax), 'Total: ' + fmt(d.total), 'Payment: ' + d.pay, '', 'Sample invoice generated by the template.');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(textPdf(lines));
        a.download = 'invoice-' + d.id + '.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    });
    render();
  }

  // Account › Test drives: the next drive (route, features, place, calendar, reschedule, cancel), tabs, past drives, quick book.
  function initTestDrives() {
    var box = $('.js-td');
    if (!box) {
      return;
    }
    var nx = $('.js-td-next', box);
    var D = JSON.parse(nx.getAttribute('data-td'));
    var s = { tab: 0, slot: D.slot, mode: 0, cancelled: false, cfm: false };
    var rows = $$('.js-td-row', box);
    var first = rows[0];

    function render() {
      var n = [0, 0, 0];
      rows.forEach(function (r) {
        var g = +r.getAttribute('data-grp');
        n[g] += 1;
        r.hidden = g !== s.tab;
      });
      $$('.js-td-tn', box).forEach(function (el, i) { el.textContent = n[i]; });
      $$('.js-td-tab', box).forEach(function (b) {
        var on = +b.getAttribute('data-t') === s.tab;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $('.js-td-empty', box).hidden = n[s.tab] > 0;
      nx.hidden = s.cancelled || s.tab !== 0;
    }
    function paintSlot() {
      var sl = D.slots[s.slot];
      setText('.js-td-date', sl[0]);
      setText('.js-td-time', sl[3]);
      setText('.js-td-in', sl[5]);
      $$('.js-td-cd', nx).forEach(function (el, i) { el.textContent = sl[4][i]; });
      $('.js-td-rday', first).textContent = sl[1];
      $('.js-td-rmon', first).textContent = sl[2];
      $('.js-td-rtime', first).textContent = sl[3];
      $$('.js-td-slot', nx).forEach(function (b) { press(b, +b.getAttribute('data-i') === s.slot); });
    }
    function ics() {
      var sl = D.slots[s.slot];
      var m = { Oct: 9 }[sl[2]];
      var hm = sl[3].split(':');
      var d = new Date(2026, m, +sl[1], +hm[0], +hm[1]);
      var end = new Date(d.getTime() + 60 * 60000);
      var z = function (x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
      var txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Avava//Test drive//EN', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@avava',
        'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(d), 'DTEND:' + z(end), 'SUMMARY:Test drive · ' + $('#td-next-t').textContent,
        'LOCATION:' + D.modes[s.mode][2].replace(/,/g, '\\,'), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
      a.download = 'avava-test-drive.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    box.addEventListener('click', function (e) {
      var t = e.target;
      var b;
      if ((b = t.closest('.js-td-tab'))) {
        s.tab = +b.getAttribute('data-t');
        render();
      } else if ((b = t.closest('.js-td-route'))) {
        var r = D.routes[+b.getAttribute('data-i')];
        $$('.js-td-route', nx).forEach(function (x) { press(x, x === b); });
        setText('.js-td-rname', r[0]);
        $$('.js-td-rs', nx).forEach(function (el, i) { el.textContent = r[i + 1]; });
        $$('.js-td-wt', nx).forEach(function (el, i) { el.textContent = r[4][i][0]; });
        $$('.js-td-wd', nx).forEach(function (el, i) { el.textContent = r[4][i][1]; });
      } else if ((b = t.closest('.js-td-try'))) {
        press(b, b.getAttribute('aria-pressed') !== 'true');
        setText('.js-td-tryn', $$('.js-td-try[aria-pressed="true"]', nx).length);
      } else if ((b = t.closest('.js-td-mode'))) {
        s.mode = +b.getAttribute('data-i');
        $$('.js-td-mode', nx).forEach(function (x) { press(x, x === b); });
        setText('.js-td-where', D.modes[s.mode][0]);
        setText('.js-td-addr', D.modes[s.mode][1]);
        $('.js-td-dir', nx).href = D.modes[s.mode][3];
      } else if ((b = t.closest('.js-td-up'))) {
        $('.js-td-file', nx).click();
      } else if ((b = t.closest('.js-td-cal'))) {
        ics();
        b.textContent = '✓ Added';
        b.classList.add('is-done');
      } else if ((b = t.closest('.js-td-resch'))) {
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        $('#td-slots').hidden = !open;
      } else if ((b = t.closest('.js-td-slot'))) {
        s.slot = +b.getAttribute('data-i');
        paintSlot();
        $('.js-td-resch', nx).setAttribute('aria-expanded', 'false');
        $('#td-slots').hidden = true;
        var cal = $('.js-td-cal', nx);
        cal.textContent = 'Add to calendar';
        cal.classList.remove('is-done');
      } else if ((b = t.closest('.js-td-cancel'))) {
        if (!s.cfm) {
          s.cfm = true;
          b.textContent = 'Confirm cancel';
          b.classList.add('is-warn');
          return;
        }
        s.cancelled = true;
        first.setAttribute('data-grp', '2');
        var st = $('.js-td-st', first);
        st.className = 'tdst tdst--cancelled js-td-st';
        $('.js-td-stt', st).textContent = 'Cancelled';
        render();
      } else if ((b = t.closest('.js-td-tog'))) {
        var on = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', on ? 'true' : 'false');
        b.closest('.js-td-row').classList.toggle('is-open', on);
      } else if ((b = t.closest('.js-td-star'))) {
        var v = +b.getAttribute('data-v');
        var row = b.closest('.js-td-row');
        $$('.js-td-star', row).forEach(function (x) { press(x, +x.getAttribute('data-v') <= v); });
        $('.js-td-thx', row).textContent = '✓ Thanks — rated ' + v + '/5';
      } else if ((b = t.closest('.js-td-nx'))) {
        var rw = b.closest('.js-td-row');
        $$('.js-td-nx', rw).forEach(function (x) { press(x, x === b); });
        $('.js-td-nxn', rw).textContent = b.getAttribute('data-note');
      } else if ((b = t.closest('.js-td-q'))) {
        var c = b.closest('.js-td-qc');
        $$('.js-td-q', c).forEach(function (x) { press(x, x === b); });
        var qs = $('.js-td-qs', c);
        qs.textContent = '✓ Requested · ' + b.textContent;
        qs.classList.add('is-ok');
      }
    });
    // insurance upload: the row turns green with the file name
    $('.js-td-file', nx).addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) {
        return;
      }
      var li = $('.js-td-up', nx).closest('.tdbr');
      li.classList.add('is-ok');
      $('.tdbr__m', li).textContent = '✓';
      var up = $('.js-td-up', nx);
      up.textContent = '✓ ' + (f.name.length > 14 ? f.name.slice(0, 12) + '…' : f.name);
      up.disabled = true;
    });
    render();
  }

  // Account › Trade-in & offers: instant offer (countdown, accept / inspection / decline), payout, tracker, offers on other cars.
  // Row actions by status — the same table as _dev/build_trade_in.py acts().
  var TX_ACTS = {
    pending: [['Raise offer', 'raised'], ['Withdraw', 'withdrawn']],
    raised: [['Raise offer', 'raised'], ['Withdraw', 'withdrawn']],
    countered: [['Accept', 'accepted', 'ok'], ['Withdraw', 'withdrawn']],
    declined: [['Make new offer', 'pending']],
    withdrawn: [['Make new offer', 'pending']],
    accepted: [['View order', 'order']]
  };
  var TX_ST = { pending: 'Pending', raised: 'Raised · pending', countered: 'Countered', accepted: 'Accepted', declined: 'Declined', withdrawn: 'Withdrawn' };

  function initTradeIn() {
    var box = $('.js-tx');
    if (!box) {
      return;
    }
    var panel = $('.js-tx-offer', box);
    var D = JSON.parse(panel.getAttribute('data-tx'));
    var s = { acc: false, dec: false, slot: null, tg: 0 };
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    var mo = function (n) { return n * 0.9 * 0.0197; };
    var toast = $('.js-tx-toast', box);
    var tt = null;
    function say(t) {
      toast.textContent = t;
      toast.classList.add('is-on');
      window.clearTimeout(tt);
      tt = window.setTimeout(function () { toast.classList.remove('is-on'); }, 4000);
    }

    // bars: positions come from the data, drawn here (no inline styles in the markup)
    $$('.js-tx-bar', box).forEach(function (b) {
      b.style.left = b.getAttribute('data-l') + '%';
      b.style.width = b.getAttribute('data-w') + '%';
    });

    // price lock countdown, ticking from the quoted 06 : 14 : 22 : 09
    var cells = $$('.js-tx-cd', panel);
    var left = ((+cells[0].textContent * 24 + +cells[1].textContent) * 60 + +cells[2].textContent) * 60 + +cells[3].textContent;
    window.setInterval(function () {
      left = Math.max(0, left - 1);
      var v = [Math.floor(left / 86400), Math.floor(left / 3600) % 24, Math.floor(left / 60) % 60, left % 60];
      cells.forEach(function (c, i) { c.textContent = (v[i] < 10 ? '0' : '') + v[i]; });
    }, 1000);

    function paintOffer() {
      var acc = $('.js-tx-acc', panel);
      var dec = $('.js-tx-dec', panel);
      panel.classList.toggle('is-dec', s.dec);
      setText('.js-tx-stt', s.dec ? 'Declined' : s.acc ? 'Accepted' : 'Offer ready');
      setText('.js-tx-valid', s.dec ? 'Offer closed' : s.acc ? 'Inspection next' : 'Valid 6 days');
      acc.textContent = s.acc ? '✓ Accepted' : 'Accept offer';
      acc.setAttribute('aria-pressed', s.acc ? 'true' : 'false');
      acc.disabled = s.dec;
      dec.textContent = s.dec ? 'Undo decline' : 'Decline offer';
      dec.setAttribute('aria-pressed', s.dec ? 'true' : 'false');
      var step = s.acc ? 3 : s.slot !== null ? 1 : 0;
      $$('.js-tx-step', panel).forEach(function (li, i) {
        var st = s.dec ? 'next' : i < step ? 'done' : i === step ? 'cur' : 'next';
        li.className = 'txsp txsp--' + st + ' js-tx-step';
        $('.js-tx-stn', li).textContent = st === 'done' ? '✓' : String(i + 1);
      });
      setText('.js-tx-insd', s.slot !== null ? D.slots[s.slot].replace(' · ', ' ') : 'Book a slot');
    }
    function paintTarget() {
      var price = D.targets[s.tg][1];
      var rest = Math.max(0, price - D.offer);
      setText('.js-tx-tp', fmt(price));
      setText('.js-tx-left', fmt(rest));
      setText('.js-tx-mo', fmt(mo(rest)));
      setText('.js-tx-save', rest ? 'Saves ' + fmt(mo(price) - mo(rest)) + '/mo vs. no trade-in' : 'Covers the full price · ' + fmt(D.offer - price) + ' back');
    }
    function paintRow(r) {
      var o = JSON.parse(r.getAttribute('data-o'));
      var st = r.getAttribute('data-st') || o.st;
      var cur = st === 'raised' ? Math.round((o.mine + o.ask) / 2 / 500) * 500 : st === 'accepted' && o.ctr ? o.ctr : o.mine;
      r.classList.toggle('is-counter', st === 'countered');
      $('.js-tx-mine', r).textContent = fmt(cur);
      $('.js-tx-pw', r).style.width = Math.min(100, cur / o.ask * 100) + '%';
      $('.js-tx-ctr', r).textContent = st === 'countered' ? 'Counter ' + fmt(o.ctr) : cur < o.ask ? '−' + fmt(o.ask - cur) + ' below' : 'At asking';
      var chip = $('.js-tx-ost', r);
      chip.className = 'txst txst--' + st + ' js-tx-ost';
      $('.js-tx-ostt', chip).textContent = TX_ST[st];
      $('.js-tx-acts', r).innerHTML = TX_ACTS[st].map(function (a) {
        var t = a[0] === 'Accept' ? 'Accept ' + fmt(o.ctr) : a[0];
        return a[1] === 'order' ? '<a class="txa" href="orders.html">' + t + '</a>'
          : '<button class="txa' + (a[2] ? ' txa--' + a[2] : '') + ' js-tx-act" type="button" data-to="' + a[1] + '">' + t + '</button>';
      }).join('');
    }

    box.addEventListener('click', function (e) {
      var t = e.target;
      var b;
      if ((b = t.closest('.js-tx-acc'))) {
        if (!s.dec) {
          s.acc = !s.acc;
          paintOffer();
          if (s.acc) {
            say('Offer accepted — the price is locked. Paperwork is next: e-sign takes about 10 minutes.');
          }
        }
      } else if ((b = t.closest('.js-tx-dec'))) {
        s.dec = !s.dec;
        s.acc = false;
        paintOffer();
      } else if ((b = t.closest('.js-tx-insp'))) {
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        $('.js-tx-slots', box).hidden = !open;
      } else if ((b = t.closest('.js-tx-slot'))) {
        s.slot = +b.getAttribute('data-i');
        $$('.js-tx-slot', box).forEach(function (x) { press(x, x === b); });
        var ib = $('.js-tx-insp', panel);
        ib.textContent = '✓ ' + D.slots[s.slot].split(' · ')[0];
        ib.classList.add('is-done');
        ib.setAttribute('aria-expanded', 'false');
        $('.js-tx-slots', box).hidden = true;
        paintOffer();
      } else if ((b = t.closest('.js-tx-tg'))) {
        s.tg = +b.getAttribute('data-i');
        $$('.js-tx-tg', panel).forEach(function (x) { press(x, x === b); });
        paintTarget();
      } else if ((b = t.closest('.js-tx-act'))) {
        var r = b.closest('.js-tx-row');
        var to = b.getAttribute('data-to');
        r.setAttribute('data-st', to);
        paintRow(r);
        say({ raised: 'Offer raised to the midpoint — the seller has 48 h to answer.', withdrawn: 'Offer withdrawn.',
          accepted: 'Counter accepted — the car is yours. We’ll open the order.', pending: 'New offer sent at your previous amount.' }[to]);
      }
    });
    $$('.js-tx-po', panel).forEach(function (l) {
      $('input', l).addEventListener('change', function () {
        $$('.js-tx-po', panel).forEach(function (x) { x.classList.toggle('is-on', $('input', x).checked); });
        $('.js-tx-apply', panel).hidden = this.value !== '0';
      });
    });
    $$('.js-tx-row', box).forEach(paintRow);
    paintOffer();
  }

  // Account › Messages: filters + search over the list, open a thread (marks it read), offer answers, add a test drive to
  // the calendar, send (Enter, Send or a quick reply) with a simulated reply after the typing indicator.
  function initMessages() {
    var box = $('.js-ms');
    if (!box) {
      return;
    }
    var rows = $$('.js-ms-row', box);
    var s = { f: 'all', q: '' };
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var FIT = {
      all: function () { return true; },
      buy: function (r) { return r.getAttribute('data-g') === 'buy'; },
      sell: function (r) { return r.getAttribute('data-g') === 'sell'; },
      team: function (r) { return r.getAttribute('data-g') === 'team'; },
      unread: function (r) { return r.classList.contains('is-unread'); }
    };

    function render() {
      var q = s.q.trim().toLowerCase();
      var n = 0;
      rows.forEach(function (r) {
        var on = FIT[s.f](r) && (!q || r.getAttribute('data-text').indexOf(q) > -1);
        r.parentNode.hidden = !on;
        if (on) {
          n += 1;
        }
      });
      $('.js-ms-empty', box).hidden = n > 0;
      $$('.js-ms-f', box).forEach(function (b) {
        var on = b.getAttribute('data-f') === s.f;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        $('.js-ms-fn', b).textContent = rows.filter(FIT[b.getAttribute('data-f')]).length;
      });
    }
    function open(id, quiet) {
      rows.forEach(function (r) {
        var on = r.getAttribute('data-id') === id;
        r.classList.toggle('is-on', on);
        r.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on && !quiet && r.classList.contains('is-unread')) {
          r.classList.remove('is-unread');
          var un = $('.js-ms-un', r);
          if (un) {
            un.remove();
          }
        }
      });
      $$('.js-ms-thread', box).forEach(function (t) { t.hidden = t.getAttribute('data-id') !== id; });
      var th = $('#ms-t-' + id);
      var list = $('.js-ms-msgs', th);
      list.scrollTop = list.scrollHeight;
      render();
    }
    function bubble(th, text, me) {
      var list = $('.js-ms-msgs', th);
      var li = document.createElement('li');
      li.className = 'msm msm--' + (me ? 'me' : 'them');
      li.innerHTML = '<p class="msb">' + esc(text) + '</p><span class="msm__meta">' + (me ? 'Now · Sent' : 'Now') + '</span>';
      list.appendChild(li);
      list.scrollTop = list.scrollHeight;
      var row = $('.js-ms-row[data-id="' + th.getAttribute('data-id') + '"]', box);
      $('.js-ms-last', row).textContent = (me ? 'You: ' : '') + text;
      row.setAttribute('data-text', row.getAttribute('data-text') + ' ' + text.toLowerCase());
    }
    function send(th, text) {
      text = text.trim();
      if (!text) {
        return;
      }
      bubble(th, text, true);
      var typing = $('.js-ms-typing', th);
      typing.hidden = false;
      window.setTimeout(function () {
        typing.hidden = true;
        bubble(th, th.getAttribute('data-reply'), false);
      }, 1400);
    }
    function ics(b) {
      var p = b.getAttribute('data-when').split(' · ');
      var d = new Date(p[0].replace(/^\w+ /, '') + ' 2026 ' + p[1]);
      var end = new Date(d.getTime() + 60 * 60000);
      var z = function (x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
      var txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Avava//Messages//EN', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@avava', 'DTSTAMP:' + z(new Date()),
        'DTSTART:' + z(d), 'DTEND:' + z(end), 'SUMMARY:Test drive · ' + b.getAttribute('data-car'), 'LOCATION:' + b.getAttribute('data-place').replace(/,/g, '\\,'),
        'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
      a.download = 'avava-test-drive.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    box.addEventListener('click', function (e) {
      var t = e.target;
      var b;
      if ((b = t.closest('.js-ms-f'))) {
        s.f = b.getAttribute('data-f');
        render();
      } else if ((b = t.closest('.js-ms-row'))) {
        open(b.getAttribute('data-id'));
      } else if ((b = t.closest('.js-ms-acc, .js-ms-ctr, .js-ms-dec'))) {
        var card = b.closest('.js-ms-offer');
        var amt = +card.getAttribute('data-amt');
        var ask = +card.getAttribute('data-ask');
        var kind = b.classList.contains('js-ms-acc') ? 'a' : b.classList.contains('js-ms-ctr') ? 'c' : 'd';
        var res = $('.js-ms-res', card);
        res.textContent = kind === 'a' ? '✓ Accepted' : kind === 'c' ? '↺ Counter sent · ' + fmt(Math.round((amt + ask) / 2 / 500) * 500) : '✕ Declined';
        res.className = 'msof__res js-ms-res msof__res--' + kind;
        res.hidden = false;
        $('.js-ms-oacts', card).hidden = true;
      } else if ((b = t.closest('.js-ms-cal'))) {
        if (b.getAttribute('aria-pressed') !== 'true') {
          ics(b);
          b.setAttribute('aria-pressed', 'true');
          b.textContent = '✓ Added to calendar';
        }
      } else if ((b = t.closest('.js-ms-quick'))) {
        send(b.closest('.js-ms-thread'), b.textContent);
      }
    });
    box.addEventListener('submit', function (e) {
      var f = e.target.closest('.js-ms-form');
      if (!f) {
        return;
      }
      e.preventDefault();
      var inp = $('.js-ms-in', f);
      send(f.closest('.js-ms-thread'), inp.value);
      inp.value = '';
      $('.js-ms-send', f).disabled = true;
    });
    box.addEventListener('input', function (e) {
      if (e.target.classList.contains('js-ms-in')) {
        $('.js-ms-send', e.target.closest('.js-ms-form')).disabled = !e.target.value.trim();
      } else if (e.target.classList.contains('js-ms-q')) {
        s.q = e.target.value;
        render();
      }
    });
    // the first thread shows on load; it is marked read once the user opens it
    open(rows[0].getAttribute('data-id'), true);
  }

  // Account › Payment methods: default / update / remove (inline confirm) methods, the add form (card · bank · wallet, validated,
  // the new method joins the row), finance autopay + Pay now, history filter and receipts (a generated PDF).
  function initPayments() {
    var box = $('.js-pm');
    if (!box) {
      return;
    }
    var list = $('.js-pm-ms', box);
    var form = $('.js-pm-add', box);
    var openBtn = $('.js-pm-open', box);
    var toast = $('.js-pm-toast', box);
    var tt = null;
    var tab = 0;
    var SAVE = ['Save card', 'Connect bank', 'Add wallet'];
    function say(t) {
      toast.textContent = t;
      toast.classList.add('is-on');
      window.clearTimeout(tt);
      tt = window.setTimeout(function () { toast.classList.remove('is-on'); }, 4000);
    }
    function ring(n) {
      var r = $('.js-pm-ring', box);
      r.style.setProperty('--p', (n / 60 * 100) + '%');
      setText('.js-pm-pn', n);
    }
    // the action pills follow the method's state: default, expiring, or neither
    function acts(li) {
      var exp = $('.js-pm-exp', li);
      var expiring = exp && !exp.hidden;
      $('.js-pm-acts', li).innerHTML = li.classList.contains('is-def') ? '<span class="pmm__def">✓ Default method</span>' :
        '<button class="pma js-pm-def" type="button">Make default</button>' + (expiring ? '<button class="pma pma--amber js-pm-upd" type="button">Update</button>' : '') +
        '<button class="pma pma--mute js-pm-rm" type="button">Remove</button>';
    }
    function fields() {
      var v = {};
      $$('.js-pm-in', form).forEach(function (i) { v[i.name] = i.value.trim(); });
      return v;
    }
    function valid() {
      if (tab !== 0) {
        return true;
      }
      var v = fields();
      return v.num.replace(/\D/g, '').length >= 15 && /^\d{2} ?\/ ?\d{2}$/.test(v.exp) && v.cvc.replace(/\D/g, '').length >= 3;
    }
    function paintForm() {
      $$('.js-pm-tab', form).forEach(function (b) { press(b, +b.getAttribute('data-t') === tab); });
      $$('.js-pm-pane', form).forEach(function (p) { p.hidden = +p.getAttribute('data-t') !== tab; });
      var go = $('.js-pm-save', form);
      go.textContent = SAVE[tab];
      go.disabled = !valid();
    }
    function showForm(on) {
      form.hidden = !on;
      openBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) {
        paintForm();
        form.scrollIntoView({ block: 'nearest' });
      }
    }

    ring(+$('.js-pm-ring', box).getAttribute('data-p'));

    box.addEventListener('click', function (e) {
      var t = e.target;
      var b;
      var li = t.closest('.js-pm-m');
      if ((b = t.closest('.js-pm-def'))) {
        $$('.js-pm-m', list).forEach(function (m) {
          m.classList.toggle('is-def', m === li);
          acts(m);
        });
        say(li.getAttribute('data-mask') + ' is now your default payment method.');
      } else if ((b = t.closest('.js-pm-upd'))) {
        $('.js-pm-exp', li).hidden = true;
        $('.js-pm-date', li).textContent = '11/30';
        $('.js-pm-sub', li).textContent = 'Updated · expires 11/30';
        acts(li);
      } else if ((b = t.closest('.js-pm-rm'))) {
        $('.js-pm-acts', li).hidden = true;
        $('.js-pm-cfm', li).hidden = false;
      } else if ((b = t.closest('.js-pm-keep'))) {
        $('.js-pm-acts', li).hidden = false;
        $('.js-pm-cfm', li).hidden = true;
      } else if ((b = t.closest('.js-pm-yes'))) {
        li.hidden = true;
        say(li.getAttribute('data-mask') + ' removed.');
      } else if ((b = t.closest('.js-pm-open'))) {
        showForm(form.hidden);
      } else if ((b = t.closest('.js-pm-cancel'))) {
        showForm(false);
      } else if ((b = t.closest('.js-pm-tab'))) {
        tab = +b.getAttribute('data-t');
        paintForm();
      } else if ((b = t.closest('.js-pm-auto'))) {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        say(on ? 'Autopay is on — payments come from Chase ••4821 on the 28th.' : 'Autopay is off — we’ll remind you before each payment.');
      } else if ((b = t.closest('.js-pm-pay'))) {
        if (!b.classList.contains('is-done')) {
          b.classList.add('is-done');
          b.textContent = '✓ Paid $3,350';
          ring(3);
          setText('.js-pm-bal', '$187,600');
          setText('.js-pm-next', 'Paid · next on 28 Nov');
        }
      } else if ((b = t.closest('.js-pm-hf'))) {
        var f = b.getAttribute('data-f');
        $$('.js-pm-hf', box).forEach(function (x) { press(x, x === b); });
        $$('.js-pm-h', box).forEach(function (h) { h.hidden = f !== 'all' && h.getAttribute('data-g') !== f; });
      } else if ((b = t.closest('.js-pm-rc'))) {
        var d = JSON.parse(b.closest('.js-pm-h').getAttribute('data-pdf'));
        var a = document.createElement('a');
        a.href = URL.createObjectURL(textPdf(['AVAVA CAR MARKETPLACE', 'Receipt ' + d.id + ' - ' + d.date, '', d.title, 'Amount: ' + d.amt.replace('−', '-'),
          'Method: ' + d.via.replace(/•/g, '*'), 'Status: ' + d.st, '', 'Alex Rivera, 1200 Sunset Blvd, Los Angeles, CA 90028', '', 'Sample receipt generated by the template.']));
        a.download = 'receipt-' + d.id + '.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        b.textContent = '✓ Saved';
        b.classList.add('is-done');
      }
    });
    form.addEventListener('input', function () { $('.js-pm-save', form).disabled = !valid(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid()) {
        return;
      }
      var v = fields();
      var digits = v.num.replace(/\D/g, '');
      var m = tab === 0 ? { brand: digits[0] === '5' ? 'Mastercard' : digits[0] === '3' ? 'Amex' : 'Visa', last: digits.slice(-4), exp: v.exp.replace(/ /g, ''), holder: v.nm || 'Alex Rivera', sub: 'Added just now', look: 'acc' } :
        tab === 1 ? { brand: 'Bank of America', last: '7730', exp: 'ACH', holder: 'Checking', sub: 'Checking · verifying (1–2 days)', look: 'line' } :
        { brand: 'Google Pay', last: '', exp: 'Android', holder: 'Alex Rivera', sub: 'Quick checkout in the Avava shop', look: 'tile' };
      var li = $('.js-pm-tpl', box).content.firstElementChild.cloneNode(true);
      var mask = m.last ? '•••• ' + m.last : m.brand;
      li.setAttribute('data-id', 'n' + Date.now());
      li.setAttribute('data-mask', mask);
      $('.pmc', li).className = 'pmc pmc--' + m.look;
      $('.js-pm-tb', li).textContent = m.brand;
      $('.js-pm-tn', li).textContent = m.last ? mask : '';
      $('.js-pm-th', li).textContent = m.holder;
      $('.js-pm-date', li).textContent = m.exp;
      $('.js-pm-sub', li).textContent = m.sub;
      $('.js-pm-tq', li).textContent = 'Remove ' + mask + '?';
      list.insertBefore(li, $('.pmms__add', list));
      $$('.js-pm-in', form).forEach(function (i) { i.value = i.name === 'nm' ? 'Alex Rivera' : ''; });
      showForm(false);
      say(mask + ' added to your payment methods.');
    });
  }

  // Account › Notifications: Activity (filters, read on click, CTA → ✓ Opened then its page, hide with undo, mark all) and
  // Settings (channel switches, frequency, quiet hours + pause, devices, test notification).
  function initNotifications() {
    var box = $('.js-nx');
    if (!box) {
      return;
    }
    var alerts = $$('.js-nx-a', box);
    var f = 'all';
    var last = null;
    var toast = $('.js-nx-toast', box);
    var tt = null;
    function say(t) {
      toast.textContent = t;
      toast.classList.add('is-on');
      window.clearTimeout(tt);
      tt = window.setTimeout(function () { toast.classList.remove('is-on'); }, 4000);
    }
    function fits(a, key) {
      if (key === 'all') {
        return true;
      }
      if (key === 'unread') {
        return a.classList.contains('is-unread');
      }
      return key.split(' ').indexOf(a.getAttribute('data-ty')) > -1;
    }
    function render() {
      var live = alerts.filter(function (a) { return !a.classList.contains('is-gone'); });
      var un = live.filter(function (a) { return a.classList.contains('is-unread'); }).length;
      var shown = 0;
      alerts.forEach(function (a) {
        var on = !a.classList.contains('is-gone') && fits(a, f);
        a.hidden = !on;
        if (on) {
          shown += 1;
        }
      });
      $$('.js-nx-g', box).forEach(function (g) { g.hidden = !$$('.js-nx-a', g).some(function (a) { return !a.hidden; }); });
      $('.js-nx-empty', box).hidden = shown > 0;
      $$('.js-nx-f', box).forEach(function (b) {
        var on = b.getAttribute('data-f') === f;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        $('.js-nx-fn', b).textContent = live.filter(function (a) { return fits(a, b.getAttribute('data-f')); }).length;
      });
      setText('.js-nx-un', un ? un + ' unread' : 'All caught up');
      setText('.js-nx-modeun', un ? ' · ' + un : '');
      var all = $('.js-nx-all', box);
      all.textContent = un ? 'Mark all as read' : '✓ All read';
      all.disabled = !un;
    }
    function read(a) {
      a.classList.remove('is-unread');
    }

    box.addEventListener('click', function (e) {
      var t = e.target;
      var b;
      var a = t.closest('.js-nx-a');
      if ((b = t.closest('.js-nx-mode'))) {
        var m = b.getAttribute('data-m');
        $$('.js-nx-mode', box).forEach(function (x) { press(x, x === b); });
        $$('.js-nx-pane', box).forEach(function (p) { p.hidden = p.getAttribute('data-mode') !== m; });
      } else if ((b = t.closest('.js-nx-f'))) {
        f = b.getAttribute('data-f');
        render();
      } else if ((b = t.closest('.js-nx-all'))) {
        alerts.forEach(read);
        render();
      } else if ((b = t.closest('.js-nx-hide'))) {
        a.classList.add('is-gone');
        last = a;
        $('.js-nx-undo', box).hidden = false;
        render();
      } else if ((b = t.closest('.js-nx-back'))) {
        if (last) {
          last.classList.remove('is-gone');
          last = null;
        }
        $('.js-nx-undo', box).hidden = true;
        render();
      } else if ((b = t.closest('.js-nx-cta'))) {
        // the first click confirms in place, the next one follows the link
        if (!b.classList.contains('is-done')) {
          e.preventDefault();
          b.classList.add('is-done');
          b.textContent = '✓ Opened';
          read(a);
          render();
        }
      } else if (a) {
        read(a);
        render();
      } else if ((b = t.closest('.js-nx-mx'))) {
        b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
      } else if ((b = t.closest('.js-nx-fq, .js-nx-pz'))) {
        $$('.nxseg__b', b.parentNode).forEach(function (x) { press(x, x === b); });
        if (b.classList.contains('js-nx-pz')) {
          var i = +b.getAttribute('data-i');
          setText('.js-nx-pzn', i ? 'Paused until ' + (i === 1 ? 'tomorrow 10:00' : 'Thu 16 Oct') + ' — payments & security still come through' : 'Everything is on');
        }
      } else if ((b = t.closest('.js-nx-qh'))) {
        var on = b.getAttribute('aria-checked') !== 'true';
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        quiet(on);
      } else if ((b = t.closest('.js-nx-qs'))) {
        $$('.js-nx-qs', box).forEach(function (x) { press(x, x === b); });
        $('.js-nx-qh', box).setAttribute('aria-checked', 'true');
        quiet(true);
      } else if ((b = t.closest('.js-nx-rmdev'))) {
        var dev = b.closest('.js-nx-dev');
        dev.hidden = true;
        say($('.nxdev__t', dev).textContent + ' won’t get push alerts any more.');
      } else if ((b = t.closest('.js-nx-test'))) {
        b.textContent = '✓ Test sent to your devices';
        b.disabled = true;
      }
    });
    function quiet(on) {
      var p = $('.js-nx-qs[aria-pressed="true"]', box);
      $('.js-nx-qhs', box).classList.toggle('is-off', !on);
      setText('.js-nx-qhn', on ? 'Alerts are held ' + p.getAttribute('data-t') + ' (Los Angeles time) and arrive in the morning.' : 'Off — alerts arrive any time.');
    }
    render();
  }

  // Account › Security: the score follows five checks (strong password, two-step on, ID, a passkey, backup codes) and offers
  // the next missing step; password change with a strength meter, passkeys, sessions, two-step switches, backup codes (.txt),
  // privacy switches, data export, reporting a suspicious sign-in and deactivation with an inline confirm.
  function initSecurity() {
    var box = $('.js-sx');
    if (!box) {
      return;
    }
    var pks = 0;
    var codes = null;
    var toast = $('.js-sx-toast', box);
    var tt = null;
    var LV = ['Weak', 'Weak', 'Weak', 'Good', 'Strong', 'Excellent'];
    function say(t) {
      toast.textContent = t;
      toast.classList.add('is-on');
      window.clearTimeout(tt);
      tt = window.setTimeout(function () { toast.classList.remove('is-on'); }, 4000);
    }
    function tfaOn() {
      return $$('.js-sx-tfa', box).some(function (b) { return b.getAttribute('aria-checked') === 'true'; });
    }
    function score() {
      var ok = { pw: true, tfa: tfaOn(), id: true, pk: pks > 0, codes: !!codes };
      var n = Object.keys(ok).filter(function (k) { return ok[k]; }).length;
      var card = $('.js-sx-score', box);
      card.classList.toggle('is-strong', n >= 4);
      card.classList.toggle('is-weak', n <= 2);
      $('.js-sx-ring', box).style.setProperty('--p', n * 20 + '%');
      setText('.js-sx-n', n);
      setText('.js-sx-lvl', LV[n]);
      setText('.js-sx-head', n >= 5 ? 'Your account is fully protected' : 'Your account is ' + LV[n].toLowerCase() + ' — one step makes it stronger');
      $$('.js-sx-chk', box).forEach(function (c) { c.classList.toggle('is-ok', ok[c.getAttribute('data-k')]); });
      var next = $('.js-sx-next', box);
      var step = !ok.pk ? ['Add a passkey', 'pk'] : !ok.codes ? ['Generate backup codes', 'codes'] : !ok.tfa ? ['Turn on two-step', 'tfa'] : null;
      next.hidden = !step;
      if (step) {
        next.textContent = step[0] + ' →';
        next.setAttribute('data-do', step[1]);
      }
    }
    function addPasskey() {
      var li = document.createElement('li');
      li.className = 'sxpk';
      li.innerHTML = '<span class="sxpk__t">' + (pks ? 'MacBook Pro · Touch ID' : 'iPhone 15 Pro · Face ID') + '</span><span class="sxpk__d">Added just now</span>' +
        '<button class="sxpk__rm js-sx-pkrm" type="button">Remove</button>';
      $('.js-sx-pks', box).appendChild(li);
      pks += 1;
      paintPk();
    }
    function paintPk() {
      setText('.js-sx-pksub', pks ? pks + ' passkey' + (pks > 1 ? 's' : '') + ' · sign in with Face ID or Touch ID' : 'Not set up — sign in with Face ID or Touch ID instead of a password');
      score();
    }
    function genCodes() {
      var r = function () { return Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X'); };
      codes = [];
      for (var i = 0; i < 10; i += 1) {
        codes.push((r() + '0000').slice(0, 4) + '-' + (r() + '0000').slice(0, 4));
      }
      $('.js-sx-codelist', box).innerHTML = codes.map(function (c) { return '<li>' + c + '</li>'; }).join('');
      $('.js-sx-codes', box).hidden = false;
      setText('.js-sx-codesub', '10 one-time codes · generated just now');
      setText('.js-sx-gen', 'Regenerate');
      var dl = $('.js-sx-dl', box);
      dl.textContent = 'Download%20.html';
      dl.classList.remove('is-done');
      score();
    }
    function strength(v) {
      var n = (v.length >= 8 ? 1 : 0) + (v.length >= 12 ? 1 : 0) + (/[A-Z]/.test(v) ? 1 : 0) + (/[0-9]/.test(v) ? 1 : 0) + (/[^A-Za-z0-9]/.test(v) ? 1 : 0) - (v.length < 8 ? 1 : 0);
      return Math.max(0, Math.min(4, n));
    }
    function paintPw() {
      var f = $('.js-sx-pwform', box);
      var v = {};
      $$('.js-sx-pw', f).forEach(function (i) { v[i.name] = i.value; });
      var st = strength(v.nw);
      var match = v.nw && v.nw === v.cf;
      var col = ['var(--acc)', 'var(--acc)', 'var(--gr-amber)', 'var(--pd-ok)', 'var(--pd-ok)'][st];
      var meter = $('.sxstr', f);
      meter.style.setProperty('--s', col);
      meter.classList.toggle('is-typed', !!v.nw);
      $$('.sxstr__s', f).forEach(function (sg, i) { sg.classList.toggle('is-on', i < st); });
      setText('.js-sx-strt', !v.nw ? 'At least 12 characters with a number and a symbol' : ['Too weak', 'Weak', 'Okay', 'Strong', 'Very strong'][st] + (v.cf && !match ? ' · passwords don’t match' : ''));
      $$('.js-sx-pw', f).forEach(function (i) {
        var lab = i.closest('.sxpf');
        var good = i.name === 'cur' ? !!v.cur : i.name === 'nw' ? st >= 3 : match;
        lab.classList.toggle('is-ok', !!i.value && good);
        lab.classList.toggle('is-bad', !!i.value && !good);
      });
      $('.js-sx-pwsave', f).disabled = !(v.cur && st >= 3 && match);
    }
    function done(b, text) {
      b.textContent = text;
      b.classList.add('is-done');
      b.disabled = true;
    }

    box.addEventListener('click', function (e) {
      var t = e.target;
      var b;
      if ((b = t.closest('.js-sx-next'))) {
        var d = b.getAttribute('data-do');
        if (d === 'pk') {
          addPasskey();
        } else if (d === 'codes') {
          genCodes();
        } else {
          $('.js-sx-tfa', box).setAttribute('aria-checked', 'true');
          score();
        }
      } else if ((b = t.closest('.js-sx-pkadd'))) {
        addPasskey();
      } else if ((b = t.closest('.js-sx-pkrm'))) {
        b.closest('.sxpk').remove();
        pks -= 1;
        paintPk();
      } else if ((b = t.closest('.js-sx-pwopen'))) {
        var f = $('.js-sx-pwform', box);
        var open = f.hidden;
        f.hidden = !open;
        b.textContent = open ? 'Cancel' : 'Change password';
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          paintPw();
          $('.js-sx-pw', f).focus();
        }
      } else if ((b = t.closest('.js-sx-sw'))) {
        b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
        score();
      } else if ((b = t.closest('.js-sx-out'))) {
        b.closest('.js-sx-dev').hidden = true;
        say('Signed out of ' + $('.sxdev__t', b.closest('.js-sx-dev')).firstChild.textContent + '.');
      } else if ((b = t.closest('.js-sx-outall'))) {
        $$('.js-sx-dev:not(.is-cur)', box).forEach(function (x) { x.hidden = true; });
        done(b, '✓ Signed out of other devices');
      } else if ((b = t.closest('.js-sx-export'))) {
        done(b, '✓ Preparing your data — we’ll email a link');
      } else if ((b = t.closest('.js-sx-gen'))) {
        genCodes();
      } else if ((b = t.closest('.js-sx-dl'))) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['AVAVA backup codes — each works once\r\n\r\n' + codes.join('\r\n') + '\r\n'], { type: 'text/plain' }));
        a.download = 'avava-backup-codes.html';
        document.body.appendChild(a);
        a.click();
        a.remove();
        b.textContent = '✓ Downloaded';
        b.classList.add('is-done');
      } else if ((b = t.closest('.js-sx-rep'))) {
        done(b, '✓ Reported · we blocked it');
        b.closest('.js-sx-bad').classList.add('is-done');
      } else if ((b = t.closest('.js-sx-dz'))) {
        $('.js-sx-ask', box).hidden = false;
      } else if ((b = t.closest('.js-sx-dzno'))) {
        $('.js-sx-ask', box).hidden = true;
      } else if ((b = t.closest('.js-sx-dzyes'))) {
        $('.js-sx-ask', box).hidden = true;
        $('.js-sx-done', box).hidden = false;
        done($('.js-sx-dz', box), 'Done');
      }
    });
    var pwf = $('.js-sx-pwform', box);
    pwf.addEventListener('input', paintPw);
    pwf.addEventListener('submit', function (e) {
      e.preventDefault();
      if ($('.js-sx-pwsave', pwf).disabled) {
        return;
      }
      $$('.js-sx-pw', pwf).forEach(function (i) { i.value = ''; });
      pwf.hidden = true;
      var ob = $('.js-sx-pwopen', box);
      ob.textContent = 'Change password';
      ob.setAttribute('aria-expanded', 'false');
      setText('.js-sx-pwsub', 'Changed just now');
      var li = document.createElement('li');
      li.className = 'sxev sxev--ok';
      li.innerHTML = '<span class="sxev__dot" aria-hidden="true"></span><span class="sxrow__b"><span class="sxev__t">Password changed</span><span class="sxrow__k">This device · just now</span></span>';
      var list = $('.js-sx-evs', box);
      list.insertBefore(li, list.firstChild);
      say('Password updated. Other devices will be asked to sign in again.');
    });
    score();
  }

  // Account › Preferences: every [data-k] control (segments, chips, switches) writes only the changed values to
  // localStorage "avava-prefs"; the preview, radius labels and budget follow currency / units / date format. Theme
  // ("avava-theme": light / dark / system), accent ("avava-accent": v1 / v2 / v3) and reduce motion ("avava-motion") apply
  // to the whole site through theme.js. The bar confirms each change for 4 s; Reset clears the stored values.
  function initPreferences() {
    var box = $('.js-pq');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-def'));
    var B = JSON.parse(box.getAttribute('data-budget'));
    var v = shopGet('avava-prefs', {}) || {};
    var touched = Object.keys(v).length > 0;
    var tt = null;
    var CUR = [['$', 1], ['€', 0.92], ['£', 0.79]];
    var RAD = [['25 mi', '50 mi', '100 mi', 'Anywhere'], ['40 km', '80 km', '160 km', 'Anywhere']];
    function val(k) {
      return Object.prototype.hasOwnProperty.call(v, k) ? v[k] : D[k];
    }
    function money(n) {
      var c = CUR[val('cur')];
      return c[0] + Math.round(n * c[1]).toLocaleString('en-US');
    }
    function store(k, x) {
      if (JSON.stringify(x) === JSON.stringify(D[k])) {
        delete v[k];
      } else {
        v[k] = x;
      }
      shopSet('avava-prefs', v);
      saved();
    }
    function saved() {
      touched = true;
      var bar = $('.js-pq-bar', box);
      bar.classList.add('is-saved');
      setText('.js-pq-bart', '✓ Saved — changes apply across Avava right away');
      window.clearTimeout(tt);
      tt = window.setTimeout(function () {
        bar.classList.remove('is-saved');
        setText('.js-pq-bart', touched ? 'All changes saved automatically' : 'Using default preferences');
      }, 4000);
    }
    function themeNow() {
      var t = null;
      try {
        t = window.localStorage.getItem('avava-theme');
      } catch (e) {
        t = null;
      }
      return t === 'system' || t === 'dark' || t === 'light' ? t : (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    }
    function accentNow() {
      var a = null;
      try {
        a = window.localStorage.getItem('avava-accent');
      } catch (e) {
        a = null;
      }
      return HOMES[a] ? a : 'v1';
    }
    function paint() {
      $$('.pqseg[data-k]', box).forEach(function (g) {
        var cur = val(g.getAttribute('data-k'));
        $$('.js-pq-seg', g).forEach(function (b) { press(b, +b.getAttribute('data-v') === cur); });
      });
      $$('.pqchips[data-k]', box).forEach(function (g) {
        var on = val(g.getAttribute('data-k'));
        $$('.js-pq-chip', g).forEach(function (b) { press(b, on.indexOf(+b.getAttribute('data-v')) > -1); });
      });
      $$('.js-pq-sw:not(:disabled)', box).forEach(function (b) { b.setAttribute('aria-checked', val(b.getAttribute('data-k')) ? 'true' : 'false'); });
      // labels that follow units, currency and date format
      var km = val('units') === 1;
      $$('.pqseg[data-k="radius"] .js-pq-seg', box).forEach(function (b, i) { b.textContent = RAD[km ? 1 : 0][i]; });
      var date = val('datef') ? 'Thu, 9 Oct' : 'Thu, Oct 9';
      setText('.js-pq-prev', money(241000) + ' · ' + (km ? '1,448 km' : '900 mi') + ' · ' + date + ' · 14:30');
      var mo = val('pay') === 1;
      var f = B[val('bfrom')];
      var t = B[val('bto')];
      var fmt = function (n) { return mo ? money(n * 0.0193) + '/mo' : money(n); };
      $$('.js-pq-bv', box).forEach(function (el, i) { el.textContent = fmt(i ? t : f); });
      setText('.js-pq-bsub', mo ? 'Shown as a monthly payment over ' + [36, 48, 60, 72][val('term')] + ' months' : 'Total car price');
      $$('.pqstep', box).forEach(function (st) {
        var k = st.getAttribute('data-b');
        var i = val(k);
        $('.js-pq-step[data-d="-1"]', st).disabled = k === 'bfrom' ? i <= 0 : i <= val('bfrom') + 1;
        $('.js-pq-step[data-d="1"]', st).disabled = k === 'bfrom' ? i >= val('bto') - 1 : i >= B.length - 1;
      });
      var th = themeNow();
      $$('.js-pq-theme', box).forEach(function (b) { press(b, b.getAttribute('data-t') === th); });
      var ac = accentNow();
      $$('.js-pq-acc', box).forEach(function (b) { press(b, b.getAttribute('data-a') === ac); });
    }
    function motion(on) {
      try {
        if (on) {
          window.localStorage.setItem('avava-motion', 'reduce');
        } else {
          window.localStorage.removeItem('avava-motion');
        }
      } catch (e) {
        // storage blocked — the attribute still applies to this page
      }
      if (on) {
        root.setAttribute('data-motion', 'reduce');
      } else {
        root.removeAttribute('data-motion');
      }
    }

    box.addEventListener('click', function (e) {
      var t = e.target;
      var b;
      if ((b = t.closest('.js-pq-seg'))) {
        store(b.closest('[data-k]').getAttribute('data-k'), +b.getAttribute('data-v'));
      } else if ((b = t.closest('.js-pq-chip'))) {
        var k = b.closest('[data-k]').getAttribute('data-k');
        var x = +b.getAttribute('data-v');
        var on = val(k).slice();
        var at = on.indexOf(x);
        if (at > -1) {
          on.splice(at, 1);
        } else {
          on.push(x);
          on.sort(function (p, q) { return p - q; });
        }
        store(k, on);
      } else if ((b = t.closest('.js-pq-sw'))) {
        var sk = b.getAttribute('data-k');
        store(sk, !val(sk));
        if (sk === 'motion') {
          motion(val('motion'));
        }
      } else if ((b = t.closest('.js-pq-step'))) {
        var bk = b.closest('.pqstep').getAttribute('data-b');
        store(bk, val(bk) + +b.getAttribute('data-d'));
      } else if ((b = t.closest('.js-pq-theme'))) {
        var th = b.getAttribute('data-t');
        try {
          window.localStorage.setItem('avava-theme', th);
        } catch (er) {
          // storage blocked — the theme still changes on this page
        }
        var os = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', th === 'dark' || (th === 'system' && os) ? 'dark' : 'light');
        saved();
      } else if ((b = t.closest('.js-pq-acc'))) {
        var a = b.getAttribute('data-a');
        try {
          window.localStorage.setItem('avava-accent', a);
        } catch (er) {
          // storage blocked — the accent still changes on this page
        }
        applyAccent(a);
        saved();
      } else if ((b = t.closest('.js-pq-clear'))) {
        b.textContent = '✓ Cleared';
        b.disabled = true;
        setText('.js-pq-hist', 'No cars viewed yet');
        saved();
      } else if ((b = t.closest('.js-pq-reset'))) {
        v = {};
        shopSet('avava-prefs', v);
        motion(false);
        touched = false;
        window.clearTimeout(tt);
        $('.js-pq-bar', box).classList.remove('is-saved');
        setText('.js-pq-bart', 'Using default preferences');
      } else {
        return;
      }
      paint();
    });
    if (touched) {
      setText('.js-pq-bart', 'All changes saved automatically');
    }
    paint();
  }

  // Sell my car: a 7-step wizard. One state object; each step has a validity rule, the bar lets you jump up to the first
  // invalid step, the live preview follows every answer, Publish shows the success panel.
  function initSell() {
    var box = $('.js-wz');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-wz'));
    var s = { step: 0, path: 0, car: null, dec: false, f: {}, cond: 0, acc: 0, own: 0, hist: true, nph: 0, cover: 0, price: null, minO: null,
      offers: true, insp: 0, via: 0, td: true, boost: false, agree: false, pub: false };
    var HINTS = ['Choose a car to continue', 'Decode the VIN and add mileage and ZIP', '', 'Add at least 8 photos', '', 'Add a title', 'Tick the confirmation to publish'];
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    function car() {
      return s.car === null ? null : D.cars[s.car];
    }
    function fv(k) {
      var c = car();
      if (Object.prototype.hasOwnProperty.call(s.f, k)) {
        return s.f[k];
      }
      return c && typeof c[k] === 'string' && k !== 't' ? c[k] : '';
    }
    function price() {
      var c = car();
      return s.price !== null ? s.price : c ? Math.round((c.lo + c.hi) / 2 / 500) * 500 + 1500 : 0;
    }
    function minO() {
      return s.minO !== null ? s.minO : Math.round(price() * 0.9 / 500) * 500;
    }
    function valid() {
      return [s.path === 0 && s.car !== null, s.dec && !!fv('miles').trim() && !!fv('zip').trim(), true, s.nph >= 8, price() > 0, !!fv('title').trim(), s.agree];
    }
    function fill() {
      // a newly chosen car fills the text fields once (typing is never overwritten by a repaint)
      $$('.js-wz-in', box).forEach(function (i) { i.value = fv(i.name); });
    }
    function setPress(sel, v) {
      $$(sel, box).forEach(function (b) { press(b, +b.getAttribute('data-v') === v); });
    }
    function summary(v) {
      var c = car();
      var ok = valid();
      return [s.path === 1 ? 'Instant offer' : c ? 'List it · ' + c.short : 'Not chosen',
        s.dec && c ? c.spec[2][1] + ' ' + c.spec[0][1] + ' ' + c.spec[1][1] + (fv('miles') ? ' · ' + fv('miles') + ' mi' : '') : 'VIN not decoded',
        ['Excellent', 'Good', 'Fair'][s.cond] + ' · ' + ['No accidents', 'Had an accident'][s.acc] + ' · ' + ['1 owner', '2 owners', '3+ owners'][s.own],
        s.nph + ' photos', price() ? fmt(price()) + (s.offers ? ' · accepting offers' : '') : '', fv('title') || 'No title yet', ok][v];
    }
    function paint() {
      var c = car();
      var ok = valid();
      var first = ok.indexOf(false);
      var reach = Math.max(first < 0 ? 6 : first, s.step);
      // bar
      $$('.js-wz-st', box).forEach(function (b) {
        var i = +b.getAttribute('data-s');
        var cur = i === s.step && !s.pub;
        b.classList.toggle('is-cur', cur);
        b.classList.toggle('is-done', (s.pub || i < s.step) && ok[i]);
        b.disabled = s.pub || i > reach;
        if (cur) {
          b.setAttribute('aria-current', 'step');
        } else {
          b.removeAttribute('aria-current');
        }
      });
      // header + panes
      setText('.js-wz-no', s.step + 1);
      setText('.js-wz-q', s.pub ? 'Published!' : D.q[s.step][0]);
      setText('.js-wz-qs', s.pub ? 'Buyers can see your car now.' : D.q[s.step][1]);
      $$('.js-wz-pane', box).forEach(function (p) { p.hidden = +p.getAttribute('data-s') !== s.step; });
      // step 1
      setPress('.js-wz-path', s.path);
      $('.js-wz-instant', box).hidden = s.path !== 1;
      $('.js-wz-which', box).hidden = s.path !== 0;
      setPress('.js-wz-car', s.car === null ? -1 : s.car);
      // step 2
      var vin = fv('vin').replace(/\s/g, '');
      var dec = $('.js-wz-dec', box);
      dec.disabled = !s.dec && vin.length !== 17;
      dec.textContent = s.dec ? '✓ Decoded' : 'Decode VIN';
      dec.classList.toggle('is-done', s.dec);
      setText('.js-wz-vinnote', s.dec ? 'We found your car — check the details below.' : vin.length === 17 ? 'Looks good — tap Decode.' : 'Find it on the dashboard by the windscreen or on your registration.');
      $('.js-wz-spec', box).hidden = !(s.dec && c);
      if (c) {
        $$('.js-wz-sk', box).forEach(function (el, i) { el.textContent = c.spec[i][0]; });
        $$('.js-wz-sv2', box).forEach(function (el, i) { el.textContent = c.spec[i][1]; });
      }
      $$('.js-wz-f', box).forEach(function (l) { l.classList.toggle('is-ok', !!fv(l.getAttribute('data-k')).trim() && l.getAttribute('data-k') !== 'flaws'); });
      // step 3
      ['cond', 'acc', 'own', 'insp', 'via'].forEach(function (k) {
        $$('.wzseg[data-k="' + k + '"] .js-wz-seg', box).forEach(function (b) { press(b, +b.getAttribute('data-v') === s[k]); });
      });
      setText('.js-wz-condsub', ['Like new — no visible wear', 'Light wear, everything works', 'Visible wear or small issues'][s.cond]);
      $$('.js-wz-sw', box).forEach(function (b) { b.setAttribute('aria-checked', s[b.getAttribute('data-k')] ? 'true' : 'false'); });
      // step 4
      var pool = c ? c.ph : [];
      var ph = $('.wzph', box);
      ph.style.setProperty('--t', s.nph >= 20 ? 'var(--pd-ok)' : s.nph >= 8 ? 'var(--gr-amber)' : 'var(--acc)');
      setText('.js-wz-phn', s.nph);
      setText('.js-wz-phs', s.nph >= 20 ? 'Great — buyers love it' : s.nph >= 8 ? 'Enough to publish' : (8 - s.nph) + ' more to publish');
      $('.js-wz-phf', box).style.width = Math.min(100, s.nph / 20 * 100) + '%';
      $$('.js-wz-slot', box).forEach(function (b, i) {
        var has = i < s.nph && pool.length;
        var im = $('.wzslot__img', b);
        if (has) {
          var p = pool[i % pool.length];
          if (im.getAttribute('src') !== 'assets/img/' + p[0]) {
            im.setAttribute('src', 'assets/img/' + p[0]);
            im.setAttribute('width', p[1]);
            im.setAttribute('height', p[2]);
          }
        }
        im.hidden = !has;
        b.classList.toggle('has-ph', !!has);
        b.classList.toggle('is-cover', !!has && i === s.cover);
        b.classList.toggle('is-next', i === s.nph);
        b.setAttribute('aria-label', has ? 'Photo ' + (i + 1) + (i === s.cover ? ' · cover' : ' · make it the cover') : 'Add photos');
      });
      $$('.js-wz-shot', box).forEach(function (el, i) { el.classList.toggle('is-ok', s.nph > i * 3); });
      // step 5
      if (c) {
        var lo = c.lo;
        var hi = c.hi;
        var mn = lo * 0.9;
        var mx = hi * 1.1;
        var pos = function (x) { return Math.max(0, Math.min(100, (x - mn) / (mx - mn) * 100)); };
        var pr = price();
        var fair = pr >= lo && pr <= hi;
        setText('.js-wz-mkt', 'Similar cars sold for ' + fmt(lo) + '–' + fmt(hi));
        $('.js-wz-band', box).style.left = pos(lo) + '%';
        $('.js-wz-band', box).style.width = (pos(hi) - pos(lo)) + '%';
        $('.js-wz-mk', box).style.left = pos(pr) + '%';
        $('.wzmkt', box).classList.toggle('is-out', !fair);
        setText('.js-wz-lo', fmt(lo));
        setText('.js-wz-hi', fmt(hi));
        setText('.js-wz-verdict', fair ? 'Fair price · in market range' : pr > hi ? 'Above market · may sell slower' : 'Below market · will sell fast');
        setText('.js-wz-days', pr > hi ? '5–8 weeks' : pr < lo ? '1–2 weeks' : '3–5 weeks');
        setText('.js-wz-net', fmt(pr * 0.98));
      }
      $$('.wzstep', box).forEach(function (st) { $('.js-wz-sv', st).textContent = fmt(st.getAttribute('data-k') === 'price' ? price() : minO()); });
      setText('.js-wz-inspsub', s.insp === 0 ? 'We check the car and add a verified report to your listing' : '1200 Sunset Blvd, Los Angeles');
      // step 7
      $$('.js-wz-sum', box).forEach(function (r) {
        var i = +r.getAttribute('data-s');
        r.classList.toggle('is-ok', ok[i]);
        $('.js-wz-sumv', r).textContent = summary(i);
      });
      press($('.js-wz-agree', box), s.agree);
      $('.js-wz-review', box).hidden = s.pub;
      $('.js-wz-done', box).hidden = !s.pub;
      setText('.js-wz-pubnote', (c ? c.title : '') + ' · ' + fmt(price()) + (s.boost ? ' · boosted for 7 days' : '') + ' · AV-L-0452');
      // nav
      var back = $('.js-wz-back', box);
      back.disabled = s.step === 0 || s.pub;
      var next = $('.js-wz-next', box);
      next.hidden = s.pub || (s.step === 0 && s.path === 1);
      next.disabled = !ok[s.step];
      next.textContent = s.step === 6 ? 'Publish listing' : s.step === 5 ? 'Review →' : 'Continue →';
      next.classList.toggle('is-pub', s.step === 6);
      setText('.js-wz-hint', ok[s.step] || s.pub ? '' : HINTS[s.step]);
      // preview
      var pct = s.pub ? 100 : Math.round(ok.slice(1, 6).filter(Boolean).length / 5 * 100);
      setText('.js-wz-pct', pct);
      $('.js-wz-pctf', box).style.width = pct + '%';
      var pv = $('.js-wz-pvimg', box);
      if (s.nph && pool.length) {
        var cp = pool[s.cover % pool.length];
        pv.setAttribute('src', 'assets/img/' + cp[0]);
        pv.setAttribute('width', cp[1]);
        pv.setAttribute('height', cp[2]);
      }
      pv.hidden = !(s.nph && pool.length);
      var st = $('.js-wz-pvst', box);
      st.textContent = s.pub ? 'Live' : 'Draft';
      st.classList.toggle('is-live', s.pub);
      $('.js-wz-pvboost', box).hidden = !s.boost;
      setText('.js-wz-pvph', s.nph + ' photos');
      setText('.js-wz-pvmeta', (fv('miles') ? fv('miles') + ' mi' : '— mi') + ' · Los Angeles');
      setText('.js-wz-pvtitle', fv('title') || (c ? c.title : 'Your car'));
      setText('.js-wz-pvprice', price() ? fmt(price()) : '$—');
      $('.js-wz-pvchips', box).innerHTML = [['Excellent', 'Good', 'Fair'][s.cond], s.insp === 0 ? 'Avava inspected' : 'Seller inspected', s.hist ? 'Full history' : 'Partial history']
        .map(function (t) { return '<li>' + t + '</li>'; }).join('');
    }

    box.addEventListener('click', function (e) {
      var t = e.target;
      var b;
      if ((b = t.closest('.js-wz-st'))) {
        s.step = +b.getAttribute('data-s');
      } else if ((b = t.closest('.js-wz-path'))) {
        s.path = +b.getAttribute('data-v');
      } else if ((b = t.closest('.js-wz-car'))) {
        var i = +b.getAttribute('data-v');
        var c = D.cars[i];
        s.car = i;
        s.f = {};
        s.dec = c.dec;
        s.nph = c.nph;
        s.cover = 0;
        s.price = null;
        s.minO = null;
        fill();
      } else if ((b = t.closest('.js-wz-dec'))) {
        s.dec = true;
      } else if ((b = t.closest('.js-wz-seg'))) {
        s[b.closest('[data-k]').getAttribute('data-k')] = +b.getAttribute('data-v');
      } else if ((b = t.closest('.js-wz-sw'))) {
        var k = b.getAttribute('data-k');
        s[k] = !s[k];
      } else if ((b = t.closest('.js-wz-opt'))) {
        press(b, b.getAttribute('aria-pressed') !== 'true');
        return;
      } else if ((b = t.closest('.js-wz-addph'))) {
        s.nph = Math.min(24, s.nph + 4);
      } else if ((b = t.closest('.js-wz-slot'))) {
        var n = +b.getAttribute('data-i');
        if (n < s.nph) {
          s.cover = n;
        } else {
          s.nph = Math.min(24, s.nph + 4);
        }
      } else if ((b = t.closest('.js-wz-step'))) {
        var d = +b.getAttribute('data-d') * 1000;
        if (b.closest('.wzstep').getAttribute('data-k') === 'price') {
          s.price = Math.max(1000, price() + d);
          if (minO() > s.price) {
            s.minO = s.price;
          }
        } else {
          s.minO = Math.max(0, Math.min(price(), minO() + d));
        }
      } else if ((b = t.closest('.js-wz-edit'))) {
        s.step = +b.getAttribute('data-s');
      } else if ((b = t.closest('.js-wz-agree'))) {
        s.agree = !s.agree;
      } else if ((b = t.closest('.js-wz-back'))) {
        s.step = Math.max(0, s.step - 1);
      } else if ((b = t.closest('.js-wz-next'))) {
        if (!valid()[s.step]) {
          return;
        }
        if (s.step === 6) {
          s.pub = true;
        } else {
          s.step += 1;
        }
        box.scrollIntoView({ block: 'nearest' });
      } else if ((b = t.closest('.js-wz-draft'))) {
        b.textContent = '✓ Draft saved to My listings';
        b.disabled = true;
        return;
      } else {
        return;
      }
      paint();
    });
    box.addEventListener('input', function (e) {
      var i = e.target.closest('.js-wz-in');
      if (i) {
        s.f[i.name] = i.value;
        if (i.name === 'vin' && s.car === 2) {
          s.dec = false;
        }
        paint();
      }
    });
    paint();
  }

  /* Dealer shell (dealer_parts.py): foldable menu groups, rows without a page open the coming-soon pane (#dl-<slug>). */
  function initDealerShell() {
    var box = $('.js-dl');
    if (!box) {
      return;
    }
    var main = box.getAttribute('data-main');
    var head = $('.js-dl-head', box), headOn = !head.hidden, title0 = $('.js-dl-sect', box).textContent;
    var phone = window.matchMedia('(max-width: 767px)').matches;
    $$('.js-dl-fold', box).forEach(function (b) {
      // on a phone the menu starts folded so the dashboard is one swipe away; the group sums keep hot counts in sight
      if (phone) {
        b.closest('.js-dl-grp').classList.add('is-shut');
        b.setAttribute('aria-expanded', 'false');
      }
      b.addEventListener('click', function () {
        var shut = b.closest('.js-dl-grp').classList.toggle('is-shut');
        b.setAttribute('aria-expanded', shut ? 'false' : 'true');
      });
    });
    function mark(i) {
      $$('.dlm, .dlst', box).forEach(function (r) {
        var on = r.getAttribute('data-i') === String(i);
        r.classList.toggle('is-on', on);
        if (r.classList.contains('dlm')) {
          if (on) {
            r.setAttribute('aria-current', 'page');
          } else {
            r.removeAttribute('aria-current');
          }
        }
      });
    }
    function show(slug, scroll) {
      var go = slug && $('.js-dl-go.dlm[data-slug="' + slug + '"]', box);
      var soon = !!go && go.getAttribute('data-i') !== main;
      $$('.js-dl-pane', box).forEach(function (p) {
        p.hidden = (p.getAttribute('data-pane') === 'soon') !== soon;
      });
      head.hidden = !soon && !headOn;
      var t = soon ? $('.dlm__t', go).textContent : title0;
      setText('.js-dl-sect', t);
      setText('.js-dl-soont', t);
      mark(soon ? go.getAttribute('data-i') : main);
      if (scroll && soon) {
        $('.dlmain', box).scrollIntoView({ block: 'start' });
      }
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.js-dl-go');
      if (b) {
        var slug = b.getAttribute('data-slug');
        if (b.getAttribute('data-i') === main) {
          history.replaceState(null, '', location.pathname + location.search);
          show('', false);
        } else {
          history.replaceState(null, '', '#dl-' + slug);
          show(slug, true);
        }
      }
      if (e.target.closest('.js-dl-out')) {
        location.href = 'index.html';
      }
    });
    function fromHash() {
      var m = /^#dl-(.+)$/.exec(location.hash);
      show(m ? m[1] : '', !!m);
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  /* Dealer dashboard (build_dealer.py): period switch, sales chart, tasks with undo, confirmations, replies, price drops. */
  function initDealerDash() {
    var box = $('.js-db');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-db'));
    var s = { p: 2, m: 0, cmp: false, sel: null, td: {}, last: null, rs: 0 };
    var bars = $$('.js-db-bar', box);
    var fmtK = function (n) { return n >= 1000000 ? '$' + (n / 1000000).toFixed(2) + 'M' : '$' + Math.round(n / 1000) + 'k'; };
    var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
    $$('[data-w]', box).forEach(function (el) {
      el.style.width = el.getAttribute('data-w') + '%';
    });
    function chart() {
      var P = D.p[s.p], N = P.vals.length, mx = Math.max.apply(null, P.vals);
      var mx2 = Math.max.apply(null, P.vals.concat(s.cmp ? P.prev : []));
      if (s.sel === null || s.sel >= N) {
        s.sel = P.vals.indexOf(mx);
      }
      var tot = sum(P.vals);
      var valOf = function (v) { return s.m === 0 ? fmtK(v * P.rev / tot) : (v * P.units / tot).toFixed(1) + ' cars'; };
      var ch = $('.js-db-chart', box);
      ch.classList.toggle('is-few', N <= 12);
      ch.classList.toggle('is-units', s.m === 1);
      ch.classList.toggle('is-cmp', s.cmp);
      bars.forEach(function (b, i) {
        b.hidden = i >= N;
        if (i < N) {
          $('.dbbar__v', b).style.height = Math.round(P.vals[i] / mx2 * 100) + '%';
          $('.dbbar__p', b).style.height = Math.round(P.prev[i] / mx2 * 100) + '%';
          b.classList.toggle('is-sel', i === s.sel);
          b.setAttribute('aria-pressed', i === s.sel ? 'true' : 'false');
          b.setAttribute('aria-label', P.labels[i] + ' · ' + valOf(P.vals[i]));
        }
      });
      var dd = Math.round((P.vals[s.sel] / P.prev[s.sel] - 1) * 100), d = $('.js-db-seld', box);
      setText('.js-db-selk', P.labels[s.sel]);
      setText('.js-db-selv', valOf(P.vals[s.sel]));
      d.hidden = !s.cmp;
      d.textContent = (dd >= 0 ? '▲ ' : '▼ ') + Math.abs(dd) + '% vs. previous';
      d.classList.toggle('is-down', dd < 0);
      $$('.js-db-m', box).forEach(function (b) {
        b.setAttribute('aria-pressed', +b.getAttribute('data-m') === s.m ? 'true' : 'false');
      });
      $('.js-db-cmp', box).setAttribute('aria-pressed', s.cmp ? 'true' : 'false');
    }
    function period() {
      var P = D.p[s.p], p = s.p;
      $$('.js-db-per', box).forEach(function (b) {
        b.setAttribute('aria-pressed', +b.getAttribute('data-p') === p ? 'true' : 'false');
      });
      D.kpi.forEach(function (k, i) {
        var dEl = $('.js-db-kd[data-i="' + i + '"]', box);
        dEl.textContent = k[2][p];
        dEl.classList.toggle('is-down', k[2][p].charAt(0) === '▼' && i !== 3);
        setText('.js-db-kv[data-i="' + i + '"]', k[1][p]);
        setText('.js-db-ks[data-i="' + i + '"]', k[3][p]);
        $$('.js-db-spark[data-i="' + i + '"] span', box).forEach(function (sp, j) {
          sp.style.height = P.spark[i][j] + '%';
        });
      });
      setText('.js-db-revk', 'Revenue · ' + D.per[p]);
      setText('.js-db-per2', D.per[p]);
      setText('.js-db-note', P.note);
      $('.js-db-ticks', box).innerHTML = P.ticks.map(function (t) { return '<span>' + t + '</span>'; }).join('');
      var F = P.funnel, top = Math.log10(F[0] + 1), fp = $$('.js-db-fp', box);
      $$('.js-db-fv', box).forEach(function (el, i) {
        el.textContent = F[i] >= 1000 ? (F[i] / 1000).toFixed(1) + 'k' : String(F[i]);
        $$('.js-db-ff', box)[i].style.width = Math.max(4, Math.log10(F[i] + 1) / top * 100) + '%';
        if (i) {
          fp[i - 1].textContent = '↓ ' + Math.round(F[i] / F[i - 1] * 100) + '%';
        }
      });
      chart();
    }
    function tasks() {
      var rows = $$('.js-db-task', box), done = 0, live = 0;
      rows.forEach(function (r) {
        var st = s.td[r.getAttribute('data-id')];
        r.hidden = !!st;
        done += st === 'done' ? 1 : 0;
        live += st ? 0 : 1;
      });
      setText('.js-db-tsub', live ? live + ' things need you — oldest first' : 'All caught up');
      setText('.js-db-tdone', done + ' of ' + rows.length + ' done');
      $('.js-db-tbar', box).style.width = (done / rows.length * 100) + '%';
      $('.js-db-zero', box).hidden = live > 0;
      var u = $('.js-db-undo', box);
      u.hidden = !(s.last && s.td[s.last]);
      setText('.js-db-undot', s.td[s.last] === 'later' ? 'Snoozed for 2 hours' : 'Marked as done');
      var t1 = !s.td.t1, chip = $('.js-db-leadchip', box);
      chip.classList.toggle('is-ok', !t1);
      setText('.js-db-leadchipt', t1 ? '3 leads waiting' : 'Leads answered');
    }
    function confirmed() {
      var all = $$('.js-db-cf', box), on = all.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).length;
      setText('.js-db-tdn', on + ' of ' + all.length + ' confirmed');
    }
    box.addEventListener('click', function (e) {
      var t = e.target, b;
      if ((b = t.closest('.js-db-per'))) {
        s.p = +b.getAttribute('data-p');
        s.sel = null;
        period();
      } else if ((b = t.closest('.js-db-m'))) {
        s.m = +b.getAttribute('data-m');
        chart();
      } else if (t.closest('.js-db-cmp')) {
        s.cmp = !s.cmp;
        chart();
      } else if ((b = t.closest('.js-db-bar'))) {
        s.sel = +b.getAttribute('data-i');
        chart();
      } else if ((b = t.closest('.js-db-done, .js-db-later'))) {
        s.last = b.closest('.js-db-task').getAttribute('data-id');
        s.td[s.last] = b.classList.contains('js-db-done') ? 'done' : 'later';
        tasks();
      } else if (t.closest('.js-db-undob')) {
        s.td[s.last] = false;
        s.last = null;
        tasks();
      } else if ((b = t.closest('.js-db-cf'))) {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = on ? '✓ Confirmed' : 'Confirm';
        confirmed();
      } else if ((b = t.closest('.js-db-rep'))) {
        if (s.rs === 0) {
          s.rs = 1;
          $('.js-db-repin', box).hidden = false;
          $('.js-db-repin', box).focus();
          b.textContent = 'Post reply';
          b.classList.add('is-step');
        } else if (s.rs === 1) {
          s.rs = 2;
          $('.js-db-repin', box).hidden = true;
          b.textContent = '✓ Reply posted';
          b.classList.remove('is-step');
          b.classList.add('is-done');
        }
      } else if ((b = t.closest('.js-db-reply'))) {
        var st = $('.js-db-lst', b.closest('.js-db-lead'));
        b.textContent = '✓ Sent';
        b.classList.add('is-done');
        st.className = 'dbpill dbpill--contacted js-db-lst';
        st.textContent = 'Contacted';
      } else if ((b = t.closest('.js-db-drop'))) {
        var row = b.closest('.js-db-stale');
        row.classList.add('is-done');
        $('.js-db-sd', row).textContent = 'Price lowered by ' + row.getAttribute('data-drop') + ' · re-promoted';
        b.textContent = '✓ Updated';
        b.classList.add('is-done');
      } else if ((b = t.closest('.js-db-export'))) {
        b.textContent = '✓ Report emailed';
        b.classList.add('is-done');
      }
    });
    period();
    tasks();
  }

  /* Dealer leads (build_leads.py): one state object; rows are updated in place and move between the three groups. */
  function initLeads() {
    var box = $('.js-lq');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-lq'));
    var TPL = D.tpl, OW = D.owners;
    var s = { sel: D.sel, so: {}, ow: {}, sent: {}, dr: {}, ch: {}, ck: {}, called: {}, done: {}, panel: null, tab: 0, notes: {}, vw: 0, q: '', sf: null, hf: 0, added: 0 };
    var file = $('.js-lf'), wide = window.matchMedia('(min-width: 2000px)');
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var money = function (n) { return '$' + n.toLocaleString('en-US'); };
    var waitT = function (w) { return w === 0 ? 'Replied' : w >= 60 ? Math.floor(w / 60) + ' h ' + (w % 60) + ' min' : w + ' min'; };
    function base(id) {
      return D.leads.filter(function (l) { return l.id === id; })[0];
    }
    // the lead as it is now: stage, owner, wait and last message follow the state
    function lead(id) {
      var l = base(id), m = s.sent[id] || [];
      return { b: l, st: s.so[id] === undefined ? l.st : s.so[id], o: s.ow[id] === undefined ? l.o : s.ow[id], w: m.length ? 0 : l.w, msgs: m,
        last: m.length ? 'You: ' + m[m.length - 1] : l.last };
    }
    var VIEW = [function () { return true; }, function (x) { return x.o === 0 && x.b.heat === 'Hot'; },
      function (x) { return x.w >= 120 && x.st < 4; }, function (x) { return x.st === 2; }];
    function shown(x) {
      var q = s.q.toLowerCase(), b = x.b;
      return (!q || (b.n + b.car + b.phone + b.stock).toLowerCase().indexOf(q) > -1) && (!s.sf || b.src === s.sf) &&
        (s.hf === 0 || b.heat === ['', 'Hot', 'Warm', 'Cold'][s.hf]) && VIEW[s.vw](x);
    }
    function ownerHtml(i, cls) {
      var o = OW[i];
      return o[1] ? '<img class="' + cls + '" src="assets/img/' + o[1] + '" alt="' + o[0] + '" title="' + o[0] + '" width="' + o[2] + '" height="' + o[2] + '" decoding="async">'
        : '<span class="' + cls + ' ' + cls + '--none" title="' + o[0] + '">—</span>';
    }
    function sendTo(id, txt) {
      var t = (txt || '').trim();
      if (!t) {
        return;
      }
      var x = lead(id);
      s.sent[id] = (s.sent[id] || []).concat(t);
      s.dr[id] = '';
      if (x.st === 0) {
        s.so[id] = 1;
      }
    }
    function rows() {
      var all = D.leads.map(function (l) { return lead(l.id); });
      var groups = [[], [], []];
      all.forEach(function (x) {
        var r = $('.js-lq-row[data-id="' + x.b.id + '"]', box), on = x.b.id === s.sel, late = x.w >= 120 && x.st < 4;
        r.classList.toggle('is-sel', on);
        r.classList.toggle('is-ck', !!s.ck[x.b.id]);
        $('.js-lq-ck', r).setAttribute('aria-pressed', s.ck[x.b.id] ? 'true' : 'false');
        $('.js-lq-open', r).setAttribute('aria-pressed', on ? 'true' : 'false');
        $('.js-lq-open', r).classList.toggle('is-new', x.w > 0 && x.st === 0);
        $('.js-lq-last', r).textContent = x.last;
        $('.js-lq-w', r).className = 'lqr__w lqr__w--' + (late ? 'late' : x.w === 0 ? 'ok' : 'mute') + ' js-lq-w';
        $('.js-lq-wt', r).textContent = x.st >= 4 ? (x.st === 4 ? 'Won' : 'Closed') : waitT(x.w);
        $('.js-lq-wf', r).style.width = (x.st >= 4 ? 0 : Math.min(100, x.w / 240 * 100)) + '%';
        var st = $('.js-lq-st', r);
        st.className = 'lqst lqst--' + x.st + ' js-lq-st';
        st.textContent = D.stages[x.st];
        if ($('.js-lq-ow', r).getAttribute('data-o') !== String(x.o)) {
          $('.js-lq-ow', r).innerHTML = ownerHtml(x.o, 'lqow');
          $('.js-lq-ow', r).setAttribute('data-o', x.o);
        }
        $('.js-lq-qr', r).classList.toggle('is-hot', x.w > 0);
        $('.js-lq-qc', r).classList.toggle('is-called', !!s.called[x.b.id]);
        r.hidden = !shown(x);
        groups[x.st >= 4 ? 2 : x.w > 0 ? 0 : 1].push(x);
      });
      var any = false;
      groups.forEach(function (g, gi) {
        var sec = $('.js-lq-grp[data-g="' + gi + '"]', box), ul = $('.js-lq-ul', sec);
        g.sort(function (a, b) { return b.w - a.w; }).forEach(function (x) {
          ul.appendChild($('.js-lq-row[data-id="' + x.b.id + '"]', box));
        });
        var n = g.filter(shown).length;
        $('.js-lq-gn', sec).textContent = n;
        sec.hidden = !n;
        any = any || n > 0;
      });
      $('.js-lq-empty', box).hidden = any;
      // KPIs, SLA bar, view counts
      var waiting = all.filter(VIEW[2]), sent = Object.keys(s.sent).length > 0;
      setText('.js-lq-kv[data-i="0"]', all.filter(function (x) { return x.st === 0; }).length);
      setText('.js-lq-kv[data-i="1"]', waiting.length);
      setText('.js-lq-kd[data-i="1"]', waiting.length ? 'reply now' : '✓ clear');
      $('.js-lq-kwait', box).classList.toggle('is-on', waiting.length > 0);
      setText('.js-lq-kv[data-i="2"]', sent ? '11 min' : '18 min');
      setText('.js-lq-kd[data-i="2"]', sent ? '▼ 7 min' : '▼ 4 min');
      $$('.js-lq-slaav', box).forEach(function (a) {
        a.hidden = !waiting.some(function (x) { return x.b.id === a.getAttribute('data-id'); });
      });
      setText('.js-lq-slat', waiting.length + (waiting.length === 1 ? ' lead has' : ' leads have') + ' waited more than 2 hours');
      $('.js-lq-sla', box).hidden = !waiting.length;
      $('.js-lq-done', box).hidden = waiting.length > 0;
      $$('.js-lq-view', box).forEach(function (b, i) {
        b.setAttribute('aria-pressed', i === s.vw ? 'true' : 'false');
        $('.js-lq-vn', b).textContent = all.filter(VIEW[i]).length;
      });
      var ck = Object.keys(s.ck).filter(function (k) { return s.ck[k]; });
      $('.js-lq-bulk', box).hidden = !ck.length;
      setText('.js-lq-bulkt', ck.length + ' selected');
    }
    function leadFile() {
      var x = lead(s.sel), b = x.b;
      var ring = $('.js-lf-ring', file);
      ring.className = 'lfring lfring--' + (b.score >= 80 ? 'acc' : b.score >= 60 ? 'amber' : 'mute') + ' js-lf-ring';
      ring.style.setProperty('--p', b.score + '%');
      $('.lfring__n', ring).textContent = b.score;
      setText('.js-lf-n', b.n);
      setText('.js-lf-phone', b.phone);
      $('.js-lf-tel', file).href = 'tel:' + b.phone.replace(/ /g, '');
      $('.js-lf-tel', file).setAttribute('aria-label', 'Call ' + b.n);
      $('.js-lf-tags', file).innerHTML = '<span class="lqheat lqheat--' + b.heat.toLowerCase() + '">' + b.heat + '</span>' +
        b.tags.map(function (t) { return '<span class="lftag lftag--' + t[1] + '">' + esc(t[0]) + '</span>'; }).join('');
      $$('.js-lf-stage', file).forEach(function (r, k) {
        r.classList.toggle('is-cur', k === x.st);
        r.classList.toggle('is-past', k < x.st && x.st < 5);
        r.setAttribute('aria-pressed', k === x.st ? 'true' : 'false');
      });
      var first = b.n.split(' ')[0];
      var NB = [['Reply now — ' + first + ' has waited ' + waitT(x.w) + '.', 'Send template'], ['Offer a test drive — leads like this book 64% of the time.', 'Pick a slot'],
        ['Follow up after the drive with a tailored offer.', 'Send offer'], ['Close it — send the deposit link today.', 'Mark won'],
        ['Ask for a review and a referral.', 'Request review'], ['Re-engage in 30 days with similar stock.', 'Schedule']][x.st];
      var go = $('.js-lf-nbago', file), dn = s.done[b.id + ':' + x.st];
      setText('.js-lf-nba', x.st === 0 && !x.w ? 'Introduce yourself and confirm the car is available.' : NB[0]);
      go.textContent = dn ? (x.st === 4 ? '✓ Requested' : '✓ Scheduled') : NB[1];
      go.disabled = !!dn;
      $('.js-lf-slots', file).hidden = s.panel !== 'td';
      $$('.js-lf-tab', file).forEach(function (t, k) {
        t.setAttribute('aria-pressed', k === s.tab ? 'true' : 'false');
      });
      $$('.js-lf-pane', file).forEach(function (p) {
        p.hidden = +p.getAttribute('data-t') !== s.tab;
      });
      var you = b.last.indexOf('You:') === 0;
      var feed = x.msgs.slice().reverse().map(function (t) {
        return '<li class="lfev lfev--you"><span class="lfev__dot" aria-hidden="true"></span><span class="lfev__t">You: ' + esc(t) + '</span><span class="lfev__at">just now</span></li>';
      }).join('') + '<li class="lfev"><span class="lfev__dot' + (you ? '' : ' lfev__dot--acc') + '" aria-hidden="true"></span><span class="lfev__t">' + esc(you ? b.last : b.n + ': ' + b.last) +
        '</span><span class="lfev__at">' + (b.w && !x.msgs.length ? waitT(b.w) + ' ago' : 'earlier') + '</span></li>' +
        '<li class="lfev lfev--sys"><span class="lfev__dot lfev__dot--mute" aria-hidden="true"></span><span class="lfev__t">Lead created · ' + esc(b.src) + '</span><span class="lfev__at">Yesterday</span></li>';
      $('.js-lf-feed', file).innerHTML = feed;
      var img = $('.js-lf-carimg', file);
      img.src = 'assets/img/' + b.ph[0];
      img.width = b.ph[1];
      img.height = b.ph[2];
      img.alt = b.car;
      setText('.js-lf-car', b.car);
      setText('.js-lf-price', money(b.price));
      $$('.js-lf-chip', file)[0].textContent = b.stock;
      var pre = b.tags.filter(function (t) { return t[0].indexOf('Pre-approved') === 0; })[0];
      var tr = b.tags.some(function (t) { return t[0].indexOf('Trade') === 0; });
      var fin = [[pre ? pre[0].replace('Pre-approved ', 'Up to ') : 'Not shared', ''], ['$' + Math.round(b.price * 0.9 * 0.0193).toLocaleString('en-US') + '/mo', 'acc'],
        [tr ? '2019 Cayman · ~$64k' : 'None', ''], b.heat === 'Hot' ? ['Passed', 'ok'] : ['Not started', 'mute']];
      $$('.js-lf-fin', file).forEach(function (v, k) {
        v.textContent = fin[k][0];
        v.className = 'lffin__v' + (fin[k][1] ? ' lffin__v--' + fin[k][1] : '') + ' js-lf-fin';
      });
      $('.js-lf-note', file).value = s.notes[b.id] || '';
      var dr = s.dr[b.id] || '';
      if ($('.js-lf-draft', file).value !== dr) {
        $('.js-lf-draft', file).value = dr;
      }
      $('.js-lf-send', file).classList.toggle('is-on', !!dr.trim());
      $$('.js-lf-ch', file).forEach(function (c, k) {
        c.setAttribute('aria-pressed', k === (s.ch[b.id] || 0) ? 'true' : 'false');
      });
      $$('.js-lf-own', file).forEach(function (o, k) {
        o.classList.toggle('is-on', k === x.o);
        o.setAttribute('aria-pressed', k === x.o ? 'true' : 'false');
      });
      setText('.js-lf-ownn', OW[x.o][0]);
      setText('.js-lf-lost', x.st === 5 ? 'Reopen lead' : 'Mark lost');
    }
    function paint() {
      rows();
      leadFile();
    }
    function pick(id, panel) {
      s.sel = id;
      s.panel = panel || null;
      paint();
      // below 2000px the file sits under the list, so bring it into view
      if (!wide.matches) {
        file.scrollIntoView({ block: 'start' });
      }
    }
    function csv() {
      var lines = [['Name', 'Phone', 'Email', 'Car', 'Price', 'Source', 'Heat', 'Stage', 'Owner', 'Score']].concat(D.leads.map(function (l) {
        var x = lead(l.id);
        return [l.n, l.phone, l.email, l.car, l.price, l.src, l.heat, D.stages[x.st], OW[x.o][0], l.score];
      }));
      var blob = new Blob([lines.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n')], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'pacific-motors-leads.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    function addLead() {
      // a walk-in lead: a copy of the first row with its own id, opened in the file
      s.added += 1;
      var id = 'w' + s.added, src = $('.js-lq-row', box);
      D.leads.push({ id: id, n: 'Walk-in #' + (D.leads.length + 1), img: '', iw: 0, car: D.leads[0].car, ph: D.leads[0].ph, price: D.leads[0].price, src: 'Walk-in', heat: 'Warm',
        st: 0, o: 0, w: 1, phone: '+1 310 555 0100', email: '', last: 'Walked in just now — details to follow.', tags: [], score: 50, stock: D.leads[0].stock });
      var r = src.cloneNode(true), l = base(id);
      r.setAttribute('data-id', id);
      $('.js-lq-ow', r).removeAttribute('data-o');
      $('.js-lq-open', r).textContent = l.n;
      $('.js-lq-ck', r).setAttribute('aria-label', 'Select ' + l.n);
      $('.js-lq-qr', r).setAttribute('aria-label', 'Reply to ' + l.n + ' with a template');
      $('.js-lq-qc', r).setAttribute('aria-label', 'Call ' + l.n);
      $('.js-lq-qb', r).setAttribute('aria-label', 'Book a test drive for ' + l.n);
      $('.lqheat', r).className = 'lqheat lqheat--warm';
      $('.lqheat', r).textContent = 'Warm';
      var rg = $('.js-lq-ring', r);
      rg.className = 'lqring lqring--mute js-lq-ring';
      rg.style.setProperty('--p', '50%');
      $('.lqring__n', rg).textContent = '50';
      $('.lqr__cs', r).textContent = money(l.price) + ' · Walk-in';
      src.parentNode.insertBefore(r, src);
      s.tab = 3;
      pick(id);
      $('.js-lf-note', file).focus();
    }
    $$('[data-w]', box).forEach(function (el) {
      el.style.width = el.getAttribute('data-w') + '%';
    });
    $$('.lqk__sp [data-h]', box).forEach(function (el) {
      el.style.height = el.getAttribute('data-h') + '%';
    });
    $$('.js-lq-ring', box).forEach(function (el) {
      el.style.setProperty('--p', el.getAttribute('data-p') + '%');
    });
    box.addEventListener('click', function (e) {
      var t = e.target, b, r = t.closest('.js-lq-row'), id = r && r.getAttribute('data-id');
      if ((b = t.closest('.js-lq-ck'))) {
        s.ck[id] = !s.ck[id];
      } else if (t.closest('.js-lq-qr')) {
        sendTo(id, TPL[0]);
      } else if (t.closest('.js-lq-qc')) {
        s.called[id] = true;
      } else if (t.closest('.js-lq-qb')) {
        pick(id, 'td');
        return;
      } else if (r) {
        pick(id);
        return;
      } else if ((b = t.closest('.js-lq-fold'))) {
        var shut = b.closest('.js-lq-grp').classList.toggle('is-shut');
        b.setAttribute('aria-expanded', shut ? 'false' : 'true');
        return;
      } else if ((b = t.closest('.js-lq-view'))) {
        s.vw = +b.getAttribute('data-v');
      } else if ((b = t.closest('.js-lq-src'))) {
        s.sf = s.sf === b.textContent ? null : b.textContent;
        $$('.js-lq-src', box).forEach(function (c) {
          c.setAttribute('aria-pressed', c.textContent === s.sf ? 'true' : 'false');
        });
      } else if ((b = t.closest('.js-lq-heat'))) {
        s.hf = +b.getAttribute('data-heat');
        $$('.js-lq-heat', box).forEach(function (c) {
          c.setAttribute('aria-pressed', c === b ? 'true' : 'false');
        });
      } else if (t.closest('.js-lq-all')) {
        D.leads.forEach(function (l) {
          var x = lead(l.id);
          if (x.w >= 120 && x.st < 4) {
            sendTo(l.id, TPL[0]);
          }
        });
      } else if (t.closest('.js-lq-bme, .js-lq-btpl, .js-lq-blost')) {
        Object.keys(s.ck).filter(function (k) { return s.ck[k]; }).forEach(function (k) {
          if (t.closest('.js-lq-bme')) {
            s.ow[k] = 0;
          } else if (t.closest('.js-lq-btpl')) {
            sendTo(k, TPL[0]);
          } else {
            s.so[k] = 5;
          }
        });
        s.ck = {};
      } else if (t.closest('.js-lq-bx')) {
        s.ck = {};
      } else if ((b = t.closest('.js-lq-export'))) {
        csv();
        b.textContent = '✓ CSV downloaded';
        b.classList.add('is-done');
        return;
      } else if (t.closest('.js-lq-add')) {
        addLead();
        return;
      } else if ((b = t.closest('.js-lf-stage'))) {
        s.so[s.sel] = +b.getAttribute('data-s');
        s.panel = null;
      } else if (t.closest('.js-lf-nbago')) {
        var st = lead(s.sel).st;
        if (st === 0) {
          sendTo(s.sel, TPL[0]);
        } else if (st === 1) {
          s.panel = s.panel === 'td' ? null : 'td';
        } else if (st === 2) {
          s.so[s.sel] = 3;
        } else if (st === 3) {
          s.so[s.sel] = 4;
        } else {
          s.done[s.sel + ':' + st] = true;
        }
      } else if ((b = t.closest('.js-lf-slot'))) {
        s.so[s.sel] = 2;
        s.panel = null;
        s.sent[s.sel] = (s.sent[s.sel] || []).concat('Test drive booked for ' + b.textContent);
      } else if ((b = t.closest('.js-lf-tab'))) {
        s.tab = +b.getAttribute('data-t');
      } else if ((b = t.closest('.js-lf-tpl'))) {
        sendTo(s.sel, b.textContent);
      } else if (t.closest('.js-lf-send')) {
        sendTo(s.sel, s.dr[s.sel]);
      } else if ((b = t.closest('.js-lf-ch'))) {
        s.ch[s.sel] = +b.getAttribute('data-c');
      } else if ((b = t.closest('.js-lf-own'))) {
        s.ow[s.sel] = +b.getAttribute('data-o');
      } else if (t.closest('.js-lf-lost')) {
        s.so[s.sel] = lead(s.sel).st === 5 ? 0 : 5;
      } else if (t.closest('.js-lf-tel')) {
        s.called[s.sel] = true;
      } else {
        return;
      }
      paint();
    });
    box.addEventListener('input', function (e) {
      var t = e.target;
      if (t.classList.contains('js-lq-q')) {
        s.q = t.value;
        rows();
      } else if (t.classList.contains('js-lf-draft')) {
        s.dr[s.sel] = t.value;
        $('.js-lf-send', file).classList.toggle('is-on', !!t.value.trim());
      } else if (t.classList.contains('js-lf-note')) {
        s.notes[s.sel] = t.value;
      }
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.classList.contains('js-lf-draft')) {
        sendTo(s.sel, s.dr[s.sel]);
        paint();
      }
    });
    paint();
  }

  /* Dealer test drives (build_dealer_drives.py): day calendar + drive panel. columns() and acts() mirror the Python builders. */
  function initDealerDrives() {
    var box = $('.js-tv');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-tv'));
    var ST = D.status, HH = D.hh, NOW = D.now;
    var s = { day: 0, by: 0, sel: D.sel, so: {}, rs: {}, added: [], prep: {}, rt: {}, odo: {}, fb: {}, rem: {}, panel: null, blk: {}, n: 0 };
    var panel = $('.js-tv-panel', box), wide = window.matchMedia('(min-width: 2000px)');
    var DN = ['Mon 5 Oct', 'Tue 6 Oct', 'Wed 7 Oct', 'Thu 8 Oct', 'Fri 9 Oct', 'Sat 10 Oct', 'Sun 11 Oct'];
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
    var fmtT = function (h) { return Math.floor(h) + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0'); };
    var short = function (n) { return n.replace(/^\d{4} /, ''); };
    function drives() {
      var all = D.drives.concat(s.added);
      if (s.day !== 0) {
        all = all.filter(function (_, i) { return (i + s.day + 8) % 3 !== 0; }).map(function (d) {
          return Object.assign({}, d, { st: s.day < 0 ? 'done' : 'confirmed', t: d.t + (s.day % 2 ? 0.5 : 0) });
        });
      }
      return all.map(function (d) {
        return Object.assign({}, d, { st: s.so[d.id] || d.st, t: s.rs[d.id] === undefined ? d.t : s.rs[d.id] });
      });
    }
    function prepOf(d) {
      return [0, 1, 2, 3].map(function (i) {
        var p = (s.prep[d.id] || {})[i];
        return p === undefined ? (d.st === 'done' || d.st === 'onroad' || i < (d.st === 'confirmed' ? 2 : 1)) : p;
      });
    }
    function countdown(d) {
      if (s.day !== 0) {
        return d.st === 'done' ? 'Done' : '';
      }
      var m = Math.round((d.t - NOW) * 60);
      return d.st === 'onroad' ? 'Back ' + fmtT(d.t + 0.75) : d.st === 'done' ? 'Finished' : d.st === 'noshow' ? 'Missed' :
        m > 0 ? 'in ' + (m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min') : 'now';
    }
    function place(root) {
      $$('[data-top]', root).forEach(function (el) {
        el.style.top = 'calc(var(--u) * ' + el.getAttribute('data-top') + ')';
      });
    }
    function columns(all) {
      var heads = '<span></span>', cols = '';
      for (var ci = 0; ci < 4; ci++) {
        var items = all.filter(function (d) { return (s.by === 0 ? d.staff : d.car) === ci; });
        var n, pic, who;
        if (s.by === 0) {
          n = D.staff[ci][0];
          pic = '<img class="tvh__av" src="assets/img/' + D.staff[ci][1] + '" alt="" width="' + D.staff[ci][2] + '" height="' + D.staff[ci][2] + '" decoding="async">';
        } else {
          n = short(D.cars[ci][0]);
          pic = '<img class="tvh__av tvh__av--car" src="assets/img/' + D.cars[ci][2] + '" alt="" width="' + D.cars[ci][3] + '" height="' + D.cars[ci][4] + '" decoding="async">';
        }
        who = n;
        heads += '<div class="tvh">' + pic + '<p class="tvh__b"><span class="tvh__n">' + esc(n) + '</span><span class="tvh__s">' + items.length + ' drives</span></p></div>';
        var slots = '';
        for (var k = 0; k < 20; k++) {
          var t = 9 + k * 0.5;
          if (!items.some(function (x) { return t >= x.t - 0.25 && t < x.t + 0.75; })) {
            slots += '<button class="tvslot js-tv-slot" type="button" data-c="' + ci + '" data-t="' + t + '" data-top="' + (t - 9) * HH + '" aria-label="Book ' + fmtT(t) + ' · ' + esc(who) + '" title="Book ' + fmtT(t) + '"></button>';
          }
        }
        var blocks = items.map(function (d) {
          var on = d.id === s.sel;
          return '<button class="tvb tvb--' + d.st + ' js-tv-b' + (on ? ' is-sel' : '') + '" type="button" data-id="' + d.id + '" data-top="' + (d.t - 9) * HH + '" aria-pressed="' + on + '">' +
            '<span class="tvb__t">' + fmtT(d.t) + ' · ' + ST[d.st] + '</span><span class="tvb__c">' + esc(d.cust) + '</span><span class="tvb__m">' + esc(D.cars[d.car][0]) + '</span></button>';
        }).join('');
        cols += '<div class="tvcol">' + slots + blocks + '</div>';
      }
      $('.js-tv-heads', box).innerHTML = heads;
      $('.js-tv-cols', box).innerHTML = cols;
      place($('.js-tv-cols', box));
    }
    function btn(t, a, cls, done) {
      return '<button class="tvbtn tvbtn--' + cls + ' js-tv-act' + (done ? ' is-done' : '') + '" type="button" data-a="' + a + '"' + (done ? ' aria-disabled="true"' : '') + '>' + t + '</button>';
    }
    function acts(d) {
      var f = s.fb[d.id] || {};
      if (d.st === 'pending') {
        return '<p class="tvacts">' + btn('Confirm', 'confirmed', 'acc') + btn('Reschedule', 'rs', 'line') + '</p>';
      }
      if (d.st === 'confirmed') {
        return '<p class="tvacts">' + btn('Start drive', 'onroad', 'acc') + btn(s.rem[d.id] ? '✓ Reminder sent' : 'Send reminder', 'rem', 'line', s.rem[d.id]) + btn('No-show', 'noshow', 'mute') + '</p>';
      }
      if (d.st === 'onroad') {
        return '<label class="tvodo"><span class="tvodo__k">Odometer after drive</span><input class="tvodo__in js-tv-odo" type="text" inputmode="numeric" value="' +
          esc(s.odo[d.id] === undefined ? '3,142' : s.odo[d.id]) + '"><span class="tvodo__k">mi</span></label><p class="tvacts">' + btn('End drive', 'done', 'ok') + '</p>';
      }
      if (d.st === 'done') {
        var stars = [1, 2, 3, 4, 5].map(function (n) {
          return '<button class="tvstar js-tv-star" type="button" data-r="' + n + '" aria-pressed="' + (n <= (f.r || 0)) + '" aria-label="' + n + ' of 5">★</button>';
        }).join('');
        var int = ['Yes', 'Maybe', 'No'].map(function (t, i) {
          return '<button class="tvseg__b js-tv-int" type="button" data-i="' + i + '" aria-pressed="' + (f.i === i) + '">' + t + '</button>';
        }).join('');
        return '<div class="tvfb"><span class="tvfb__t">How did it go?</span><span class="tvfb__stars" role="group" aria-label="Rating">' + stars + '</span>' +
          '<span class="tvfb__int">Interested?<span class="tvseg" role="group" aria-label="Interested">' + int + '</span></span></div>' +
          '<p class="tvacts">' + btn(f.off ? '✓ Offer sent' : 'Send offer', 'off', 'acc', f.off) + btn(f.fu ? '✓ Follow-up booked' : 'Book follow-up', 'fu', 'line', f.fu) + '</p>';
      }
      return '<p class="tvacts">' + btn(f.rb ? '✓ Rebook link sent' : 'Send rebook link', 'rb', 'ink', f.rb) + '</p>';
    }
    function drivePanel(all) {
      var d = all.filter(function (x) { return x.id === s.sel; })[0];
      $('.js-tv-none', panel).hidden = !!d;
      $('.js-tv-has', panel).hidden = !d;
      if (!d) {
        return;
      }
      var car = D.cars[d.car], pr = prepOf(d), ok = pr.filter(Boolean).length;
      var stEl = $('.js-tv-st', panel);
      stEl.className = 'tvst tvst--' + d.st + ' js-tv-st';
      stEl.textContent = ST[d.st];
      setText('.js-tv-time', fmtT(d.t) + ' · 45 min');
      setText('.js-tv-cd', countdown(d));
      var av = $('.js-tv-av', panel);
      av.src = 'assets/img/' + d.img;
      av.width = av.height = d.iw;
      setText('.js-tv-cust', d.cust);
      $('.js-tv-tags', panel).innerHTML = d.tags.map(function (t) { return '<span class="tvtag tvtag--' + t[1] + '">' + esc(t[0]) + '</span>'; }).join('');
      $('.js-tv-tel', panel).href = 'tel:' + d.phone.replace(/ /g, '');
      $('.js-tv-tel', panel).setAttribute('aria-label', 'Call ' + d.cust);
      var ci = $('.js-tv-carimg', panel);
      ci.src = 'assets/img/' + car[2];
      ci.width = car[3];
      ci.height = car[4];
      setText('.js-tv-car', car[0]);
      setText('.js-tv-carsub', car[1]);
      setText('.js-tv-place', d.place);
      setText('.js-tv-staff', D.staff[d.staff][0]);
      $$('.js-tv-route', panel).forEach(function (b, i) {
        b.setAttribute('aria-pressed', i === (s.rt[d.id] || 0) ? 'true' : 'false');
      });
      $$('.js-tv-prep', panel).forEach(function (b, i) {
        b.setAttribute('aria-pressed', pr[i] ? 'true' : 'false');
      });
      var pn = $('.js-tv-prepn', panel);
      pn.textContent = ok + ' / 4 ready';
      pn.classList.toggle('is-ok', ok === 4);
      $('.js-tv-acts', panel).innerHTML = acts(d);
      $('.js-tv-reslots', panel).hidden = s.panel !== 'rs';
    }
    function paint() {
      var all = drives();
      columns(all);
      drivePanel(all);
      setText('.js-tv-today', all.length);
      setText('.js-tv-day', s.day === 0 ? 'Today · Tue 6 Oct' : DN[1 + s.day]);
      $('.js-tv-prev', box).disabled = s.day <= -1;
      $('.js-tv-next', box).disabled = s.day >= 5;
      $('.js-tv-now', box).hidden = s.day !== 0;
      $$('.js-tv-by', box).forEach(function (b) {
        b.setAttribute('aria-pressed', +b.getAttribute('data-by') === s.by ? 'true' : 'false');
      });
      $$('.js-tv-fl', box).forEach(function (b) {
        var i = +b.getAttribute('data-c'), out = all.some(function (d) { return d.car === i && d.st === 'onroad'; }), el = $('.js-tv-fls', b);
        var left = all.filter(function (d) { return d.car === i && d.st !== 'done'; }).length;
        b.setAttribute('aria-pressed', s.blk[i] ? 'true' : 'false');
        el.className = 'tvfl__s tvfl__s--' + (s.blk[i] ? 'mute' : out ? 'acc' : 'ok') + ' js-tv-fls';
        el.textContent = s.blk[i] ? 'Blocked · photo shoot' : out ? 'Out on a drive' : left + ' more today';
      });
    }
    function pick(id) {
      s.sel = id;
      s.panel = null;
      paint();
      if (!wide.matches) {
        panel.scrollIntoView({ block: 'start' });
      }
    }
    function book(col, t) {
      s.n += 1;
      var id = 'n' + s.n;
      s.added.push({ id: id, t: t, cust: 'New booking', img: 'avatar-default.svg', iw: 60, phone: '+1 310 555 0144', car: s.by === 1 ? col : 0, staff: s.by === 0 ? col : 0,
        place: 'Showroom', st: 'pending', tags: [['Booked just now', 'blue']] });
      pick(id);
    }
    place(box);
    box.addEventListener('click', function (e) {
      var t = e.target, b;
      if ((b = t.closest('.js-tv-b'))) {
        pick(b.getAttribute('data-id'));
        return;
      }
      if ((b = t.closest('.js-tv-slot'))) {
        book(+b.getAttribute('data-c'), +b.getAttribute('data-t'));
        return;
      }
      if (t.closest('.js-tv-book')) {
        book(0, 18.5);
        return;
      }
      var id = s.sel, f = s.fb[id] || {};
      if ((b = t.closest('.js-tv-avail'))) {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = on ? '✓ Hours: 9:00–19:00 · 45 min slots' : 'Availability settings';
        return;
      } else if (t.closest('.js-tv-prev')) {
        s.day = Math.max(-1, s.day - 1);
      } else if (t.closest('.js-tv-next')) {
        s.day = Math.min(5, s.day + 1);
      } else if (t.closest('.js-tv-todaybtn')) {
        s.day = 0;
      } else if ((b = t.closest('.js-tv-by'))) {
        s.by = +b.getAttribute('data-by');
      } else if ((b = t.closest('.js-tv-route'))) {
        s.rt[id] = +b.getAttribute('data-r');
      } else if ((b = t.closest('.js-tv-prep'))) {
        s.prep[id] = s.prep[id] || {};
        s.prep[id][b.getAttribute('data-p')] = b.getAttribute('aria-pressed') !== 'true';
      } else if ((b = t.closest('.js-tv-act'))) {
        var a = b.getAttribute('data-a');
        if (b.classList.contains('is-done')) {
          return;
        }
        if (ST[a]) {
          s.so[id] = a;
          s.panel = null;
        } else if (a === 'rs') {
          s.panel = s.panel === 'rs' ? null : 'rs';
        } else if (a === 'rem') {
          s.rem[id] = true;
        } else {
          f[a] = true;
          s.fb[id] = f;
        }
      } else if ((b = t.closest('.js-tv-reslot'))) {
        s.rs[id] = +b.getAttribute('data-t');
        s.so[id] = 'confirmed';
        s.panel = null;
      } else if ((b = t.closest('.js-tv-star'))) {
        f.r = +b.getAttribute('data-r');
        s.fb[id] = f;
      } else if ((b = t.closest('.js-tv-int'))) {
        f.i = +b.getAttribute('data-i');
        s.fb[id] = f;
      } else if ((b = t.closest('.js-tv-fl'))) {
        var c = b.getAttribute('data-c');
        s.blk[c] = !s.blk[c];
      } else {
        return;
      }
      paint();
    });
    box.addEventListener('input', function (e) {
      if (e.target.classList.contains('js-tv-odo')) {
        s.odo[s.sel] = e.target.value;
      }
    });
    paint();
  }

  /* Dealer deals (build_dealer_deals.py): pipeline board + deal sheet. board(), sheet() and kpis() mirror the Python builders;
     the deal objects from the JSON are the state (stage, add-ons, documents, lender, link, e-sign, delivery mode). */
  function initDeals() {
    var box = $('.js-dz');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-dz'));
    var ST = D.stages, SH = D.short, ADD = D.addons, DOCS = D.docs, sel = D.sel, made = false;
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
    var money = function (n) { return (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US'); };
    var img = function (ph, cls) { return '<img class="' + cls + '" src="assets/img/' + ph[0] + '" alt="" width="' + ph[1] + '" height="' + ph[2] + '" decoding="async">'; };
    function get(id) {
      return D.deals.filter(function (d) { return d.id === id; })[0];
    }
    function blocker(d) {
      if (d.st === 7) {
        return ['Cancelled', 'mute'];
      }
      if (d.st === 6) {
        return ['Handed over', 'ok'];
      }
      var miss = d.docs.indexOf(0);
      if (d.st === 3 && d.pay !== 'Cash' && !d.fok) {
        return ['Waiting for lender', 'amber'];
      }
      if (d.st >= 2 && miss >= 0) {
        return ['Waiting for ' + DOCS[miss].split(' /')[0].toLowerCase(), 'acc'];
      }
      if (d.st === 0) {
        return ['Customer reviewing', 'mute'];
      }
      if (d.st === 1) {
        return ['Deposit link not paid', 'amber'];
      }
      return ['On track', 'ok'];
    }
    function calc(d) {
      var add = ADD.reduce(function (a, x, i) { return a + (d.adds[i] ? x[1] : 0); }, 0);
      var net = d.price - d.disc + add - d.trade, tax = Math.round(net * 0.095);
      return { add: add, tax: tax, due: net + tax + 85 - d.dep, gross: d.price - d.disc - d.cost + add * 0.6 };
    }
    function kpis() {
      var open = D.deals.filter(function (d) { return d.st < 6; });
      setText('.js-dz-kv[data-i="0"]', open.length);
      setText('.js-dz-kv[data-i="1"]', money(open.reduce(function (a, d) { return a + d.price - d.disc; }, 0)));
      setText('.js-dz-kv[data-i="2"]', open.filter(function (d) { return d.st >= 4; }).length);
    }
    function board() {
      $('.js-dz-board', box).innerHTML = ST.map(function (t, i) {
        var items = D.deals.filter(function (d) { return d.st === i; });
        var cards = items.map(function (d) {
          var on = d.id === sel, b = blocker(d);
          return '<li><button class="dzc js-dz-card' + (on ? ' is-sel' : '') + '" type="button" data-id="' + d.id + '" aria-pressed="' + on + '">' + img(d.ph, 'dzc__img') +
            '<span class="dzc__car">' + esc(d.car) + '</span><span class="dzc__row"><span>' + esc(d.cust) + '</span><span class="dzc__p">' + money(d.price - d.disc) + '</span></span>' +
            '<span class="dzc__bl dzc__bl--' + b[1] + '">' + b[0] + '</span></button></li>';
        }).join('');
        var total = items.length ? money(items.reduce(function (a, d) { return a + d.price - d.disc; }, 0)) : '—';
        return '<section class="dzcol" aria-labelledby="dz-c' + i + '"><h2 class="dzcol__h" id="dz-c' + i + '"><span class="dzcol__t"><span class="dzdot dzdot--' + i + '" aria-hidden="true"></span>' + t + '</span>' +
          '<span class="dzcol__n">' + items.length + '</span></h2><p class="dzcol__sum">' + total + '</p><ul class="dzcol__ul">' + cards + '</ul></section>';
      }).join('');
    }
    function sheet(d) {
      var c = calc(d), b = blocker(d), stage = d.st === 7 ? ['Cancelled', 'x'] : [ST[d.st], d.st];
      var rail = ST.map(function (t, i) {
        return '<button class="dzrail__b dzrail__b--' + i + (i === d.st ? ' is-cur' : i < d.st && d.st < 7 ? ' is-past' : '') + ' js-dz-stage" type="button" data-s="' + i + '" title="' + t + '" aria-pressed="' + (i === d.st) + '"' + (d.st === 7 ? ' disabled' : '') + '>' + SH[i] + '</button>';
      }).join('');
      var lines = [['Vehicle price', money(d.price), ''], ['Discount', money(-d.disc), 'ok'], ['Add-ons', money(c.add), ''], ['Trade-in', money(-d.trade), 'ok'],
        ['Sales tax 9.5% + doc fee', money(c.tax + 85), 'mute'], ['Deposit paid', money(-d.dep), 'ok'], ['Balance due', money(c.due), 'tot']].map(function (l) {
        return '<li class="dzln' + (l[2] ? ' dzln--' + l[2] : '') + '"><span>' + l[0] + '</span><span class="dzln__v">' + l[1] + '</span></li>';
      }).join('');
      var adds = ADD.map(function (x, i) {
        return '<button class="dzadd js-dz-add" type="button" data-a="' + i + '" aria-pressed="' + !!d.adds[i] + '">' + (d.adds[i] ? '✓' : '+') + ' ' + x[0] + ' · ' + money(x[1]) + '</button>';
      }).join('');
      var fin = '';
      if (d.pay !== 'Cash') {
        var ok = d.fok || d.st >= 4, apr = d.pay === 'Avava Finance' ? 5.9 : 6.4, amt = Math.max(0, c.due), r = apr / 1200;
        var mo = Math.round(amt * r / (1 - Math.pow(1 + r, -60)));
        fin = '<div class="dzbox"><p class="dzbox__h"><span class="dzbox__k">Financing · ' + (d.pay === 'Avava Finance' ? 'Avava Finance' : 'Chase Auto') + '</span>' +
          '<span class="dzpill dzpill--' + (ok ? 'ok' : 'amber') + '">' + (ok ? '✓ Approved' : 'Pending') + '</span></p>' +
          '<ul class="dzfin"><li><span class="dzfin__k">APR</span><span class="dzfin__v">' + apr + '%</span></li><li><span class="dzfin__k">Term</span><span class="dzfin__v">60 mo</span></li>' +
          '<li><span class="dzfin__k">Monthly</span><span class="dzfin__v">' + money(mo) + '</span></li></ul>' + (ok ? '' : '<button class="dzsubmit js-dz-submit" type="button">Submit to lender</button>') + '</div>';
      }
      var SS = { 0: ['Missing', 'acc'], 2: ['Requested', 'amber'], 1: ['Received', 'ok'] }, got = 0, need = 0;
      var docs = DOCS.map(function (n, i) {
        var v = d.docs[i];
        if (v === -1) {
          return '';
        }
        need += 1;
        got += v === 1 ? 1 : 0;
        return '<li class="dzdoc dzdoc--' + SS[v][1] + '"><span class="dzdoc__dot" aria-hidden="true"></span><span class="dzdoc__t">' + esc(n) + '</span><span class="dzdoc__s">' + SS[v][0] + '</span>' +
          (v === 1 ? '' : '<button class="dzdoc__b js-dz-doc" type="button" data-d="' + i + '">' + (v === 2 ? 'Mark received' : 'Request') + '</button>') + '</li>';
      }).join('');
      var acts;
      if (d.st === 7) {
        acts = '<button class="dzbtn dzbtn--ink js-dz-act" type="button" data-a="reopen">Reopen deal</button>';
      } else if (d.st === 6) {
        acts = '<button class="dzbtn js-dz-act" type="button" data-a="invoice">View invoice</button>';
      } else {
        acts = '<button class="dzbtn dzbtn--' + (d.st === 5 ? 'ok' : 'acc') + ' js-dz-act" type="button" data-a="next">' + (d.st === 5 ? 'Mark delivered' : 'Move to ' + ST[d.st + 1]) + '</button>' +
          '<button class="dzbtn js-dz-act' + (d.es ? ' is-done' : '') + '" type="button" data-a="esign">' + (d.es ? '✓ Sent for e-sign' : 'Send for e-sign') + '</button>' +
          '<button class="dzbtn dzbtn--mute js-dz-act" type="button" data-a="cancel">Cancel</button>';
      }
      var mode = ['Showroom', 'Home'].map(function (t, i) {
        return '<button class="dzmode__b js-dz-mode" type="button" data-m="' + i + '" aria-pressed="' + (i === d.home) + '">' + t + '</button>';
      }).join('');
      return '<div class="dzs__l"><p class="dzs__hd"><span class="dzpill dzpill--s' + stage[1] + '">' + stage[0] + '</span><span class="dzs__id">' + d.id + ' · ' + d.mgr + '</span><span class="dzs__bl dzc__bl--' + b[1] + '">' + b[0] + '</span></p>' +
        '<div class="dzs__car">' + img(d.ph, 'dzs__img') + '<p class="dzs__cb"><span class="dzs__n">' + esc(d.car) + '</span><span class="dzs__c">' + esc(d.cust) + ' · ' + d.pay + '</span></p></div>' +
        '<div class="dzrail" role="group" aria-label="Stage">' + rail + '</div><div class="dzsheet"><p class="dzsheet__h">Deal sheet</p><ul class="dzsheet__ul">' + lines + '</ul></div>' +
        '<div class="dzadds"><p class="dzadds__h">Add-ons</p><p class="dzadds__l">' + adds + '</p></div>' +
        '<ul class="dzgp"><li class="dzgp__c dzgp__c--ok"><span class="dzgp__k">Gross profit</span><span class="dzgp__v">' + money(c.gross) + '</span></li>' +
        '<li class="dzgp__c"><span class="dzgp__k">Margin</span><span class="dzgp__v">' + (c.gross / (d.price - d.disc) * 100).toFixed(1) + '%</span></li></ul></div>' +
        '<div class="dzs__r">' + fin + '<div class="dzbox dzbox--docs"><p class="dzbox__h"><span class="dzbox__k">Documents</span><span class="dzbox__n dzbox__n--' + (got === need ? 'ok' : 'amber') + '">' + got + ' of ' + need + ' received</span></p><ul class="dzdocs">' + docs + '</ul></div>' +
        '<div class="dzbox dzbox--row"><p class="dzdue"><span class="dzbox__k">Balance due</span><span class="dzdue__v">' + money(c.due) + '</span></p>' +
        '<button class="dzlink js-dz-pay' + (d.pl ? ' is-done' : '') + '" type="button">' + (d.pl ? '✓ Link sent' : 'Send payment link') + '</button></div>' +
        '<div class="dzbox dzbox--row dzbox--del"><p class="dzdel"><span class="dzbox__k">Delivery</span><span class="dzdel__v">' + esc(d.del) + ' · ' + (d.home ? 'at home' : 'showroom') + '</span></p>' +
        '<div class="dzmode" role="group" aria-label="Delivery">' + mode + '</div></div><p class="dzacts">' + acts + '</p></div>';
    }
    function paint() {
      kpis();
      board();
      var d = get(sel);
      $('.js-dz-none', box).hidden = !!d;
      $('.js-dz-sheet', box).hidden = !d;
      if (d) {
        $('.js-dz-sheet', box).innerHTML = sheet(d);
      }
    }
    function download(blob, name) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    box.addEventListener('click', function (e) {
      var t = e.target, b, d = get(sel);
      if ((b = t.closest('.js-dz-card'))) {
        sel = b.getAttribute('data-id');
        paint();
        $('.dzs', box).scrollIntoView({ block: 'start' });
        return;
      }
      if (t.closest('.js-dz-new')) {
        // a deal for the hottest lead: Sofia R. on the 911 GT3, opened at the offer stage
        if (!made) {
          made = true;
          var gt3 = get('DL-2041');
          D.deals.unshift({ id: 'DL-2042', cust: 'Sofia R.', car: gt3.car, ph: gt3.ph, price: gt3.price, disc: 0, cost: gt3.cost, trade: 64000, dep: 0, pay: 'Avava Finance', st: 0,
            del: '—', home: 0, mgr: 'Mateo', docs: [0, 0, 0, 0, 0, 0], adds: [false, false, false] });
        }
        sel = 'DL-2042';
        paint();
        $('.dzs', box).scrollIntoView({ block: 'start' });
        return;
      }
      if ((b = t.closest('.js-dz-export'))) {
        var rows = [['Deal', 'Customer', 'Car', 'Stage', 'Price', 'Balance due', 'Payment', 'Manager']].concat(D.deals.map(function (x) {
          return [x.id, x.cust, x.car, x.st === 7 ? 'Cancelled' : ST[x.st], x.price - x.disc, Math.round(calc(x).due), x.pay, x.mgr];
        }));
        download(new Blob([rows.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\n')], { type: 'text/csv' }), 'pacific-motors-deals.csv');
        b.textContent = '✓ CSV downloaded';
        b.classList.add('is-done');
        return;
      }
      if (!d) {
        return;
      }
      if ((b = t.closest('.js-dz-stage'))) {
        d.st = +b.getAttribute('data-s');
      } else if ((b = t.closest('.js-dz-add'))) {
        var i = +b.getAttribute('data-a');
        d.adds[i] = !d.adds[i];
      } else if (t.closest('.js-dz-submit')) {
        d.fok = true;
      } else if ((b = t.closest('.js-dz-doc'))) {
        var k = +b.getAttribute('data-d');
        d.docs[k] = d.docs[k] === 2 ? 1 : 2;
      } else if ((b = t.closest('.js-dz-pay'))) {
        d.pl = true;
      } else if ((b = t.closest('.js-dz-mode'))) {
        d.home = +b.getAttribute('data-m');
      } else if ((b = t.closest('.js-dz-act'))) {
        var a = b.getAttribute('data-a');
        if (a === 'next') {
          d.st += 1;
        } else if (a === 'esign') {
          d.es = true;
        } else if (a === 'cancel') {
          d.was = d.st;
          d.st = 7;
        } else if (a === 'reopen') {
          d.st = d.was === undefined ? 0 : d.was;
        } else if (a === 'invoice') {
          var c = calc(d);
          download(textPdf(['PACIFIC MOTORS - AVAVA CAR MARKETPLACE', 'Invoice ' + d.id.replace('DL', 'INV') + ' - ' + d.del, '', 'Customer: ' + d.cust, 'Vehicle: ' + d.car,
            'Vehicle price: ' + money(d.price), 'Discount: ' + money(-d.disc).replace('−', '-'), 'Add-ons: ' + money(c.add), 'Trade-in: ' + money(-d.trade).replace('−', '-'),
            'Sales tax 9.5% + doc fee: ' + money(c.tax + 85), 'Deposit paid: ' + money(-d.dep).replace('−', '-'), 'Balance due: ' + money(c.due).replace('−', '-'), '', 'Thank you for buying with Pacific Motors.']), d.id + '-invoice.pdf');
          return;
        }
      } else {
        return;
      }
      paint();
    });
    paint();
  }

  /* Dealer inventory (build_dealer_inventory.py): stock table + car panel. live(), row(), health(), kpis() and panel() mirror the
     Python builders; the car objects from the JSON hold the edits (price, status, promoted, quality fixes). */
  function initInventory() {
    var box = $('.js-iv');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-iv'));
    var cars = D.cars, B = D.bands, sel = D.sel;
    var s = { ck: {}, tf: 'All', q: '', so: 'Days in stock', sm: 'all', ab: -1, pt: 'Overview', dp: {}, n: 0 };
    var panel = $('.js-iv-panel', box), wide = window.matchMedia('(min-width: 2000px)');
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
    var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    var num = function (n) { return n.toLocaleString('en-US'); };
    var r100 = function (v) { return Math.round(v / 100) * 100; };
    cars.forEach(function (c) {
      c.price = c.p0;
      c.pm = false;
    });
    function live(c) {
      c.q = Math.round((Math.min(c.photos, 30) / 30 * 0.5 + c.desc * 0.25 + c.hist * 0.25) * 100);
      c.diff = (c.price - c.market) / c.market;
      c.sug = c.s !== 'Sold' && (c.diff > 0.02 || (c.days > 45 && c.diff > -0.015)) ? Math.round(c.market * 0.985 / 500) * 500 : 0;
      if (c.sug >= c.price) {
        c.sug = 0;
      }
      return c;
    }
    function get(id) {
      return cars.filter(function (c) { return c.id === id; })[0];
    }
    var pos = function (c) { return c.diff < -0.02 ? ['Great price', 'ok'] : c.diff > 0.02 ? ['Above market', 'acc'] : ['Fair price', 'blue']; };
    var dayTone = function (c) { return c.s === 'Sold' ? 'mute' : c.days <= 30 ? 'ok' : c.days <= 60 ? 'amber' : 'acc'; };
    var qTone = function (q) { return q >= 80 ? 'ok' : q >= 60 ? 'amber' : 'acc'; };
    var img = function (ph, cls, alt) { return '<img class="' + cls + '" src="assets/img/' + ph[0] + '" alt="' + esc(alt || '') + '" width="' + ph[1] + '" height="' + ph[2] + '" decoding="async">'; };
    function spark(c) {
      var sd = +c.id.slice(3), out = [];
      for (var i = 0; i < 14; i++) {
        var v = c.views ? 0.25 + 0.75 * Math.abs(Math.sin(sd * 0.13 + i * 0.7)) * (c.days > 45 ? 1 - i / 22 : 0.6 + i / 35) : 0.06;
        out.push(Math.max(3, Math.round(v * 30)));
      }
      return out;
    }
    var SMF = { all: function () { return true; }, sug: function (c) { return !!c.sug; }, q: function (c) { return c.q < 80; },
      old: function (c) { return c.days > 45 && c.s !== 'Sold'; }, nl: function (c) { return c.leads <= 2 && c.s !== 'Sold'; }, pm: function (c) { return c.pm; } };
    function row(c) {
      var on = c.id === sel, p = pos(c), last = c.days > 60 ? 'is-acc' : 'is-last';
      var sp = spark(c).map(function (h, i) { return '<span' + (i === 13 ? ' class="' + last + '"' : '') + ' data-h="' + h + '"></span>'; }).join('');
      return '<li class="ivr js-iv-row' + (on ? ' is-sel' : '') + '" data-id="' + c.id + '">' +
        '<button class="ivr__ck js-iv-ck" type="button" aria-pressed="' + !!s.ck[c.id] + '" aria-label="Select ' + esc(c.car) + '"></button>' +
        '<span class="ivr__v"><span class="ivr__ph">' + img(c.ph, 'ivr__img') + (c.pm ? '<span class="ivr__star" aria-label="Promoted">★</span>' : '') + '</span>' +
        '<span class="ivr__vb"><button class="ivr__n js-iv-open" type="button" aria-pressed="' + on + '">' + esc(c.car) + '</button><span class="ivr__s">' + c.id + ' · ' + c.leads + ' lead' + (c.leads === 1 ? '' : 's') + '</span></span></span>' +
        '<span class="ivr__p"><span class="ivr__pv">' + money(c.price) + '</span>' + (c.price !== c.p0 ? '<s class="ivr__was">' + money(c.p0) + '</s>' : '') + '</span>' +
        '<span class="ivpill ivpill--' + p[1] + '">' + p[0] + '</span>' +
        '<span class="ivr__d ivr__d--' + dayTone(c) + '"><span class="ivr__dt">' + (c.s === 'Sold' ? 'Sold · ' + c.days + ' d' : c.days + ' days') + '</span><span class="ivr__db" aria-hidden="true"><span class="ivr__df" data-w="' + Math.min(100, c.days / 90 * 100) + '"></span></span></span>' +
        '<span class="ivr__vw"><span class="ivspark" aria-hidden="true">' + sp + '</span><span class="ivr__vn">' + num(c.views) + '</span></span>' +
        '<span class="ivr__q ivr__q--' + qTone(c.q) + '"><span class="ivr__qb" aria-hidden="true"><span class="ivr__qf" data-w="' + c.q + '"></span></span><span class="ivr__qv">' + c.q + '%</span></span>' +
        '<span class="ivst ivst--' + c.s.toLowerCase() + '">' + c.s + '</span></li>';
    }
    function sizes(root) {
      $$('[data-w]', root).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
      $$('.ivspark [data-h]', root).forEach(function (el) { el.style.height = 'calc(var(--u) * ' + el.getAttribute('data-h') + ')'; });
      $$('[data-l]', root).forEach(function (el) { el.style.left = el.getAttribute('data-l') + '%'; });
    }
    function stock() {
      return cars.filter(function (c) { return c.s !== 'Sold'; });
    }
    function health() {
      var st = stock();
      $$('.js-iv-band', box).forEach(function (b) {
        var i = +b.getAttribute('data-b'), its = st.filter(function (c) { return c.days >= B[i][2] && c.days <= B[i][3]; });
        b.classList.toggle('is-dim', s.ab !== -1 && s.ab !== i);
        b.classList.toggle('is-on', s.ab === i);
        if (b.classList.contains('ivhb')) {
          b.style.width = its.length / st.length * 100 + '%';
          b.setAttribute('aria-label', B[i][0] + ' · ' + its.length + ' cars');
        } else {
          $('.ivht__n', b).textContent = its.length;
          $('.ivht__s', b).textContent = 'cars · $' + Math.round(its.reduce(function (a, c) { return a + c.price; }, 0) / 1000) + 'k';
        }
      });
      var x = $('.js-iv-bandx', box);
      x.hidden = s.ab === -1;
      x.textContent = s.ab === -1 ? '' : B[s.ab][0] + ' · ' + B[s.ab][1] + '  ✕';
      var mix = [function (c) { return c.diff < -0.02; }, function (c) { return Math.abs(c.diff) <= 0.02; }, function (c) { return c.diff > 0.02; }];
      $$('.js-iv-mix', box).forEach(function (el, i) { el.textContent = st.filter(mix[i]).length; });
    }
    function kpis() {
      var st = stock(), val = st.reduce(function (a, c) { return a + c.price; }, 0);
      setText('.js-iv-kv[data-i="0"]', st.length);
      setText('.js-iv-kv[data-i="1"]', '$' + (val / 1e6).toFixed(2) + 'M');
      setText('.js-iv-kv[data-i="2"]', Math.round(st.reduce(function (a, c) { return a + c.days; }, 0) / st.length));
      setText('.js-iv-kv[data-i="3"]', st.filter(function (c) { return c.days > 60; }).length);
    }
    function table() {
      var q = s.q.toLowerCase();
      var vis = cars.filter(function (c) {
        return (s.tf === 'All' || c.s === s.tf) && (!q || (c.car + ' ' + c.id + ' ' + c.vin).toLowerCase().indexOf(q) > -1) && SMF[s.sm](c) &&
          (s.ab === -1 || (c.s !== 'Sold' && c.days >= B[s.ab][2] && c.days <= B[s.ab][3]));
      }).sort(function (x, y) { return s.so === 'Price' ? y.price - x.price : s.so === 'Leads' ? y.leads - x.leads : y.days - x.days; });
      var rows = $('.js-iv-rows', box);
      rows.innerHTML = vis.map(row).join('');
      sizes(rows);
      $('.js-iv-empty', box).hidden = vis.length > 0;
      setText('.js-iv-cnt', vis.length + ' of ' + cars.length + ' cars');
      $$('.js-iv-tf', box).forEach(function (b) {
        var t = b.getAttribute('data-t');
        b.setAttribute('aria-pressed', t === s.tf ? 'true' : 'false');
        $('.js-iv-tfn', b).textContent = t === 'All' ? cars.length : cars.filter(function (c) { return c.s === t; }).length;
      });
      $$('.js-iv-sm', box).forEach(function (b) {
        var m = b.getAttribute('data-m');
        b.setAttribute('aria-pressed', m === s.sm ? 'true' : 'false');
        $('.js-iv-smn', b).textContent = cars.filter(SMF[m]).length;
      });
      $$('.js-iv-sort', box).forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-s') === s.so ? 'true' : 'false');
      });
      var ck = Object.keys(s.ck).filter(function (k) { return s.ck[k]; });
      $('.js-iv-bulk', box).hidden = !ck.length;
      setText('.js-iv-bulkt', ck.length + (ck.length === 1 ? ' car selected' : ' cars selected'));
    }
    function overview(c) {
      var p = pos(c), lo = c.market * 0.9, hi = c.market * 1.1, pp = Math.max(0, Math.min(100, (c.price - lo) / (hi - lo) * 100));
      var cost = r100(c.p0 * 0.9), gross = c.price - cost, est = Math.max(5, Math.round(20 + c.diff * 700)), rate = c.leads / Math.max(c.days, 7) * 7, estl = Math.max(0.2, rate * (1 - c.diff * 10));
      var presets = [['Match market', r100(c.market)], ['−1%', r100(c.price * 0.99)], ['−2%', r100(c.price * 0.98)], ['Beat lowest comp', r100(c.market * 0.97) - 500]].map(function (x) {
        return '<button class="ivpre js-iv-pre" type="button" data-v="' + x[1] + '" aria-pressed="' + (x[1] === c.price) + '">' + x[0] + '</button>';
      }).join('');
      var sim = [['Est. time to sell', '~' + est + ' days', est <= 30 ? 'ok' : est <= 60 ? 'amber' : 'acc', 'Market avg 24 days'], ['Leads per week', estl.toFixed(1), '', 'Now ' + rate.toFixed(1)],
        ['Gross at this price', money(gross), gross > 0 ? 'ok' : 'acc', (gross / c.price * 100).toFixed(1) + '% margin · cost ' + money(cost)]].map(function (x) {
        return '<li class="ivsim__c"><span class="ivsim__k">' + x[0] + '</span><span class="ivsim__v' + (x[2] ? ' ivsim__v--' + x[2] : '') + '">' + x[1] + '</span><span class="ivsim__s">' + x[3] + '</span></li>';
      }).join('');
      var perf = [['Views', num(c.views)], ['Saves', c.saves], ['Leads', c.leads], ['Test drives', c.tds]].map(function (x) {
        return '<li class="ivperf__c"><span class="ivperf__k">' + x[0] + '</span><span class="ivperf__v">' + x[1] + '</span></li>';
      }).join('');
      var checks = [['Photos', c.photos + ' of 30', c.photos >= 30, 'Add photos', 'ph'], ['Description', c.desc ? 'Written' : 'Missing', !!c.desc, 'Generate', 'de'],
        ['Vehicle history report', c.hist ? 'Attached' : 'Missing', !!c.hist, 'Attach', 'hi']].map(function (x) {
        return '<li class="ivchk ivchk--' + (x[2] ? 'ok' : 'warn') + '"><span class="ivchk__dot" aria-hidden="true"></span><span class="ivchk__t">' + x[0] + '</span><span class="ivchk__s">' + x[1] + '</span>' +
          (x[2] ? '' : '<button class="ivchk__b js-iv-fix" type="button" data-f="' + x[4] + '">' + x[3] + '</button>') + '</li>';
      }).join('');
      return '<div class="ivpane" data-t="Overview"><div class="ivsimc"><p class="ivsimc__h"><span class="ivsimc__k">Price simulator</span><span class="ivpill ivpill--' + p[1] + '">' + p[0] + ' · ' + (c.diff >= 0 ? '+' : '−') + Math.abs(c.diff * 100).toFixed(1) + '%</span></p>' +
        '<div class="ivprice"><button class="ivprice__b js-iv-step" type="button" data-d="-500" aria-label="Lower price by $500">−</button><p class="ivprice__c"><span class="ivprice__v">' + money(c.price) + '</span>' +
        (c.price !== c.p0 ? '<s class="ivprice__was">' + money(c.p0) + '</s>' : '') + '</p><button class="ivprice__b js-iv-step" type="button" data-d="500" aria-label="Raise price by $500">+</button></div>' +
        '<div class="ivband" aria-hidden="true"><span class="ivband__mk"></span><span class="ivband__knob ivband__knob--' + p[1] + ' js-iv-knob" data-l="' + pp + '"></span></div>' +
        '<p class="ivband__lg"><span>' + money(lo) + '</span><span class="ivband__m">Market ' + money(c.market) + '</span><span>' + money(hi) + '</span></p>' +
        '<p class="ivpres">' + presets + '</p><ul class="ivsim">' + sim + '</ul></div>' +
        '<div class="ivbox"><p class="ivbox__k">Performance · 30 days</p><ul class="ivperf">' + perf + '</ul><p class="ivbox__s">' +
        (c.views ? (c.leads / c.views * 100).toFixed(1) + '% of views became leads · your average 0.9%' : 'Not published yet') + '</p></div>' +
        '<div class="ivbox ivbox--chk"><p class="ivbox__h"><span class="ivbox__k">Listing quality</span><span class="ivbox__q ivr__q--' + qTone(c.q) + '">' + c.q + '%</span></p><ul class="ivchks">' + checks + '</ul></div></div>';
    }
    function marketTab(c) {
      var nm = c.car.replace(/^\d{4} /, ''), ph = D.comps[c.comp] || [c.ph, c.ph, c.ph];
      var rows = [['2022 ' + nm, 'Beverly Hills · 8 mi', c.market * 0.97, 12, ph[0]], [c.car, 'Pasadena · 14 mi', c.market * 1.01, 31, ph[1]], ['2021 ' + nm, 'Irvine · 39 mi', c.market * 1.04, 9, ph[2]],
        [c.car, 'Your listing', c.price, c.days, c.ph]].sort(function (x, y) { return x[2] - y[2]; }).map(function (x) {
        return '<li class="ivcomp' + (x[1] === 'Your listing' ? ' is-you' : '') + '">' + img(x[4], 'ivcomp__img') + '<span class="ivcomp__b"><span class="ivcomp__t">' + esc(x[0]) + '</span>' +
          '<span class="ivcomp__w">' + x[1] + ' · ' + x[3] + ' d listed</span></span><span class="ivcomp__p">' + money(x[2]) + '</span></li>';
      }).join('');
      var hist = [['Listed', money(c.p0 + (c.days > 30 ? 4000 : 0)), c.days + ' days ago']];
      if (c.days > 30) {
        hist.push(['Price drop −$4,000', money(c.p0), (c.days - 30) + ' days ago']);
      }
      if (c.price !== c.p0) {
        hist.push(['Price ' + (c.price < c.p0 ? 'lowered' : 'raised'), money(c.price), 'just now']);
      }
      hist = hist.reverse().map(function (h) { return '<li><span>' + h[0] + '</span><span class="ivhist__r"><span>' + h[1] + '</span><span class="ivhist__w">' + h[2] + '</span></span></li>'; }).join('');
      return '<div class="ivpane" data-t="Market"><div class="ivbox"><p class="ivbox__h"><span class="ivbox__k">Comparable cars · 50 mi</span><span class="ivcomp__w">Sorted by price</span></p><ul class="ivcomps">' + rows + '</ul></div>' +
        '<div class="ivbox"><p class="ivbox__k">Price history</p><ul class="ivhist">' + hist + '</ul></div></div>';
    }
    function leadsTab(c) {
      if (!c.leads) {
        return '<div class="ivpane" data-t="Leads"><p class="ivnone">No leads yet — publish the listing to start collecting enquiries</p></div>';
      }
      var ls = D.leads.slice(0, Math.min(4, Math.max(1, c.leads))).map(function (l) {
        return '<li class="ivlead ivlead--' + l[6] + '"><img class="ivlead__av" src="assets/img/' + l[1] + '" alt="" width="' + l[2] + '" height="' + l[2] + '" decoding="async"><span class="ivlead__b"><span class="ivlead__n">' + l[0] +
          ' <span class="ivlead__w">· ' + l[4] + '</span></span><span class="ivlead__t">' + esc(l[3].replace('{offer}', money(r100(c.price * 0.95)))) + '</span></span><span class="ivlead__s">' + l[5] + '</span></li>';
      }).join('');
      return '<div class="ivpane" data-t="Leads"><ul class="ivleads">' + ls + '</ul><a class="ivlink" href="dealer-leads.html">Open in Leads &amp; enquiries</a></div>';
    }
    function drawPanel() {
      var c = get(sel), seg = ['Live', 'Reserved', 'Draft', 'Sold'].map(function (t) {
        return '<button class="ivseg__b ivseg__b--' + t.toLowerCase() + ' js-iv-status" type="button" data-s="' + t + '" aria-pressed="' + (t === c.s) + '">' + t + '</button>';
      }).join('');
      var tabs = ['Overview', 'Market', 'Leads'].map(function (t) {
        return '<button class="ivtab js-iv-tab" type="button" data-t="' + t + '" aria-pressed="' + (t === s.pt) + '">' + (t === 'Leads' ? t + ' · ' + c.leads : t) + '</button>';
      }).join('');
      var pane = s.pt === 'Market' ? marketTab(c) : s.pt === 'Leads' ? leadsTab(c) : overview(c);
      panel.innerHTML = '<div class="ivpn__ph">' + img(c.ph, 'ivpn__img', c.car) + '<p class="ivpn__pills"><span class="ivpn__st ivpn__st--' + c.s.toLowerCase() + '">' + c.s + '</span>' +
        '<span class="ivpn__days ivr__d--' + dayTone(c) + '">' + (c.s === 'Sold' ? 'Sold' : c.days + ' days in stock') + '</span></p></div>' +
        '<div class="ivpn__hd"><h2 class="ivpn__n">' + esc(c.car) + '</h2><p class="ivpn__s">' + c.id + ' · ' + c.vin + ' · ' + c.photos + ' photos · ' + num(c.views) + ' views this month</p></div>' +
        '<div class="ivseg" role="group" aria-label="Status">' + seg + '</div><div class="ivtabs" role="group" aria-label="Car panel section">' + tabs + '</div>' + pane +
        '<p class="ivacts"><button class="ivbtn js-iv-prom' + (c.pm ? ' is-done' : '') + '" type="button">' + (c.pm ? '✓ Promoted' : 'Promote') + '</button>' +
        '<button class="ivbtn js-iv-dup' + (s.dp[c.id] ? ' is-done' : '') + '" type="button">' + (s.dp[c.id] ? '✓ Draft copy made' : 'Duplicate') + '</button><a class="ivbtn ivbtn--ink" href="listing-single-v1.html">View listing</a></p>';
      sizes(panel);
    }
    function paint(noPanel) {
      cars.forEach(live);
      kpis();
      health();
      table();
      if (!noPanel) {
        drawPanel();
      }
    }
    box.addEventListener('click', function (e) {
      var t = e.target, b, r = t.closest('.js-iv-row'), c = get(sel);
      if ((b = t.closest('.js-iv-ck'))) {
        var id = r.getAttribute('data-id');
        s.ck[id] = !s.ck[id];
        paint(true);
        return;
      }
      if (r) {
        sel = r.getAttribute('data-id');
        paint();
        if (!wide.matches) {
          panel.scrollIntoView({ block: 'start' });
        }
        return;
      }
      var ck = Object.keys(s.ck).filter(function (k) { return s.ck[k]; });
      if ((b = t.closest('.js-iv-band'))) {
        var i = +b.getAttribute('data-b');
        s.ab = s.ab === i ? -1 : i;
      } else if (t.closest('.js-iv-bandx')) {
        s.ab = -1;
      } else if ((b = t.closest('.js-iv-tf'))) {
        s.tf = b.getAttribute('data-t');
      } else if ((b = t.closest('.js-iv-sort'))) {
        s.so = b.getAttribute('data-s');
      } else if ((b = t.closest('.js-iv-sm'))) {
        s.sm = b.getAttribute('data-m');
      } else if ((b = t.closest('.js-iv-imp'))) {
        b.textContent = '✓ Feed synced · 0 changes';
        b.classList.add('is-done');
        return;
      } else if (t.closest('.js-iv-blower')) {
        ck.forEach(function (k) { get(k).price = r100(get(k).price * 0.98); });
      } else if (t.closest('.js-iv-bprom')) {
        ck.forEach(function (k) { get(k).pm = true; });
      } else if (t.closest('.js-iv-bres')) {
        ck.forEach(function (k) { get(k).s = 'Reserved'; });
      } else if (t.closest('.js-iv-bclear')) {
        s.ck = {};
      } else if ((b = t.closest('.js-iv-status'))) {
        c.s = b.getAttribute('data-s');
      } else if ((b = t.closest('.js-iv-tab'))) {
        s.pt = b.getAttribute('data-t');
      } else if ((b = t.closest('.js-iv-step'))) {
        c.price += +b.getAttribute('data-d');
      } else if ((b = t.closest('.js-iv-pre'))) {
        c.price = +b.getAttribute('data-v');
      } else if ((b = t.closest('.js-iv-fix'))) {
        var f = b.getAttribute('data-f');
        if (f === 'ph') {
          c.photos = 30;
        } else if (f === 'de') {
          c.desc = 1;
        } else {
          c.hist = 1;
        }
      } else if (t.closest('.js-iv-prom')) {
        c.pm = !c.pm;
      } else if (t.closest('.js-iv-dup')) {
        // a draft copy of the open car goes into the table; the panel stays on the original
        if (s.dp[c.id]) {
          return;
        }
        s.dp[c.id] = true;
        s.n += 1;
        cars.push(Object.assign({}, c, { id: 'ST-' + (4840 + s.n), s: 'Draft', days: 0, views: 0, saves: 0, leads: 0, tds: 0, pm: false, p0: c.price }));
      } else {
        return;
      }
      paint();
    });
    box.addEventListener('input', function (e) {
      if (e.target.classList.contains('js-iv-q')) {
        s.q = e.target.value;
        paint(true);
      }
    });
    paint();
  }

  /* Dealer add listing (build_dealer_add_listing.py). The whole view is one pure function of the state: build_dealer_add_listing.py
     runs axInit + axHtml (between the ax-render markers) in Node for the first markup, initAddListing re-renders it on every change. */
  /* ax-render:start */
  function axInit(D) {
    var ph = {};
    D.ph0.forEach(function (i) { ph[i] = 1; });
    var fe = {};
    D.fe0.forEach(function (t) { fe[t] = 1; });
    return { vin: D.vin, dec: true, mi: D.mi, cond: 'Excellent', own: '1', acc: 'None', ph: ph, cv: 0, fe: fe, desc: '', hi: false, pr: D.price, prT: false,
      fl: D.floor, op: {}, pm: 'Now', dy: 2, bo: 0, mg: 0, ex: 'pho', pv: 'Card', sv: false, pb: false, note: {} };
  }
  function axHtml(s, D) {
    var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    var r100 = function (v) { return Math.round(v / 100) * 100; };
    var img = function (p, cls, alt) { return '<img class="' + cls + '" src="assets/img/' + p[0] + '" alt="' + e(alt || '') + '" width="' + p[1] + '" height="' + p[2] + '" decoding="async">'; };
    var act = function (a, v) { return ' data-a="' + a + '"' + (v === undefined ? '' : ' data-v="' + e(v) + '"'); };
    var seg = function (key, list, cur) {
      return '<span class="axseg">' + list.map(function (t) {
        return '<button class="axseg__b js-ax"' + act(key, t) + ' type="button" aria-pressed="' + (String(t) === String(cur)) + '">' + t + '</button>';
      }).join('') + '</span>';
    };
    var A = D.angles, nPh = A.filter(function (_, i) { return s.ph[i]; }).length;
    var feSel = [].concat.apply([], D.fgroups.map(function (g) { return g[1]; })).filter(function (t) { return s.fe[t]; });
    var price = s.pr, diff = (price - D.market) / D.market, lo = D.market * 0.9, hi = D.market * 1.1;
    var pos = diff < -0.02 ? ['Great price', 'ok'] : diff > 0.02 ? ['Above market', 'acc'] : ['Fair price', 'blue'];
    var r = 5.9 / 1200, mo = price * 0.9 * r / (1 - Math.pow(1 + r, -60)), est = Math.max(5, Math.round(22 + diff * 700)), gross = price - D.cost;
    var on = function (id) { var o = D.opts.filter(function (x) { return x[0] === id; })[0]; return s.op[id] === undefined ? !!o[3] : s.op[id]; };
    var q = Math.min(100, Math.round(nPh / 12 * 35 + (s.desc.length >= 40 ? 20 : 0) + (s.hi ? 15 : 0) + Math.min(10, feSel.length * 2) + (s.dec && s.mi ? 10 : 0) + (Math.abs(diff) <= 0.03 ? 10 : 4)));
    var qt = q >= 80 ? 'ok' : q >= 60 ? 'amber' : 'acc';
    var KEYS = ['veh', 'pho', 'fea', 'des', 'pri', 'opt', 'pub'], TT = ['Vehicle', 'Photos', 'Features', 'Description', 'Pricing', 'Options', 'Publish'];
    var DONE = { veh: s.dec && !!s.mi, pho: nPh >= 8, fea: feSel.length >= 5, des: s.desc.length >= 40, pri: s.prT || Math.abs(diff) <= 0.03, opt: true, pub: s.pb };
    var doneN = KEYS.filter(function (k) { return DONE[k]; }).length;
    var day = D.days[s.dy], own = s.own + (s.own === '1' ? ' owner' : ' owners'), accT = s.acc === 'None' ? 'No accidents' : s.acc + ' accident';
    var title = s.dec ? D.year + ' ' + D.title : 'Your car';
    var SUM = { veh: (s.dec ? title : 'Not decoded') + ' · ' + s.mi + ' mi · ' + s.cond, pho: nPh + ' of 12 angles · cover: ' + A[s.cv], fea: feSel.length + ' selected · ' + feSel.slice(0, 2).join(', '),
      des: s.desc ? s.desc.slice(0, 64) + '…' : 'Not written yet', pri: fmt(price) + ' · ' + pos[0].toLowerCase() + ' · floor ' + fmt(s.fl),
      opt: D.opts.filter(function (o) { return on(o[0]); }).map(function (o) { return o[1]; }).join(' · '), pub: (s.pm === 'Now' ? 'Publish now' : 'Scheduled ' + day) + ' · ' + ['no boost', 'Spotlight', 'Top of search'][s.bo] };
    var autoN = [nPh < 12, s.desc.length < 40, !s.hi, diff > 0.03].filter(Boolean).length;
    var views = Math.round(q * 14 * (1 - diff * 3)), leads = Math.max(1, Math.round(q / 9 * (1 - diff * 6))), rank = Math.max(1, Math.min(18, Math.round(17 - q / 8 + diff * 80)));
    var band = function (cls) {
      return '<span class="axband ' + cls + '" aria-hidden="true"><span class="axband__mk"></span><span class="axband__knob axband__knob--' + pos[1] + '" data-l="' + Math.max(0, Math.min(100, (price - lo) / (hi - lo) * 100)).toFixed(2) + '"></span></span>';
    };
    var chips = function (list, cls) { return '<p class="axchips">' + list.map(function (t) { return '<span class="axchip' + (cls ? ' ' + cls : '') + '">' + e(t) + '</span>'; }).join('') + '</p>'; };
    var body = {};
    // Vehicle
    body.veh = function (open) {
      if (!open) {
        return chips([s.mi + ' mi', s.cond, own, accT, D.hpLine]);
      }
      return (s.dec ? '<div class="axspecs"><span class="axok">✓ Decoded from VIN · 9 fields filled</span><ul class="axspecs__g">' + D.specs.map(function (x) {
        return '<li class="axspec"><span class="axspec__k">' + x[0] + '</span><span class="axspec__v">' + e(x[1]) + '</span></li>';
      }).join('') + '</ul></div>' : '<p class="axnote">Enter a 17-character VIN — make, model, trim, powertrain and colours fill in automatically.</p>') +
        '<div class="axveh"><label class="axfield"><span class="axfield__k">Mileage</span><input class="axfield__in js-ax-in" data-f="mi" type="text" inputmode="numeric" value="' + e(s.mi) + '" placeholder="0"></label>' +
        '<div class="axfield"><span class="axfield__k">Condition</span>' + seg('cond', ['Excellent', 'Good', 'Fair'], s.cond) + '</div>' +
        '<div class="axfield"><span class="axfield__k">Owners</span>' + seg('own', ['1', '2', '3+'], s.own) + '</div>' +
        '<div class="axfield"><span class="axfield__k">Accidents</span>' + seg('acc', ['None', 'Minor', 'Major'], s.acc) + '</div></div>';
    };
    // Photos
    body.pho = function (open) {
      if (!open) {
        return '<p class="axmini">' + A.slice(0, 6).map(function (_, i) {
          return s.ph[i] ? '<span class="axmini__s' + (i === s.cv ? ' is-cover' : '') + '">' + img(D.photos[i], 'axmini__img') + '</span>' : '<span class="axmini__s is-empty"></span>';
        }).join('') + '</p>';
      }
      return '<p class="axrow"><span class="axrow__t">' + nPh + ' of 12 · listings with 12+ photos get 2× more leads</span><button class="axbtn js-ax"' + act('fill') + ' type="button">Upload all</button></p>' +
        '<ul class="axslots">' + A.map(function (t, i) {
          var f = !!s.ph[i];
          return '<li><button class="axslot' + (f ? ' is-full' : '') + (f && i === s.cv ? ' is-cover' : '') + ' js-ax"' + act('slot', i) + ' type="button" aria-label="' + e(f ? 'Make ' + t + ' the cover' : 'Upload ' + t) + '">' +
            (f ? img(D.photos[i], 'axslot__img') : '') + '<span class="axslot__l">' + e(f ? t : '+ ' + t) + '</span>' + (f && i === s.cv ? '<span class="axslot__cv">Cover</span>' : '') + '</button></li>';
        }).join('') + '</ul><p class="axhelp">Tap an empty slot to upload · tap a photo to make it the cover</p>';
    };
    // Features
    body.fea = function (open) {
      if (!open) {
        return chips(feSel.slice(0, 5), 'axchip--acc');
      }
      return D.fgroups.map(function (g) {
        return '<div class="axfg"><p class="axfg__t">' + g[0] + '</p><p class="axfg__l">' + g[1].map(function (t) {
          return '<button class="axtog js-ax"' + act('fe', t) + ' type="button" aria-pressed="' + !!s.fe[t] + '">' + (s.fe[t] ? '✓ ' : '+ ') + e(t) + '</button>';
        }).join('') + '</p></div>';
      }).join('');
    };
    // Description
    body.des = function (open) {
      if (!open) {
        return s.desc ? '<p class="axexc">' + e(s.desc) + '</p>' : '<button class="axwrite js-ax"' + act('gen') + ' type="button">Write it for me from the specs</button>';
      }
      return '<label class="sr-only" for="ax-desc">Description</label><textarea class="axta js-ax-in" id="ax-desc" data-f="desc" placeholder="History, highlights, service records, why it’s special…">' + e(s.desc) + '</textarea>' +
        '<p class="axrow axrow--l"><button class="axbtn axbtn--ink js-ax"' + act('gen') + ' type="button">Generate from specs</button><span class="axcount' + (s.desc.length >= 40 ? ' is-ok' : '') + '">' + s.desc.length + ' characters' + (s.desc.length < 40 ? ' · aim for 200+' : '') + '</span></p>' +
        '<div class="axhist' + (s.hi ? ' is-ok' : '') + '"><span class="axhist__dot" aria-hidden="true"></span><p class="axhist__b"><span class="axhist__t">Vehicle history report</span><span class="axhist__s">' + (s.hi ? 'Carfax · clean title · 1 owner' : 'Not attached') + '</span></p>' +
        '<button class="axbtn js-ax"' + act('hist') + ' type="button">' + (s.hi ? 'Remove' : 'Attach Carfax') + '</button></div>';
    };
    // Pricing
    body.pri = function (open) {
      if (!open) {
        return '<p class="axpmini"><span class="axpmini__v">' + fmt(price) + '</span>' + band('axband--mini') + '</p>';
      }
      var presets = [['Match market', r100(D.market)], ['−1%', r100(price * 0.99)], ['Beat lowest comp', D.beat], ['Quick sale', r100(D.market * 0.95)]].map(function (x) {
        return '<button class="axpre js-ax"' + act('price', x[1]) + ' type="button" aria-pressed="' + (x[1] === price) + '">' + x[0] + '</button>';
      }).join('');
      var sim = [['Est. time to sell', '~' + est + ' days', est <= 30 ? 'ok' : est <= 60 ? 'amber' : 'acc', 'Market avg 24 days'], ['Monthly', fmt(mo), '', '10% down · 60 mo · 5.9%'],
        ['Gross', fmt(gross), gross > 0 ? 'ok' : 'acc', (gross / price * 100).toFixed(1) + '% · cost ' + fmt(D.cost)]].map(function (x) {
        return '<li class="axsim__c"><span class="axsim__k">' + x[0] + '</span><span class="axsim__v' + (x[2] ? ' axsim__v--' + x[2] : '') + '">' + x[1] + '</span><span class="axsim__s">' + x[3] + '</span></li>';
      }).join('');
      var comps = D.comps.concat([['Your listing', 'Melrose · draft', price, D.photos[s.cv] || D.photos[0]]]).sort(function (x, y) { return x[2] - y[2]; }).map(function (x) {
        return '<li class="axcomp' + (x[0] === 'Your listing' ? ' is-you' : '') + '">' + img(x[3], 'axcomp__img') + '<span class="axcomp__b"><span class="axcomp__t">' + e(x[0]) + '</span><span class="axcomp__w">' + x[1] + '</span></span><span class="axcomp__p">' + fmt(x[2]) + '</span></li>';
      }).join('');
      return '<div class="axpri"><div class="axsimc"><p class="axsimc__h"><span class="axsimc__k">Asking price</span><span class="axpill axpill--' + pos[1] + '">' + pos[0] + ' · ' + (diff >= 0 ? '+' : '−') + Math.abs(diff * 100).toFixed(1) + '%</span></p>' +
        '<p class="axprice"><button class="axprice__b js-ax"' + act('step', -500) + ' type="button" aria-label="Lower price by $500">−</button><span class="axprice__v">' + fmt(price) + '</span><button class="axprice__b js-ax"' + act('step', 500) + ' type="button" aria-label="Raise price by $500">+</button></p>' +
        band('') + '<p class="axband__lg"><span>' + fmt(lo) + '</span><span class="axband__m">Market ' + fmt(D.market) + '</span><span>' + fmt(hi) + '</span></p><p class="axpres">' + presets + '</p><ul class="axsim">' + sim + '</ul></div>' +
        '<div class="axpri__r"><div class="axbox"><p class="axbox__h"><span class="axbox__k">Floor price · private</span><span class="axfloor__w' + (s.fl > price ? ' is-warn' : '') + '">' + (s.fl > price ? 'Above asking price' : 'Lower offers auto-declined') + '</span></p>' +
        '<p class="axfloor"><button class="axfloor__b js-ax"' + act('floor', -500) + ' type="button" aria-label="Lower floor by $500">−</button><span class="axfloor__v">' + fmt(s.fl) + '</span><button class="axfloor__b js-ax"' + act('floor', 500) + ' type="button" aria-label="Raise floor by $500">+</button></p></div>' +
        '<div class="axbox"><p class="axbox__k">Comparable cars · 50 mi</p><ul class="axcomps">' + comps + '</ul></div></div></div>';
    };
    // Options
    body.opt = function (open) {
      if (!open) {
        return chips(D.opts.filter(function (o) { return on(o[0]); }).map(function (o) { return o[1]; }), 'axchip--dot');
      }
      return '<ul class="axopts">' + D.opts.map(function (o) {
        return '<li><button class="axopt js-ax"' + act('opt', o[0]) + ' type="button" aria-pressed="' + on(o[0]) + '"><span class="axopt__b"><span class="axopt__t">' + o[1] + '</span><span class="axopt__d">' + o[2] + '</span></span><span class="axsw" aria-hidden="true"></span></button></li>';
      }).join('') + '</ul>';
    };
    // Publish
    body.pub = function (open) {
      if (!open) {
        return chips([s.pm === 'Now' ? 'Publish now' : day, ['No boost', 'Spotlight $49', 'Top of search $99'][s.bo], 'Assigned: ' + D.staff[s.mg][0].split(' ')[0]]);
      }
      return '<div class="axpubg"><div class="axfield"><span class="axfield__k">When</span>' + seg('pm', ['Now', 'Schedule'], s.pm) +
        (s.pm === 'Schedule' ? '<p class="axdays">' + D.days.map(function (t, i) { return '<button class="axday js-ax"' + act('day', i) + ' type="button" aria-pressed="' + (i === s.dy) + '">' + t + '</button>'; }).join('') + '</p>' : '') + '</div>' +
        '<div class="axfield"><span class="axfield__k">Assigned to</span><p class="axmgrs">' + D.staff.map(function (m, i) {
          return '<button class="axmgr js-ax"' + act('mgr', i) + ' type="button" aria-pressed="' + (i === s.mg) + '"><img class="axmgr__av" src="assets/img/' + m[1] + '" alt="" width="' + m[2] + '" height="' + m[2] + '" decoding="async">' + m[0].split(' ')[0] + '</button>';
        }).join('') + '</p></div></div><div class="axfield"><span class="axfield__k">Boost</span><ul class="axboosts">' + [['No boost', '$0', 'Standard placement'], ['Spotlight', '$49', 'Highlighted card · 7 days'], ['Top of search', '$99', 'First 3 results · 7 days']].map(function (b, i) {
          return '<li><button class="axboost js-ax"' + act('boost', i) + ' type="button" aria-pressed="' + (i === s.bo) + '"><span class="axboost__h"><span>' + b[0] + '</span><span class="axboost__p">' + b[1] + '</span></span><span class="axboost__d">' + b[2] + '</span></button></li>';
        }).join('') + '</ul></div>';
    };
    var cards = KEYS.map(function (k, i) {
      var open = s.ex === k, d = DONE[k];
      return '<section class="axc' + (open ? ' is-open' : '') + '" id="ax-' + k + '" aria-labelledby="ax-' + k + '-t"><div class="axc__h"><span class="axc__n' + (d ? ' is-done' : '') + '" aria-hidden="true">' + (d ? '✓' : i + 1) + '</span>' +
        '<div class="axc__hb"><h2 class="axc__t" id="ax-' + k + '-t">' + TT[i] + '</h2><p class="axc__s">' + e(SUM[k]) + '</p></div><span class="axst axst--' + (d ? 'ok' : 'todo') + '">' + (d ? 'Complete' : 'To do') + '</span>' +
        '<button class="axc__ed js-ax"' + act('card', k) + ' type="button" aria-expanded="' + open + '" aria-controls="ax-' + k + '">' + (open ? 'Done' : 'Edit') + '</button></div>' + body[k](open) + '</section>';
    }).join('');
    var hints = [];
    if (nPh < 12) {
      hints.push(['Add ' + (12 - nPh) + ' more photos', 'Missing: ' + A.filter(function (_, i) { return !s.ph[i]; }).slice(0, 3).join(', '), 'Upload', 'fill']);
    }
    if (s.desc.length < 40) {
      hints.push(['Write a description', 'Listings with text get 35% more saves', 'Generate', 'gen']);
    }
    if (!s.hi) {
      hints.push(['Attach history report', 'Buyers filter by “clean history”', 'Attach', 'hist']);
    }
    if (diff > 0.03) {
      hints.push(['Price is above market', fmt(price - D.market) + ' over · ~' + est + ' days to sell', 'Match', 'match']);
    }
    var pvChips = feSel.slice(0, 3).concat([on('td') ? 'Test drive' : '', on('trade') ? 'Trade-in welcome' : '', on('del') ? 'Home delivery' : '', s.hi ? 'Clean Carfax' : '']).filter(Boolean);
    var pubT = s.pb ? '✓ Published · live on Avava' : s.pm === 'Now' ? 'Publish now' : 'Schedule · ' + day;
    var cover = s.ph[s.cv] ? D.photos[s.cv] : null;
    return '<div class="axhero"><div class="axhero__l"><p class="axhero__k">Step 1 · identify the car</p><h2 class="axhero__t">Start with the VIN</h2>' +
      '<p class="axvin"><label class="sr-only" for="ax-vin">VIN</label><input class="axvin__in js-ax-in" id="ax-vin" data-f="vin" type="text" value="' + e(s.vin) + '" placeholder="17-character VIN" autocomplete="off" spellcheck="false">' +
      '<button class="axvin__go' + (s.dec ? ' is-done' : '') + ' js-ax"' + act('decode') + ' type="button">' + (s.dec ? '✓ Decoded' : 'Decode') + '</button></p>' +
      '<p class="axhero__x"><button class="axghost js-ax"' + act('scan') + ' type="button">' + (s.note.scan ? '✓ Link sent to your phone' : 'Scan with phone') + '</button><a class="axghost" href="dealer-inventory.html">Copy from inventory</a>' +
      '<button class="axghost js-ax"' + act('imp') + ' type="button">' + (s.note.imp ? '✓ Feed synced · 0 changes' : 'Import CSV / feed') + '</button></p></div>' +
      (s.dec ? '<div class="axid"><p class="axid__v"><span class="axid__ok">✓ VIN verified</span><span class="axid__vin">' + e(s.vin) + '</span></p><p class="axid__h"><span class="axid__l">' + e(D.idLine) + '</span><span class="axid__t">' + e(D.title) + '</span></p>' +
        chips(D.idPills, 'axchip--hero') + '<ul class="axid__st">' + [['Avava market value', fmt(D.market), ''], ['Range nearby', '$' + Math.round(lo / 1000) + 'k–$' + Math.round(hi / 1000) + 'k', ''], ['Avg. days to sell', '24 days', 'ok']].map(function (x) {
          return '<li class="axid__c"><span class="axid__k">' + x[0] + '</span><span class="axid__n' + (x[2] ? ' axid__n--ok' : '') + '">' + x[1] + '</span></li>';
        }).join('') + '</ul></div>' : '<p class="axid axid--none">Make, model, trim, powertrain, colours, recalls and market value appear here</p>') + '</div>' +
      '<div class="axready"><div class="axready__l"><p class="axready__h"><span class="axready__t">Ready to publish</span><span class="axready__n">' + doneN + ' of 7 sections complete</span></p><p class="axsegs">' + KEYS.map(function (k, i) {
        return '<button class="axsegs__b axsegs__b--' + (DONE[k] ? 'ok' : s.ex === k ? 'open' : 'todo') + ' js-ax"' + act('card', k) + ' type="button" title="' + TT[i] + '"><span class="axsegs__bar" aria-hidden="true"></span><span class="axsegs__t">' + TT[i] + '</span></button>';
      }).join('') + '</p></div><div class="axready__r">' + [['Views · week 1', views.toLocaleString('en-US')], ['Leads · week 1', '~' + leads]].map(function (x) {
        return '<p class="axest"><span class="axest__k">' + x[0] + '</span><span class="axest__v">' + x[1] + '</span></p>';
      }).join('') + '<button class="axauto' + (autoN ? '' : ' is-done') + ' js-ax"' + act('auto') + ' type="button">' + (autoN ? 'Auto-complete ' + autoN + (autoN === 1 ? ' item' : ' items') : '✓ Nothing to fix') + '</button></div></div>' +
      '<div class="axgrid"><div class="axcards">' + cards + '</div><aside class="axside" aria-label="Listing preview">' +
      '<div class="axpv"><p class="axpv__h"><span class="axpv__k">Buyer preview</span>' + seg('pv', ['Card', 'Mobile'], s.pv) + '</p><div class="axpv__f' + (s.pv === 'Mobile' ? ' is-mobile' : '') + '">' +
      '<div class="axpv__ph">' + (cover ? img(cover, 'axpv__img', title) : '<span class="axpv__none">No photos yet</span>') + '<span class="axpill axpill--' + pos[1] + ' axpv__pill">' + pos[0] + '</span></div>' +
      '<div class="axpv__b"><p class="axpv__t">' + e(title) + '</p><p class="axpv__l">' + e([s.mi ? s.mi + ' mi' : '', s.cond, own, accT].filter(Boolean).join(' · ')) + '</p><p class="axpv__p">' + fmt(price) + '</p>' +
      (on('fin') ? '<p class="axpv__fin">From ' + fmt(mo) + '/mo with Avava Finance</p>' : '') + '</div>' + chips(pvChips, 'axchip--tile') + '</div></div>' +
      '<div class="axrank"><p class="axrank__h"><span class="axrank__t">Search placement</span><span class="axrank__s">18 roadsters within 50 mi</span></p><p class="axrank__r"><span class="axrank__v axrank__v--' + (rank <= 3 ? 'ok' : rank <= 8 ? 'ink' : 'acc') + '">#' + rank + '</span>' +
      '<span class="axrank__d">' + (rank <= 3 ? 'top of page one' : rank <= 8 ? 'page one' : 'page two — improve price or photos') + '</span></p><p class="axrank__bar" aria-hidden="true">' +
      Array.apply(null, Array(18)).map(function (_, i) { return '<span class="' + (i + 1 === rank ? 'is-you' : i < 8 ? 'is-p1' : '') + '"></span>'; }).join('') + '</p><p class="axrank__n">Ranking uses price vs. market, photos and listing quality</p></div>' +
      '<div class="axq"><div class="axq__h"><span class="axq__ring axq__ring--' + qt + '" data-p="' + q + '"><span class="axq__v">' + q + '%</span></span><p class="axq__b"><span class="axq__t">Listing quality</span><span class="axq__s">' +
      (q >= 80 ? 'Great — top 20% of Avava listings' : q >= 60 ? 'Good — a few quick wins left' : 'Needs work before publishing') + '</span></p></div>' +
      (hints.length ? '<ul class="axhints">' + hints.map(function (h) {
        return '<li class="axhint"><p class="axhint__b"><span class="axhint__t">' + h[0] + '</span><span class="axhint__d">' + e(h[1]) + '</span></p><button class="axhint__go js-ax"' + act(h[3]) + ' type="button">' + h[2] + '</button></li>';
      }).join('') + '</ul>' : '<p class="axallset">All set — this listing is ready to publish</p>') + '</div>' +
      '<p class="axacts"><button class="axsave' + (s.sv ? ' is-done' : '') + ' js-ax"' + act('save') + ' type="button">' + (s.sv ? '✓ Draft saved' : 'Save draft') + '</button><button class="axpub' + (s.pb ? ' is-done' : '') + ' js-ax"' + act('publish') + ' type="button">' + pubT + '</button></p>' +
      '<p class="axauto__n">Draft autosaved · 2 min ago</p></aside></div>';
  }
  /* ax-render:end */
  function initAddListing() {
    var box = $('.js-axroot');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-ax')), s = axInit(D), r100 = function (v) { return Math.round(v / 100) * 100; };
    function apply(prev) {
      $$('[data-l]', box).forEach(function (el, i) {
        var to = el.getAttribute('data-l') + '%';
        // the knob slides from where it was before the re-render
        if (prev && prev[i] !== undefined && prev[i] !== to) {
          el.style.left = prev[i];
          el.getBoundingClientRect();
        }
        el.style.left = to;
      });
      $$('[data-p]', box).forEach(function (el) { el.style.setProperty('--p', el.getAttribute('data-p') + '%'); });
    }
    function paint() {
      var f = document.activeElement && box.contains(document.activeElement) ? document.activeElement.getAttribute('data-f') : null;
      var caret = f ? document.activeElement.selectionStart : 0, wasMobile = !!$('.axpv__f.is-mobile', box);
      var prev = $$('[data-l]', box).map(function (el) { return el.style.left; });
      box.innerHTML = axHtml(s, D);
      apply(prev);
      var pv = $('.axpv__f', box);
      if (pv && pv.classList.contains('is-mobile') !== wasMobile) {
        // replay the frame's width change
        pv.classList.toggle('is-mobile', wasMobile);
        pv.getBoundingClientRect();
        pv.classList.toggle('is-mobile', !wasMobile);
      }
      if (f) {
        var el = $('[data-f="' + f + '"]', box);
        if (el) {
          el.focus();
          el.setSelectionRange(caret, caret);
        }
      }
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.js-ax');
      if (!b) {
        return;
      }
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), gen = D.gen.replace('{mi}', s.mi || '—');
      var price = s.pr, diff = (price - D.market) / D.market;
      if (a === 'cond' || a === 'own' || a === 'acc' || a === 'pm' || a === 'pv') {
        s[a] = v;
      } else if (a === 'decode') {
        if (s.vin.length >= 11) {
          s.dec = true;
        }
      } else if (a === 'scan' || a === 'imp') {
        s.note[a] = true;
      } else if (a === 'card') {
        s.ex = s.ex === v ? null : v;
      } else if (a === 'fill') {
        D.angles.forEach(function (_, i) { s.ph[i] = 1; });
      } else if (a === 'slot') {
        if (s.ph[v]) {
          s.cv = +v;
        } else {
          s.ph[v] = 1;
        }
      } else if (a === 'fe') {
        s.fe[v] = !s.fe[v];
      } else if (a === 'gen') {
        s.desc = gen;
      } else if (a === 'hist') {
        s.hi = !s.hi;
      } else if (a === 'step' || a === 'price' || a === 'match') {
        s.pr = a === 'step' ? s.pr + +v : a === 'price' ? +v : r100(D.market);
        s.prT = true;
      } else if (a === 'floor') {
        s.fl += +v;
      } else if (a === 'opt') {
        var o = D.opts.filter(function (x) { return x[0] === v; })[0];
        s.op[v] = !(s.op[v] === undefined ? !!o[3] : s.op[v]);
      } else if (a === 'day' || a === 'boost' || a === 'mgr') {
        s[{ day: 'dy', boost: 'bo', mgr: 'mg' }[a]] = +v;
      } else if (a === 'auto') {
        D.angles.forEach(function (_, i) { s.ph[i] = 1; });
        if (s.desc.length < 40) {
          s.desc = gen;
        }
        s.hi = true;
        if (diff > 0.03) {
          s.pr = r100(D.market);
          s.prT = true;
        }
        s.ex = null;
      } else if (a === 'save') {
        s.sv = true;
      } else if (a === 'publish') {
        s.pb = true;
      }
      paint();
    });
    box.addEventListener('input', function (e) {
      var f = e.target.getAttribute('data-f');
      if (f === 'vin') {
        s.vin = e.target.value.toUpperCase();
        s.dec = false;
      } else if (f) {
        s[f] = e.target.value;
      }
      if (f) {
        paint();
      }
    });
    apply();
  }

  /* Dealer trade-ins (build_dealer_trade_ins.py). One pure view function: the builder runs tzInit + tzHtml (between the
     tz-render markers) in Node for the first markup, initTradeIns re-renders on every change. */
  /* tz-render:start */
  function tzInit(D) {
    return { sel: D.sel, so: {}, of: {}, mg: {}, is: {}, ng: {}, nt: {}, ch: 'Both', ad: false, ca: false };
  }
  function tzHtml(s, D) {
    var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var fmt = function (n) { return (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US'); };
    var r250 = function (v) { return Math.floor(v / 250) * 250; };
    var img = function (p, cls) { return p ? '<img class="' + cls + '" src="assets/img/' + p[0] + '" alt="" width="' + p[1] + '" height="' + p[2] + '" decoding="async">' : ''; };
    var act = function (a, v) { return ' data-a="' + a + '"' + (v === undefined ? '' : ' data-v="' + e(v) + '"'); };
    var ST = ['New', 'Booked', 'Inspected', 'Offer sent', 'Accepted', 'Declined', 'In stock'], IN = D.insp;
    var items = D.trades.map(function (t) {
      var st = s.so[t.id] === undefined ? t.st : s.so[t.id], m = s.mg[t.id] === undefined ? 8 : s.mg[t.id];
      var issues = IN.filter(function (x) { var v = (s.is[t.id] || {})[x[0]]; return v === undefined ? t.iss.indexOf(x[0]) > -1 : v; });
      var recon = 400 + issues.reduce(function (a, x) { return a + x[3]; }, 0), max = t.retail - recon - 850 - t.retail * m / 100;
      return { t: t, id: t.id, st: st, m: m, issues: issues, recon: recon, max: max, off: s.of[t.id] === undefined ? r250(max - 500) : s.of[t.id], wholesale: Math.round(t.retail * 0.8 / 100) * 100 };
    });
    var timing = function (x) { return x.t.exp; };
    var eTone = function (x) { return x.st === 3 ? 'amber' : x.st === 0 ? 'acc' : 'mute'; };
    var open = items.filter(function (x) { return x.st < 4; }), offers = items.filter(function (x) { return x.st === 3; });
    var kpi = [['Open trade-ins', open.length, '▲ 2 this week', 'ok'], ['Awaiting inspection', items.filter(function (x) { return x.st <= 1; }).length, '', 'ok'],
      ['Offers out', offers.length, fmt(offers.reduce(function (a, x) { return a + x.off; }, 0)), 'mute'], ['Avg. front gross', '$3.4k', '▲ $400 vs Sep', 'ok']];
    var html = '<div class="tzkpis">' + kpi.map(function (k) {
      return '<p class="tzk"><span class="tzk__k">' + k[0] + '</span><span class="tzk__r"><span class="tzk__v">' + k[1] + '</span><span class="tzk__d tzk__d--' + k[3] + '">' + k[2] + '</span></span></p>';
    }).join('') + '<p class="tzkx"><button class="tzkx__add js-tz"' + act('add') + ' type="button">' + (s.ad ? '✓ Appraisal started' : '+ New appraisal') + '</button>' +
      '<button class="tzkx__cal js-tz"' + act('cal') + ' type="button" aria-pressed="' + s.ca + '">' + (s.ca ? '✓ 3 inspections this week' : 'Inspection calendar') + '</button></p></div>';
    html += '<ul class="tzq">' + items.map(function (x) {
      var on = x.id === s.sel;
      return '<li><button class="tzqc' + (on ? ' is-sel' : '') + ' js-tz"' + act('sel', x.id) + ' type="button" aria-pressed="' + on + '"><span class="tzqc__s tzs--' + x.st + '">' + ST[x.st] + '</span>' +
        '<span class="tzqc__car">' + e(x.t.car) + '</span><span class="tzqc__row"><span>' + e(x.t.cust) + '</span><span class="tzqc__o">' + fmt(x.off) + '</span></span><span class="tzqc__e tzqc__e--' + eTone(x) + '">' + e(timing(x)) + '</span></button></li>';
    }).join('') + '</ul>';
    var D0 = items.filter(function (x) { return x.id === s.sel; })[0];
    if (!D0) {
      return html;
    }
    var x = D0, t = x.t, lo = Math.min(x.wholesale, x.off, t.expects) * 0.96, hi = t.retail;
    var pct = function (v) { return Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100)).toFixed(2); };
    var gross = t.retail - x.recon - 850 - x.off, eq = x.off - t.payoff;
    var winP = function (v) { return Math.max(0.05, Math.min(0.95, 0.55 + (v - t.expects) / t.expects * 7)); };
    var wTone = function (v) { return winP(v) >= 0.6 ? 'ok' : winP(v) >= 0.35 ? 'amber' : 'acc'; };
    var lines = [['Retail value · Avava market', fmt(t.retail), ''], ['Reconditioning', fmt(-x.recon), 'acc'], ['Fees, transport & detailing', fmt(-850), 'mute'],
      ['Target margin ' + x.m + '%', fmt(-t.retail * x.m / 100), 'mute'], ['Max offer', fmt(x.max), 'max']].map(function (l) {
      return '<li class="tzln' + (l[2] ? ' tzln--' + l[2] : '') + '"><span>' + e(l[0]) + '</span><span class="tzln__v">' + l[1] + '</span></li>';
    }).join('');
    var tiles = [['Front gross', fmt(gross), gross > 2500 ? 'ok' : gross > 0 ? 'amber' : 'acc', (gross / t.retail * 100).toFixed(1) + '% of retail'],
      ['Gap to customer', (x.off >= t.expects ? '+' : '−') + '$' + Math.abs(x.off - t.expects).toLocaleString('en-US'), x.off >= t.expects ? 'ok' : 'amber', 'Expects ' + fmt(t.expects)],
      ['Days to resell', '~' + t.days, t.days <= 21 ? 'ok' : t.days <= 35 ? 'amber' : 'acc', 'Similar cars, 50 mi']].map(function (c) {
      return '<li class="tztile"><span class="tztile__k">' + c[0] + '</span><span class="tztile__v tzv--' + c[2] + '">' + c[1] + '</span><span class="tztile__s">' + c[3] + '</span></li>';
    }).join('');
    var strat = [['Conservative', r250(x.max - 1500)], ['Balanced', r250(x.max - 500)], ['Aggressive', r250(x.max)]].map(function (c) {
      var w = Math.round(winP(c[1]) * 100);
      return '<li><button class="tzstr js-tz"' + act('offer', c[1]) + ' type="button" aria-pressed="' + (c[1] === x.off) + '"><span class="tzstr__h"><span>' + c[0] + '</span><span class="tzv--' + wTone(c[1]) + '">' + w + '% win</span></span>' +
        '<span class="tzstr__v">' + fmt(c[1]) + '</span><span class="tzbar" aria-hidden="true"><span class="tzbar__f tzbar__f--' + wTone(c[1]) + '" data-w="' + w + '"></span></span><span class="tzstr__g">Gross ' + fmt(t.retail - x.recon - 850 - c[1]) + '</span></button></li>';
    }).join('');
    var ng = s.ng[x.id] || [];
    var nego = [['Customer expects', t.expects, t.src + ' · 3 days ago', 'amber']].concat(ng, [['Our offer', x.off, x.st >= 3 ? 'Sent · valid 3 days' : 'Draft · not sent', 'acc']]).map(function (n) {
      return '<li class="tzng"><span class="tzng__dot tzdot--' + n[3] + '" aria-hidden="true"></span><span class="tzng__b"><span class="tzng__t">' + n[0] + '</span><span class="tzng__w">' + n[2] + '</span></span><span class="tzng__v tzv--' + n[3] + '">' + fmt(n[1]) + '</span></li>';
    }).join('');
    var ext = x.issues.some(function (i) { return i[0] === 'ext'; });
    var hist = [['Owners', t.mi > 40000 ? '2' : '1', ''], ['Accidents', ext ? 'Minor · 2022' : 'None reported', ext ? 'amber' : 'ok'], ['Service records', t.mi > 60000 ? '6 · gaps after 2021' : '9 · dealer serviced', ''],
      ['Title', 'Clean', 'ok'], ['Payoff', t.payoff ? fmt(t.payoff) + ' · ' + t.lender : 'Owned outright', t.payoff ? 'amber' : 'ok']].map(function (h) {
      return '<li class="tzhi"><span class="tzhi__k">' + h[0] + '</span><span class="tzhi__v' + (h[2] ? ' tzv--' + h[2] : '') + '">' + e(h[1]) + '</span></li>';
    }).join('');
    var grade = x.recon <= 800 ? 'A' : x.recon <= 2000 ? 'B' : x.recon <= 3500 ? 'C' : 'D', n = x.issues.length, issuesT = n + (n === 1 ? ' issue' : ' issues');
    var photos = x.issues.map(function (i) {
      var p = (D.photos[t.kind] || {})[i[0]];
      return '<li class="tzph">' + (p ? img(p, 'tzph__img') : '') + '<span class="tzph__l">' + e(i[2]) + '</span><span class="tzph__c">' + fmt(i[3]) + '</span></li>';
    }).join('');
    var ready = Math.max.apply(null, [1].concat(x.issues.map(function (i) { return D.vendors[i[0]][1]; }))) + 1;
    var recon = x.issues.map(function (i) { return [i[1], D.vendors[i[0]][0] + ' · ' + i[2], D.vendors[i[0]][1], i[3]]; }).concat([['Detailing & photos', 'In-house · 30 photos for listing', 1, 400]]).map(function (r) {
      return '<li class="tzrc"><span class="tzrc__b"><span class="tzrc__t">' + e(r[0]) + '</span><span class="tzrc__v">' + e(r[1]) + '</span></span><span class="tzrc__eta">' + r[2] + (r[2] === 1 ? ' day' : ' days') + '</span><span class="tzrc__c">' + fmt(r[3]) + '</span></li>';
    }).join('');
    var listAt = Math.round(t.retail * 1.02 / 100) * 100, hold = t.days * 45, net = listAt * 0.98 - x.off - x.recon - 850 - hold;
    var resale = [['List at', fmt(listAt), ''], ['Days to sell', '~' + t.days, ''], ['Holding cost', fmt(hold), 'mute'], ['Net on resale', fmt(net), net > 0 ? 'net' : 'neg']].map(function (r) {
      return '<li class="tzrs' + (r[2] === 'net' || r[2] === 'neg' ? ' tzrs--' + r[2] : '') + '"><span class="tzrs__k">' + r[0] + '</span><span class="tzrs__v' + (r[2] === 'mute' ? ' tzv--mute' : '') + '">' + r[1] + '</span></li>';
    }).join('');
    var insp = IN.map(function (i) {
      var bad = x.issues.some(function (j) { return j[0] === i[0]; });
      return '<li class="tzin' + (bad ? ' is-bad' : '') + '"><span class="tzin__dot" aria-hidden="true"></span><span class="tzin__b"><span class="tzin__t">' + e(i[1]) + '</span><span class="tzin__n">' + e(bad ? i[2] : 'No issues found') + '</span></span>' +
        '<span class="tzin__c">' + (bad ? fmt(i[3]) : '—') + '</span><span class="tzin__sw" role="group" aria-label="' + e(i[1]) + '"><button class="tzin__ok js-tz"' + act('ok', i[0]) + ' type="button" aria-pressed="' + !bad + '">OK</button>' +
        '<button class="tzin__is js-tz"' + act('issue', i[0]) + ' type="button" aria-pressed="' + bad + '">Issue</button></span></li>';
    }).join('');
    var bids = [['Avava Instant Buy', 'Guaranteed · 24 h', Math.round(x.wholesale * 1.03 / 100) * 100], ['Manheim', 'Est. after fees', x.wholesale], ['ACV Auctions', '3 bids', Math.round(x.wholesale * 0.97 / 100) * 100]].map(function (b) {
      return '<li class="tzbid"><span class="tzbid__t">' + b[0] + '</span><span class="tzbid__d">' + b[1] + '</span><span class="tzbid__v' + (b[2] > x.off ? ' tzv--acc' : '') + '">' + fmt(b[2]) + '</span></li>';
    }).join('');
    var A = [];
    if (x.st === 0) {
      A.push(['Book inspection', 'book', 'acc'], ['Send instant offer', 'instant', 'line']);
    }
    if (x.st === 1) {
      A.push(['Mark inspected', 'inspected', 'acc']);
    }
    if (x.st === 2) {
      A.push(['Send offer · valid 3 days', 'send', 'acc']);
    }
    if (x.st === 3) {
      A.push(['Customer accepted', 'accepted', 'ok'], ['Revise offer', 'revise', 'line']);
    }
    if (x.st === 4) {
      A.push(['Move to stock', 'stock', 'ink']);
    }
    if (x.st === 5) {
      A.push(['Reopen', 'reopen', 'line']);
    }
    var acts = A.map(function (a) { return '<button class="tzact tzact--' + a[2] + ' js-tz"' + act(a[1]) + ' type="button">' + a[0] + '</button>'; }).join('') +
      (x.st === 6 ? '<a class="tzact tzact--ink" href="dealer-inventory.html">Open in Inventory</a>' : '') + (x.st <= 3 ? '<button class="tzact tzact--line js-tz"' + act('decline') + ' type="button">Decline</button>' : '');
    var w = Math.round(winP(x.off) * 100);
    html += '<div class="tzdesk"><section class="tzl" aria-labelledby="tz-car"><p class="tzl__hd"><span class="tzpill tzs--' + x.st + '">' + ST[x.st] + '</span><span class="tzl__id">' + x.id + ' · ' + t.src + '</span>' +
      '<span class="tzl__e tzqc__e--' + eTone(x) + '">' + e(t.exp) + '</span></p><div class="tzcar">' + img(t.ph, 'tzcar__img') + '<div class="tzcar__b"><h2 class="tzcar__n" id="tz-car">' + e(t.car) + '</h2>' +
      '<p class="tzcar__c">' + e(t.cust) + ' · ' + e(t.link) + '</p><p class="tzcar__m">' + t.mi.toLocaleString('en-US') + ' mi · VIN ' + t.vin + '</p></div></div>' +
      '<div class="tzcalc"><p class="tzcalc__h"><span class="tzk__k">Offer calculator</span><span class="tzcalc__s">Retail minus costs and margin</span></p><ul class="tzlines">' + lines + '</ul>' +
      '<p class="tzmg"><span class="tzmg__t">Target margin</span><button class="tzmg__b js-tz"' + act('mg', -1) + ' type="button" aria-label="Lower margin">−</button><span class="tzmg__v">' + x.m + '%</span><button class="tzmg__b js-tz"' + act('mg', 1) + ' type="button" aria-label="Raise margin">+</button></p>' +
      '<p class="tzoff"><button class="tzoff__b js-tz"' + act('step', -250) + ' type="button" aria-label="Lower offer by $250">−</button><span class="tzoff__c"><span class="tzoff__k">Your offer</span><span class="tzoff__v">' + fmt(x.off) + '</span></span>' +
      '<button class="tzoff__b js-tz"' + act('step', 250) + ' type="button" aria-label="Raise offer by $250">+</button></p>' +
      '<span class="tzrange" aria-hidden="true"><span class="tzrange__m tzrange__m--w" data-l="' + pct(x.wholesale) + '"></span><span class="tzrange__m tzrange__m--e" data-l="' + pct(t.expects) + '"></span>' +
      '<span class="tzrange__m tzrange__m--x" data-l="' + pct(x.max) + '"></span><span class="tzrange__k" data-l="' + pct(x.off) + '"></span></span>' +
      '<p class="tzlg"><span class="tzlg__i tzlg__i--w">Wholesale ' + fmt(x.wholesale) + '</span><span class="tzlg__i tzlg__i--e">Customer expects ' + fmt(t.expects) + '</span><span class="tzlg__i tzlg__i--x">Max offer ' + fmt(x.max) + '</span></p>' +
      '<ul class="tztiles">' + tiles + '</ul></div>' +
      '<div class="tzst"><p class="tzcalc__h"><span class="tzk__k">Offer strategy</span><span class="tzcalc__s">Win chance from 1,200 similar appraisals</span></p><ul class="tzstrs">' + strat + '</ul></div>' +
      '<div class="tzbox"><p class="tzcalc__h"><span class="tzk__k">Negotiation</span><span class="tzcalc__s">' + (ng.length + 2) + ' events</span></p><ul class="tzngs">' + nego + '</ul>' +
      '<p class="tzngb"><button class="tzbtn js-tz"' + act('half') + ' type="button">Meet halfway</button><button class="tzbtn js-tz"' + act('counter') + ' type="button">Log customer counter</button><button class="tzbtn js-tz"' + act('match') + ' type="button">Match customer</button></p></div>' +
      '<div class="tzbox"><p class="tzk__k">History &amp; payoff</p><ul class="tzhis">' + hist + '</ul><p class="tzeq tzeq--' + (eq >= 0 ? 'ok' : 'neg') + '"><span>Customer equity at this offer</span><span class="tzeq__v">' + fmt(eq) + '</span></p></div></section>' +
      '<div class="tzr"><section class="tzcard" aria-labelledby="tz-grade"><div class="tzgr"><div class="tzgr__lt"><span class="tzgr__l tzgr__l--' + grade + '" aria-hidden="true">' + grade + '</span><div class="tzgr__b"><h2 class="tzcard__t" id="tz-grade">Condition grade</h2>' +
      '<span class="tzcalc__s">Recon ' + fmt(x.recon) + ' · ' + issuesT + '</span></div></div><span class="tzcalc__s">' + n + ' tagged · tap to add</span></div>' +
      (n ? '<ul class="tzphs">' + photos + '</ul>' : '<p class="tznone">No defects recorded</p>') + '</section>' +
      '<section class="tzcard" aria-labelledby="tz-plan"><div class="tzcard__h"><h2 class="tzcard__t" id="tz-plan">Recon &amp; resale plan</h2><span class="tzready">Frontline-ready in ' + ready + ' days</span></div><ul class="tzrcs">' + recon + '</ul><ul class="tzrss">' + resale + '</ul></section>' +
      '<div class="tzcard"><div class="tzbox tzbox--list"><p class="tzcalc__h"><span class="tzk__k">Inspection</span><span class="tzcalc__n tzv--' + (n ? 'acc' : 'ok') + '">Recon ' + fmt(x.recon) + ' · ' + issuesT + '</span></p><ul class="tzins">' + insp + '</ul></div>' +
      '<div class="tzbox tzbox--list"><p class="tzcalc__h"><span class="tzk__k">Wholesale bids</span><span class="tzcalc__s">Updated 2 h ago</span></p><ul class="tzbids">' + bids + '</ul></div></div></div></div>' +
      '<div class="tzbar2"><p class="tzbar2__b"><span class="tzbar2__k">' + e(t.car) + ' · ' + e(t.cust) + '</span><span class="tzbar2__v">Offer ' + fmt(x.off) + ' · gross ' + fmt(gross) + '</span></p>' +
      '<p class="tzwin"><span class="tzbar2__k">Win probability <span class="tzwin__v">' + w + '%</span></span><span class="tzwin__bar" aria-hidden="true"><span class="tzwin__f tzwin__f--' + wTone(x.off) + '" data-w="' + w + '"></span></span></p><span class="tzbar2__sp"></span>' +
      '<span class="tzch" role="group" aria-label="Send by">' + ['SMS', 'Email', 'Both'].map(function (c) { return '<button class="tzch__b js-tz"' + act('ch', c) + ' type="button" aria-pressed="' + (s.ch === c) + '">' + c + '</button>'; }).join('') + '</span>' + acts + '</div>' +
      (s.nt[x.id] ? '<p class="tznote">' + e(s.nt[x.id]) + '</p>' : '');
    return html;
  }
  /* tz-render:end */
  function initTradeIns() {
    var box = $('.js-tzroot');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-tz')), s = tzInit(D);
    var r250 = function (v) { return Math.floor(v / 250) * 250; };
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    function apply(prev) {
      $$('[data-l]', box).forEach(function (el, i) {
        var to = el.getAttribute('data-l') + '%';
        if (prev && prev[i] && prev[i] !== to) {
          el.style.left = prev[i];
          el.getBoundingClientRect();
        }
        el.style.left = to;
      });
      $$('[data-w]', box).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
    }
    // current derived numbers of one trade-in (the same rules as tzHtml)
    function cur(id) {
      var t = D.trades.filter(function (x) { return x.id === id; })[0], m = s.mg[id] === undefined ? 8 : s.mg[id];
      var issues = D.insp.filter(function (x) { var v = (s.is[id] || {})[x[0]]; return v === undefined ? t.iss.indexOf(x[0]) > -1 : v; });
      var recon = 400 + issues.reduce(function (a, x) { return a + x[3]; }, 0), max = t.retail - recon - 850 - t.retail * m / 100;
      return { t: t, m: m, recon: recon, st: s.so[id] === undefined ? t.st : s.so[id], off: s.of[id] === undefined ? r250(max - 500) : s.of[id] };
    }
    function paint() {
      var prev = $$('[data-l]', box).map(function (el) { return el.style.left; });
      box.innerHTML = tzHtml(s, D);
      apply(prev);
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.js-tz');
      if (!b) {
        return;
      }
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), id = s.sel, c = cur(id), t = c.t;
      var setSt = function (st, note) { s.so[id] = st; s.nt[id] = note || ''; };
      if (a === 'sel') {
        s.sel = v;
      } else if (a === 'add') {
        s.ad = true;
      } else if (a === 'cal') {
        s.ca = !s.ca;
      } else if (a === 'mg') {
        s.mg[id] = Math.max(2, Math.min(20, c.m + +v));
      } else if (a === 'step') {
        s.of[id] = c.off + +v;
      } else if (a === 'offer') {
        s.of[id] = +v;
      } else if (a === 'half') {
        var h = r250((c.off + t.expects) / 2);
        s.of[id] = h;
        s.ng[id] = (s.ng[id] || []).concat([['We moved to halfway', h, 'Just now', 'blue']]);
      } else if (a === 'counter') {
        s.ng[id] = (s.ng[id] || []).concat([['Customer countered', r250(t.expects - (t.expects - c.off) / 3), 'Phone · just now', 'amber']]);
      } else if (a === 'match') {
        s.of[id] = t.expects;
      } else if (a === 'ok' || a === 'issue') {
        s.is[id] = s.is[id] || {};
        s.is[id][v] = a === 'issue';
      } else if (a === 'ch') {
        s.ch = v;
      } else if (a === 'book') {
        setSt(1, 'Inspection booked for Thu 9 Oct · 10:30 · confirmation sent to ' + t.cust);
      } else if (a === 'instant') {
        setSt(3, 'Instant offer of ' + fmt(c.off) + ' sent by ' + s.ch.replace('Both', 'SMS and email') + ' · valid 3 days');
      } else if (a === 'inspected' || a === 'revise' || a === 'reopen' || a === 'decline') {
        setSt({ inspected: 2, revise: 2, reopen: 2, decline: 5 }[a]);
      } else if (a === 'send') {
        setSt(3, 'Offer of ' + fmt(c.off) + ' sent to ' + t.cust + ' by ' + s.ch.replace('Both', 'SMS and email') + ' · expires Fri 10 Oct');
      } else if (a === 'accepted') {
        setSt(4, t.cust + ' accepted ' + fmt(c.off) + (t.link.indexOf('Deal') === 0 ? ' · applied to ' + t.link.split(' · ')[0] : ''));
      } else if (a === 'stock') {
        setSt(6, 'Draft listing created in Add listing · recon order for ' + fmt(c.recon) + ' sent to service');
      }
      paint();
    });
    apply();
  }

  /* Dealer finance applications (build_dealer_finance.py). One pure view function: the builder runs fzInit + fzHtml (between
     the fz-render markers) in Node for the first markup, initFinanceApps re-renders on every change. */
  /* fz-render:start */
  function fzInit(D) {
    return { sel: D.sel, so: {}, dw: {}, tm: {}, lp: {}, fp: {}, dc: {}, tg: {}, pl: {}, nt: {}, ad: false, rs: false };
  }
  function fzModel(s, D) {
    var pmt = function (amt, apr, n) { var r = apr / 1200; return r ? amt * r / (1 - Math.pow(1 + r, -n)) : amt / n; };
    var tierOf = function (sc) { return !sc ? ['—', 'mute', -1] : sc >= 760 ? ['A', 'ok', 0] : sc >= 700 ? ['B', 'blue', 1] : sc >= 640 ? ['C', 'amber', 2] : ['D', 'acc', 3]; };
    var apps = D.apps.map(function (f) {
      var st = s.so[f.id] === undefined ? f.st : s.so[f.id], score = s.pl[f.id] ? 758 : f.score, down = s.dw[f.id] === undefined ? f.down : s.dw[f.id];
      var term = s.tm[f.id] || 60, fni = D.fni.map(function (_, j) { var v = (s.fp[f.id] || {})[j]; return v === undefined ? !!f.fni[j] : v; });
      var fniSum = D.fni.reduce(function (a, p, j) { return a + (fni[j] ? p[1] : 0); }, 0), tax = Math.round(f.price * 0.095), amt = f.price + tax + 85 + fniSum - down - f.trade;
      var tier = tierOf(score), docs = D.docs.map(function (_, j) { var v = (s.dc[f.id] || {})[j]; return v === undefined ? f.docs[j] : v; });
      var nRep = st === 0 || st === 1 ? 0 : st === 2 ? 1 : st === 3 ? 2 : 4;
      var lenders = D.lenders.map(function (l, j) {
        var base = tier[2] < 0 ? null : l[1][tier[2]], rep = nRep === 4 || (nRep >= 1 && j === 0) || (nRep === 2 && j === 2);
        var state = st === 0 ? 'Not sent' : !rep ? 'Pending' : base === null ? 'Declined' : amt > l[2] ? 'Over limit' : (st === 5 && j === 1) ? 'Conditional · proof of income' : 'Approved';
        var apr = base === null ? null : base + (term === 72 ? 0.25 : 0) - (down / f.price >= 0.2 ? 0.15 : 0);
        return { n: l[0], apr: apr, max: l[2], cond: l[3], res: l[4], state: state, ok: state === 'Approved' || state.indexOf('Conditional') === 0 };
      });
      var best = -1;
      lenders.forEach(function (l, j) { if (l.ok && (best < 0 || l.apr < lenders[best].apr)) { best = j; } });
      return { f: f, id: f.id, st: st, score: score, down: down, term: term, fni: fni, fniSum: fniSum, tax: tax, amt: amt, tier: tier, docs: docs, nRep: nRep, lenders: lenders, best: best,
        pick: s.lp[f.id] === undefined ? best : s.lp[f.id] };
    });
    return { apps: apps, pmt: pmt };
  }
  function fzHtml(s, D) {
    var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var fmt = function (n) { return (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US'); };
    var kf = function (n) { return '$' + Math.round(n / 1000) + 'k'; };
    var act = function (a, v) { return ' data-a="' + a + '"' + (v === undefined ? '' : ' data-v="' + e(v) + '"'); };
    var av = function (f, cls) { return '<img class="' + cls + '" src="assets/img/' + f.img + '" alt="" width="' + f.iw + '" height="' + f.iw + '" decoding="async">'; };
    var ST = ['Draft', 'Submitted', 'Docs needed', 'Under review', 'Approved', 'Conditional', 'Funded', 'Declined'];
    var SLA = [['Started 20 min ago', 'mute'], ['Lenders have 4 h · 3 h left', 'amber'], ['Waiting on customer · 1 d', 'acc'], ['2 of 4 lenders replied', 'amber'],
      ['Approval valid 5 more days', 'ok'], ['Condition due tomorrow', 'purple'], ['Funded 3 Oct', 'mute'], ['Closed', 'mute']];
    var M = fzModel(s, D), apps = M.apps, pmt = M.pmt;
    var open = apps.filter(function (x) { return x.st < 6; });
    var kpi = [['Open applications', open.length, '▲ 2 today', 'ok'], ['Waiting on documents', apps.filter(function (x) { return x.st === 2; }).length, '', 'acc'], ['Approval rate · Oct', '86%', '▲ 4 pts', 'ok'], ['Avg. F&I per car', '$2,180', '▲ $240', 'ok']];
    var html = '<div class="fzkpis">' + kpi.map(function (k) {
      return '<p class="fzk"><span class="fzk__k">' + e(k[0]) + '</span><span class="fzk__r"><span class="fzk__v">' + k[1] + '</span><span class="fzk__d fzv--' + k[3] + '">' + k[2] + '</span></span></p>';
    }).join('') + '<p class="fzkx"><button class="fzkx__add js-fz"' + act('add') + ' type="button">' + (s.ad ? '✓ Application started' : '+ New application') + '</button>' +
      '<button class="fzkx__rate js-fz"' + act('rate') + ' type="button" aria-pressed="' + s.rs + '">' + (s.rs ? '✓ Rate sheet · updated today' : 'Lender rate sheet') + '</button></p></div>';
    html += '<ul class="fzpick">' + apps.map(function (x) {
      var on = x.id === s.sel;
      return '<li><button class="fzchip' + (on ? ' is-sel' : '') + ' js-fz"' + act('sel', x.id) + ' type="button" aria-pressed="' + on + '">' + av(x.f, 'fzchip__av') + '<span class="fzchip__b"><span class="fzchip__n">' + e(x.f.cust) + '</span><span class="fzchip__s fzs--' + x.st + '">' + ST[x.st] + '</span></span></button></li>';
    }).join('') + '</ul>';
    var x = apps.filter(function (a) { return a.id === s.sel; })[0];
    if (!x) {
      return html;
    }
    var f = x.f, L = x.pick >= 0 ? x.lenders[x.pick] : null, apr = L && L.apr !== null ? L.apr : (x.tier[2] >= 0 ? D.lenders[0][1][x.tier[2]] : 7.9), mo = pmt(x.amt, apr, x.term);
    var moInc = f.income / 12, dtiAfter = f.income ? (f.dti * moInc + mo) / moInc : 0, nDoc = x.docs.filter(function (v) { return v === 1; }).length;
    var client = [['Credit score', x.score ? x.score : '—', x.score ? 'Tier ' + x.tier[0] : '', x.score ? 'Soft pull · Experian · today' : 'Run a soft pull — no score impact', x.tier[1], x.score ? Math.min(100, (x.score - 300) / 550 * 100) : 0],
      ['Income', f.income ? kf(f.income) + '/yr' : '—', '', f.job, 'ink', f.income ? Math.min(100, f.income / 3500) : 0],
      ['Debt-to-income', f.income ? Math.round(dtiAfter * 100) + '%' : '—', f.income ? 'with this loan' : '', f.income ? 'Now ' + Math.round(f.dti * 100) + '% · lenders cap at 45%' : 'Needs income', dtiAfter > 0.45 ? 'acc' : dtiAfter > 0.36 ? 'amber' : 'ok', Math.min(100, dtiAfter / 0.5 * 100)],
      ['Loan-to-value', Math.round(x.amt / f.price * 100) + '%', '', 'Amount financed vs. price', x.amt / f.price > 1.1 ? 'acc' : x.amt / f.price > 0.9 ? 'amber' : 'ok', Math.min(100, x.amt / f.price / 1.3 * 100)]].map(function (c) {
      return '<li class="fzcl fzcl--' + c[4] + '"><span class="fzcl__k">' + c[0] + '</span><span class="fzcl__r"><span class="fzcl__v">' + c[1] + '</span><span class="fzcl__t">' + c[2] + '</span></span>' +
        '<span class="fzcl__s">' + e(c[3]) + '</span><span class="fzcl__bar" aria-hidden="true"><span class="fzcl__f" data-w="' + c[5].toFixed(1) + '"></span></span></li>';
    }).join('');
    var lines = [['Vehicle price', fmt(f.price), ''], ['Tax & doc fee', fmt(x.tax + 85), 'mute'], ['F&I products', fmt(x.fniSum), ''], ['Down payment', fmt(-x.down), 'ok'], ['Trade-in equity', fmt(-f.trade), 'ok'], ['Amount financed', fmt(x.amt), 'tot']].map(function (l) {
      return '<li class="fzln' + (l[2] ? ' fzln--' + l[2] : '') + '"><span>' + e(l[0]) + '</span><span class="fzln__v">' + l[1] + '</span></li>';
    }).join('');
    var terms = [36, 48, 60, 72].map(function (n) {
      return '<button class="fzterm js-fz"' + act('term', n) + ' type="button" aria-pressed="' + (n === x.term) + '"><span class="fzterm__n">' + n + '</span><span class="fzterm__u">mo</span></button>';
    }).join('');
    var tg = s.tg[f.id] === undefined ? f.target : s.tg[f.id], fit = mo <= tg, fac = pmt(1, apr, x.term), extra = Math.max(0, Math.ceil((x.amt - tg / fac) / 500) * 500);
    var fixes = fit ? '<span class="fzfix is-ok">✓ Fits — present this structure</span>' : '<button class="fzfix js-fz"' + act('down', extra) + ' type="button">Add ' + fmt(extra) + ' down</button>' +
      (x.term < 72 ? '<button class="fzfix js-fz"' + act('term', 72) + ' type="button">Stretch to 72 mo · ' + fmt(pmt(x.amt, apr, 72)) + '</button>' : '') +
      (x.fniSum ? '<button class="fzfix js-fz"' + act('nofni') + ' type="button">Remove F&amp;I · −' + fmt(pmt(x.fniSum, apr, x.term)) + '/mo</button>' : '');
    var TR = [48, 60, 72], DR = [Math.max(0, x.down - 5000), x.down, x.down + 5000];
    var grid = '<p class="fzgrid fzgrid--h"><span></span>' + TR.map(function (n) { return '<span>' + n + ' mo</span>'; }).join('') + '</p>' + DR.map(function (dv) {
      return '<p class="fzgrid"><span class="fzgrid__l">' + fmt(dv) + ' down</span>' + TR.map(function (n) {
        var m = pmt(x.amt + x.down - dv, apr, n), on = dv === x.down && n === x.term;
        return '<button class="fzcell' + (on ? ' is-on' : m <= tg ? ' is-ok' : '') + ' js-fz"' + act('cell', dv + ':' + n) + ' type="button" aria-pressed="' + on + '">' + fmt(m) + '</button>';
      }).join('') + '</p>';
    }).join('');
    var PK = [['Essential', [false, true, false, false]], ['Gold', [true, true, false, false]], ['Platinum', [true, true, true, true]]];
    var pkgs = PK.map(function (p, i) {
      var on = p[1].every(function (v, j) { return v === x.fni[j]; }), price = D.fni.reduce(function (a, q, j) { return a + (p[1][j] ? q[1] : 0); }, 0), prof = D.fni.reduce(function (a, q, j) { return a + (p[1][j] ? q[2] : 0); }, 0);
      return '<li><button class="fzpkg js-fz"' + act('pkg', i) + ' type="button" aria-pressed="' + on + '"><span class="fzpkg__h"><span class="fzpkg__t">' + p[0] + '</span><span class="fzpkg__m">+' + fmt(pmt(price, apr, x.term)) + '/mo</span></span>' +
        '<span class="fzpkg__i">' + e(D.fni.filter(function (_, j) { return p[1][j]; }).map(function (q) { return q[0].split(' · ')[0]; }).join(' · ')) + '</span><span class="fzpkg__p">Dealer profit ' + fmt(prof) + '</span></button></li>';
    }).join('');
    var prods = D.fni.map(function (p, j) {
      var on = x.fni[j];
      return '<li><button class="fzprod js-fz"' + act('fni', j) + ' type="button" aria-pressed="' + on + '"><span class="fzprod__h"><span class="fzprod__t">' + e(p[0]) + '</span><span class="fzprod__m">' + (on ? '✓ ' : '+') + fmt(pmt(p[1], apr, x.term)) + '/mo</span></span>' +
        '<span class="fzprod__p">' + fmt(p[1]) + ' · dealer profit ' + fmt(p[2]) + '</span></button></li>';
    }).join('');
    var fniProfit = D.fni.reduce(function (a, p, j) { return a + (x.fni[j] ? p[2] : 0); }, 0), reserve = L ? x.amt * L.res / 100 : 0;
    var baseOdds = [92, 84, 68, 45][Math.max(0, x.tier[2])] - (dtiAfter > 0.4 ? 15 : 0), OFF = [3, -6, 2, -3];
    var lenders = x.lenders.map(function (l, j) {
      var on = j === x.pick, m = l.apr !== null ? pmt(x.amt, l.apr, x.term) : 0;
      var o = l.state === 'Approved' ? 100 : l.state.indexOf('Cond') === 0 ? 80 : l.state === 'Declined' || l.state === 'Over limit' ? 0 : x.tier[2] < 0 ? 0 : Math.max(5, Math.min(97, baseOdds + OFF[j]));
      var tone = l.state === 'Approved' ? 'ok' : l.state.indexOf('Cond') === 0 ? 'purple' : l.state === 'Pending' ? 'amber' : 'mute', ot = o >= 75 ? 'ok' : o >= 50 ? 'amber' : 'acc';
      return '<li class="fzlen' + (on ? ' is-sel' : '') + '"><p class="fzlen__h"><span class="fzlen__n">' + l.n + '</span>' + (j === x.best ? '<span class="fzbest">Best rate</span>' : '') + '</p>' +
        '<span class="fzpill fzpill--' + tone + '">' + l.state + '</span><p class="fzodds"><span class="fzodds__h"><span class="fzodds__k">Approval odds</span><span class="fzv--' + ot + '">' + (l.state === 'Approved' ? 'Approved' : x.tier[2] < 0 ? 'Needs credit pull' : o + '%') + '</span></span>' +
        '<span class="fzodds__bar" aria-hidden="true"><span class="fzodds__f fzodds__f--' + ot + '" data-w="' + o + '"></span></span></p>' +
        '<p class="fzapr"><span class="fzodds__k">APR</span><span class="fzapr__v">' + (l.ok ? l.apr.toFixed(2) + '%' : '—') + '</span></p>' +
        '<ul class="fzlen__t"><li><span>Monthly</span><span>' + (l.ok ? fmt(m) + '/mo' : '—') + '</span></li><li><span>Total interest</span><span>' + (l.ok ? fmt(m * x.term - x.amt) : '—') + '</span></li>' +
        '<li><span>Max amount</span><span>' + kf(l.max) + '</span></li><li><span>Dealer reserve</span><span class="fzv--ok">' + (l.ok ? fmt(x.amt * l.res / 100) : '—') + '</span></li></ul>' +
        '<p class="fzlen__c">' + e(l.cond) + '</p>' + (l.ok ? '<button class="fzlen__go js-fz"' + act('lender', j) + ' type="button" aria-pressed="' + on + '">' + (on ? '✓ Selected' : 'Select') + '</button>' : '') + '</li>';
    }).join('');
    var docs = D.docs.map(function (t, j) {
      var v = x.docs[j], tn = v === 1 ? 'ok' : v === 2 ? 'amber' : 'acc';
      return '<li class="fzdoc fzdoc--' + tn + '"><span class="fzdoc__dot" aria-hidden="true"></span><span class="fzdoc__t">' + e(t) + '</span><span class="fzdoc__s">' + (v === 1 ? 'Received' : v === 2 ? 'Requested' : 'Missing') + '</span>' +
        (v === 1 ? '' : '<button class="fzdoc__b js-fz"' + act('doc', j) + ' type="button">' + (v === 2 ? 'Mark received' : 'Request') + '</button>') + '</li>';
    }).join('');
    var tl = [['9:12', 'Application started · ' + f.deal, 'mute'], ['9:14', x.score ? 'Soft pull · ' + x.score + ' · Tier ' + x.tier[0] : 'Waiting for credit pull', x.score ? 'blue' : 'mute']];
    if (x.st >= 1) { tl.push(['9:20', 'Sent to 4 lenders', 'blue']); }
    if (x.st >= 2) { tl.push(['10:05', 'Avava Finance approved', 'ok']); }
    if (x.st === 2) { tl.push(['10:06', 'Missing proof of income & residence', 'acc']); }
    if (x.st >= 3) { tl.push(['11:40', 'Capital One approved', 'ok']); }
    if (x.st >= 4) { tl.push(['12:15', 'Offer accepted', 'ok']); }
    if (x.st === 6) { tl.push(['3 Oct', 'Funded', 'ink']); }
    if (s.nt[f.id]) { tl.push(['Now', s.nt[f.id], 'acc']); }
    var A = [];
    if (x.st === 0) { A.push(x.score ? ['Submit to all lenders', 'submit', 'acc'] : ['Run soft credit pull', 'pull', 'acc']); }
    if (x.st === 1) { A.push(['Nudge lenders', 'nudge', 'acc']); }
    if (x.st === 2) { A.push(nDoc === 4 ? ['Send to underwriting', 'uw', 'acc'] : ['Request missing docs', 'reqdocs', 'acc']); }
    if (x.st === 3 && L) { A.push(['Accept ' + L.n.split(' ')[0] + ' · ' + L.apr.toFixed(2) + '%', 'accept', 'ok']); }
    if (x.st === 5) { A.push(['Upload proof of income', 'proof', 'acc']); }
    if (x.st === 4) { A.push(['Send for e-sign', 'esign', 'acc'], ['Mark funded', 'funded', 'ink']); }
    if (x.st === 6) { A.push(['View contract', 'contract', 'line']); }
    if (x.st === 7) { A.push(['Reopen', 'reopen', 'line']); }
    if (x.st < 6) { A.push(['Decline', 'decline', 'mute']); }
    html += '<div class="fzgridm"><section class="fzl" aria-labelledby="fz-cust"><p class="fzl__hd"><span class="fzpill fzs--' + x.st + '">' + ST[x.st] + '</span><span class="fzl__id">' + f.id + ' · ' + f.deal + '</span>' +
      '<span class="fzl__sla fzv--' + SLA[x.st][1] + '">' + SLA[x.st][0] + '</span></p><div class="fzcu">' + av(f, 'fzcu__av') + '<div class="fzcu__b"><h2 class="fzcu__n" id="fz-cust">' + e(f.cust) + '</h2><p class="fzcu__s">' + e(f.car) + ' · loan ' + fmt(x.amt) + '</p></div></div>' +
      '<ul class="fzcls">' + client + '</ul>' +
      '<div class="fzbox fzbox--big"><p class="fzbox__h"><span class="fzk__k">Deal structure</span><span class="fzbox__s">Tax 9.5% · doc fee $85</span></p><ul class="fzlines">' + lines + '</ul>' +
      '<div class="fzctl"><div class="fzdown"><p class="fzdown__b"><span class="fzbox__s">Down payment</span><span class="fzdown__v">' + fmt(x.down) + ' · ' + Math.round(x.down / f.price * 100) + '%</span></p>' +
      '<button class="fzstep js-fz"' + act('dstep', -1000) + ' type="button" aria-label="Lower down payment">−</button><button class="fzstep js-fz"' + act('dstep', 1000) + ' type="button" aria-label="Raise down payment">+</button></div>' +
      '<div class="fzterms" role="group" aria-label="Term">' + terms + '</div></div>' +
      '<div class="fzmo"><p class="fzmo__b"><span class="fzbox__s">Monthly payment</span><span class="fzmo__v">' + fmt(mo) + '</span></p><p class="fzmo__r"><span class="fzmo__apr">' + apr.toFixed(2) + '% APR · ' + x.term + ' mo</span>' +
      '<span class="fzbox__s">' + (L ? L.n + (L.state === 'Approved' ? ' · approved' : ' · ' + L.state.toLowerCase()) : 'Estimate · no decisions yet') + '</span></p></div></div>' +
      '<div class="fzbox"><p class="fzbox__h"><span class="fzk__k">Payment target</span><span class="fzbox__s fzv--' + (fit ? 'ok' : 'acc') + '">' + (fit ? '✓ ' + fmt(tg - mo) + ' under target' : fmt(mo - tg) + ' over target') + '</span></p>' +
      '<div class="fztg"><p class="fztg__b"><span class="fzbox__s">Customer wants</span><span class="fztg__v">' + fmt(tg) + '/mo</span></p><button class="fzstep js-fz"' + act('tg', -100) + ' type="button" aria-label="Lower target">−</button>' +
      '<button class="fzstep js-fz"' + act('tg', 100) + ' type="button" aria-label="Raise target">+</button></div><span class="fztgbar" aria-hidden="true"><span class="fztgbar__f fztgbar__f--' + (fit ? 'ok' : 'acc') + '" data-w="' + Math.min(100, mo / (tg * 1.25) * 100).toFixed(1) + '"></span><span class="fztgbar__m"></span></span>' +
      '<p class="fzfixes">' + fixes + '</p><p class="fzbox__s fzgrid__k">Payment grid · down payment × term</p>' + grid + '</div>' +
      '<div class="fzbox"><p class="fzbox__h"><span class="fzk__k">F&amp;I menu</span><span class="fzbox__s fzv--ok">F&amp;I income ' + fmt(fniProfit + reserve) + '</span></p><ul class="fzpkgs">' + pkgs + '</ul>' +
      '<p class="fzbox__s">Present packages first · fine-tune individual products below</p></div>' +
      '<div class="fzbox"><p class="fzbox__h"><span class="fzk__k">F&amp;I products</span><span class="fzbox__s fzv--ok">F&amp;I income ' + fmt(fniProfit + reserve) + '</span></p><ul class="fzprods">' + prods + '</ul></div></section>' +
      '<div class="fzr"><p class="fzr__h"><span class="fzr__t">Lender decisions</span><span class="fzr__s">' + (x.st === 0 ? 'Not submitted' : x.nRep + ' of 4 lenders replied') + ' · figures at the current structure</span></p><ul class="fzlens">' + lenders + '</ul>' +
      '<div class="fzbot"><div class="fzcard"><div class="fzbox fzbox--list"><p class="fzbox__h"><span class="fzk__k">Documents</span><span class="fzbox__s fzv--' + (nDoc === 4 ? 'ok' : 'amber') + '">' + nDoc + ' of 4 received</span></p><ul class="fzdocs">' + docs + '</ul></div>' +
      '<div class="fzbox fzbox--list"><p class="fzk__k">Timeline</p><ul class="fztl">' + tl.map(function (t) { return '<li class="fztl__i"><span class="fztl__w">' + t[0] + '</span><span class="fztl__dot fztl__dot--' + t[2] + '" aria-hidden="true"></span><span>' + e(t[1]) + '</span></li>'; }).join('') + '</ul></div></div>' +
      '<div class="fzcard"><ul class="fzinc"><li class="fzinc__c fzinc__c--ok"><span class="fzinc__k">F&amp;I income</span><span class="fzinc__v">' + fmt(fniProfit + reserve) + '</span></li><li class="fzinc__c"><span class="fzinc__k">Dealer reserve</span><span class="fzinc__v">' + fmt(reserve) + '</span></li></ul>' +
      (s.nt[f.id] ? '<p class="fznote">' + e(s.nt[f.id]) + '</p>' : '') + '<p class="fzacts">' + A.map(function (a) { return '<button class="fzact fzact--' + a[2] + ' js-fz"' + act(a[1]) + ' type="button">' + e(a[0]) + '</button>'; }).join('') + '</p></div></div></div></div>';
    return html;
  }
  /* fz-render:end */
  function initFinanceApps() {
    var box = $('.js-fzroot');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-fz')), s = fzInit(D);
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    function sizes() {
      $$('[data-w]', box).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
    }
    function paint() {
      box.innerHTML = fzHtml(s, D);
      sizes();
    }
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('.js-fz');
      if (!b) {
        return;
      }
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), id = s.sel;
      var M = fzModel(s, D), x = M.apps.filter(function (q) { return q.id === id; })[0], L = x.pick >= 0 ? x.lenders[x.pick] : null;
      var note = function (t) { s.nt[id] = t; };
      var setSt = function (st) { s.so[id] = st; };
      if (a === 'sel') {
        s.sel = v;
      } else if (a === 'add') {
        s.ad = true;
      } else if (a === 'rate') {
        s.rs = !s.rs;
      } else if (a === 'dstep') {
        s.dw[id] = Math.max(0, x.down + +v);
      } else if (a === 'down') {
        s.dw[id] = x.down + +v;
      } else if (a === 'term') {
        s.tm[id] = +v;
      } else if (a === 'tg') {
        s.tg[id] = (s.tg[id] === undefined ? x.f.target : s.tg[id]) + +v;
      } else if (a === 'cell') {
        s.dw[id] = +v.split(':')[0];
        s.tm[id] = +v.split(':')[1];
      } else if (a === 'nofni') {
        s.fp[id] = { 0: false, 1: false, 2: false, 3: false };
      } else if (a === 'pkg') {
        var sets = [[false, true, false, false], [true, true, false, false], [true, true, true, true]][+v];
        s.fp[id] = { 0: sets[0], 1: sets[1], 2: sets[2], 3: sets[3] };
      } else if (a === 'fni') {
        s.fp[id] = s.fp[id] || {};
        s.fp[id][v] = !x.fni[+v];
      } else if (a === 'lender') {
        s.lp[id] = +v;
      } else if (a === 'doc') {
        s.dc[id] = s.dc[id] || {};
        s.dc[id][v] = x.docs[+v] === 2 ? 1 : 2;
      } else if (a === 'pull') {
        s.pl[id] = true;
        note('Soft pull complete · 758 · Tier B · no impact on customer score');
      } else if (a === 'submit') {
        setSt(1);
        note('Sent to 4 lenders · decisions expected within 4 hours');
      } else if (a === 'nudge') {
        setSt(3);
        note('2 lenders replied after the nudge');
      } else if (a === 'reqdocs') {
        s.dc[id] = {};
        x.docs.forEach(function (d, j) { s.dc[id][j] = d === 1 ? 1 : 2; });
        note('Upload link sent to ' + x.f.cust + ' by SMS');
      } else if (a === 'uw') {
        setSt(3);
        note('Documents forwarded to lenders');
      } else if (a === 'accept') {
        var mo = M.pmt(x.amt, L.apr, x.term);
        setSt(4);
        note(L.n + ' approval accepted · ' + fmt(mo) + '/mo for ' + x.term + ' months');
      } else if (a === 'proof') {
        s.dc[id] = s.dc[id] || {};
        s.dc[id][1] = 1;
        setSt(4);
        note('Condition cleared · Chase approval is final');
      } else if (a === 'esign') {
        note('Retail installment contract sent to ' + x.f.cust + ' for e-signature');
      } else if (a === 'funded') {
        setSt(6);
        note('Funded · ' + fmt(x.amt) + ' received from ' + (L ? L.n : 'lender'));
      } else if (a === 'contract') {
        var link = document.createElement('a');
        link.href = URL.createObjectURL(textPdf(['PACIFIC MOTORS - RETAIL INSTALLMENT CONTRACT', x.f.id + ' - ' + x.f.deal, '', 'Buyer: ' + x.f.cust, 'Vehicle: ' + x.f.car,
          'Amount financed: ' + fmt(x.amt), 'Term: ' + x.term + ' months', 'Lender: ' + (L ? L.n : '-'), '', 'Funded 3 Oct 2026']));
        link.download = x.f.id + '-contract.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      } else if (a === 'reopen') {
        setSt(3);
      } else if (a === 'decline') {
        setSt(7);
      }
      paint();
    });
    sizes();
  }

  /* Dealer messages (build_dealer_messages.py). One pure view function: the builder runs mqInit + mqHtml (between the
     mq-render markers) in Node for the first markup, initDealerMessages re-renders on every change. */
  /* mq-render:start */
  function mqInit(D) {
    var rd = {};
    return { sel: D.sel, rd: rd, sent: {}, dr: {}, md: 'Reply', sg: {}, as: {}, sz: {}, tb: 'All', cf: 'All', q: '', bcs: false, tps: false };
  }
  function mqConvs(s, D) {
    return D.convs.map(function (c) {
      var extra = s.sent[c.id] || [], replied = extra.some(function (m) { return m[0] === 'me'; }), msgs = c.msgs.concat(extra);
      return { c: c, id: c.id, st: s.sg[c.id] === undefined ? c.st : s.sg[c.id], un: s.rd[c.id] ? 0 : c.un, wait: replied ? 0 : c.wait,
        as: s.as[c.id] === undefined ? c.as : s.as[c.id], msgs: msgs, last: msgs[msgs.length - 1], snoozed: !!s.sz[c.id] };
    });
  }
  function mqHtml(s, D) {
    var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var act = function (a, v) { return ' data-a="' + a + '"' + (v === undefined ? '' : ' data-v="' + e(v) + '"'); };
    var img = function (p, cls) { return '<img class="' + cls + '" src="assets/img/' + p[0] + '" alt="" width="' + p[1] + '" height="' + p[2] + '" decoding="async">'; };
    var av = function (c, cls) { return '<img class="' + cls + '" src="assets/img/' + c.img + '" alt="" width="' + c.iw + '" height="' + c.iw + '" decoding="async">'; };
    var STG = ['New', 'Engaged', 'Negotiating', 'Won'];
    var convs = mqConvs(s, D);
    var tabF = { All: function (x) { return !x.snoozed; }, Unassigned: function (x) { return !x.as && !x.snoozed; }, Mine: function (x) { return x.as === 'MR' && !x.snoozed; }, Snoozed: function (x) { return x.snoozed; } };
    var q = s.q.toLowerCase();
    var vis = convs.filter(tabF[s.tb]).filter(function (x) { return s.cf === 'All' || x.c.ch === s.cf; }).filter(function (x) {
      return !q || (x.c.name + ' ' + x.c.car + ' ' + x.msgs.map(function (m) { return m[1]; }).join(' ')).toLowerCase().indexOf(q) > -1;
    });
    var lastText = function (x) { var m = x.last; return m[0] === 'sys' ? m[1] : m[3] === 'card' ? 'You sent a car card' : (m[0] === 'me' ? 'You: ' : m[0] === 'note' ? 'Note: ' : '') + m[1]; };
    var unread = convs.reduce(function (a, x) { return a + x.un; }, 0), breach = convs.filter(function (x) { return x.wait > 15; }).length;
    var kpi = [['Unread', unread, 'across ' + convs.filter(function (x) { return x.un; }).length + ' chats', 'acc'], ['Avg. first reply', '6 min', '▼ 2 vs Sep', 'ok'],
      ['Over SLA', breach, breach ? '> 15 min waiting' : 'All on time', breach ? 'acc' : 'ok'], ['Conversations today', '23', '▲ 5', 'ok']];
    var html = '<div class="mqkpis">' + kpi.map(function (k) {
      return '<p class="mqk"><span class="mqk__k">' + k[0] + '</span><span class="mqk__r"><span class="mqk__v">' + k[1] + '</span><span class="mqk__d mqv--' + k[3] + '">' + e(k[2]) + '</span></span></p>';
    }).join('') + '<p class="mqkx"><button class="mqkx__bc js-mq"' + act('bc') + ' type="button">' + (s.bcs ? '✓ Price-drop broadcast queued · 38' : '+ Broadcast') + '</button>' +
      '<button class="mqkx__tp js-mq"' + act('tp') + ' type="button" aria-pressed="' + s.tps + '">' + (s.tps ? '✓ 12 saved templates' : 'Templates &amp; auto-replies') + '</button></p></div>';
    // list
    var rows = vis.map(function (x) {
      var c = x.c, on = x.id === s.sel, br = x.wait > 15, it = D.intent[x.id];
      return '<li><button class="mqrow' + (on ? ' is-sel' : '') + (x.un ? ' is-un' : '') + ' js-mq"' + act('sel', x.id) + ' type="button" aria-pressed="' + on + '">' + av(c, 'mqrow__av') +
        '<span class="mqrow__b"><span class="mqrow__h"><span class="mqrow__n">' + e(c.name) + '</span><span class="mqch">' + c.ch + '</span><span class="mqrow__t">' + x.last[2] + '</span></span>' +
        '<span class="mqrow__c"><span class="mqrow__car">' + e(c.car) + '</span><span class="mqint mqint--' + it[1] + '">' + it[0] + '</span></span>' +
        '<span class="mqrow__l"><span class="mqrow__last">' + e(lastText(x)) + '</span>' + (x.un ? '<span class="mqun">' + x.un + '</span>' : '') + '</span>' +
        (x.wait > 0 ? '<span class="mqrow__sla mqv--' + (br ? 'acc' : 'amber') + '">Waiting ' + x.wait + ' min' + (br ? ' · over SLA' : '') + '</span>' : '') + '</span></button></li>';
    }).join('');
    html += '<div class="mqgrid"><div class="mqlist"><div class="mqlist__f"><p class="mqtabs" role="group" aria-label="Inbox">' + ['All', 'Unassigned', 'Mine', 'Snoozed'].map(function (t) {
      return '<button class="mqtab js-mq"' + act('tb', t) + ' type="button" aria-pressed="' + (s.tb === t) + '">' + t + ' ' + convs.filter(tabF[t]).length + '</button>';
    }).join('') + '</p><p class="mqchs" role="group" aria-label="Channel">' + ['All', 'Chat', 'SMS', 'Email', 'WhatsApp'].map(function (t) {
      return '<button class="mqchip js-mq"' + act('cf', t) + ' type="button" aria-pressed="' + (s.cf === t) + '">' + t + '</button>';
    }).join('') + '</p><label class="mqsearch"><span class="sr-only">Search conversations</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5"/></svg>' +
      '<input class="mqsearch__in js-mq-in" data-f="q" type="search" value="' + e(s.q) + '" placeholder="Search name, car or message" autocomplete="off"></label></div>' +
      (rows ? '<ul class="mqrows">' + rows + '</ul>' : '<p class="mqempty">No conversations here</p>') + '</div>';
    var x = convs.filter(function (y) { return y.id === s.sel; })[0];
    if (!x) {
      return html + '<section class="mqthread" aria-label="Thread"></section><aside class="mqctx" aria-label="Customer"></aside></div>';
    }
    var c = x.c, first = c.name.split(' ')[0], mode = s.md, draft = s.dr[x.id] || '', left = 15 - x.wait, lastMe = x.last[0] === 'me';
    var hb = [['Call', 'call'], [x.as === 'MR' ? '✓ Mine' : 'Assign to me', 'assign'], [x.snoozed ? 'Unsnooze' : 'Snooze 2 h', 'snooze'], ['Close', 'close']].map(function (b) {
      return '<button class="mqhb' + (b[1] === 'assign' && x.as === 'MR' ? ' is-done' : '') + ' js-mq"' + act(b[1]) + ' type="button">' + b[0] + '</button>';
    }).join('');
    var msgs = x.msgs.map(function (m) {
      if (m[0] === 'sys') {
        return '<li class="mqsys">' + e(m[1]) + ' · ' + m[2] + '</li>';
      }
      var card = m[3] === 'card' ? '<span class="mqcard">' + img(D.card.ph, 'mqcard__img') + '<span class="mqcard__b"><span class="mqcard__t">' + e(D.card.t) + '</span><span class="mqcard__p">' + D.card.p + '</span>' +
        '<a class="mqcard__a" href="listing-single-v1.html">View listing →</a></span></span>' : '';
      return '<li class="mqmsg mqmsg--' + m[0] + '"><span class="mqb">' + (m[0] === 'note' ? '<span class="mqb__lab">Internal note · Mateo</span>' : '') + (m[1] ? '<span class="mqb__t">' + e(m[1]) + '</span>' : '') + card +
        '<span class="mqb__time">' + m[2] + '</span></span></li>';
    }).join('');
    var nba = D.nba[x.id];
    html += '<section class="mqthread" aria-labelledby="mq-name"><div class="mqth"><span class="mqth__avw">' + av(c, 'mqth__av') + '</span><div class="mqth__b"><div class="mqth__h"><h2 class="mqth__n" id="mq-name">' + e(c.name) + '</h2>' +
      '<span class="mqpill mqst--' + x.st + '">' + STG[x.st] + '</span>' + (x.wait > 0 ? '<span class="mqpill mqpill--' + (left > 0 ? 'amber' : 'acc') + '">' + (left > 0 ? 'Reply within ' + left + ' min' : 'Over SLA by ' + (-left) + ' min') + '</span>' : '') + '</div>' +
      '<p class="mqth__s">' + e(c.car) + ' · via ' + c.ch + ' · ' + (x.as ? 'assigned to ' + D.staff[x.as][0] : 'unassigned') + '</p></div><p class="mqth__a">' + hb + '</p></div>' +
      '<div class="mqai"><span class="mqai__i" aria-hidden="true">✦</span><div class="mqai__b"><p class="mqcap">AI summary</p><p class="mqai__t">' + e(D.summ[x.id]) + '</p>' +
      '<p class="mqai__n"><span class="mqai__k">Next best action:</span><span class="mqai__v">' + e(nba[0]) + '</span><button class="mqai__go js-mq"' + act('nba') + ' type="button">Draft it</button></p></div></div>' +
      '<ol class="mqmsgs">' + msgs + (lastMe ? '<li class="mqseen">Seen · ' + (x.last[2] === 'Now' ? 'just now' : x.last[2]) + '</li>' : '') +
      (x.un > 0 && !lastMe && x.id === 'c1' ? '<li class="mqtyping"><span class="mqtyping__d" aria-hidden="true"><span></span><span></span><span></span></span>' + e(first) + ' is typing…</li>' : '') + '</ol>' +
      '<p class="mqsug"><span class="mqsug__k">Suggested</span>' + D.smart[x.id].map(function (t) { return '<button class="mqsg js-mq"' + act('fill', t) + ' type="button">' + e(t) + '</button>'; }).join('') + '</p>' +
      '<div class="mqcomp' + (mode === 'Note' ? ' is-note' : '') + '"><p class="mqcomp__h"><span class="mqmode" role="group" aria-label="Composer mode">' + [['Reply', 'Reply'], ['Note', 'Internal note']].map(function (m) {
        return '<button class="mqmode__b mqmode__b--' + m[0].toLowerCase() + ' js-mq"' + act('md', m[0]) + ' type="button" aria-pressed="' + (mode === m[0]) + '">' + m[1] + '</button>';
      }).join('') + '</span>' + Object.keys(D.tpl).map(function (t) { return '<button class="mqtpl js-mq"' + act('tpl', t) + ' type="button">' + t + '</button>'; }).join('') + '</p>' +
      '<label class="sr-only" for="mq-draft">Message</label><textarea class="mqcomp__ta js-mq-in" id="mq-draft" data-f="dr" placeholder="' + (mode === 'Note' ? 'Only your team sees this…' : 'Reply to ' + e(first) + '…') + '">' + e(draft) + '</textarea>' +
      '<p class="mqcomp__f"><button class="mqtool js-mq"' + act('ai') + ' type="button">✦ AI draft</button><button class="mqtool js-mq"' + act('card') + ' type="button">+ Car card</button><button class="mqtool js-mq"' + act('tdl') + ' type="button">+ Test-drive link</button>' +
      '<span class="mqcomp__sp"></span><span class="mqcomp__via">' + (mode === 'Note' ? 'Visible to team only' : 'via ' + c.ch) + '</span><button class="mqsend js-mq"' + act('send') + ' type="button">' + (mode === 'Note' ? 'Add note' : 'Send') + '</button></p></div></section>';
    // context
    var HT = D.heat[x.id], ht = HT >= 75 ? 'acc' : HT >= 55 ? 'amber' : 'blue';
    html += '<aside class="mqctx" aria-label="Customer"><div class="mqcx">' + av(c, 'mqcx__av') + '<p class="mqcx__n">' + e(c.name) + '</p><p class="mqcx__s">' + e(c.src) + '</p></div>' +
      '<ul class="mqinfo">' + c.info.map(function (i) { return '<li><span class="mqinfo__k">' + i[0] + '</span><span class="mqinfo__v">' + e(i[1]) + '</span></li>'; }).join('') + '</ul>' +
      '<div class="mqint2">' + img(c.carPh, 'mqint2__img') + '<p class="mqint2__b"><span class="mqint2__k">Interested in</span><span class="mqint2__c">' + e(c.car) + '</span><span class="mqint2__p">' + c.carP + ' · <span class="mqv--ok">' + (x.st === 3 ? 'Sold to customer' : 'In stock') + '</span></span></p></div>' +
      '<div class="mqbox"><p class="mqbox__h"><span class="mqbox__k">Purchase intent</span><span class="mqv--' + ht + ' mqheat__t">' + HT + ' · ' + (HT >= 75 ? 'Hot' : HT >= 55 ? 'Warm' : 'Cool') + '</span></p>' +
      '<p class="mqheat" aria-hidden="true">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return '<span class="' + (i < Math.round(HT / 10) ? 'is-on mqheat--' + ht : '') + '"></span>'; }).join('') + '</p>' +
      '<p class="mqrail">' + STG.map(function (t, i) { return '<span class="mqrail__s' + (i <= x.st ? ' is-on mqst--' + x.st : '') + (i === x.st ? ' is-cur' : '') + '"><span class="mqrail__bar"></span><span class="mqrail__t">' + t + '</span></span>'; }).join('') + '</p></div>' +
      '<div class="mqbox"><p class="mqbox__k">Recent activity</p><ul class="mqact">' + D.activity[x.id].map(function (a) { return '<li><span class="mqact__dot mqdot--' + a[2] + '" aria-hidden="true"></span><span>' + e(a[0]) + '</span><span class="mqact__w">' + a[1] + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="mqlinks"><p class="mqlinks__k">Linked records</p><ul class="mqlinks__l">' + c.links.map(function (l) {
        return '<li><a class="mqlink" href="' + l[3] + '"><span class="mqlink__dot mqdot--' + l[2] + '" aria-hidden="true"></span><span class="mqlink__t">' + e(l[0]) + '</span><span class="mqlink__s">' + e(l[1]) + '</span><span class="mqlink__ar" aria-hidden="true">→</span></a></li>';
      }).join('') + '</ul></div>' +
      '<p class="mqqa">' + [['Book test drive', 'qa0'], ['Send offer', 'qa1'], ['Start finance app', 'qa2'], ['Value trade-in', 'qa3']].map(function (b, i) {
        return '<button class="mqqa__b' + (i === 0 ? ' mqqa__b--acc' : '') + ' js-mq"' + act(b[1]) + ' type="button">' + b[0] + '</button>';
      }).join('') + '</p>' +
      '<div class="mqteam"><span class="mqteam__avs">' + ['MR', 'SK', 'CL'].map(function (k) { var m = D.staff[k]; return '<img class="mqteam__av" src="assets/img/' + m[1] + '" alt="' + m[0] + '" title="' + m[0] + '" width="' + m[2] + '" height="' + m[2] + '" decoding="async">'; }).join('') + '</span>' +
      '<span class="mqteam__t">3 teammates can see this thread</span><button class="mqhb js-mq"' + act('mention') + ' type="button">@ Mention</button></div></aside></div>';
    return html;
  }
  /* mq-render:end */
  function initDealerMessages() {
    var box = $('.js-mqroot');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-mq')), s = mqInit(D);
    function scrollThread() {
      var list = $('.mqmsgs', box);
      if (list) {
        list.scrollTop = list.scrollHeight;
      }
    }
    function paint(keepScroll) {
      var f = document.activeElement && box.contains(document.activeElement) ? document.activeElement.getAttribute('data-f') : null;
      var caret = f ? document.activeElement.selectionStart : 0, list = $('.mqmsgs', box), top = list ? list.scrollTop : 0;
      box.innerHTML = mqHtml(s, D);
      if (keepScroll && $('.mqmsgs', box)) {
        $('.mqmsgs', box).scrollTop = top;
      } else {
        scrollThread();
      }
      if (f) {
        var el = $('[data-f="' + f + '"]', box);
        if (el) {
          el.focus();
          el.setSelectionRange(caret, caret);
        }
      }
    }
    function push(m) {
      s.sent[s.sel] = (s.sent[s.sel] || []).concat([m]);
      s.dr[s.sel] = '';
      s.rd[s.sel] = true;
    }
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('.js-mq');
      if (!b) {
        return;
      }
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), id = s.sel, c = D.convs.filter(function (q) { return q.id === id; })[0];
      var x = mqConvs(s, D).filter(function (q) { return q.id === id; })[0];
      if (a === 'sel') {
        s.sel = v;
        s.rd[v] = true;
      } else if (a === 'bc') {
        s.bcs = true;
      } else if (a === 'tp') {
        s.tps = !s.tps;
      } else if (a === 'tb' || a === 'cf' || a === 'md') {
        s[a] = v;
      } else if (a === 'call') {
        push(['sys', 'Outbound call · 4 min', 'Now']);
      } else if (a === 'assign') {
        s.as[id] = 'MR';
      } else if (a === 'snooze') {
        s.sz[id] = !x.snoozed;
      } else if (a === 'close') {
        s.sg[id] = 3;
      } else if (a === 'nba') {
        s.dr[id] = D.nba[id][1];
        s.md = 'Reply';
      } else if (a === 'fill') {
        s.dr[id] = v;
        s.md = 'Reply';
      } else if (a === 'tpl') {
        s.dr[id] = D.tpl[v].replace('{first}', c.name.split(' ')[0]).replace('{car}', c.car).replace('{price}', c.carP);
        s.md = 'Reply';
      } else if (a === 'ai') {
        s.dr[id] = D.ai[id] || D.tpl['Still available'].replace('{first}', c.name.split(' ')[0]).replace('{car}', c.car);
        s.md = 'Reply';
      } else if (a === 'card') {
        push(['me', '', 'Now', 'card']);
      } else if (a === 'tdl') {
        push(['me', 'Here’s a link to book your test drive: avava.com/td/' + id, 'Now']);
      } else if (a === 'send') {
        var t = (s.dr[id] || '').trim();
        if (!t) {
          return;
        }
        push([s.md === 'Note' ? 'note' : 'me', t, 'Now']);
      } else if (a.indexOf('qa') === 0) {
        push(['sys', ['Test drive invite sent · Sat 10:00', 'Offer card sent · ' + c.carP, 'Finance application link sent', 'Trade-in form sent'][+a.slice(2)], 'Now']);
      } else if (a === 'mention') {
        push(['note', '@Sam can you confirm the best cash price on this one?', 'Now']);
      }
      paint(a === 'tb' || a === 'cf' || a === 'md' || a === 'fill' || a === 'tpl' || a === 'ai' || a === 'nba' || a === 'assign' || a === 'tp' || a === 'bc');
    });
    box.addEventListener('input', function (ev) {
      var f = ev.target.getAttribute('data-f');
      if (f === 'q') {
        s.q = ev.target.value;
        paint(true);
      } else if (f === 'dr') {
        s.dr[s.sel] = ev.target.value;
      }
    });
    box.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && !ev.shiftKey && ev.target.getAttribute('data-f') === 'dr') {
        ev.preventDefault();
        $('.mqsend', box).click();
      }
    });
    scrollThread();
  }

  /* Dealer reviews (build_dealer_reviews.py). One pure view function: the builder runs rzInit + rzHtml (between the
     rz-render markers) in Node for the first markup, initDealerReviews re-renders on every change. */
  /* rz-render:start */
  function rzInit(D) {
    return { sel: D.sel, op: D.sel, rp: {}, dr: {}, tn: {}, lz: {}, pn: {}, es: {}, nt: {}, tk: {}, vo: {}, tb: 'All', sf: 'All', th: '', st: 0 };
  }
  function rzDraft(r, tone, D) {
    var f = r.author.split(' ')[0], m = D.mgr[r.mgr][0].split(' ')[0], car = r.car.replace(/^\d{4} /, '');
    if (tone === 'Apology') {
      return 'Hi ' + f + ', I’m sorry — this isn’t the experience we want for anyone. ' + (r.themes.indexOf('Slow finance paperwork') > -1 ? 'We’ve since added a dedicated finance coordinator so paperwork takes under an hour. ' :
        r.themes.indexOf('Waiting time') > -1 ? 'We now confirm every appointment the day before and prep the car an hour ahead. ' : r.themes.indexOf('Hidden fees') > -1 ? 'We now show every fee on the first quote. ' : '') +
        'I’d love to make it right — please call me directly at (310) 555-0100. — Alex Moreno, General Manager';
    }
    if (tone === 'Professional') {
      return 'Hi ' + f + ', thank you for taking the time to share your experience with Pacific Motors. We appreciate your business and look forward to seeing you again.';
    }
    return 'Thank you, ' + f + '! We’re so glad you love your ' + car + '. ' + m + ' will be thrilled to hear it — see you at your first service!';
  }
  function rzHtml(s, D) {
    var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var act = function (a, v) { return ' data-a="' + a + '"' + (v === undefined ? '' : ' data-v="' + e(v) + '"'); };
    var img = function (p, cls) { return '<img class="' + cls + '" src="assets/img/' + p[0] + '" alt="" width="' + p[1] + '" height="' + p[2] + '" decoding="async">'; };
    var av = function (r, cls) { return '<img class="' + cls + '" src="assets/img/' + r.img + '" alt="" width="' + r.iw + '" height="' + r.iw + '" decoding="async">'; };
    var stars = function (n, cls) { return '<span class="rzstars ' + cls + '" role="img" aria-label="' + n + ' of 5 stars">' + [1, 2, 3, 4, 5].map(function (i) { return '<span' + (i <= n ? ' class="is-on"' : '') + '>★</span>'; }).join('') + '</span>'; };
    var ISS = ['Slow finance paperwork', 'Waiting time', 'Hidden fees'];
    var revs = D.revs.map(function (r) { return Object.assign({}, r, { reply: s.rp[r.id] === undefined ? r.reply : s.rp[r.id] }); });
    var tabF = { All: function () { return true; }, 'Needs reply': function (r) { return !r.reply; }, Negative: function (r) { return r.n <= 3; }, 'With photos': function (r) { return r.photos.length > 0; } };
    var vis = revs.filter(tabF[s.tb]).filter(function (r) { return s.sf === 'All' || r.src === s.sf; }).filter(function (r) { return !s.th || r.themes.indexOf(s.th) > -1; }).filter(function (r) { return !s.st || r.n === s.st; });
    var replied = revs.filter(function (r) { return r.reply; }).length;
    var DIST = [[5, 318], [4, 58], [3, 16], [2, 9], [1, 11]];
    var html = '<div class="rzstrip"><p class="rzavg"><span class="rzavg__v">4.8</span><span class="rzavg__b">' + stars(5, 'rzstars--md') + '<span class="rzavg__t">412 reviews · all sources</span></span></p>' +
      '<p class="rzhist">' + DIST.map(function (d) {
        return '<button class="rzhist__b js-rz"' + act('star', d[0]) + ' type="button" title="' + d[0] + ' stars" aria-pressed="' + (s.st === d[0]) + '"><span class="rzhist__bar rzhist__bar--' + (d[0] >= 4 ? 'gold' : d[0] === 3 ? 'amber' : 'acc') + '" data-h="' + (d[1] / 318 * 100).toFixed(1) + '"></span><span class="rzhist__k">' + d[0] + '★</span></button>';
      }).join('') + '</p>' + [['Needs reply', revs.filter(function (r) { return !r.reply; }).length, 'acc'], ['Response rate', Math.round(replied / revs.length * 100) + '%', 'amber'], ['Avg. response', '5 h', 'ok']].map(function (k) {
        return '<p class="rzstat"><span class="rzstat__k">' + k[0] + '</span><span class="rzstat__v rzv--' + k[2] + '">' + k[1] + '</span></p>';
      }).join('') + '</div>';
    html += '<div class="rzbar"><p class="rztabs" role="group" aria-label="Reviews">' + ['All', 'Needs reply', 'Negative', 'With photos'].map(function (t) {
      return '<button class="rztab js-rz"' + act('tb', t) + ' type="button" aria-pressed="' + (s.tb === t) + '">' + t + '<span class="rztab__n">' + revs.filter(tabF[t]).length + '</span></button>';
    }).join('') + '</p><p class="rzsrcs" role="group" aria-label="Source">' + ['All', 'Avava', 'Google', 'Yelp', 'DealerRater'].map(function (t) {
      return '<button class="rzsrc js-rz"' + act('sf', t) + ' type="button" aria-pressed="' + (s.sf === t) + '">' + t + '</button>';
    }).join('') + '</p>' + (s.th || s.st ? '<button class="rzclear js-rz"' + act('clear') + ' type="button">' + e(s.th || s.st + '★ only') + '  ✕</button>' : '') +
      '<span class="rzbar__n">' + vis.length + ' of ' + revs.length + ' recent reviews</span></div>';
    var rows = vis.map(function (r) {
      var on = r.id === s.sel, neg = r.n <= 3;
      return '<li><button class="rzrow' + (on ? ' is-sel' : '') + ' js-rz"' + act('sel', r.id) + ' type="button" aria-pressed="' + on + '">' + av(r, 'rzrow__av') + '<span class="rzrow__b"><span class="rzrow__h"><span class="rzrow__n">' + e(r.author) + '</span>' + stars(r.n, 'rzstars--sm') +
        '<span class="rzrow__d">' + r.date + '</span></span><span class="rzrow__t">' + e(r.text) + '</span><span class="rzrow__f"><span class="rzpill">' + r.src + '</span><span class="rzpill rzpill--' + (r.reply ? 'ok' : neg ? 'acc' : 'amber') + '">' + (r.reply ? 'Replied' : 'Needs reply') + '</span>' +
        (r.reply ? '' : '<span class="rzrow__sla rzv--' + (neg ? 'acc' : 'mute') + '">' + (neg ? 'Reply within 6 h' : 'Reply within 2 days') + '</span>') + '</span></span></button></li>';
    }).join('');
    var r = revs.filter(function (q) { return q.id === s.sel; })[0];
    html += '<div class="rzdesk"><div class="rzq">' + (rows ? '<ul class="rzrows">' + rows + '</ul>' : '<p class="rzempty">No reviews in this view</p>') + '</div>';
    if (!r) {
      return html + '<div class="rzc"></div><div class="rzr"></div></div>';
    }
    var neg = r.n <= 3, open = s.op === r.id, tone = s.tn[r.id] || (neg ? 'Apology' : 'Warm'), draft = s.dr[r.id] === undefined ? rzDraft(r, tone, D) : s.dr[r.id], lz = s.lz[r.id] || 'Standard';
    var se = neg ? ['Negative', 'acc'] : r.n === 4 ? ['Mostly positive', 'amber'] : ['Positive', 'ok'];
    var acts = '<button class="rzbtn' + (r.reply ? '' : ' rzbtn--acc') + ' js-rz"' + act('open') + ' type="button" aria-expanded="' + open + '">' + (r.reply ? 'Edit reply' : 'Reply') + '</button>';
    if (r.n >= 4) {
      acts += '<button class="rzbtn' + (s.pn[r.id] ? ' is-done' : '') + ' js-rz"' + act('pin') + ' type="button">' + (s.pn[r.id] ? '✓ Pinned to storefront' : 'Pin to storefront') + '</button>';
    }
    if (neg) {
      acts += '<button class="rzbtn' + (s.es[r.id] ? ' is-done' : '') + ' js-rz"' + act('esc') + ' type="button">' + (s.es[r.id] ? '✓ Escalated to GM' : 'Escalate to GM') + '</button><button class="rzbtn js-rz"' + act('private') + ' type="button">Contact privately</button>';
    }
    var editor = open ? '<div class="rzed"><p class="rzed__r"><span class="rzed__k">Tone</span><span class="rzseg" role="group" aria-label="Tone">' + ['Warm', 'Professional', 'Apology'].map(function (t) {
      return '<button class="rzseg__b js-rz"' + act('tone', t) + ' type="button" aria-pressed="' + (tone === t) + '">' + t + '</button>';
    }).join('') + '</span><span class="rzseg" role="group" aria-label="Length">' + ['Short', 'Standard', 'Detailed'].map(function (t) {
      return '<button class="rzseg__b js-rz"' + act('len', t) + ' type="button" aria-pressed="' + (lz === t) + '">' + t + '</button>';
    }).join('') + '</span><span class="rzed__to">Publishes to ' + r.src + '</span></p><p class="rzed__r"><span class="rzed__k">Personalise</span>' +
      ['+ ' + D.mgr[r.mgr][0].split(' ')[0], '+ The car', neg ? '+ $150 service voucher' : '+ Owners’ event'].map(function (t, i) { return '<button class="rzpers js-rz"' + act('pers', i) + ' type="button">' + e(t) + '</button>'; }).join('') + '</p>' +
      '<label class="sr-only" for="rz-draft">Reply</label><textarea class="rzed__ta js-rz-in" id="rz-draft" data-f="dr">' + e(draft) + '</textarea>' +
      '<p class="rzed__f"><button class="rzbtn js-rz"' + act('regen') + ' type="button">✦ Regenerate</button><span class="rzed__tip">' + (neg ? 'Tip: acknowledge, fix, take it offline' : 'Tip: mention the person and the car') + '</span>' +
      '<button class="rzbtn js-rz"' + act('cancel') + ' type="button">Cancel</button><button class="rzpub js-rz"' + act('publish') + ' type="button">Publish reply</button></p></div>' : '';
    html += '<div class="rzc"><div class="rzrev' + (open ? ' is-open' : '') + '"><div class="rzrev__h">' + av(r, 'rzrev__av') + '<div class="rzrev__b"><p class="rzrev__n"><span id="rz-author">' + e(r.author) + '</span>' +
      (r.verified ? '<span class="rzpill rzpill--ok">✓ Verified purchase</span>' : '') + (s.pn[r.id] ? '<span class="rzpill rzpill--ink">Pinned</span>' : '') + '</p><p class="rzrev__s">' + stars(r.n, 'rzstars--lg') + '<span class="rzv--' + se[1] + '">' + se[0] + '</span></p></div>' +
      '<p class="rzrev__src"><span class="rzpill rzpill--lg">' + r.src + '</span><span class="rzrev__d">' + r.date + '</span></p></div><p class="rzrev__t">' + e(r.text) + '</p>' +
      (r.photos.length ? '<p class="rzrev__ph">' + r.photos.map(function (p) { return img(p, 'rzrev__img'); }).join('') + '</p>' : '') +
      '<p class="rzrev__m"><span class="rzrev__car">' + e(r.car) + ' · with ' + D.mgr[r.mgr][0] + '</span>' + r.themes.map(function (t) { return '<span class="rztheme rztheme--' + (ISS.indexOf(t) > -1 ? 'iss' : 'ok') + '">' + e(t) + '</span>'; }).join('') + '</p>' +
      (r.reply && !open ? '<div class="rzreply"><p class="rzreply__k">Pacific Motors replied · ' + (s.rp[r.id] ? 'just now' : '1 day later') + '</p><p class="rzreply__t">' + e(r.reply) + '</p></div>' : '') +
      (s.nt[r.id] ? '<p class="rznote">' + e(s.nt[r.id]) + '</p>' : '') + editor + '<p class="rzacts">' + acts + '</p></div>';
    var score = neg ? (r.n === 1 ? 9 : 22) : r.n === 4 ? 71 : 94, sc = score < 40 ? 'acc' : score < 75 ? 'amber' : 'ok';
    var items = r.themes.map(function (t) {
      var iss = D.causes[t], key = r.id + t, done = !!s.tk[key];
      if (iss) {
        return '<li class="rzai__i rzai__i--iss"><p class="rzai__b"><span class="rzai__t">' + e(t) + '</span><span class="rzai__d">Likely cause: ' + e(iss[0]) + '</span></p><button class="rzai__go' + (done ? ' is-done' : '') + ' js-rz"' + act('task', t) + ' type="button">' + (done ? '✓ Task created' : e(iss[1])) + '</button></li>';
      }
      return '<li class="rzai__i rzai__i--ok"><p class="rzai__b"><span class="rzai__t">' + e(t) + '</span><span class="rzai__d">Mentioned in ' + (2 + r.id.charCodeAt(1) % 5) + ' other reviews this month</span></p><button class="rzai__go rzai__go--ok' + (done ? ' is-done' : '') + ' js-rz"' + act('task', t) + ' type="button">' + (done ? '✓ Shared with team' : 'Share with team') + '</button></li>';
    }).join('');
    html += '<div class="rzcard"><div class="rzai__h"><span class="rzai__ic" aria-hidden="true">✦</span><p class="rzai__hb"><span class="rzcard__t" id="rz-ai">AI review analysis</span><span class="rzcard__s">' + (neg ? 'Unanswered negative reviews cost ~3 leads a week' : 'Strong review — good candidate for your storefront') + '</span></p>' +
      '<p class="rzsent"><span class="rzv--' + sc + '">Sentiment ' + score + ' / 100</span><span class="rzsent__bar" aria-hidden="true"><span class="rzsent__f rzsent__f--' + sc + '" data-w="' + score + '"></span></span></p></div><ul class="rzai">' + items + '</ul>' +
      '<p class="rzcard__s rzai__imp">' + (neg ? 'Replying within 6 hours lifts the chance the reviewer updates their rating by 33%.' : 'Reviews with an owner reply get 1.7× more “helpful” votes.') + '</p></div>' +
      '<div class="rzcard"><p class="rzcard__hr"><span class="rzcard__t" id="rz-pv">Live preview</span><span class="rzcard__s">How it appears on ' + r.src + '</span></p><div class="rzpv"><p class="rzpv__h">' + av(r, 'rzpv__av') +
      '<span class="rzpv__b"><span class="rzpv__n">' + e(r.author) + '</span>' + stars(r.n, 'rzstars--sm') + '</span><span class="rzpv__d">' + r.date + '</span></p><p class="rzpv__t">' + e(r.text) + '</p>' +
      '<div class="rzpv__r"><p class="rzpv__k">Response from the owner · Pacific Motors</p><p class="rzpv__rt">' + e(open ? draft : (r.reply || 'No reply yet')) + '</p></div></div></div></div>';
    var done = !!s.vo[r.id];
    html += '<div class="rzr"><div class="rzcard"><p class="rzcard__t" id="rz-cv">Customer value</p><ul class="rzval">' + [['Lifetime value', r.ltv[0]], ['Purchases', r.ltv[1]], ['Service visits', r.ltv[2]], ['Manager', D.mgr[r.mgr][0].split(' ')[0]]].map(function (v) {
      return '<li><span class="rzval__k">' + v[0] + '</span><span class="rzval__v">' + e(v[1]) + '</span></li>';
    }).join('') + '</ul><div class="rzoff rzoff--' + (neg ? 'neg' : 'pos') + '"><p class="rzoff__t">' + (neg ? 'Win-back offer' : 'Turn into a testimonial') + '</p><p class="rzoff__d">' + (neg ? 'Send a $150 service voucher with a personal note from the GM.' : 'Ask ' + e(r.author.split(' ')[0]) + ' for a 30-second video and pin the review to your storefront.') + '</p>' +
      '<button class="rzoff__go' + (done ? ' is-done' : '') + ' js-rz"' + act('offer') + ' type="button">' + (done ? (neg ? '✓ Voucher sent' : '✓ Request sent') : (neg ? 'Send $150 voucher' : 'Request video')) + '</button></div></div>' +
      '<div class="rzcard"><p class="rzcard__t" id="rz-pu">Purchase</p><p class="rzpu">' + img(r.carPh, 'rzpu__img') + '<span class="rzpu__b"><span class="rzpu__c">' + e(r.car) + '</span><span class="rzpu__d">' + e(r.deal) + '</span></span></p>' +
      '<ul class="rzkv">' + [['Manager', D.mgr[r.mgr][0]], ['Paid', r.n >= 4 ? 'Avava Finance' : 'Bank loan'], ['Source', r.src], ['Rated', r.n + ' of 5']].map(function (v) { return '<li><span class="rzkv__k">' + v[0] + '</span><span>' + v[1] + '</span></li>'; }).join('') + '</ul>' +
      '<a class="rzlink" href="dealer-deals.html">Open deal →</a></div>' +
      '<div class="rzcard"><p class="rzcard__t" id="rz-hi">Customer history</p><ul class="rzhi">' + [['First enquiry · Avava chat', '6 wk ago', 'blue'], ['Test drive', '5 wk ago', 'blue'], ['Deal signed', '4 wk ago', 'ok'], ['Delivered', r.deal.split('· ')[1] || 'recently', 'ok'], ['Review left · ' + r.n + '★', r.date, neg ? 'acc' : 'gold']].map(function (h) {
        return '<li><span class="rzhi__dot rzdot--' + h[2] + '" aria-hidden="true"></span><span>' + h[0] + '</span><span class="rzhi__w">' + h[1] + '</span></li>';
      }).join('') + '</ul><a class="rzlink" href="dealer-messages.html">Message customer →</a></div></div></div>';
    return html;
  }
  /* rz-render:end */
  function initDealerReviews() {
    var box = $('.js-rzroot');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-rz')), s = rzInit(D);
    function sizes() {
      $$('[data-w]', box).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
      $$('[data-h]', box).forEach(function (el) { el.style.height = el.getAttribute('data-h') + '%'; });
    }
    function paint() {
      box.innerHTML = rzHtml(s, D);
      sizes();
    }
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('.js-rz');
      if (!b) {
        return;
      }
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), id = s.sel;
      var r = D.revs.filter(function (q) { return q.id === id; })[0], neg = r.n <= 3, tone = s.tn[id] || (neg ? 'Apology' : 'Warm');
      var draft = s.dr[id] === undefined ? rzDraft(r, tone, D) : s.dr[id];
      if (a === 'sel') {
        s.sel = v;
        s.op = v;
      } else if (a === 'star') {
        s.st = s.st === +v ? 0 : +v;
      } else if (a === 'tb' || a === 'sf') {
        s[a] = v;
      } else if (a === 'clear') {
        s.th = '';
        s.st = 0;
      } else if (a === 'open') {
        s.op = s.op === id ? null : id;
      } else if (a === 'pin') {
        s.pn[id] = !s.pn[id];
      } else if (a === 'esc') {
        s.es[id] = true;
        s.nt[id] = 'Escalated to Alex Moreno (GM) · task due today';
      } else if (a === 'private') {
        s.nt[id] = 'Private message sent to ' + r.author + ' via Avava Messages';
      } else if (a === 'tone') {
        s.tn[id] = v;
        s.dr[id] = rzDraft(r, v, D);
      } else if (a === 'len') {
        var base = rzDraft(r, tone, D);
        s.lz[id] = v;
        s.dr[id] = v === 'Short' ? base.split(/(?<=[.!?]) /)[0] : v === 'Detailed' ? base + ' ' + (neg ? 'We’ve shared your feedback with the whole team so it doesn’t happen again.' : 'Thanks for choosing a family-owned dealer — it means a lot to all of us.') : base;
      } else if (a === 'pers') {
        var m = D.mgr[r.mgr][0].split(' ')[0];
        s.dr[id] = draft + [' ' + m + ' says thank you too.', ' Enjoy every mile in the ' + r.car.replace(/^\d{4} /, '') + '.',
          neg ? ' As a thank-you for your patience, your next service is on us (up to $150).' : ' You’re invited to our next owners’ breakfast — details by email.'][+v];
      } else if (a === 'regen') {
        s.dr[id] = rzDraft(r, tone, D);
      } else if (a === 'cancel') {
        s.op = null;
      } else if (a === 'publish') {
        s.rp[id] = draft;
        s.op = null;
      } else if (a === 'task') {
        s.tk[id + v] = true;
      } else if (a === 'offer') {
        s.vo[id] = true;
      }
      paint();
    });
    box.addEventListener('input', function (ev) {
      if (ev.target.getAttribute('data-f') === 'dr') {
        s.dr[s.sel] = ev.target.value;
        var pv = $('.rzpv__rt', box);
        if (pv) {
          pv.textContent = ev.target.value;
        }
      }
    });
    sizes();
  }

  /* Dealer analytics (build_dealer_analytics.py). One pure view function: the builder runs ayInit + ayHtml (between the
     ay-render markers) in Node for the first markup, initDealerAnalytics re-renders on every change. Sizes travel as
     data-h / data-w / data-b / data-l / data-o / data-a+data-f and are applied by ayApply(). */
  /* ay-render:start */
  function ayInit() {
    return { p: 1, cmp: true, mt: 'Revenue', kk: 'Revenue', sb: null, fs: null, ts: 4, dn: {}, ex: false, sc: false, ml: false, mg: 'all', loc: 'Melrose showroom', mk: 'All makes' };
  }
  function ayHtml(s, D) {
    var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var act = function (a, v) { return ' data-a="' + a + '"' + (v === undefined ? '' : ' data-v="' + e(v) + '"'); };
    var money = function (n) { return n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? '$' + Math.round(n / 1e3) + 'k' : '$' + Math.round(n); };
    var num = function (n) { return n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : n.toLocaleString('en-US'); };
    var PER = ['7 days', '30 days', '90 days', '12 months'], p = s.p, cmp = s.cmp, F = [0.25, 1, 3, 12][p], NB = [7, 30, 13, 12][p];
    var LAB = function (i) {
      return p === 0 ? ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'][i] : p === 1 ? (i % 5 === 0 || i === 29 ? String(((i + 7) % 30) + 1) + (i < 24 ? ' Sep' : ' Oct') : '') :
        p === 2 ? 'W' + (i + 1) : ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'][i];
    };
    var MT = ['Revenue', 'Cars sold', 'Leads', 'Gross profit'], mt = s.mt;
    var TOT = { Revenue: [612000, 1240000, 3610000, 14800000], 'Cars sold': [4, 9, 27, 112], Leads: [64, 238, 710, 2860], 'Gross profit': [33000, 76000, 221000, 885000] };
    var PREVF = { Revenue: 0.89, 'Cars sold': 0.82, Leads: 0.87, 'Gross profit': 0.9 };
    var fmtM = function (m, v) { return m === 'Revenue' || m === 'Gross profit' ? money(v) : num(Math.round(v)); };
    var seed = MT.indexOf(mt) + 1, w = [], pw = [], i;
    for (i = 0; i < NB; i++) {
      w.push(0.55 + 0.35 * Math.sin(i * 0.8 + seed) + 0.2 * Math.cos(i * 0.37 * seed) + (p === 3 ? i * 0.02 : 0));
      pw.push(0.55 + 0.35 * Math.sin(i * 0.8 + seed + 1.3) + 0.2 * Math.cos(i * 0.5));
    }
    var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
    var tot = TOT[mt][p], ws = sum(w), pws = sum(pw);
    var vals = w.map(function (x) { return tot * x / ws; }), prev = pw.map(function (x) { return tot * PREVF[mt] * x / pws; });
    var mx = Math.max.apply(null, vals.concat(cmp ? prev : [0])), sb = s.sb === null ? NB - 1 : Math.min(s.sb, NB - 1);
    var FN = [['Views', [1700, 12400, 38000, 152000]], ['Leads', [64, 238, 710, 2860]], ['Test drives', [14, 45, 136, 540]], ['Offers', [7, 18, 55, 220]], ['Deals', [5, 11, 31, 125]], ['Delivered', [4, 9, 27, 112]]];
    var PF = [0.93, 0.88, 0.95, 1.06, 0.9, 0.82], BENCH = [0.018, 0.2, 0.42, 0.62, 0.85];
    var fv = FN.map(function (f) { return f[1][p]; }), convs = fv.slice(1).map(function (v, j) { return v / fv[j]; }), ratio = convs.map(function (c, j) { return c / BENCH[j]; });
    var leakI = ratio.indexOf(Math.min.apply(null, ratio)), pc = function (c, j) { return (c * 100).toFixed(j === 0 ? 1 : 0) + '%'; };
    var gpc = ['$8.1k', '$8.4k', '$8.2k', '$7.9k'][p], leakT = FN[leakI][0] + ' → ' + FN[leakI + 1][0].toLowerCase();
    // controls
    var html = '<div class="aybar"><p class="ayper" role="group" aria-label="Period">' + PER.map(function (t, j) { return '<button class="ayper__b js-ay"' + act('p', j) + ' type="button" aria-pressed="' + (p === j) + '">' + t + '</button>'; }).join('') + '</p>' +
      '<button class="aycmp js-ay"' + act('cmp') + ' type="button" aria-pressed="' + cmp + '"><span class="aycmp__sw" aria-hidden="true"></span>Compare to previous period</button><p class="ayfilt">' +
      [['loc', 'Showroom', D.locs, s.loc], ['mg', 'Manager', D.mgrOpts, s.mg], ['mk', 'Make', D.makes, s.mk]].map(function (f) {
        return '<label class="aysel"><span class="sr-only">' + f[1] + '</span><select class="aysel__s js-ay-sel" data-f="' + f[0] + '">' + f[2].map(function (o) {
          return '<option value="' + e(o[0]) + '"' + (o[0] === f[3] ? ' selected' : '') + '>' + e(o[1]) + '</option>';
        }).join('') + '</select></label>';
      }).join('') + '</p><span class="aybar__sp"></span><button class="aybtn js-ay"' + act('ex') + ' type="button">' + (s.ex ? '✓ PDF downloaded' : 'Export') + '</button>' +
      '<button class="aybtn aybtn--acc js-ay"' + act('sc') + ' type="button">' + (s.sc ? '✓ Scheduled · Mon 8:00' : 'Schedule report') + '</button></div>';
    // executive summary + goals
    var exec = 'Revenue ' + money(TOT.Revenue[p]) + ' on ' + TOT['Cars sold'][p] + ' cars' + (cmp ? ', up 12%' : '') + '. Gross per car ' + gpc + '. The biggest leak is ' + FN[leakI][0].toLowerCase() + ' → ' +
      FN[leakI + 1][0].toLowerCase() + ' at ' + pc(convs[leakI], leakI) + '. Saved-car alerts remain the best-converting source.';
    var goals = [['Revenue', 268000, 1400000, true], ['Cars sold', 2, 14, false], ['Gross profit', 17000, 110000, true]].map(function (g) {
      var fc = g[1] / 6 * 31, pct = Math.min(130, Math.round(fc / g[2] * 100)), tone = pct >= 100 ? 'ok' : pct >= 85 ? 'amber' : 'acc', pv = Math.min(100, g[1] / g[2] * 100);
      return '<li class="aygoal"><span class="ayring ayring--' + tone + '" data-a="' + pv.toFixed(1) + '" data-f="' + Math.min(100, pct) + '"><span class="ayring__in"><span class="ayring__v">' + pct + '%</span><span class="ayring__k">forecast</span></span></span>' +
        '<span class="aygoal__t">' + g[0] + '</span><span class="aygoal__v">' + (g[3] ? money(g[1]) + ' of ' + money(g[2]) : g[1] + ' of ' + g[2]) + '</span><span class="aypill aypill--' + tone + '">' + (pct >= 100 ? 'On pace' : pct >= 85 ? 'Slightly behind' : 'Behind') + '</span></li>';
    }).join('');
    html += '<div class="aytop"><div class="ayexec"><p class="ayexec__h"><span class="ayexec__i" aria-hidden="true">✦</span><span class="ayexec__k">Executive summary · ' + PER[p] + '</span></p><p class="ayexec__t">' + e(exec) + '</p>' +
      '<p class="ayexec__f"><span class="ayexec__c ayexec__c--ok">▲ 12% revenue</span><span class="ayexec__c ayexec__c--ok">▼ 3 days to sell</span><span class="ayexec__c ayexec__c--acc">Leak: ' + FN[leakI][0] + ' → ' + FN[leakI + 1][0] + '</span>' +
      '<span class="aybar__sp"></span><button class="ayexec__go js-ay"' + act('ml') + ' type="button">' + (s.ml ? '✓ Sent to owner' : 'Email to owner') + '</button></p></div>' +
      '<div class="aycard"><p class="aycard__h"><span class="aycard__t">October goals</span><span class="aycard__s">day 6 of 31 · forecast at current pace</span></p><ul class="aygoals">' + goals + '</ul></div></div>';
    // KPI tiles
    var KM = { Revenue: 'Revenue', 'Cars sold': 'Cars sold', 'Gross per car': 'Gross profit', 'Lead → sale': 'Leads', 'Avg. days to sell': 'Cars sold' };
    var KP = [['Revenue', money(TOT.Revenue[p]), '▲ 12% vs prev', 1], ['Cars sold', String(TOT['Cars sold'][p]), '▲ ' + Math.max(1, Math.round(TOT['Cars sold'][p] * 0.18)) + ' vs prev', 2],
      ['Gross per car', gpc, '▲ $300', 3], ['Lead → sale', ['6.2%', '3.8%', '3.8%', '3.9%'][p], '▲ 0.4 pts', 4], ['Avg. days to sell', ['22', '24', '26', '27'][p], '▼ 3 days', 5]];
    html += '<ul class="aykpis">' + KP.map(function (k) {
      var on = KM[k[0]] === mt && s.kk === k[0], sp = '';
      for (var j = 0; j < 8; j++) { sp += '<span' + (j === 7 ? ' class="is-last"' : '') + ' data-h="' + Math.round(30 + 60 * Math.abs(Math.sin(j * 0.9 + k[3]))) + '"></span>'; }
      return '<li><button class="ayk' + (on ? ' is-on' : '') + ' js-ay"' + act('kk', k[0]) + ' type="button" aria-pressed="' + on + '"><span class="ayk__k">' + e(k[0]) + '</span><span class="ayk__v">' + k[1] + '</span>' +
        '<span class="ayk__f"><span class="ayk__d">' + (cmp ? k[2] : '') + '</span><span class="ayspark" aria-hidden="true">' + sp + '</span></span></button></li>';
    }).join('') + '</ul>';
    // chart + insights
    var tgt = tot / NB * 1.08, tgtP = Math.min(95, tgt / mx * 300 / 344 * 100);
    var bars = vals.map(function (v, j) {
      return '<button class="aybarc' + (j === sb ? ' is-sel' : '') + ' js-ay"' + act('sb', j) + ' type="button" aria-label="' + e((p === 1 ? 'Day ' + (j + 1) : LAB(j)) + ' · ' + fmtM(mt, v)) + '">' + (cmp ? '<span class="aybarc__p" data-h="' + (prev[j] / mx * 100).toFixed(1) + '"></span>' : '') +
        '<span class="aybarc__v" data-h="' + (v / mx * 100).toFixed(1) + '"></span></button>';
    }).join('');
    var tip = (p === 1 ? 'Day ' + (sb + 1) : LAB(sb)) + ' · ' + fmtM(mt, vals[sb]) + (cmp ? ' vs ' + fmtM(mt, prev[sb]) : '');
    var ins = [['m', leakT.replace(/^./, function (c) { return c; }) + ' is your biggest leak (' + pc(convs[leakI], leakI) + ' vs ' + pc(BENCH[leakI], leakI) + ' benchmark). An automatic follow-up within 24 h lifts it by ~9 pts.', 'Create follow-up rule', 'acc', '!'],
      ['s', 'Saved-car alerts convert 3× better than Instagram ads at zero cost. Shift $1.2k/mo of ad spend to price-drop alerts.', 'Open marketing', 'ok', '↑'],
      ['t', 'Cars priced above market take 41 days vs 14 for great-priced ones — 6 cars are above market right now.', 'Review in Inventory', 'blue', '$']];
    html += '<div class="aymid"><div class="aycard"><p class="aycard__h"><span class="aycard__t">Performance</span><span class="aycard__s">' + PER[p] + (cmp ? ' · vs previous ' + PER[p] : '') + '</span></p>' +
      '<div class="aych__r"><p class="ayseg" role="group" aria-label="Metric">' + MT.map(function (t) { return '<button class="ayseg__b js-ay"' + act('mt', t) + ' type="button" aria-pressed="' + (mt === t) + '">' + t + '</button>'; }).join('') + '</p>' +
      '<p class="aych__tot"><span class="aych__v">' + fmtM(mt, tot) + '</span>' + (cmp ? '<span class="ayv--ok aych__d">▲ ' + ((1 / PREVF[mt] - 1) * 100).toFixed(0) + '% vs previous</span>' : '') + '</p>' +
      '<p class="aylg"><span class="aylg__i">This period</span>' + (cmp ? '<span class="aylg__i aylg__i--prev">Previous</span>' : '') + '</p></div>' +
      '<div class="aych"><span class="aych__tip' + ((sb + 0.5) / NB > 0.75 ? ' aych__tip--r' : (sb + 0.5) / NB < 0.25 ? ' aych__tip--l' : '') + '" data-l="' + ((sb + 0.5) / NB * 100).toFixed(2) + '">' + e(tip) + '</span><div class="aych__plot' + (NB > 20 ? ' is-dense' : '') + '"><span class="aych__tgt" data-b="' + tgtP.toFixed(2) + '" aria-hidden="true"></span>' +
      '<span class="aych__tgtl" data-b="' + tgtP.toFixed(2) + '">Target ' + fmtM(mt, tgt) + ' / ' + (p <= 1 ? 'day' : p === 2 ? 'week' : 'month') + '</span>' + bars + '</div>' +
      '<p class="aych__x' + (NB > 20 ? ' is-dense' : '') + '" aria-hidden="true">' + vals.map(function (_, j) { return '<span>' + LAB(j) + '</span>'; }).join('') + '</p></div></div>' +
      '<div class="aycard"><p class="aycard__h"><span class="aycard__t">Insights</span><span class="aycard__s">AI · this period</span></p><ul class="ayins">' + ins.map(function (x) {
        return '<li class="ayin ayin--' + x[3] + '"><span class="ayin__m" aria-hidden="true">' + x[4] + '</span><p class="ayin__b"><span class="ayin__t">' + e(x[1]) + '</span><button class="ayin__go js-ay"' + act('dn', x[0]) + ' type="button">' + (s.dn[x[0]] ? '✓ Done' : x[2]) + '</button></p></li>';
      }).join('') + '</ul></div></div>';
    // funnel + sources
    var funnel = FN.map(function (f, j) {
      var v = fv[j], pv = v * PF[j], d = (v / pv - 1) * 100, lw = Math.log10(v + 1) / Math.log10(fv[0] + 1) * 100, plw = Math.log10(pv + 1) / Math.log10(fv[0] + 1) * 100;
      return '<li class="ayfn"><button class="ayfn__r' + (s.fs === j ? ' is-on' : '') + ' js-ay"' + act('fs', j) + ' type="button" aria-pressed="' + (s.fs === j) + '"><span class="ayfn__t">' + f[0] + '</span><span class="ayfn__bar" aria-hidden="true">' +
        (cmp ? '<span class="ayfn__p" data-w="' + plw.toFixed(1) + '"></span>' : '') + '<span class="ayfn__f ayfn__f--' + (j === 0 ? 'ink' : j === 5 ? 'ok' : 'acc') + '" data-w="' + lw.toFixed(1) + '"></span></span>' +
        '<span class="ayfn__v">' + num(v) + '</span><span class="ayfn__d ayv--' + (d >= 0 ? 'ok' : 'acc') + '">' + (cmp ? (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(0) + '%' : '') + '</span></button>' +
        (j < 5 ? '<p class="ayfn__c' + (ratio[j] < 0.9 ? ' ayv--acc' : '') + '"><span>↓ ' + pc(convs[j], j) + ' convert</span>' + (j === leakI ? '<span class="aypill aypill--acc">Biggest leak · benchmark ' + pc(BENCH[j], j) + '</span>' : '') + '</p>' : '') + '</li>';
    }).join('');
    var drill = '';
    if (s.fs !== null) {
      drill = '<div class="aydrill"><p class="aydrill__h"><span>' + FN[s.fs][0] + ' by source · ' + num(fv[s.fs]) + '</span><button class="aybtn aybtn--sm js-ay"' + act('fsx') + ' type="button">Close</button></p><ul class="aydrill__l">' + D.sources.map(function (x) {
        var adj = s.fs === 0 ? x[1] : x[1] * (1 + (x[2] - 0.05) * (s.fs * 2)), v = Math.max(0, Math.round(fv[s.fs] * adj));
        return '<li><span>' + x[0] + '</span><span class="aymini" aria-hidden="true"><span class="aymini__f aysw--' + x[4] + '" data-w="' + Math.min(100, adj / 0.5 * 100).toFixed(1) + '"></span></span><span class="aydrill__v">' + num(v) + '</span></li>';
      }).join('') + '</ul></div>';
    }
    var L = TOT.Leads[p];
    var srcRows = D.sources.map(function (x) {
      var l = Math.round(L * x[1]), sl = Math.max(x[2] * l >= 0.5 ? 1 : 0, Math.round(x[2] * l)), spend = x[3] * l, roi = spend ? sl * 8400 / spend : null;
      return '<li class="aysr"><span class="aysr__n"><span class="aysw aysw--' + x[4] + '" aria-hidden="true"></span><span class="aysr__t">' + x[0] + '</span></span><span class="aymini" aria-hidden="true"><span class="aymini__f aysw--' + x[4] + '" data-w="' + (x[1] / 0.42 * 100).toFixed(1) + '"></span></span>' +
        '<span class="aysr__c">' + l + '</span><span class="aysr__c">' + sl + '</span><span class="aysr__c ayv--' + (x[2] >= 0.05 ? 'ok' : x[2] >= 0.03 ? 'ink' : 'acc') + '">' + (x[2] * 100).toFixed(1) + '%</span>' +
        '<span class="aysr__c ayv--mute2">' + (x[3] ? '$' + x[3] : '—') + '</span><span class="aysr__c ayv--' + (roi === null ? 'mute' : roi >= 3 ? 'ok' : roi >= 1.5 ? 'amber' : 'acc') + '">' + (roi === null ? 'Organic' : roi.toFixed(1) + '×') + '</span></li>';
    }).join('');
    html += '<div class="ayrow2"><div class="aycard"><p class="aycard__h"><span class="aycard__t">Sales funnel</span><span class="aycard__s">click a stage to drill down</span></p><ul class="ayfns">' + funnel + '</ul>' + drill + '</div>' +
      '<div class="aycard aycard--src"><p class="aycard__h"><span class="aycard__t">Lead sources</span><span class="aycard__s">by leads · sales · return</span></p><p class="aysr aysr--h"><span>Source</span><span>Share of leads</span><span class="aysr__c">Leads</span><span class="aysr__c">Sales</span>' +
      '<span class="aysr__c">Conv.</span><span class="aysr__c">CPL</span><span class="aysr__c">ROI</span></p><ul class="aysrs">' + srcRows + '</ul></div></div>';
    // profit / inventory / team
    var GR = TOT['Gross profit'][p], MIX = [['Front gross', 0.52, 'ink'], ['F&I', 0.24, 'acc'], ['Trade-in', 0.14, 'blue'], ['Service', 0.1, 'ok']];
    var margin = [8.1, 8.3, 7.9, 8.4, 8.6, 8.2, 8.8, 9.0, 8.7, 9.1, 9.3, 9.0];
    var TC = ['Leads', 'Reply', 'Test drives', 'Deals', 'Gross', 'Rating'];
    var team = D.team.filter(function (m) { return s.mg === 'all' || m[0] === s.mg; }).map(function (m) { return { m: m, key: [m[3] * F, -m[4], m[5] * F, m[6] * F, m[7] * F, m[8]][s.ts] }; })
      .sort(function (a, b) { return b.key - a.key; }).map(function (x) {
        var m = x.m, cells = [String(Math.round(m[3] * F)), m[4] + ' min', String(Math.round(m[5] * F)), String(Math.max(1, Math.round(m[6] * F))), money(m[7] * F), m[8].toFixed(1)];
        return '<li class="aytm"><span class="aytm__n"><img class="aytm__av" src="assets/img/' + m[2] + '" alt="" width="' + m[9] + '" height="' + m[9] + '" decoding="async"><span class="aytm__t">' + m[1] + '</span></span>' + cells.map(function (c, j) {
          var tone = j === 1 ? (m[4] <= 5 ? 'ok' : m[4] <= 10 ? 'ink' : 'acc') : j === 5 ? (m[8] >= 4.8 ? 'ok' : m[8] >= 4.5 ? 'ink' : 'acc') : 'ink';
          return '<span class="aytm__c ayv--' + tone + '">' + c + '</span>';
        }).join('') + '</li>';
      }).join('');
    html += '<div class="ayrow3"><div class="aycard"><p class="aycard__h"><span class="aycard__t">Profit mix</span><span class="aycard__s">front · F&amp;I · trade · service</span></p><p class="aych__tot"><span class="aypm__v">' + money(GR) + '</span><span class="aycard__s">' + gpc + ' per car</span></p>' +
      '<p class="aystack" aria-hidden="true">' + MIX.map(function (m) { return '<span class="aysw--' + m[2] + '" data-w="' + Math.round(m[1] * 100) + '"></span>'; }).join('') + '</p><ul class="aymix">' + MIX.map(function (m) {
        return '<li><span class="aysw aysw--' + m[2] + '" aria-hidden="true"></span><span>' + e(m[0]) + '</span><span>' + money(GR * m[1]) + '</span><span class="aymix__p">' + Math.round(m[1] * 100) + '%</span></li>';
      }).join('') + '</ul><p class="aycard__s aymgn__k">Gross margin · 12 months</p><p class="aymgn" aria-hidden="true">' + margin.map(function (m, j) { return '<span' + (j === 11 ? ' class="is-last"' : '') + ' data-h="' + ((m - 7) / 2.5 * 100).toFixed(1) + '" title="' + m + '%"></span>'; }).join('') + '</p></div>' +
      '<div class="aycard"><p class="aycard__h"><span class="aycard__t">Inventory</span><span class="aycard__s">aging &amp; speed</span></p><ul class="ayage">' + [['Fresh · 0–30 d', 26, '$3.9M', 'ok'], ['Watch · 31–45 d', 9, '$1.4M', 'blue'], ['Aging · 46–60 d', 7, '$1.1M', 'amber'], ['Stale · 60+ d', 6, '$1.2M', 'acc']].map(function (a) {
        return '<li><span class="ayage__k"><span class="aydot aysw--' + a[3] + '" aria-hidden="true"></span>' + a[0] + '</span><span class="ayage__v">' + a[1] + ' <span class="ayage__s">cars · ' + a[2] + '</span></span></li>';
      }).join('') + '</ul><p class="aycard__s">Days to sell by price position</p><ul class="ayspeed">' + [['Great price', 14, 'ok'], ['Fair price', 23, 'blue'], ['Above market', 41, 'acc']].map(function (x) {
        return '<li><span>' + x[0] + '</span><span class="aymini" aria-hidden="true"><span class="aymini__f aysw--' + x[2] + '" data-w="' + (x[1] / 41 * 100).toFixed(1) + '"></span></span><span class="ayspeed__v">' + x[1] + ' d</span></li>';
      }).join('') + '</ul><p class="ayturn">Stock turn 7.8× / yr · $7.6M tied up</p></div>' +
      '<div class="aycard"><p class="aycard__h"><span class="aycard__t">Team</span><span class="aycard__s">click a column to sort</span></p><p class="aytm aytm--h"><span>Manager</span>' + TC.map(function (t, j) {
        return '<button class="aytm__sort js-ay"' + act('ts', j) + ' type="button" aria-pressed="' + (s.ts === j) + '">' + t + (s.ts === j ? ' ↓' : '') + '</button>';
      }).join('') + '</p><ul class="aytms">' + team + '</ul></div></div>';
    // heatmap + anomalies
    var HRS = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'], DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var hv = function (d, hI) {
      var hr = 8 + hI, v = d < 5 ? 0.2 + 0.5 * Math.exp(-Math.pow(hr - 12.5, 2) / 3) + 0.45 * Math.exp(-Math.pow(hr - 18.5, 2) / 2) :
        (d === 5 ? 0.35 + 0.65 * Math.exp(-Math.pow(hr - 12, 2) / 6) : 0.15 + 0.45 * Math.exp(-Math.pow(hr - 13, 2) / 5));
      return Math.min(1, v);
    };
    var peak = [0, 0, 0];
    DAYS.forEach(function (_, di) { HRS.forEach(function (__, hi) { var v = hv(di, hi); if (v > peak[0]) { peak = [v, di, hi]; } }); });
    var heat = '<p class="ayhm ayhm--h" aria-hidden="true"><span></span>' + HRS.map(function (h) { return '<span>' + h + '</span>'; }).join('') + '</p>' + DAYS.map(function (d, di) {
      return '<p class="ayhm"><span class="ayhm__d">' + d + '</span>' + HRS.map(function (h, hi) {
        var v = hv(di, hi);
        return '<span class="ayhm__c' + (di === peak[1] && hi === peak[2] ? ' is-peak' : '') + '" data-o="' + (0.06 + v * 0.94).toFixed(2) + '" title="' + d + ' ' + h + ':00 · ' + Math.round(v * 14 * F) + ' leads"></span>';
      }).join('') + '</p>';
    }).join('');
    html += '<div class="ayrow4"><div class="aycard"><p class="aycard__h"><span class="aycard__t">When leads arrive</span><span class="aycard__s">leads by weekday and hour · ' + PER[p] + '</span></p><div class="ayhms">' + heat + '</div>' +
      '<p class="ayhm__lg"><span>Fewer</span><span class="ayhm__scale" aria-hidden="true"><span></span><span></span><span></span><span></span></span><span>More</span><span class="aybar__sp"></span><span class="ayhm__tip">Peak: ' + DAYS[peak[1]] + ' ' + HRS[peak[2]] + ':00 — staff 2 people on chat</span></p></div>' +
      '<div class="aycard"><p class="aycard__h"><span class="aycard__t">Anomalies</span><span class="aycard__s">auto-detected · this week</span></p><ul class="ayals">' + D.alerts.map(function (a) {
        return '<li class="ayal"><span class="aydot aysw--' + a[3] + '" aria-hidden="true"></span><p class="ayal__b"><span class="ayal__t">' + e(a[0]) + '</span><span class="ayal__d">' + e(a[1]) + '</span></p>' +
          (a[5] && !s.dn[a[4]] ? '<a class="ayal__go js-ay"' + act('dn', a[4]) + ' href="' + a[5] + '">' + a[2] + '</a>' : '<button class="ayal__go js-ay"' + act('dn', a[4]) + ' type="button">' + (s.dn[a[4]] ? '✓ Done' : a[2]) + '</button>') + '</li>';
      }).join('') + '</ul></div></div>';
    return html;
  }
  /* ay-render:end */
  function initDealerAnalytics() {
    var box = $('.js-ayroot');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-ay')), s = ayInit();
    function apply() {
      $$('[data-h]', box).forEach(function (el) { el.style.height = el.getAttribute('data-h') + '%'; });
      $$('[data-w]', box).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
      $$('[data-b]', box).forEach(function (el) { el.style.bottom = el.getAttribute('data-b') + '%'; });
      $$('[data-l]', box).forEach(function (el) { el.style.left = el.getAttribute('data-l') + '%'; });
      $$('[data-o]', box).forEach(function (el) { el.style.setProperty('--o', el.getAttribute('data-o')); });
      $$('[data-a]', box).filter(function (el) { return el.hasAttribute('data-f'); }).forEach(function (el) {
        el.style.setProperty('--a', el.getAttribute('data-a') + '%');
        el.style.setProperty('--f', el.getAttribute('data-f') + '%');
      });
    }
    function paint() {
      box.innerHTML = ayHtml(s, D);
      apply();
    }
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('.js-ay');
      if (!b) {
        return;
      }
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v');
      if (a === 'p') {
        s.p = +v;
        s.sb = null;
      } else if (a === 'cmp') {
        s.cmp = !s.cmp;
      } else if (a === 'mt') {
        s.mt = v;
      } else if (a === 'kk') {
        s.kk = v;
        s.mt = { Revenue: 'Revenue', 'Cars sold': 'Cars sold', 'Gross per car': 'Gross profit', 'Lead → sale': 'Leads', 'Avg. days to sell': 'Cars sold' }[v];
      } else if (a === 'sb') {
        s.sb = +v;
      } else if (a === 'fs') {
        s.fs = s.fs === +v ? null : +v;
      } else if (a === 'fsx') {
        s.fs = null;
      } else if (a === 'ts') {
        s.ts = +v;
      } else if (a === 'dn') {
        s.dn[v] = true;
        if (b.tagName === 'A') {
          return;
        }
      } else if (a === 'ex') {
        var link = document.createElement('a');
        link.href = URL.createObjectURL(textPdf(['PACIFIC MOTORS - ANALYTICS REPORT', ['7 days', '30 days', '90 days', '12 months'][s.p] + ' - ' + s.loc, '', $('.ayexec__t', box).textContent.replace(/→/g, '->'), '',
          'Revenue, cars sold, funnel, lead sources and team figures as shown on the page.']));
        link.download = 'pacific-motors-analytics.html';
        document.body.appendChild(link);
        link.click();
        link.remove();
        s.ex = true;
      } else if (a === 'sc' || a === 'ml') {
        s[a] = true;
      }
      paint();
    });
    box.addEventListener('change', function (ev) {
      var f = ev.target.getAttribute('data-f');
      if (f) {
        s[f] = ev.target.value;
        paint();
      }
    });
    apply();
  }

  /* Dealer team (build_dealer_team.py). One pure view function: the builder runs tqInit + tqHtml (between the tq-render
     markers) in Node for the first markup, initDealerTeam re-renders on every change. Bar widths travel as data-w. */
  /* tq-render:start */
  function tqInit(D) {
    return { tb: 'People', sel: D.sel, ss: {}, rl: {}, nt: {}, rf: 'All', pq: '', vw: 'Grid', pm: {}, sv: {}, svd: false, rh: -1, md: 'By specialty', rr: 0,
      ro: {}, lim: 20, fb: 'Next available', si: 0, sh: {}, af: false, ta: {}, io: false, ie: '', ir: 'Sales', inv: [], rv: {}, xx: {}, ex: false };
  }
  function tqMem(s, D) {
    return D.mem.map(function (m) {
      var role = s.rl[m.ini] || m.role, sh = s.sh[m.ini] || {};
      return Object.assign({}, m, { role: role, st: s.ss[m.ini] === undefined ? m.st : s.ss[m.ini], cap: role === 'BDC' ? 30 : role === 'F&I' ? 10 : s.lim, sales: role === 'Sales',
        week: m.week.map(function (w, d) { return sh[d] === undefined ? w : sh[d]; }) });
    });
  }
  function tqHtml(s, D) {
    var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var act = function (a, v) { return ' data-a="' + a + '"' + (v === undefined ? '' : ' data-v="' + e(v) + '"'); };
    var on = function (b) { return b ? ' is-on' : ''; };
    var money = function (n) { return n >= 1e3 ? '$' + Math.round(n / 1e3) + 'k' : '$' + n; };
    var ST = ['Online', 'On test drive', 'Off today', 'On leave', 'Deactivated'];
    var RN = { GM: 'General manager', 'F&I': 'F&I manager', BDC: 'BDC · chat & SMS', Sales: 'Sales', Service: 'Service' };
    var ROLES = ['Owner', 'GM', 'Sales', 'F&I', 'BDC', 'Service'], DAYS = ['Mon 6', 'Tue 7', 'Wed 8', 'Thu 9', 'Fri 10', 'Sat 11', 'Sun 12'];
    var mem = tqMem(s, D), by = function (ini) { return mem.filter(function (m) { return m.ini === ini; })[0]; };
    var av = function (m, size, dot) {
      return '<span class="tqav tqav--' + size + '"><img class="tqav__i" src="assets/img/' + m.img + '" alt="" width="' + m.iw + '" height="' + m.iw + '" decoding="async">' +
        (dot ? '<span class="tqav__dot tqs--' + m.st + '"></span>' : '') + '</span>';
    };
    var lp = function (m) { return m.cap ? m.load / m.cap : 0; };
    var lc = function (p) { return p < 0.6 ? 'ok' : p < 0.85 ? 'amber' : 'acc'; };
    var loadT = function (m) { return m.cap ? m.load + ' / ' + m.cap + (m.role === 'BDC' ? ' chats' : m.role === 'F&I' ? ' apps' : ' leads') : '—'; };
    var meter = function (p, tone, cls) { return '<span class="tqmeter ' + cls + '"><span class="tqmeter__f tqc--' + tone + '" data-w="' + Math.min(100, p * 100).toFixed(1) + '"></span></span>'; };
    var seg = function (list, cur, a, cls) {
      return '<span class="tqseg ' + cls + '">' + list.map(function (t) {
        var v = Array.isArray(t) ? t[0] : t, l = Array.isArray(t) ? t[1] : t;
        return '<button class="tqseg__b' + on(v === cur) + ' js-tq"' + act(a, v) + ' type="button" aria-pressed="' + (v === cur) + '">' + e(l) + '</button>';
      }).join('') + '</span>';
    };
    var box = function (t, sub, body, cls) { return '<div class="tqbox' + (cls ? ' ' + cls : '') + '"><p class="tqbox__h"><span class="tqbox__t">' + e(t) + '</span><span class="tqbox__s">' + e(sub) + '</span></p>' + body + '</div>'; };

    /* permissions, routing and coverage feed the tab badges, so they are worked out first */
    var def = function (ri, ci) { return !!D.perms[ri][2][ci]; };
    var saved = function (key, ri, ci) { return s.sv[key] === undefined ? def(ri, ci) : s.sv[key]; };
    var chg = Object.keys(s.pm).filter(function (key) { var p = key.split('-').map(Number); return s.pm[key] !== saved(key, p[0], p[1]); }).length;
    var rulesOff = Object.keys(s.ro).filter(function (k) { return s.ro[k]; }).length;
    var cov = DAYS.map(function (x, di) { return mem.filter(function (m) { return m.sales && m.week[di] !== 'Off'; }).length; });
    var free = function (di) { return mem.some(function (m) { return m.sales && m.week[di] === 'Off' && m.st !== 3; }); };
    var gaps = D.dem.map(function (n, i) { return cov[i] < n; }), nGap = gaps.filter(Boolean).length;
    var pend = D.pend0.concat(s.inv).filter(function (i) { return !s.xx[i[0]]; });

    var html = '<div class="tqtop">' + [['Team members', String(mem.filter(function (m) { return m.st !== 4; }).length), pend.length ? '+ ' + pend.length + ' invited' : 'No open invites', 'mute'],
      ['Online now', String(mem.filter(function (m) { return m.st === 0; }).length), 'of ' + mem.length, 'ok'], ['Seats on plan', mem.length + ' of 10', (10 - mem.length) + ' free', 'mute'],
      ['Avg. first reply', '6 min', '▼ 2 vs Sep', 'ok']].map(function (k) {
      return '<div class="tqkpi"><p class="tqkpi__k">' + k[0] + '</p><p class="tqkpi__r"><span class="tqkpi__v">' + k[1] + '</span><span class="tqkpi__d tqv--' + k[3] + '">' + k[2] + '</span></p></div>';
    }).join('') + '<div class="tqtop__b"><button class="tqtop__inv js-tq"' + act('inv') + ' type="button" aria-expanded="' + s.io + '">+ Invite member</button>' +
      '<button class="tqtop__exp js-tq"' + act('exp') + ' type="button">' + (s.ex ? '✓ Roster exported' : 'Export roster') + '</button></div></div>';
    if (s.io) {
      html += '<form class="tqform js-tqform"><label class="tqform__t" for="tq-ie">Invite to Pacific Motors</label><input class="tqform__in" id="tq-ie" type="email" data-f="ie" value="' + e(s.ie) +
        '" placeholder="name@pacificmotors.com" autocomplete="off">' + seg(['GM', 'Sales', ['F&I', 'F&I'], 'BDC', 'Service'], s.ir, 'ir', 'tqseg--pg') +
        '<button class="tqform__go" type="submit">Send invite</button></form>';
    }
    if (pend.length) {
      html += '<ul class="tqpend">' + pend.map(function (i) {
        return '<li class="tqpi"><span class="tqpi__e">' + e(i[0]) + '</span><span class="tqpi__r">' + e(i[1]) + '</span><span class="tqpi__w">' + e(i[2]) + '</span>' +
          '<button class="tqpi__rs js-tq"' + act('resend', i[0]) + ' type="button">' + (s.rv[i[0]] ? '✓ Resent' : 'Resend') + '</button><button class="tqpi__x js-tq"' + act('revoke', i[0]) + ' type="button">Revoke</button></li>';
      }).join('') + '</ul>';
    }
    html += '<div class="tqtabs" role="group" aria-label="Team sections">' + [['People', String(mem.length), 'n'], ['Roles & permissions', chg ? chg + ' unsaved' : '', 'amber'],
      ['Lead routing', rulesOff ? rulesOff + ' rule off' : '', 'n'], ['Schedule', nGap ? nGap + (nGap === 1 ? ' gap' : ' gaps') : '', 'acc']].map(function (t) {
      return '<button class="tqtab' + on(s.tb === t[0]) + ' js-tq"' + act('tb', t[0]) + ' type="button" aria-pressed="' + (s.tb === t[0]) + '">' + e(t[0]) +
        (t[1] ? '<span class="tqtab__b tqb--' + t[2] + '">' + t[1] + '</span>' : '') + '</button>';
    }).join('') + '</div>';

    if (s.tb === 'People') {
      var pq = s.pq.toLowerCase();
      var pmem = mem.filter(function (m) { return s.rf === 'All' || m.role === s.rf; }).filter(function (m) { return !pq || (m.n + ' ' + m.tags.join(' ') + ' ' + m.tags.join(' ').replace(/\bEN\b/g, 'English').replace(/\bES\b/g, 'Spanish').replace(/\bKO\b/g, 'Korean')).toLowerCase().indexOf(pq) > -1; });
      html += '<div class="tqbar">' + seg(['All', 'Sales', 'F&I', 'BDC', 'GM'].map(function (t) {
        return [t, t + ' ' + (t === 'All' ? mem.length : mem.filter(function (m) { return m.role === t; }).length)];
      }), s.rf, 'rf', 'tqseg--sf') + '<label class="tqsearch"><svg class="tqsearch__i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>' +
        '<span class="sr-only">Search the team</span><input class="tqsearch__in" type="search" data-f="pq" value="' + e(s.pq) + '" placeholder="Search name, make or language"></label>' +
        '<span class="tqbar__sp"></span>' + seg(['Grid', 'Org chart'], s.vw, 'vw', 'tqseg--sf') + '</div>';
      if (s.vw === 'Grid') {
        html += '<div class="tqgrid">' + pmem.map(function (m) {
          var p = lp(m);
          return '<button class="tqcard' + on(m.ini === s.sel) + (m.st === 4 ? ' is-off' : '') + ' js-tq"' + act('sel', m.ini) + ' type="button" aria-pressed="' + (m.ini === s.sel) + '">' +
            '<span class="tqcard__h">' + av(m, 56, true) + '<span class="tqcard__nm"><span class="tqcard__n">' + e(m.n) + '</span><span class="tqcard__r">' + e(RN[m.role]) + '</span></span></span>' +
            '<span class="tqpill tqs--' + m.st + '">' + ST[m.st] + '</span>' +
            '<span class="tqload"><span class="tqload__t"><span>Workload</span><span>' + loadT(m) + '</span></span>' + meter(p, lc(p), 'tqmeter--6') + '</span>' +
            '<span class="tqcard__s">' + [['Deals', m.sales ? String(m.deals) : '—', ''], ['Gross', m.gross ? money(m.gross) : '—', ''],
              ['Reply', m.rep ? m.rep + ' min' : '—', !m.rep ? 'mute' : m.rep <= 5 ? 'ok' : m.rep <= 10 ? '' : 'acc']].map(function (x) {
              return '<span class="tqcard__k"><span class="tqcard__kl">' + x[0] + '</span><span class="tqcard__kv' + (x[2] ? ' tqv--' + x[2] : '') + '">' + x[1] + '</span></span>';
            }).join('') + '</span></button>';
        }).join('') + (pmem.length ? '' : '<p class="tqempty">Nobody matches “' + e(s.pq) + '”.</p>') + '</div>';
      } else {
        var gm = mem.filter(function (m) { return m.role === 'GM'; })[0] || mem[0];
        html += '<div class="tqorg"><button class="tqorg__gm js-tq"' + act('sel', gm.ini) + ' type="button">' + av(gm, 46, false) +
          '<span class="tqorg__b"><span class="tqorg__n">' + e(gm.n) + '</span><span class="tqorg__r">General manager</span></span></button>' +
          '<span class="tqorg__v" aria-hidden="true"></span><span class="tqorg__hz" aria-hidden="true"></span><div class="tqorg__cols">' + ['Sales', 'F&I', 'BDC'].map(function (g) {
          var it = mem.filter(function (m) { return m.role === g; });
          return '<div class="tqorg__col"><span class="tqorg__v tqorg__v--s" aria-hidden="true"></span><span class="tqorg__pill">' + e(g) + ' · ' + it.length + '</span><div class="tqorg__list">' + it.map(function (m) {
            var p = lp(m);
            return '<button class="tqorow' + on(m.ini === s.sel) + ' js-tq"' + act('sel', m.ini) + ' type="button" aria-pressed="' + (m.ini === s.sel) + '">' + av(m, 40, true) +
              '<span class="tqorow__b"><span class="tqorow__n">' + e(m.n) + '</span><span class="tqorow__s">' + e(m.tags.slice(0, 2).join(', ')) + '</span></span>' +
              '<span class="tqorow__l"><span class="tqorow__lt">' + loadT(m) + '</span>' + meter(p, lc(p), 'tqmeter--5') + '</span></button>';
          }).join('') + '</div></div>';
        }).join('') + '</div></div>';
      }
      var d = by(s.sel);
      if (d) {
        var dg = d.tD ? d.deals / d.tD : 0, gg = d.tG ? d.gross / d.tG : 0, pace = d.tD ? d.deals / 6 * 31 / d.tD : 1, fc = Math.round(d.deals / 6 * 31);
        var goals = d.tD ? [['Cars sold', d.deals + ' of ' + d.tD, dg], ['Gross', money(d.gross) + ' of ' + money(d.tG), gg]] : [['Applications closed', '6 of 10', 0.6], ['F&I income', '$18k of $25k', 0.74]];
        html += '<div class="tqpro"><div class="tqpro__h">' + av(d, 72, true) + '<div class="tqpro__b"><h2 class="tqpro__n">' + e(d.n) + '</h2><p class="tqpro__r">' + e(RN[d.role]) + ' · Melrose showroom</p>' +
          '<p class="tqpro__c">' + d.n.split(' ')[0].toLowerCase() + '@pacificmotors.com · +1 310 555 01' + (10 + d.ini.charCodeAt(0) % 80) + '</p></div>' +
          '<button class="tqpill tqpill--btn tqs--' + d.st + ' js-tq"' + act('cycle') + ' type="button" aria-label="Status: ' + ST[d.st] + '. Change status">' + ST[d.st] + ' ▾</button></div>' +
          '<ul class="tqtags">' + d.tags.map(function (t) { return '<li>' + e(t) + '</li>'; }).join('') + '</ul>' +
          '<div class="tqtg"><p class="tqtg__h"><span class="tqtg__k">October target</span><span class="tqv--' + (pace >= 1 ? 'ok' : 'acc') + '">' +
          (d.tD ? (pace >= 1 ? 'On pace for ' + fc + ' cars' : 'Behind · forecast ' + fc + ' cars') : 'Day 6 of 31') + '</span></p>' + goals.map(function (g) {
          return '<div class="tqtg__g"><p class="tqtg__gt"><span>' + g[0] + '</span><span>' + g[1] + '</span></p>' + meter(g[2], d.tD ? (g[2] >= 0.5 ? 'ok' : g[2] >= 0.25 ? 'amber' : 'acc') : 'ok', 'tqmeter--8') + '</div>';
        }).join('') + '<p class="tqtg__c"><span>Commission forecast</span><span class="tqtg__cv">' + money(Math.round(d.gross * 0.18 + (pace >= 1 ? 1500 : 0))) + '</span></p></div>' +
          '<div class="tqwork">' + [['Active leads', d.load, 'dealer-leads.html'], ['Test drives · week', d.sales ? Math.max(1, d.deals + 3) : 0, 'dealer-test-drives.html'],
            ['Open deals', d.sales ? Math.max(0, d.deals - 1) : 0, 'dealer-deals.html']].map(function (w) {
            return '<a class="tqwork__i" href="' + w[2] + '"><span class="tqwork__k">' + w[0] + '</span><span class="tqwork__v">' + w[1] + '</span></a>';
          }).join('') + '</div>' +
          '<div class="tqwk"><p class="tqwk__t">This week</p><ul class="tqwk__d">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x, i) {
            return '<li class="' + (d.week[i] === 'Off' ? 'is-off' : i === 1 ? 'is-today' : '') + '"><span class="tqwk__dd">' + x + '</span><span>' + d.week[i] + '</span></li>';
          }).join('') + '</ul></div>' +
          '<div class="tqlog"><p class="tqlog__t">Recent activity · audit log</p><ul class="tqlog__l">' + D.log.map(function (l) {
            return '<li><span>' + e(l[0]) + '</span><span class="tqlog__w">' + l[1] + '</span></li>';
          }).join('') + '</ul></div>' +
          '<div class="tqrole"><p class="tqrole__t">Role</p>' + seg(['GM', 'Sales', 'F&I', 'BDC', 'Service'], d.role, 'role', 'tqseg--pg tqseg--fill') + '</div>' +
          (s.nt[d.ini] ? '<p class="tqnote" role="status">' + e(s.nt[d.ini]) + '</p>' : '') +
          '<div class="tqacts"><button class="tqacts__b js-tq"' + act('hand') + ' type="button">Hand over clients</button><button class="tqacts__b js-tq"' + act('msg') + ' type="button">Message</button>' +
          '<button class="tqacts__b tqv--' + (d.st === 4 ? 'ok' : 'acc') + ' js-tq"' + act('deact') + ' type="button">' + (d.st === 4 ? 'Reactivate' : 'Deactivate') + '</button></div></div>';
      }
    }

    if (s.tb === 'Roles & permissions') {
      html += '<div class="tqroles"><div class="tqroles__l">' + ROLES.map(function (r, ci) {
        var cnt = D.perms.filter(function (p, ri) { var k = ri + '-' + ci; return ci === 0 || (s.pm[k] === undefined ? def(ri, ci) : s.pm[k]); }).length;
        var who = r === 'Owner' ? '<span class="tqyou">YOU</span>' : mem.filter(function (m) { return m.role === r; }).slice(0, 5).map(function (m) { return av(m, 28, false); }).join('');
        return '<button class="tqpre' + on(s.rh === ci) + ' js-tq"' + act('rh', ci) + ' type="button" aria-pressed="' + (s.rh === ci) + '"><span class="tqpre__h"><span class="tqpre__t">' + e(r) + '</span><span class="tqpre__n">' + cnt + ' of 8 permissions</span></span>' +
          '<span class="tqpre__d">' + e(D.rd[r]) + '</span>' + (who ? '<span class="tqpre__w">' + who + '</span>' : '') + '</button>';
      }).join('') + '</div><div class="tqroles__r">' +
        (chg ? '<div class="tqunsv"><span class="tqunsv__dot" aria-hidden="true"></span><span class="tqunsv__t">' + chg + (chg === 1 ? ' permission changed' : ' permissions changed') + ' · highlighted in amber</span>' +
          '<button class="tqunsv__x js-tq"' + act('discard') + ' type="button">Discard</button><button class="tqunsv__go js-tq"' + act('save') + ' type="button">Save changes</button></div>' : '') +
        (s.svd && !chg ? '<p class="tqnote" role="status">Saved · ' + e(D.gm) + ' and affected members were notified</p>' : '') +
        box('Roles & permissions', 'click a cell to toggle', '<div class="tqmx"><div class="tqmx__in"><p class="tqmx__h"><span>Permission</span>' + ROLES.map(function (r) {
          return '<span class="tqmx__c"><span class="tqmx__ct">' + e(r) + '</span><span>' + (r === 'Owner' ? '1 · you' : mem.filter(function (m) { return m.role === r; }).length) + '</span></span>';
        }).join('') + '</p>' + D.perms.map(function (p, ri) {
          return '<div class="tqmx__r"><p class="tqmx__p"><span class="tqmx__pt">' + e(p[0]) + '</span><span class="tqmx__pd">' + e(p[1]) + '</span></p>' + ROLES.map(function (r, ci) {
            var key = ri + '-' + ci, lock = ci === 0, v = lock || (s.pm[key] === undefined ? def(ri, ci) : s.pm[key]);
            var changed = !lock && s.pm[key] !== undefined && s.pm[key] !== saved(key, ri, ci);
            return '<button class="tqcell' + on(v) + (lock ? ' is-lock' : '') + (changed ? ' is-chg' : s.rh === ci ? ' is-hl' : '') + (lock ? '' : ' js-tq') + '"' + (lock ? ' disabled' : act('cell', key)) +
              ' type="button" title="' + e(r + ' · ' + p[0]) + '" aria-label="' + e(r + ' · ' + p[0]) + '" aria-pressed="' + v + '">' + (v ? '✓' : '—') + '</button>';
          }).join('') + '</div>';
        }).join('') + '</div></div><p class="tqmx__n">Owner always has every permission · changes apply on next sign-in</p>') + '</div></div>';
    }

    if (s.tb === 'Lead routing') {
      var avail = mem.filter(function (m) { return m.sales && m.st <= 1 && m.load < m.cap; });
      var nx = s.md === 'By workload' ? avail.slice().sort(function (x, y) { return x.load / x.cap - y.load / y.cap; })[0] : s.md === 'Round robin' ? avail[s.rr % Math.max(1, avail.length)] : by(D.specNext);
      var why = !nx ? '' : s.md === 'By workload' ? '· lowest load (' + nx.load + '/' + nx.cap + ')' : s.md === 'Round robin' ? '· next in rotation' : '· Tesla / Audi enquiry · speaks Korean';
      var smp = D.samples[s.si], hit = null, who = null;
      smp[3].forEach(function (ri) {
        var rule = D.rules[ri];
        if (who || s.ro[rule[0]]) {
          return;
        }
        var cand = rule[1].map(by).filter(function (m) { return m.st <= 1 && m.load < m.cap; })[0];
        if (cand) {
          hit = rule[0];
          who = cand;
        } else if (!hit) {
          hit = rule[0] + ' (nobody available)';
        }
      });
      if (!who) {
        who = avail.slice().sort(function (a, b) { return a.load / a.cap - b.load / b.cap; })[0];
      }
      var path = [['Rule', hit || 'No rule matched', hit && hit.indexOf('nobody') < 0 ? 'ok' : 'amber'], ['Availability', who ? ST[who.st] : 'Nobody online', who ? 'ok' : 'acc'],
        ['Workload', who ? who.load + ' / ' + who.cap + ' leads' : '—', who && who.load / who.cap < 0.85 ? 'ok' : 'amber'], ['Assigned', who ? who.n + ' · reply in 15 min' : 'Fallback: ' + s.fb, 'acc']];
      html += '<div class="tqrt">' + box('Lead routing', 'applies to all new leads', '<div class="tqrt__m"><p class="tqrt__k">How new leads are assigned</p>' + seg(['Round robin', 'By workload', 'By specialty'], s.md, 'md', 'tqseg--pg tqseg--fill tqseg--lg') +
        '<p class="tqrt__d">' + D.modes[s.md] + '</p></div>' +
        (s.md === 'By specialty' ? '<ul class="tqrules">' + D.rules.map(function (r) {
          var off = !!s.ro[r[0]];
          return '<li class="tqrule' + (off ? ' is-off' : '') + '"><span>' + e(r[0]) + '</span><span class="tqrule__ar" aria-hidden="true">→</span><span class="tqrule__w">' + r[1].map(function (i) { return av(by(i), 30, false); }).join('') + '</span>' +
            '<button class="tqsw' + (off ? '' : ' is-on') + ' js-tq"' + act('rule', r[0]) + ' type="button" role="switch" aria-checked="' + !off + '" aria-label="' + e(r[0]) + '"><span class="tqsw__k"></span></button></li>';
        }).join('') + '</ul>' : '') +
        '<div class="tqset"><div class="tqset__i tqset__i--row"><p class="tqset__b"><span class="tqset__k">Max active leads</span><span class="tqset__v">' + s.lim + ' per person</span></p>' +
        '<button class="tqstep js-tq"' + act('lim', -1) + ' type="button" aria-label="Fewer leads per person"' + (s.lim <= 5 ? ' disabled' : '') + '>−</button><button class="tqstep js-tq"' + act('lim', 1) + ' type="button" aria-label="More leads per person"' + (s.lim >= 40 ? ' disabled' : '') + '>+</button></div>' +
        '<div class="tqset__i"><p class="tqset__k">No reply in 15 min → reassign to</p>' + seg(['Next available', 'Sales manager', 'BDC'], s.fb, 'fb', 'tqseg--sf tqseg--fill tqseg--sm') + '</div></div>' +
        '<p class="tqnext"><span class="tqnext__k">Next lead goes to</span>' + (nx ? av(nx, 34, false) + '<span class="tqnext__n">' + e(nx.n) + '</span><span class="tqnext__w">' + e(why) + '</span>' : '<span class="tqnext__n">Nobody available</span>') + '</p>') +
        box('Current load', 'active leads vs limit', '<ul class="tqld">' + mem.map(function (m) {
          var p = lp(m);
          return '<li class="tqld__i">' + av(m, 36, false) + '<span class="tqld__b"><span class="tqld__h"><span>' + e(m.n) + '</span><span class="tqv--s' + m.st + '">' + ST[m.st] + '</span></span>' + meter(p, lc(p), 'tqmeter--8') + '</span><span class="tqld__v">' + loadT(m) + '</span></li>';
        }).join('') + '</ul>') + '</div>' +
        box('Test the routing', 'pick a sample lead', '<div class="tqsmp">' + D.samples.map(function (o, i) {
          return '<button class="tqsmp__b' + on(s.si === i) + ' js-tq"' + act('si', i) + ' type="button" aria-pressed="' + (s.si === i) + '"><span class="tqsmp__t">' + e(o[0] + ' · ' + o[1]) + '</span><span class="tqsmp__m">' + e(o[2]) + '</span></button>';
        }).join('') + '</div><ol class="tqpath">' + path.map(function (p, i) {
          return '<li class="tqpath__s' + (i === 3 ? ' is-end' : '') + '"><span class="tqpath__k"><span class="tqpath__i tqc--' + p[2] + '">' + (i + 1) + '</span>' + p[0] + '</span><span class="tqpath__v">' + e(p[1]) + '</span></li>';
        }).join('') + '</ol>', 'tqtest');
    }

    if (s.tb === 'Schedule') {
      var stuck = DAYS.filter(function (x, i) { return gaps[i] && !free(i); }), canFill = gaps.some(function (g, i) { return g && free(i); });
      var short = D.dem.reduce(function (a, n, i) { return a + (gaps[i] ? n - cov[i] : 0); }, 0);
      var covT = canFill ? 'Understaffed on ' + DAYS.filter(function (x, i) { return gaps[i]; }).join(', ') + ' vs lead demand' :
        nGap ? (s.af ? '✓ Filled what we could · ' : '') + stuck.join(', ') + ' still short by ' + short + ' — every salesperson is already on shift · approve overtime or add a part-timer' :
          (s.af ? '✓ Gaps filled · staff notified by SMS' : 'All days covered for expected lead volume');
      var grid = function (cls, head, cells) { return '<div class="tqsg' + (cls ? ' ' + cls : '') + '">' + head + cells + '</div>'; };
      var pendT = D.timeoff.filter(function (r) { return !s.ta[r[0]]; }).length;
      html += '<div class="tqsc">' + box('Weekly schedule', 'click a cell to change the shift', '<div class="tqsc__w"><div class="tqsc__in">' +
        grid('tqsg--days', '<span></span>', DAYS.map(function (t, i) { return '<span class="tqsg__d' + (i === 5 ? ' tqv--acc' : '') + '">' + t + '</span>'; }).join('')) +
        mem.filter(function (m) { return m.role !== 'GM'; }).map(function (m) {
          return grid('', '<span class="tqsg__m">' + av(m, 32, false) + '<span class="tqsg__n">' + e(m.n) + '</span></span>', m.week.map(function (w, di) {
            return '<button class="tqsh' + (w === 'Off' ? ' is-off' : '') + ' js-tq"' + act('shift', m.ini + '-' + di) + ' type="button" aria-label="' + e(m.n + ' · ' + DAYS[di] + ': ' + w) + '">' + w + '</button>';
          }).join(''));
        }).join('') +
        grid('tqsg--cov', '<span class="tqsg__k">Sales on floor</span>', cov.map(function (n, i) { return '<span class="tqsg__c' + (i === 5 && n < 4 ? ' tqv--acc' : n <= 1 ? ' tqv--amber' : '') + '">' + n + '</span>'; }).join('')) +
        grid('', '<span class="tqsg__k">Needed (from lead heatmap)</span>', D.dem.map(function (n, i) { return '<span class="tqsg__dm"><span class="tqdem' + (gaps[i] ? ' is-short' : '') + '">' + cov[i] + ' / ' + n + '</span></span>'; }).join('')) +
        '</div></div><p class="tqsc__st"><span class="tqsc__t tqv--' + (nGap ? 'acc' : 'ok') + '" role="status">' + covT + '</span>' +
        (canFill ? '<button class="tqsc__go js-tq"' + act('auto') + ' type="button">✦ Auto-fill gaps</button>' : '') + '</p>') +
        box('Time-off requests', pendT + ' pending', '<ul class="tqto">' + D.timeoff.map(function (r) {
          var m = by(r[0]), st = s.ta[r[0]], imp = r[3];
          return '<li class="tqto__i"><p class="tqto__h">' + av(m, 36, false) + '<span class="tqto__b"><span class="tqto__n">' + e(m.n) + '</span><span class="tqto__w">' + e(r[1] + ' · ' + r[2]) + '</span></span>' +
            '<span class="tqpill tqt--' + (st || 'wait') + '">' + (st === 'ok' ? 'Approved' : st === 'no' ? 'Declined' : 'Pending') + '</span></p>' +
            '<p class="tqto__imp tqv--' + (imp.indexOf('No') === 0 || imp.indexOf('covered') > -1 ? 'body' : 'acc') + '">' + e(imp) + '</p>' +
            (st ? '' : '<p class="tqto__a"><button class="tqto__ok js-tq"' + act('ta', r[0] + '-ok') + ' type="button">Approve</button><button class="tqto__no js-tq"' + act('ta', r[0] + '-no') + ' type="button">Decline</button></p>') + '</li>';
        }).join('') + '</ul>', 'tqbox--to') + '</div>';
    }
    return html;
  }
  /* tq-render:end */
  function initDealerTeam() {
    var box = $('.js-tqroot');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-tq')), s = tqInit(D);
    function sizes() {
      $$('[data-w]', box).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
    }
    function paint() {
      var f = document.activeElement && box.contains(document.activeElement) ? document.activeElement.getAttribute('data-f') : null;
      var caret = f ? document.activeElement.selectionStart : 0;
      box.innerHTML = tqHtml(s, D);
      sizes();
      if (f) {
        var el = $('[data-f="' + f + '"]', box);
        if (el) {
          el.focus();
          try {
            el.setSelectionRange(caret, caret);
          } catch (err) {
            // type="email" has no selection API
          }
        }
      }
    }
    function roster() {
      // In production the roster comes from the members API; here it is the page's own list.
      var rows = [['Name', 'Role', 'Status', 'Active leads', 'Deals (Oct)', 'Gross (Oct)', 'First reply (min)', 'Specialties']].concat(tqMem(s, D).map(function (m) {
        return [m.n, m.role, ['Online', 'On test drive', 'Off today', 'On leave', 'Deactivated'][m.st], m.load, m.deals, m.gross, m.rep, m.tags.join(' / ')];
      }));
      var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'pacific-motors-team.csv';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }
    function autofill() {
      var mem = tqMem(s, D);
      D.dem.forEach(function (need, di) {
        var have = mem.filter(function (m) { return m.sales && m.week[di] !== 'Off'; }).length;
        mem.filter(function (m) { return m.sales && m.week[di] === 'Off' && m.st !== 3; }).forEach(function (m) {
          if (have < need) {
            s.sh[m.ini] = s.sh[m.ini] || {};
            s.sh[m.ini][di] = '10–7';
            have++;
          }
        });
      });
      s.af = true;
    }
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('.js-tq');
      if (!b) {
        return;
      }
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), d = tqMem(s, D).filter(function (m) { return m.ini === s.sel; })[0];
      if (['tb', 'rf', 'vw', 'fb', 'ir', 'sel'].indexOf(a) > -1) {
        s[a] = v;
      } else if (a === 'md') {
        s.md = v;
        s.rr++;
      } else if (a === 'cycle') {
        s.ss[d.ini] = (d.st + 1) % 4;
      } else if (a === 'role') {
        s.rl[d.ini] = v;
      } else if (a === 'hand') {
        s.nt[d.ini] = d.load + ' active leads handed over to ' + (d.ini === 'CL' ? 'Mateo Reyes' : 'Cole Lee') + ' · customers notified';
      } else if (a === 'msg') {
        s.nt[d.ini] = 'Message sent to ' + d.n.split(' ')[0] + ' in team chat';
      } else if (a === 'deact') {
        s.ss[d.ini] = d.st === 4 ? 0 : 4;
      } else if (a === 'cell') {
        var p = v.split('-').map(Number), cur = s.pm[v] === undefined ? !!D.perms[p[0]][2][p[1]] : s.pm[v];
        s.pm[v] = !cur;
        s.svd = false;
      } else if (a === 'rh') {
        s.rh = s.rh === +v ? -1 : +v;
      } else if (a === 'save') {
        s.sv = Object.assign({}, s.pm);
        s.svd = true;
      } else if (a === 'discard') {
        s.pm = Object.assign({}, s.sv);
      } else if (a === 'rule') {
        s.ro[v] = !s.ro[v];
      } else if (a === 'lim') {
        s.lim = Math.min(40, Math.max(5, s.lim + +v));
      } else if (a === 'si') {
        s.si = +v;
      } else if (a === 'shift') {
        var q = v.split('-'), SH = ['9–6', '10–7', '12–9', 'Off'], m = tqMem(s, D).filter(function (x) { return x.ini === q[0]; })[0];
        s.sh[q[0]] = s.sh[q[0]] || {};
        s.sh[q[0]][q[1]] = SH[(SH.indexOf(m.week[+q[1]]) + 1) % SH.length];
      } else if (a === 'auto') {
        autofill();
      } else if (a === 'ta') {
        var t = v.split('-');
        s.ta[t[0]] = t[1];
      } else if (a === 'inv') {
        s.io = !s.io;
      } else if (a === 'resend') {
        s.rv[v] = true;
      } else if (a === 'revoke') {
        s.xx[v] = true;
      } else if (a === 'exp') {
        roster();
        s.ex = true;
      }
      paint();
      if (a === 'inv' && s.io) {
        $('[data-f="ie"]', box).focus();
      }
    });
    box.addEventListener('submit', function (ev) {
      ev.preventDefault();
      // In production POST the invite to the members API; it sends the email and returns the pending row.
      var em = s.ie.trim() || 'new.member@pacificmotors.com';
      s.inv.push([em, s.ir, 'Sent just now']);
      s.xx[em] = false;
      s.rv[em] = false;
      s.io = false;
      s.ie = '';
      paint();
    });
    box.addEventListener('input', function (ev) {
      var f = ev.target.getAttribute('data-f');
      if (f === 'ie') {
        s.ie = ev.target.value;
      } else if (f === 'pq') {
        s.pq = ev.target.value;
        paint();
      }
    });
    sizes();
  }

  /* Dealership profile (build_dealer_profile.py). One pure view function: the builder runs pzInit + pzHtml (between the
     pz-render markers) in Node for the first markup, initDealerProfile re-renders on every change. Bar widths travel as
     data-w, strength segments as data-g (flex-grow). */
  /* pz-render:start */
  function pzInit() {
    // u holds only what the dealer changed; everything else falls back to the data defaults
    return { u: {}, ex: 'media', dv: 'Mobile', pbk: {}, cp: false, lc: false };
  }
  function pzModel(s, D) {
    var u = s.u, v = function (k, d) { return u[k] === undefined ? d : u[k]; };
    var m = { name: v('nm', D.name), tag: v('tg', D.tag), year: v('yr', D.year), tone: v('tn', 'Warm'), mk: v('mk', D.mk0), lg: v('lg', D.lg0), gl: v('gl', D.gl0), vd: !!u.vd,
      br: v('br', 0), sv: v('sv', D.sv0), po: v('po', {}), fc: v('fc', D.fc0), fr: v('fr', D.fr0) };
    m.about = v('ab', D.ab.Warm);
    m.hrs = D.days.map(function (x, i) { return (u.hr || {})[i] === undefined ? D.h0[i] : u.hr[i]; });
    m.nG = D.gal.filter(function (x, i) { return m.gl[i]; }).length;
    m.nS = D.sv.filter(function (x, i) { return m.sv[i]; }).length;
    m.nL = D.langs.filter(function (x) { return m.lg[x]; }).length;
    m.Q = { basic: 10 + (m.tag.length > 10 ? 5 : 0), about: (m.about.length >= 120 ? 15 : 6) + (m.nL >= 2 ? 5 : 0), loc: m.hrs.some(function (h) { return h !== 'Closed'; }) ? 10 : 0,
      media: Math.min(15, m.nG * 3) + (m.gl[0] ? 10 : 0) + (m.vd ? 12 : 0), serv: m.nS >= 4 ? 10 : m.nS * 2, show: (m.fr.length >= 2 ? 8 : 4 * m.fr.length) + (m.fc.length >= 3 ? 5 : 0) };
    m.q = Math.round(Object.keys(m.Q).reduce(function (a, k) { return a + m.Q[k]; }, 0));
    m.done = function (k) { return m.Q[k] >= D.qm[k] * 0.8; };
    m.chg = D.chk.filter(function (c) { return u[c[0]] !== undefined && JSON.stringify(u[c[0]]) !== s.pbk[c[0]]; }).map(function (c) { return c[1]; });
    return m;
  }
  function pzHtml(s, D) {
    var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var act = function (a, v) { return ' data-a="' + a + '"' + (v === undefined ? '' : ' data-v="' + e(v) + '"'); };
    var on = function (b) { return b ? ' is-on' : ''; };
    var img = function (p, cls) { return '<img class="' + cls + '" src="assets/img/' + p[0] + '" alt="" width="' + p[1] + '" height="' + p[2] + '" loading="lazy" decoding="async">'; };
    var stars = function (n) { return '<span class="pzstars" role="img" aria-label="' + n + ' of 5 stars">' + '★★★★★'.slice(0, n) + '<span class="pzstars__off">' + '★★★★★'.slice(n) + '</span></span>'; };
    var m = pzModel(s, D), q = m.q, ZN = { basic: 'Basics', about: 'About', loc: 'Hours', media: 'Photos', serv: 'Services', show: 'Showcase' };
    var chip = function (t, a, v, sel) { return '<button class="pzchip' + on(sel) + ' js-pz"' + act(a, v) + ' type="button" aria-pressed="' + sel + '">' + (sel ? '✓ ' : '+ ') + e(t) + '</button>'; };
    var hints = [];
    if (!m.vd) {
      hints.push(['vid', 'Upload video', '+12']);
    }
    if (m.nG < 5) {
      hints.push(['photos', 'Add photos', '+' + (15 - m.nG * 3)]);
    }
    if (m.about.length < 120) {
      hints.push(['about', 'Generate', '+9']);
    }
    if (m.fr.length < 2) {
      hints.push(['reviews', 'Pick reviews', '+4']);
    }
    var all = D.ben.concat([['You · ' + m.name, q, 1]]).sort(function (a, b) { return b[1] - a[1]; });
    var rank = all.map(function (x) { return x[2]; }).indexOf(1) + 1, nC = m.chg.length;
    var pubT = nC ? 'Publish ' + nC + (nC === 1 ? ' change' : ' changes') : '✓ Published · live on Avava';
    var mks = D.makes.filter(function (x) { return m.mk[x]; }), svOn = D.sv.filter(function (x, i) { return m.sv[i]; }).map(function (x) { return x[0]; });
    var cars = m.fc.map(function (i) { return D.fc[i]; });

    var html = '<div class="pzhero"><p class="pzhero__q"><span class="pzhero__k">Profile strength</span><span class="pzhero__v">' + q + '%</span></p>' +
      '<div class="pzhero__m"><div class="pzseg">' + Object.keys(D.qm).map(function (k) {
        return '<p class="pzseg__i" data-g="' + D.qm[k] + '"><span class="pzseg__b pzseg--' + (m.done(k) ? 'ok' : m.Q[k] > 0 ? 'part' : 'none') + '"></span><span class="pzseg__t">' + ZN[k] + ' ' + m.Q[k] + '/' + D.qm[k] + '</span></p>';
      }).join('') + '</div>' + (hints.length ? '<p class="pzhints">' + hints.map(function (h) {
        return '<button class="pzhint js-pz"' + act('hint', h[0]) + ' type="button">' + h[1] + ' · ' + h[2] + ' pts</button>';
      }).join('') + '</p>' : '<p class="pzhints pzhints--done">Nothing left to fix — every section is complete.</p>') + '</div>' +
      '<p class="pzhero__a"><a class="pzhero__live" href="listing-v1.html">View live storefront</a><button class="pzhero__pub' + (nC ? '' : ' is-done') + ' js-pz"' + act('pub') + ' type="button">' + pubT + '</button></p></div>';

    html += '<div class="pzins"><div class="pzcard"><p class="pzcard__h"><span class="pzcard__t">You vs dealers nearby</span><span class="pzcard__s">profile strength · 10 mi</span>' +
      '<span class="pzrank pzrank--' + (rank <= 2 ? 'ok' : 'amber') + '">#' + rank + ' of ' + all.length + '</span></p><ul class="pzben">' + all.map(function (b) {
        return '<li class="pzben__i' + (b[2] ? ' is-me' : '') + '"><span class="pzben__n">' + e(b[0]) + '</span><span class="pzben__bar"><span class="pzben__f" data-w="' + b[1] + '"></span></span><span class="pzben__v">' + b[1] + '%</span></li>';
      }).join('') + '</ul></div>' +
      '<div class="pzcard"><p class="pzcard__h"><span class="pzcard__t">Storefront · 30 days</span><span class="pzcard__s pzv--ok">▲ 18% vs Sep</span></p><ul class="pzsf">' + D.sf.map(function (x) {
        return '<li class="pzsf__i"><span class="pzsf__k">' + x[0] + '</span><span class="pzsf__v">' + x[1] + '</span></li>';
      }).join('') + '</ul><p class="pzcard__s">Buyers found you by searching</p><ul class="pzterms">' + D.terms.map(function (t) { return '<li>' + e(t) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="pzcard pzcard--up"><p class="pzcard__t">If you complete your profile</p><p class="pzup">' + (q >= 100 ? '✓ Maxed' : '+' + Math.round((100 - q) * 0.9) + '%') + '</p>' +
      '<p class="pzup__d">' + (q >= 100 ? 'Your profile is fully complete.' : 'more profile views and about ' + Math.round((100 - q) * 0.35) + ' extra enquiries a month') + '</p><p class="pzup__n">Based on 1,200 Avava dealer profiles</p></div></div>';

    if (nC) {
      html += '<div class="pzchg" role="status"><span class="pzchg__dot" aria-hidden="true"></span><span class="pzchg__t">' + nC + (nC === 1 ? ' unpublished change' : ' unpublished changes') + '</span>' +
        '<span class="pzchg__l">' + m.chg.map(function (c) { return '<span class="pzchg__c">' + c + '</span>'; }).join('') + '</span><button class="pzchg__go js-pz"' + act('pub') + ' type="button">' + pubT + '</button></div>';
    }

    var SUM = { basic: m.name + ' · since ' + m.year, about: m.about.length + ' chars · ' + mks.length + ' makes · ' + m.nL + ' languages', loc: '2 locations · ' + m.hrs.filter(function (h) { return h !== 'Closed'; }).length + ' open days',
      media: m.nG + ' of 6 photos · ' + (m.vd ? 'video tour' : 'no video') + ' · ' + D.br[m.br], serv: m.nS + ' services · ' + D.po.filter(function (x, i) { return m.po[i] === undefined ? x[2] : m.po[i]; }).length + ' policies',
      show: m.fc.length + ' cars · ' + m.fr.length + ' reviews' };
    var TT = { basic: 'Basics', about: 'About', loc: 'Locations & hours', media: 'Photos & brand', serv: 'Services & policies', show: 'Showcase' };
    var body = function (k, open) {
      if (k === 'basic') {
        return open ? '<div class="pzf3">' + [['nm', 'Dealership name', m.name], ['tg', 'Tagline', m.tag], ['yr', 'Since', m.year]].map(function (f) {
          return '<label class="pzfld"><span class="pzfld__k">' + f[1] + '</span><input class="pzfld__in" type="text" data-f="' + f[0] + '" value="' + e(f[2]) + '"' + (f[0] === 'yr' ? ' inputmode="numeric" maxlength="4"' : '') + '></label>';
        }).join('') + '</div><div class="pzlic"><span class="pzlic__ok" aria-hidden="true">✓</span><p class="pzlic__b"><span class="pzlic__t">Dealer licence DL-48213 · California DMV</span>' +
          '<span class="pzlic__d">Verified 12 Mar 2025 · valid to Mar 2027 · shows the «Verified dealer» badge</span></p><button class="pzbtn js-pz"' + act('lic') + ' type="button">' + (s.lc ? '✓ Renewal reminder set' : 'Remind me to renew') + '</button></div>' :
          '<p class="pzpills"><span class="pzpill pzpill--ok">✓ Verified dealer</span><span class="pzpill">Since ' + e(m.year) + '</span><span class="pzpill">' + e(m.tag.length > 26 ? m.tag.slice(0, 26) + '…' : m.tag) + '</span></p>';
      }
      if (k === 'about') {
        return open ? '<div class="pzab__bar"><span class="pzab__k">AI tone</span><span class="pzseg2">' + Object.keys(D.ab).map(function (t) {
          return '<button class="pzseg2__b' + on(m.tone === t) + ' js-pz"' + act('tone', t) + ' type="button" aria-pressed="' + (m.tone === t) + '">' + t + '</button>';
        }).join('') + '</span><span class="pzab__n pzv--' + (m.about.length >= 120 ? 'ok' : 'amber') + '">' + m.about.length + ' characters' + (m.about.length < 120 ? ' · aim for 120+' : '') + '</span></div>' +
          '<label class="pzab__ta"><span class="sr-only">About the dealership</span><textarea class="pzta" data-f="ab" rows="4">' + e(m.about) + '</textarea></label>' +
          '<div class="pzgrp"><p class="pzgrp__k">Specialises in</p><p class="pzchips">' + D.makes.map(function (x) { return chip(x, 'mk', x, !!m.mk[x]); }).join('') + '</p></div>' +
          '<div class="pzgrp"><p class="pzgrp__k">Languages spoken</p><p class="pzchips">' + D.langs.map(function (x) { return chip(x, 'lg', x, !!m.lg[x]); }).join('') + '</p></div>' :
          '<p class="pzab__x">' + e(m.about) + '</p>';
      }
      if (k === 'loc') {
        return open ? '<ul class="pzlocs">' + D.locs.map(function (l) {
          return '<li class="pzloc">' + img(l[4], 'pzloc__img') + '<p class="pzloc__b"><span class="pzloc__t">' + l[0] + '</span><span class="pzloc__a">' + l[1] + '</span><span class="pzloc__p">' + l[2] + '</span><span class="pzloc__k">' + e(l[3]) + '</span></p></li>';
        }).join('') + '</ul><p class="pzgrp__k">Showroom hours · tap a time to change</p><div class="pzhrs">' + D.days.map(function (d, i) {
          var h = m.hrs[i];
          return '<button class="pzhr' + (h === 'Closed' ? ' is-off' : '') + (i === D.today ? ' is-today' : '') + ' js-pz"' + act('hr', i) + ' type="button" aria-label="' + d + ': ' + h + '. Change"><span>' + d + '</span><span class="pzhr__t">' + h + '</span></button>';
        }).join('') + '</div><p class="pzloc__hol">Holiday hours: Thanksgiving 27 Nov closed · Black Friday 9:00–21:00</p>' :
          '<ul class="pzmini">' + D.days.map(function (d, i) {
            var h = m.hrs[i];
            return '<li class="' + (h === 'Closed' ? 'is-off' : '') + '"><span>' + d + '</span><span>' + (h === 'Closed' ? 'Closed' : h.replace(/:00/g, '')) + '</span></li>';
          }).join('') + '</ul>';
      }
      if (k === 'media') {
        return open ? '<div class="pzgal">' + D.gal.map(function (g, i) {
          var f = !!m.gl[i];
          return '<button class="pzslot' + (f ? ' is-on' : '') + ' js-pz"' + act('gl', i) + ' type="button" aria-pressed="' + f + '" aria-label="' + (f ? 'Remove ' : 'Add ') + g[0] + ' photo">' + (f ? img(g[1], 'pzslot__img') : '') +
            '<span class="pzslot__l">' + (f ? '' : '+ ') + g[0] + '</span>' + (f && i === 0 ? '<span class="pzslot__cv">Cover</span>' : '') + '</button>';
        }).join('') + '</div><div class="pzmed"><button class="pzvid' + (m.vd ? ' is-on' : '') + ' js-pz"' + act('vid') + ' type="button" aria-pressed="' + m.vd + '"><span class="pzvid__i" aria-hidden="true">▶</span>' +
          '<span class="pzvid__b"><span class="pzvid__t">Video tour</span><span class="pzvid__d">' + (m.vd ? '✓ 1:42 walkthrough · tap to remove' : 'Upload or link a 1–3 min tour') + '</span></span></button>' +
          '<div class="pzcol"><p class="pzgrp__k">Storefront colour</p><p class="pzcol__l">' + D.br.map(function (b, i) {
            return '<button class="pzsw pzbr--' + i + on(m.br === i) + ' js-pz"' + act('br', i) + ' type="button" title="' + b + '" aria-label="' + b + '" aria-pressed="' + (m.br === i) + '"></button>';
          }).join('') + '</p></div></div>' :
          '<p class="pzgm">' + D.gal.map(function (g, i) { return '<span class="pzgm__i' + (m.gl[i] ? ' is-on' : '') + (m.gl[i] && i === 0 ? ' is-cover' : '') + '">' + (m.gl[i] ? img(g[1], 'pzgm__img') : '') + '</span>'; }).join('') +
          '<span class="pzgm__c pzbr--' + m.br + '" role="img" aria-label="Storefront colour: ' + D.br[m.br] + '"></span></p>';
      }
      if (k === 'serv') {
        return open ? '<div class="pzsv">' + D.sv.map(function (x, i) {
          var o = !!m.sv[i];
          return '<button class="pzsv__b' + on(o) + ' js-pz"' + act('sv', i) + ' type="button" aria-pressed="' + o + '"><span class="pzsv__m" aria-hidden="true">' + (o ? '✓' : '+') + '</span><span class="pzsv__x"><span class="pzsv__t">' + x[0] + '</span><span class="pzsv__d">' + x[1] + '</span></span></button>';
        }).join('') + '</div><p class="pzgrp__k">Policies shown to buyers</p>' + D.po.map(function (x, i) {
          var o = m.po[i] === undefined ? !!x[2] : m.po[i];
          return '<button class="pzpo js-pz"' + act('po', i) + ' type="button" role="switch" aria-checked="' + o + '"><span class="pzpo__b"><span class="pzpo__t">' + x[0] + '</span><span class="pzpo__d">' + e(x[1]) + '</span></span><span class="pzsw2' + on(o) + '"><span class="pzsw2__k"></span></span></button>';
        }).join('') : '<p class="pzpills">' + svOn.map(function (t) { return '<span class="pzpill pzpill--dot">' + t + '</span>'; }).join('') + '</p>';
      }
      return open ? '<p class="pzgrp__k">Featured cars · pick 3</p><div class="pzfc">' + D.fc.map(function (c, i) {
        var o = m.fc.indexOf(i);
        return '<button class="pzfc__b' + on(o > -1) + ' js-pz"' + act('fc', i) + ' type="button" aria-pressed="' + (o > -1) + '">' + img(c[2], 'pzfc__img') + '<span class="pzfc__t">' + e(c[0]) + '</span><span class="pzfc__m">' + (o > -1 ? '✓ Featured #' + (o + 1) : c[1]) + '</span></button>';
      }).join('') + '</div><p class="pzgrp__k">Featured reviews · pick up to 3</p>' + D.fr.map(function (r, i) {
        var o = m.fr.indexOf(i) > -1;
        return '<button class="pzfr' + on(o) + ' js-pz"' + act('fr', i) + ' type="button" aria-pressed="' + o + '">' + stars(r[1]) + '<span class="pzfr__q">“' + e(r[2]) + '” — ' + e(r[0]) + '</span><span class="pzfr__m">' + (o ? '✓ Featured' : 'Feature') + '</span></button>';
      }).join('') : '<div class="pzcm">' + cars.map(function (c) {
        return '<p class="pzcm__i">' + img(c[2], 'pzcm__img') + '<span class="pzcm__t">' + e(c[0].replace(/^\d{4} /, '')) + '</span></p>';
      }).join('') + '<p class="pzcm__r">' + m.fr.length + ' reviews · ★ 4.8</p></div>';
    };
    html += '<div class="pzmain"><div class="pzsecs">' + Object.keys(D.qm).map(function (k) {
      var d = m.done(k), o = s.ex === k;
      return '<div class="pzsec' + (o ? ' is-open' : '') + '" id="pz-' + k + '"><div class="pzsec__h"><span class="pzsec__m pzsec--' + (d ? 'ok' : 'warn') + '" aria-hidden="true">' + (d ? '✓' : '!') + '</span>' +
        '<p class="pzsec__b"><span class="pzsec__t">' + e(TT[k]) + '</span><span class="pzsec__s">' + e(SUM[k]) + '</span></p><span class="pzsec__p pzsec--p' + (d ? 'ok' : 'warn') + '">' + (d ? 'Complete' : 'Needs work') + '</span>' +
        '<button class="pzbtn js-pz"' + act('ex', k) + ' type="button" aria-expanded="' + o + '" aria-controls="pz-' + k + '">' + (o ? 'Done' : 'Edit') + '</button></div>' + body(k, o) + '</div>';
    }).join('') + '</div>';

    var srch = s.dv === 'Search result', today = m.hrs[D.today], openNow = today !== 'Closed';
    html += '<div class="pzpv"><div class="pzpv__h"><p class="pzpv__k">Buyer view</p><span class="pzseg2">' + ['Mobile', 'Search result'].map(function (t) {
      return '<button class="pzseg2__b' + on(s.dv === t) + ' js-pz"' + act('dv', t) + ' type="button" aria-pressed="' + (s.dv === t) + '">' + t + '</button>';
    }).join('') + '</span><button class="pzbtn pzbtn--42 js-pz"' + act('copy') + ' type="button">' + (s.cp ? '✓ Copied' : 'Copy link') + '</button></div>';
    if (!srch) {
      html += '<div class="pzph pzbr--' + m.br + '"><div class="pzph__cv">' + (m.gl[0] ? img(D.gal[0][1], 'pzph__img') : '') + '<span class="pzph__strip"></span>' + (m.vd ? '<span class="pzph__vid">▶ Video tour</span>' : '') + '</div>' +
        '<div class="pzph__in"><p class="pzph__id"><span class="pzph__logo" aria-hidden="true">PM</span><span class="pzph__nm"><span class="pzph__n">' + e(m.name) + '</span><span class="pzph__tg">' + e(m.tag) + '</span></span></p>' +
        '<p class="pzpills pzph__bd"><span class="pzpill pzpill--ok">✓ Verified dealer</span><span class="pzpill pzpill--t">★ 4.8 · 412 reviews</span><span class="pzpill pzpill--t">Replies in 6 min</span><span class="pzpill pzpill--t">Since ' + e(m.year) + '</span></p>' +
        '<div class="pzph__ab"><p class="pzph__abt">' + e(m.about) + '</p><p class="pzph__mk">' + e(mks.slice(0, 4).join(', ') + (mks.length > 4 ? ' +' + (mks.length - 4) : '')) + ' · Speaks ' + D.langs.filter(function (x) { return m.lg[x]; }).join(', ') + '</p></div>' +
        '<p class="pzpills pzph__sv">' + svOn.slice(0, 3).map(function (t) { return '<span class="pzpill pzpill--br">' + t + '</span>'; }).join('') + '</p>' +
        '<p class="pzph__open"><span class="pzph__dot' + (openNow ? ' is-open' : '') + '" aria-hidden="true"></span><span class="pzph__ot">' + (openNow ? 'Open today · ' + today : 'Closed today') + '</span><span class="pzph__ad">8631 Melrose Ave</span></p>' +
        '<div class="pzph__fc"><p class="pzph__ft">Featured cars</p><div class="pzph__cars">' + cars.slice(0, 2).map(function (c) {
          return '<p class="pzph__car">' + img(c[2], 'pzph__ci') + '<span class="pzph__ct">' + e(c[0]) + '</span><span class="pzph__cp">' + c[1] + '</span></p>';
        }).join('') + '</div>' + m.fr.slice(0, 1).map(function (i) {
          var r = D.fr[i];
          return '<p class="pzph__rv">' + stars(r[1]) + '<span class="pzph__rq">“' + e(r[2]) + '”</span><span class="pzph__ra">' + e(r[0]) + '</span></p>';
        }).join('') + '</div><p class="pzph__cta"><span class="pzph__msg">Message dealer</span><span class="pzph__book">Book a visit</span></p></div></div>';
    } else {
      html += '<p class="pzpv__k2">How you appear in Avava dealer search</p><div class="pzsr pzbr--' + m.br + '"><p class="pzsr__h"><span class="pzsr__logo" aria-hidden="true">PM</span><span class="pzsr__b"><span class="pzsr__n">' + e(m.name) + '</span>' +
        '<span class="pzsr__m">★ 4.8 · 412 reviews · Melrose · 3.2 mi</span></span><span class="pzpill pzpill--ok">Verified</span></p><div class="pzsr__cars">' + cars.map(function (c) { return img(c[2], 'pzsr__img'); }).join('') + '</div>' +
        '<p class="pzsr__l">Specialises in ' + e(mks.slice(0, 3).join(', ')) + ' · replies in 6 min</p><p class="pzpills">' + svOn.slice(0, 3).map(function (t) { return '<span class="pzpill pzpill--br">' + t + '</span>'; }).join('') + '</p>' +
        '<span class="pzsr__go">View dealer</span></div><p class="pzpv__k2">Ranked #' + rank + ' for «luxury dealer Los Angeles» · profile strength is 30% of the ranking</p>';
    }
    return html + '</div></div>';
  }
  /* pz-render:end */
  function initDealerProfile() {
    var box = $('.js-pzroot');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-pz')), s = pzInit();
    function sizes() {
      $$('[data-w]', box).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
      $$('[data-g]', box).forEach(function (el) { el.style.flexGrow = el.getAttribute('data-g'); });
    }
    function paint() {
      var el = document.activeElement, f = el && box.contains(el) ? el.getAttribute('data-f') : null;
      var a = f ? el.selectionStart : 0, b = f ? el.selectionEnd : 0;
      box.innerHTML = pzHtml(s, D);
      sizes();
      if (f) {
        var n = $('[data-f="' + f + '"]', box);
        if (n) {
          n.focus();
          n.setSelectionRange(a, b);
        }
      }
    }
    function toggleKey(k, def, key) {
      var o = Object.assign({}, s.u[k] === undefined ? def : s.u[k]);
      o[key] = o[key] ? 0 : 1;
      s.u[k] = o;
    }
    function pick(k, def, i, max) {
      var l = (s.u[k] === undefined ? def : s.u[k]).slice(), at = l.indexOf(i);
      if (at > -1) {
        l.splice(at, 1);
      } else {
        l.push(i);
      }
      s.u[k] = l.slice(-max);
    }
    box.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.js-pz');
      if (!btn) {
        return;
      }
      var a = btn.getAttribute('data-a'), v = btn.getAttribute('data-v'), m = pzModel(s, D), u = s.u;
      if (a === 'ex') {
        s.ex = s.ex === v ? null : v;
      } else if (a === 'dv') {
        s.dv = v;
      } else if (a === 'hint') {
        if (v === 'vid') {
          u.vd = true;
        } else if (v === 'photos') {
          u.gl = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };
        } else if (v === 'about') {
          u.ab = D.ab.Warm;
          u.tn = 'Warm';
        } else {
          u.fr = [0, 1, 2];
        }
      } else if (a === 'pub') {
        // In production this publishes the draft through the profile API; here the snapshot marks it live.
        D.chk.forEach(function (c) {
          if (u[c[0]] !== undefined) {
            s.pbk[c[0]] = JSON.stringify(u[c[0]]);
          }
        });
      } else if (a === 'lic') {
        s.lc = true;
      } else if (a === 'tone') {
        u.tn = v;
        u.ab = D.ab[v];
      } else if (a === 'mk') {
        toggleKey('mk', D.mk0, v);
      } else if (a === 'lg') {
        toggleKey('lg', D.lg0, v);
      } else if (a === 'hr') {
        var HO = ['9:00–19:00', '10:00–18:00', '10:00–16:00', 'Closed'];
        u.hr = Object.assign({}, u.hr);
        u.hr[v] = HO[(HO.indexOf(m.hrs[+v]) + 1) % HO.length];
      } else if (a === 'gl') {
        toggleKey('gl', D.gl0, v);
      } else if (a === 'vid') {
        u.vd = !m.vd;
      } else if (a === 'br') {
        u.br = +v;
      } else if (a === 'sv') {
        toggleKey('sv', D.sv0, v);
      } else if (a === 'po') {
        u.po = Object.assign({}, u.po);
        u.po[v] = !(m.po[v] === undefined ? !!D.po[+v][2] : m.po[v]);
      } else if (a === 'fc') {
        pick('fc', D.fc0, +v, 3);
      } else if (a === 'fr') {
        pick('fr', D.fr0, +v, 3);
      } else if (a === 'copy') {
        var url = new URL('listing-v1.html', location.href).href;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).catch(function () {});
        }
        s.cp = true;
      }
      paint();
    });
    box.addEventListener('input', function (ev) {
      var f = ev.target.getAttribute('data-f');
      if (['nm', 'tg', 'yr', 'ab'].indexOf(f) > -1) {
        s.u[f] = ev.target.value;
        paint();
      }
    });
    sizes();
  }

  /* Dealer billing (build_dealer_billing.py). One pure view function: the builder runs bzInit + bzHtml (between the
     bz-render markers) in Node for the first markup, initDealerBilling re-renders on every change. Bar widths travel as
     data-w, spend-chart segment heights as data-u (artboard px). */
  /* bz-render:start */
  function bzInit() {
    return { pl: 1, cy: 'Monthly', pv: -1, co: true, ps: false, cn: false, cxo: false, rs: '', nt: '', ntK: '', adn: {}, cap: 900, ms: 0, rm: {}, am: false, au: true,
      rt: false, dl: {}, da: false, pp: false, ifl: 'All', iq: '', dv: {}, ds: false };
  }
  function bzModel(s, D) {
    var ann = s.cy === 'Annual', pr = function (v) { return Math.round(ann ? v * 0.85 : v); }, P0 = D.plans[s.pl], lim = {};
    Object.keys(P0[2]).forEach(function (k) { lim[k] = P0[2][k] + (s.adn[k] || 0) * D.add[k][0]; });
    var meth = D.meth.concat(s.am ? [D.methNew] : []).filter(function (x, i) { return !s.rm[i]; });
    var promoT = D.promo.reduce(function (a, x) { return a + x[2]; }, 0);
    return { ann: ann, pr: pr, cur: P0, lim: lim, meth: meth, def: meth[s.ms] ? meth[s.ms][1] : 'default method', promoT: promoT, extras: s.ps ? 0 : promoT };
  }
  function bzHtml(s, D) {
    var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var act = function (a, v) { return ' data-a="' + a + '"' + (v === undefined ? '' : ' data-v="' + e(v) + '"'); };
    var on = function (b) { return b ? ' is-on' : ''; };
    var num = function (n) { return n.toLocaleString('en-US'); };
    var usd = function (n) { return (n < 0 ? '−' : '') + '$' + num(Math.abs(n)); };
    var usd2 = function (n) { return (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var seg = function (list, cur, a) {
      return '<span class="bzseg">' + list.map(function (t) {
        var v = Array.isArray(t) ? t[0] : t, l = Array.isArray(t) ? t[1] : t;
        return '<button class="bzseg__b' + on(v === cur) + ' js-bz"' + act(a, v) + ' type="button" aria-pressed="' + (v === cur) + '">' + e(l) + '</button>';
      }).join('') + '</span>';
    };
    var head = function (t, sub, right) { return '<p class="bzcard__h"><span class="bzcard__t">' + t + '</span><span class="bzcard__s">' + e(sub) + '</span>' + (right || '') + '</p>'; };
    var m = bzModel(s, D), U = D.use, nm = m.cur[0];

    var usage = D.usage.map(function (row) {
      var k = row[1], lim = m.lim[k], v = U[k], inf = lim >= 9999, r = inf ? 0.05 : v / lim, tone = r >= 1 ? 'acc' : r >= 0.8 ? 'amber' : 'ok';
      var cum = ['credits', 'sms', 'ai'].indexOf(k) > -1, proj = cum ? Math.round(v * 1.25) : v, over = !inf && proj > lim, n = s.adn[k] || 0;
      var fT = inf ? 'Unlimited on ' + nm : cum ? 'Projected ' + num(proj) + ' by 31 Oct' + (over ? ' · runs out ~' + (24 - Math.round((proj - lim) / proj * 10)) + ' Oct' : ' · on track') :
        (over ? 'At limit' : (lim - v) + ' free') + (n ? ' · +' + n * D.add[k][0] + ' add-on' : '');
      return { t: row[0], k: k, v: v, lim: lim, inf: inf, r: r, tone: tone, warn: r >= 0.8, fT: fT, fTone: over ? 'acc' : r >= 0.8 ? 'amber' : 'body', canBuy: !inf && (over || r >= 0.8 || n > 0), n: n };
    });
    var alerts = [];
    if (!s.rt) {
      alerts.push(['acc', '!', 'Payment of $198.00 failed on 3 Oct', 'Visa ending 4242 was declined · promo boosts paused until paid',
        '<button class="bzbtn bzbtn--acc js-bz"' + act('retry') + ' type="button">Retry payment</button><button class="bzbtn js-bz"' + act('amex') + ' type="button">Use Amex 1005</button>']);
    }
    if (usage.some(function (u) { return u.warn; }) && !s.adn.sms) {
      alerts.push(['amber', '↑', 'SMS will run out around 24 Oct', 'Add 500 SMS for $25, or move to Enterprise for 10,000 / month',
        '<button class="bzbtn bzbtn--amber js-bz"' + act('buy', 'sms') + ' type="button">Add 500 SMS · $25</button>']);
    }
    var html = alerts.map(function (a) {
      return '<div class="bzal bzal--' + a[0] + '" role="alert"><span class="bzal__m" aria-hidden="true">' + a[1] + '</span><p class="bzal__b"><span class="bzal__t">' + a[2] + '</span><span class="bzal__d">' + a[3] + '</span></p>' + a[4] + '</div>';
    }).join('');

    var stT = s.cn ? 'Cancelling' : s.ps ? 'Paused' : 'Active';
    var rs = s.rs;
    html += '<div class="bzrow bzrow--plan"><div class="bzcard">' + head('Your plan', 'Pacific Motors') +
      '<div class="bzplan"><div class="bzplan__b"><p class="bzplan__n"><span class="bzplan__nm">' + nm + '</span><span class="bzpill bzpill--' + (s.cn ? 'acc' : s.ps ? 'amber' : 'ok') + '">' + stT + '</span></p>' +
      '<p class="bzplan__p">$' + num(m.pr(m.cur[1])) + ' / month · ' + (m.ann ? 'billed annually' : 'billed monthly') + '</p>' +
      '<p class="bzplan__r">' + (s.cn ? 'Ends 31 Oct 2026 · listings go offline then' : s.ps ? 'Paused · resumes 1 Dec 2026' : 'Renews 1 Nov 2026 · ' + e(m.def)) + '</p></div>' +
      '<p class="bzplan__since"><span class="bzplan__sk">Member since</span><span>Mar 2022</span></p></div>' +
      '<ul class="bzinc">' + m.cur[3].filter(function (f) { return f.charAt(0) !== '—'; }).slice(0, 5).map(function (f) { return '<li>' + e(f) + '</li>'; }).join('') + '</ul>' +
      (s.cxo && !s.cn ? '<div class="bzcx"><p class="bzcx__t">Before you go — what’s the reason?</p><p class="bzcx__r">' + D.reasons.map(function (t) {
        return '<button class="bzcx__c' + on(rs === t) + ' js-bz"' + act('rs', t) + ' type="button" aria-pressed="' + (rs === t) + '">' + t + '</button>';
      }).join('') + '</p><p class="bzcx__o">' + (rs === 'Too expensive' ? 'We can give you 30% off for the next 3 months.' : rs === 'Not enough leads' ? 'Let us add 10 free promo credits and a pricing review with your account manager.' :
        rs ? 'We’ll export your inventory and leads for you.' : 'Your listings stay live until 31 Oct 2026.') + '</p><p class="bzacts"><button class="bzbtn bzbtn--acc js-bz"' + act('keep') + ' type="button">' +
        (rs === 'Too expensive' ? 'Take 30% off' : rs === 'Not enough leads' ? 'Get 10 free credits' : 'Keep my plan') + '</button><button class="bzbtn js-bz"' + act('cancelok') + ' type="button">Cancel at period end</button></p></div>' : '') +
      (s.nt ? '<p class="bznote bznote--' + s.ntK + '" role="status">' + e(s.nt) + '</p>' : '') +
      '<p class="bzacts"><button class="bzbtn bzbtn--acc js-bz"' + act('co') + ' type="button" aria-expanded="' + s.co + '">' + (s.co ? 'Hide plans' : 'Change plan') + '</button>' +
      '<button class="bzbtn js-bz"' + act('pause') + ' type="button">' + (s.ps ? 'Resume plan' : 'Pause 1 month') + '</button><button class="bzbtn bzbtn--mute js-bz"' + act('cancel') + ' type="button"' + (s.cn ? '' : ' aria-expanded="' + s.cxo + '"') + '>' + (s.cn ? 'Undo cancellation' : 'Cancel plan') + '</button></p></div>' +
      '<div class="bzcard">' + head('Usage this period', 'resets 1 Nov') + usage.map(function (u) {
        return '<div class="bzuse"><p class="bzuse__h"><span>' + u.t + '</span><span><span class="bzv--' + u.tone + '">' + num(u.v) + '</span><span class="bzuse__l"> / ' + (u.inf ? '∞' : num(u.lim)) + '</span></span></p>' +
          '<span class="bzbar"><span class="bzbar__f bzc--' + u.tone + '" data-w="' + Math.min(100, u.r * 100).toFixed(1) + '"></span></span><p class="bzuse__f"><span class="bzuse__ft bzv--' + u.fTone + '">' + u.fT + '</span>' +
          (u.canBuy ? '<button class="bzbuy' + (u.n ? ' is-on' : '') + ' js-bz"' + act('buy', u.k) + ' type="button">' + (u.n ? '✓ +' + u.n * D.add[u.k][0] + ' · add more' : '+' + D.add[u.k][0] + ' for ' + D.add[u.k][1]) + '</button>' : '') + '</p></div>';
      }).join('') + '</div></div>';

    var mx = Math.max.apply(null, D.sub.map(function (v, i) { return v + D.pro[i] + D.rep[i]; })), sum = D.sub.reduce(function (a, v, i) { return a + v + D.pro[i] + D.rep[i]; }, 0);
    var capR = m.extras / s.cap, capTone = capR >= 1 ? 'acc' : capR >= 0.8 ? 'amber' : 'ok';
    html += '<div class="bzrow bzrow--spend"><div class="bzcard">' + head('Spend · 12 months', '$' + (sum / 1000).toFixed(1) + 'k in 12 months · upgraded to Pro in Feb') +
      '<div class="bzsp" role="img" aria-label="Monthly Avava spend, November to October">' + D.mon.map(function (t, i) {
        var tot = D.sub[i] + D.pro[i] + D.rep[i], last = i === D.mon.length - 1;
        return '<p class="bzsp__c' + (last ? ' is-now' : '') + '"><span class="bzsp__v">$' + (tot / 1000).toFixed(1) + 'k</span><span class="bzsp__s"><span class="bzsp__p" data-u="' + (D.pro[i] / mx * 160).toFixed(1) + '"></span>' +
          '<span class="bzsp__r" data-u="' + (D.rep[i] / mx * 160).toFixed(1) + '"></span><span class="bzsp__b" data-u="' + (D.sub[i] / mx * 160).toFixed(1) + '"></span></span><span class="bzsp__m">' + t + '</span></p>';
      }).join('') + '</div><p class="bzlg"><span class="bzlg__i bzlg--plan">Plan</span><span class="bzlg__i bzlg--promo">Promo</span><span class="bzlg__i bzlg--rep">Reports</span></p></div>' +
      '<div class="bzcol"><div class="bzcard">' + head('Monthly budget', 'alerts at 80% and 100%') + '<div class="bzcap"><p class="bzcap__b"><span class="bzcap__k">Cap for promo &amp; extras</span><span class="bzcap__v">' + usd(s.cap) + ' / mo</span></p>' +
      '<button class="bzstep js-bz"' + act('cap', -100) + ' type="button" aria-label="Lower the cap by $100"' + (s.cap <= 200 ? ' disabled' : '') + '>−</button><button class="bzstep js-bz"' + act('cap', 100) + ' type="button" aria-label="Raise the cap by $100">+</button></div>' +
      '<span class="bzcap__bar"><span class="bzcap__f bzc--' + capTone + '" data-w="' + Math.min(100, capR * 100).toFixed(1) + '"></span><span class="bzcap__tick" aria-hidden="true"></span></span>' +
      '<p class="bzcap__s bzv--' + capTone + '" role="status">' + (capR >= 1 ? 'Over budget by ' + usd(m.extras - s.cap) + ' · new boosts need GM approval' : capR >= 0.8 ? usd(m.extras) + ' of ' + usd(s.cap) + ' used · 80% alert sent to ' + D.gm : usd(m.extras) + ' of ' + usd(s.cap) + ' used this month') + '</p></div>' +
      '<div class="bzunits">' + D.unit.map(function (x) {
        return '<p class="bzunit"><span class="bzunit__k">' + x[0] + '</span><span class="bzunit__v' + (x[3] ? ' bzv--ok' : '') + '">' + x[1] + '</span><span class="bzunit__d">' + e(x[2]) + '</span></p>';
      }).join('') + '</div></div></div>';

    if (s.co) {
      var P = s.pv > -1 ? D.plans[s.pv] : null, prorate = P ? Math.round((m.pr(P[1]) - m.pr(m.cur[1])) * 25 / 31) : 0;
      html += '<div class="bzcard bzplans">' + head('Plans', 'compare and switch') + '<p class="bzplans__cy">' + seg(['Monthly', 'Annual'], s.cy, 'cy') + '<span class="bzv--ok">Annual saves 15%</span></p><div class="bzpl">' + D.plans.map(function (p, i) {
        var isCur = i === s.pl, over = Object.keys(U).filter(function (k) { return U[k] > p[2][k]; });
        var block = over.length && !isCur ? 'You have ' + U[over[0]] + ' ' + (over[0] === 'listings' ? 'live listings' : over[0]) + ' — ' + p[0] + ' allows ' + p[2][over[0]] : '';
        var bT = isCur ? 'Your plan' : block ? 'Not available' : (i > s.pl ? 'Upgrade to ' : 'Downgrade to ') + p[0];
        return '<div class="bzpc' + (isCur ? ' is-cur' : '') + (s.pv === i ? ' is-pv' : '') + '"><p class="bzpc__h"><span class="bzpc__n">' + p[0] + '</span>' + (isCur ? '<span class="bzpc__tag is-cur">Current plan</span>' : i === 2 ? '<span class="bzpc__tag">Most growth</span>' : '') + '</p>' +
          '<p class="bzpc__p"><span class="bzpc__v">$' + num(m.pr(p[1])) + '</span><span class="bzpc__u">/ month</span></p><p class="bzpc__b">' + (m.ann ? 'billed $' + num(m.pr(p[1]) * 12) + ' yearly' : 'billed monthly') + '</p>' +
          '<ul class="bzpc__f">' + p[3].map(function (f) {
            var no = f.charAt(0) === '—';
            return '<li' + (no ? ' class="is-no"' : '') + '><span class="bzpc__m" aria-hidden="true">' + (no ? '—' : '✓') + '</span>' + e(no ? f.slice(1) : f) + (no ? '<span class="sr-only"> (not included)</span>' : '') + '</li>';
          }).join('') + '</ul>' + (block ? '<p class="bzpc__x">' + block + '</p>' : '') +
          '<button class="bzpc__go' + (isCur ? ' is-cur' : block ? ' is-no' : i > s.pl ? ' is-up' : ' is-down') + (isCur || block ? '' : ' js-bz') + '"' + (isCur || block ? ' disabled' : act('pv', i)) + ' type="button">' + bT + '</button></div>';
      }).join('') + '</div>' + (P ? '<div class="bzpv" role="status"><p class="bzpv__b"><span class="bzpv__t">' + (s.pv > s.pl ? 'Upgrade to ' : 'Downgrade to ') + P[0] + ' · $' + num(m.pr(P[1])) + ' / month</span>' +
        '<span class="bzpv__d">' + (prorate > 0 ? 'Prorated charge today ' + usd2(prorate) + ' for the remaining 25 days · new limits apply immediately' : 'Takes effect 1 Nov · ' + usd2(-prorate) + ' credit on your next invoice') + '</span></p>' +
        '<button class="bzpv__x js-bz"' + act('pvx') + ' type="button">Not now</button><button class="bzbtn bzbtn--acc js-bz"' + act('pvok') + ' type="button">' + (s.pv > s.pl ? 'Upgrade · pay ' + usd2(prorate) : 'Schedule downgrade') + '</button></div>' : '') + '</div>';
    }

    var subT = s.ps ? 99 : m.pr(m.cur[1]), total = subT + m.extras;
    var lines = [[nm + ' plan' + (s.ps ? ' · paused' : ''), s.ps ? 'Pause fee · listings hidden, data kept' : (m.ann ? 'Annual · billed monthly equivalent' : '1 Nov – 30 Nov 2026'), subT]].concat(s.ps ? [] : D.promo, [['Tax', 'Exempt · California resale certificate', 0]]);
    html += '<div class="bzrow"><div class="bzcard">' + head('Next invoice', 'charges 1 Nov 2026') + '<ul class="bzln">' + lines.map(function (l) {
      return '<li class="bzln__i"><span class="bzln__b"><span class="bzln__t">' + e(l[0]) + '</span><span class="bzln__d">' + e(l[1]) + '</span></span><span class="bzln__v' + (l[2] < 0 ? ' bzv--ok' : '') + '">' + usd2(l[2]) + '</span></li>';
    }).join('') + '<li class="bzln__i bzln__i--tot"><span class="bzln__b"><span class="bzln__t">Total due 1 Nov</span><span class="bzln__d">Charged to ' + e(m.def) + '</span></span><span class="bzln__v">' + usd2(total) + '</span></li></ul>' +
      '<div class="bzwh"><p class="bzwh__h"><span>Where promo spend went</span><span class="bzv--ok">$49 per extra lead</span></p>' + D.promoCars.map(function (r) {
        return '<p class="bzwh__r"><span class="bzwh__c">' + e(r[0]) + '</span><span class="bzwh__b">' + r[1] + '</span><span class="bzwh__v">' + usd(r[2]) + '</span><span class="bzwh__l bzv--' + (r[2] / r[3] > 60 ? 'acc' : 'ok') + '">+' + r[3] + (r[3] === 1 ? ' lead' : ' leads') + '</span></p>';
      }).join('') + '</div><button class="bzbtn bzbtn--start js-bz"' + act('pp') + ' type="button">' + (s.pp ? '✓ Preview downloaded' : 'Download preview') + '</button></div>' +
      '<div class="bzcard">' + head('Payment methods', 'charged on the 1st') + '<ul class="bzpm">' + m.meth.map(function (x, i) {
        var d = i === s.ms;
        return '<li class="bzpm__i"><span class="bzpm__br bzbrand--' + x[0].toLowerCase() + '">' + x[0] + '</span><span class="bzpm__b"><span class="bzpm__t">' + e(x[1]) + '</span><span class="bzpm__d">' + e(x[2]) + '</span></span>' +
          (d ? '<span class="bzpill bzpill--ok">Default</span>' : '<button class="bzbtn bzbtn--36 js-bz"' + act('mk', i) + ' type="button">Make default</button><button class="bzpm__rm js-bz"' + act('rm', i) + ' type="button" aria-label="Remove ' + e(x[1]) + '">Remove</button>') + '</li>';
      }).join('') + '</ul><button class="bzadd js-bz"' + act('am') + ' type="button"' + (s.am ? ' disabled' : '') + '>' + (s.am ? '✓ Mastercard added' : '+ Add card or bank account') + '</button>' +
      '<button class="bzauto js-bz"' + act('au') + ' type="button" role="switch" aria-checked="' + s.au + '"><span class="bzauto__b"><span class="bzauto__t">Auto top-up promo credits</span><span class="bzauto__d">+10 credits ($390) when fewer than 3 remain</span></span>' +
      '<span class="bzsw' + on(s.au) + '"><span class="bzsw__k"></span></span></button></div></div>';

    var inv = D.inv.map(function (x) { return [x[0], x[1], x[2], x[3], x[0] === D.failedInv && s.rt ? 'Paid' : x[4]]; }), iq = s.iq.toLowerCase();
    var invF = inv.filter(function (x) { return (s.ifl === 'All' || x[4] === s.ifl) && (!iq || (x[0] + ' ' + x[1]).toLowerCase().indexOf(iq) > -1); });
    html += '<div class="bzrow bzrow--inv"><div class="bzcard">' + head('Invoices', inv.some(function (x) { return x[4] === 'Failed'; }) ? '1 payment failed' : 'all paid', '<button class="bzbtn bzcard__r js-bz"' + act('da') + ' type="button">' + (s.da ? '✓ 2026 statement.pdf' : 'Download all 2026') + '</button>') +
      '<div class="bzif">' + seg(['All', 'Paid', 'Failed', 'Refunded'].map(function (t) { return [t, t + ' ' + (t === 'All' ? inv.length : inv.filter(function (x) { return x[4] === t; }).length)]; }), s.ifl, 'ifl') +
      '<label class="bzsearch"><svg class="bzsearch__i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg><span class="sr-only">Search invoices</span>' +
      '<input class="bzsearch__in" type="search" data-f="iq" value="' + e(s.iq) + '" placeholder="Invoice # or description"></label></div>' +
      '<div class="bzit"><p class="bzit__h"><span>Invoice</span><span>Date</span><span class="bzit__a">Amount</span><span>Status</span><span></span></p>' + invF.map(function (x) {
        var fail = x[4] === 'Failed';
        return '<div class="bzit__r"><p class="bzit__n"><span>' + x[0] + '</span><span class="bzit__d">' + e(x[1]) + '</span></p><span class="bzit__dt">' + x[2] + '</span><span class="bzit__a">' + usd2(x[3]) + '</span>' +
          '<span class="bzpill bzpill--' + (x[4] === 'Paid' ? 'ok' : fail ? 'acc' : 'mute') + '">' + x[4] + '</span>' +
          '<button class="bzit__go' + (fail ? ' is-fail' : s.dl[x[0]] ? ' is-done' : '') + ' js-bz"' + act(fail ? 'retry' : 'dl', x[0]) + ' type="button">' + (fail ? 'Retry payment' : s.dl[x[0]] ? '✓ Downloaded' : 'Download PDF') + '</button></div>';
      }).join('') + (invF.length ? '' : '<p class="bzit__empty">No invoices match this filter</p>') + '</div></div>' +
      '<div class="bzcard">' + head('Billing details', 'printed on invoices') + '<div class="bzdet">' + D.det.map(function (x, i) {
        return '<label class="bzdet__f"><span class="bzdet__k">' + x[0] + '</span><input class="bzdet__in" type="text" data-f="dv' + i + '" value="' + e(s.dv[i] === undefined ? x[1] : s.dv[i]) + '"></label>';
      }).join('') + '</div><p class="bzdet__s"><span class="bzdet__h" role="status">' + (s.ds ? '✓ Saved · next invoice will use these details' : 'Changes apply to future invoices') + '</span>' +
      '<button class="bzbtn bzbtn--acc js-bz"' + act('ds') + ' type="button">' + (s.ds ? '✓ Saved' : 'Save details') + '</button></p></div></div>';
    return html;
  }
  /* bz-render:end */
  function initDealerBilling() {
    var box = $('.js-bzroot');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-bz')), s = bzInit();
    function sizes() {
      $$('[data-w]', box).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
      $$('[data-u]', box).forEach(function (el) { el.style.height = 'calc(var(--u) * ' + el.getAttribute('data-u') + ')'; });
    }
    function paint() {
      var el = document.activeElement, f = el && box.contains(el) ? el.getAttribute('data-f') : null, c = f ? el.selectionStart : 0;
      box.innerHTML = bzHtml(s, D);
      sizes();
      if (f) {
        var n = $('[data-f="' + f + '"]', box);
        if (n) {
          n.focus();
          n.setSelectionRange(c, c);
        }
      }
    }
    function pdf(name, lines) {
      // In production these are the provider's PDF invoices; here a one-page text PDF stands in.
      var a = document.createElement('a');
      a.href = URL.createObjectURL(textPdf(lines));
      a.download = name;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('.js-bz');
      if (!b) {
        return;
      }
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v'), m = bzModel(s, D);
      if (a === 'cy' || a === 'ifl' || a === 'rs') {
        s[a] = v;
      } else if (a === 'retry') {
        s.rt = true;
      } else if (a === 'amex') {
        s.ms = Math.max(0, m.meth.map(function (x) { return x[0]; }).indexOf('AMEX'));
        s.rt = true;
      } else if (a === 'buy') {
        s.adn[v] = (s.adn[v] || 0) + 1;
      } else if (a === 'co') {
        s.co = !s.co;
      } else if (a === 'pause') {
        s.nt = s.ps ? 'Plan resumed · listings back online' : 'Paused for 1 month · listings hidden, $99 pause fee';
        s.ntK = 'amber';
        s.ps = !s.ps;
      } else if (a === 'cancel') {
        if (s.cn) {
          s.cn = false;
          s.nt = 'Cancellation undone · your plan renews 1 Nov';
          s.ntK = 'ok';
        } else {
          s.cxo = !s.cxo;
        }
      } else if (a === 'keep') {
        s.cxo = false;
        s.nt = s.rs === 'Too expensive' ? '30% off applied for Nov–Jan' : s.rs === 'Not enough leads' ? '10 promo credits added · pricing review booked' : 'Great — your plan continues';
        s.ntK = 'ok';
      } else if (a === 'cancelok') {
        s.cn = true;
        s.cxo = false;
        s.nt = 'Plan will end on 31 Oct 2026 · you can undo until then';
        s.ntK = 'acc';
      } else if (a === 'cap') {
        s.cap = Math.max(200, s.cap + +v);
      } else if (a === 'pv') {
        s.pv = +v;
      } else if (a === 'pvx') {
        s.pv = -1;
      } else if (a === 'pvok') {
        var P = D.plans[s.pv], pro = Math.round((m.pr(P[1]) - m.pr(m.cur[1])) * 25 / 31);
        s.nt = 'You’re on ' + P[0] + ' now' + (pro > 0 ? ' · $' + pro.toFixed(2) + ' charged' : ' · from 1 Nov');
        s.ntK = 'ok';
        s.pl = s.pv;
        s.pv = -1;
      } else if (a === 'pp') {
        pdf('avava-invoice-preview-INV-2026-11.html', ['AVAVA CAR MARKETPLACE - INVOICE PREVIEW', 'INV-2026-11 - charges 1 Nov 2026', '', 'Billed to: ' + (s.dv[0] || D.det[0][1]), '',
          m.cur[0] + ' plan: $' + (s.ps ? 99 : m.pr(m.cur[1])).toFixed(2)].concat(s.ps ? [] : D.promo.map(function (l) { return l[0] + ': $' + l[2].toFixed(2); }), ['Tax: exempt', '',
          'Total due: $' + ((s.ps ? 99 : m.pr(m.cur[1])) + m.extras).toFixed(2), 'Charged to: ' + m.def]));
        s.pp = true;
      } else if (a === 'dl') {
        var x = D.inv.filter(function (r) { return r[0] === v; })[0];
        pdf('avava-' + v + '.pdf', ['AVAVA CAR MARKETPLACE - INVOICE', v + ' - ' + x[2], '', 'Billed to: ' + (s.dv[0] || D.det[0][1]), x[1], '', 'Amount: $' + x[3].toFixed(2), 'Status: ' + x[4]]);
        s.dl[v] = true;
      } else if (a === 'da') {
        pdf('avava-statement-2026.html', ['AVAVA CAR MARKETPLACE - 2026 STATEMENT', 'Pacific Motors LLC', ''].concat(D.inv.map(function (r) {
          return r[0] + '  ' + r[2] + '  $' + r[3].toFixed(2) + '  ' + (r[0] === D.failedInv && s.rt ? 'Paid' : r[4]);
        })));
        s.da = true;
      } else if (a === 'mk') {
        s.ms = +v;
      } else if (a === 'rm') {
        // indexes refer to the visible list: map back to the source list before hiding
        var src = D.meth.concat(s.am ? [D.methNew] : []).map(function (r, i) { return i; }).filter(function (i) { return !s.rm[i]; })[+v];
        s.rm[src] = true;
        if (s.ms > +v) {
          s.ms--;
        }
      } else if (a === 'am') {
        s.am = true;
      } else if (a === 'au') {
        s.au = !s.au;
      } else if (a === 'ds') {
        s.ds = true;
      }
      paint();
    });
    box.addEventListener('input', function (ev) {
      var f = ev.target.getAttribute('data-f');
      if (f === 'iq') {
        s.iq = ev.target.value;
        paint();
      } else if (f && f.indexOf('dv') === 0) {
        s.dv[f.slice(2)] = ev.target.value;
        if (s.ds) {
          s.ds = false;
          paint();
        }
      }
    });
    sizes();
  }

  /* Dealer settings (build_dealer_settings.py). One pure view function: the builder runs szInit + szHtml (between the
     sz-render markers) in Node for the first markup, initDealerSettings re-renders on every change. The checklist bar
     width travels as data-w. */
  /* sz-render:start */
  function szInit() {
    // v = draft over sv = saved over D.def = defaults; only v drives «unsaved»
    return { v: {}, sv: {}, js: false, lg: [], q: '', is: {}, rv: false, kg: false, so: {}, ipx: {}, ipA: false, ex: false, xf: false, co: false, cv: '', cd: false, tn: false };
  }
  function szModel(s, D) {
    var base = Object.assign({}, D.def, s.sv), v = Object.assign({}, base, s.v);
    var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
    var chgKeys = Object.keys(v).filter(function (k) { return !same(v[k], base[k]); });
    var ints = D.ints.map(function (x, i) { return s.is[i] || x[2]; });
    return { v: v, base: base, chgKeys: chgKeys, chg: function (k) { return !same(v[k], base[k]); }, ints: ints, same: same };
  }
  function szHtml(s, D) {
    var e = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var act = function (a, v) { return ' data-a="' + a + '"' + (v === undefined ? '' : ' data-v="' + e(v) + '"'); };
    var on = function (b) { return b ? ' is-on' : ''; };
    var M = szModel(s, D), v = M.v, chg = M.chg;
    var label = function (k) { return k.indexOf('-') > -1 ? 'Notifications' : D.lbl[k]; };
    var uniq = function (l) { return l.filter(function (x, i) { return l.indexOf(x) === i; }); };
    var keysOf = function (sec) { return Object.keys(D.def).filter(function (k) { return D.ck[sec].indexOf(k) > -1 || (sec === 'notif' && /^n\d+-\d+$/.test(k)); }); };

    var row = function (body, ctl, cls) { return '<div class="szrow' + (cls ? ' ' + cls : '') + '"><p class="szrow__b">' + body + '</p>' + ctl + '</div>'; };
    var txt = function (t, d) { return '<span class="szrow__t">' + e(t) + '</span>' + (d ? '<span class="szrow__d">' + e(d) + '</span>' : ''); };
    var seg = function (k, t, d, opts) {
      return row(txt(t, d), '<span class="szseg">' + opts.map(function (o) {
        var sel = v[k] === o;
        return '<button class="szseg__b' + on(sel) + (sel && chg(k) ? ' is-chg' : '') + ' js-sz"' + act('set', k + '|' + o) + ' type="button" aria-pressed="' + sel + '">' + e(o) + '</button>';
      }).join('') + '</span>');
    };
    var step = function (k, t, d, by, min, max, fmt) {
      return row(txt(t, d), '<button class="szstep js-sz"' + act('step', k + '|' + (-by) + '|' + min + '|' + max) + ' type="button" aria-label="Decrease ' + e(t) + '"' + (v[k] <= min ? ' disabled' : '') + '>−</button>' +
        '<span class="szstep__v' + (chg(k) ? ' is-chg' : '') + '">' + fmt(v[k]) + '</span><button class="szstep js-sz"' + act('step', k + '|' + by + '|' + min + '|' + max) + ' type="button" aria-label="Increase ' + e(t) + '"' + (v[k] >= max ? ' disabled' : '') + '>+</button>');
    };
    var tog = function (k, t, d) {
      return '<button class="szrow szrow--tg js-sz"' + act('tog', k) + ' type="button" role="switch" aria-checked="' + !!v[k] + '"><span class="szrow__b"><span class="szrow__t">' + e(t) +
        (D.rec.indexOf(k) > -1 && !v[k] ? '<span class="szrec">Recommended</span>' : '') + (chg(k) ? '<span class="szchgdot" aria-label="unsaved"></span>' : '') + '</span><span class="szrow__d">' + e(d) + '</span></span>' +
        '<span class="szsw' + on(v[k]) + '"><span class="szsw__k"></span></span></button>';
    };
    var nOk = M.ints.filter(function (x) { return x === 'Connected'; }).length, nErr = M.ints.filter(function (x) { return x === 'Error'; }).length;
    var warn = { integ: nErr ? nErr + ' needs reconnect' : '', sec: v.twofa ? '' : '2FA off for 2' };
    var nNot = Object.keys(v).filter(function (k) { return /^n\d+-\d+$/.test(k) && v[k]; }).length;
    var status = { notif: nNot + ' alerts on', auto: [v.autoreply, v.revReq, v.drop].filter(Boolean).length + ' automations on', listing: 'Doc fee $' + v.docFee + ' · ' + v.units,
      integ: nOk + ' connected' + (nErr ? ' · ' + nErr + ' error' : ''), sec: v.twofa ? '2FA enforced' : '2FA optional', region: v.lang + ' · ' + v.tz + ' · ' + v.cur, data: 'Last export 12 Sep' };
    var q = s.q.toLowerCase().trim(), show = {};
    D.secs.forEach(function (x) { show[x[0]] = !q || (x[1] + ' ' + x[4]).toLowerCase().indexOf(q) > -1; });
    var nShow = D.secs.filter(function (x) { return show[x[0]]; }).length;

    var html = '<div class="szq"><label class="szsearch"><svg class="szsearch__i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>' +
      '<span class="sr-only">Search settings</span><input class="szsearch__in" type="search" data-f="q" value="' + e(s.q) + '" placeholder="Search 60+ settings — try “2FA”, “doc fee”, “Instagram”">' +
      '<span class="szsearch__n" role="status">' + (q ? nShow + ' of 7 sections' : '7 sections') + '</span></label><p class="szjump">' + D.secs.map(function (x) {
        return '<a class="szjump__a" href="#sz-' + x[0] + '"><span class="szdot szic--' + x[0] + '" aria-hidden="true"></span>' + e(x[1]) + '</a>';
      }).join('') + '</p></div>';
    var nC = M.chgKeys.length;
    if (nC) {
      html += '<div class="szbar"><span class="szbar__dot" aria-hidden="true"></span><span class="szbar__t">' + nC + (nC === 1 ? ' unsaved change' : ' unsaved changes') + '</span><span class="szbar__l">' +
        uniq(M.chgKeys.map(label)).slice(0, 5).map(function (c) { return '<span class="szbar__c">' + e(c) + '</span>'; }).join('') + '</span>' +
        '<button class="szbar__x js-sz"' + act('discard') + ' type="button">Discard</button><button class="szbar__go js-sz"' + act('save') + ' type="button">Save changes</button></div>';
    } else if (s.js) {
      html += '<p class="szsaved" role="status">✓ Settings saved · applied to the whole team</p>';
    }

    var ckl = [['Connect your DMS', M.ints[0] !== 'Not connected', 'int0'], ['Turn on auto-reply', v.autoreply, 'autoreply'], ['Require 2FA for the team', v.twofa, 'twofa'],
      ['Fix the Instagram connection', M.ints[2] === 'Connected', 'int2'], ['Ask for reviews automatically', v.revReq, 'revReq'], ['Set quiet hours', v.quiet, 'quiet'],
      ['Connect Google Calendar', M.ints[4] === 'Connected', 'int4'], ['Watermark listing photos', v.wm, 'wm']];
    var nd = ckl.filter(function (c) { return c[1]; }).length, ckTone = nd === ckl.length ? 'ok' : nd >= 5 ? 'amber' : 'acc';
    html += '<div class="szlay"><div class="szside"><nav class="szidx" aria-label="Settings sections">' + D.secs.map(function (x) {
      var n = M.chgKeys.filter(function (k) { return keysOf(x[0]).indexOf(k) > -1; }).length, w = warn[x[0]];
      return '<a class="szidx__a' + (show[x[0]] ? '' : ' is-dim') + '" href="#sz-' + x[0] + '"><span class="szidx__i szic--' + x[0] + '" aria-hidden="true">' + x[3] + '</span><span class="szidx__t">' + e(x[1]) + '</span>' +
        (n || w ? '<span class="szidx__dot szidx__dot--' + (n ? 'amber' : 'acc') + '" role="img" aria-label="' + (n ? n + ' unsaved' : 'Needs attention') + '"></span>' : '') + '</a>';
    }).join('') + '</nav>' +
      '<div class="szbox"><p class="szbox__h"><span class="szbox__t">Setup checklist</span><span class="szv--' + ckTone + '">' + nd + ' of ' + ckl.length + ' done</span></p>' +
      '<span class="szbar8"><span class="szbar8__f szc--' + ckTone + '" data-w="' + (nd / ckl.length * 100).toFixed(1) + '"></span></span>' + ckl.map(function (c) {
        return '<button class="szck' + (c[1] ? ' is-done' : '') + (c[1] ? '' : ' js-sz') + '"' + (c[1] ? ' disabled' : act('fix', c[2])) + ' type="button"><span class="szck__m" aria-hidden="true">' + (c[1] ? '✓' : '') + '</span>' +
          '<span class="szck__t">' + c[0] + '</span>' + (c[1] ? '<span class="sr-only"> (done)</span>' : '<span class="szck__fix">Fix</span>') + '</button>';
      }).join('') + '</div>' +
      '<div class="szbox"><p class="szbox__t">Presets</p>' + D.presets.map(function (p, i) {
        var act2 = Object.keys(p[2]).every(function (k) { return M.same(v[k], p[2][k]); });
        return '<button class="szpre' + (act2 ? ' is-on' : '') + ' js-sz"' + act('preset', i) + ' type="button" aria-pressed="' + act2 + '"><span class="szpre__h"><span>' + p[0] + '</span><span class="szpre__s">' + (act2 ? '✓ Active' : 'Apply') + '</span></span><span class="szpre__d">' + e(p[1]) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="szbox"><p class="szbox__t">Change history</p><ul class="szlog">' + s.lg.concat(D.log).slice(0, 6).map(function (l) {
        var who = D.people[l[0]];
        return '<li class="szlog__i">' + (who ? '<img class="szlog__av" src="assets/img/' + who[0] + '" alt="" width="' + who[1] + '" height="' + who[1] + '" loading="lazy" decoding="async">' : '<span class="szlog__you" aria-hidden="true">YOU</span>') +
          '<span class="szlog__b"><span class="szlog__t">' + e(l[1]) + '</span><span class="szlog__w">' + l[2] + '</span></span></li>';
      }).join('') + '</ul></div></div>';

    var card = function (key, body, extra) {
      var x = D.secs.filter(function (r) { return r[0] === key; })[0], reset = keysOf(key).some(function (k) { return !M.same(v[k], D.def[k]); });
      return show[key] ? '<div class="szcard" id="sz-' + key + '"><div class="szcard__h"><span class="szcard__i szic--' + key + '" aria-hidden="true">' + x[3] + '</span><p class="szcard__b"><span class="szcard__t">' + e(x[1]) + '</span><span class="szcard__d">' + e(x[2]) + '</span></p>' +
        (warn[key] ? '<span class="szwarn">' + warn[key] + '</span>' : '') + (extra || '') + (reset ? '<button class="szbtn szbtn--mute js-sz"' + act('reset', key) + ' type="button">Reset to defaults</button>' : '') + '</div>' + body + '</div>' : '';
    };
    var cards = card('notif', '<div class="szmx"><p class="szmx__h"><span>Event</span>' + D.ch.map(function (c) { return '<span class="szmx__c">' + c + '</span>'; }).join('') + '</p>' + D.ev.map(function (ev, ri) {
      return '<div class="szmx__r"><p class="szmx__e"><span class="szrow__t">' + ev[0] + '</span><span class="szrow__d">' + ev[1] + '</span></p>' + D.ch.map(function (c, ci) {
        var k = 'n' + ri + '-' + ci, o = !!v[k];
        return '<button class="szcell' + on(o) + (chg(k) ? ' is-chg' : '') + ' js-sz"' + act('tog', k) + ' type="button" aria-pressed="' + o + '" aria-label="' + e(ev[0] + ' · ' + c) + '">' + (o ? '✓' : '—') + '</button>';
      }).join('') + '</div>';
    }).join('') + '</div>' + seg('digest', 'Summary digest', 'One email with everything you missed', ['Off', 'Daily', 'Weekly']) +
      seg('quietT', 'Quiet hours window', 'Only SLA breaches and payment failures get through', ['21:00–08:00', '22:00–07:00', '20:00–09:00']) + tog('quiet', 'Quiet hours', 'Mute SMS and push overnight'),
      '<button class="szbtn js-sz"' + act('test') + ' type="button">' + (s.tn ? '✓ Test sent to your phone' : 'Send test alert') + '</button>') +
      card('auto', '<label class="szar"><span class="szrow__d">Auto-reply message · sent instantly on every new lead</span><textarea class="szar__ta" data-f="ar" rows="2">' + e(v.ar) + '</textarea></label>' +
        seg('esc', 'Escalate overdue leads to', 'When the SLA target is missed', ['Sales manager', 'GM', 'BDC']) +
        step('sla', 'First-reply SLA', 'Timer starts when a lead arrives', 5, 5, 60, function (x) { return x + ' min'; }) +
        step('revDays', 'Ask for a review after', 'Days after delivery', 1, 1, 14, function (x) { return x + (x === 1 ? ' day' : ' days'); }) +
        step('dropDays', 'Suggest a price drop after', 'Days in stock without a sale', 5, 15, 120, function (x) { return x + ' days'; }) +
        step('dropPct', 'Price drop size', 'Never below your floor price', 1, 1, 10, function (x) { return x + '%'; }) +
        tog('autoreply', 'Auto-reply to new leads', 'Sent instantly via the lead’s channel') + tog('revReq', 'Automatic review requests', 'SMS with a link to Avava and Google') +
        tog('drop', 'Apply price drops automatically', 'Off = suggestions only, a manager approves')) +
      card('listing', seg('warr', 'Default warranty', 'Pre-selected on new listings', ['None', '1 year', '2 years']) + seg('units', 'Distance units', 'Shown on listings and comps', ['mi', 'km']) +
        seg('tmpl', 'Description template', 'Used by «Generate from specs»', ['Story', 'Spec sheet', 'Short']) + seg('tax', 'Sales tax shown on deal sheets', 'Los Angeles County', ['9.5%', '10.25%']) +
        step('docFee', 'Documentation fee', 'Added to every deal sheet', 5, 0, 500, function (x) { return '$' + x; }) + tog('wm', 'Watermark photos', 'Adds your logo bottom-right on upload')) +
      card('integ', '<div class="szints">' + D.ints.map(function (x, i) {
        var st = M.ints[i], ok = st === 'Connected', err = st === 'Error';
        return '<div class="szint' + (err ? ' is-err' : '') + '"><span class="szint__i szint--' + i + '" aria-hidden="true">' + x[4] + '</span><p class="szint__b"><span class="szint__n">' + e(x[0]) + '</span>' +
          '<span class="szint__s' + (err ? ' szv--acc' : ok ? '' : ' szv--mute') + '">' + e(x[1]) + ' · ' + (ok ? (s.is[i] ? 'Synced just now' : x[3]) : err ? x[3] : 'not connected') + '</span></p>' +
          '<button class="szint__go' + (ok ? '' : ' is-acc') + ' js-sz"' + act('int', i) + ' type="button">' + (ok ? 'Disconnect' : err ? 'Reconnect' : 'Connect') + '</button></div>';
      }).join('') + '</div><div class="szfeed"><p class="szfeed__i"><span class="szrow__d">Inventory feed URL</span><span class="szmono szfeed__u">https://feeds.pacificmotors.com/avava.xml</span>' +
        '<span class="szv--ok">✓ Last import 06 Oct 09:00 · 48 cars · 0 errors</span></p><div class="szfeed__i"><p class="szrow__d">API key</p><p class="szmono">' + (s.rv ? 'av_live_' + (s.kg ? '19ab77e02c5d' : '8c21d0e47b6a') + '3f9a' : 'av_live_••••••••••••3f9a') + '</p>' +
        '<p class="szfeed__a"><button class="szbtn szbtn--34 js-sz"' + act('reveal') + ' type="button">' + (s.rv ? 'Hide' : 'Reveal') + '</button><button class="szbtn szbtn--34 js-sz"' + act('regen') + ' type="button">' + (s.kg ? '✓ Regenerated' : 'Regenerate') + '</button></p></div></div>' +
        seg('feed', 'Import inventory feed', 'From your DMS export', ['Hourly', 'Every 6 h', 'Daily'])) +
      card('sec', '<p class="szfa' + (v.twofa ? ' is-ok' : '') + '"><span class="szfa__m" aria-hidden="true">' + (v.twofa ? '✓' : '!') + '</span><span class="szfa__t">' +
        (v.twofa ? 'All 7 members must use 2FA · enforced at next sign-in' : '5 of 7 members use 2FA · ' + D.no2fa + ' don’t') + '</span></p>' +
        seg('timeout', 'Sign out after inactivity', 'Applies to every member', ['1 h', '8 h', '7 days']) + tog('twofa', 'Require two-factor authentication', 'Members without 2FA are asked to set it up') +
        tog('sso', 'Sign in with Google Workspace', 'pacificmotors.com accounts only') + '<p class="szsub">Active sessions</p><ul class="szsess">' + D.sess.map(function (x, i) {
          return s.so[i] ? '' : '<li class="szsess__i"><p class="szsess__b"><span class="szsess__t">' + x[0] + '</span><span class="szrow__d">' + x[1] + '</span></p><span class="szrow__d">' + x[2] + '</span>' +
            (x[3] ? '<span class="szpill">This device</span>' : '<button class="szbtn szbtn--34 js-sz"' + act('signout', i) + ' type="button">Sign out</button>') + '</li>';
        }).join('') + '</ul><p class="szsub">Allowed IPs for admin actions</p><p class="szips">' + D.ips.concat(s.ipA ? [D.ipNew] : []).map(function (ip, i) {
          return s.ipx[i] ? '' : '<span class="szip szmono">' + ip + '<button class="szip__x js-sz"' + act('ipx', i) + ' type="button" aria-label="Remove ' + e(ip) + '">×</button></span>';
        }).join('') + (s.ipA ? '' : '<button class="szbtn szbtn--34 szbtn--dash js-sz"' + act('ipa') + ' type="button">+ Add current IP</button>') + '</p>') +
      card('region', seg('lang', 'Cabinet language', 'Each member can override', ['English', 'Español', '한국어']) + seg('tz', 'Time zone', 'Used for SLA timers and schedules', ['Pacific', 'Mountain', 'Central', 'Eastern']) +
        seg('cur', 'Currency', 'Prices and invoices', ['USD', 'CAD']) + seg('date', 'Date format', '', ['MM/DD', 'DD/MM', 'YYYY-MM-DD'])) +
      card('data', '<div class="szexp"><p class="szrow__b">' + txt('Export all data', 'Inventory, leads, deals, messages and invoices as CSV + JSON') + '</p><button class="szbtn js-sz"' + act('export') + ' type="button"' + (s.ex ? ' disabled' : '') + '>' +
        (s.ex ? '✓ Preparing · emailed when ready' : 'Request export') + '</button></div>' + seg('ret', 'Keep closed leads and messages', 'Legal minimum in California is 3 years', ['3 years', '7 years', 'Forever']) +
        '<div class="szdz"><p class="szdz__t">Danger zone</p><div class="szdz__r"><p class="szrow__b">' + txt('Transfer ownership', 'Make another member the account owner') + '</p><button class="szbtn js-sz"' + act('xfer') + ' type="button"' + (s.xf ? ' disabled' : '') + '>' +
        (s.xf ? '✓ Invite sent to ' + D.gm.split(' ')[0] : 'Transfer to ' + D.gm) + '</button></div><div class="szdz__r"><p class="szrow__b">' + txt('Close dealer account', 'Removes all listings from Avava · data kept 30 days') + '</p>' +
        '<button class="szbtn szbtn--danger js-sz"' + act('close') + ' type="button" aria-expanded="' + s.co + '">Close account</button></div>' +
        (s.co ? (s.cd ? '<p class="szdz__done" role="status">Closure scheduled · listings go offline tonight · you can cancel within 30 days from the email we sent</p>' :
          '<div class="szdz__c"><label class="szdz__l"><span class="sr-only">Type PACIFIC MOTORS to confirm</span><input class="szdz__in" type="text" data-f="cv" value="' + e(s.cv) + '" placeholder="Type PACIFIC MOTORS to confirm" autocomplete="off"></label>' +
          '<button class="szdz__go js-sz"' + act('closeok') + ' type="button"' + (s.cv.trim().toUpperCase() === 'PACIFIC MOTORS' ? '' : ' disabled') + '>Close permanently</button></div>') : '') + '</div>');
    html += '<div class="szmain"><div class="szgrid">' + cards + '</div>' + (nShow ? '' : '<p class="szempty">No settings match “' + e(s.q) + '”</p>') + '</div></div>';
    return html;
  }
  /* sz-render:end */
  function initDealerSettings() {
    var box = $('.js-szroot');
    if (!box) {
      return;
    }
    var D = JSON.parse(box.getAttribute('data-sz')), s = szInit();
    function sizes() {
      $$('[data-w]', box).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
    }
    function paint() {
      var el = document.activeElement, f = el && box.contains(el) ? el.getAttribute('data-f') : null, c = f ? el.selectionStart : 0;
      box.innerHTML = szHtml(s, D);
      sizes();
      if (f) {
        var n = $('[data-f="' + f + '"]', box);
        if (n) {
          n.focus();
          n.setSelectionRange(c, c);
        }
      }
    }
    function draft(k, val) {
      s.v[k] = val;
      s.js = false;
    }
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('.js-sz');
      if (!b) {
        return;
      }
      var a = b.getAttribute('data-a'), val = b.getAttribute('data-v'), M = szModel(s, D), v = M.v, p;
      if (a === 'set') {
        p = val.split('|');
        draft(p[0], p[1]);
      } else if (a === 'tog') {
        draft(val, !v[val]);
      } else if (a === 'step') {
        p = val.split('|');
        draft(p[0], Math.min(+p[3], Math.max(+p[2], v[p[0]] + +p[1])));
      } else if (a === 'discard') {
        s.v = {};
      } else if (a === 'save') {
        // In production this writes the draft to the settings store and the audit trail.
        var names = M.chgKeys.map(function (k) { return k.indexOf('-') > -1 ? 'Notifications' : D.lbl[k]; }).filter(function (x, i, l) { return l.indexOf(x) === i; });
        s.lg.unshift(['you', 'You · ' + names.slice(0, 3).join(', ') + (names.length > 3 ? ' +' + (names.length - 3) : ''), 'Just now']);
        s.sv = Object.assign({}, s.sv, s.v);
        s.v = {};
        s.js = true;
      } else if (a === 'reset') {
        Object.keys(D.def).forEach(function (k) {
          if (D.ck[val].indexOf(k) > -1 || (val === 'notif' && /^n\d+-\d+$/.test(k))) {
            draft(k, D.def[k]);
          }
        });
      } else if (a === 'fix') {
        if (val.indexOf('int') === 0) {
          s.is[val.slice(3)] = 'Connected';
        } else {
          draft(val, true);
        }
      } else if (a === 'preset') {
        var pr = D.presets[+val][2];
        Object.keys(pr).forEach(function (k) { draft(k, pr[k]); });
      } else if (a === 'int') {
        // integration actions apply immediately (OAuth in production)
        s.is[val] = M.ints[+val] === 'Connected' ? 'Not connected' : 'Connected';
      } else if (a === 'test') {
        s.tn = true;
      } else if (a === 'reveal') {
        s.rv = !s.rv;
      } else if (a === 'regen') {
        s.kg = true;
        s.rv = true;
      } else if (a === 'signout') {
        s.so[val] = true;
      } else if (a === 'ipx') {
        s.ipx[val] = true;
      } else if (a === 'ipa') {
        s.ipA = true;
      } else if (a === 'export') {
        s.ex = true;
      } else if (a === 'xfer') {
        s.xf = true;
      } else if (a === 'close') {
        s.co = !s.co;
      } else if (a === 'closeok') {
        s.cd = true;
      }
      paint();
    });
    box.addEventListener('input', function (ev) {
      var f = ev.target.getAttribute('data-f');
      if (f === 'q') {
        s.q = ev.target.value;
        paint();
      } else if (f === 'ar') {
        draft('ar', ev.target.value);
        paint();
      } else if (f === 'cv') {
        s.cv = ev.target.value;
        paint();
      }
    });
    sizes();
  }

  /* 23. 404 page ----------------------------------------------------- */
  // A small index of cars, pages and answers; in production search the real site.
  var NF_INDEX = [
    ['Car', 'Serpent Roadster 427', '1965 · $1,490 / mo', 'listing-single-v1.html'],
    ['Car', 'Porsche 911 GT3', '2024 · $2,180 / mo', 'listing-single-v1.html'],
    ['Car', 'Lucid Air Sapphire', '2023 · $1,960 / mo', 'listing-single-v1.html'],
    ['Car', 'Aston Martin DB11', '2022 · $1,720 / mo', 'listing-single-v1.html'],
    ['Car', 'Ferrari Dino 246 GT', '1972 · $2,450 / mo', 'listing-single-v1.html'],
    ['Car', 'Mercedes-AMG G 63', '2024 · $2,690 / mo', 'listing-single-v1.html'],
    ['Page', 'Home', 'Start here', 'index.html'],
    ['Page', 'Inventory', '98 verified cars', 'listing-v1.html'],
    ['Page', 'About', 'Our story and team', 'about.html'],
    ['Page', 'Service', 'Inspection, detailing, care', 'service.html'],
    ['Page', 'Pricing', 'Plans and fees', 'pricing.html'],
    ['Page', 'Contact', 'Talk to a human', 'contact.html'],
    ['Page', 'Terms', 'Terms & Conditions', 'terms.html'],
    ['Answer', 'Can I return a car?', 'FAQ · Warranty & returns', 'faq.html'],
    ['Answer', 'How does delivery work?', 'FAQ · Delivery', 'faq.html'],
    ['Answer', 'What rates do you offer?', 'FAQ · Financing', 'faq.html']
  ];

  function initNotFound() {
    var form = $('.js-nf-form');
    if (!form) {
      return;
    }
    var input = $('.js-nf-q');
    var res = $('.js-nf-res');
    var list = $('.js-nf-list');
    var go = $('.js-nf-go');
    var hits = [];

    // the path that was asked for (when served by the ErrorDocument)
    if (!/(^|\/)404\.html$/.test(location.pathname) && location.protocol !== 'file:') {
      setText('.js-nf-url', (location.host + location.pathname).replace(/^www\./, ''));
    }

    function paint() {
      var q = input.value.trim().toLowerCase();
      hits = q ? NF_INDEX.filter(function (x) {
        return (x[1] + ' ' + x[2] + ' ' + x[0]).toLowerCase().indexOf(q) > -1;
      }) : [];
      res.hidden = !q;
      setText('.js-nf-hits', q ? hits.length + ' found' : '');
      go.textContent = q ? '×' : '→';
      go.setAttribute('aria-label', q ? 'Clear the search' : 'Search');
      go.type = q ? 'button' : 'submit';
      $('.js-nf-none').hidden = !q || hits.length > 0;
      setText('.js-nf-qtxt', input.value.trim());
      list.innerHTML = hits.slice(0, 5).map(function (x) {
        var t = esc(x[1]);
        var at = x[1].toLowerCase().indexOf(q);
        if (at > -1) {
          t = esc(x[1].slice(0, at)) + '<mark>' + esc(x[1].slice(at, at + q.length)) + '</mark>' + esc(x[1].slice(at + q.length));
        }
        return '<li><a class="nfh__hit" href="' + x[3] + '"><span class="nfh__kind">' + x[0] + '</span>' +
          '<span class="nfh__ht"><span class="nfh__hn">' + t + '</span><span class="nfh__hs">' + esc(x[2]) + '</span></span>' +
          '<span aria-hidden="true">→</span></a></li>';
      }).join('');
    }

    input.addEventListener('input', paint);
    go.addEventListener('click', function (e) {
      if (input.value.trim()) {
        e.preventDefault();
        input.value = '';
        paint();
        input.focus();
      }
    });
    form.addEventListener('submit', function (e) {
      // Enter opens the first hit; with none, the search goes on to the inventory
      if (hits.length) {
        e.preventDefault();
        location.href = hits[0][3];
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && input.value) {
        input.value = '';
        paint();
      }
    });

    // In production send document.referrer and the path to your logging here.
    $('.js-nf-report').addEventListener('click', function () {
      this.textContent = 'Thanks — reported ✓';
      this.classList.add('is-done');
      this.disabled = true;
    });
  }

  /* 24. Init ---------------------------------------------------------- */
  syncUnits();
  window.addEventListener('resize', syncUnits);

  document.addEventListener('DOMContentLoaded', function () {
    syncUnits();
    initTheme();
    initAccent();
    initNav();
    initChips();
    initRail();
    initQuiz();
    initWeek();
    initFinance();
    initReviews();
    initNews();
    initAuth();
    paintHeaderAvatar();
    window.addEventListener('storage', function (e) {
      if (e.key === 'avava-profile') {
        paintHeaderAvatar();
      }
    });
    initPreloader();
    initMap();
    initPackages();
    initBooking();
    initServiceFaq();
    applyData(document);
    initPlans();
    initCompare();
    initFees();
    initAddons();
    initFlipFaq();
    initHelp();
    initHelpContact();
    initHelpGuides();
    initContactHours();
    initContactCallback();
    initContactForm();
    initTerms();
    initListing();
    initListingSidebar();
    initListingMap();
    initCommandBar();
    initListingSingle();
    initListingSingle2();
    initListingSingle3();
    initListingSingle4();
    initListingSingle5();
    initListingSingle6();
    initShop();
    initShop2();
    initShop3();
    initShop4();
    initShopSingle1();
    initShopSingle2();
    initCheckout();
    initBlog();
    initBlogPost();
    initAccount();
    initProfile();
    initGarage();
    initSaved();
    initListings();
    initOrders();
    initTestDrives();
    initTradeIn();
    initMessages();
    initPayments();
    initNotifications();
    initSecurity();
    initPreferences();
    initSell();
    initDealerShell();
    initDealerDash();
    initLeads();
    initDealerDrives();
    initDeals();
    initInventory();
    initAddListing();
    initTradeIns();
    initFinanceApps();
    initDealerMessages();
    initDealerReviews();
    initDealerAnalytics();
    initDealerTeam();
    initDealerProfile();
    initDealerBilling();
    initDealerSettings();
    initNotFound();
  });
}());
