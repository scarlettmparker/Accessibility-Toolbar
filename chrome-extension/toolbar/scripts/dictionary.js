const menu = document.getElementById("T-EXT-dictionary-menu");
let languageCode = "none";

export function populateMenu() {
	const gridWrapper = createElement("div", ["T-EXT-dictionary-menu-wrapper"]);
	const searchBar = createElement('input', ["T-EXT-dictionary-search-bar"], { type: 'text', placeholder: 'Search a word...' });
	const buttons = ['Search Word', 'Search Selected'].map(text => {
		const button = createElement('button', ["T-EXT-dictionary-search-button"], { textContent: text });
		button.addEventListener("click", () => searchWord(text === 'Search Word' ? searchBar.value : getSelectedText()));
		return button;
	});

	Array.from({ length: 3 }, (_, i) => createElement("div", ["T-EXT-dictionary-grid-" + (i + 1)]))
		.forEach((div, i) => {
			if (buttons[i]) div.appendChild(buttons[i]);
			div.id = "T-EXT-dictionary-grid-" + (i + 1);
			gridWrapper.appendChild(div);
		});

	menu.append(searchBar, gridWrapper);
}

async function searchWord(word) {
	const responseJSON = await fetchDefinition(word);
	const displayResponse = document.getElementById("T-EXT-dictionary-grid-3");
	displayResponse.innerHTML = '';
	const entries = Object.values(responseJSON);
	if (entries[0].definitions.length === 0) {
		createAndAppendElement('h3', 'Word not found', displayResponse, 'notFoundTitle');
	} else {
		entries.forEach(entry => createEntryElements(entry, displayResponse, word));
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

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});

	return await response.json();
}

function createEntryElements(entry, parent, word) {
	console.log(entry.pronunciations);
    if (entry.pronunciations && entry.pronunciations.text) {
        createAndAppendElement('h3', 'Pronunciations', parent, 'pronunciationTitle');
		if (Array.isArray(entry.pronunciations.text)) {
			entry.pronunciations.text.forEach((text, index) => {
				let element = document.createElement('p');
				if (text.includes('IPA')) {
					let clickableText = document.createElement('a');
					clickableText.textContent = text;
					clickableText.style.color = '#4E9ADF';
					clickableText.style.cursor = 'pointer';
					clickableText.onmouseover = function() { this.style.color = '#FF0000'; };
					clickableText.onmouseout = function() { this.style.color = '#4E9ADF'; };
					clickableText.onclick = function() {
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

    if (definition.relatedWords && definition.relatedWords.length > 0) {
        definition.relatedWords.forEach(relatedWord => {
            if (relatedWord.words && relatedWord.words.length > 0) {
                createRelatedWordElements(relatedWord, parent);
            }
        });
    }

    if (definition.examples && definition.examples.length > 0) {
        createAndAppendElement('h3', 'Examples', parent, 'examplesTitle');
        parent.appendChild(document.createElement('br'));
        createAndAppendElement('ul', definition.examples, parent, 'examples');
        parent.appendChild(document.createElement('br'));
    }
}

function createRelatedWordElements(relatedWord, parent) {
    if (relatedWord.relationshipType === 'synonyms' || relatedWord.relationshipType === 'antonyms') {
        createAndAppendElement('h3', 'Related Words', parent, 'relatedWordsTitle');
        createAndAppendElement('p', relatedWord.words, parent, 'relatedWords');
    }
}

function createAndAppendElement(type, content, parent, idSuffix) {
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

function getSelectedText() {
	const selectedText = window.getSelection().toString();
	return selectedText;
}

function createElement(type, classes = [], attributes = {}) {
	const element = document.createElement(type);
	element.classList.add(...classes);
	Object.assign(element, attributes);
	return element;
}