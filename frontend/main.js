// main.js

// Main application logic, now interacting with a backend API

// Define the base URL of your Django backend API.
// This should match the address where your Django development server is running.
const API_BASE_URL = 'http://127.0.0.1:8000/api';

class SteganographyApp {
    constructor() {
        this.currentEncodeMode = 'normal';
        this.currentDecodeMode = 'decode-normal';
        this.files = {
            coverNormal: null,
            coverIntegrity: null,
            target: null,
            decodeNormal: null,
            decodeIntegrity: null,
            verify: null
        };
        // This will now hold the hash extracted from an image by the backend
        this.extractedHash = null;
        
        this.initializeEventListeners();
        this.initializeFileUploads();
    }

    initializeEventListeners() {
        // Mode switching (no changes here)
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                if (mode === 'normal' || mode === 'integrity') this.switchEncodeMode(mode);
                else if (mode === 'decode-normal' || mode === 'decode-integrity') this.switchDecodeMode(mode);
            });
        });

        // Event listeners for encode/decode buttons
        document.getElementById('encode-normal-btn').addEventListener('click', () => this.encodeNormal());
        document.getElementById('encode-integrity-btn').addEventListener('click', () => this.encodeIntegrity());
        document.getElementById('decode-normal-btn').addEventListener('click', () => this.decodeNormal());
        document.getElementById('decode-integrity-btn').addEventListener('click', () => this.decodeIntegrity());

        // Simple validation for the message input
        document.getElementById('message-input').addEventListener('input', () => this.updateButtonStates());
    }

    initializeFileUploads() {
        // --- All file upload initializations remain the same ---
        // Cover file upload (Normal mode)
        this.setupFileUpload('cover-upload-normal', 'cover-file-normal', 'coverNormal', { accept: 'image/*', preview: true });
        // Target file upload (Integrity mode)
        this.setupFileUpload('target-upload', 'target-file', 'target', { preview: false });
        // Cover file upload (Integrity mode)
        this.setupFileUpload('cover-upload-integrity', 'cover-file-integrity', 'coverIntegrity', { accept: 'image/*', preview: true });
        // Decode file upload (Normal mode)
        this.setupFileUpload('decode-upload-normal', 'decode-file-normal', 'decodeNormal', { accept: 'image/*', preview: true });
        // Decode file upload (Integrity mode)
        this.setupFileUpload('decode-upload-integrity', 'decode-file-integrity', 'decodeIntegrity', { accept: 'image/*', preview: true });
        // Verify file upload
        this.setupFileUpload('verify-upload', 'verify-file', 'verify', { preview: false, onUpload: () => this.performIntegrityCheck() });
    }

    // --- setupFileUpload and handleFileUpload remain mostly the same ---
    setupFileUpload(areaId, inputId, fileKey, options = {}) {
        const area = document.getElementById(areaId);
        const input = document.getElementById(inputId);
        area.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0], fileKey, area, options));
        area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragover'); });
        area.addEventListener('dragleave', (e) => { e.preventDefault(); area.classList.remove('dragover'); });
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files[0], fileKey, area, options);
        });
    }

    async handleFileUpload(file, fileKey, area, options = {}) {
        if (!file) return;
        try {
            Utils.clearErrors(area);
            if (options.accept === 'image/*') Utils.validateImageFile(file);
            this.files[fileKey] = file;
            area.classList.add('has-file');
            if (options.preview) Utils.createFilePreview(file, area);
            else {
                const p = area.querySelector('.upload-content p');
                p.textContent = `✅ ${file.name} selected`;
            }
            if (options.onUpload) await options.onUpload(file);
            this.updateButtonStates();
        } catch (error) {
            Utils.showError(area, error.message);
            this.files[fileKey] = null;
            area.classList.remove('has-file');
            this.updateButtonStates();
        }
    }

    // --- Mode switching logic remains the same ---
    switchEncodeMode(mode) {
        this.currentEncodeMode = mode;
        document.querySelectorAll('.encoder-section .mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.encoder-section [data-mode="${mode}"]`).classList.add('active');
        document.querySelectorAll('.encoder-section .mode-content').forEach(content => content.classList.add('hidden'));
        document.getElementById(`${mode}-mode`).classList.remove('hidden');
        this.updateButtonStates();
    }

    switchDecodeMode(mode) {
        this.currentDecodeMode = mode;
        document.querySelectorAll('.decoder-section .mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.decoder-section [data-mode="${mode}"]`).classList.add('active');
        document.querySelectorAll('.decoder-section .mode-content').forEach(content => content.classList.add('hidden'));
        document.getElementById(`${mode}-mode`).classList.remove('hidden');
        this.extractedHash = null;
        document.getElementById('extracted-hash-display').hidden = true;
        document.getElementById('verification-result').hidden = true;
        this.updateButtonStates();
    }
    
    updateButtonStates() {
        // Normal mode button
        const message = document.getElementById('message-input').value.trim();
        document.getElementById('encode-normal-btn').disabled = !this.files.coverNormal || !message;
        
        // Integrity mode button
        document.getElementById('encode-integrity-btn').disabled = !this.files.target || !this.files.coverIntegrity;

        // Decode buttons
        document.getElementById('decode-normal-btn').disabled = !this.files.decodeNormal;
        document.getElementById('decode-integrity-btn').disabled = !this.files.decodeIntegrity;
    }

    // ===================================================================
    // CORE LOGIC REWRITTEN TO USE THE BACKEND API
    // ===================================================================

    async encodeNormal() {
        const button = document.getElementById('encode-normal-btn');
        const message = document.getElementById('message-input').value.trim();
        if (!this.files.coverNormal || !message) return;

        const formData = new FormData();
        formData.append('cover_image', this.files.coverNormal);
        formData.append('message', message);
        formData.append('mode', 'normal');

        try {
            this.setButtonLoading(button, true);
            const response = await fetch(`${API_BASE_URL}/encode/`, { method: 'POST', body: formData });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Encoding failed due to a server error.');
            }

            const blob = await response.blob();
            const filename = `stego_${this.files.coverNormal.name.replace(/\.[^/.]+$/, '')}.png`;
            const downloadLink = Utils.createDownloadLink(blob, filename);
            this.showResult(button, downloadLink, 'Message successfully hidden.');

        } catch (error) {
            Utils.showError(button, error.message);
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async encodeIntegrity() {
        const button = document.getElementById('encode-integrity-btn');
        if (!this.files.target || !this.files.coverIntegrity) return;
        
        const formData = new FormData();
        formData.append('target_file', this.files.target);
        formData.append('cover_image', this.files.coverIntegrity);
        formData.append('mode', 'integrity');

        try {
            this.setButtonLoading(button, true);
            const response = await fetch(`${API_BASE_URL}/encode/`, { method: 'POST', body: formData });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Encoding failed due to a server error.');
            }

            const blob = await response.blob();
            const filename = `integrity_${this.files.coverIntegrity.name.replace(/\.[^/.]+$/, '')}.png`;
            const downloadLink = Utils.createDownloadLink(blob, filename);
            this.showResult(button, downloadLink, 'File hash successfully hidden.');

        } catch (error) {
            Utils.showError(button, error.message);
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async decodeNormal() {
        const button = document.getElementById('decode-normal-btn');
        const resultArea = document.getElementById('decode-normal-result');
        const resultContent = document.getElementById('normal-result-content');
        if (!this.files.decodeNormal) return;

        const formData = new FormData();
        formData.append('stego_image', this.files.decodeNormal);

        try {
            this.setButtonLoading(button, true);
            resultArea.hidden = true;
            const response = await fetch(`${API_BASE_URL}/decode/`, { method: 'POST', body: formData });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Decoding failed due to a server error.');
            }

            const decoded = await response.json();
            
            if (decoded.type === 'hash') {
                resultContent.innerHTML = `<div class="result-title">🔐 File Hash (SHA-256)</div><div class="result-text hash">${decoded.content}</div>`;
            } else {
                resultContent.innerHTML = `<div class="result-title">💬 Hidden Message</div><div class="result-text">${decoded.content}</div>`;
            }
            resultArea.hidden = false;

        } catch (error) {
            Utils.showError(button, error.message);
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async decodeIntegrity() {
        const button = document.getElementById('decode-integrity-btn');
        if (!this.files.decodeIntegrity) return;

        const formData = new FormData();
        formData.append('stego_image', this.files.decodeIntegrity);

        try {
            this.setButtonLoading(button, true);
            const response = await fetch(`${API_BASE_URL}/decode/`, { method: 'POST', body: formData });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Decoding failed.');
            }

            const decoded = await response.json();
            if (decoded.type !== 'hash') {
                throw new Error('This image does not contain a hidden hash.');
            }
            
            this.extractedHash = decoded.content;
            
            const hashDisplay = document.getElementById('extracted-hash-display');
            hashDisplay.querySelector('#extracted-hash-value').textContent = this.extractedHash;
            hashDisplay.hidden = false;

        } catch (error) {
            Utils.showError(button, error.message);
            this.extractedHash = null;
            document.getElementById('extracted-hash-display').hidden = true;
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async performIntegrityCheck() {
        if (!this.extractedHash || !this.files.verify) return;

        try {
            const verifyHash = await Utils.generateFileHash(this.files.verify);
            const isMatch = this.extractedHash === verifyHash;
            
            const resultArea = document.getElementById('verification-result');
            const resultContent = document.getElementById('verification-content');
            
            if (isMatch) {
                resultArea.className = 'verification-area safe';
                resultContent.innerHTML = `<div class="verification-icon">✅</div><div class="verification-title safe">File Integrity: SAFE</div><div class="verification-description">The file's hash matches the one hidden in the image.</div>`;
            } else {
                resultArea.className = 'verification-area tampered';
                resultContent.innerHTML = `<div class="verification-icon">❌</div><div class="verification-title tampered">File Integrity: TAMPERED</div><div class="verification-description">The file's hash does NOT match. The file may be corrupted or modified.</div>`;
            }
            resultArea.hidden = false;

        } catch (error) {
            Utils.showError(document.getElementById('verify-upload'), 'Error verifying file integrity.');
        }
    }

    // --- UI helper functions setButtonLoading and showResult remain the same ---
    setButtonLoading(button, loading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        button.disabled = loading;
        btnText.style.display = loading ? 'none' : 'block';
        btnLoading.hidden = !loading;
    }

    showResult(button, downloadLink, message) {
        const parent = button.parentNode;
        let resultDiv = parent.querySelector('.encode-result');
        if (!resultDiv) {
            resultDiv = document.createElement('div');
            resultDiv.className = 'result-area encode-result';
            parent.appendChild(resultDiv);
        }
        resultDiv.innerHTML = `<div class="result-title success">✅ ${message}</div>`;
        resultDiv.appendChild(downloadLink);
        setTimeout(() => downloadLink.click(), 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SteganographyApp();
});