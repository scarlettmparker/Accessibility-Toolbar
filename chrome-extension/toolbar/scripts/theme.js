const menu = document.getElementById("T-EXT-theme-menu");

export function populateMenu() {
	const themes = [
        { name: "Black", color: "#232323" },
        { name: "Red", color: "#FF0000" },
        { name: "Green", color: "#00FF00" },
        { name: "Blue", color: "#0000FF" }
    ];
	const gridWrapper = createElement("div", ["T-EXT-theme-menu-wrapper"]);
	menu.appendChild(gridWrapper);
    for (let i = 0; i < 5; i++) {
        const gridItem = createElement("div", ["T-EXT-theme-" + i]);
        gridItem.classList.add("T-EXT-theme-grid-input");
        const currentButton = document.createElement('button');
		currentButton.classList.add("T-EXT-theme-button");
		if (i < 4) {
			currentButton.textContent = 'Theme ' + themes[i];
			currentButton.addEventListener("click", function() {
				changeTheme(themes[i].color);
			});
		} else {
			currentButton.textContent = 'Custom Colour';
			currentButton.addEventListener("click", function() {
				customTheme();
			});
		}
		gridItem.appendChild(currentButton);
        gridWrapper.appendChild(gridItem);
    }
}

function changeTheme(theme) {
    console.log("change theme " + theme);
    document.body.style.background = theme;

    const elements = document.querySelectorAll('body, div, header, section, article, footer, h1, h2, h3, h4, h5, h6, p, pre, ul, ol, li, blockquote, table, th, td, form, input, button, textarea, select, hr');
    
    elements.forEach(element => {
        // Check if the element has a solid background and is visible
        const computedStyle = window.getComputedStyle(element);
        const backgroundColor = computedStyle.backgroundColor;
        const visibility = computedStyle.visibility;

        if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && visibility !== 'hidden') {
            element.style.backgroundColor = theme;
        }
    });
}

function customTheme() {
    console.log("custom theme");
}