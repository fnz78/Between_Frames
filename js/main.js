/**
 * Main Application Logic
 * Translucent Navigation, Mobile Drawer, Hero Parallax, Portfolio Filters, Lightbox Modal & Services Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Elements
  const navToggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const header = document.querySelector('.site-header');

  // Toggle Mobile Menu
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      navToggle.classList.toggle('is-active');
      mobileNav.classList.toggle('is-open');
      document.body.classList.toggle('nav-open');
    });

    // Close menu when clicking backdrop or nav link
    const mobileLinks = mobileNav.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('is-active');
        mobileNav.classList.remove('is-open');
        document.body.classList.remove('nav-open');
      });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('is-active');
        mobileNav.classList.remove('is-open');
        document.body.classList.remove('nav-open');
      }
    });
  }

  // Header Scroll Blur & Shadow adjustment + Hero Background Parallax
  const heroBgImages = document.querySelectorAll('.hero-bg-image');
  
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    // Header shadow/blur update
    if (scrollY > 30) {
      header?.classList.add('is-scrolled');
    } else {
      header?.classList.remove('is-scrolled');
    }

    // Subtle Hero Image Parallax
    if (scrollY < window.innerHeight) {
      heroBgImages.forEach(img => {
        img.style.transform = `translateY(${scrollY * 0.28}px) scale(1.08)`;
      });
    }
  }, { passive: true });

  // Hero Photography Slide Switcher & WebGL Shader Sync
  const slides = document.querySelectorAll('.hero-bg-slide');
  const prevBtn = document.getElementById('slide-prev');
  const nextBtn = document.getElementById('slide-next');
  const currentCounter = document.getElementById('slide-current');
  let currentSlide = 0;

  function showSlide(index) {
    if (!slides.length) return;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    if (currentCounter) {
      currentCounter.textContent = String(index + 1).padStart(2, '0');
    }
    currentSlide = index;

    // Synchronize glass background animation pulse on photo slide change
    if (typeof window.triggerGlassPulse === 'function') {
      window.triggerGlassPulse(1.3);
    }
  }

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      const newIndex = (currentSlide - 1 + slides.length) % slides.length;
      showSlide(newIndex);
    });

    nextBtn.addEventListener('click', () => {
      const newIndex = (currentSlide + 1) % slides.length;
      showSlide(newIndex);
    });
  }

  // Trigger pulse on interactive elements hover
  const interactiveElements = document.querySelectorAll('.hero-actions a, .btn-glass, .btn-primary-glass, .hero-controls, .service-card, .photographer-portrait-wrapper');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (typeof window.triggerGlassPulse === 'function') {
        window.triggerGlassPulse(0.5);
      }
    });
  });

  // Automatic slide rotation every 8 seconds
  let slideTimer = setInterval(() => {
    if (slides.length > 1) {
      showSlide((currentSlide + 1) % slides.length);
    }
  }, 8000);

  // Pause timer on hover over controls
  const heroControls = document.querySelector('.hero-controls');
  if (heroControls) {
    heroControls.addEventListener('mouseenter', () => clearInterval(slideTimer));
  }

  // ==========================================================================
  // PORTFOLIO MASONRY CATEGORY FILTERING
  // ==========================================================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      portfolioCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (filterValue === 'all' || cardCategory === filterValue) {
          card.classList.remove('is-hidden');
        } else {
          card.classList.add('is-hidden');
        }
      });

      // Pulse background WebGL glass effect on category change
      if (typeof window.triggerGlassPulse === 'function') {
        window.triggerGlassPulse(0.8);
      }
    });
  });

  // ==========================================================================
  // LIGHTBOX MODAL VIEWER
  // ==========================================================================
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxExif = document.getElementById('lightbox-exif');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  let visibleCards = [];
  let currentLightboxIndex = 0;

  function updateVisibleCards() {
    visibleCards = Array.from(portfolioCards).filter(card => !card.classList.contains('is-hidden'));
  }

  function openLightbox(card) {
    updateVisibleCards();
    currentLightboxIndex = visibleCards.indexOf(card);
    if (currentLightboxIndex === -1) currentLightboxIndex = 0;

    const img = card.querySelector('.portfolio-card-img');
    const title = card.querySelector('.card-title')?.textContent || '';
    const category = card.querySelector('.card-category')?.textContent || '';
    const exif = card.getAttribute('data-exif') || 'Leica M11 • 50mm f/1.4';

    if (lightboxImg && lightboxTitle && lightboxExif) {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxTitle.textContent = title;
      lightboxExif.textContent = `${category} • ${exif}`;
    }

    lightbox?.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    if (typeof window.triggerGlassPulse === 'function') {
      window.triggerGlassPulse(1.0);
    }
  }

  function closeLightbox() {
    lightbox?.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  function navigateLightbox(direction) {
    updateVisibleCards();
    if (!visibleCards.length) return;
    currentLightboxIndex = (currentLightboxIndex + direction + visibleCards.length) % visibleCards.length;
    openLightbox(visibleCards[currentLightboxIndex]);
  }

  portfolioCards.forEach(card => {
    card.addEventListener('click', () => openLightbox(card));
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(-1); });
  lightboxNext?.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(1); });

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox?.classList.contains('is-active')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    }
  });
});
