'use strict';


// javacript helpers
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

function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
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


// json helpers
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


// math helpers
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

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

function midPnt(out, p0, p1) {
	vec2.add(out, p1, p0);
	vec2.scale(out, out, .5);
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
function normAngRadUnsigned(a) {
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
function normAngRadSigned(a) {
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

// drag points around
class EditPnts {

	// all based on pntRad
	static lineWidth = .1;
	static circleWidth = .2;
	static editCircleSize = 1.5;
	static addPointDist = 20; // how far away to select point for adding

	constructor(pnts, pntRad, addRemove = false) {
		this.pnts = pnts;
		this.curPntIdx = -1; // current select point for edit
		this.hilitPntIdx = -1; // hover over
		this.pntRad = pntRad;
		this.addRemove = addRemove;
		//this.addAtStart = true;
		this.addAtMiddle = true;
		this.addDynamic = true;
	}

	setAddRemove(ar) {
		this.addRemove = ar;
	}

	getAddRemove() {
		return this.addRemove;
	}

	// midpoints or past endpoints
	#calcAddIdx(userMouse) {
		let ret = -1;
		if (this.addDynamic) {
			if (this.pnts.length == 0) {
				// just add a point into an empty array of points anywhere (no dist check)
				ret = 0;
			} else if (this.pnts.length == 1) {
				// just add a point at the end of a 1 point array if close enough
				// point in array
				let dist2 = vec2.sqrDist(userMouse, this.pnts[0]);
				const addRange = EditPnts.addPointDist * this.pntRad;

				if (dist2 < addRange * addRange) {
					ret = this.pnts.length;
				}
			} else {
					// find closest distance to mouse
				// start point
				let bestDist2 = vec2.sqrDist(userMouse, this.pnts[0]);
				let bestIdx2 = 0;
				// end point
				let dist2 = vec2.sqrDist(userMouse, this.pnts[this.pnts.length - 1]);
				if (dist2 < bestDist2) {
					bestDist2 = dist2;
					bestIdx2 = this.pnts.length;
				}
				// middle points
				for (let i = 0 ; i < this.pnts.length - 1; ++i) {
					const p0 = this.pnts[i];
					const p1 = this.pnts[i + 1];
					let mid = vec2.create();
					vec2.add(mid, p0, p1);
					vec2.scale(mid, mid, .5);
					const dist2 = vec2.sqrDist(userMouse, mid);
					if (dist2 < bestDist2) {
						bestDist2 = dist2;
						bestIdx2 = i + 1;
					}
				}
				
				const addRange = EditPnts.addPointDist * this.pntRad;
				if (bestDist2 < addRange * addRange) {
					ret = bestIdx2;
				}
			}
		} else if (this.addAtMiddle) {
			//this.pnts.unshift(userMouse);
			ret = Math.floor(this.pnts.length / 2);
			//if (ret > 0) {
			//	--ret;
			//}
		} else if (this.addAtStart) {
			ret = 0;
		} else { // add at end
			ret = this.pnts.length;
		}
		return ret;
	}

	getHilitIdx() {
		const hilitIdx = this.curPntIdx >= 0 ? this.curPntIdx : this.hilitPntIdx;
		return hilitIdx;
	}

	proc(mouse, userMouse) { // mouse buttons and user/cam space mouse coord
		let dirt = mouse.dmxy[0] || mouse.dmxy[1]; // any movement
		this.hilitPntIdx = -1
		// edit stuff on the graph paper
		let but = mouse.mbut[Mouse.LEFT];
		let lastBut = mouse.lmbut[Mouse.LEFT];

		// hilit hover
		// check topmost points first
		for (let i = this.pnts.length - 1; i >= 0; --i) {
			const isInside
				= vec2.squaredDistance(this.pnts[i], userMouse) 
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
				if (but && !lastBut) {
					//mouse button down
					this.curPntIdx = this.hilitPntIdx;
				}
			}
		}
		if (but) {
			dirt = true;
		} else {
			//deselect point when mouse not pressed
			this.curPntIdx = -1;
		}
			
		//  move selected point
		if (this.curPntIdx >= 0) {
			this.pnts[this.curPntIdx] = userMouse;
		}
		if (this.addRemove) {
			if (mouse.mclick[Mouse.MIDDLE]) {
				console.log('add remove middle clicked');
				// remove point if hovering over a point
				const selPnt = this.getHilitIdx();
				if (selPnt >= 0) {
					this.pnts.splice(selPnt, 1);
					this.curPntIdx = -1;
					this.hilitPntIdx = -1;
					dirt = true;
				// add point
				} else {
					const addIdx = this.#calcAddIdx(userMouse);
					/*
					if (this.addAtMiddle) {
						//this.pnts.unshift(userMouse);
						let mid = Math.floor(this.pnts.length / 2);
						if (mid > 0) {
							--mid;
						}
						this.pnts.splice(mid + 1, 0, userMouse);
						this.curPntIdx = 0;
					} else if (this.addAtStart) {
						this.pnts.unshift(userMouse);
						this.curPntIdx = 0;
					} else { // add at end
						this.pnts.push(userMouse);
						this.curPntIdx = this.pnts.length - 1;
					}
					*/
					if (addIdx >= 0) {
						this.pnts.splice(addIdx, 0, userMouse);
						//this.pnts.unshift(userMouse);
						this.curPntIdx = addIdx;
						dirt = true;
					}
				}
			}
		}
		return dirt;
	}

	draw(drawPrim, userMouse) {
		// draw with hilits on some points
		for (let i = 0; i < this.pnts.length - 1; ++i) {
			const pnt0 = this.pnts[i];
			const pnt1 = this.pnts[i + 1];
			drawPrim.drawLine(pnt0, pnt1, this.pntRad * EditPnts.lineWidth);
		}
		const hilitPntIdx2 = this.getHilitIdx();
		let isOver = false;
		for (let i = 0; i < this.pnts.length; ++i) {
			drawPrim.drawCircle(this.pnts[i], this.pntRad, "green");
			const size = this.pntRad * 2;
			drawPrim.drawText(this.pnts[i], [size, size], i, "white");
			let doHilit = i == hilitPntIdx2;
			drawPrim.drawCircleO(this.pnts[i], this.pntRad, this.pntRad * EditPnts.circleWidth, doHilit ? "yellow" : "black");
			if (this.addRemove) {
				// remove
				if (doHilit) {
					drawPrim.drawCircleO(this.pnts[i], this.pntRad * EditPnts.editCircleSize, this.pntRad * EditPnts.circleWidth, "red");
					if (i > 0 && i < this.pnts.length - 1) {
						drawPrim.drawLine(this.pnts[i - 1], this.pnts[i + 1], this.pntRad * EditPnts.lineWidth, "red");
					}
					isOver = true;
				}
			}
		}
		// add
		if (this.addRemove && !isOver) {
			drawPrim.drawCircleO(userMouse, this.pntRad * EditPnts.editCircleSize, this.pntRad * EditPnts.circleWidth, "green");
			//add point at the end for now
			if (this.pnts.length > 0) {
				const addIdx = this.#calcAddIdx(userMouse);
				/*
				if (this.addAtMiddle) {
					let mid = Math.floor(this.pnts.length / 2);
					if (mid > 0) {
						--mid;
					}
					if (this.pnts.length > 1) {
						drawPrim.drawLine(userMouse, this.pnts[mid + 1], this.pntRad * EditPnts.lineWidth, "green");
					}
					drawPrim.drawLine(userMouse, this.pnts[mid], this.pntRad * EditPnts.lineWidth, "green");
				} else if (this.addAtStart) {
					drawPrim.drawLine(userMouse, this.pnts[0], this.pntRad * EditPnts.lineWidth, "green");
				} else { // add at end
					drawPrim.drawLine(userMouse, this.pnts[this.pnts.length - 1], this.pntRad * EditPnts.lineWidth, "green");
				}*/
				//drawPrim.drawLine(userMouse, this.pnts[addIdx], this.pntRad * EditPnts.lineWidth, "green");
				if (addIdx > 0) { // before point
					drawPrim.drawLine(userMouse, this.pnts[addIdx - 1], this.pntRad * EditPnts.lineWidth, "green");
				}
				if (addIdx != -1 && addIdx < this.pnts.length) { // after point
					drawPrim.drawLine(userMouse, this.pnts[addIdx], this.pntRad * EditPnts.lineWidth, "green");
				}
			}
		}
	}
}

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
				console.log("CALLBACK SLIDER");
				callback(event.target.value);
			});
		} else if (eventType =='change') {
			ele.addEventListener(eventType, (event) => {
				console.log("CALLBACK CHECKBOX");
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
