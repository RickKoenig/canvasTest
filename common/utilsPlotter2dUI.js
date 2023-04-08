'use strict';

// html helpers
// put all elements with id from parent to dest object
function populateElementIds(parent, dest) {
	if (!parent || !dest) {
		return;
	}
	const eles = parent.getElementsByTagName("*");
	for (const ele of eles) {
		if (ele.id.length) {
			dest[ele.id] = document.getElementById(ele.id);
		}
	}
}

function makeEle(parent, kind, id, className, text, callback, type) {
	const ele = document.createElement(kind);
	if (kind == "textarea") {
		ele.spellcheck = false;
	}
	if (parent) {
		parent.appendChild(ele);
	}
	if (id) {
		ele.id = id;
	}
	if (className) {
		ele.className = className;
	}
	if (type) {
		ele.type = type;
	}
	if (text) {
		const textNode = document.createTextNode(text);
		ele.appendChild(textNode);
	}
	if (callback) {
		let eventType = null;
		if (kind == 'input') {
			if (type == 'range') {
				eventType = 'input'; // slider
			} else if (type == 'checkbox') {
				eventType = 'change'; // checkbox
			}

		} else if (kind == 'button') {
			eventType = 'click'; // button
		} else if (kind == 'textarea') {
			eventType = 'keyup'; // textarea
		}
		if (eventType =='input') {
			ele.addEventListener(eventType, (event) => {
				callback(event.target.value);
			});
		} else if (eventType =='change') {
			ele.addEventListener(eventType, (event) => {
				callback(event.target.checked);
			});
		} else if (eventType == 'click') {
			ele.addEventListener(eventType, callback);
		}
	}
	return ele;
}

// text, slider and a reset button
class makeEleCombo {
	constructor(parent, labelStr, min, max, start, step, precision, outerCallback, doButton = true) {
		// pre/span
		const pre = makeEle(parent, "pre");
		this.labelStr = labelStr;
		this.label = makeEle(pre, "span", "aSpanId", null, "label");
		// slider
		this.slider = makeEle(parent, "input", "aSliderId", "slider", null, this.#callbackSlider.bind(this), "range");
		this.slider.min = min;
		this.slider.max = max;
		this.start = start;
		this.slider.step = step;
		this.slider.value = start;
		this.precision = precision;
		this.outerCallback = outerCallback;
		this.#callbackSlider(); // fire off one callback at init
		if (doButton) {
			// button
			makeEle(parent, "button", "aButtonId", null, this.labelStr + " Reset", this.#callbackResetButton.bind(this));
		}
	}

	#callbackResetButton() {
		this.slider.value = this.start;
		this.#callbackSlider();
	}

	#callbackSlider() {
		const val = parseFloat(this.slider.value);
		this.label.innerText = this.labelStr + " = " + val.toFixed(this.precision);
		if (this.outerCallback) {
			this.outerCallback(val);
		}
	}

	getValue() {
		return this.slider.value;
	}

	setValue(val) {
		this.slider.value = val;
		this.#callbackSlider();
	}

	resetValue() {
		this.setValue(this.start);
	}
}
