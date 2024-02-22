const menu = document.getElementById("T-EXT-translate-menu");
let originalTextMap = new Map();
let selectedLanguageCode = "none";


async function getSupportedLanguages() {
    // get language file from chrome extension
    const url = chrome.runtime.getURL(`toolbar/assets/languages/supported_languages.json`);
    
    // fetch the file and parse it as JSON
    const response = await fetch(url);
    let data = await response.json();

    console.log(data);

    if (typeof data === 'object' && !Array.isArray(data)) {
        data = Object.entries(data).map(([language, language_code]) => ({language, language_code}));
    }
    
    return data;
}

export async function populateMenu() {
    const languages = await getSupportedLanguages();

    storeOriginalText();

    const gridWrapper = createElement("div", ["T-EXT-translate-menu-wrapper"]);

    const searchBar = createElement('input', ["T-EXT-translate-search-bar"]);
    searchBar.type = 'text';
    searchBar.placeholder = 'Search languages...';

    for (let i = 0; i < languages.length; i++) {
        const gridItem = createElement("div", ["T-EXT-translate-" + i]);
        gridItem.classList.add("T-EXT-translate-grid-input");
        const currentButton = document.createElement('button');
        currentButton.classList.add("T-EXT-translate-button");
        currentButton.textContent = languages[i].language;

        if (languages[i].language_code === selectedLanguageCode) {
            currentButton.classList.add('T-EXT-translate-selected');
        }

        currentButton.addEventListener("click", function () {
            if (selectedLanguageCode) {
                const previousButton = document.querySelector('.T-EXT-translate-selected');
                if (previousButton) {
                    previousButton.classList.remove('T-EXT-translate-selected');
                }
            }
            currentButton.classList.add('T-EXT-translate-selected');
            selectedLanguageCode = languages[i].language_code;
        
            if (languages[i].language_code === "none") {
                restoreText();
            } else {
                translate(languages[i].language_code);
            }
        });

        gridItem.appendChild(currentButton);
        gridWrapper.appendChild(gridItem);
    }

    searchBar.addEventListener('input', function() {
        const searchValue = this.value.toLowerCase();
        for (let i = 0; i < languages.length; i++) {
            const button = gridWrapper.children[i].firstChild;
            if (languages[i].language.toLowerCase().includes(searchValue)) {
                button.style.display = '';
            } else {
                button.style.display = 'none';
            }
        }
    });
    
    menu.appendChild(searchBar);
    menu.appendChild(gridWrapper);
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