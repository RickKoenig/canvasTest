'use strict';

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

		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		//this.vp = null; // OR, no vertical panel UI
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
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, this.vp, this.startCenter, this.startZoom);
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

	#resetCounter() {
		this.count = 0;
	}

	// USER: add more members or classes to MainApp

	#funToArray(f, q, minX, maxX, numSteps) { // inclusive
		const arr = [];
		for (let i = 0; i <= numSteps; ++i) {
			const x = minX + i * (maxX - minX) / numSteps;
			const fx = f(x, q);
			arr.push(fx);
		}
		return arr;
	}

	static funSHO(x, q) {
		return MainApp.normals[q] * Math.exp(-x * x / 2) * MainApp.calcPoly(x, q);
	}

	static funSHO2(x, q) {
		const a = MainApp.funSHO(x, q);
		return a * a;
	}

	static diffEqSHO(x, f, q) {
		const E = q + 1 / 2;
		return .5 * MainApp.diff2(f, x, q) + (E - .5 * x * x) * f(x, q);
	}

	// 1st derivative
	static diff(f, x, q) {
		return((f(x + MainApp.epsilon / 2, q) - f(x - MainApp.epsilon / 2, q)) / MainApp.epsilon);
	}

	// 2nd derivative
	static diff2(f, x, q) {
		return((f(x + MainApp.epsilon, q) - 2 * f(x, q) + f(x - MainApp.epsilon, q)) / (MainApp.epsilon * MainApp.epsilon));
	}

	// integration
	#calcArea(fun, square, q, start, end, numSteps) {
		//console.log("calcArea with q = " + q);
		// Trapezoidal Rule
		let sum = (fun(start, q) + fun(end, q)) / 2;
		if (square) {
			sum *= sum;
		}
		const span = end - start;
		for (let i = 1; i <= numSteps - 1; ++i) {
			const x = start + span * i / numSteps;
			let val = fun(x, q);
			if (square) {
				val *= val;
			}
			sum += val;
		}
		return sum * span / numSteps;
	}

	static factorial(n) {
		let r = 1;
		while(n > 0) {
			r *= n--;
		}
		return r;
	}

	static calcNormal(q) {
		const ret = MainApp.piVal / (Math.sqrt(Math.pow(2, q) * MainApp.factorial(q)));
		return ret;
	}

	static calcNormals(maxQ) {
		const ret = [];
		for (let q = 0; q <= maxQ; ++q) {
			const norm = MainApp.calcNormal(q);
			ret.push(norm);
		}
		return ret;
	}

	static calcPoly(x, q) {
		//console.log("calcPoly " + q + " " + x);
		const coefs = MainApp.polysCoefs[q];
		let r = 0;
		for (let i = coefs.length - 1; i >= 0; --i) {
			r = r * x + coefs[i];
		}
		return r;
	}

	static calcPolysCoefs(maxQ) {
		console.log("const coefs");
		console.log(MainApp.constPolys);
		console.log("gen coefs");
		/*
		const constCoefs = [
			[ 1],					// Q0: 1
			[ 0,   2],				// Q1: 2x
			[-2,   0,   4],			// Q2: 4x^2 - 2
			[ 0, -12,   0, 8],		// Q3:  8x^3 - 12x
			[12,   0, -48, 0, 16]	// Q4: 16x^4 =48x^2 + 12
		];
		*/
		// build up from last poly
		const genCoefs = [[1], [0, 2]];
		for (let q = 2; q <= maxQ; ++q) {
			const lastCoefs = genCoefs[q - 1];
			const coefs = [];
			for (let k = 0; k <= q; ++k) {
				let left, right;
				if (k == 0) {
					left = 0;
				} else {
					left = 2 * lastCoefs[k - 1];
				}
				if (k >= q - 1) {
					right = 0;
				} else {
					right = -(k + 1) * lastCoefs[k + 1];
				}
				coefs.push(left + right);
			}
			genCoefs.push(coefs);
		}
		//return constCoefs;
		return genCoefs;
	}

	// check validity of differential equations
	#testDiffEq() {
		MainApp.piVal = Math.pow(Math.PI, -.25);
		MainApp.normals = MainApp.calcNormals(this.maxQNum); // inclusive
		MainApp.polysCoefs = MainApp.calcPolysCoefs(this.maxQNum);
		console.log("polysCoefs");
		console.log(MainApp.polysCoefs);
		MainApp.epsilon = .005;
		const xStart = -10;
		const xEnd = 10;
		const numSteps = 100;

		console.log("test diffeq");
		for (let q = 0; q <= this.maxQNum; ++q) {
			let maxErr = 0;
			let errorStr = "";
			for (let i = 0; i <= numSteps; ++i) {
				const x = xStart + i * (xEnd - xStart) / numSteps;
				const error = MainApp.diffEqSHO(x, MainApp.funSHO, q);
				const absErr = Math.abs(error);
				if (absErr > maxErr) {
					maxErr = absErr;
				}
				const errThresh = 10;
				//if (true) {
				if (Math.abs(error) >= errThresh) {
					const fx = MainApp.funSHO(x, q);
					errorStr += "\n\tx = " + x.toFixed(3).padStart(8) 
						+ ", fx = " + fx.toFixed(4).padStart(9)
						+ ", error = " + error.toFixed(8).padStart(11);
				}
			}

			const area = this.#calcArea(MainApp.funSHO, true, q, xStart, xEnd, numSteps);
			console.log("Qnum = " + q + ", Max Error = " + maxErr.toFixed(6).padStart(8) + " Area = " + area.toFixed(6).padStart(8) + errorStr);
		}
	}

	#userInit() {
		// user init section
		this.minQNum = 0;
		this.maxQNum = 57;
		this.startQNum = 0;
		//this.curQnum;
		this.numDrawSteps = 400; // 'numSteps + 1' points
		this.minXDraw = -14;
		this.maxXDraw = 14;
		this.#testDiffEq();

		this.count = 0; // frame counter
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .25;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "button", null, null, "Reset Counter", this.#resetCounter.bind(this));
		makeEle(this.vp, "button", null, null, "Reset Counter 10000", 
			() => {
				this.count = 10000;
			}
		);
		makeEle(this.vp, "hr");
		{
			const label = "QNum";
			const min = 0;
			const max = this.maxQNum;
			const start = this.startQNum;
			const step = 1;
			const precision = 0;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,
				(v) => {
					this.curQnum = v;
					this.count = v * 10000;
					this.dirty = true;
				}
			);
		}
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
		this.avgFps = this.avgFpsObj.add(this.fps);
		++this.count;
	}

	#userDraw() {
		const funArr2 = this.#funToArray(MainApp.funSHO2, this.curQnum, this.minXDraw, this.maxXDraw, this.numDrawSteps);
		const funArr = this.#funToArray(MainApp.funSHO, this.curQnum, this.minXDraw, this.maxXDraw, this.numDrawSteps);
		this.drawPrim.drawLinesSimple(funArr, undefined, undefined, this.minXDraw, (this.maxXDraw - this.minXDraw) / (funArr.length - 1), "red");
		this.drawPrim.drawLinesSimple(funArr2, undefined, undefined, this.minXDraw, (this.maxXDraw - this.minXDraw) / (funArr.length - 1), "blue");
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Frame Count = " + this.count;
		countStr += "\nDirty Count = " + this.dirtyCount;
		countStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		this.eles.textInfoLog.innerText = countStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.LEFT) || this.dirty;
		// USER: do USER stuff
		this.#userProc(); // proc

		//this.dirty = true; // test, always draw every frame
		// draw when dirty
		if (this.dirty) {
			this.plotter2d.clearCanvas();
			// interact with mouse, calc all spaces
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
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // end test static methods
