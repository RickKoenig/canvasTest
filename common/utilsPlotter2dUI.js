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

function makeSelect(parent, options, clickfunc, idx) {
	var ele = document.createElement('select');
	ele.onchange = (ele) => {
		clickfunc(ele.target.value);
	}
	if (options) {
		for (let i=0; i < options.length; ++i) {
			var op = document.createElement('option');
			op.text = options[i];
			op.value = i;
			ele.add(op, null);
		}
	}
	if (!idx) {
		idx = 0;
	}
	clickfunc(idx);
	ele.selectedIndex = idx;
	if (parent) {
		parent.appendChild(ele);
	}
	return ele;
}

// text, slider and a reset button
class makeEleSliderCombo {
	constructor(parent, labelStr, min, max, start, step, precision
		, outerCallback, conversionCallback, resetButton = true) {
		// pre/span
		const pre = makeEle(parent, "pre");
		this.labelStr = labelStr;
		this.label = makeEle(pre, "span", null, null, "label");
		// slider
		this.slider = makeEle(parent, "input", null, "slider", null, this.#callbackSlider.bind(this), "range");
		this.slider.min = min;
		this.slider.max = max;
		this.start = start;
		this.slider.step = step;
		this.slider.value = start;
		this.precision = precision;
		this.outerCallback = outerCallback;
		this.conversionCallback = conversionCallback;
		this.#callbackSlider(); // fire off one callback at init
		if (resetButton) {
			// reset button
			makeEle(parent, "button", null, null, this.labelStr + " Reset", this.callbackResetButton.bind(this));
		}
	}

	callbackResetButton() {
		this.slider.value = this.start;
		this.#callbackSlider();
	}

	#callbackSlider(val, doSliderCallback = true) {
		// use true value if not doing callback
		const inVal = doSliderCallback ? parseFloat(this.slider.value) : val;
		const outVal = this.conversionCallback ? this.conversionCallback(inVal) : inVal;
		this.label.innerText = this.labelStr + " = " + outVal.toFixed(this.precision);
		if (this.outerCallback && doSliderCallback) {
			this.outerCallback(outVal);
		}
	}

	getValue() {
		return this.slider.value;
	}

	setValue(val, doSliderCallback) {
		this.slider.value = val;
		this.#callbackSlider(val, doSliderCallback);
	}

	resetValue(doSliderCallback) {
		this.setValue(this.start, doSliderCallback);
	}
}
