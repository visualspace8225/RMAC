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
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time: 2000
    });


    // Date and time picker
    $('.date').datetimepicker({
      format: 'L',
      minDate: new Date() // Restricts to current and future dates only
  });
  
    $('.time').datetimepicker({
        format: 'LT'
    });


    // Header carousel
    $(".header-carousel").owlCarousel({
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



//form validation and submission part code.
  document.getElementById("appointmentForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevent default form submission

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  // Validation
  const nameRegex = /^[a-zA-Z\s]+$/; // Allow only letters and spaces
  const mobileRegex = /^[0-9]{10}$/; // Must be exactly 10 digits
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation
  const messageMinLength = 20;

  // Validate Name
  if (!nameRegex.test(data.name)) {
    showToast("Error", "Name must not contain numbers or special characters.", "error");
    return;
  }

  // Validate Mobile
  if (!mobileRegex.test(data.mobile)) {
    showToast("Error", "Mobile number must be exactly 10 digits.", "error");
    return;
  }

  // Validate Email
  if (!emailRegex.test(data.email)) {
    showToast("Error", "Please enter a valid email address.", "error");
    return;
  }

  // Validate Message Length
  if (data.message.length < messageMinLength) {
    showToast("Error", `Message must be at least ${messageMinLength} characters long.`, "error");
    return;
  }

  try {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      showToast("Success", result.message, "success"); // Show success toast
      e.target.reset(); // Reset the form
    } else {
      const result = await response.json();
      showToast("Error", result.error || "Failed to book the appointment. Please try again.", "error");
    }
  } catch (error) {
    console.error(error);
    showToast("Error", "Something went wrong. Please try again later.", "error");
  }
});

// Function to show toast notifications
// Function to show toast notifications
function showToast(title, message, type) {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  
  toast.classList.add('toast', 'show', `toast-${type}`); // Add 'show' class to make the toast visible and type-specific class
  toast.role = 'alert';
  toast.ariaLive = 'assertive';
  toast.ariaAtomic = 'true';

  // Inner HTML for the toast, including the close button
  toast.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">${title}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;

  // Append the toast to the container
  toastContainer.appendChild(toast);

  // Manually add the close functionality to the "X" button
  const closeButton = toast.querySelector('.btn-close');
  closeButton.addEventListener('click', () => {
    toast.classList.remove('show'); // Hide the toast
    setTimeout(() => {
      toastContainer.removeChild(toast); // Remove the toast from DOM after animation
    }, 300); // Delay to allow the fade-out animation
  });

  // Automatically hide the toast after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show'); // Hide the toast after 5 seconds
    setTimeout(() => {
      toastContainer.removeChild(toast); // Remove the toast from DOM after animation
    }, 300); // Delay to allow the fade-out animation
  }, 5000);
}




$(document).ready(function(){
  $(".owl-carousel").owlCarousel({
    items: 1, // or the number of items you want to show at once
    loop: true,
    margin: 10,
    autoplay: true,
    autoplayTimeout: 3000
  });
});
