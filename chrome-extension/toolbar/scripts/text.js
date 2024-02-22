let initialState = {
    fontColor: "",
    fontFamily: ""
};

let elementsWithModifiedText = [];

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", storeInitialState);
} else {
    storeInitialState();
}

const menu = document.getElementById("T-EXT-text-menu");

export function populateMenu() {
    const gridKey = ["Font Face:", "dd-ff", "Font Colour:", "dd-fc", "Font Size:", "b-m-fs",
        "b-p-fs", "Line Height:", "b-m-lh", "b-p-lh", "Character Spacing:", "b-m-cs", "b-p-cs"];

    const fonts = ["Default", "Arial", "Comic Sans MS", "Courier New", "Georgia", "Helvetica", "Lucida Sans Unicode", "Times New Roman", "Trebuchet MS", "Verdana"];
    const colors = ["Default", "Black", "Blue", "Fuchsia", "Gray", "Green", "Lime", "Maroon", "Navy", "Olive", "Purple", "Red", "Silver", "Teal", "White", "Yellow"];

    for (let i = 0; i < 13; i++) {
        const gridItem = createElement("div", ["T-EXT-text-" + i]);
        if (gridKey[i].startsWith("dd-")) {
            const dropDownType = gridKey[i].slice(3, 5)
            if (dropDownType == "ff") {
                gridItem.appendChild(createDropDown(fonts, dropDownType));
            } else if (dropDownType == "fc") {
                gridItem.appendChild(createDropDown(colors, dropDownType));
            }
        } else if (gridKey[i].startsWith("b-")) {
            gridItem.classList.add("T-EXT-text-grid-input");
            const currentButton = document.createElement('button');
            currentButton.classList.add("T-EXT-text-button");
            const increase = gridKey[i].includes("b-p");
            currentButton.appendChild(document.createTextNode(increase ? '+' : '-'));
            currentButton.addEventListener("click", function () {
                changeText(increase ? 1 : 0, gridKey[i].slice(4, 6));
            });
            currentButton.id = "T-EXT-" + gridKey[i];
            gridItem.appendChild(currentButton);
        } else {
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

    optionList.forEach(function (optionText, index) {
        const option = document.createElement("option");
        option.setAttribute("value", optionText, (index + 1));
        option.appendChild(document.createTextNode(optionText));
        dropDown.appendChild(option);
    });

    dropDown.style.width = "120px";
    dropDown.addEventListener("change", function () {
        changeText(dropDown.value, dropDownType);
    });
    return dropDown;
}

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

function resetToInitialState() {
    elementsWithModifiedText.forEach(element => {
        element.style.setProperty("color", initialState.fontColor, "");
        element.style.fontFamily = initialState.fontFamily;
    });
    elementsWithModifiedText = [];
}

export function changeText(increase, modify) {
    const scaleFactor = increase ? 1.1 : 0.9;
    const spacingFactor = increase ? 0.2 : -0.2;

    const elementsToUpdate = [];

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
                    resetToInitialState();
                } else {
                    element.style.fontFamily = increase;
                    elementsWithModifiedText.push(element);
                }
                break;
            case "fc":
                if (increase === "Default") {
                    resetToInitialState();
                } else {
                    element.style.setProperty("color", increase, "important");
                    elementsWithModifiedText.push(element);
                }
                break;
        }
    });

    elementsToUpdate.forEach(({ element, property, value }) => {
        if (modify === 'fs' || modify === 'lh') {
            const newValue = value * scaleFactor;
            element.style[property] = newValue + 'px';
        } else if (modify === 'cs') {
            const newValue = value + spacingFactor;
            element.style[property] = newValue + 'px';
        }
    });
}