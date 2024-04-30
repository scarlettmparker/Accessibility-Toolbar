var currentMenu = -1;
var resizeCheck = 0;

// menus and their colours
const menus = ["play", "text", "theme", "dictionary", "translate", "magnify", "manual", "settings", "hide"];
const buttonColors = ["411d81", "265793", "1a8719", "a1175e", "9e1722", "0c767f", "4e4e4e", "4e4e4e", "ffffff"];
const hoverColors = ["37186e", "20497a", "156914", "781146", "7d111a", "0a5a61", "404040", "404040", "f1f1f1"];

var toolbarOpen = 1;

// debounce on window resize prevents resizing issues
window.addEventListener('resize', debounce(handleResize, 75));

(async function() {
    const getStorageData = new Promise((resolve, reject) => {
        chrome.storage.sync.get(['useClassifier', 'displayToolbar'], function(result) {
            resolve(result);
        });
    });

    const { useClassifier, displayToolbar } = await getStorageData;

    if (displayToolbar !== false) {
        addToolbar();
    }

    window.onload = async function () {
        if (useClassifier !== false) {
            initializeAltText();
        }

        // - 1 because the hide button has no menu 
        for (let i = 0; i < menus.length - 1; i++) {
            sessionStorage.removeItem(`menuLoaded_${i}`);
            populateMenu(i);
        }
    }
})();

document.addEventListener('keydown', async (event) => {
    // used to quit out of the magnify feature
    if (event.key == 'Escape') {
        try {
            const magnifyFile = chrome.runtime.getURL("toolbar/scripts/magnify.js");
            const magnify = await import(magnifyFile);
            if (magnify.magnifyingGlass) {
                magnify.hideMagnify();
            } else {
                toggleMenuVisibility(currentMenu);
            }
        } catch (e) {
            console.log("Error with magnify.js. Ignore this error if you are not using the magnify feature.");
        }
    }
});

// limit the rate at which a function can be called
function debounce(func, delay) {
    let timerId;
    return function (...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// handle window resizing events
async function handleResize() {
    const toolbar = document.getElementById("T-EXT-toolbar");
    if (toolbar.style.visibility === "hidden") {
        return;
    }
    try {
        // find temporary menu and button elements
        const tempMenu = document.getElementById(`T-EXT-${menus[currentMenu]}-menu`);
        const button = document.querySelectorAll(".T-EXT-button")[currentMenu];
        if (tempMenu.style.visibility == "visible" && button.offsetWidth !== 0 && button.offsetHeight !== 0) {
            // get bounding rectangles of the button and toolbar
            const buttonRect = button.getBoundingClientRect();
            const toolbarRect = document.querySelector('.T-EXT-toolbar').getBoundingClientRect();

            let leftPosition = buttonRect.left;

            // if the menu would overflow the toolbar, adjust the left position
            if (leftPosition + tempMenu.offsetWidth > toolbarRect.right) {
                leftPosition = toolbarRect.right - tempMenu.offsetWidth;
            }

            // reset margins
            tempMenu.style.marginLeft = "0px";
            tempMenu.style.marginRight = "0px";
            tempMenu.style.top = `${buttonRect.bottom}px`;

            // depending on screen width change positioning
            if (screen.width > 505) {
                tempMenu.style.left = tempMenu.offsetWidth >= toolbarRect.width ? "0" : `${leftPosition}px`;
            } else {
                tempMenu.style.marginLeft = "auto";
                tempMenu.style.marginRight = "auto";
                tempMenu.style.left = "0px";
            }
        }
        tempMenu.style.visibility = screen.width < 365 || screen.height < 420 ? "hidden" : "visible";
    } catch (e) {
        // Do nothing
    }
}

async function populateMenu(index) {
    // check if the page is fully loaded
    try {
        const tempMenu = chrome.runtime.getURL("toolbar/scripts/" + menus[index] + ".js");
        const contentMain = await import(tempMenu);
        contentMain.populateMenu();
        sessionStorage.setItem(`menuLoaded_${index}`, '1');
    } catch(e) {
        // do nothing, js file doesnt exist
    }
}

async function addToolbar() {
    const toolbar = createToolbar();
    document.body.insertBefore(toolbar, document.body.firstChild);
    generateButtonMenus();

    // toolbar disappears on fullscreen
    document.addEventListener('fullscreenchange', () => {
        if (toolbarOpen == 1) {
            toolbar.style.visibility = document.fullscreenElement ? "hidden" : "visible";
        } else {
            document.getElementById("T-EXT-reopen-button").style.visibility = document.fullscreenElement ? "hidden" : "visible";
        }
    });
}

function createToolbar() {
    // divs for css use
    const toolbar = createElement("div", ["T-EXT-global", "T-EXT-toolbar"], "T-EXT-toolbar");
    const buttonLWrapper = createElement("div", ["T-EXT-buttons-left-wrapper"]);
    const buttonRWrapper = createElement("div", ["T-EXT-buttons-right-wrapper"]);
    const buttonsLeft = createElement("div", ["T-EXT-buttons-left"]);
    const buttonsRight = createElement("div", ["T-EXT-buttons-right"]);

    toolbar.appendChild(buttonLWrapper);
    toolbar.appendChild(buttonRWrapper);
    buttonLWrapper.appendChild(buttonsLeft);
    buttonRWrapper.appendChild(buttonsRight);

    // int used to separate from left to right on toolbar
    generateButtons(buttonsLeft, 6, 0);
    generateButtons(buttonsRight, 3, 6);

    return toolbar;
}

// generate buttons for the toolbar
async function generateButtons(grid, columns, inc) {
    const filePath = "toolbar/assets/buttons/";

    for (let i = inc; i < columns + inc; i++) {
        // find menu name for corresponding button
        const menuName = menus[i];
        const altText = menuName.charAt(0).toUpperCase() + menuName.slice(1);

        // create div element for the button with the toolbar prefix
        const buttonDiv = createElement("div", ["T-EXT-grid-item"], null, { position: "relative" });
        const buttonItem = createElement("button", ["T-EXT-button"], null, {
            backgroundImage: `url(${await getButtonImage(i, filePath)})`,
            backgroundSize: "cover",
            backgroundColor: `#${buttonColors[i]}`,
        });

        // set button alt text
        buttonItem.dataset.altText = altText;

        buttonItem.addEventListener('mouseover', () => setBackground(buttonItem, i, 0));
        buttonItem.addEventListener('mouseleave', () => setBackground(buttonItem, i, 1));
        buttonItem.addEventListener('click', () => showButtonMenu(i));

        buttonDiv.appendChild(buttonItem);
        grid.appendChild(buttonDiv);
    }
}

async function getButtonImage(index, filePath) {
    // get correct image from chrome extension
    return chrome.runtime.getURL(`${filePath}/${index}.png`);
}

function setBackground(button, index, type) {
    const color = type === 0 ? hoverColors[index] : buttonColors[index];
    button.style.backgroundColor = `#${color}`;
}

async function showButtonMenu(index) {
    const tempMenu = document.getElementById(`T-EXT-${menus[index]}-menu`);
    const button = document.querySelectorAll(".T-EXT-button")[index];

    if (index <= 5) {
        toggleMenuVisibility(tempMenu);
        if (tempMenu.style.visibility == "visible") { currentMenu = index; }

        if (screen.width > 505) {
            const buttonRect = button.getBoundingClientRect();
            const toolbarRect = document.querySelector('.T-EXT-toolbar').getBoundingClientRect();

            let leftPosition = buttonRect.left;

            // check if the menu is beyond the right edge of the toolbar
            if (leftPosition + tempMenu.offsetWidth > toolbarRect.right) {
                leftPosition = toolbarRect.right - tempMenu.offsetWidth;
            }

            tempMenu.style.marginLeft = "0px";
            tempMenu.style.marginRight = "0px";
            tempMenu.style.top = `${buttonRect.bottom}px`;
            tempMenu.style.left = `${leftPosition}px`;
        } else {
            tempMenu.style.marginLeft = "auto";
            tempMenu.style.marginRight = "auto";
        }
    } else if (index == 6) {
        let popup = chrome.runtime.getURL("pages/manual.html");
        chrome.runtime.sendMessage({action: "openTab", url: popup});
    } else if (index == 7) {
        let popup = chrome.runtime.getURL("pages/popup.html");
        chrome.runtime.sendMessage({action: "openTab", url: popup});
    } else if (index == 8){
        const filePath = "toolbar/assets/buttons/";
        const toolbar = document.getElementById("T-EXT-toolbar");
        toolbar.style.visibility = toolbarOpen ? "hidden" : "visible";
        if (toolbarOpen) {
            // ensure all menus close with toolbar
            for (let i = 0; i < 9; i++) {
                const tempMenu = document.getElementById(`T-EXT-${menus[i]}-menu`);
                tempMenu.style.visibility = "hidden";
            }
            toolbarOpen = 0;
            const reOpenButton = createElement("button", ["T-EXT-button", "T-EXT-reopen-button"], "T-EXT-reopen-button", {
                backgroundImage: `url(${await getButtonImage(9, filePath)})`,
                backgroundSize: "cover",
            });
            reOpenButton.dataset.altText = "Show Toolbar";
            reOpenButton.addEventListener('click', () => showButtonMenu(8));
            document.body.insertBefore(reOpenButton, document.body.firstChild);
        } else {
            toolbarOpen = 1;
            document.getElementById("T-EXT-reopen-button").remove();
        }
    }
}

function toggleMenuVisibility(menu) {
    const allMenus = document.querySelectorAll("div.T-EXT-button-menu");
    allMenus.forEach(m => {
        m.style.visibility = m === menu ? toggleVisibility(m.style.visibility) : "hidden";
    });
    currentMenu = -1
}

function generateButtonMenus() {
    menus.forEach(menu => {
        const buttonMenu = createElement("div", ["T-EXT-global", "T-EXT-button-menu"], `T-EXT-${menu}-menu`, { visibility: "hidden" });
        document.body.insertBefore(buttonMenu, document.body.firstChild);
    });
}

// function to enter params from generateButtonMenus
function createElement(tag, classes = [], id = null, styles = {}) {
    const element = document.createElement(tag);
    element.classList.add(...classes);
    if (id) { element.id = id; }
    Object.assign(element.style, styles);
    return element;
}

function toggleVisibility(visibility) {
    return visibility === "visible" ? "hidden" : "visible";
}

function initializeAltText() {
    let currentElement;
    let button = document.createElement('button');

    button.innerText = 'Generate alt text';
    button.classList.add('T-EXT-alt-text-button');
    button.style.zIndex = 2;
    button.style.position = 'absolute';
    button.style.display = 'none';

    document.body.appendChild(button);

    // detect when the mouse is over an image
    document.addEventListener('mousemove', (e) => {
        let element = document.elementFromPoint(e.clientX, e.clientY);
        try {
            if (element.nodeName == "IMG" & element != currentElement ) {
                currentElement = element;
                let rect = currentElement.getBoundingClientRect();
                if (!currentElement.classList.contains('alt-text-generated')) {
                    button.style.left = `${window.pageXOffset + rect.left}px`;
                    button.style.top = `${window.pageYOffset + rect.bottom}px`;
                    button.style.display = 'block';
                } else {
                    button.style.display = 'none';
                }
            }
        } catch(e) {
            currentElement = null;
            button.style.display = 'none';
        }
    });

    // ensure button follows the image when scrolling
    window.addEventListener('scroll', () => {
        if (currentElement) {
            let rect = currentElement.getBoundingClientRect();
            if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                button.style.left = `${window.pageXOffset + rect.left}px`;
                button.style.top = `${window.pageYOffset + rect.bottom}px`;
                button.style.display = 'block';
            } else {
                button.style.left = `${window.pageXOffset + rect.left}px`;
                button.style.top = `${window.pageYOffset + rect.top > 0 ? rect.top : rect.bottom}px`;
            }
        }
    });

    let divIds = [];
    button.addEventListener('click', async () => {
        let clickedElement = currentElement;
        if (clickedElement) {
            const url = 'http://127.0.0.1:8000/classify/';
            // get image and convert to b64 format
            const response = await fetch(clickedElement.src);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async function() {
                const base64data = reader.result;
                const data = {
                    image: base64data
                };
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const jsonResponse = await response.json();
                    let rect = clickedElement.getBoundingClientRect();
                    const div = document.createElement('div');
                    let divId = 'div_' + clickedElement.id; // create a unique id for the div based on the image id
                    div.id = divId;
                    button.style.display = 'none';
                    
                    // format the text inside the div
                    let formattedText = '';
                    for(let i = 0; i < jsonResponse.top3_classes.length; i++) {
                        let color;
                        let confidence = parseInt(jsonResponse.top3_confidences[i]);
                        // change colour basing on confidence levels
                        if (confidence >= 65) {
                            color = '#baffd2';
                        } else if (confidence >= 35 ) {
                            color = '#faf5b6';
                        } else {
                            color = '#ffbaba';
                        }
                        formattedText += `${jsonResponse.top3_classes[i]}: <span style="color:
                            ${color};">${jsonResponse.top3_confidences[i]}%</span><br>`;
                    }
                    div.innerHTML = formattedText;
                    div.classList.add('tooltip');
                    div.style.position = 'absolute';
                    div.style.left = `${window.pageXOffset + rect.left}px`;
                    div.style.top = `${window.pageYOffset + rect.bottom}px`;
                    div.style.display = 'block';
                    document.body.appendChild(div);
                    clickedElement.classList.add('alt-text-generated');
                    divIds.push(divId);

                    window.addEventListener('scroll', () => {
                        for (let divId of divIds) { // loop through the array of div ids
                            const div = document.getElementById(divId);
                            const img = document.getElementById(divId.substring(4)); // get the image id from the div id
                            if (div && img) {
                                let rect = img.getBoundingClientRect();
                                div.style.left = `${window.pageXOffset + rect.left}px`;
                                div.style.top = `${window.pageYOffset + rect.bottom}px`;
                            }
                        }
                    });
                    
                } catch (error) {
                    button.innerText = "An error occurred";
                    button.style.color = "#ffbaba";
                    setTimeout(() => {
                        button.innerText = "Generate alt-text";
                        button.style.color = "white";
                    }, 3500);
                }
            }
        }
    });
}