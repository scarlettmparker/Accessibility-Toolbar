// get the theme menu element
const menu = document.getElementById("T-EXT-theme-menu");

// initialize the original state
let originalState = {
    colors: new Map(),
    elements: []
};

// check if the document is still loading
if (document.readyState === "loading") {
    window.addEventListener("load", () => document.querySelectorAll('*').forEach(processElement));
} else {
    // if not, process elements immediately
    document.querySelectorAll('*').forEach(processElement);
}

let currentTheme = null;

function observeDOMChanges() {
    // create a mutation observer
    const observer = new MutationObserver((mutationsList, observer) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                // process each added node
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        processElement(node);
                        node.querySelectorAll('*').forEach(processElement);
                        if (currentTheme) {
                            changeTheme(currentTheme, node);
                        }
                    }
                });
            }
        }
    });

    // start observing the body for changes in the child list and subtree
    observer.observe(document.body, { childList: true, subtree: true });
}

function processElement(element) {
    // check if the element is already in the original state
    if (originalState.elements.includes(element)) {
        return;
    }

    originalState.elements.push(element);
    const computedStyle = getComputedStyle(element);
    // get the background color
    const backgroundColor = computedStyle.backgroundColor;
    // add the background color to the original state
    originalState.colors.set(element, backgroundColor);
}

// populate the theme menu
export function populateMenu() {
    observeDOMChanges();

    // available themes
    const themes = [
        { name: "Default", color: "#FFFFFF" },
        { name: "Black", color: "#232323" },
        { name: "Red", color: "#FF0000" },
        { name: "Green", color: "#00FF00" },
        { name: "Blue", color: "#0000FF" },
        { name: "Yellow", color: "#FFFF00" },
        { name: "Pink", color: "#800080" },
        { name: "Orange", color: "#FFA500" },
    ];
    const gridWrapper = createElement("div", ["T-EXT-theme-menu-wrapper"]);
    menu.appendChild(gridWrapper);
    for (let i = 0; i < themes.length; i++) {
        // create a grid item for each theme
        const gridItem = createElement("div", ["T-EXT-theme-" + i]);
        gridItem.classList.add("T-EXT-theme-grid-input");
        
        // create a button for each theme
        const currentButton = document.createElement('button');
        currentButton.classList.add("T-EXT-theme-button");
        currentButton.textContent = 'Theme ' + themes[i].name;
        
        currentButton.addEventListener("click", function () {
            changeTheme(themes[i].color);
        });

        // add the button to the grid item and the grid item to the wrapper
        gridItem.appendChild(currentButton);
        gridWrapper.appendChild(gridItem);
    }
}

async function changeTheme(theme) {
    currentTheme = theme;
    // flag to track if any changes were made
    let changed = 0;
    // get the URL of the text modification script
    var textModify = chrome.runtime.getURL("toolbar/scripts/text.js");
    textModify = await import(textModify);
    const themeHSL = rgbToHsl(theme);

    if (theme === '#232323') {
        // if the theme is dark, change the text color to white
        textModify.changeText("White", "fc");
    } else if (theme === '#FFFFFF'){
        textModify.changeText("Default", "fc");
        // reset the current theme
        currentTheme = null;
    } else {
        textModify.changeText(theme, "fc");
    }

    originalState.elements.forEach(element => {
        let className = String(element.className);
        if (className.startsWith("T-EXT-")) {
            return;
        }
        const originalColor = originalState.colors.get(element);
        // convert the original color to HSL
        const originalHSL = rgbToHsl(originalColor);
        let newColor;
        // if the original color is not transparent
        if (!originalColor.startsWith('rgba(0, 0, 0, 0)')) {
            changed = 1;
            if (theme === '#FFFFFF') {
                newColor = originalColor;
                currentTheme = null;
            } else {
                // if the theme is dark, keep the original color
                if (theme === '#232323') {
                    newColor = originalColor;
                    // if the original color is transparent
                    if (originalColor.startsWith('rgba(0, 0, 0, 0')) {
                        newColor = `hsl(${themeHSL.h}, ${originalHSL.s}%, 35%)`;
                    } else if (originalHSL.l > 50){
                        // if the original color is above a certain lightness level
                        let s = 0;
                        let l = 100 - originalHSL.l;
                        l = l * (100 - 13.5) / 100 + 20.5;
                        newColor = `hsl(0, ${s}%, ${l}%)`;
                    }
                } else if (originalColor === 'rgb(255, 255, 255)' || originalColor === 'rgba(255, 255, 255, 1)' || originalColor === '#FFFFFF') {
                    // if the original color is white
                    newColor = `hsl(${themeHSL.h}, ${themeHSL.s}%, 90%)`;
                } else if (originalColor === 'rgb(0, 0, 0)') {
                    newColor = `hsl(${themeHSL.h}, ${themeHSL.s}%, 10%)`;
                } else if (originalColor.startsWith('rgba(0, 0, 0, 0')) {
                    newColor = `hsl(${themeHSL.h}, ${originalHSL.s + 20}%, 75%)`;
                } else {
                    newColor = `hsl(${themeHSL.h}, ${originalHSL.s + 20}%, 85%)`;
                }
            }
        } else if (changed === 0){
            // if no changes were made and the theme is default, keep the original color
            if (theme === '#FFFFFF') {
                newColor = originalColor;
            } else if (theme === '#232323') {
                if (originalColor.startsWith('rgba(0, 0, 0, 0')) {
                    newColor = `hsl(${themeHSL.h}, ${originalHSL.s}%, 35%)`;
                } else {
                    let s = 0;
                    let l = 100 - originalHSL.l;
                    l = l * (100 - 13.5) / 100 + 20.5;
                    newColor = `hsl(0, ${s}%, ${l}%)`;
                }
            } else {
                // if no changes were made and the theme is not default or dark
                newColor = `hsl(${themeHSL.h}, ${themeHSL.s}%, 90%)`;
            }
        }
        // apply the new color to the element
        element.style.cssText += `background-color: ${newColor} !important;`;
    });
}

function rgbToHsl(color) {
    let r, g, b;
    // if the color is in RGB format
    if (color.startsWith('rgb')) {
        // extract the RGB values and convert them to the range 0-1
        [r, g, b] = color.match(/\d+/g).map(num => parseInt(num) / 255);
    } else if (color.startsWith('#')) {
        // if the color is in hexadecimal format
        // extract the RGB values from the hexadecimal color and convert them to the range 0-1
        const hex = color.substring(1);
        r = parseInt(hex.substring(0, 2), 16) / 255;
        g = parseInt(hex.substring(2, 4), 16) / 255;
        b = parseInt(hex.substring(4, 6), 16) / 255;
    } else {
        return null;
    }
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    // calculate the lightness
    let h, s, l = (max + min) / 2;
    // if the maximum and minimum are equal, the color is gray
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        // calculate the hue based on which color channel is the maximum
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        // normalize the hue to the range 0-1
        h /= 6;
    }
    // return the HSL values in the range 0-360 for hue and 0-100 for saturation and lightness
    return { h: h * 360, s: s * 100, l: l * 100 };
}