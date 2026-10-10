import init, {
    encode_text_browser,
    decode_text_browser,
    encode_image_browser,
    decode_image_browser
} from "../pkg/steganography_web.js";

import { t, applyTranslations } from "./i18n.js";

// ─── Main Application ───────────────────────────────────────────────────────

const byId = (id) => document.getElementById(id);

const app = byId("app");
const modeTabs = [...document.querySelectorAll("#tabs [data-mode]")];
const actionTabs = [...document.querySelectorAll(".action-tabs [data-action]")];
const panels = [...document.querySelectorAll(".mode-panel")];
const status = byId("status");
const result = byId("result");
const resultTitle = byId("result-title");
const resultCaption = byId("result-caption");
const preview = byId("preview");
const previewContext = preview.getContext("2d");
const download = byId("download");
const decodedText = byId("decoded-text");
const textCapacity = byId("text-capacity");
const imageCapacity = byId("image-capacity");

let currentMode = "text";
let currentAction = "encode";
let downloadUrl = null;
let modeVersion = 0;
let isWorking = false;
let carrierCapacity = null; // { maxTextBytes, maxSecretPixels }
let secretImagePixels = null;

// Initialise WASM after the page controls have been wired up. A failed WASM load
// should not affect the separate theme switch in index.html.
const wasmReady = init().catch((error) => {
    setStatus(t("wasmError"), "error");
    throw error;
});
// Avoid an unhandled rejection while keeping the original error available to operations.
wasmReady.catch(() => {});

modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        currentMode = tab.dataset.mode;
        renderMode();
    });
});

actionTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        currentAction = tab.dataset.action;
        renderMode();
    });
});

function renderMode() {
    // Only the selected data type and action are visible. A new selection also
    // clears the old output so it cannot be mistaken for the next operation's result.
    modeVersion += 1;
    modeTabs.forEach((tab) => {
        const active = tab.dataset.mode === currentMode;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-pressed", String(active));
    });
    actionTabs.forEach((tab) => {
        const active = tab.dataset.action === currentAction;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-pressed", String(active));
    });

    const activePanel = `${currentMode}-${currentAction}-panel`;
    panels.forEach((panel) => { panel.hidden = panel.id !== activePanel; });
    clearOutput();
    setStatus(currentAction === "encode"
        ? t("encodeStart")
        : t("decodeStart"));
}

// Reflect each file selection in the input itself and discard any stale result.
[
    ["text-encode-carrier", "carrierSelected"],
    ["text-decode-carrier", "encodedSelected"],
    ["image-encode-carrier", "carrierSelected"],
    ["image-decode-carrier", "encodedSelected"]
].forEach(([inputId, messageKey]) => {
    byId(inputId).addEventListener("change", async () => {
        clearOutput();
        const fileInput = byId(inputId);
        if (fileInput.files?.[0]) {
            setStatus(t(messageKey));
            // Calculate capacity when a carrier image is selected
            if (inputId === "text-encode-carrier" || inputId === "image-encode-carrier") {
                try {
                    const carrier = await readImage(fileInput);
                    const carrierPixels = carrier.width * carrier.height;
                    // Text: 3 bits per pixel, 32-bit header for length, 8 bits per byte
                    const maxTextBytes = Math.max(0, Math.floor((carrierPixels * 3 - 32) / 8));
                    // Image: 22 carrier pixels for dimension header (3 bits/pixel RGB), 8 carrier pixels per secret pixel
                    const maxSecretPixels = Math.max(0, Math.floor((carrierPixels - 22) / 8));
                    carrierCapacity = { maxTextBytes, maxSecretPixels };
                    updateTextCapacity();
                    updateImageCapacity(secretImagePixels);
                } catch {
                    carrierCapacity = null;
                    textCapacity.textContent = t("uploadImage");
                    textCapacity.removeAttribute("data-over");
                    imageCapacity.textContent = t("uploadImage");
                    imageCapacity.removeAttribute("data-over");
                }
            }
        } else {
            carrierCapacity = null;
            textCapacity.textContent = t("uploadImage");
            textCapacity.removeAttribute("data-over");
            imageCapacity.textContent = t("uploadImage");
            imageCapacity.removeAttribute("data-over");
        }
    });
});

// Secret image handler - also updates capacity comparison
byId("secret-image").addEventListener("change", async () => {
    clearOutput();
    const fileInput = byId("secret-image");
    if (fileInput.files?.[0]) {
        setStatus(t("secretSelected"));
        try {
            const secret = await readImage(fileInput);
            secretImagePixels = secret.width * secret.height;
            updateImageCapacity(secretImagePixels);
        } catch {
            secretImagePixels = null;
            updateImageCapacity(null);
        }
    } else {
        secretImagePixels = null;
        updateImageCapacity(null);
    }
});

// Live character count for the text encode textarea
byId("secret-text").addEventListener("input", updateTextCapacity);

// Toggle downscale warning visibility when the checkbox changes
const downscaleWarning = byId("downscale-warning");
const scaleSecret = byId("scale-secret");
function updateDownscaleWarning() {
    downscaleWarning.hidden = !scaleSecret.checked;
}
scaleSecret.addEventListener("change", updateDownscaleWarning);
updateDownscaleWarning();

function updateTextCapacity() {
    if (!carrierCapacity) {
        textCapacity.textContent = t("uploadImage");
        textCapacity.removeAttribute("data-over");
        return;
    }
    textCapacity.dataset.capacitySet = "1";
    const bytes = new TextEncoder().encode(byId("secret-text").value).length;
    const remaining = carrierCapacity.maxTextBytes - bytes;
    if (remaining >= 0) {
        textCapacity.textContent = `${bytes} / ${carrierCapacity.maxTextBytes} bytes`;
        textCapacity.dataset.over = "false";
    } else {
        textCapacity.textContent = `${bytes} / ${carrierCapacity.maxTextBytes} bytes (${Math.abs(remaining)} over)`;
        textCapacity.dataset.over = "true";
    }
}

function updateImageCapacity(secretPixels) {
    if (!carrierCapacity) {
        imageCapacity.textContent = t("uploadImage");
        imageCapacity.removeAttribute("data-over");
        return;
    }
    imageCapacity.dataset.capacitySet = "1";
    // Show max dimensions as a square root approximation
    const maxDim = Math.floor(Math.sqrt(carrierCapacity.maxSecretPixels));
    let text = `Max: ${maxDim}×${maxDim} (${carrierCapacity.maxSecretPixels.toLocaleString()} pixels)`;
    if (secretPixels) {
        text += ` · Secret: ${secretPixels.toLocaleString()} pixels`;
        if (secretPixels > carrierCapacity.maxSecretPixels) {
            imageCapacity.dataset.over = "true";
        } else {
            imageCapacity.dataset.over = "false";
        }
    } else {
        imageCapacity.dataset.over = "false";
    }
    imageCapacity.textContent = text;
}

function setStatus(message, kind = "") {
    status.textContent = message;
    status.dataset.kind = kind;
}

function clearOutput() {
    // Revoke object URLs before making a new one to avoid retaining old image data.
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
    download.hidden = true;
    download.removeAttribute("href");
    preview.width = 0;
    preview.height = 0;
    result.hidden = true;
    decodedText.value = "";
    // Reset capacity display when switching modes
    carrierCapacity = null;
    secretImagePixels = null;
    textCapacity.textContent = t("uploadImage");
    textCapacity.removeAttribute("data-over");
    textCapacity.removeAttribute("data-capacity-set");
    imageCapacity.textContent = t("uploadImage");
    imageCapacity.removeAttribute("data-over");
    imageCapacity.removeAttribute("data-capacity-set");
}

function isCurrentView(version) {
    return version === modeVersion;
}

async function readImage(fileInput, allowJpeg = true) {
    const file = fileInput.files?.[0];
    if (!file) throw new Error("Choose an image first.");

    // Inspect the actual file header instead of trusting its extension or MIME type.
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isPng = header.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10]
        .every((value, index) => header[index] === value);
    const isJpeg = header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;

    if (!isPng && !(allowJpeg && isJpeg)) {
        throw new Error(allowJpeg
            ? "Choose a PNG or JPEG image."
            : "Choose a PNG image. JPEG compression can destroy hidden data.");
    }

    const bitmap = await createImageBitmap(file);
    try {
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("This browser could not read the image pixels.");
        context.drawImage(bitmap, 0, 0);
        const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
        return {
            width: bitmap.width,
            height: bitmap.height,
            pixels: new Uint8Array(imageData.data)
        };
    } finally {
        bitmap.close();
    }
}

async function showImage(pixels, width, height, filename, title, caption) {
    if (!Number.isSafeInteger(width * height) || width < 1 || height < 1 || pixels.length !== width * height * 4) {
        throw new Error("The returned pixel data does not match the image dimensions.");
    }

    preview.width = width;
    preview.height = height;
    previewContext.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0);
    resultTitle.textContent = title;
    resultCaption.textContent = caption;
    result.hidden = false;

    // Canvas exports PNG regardless of whether the original carrier was.
    const blob = await new Promise((resolve) => preview.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("The browser could not create the PNG download.");

    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(blob);
    download.href = downloadUrl;
    download.download = filename;
    download.hidden = false;
}

function readHiddenDimensions(pixels) {
    // The Rust image format stores width and height in the first 22 carrier pixels
    // using 3 bits per pixel (RGB): 64 bits total, 32 bits for width, 32 bits for height.
    const minPixels = 22;
    if (pixels.length < minPixels * 4) throw new Error("This image is too small to contain an image header.");

    function readBit(bitIndex) {
        const pixelIndex = Math.floor(bitIndex / 3);
        const channel = bitIndex % 3;
        return pixels[(pixelIndex * 4) + channel] & 1;
    }

    function readByte(startBit) {
        let byte = 0;
        for (let i = 0; i < 8; i += 1) {
            byte = (byte << 1) | readBit(startBit + i);
        }
        return byte;
    }

    function readU32(startBit) {
        let value = 0;
        for (let b = 0; b < 4; b += 1) {
            value = value * 256 + readByte(startBit + b * 8);
        }
        return value;
    }

    const width = readU32(0);
    const height = readU32(32);
    const pixelCount = width * height;
    const availableSecretPixels = Math.floor((pixels.length / 4 - minPixels) / 8);
    if (!width || !height || !Number.isSafeInteger(pixelCount) || pixelCount > availableSecretPixels) {
        throw new Error("The hidden image dimensions are invalid or the PNG is damaged.");
    }
    return { width, height };
}

async function fitSecretImage(secret, carrier, shouldScale) {
    // The current Rust format needs 22 carrier pixels for dimensions and eight
    // carrier pixels for each secret pixel. Scale only if that capacity is exceeded.
    const carrierPixels = carrier.width * carrier.height;
    const maxSecretPixels = Math.floor((carrierPixels - 22) / 8);
    if (maxSecretPixels < 1) throw new Error("The carrier image is too small to store a secret image.");

    const secretPixels = secret.width * secret.height;
    if (secretPixels <= maxSecretPixels) return secret;
    if (!shouldScale) {
        throw new Error("The secret image is too large. Enable 'Scale down to fit' or choose a smaller image.");
    }

    const ratio = secret.width / secret.height;
    const scale = Math.sqrt(maxSecretPixels / secretPixels);
    let width = Math.max(1, Math.floor(secret.width * scale));
    let height = Math.max(1, Math.floor(secret.height * scale));

    // Very wide or tall images can exceed capacity after rounding a dimension up
    // to one pixel. Trim the longer dimension to guarantee the result fits.
    if (width * height > maxSecretPixels) {
        if (ratio >= 1) width = Math.max(1, Math.min(width, Math.floor(maxSecretPixels / height)));
        else height = Math.max(1, Math.min(height, Math.floor(maxSecretPixels / width)));
    }

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = secret.width;
    sourceCanvas.height = secret.height;
    const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!sourceContext) throw new Error("This browser could not prepare the secret image.");
    sourceContext.putImageData(new ImageData(new Uint8ClampedArray(secret.pixels), secret.width, secret.height), 0, 0);

    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = width;
    scaledCanvas.height = height;
    const scaledContext = scaledCanvas.getContext("2d", { willReadFrequently: true });
    if (!scaledContext) throw new Error("This browser could not resize the secret image.");
    scaledContext.imageSmoothingEnabled = true;
    scaledContext.imageSmoothingQuality = "high";
    scaledContext.drawImage(sourceCanvas, 0, 0, width, height);

    return {
        width,
        height,
        pixels: new Uint8Array(scaledContext.getImageData(0, 0, width, height).data)
    };
}

async function perform(operation) {
    if (isWorking) return;
    isWorking = true;
    const version = modeVersion;
    clearOutput();
    document.querySelectorAll(".operation-button").forEach((item) => { item.disabled = true; });

    try {
        await wasmReady;
        if (!isCurrentView(version)) return;
        await operation(version);
    } catch (error) {
        if (isCurrentView(version)) {
            setStatus(error instanceof Error ? error.message : String(error), "error");
        }
    } finally {
        isWorking = false;
        document.querySelectorAll(".operation-button").forEach((item) => { item.disabled = false; });
    }
}

byId("encode-text").addEventListener("click", () => perform(async (version) => {
    setStatus(t("encodingText"));
    const carrier = await readImage(byId("text-encode-carrier"));
    if (!isCurrentView(version)) return;
    const pixels = encode_text_browser(byId("secret-text").value, carrier.pixels, carrier.width, carrier.height);
    await showImage(
        pixels, carrier.width, carrier.height,
        "encoded-text.png", t("result"),
        t("encodedTextCaption")
    );
    if (isCurrentView(version)) setStatus(t("textSuccess"), "success");
}));

byId("decode-text").addEventListener("click", () => perform(async (version) => {
    setStatus(t("decodingText"));
    const carrier = await readImage(byId("text-decode-carrier"), false);
    if (!isCurrentView(version)) return;
    const message = decode_text_browser(carrier.pixels, carrier.width, carrier.height);
    decodedText.value = message;
    setStatus(message.length ? t("textDecoded") : t("textDecodedEmpty"), "success");
}));

byId("encode-image").addEventListener("click", () => perform(async (version) => {
    setStatus(t("encodingImage"));
    const carrier = await readImage(byId("image-encode-carrier"));
    const originalSecret = await readImage(byId("secret-image"));
    if (!isCurrentView(version)) return;
    const secret = await fitSecretImage(originalSecret, carrier, byId("scale-secret").checked);
    if (!isCurrentView(version)) return;

    const pixels = encode_image_browser(
        secret.pixels, secret.width, secret.height,
        carrier.pixels, carrier.width, carrier.height
    );
    const caption = t("encodedImageCaption").replace("{w}", secret.width).replace("{h}", secret.height);
    await showImage(
        pixels, carrier.width, carrier.height,
        "encoded-image.png", t("result"),
        caption
    );
    if (isCurrentView(version)) setStatus(t("imageSuccess"), "success");
}));

byId("decode-image").addEventListener("click", () => perform(async (version) => {
    setStatus(t("decodingImage"));
    const carrier = await readImage(byId("image-decode-carrier"), false);
    if (!isCurrentView(version)) return;
    const dimensions = readHiddenDimensions(carrier.pixels);
    const pixels = decode_image_browser(carrier.pixels, carrier.width, carrier.height);
    const caption = t("decodedImageCaption").replace("{w}", dimensions.width).replace("{h}", dimensions.height);
    await showImage(
        pixels, dimensions.width, dimensions.height,
        "decoded-image.png", t("result"),
        caption
    );
    if (isCurrentView(version)) setStatus(t("imageDecoded"), "success");
}));

window.addEventListener("pagehide", () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
});

// ─── Info Dialog ────────────────────────────────────────────────────────────

const infoDialog = byId("info-dialog");
const infoToggle = byId("info-toggle");
const infoClose = byId("info-close");
const infoTabs = [...document.querySelectorAll(".info-tabs [data-info]")];
const infoSections = [...document.querySelectorAll(".info-section")];

infoToggle.addEventListener("click", () => {
    infoDialog.hidden = false;
    infoToggle.tabIndex = -1;
    infoClose.focus();
});

function closeInfoDialog() {
    infoDialog.hidden = true;
    infoToggle.tabIndex = 0;
    infoToggle.focus();
}

infoClose.addEventListener("click", closeInfoDialog);
infoDialog.querySelector(".info-backdrop").addEventListener("click", closeInfoDialog);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !infoDialog.hidden) closeInfoDialog();
});

infoTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const target = tab.dataset.info;
        infoTabs.forEach((t) => {
            const active = t.dataset.info === target;
            t.classList.toggle("active", active);
            t.setAttribute("aria-pressed", String(active));
        });
        infoSections.forEach((section) => {
            section.hidden = section.id !== `info-${target}`;
        });
    });
});

// ─── Initialization ─────────────────────────────────────────────────────────

applyTranslations();
renderMode();
