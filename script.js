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
  const data = {
    '이름 (Name)': name,
    '연락처 (Contact)': contact,
    '회사 (Company)': document.getElementById('inqCompany').value.trim(),
    '알게 된 경로 (Source)': document.getElementById('inqSource').value,
    '문의사항 (Message)': message,
    '_honey': inquiryForm.querySelector('.hp-field').value,
    '_subject': '[RED BRICK HOUSE] Website Inquiry',
    '_template': 'table',
    '_captcha': 'false'
  };
  inquirySend.disabled = true;
  inquiryStatus.textContent = tr('modalSending');
  inquiryStatus.className = 'modal-status';
  inquiryStatus.hidden = false;
  fetch('https://formsubmit.co/ajax/reahrt@gmail.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(r => r.json())
    .then(res => {
      if (res.success === 'true' || res.success === true) {
        inquiryStatus.textContent = tr('modalSuccess');
        inquiryStatus.className = 'modal-status ok';
        inquiryForm.reset();
      } else {
        throw new Error('send failed');
      }
    })
    .catch(() => {
      inquiryStatus.textContent = tr('modalFail');
      inquiryStatus.className = 'modal-status err';
    })
    .finally(() => {
      inquirySend.disabled = false;
    });
});
