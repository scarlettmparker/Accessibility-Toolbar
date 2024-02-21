// used to load menus on click but not again
var menusLoaded = [0, 0, 0, 0, 0, 0, 0, 0];
var currentMenu = -1;
var resizeCheck = 0;

const menus = ["play", "text", "theme", "dictionary", "translate", "magnify", "info", "settings", "hide"];
const buttonColors = ["4b2699", "4079ad", "2ea32c", "b82a7f", "b62a3a", "16959d", "707070", "707070", "ffffff"];
const hoverColors = ["411d81", "265793", "1a8719", "a1175e", "9e1722", "0c767f", "4e4e4e", "4e4e4e", "f1f1f1"];

var toolbarOpen = 1;
addToolbar();

window.addEventListener('resize', debounce(handleResize, 75));
window.onload = function() {
    for (let i = 0; i < menus.length; i++) {
        sessionStorage.removeItem(`menuLoaded_${i}`);
    }
}

function debounce(func, delay) {
    let timerId;
    return function (...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

async function handleResize() {
    const toolbar = document.getElementById("T-EXT-toolbar");
    if (toolbar.style.visibility === "hidden") {
        return;
    }
    try {
	    const tempMenu = document.getElementById(`T-EXT-${menus[currentMenu]}-menu`);
	    const button = document.querySelectorAll(".T-EXT-button")[currentMenu];
        if (tempMenu.style.visibility == "visible" && button.offsetWidth !== 0 && button.offsetHeight !== 0) {
            const buttonRect = button.getBoundingClientRect();
            const toolbarRect = document.querySelector('.T-EXT-toolbar').getBoundingClientRect();

            let leftPosition = buttonRect.left;

            if (leftPosition + tempMenu.offsetWidth > toolbarRect.right) {
                leftPosition = toolbarRect.right - tempMenu.offsetWidth;
            }

            tempMenu.style.marginLeft = "0px";
            tempMenu.style.marginRight = "0px";
            tempMenu.style.top = `${buttonRect.bottom}px`;

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
    if (document.readyState !== 'complete') {
        setTimeout(() => populateMenu(index), 100);
        return;
    }

    const tempMenu = chrome.runtime.getURL("toolbar/scripts/" + menus[index] + ".js");
    const contentMain = await import(tempMenu);
    contentMain.populateMenu();
    sessionStorage.setItem(`menuLoaded_${index}`, '1');
}
async function addToolbar() {
    const toolbar = createToolbar();
    document.body.insertBefore(toolbar, document.body.firstChild);
    generateButtonMenus();

	// toolbar disappears on fullscreen
    document.addEventListener('fullscreenchange', () => {
        toolbar.style.visibility = document.fullscreenElement ? "hidden" : "visible";
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

async function generateButtons(grid, columns, inc) {
    const filePath = "toolbar/assets/buttons/";

    for (let i = inc; i < columns + inc; i++) {
        const menuName = menus[i];
        const altText = menuName.charAt(0).toUpperCase() + menuName.slice(1);
        
        const buttonDiv = createElement("div", ["T-EXT-grid-item"], null, { position: "relative" });
        const buttonItem = createElement("button", ["T-EXT-button"], null, { 
            backgroundImage: `url(${await getButtonImage(i, filePath)})`, 
            backgroundSize: "cover",
            backgroundColor: `#${buttonColors[i]}`,
        });

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

async function showButtonMenu(index, resize) {
    const tempMenu = document.getElementById(`T-EXT-${menus[index]}-menu`);
    const button = document.querySelectorAll(".T-EXT-button")[index];

    if (index !== 8) {
        toggleMenuVisibility(tempMenu);
        if (tempMenu.style.visibility == "visible") { currentMenu = index; }

        if (sessionStorage.getItem(`menuLoaded_${index}`) !== '1') {
            populateMenu(index);
        }

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
    } else {
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
            reOpenButton.dataset.altText = "Reopen Toolbar";
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

/*let currentElement;
let currentElementID;

document.addEventListener('mousemove', (e) => {
    let element = document.elementFromPoint(e.pageX - window.pageXOffset, e.pageY - window.pageYOffset);
	try {
		if (element.nodeName == "IMG" & element != currentElement ) {
			currentElement = element;
			console.log(currentElement.src);
		}
	}catch(e) {
		currentElement = null;
	}
});*/