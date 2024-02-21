const menu = document.getElementById("T-EXT-theme-menu");
let originalState = {
    colors: new Map(),
    elements: []
};

var isDark = 0;

function populateOriginalColorsAndElements() {
    const elements = document.querySelectorAll('*');
    originalState.elements = Array.from(elements);
    originalState.elements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const backgroundColor = computedStyle.backgroundColor;
        originalState.colors.set(element, backgroundColor); 
    });
}

export function populateMenu() {
    const themes = [
        { name: "Default", color: "#FFFFFF"},
        { name: "Black", color: "#232323" },
        { name: "Red", color: "#FF0000" },
        { name: "Green", color: "#00FF00" },
        { name: "Blue", color: "#0000FF" },
        { name: "Yellow", color: "#FFFF00" },
        { name: "Pink", color: "#800080" },
        { name: "Orange", color: "#FFA500" },
        { name: "Pink", color: "#FFC0CB" },
    ];
    const gridWrapper = createElement("div", ["T-EXT-theme-menu-wrapper"]);
    menu.appendChild(gridWrapper);
    populateOriginalColorsAndElements();
    for (let i = 0; i < themes.length; i++) {
        const gridItem = createElement("div", ["T-EXT-theme-" + i]);
        gridItem.classList.add("T-EXT-theme-grid-input");
        const currentButton = document.createElement('button');
        currentButton.classList.add("T-EXT-theme-button");
        currentButton.textContent = i < themes.length - 1 ? 'Theme ' + themes[i].name : 'Custom Colour';
        currentButton.addEventListener("click", function () {
            changeTheme(themes[i].color);
        });

        gridItem.appendChild(currentButton);
        gridWrapper.appendChild(gridItem);
    }
}

async function changeTheme(theme) {
    isDark = 0;
    var textModify = chrome.runtime.getURL("toolbar/scripts/text.js");
    textModify = await import(textModify);
    if (theme === 'custom') {
        console.log('Custom color button pressed');
        return;
    }
    const themeHSL = rgbToHsl(theme);
    originalState.elements.forEach(element => {
        // can be removed, just make sure it doesnt affect the toolbar
        let className = String(element.className);
        if (className.startsWith("T-EXT-")) {
            return;
        }
        const originalColor = originalState.colors.get(element);
        if (originalColor && originalColor !== 'transparent' && !originalColor.startsWith('rgba(0, 0, 0, 0)')) {
            let newColor;
            if (theme === '#FFFFFF') {
                newColor = originalColor;
            } else if (theme === '#232323') {
                isDark = 1;
                const originalHSL = rgbToHsl(originalColor);
                let h = (originalHSL.h + 180) % 360;
                let s = 0;
                let l = 100 - originalHSL.l;
                l = l * (100 - 13.5) / 100 + 13.5;
                newColor = `hsl(0, ${s}%, ${l}%)`;
            } else if (originalColor === 'rgb(255, 255, 255)') {
                newColor = `hsl(${themeHSL.h}, ${themeHSL.s}%, 90%)`;
            } else if (originalColor === 'rgb(0, 0, 0)') {
                const originalHSL = rgbToHsl(originalColor);
                newColor = `hsl(${themeHSL.h}, ${originalHSL.s}%, ${originalHSL.l}%)`;
                newColor = `hsl(${themeHSL.h}, ${themeHSL.s}%, 10%)`;
            } else {
                const originalHSL = rgbToHsl(originalColor);
                newColor = `hsl(${themeHSL.h}, ${originalHSL.s}%, ${originalHSL.l}%)`;
            }
            element.style.backgroundColor = newColor;
        }
    });
    if (isDark == 1) {
        textModify.changeText("White", "fc");
    } else {
        textModify.changeText("Default", "fc");
    }
}

function rgbToHsl(color) {
    let r, g, b;
    if (color.startsWith('rgb')) {
        [r, g, b] = color.match(/\d+/g).map(num => parseInt(num) / 255);
    } else if (color.startsWith('#')) {
        const hex = color.substring(1);
        r = parseInt(hex.substring(0, 2), 16) / 255;
        g = parseInt(hex.substring(2, 4), 16) / 255;
        b = parseInt(hex.substring(4, 6), 16) / 255;
    } else {
        return null;
    }
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}