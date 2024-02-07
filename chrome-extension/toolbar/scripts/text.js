const menu = document.getElementById("T-EXT-text-menu");

export function populateMenu() {
    const gridKey = ["Font Face:", "dd-ff", "Font Colour:", "dd-fc", "Font Size:", "b-m-fs",
	"b-p-fs","Line Height:","b-m-lh", "b-p-lh", "Character Spacing:", "b-m-cs", "b-p-cs"];
	
	const fonts = ["Arial", "Comic Sans", "Helvetica"];
	const colors = ["Black", "Red", "Blue", "Green", "Yellow"];
	
    for (let i = 0; i < 13; i++) {
        const gridItem = createElement("div", ["T-EXT-text-" + i]);
        if (gridKey[i].startsWith("dd-")) {
			if (gridKey[i].slice(3, 5) == "ff") {
				gridItem.appendChild(createDropDown(fonts));
			} else if (gridKey[i].slice(3, 5) == "fc") {
				gridItem.appendChild(createDropDown(colors));
			}
        } else if (gridKey[i].startsWith("b-")) {
            gridItem.classList.add("T-EXT-text-grid-input");
            const currentButton = document.createElement('button');
            currentButton.classList.add("T-EXT-text-button");
            const increase = gridKey[i].includes("b-p");
            currentButton.appendChild(document.createTextNode(increase ? '+' : '-'));
            currentButton.addEventListener("click", function() {
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

function createDropDown(optionList) {
	const dropDown = document.createElement("select");
	dropDown.classList.add("T-EXT-text-dropdown");
	
	optionList.forEach(function(optionText, index) {
		const option = document.createElement("option");
		option.setAttribute("value", "option", (index + 1));
		option.appendChild(document.createTextNode(optionText));
		dropDown.appendChild(option);
	});
	return dropDown;
}

function changeText(increase, modify) {
    const scaleFactorTextSize = increase ? 1.04 : 0.925;
	const scaleFactorLineHeight = increase ? 1.08 : 0.925;
    const spacingFactor = increase ? 0.2 : -0.2;
    const elementsWithText = document.querySelectorAll('*:not(script):not(style):not(meta):not(title):not(link):not(br):not(hr):not(img):not(input):not(textarea):not(select):not(option):not(area):not(map):not(canvas):not(svg):not(iframe):not(object):not(embed):not(audio):not(video)');
  
    elementsWithText.forEach(element => {
        let currentValue;
        switch (modify) {
            case "fs":
                currentValue = parseFloat(element.style.fontSize) || parseFloat(window.getComputedStyle(element).fontSize);
                element.style.fontSize = Math.max(1, currentValue * scaleFactorTextSize) + 'px';
                break;
            case "lh":
                currentValue = parseFloat(element.style.lineHeight) || parseFloat(window.getComputedStyle(element).lineHeight);
                element.style.lineHeight = Math.max(1, currentValue * scaleFactorLineHeight) + 'px';
                break;
            case "cs":
                currentValue = parseFloat(element.style.letterSpacing) || 0;
                element.style.letterSpacing = Math.max(0, currentValue + spacingFactor) + 'px';
                break;
        }
    });
}