// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeMain();
});

function initializeMain() {
    // Initialize all components
    initializeThemeToggle();
    initializeFeedbackForm();
    initializeFlashMessages();
    initializeBookmarkButtons();
    initializeAnimations();
    
    // Initialize tooltips if Bootstrap is loaded
    if (typeof bootstrap !== 'undefined') {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    console.log('Main JavaScript initialized');
}

function initializeThemeToggle() {
    // Check for saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Add theme toggle button to navbar if it doesn't exist
    const navbar = document.querySelector('.navbar .container');
    if (navbar && !document.getElementById('themeToggle')) {
        const themeButton = document.createElement('button');
        themeButton.id = 'themeToggle';
        themeButton.className = 'theme-toggle ms-2';
        themeButton.innerHTML = '<i class="fas fa-moon"></i>';
        themeButton.title = 'Toggle dark mode';
        
        // Find the right place to insert (after nav items)
        const navbarNav = navbar.querySelector('.navbar-nav:last-child');
        if (navbarNav) {
            navbarNav.appendChild(themeButton);
        } else {
            navbar.appendChild(themeButton);
        }
        
        themeButton.addEventListener('click', toggleTheme);
    }
    
    // If button already exists, bind event
    const existingButton = document.getElementById('themeToggle');
    if (existingButton) {
        existingButton.addEventListener('click', toggleTheme);
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeButton = document.getElementById('themeToggle');
    if (themeButton) {
        const icon = themeButton.querySelector('i');
        if (icon) {
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
                themeButton.title = 'Switch to light mode';
            } else {
                icon.className = 'fas fa-moon';
                themeButton.title = 'Switch to dark mode';
            }
        }
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function initializeBookmarkButtons() {
    const bookmarkButtons = document.querySelectorAll('.bookmark-btn');
    bookmarkButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            toggleBookmark(this);
        });
    });
}

function toggleBookmark(button) {
    const paperId = button.getAttribute('data-paper-id');
    if (!paperId) return;
    
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;
    
    fetch(`/toggle_bookmark/${paperId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'added') {
            button.className = button.className.replace('btn-outline-secondary', 'btn-warning');
            button.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
            showAlert('Paper bookmarked!', 'success');
        } else if (data.status === 'removed') {
            button.className = button.className.replace('btn-warning', 'btn-outline-secondary');
            button.innerHTML = '<i class="fas fa-bookmark"></i>';
            showAlert('Bookmark removed', 'info');
            
            // If on bookmarks page, remove the card
            if (window.location.pathname === '/bookmarks') {
                const card = button.closest('.col-md-6, .col-lg-4');
                if (card) {
                    card.style.transition = 'all 0.3s ease';
                    card.style.transform = 'scale(0)';
                    card.style.opacity = '0';
                    setTimeout(() => card.remove(), 300);
                }
            }
        }
    })
    .catch(error => {
        console.error('Bookmark error:', error);
        showAlert('Failed to update bookmark', 'danger');
        button.innerHTML = originalContent;
    })
    .finally(() => {
        button.disabled = false;
    });
}

function initializeAnimations() {
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
    
    // Add hover effects
    const hoverElements = document.querySelectorAll('.btn, .card, .upload-area');
    hoverElements.forEach(element => {
        element.classList.add('hover-lift');
    });
}

function initializeFeedbackForm() {
    const feedbackForm = document.getElementById('feedbackForm');
    if (!feedbackForm) return;
    
    feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', document.getElementById('feedbackName').value);
        formData.append('email', document.getElementById('feedbackEmail').value);
        formData.append('subject', document.getElementById('feedbackSubject').value);
        formData.append('message', document.getElementById('feedbackMessage').value);
        
        const submitBtn = feedbackForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        fetch('/feedback', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert(data.message, 'success');
                feedbackForm.reset();
                
                // Close modal if it exists
                const modal = document.getElementById('feedbackModal');
                if (modal && typeof bootstrap !== 'undefined') {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) modalInstance.hide();
                }
            } else {
                showAlert(data.message || 'Failed to send feedback', 'danger');
            }
        })
        .catch(error => {
            console.error('Feedback error:', error);
            showAlert('Network error. Please try again.', 'danger');
        })
        .finally(() => {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
    });
}

function initializeFlashMessages() {
    // Auto-hide flash messages after 5 seconds
    const flashMessages = document.querySelectorAll('.flash-messages .alert');
    flashMessages.forEach(message => {
        setTimeout(() => {
            if (message.parentNode && typeof bootstrap !== 'undefined') {
                const alert = new bootstrap.Alert(message);
                alert.close();
            }
        }, 5000);
    });
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode && typeof bootstrap !== 'undefined') {
            const alert = new bootstrap.Alert(alertDiv);
            alert.close();
        }
    }, 5000);
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Export utility functions
window.showAlert = showAlert;
window.formatFileSize = formatFileSize;
window.debounce = debounce;
