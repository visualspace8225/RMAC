(function ($) {
  "use strict";

  // Spinner
  var spinner = function () {
    setTimeout(function () {
      if ($('#spinner').length > 0) {
        $('#spinner').removeClass('show');
      }
    }, 1);
  };
  spinner();

  // Initiate the wowjs
  new WOW().init();

  // Sticky Navbar
  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $('.sticky-top').addClass('shadow-sm').css('top', '0px');
    } else {
      $('.sticky-top').removeClass('shadow-sm').css('top', '-100px');
    }
  });

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $('.back-to-top').fadeIn('slow');
    } else {
      $('.back-to-top').fadeOut('slow');
    }
  });
  $('.back-to-top').click(function () {
    $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
    return false;
  });

  // Facts counter
  $('[data-toggle="counter-up"]').counterUp({
    delay: 10,
    time: 2000,
  });

  // Date and time picker
  $('.date').datetimepicker({
    format: 'L',
    minDate: new Date(), // Restricts to current and future dates only
  });

  $('.time').datetimepicker({
    format: 'LT',
  });

  // Header carousel
  $('.header-carousel').owlCarousel({
    autoplay: true,
    smartSpeed: 1500,
    loop: true,
    nav: false,
    dots: true,
    items: 1,
    dotsData: true,
  });

  // Testimonials carousel
  $('.testimonial-carousel').owlCarousel({
    autoplay: true,
    smartSpeed: 1000,
    loop: true,
    nav: false,
    dots: true,
    items: 1,
    dotsData: true,
  });
})(jQuery);

// Consolidated DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', function () {
  // Set form load timestamp and randomize honeypot fields
  const form = document.getElementById('appointmentForm');
  if (form) {
    const formLoadTime = document.getElementById('form_load_time');
    if (formLoadTime) {
      formLoadTime.value = Math.floor(Date.now() / 1000);
    }

    const randomSuffix1 = Math.floor(Math.random() * 1000);
    const randomSuffix2 = Math.floor(Math.random() * 1000);
    const hp1 = document.getElementById('user_input_check_927');
    const hp2 = document.getElementById('verify_human_384');
    if (hp1) {
      hp1.id = `user_input_check_${randomSuffix1}`;
      hp1.name = `user_input_check_${randomSuffix1}`;
    }
    if (hp2) {
      hp2.id = `verify_human_${randomSuffix2}`;
      hp2.name = `verify_human_${randomSuffix2}`;
    }

    // Form validation and submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);

      // Validation
      const nameRegex = /^[a-zA-Z\s]+$/; // Letters and spaces only
      const mobileRegex = /^[0-9]{10}$/; // Exactly 10 digits
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation
      const messageMinLength = 20;

      if (!nameRegex.test(data.name)) {
        showToast('Error', 'Name must not contain numbers or special characters.', 'error');
        return;
      }
      if (!mobileRegex.test(data.mobile)) {
        showToast('Error', 'Mobile number must be exactly 10 digits.', 'error');
        return;
      }
      if (!emailRegex.test(data.email)) {
        showToast('Error', 'Please enter a valid email address.', 'error');
        return;
      }
      if (data.message.length < messageMinLength) {
        showToast('Error', `Message must be at least ${messageMinLength} characters long.`, 'error');
        return;
      }

      try {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (response.ok) {
          showToast('Success', result.message, 'success');
          e.target.reset();
        } else {
          // Differentiate honeypot/timing errors
          if (result.error.includes('Spam') || result.error.includes('bot')) {
            console.log('Bot attempt blocked:', result.error); // Log for debugging
            showToast('Error', 'Submission blocked. Are you a bot?', 'error');
          } else {
            showToast('Error', result.error || 'Failed to book appointment.', 'error');
          }
        }
      } catch (error) {
        console.error('Submission error:', error);
        showToast('Error', 'Something went wrong. Please try again later.', 'error');
      }
    });
  }
});

// Toast notification function
function showToast(title, message, type) {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');

  toast.classList.add('toast', 'show', `toast-${type}`);
  toast.role = 'alert';
  toast.ariaLive = 'assertive';
  toast.ariaAtomic = 'true';
  toast.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">${title}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">${message}</div>
  `;

  toastContainer.appendChild(toast);

  const closeButton = toast.querySelector('.btn-close');
  closeButton.addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toastContainer.removeChild(toast), 300);
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toastContainer.removeChild(toast), 300);
  }, 5000);
}