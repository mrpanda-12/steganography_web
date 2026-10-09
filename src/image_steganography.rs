
use image::RgbaImage;
use crate::channel::Channel;
use crate::lsb::{read_byte, write_byte};

pub const HEADER_PIXELS: usize = 64;

pub fn encode_image(
    secret_image: RgbaImage,
    mut carrier_image: RgbaImage,
) -> Result<RgbaImage, String> {
    // Get the dimensions of the secret image
    let width = secret_image.width();
    let height = secret_image.height();

    // Calculate the number of pixels needed
    let secret_pixel_count = secret_image.as_raw().len() / 4;
    let required_pixels = HEADER_PIXELS + secret_pixel_count * 8;
    let available_pixels = carrier_image.as_raw().len() / 4;

    if required_pixels > available_pixels {
        return Err("Carrier image is too small".to_string());
    }

    // Store the secret image width in the header
    for i in 0..4 {
        let byte = (width >> (24 - i * 8)) as u8;
        write_byte(&mut carrier_image, i * 8, byte, Channel::Red)?;
    }

    // Store the secret image height in the header
    for i in 0..4 {
        let byte = (height >> (24 - i * 8)) as u8;
        write_byte(&mut carrier_image, (i + 4) * 8, byte, Channel::Red)?;
    }

    // Hide each secret pixel in 8 carrier pixels
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

    // Read the secret image width from the header
    let mut width = 0u32;

    for i in 0..4 {
        let byte = read_byte(&carrier_image, i * 8, Channel::Red)?;
        width = (width << 8) | byte as u32;
    }

    // Read the secret image height from the header
    let mut height = 0u32;

    for i in 0..4 {
        let byte = read_byte(&carrier_image, (i + 4) * 8, Channel::Red)?;
        height = (height << 8) | byte as u32;
    }

    // Check whether the dimensions are valid
    if width == 0 || height == 0 {
        return Err("Invalid hidden image dimensions".to_string());
    }

    // Check whether the carrier contains enough pixels
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

    // Create the image that will hold the decoded pixels
    let mut secret_image = RgbaImage::new(width, height);

    // Rebuild each secret pixel from 8 carrier pixels
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