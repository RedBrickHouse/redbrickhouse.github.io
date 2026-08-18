// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// Mobile menu toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('active');
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// Scroll fade-in animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section-label, .section-title, .section-sub, .about-text, .about-visual, .story-card, .service-card, .portfolio-item, .news-card, .contact-info, .contact-action').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// Contact modal
const contactModal = document.getElementById('contactModal');
const inquiryForm = document.getElementById('inquiryForm');
const inquiryStatus = document.getElementById('inquiryStatus');
const inquirySend = document.getElementById('inquirySend');

function tr(key) {
  const lang = typeof pageLang === 'function' ? pageLang() : 'ko';
  const dict = translations[lang] || translations.ko;
  return dict[key] || key;
}

function openContactModal() {
  contactModal.hidden = false;
  document.body.style.overflow = 'hidden';
  inquiryStatus.hidden = true;
  document.getElementById('inqName').focus();
}

function closeContactModal() {
  contactModal.hidden = true;
  document.body.style.overflow = '';
}

document.getElementById('contactOpen').addEventListener('click', openContactModal);
document.getElementById('contactClose').addEventListener('click', closeContactModal);
contactModal.addEventListener('click', (e) => {
  if (e.target === contactModal) closeContactModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !contactModal.hidden) closeContactModal();
});

inquiryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('inqName').value.trim();
  const contact = document.getElementById('inqContact').value.trim();
  const message = document.getElementById('inqMsg').value.trim();
  if (!name || !contact || !message) {
    inquiryStatus.textContent = tr('modalRequired');
    inquiryStatus.className = 'modal-status err';
    inquiryStatus.hidden = false;
    return;
  }
  const fd = new FormData();
  fd.append('이름 (Name)', name);
  fd.append('이메일 (Email)', contact);
  fd.append('회사 (Company)', document.getElementById('inqCompany').value.trim());
  const inqSource = document.getElementById('inqSource');
  fd.append('알게 된 경로 (Source)', inqSource.value ? inqSource.options[inqSource.selectedIndex].text : '');
  fd.append('제안사항 (Proposal)', message);
  fd.append('_honey', inquiryForm.querySelector('.hp-field').value);
  fd.append('_subject', '[RED BRICK HOUSE] Website Inquiry');
  fd.append('_template', 'table');
  fd.append('_captcha', 'false');
  inquirySend.disabled = true;
  inquiryStatus.textContent = tr('modalSending');
  inquiryStatus.className = 'modal-status';
  inquiryStatus.hidden = false;
  fetch('https://formsubmit.co/ajax/contact@redbrickhouse.gg', {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: fd
  })
    .then(r => r.json())
    .then(res => {
      if (res.success === 'true' || res.success === true) {
        inquiryStatus.textContent = tr('modalSuccess');
        inquiryStatus.className = 'modal-status ok';
        inquiryForm.reset();
      } else {
        throw new Error(res.message || 'send failed');
      }
    })
    .catch((err) => {
      console.error('inquiry send failed:', err);
      inquiryStatus.textContent = tr('modalFail');
      inquiryStatus.className = 'modal-status err';
    })
    .finally(() => {
      inquirySend.disabled = false;
    });
});

// First-visit language suggestion (Korean root page only).
// A dismissible suggestion, not an automatic redirect, so it stays SEO-safe.
(function suggestLang() {
  if (document.documentElement.lang !== 'ko') return;
  if (location.pathname !== '/' && location.pathname !== '/index.html') return;
  const nav = (navigator.language || 'ko').toLowerCase();
  let target = null, label = '';
  if (nav.indexOf('en') === 0) { target = '/en/'; label = 'View this page in English'; }
  else if (nav.indexOf('zh') === 0) { target = '/zh/'; label = '查看中文页面'; }
  if (!target) return;
  try { if (sessionStorage.getItem('bh-lang-suggest') === 'off') return; } catch (e) {}
  const bar = document.createElement('div');
  bar.className = 'lang-suggest';
  const a = document.createElement('a');
  a.href = target; a.textContent = label; a.className = 'lang-suggest-link';
  const x = document.createElement('button');
  x.type = 'button'; x.className = 'lang-suggest-close'; x.setAttribute('aria-label', 'Close');
  x.innerHTML = '&times;';
  x.addEventListener('click', () => {
    bar.remove();
    try { sessionStorage.setItem('bh-lang-suggest', 'off'); } catch (e) {}
  });
  bar.appendChild(a); bar.appendChild(x);
  document.body.appendChild(bar);
})();

// News marquee: continuous auto-scroll with seamless loop.
// Rendered with translate3d (GPU sub-pixel) instead of scrollLeft, which
// snaps to whole pixels and looks juddery at slow speeds.
(function () {
  const grid = document.querySelector('.news-grid');
  const track = grid ? grid.querySelector('.news-track') : null;
  if (!track) return;
  const cards = Array.from(track.children);
  if (cards.length < 2) return;
  // Clone the card set once so the loop wraps without a visible jump.
  cards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('tabindex', '-1');
    clone.classList.add('visible');
    track.appendChild(clone);
  });
  const carousel = grid.closest('.news-carousel') || grid;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = 42; // px per second
  const ANIM_MS = 450; // arrow step duration
  let paused = false;
  let inView = false;
  let pos = 0;
  let last = null;
  let mode = 'auto'; // 'auto' (marquee) | 'anim' (arrow step)
  let animFrom = 0;
  let animTo = 0;
  let animStart = 0;
  let dragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartPos = 0;
  function loopWidth() {
    const firstClone = track.children[cards.length];
    return firstClone.offsetLeft - cards[0].offsetLeft;
  }
  function norm() {
    const lw = loopWidth();
    if (lw > 0) pos = ((pos % lw) + lw) % lw;
  }
  function render() {
    track.style.transform = 'translate3d(' + (-pos) + 'px, 0, 0)';
  }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function stepBy(dir) {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 28;
    const step = cards[0].getBoundingClientRect().width + gap;
    if (mode === 'anim') pos = animTo; // rapid clicks accumulate
    norm();
    let from = pos;
    let to = from + dir * step;
    if (to < 0) { from += loopWidth(); to += loopWidth(); } // clone set makes the jump invisible
    animFrom = from; animTo = to; animStart = performance.now();
    mode = 'anim';
  }
  const prev = document.querySelector('.news-prev');
  const next = document.querySelector('.news-next');
  if (prev) prev.addEventListener('click', () => stepBy(-1));
  if (next) next.addEventListener('click', () => stepBy(1));
  // Drag to browse (mouse and touch); vertical touch scroll stays native via touch-action.
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; dragMoved = false;
    dragStartX = e.clientX; dragStartPos = pos;
    mode = 'auto'; // cancel a pending arrow step
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 5) dragMoved = true;
    if (dragMoved) { pos = dragStartPos - dx; norm(); render(); }
  });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointercancel', () => { dragging = false; });
  track.addEventListener('dragstart', (e) => e.preventDefault());
  track.addEventListener('click', (e) => {
    if (dragMoved) { e.preventDefault(); e.stopPropagation(); dragMoved = false; }
  }, true);
  carousel.addEventListener('mouseenter', () => { paused = true; });
  carousel.addEventListener('mouseleave', () => { paused = false; });
  carousel.addEventListener('focusin', () => { paused = true; });
  carousel.addEventListener('focusout', () => { paused = false; });
  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
  }).observe(carousel);
  function tick(ts) {
    if (last === null) last = ts;
    const dt = Math.min(ts - last, 100);
    last = ts;
    if (mode === 'anim') {
      // arrow step runs even while hovered
      const t = Math.min((ts - animStart) / ANIM_MS, 1);
      pos = animFrom + (animTo - animFrom) * easeOutCubic(t);
      if (t >= 1) { mode = 'auto'; norm(); }
      render();
    } else if (!reducedMotion && !paused && !dragging && inView && !document.hidden) {
      pos += (SPEED * dt) / 1000;
      norm();
      render();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// Hero background video
const heroVideo = document.querySelector('.hero-bg-video');
if (heroVideo) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
  } else {
    heroVideo.muted = true;
    const playAttempt = heroVideo.play();
    if (playAttempt) playAttempt.catch(() => {});
  }
}
