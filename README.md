# StegByte - Steganography and Checksum 

This is a full-stack web application that provides a modern, dark-themed interface for steganographic encoding and decoding. Beyond hiding simple text messages in images, this tool includes a powerful **Integrity Mode** to verify if a file has been tamed with or corrupted over time.

The application is built with a decoupled architecture, featuring a pure HTML, CSS, and JavaScript frontend and a powerful Python/Django backend that handles all heavy processing.

## Features

-   **Dual-Mode Operation**: Supports both "Normal Mode" for hiding text and "Integrity Mode" for verifying file integrity.
-   **Modern UI**: A clean, dark-themed, and responsive user interface for a smooth user experience.
-   **Client-Server Architecture**: A lightweight frontend communicates with a robust Django backend via a RESTful API, ensuring high performance.
-   **Secure Hashing**: Uses the industry-standard SHA-256 algorithm for generating file checksums.
-   **LSB Steganography**: Implements the Least Significant Bit (LSB) substitution technique to invisibly embed data within image files.

---

## The Two Modes Explained

### 1. Normal Mode

This is classic steganography. It allows you to hide a secret text message within a "cover" image.

-   **How it works**: You provide an image and a message. The tool encodes the text into the image's pixel data, producing a new "stego" image that looks identical to the original.
-   **Use case**: Sending secret messages, watermarking images, or simply for educational purposes.

### 2. Integrity Mode

This is the advanced feature of the tool, designed to solve a critical problem in data management: **how do you prove a file has not been changed over time?**

#### The Problem: Data Corruption and Tampering

Files are not static. They can be altered, either accidentally or maliciously.
-   **Data Corruption**: A file transfer error, a failing hard drive, or even a software bug can silently flip bits in a file, corrupting it without any obvious signs.
-   **Malicious Tampering**: An attacker could modify a critical document, alter a software executable to include malware, or change a configuration file.

In these scenarios, how can you be sure the file you have today is the exact same one you started with? Just looking at the filename or file size is not enough.

#### The Solution: Cryptographic Hashing (Checksums)

Integrity Mode uses a cryptographic hash function (SHA-256) to create a unique, fixed-size "fingerprint" of a file. This hash has important properties:
1.  **Deterministic**: The same file will *always* produce the exact same hash.
2.  **Sensitive**: Changing even a single bit in the file will produce a completely different hash.
3.  **Non-Reversible**: You cannot reconstruct the file from its hash.

#### How This Tool Helps

This tool provides a novel way to store and verify this checksum. Instead of saving the hash in a separate text file (which can also be lost or altered), **Integrity Mode hides the file's hash inside an image.**

The workflow is as follows:
1.  **Encode**:
    -   You select a target file you want to protect (e.g., `important_document.pdf`).
    -   The tool calculates its SHA-256 hash.
    -   You provide a cover image. The tool embeds the hash into this image, creating a "stego" image. This image now acts as a tamper-proof "key" for your document.

2.  **Verify**:
    -   Months later, you want to verify `important_document.pdf`.
    -   You upload the stego image. The tool extracts the original, trusted hash.
    -   You upload the `important_document.pdf` file you want to check. The tool calculates its *current* hash.
    -   It then compares the two hashes:
        -   ✅ **Match**: A "SAFE" message is displayed. You have mathematical proof that the file is untouched and authentic.
        -   ❌ **Mismatch**: A "TAMPERED" message is displayed. The file has been altered or corrupted.

---

## Technical Details & Architecture

This project is built as a **decoupled client-server application**.

### Frontend

-   **Stack**: Pure HTML5, CSS3, and modern JavaScript (ES6+).
-   **No Frameworks**: Intentionally built without frameworks like React or Vue to demonstrate core web development principles.
-   **Responsibilities**:
    -   Renders the user interface.
    -   Manages user interactions and file uploads.
    -   Communicates with the backend via `fetch` API calls.
    -   Performs the final hash comparison for the integrity check using the browser's **Web Crypto API**.

### Backend

-   **Stack**: Python with the **Django** framework.
-   **API**: A RESTful API built using **Django REST Framework** to handle `POST` requests for encoding and decoding.
-   **Image Processing**: Uses the **Pillow** (PIL) library for all pixel-level manipulation.
-   **Steganography Logic**:
    -   Implements the **LSB (Least Significant Bit)** substitution technique.
    -   A **32-bit header** is embedded at the start of the data stream, which stores the length of the secret message. This allows the decoder to know exactly how many bits to read, making the system robust.
    -   The logic iterates through pixels (top-to-bottom, left-to-right) and modifies the LSB of the R, G, and B color channels. The Alpha channel is ignored.
-   **Cross-Origin Communication**: Uses `django-cors-headers` to securely allow the frontend (running on a different port) to access the backend API.

---

## How to Set Up and Run the Project

### Prerequisites

-   Python 3.8+
-   Node.js and npm
-   A Python virtual environment tool (like `venv`)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
