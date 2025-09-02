// utils.js

// Utility functions for the steganography application
class Utils {
    // Generate SHA-256 hash of a file (kept for final integrity check on the client)
    static async generateFileHash(file) {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Create download link for a blob
    static createDownloadLink(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.className = 'download-link';
        link.innerHTML = `
            <span>📥</span>
            <span>Download ${filename}</span>
        `;
        return link;
    }

    // Format file size for display
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show an error message in the UI
    static showError(element, message) {
        // Find the parent container to attach the error to
        const parent = element.closest('.mode-content, .input-group, .upload-area');
        if (!parent) return;

        // Remove existing error message
        this.clearErrors(parent);

        // Add error class to the element that caused it
        element.classList.add('error');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        parent.appendChild(errorDiv);
    }

    // Clear error messages from the UI
    static clearErrors(element) {
        const parent = element.closest('.mode-content, .input-group, .upload-area');
        if (!parent) return;
        
        element.classList.remove('error');
        const errorMessage = parent.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    // Validate the type and size of an image file
    static validateImageFile(file) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            throw new Error('Please select a valid image file (PNG, JPG, JPEG)');
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            throw new Error('File size must be less than 50MB');
        }
        
        return true;
    }

    // Create a preview element for an uploaded file
    static createFilePreview(file, container) {
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => URL.revokeObjectURL(img.src); // Clean up memory
            img.alt = 'File preview';
            preview.appendChild(img);
        }
        
        const info = document.createElement('div');
        info.className = 'file-info';
        info.innerHTML = `
            <span>${file.name}</span>
            <span>${this.formatFileSize(file.size)}</span>
        `;
        preview.appendChild(info);
        
        const existing = container.querySelector('.file-preview');
        if (existing) {
            existing.remove();
        }
        
        container.appendChild(preview);
    }
}