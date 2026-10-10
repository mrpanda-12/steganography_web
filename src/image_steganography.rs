
use image::RgbaImage;
use crate::channel::Channel;
use crate::lsb::{read_byte, write_byte, read_rgb_byte, write_rgb_byte};

// Pixels for width and height, 3 bits per pixel (64 bits / 3, rounded up)
pub const HEADER_PIXELS: usize = 22;

pub fn encode_image(
    secret_image: RgbaImage,
    mut carrier_image: RgbaImage,
) -> Result<RgbaImage, String> {
    // Secret image dimensions
    let width = secret_image.width();
    let height = secret_image.height();

    // Pixel count from raw len / 4 (Every pixel has 4 bytes)
    let secret_pixel_count = secret_image.as_raw().len() / 4;
    let required_pixels = HEADER_PIXELS + secret_pixel_count * 8;
    let available_pixels = carrier_image.as_raw().len() / 4;

    if required_pixels > available_pixels {
        return Err("Carrier image is too small".to_string());
    }

    // Write the width using all RGB channels
    for i in 0..4 {
        // Extract each byte of the width and write it into the image
        write_rgb_byte(&mut carrier_image, i * 8, (width >> (24 - i * 8)) as u8)?;
    }

    // Write the height using all RGB channels
    for i in 0..4 {
        // Extract each byte of the height and write it into the image
        write_rgb_byte(&mut carrier_image, (i + 4) * 8, (height >> (24 - i * 8)) as u8)?;
    }

    // Write the secret pixels after the dimensions
    for (i, pixel) in secret_image.pixels().enumerate() {
        let start_index = HEADER_PIXELS + i * 8;

        // Store each color channel in its matching channel
        write_byte(&mut carrier_image, start_index, pixel[0], Channel::Red)?;
        write_byte(&mut carrier_image, start_index, pixel[1], Channel::Green)?;
        write_byte(&mut carrier_image, start_index, pixel[2], Channel::Blue)?;
    }

    Ok(carrier_image)
}

pub fn decode_image(
    carrier_image: RgbaImage,
) -> Result<RgbaImage, String> {
    let available_pixels = carrier_image.as_raw().len() / 4;

    if available_pixels < HEADER_PIXELS {
        return Err("Carrier image is too small to contain a header".to_string());
    }

    // Read the width using all RGB channels
    let mut width = 0u32;

    for i in 0..4 {
        let byte = read_rgb_byte(&carrier_image, i * 8)?;
        width = (width << 8) | byte as u32;
    }

    // Read the height using all RGB channels
    let mut height = 0u32;

    for i in 0..4 {
        let byte = read_rgb_byte(&carrier_image, (i + 4) * 8)?;
        height = (height << 8) | byte as u32;
    }

    // Check if dimensions are valid
    if width == 0 || height == 0 {
        return Err("Invalid hidden image dimensions".to_string());
    }

    // Check if the image has enough pixels for the secret
    let secret_pixel_count = (width as usize)
        .checked_mul(height as usize)
        .ok_or("Image dimensions are too large")?;

    let required_pixels = secret_pixel_count
        .checked_mul(8)
        .and_then(|count| count.checked_add(HEADER_PIXELS))
        .ok_or("Image dimensions are too large")?;

    if required_pixels > available_pixels {
        return Err("Carrier image does not contain a complete hidden image".to_string());
    }

    // Create the decoded image
    let mut secret_image = RgbaImage::new(width, height);

    // Read the secret pixels after the dimensions
    for i in 0..secret_pixel_count {
        let start_index = HEADER_PIXELS + i * 8;

        // Read each color channel from its matching channel
        let red = read_byte(&carrier_image, start_index, Channel::Red)?;
        let green = read_byte(&carrier_image, start_index, Channel::Green)?;
        let blue = read_byte(&carrier_image, start_index, Channel::Blue)?;

        // Convert the pixel index into image coordinates
        let x = (i % width as usize) as u32;
        let y = (i / width as usize) as u32;

        secret_image.put_pixel(x, y, image::Rgba([red, green, blue, 255]));
    }

    Ok(secret_image)
}