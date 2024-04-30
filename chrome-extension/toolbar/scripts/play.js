// get menu element from the dom
const menu = document.getElementById("T-EXT-play-menu");

// global variable nonsense
let languageCode = "none";
let isReading = false;
let readTimeout = null;

export function populateMenu() {
    // wrapper for the grid
    const gridWrapper = createElement("div", ["T-EXT-play-menu-wrapper"]);

    // create buttons for reading the selected text and starting automatic dictation
    const buttons = ['Read Selected', 'Start TTS'].map(text => {
        const button = createElement('button', ["T-EXT-play-button"], { textContent: text });
        button.addEventListener("click", () => {
            let buttonText = button.textContent;
            const selectedText = window.getSelection().toString();
            if (buttonText === 'Start TTS') {
                if (selectedText) {
                    readSelected(selectedText);
                }
                startReading();
                // ensure that the stop TTS conditional can be reached
                button.textContent = "Stop TTS";
            } else if (buttonText === 'Stop TTS') {
                stopReading();
                button.textContent = "Start TTS";
            } else if (buttonText === 'Read Selected') {
                if (selectedText) {
                    readSelected(selectedText);
                }
            }
        });
        return button;
    });

    // create ag rid of divs and append the buttons to them
    Array.from({ length: 2 }, (_, i) => createElement("div", ["T-EXT-play-grid-" + (i + 1)]))
        .forEach((div, i) => {
            if (buttons[i]) div.appendChild(buttons[i]);
            div.id = "T-EXT-tts-grid-" + (i + 1);
            gridWrapper.appendChild(div);
        });

    // append the grid wrapper to the menu
    menu.append(gridWrapper);
}

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

function getLanguageCodeFromName(name, languages) {
    const languageObj = languages.find(language => language.language.toLowerCase() === name.toLowerCase());
    return languageObj ? languageObj.language_code : null;
}

// in order to read the selected text
async function readSelected(selectedText) {
    const languages = await getSupportedLanguages();
    const translationFile = chrome.runtime.getURL("toolbar/scripts/translate.js");
    languageCode = await import(translationFile).then(module => module.selectedLanguageCode);

    // if page hasn't been translated
    if (languageCode == "none") {
        try {
            // detect language using the back-end
            let language = await detectLanguage(selectedText);
            language = language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();
            languageCode = getLanguageCodeFromName(language, languages);
        } catch (error) {
            console.error("Error detecting language: ", error);
            languageCode = "en"; // default to English if an error occurs
        }
    }

    // use the web speech api to read the text
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance(selectedText);
    utterThis.lang = languageCode;
    synth.speak(utterThis);
}

function startReading() {
    isReading = true;
    document.addEventListener('selectionchange', handleSelectionChange);
}

function stopReading() {
    isReading = false;
    window.speechSynthesis.cancel(); // stop the TTS process
    document.removeEventListener('selectionchange', handleSelectionChange);
    if (readTimeout) {
        clearTimeout(readTimeout);
        readTimeout = null;
    }
}

function handleSelectionChange() {
    if (isReading) {
        const selection = window.getSelection().toString().trim();
        if (selection) {
            if (readTimeout) {
                clearTimeout(readTimeout);
            }
            readTimeout = setTimeout(() => {
                readSelected(selection);
                readTimeout = null;
            }, 1000); // on a time out to prevent reading the text too often
            // if text is re-selected within 1 second it isn't read out.
        }
    }
}

// detect the language of the selected text through the back-end
async function detectLanguage(selectedText) {
    const url = 'http://127.0.0.1:8000/detectlang/';
    const data = {
        text: selectedText
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    return await response.json();
}

function createElement(type, classes = [], attributes = {}) {
    const element = document.createElement(type);
    element.classList.add(...classes);
    Object.assign(element, attributes);
    return element;
}