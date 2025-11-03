'use strict';

// do a fixed point system in javascript

const FMath = {};
//helper
FMath.intPow = function(b, e) {
	let r = 1;
	while(e-- > 0) {
		r *= b;
	}
	return r;
}

FMath.intBits = 2;
FMath.fracBits = 2;
FMath.JSBits = 32; // when javascript works in ints, 2's complement
FMath.mulFracFactor = FMath.intPow(2, FMath.JSBits - FMath.intBits);
FMath.mulJS = FMath.intPow(2, FMath.JSBits);

FMath.mask = (FMath.intPow(2, FMath.intBits + FMath.fracBits)) - 1; // put all bits to MSB position
FMath.mask *= FMath.intPow(2, FMath.JSBits - FMath.intBits - FMath.fracBits);

FMath.floorMask = FMath.intPow(2, FMath.intBits) - 1;
FMath.floorMask *= FMath.intPow(2, FMath.JSBits - FMath.intBits);

FMath.addRound = FMath.intPow(2, FMath.JSBits - FMath.intBits - 1);

FMath.epsilonNum = 1 / FMath.intPow(2, FMath.fracBits);
FMath.overNum = FMath.intPow(2, FMath.intBits - 1);
// binary
// example: if intBits = 3, fracBits = 3
// iiif ff00 0000 0000 0000 0000 0000 0000
// example: if intBits = 2, fracBits = 2
// iiff 0000 0000 0000 0000 0000 0000 0000

// helpers
FMath.numberToHex32 = function(n) {
	const uVal = n < 0 ? (n + FMath.mulJS) : n; // convert to unsigned
	const str = uVal.toString(16);
	const strPad = '0x' + str.padStart(8, '0');
	return strPad;  // hex string
}

FMath.numberToPrettyString = function(n) {
	let ret = n.toString();
	if (ret >= 0) {
		ret = " " + ret;
	}
	ret = ret.padEnd(8);
	return ret;
}

// create
FMath.create = function() {
	return {
		raw: 0 // 32 bit
	};
}

FMath.fromNumber = function(n) {
	const out = FMath.create();
	out.raw = (n * FMath.mulFracFactor) & FMath.mask;
	return out;
}

FMath.clone = function(f) {
	return clone(f);
}

// replace
FMath.copy = function(out, f) {
	out.raw = f.raw;
	return out;
}

FMath.setNumber = function(out, n) {
	out.raw = (n * FMath.mulFracFactor) & FMath.mask;
	return out;
}

// output
FMath.toNumber = function(f) {
	return f.raw / FMath.mulFracFactor;
}

FMath.toPrettyString = function(f) {
	const n = FMath.toNumber(f);
	return FMath.numberToPrettyString(n);
}

FMath.toRawString = function(f) {
	return FMath.numberToHex32(f.raw);
}

// unary operators
FMath.neg = function(out, a) {
	out.raw = -a.raw & FMath.mask;
	return out;
}

FMath.floor = function(out, a) {
	out.raw =  a.raw & FMath.floorMask;
	return out;
}

FMath.ceil = function(out, a) {
	FMath.neg(out, a);
	FMath.floor(out, out);
	FMath.neg(out, out);
	return out;
}

FMath.round = function(out, a) {
	out.raw = a.raw + FMath.addRound;
	FMath.floor(out, out);
	return out;
}

// check
FMath.inv = function(out, a) {
	out.raw = 1;
	return out;
}

// binary operators
FMath.add = function(out, a, b) {
	out.raw = (a.raw + b.raw) & FMath.mask;
	return out;
}

FMath.sub = function(out, a, b) {
	out.raw = (a.raw - b.raw) & FMath.mask;
	return out;
}

// check
FMath.mul = function(out, a, b) {
	return out;
}

// check
FMath.div = function(out, a, b) {
	return out;
}

// check
FMath.mod = function(out, a, b) {
	return out;
}

// TODO: add comparison operators, or just do a.raw < b.raw etc. ...

function testFMath() {
	console.log("begin testFMath");
	const strMask = FMath.numberToHex32(FMath.mask);
	console.log("     mask = " + strMask);
	const strFloorMask = FMath.numberToHex32(FMath.floorMask);
	console.log("floorMask = " + strFloorMask);
	const strAddRound = FMath.numberToHex32(FMath.addRound);
	console.log(" addRound = " + strAddRound);
	console.log("JSBits = " + FMath.JSBits 
		+ ", intBits = " + FMath.intBits 
		+ ", fracBits = " + FMath.fracBits);
	console.log("epsilonNum = " + FMath.epsilonNum);
	console.log("overNum = " + FMath.overNum);
	/*
	for (let b = -FMath.overNum; b <= FMath.overNum; b += FMath.epsilonNum) {
		const fb = FMath.fromNumber(b);
		for (let a = -FMath.overNum; a <= FMath.overNum; a += FMath.epsilonNum) {
			const fa = FMath.fromNumber(a);
			const fc = FMath.create();
			FMath.sub(fc, fa, fb);
			console.log(FMath.toPrettyString(fa) + " - " + FMath.toPrettyString(fb)
				+ " = " + FMath.toPrettyString(fc));
		}
	}*/
	/*
	for (let n = -FMath.overNum; n <= FMath.overNum; n += FMath.epsilonNum) {
		const f = FMath.fromNumber(n);
		const fFloor = FMath.create();
		FMath.floor(fFloor, f);
		const fCeil = FMath.create();
		FMath.ceil(fCeil, f);
		const fRound = FMath.create();
		FMath.round(fRound, f);
		console.log("f = " + FMath.toPrettyString(f)
			+ ", fRaw = " + FMath.toRawString(f) 
			//+ ",      fFloor = " + FMath.toPrettyString(fFloor)
			//+ ", fFloorRaw = " + FMath.toRawString(fFloor)
			+ ",      fCeil = " + FMath.toPrettyString(fCeil)
			+ ", fCeiRaw = " + FMath.toRawString(fCeil)
			+ ",      fRound = " + FMath.toPrettyString(fRound)
			+ ", fRoundRaw = " + FMath.toRawString(fRound)
			+ '  #');
	}
	*/
			/*
				mul
				inv
				div
				mod
			*/
	console.log("end testFMath");
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp.numInstances;
	}

	constructor() {
		console.log("\n############# creating instance of MainApp");
		++MainApp.numInstances;

		testFMath();

		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		this.eles = {}; // keep track of eles in vertical panel

		// add all elements from vp to ele if needed
		// uncomment if you need elements from vp html
		//populateElementIds(this.vp, this.eles);

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// USER before UI built
		this.#userInit();

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER
		this.plotter2d = new Plotter2d(
			this.plotter2dCanvas, this.ctx, /*this.vp*/ null
			, this.startCenter, this.startZoom);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.dirty = true; // draw at least once
		this.dirtyCount = 100;
		this.#animate();
	}

	#randomColor() {
		const r = getRandomInt(256);
		const g = getRandomInt(256);
		const b = getRandomInt(256);
		this.vp.style.background = `rgb(${r}, ${g}, ${b}`;
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		// measure frame rate
		this.fps;
		this.AvgFps = 0;
		this.oldTime; // for delta time
		this.AvgFpsObj = new Runavg(500);

		// position graphics
		this.startCenter = [.5, .5];
		this.startZoom = 1.8;
		this.pos = [0, 0];
	}

	#userBuildUI() {
		makeEle(this.vp, "button", null, null, "Random color", this.#randomColor.bind(this));
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
	}		
	
	#userProc() {
		// proc
		//this.dirty = true;
		// update FPS
		if (this.oldTime === undefined) {
			this.oldTime = performance.now();
			this.fps = 0;
		} else {
			const newTime = performance.now();
			const delTime =  newTime - this.oldTime;
			this.oldTime = newTime;
			this.fps = 1000 / delTime;
		}
		this.AvgFps = this.AvgFpsObj.add(this.fps);

		// some graphics
		const mbut = this.input.mouse.mbut[Mouse.LEFT];
		if (mbut) {
			this.pos = vec2.clone(this.plotter2d.userMouse);
		}
	}

	#userDraw() {
		const lineWid = .02;
    	this.drawPrim.drawRectangleO([0, 0], [1, 1], lineWid);
		this.drawPrim.drawCircleO(this.pos, .1, .005, "brown"); // center
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\n\nAvg fps = " + this.AvgFps.toFixed(2);
		infoStr += "\n\n";
		this.eles.textInfoLog.innerText = infoStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT) || this.dirty;
		// USER: do USER stuff
		this.#userProc(); // proc

		this.dirty = true; // test, always draw every frame
		//this.dirty = false;
		// draw when dirty
		if (this.dirty) {
			this.plotter2d.clearCanvas();
			// goto user/cam space
			this.plotter2d.setSpace(Plotter2d.spaces.USER);
			// now in user/cam space
			this.graphPaper.draw("X", "Y");
			// USER: do USER stuff
			this.#userDraw(); //draw
		}
		// update UI, text
		this.#userUpdateInfo();

		if (this.dirty) {
			this.dirtyCount = 100;
		} else {
			--this.dirtyCount;
			if (this.dirtyCount < 0) {
				this.dirtyCount = 0;
			}
		}
		this.dirty = false; // turn off drawing unless something changes

		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
