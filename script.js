import init, {
    encode_text_browser,
    decode_text_browser,
    encode_image_browser,
    decode_image_browser
} from "./pkg/steganoraphy_web.js";

const byId = (id) => document.getElementById(id);

const app = byId("app");
const layoutSelect = byId("layout");
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

let currentMode = "text";
let currentAction = "encode";
let downloadUrl = null;
let modeVersion = 0;
let isWorking = false;

// Initialise WASM after the page controls have been wired up. A failed WASM load
// should not affect the separate theme switch in index.html.
const wasmReady = init().catch((error) => {
    setStatus("The Rust/WASM module could not load. Run wasm-pack build --target web and serve this folder over HTTP.", "error");
    throw error;
});
// Avoid an unhandled rejection while keeping the original error available to operations.
wasmReady.catch(() => {});

// Keep the tab layout in one place so changing the selector cannot reset the active mode.
layoutSelect.addEventListener("change", () => {
    const position = ["top", "bottom", "left", "right"].includes(layoutSelect.value)
        ? layoutSelect.value
        : "top";
    app.className = `layout-${position}`;
});

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
        ? "Choose the image that will hold your data."
        : "Choose the PNG that contains the hidden data.");
}

// Reflect each file selection in the input itself and discard any stale result.
[
    ["text-encode-carrier", "Carrier image selected."],
    ["text-decode-carrier", "Encoded PNG selected."],
    ["image-encode-carrier", "Carrier image selected."],
    ["secret-image", "Secret image selected."],
    ["image-decode-carrier", "Encoded PNG selected."]
].forEach(([inputId, message]) => {
    byId(inputId).addEventListener("change", () => {
        clearOutput();
        if (byId(inputId).files?.[0]) setStatus(message);
    });
});

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
    // The Rust image format stores width and height in the red-channel LSBs of
    // the first 64 carrier pixels: 32 pixels for each 32-bit dimension.
    if (pixels.length < 64 * 4) throw new Error("This image is too small to contain an image header.");

    function readHeaderByte(startPixel) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit += 1) {
            byte = (byte << 1) | (pixels[(startPixel + bit) * 4] & 1);
        }
        return byte;
    }

    function readU32(startPixel) {
        let value = 0;
        for (let byte = 0; byte < 4; byte += 1) {
            value = value * 256 + readHeaderByte(startPixel + byte * 8);
        }
        return value;
    }

    const width = readU32(0);
    const height = readU32(32);
    const pixelCount = width * height;
    const availableSecretPixels = Math.floor((pixels.length / 4 - 64) / 8);
    if (!width || !height || !Number.isSafeInteger(pixelCount) || pixelCount > availableSecretPixels) {
        throw new Error("The hidden image dimensions are invalid or the PNG is damaged.");
    }
    return { width, height };
}

async function fitSecretImage(secret, carrier, shouldScale) {
    // The current Rust format needs 64 carrier pixels for dimensions and eight
    // carrier pixels for each secret pixel. Scale only if that capacity is exceeded.
    const carrierPixels = carrier.width * carrier.height;
    const maxSecretPixels = Math.floor((carrierPixels - 64) / 8);
    if (maxSecretPixels < 1) throw new Error("The carrier image is too small to store a secret image.");

    const secretPixels = secret.width * secret.height;
    if (secretPixels <= maxSecretPixels) return secret;
    if (!shouldScale) {
        throw new Error("The secret image is too large. Enable ‘Scale down to fit’ or choose a smaller image.");
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
    setStatus("Encoding message…");
    const carrier = await readImage(byId("text-encode-carrier"));
    if (!isCurrentView(version)) return;
    const pixels = encode_text_browser(byId("secret-text").value, carrier.pixels, carrier.width, carrier.height);
    await showImage(
        pixels, carrier.width, carrier.height,
        "encoded-text.png", "Encoded image",
        "The message is hidden in this PNG. Keep the file as PNG so its hidden bits are preserved."
    );
    if (isCurrentView(version)) setStatus("Message encoded. Download the PNG to preserve the hidden data.", "success");
}));

byId("decode-text").addEventListener("click", () => perform(async (version) => {
    setStatus("Decoding message…");
    const carrier = await readImage(byId("text-decode-carrier"), false);
    if (!isCurrentView(version)) return;
    const message = decode_text_browser(carrier.pixels, carrier.width, carrier.height);
    decodedText.value = message;
    setStatus(message.length ? "Message decoded." : "Message decoded. The hidden message is empty.", "success");
}));

byId("encode-image").addEventListener("click", () => perform(async (version) => {
    setStatus("Encoding image…");
    const carrier = await readImage(byId("image-encode-carrier"));
    const originalSecret = await readImage(byId("secret-image"));
    if (!isCurrentView(version)) return;
    const secret = await fitSecretImage(originalSecret, carrier, byId("scale-secret").checked);
    if (!isCurrentView(version)) return;

    const pixels = encode_image_browser(
        secret.pixels, secret.width, secret.height,
        carrier.pixels, carrier.width, carrier.height
    );
    await showImage(
        pixels, carrier.width, carrier.height,
        "encoded-image.png", "Encoded image",
        `Secret image stored at ${secret.width} × ${secret.height} pixels. Download the PNG to preserve the hidden data.`
    );
    if (isCurrentView(version)) setStatus("Image encoded. Download the PNG to preserve the hidden data.", "success");
}));

byId("decode-image").addEventListener("click", () => perform(async (version) => {
    setStatus("Decoding hidden image…");
    const carrier = await readImage(byId("image-decode-carrier"), false);
    if (!isCurrentView(version)) return;
    const dimensions = readHiddenDimensions(carrier.pixels);
    const pixels = decode_image_browser(carrier.pixels, carrier.width, carrier.height);
    await showImage(
        pixels, dimensions.width, dimensions.height,
        "decoded-image.png", "Decoded image",
        `Recovered image · ${dimensions.width} × ${dimensions.height} pixels.`
    );
    if (isCurrentView(version)) setStatus("Hidden image decoded.", "success");
}));

window.addEventListener("pagehide", () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
});

renderMode();
