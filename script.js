(function initDataLayer() {
  // GTM's container snippet normally creates this array. We initialise
  // it defensively here so script.js works even before GTM is installed
  // (e.g. during local development / before the container ID is pasted in).
  window.dataLayer = window.dataLayer || [];
})();

(function trackPageView() {
  const path = window.location.pathname;
  const isClinicPage = path.includes('/clinics/');

  window.dataLayer.push({
    event: isClinicPage ? 'clinic_page_view' : 'landing_page_view',
    page_path: path,
    page_referrer: document.referrer || 'direct'
  });
})();


const AppointmentForm = (() => {
  const form = document.getElementById('appointment-form');
  if (!form) return null; // page may not include the form (e.g. a blog page)

  const nameField = form.querySelector('#patient-name');
  const phoneField = form.querySelector('#patient-phone');
  const formCard = document.getElementById('form-card');
  const thankYou = document.getElementById('thank-you');

  const PHONE_REGEX = /^(?:\+91|0)?[6-9]\d{9}$/;

  let formStarted = false;    
  let formStartTime = null;    
  let formSubmitted = false;   
  let lastFieldTouched = null; 

  function markFormStarted() {
    if (formStarted) return;
    formStarted = true;
    formStartTime = Date.now();

    window.dataLayer.push({
      event: 'form_start',
      form_name: 'consultation',
      form_location: 'landing_page_hero'
    });
  }

  function showFieldError(field, errorEl, message) {
    field.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('is-visible');
    }
  }

  function clearFieldError(field, errorEl) {
    field.removeAttribute('aria-invalid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
    }
  }

  function validateName() {
    const errorEl = document.getElementById('name-error');
    const value = nameField.value.trim();
    if (value.length < 2) {
      showFieldError(nameField, errorEl, 'Enter your full name.');
      return false;
    }
    clearFieldError(nameField, errorEl);
    return true;
  }

  function validatePhone() {
    const errorEl = document.getElementById('phone-error');
    const value = phoneField.value.trim();

    // Normalize input: remove all non-digit characters for validation
    const digits = value.replace(/\D/g, '');

    if (digits.length === 0) {
      showFieldError(phoneField, errorEl, 'Phone number is required.');
      trackPhoneError('empty');
      return false;
    }

    // Acceptable formats:
    // - 10 digits starting with 6-9 (e.g. 9876543210)
    // - leading 0 + 10 digits (e.g. 09876543210)
    // - country code 91 + 10 digits (e.g. 919876543210 or +91 98765 43210)
    let isValid = false;
    if (/^[6-9]\d{9}$/.test(digits)) {
      isValid = true;
    } else if (/^0[6-9]\d{9}$/.test(digits)) {
      isValid = true;
    } else if (/^91[6-9]\d{9}$/.test(digits)) {
      isValid = true;
    }

    if (!isValid) {
      showFieldError(phoneField, errorEl, 'Enter a valid 10-digit mobile number.');
      trackPhoneError('invalid_format');
      return false;
    }

    clearFieldError(phoneField, errorEl);
    return true;
  }

  function trackPhoneError(errorType) {
    window.dataLayer.push({
      event: 'phone_validation_error',
      field_name: 'phone',
      error_type: errorType,
      form_name: 'consultation'
    });
  }

  function handleSubmit(event) {
    event.preventDefault(); // SPA-style submit, no page reload per spec

    const isNameValid = validateName();
    const isPhoneValid = validatePhone();
    if (!isNameValid || !isPhoneValid) return;

    formSubmitted = true;

    window.dataLayer.push({
      event: 'consultation_form_submitted',
      form_name: 'consultation',
      page: window.location.pathname,
      lead_source: new URLSearchParams(window.location.search).get('utm_source') || 'direct'
    });

    // API CALL HERE
    revealThankYou();
  }

  function revealThankYou() {
    formCard.style.display = 'none';
    thankYou.classList.add('is-visible');
    thankYou.setAttribute('tabindex', '-1');
    thankYou.focus(); 
  }

  function handleBeforeUnload() {
    if (!formStarted || formSubmitted) return;

    const secondsOnForm = formStartTime ? Math.round((Date.now() - formStartTime) / 1000) : 0;

    window.dataLayer.push({
      event: 'form_abandon',
      form_name: 'consultation',
      last_field_completed: lastFieldTouched || 'none',
      time_on_form_seconds: secondsOnForm
    });
  }

  function bindEvents() {
    [nameField, phoneField].forEach((field) => {
      field.addEventListener('focus', markFormStarted, { once: false });
      field.addEventListener('blur', () => { lastFieldTouched = field.name; });
    });

    nameField.addEventListener('blur', validateName);
    phoneField.addEventListener('blur', validatePhone);
    form.addEventListener('submit', handleSubmit);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleBeforeUnload();
    });
  }

  bindEvents();
  return { validateName, validatePhone };
})();


(function trackOutboundClicks() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    const clickLocation = link.dataset.ctaLocation || 'unspecified';

    if (href.startsWith('tel:')) {
    
      window.dataLayer.push({
        event: 'call_now_click',
        phone_number: href.replace('tel:', ''),
        click_location: clickLocation
      });
      return;
    }

    if (href.includes('wa.me') || href.includes('api.whatsapp.com')) {
    
      window.dataLayer.push({
        event: 'whatsapp_click',
        click_location: clickLocation,
        prefilled_message: href.includes('text=')
      });
      return;
    }

    if (href.endsWith('.pdf') && href.includes('patient-guide')) {
      
      window.dataLayer.push({
        event: 'download_patient_guide',
        file_name: href.split('/').pop(),
        link_text: link.textContent.trim()
      });
    }
  });
})();

(function toggleStickyCta() {
  const stickyBar = document.getElementById('sticky-cta');
  const hero = document.querySelector('.hero');
  if (!stickyBar || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      stickyBar.style.display = entry.isIntersecting ? 'none' : 'flex';
    },
    { rootMargin: '-80px 0px 0px 0px' }
  );
  observer.observe(hero);
})();

(function blogScrollFallback() {
  const article = document.querySelector('[data-article]');
  if (!article) return;

  const thresholds = [25, 50, 75, 90];
  const fired = new Set();

  function checkScroll() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollableHeight <= 0) return;
    const percentScrolled = (window.scrollY / scrollableHeight) * 100;

    thresholds.forEach((threshold) => {
      if (percentScrolled >= threshold && !fired.has(threshold)) {
        fired.add(threshold);
        const eventName = threshold === 90 ? 'blog_complete' : `blog_scroll_${threshold}`;

        window.dataLayer.push({
          event: eventName,
          article_title: document.title,
          scroll_percentage: threshold
        });
      }
    });

    if (fired.size === thresholds.length) {
      window.removeEventListener('scroll', checkScroll);
    }
  }
  window.addEventListener('scroll', checkScroll, { passive: true });
})();
