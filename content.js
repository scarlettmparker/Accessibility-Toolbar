console.log("Chrome extension go");

var currentElement;
var currentElementID;
document.addEventListener('mousemove', function(e) {
    var element = document.elementFromPoint(e.pageX - window.pageXOffset, e.pageY - window.pageYOffset);
	try {
		if (element.nodeName == "IMG" & element != currentElement ) {
			console.log("Image found!");
			console.log(element.src);
			currentElement = element;
		}
	}catch(e) {
		currentElement = null;
	}
})