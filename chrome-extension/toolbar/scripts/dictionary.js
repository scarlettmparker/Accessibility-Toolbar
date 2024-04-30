// get menu element
const menu = document.getElementById("T-EXT-dictionary-menu");
let languageCode = "none";

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

export function populateMenu() {
	// create grid wrapper and search bar
	const gridWrapper = createElement("div", ["T-EXT-dictionary-menu-wrapper"]);
	const searchBar = createElement('input', ["T-EXT-dictionary-search-bar"], { type: 'text', placeholder: 'Search a word...' });
	// buttons for searching wiktionary
	const buttons = ['Search Word', 'Search Selected'].map(text => {
		const button = createElement('button', ["T-EXT-dictionary-search-button"], { textContent: text });
		button.addEventListener("click", () => searchWord(text === 'Search Word' ? searchBar.value : getSelectedText()));
		return button;
	});

	// create grid to append buttons
	Array.from({ length: 3 }, (_, i) => createElement("div", ["T-EXT-dictionary-grid-" + (i + 1)]))
		.forEach((div, i) => {
			if (buttons[i]) div.appendChild(buttons[i]);
			div.id = "T-EXT-dictionary-grid-" + (i + 1);
			gridWrapper.appendChild(div);
		});

	menu.append(searchBar, gridWrapper);
}

function getLanguageCodeFromName(name, languages) {
	// get language code from the corresponding language name
    const languageObj = languages.find(language => language.language.toLowerCase() === name.toLowerCase());
    return languageObj ? languageObj.language_code : null;
}

// scrape the words definition
export async function searchWord(word) {
    const languages = await getSupportedLanguages();
    
    const responseJSON = await fetchDefinition(word);
    const displayResponse = document.getElementById("T-EXT-dictionary-grid-3");
    displayResponse.innerHTML = '';
    
    const definitions = responseJSON.definitions;
    let language = responseJSON.language;

	// format the language and get its code for multiple languages
    language = language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();
    languageCode = getLanguageCodeFromName(language, languages);

	// if no such word exists
    if (definitions.length === 0) {
        createAndAppendElement('h3', 'Word not found', displayResponse, 'notFoundTitle');
    } else {
        definitions.forEach(definition => createEntryElements(definition, displayResponse, word));
    }
}

async function fetchDefinition(word) {
    const translationFile = chrome.runtime.getURL("toolbar/scripts/translate.js");
    languageCode = await import(translationFile).then(module => module.selectedLanguageCode);
    const url = 'http://127.0.0.1:8000/definition/';
    const data = {
        word: word.toLowerCase(),
        language: languageCode
    };

	// back-end stuff, fetch the definition
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
		// if back-end isnt active
        const displayResponse = document.getElementById("T-EXT-dictionary-grid-3");
        displayResponse.innerHTML = '';
        createAndAppendElement('h4', 'An error occurred. Is the back-end server active?', displayResponse, 'errorTitle');
        throw error;
    }
}

// create elements for the entry
function createEntryElements(entry, parent, word) {
    if (entry.pronunciations && entry.pronunciations.text) {
        createAndAppendElement('h3', 'Pronunciations', parent, 'pronunciationTitle');
		// if a word has multiple pronunciations they must all be written
		if (Array.isArray(entry.pronunciations.text)) {
			entry.pronunciations.text.forEach((text, index) => {
				let element = document.createElement('p');
				// handle IPA and use it to create clickable text
				if (text.includes('IPA')) {
					let clickableText = document.createElement('a');
					clickableText.textContent = text;
					clickableText.style.color = '#4E9ADF';
					clickableText.style.cursor = 'pointer';
					clickableText.onmouseover = function() { this.style.color = '#FF0000'; };
					clickableText.onmouseout = function() { this.style.color = '#4E9ADF'; };
					clickableText.onclick = function() {
						// TTS for the pronunciation entry (may not match IPA as no audio is provided)
						const synth = window.speechSynthesis;
						const utterThis = new SpeechSynthesisUtterance(word);
						if (languageCode != "none") {
							utterThis.lang = languageCode;
						}
						synth.speak(utterThis);
					};
					element.appendChild(clickableText);
				} else {
					element.textContent = text;
				}
				parent.appendChild(element);
			});
		} else {
			let element = document.createElement('p');
			element.textContent = entry.pronunciations.text;
			parent.appendChild(element);
		}
    }

	// definition elements
	if (entry.definitions) {
        entry.definitions.forEach(definition => {
            if (definition.text) {
	            createDefinitionElements(definition, parent);
            }
	    });
    }
}

function createDefinitionElements(definition, parent) {
    let definitionTitle = 'Definition';
    if (definition.partOfSpeech) {
        definitionTitle += ' (' + definition.partOfSpeech + ')';
    }
    createAndAppendElement('h3', definitionTitle, parent, 'definitionTitle');
    createAndAppendElement('p', definition.text, parent, 'definitionText');

	// related word elements
    if (definition.relatedWords && definition.relatedWords.length > 0) {
        definition.relatedWords.forEach(relatedWord => {
            if (relatedWord.words && relatedWord.words.length > 0) {
                createRelatedWordElements(relatedWord, parent);
            }
        });
    }

	// examples elements
    if (definition.examples && definition.examples.length > 0) {
        createAndAppendElement('h3', 'Examples', parent, 'examplesTitle');
        parent.appendChild(document.createElement('br'));
        createAndAppendElement('ul', definition.examples, parent, 'examples');
        parent.appendChild(document.createElement('br'));
    }
}

// related word elements
function createRelatedWordElements(relatedWord, parent) {
    if (relatedWord.relationshipType === 'synonyms' || relatedWord.relationshipType === 'antonyms') {
        createAndAppendElement('h3', 'Related Words', parent, 'relatedWordsTitle');
        createAndAppendElement('p', relatedWord.words, parent, 'relatedWords');
    }
}

// helper function to create and append elements
function createAndAppendElement(type, content, parent, idSuffix) {
	// handle multiple content items
	if (Array.isArray(content)) {
		content.forEach((item, index) => {
			const element = document.createElement(type);
			element.textContent = (type === 'ul' ? '• ' : '') + item;
			element.id = `T-EXT-definitions-definition-${idSuffix}-${index}`;
			parent.appendChild(element);
		});
	} else {
		const element = document.createElement(type);
		element.textContent = content;
		element.id = `T-EXT-definitions-definition-${idSuffix}`;
		parent.appendChild(element);
	}
}

// get selected text to search
function getSelectedText() {
	const selectedText = window.getSelection().toString();
	return selectedText;
}

// helper function to create elements
function createElement(type, classes = [], attributes = {}) {
	const element = document.createElement(type);
	element.classList.add(...classes);
	Object.assign(element, attributes);
	return element;
}