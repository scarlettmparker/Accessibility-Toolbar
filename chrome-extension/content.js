console.log("Chrome extension go");

let currentElement;
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
});