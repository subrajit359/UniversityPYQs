// Admin functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminFunctions();
});

function initializeAdminFunctions() {
    // Initialize modals if they exist
    initializeModals();
    
    // Initialize any admin-specific functionality
    console.log('Admin panel initialized');
}

function initializeModals() {
    // Close modal when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Close modal with close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
    });
}

function showFeedbackModal() {
    // This would show a feedback modal if implemented
    alert('Feedback modal not yet implemented');
}

function showUsersModal() {
    // This would show a users management modal if implemented
    alert('Users management modal not yet implemented');
}

function showMessage(message, type) {
    // Create and show flash message
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.minWidth = '300px';
    messageDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Export functions for use in templates
window.showFeedbackModal = showFeedbackModal;
window.showUsersModal = showUsersModal;
window.showMessage = showMessage;
