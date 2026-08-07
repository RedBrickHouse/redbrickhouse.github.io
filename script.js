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
  fd.append('연락처 (Contact)', contact);
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
  fetch('https://formsubmit.co/ajax/angela@redbrickhouse.gg', {
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

// News marquee: continuous smooth auto-scroll with seamless loop
(function () {
  const track = document.querySelector('.news-grid');
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
  const carousel = track.closest('.news-carousel') || track;
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
  function loopWidth() {
    const firstClone = track.children[cards.length];
    return firstClone.offsetLeft - cards[0].offsetLeft;
  }
  function sync() { pos = track.scrollLeft; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function stepBy(dir) {
    const card = track.querySelector('.news-card');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 28;
    const step = (card ? card.getBoundingClientRect().width : 300) + gap;
    const lw = loopWidth();
    sync();
    let from = pos;
    // keep position inside the first card set; the clone set makes the jump invisible
    if (lw > 0 && from >= lw) { from -= lw; track.scrollLeft = from; }
    let to = from + dir * step;
    if (to < 0) { from += lw; track.scrollLeft = from; to += lw; }
    animFrom = from; animTo = to; animStart = performance.now();
    mode = 'anim';
  }
  const prev = document.querySelector('.news-prev');
  const next = document.querySelector('.news-next');
  if (prev) prev.addEventListener('click', () => stepBy(-1));
  if (next) next.addEventListener('click', () => stepBy(1));
  carousel.addEventListener('mouseenter', () => { paused = true; });
  carousel.addEventListener('mouseleave', () => { if (mode !== 'anim') sync(); paused = false; });
  carousel.addEventListener('touchstart', () => { paused = true; }, { passive: true });
  carousel.addEventListener('touchend', () => { if (mode !== 'anim') sync(); paused = false; }, { passive: true });
  carousel.addEventListener('focusin', () => { paused = true; });
  carousel.addEventListener('focusout', () => { if (mode !== 'anim') sync(); paused = false; });
  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
  }).observe(carousel);
  function tick(ts) {
    if (last === null) last = ts;
    const dt = Math.min(ts - last, 100);
    last = ts;
    const lw = loopWidth();
    if (mode === 'anim') {
      // arrow step runs even while hovered
      const t = Math.min((ts - animStart) / ANIM_MS, 1);
      pos = animFrom + (animTo - animFrom) * easeOutCubic(t);
      if (t >= 1) {
        mode = 'auto';
        if (lw > 0 && pos >= lw) pos -= lw;
      }
      track.scrollLeft = pos;
    } else if (!reducedMotion && !paused && inView && !document.hidden) {
      pos += (SPEED * dt) / 1000;
      if (lw > 0 && pos >= lw) pos -= lw;
      track.scrollLeft = pos;
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
