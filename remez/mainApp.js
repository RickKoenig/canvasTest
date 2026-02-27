'use strict';

// calculate Chebyshev and Remez coefficients

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

		this.maxCoefs = 8;
		this.funs = [
			{
				tayCoef: [-10, 1, 2, 1 / 3, 0, 0, 0, 0], // not really taylor, just the coefs of the polynomial
				tayShift: 0,
				fun: null, // set later
				xRange: [-1, 3],
				name: "testPoly"
			},
			{
				fun: Math.sin,
				dFun: Math.cos,
				xRange: [0, Math.PI / 2],
				tayCoef: [0, 1, 0, -1 / 6, 0, 1 / 120, 0, -1 / 5040],
				tayShift: 0,
				name: "sin"
			},
			{
				fun: Math.cos,
				dFun: x => -Math.sin(x),
				xRange: [0, Math.PI / 2],
				tayCoef: [1, 0, -1 / 2, 0, 1 / 24, 0, -1 / 720, 0],
				tayShift: 0,
				name: "cos"
			},
			{
				fun: Math.tan,
				xRange: [0, Math.PI / 4],
				tayCoef: [0, 1, 0, 1 / 3, 0, 2 / 15, 0, 17 / 315],
				tayShift: 0,
				name: "tan"
			},
			{
				fun: Math.asin,
				dFun: x => 1 / Math.sqrt(1 - x * x),
				xRange: [0, 1],
				tayCoef: [0, 1, 0, 1 / 6, 0, 3 / 40, 0, 5 / 112],
				tayShift: 0,
				name: "asin"
			},
			{
				fun: Math.atan,
				xRange: [0, 1],
				tayCoef: [0, 1, 0, -1 / 3, 0, 1 / 5, 0, -1 / 7],
				tayShift: 0,
				name: "atan"
			},
			{
				fun: Math.exp,
				dFun: Math.exp,
				xRange: [-1, 1],
				tayCoef: [1, 1, 1 / 2, 1 / 6, 1 / 24, 1 / 120, 1 / 720, 1 / 5040],
				tayShift: 0,
				name: "exp, -1 to 1"
			},
			{
				fun: Math.exp,
				dFun: Math.exp,
				xRange: [0, 1],
				tayCoef: [1, 1, 1 / 2, 1 / 6, 1 / 24, 1 / 120, 1 / 720, 1 / 5040],
				tayShift: 0,
				name: "exp, 0 to 1"
			},
			{
				fun: Math.log2,
				dFun: x => 1 / (x * Math.LN2),
				xRange: [1, 2],
				tayCoef: null,
				tayShift: -1,
				name: "log2"
			}
		];
		this.funNames = [];
		for (const fun of this.funs) {
			const name = fun.name;
			this.funNames.push(name);
		}

		// bind some functions
		// testPoly
		let fun = this.funs[this.funNames.indexOf("testPoly")];
		const y = new poly(fun.tayCoef);
		const dy = new poly();
		poly.derivative(dy, y);
		fun.fun = poly.calc.bind(null, y);
		fun.dFun = poly.calc.bind(null, dy);
		
		// tan
		fun = this.funs[this.funNames.indexOf("tan")];
		fun.dFun = function(x) {
			const sec = 1 / Math.cos(x);
			return sec * sec;
		}

		// atan
		fun = this.funs[this.funNames.indexOf("atan")];
		fun.dFun = function(x) {
			return 1 / (1 + x * x);
		}
		
		// log2
		fun = this.funs[this.funNames.indexOf("log2")];
		const log2Coefs = new Array(this.maxCoefs).fill(0);
		let sign = 1;
		for (let i = 1; i < 4; ++i) {
			log2Coefs[i] = sign / (i * Math.LN2);
			sign = -sign;
		}
		fun.tayCoef = log2Coefs;
		// done bind some functions

		// current function
		//this.curFunIdx = this.funNames.indexOf("exp, -1 to 1");
		this.curFunIdx = this.funNames.indexOf("sin");
		this.curFun = this.funs[this.curFunIdx];

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
		//const vp = this.vp;
		const vp = null;
		this.plotter2d = new Plotter2d(
			this.plotter2dCanvas, this.ctx, vp
			, this.startCenter, this.startZoom);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		this.drawFun = new DrawFun(this.graphPaper);

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

	// calc new fun, deltaFun etc.
	#updateFuns() {
		// calc derivative
		this.dCoefs = new poly();
		poly.derivative(this.dCoefs, new poly(this.coefs));

		// draw deltas */
		this.polyFun = x => poly.calc(this.coefs, x);
		this.deltaFun = x => (this.curFun.fun(x) - this.polyFun(x)); // extrema
		this.dDeltaFun = x => (this.curFun.dFun(x) - poly.calc(this.dCoefs, x)); // for D roots
	}
	#padCoefs() {
		while (this.coefs.length < this.maxCoefs) {
			this.coefs.push(0);
		}
	}

	#calcCoefsTaylor() {
		const p = new poly(this.curFun.tayCoef.slice(0, this.numCoefs));
		const ps = new poly();
		poly.shift(ps, p, this.curFun.tayShift);
		this.coefs = ps;
		this.#padCoefs();
		this.roots = [];
		this.#updateFuns();
	}

	#genChebyCoefs() {
		this.chPolys = []; // complete list of Chebyshev polynomials
		this.chPolys.push(new poly([1]));
		this.chPolys.push(new poly([0, 1]));
		const twoX = new poly([0, 2]);
		for (let i = 2; i < this.maxCoefs; ++i) {
			const cb = new poly();
			poly.mul(cb, twoX, this.chPolys[i - 1]);
			poly.sub(cb, cb, this.chPolys[i - 2]);
			this.chPolys.push(cb);
		}
	}

	#chebyCoefsToRawCoefs(chebCoefs) {
		const ret = new poly();
		const scl = new poly();
		for (let i = 0; i < chebCoefs.length; ++i) {
			poly.scale(scl, this.chPolys[i], chebCoefs[i]);
			poly.add(ret, ret, scl);
		}
		poly.prune(ret);
		return ret;
	}

	#changeRange(from, to) {
		const m = (to[1] - to[0]) / (from[1] - from[0]);
		const b = to[0] - m * from[0];
		return new poly([b, m]);
	}

	#calcCoefsCheb(fun, xRange, numNodes, numCoefs) {
		this.coefs = new Array(this.maxCoefs).fill(0);
		// calc nodes 'u'
		const N = numNodes;
		console.log("");
		const us = [];
		for (let i = 0; i < N; ++i) {
			const u = -Math.cos((i + 1 / 2) / N * Math.PI);
			us.push(u);
		}
		// move from 'u' to 'x'
		const xs = [];
		const uToX = this.#changeRange([-1, 1], xRange);
		for (let i = 0; i < N; ++i) {
			const u = us[i];
			const x = poly.calc(uToX, u);
			xs.push(x);
		}
		// calc 'y'
		const ys = [];
		for (let i = 0; i < N; ++i) {
			const x = xs[i];
			const y = fun(x);
			ys.push(y);
		}
		// calc 'c', integrate
		const cArr = new Array(this.maxCoefs).fill(0);
		for (let i = 0; i < N; ++i) {
			const y = ys[i];
			const u = us[i];
			for (let j = 0; j < numCoefs; ++j) {
				cArr[j] += y * poly.calc(this.chPolys[j], u);
			}
		}
		// average
		cArr[0] /= N;
		for (let i = 1; i < numCoefs; ++i) {
			cArr[i] /= N;
			cArr[i] *= 2;
		}
		console.log("us = " + us);
		console.log("xs = " + xs);
		console.log("ys = " + ys);
		console.log("cArr = " + cArr);
		// convert to raw
		const rawArr = this.#chebyCoefsToRawCoefs(cArr);
		// shift scale compose from u to x
		console.log("rawArr 1 = " + rawArr);
		const xToU = this.#changeRange(xRange, [-1, 1]); // 'x' to 'u'
		poly.compose(rawArr, rawArr, xToU);
		console.log("rawArr 2 = " + rawArr);
		this.coefs = rawArr;
		if (this.coefs.length < this.maxCoefs) {
			const cat = new Array(this.maxCoefs - this.coefs.length).fill(0);
			this.coefs.push(...cat);
		}
		this.#updateFuns();
	}

	#calcCoefsRemezExtrema(xRange) {
		this.roots = poly.findRoots(this.dDeltaFun, xRange);
		this.roots.unshift(xRange[0]);
		this.roots.push(xRange[1]);
	}

	#guessCoefsRemezExtrema(xRange, numCoefs) {
		this.roots = [];
		const m = xRange[1] - xRange[0];
		for (let i = 0; i <= numCoefs; ++i) {
			this.roots.push(xRange[0] + m * (i + .5)/ (numCoefs + 1));

		}
	}

	#calcCoefsRemezSolvePoly(fun, roots, numCoefs) {
		console.log("solve poly");
		if (roots.length != numCoefs + 1) {
			console.error("mismatch roots and numCoefs");
			//this.coefs = Array(this.maxCoefs).fill(0);
			return;
		}

		// A * X = Y, solve for X
		//const A = [[2, -5, 4,   1, -1], [1, -2, 1,   -1, 1], [1, -4, 6,   2, -1]];
		//const Y = [-3, 5, 10];

		const A = [];
		const Y = [];

		// build up the augmented matrix
		let err = -1;
		for (let j = 0; j < roots.length; ++j) {
			const aRow = [];
			let v = 1;
			for (let i = 0; i < roots.length - 1; ++i) {
				aRow.push(v);
				v *= roots[j];
			}
			aRow.push(err);
			err *= -1;
			A.push(aRow);
			Y.push(fun(roots[j]));
		}

		//const A = [[0, 1], [1, 0]];
		//const Y = [10, 100];

		const X = solveBackward(A, Y);
		console.log("ret linear = " + JSON.stringify(X));

		if (X === null) {
			console.error("wrong dimensions !!!");
		} else if (Number.isNaN(X[0][0])) {
			console.log("no solutions !!!");
		} else  if (X.length > 1) {
			console.log("many solutions !!!");
		} else if (X.length == 1) {
			console.log("one solution !!!");
			this.coefs = X[0];
			this.coefs.pop();
			//throw("hi");
		} else {
			console.error("what happened !!!");
		}
		this.#padCoefs();
	}

	#getMaxErr(coefs, fun, xRange) {
		const samples = 200;
		let maxE = 0;
		for (let x = xRange[0] + 1 / samples; x < xRange[1]; x += 1 / samples) {
			const math = fun(x);
			const calc = poly.calc(coefs, x);
			const E = Math.abs(calc - math);
			if (E > maxE) {
				maxE = E;
			}
		}
		return maxE;
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
		this.startCenter = [0, 1];
		this.startZoom = .25;

		// init coefs
		this.numNodes = 10;
		this.numCoefs = 8;
		this.#genChebyCoefs();
		this.coefs = Array(this.maxCoefs).fill(0);
		this.roots = []; // extrema
		this.Err = 0;
		this.errMag = 0;
		this.sliderStep = 1 / 256;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		makeEle(this.vp, "button", null, null, "Random color", this.#randomColor.bind(this));
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "button", null, null, "Calc coefs taylor", v => 
		{
			this.#calcCoefsTaylor();
			this.roots = [];
			this.#updateSliders();
		});
		makeEle(this.vp, "button", null, null, "Calc coefs cheb", v => 
		{
			this.#calcCoefsCheb(this.curFun.fun, this.curFun.xRange, this.numNodes, this.numCoefs);
			this.roots = [];
			this.#updateSliders();
		});
		makeEle(this.vp, "button", null, null, "Calc remez, extrema", v => 
		{
			this.#calcCoefsRemezExtrema(this.curFun.xRange);
			this.#updateSliders();
		});
		makeEle(this.vp, "button", null, null, "Guess remez, extrema", v => 
		{
			this.#guessCoefsRemezExtrema(this.curFun.xRange, this.numCoefs);
			this.#updateSliders();
		});
		makeEle(this.vp, "button", null, null, "Calc remez coefs, solve poly", v => 
		{
			this.#calcCoefsRemezSolvePoly(this.curFun.fun, this.roots, this.numCoefs);
			//this.roots = [];
			this.#updateSliders();
		});
		makeEle(this.vp, "button", null, null, "Reset coefs", v => 
		{
			this.coefs.fill(0);
			this.roots = [];
			this.#updateSliders();
			this.#updateFuns();
		});
		{
			const label = "NumNodes";
			const min = 1;
			const max = 10;
			const start = this.numNodes;
			const step = 1;
			const precision = 0;
			this.eles[label] = new makeEleSliderCombo(this.vp, label, min, max, start, step, precision,
				(v) => {
					this.numNodes = v;
					console.log("callback val = " + v);
				}, null, false);
		}
		{
			const label = "NumCoefs";
			const min = 1;
			const max = this.maxCoefs;
			const start = this.numCoefs;
			const step = 1;
			const precision = 0;
			this.eles[label] = new makeEleSliderCombo(this.vp, label, min, max, start, step, precision,
				(v) => this.numCoefs = v, null, false);
		}
		makeEle(this.vp, "hr");
		for (let i = 0; i < this.maxCoefs; ++i) {
			const label = "C" + i;
			const min = -20;
			const max = 20;
			const start = 0;
			const step = this.sliderStep;
			const precision = 5;
			this.eles[label] = new makeEleSliderCombo(this.vp, label, min, max, start, step, precision,
				(v) => {
					this.dirty = true;
					this.coefs[i] = v;
					this.#updateFuns();
				}, null, false
			);
			makeEle(this.vp, "hr");
		}
		makeEle(this.vp, "pre", null, null, "function");
		makeSelect(this.vp, this.funNames, (v) => 
		{
			this.curFunIdx = v; 
			this.curFun = this.funs[this.curFunIdx];
			this.coefs.fill(0);
			this.#updateSliders();
		}, this.curFunIdx);
		{
			const label = "ErrorMagnification";
			const min = 0;
			const max = 24;
			const start = this.errMag;
			const step = .05;
			const precision = 2;
			this.eles[label] = new makeEleSliderCombo(this.vp, label, min, max, start, step, precision
				, v => this.errMag = v // update
				, val => Math.pow(2, val) // conversion
				, false
			);
		}
		makeEle(this.vp, "button", null, null, "num nodes = 7", () => {
			this.numNodes = 7.2;
			this.eles.NumNodes.setValue(7.2, false);
		});
	}	
	
	#updateSliders() {
		for (let i = 0; i < this.maxCoefs; ++i) {
			const label = "C" + i;
			this.eles[label].setValue(this.coefs[i], false);
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
		this.AvgFps = this.AvgFpsObj.add(this.fps);
		this.Err = 33;
	}

	#userDraw() {
		// draw range of cheby or remez sample
		const xRange = this.curFun.xRange;
		this.drawPrim.drawLine([xRange[0], -200], [xRange[0], 200], .02, "brown");
		this.drawPrim.drawLine([xRange[1], -200], [xRange[1], 200], .02, "brown");

		// draw coefs
		if (this.polyFun) {
			this.drawFun.changeFunctionG(this.polyFun);
			this.drawFun.draw(false, 400, 0, "green", .01);
		}

		// draw current function
		this.drawFun.changeFunctionG(x => this.curFun.fun(x));
		this.drawFun.draw(false, 400, 0, "red", .005);

		if (this.deltaFun) {
			this.drawFun.changeFunctionG(x => this.deltaFun(x) * this.errMag);
			this.drawFun.draw(false, 400, 0, "#00f", .005);
		}
		if (this.dDeltaFun) {
			this.drawFun.changeFunctionG(x => this.dDeltaFun(x) * this.errMag);
			this.drawFun.draw(false, 400, 0, "#080", .005);
		}

		// draw tangent lines
		const x = this.plotter2d.userMouse[0];
		let p = [x, this.deltaFun(x) * this.errMag];
		let slope = this.dDeltaFun(x) * this.errMag;
		let left = [p[0] - .5, p[1] - .5 * slope];
		let right = [p[0] + .5, p[1] + .5 * slope];
		this.drawPrim.drawCircle(p, .025, "green");
		this.drawPrim.drawLine(left, right, .00625, "blue");

		// draw extrema
		for (const root of this.roots) {
			const y = this.deltaFun(root) * this.errMag;
			const spread = .75;
			this.drawPrim.drawCircleO([root, y], .025, .01, "green");
			this.drawPrim.drawLine([root - spread, y], [root + spread, y], .006, "darkgreen");
			this.drawPrim.drawLine([root, y - spread], [root, y + spread], .006, "darkred");
			this.drawPrim.drawCircle([root, 0], .02, "red");
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\nAvg fps = " + this.AvgFps.toFixed(2);

		this.Err = this.#getMaxErr(this.coefs, this.curFun.fun, this.curFun.xRange);

		infoStr += "\nMax Error = " + this.Err.toFixed(9);
		this.eles.textInfoLog.innerText = infoStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.LEFT) || this.dirty;
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
