// initial state for font color and family
let initialState = {
    fontColor: "",
    fontFamily: ""
};

// array to store elements with modified text
let elementsWithModifiedText = [[], []];
let relativeTextSizes = [1, 1, 0]
let currentFontFace = null;
let currentFontColor = null;

// check if the document is still loading or not
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
        storeInitialState();
        setupObserver();
    });
} else {
    storeInitialState();
    setupObserver();
}

// get menu element
const menu = document.getElementById("T-EXT-text-menu");

// mutation observer to persist changes
function setupObserver() {
    const observer = new MutationObserver((mutationsList, observer) => {
        const elementsToUpdate = [];
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    collectElementsToUpdate(node, elementsToUpdate);
                });
            }
        }
        applyChangesToElements(elementsToUpdate);
    });

    // start observing the document body for child list mutations
    observer.observe(document.body, { childList: true, subtree: true });
}

// collect the elements to update them
function collectElementsToUpdate(node, elementsToUpdate) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        let className = String(node.className);
        // skip the toolbar and some html code that should not be modified
        if (className.startsWith("T-EXT-") || node.tagName.toLowerCase() === "body"
            || node.tagName.toLowerCase() === "head" || node.tagName.toLowerCase() === "html") {
            return;
        }
        // skip node types that aren't text
        if (!['SCRIPT', 'STYLE', 'META', 'TITLE', 'LINK', 'BR', 'HR', 'IMG', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'AREA', 'MAP', 'CANVAS', 'SVG', 'IFRAME', 'OBJECT', 'EMBED', 'AUDIO', 'VIDEO'].includes(node.nodeName.toUpperCase())) {
            // add elements to temporary array to update
            if (relativeTextSizes[0] !== 1) {
                elementsToUpdate.push({ element: node, property: 'fontSize', value: parseFloat(window.getComputedStyle(node).fontSize) });
            }
            if (relativeTextSizes[1] !== 1) {
                elementsToUpdate.push({ element: node, property: 'lineHeight', value: parseFloat(window.getComputedStyle(node).lineHeight) });
            }
            if (relativeTextSizes[2] !== 0) {
                elementsToUpdate.push({ element: node, property: 'letterSpacing', value: (parseFloat(window.getComputedStyle(node).letterSpacing) || 0) });
            }
            // set font face or colour if they are not null
            if (currentFontFace !== null) {
                node.style.setProperty("font-family", currentFontFace, "important");
                elementsWithModifiedText[0].push(node);
            }
            if (currentFontColor !== null) {
                node.style.setProperty("color", currentFontColor, "important");
                elementsWithModifiedText[1].push(node);
            }
        }
        // collect child nodes to update
        node.childNodes.forEach((childNode) => collectElementsToUpdate(childNode, elementsToUpdate));
    }
}

// apply changes to elements
function applyChangesToElements(elementsToUpdate) {
    elementsToUpdate.forEach(({ element, property, value }) => {
        // changes as can be seen in the menu
        if (property === 'fontSize' || property === 'lineHeight') {
            let newValue = 0;
            if (property === 'fontSize') {
                newValue = value * relativeTextSizes[0];
            } else {
                newValue = value * relativeTextSizes[1];
            }
            element.style[property] = newValue + 'px';
        } else if (property === 'letterSpacing') {
            let newValue = value + relativeTextSizes[2];
            element.style[property] = newValue + 'px';
        }
    });
}

export function populateMenu() {
    // keys for the grid to modify text
    const gridKey = ["Font Face:", "dd-ff", "Font Colour:", "dd-fc", "Font Size:", "b-m-fs",
        "b-p-fs", "Line Height:", "b-m-lh", "b-p-lh", "Character Spacing:", "b-m-cs", "b-p-cs"];

    // available fonts and colours
    const fonts = ["Default", "Arial", "Comic Sans MS", "Courier New", "Georgia", "Helvetica", "Lucida Sans Unicode", "Times New Roman", "Trebuchet MS", "Verdana"];
    const colors = ["Default", "Black", "Blue", "Fuchsia", "Gray", "Green", "Lime", "Maroon", "Navy", "Olive", "Purple", "Red", "Silver", "Teal", "White", "Yellow"];

    for (let i = 0; i < 13; i++) {
        const gridItem = createElement("div", ["T-EXT-text-" + i]);
        // determining if it's a dropdown, button or label
        if (gridKey[i].startsWith("dd-")) {
            const dropDownType = gridKey[i].slice(3, 5)
            if (dropDownType == "ff") {
                gridItem.appendChild(createDropDown(fonts, dropDownType));
            } else if (dropDownType == "fc") {
                gridItem.appendChild(createDropDown(colors, dropDownType));
            }
        } else if (gridKey[i].startsWith("b-")) {
            // add text grid input class to the grid for styling
            gridItem.classList.add("T-EXT-text-grid-input");
            const currentButton = document.createElement('button');
            currentButton.classList.add("T-EXT-text-button");
            // checking if it includes b-p or b-m (button positive button negative)
            const increase = gridKey[i].includes("b-p");
            currentButton.appendChild(document.createTextNode(increase ? '+' : '-'));
            // add event listeners to modify text
            currentButton.addEventListener("click", function () {
                changeText(increase ? 1 : 0, gridKey[i].slice(4, 6));
            });
            currentButton.id = "T-EXT-" + gridKey[i];
            gridItem.appendChild(currentButton);
        } else {
            // create a label for the button
            const currentLabel = document.createElement('span');
            currentLabel.textContent = gridKey[i];
            currentLabel.classList.add("T-EXT-text-node");
            gridItem.appendChild(currentLabel);
        }
        menu.appendChild(gridItem);
    }
}

function createDropDown(optionList, dropDownType) {
    const dropDown = document.createElement("select")
    dropDown.classList.add("T-EXT-text-dropdown");

    // loop through the options and add them to the dropdown
    optionList.forEach(function (optionText, index) {
        const option = document.createElement("option");
        option.setAttribute("value", optionText, (index + 1));
        option.appendChild(document.createTextNode(optionText));

        // Add a class to the option
        option.classList.add('T-EXT-dropdown-item');

        dropDown.appendChild(option);
    });

    // set the width of the dropdown and add an event listener
    dropDown.style.width = "120px";
    dropDown.addEventListener("change", function () {
        changeText(dropDown.value, dropDownType);
    });
    return dropDown;
}

// store the initial page state to undo changes
function storeInitialState() {
    const elementsWithText = document.querySelectorAll('*:not(script):not(style):not(meta):not(title):not(link):not(br):not(hr):not(img):not(input):not(textarea):not(select):not(option):not(area):not(map):not(canvas):not(svg):not(iframe):not(object):not(embed):not(audio):not(video)');
    elementsWithText.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.backgroundImage === 'none' && computedStyle.backgroundColor === 'transparent') {
            initialState.fontColor = element.style.color || computedStyle.color;
            initialState.fontFamily = element.style.fontFamily || computedStyle.fontFamily;
        }
    });
}

// reset the initial state, depending on which option is defaulted
function resetToInitialState(property) {
    if (property === "fontFamily") {
        elementsWithModifiedText[0].forEach(element => {
            element.style.fontFamily = initialState.fontFamily;
            elementsWithModifiedText[0] = [];
        });
    }
    if (property === "color") {
        elementsWithModifiedText[1].forEach(element => {
            element.style.setProperty("color", initialState.fontColor, "");
            elementsWithModifiedText[1] = [];
        });
    }
}

export function changeText(increase, modify) {
    const scaleFactor = increase ? 1.1 : 0.9;
    const spacingFactor = increase ? 0.2 : -0.2;

    const elementsToUpdate = [];

    // loop through elements and update them based on the modify parameter
    document.querySelectorAll('*').forEach(element => {
        let className = String(element.className);
        if (className.startsWith("T-EXT-") || element.tagName.toLowerCase() === "body"
            || element.tagName.toLowerCase() === "head" || element.tagName.toLowerCase() === "html") {
            return;
        }
        switch (modify) {
            case "fs":
                elementsToUpdate.push({ element: element, property: 'fontSize', value: parseFloat(window.getComputedStyle(element).fontSize) });
                break;
            case "lh":
                elementsToUpdate.push({ element: element, property: 'lineHeight', value: parseFloat(window.getComputedStyle(element).lineHeight) });
                break;
            case "cs":
                elementsToUpdate.push({ element: element, property: 'letterSpacing', value: (parseFloat(window.getComputedStyle(element).letterSpacing) || 0) });
                break;
            case "ff":
                if (increase === "Default") {
                    resetToInitialState("fontFamily");
                    currentFontFace = null;
                } else {
                    currentFontFace = increase;
                    element.style.fontFamily = increase;
                    elementsWithModifiedText[0].push(element);
                }
                break;
            case "fc":
                if (increase === "Default") {
                    resetToInitialState("color");
                    currentFontColor = null;
                } else {
                    currentFontColor = increase;
                    element.style.setProperty("color", increase, "important");
                    elementsWithModifiedText[1].push(element);
                }
                break;
        }
    });

    // mutation observer nonsense spaghetti code fix
    let passOne = [0, 0, 0];
    // used to track the overall changes to the text to be applied to new elements
    elementsToUpdate.forEach(({ element, property, value }) => {
        if (modify === 'fs' || modify === 'lh') {
            const newValue = value * scaleFactor;
            element.style[property] = newValue + 'px';
            if (modify === 'fs' & passOne[0] == 0) {
                passOne[0] = 1;
                relativeTextSizes[0] *= scaleFactor;
            } else if (modify === 'lh' & passOne[1] == 0){
                passOne[1] = 1;
                relativeTextSizes[1] *= scaleFactor;
            }
        } else if (modify === 'cs') {
            const newValue = value + spacingFactor;
            element.style[property] = newValue + 'px';
            if (passOne[2] == 0) {
                passOne[2] = 1;
                relativeTextSizes[2] += spacingFactor;
            }
        }
    });
    passOne = [0, 0, 0];
}