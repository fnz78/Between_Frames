/**
 * Main Application Logic
 * Translucent Navigation, Mobile Drawer, Hero Parallax, WebGL Sync & Custom Round Hover Cursor
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

  // --- CUSTOM FLUID ROUND HOVER CURSOR SYSTEM ⭐ ---
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  const cursorLabel = document.getElementById('cursor-label');

  if (cursorDot && cursorRing && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let dotX = mouseX;
    let dotY = mouseY;

    window.addEventListener('pointermove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Smooth Lerp Physics Loop
    function renderCursor() {
      // Fast lerp for dot
      dotX += (mouseX - dotX) * 0.45;
      dotY += (mouseY - dotY) * 0.45;

      // Smooth fluid lerp for ring follower
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;

      cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Interactive Hover Listeners for UI Links & Buttons
    const hoverTargets = document.querySelectorAll('a, button, input, .btn-glass, .btn-primary-glass, .nav-link, .social-icon-btn, .slide-btn');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('is-hovering');
      });
      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('is-hovering');
      });
    });

    // Image Lens Hover Listener for Hero Photography Wrapper
    const heroBgWrapper = document.querySelector('.hero-bg-wrapper');
    if (heroBgWrapper) {
      heroBgWrapper.addEventListener('mouseenter', () => {
        document.body.classList.add('is-hovering-image');
        if (cursorLabel) cursorLabel.textContent = 'EXPLORE';
      });
      heroBgWrapper.addEventListener('mouseleave', () => {
        document.body.classList.remove('is-hovering-image');
      });
    }
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

  // Trigger pulse on hero interactive elements hover
  const interactiveHeroElements = document.querySelectorAll('.hero-actions a, .btn-glass, .hero-controls');
  interactiveHeroElements.forEach(el => {
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
});
