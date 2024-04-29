const menu = document.getElementById("T-EXT-magnify-menu");
const script = document.createElement('script');

script.src = chrome.runtime.getURL('packages/html2canvas.js');
(document.head || document.documentElement).appendChild(script);

export let magnifyingGlass = null;

export function populateMenu() {
    const gridWrapper = createElement("div", ["T-EXT-magnify-menu-wrapper"]);

    const zoomSlider = createElement('input', ["T-EXT-magnify-zoom-slider"], { type: 'range', min: '1', max: '10', value: '1', step: '0.5'});
    const zoomText = createElement('p', ["T-EXT-magnify-zoom-text"], { textContent: `Zoom: ${Number(zoomSlider.value).toFixed(1)}x` });
    zoomSlider.addEventListener('input', () => {
        zoomText.textContent = `Zoom: ${Number(zoomSlider.value).toFixed(1)}x`;
    });

    const sizeSlider = createElement('input', ["T-EXT-magnify-size-slider"], { type: 'range', min: '100', max: '500', value: '100' });
    const sizeText = createElement('p', ["T-EXT-magnify-size-text"], { textContent: `Size: ${sizeSlider.value}px` });
    sizeSlider.addEventListener('input', () => {
        sizeText.textContent = `Size: ${sizeSlider.value}px`;
    });

    const buttons = ['Show Magnifier', 'Hide Magnifier'].map(text => {
        const button = createElement('button', ["T-EXT-magnify-show-button"], { textContent: text });
        button.addEventListener("click", () => {
            if (text === 'Show Magnifier') {
                magnify(zoomSlider.value, sizeSlider.value);
            } else if (text === 'Hide Magnifier') {
                hideMagnify();
            }
        });
        return button;
    });

    Array.from({ length: 6 }, (_, i) => createElement("div", ["T-EXT-magnify-grid-" + (i + 1)]))
        .forEach((div, i) => {
            if (buttons[i]) div.appendChild(buttons[i]);
            if (i === 2) div.appendChild(zoomText);
            if (i === 3) div.appendChild(zoomSlider);
            if (i === 4) div.appendChild(sizeText);
            if (i === 5) div.appendChild(sizeSlider);
            div.id = "T-EXT-magnify-grid-" + (i + 1);
            gridWrapper.appendChild(div);
        });

    menu.append(gridWrapper);
}

export function hideMagnify () {
    if (magnifyingGlass) {
        magnifyingGlass.remove();
        magnifyingGlass = null;
        document.body.style.overflow = "";
        document.body.style.scrollbarWidth = "";
    }
}

function magnify(zoomSlider, sizeSlider) {
    const elementsToIgnore = [...document.querySelectorAll('[id^="T-EXT"], [class^="T-EXT"]')];

    const originalDisplayValues = elementsToIgnore.map(element => {
        const originalDisplay = element.style.display;
        element.style.display = 'none';
        return originalDisplay;
    });

	const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    html2canvas(document.documentElement, {
		x: window.scrollX, 
        y: window.scrollY , 
        width: viewportWidth, 
        height: viewportHeight
	}).then(canvas => {
		const zoom = zoomSlider;
		const size = sizeSlider;
		magnifyingGlass = document.createElement('div');
		magnifyingGlass.style.zIndex = '2147483645';
		magnifyingGlass.style.backgroundImage = `url(${canvas.toDataURL()})`;
		magnifyingGlass.style.backgroundSize = `${canvas.width * zoom}px ${canvas.height * zoom}px`;
		magnifyingGlass.style.width = `${size}px`;
		magnifyingGlass.style.height = `${size}px`;
		magnifyingGlass.style.borderRadius = '50%';
		magnifyingGlass.style.position = 'absolute';
		magnifyingGlass.style.cursor = 'none';
		magnifyingGlass.style.overflow = 'hidden';
		magnifyingGlass.style.boxShadow = '0 0 0 1000px rgba(255, 255, 255, 0.5), 0 0 35px 5px rgba(0, 0, 0, 0.5)';

		document.addEventListener('mousemove', function(e) {
			magnifyingGlass.style.left = `${e.pageX - size/2}px`;
			magnifyingGlass.style.top = `${e.pageY - size/2}px`;

			const bgPosX = (e.pageX - window.scrollX) * zoom - (size/2);
			const bgPosY = (e.pageY - window.scrollY) * zoom - (size/2);

			const maxBgPosX = canvas.width * zoom - size;
			const maxBgPosY = canvas.height * zoom - size;

			const checkedBgPosX = Math.max(0, Math.min(bgPosX, maxBgPosX));
			const checkedBgPosY = Math.max(0, Math.min(bgPosY, maxBgPosY));

			magnifyingGlass.style.backgroundPosition = `-${checkedBgPosX}px -${checkedBgPosY}px`;
		});
		document.body.appendChild(magnifyingGlass);

		document.body.style.overflow = "hidden";
        document.body.style.scrollbarWidth = "none";

		elementsToIgnore.forEach((element, index) => {
            element.style.display = originalDisplayValues[index];
        });
	});
}

function createElement(type, classes = [], attributes = {}) {
	const element = document.createElement(type);
	element.classList.add(...classes);
	Object.assign(element, attributes);
	return element;
}