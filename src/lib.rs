use image::RgbaImage;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::wasm_bindgen;

pub mod channel;
pub mod lsb;
pub mod text_steganography;
pub mod image_steganography;


#[wasm_bindgen]
pub fn encode_text_browser(
    text: &str,
    pixels: &[u8],
    width: u32,
    height: u32,
) -> Result<Vec<u8>, JsValue> {
    let image = RgbaImage::from_raw(width, height, pixels.to_vec())
        .ok_or_else(|| JsValue::from_str("Invalid image dimensions or pixel data"))?;

    let encoded = text_steganography::encode_text(text, image)
        .map_err(|err| JsValue::from_str(&err))?;

    Ok(encoded.into_raw())
}


#[wasm_bindgen]
pub fn decode_text_browser(
    pixels: &[u8],
    width: u32,
    height: u32,
) -> Result<String, JsValue> {
    let image = RgbaImage::from_raw(width, height, pixels.to_vec())
        .ok_or_else(|| JsValue::from_str("Invalid image dimensions or pixel data"))?;

    text_steganography::decode_text(image)
        .map_err(|err| JsValue::from_str(&err))
}


#[wasm_bindgen]
pub fn encode_image_browser(
    secret_pixels: &[u8],
    secret_width: u32,
    secret_height: u32,
    carrier_pixels: &[u8],
    carrier_width: u32,
    carrier_height: u32,
) -> Result<Vec<u8>, JsValue> {
    let secret_image =
        RgbaImage::from_raw(secret_width, secret_height, secret_pixels.to_vec())
            .ok_or_else(|| JsValue::from_str("Invalid secret image data"))?;

    let carrier_image =
        RgbaImage::from_raw(carrier_width, carrier_height, carrier_pixels.to_vec())
            .ok_or_else(|| JsValue::from_str("Invalid carrier image data"))?;

    let encoded = image_steganography::encode_image(secret_image, carrier_image)
        .map_err(|err| JsValue::from_str(&err))?;

    Ok(encoded.into_raw())
}


#[wasm_bindgen]
pub fn decode_image_browser(
    pixels: &[u8],
    width: u32,
    height: u32,
) -> Result<Vec<u8>, JsValue> {
    let carrier_image = RgbaImage::from_raw(width, height, pixels.to_vec())
        .ok_or_else(|| JsValue::from_str("Invalid carrier image data"))?;

    let decoded = image_steganography::decode_image(carrier_image)
        .map_err(|err| JsValue::from_str(&err))?;

    Ok(decoded.into_raw())
}