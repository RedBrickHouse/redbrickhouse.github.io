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

document.querySelectorAll('.section-label, .section-title, .section-sub, .about-text, .about-visual, .story-card, .service-card, .portfolio-item, .contact-info, .contact-action').forEach(el => {
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
  const lang = localStorage.getItem('bh-lang') || 'ko';
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
