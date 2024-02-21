const menu = document.getElementById("T-EXT-translate-menu");
let originalTextMap = new Map();

export function populateMenu() {
    const languages = [
        { language: "Default Language", language_code: "none"},
        { language: "Afrikaans", language_code: "af" },
        { language: "Albanian", language_code: "sq" },
        { language: "Amharic", language_code: "am" },
        { language: "Arabic", language_code: "ar" },
        { language: "Armenian", language_code: "hy" },
        { language: "Assamese", language_code: "as" },
        { language: "Aymara", language_code: "ay" },
        { language: "Azerbaijani", language_code: "az" },
        { language: "Bambara", language_code: "bm" },
        { language: "Basque", language_code: "eu" },
        { language: "Belarusian", language_code: "be" },
        { language: "Bengali", language_code: "bn" },
        { language: "Bhojpuri", language_code: "bho" },
        { language: "Bosnian", language_code: "bs" },
        { language: "Bulgarian", language_code: "bg" },
        { language: "Catalan", language_code: "ca" },
        { language: "Cebuano", language_code: "ceb" },
        { language: "Chinese", language_code: "zh-CN" },
        { language: "Chinese", language_code: "zh-TW" },
        { language: "Corsican", language_code: "co" },
        { language: "Croatian", language_code: "hr" },
        { language: "Czech", language_code: "cs" },
        { language: "Danish", language_code: "da" },
        { language: "Dhivehi", language_code: "dv" },
        { language: "Dogri", language_code: "doi" },
        { language: "Dutch", language_code: "nl" },
        { language: "English", language_code: "en" },
        { language: "Esperanto", language_code: "eo" },
        { language: "Estonian", language_code: "et" },
        { language: "Ewe", language_code: "ee" },
        { language: "Filipino", language_code: "fil" },
        { language: "Finnish", language_code: "fi" },
        { language: "French", language_code: "fr" },
        { language: "Frisian", language_code: "fy" },
        { language: "Galician", language_code: "gl" },
        { language: "Georgian", language_code: "ka" },
        { language: "German", language_code: "de" },
        { language: "Greek", language_code: "el" },
        { language: "Guarani", language_code: "gn" },
        { language: "Gujarati", language_code: "gu" },
        { language: "Haitian Creole", language_code: "ht" },
        { language: "Hausa", language_code: "ha" },
        { language: "Hawaiian", language_code: "haw" },
        { language: "Hebrew", language_code: "he" },
        { language: "Hindi", language_code: "hi" },
        { language: "Hmong", language_code: "hmn" },
        { language: "Hungarian", language_code: "hu" },
        { language: "Icelandic", language_code: "is" },
        { language: "Igbo", language_code: "ig" },
        { language: "Ilocano", language_code: "ilo" },
        { language: "Indonesian", language_code: "id" },
        { language: "Irish", language_code: "ga" },
        { language: "Italian", language_code: "it" },
        { language: "Japanese", language_code: "ja" },
        { language: "Javanese", language_code: "jv" },
        { language: "Kannada", language_code: "kn" },
        { language: "Kazakh", language_code: "kk" },
        { language: "Khmer", language_code: "km" },
        { language: "Kinyarwanda", language_code: "rw" },
        { language: "Konkani", language_code: "gom" },
        { language: "Korean", language_code: "ko" },
        { language: "Krio", language_code: "kri" },
        { language: "Kurdish", language_code: "ku" },
        { language: "Kurdish", language_code: "ckb" },
        { language: "Kyrgyz", language_code: "ky" },
        { language: "Lao", language_code: "lo" },
        { language: "Latin", language_code: "la" },
        { language: "Latvian", language_code: "lv" },
        { language: "Lingala", language_code: "ln" },
        { language: "Lithuanian", language_code: "lt" },
        { language: "Luganda", language_code: "lg" },
        { language: "Luxembourgish", language_code: "lb" },
        { language: "Macedonian", language_code: "mk" },
        { language: "Maithili", language_code: "mai" },
        { language: "Malagasy", language_code: "mg" },
        { language: "Malay", language_code: "ms" },
        { language: "Malayalam", language_code: "ml" },
        { language: "Maltese", language_code: "mt" },
        { language: "Maori", language_code: "mi" },
        { language: "Marathi", language_code: "mr" },
        { language: "Meiteilon", language_code: "mni-Mtei" },
        { language: "Mizo", language_code: "lus" },
        { language: "Mongolian", language_code: "mn" },
        { language: "Myanmar", language_code: "my" },
        { language: "Nepali", language_code: "ne" },
        { language: "Norwegian", language_code: "no" },
        { language: "Nyanja", language_code: "ny" },
        { language: "Odia", language_code: "or" },
        { language: "Oromo", language_code: "om" },
        { language: "Pashto", language_code: "ps" },
        { language: "Persian", language_code: "fa" },
        { language: "Polish", language_code: "pl" },
        { language: "Portuguese", language_code: "pt" },
        { language: "Punjabi", language_code: "pa" },
        { language: "Quechua", language_code: "qu" },
        { language: "Romanian", language_code: "ro" },
        { language: "Russian", language_code: "ru" },
        { language: "Samoan", language_code: "sm" },
        { language: "Sanskrit", language_code: "sa" },
        { language: "Scots Gaelic", language_code: "gd" },
        { language: "Sepedi", language_code: "nso" },
        { language: "Serbian", language_code: "sr" },
        { language: "Sesotho", language_code: "st" },
        { language: "Shona", language_code: "sn" },
        { language: "Sindhi", language_code: "sd" },
        { language: "Sinhala", language_code: "si" },
        { language: "Slovak", language_code: "sk" },
        { language: "Slovenian", language_code: "sl" },
        { language: "Somali", language_code: "so" },
        { language: "Spanish", language_code: "es" },
        { language: "Sundanese", language_code: "su" },
        { language: "Swahili", language_code: "sw" },
        { language: "Swedish", language_code: "sv" },
        { language: "Tagalog", language_code: "tl" },
        { language: "Tajik", language_code: "tg" },
        { language: "Tamil", language_code: "ta" },
        { language: "Tatar", language_code: "tt" },
        { language: "Telugu", language_code: "te" },
        { language: "Thai", language_code: "th" },
        { language: "Tigrinya", language_code: "ti" },
        { language: "Tsonga", language_code: "ts" },
        { language: "Turkish", language_code: "tr" },
        { language: "Turkmen", language_code: "tk" },
        { language: "Twi", language_code: "ak" },
        { language: "Ukrainian", language_code: "uk" },
        { language: "Urdu", language_code: "ur" },
        { language: "Uyghur", language_code: "ug" },
        { language: "Uzbek", language_code: "uz" },
        { language: "Vietnamese", language_code: "vi" },
        { language: "Welsh", language_code: "cy" },
        { language: "Xhosa", language_code: "xh" },
        { language: "Yiddish", language_code: "yi" },
        { language: "Yoruba", language_code: "yo" },
        { language: "Zulu", language_code: "zu" }
    ];

    storeOriginalText();
    
    const gridWrapper = createElement("div", ["T-EXT-translate-menu-wrapper"]);
    menu.appendChild(gridWrapper);
    for (let i = 0; i < languages.length; i++) {
        const gridItem = createElement("div", ["T-EXT-translate-" + i]);
        gridItem.classList.add("T-EXT-translate-grid-input");
        const currentButton = document.createElement('button');
        currentButton.classList.add("T-EXT-translate-button");
        currentButton.textContent = languages[i].language;
        currentButton.addEventListener("click", function () {
            if (languages[i].language_code === "none") {
                restoreText();
            } else {
                translate(languages[i].language_code);
            }
        });

        gridItem.appendChild(currentButton);
        gridWrapper.appendChild(gridItem);
    }
}

function storeOriginalText() {
    function collectTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE &&
            node.textContent.trim() !== '' &&
            node.parentNode.nodeName !== 'SCRIPT' &&
            node.parentNode.nodeName !== 'STYLE') {
            originalTextMap.set(node, node.textContent);
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                collectTextNodes(node.childNodes[i]);
            }
        }
    }

    collectTextNodes(document.body);
}

let controller = new AbortController();

async function translate(language) {
    controller.abort();
    controller = new AbortController();

    const url = 'http://127.0.0.1:8000/translate/';
    const BATCH_SIZE = 25;
    const RETRY_LIMIT = 2;
    const textNodes = [];

    function collectTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE &&
            node.textContent.trim() !== '' &&
            node.parentNode.nodeName !== 'SCRIPT' &&
            node.parentNode.nodeName !== 'STYLE' &&
            !String(node.parentNode.className).startsWith("T-EXT-")) {
            textNodes.push(node);
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                collectTextNodes(node.childNodes[i]);
            }
        }
    }

    collectTextNodes(document.body);

    if (language === "none") {
        restoreText();
    } else {
        async function translateBatch(nodes) {
            const data = {
                original_text: nodes.map(node => node.textContent),
                target_language: language
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`ERROR status: ${response.status}`);
            }

            const jsonResponse = await response.json();

            for (let i = 0; i < nodes.length; i++) {
                nodes[i].textContent = jsonResponse.translated_text[i];
            }
        }

        async function translateWithRetry(nodes, retries = 0) {
            try {
                await translateBatch(nodes);
            } catch (e) {
                if (retries < RETRY_LIMIT) {
                    console.error(`Retrying translation for batch, attempt ${retries + 1}`);
                    await translateWithRetry(nodes, retries + 1);
                } else {
                    console.error(`Failed to translate batch after ${RETRY_LIMIT} attempts`);
                    throw e;
                }
            }
        }

        const promises = [];

        for (let i = 0; i < textNodes.length; i += BATCH_SIZE) {
            const batch = textNodes.slice(i, i + BATCH_SIZE);
            promises.push(translateWithRetry(batch).catch(e => console.error(e)));
        }

        await Promise.all(promises);
    }
}

function restoreText() {
    for (let [node, originalText] of originalTextMap.entries()) {
        node.textContent = originalText;
    }
}