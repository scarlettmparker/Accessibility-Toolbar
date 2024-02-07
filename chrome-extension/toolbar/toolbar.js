var menusLoaded = Array(9).fill(0);
var currentMenu = -1;

// constants for menus and button colors
const menus = ["play", "text", "theme", "dictionary", "translate", "magnify", "info", "settings", "hide"];
const buttonColors = ["4b2699", "4079ad", "2ea32c", "b82a7f", "b62a3a", "16959d", "707070", "707070", "ffffff"];
const hoverColors = ["411d81", "265793", "1a8719", "a1175e", "9e1722", "0c767f", "4e4e4e", "4e4e4e", "ffffff"];

// initialize toolbar visibility (to be used later)
var toolbarOpen = 1;
addToolbar();

// debounce function for resize event
const debounce = (func, delay) => {
    let timerId;
    return function (...args) {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => {
            func.apply(this, args);
            timerId = null;
        }, delay);
    };
};

window.addEventListener('resize', debounce(() => {
    try {
        if (menusLoaded[currentMenu] === 1) {
            adjustMenuPosition();
        }
    } catch (e) {
        // do nothing
    }
}, 75));

function adjustMenuPosition() {
    const tempMenu = document.getElementById(`T-EXT-${menus[currentMenu]}-menu`);
    const button = document.querySelectorAll(".T-EXT-button")[currentMenu];
	if (tempMenu.offsetWidth === 0 || tempMenu.offsetHeight === 0) { return; }
    const buttonRect = button.getBoundingClientRect();
    const toolbarRect = document.querySelector('.T-EXT-toolbar').getBoundingClientRect();
    let leftPosition = buttonRect.left;
    if (leftPosition + tempMenu.offsetWidth > toolbarRect.right) {
        leftPosition = toolbarRect.right - tempMenu.offsetWidth;
    }
    tempMenu.style.marginLeft = "0px";
    tempMenu.style.marginRight = "0px";
    tempMenu.style.top = `${buttonRect.bottom}px`;
    tempMenu.style.left = (screen.width > 505 && tempMenu.offsetWidth < toolbarRect.width) ? `${leftPosition}px` : "0";
    tempMenu.style.visibility = (screen.width < 365 || screen.height < 421) ? "hidden" : "visible";
}

async function populateMenu(index) {
    const tempMenu = chrome.runtime.getURL("toolbar/scripts/" + menus[index] + ".js");
    const contentMain = await import(tempMenu);
    contentMain.populateMenu();
    menusLoaded[index] = 1;
}

async function addToolbar() {
    const toolbar = createToolbar();
    document.body.insertBefore(toolbar, document.body.firstChild);
    generateButtonMenus();
    document.addEventListener('fullscreenchange', () => {
        toolbar.style.visibility = document.fullscreenElement ? "hidden" : "visible";
    });
}

function createToolbar() {
    const toolbar = createElement("div", ["T-EXT-global", "T-EXT-toolbar"], "T-EXT-toolbar");
    const buttonLWrapper = createElement("div", ["T-EXT-buttons-left-wrapper"]);
    const buttonRWrapper = createElement("div", ["T-EXT-buttons-right-wrapper"]);
    const buttonsLeft = createElement("div", ["T-EXT-buttons-left"]);
    const buttonsRight = createElement("div", ["T-EXT-buttons-right"]);
    toolbar.appendChild(buttonLWrapper);
    toolbar.appendChild(buttonRWrapper);
    buttonLWrapper.appendChild(buttonsLeft);
    buttonRWrapper.appendChild(buttonsRight);
    generateButtons(buttonsLeft, 6, 0);
    generateButtons(buttonsRight, 3, 6);
    return toolbar;
}

async function generateButtons(grid, columns, inc) {
    const filePath = "toolbar/assets/buttons/";
    for (let i = inc; i < columns + inc; i++) {
        const buttonDiv = createElement("div", ["T-EXT-grid-item"], null, { position: "relative" });
        const buttonItem = createElement("button", ["T-EXT-button"], null, {
            backgroundImage: `url(${await getButtonImage(i, filePath)})`,
            backgroundSize: "cover",
            backgroundColor: `#${buttonColors[i]}`
        });
        const hoverURL = chrome.runtime.getURL(filePath + "hover/" + i + ".png");
        buttonItem.addEventListener('mouseover', () => setBackground(buttonItem, i, 0));
        buttonItem.addEventListener('mouseleave', () => setBackground(buttonItem, i, 1));
        buttonItem.addEventListener('click', () => showButtonMenu(i));
        buttonDiv.appendChild(buttonItem);
        grid.appendChild(buttonDiv);
    }
}

async function getButtonImage(index, filePath) {
    return chrome.runtime.getURL(`${filePath}/${index}.png`);
}

function setBackground(button, index, type) {
    const color = type === 0 ? hoverColors[index] : buttonColors[index];
    button.style.backgroundColor = `#${color}`;
}

function showButtonMenu(index, resize) {
    const tempMenu = document.getElementById(`T-EXT-${menus[index]}-menu`);
    const button = document.querySelectorAll(".T-EXT-button")[index];
    if (index !== 8) {
        toggleMenuVisibility(tempMenu);
        currentMenu = index;
        if (menusLoaded[index] == 0) {
            populateMenu(index);
        }
        adjustMenuPosition();
    } else {
        // TODO: implement hide toolbar
    }
}

function toggleMenuVisibility(menu) {
    const allMenus = document.querySelectorAll("div.T-EXT-button-menu");
    allMenus.forEach(m => {
        m.style.visibility = m === menu ? toggleVisibility(m.style.visibility) : "hidden";
    });
    currentMenu = -1;
}

function generateButtonMenus() {
    menus.forEach(menu => {
        const buttonMenu = createElement("div", ["T-EXT-global", "T-EXT-button-menu"], `T-EXT-${menu}-menu`, { visibility: "hidden" });
        document.body.insertBefore(buttonMenu, document.body.firstChild);
    });
}

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