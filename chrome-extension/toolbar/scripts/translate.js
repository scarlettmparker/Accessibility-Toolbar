export let selectedLanguageCode = "none";

const menu = document.getElementById("T-EXT-translate-menu");

// global variable nonsense as always
let originalTextMap = new Map();
let controller = new AbortController();

async function getSupportedLanguages() {
    // get language file from chrome extension
    const url = chrome.runtime.getURL(`toolbar/assets/languages/supported_languages.json`);

    // fetch the file and parse it as JSON
    const response = await fetch(url);
    let data = await response.json();

    if (typeof data === 'object' && !Array.isArray(data)) {
        data = Object.entries(data).map(([language, language_code]) => ({ language, language_code }));
    }

    return data;
}

export async function populateMenu() {
    // get suported languages
    const languages = await getSupportedLanguages();

    // store original page text to return to
    storeOriginalText();

    const gridWrapper = createElement("div", ["T-EXT-translate-menu-wrapper"]);

    // search bar to filter languages
    const searchBar = createElement('input', ["T-EXT-translate-search-bar"]);
    searchBar.type = 'text';
    searchBar.placeholder = 'Search languages...';

    // loop through available languages to create grid items
    for (let i = 0; i < languages.length; i++) {
        // div for each grid item
        const gridItem = createElement("div", ["T-EXT-translate-" + i]);
        gridItem.classList.add("T-EXT-translate-grid-input");

        // button for each language
        const currentButton = document.createElement('button');
        currentButton.classList.add("T-EXT-translate-button");
        currentButton.textContent = languages[i].language;

        // button become blue when selected :O
        if (languages[i].language_code === selectedLanguageCode) {
            currentButton.classList.add('T-EXT-translate-selected');
        }

        // handle language selection
        currentButton.addEventListener("click", function () {
            // if a language is already selected, remove the selection
            if (selectedLanguageCode) {
                const previousButton = document.querySelector('.T-EXT-translate-selected');
                if (previousButton) {
                    previousButton.classList.remove('T-EXT-translate-selected');
                }
            }

            // mark button as selected
            currentButton.classList.add('T-EXT-translate-selected');
            selectedLanguageCode = languages[i].language_code;

            // restore text if default language is chosen
            if (languages[i].language_code === "none") {
                restoreText();
            } else {
                // otherwise translate page
                translate(languages[i].language_code);
            }
        });

        gridItem.appendChild(currentButton);
        gridWrapper.appendChild(gridItem);
    }

    // event listener on search to filter languages out
    searchBar.addEventListener('input', function () {
        const searchValue = this.value.toLowerCase();
        for (let i = 0; i < languages.length; i++) {
            const button = gridWrapper.children[i].firstChild;
            // if the language contains the search value, display it
            if (languages[i].language.toLowerCase().includes(searchValue)) {
                button.style.display = '';
            } else {
                // hide any languages that don't match the search value
                button.style.display = 'none';
            }
        }
    });

    try {
        // literally have no idea why this sometimes throws errors.
        menu.appendChild(searchBar);
        menu.appendChild(gridWrapper);
    } catch (e) {
        // do nothing
    }
}

// store original text to return to
function storeOriginalText() {
    function collectTextNodes(node) {
        // if the node is a text node and not empty store it in the original map
        if (node.nodeType === Node.TEXT_NODE &&
            node.textContent.trim() !== '') {
            originalTextMap.set(node, node.textContent);
        } else {
            // otherwise recursively collect text nodes from child nodes
            for (let i = 0; i < node.childNodes.length; i++) {
                collectTextNodes(node.childNodes[i]);
            }
        }
    }

    collectTextNodes(document.body);
}

// translate function (in other words the worst thing ever created by mankind)
async function translate(language) {
    controller.abort();
    controller = new AbortController();

    // url of the translation back-end url view thing
    const url = 'http://127.0.0.1:8000/translate/';
    const BATCH_SIZE = 5;
    const RETRY_LIMIT = 2;
    // store text nodes, batch sizes exist because google translate has translate limits
    const textNodes = [];

    function collectTextNodes(node) {
        // get non empty text nodes that aren't in the toolbar and add to the original text map
        if (node.nodeType === Node.TEXT_NODE &&
            node.textContent.trim() !== '' &&
            !String(node.parentNode.className).startsWith("T-EXT-") &&
            !String(node.parentNode.id).startsWith("T-EXT-") &&
            node.parentNode.nodeName !== 'STYLE') {
            textNodes.push(node);
            // if not already stored, store it
            if (!originalTextMap.has(node)) {
                originalTextMap.set(node, node.textContent);
            }
        } else {
            // otherwise recursively collect text nodes from child nodes
            for (let i = 0; i < node.childNodes.length; i++) {
                collectTextNodes(node.childNodes[i]);
            }
        }
    }

    collectTextNodes(document.body);

    // restore text if default language is chosen
    if (language === "none") {
        restoreText();
    } else {
        // translate batches of text nodes (why)
        async function translateBatch(nodes) {
            const data = {
                original_text: nodes.map(node => node.textContent),
                target_language: language
            };

            // make a post request to the back-end to translate
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            // if something messed up throw an error. no UI room to display this so page just wont translate.
            if (!response.ok) {
                throw new Error(`ERROR status: ${response.status}`);
            }

            const jsonResponse = await response.json();

            // replace the text content of the nodes with the translated text
            for (let i = 0; i < nodes.length; i++) {
                nodes[i].textContent = jsonResponse.translated_text[i];
            }
        }

        // function to translate a batch of text nodes with retries
        async function translateWithRetry(nodes, retries = 0) {
            try {
                // try to translate the batch
                await translateBatch(nodes);
            } catch (e) {
                // try again until retry limit is reached
                if (retries < RETRY_LIMIT) {
                    console.error(`Retrying translation for batch, attempt ${retries + 1}`);
                    await translateWithRetry(nodes, retries + 1);
                } else {
                    // if retry limit is reached, throw an error. no room in UI to display this sadly
                    console.error(`Failed to translate batch after ${RETRY_LIMIT} attempts`);
                    throw e;
                }
            }
        }

        // store promises (stuff to be sent to back-end)
        const promises = [];

        // loop through text nodes in batches
        for (let i = 0; i < textNodes.length; i += BATCH_SIZE) {
            // create a batch of text nodes and push to promises
            const batch = textNodes.slice(i, i + BATCH_SIZE);
            promises.push(translateWithRetry(batch).catch(e => console.error(e)));
        }

        await Promise.all(promises);
    }
}

function restoreText() {
    // restore page to original text by looping through the map
    for (let [node, originalText] of originalTextMap.entries()) {
        node.textContent = originalText;
    }
}