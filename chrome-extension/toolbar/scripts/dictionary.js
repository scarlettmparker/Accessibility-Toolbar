const menu = document.getElementById("T-EXT-dictionary-menu");

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
	entries.forEach(entry => createEntryElements(entry, displayResponse));
}

async function fetchDefinition(word) {
	const url = 'http://127.0.0.1:8000/definition/';
	const data = { word: word.toLowerCase() };

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});

	return await response.json();
}

function createEntryElements(entry, parent) {
    if (entry.pronunciations && entry.pronunciations.text) {
        createAndAppendElement('h3', 'Pronunciations', parent, 'pronunciationTitle');
        createAndAppendElement('p', entry.pronunciations.text, parent, 'pronunciation');
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