use image::RgbaImage;
use crate::lsb::{read_rgb_byte, write_rgb_byte};

pub const HEADER_SIZE: usize = 32;
pub fn encode_text(
    text: &str,
    mut image: RgbaImage
) -> Result<RgbaImage, String> {

    // Convert text to bytes
    let bytes = text.as_bytes();
    // Text len in bytes
    let length = bytes.len() as u32;

    let required_bits = HEADER_SIZE + bytes.len() * 8;
    // Available bits from raw len / 4 (Every pixel has 4 bytes) * 3 (3 Bits per pixel)
    let available_bits =  image.as_raw().len() / 4 * 3;

    if required_bits > available_bits {
        return Err("Image is too small to store this text".to_string());
    }

    // Write the text length
    for i in 0..4 {
        // Extract each byte of the text length, starting with the most significant byte, and write it into the image
        write_rgb_byte(&mut image, i * 8, (length >> (24 - i * 8)) as u8)?;
    }

    // Write the text bytes after the length
    for (i, byte) in bytes.iter().enumerate() {
        // Write each text byte into the image after the 4-byte length header
        write_rgb_byte(&mut image, HEADER_SIZE + i * 8, *byte)?;
    }

    Ok(image)
}


pub fn decode_text(image: RgbaImage) -> Result<String, String> {
    // Read the text length from the first 4 bytes
    let mut length = 0usize;

    for i in 0..4 {
        let byte = read_rgb_byte(&image, i * 8)?;
        length = (length << 8) | byte as usize;
    }

    // Check if the image has enough bits for the text
    let available_bits = image.as_raw().len() / 4 * 3;

    if HEADER_SIZE + length * 8 > available_bits {
        return Err("Invalid text length or corrupted image".to_string());
    }

    // Read the text bytes after the header
    let mut bytes = Vec::with_capacity(length);

    for i in 0..length {
        let byte = read_rgb_byte(&image, HEADER_SIZE + i * 8)?;
        bytes.push(byte);
    }

    // Convert the bytes back into text
    String::from_utf8(bytes)
        .map_err(|_| "Hidden text is not valid UTF-8".to_string())
}