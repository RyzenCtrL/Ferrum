(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- mobile nav (with focus trap) ---- */
  var burger = document.querySelector('.burger');
  var mobileNav = document.getElementById('mobile-nav');
  if (burger && mobileNav) {
    function focusableIn(el) {
      return Array.prototype.slice.call(
        el.querySelectorAll('a[href], button:not([disabled])')
      );
    }

    function closeMobileNav(returnFocus) {
      burger.setAttribute('aria-expanded', 'false');
      mobileNav.hidden = true;
      if (returnFocus) burger.focus();
    }

    function openMobileNav() {
      burger.setAttribute('aria-expanded', 'true');
      mobileNav.hidden = false;
      var items = focusableIn(mobileNav);
      if (items.length) items[0].focus();
    }

    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      if (open) closeMobileNav(false); else openMobileNav();
    });

    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closeMobileNav(false); });
    });

    mobileNav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMobileNav(true);
        return;
      }
      if (e.key !== 'Tab') return;
      var items = focusableIn(mobileNav);
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* ---- hero split-text intro ---- */
  function splitWords(el) {
    var kids = Array.prototype.slice.call(el.childNodes);
    var units = [];
    el.innerHTML = '';
    kids.forEach(function (node) {
      if (node.nodeType === 3) { // text node -> split into words, keep whitespace
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (part === '') return;
          if (/^\s+$/.test(part)) {
            el.appendChild(document.createTextNode(part));
          } else {
            var s = document.createElement('span');
            s.className = 'sr-unit';
            s.textContent = part;
            el.appendChild(s);
            units.push(s);
          }
        });
      } else if (node.nodeName === 'BR') {
        el.appendChild(node.cloneNode());
      } else { // element (e.g. gradient span) -> animate as one unit, keep intact
        node.classList.add('sr-unit');
        el.appendChild(node);
        units.push(node);
      }
    });
    return units;
  }

  function heroIntro() {
    var copy = document.querySelector('.hero__copy');
    if (!copy || reduce) return; // reduced motion: leave everything visible
    var title = copy.querySelector('.hi--title');
    var words = title ? splitWords(title) : [];
    var items = copy.querySelectorAll('.hi');
    copy.classList.add('is-armed');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        words.forEach(function (u, i) {
          u.style.transitionDelay = (0.12 + i * 0.06) + 's';
          u.classList.add('is-in');
        });
        items.forEach(function (el, i) {
          // first .hi is the eyebrow (above the title) -> lead in; rest follow the title
          el.style.transitionDelay = (i === 0 ? 0 : 0.5 + (i - 1) * 0.12) + 's';
          el.classList.add('is-in');
        });
      });
    });
  }
  heroIntro();

  /* ---- scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---- count-up + progress bar (hero tracker) ---- */
  var panel = document.querySelector('.hero__panel');
  var fill = document.querySelector('.tracker__fill');

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduce) { el.textContent = String(target); return; }
    var start = performance.now(), dur = 1400;
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function runTracker() {
    if (fill) fill.style.width = '62%';
    document.querySelectorAll('.metric__val[data-count]').forEach(countUp);
  }

  if (panel) {
    if (reduce || !('IntersectionObserver' in window)) {
      runTracker();
    } else {
      var pio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          runTracker();
          pio.disconnect();
        }
      }, { threshold: 0.4 });
      pio.observe(panel);
    }
  }

  /* ---- why FERRUM tabs ---- */
  (function initWhyTabs() {
    var root = document.querySelector('.why-tabs');
    if (!root) return;
    var tabs = Array.prototype.slice.call(root.querySelectorAll('.why-nav__item'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('.why-panel__slide'));
    if (!tabs.length || !panels.length) return;

    function activate(index) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (panel, i) {
        if (i === index) {
          panel.hidden = false;
          panel.classList.add('is-active');
          if (!reduce) {
            panel.classList.remove('is-anim-in');
            void panel.offsetWidth; // restart the CSS animation
            panel.classList.add('is-anim-in');
          }
        } else {
          panel.hidden = true;
          panel.classList.remove('is-active', 'is-anim-in');
        }
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(i); });
      tab.addEventListener('keydown', function (e) {
        var dir = 0;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') dir = 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') dir = -1;
        else return;
        e.preventDefault();
        var next = (i + dir + tabs.length) % tabs.length;
        tabs[next].focus();
        activate(next);
      });
    });
  })();

  /* ---- works carousel (native, no dependencies) ---- */
  (function initCarousel() {
    var root = document.getElementById('works-carousel');
    if (!root) return;

    var viewport = root.querySelector('.carousel__viewport');
    var track = root.querySelector('.carousel__track');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.carousel__slide'));
    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var dotsWrap = root.querySelector('[data-carousel-dots]');
    if (!viewport || !slides.length) return;

    slides.forEach(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', 'Слайд ' + (i + 1));
      dot.addEventListener('click', function () { scrollToSlide(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function currentIndex() {
      var center = viewport.scrollLeft + viewport.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      slides.forEach(function (slide, i) {
        var mid = slide.offsetLeft + slide.offsetWidth / 2;
        var d = Math.abs(mid - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function updateUI() {
      var idx = currentIndex();
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
      var maxScroll = viewport.scrollWidth - viewport.clientWidth - 2;
      if (prevBtn) prevBtn.disabled = viewport.scrollLeft <= 2;
      if (nextBtn) nextBtn.disabled = viewport.scrollLeft >= maxScroll;
    }

    function scrollToSlide(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      viewport.scrollTo({ left: slides[i].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { scrollToSlide(currentIndex() - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { scrollToSlide(currentIndex() + 1); });

    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollToSlide(currentIndex() + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToSlide(currentIndex() - 1); }
    });

    var scrollTimer = null;
    viewport.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateUI, 80);
    }, { passive: true });

    window.addEventListener('resize', updateUI);

    /* drag-to-scroll with mouse */
    var isDown = false, dragged = false, startX = 0, startScroll = 0;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return; // native touch scrolling handles this
      isDown = true; dragged = false;
      startX = e.clientX; startScroll = viewport.scrollLeft;
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) dragged = true;
      viewport.scrollLeft = startScroll - dx;
    });
    function endDrag() { isDown = false; }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('click', function (e) {
      if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
    }, true);

    viewport.scrollLeft = 0; // guard against browser scroll-position restoration on reload
    updateUI();
  })();

  /* ---- specular rim-light on primary CTAs (native equivalent of SpecularButton) ---- */
  (function initSpecButtons() {
    var buttons = document.querySelectorAll('.spec-btn');
    if (!buttons.length || reduce) return;

    var PROXIMITY = 220;
    var pointer = { x: -9999, y: -9999, active: false };
    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
    }, { passive: true });
    window.addEventListener('pointerleave', function () { pointer.active = false; });

    var state = Array.prototype.map.call(buttons, function (el) {
      return { el: el, angle: -Math.PI / 2, bright: 0 };
    });

    function projectToRect(angle, halfW, halfH) {
      var c = Math.cos(angle), s = Math.sin(angle);
      var tx = c !== 0 ? halfW / Math.abs(c) : Infinity;
      var ty = s !== 0 ? halfH / Math.abs(s) : Infinity;
      var t = Math.min(tx, ty);
      return { x: c * t, y: s * t };
    }

    function frame() {
      state.forEach(function (s) {
        var rect = s.el.getBoundingClientRect();
        var halfW = rect.width / 2, halfH = rect.height / 2;
        var cx = rect.left + halfW, cy = rect.top + halfH;

        var dx = Math.max(rect.left - pointer.x, 0, pointer.x - rect.right);
        var dy = Math.max(rect.top - pointer.y, 0, pointer.y - rect.bottom);
        var dist = Math.hypot(dx, dy);
        var t = pointer.active ? Math.max(0, 1 - dist / PROXIMITY) : 0;
        var brightTarget = t * t * (3 - 2 * t);

        var targetAngle = Math.atan2(pointer.y - cy, pointer.x - cx);
        var diff = ((targetAngle - s.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        s.angle += diff * 0.18;
        s.bright += (brightTarget - s.bright) * 0.18;

        var p = projectToRect(s.angle, halfW, halfH);
        var xPct = (p.x / halfW) * 50 + 50;
        var yPct = (p.y / halfH) * 50 + 50;

        s.el.style.setProperty('--sb-x', xPct.toFixed(1) + '%');
        s.el.style.setProperty('--sb-y', yPct.toFixed(1) + '%');
        s.el.style.setProperty('--sb-bright', s.bright.toFixed(3));
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---- animated FAQ accordion (native, Web Animations API) ---- */
  if (!reduce && typeof Element !== 'undefined' && Element.prototype.animate) {
    document.querySelectorAll('.faq__item').forEach(function (details) {
      var summary = details.querySelector('summary');
      var body = details.querySelector('.faq__body');
      if (!summary || !body) return;

      var animation = null;
      var isClosing = false;
      var isExpanding = false;

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        details.style.overflow = 'hidden';
        if (isClosing || !details.open) {
          expand();
        } else if (isExpanding || details.open) {
          shrink();
        }
      });

      function shrink() {
        isClosing = true;
        var startHeight = details.offsetHeight;
        var endHeight = summary.offsetHeight;
        if (animation) animation.cancel();
        animation = details.animate(
          { height: [startHeight + 'px', endHeight + 'px'] },
          { duration: 300, easing: 'cubic-bezier(.22,.61,.36,1)' }
        );
        animation.onfinish = function () { onFinish(false); };
        animation.oncancel = function () { isClosing = false; };
      }

      function expand() {
        details.style.height = details.offsetHeight + 'px';
        details.open = true;
        requestAnimationFrame(grow);
      }

      function grow() {
        isExpanding = true;
        var startHeight = details.offsetHeight;
        var endHeight = summary.offsetHeight + body.offsetHeight;
        if (animation) animation.cancel();
        animation = details.animate(
          { height: [startHeight + 'px', endHeight + 'px'] },
          { duration: 300, easing: 'cubic-bezier(.22,.61,.36,1)' }
        );
        animation.onfinish = function () { onFinish(true); };
        animation.oncancel = function () { isExpanding = false; };
      }

      function onFinish(open) {
        details.open = open;
        animation = null;
        isClosing = false;
        isExpanding = false;
        details.style.height = '';
        details.style.overflow = '';
      }
    });
  }

  /* ---- lead form stepper (native equivalent of React Bits Stepper) ---- */
  (function initLeadStepper() {
    var form = document.getElementById('lead-form');
    if (!form) return;

    var track = document.getElementById('stepper-track');
    var panels = Array.prototype.slice.call(form.querySelectorAll('.stepper__step'));
    var dots = Array.prototype.slice.call(form.querySelectorAll('.stepper__dot'));
    var lines = Array.prototype.slice.call(form.querySelectorAll('.stepper__line'));
    var chips = Array.prototype.slice.call(form.querySelectorAll('.chip'));
    var backBtn = form.querySelector('[data-stepper-back]');
    var nextBtn = form.querySelector('[data-stepper-next]');
    var submitBtn = form.querySelector('[data-stepper-submit]');
    var totalSteps = panels.length;
    var currentStep = 1;

    function showError(id, message) {
      var input = document.getElementById(id);
      var err = form.querySelector('[data-error-for="' + id + '"]');
      if (input) { input.closest('.field').classList.add('has-error'); input.setAttribute('aria-invalid', 'true'); }
      if (err) { err.textContent = message; err.hidden = false; }
    }
    function clearError(id) {
      var input = document.getElementById(id);
      var err = form.querySelector('[data-error-for="' + id + '"]');
      if (input) { input.closest('.field').classList.remove('has-error'); input.removeAttribute('aria-invalid'); }
      if (err) { err.hidden = true; }
    }

    function formatPhone(raw) {
      var digits = raw.replace(/\D/g, '');
      if (!digits) return '';
      if (digits.charAt(0) === '8') digits = '7' + digits.slice(1);
      if (digits.charAt(0) !== '7') digits = '7' + digits;
      digits = digits.slice(0, 11);
      var rest = digits.slice(1);
      var out = '+7';
      if (rest.length) out += ' (' + rest.slice(0, 3);
      if (rest.length >= 3) out += ')';
      if (rest.length > 3) out += ' ' + rest.slice(3, 6);
      if (rest.length > 6) out += '-' + rest.slice(6, 8);
      if (rest.length > 8) out += '-' + rest.slice(8, 10);
      return out;
    }
    function isPhoneValid(value) { return value.replace(/\D/g, '').length === 11; }
    function isNameValid(value) { return value.trim().length >= 2; }

    function refreshFieldState(input, valid) {
      var field = input.closest('.field');
      if (field) field.classList.toggle('is-valid', valid);
    }

    function validateStep(step) {
      var servicesErr = form.querySelector('[data-error-for="services"]');
      if (step === 1) {
        var anySelected = chips.some(function (c) { return c.classList.contains('is-selected'); });
        if (servicesErr) servicesErr.hidden = anySelected;
        if (!anySelected && servicesErr) servicesErr.textContent = 'Выберите хотя бы одно направление';
        return anySelected;
      }
      if (step !== 2) return true;
      var ok = true;
      var name = document.getElementById('name');
      var phone = document.getElementById('phone');
      clearError('name'); clearError('phone');
      if (!isNameValid(name.value)) { showError('name', 'Введите имя'); ok = false; }
      if (!isPhoneValid(phone.value)) { showError('phone', 'Введите номер телефона полностью'); ok = false; }
      return ok;
    }

    function updateIndicators() {
      dots.forEach(function (dot, i) {
        var n = i + 1;
        dot.classList.toggle('is-active', n === currentStep);
        dot.classList.toggle('is-done', n < currentStep);
        if (n === currentStep) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
      lines.forEach(function (line, i) { line.classList.toggle('is-complete', i + 1 < currentStep); });
    }

    function updateFooter() {
      backBtn.hidden = currentStep === 1;
      nextBtn.hidden = currentStep === totalSteps;
      submitBtn.hidden = currentStep !== totalSteps;
    }

    function updateSummary() {
      var services = chips.filter(function (c) { return c.classList.contains('is-selected'); })
        .map(function (c) { return c.dataset.value; });
      form.querySelector('[data-summary="services"]').textContent = services.length ? services.join(', ') : '—';
      form.querySelector('[data-summary="task"]').textContent = document.getElementById('task').value.trim() || '—';
      form.querySelector('[data-summary="name"]').textContent = document.getElementById('name').value.trim() || '—';
      form.querySelector('[data-summary="phone"]').textContent = document.getElementById('phone').value.trim() || '—';
    }

    function goTo(step, dir) {
      if (step < 1 || step > totalSteps || step === currentStep) return;
      var oldPanel = panels[currentStep - 1];
      var newPanel = panels[step - 1];
      currentStep = step;
      updateIndicators();
      updateFooter();
      if (step === totalSteps) updateSummary();

      if (reduce) {
        oldPanel.classList.remove('is-active');
        newPanel.classList.add('is-active');
        return;
      }

      var startHeight = track.offsetHeight;
      track.style.height = startHeight + 'px';

      oldPanel.classList.remove('is-active');
      oldPanel.classList.add('is-transitioning');
      newPanel.classList.add('is-transitioning');
      newPanel.style.transform = dir > 0 ? 'translateX(28px)' : 'translateX(-28px)';
      newPanel.style.opacity = '0';

      var targetHeight = newPanel.offsetHeight;

      requestAnimationFrame(function () {
        track.style.height = targetHeight + 'px';
        oldPanel.style.transform = dir > 0 ? 'translateX(-28px)' : 'translateX(28px)';
        oldPanel.style.opacity = '0';
        newPanel.style.transform = 'translateX(0)';
        newPanel.style.opacity = '1';
      });

      setTimeout(function () {
        oldPanel.classList.remove('is-transitioning');
        oldPanel.style.transform = '';
        oldPanel.style.opacity = '';
        newPanel.classList.remove('is-transitioning');
        newPanel.classList.add('is-active');
        newPanel.style.transform = '';
        newPanel.style.opacity = '';
        track.style.height = '';
      }, 380);
    }

    nextBtn.addEventListener('click', function () {
      if (!validateStep(currentStep)) return;
      goTo(currentStep + 1, 1);
    });
    backBtn.addEventListener('click', function () { goTo(currentStep - 1, -1); });

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        var target = i + 1;
        if (target === currentStep) return;
        if (target > currentStep) {
          for (var s = currentStep; s < target; s++) { if (!validateStep(s)) return; }
        }
        goTo(target, target > currentStep ? 1 : -1);
      });
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chip.classList.toggle('is-selected');
        var servicesErr = form.querySelector('[data-error-for="services"]');
        if (servicesErr && chips.some(function (c) { return c.classList.contains('is-selected'); })) {
          servicesErr.hidden = true;
        }
      });
    });

    var nameInput = document.getElementById('name');
    var phoneInput = document.getElementById('phone');

    if (nameInput) {
      nameInput.addEventListener('input', function () {
        clearError('name');
        refreshFieldState(nameInput, isNameValid(nameInput.value));
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        var formatted = formatPhone(phoneInput.value);
        phoneInput.value = formatted;
        try { phoneInput.setSelectionRange(formatted.length, formatted.length); } catch (e) { /* noop */ }
        clearError('phone');
        refreshFieldState(phoneInput, isPhoneValid(formatted));
      });
    }
  })();

  /* ---- magic bento cards on services (native equivalent of MagicBento) ---- */
  (function initMagicCards() {
    var section = document.getElementById('services');
    var grid = section && section.querySelector('.cards');
    var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll('.card')) : [];
    if (!cards.length) return;

    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduce || !finePointer || window.innerWidth <= 768) return;

    var RADIUS = 300;
    var PROXIMITY = RADIUS * 0.5;
    var FADE = RADIUS * 0.75;
    var PARTICLE_COUNT = 6;

    var spotlight = document.createElement('div');
    spotlight.className = 'services-spotlight';
    document.body.appendChild(spotlight);

    function setGlow(card, mx, my, intensity) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--glow-x', ((mx - rect.left) / rect.width) * 100 + '%');
      card.style.setProperty('--glow-y', ((my - rect.top) / rect.height) * 100 + '%');
      card.style.setProperty('--glow-intensity', intensity);
    }

    document.addEventListener('mousemove', function (e) {
      var rect = grid.getBoundingClientRect();
      var inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (!inside) {
        spotlight.style.opacity = 0;
        cards.forEach(function (c) { c.style.setProperty('--glow-intensity', 0); });
        return;
      }

      spotlight.style.left = e.clientX + 'px';
      spotlight.style.top = e.clientY + 'px';

      var minDist = Infinity;
      cards.forEach(function (card) {
        var cr = card.getBoundingClientRect();
        var cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
        var dist = Math.max(0, Math.hypot(e.clientX - cx, e.clientY - cy) - Math.max(cr.width, cr.height) / 2);
        minDist = Math.min(minDist, dist);

        var intensity = 0;
        if (dist <= PROXIMITY) intensity = 1;
        else if (dist <= FADE) intensity = (FADE - dist) / (FADE - PROXIMITY);

        setGlow(card, e.clientX, e.clientY, intensity);
      });

      spotlight.style.opacity = minDist <= PROXIMITY ? 0.8
        : minDist <= FADE ? ((FADE - minDist) / (FADE - PROXIMITY)) * 0.8
        : 0;
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      spotlight.style.opacity = 0;
      cards.forEach(function (c) { c.style.setProperty('--glow-intensity', 0); });
    });

    cards.forEach(function (card) {
      var particles = [];
      var particleTimers = [];

      function spawnParticles() {
        var rect = card.getBoundingClientRect();
        for (var i = 0; i < PARTICLE_COUNT; i++) {
          (function (i) {
            var t = setTimeout(function () {
              var p = document.createElement('span');
              p.className = 'card-particle';
              p.style.left = (Math.random() * rect.width) + 'px';
              p.style.top = (Math.random() * rect.height) + 'px';
              p.style.setProperty('--p-dx', ((Math.random() - 0.5) * 40) + 'px');
              p.style.setProperty('--p-dy', ((Math.random() - 0.5) * 40 - 10) + 'px');
              card.appendChild(p);
              particles.push(p);
            }, i * 90);
            particleTimers.push(t);
          })(i);
        }
      }

      function clearParticles() {
        particleTimers.forEach(clearTimeout);
        particleTimers = [];
        particles.forEach(function (p) {
          p.style.transition = 'opacity .3s ease';
          p.style.opacity = 0;
          setTimeout(function () { p.remove(); }, 300);
        });
        particles = [];
      }

      card.addEventListener('mouseenter', spawnParticles);

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left, y = e.clientY - rect.top;
        var cx = rect.width / 2, cy = rect.height / 2;
        var rotateX = ((y - cy) / cy) * -6;
        var rotateY = ((x - cx) / cx) * 6;
        var magX = (x - cx) * 0.04;
        var magY = (y - cy) * 0.04;
        card.classList.remove('card--settling');
        card.style.transform = 'perspective(900px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' +
          rotateY.toFixed(2) + 'deg) translate3d(' + magX.toFixed(1) + 'px,' + (magY - 6).toFixed(1) + 'px,0)';
      });

      card.addEventListener('mouseleave', function () {
        card.classList.add('card--settling');
        card.style.transform = 'translate3d(0,0,0) rotateX(0) rotateY(0)';
        clearParticles();
        setTimeout(function () { card.classList.remove('card--settling'); }, 400);
      });

      card.addEventListener('click', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left, y = e.clientY - rect.top;
        var maxDist = Math.max(
          Math.hypot(x, y), Math.hypot(x - rect.width, y),
          Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height)
        );
        var ripple = document.createElement('span');
        ripple.className = 'card-ripple';
        ripple.style.width = ripple.style.height = (maxDist * 2) + 'px';
        ripple.style.left = (x - maxDist) + 'px';
        ripple.style.top = (y - maxDist) + 'px';
        card.appendChild(ripple);
        requestAnimationFrame(function () { ripple.classList.add('is-live'); });
        setTimeout(function () { ripple.remove(); }, 850);
      });
    });
  })();

  /* ---- header shadow on scroll ---- */
  var header = document.querySelector('.site-header');
  var last = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if ((y > 8) !== (last > 8) && header) {
      header.style.boxShadow = y > 8 ? '0 10px 30px -12px rgba(0,0,0,.6)' : 'none';
    }
    last = y;
  }, { passive: true });
})();
