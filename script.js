const calculator = {
  services: {},
  boardingDays: 0,
  petName: '',
  petSize: '',

  init() {
    const form = document.getElementById('calculatorForm');
    if (!form) return;

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.validateAndCalculate();
    });

    // Real-time calculation
    const checkboxes = document.querySelectorAll('.service-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateCalculation());
    });

    // Boarding days input
    const boardingDaysInput = document.getElementById('boardingDays');
    if (boardingDaysInput) {
      boardingDaysInput.addEventListener('input', () => this.updateCalculation());
    }

    // Pet info inputs
    const petNameInput = document.getElementById('petName');
    const petSizeInput = document.getElementById('petSize');

    if (petNameInput) {
      petNameInput.addEventListener('input', (e) => {
        this.petName = e.target.value;
      });
    }

    if (petSizeInput) {
      petSizeInput.addEventListener('change', (e) => {
        this.petSize = e.target.value;
      });
    }

    // Form reset
    form.addEventListener('reset', () => {
      setTimeout(() => {
        this.resetCalculation();
      }, 0);
    });
  },

  validateAndCalculate() {
    const form = document.getElementById('calculatorForm');

    // Check form validity
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    form.classList.remove('was-validated');
    this.updateCalculation();
  },

  updateCalculation() {
    this.collectServices();
    this.calculateTotal();
    this.updateSummary();
  },

  collectServices() {
    this.services = {};
    const checkboxes = document.querySelectorAll('.service-checkbox:checked');

    checkboxes.forEach(checkbox => {
      const value = checkbox.value;
      // Prefer size-specific price attributes (data-price-small/medium/large)
      const sizeKey = this.petSize || 'small';
      const sizeAttr = checkbox.getAttribute(`data-price-${sizeKey}`);
      let price = 0;
      if (sizeAttr !== null) {
        price = parseFloat(sizeAttr);
      } else {
        const base = checkbox.getAttribute('data-price');
        price = base ? parseFloat(base) : 0;
      }

      this.services[value] = {
        label: checkbox.nextElementSibling.textContent.trim(),
        price: price
      };
    });

    // Collect boarding days
    const boardingDaysInput = document.getElementById('boardingDays');
    if (boardingDaysInput) {
      this.boardingDays = parseInt(boardingDaysInput.value) || 0;
    }

    // Collect pet info
    const petNameInput = document.getElementById('petName');
    const petSizeInput = document.getElementById('petSize');

    if (petNameInput) {
      this.petName = petNameInput.value;
    }

    if (petSizeInput) {
      this.petSize = petSizeInput.value;
    }
  },

  calculateTotal() {
    let subtotal = 0;
    Object.values(this.services).forEach(service => {
      subtotal += service.price;
    });

    // Calculate boarding cost (use current site rate)
    const boardingCost = this.boardingDays * 999;

    // Apply bundle discount if applicable
    let discount = 0;
    const serviceCount = Object.keys(this.services).length;
    const bundleCheckbox = document.getElementById('bundleDiscount');

    if (serviceCount >= 3 && bundleCheckbox && bundleCheckbox.checked) {
      // Apply 10% discount to services only
      discount = (subtotal * 0.10);
    } else if (serviceCount >= 3) {
      // Auto-enable bundle discount if 3+ services
      if (bundleCheckbox) {
        bundleCheckbox.checked = true;
        discount = (subtotal * 0.10);
      }
    }

    // Calculate total
    const total = subtotal + boardingCost - discount;

    // Update UI
    this.updateTotalDisplay(subtotal, boardingCost, discount, total, discount > 0);

    return {
      subtotal,
      boardingCost,
      discount,
      total,
      serviceCount
    };
  },

  updateTotalDisplay(subtotal, boardingCost, discount, total, showDiscount) {
    const subtotalElement = document.getElementById('subtotal');
    const boardingCostElement = document.getElementById('boardingCost');
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    const totalElement = document.getElementById('totalCost');

    if (subtotalElement) subtotalElement.textContent = this.formatCurrency(subtotal);
    if (boardingCostElement) boardingCostElement.textContent = this.formatCurrency(boardingCost);
    if (discountAmount) discountAmount.textContent = `-${this.formatCurrency(discount)}`;
    if (totalElement) totalElement.textContent = this.formatCurrency(total);

    // Show/hide discount row
    if (discountRow) {
      discountRow.style.display = showDiscount ? 'flex' : 'none';
    }
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  updateSummary() {
    this.updateSelectedServices();
    this.updateServiceCount();
    this.updatePetInfo();
  },

  updateSelectedServices() {
    const selectedServicesDiv = document.getElementById('selectedServices');
    if (!selectedServicesDiv) return;

    if (Object.keys(this.services).length === 0 && this.boardingDays === 0) {
      selectedServicesDiv.innerHTML = '<p class="text-muted">Select services to see them listed here...</p>';
      return;
    }

    let html = '';

    // Add regular services
    Object.values(this.services).forEach(service => {
      html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${service.label.split('(')[0].trim()}</span>
                    <span class="badge bg-primary rounded-pill">${this.formatCurrency(service.price)}</span>
                </div>
            `;
    });

    // Add boarding if applicable
    if (this.boardingDays > 0) {
      const boardingCost = this.boardingDays * 999;
      html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>Boarding (${this.boardingDays} night${this.boardingDays !== 1 ? 's' : ''})</span>
                    <span class="badge bg-primary rounded-pill">${this.formatCurrency(boardingCost)}</span>
                </div>
            `;
    }

    selectedServicesDiv.innerHTML = html;
  },

  updateServiceCount() {
    const serviceCountElement = document.getElementById('serviceCount');
    const count = Object.keys(this.services).length + (this.boardingDays > 0 ? 1 : 0);
    if (serviceCountElement) {
      serviceCountElement.textContent = count;
    }
  },

  updatePetInfo() {
    const petInfoDisplay = document.getElementById('petInfoDisplay');
    const displayPetName = document.getElementById('displayPetName');
    const displayPetSize = document.getElementById('displayPetSize');

    if (this.petName || this.petSize) {
      if (petInfoDisplay) petInfoDisplay.style.display = 'block';
      if (displayPetName) displayPetName.textContent = this.petName || '-';
      if (displayPetSize) {
        const sizeMap = {
          'small': 'Small (Under 15 lbs)',
          'medium': 'Medium (15-50 lbs)',
          'large': 'Large (Over 50 lbs)'
        };
        displayPetSize.textContent = sizeMap[this.petSize] || '-';
      }
    } else {
      if (petInfoDisplay) petInfoDisplay.style.display = 'none';
    }
  },

  resetCalculation() {
    this.services = {};
    this.boardingDays = 0;
    this.petName = '';
    this.petSize = '';

    const selectedServicesDiv = document.getElementById('selectedServices');
    if (selectedServicesDiv) {
      selectedServicesDiv.innerHTML = '<p class="text-muted">Select services to see them listed here...</p>';
    }

    this.updateTotalDisplay(0, 0, 0, 0, false);
    this.updateServiceCount();

    const petInfoDisplay = document.getElementById('petInfoDisplay');
    if (petInfoDisplay) petInfoDisplay.style.display = 'none';

    const bundleCheckbox = document.getElementById('bundleDiscount');
    if (bundleCheckbox) bundleCheckbox.checked = false;
  }
};

function initFormValidation() {
  const forms = document.querySelectorAll('form[novalidate]');

  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      if (!this.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.classList.add('was-validated');
    }, false);
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

function initKeyboardNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const buttons = document.querySelectorAll('button, a.btn');

  const allFocusableElements = [...navLinks, ...buttons];

  allFocusableElements.forEach((element, index) => {
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift+Tab
          if (index === 0) {
            e.preventDefault();
            allFocusableElements[allFocusableElements.length - 1].focus();
          }
        } else {
          // Tab
          if (index === allFocusableElements.length - 1) {
            e.preventDefault();
            allFocusableElements[0].focus();
          }
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize calculator if on calculator page
  calculator.init();

  // Initialize form validation
  initFormValidation();

  // Initialize smooth scroll
  initSmoothScroll();

  // Initialize keyboard navigation
  initKeyboardNavigation();

  // Add active state to current navigation link
  const currentLocation = location.pathname;
  const menuItems = document.querySelectorAll('.nav-link');

  menuItems.forEach(item => {
    if (item.getAttribute('href') === currentLocation) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Bootstrap Modal handling
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('show.bs.modal', function() {
      document.body.style.overflow = 'hidden';
    });
    modal.addEventListener('hidden.bs.modal', function() {
      document.body.style.overflow = '';
    });
  });

  // Prevent form submission on Enter key in input fields
  const formInputs = document.querySelectorAll('form input[type="text"], form input[type="email"], form input[type="number"]');
  formInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !this.closest('form').id.includes('calculator')) {
        e.preventDefault();
      }
    });
  });
});

window.addEventListener('load', function() {
  console.log('The Pet Haven & Hospital - Page loaded successfully');
  console.log('Features active:');
  console.log('✓ Bootstrap Responsive Grid System');
  console.log('✓ Bootstrap Navbar (collapsible)');
  console.log('✓ Bootstrap Carousel');
  console.log('✓ Bootstrap Modals');
  console.log('✓ Bootstrap Tables');
  console.log('✓ Form Validation');
  console.log('✓ DOM Manipulation');
  console.log('✓ Cost Calculator with Real-time Updates');
  console.log('✓ Accessibility Features');
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculator };
}
