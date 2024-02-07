const menu = document.getElementById("T-EXT-text-menu");

export function populateMenu() {
	/* dd = drop down, b-m = button minus, b-p = button plus, ff = font face
	fc = font colour, fs = font size, lh = line height, cs = character space */
	const gridKey = ["Font Face:", "dd-ff", "Font Colour:", "dd-fc", "Font Size:", "b-m-fs",
	"b-p-fs", "Line Height:", "b-m-lh", "b-p-lh", "Character Spacing:", "b-m-cs", "b-p-cs"];
	
	for (let i = 0; i < 13; i++) {
		const gridItem = createElement("div", ["T-EXT-text-" + i]);
		if (gridKey[i] != gridKey[i].toLowerCase()) {
			// implement text elements
			const currentLabel = document.createElement('span');
			currentLabel.textContent = gridKey[i];
			currentLabel.classList.add("T-EXT-text-node");
			
			gridItem.appendChild(currentLabel);
		} else {
			// in case of a button
			gridItem.classList.add("T-EXT-text-grid-input");
			if (gridKey[i].slice(0, 2) == "b-"){
				const currentButton = document.createElement('button');
				currentButton.classList.add("T-EXT-text-button");
				if (gridKey[i].slice(2, 3) == "p") {
					// increase
					currentButton.appendChild(document.createTextNode('+'));
				} else {
					// decrease
					currentButton.appendChild(document.createTextNode('-'));
				}
				currentButton.id = "T-EXT-" + gridKey[i];
				gridItem.appendChild(currentButton);
			}
		}
		menu.appendChild(gridItem);
	}
}