// Upload functionality for Cloudinary integration
let uploadWidget = null;
let uploadedFileData = null;

function initializeCloudinaryUpload(config) {
    if (!config.cloud_name || !config.upload_preset) {
        console.error('Cloudinary configuration missing:', config);
        showUploadError('Upload configuration error. Please contact administrator.');
        return;
    }

    console.log('Initializing Cloudinary with config:', {
        cloudName: config.cloud_name,
        uploadPreset: config.upload_preset
    });

    // Wait for cloudinary to be available
    if (typeof cloudinary === 'undefined') {
        console.error('Cloudinary library not loaded');
        showUploadError('Upload service not available. Please refresh the page.');
        return;
    }

    try {
        // Initialize Cloudinary upload widget with minimal configuration
        uploadWidget = cloudinary.createUploadWidget({
            cloudName: config.cloud_name,
            uploadPreset: config.upload_preset,
            sources: ['local'],
            multiple: false,
            maxFileSize: 16000000, // 16MB
            clientAllowedFormats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
            cropping: false,
            showAdvancedOptions: false,
            showInsecurePreview: false,
            showUploadMoreButton: false,
            styles: {
                palette: {
                    window: "#FFFFFF",
                    windowBorder: "#90A0B3",
                    tabIcon: "#0078FF",
                    menuIcons: "#5A616A",
                    textDark: "#000000",
                    textLight: "#FFFFFF",
                    link: "#0078FF",
                    action: "#FF620C",
                    inactiveTabIcon: "#0E2F5A",
                    error: "#F44235",
                    inProgress: "#0078FF",
                    complete: "#20B832",
                    sourceBg: "#E4EBF1"
                }
            }
        }, function(error, result) {
            console.log('Cloudinary callback:', { error, result });
            
            if (error) {
                console.error('Cloudinary upload error:', error);
                hideUploadProgress();
                showUploadError(`Upload failed: ${error.message || 'Please try again'}`);
                return;
            }
            
            if (result && result.event === "success") {
                console.log('Upload successful:', result.info);
                uploadedFileData = result.info;
                hideUploadProgress();
                showUploadResult(result.info);
                enableSubmitButton();
            }
            
            if (result && result.event === "upload-added") {
                console.log('Upload started');
                showUploadProgress();
            }
            
            if (result && result.event === "queues-start") {
                console.log('Upload queue started');
                showUploadProgress();
            }
            
            if (result && result.event === "abort") {
                console.log('Upload aborted');
                hideUploadProgress();
                showUploadError('Upload was cancelled');
            }
        });

        console.log('Upload widget created successfully');

        // Bind click event to upload button
        const uploadBtn = document.getElementById('upload-widget-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Opening upload widget');
                uploadWidget.open();
            });
            console.log('Upload button event bound');
        } else {
            console.error('Upload button not found');
        }
        
    } catch (error) {
        console.error('Error creating upload widget:', error);
        showUploadError('Failed to initialize upload service. Please refresh the page.');
    }
}

function showUploadProgress() {
    const uploadContainer = document.getElementById('upload-widget-container');
    const progressContainer = document.getElementById('upload-progress');
    const resultContainer = document.getElementById('upload-result');
    
    if (uploadContainer) uploadContainer.classList.add('hidden');
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (resultContainer) resultContainer.classList.add('hidden');
}

function hideUploadProgress() {
    const progressContainer = document.getElementById('upload-progress');
    if (progressContainer) progressContainer.classList.add('hidden');
}

function showUploadResult(fileData) {
    const uploadContainer = document.getElementById('upload-widget-container');
    const resultContainer = document.getElementById('upload-result');
    
    if (uploadContainer) uploadContainer.classList.add('hidden');
    if (resultContainer) {
        resultContainer.classList.remove('hidden');
        
        // Update file details
        const fileName = resultContainer.querySelector('.file-name');
        const fileSize = resultContainer.querySelector('.file-size');
        const fileFormat = resultContainer.querySelector('.file-format');
        
        if (fileName) fileName.textContent = fileData.original_filename || 'Uploaded File';
        if (fileSize) fileSize.textContent = formatFileSize(fileData.bytes || 0);
        if (fileFormat) fileFormat.textContent = (fileData.format || '').toUpperCase();
    }
    
    // Store file data for form submission
    const cloudinaryDataInput = document.getElementById('cloudinary_data');
    if (cloudinaryDataInput) {
        cloudinaryDataInput.value = JSON.stringify(fileData);
    }
}

function showUploadError(message) {
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.insertBefore(errorDiv, uploadForm.firstChild);
    }
}

function removeUploadedFile() {
    const uploadContainer = document.getElementById('upload-widget-container');
    const resultContainer = document.getElementById('upload-result');
    const cloudinaryDataInput = document.getElementById('cloudinary_data');
    
    if (uploadContainer) uploadContainer.classList.remove('hidden');
    if (resultContainer) resultContainer.classList.add('hidden');
    if (cloudinaryDataInput) cloudinaryDataInput.value = '';
    
    uploadedFileData = null;
    disableSubmitButton();
}

function enableSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
    }
}

function disableSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function initializeUploadForm() {
    const uploadForm = document.getElementById('uploadForm');
    if (!uploadForm) return;
    
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        const title = document.getElementById('title').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const year = document.getElementById('year').value;
        const semester = document.getElementById('semester').value;
        const cloudinaryData = document.getElementById('cloudinary_data').value;
        
        if (!title || !subject || !year || !semester) {
            showUploadError('Please fill in all required fields.');
            return;
        }
        
        if (!cloudinaryData) {
            showUploadError('Please upload a file.');
            return;
        }
        
        // Submit form
        const formData = new FormData(uploadForm);
        const submitBtn = document.getElementById('submitBtn');
        
        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        }
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Show success message
                const successDiv = document.createElement('div');
                successDiv.className = 'alert alert-success alert-dismissible fade show';
                successDiv.innerHTML = `
                    ${data.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
                uploadForm.insertBefore(successDiv, uploadForm.firstChild);
                
                // Redirect after delay
                setTimeout(() => {
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    }
                }, 2000);
            } else {
                showUploadError(data.message || 'Upload failed. Please try again.');
                
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Paper';
                }
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showUploadError('Network error. Please check your connection and try again.');
            
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Paper';
            }
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the upload page
    if (document.getElementById('uploadForm')) {
        console.log('Upload page detected, initializing upload functionality');
        initializeUploadForm();
    }
});
