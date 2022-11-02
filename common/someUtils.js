'use strict';

// running average class
class Runavg {
	constructor(nele) {
		this.nele = nele;
		this.arr = [];
		this.idx = 0;
		this.sum = 0;
	}

	add(num) {
		if (this.arr.length == this.nele) { // array filled up
			this.sum -= this.arr[this.idx];
			this.arr[this.idx] = num;
			this.sum += num;
			++this.idx;
			if (this.idx == this.nele)
				this.idx = 0;
		} else { // building up array
			this.arr[this.idx] = num;
			this.sum += num;
			++this.idx;
			if (this.idx == this.nele)
				this.idx = 0;
		}
		return this.sum/this.arr.length;
	}
}

function range(a,b,c) {
	if (b<a)
		return a;
	if (b>c)
		return c;
	return b;
}

function lerp(a, b, t) {
	return a + t * (b - a);
}

// deep copy of object, includes it's constructor too
function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array || obj instanceof Int32Array || obj instanceof Int8Array || obj instanceof Float32Array) {
//	if (obj.isArray()) {
//	if (Array.isArray(obj)) {
		if (obj instanceof Float32Array)
			copy = new Float32Array(obj.length);
		else
			copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        // copy = {};	// just a generic object
		copy = new obj.constructor(); // get prototypes copied over, more specialized object
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

// creates an n dimensional array
// like createArray(3,4,5) will make an array like arr[3][4][5]
// also createArray([3,4,5]) will make an array like arr[3][4][5]
function createArray(length) {
	if (isArray(length)) {
		return createArray.apply(null,length);
	}
	if (length === undefined)
		return null;
    var arr = new Array(length);
	var i = length;
    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments,1);
        while(i--)
			arr[i] = createArray.apply(null,args);
    }
    return arr;
}

function isArray(obj) {
    return obj instanceof Array || obj instanceof Int32Array || obj instanceof Int8Array || obj instanceof Float32Array;
}

// fill an n dimensional array with a value
function fillArray(arr, val) {
    if (isArray(arr) && arr.length > 0) {
		for (var ele of arr) {
			if (isArray(ele)) {
				fillArray(ele, val);
			} else {
				arr.fill(val);
			}
		}
	}
}

function extend(base, sub) {
	// Avoid instantiating the base class just to setup inheritance
	// Also, do a recursive merge of two prototypes, so we don't overwrite 
	// the existing prototype, but still maintain the inheritance chain
	// Thanks to @ccnokes
	var origProto = sub.prototype;
	sub.prototype = Object.create(base.prototype);
	for (var key in origProto)  {
		sub.prototype[key] = origProto[key];
	}
	// The constructor property was set wrong, let's fix it
	// THIS
	Object.defineProperty(sub.prototype, 'constructor', { 
		enumerable: false, 
		value: sub 
	});
	// OR THAT
	//sub.prototype.constructor = sub;
}

// pass in an array of strings OR an object with member name, and return an enum object, numbering all members
function makeEnum(strArr) {
	var ret = {};
	for (var i=0;i<strArr.length;++i) {
		var str = strArr[i];
		if (typeof str == 'string') {
			ret[str] = i;
		} else { // assume an object with a 'name' member
			ret[str.name] = i;
		}
	}
	return ret;
}

function ilog2(t) {
	var r = 0;
	if (t == 0)
		return -1; // error, can YOU take the log of 0?
	// there's a 1 out there somewhere
	while (t) {
		t>>=1;
		++r;
	}
	return r-1;
}

// round down to a power of 2
function makepow2(x) {
	return 1<<ilog2(x);
}

// remove comments from a string before sending it to a parser, like JSON
function stripComments(str) {
	var lines = str.split("\n");
	var reCombined = "";
	for (var i = 0; i < lines.length; ++i) {
		var line = lines[i];
		var res = line.search("//");
		if (res == 0)
			continue;
		if (res > 0)
			line = line.substr(0,res);
		reCombined += line + "\n";
	}
	return reCombined;
}

function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

function dist2dsq(p0, p1) {
	const d = [p1[0] - p0[0], p1[1] - p0[1]];
	return d[0] * d[0] + d[1] * d[1];
}

function dist2d(p0, p1) {
	return Math.sqrt(dist2dsq(p0, p1));
}

function midPnt(p0, p1) {
	return [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
}

function lerp(A, B, t) {
	return A + (B - A) * t;
}

function getIntSect(A, B, C, D) {
	const tTop  = (D[0] - C[0]) * (A[1] - C[1]) 
				- (D[1] - C[1]) * (A[0] - C[0]);
	const uTop  = (C[1] - A[1]) * (A[0] - B[0]) 
				- (C[0] - A[0]) * (A[1] - B[1]);
	const bottom  = (D[1] - C[1]) * (B[0] - A[0]) 
				  - (D[0] - C[0]) * (B[1] - A[1]);
    
	if (bottom != 0) {
		const t = tTop / bottom;
		const u = uTop / bottom;
		return [lerp(A[0], B[0], t), lerp(A[1], B[1], t)];
	}
	return null;
}

// 0 <= a < 2 * PI
function normAngRadUnsigned(a)
{
	let watchDog = 10;
	while(true) {
		if (a < 0) {
			a += 2 * Math.PI;
			--watchDog;
		} else if (a >= 2 * Math.PI) {
			a -= 2 * Math.PI;
			--watchDog;
		} else {
			break;
		}
		if (watchDog == 0) {
			alert("watchDog: normAngRadUnsigned hit");
			return 0;
		}
	}
	return a;
}

// -PI <= a < PI
function normAngRadSigned(a)
{
	let watchDog = 10;
	while(true) {
		if (a < -Math.PI) {
			a += 2 * Math.PI;
			--watchDog;
		} else if (a >= Math.PI) {
			a -= 2 * Math.PI;
			--watchDog;
		} else {
			break;
		}
		if (watchDog == 0) {
			alert("watchDog: normAngRadUnsigned hit");
			return 0;
		}
	}
	return a;
}

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

class EditPnts {
	constructor(pnts, pntRad) {
		this.pnts = pnts;
		this.numPnts = pnts.length;
		this.curPntIdx = -1; // current select point for edit
		this.hilitPntIdx = -1; // hover over
		this.pntRad = pntRad;	
	}

	proc(mouse, userMouse) { // mouse buttons and user/cam space mouse coord
		this.hilitPntIdx = -1
		// edit stuff on the graph paper
		let butDown = mouse.mbut[Mouse.LEFT];
		let lastButDown = mouse.lmbut[Mouse.LEFT];

		// hilit hover
		// check topmost points first
		for (let i = this.numPnts - 1; i >= 0; --i) {
			const isInside
				= dist2dsq(this.pnts[i], userMouse) 
				< this.pntRad* this.pntRad; // one less space to stop fictional errors, VSC
			if (isInside) {
				this.hilitPntIdx = i;
				break;
			}
		}
		if (this.curPntIdx < 0) {
			// nothing selected
			if (this.hilitPntIdx >= 0) {
				// something hilighted
				if (butDown && !lastButDown) {
					//mouse button pressed
					this.curPntIdx = this.hilitPntIdx;
				}
			}
		}
		if (!butDown) {
			//deselect point when mouse not pressed
			this.curPntIdx = -1;
		}
			
		if (this.curPntIdx >= 0) {
			this.pnts[this.curPntIdx] = userMouse;
		}
	}

	getHilitIdx() {
		const hilitIdx = this.curPntIdx >= 0 ? this.curPntIdx : this.hilitPntIdx;
		return hilitIdx;
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
			} else if (type == 'checkbox') { // checkbox
				eventType = 'change';
			}

		} else if (kind == 'button') { // button
			eventType = 'click';
		} else if (kind == 'textarea') { // textarea
			eventType = 'keyup';
		}
		if (eventType) {
			ele.addEventListener(eventType, callback);
		}
	}
	return ele;
}

class makeEleCombo {
	constructor(parent, labelStr, min, max, start, step, precision, outerCallback) {
		// break
		//makeEle(parent, "hr");
		// pre/span
		const pre = makeEle(parent, "pre");
		this.labelStr = labelStr;
		this.label = makeEle(pre, "span", "aSpanId", null, "label");
		// slider
		this.slider = makeEle(parent, "input", "aSliderId", "slider", null, this.#callbackSlider.bind(this), "range");
		this.slider.min = min;
		this.slider.max = max;
		this.start = start;
		this.slider.value = start;
		this.slider.step = step;
		this.precision = precision;
		this.outerCallback = outerCallback;
		this.#callbackSlider(); // fire off one callback at init
		// button
		makeEle(parent, "button", "aButtonId", null, this.labelStr + " reset", this.#callbackResetButton.bind(this));
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

}
