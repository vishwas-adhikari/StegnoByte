// Steganography implementation using LSB (Least Significant Bit) technique

class Steganography {
    // Encode a message into an image using LSB steganography
    static async encodeMessage(img, message) {
        const { canvas, ctx } = Utils.getCanvasFromImage(img);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert message to binary and add length header
        const binaryMessage = Utils.stringToBinary(message);
        const messageLength = binaryMessage.length;
        const lengthBinary = messageLength.toString(2).padStart(32, '0');
        const fullBinary = lengthBinary + binaryMessage;

        // Check if image has enough capacity
        if (!Utils.checkImageCapacity(img, message.length)) {
            throw new Error('Image is too small to hide this message. Please use a larger image or shorter message.');
        }

        // Hide binary data in LSB of RGB channels
        let binaryIndex = 0;
        for (let i = 0; i < data.length && binaryIndex < fullBinary.length; i += 4) {
            // Skip alpha channel (i+3), only use RGB channels
            for (let channel = 0; channel < 3 && binaryIndex < fullBinary.length; channel++) {
                const pixelIndex = i + channel;
                const bit = parseInt(fullBinary[binaryIndex]);
                
                // Modify LSB
                data[pixelIndex] = (data[pixelIndex] & 0xFE) | bit;
                binaryIndex++;
            }
        }

        // Put modified data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        return canvas;
    }

    // Decode a message from an image
    static async decodeMessage(img) {
        const { canvas, ctx } = Utils.getCanvasFromImage(img);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Extract length header (first 32 bits)
        let binaryLength = '';
        for (let i = 0; i < 32 * 4; i += 4) {
            for (let channel = 0; channel < 3 && binaryLength.length < 32; channel++) {
                const pixelIndex = i + channel;
                binaryLength += (data[pixelIndex] & 1).toString();
            }
        }

        const messageLength = parseInt(binaryLength, 2);
        
        if (messageLength <= 0 || messageLength > 1000000) {
            throw new Error('No valid hidden message found in this image.');
        }

        // Extract message bits
        let binaryMessage = '';
        let extractedBits = 0;
        
        for (let i = 32 * 4; i < data.length && extractedBits < messageLength; i += 4) {
            for (let channel = 0; channel < 3 && extractedBits < messageLength; channel++) {
                const pixelIndex = i + channel;
                binaryMessage += (data[pixelIndex] & 1).toString();
                extractedBits++;
            }
        }

        if (extractedBits < messageLength) {
            throw new Error('Image appears to be corrupted or incomplete.');
        }

        // Convert binary back to string
        const message = Utils.binaryToString(binaryMessage);
        
        if (!message || message.trim() === '') {
            throw new Error('No readable message found in this image.');
        }

        return message;
    }

    // Get maximum message capacity for an image
    static getImageCapacity(img) {
        const totalPixels = img.width * img.height;
        const totalBits = totalPixels * 3; // RGB channels only
        const usableBits = totalBits - 32; // Subtract header bits
        return Math.floor(usableBits / 8); // Convert to characters
    }

    // Validate if image can hide the message
    static canHideMessage(img, messageLength) {
        const capacity = this.getImageCapacity(img);
        return capacity >= messageLength;
    }

    // Encode hash specifically (for integrity mode)
    static async encodeHash(img, hash) {
        // Prefix hash with identifier to distinguish from regular messages
        const hashMessage = `HASH:${hash}`;
        return this.encodeMessage(img, hashMessage);
    }

    // Decode and check if it's a hash
    static async decodeContent(img) {
        try {
            const content = await this.decodeMessage(img);
            
            // Check if it's a hash
            if (content.startsWith('HASH:')) {
                return {
                    type: 'hash',
                    content: content.substring(5), // Remove 'HASH:' prefix
                    originalContent: content
                };
            } else {
                return {
                    type: 'message',
                    content: content,
                    originalContent: content
                };
            }
        } catch (error) {
            throw error;
        }
    }

    // Check if image likely contains steganographic content
    static async hasHiddenContent(img) {
        try {
            const decoded = await this.decodeContent(img);
            return decoded.content.length > 0;
        } catch {
            return false;
        }
    }
}

// Export for use in other files
window.Steganography = Steganography;