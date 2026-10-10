// ─── i18n Translation System ────────────────────────────────────────────────

const translations = {
    en: {
        title: "Steganography",
        headerSubtitle: "Hide text or images inside other images.",
        themeLight: "Light mode",
        themeDark: "Dark mode",
        tabText: "Text",
        tabImage: "Image",
        encode: "Encode",
        decode: "Decode",
        eyebrowText: "TEXT",
        eyebrowImage: "IMAGE",
        textInImage: "Hide text in an image",
        textEncodeDesc: "Select a carrier image and enter the message to hide.",
        carrierImage: "Carrier image",
        message: "Message",
        uploadImage: "Upload an image to calculate capacity",
        writeMessage: "Type your message here…",
        encodeMessage: "Encode",
        decodeMessage: "Decode a message",
        textDecodeDesc: "Select the encoded image containing the hidden message.",
        encodedImage: "Encoded image",
        decodedMessage: "Decoded message",
        decodedAppears: "The decoded message will appear here…",
        imageInImage: "Hide an image in another image",
        imageEncodeDesc: "The carrier image will store the secret image. The result is saved as PNG.",
        secretImage: "Secret image",
        scaleDown: "Scale down to fit",
        scaleDownDesc: "Scale the secret image down only if it exceeds carrier capacity.",
        warning: "Warning",
        warningDesc: "Encoding overwrites any existing hidden data in the carrier. Use an unencoded image.",
        warningDownscale: "Scaling down a secret image that contains hidden data will destroy that data, as resizing modifies pixel values.",
        encodeImage: "Encode",
        decodeImage: "Decode an image",
        imageDecodeDesc: "Select the encoded image to extract the hidden image.",
        chooseImage: "Select an image to get started.",
        result: "Result",
        download: "Download",
        howItWorks: "How it works",
        infoTitle: "How it works",
        infoGeneral: "General",
        infoText: "Text",
        infoImage: "Image",
        infoWhatIs: "What is steganography?",
        infoWhatIsDesc: "Steganography hides data in an image by modifying the least significant bits of each pixel's colour channels. The changes are imperceptible to the human eye, but the hidden data can be extracted later.",
        infoWhyPng: "Why PNG?",
        infoWhyPngDesc: "The encoded image must be saved as <strong>PNG</strong>. JPEG and similar formats use lossy compression that alters pixel values and destroys hidden data. PNG is lossless and preserves every bit.",
        infoCarrierCapacity: "Carrier capacity",
        infoCarrierCapacityDesc: "Capacity depends on the carrier image size. A 1920 × 1080 image has over 2 million pixels, enough for several hundred kilobytes of hidden text.",
        infoEncodingText: "Text encoding",
        infoEncodingTextDesc: "Each pixel stores <strong>3 bits</strong> of data (one per colour channel). A 32-bit header stores the message length in bytes, followed by the UTF-8 encoded message.",
        infoCapacityFormula: "Capacity formula",
        infoCapacityFormulaDesc: "Max text bytes = (pixels × 3 − 32) ÷ 8. A 100 × 100 image can hold approximately 3 747 bytes.",
        infoDecodingText: "Text decoding",
        infoDecodingTextDesc: "The decoder reads the 32-bit header to determine the message length, then extracts the text from the pixel LSBs.",
        infoEncodingImage: "Image encoding",
        infoEncodingImageDesc: "The secret image's dimensions are stored in the first <strong>22 pixels</strong> of the carrier using 3 bits per pixel (RGB). Each secret pixel then requires <strong>8 carrier pixels</strong> to store its RGB values. One secret red channel is spread across 8 carrier red channels, one secret green across 8 carrier greens, and one secret blue across 8 carrier blues. Only RGB is embedded; the alpha channel is left untouched to avoid compositing artifacts when the image is rendered over different backgrounds.",
        infoCapacityFormulaImageDesc: "Max secret pixels = (carrier pixels − 22) ÷ 8. A 1920 × 1080 carrier can hold a secret image of approximately 259 140 pixels (509 × 509).",
        infoScaling: "Scaling",
        infoScalingDesc: "If the secret image exceeds carrier capacity, <em>Scale down to fit</em> reduces it proportionally. The extracted image will be smaller than the original.",
        infoSecretInSecret: "Overwriting secrets",
        infoSecretInSecretDesc: "Encoding into an image with existing hidden data overwrites it permanently. Scaling down a secret image that itself contains hidden data will also destroy that data. Always use an unencoded image as the carrier.",
        infoLimitations: "Limitations",
        infoLimitationsDesc: "The alpha channel (transparency) of the secret image is not preserved. The extracted image will always be fully opaque. Support for transparency may be added in a future version.",
        // Dynamic status messages
        carrierSelected: "Carrier image selected.",
        encodedSelected: "Encoded image selected.",
        secretSelected: "Secret image selected.",
        wasmError: "Could not load the WASM module. Build with wasm-pack and serve over HTTP.",
        encodeStart: "Select the carrier image.",
        decodeStart: "Select the encoded image.",
        encodingText: "Encoding…",
        textSuccess: "Message encoded. Download the image to preserve the hidden data.",
        decodingText: "Decoding…",
        textDecoded: "Message decoded.",
        textDecodedEmpty: "Message decoded. The hidden message is empty.",
        encodingImage: "Encoding…",
        imageSuccess: "Image encoded. Download the image to preserve the hidden data.",
        decodingImage: "Decoding…",
        imageDecoded: "Hidden image decoded.",
        encodedTextCaption: "Message hidden in this image. Save as PNG to preserve the data.",
        encodedImageCaption: "Secret image: {w} × {h} pixels. Save as PNG to preserve the data.",
        decodedImageCaption: "Extracted image: {w} × {h} pixels."
    },
    de: {
        title: "Steganographie",
        headerSubtitle: "Text oder Bilder in anderen Bildern verstecken.",
        themeLight: "Heller Modus",
        themeDark: "Dunkler Modus",
        tabText: "Text",
        tabImage: "Bild",
        encode: "Kodieren",
        decode: "Dekodieren",
        eyebrowText: "TEXT",
        eyebrowImage: "BILD",
        textInImage: "Text in einem Bild verstecken",
        textEncodeDesc: "Wähle ein Trägerbild und gib die Nachricht ein.",
        carrierImage: "Trägerbild",
        message: "Nachricht",
        uploadImage: "Lade ein Bild hoch, um die Kapazität zu berechnen",
        writeMessage: "Schreibe deine Nachricht hier…",
        encodeMessage: "Kodieren",
        decodeMessage: "Nachricht dekodieren",
        textDecodeDesc: "Wähle das kodierte Bild mit der versteckten Nachricht.",
        encodedImage: "Kodiertes Bild",
        decodedMessage: "Dekodierte Nachricht",
        decodedAppears: "Die dekodierten Nachricht erscheint hier…",
        imageInImage: "Bild in einem Bild verstecken",
        imageEncodeDesc: "Das Trägerbild speichert das Geheimbild. Das Ergebnis wird als PNG gespeichert.",
        secretImage: "Geheimbild",
        scaleDown: "Herunterskalieren",
        scaleDownDesc: "Das Geheimbild nur verkleinern, wenn es die Kapazität überschreitet.",
        warning: "Warnung",
        warningDesc: "Kodieren überschreibt vorhandene versteckte Daten im Träger. Verwende ein unkodiertes Bild.",
        warningDownscale: "Das Herunterskalieren eines Geheimbilds mit versteckten Daten zerstört diese Daten, da die Pixelwerte verändert werden.",
        encodeImage: "Kodieren",
        decodeImage: "Bild dekodieren",
        imageDecodeDesc: "Wähle das kodierte Bild, um das versteckte Bild zu extrahieren.",
        chooseImage: "Wähle ein Bild, um zu beginnen.",
        result: "Ergebnis",
        download: "Herunterladen",
        howItWorks: "So funktioniert es",
        infoTitle: "So funktioniert es",
        infoGeneral: "Allgemein",
        infoText: "Text",
        infoImage: "Bild",
        infoWhatIs: "Was ist Steganographie?",
        infoWhatIsDesc: "Steganographie versteckt Daten in einem Bild, indem die wenig signifikanten Bits der Farbkanäle jedes Pixels verändert werden. Die Änderungen sind für das menschliche Auge nicht sichtbar, die versteckten Daten können später wieder extrahiert werden.",
        infoWhyPng: "Warum PNG?",
        infoWhyPngDesc: "Das kodierte Bild muss als <strong>PNG</strong> gespeichert werden. JPEG und ähnliche Formate verwenden verlustbehaftete Komprimierung, die Pixelwerte verändert und versteckte Daten zerstört. PNG ist verlustfrei und bewahrt jedes Bit.",
        infoCarrierCapacity: "Trägerkapazität",
        infoCarrierCapacityDesc: "Die Kapazität hängt von der Größe des Trägerbilds ab. Ein 1920 × 1080 Bild hat über 2 Millionen Pixel, was für mehrere hundert Kilobyte versteckten Text reicht.",
        infoEncodingText: "Textkodierung",
        infoEncodingTextDesc: "Jedes Pixel speichert <strong>3 Bits</strong> Daten (eines pro Farbkanal). Ein 32-Bit-Header speichert die Nachrichtenlänge in Bytes, gefolgt von der UTF-8-kodierten Nachricht.",
        infoCapacityFormula: "Kapazitätsformel",
        infoCapacityFormulaDesc: "Maximale Textbytes = (Pixel × 3 − 32) ÷ 8. Ein 100 × 100 Bild kann etwa 3 747 Bytes speichern.",
        infoDecodingText: "Textdekodierung",
        infoDecodingTextDesc: "Der Dekoder liest den 32-Bit-Header, um die Nachrichtenlänge zu bestimmen, und extrahiert dann den Text aus den Pixel-LSBs.",
        infoEncodingImage: "Bildkodierung",
        infoEncodingImageDesc: "Die Abmessungen des Geheimbilds werden in den ersten <strong>22 Pixeln</strong> des Trägers gespeichert, 3 Bits pro Pixel (RGB). Jedes Geheim-Pixel benötigt dann <strong>8 Träger-Pixel</strong> für die RGB-Werte. Ein Geheim-Rot-Kanal wird auf 8 Träger-Rot-Kanäle verteilt, ein Geheim-Grün auf 8 Träger-Grün-Kanäle, und ein Geheim-Blau auf 8 Träger-Blau-Kanäle. Nur RGB wird eingebettet; der Alpha-Kanal bleibt unverändert, um Kompositing-Artefakte zu vermeiden, wenn das Bild über verschiedenen Hintergründen gerendert wird.",
        infoCapacityFormulaImageDesc: "Maximale Geheim-Pixel = (Träger-Pixel − 22) ÷ 8. Ein 1920 × 1080 Träger kann ein Geheimbild von etwa 259 140 Pixeln speichern (509 × 509).",
        infoScaling: "Skalierung",
        infoScalingDesc: "Wenn das Geheimbild die Trägerkapazität überschreitet, <em>Herunterskalieren</em> verkleinert es proportional. Das extrahierte Bild ist kleiner als das Original.",
        infoSecretInSecret: "Überschreiben von Geheimnissen",
        infoSecretInSecretDesc: "Kodieren in ein Bild mit vorhandenen versteckten Daten überschreibt diese dauerhaft. Das Herunterskalieren eines Geheimbilds mit versteckten Daten zerstört diese ebenfalls. Verwende immer ein unkodiertes Bild als Träger.",
        infoLimitations: "Einschränkungen",
        infoLimitationsDesc: "Der Alpha-Kanal (Transparenz) des Geheimbilds wird nicht gespeichert. Das extrahierte Bild ist immer vollständig undurchsichtig. Transparenzunterstützung kann in einer zukünftigen Version hinzugefügt werden.",
        // Dynamic status messages
        carrierSelected: "Trägerbild ausgewählt.",
        encodedSelected: "Kodiertes Bild ausgewählt.",
        secretSelected: "Geheimbild ausgewählt.",
        wasmError: "Das WASM-Modul konnte nicht geladen werden. Baue mit wasm-pack und serviere über HTTP.",
        encodeStart: "Wähle das Trägerbild.",
        decodeStart: "Wähle das kodierte Bild.",
        encodingText: "Kodiere…",
        textSuccess: "Nachricht kodiert. Lade das Bild herunter, um die versteckten Daten zu erhalten.",
        decodingText: "Dekodiere…",
        textDecoded: "Nachricht dekodiert.",
        textDecodedEmpty: "Nachricht dekodiert. Die versteckte Nachricht ist leer.",
        encodingImage: "Kodiere…",
        imageSuccess: "Bild kodiert. Lade das Bild herunter, um die versteckten Daten zu erhalten.",
        decodingImage: "Dekodiere…",
        imageDecoded: "Verstecktes Bild dekodiert.",
        encodedTextCaption: "Nachricht in diesem Bild versteckt. Speichere als PNG, um die Daten zu erhalten.",
        encodedImageCaption: "Geheimbild: {w} × {h} Pixel. Speichere als PNG, um die Daten zu erhalten.",
        decodedImageCaption: "Extrahiertes Bild: {w} × {h} Pixel."
    }
};

export function t(key) {
    const lang = (document.documentElement.dataset.lang || "en");
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || "";
}

export function applyTranslations() {
    const lang = document.documentElement.dataset.lang || "en";
    document.documentElement.lang = lang;

    // Translate text content
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        const value = t(key);
        if (value) {
            // Preserve inner HTML for elements that may contain tags like <strong>
            if (el.querySelector("*") || value.includes("<")) {
                el.innerHTML = value;
            } else {
                el.textContent = value;
            }
        }
    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        const value = t(key);
        if (value && !el.dataset.capacitySet) {
            el.placeholder = value;
        }
    });

    // Update theme toggle label
    const themeLabel = document.getElementById("theme-label");
    if (themeLabel) {
        const isDark = document.documentElement.dataset.theme === "dark";
        const themeLabels = {
            en: { light: "Light mode", dark: "Dark mode" },
            de: { light: "Heller Modus", dark: "Dunkler Modus" }
        };
        themeLabel.textContent = themeLabels[lang][isDark ? "light" : "dark"];
    }
}

// Language selector
const langSelect = document.getElementById("lang-select");
if (langSelect) {
    langSelect.addEventListener("change", () => {
        const newLang = langSelect.value;
        document.documentElement.dataset.lang = newLang;
        try {
            localStorage.setItem("steganography-lang", newLang);
        } catch {}
        applyTranslations();
    });
}
