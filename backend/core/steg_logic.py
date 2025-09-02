# backend/core/steganography_logic.py

from PIL import Image
import hashlib

# Helper to convert data to a binary string
def to_binary(data):
    if isinstance(data, str):
        return ''.join([format(ord(i), "08b") for i in data])
    elif isinstance(data, bytes) or isinstance(data, bytearray):
        return ''.join([format(i, "08b") for i in data])
    elif isinstance(data, int):
        return format(data, "08b")
    else:
        raise TypeError("Type not supported for binary conversion")

def encode_image(image_file, secret_data):
    try:
        image = Image.open(image_file).convert('RGB')
    except Exception:
        raise ValueError("Invalid or corrupted image file provided.")

    # Add a 32-bit header for the length of the secret data
    binary_secret_data = to_binary(secret_data)
    data_len_binary = format(len(binary_secret_data), '032b')
    binary_data = data_len_binary + binary_secret_data

    # Check if the image has enough capacity
    if len(binary_data) > image.width * image.height * 3:
        raise ValueError("Message is too large for the provided image.")

    data_index = 0
    pixels = image.load()

    for i in range(image.width):
        for j in range(image.height):
            pixel = list(pixels[i, j])
            for k in range(3): # Iterate over R, G, B channels
                if data_index < len(binary_data):
                    # Modify the Least Significant Bit (LSB)
                    pixel[k] = int(format(pixel[k], '08b')[:-1] + binary_data[data_index], 2)
                    data_index += 1
            pixels[i, j] = tuple(pixel)
            if data_index >= len(binary_data):
                return image # Return the modified image once all data is hidden
    return image

def decode_image(image_file):
    try:
        image = Image.open(image_file).convert('RGB')
    except Exception:
        raise ValueError("Invalid or corrupted image file provided.")

    pixels = image.load()
    binary_data = ""
    
    # First, extract the 32-bit length header
    for i in range(image.width):
        for j in range(image.height):
            pixel = pixels[i, j]
            for k in range(3): # R, G, B
                binary_data += format(pixel[k], '08b')[-1]
                if len(binary_data) == 32:
                    break
            else: continue
            break
        else: continue
        break

    if len(binary_data) < 32:
        raise ValueError("Could not extract message length. Invalid stego image.")

    msg_len = int(binary_data, 2)
    
    # A sanity check on the message length
    max_len = image.width * image.height * 3
    if msg_len <= 0 or msg_len > max_len:
        raise ValueError("No valid hidden message found.")

    binary_data = ""
    extracted_bits = 0

    # Now extract the actual message, making sure to skip past the header bits
    for i in range(image.width):
        for j in range(image.height):
            pixel = pixels[i, j]
            for k in range(3):
                if extracted_bits < msg_len + 32:
                    if extracted_bits >= 32: # Only start appending after the header
                        binary_data += format(pixel[k], '08b')[-1]
                    extracted_bits += 1
                else:
                    break
            if extracted_bits >= msg_len + 32:
                break
        if extracted_bits >= msg_len + 32:
            break
    
    # Convert the extracted binary data back to a string
    data = ""
    for i in range(0, len(binary_data), 8):
        byte = binary_data[i:i+8]
        if len(byte) == 8:
            data += chr(int(byte, 2))

    if data.startswith("HASH:"):
        return {"type": "hash", "content": data[5:]}
    else:
        return {"type": "message", "content": data}

def generate_file_hash(file):
    sha256_hash = hashlib.sha256()
    # Read the file in chunks to handle large files efficiently
    for byte_block in iter(lambda: file.read(4096), b""):
        sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()