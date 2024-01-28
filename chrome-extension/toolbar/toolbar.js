document.body.onload = addToolbar();

function addToolbar() {
	"use strict";
	const toolbar = document.createElement("div");
	const buttonLWrapper = document.createElement("div");
	const buttonRWrapper = document.createElement("div");
	
	const buttonsLeft = document.createElement("div");
	const buttonsRight = document.createElement("div");
	
	toolbar.classList.add("T-EXT-toolbar");
	toolbar.id = "T-EXT-toolbar";
	
	buttonLWrapper.classList.add("T-EXT-buttons-left-wrapper");
	buttonRWrapper.classList.add("T-EXT-buttons-right-wrapper");
	
	buttonsLeft.classList.add("T-EXT-buttons-left");
	buttonsRight.classList.add("T-EXT-buttons-right");
	
	toolbar.appendChild(buttonLWrapper);
	toolbar.appendChild(buttonRWrapper);
	
	buttonLWrapper.appendChild(buttonsLeft);
	buttonRWrapper.appendChild(buttonsRight);
	
	generateButtons(buttonsLeft, 6, 0);
	generateButtons(buttonsRight, 3, 6);
	
	document.body.insertBefore(toolbar, document.body.firstChild);
}

function generateButtons(grid, columns, inc){
	"use strict";
	const filePath = "toolbar/assets/buttons/";
	for (let i = 0 + inc; i < columns + inc; i++) {
		const buttonDiv = document.createElement('div');
		const buttonItem = document.createElement('button');
		
		buttonDiv.classList.add("T-EXT-grid-item");
		buttonDiv.style.position = "relative";
		
		buttonItem.classList.add("T-EXT-button");
		
		const imgURL = chrome.runtime.getURL(filePath + i + ".png");
		buttonItem.style.backgroundImage = "url(" + imgURL + ")";
		buttonItem.style.backgroundSize = "cover";
		
		buttonDiv.appendChild(buttonItem);
		grid.appendChild(buttonDiv);
	}
}

document.addEventListener('fullscreenchange', (e) => { 
	"use strict";
	const toolbar = document.getElementById("T-EXT-toolbar");
	if(document.fullscreenElement){ 
		toolbar.style.visibility = "hidden";
	} else { 
		toolbar.style.visibility = "visible";
	} 
});

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