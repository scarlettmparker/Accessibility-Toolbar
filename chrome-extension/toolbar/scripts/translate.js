const menu = document.getElementById("T-EXT-translate-menu");

export function populateMenu() {
    const languages = [
        { language: "English", language_code: "en" },
        { language: "Greek", language_code: "el" },
        { language: "Chinese", language_code: "zh-CN" },
        { language: "Spanish", language_code: "es" },
        { language: "Portuguese", language_code: "pt" },
        { language: "French", language_code: "fr" },
        { language: "Italian", language_code: "it" },
        { language: "Russian", language_code: "ru" },
        { language: "Japanese", language_code: "ja" }
    ];
    const gridWrapper = createElement("div", ["T-EXT-translate-menu-wrapper"]);
    menu.appendChild(gridWrapper);
    for (let i = 0; i < languages.length; i++) {
        const gridItem = createElement("div", ["T-EXT-translate-" + i]);
        gridItem.classList.add("T-EXT-translate-grid-input");
        const currentButton = document.createElement('button');
        currentButton.classList.add("T-EXT-translate-button");
        currentButton.textContent = languages[i].language;
        currentButton.addEventListener("click", function () {
            translate(languages[i].language_code);
        });

        gridItem.appendChild(currentButton);
        gridWrapper.appendChild(gridItem);
    }
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
            node.parentNode.nodeName !== 'STYLE') {
            textNodes.push(node);
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                collectTextNodes(node.childNodes[i]);
            }
        }
    }

    collectTextNodes(document.body);

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