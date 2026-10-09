use image::RgbaImage;
use crate::channel::Channel;

pub fn write_bit(
    image: &mut RgbaImage,
    bit_index: usize,
    bit: u8,
    channel: Channel
) -> Result<(), String> {

    // Return error if bit isn't 0 or 1
    if bit > 1 {
        return Err("Bit must be 0 or 1".to_string());
    }

    // Pixel count from raw len / 4 (Every pixel has 4 bytes)
    let pixel_count = image.as_raw().len() / 4;

    // Return error if the bit index is outside the pixel count
    if bit_index >= pixel_count {
        return Err("Pixel index out of bounds".to_string());
    }

    // Image width
    let width = image.width() as usize;

    if width == 0 {
        return Err("Image has zero width".to_string());
    }

    // Pixel pos
    let x = bit_index % width;
    let y = bit_index / width;

    // Get mutable rgba pixel
    let pixel = image.get_pixel_mut(x as u32, y as u32);

    // Channel as number (0, 1, 2)
    let channel = channel.index();

    // Write the lsb bit by first setting it to 0 and then adding the new bit
    pixel.0[channel] = (pixel.0[channel] & !1) | bit;

    Ok(())
}

pub fn read_bit(
    image: &RgbaImage,
    bit_index: usize,
    channel: Channel,
) -> Result<u8, String> {

    // Pixel count from raw len / 4 (Every pixel has 4 bytes)
    let pixel_count = image.as_raw().len() / 4;

    // Return error if the bit index is outside the pixel count
    if bit_index >= pixel_count {
        return Err("Pixel index out of bounds".to_string());
    }

    // Image width
    let width = image.width() as usize;

    if width == 0 {
        return Err("Image has zero width".to_string());
    }

    // Pixel pos
    let x = bit_index % width;
    let y = bit_index / width;

    // Get pixel at the given position
    let pixel = image.get_pixel(x as u32, y as u32);

    // Channel as number (0, 1, 2)
    let channel = channel.index();

    // Read the lsb bit
    let bit = pixel.0[channel] & 1;

    Ok(bit)
}

pub fn write_rgb_bit(
    image: &mut RgbaImage,
    data_bit_index: usize,
    bit: u8,
) -> Result<(), String> {

    // Get pixel index (3 bits per pixel: red, green, blue)
    let pixel_index = data_bit_index / 3;

    // Get channel based on the bit index
    let channel = match data_bit_index % 3 {
        0 => Channel::Red,
        1 => Channel::Green,
        _ => Channel::Blue,
    };

    // Write bit to the selected pixel and channel
    write_bit(image, pixel_index, bit, channel)
}

pub fn read_rgb_bit(
    image: &RgbaImage,
    data_bit_index: usize,
) -> Result<u8, String> {

    // Get pixel index (3 bits per pixel: red, green, blue)
    let pixel_index = data_bit_index / 3;

    // Get channel based on the bit index
    let channel = match data_bit_index % 3 {
        0 => Channel::Red,
        1 => Channel::Green,
        _ => Channel::Blue,
    };

    // Read bit from the selected pixel and channel
    read_bit(image, pixel_index, channel)
}

pub fn write_byte(
    image: &mut RgbaImage,
    start_bit_index: usize,
    byte: u8,
    channel: Channel,
) -> Result<(), String> {

    // Loop through all 8 bits of the byte
    for i in 0..8 {

        // Shift the current bit to the right position and extract it
        let bit = (byte >> (7 - i)) & 1;

        // Write bit to the next pixel in the selected channel
        write_bit(image, start_bit_index + i, bit, channel)?;
    }

    Ok(())
}

pub fn read_byte(
    image: &RgbaImage,
    start_bit_index: usize,
    channel: Channel,
) -> Result<u8, String> {

    // Store the bits we read
    let mut byte = 0u8;

    // Loop through all 8 bits of the byte
    for i in 0..8 {

        // Read bit from the next pixel in the selected channel
        let bit = read_bit(image, start_bit_index + i, channel)?;

        // Put the read bit into its correct position in the byte
        byte |= bit << (7 - i);
    }

    Ok(byte)
}
pub fn write_rgb_byte(
    image: &mut RgbaImage,
    start_bit_index: usize,
    byte: u8,
) -> Result<(), String> {

    // Loop through all 8 bits of the byte
    for i in 0..8 {

        // Get the bit at the current position
        let bit = (byte >> (7 - i)) & 1;

        // Write bit to the next RGB channel
        write_rgb_bit(image, start_bit_index + i, bit)?;
    }

    Ok(())
}

pub fn read_rgb_byte(
    image: &RgbaImage,
    start_bit_index: usize,
) -> Result<u8, String> {

    // Store the bits we read
    let mut byte = 0u8;

    // Loop through all 8 bits of the byte
    for i in 0..8 {

        // Read bit from the next RGB channel
        let bit = read_rgb_bit(image, start_bit_index + i)?;

        // Put the read bit into its correct position in the byte
        byte |= bit << (7 - i);
    }

    Ok(byte)
}


#[cfg(test)]
mod tests {
    use super::*;
    use image::Rgba;

    #[test]
    fn write_and_read_bit() {
        let mut image = RgbaImage::new(1, 1);
        image.put_pixel(0, 0, Rgba([100, 150, 200, 255]));

        write_bit(&mut image, 0, 1, Channel::Red).unwrap();

        assert_eq!(read_bit(&image, 0, Channel::Red).unwrap(), 1);
        assert_eq!(image.get_pixel(0, 0).0, [101, 150, 200, 255]);
    }

    #[test]
    fn write_and_read_rgb_byte() {
        // Create image with enough pixels for 8 bits
        let mut image = RgbaImage::new(3, 1);

        // Write byte using all RGB channels
        write_rgb_byte(&mut image, 0, 0b10110010).unwrap();

        // Read byte back from all RGB channels
        let result = read_rgb_byte(&image, 0).unwrap();

        // Check if the byte stayed the same
        assert_eq!(result, 0b10110010);
    }
    #[test]
    fn save_test_image() {
        // Create a test image
        let mut image = RgbaImage::new(100, 100);

        // Fill image with a grey color
        for pixel in image.pixels_mut() {
            *pixel = Rgba([150, 150, 150, 255]);
        }

        // Save original image
        image.save("original.png").unwrap();

        // Write a test byte using all RGB channels
        write_rgb_byte(&mut image, 0, 0b10110010).unwrap();

        // Save image after writing the byte
        image.save("modified.png").unwrap();
    }

}
