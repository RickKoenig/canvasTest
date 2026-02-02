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

		this.funs = [
			{
				tayCoef: [-10, 1, 2, 1 / 3, 0, 0, 0, 0],
				fun: null, // set later
				xRange: [-1, 3],
				name: "testPoly"
			},
			{
				fun: Math.sin,
				xRange: [0, Math.PI / 2],
				tayCoef: [0, 1, 0, -1 / 6, 0, 1 / 120, 0, -1 / 5040],
				name: "sin"
			},
			{
				fun: Math.tan,
				xRange: [0, Math.PI / 4],
				tayCoef: [0, 1, 0, 1 / 3, 0, 2 / 15, 0, 17 / 315],
				name: "tan"
			},
			{
				fun: Math.asin,
				xRange: [0, 1],
				tayCoef: [0, 1, 0, 1 / 6, 0, 3 / 40, 0, 5 / 112],
				name: "asin"
			},
			{
				fun: Math.atan,
				xRange: [0, 1],
				tayCoef: [0, 1, 0, -1 / 3, 0, 1 / 5, 0, -1 / 7],
				name: "atan"
			}
		];
		// bind some functions
		this.funs[0].fun = poly.calc.bind(null, this.funs[0].tayCoef),

		// current function
		this.curFunIdx = 0;
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

	#calcCoefsTaylor() {
		this.coefs = this.curFun.tayCoef.slice();
	}

	// we'll see ...
	#calcCoefsCheb() {
		this.coefs = [.1, .2, .3, .4, .5, .6, .7, .8];
	}

	#testCheby() {
		console.log("test cheby");
		const testFun = this.funs[0].fun
		const x = 1;
		const y = testFun(x);
		console.log("x = " + x + ", y = " + y);
		// calc nodes
		const N = 5;
		console.log("");
		const us = [];
		for (let i = 0; i < N; ++i) {
			const u = -Math.cos((i + 1 / 2)/ N * Math.PI);
			us.push(u);
		}
		const xs = [];
		const xRange = this.funs[0].xRange;
		for (let i = 0; i < N; ++i) {
			const u = us[i];
			// go from u = [-1, 1], to xRange
			const x = (xRange[1] - xRange[0]) / 2 * u
				+ (xRange[0] + xRange[1]) / 2;
			xs.push(x);
		}
		const ys = [];
		for (let i = 0; i < N; ++i) {
			const x = xs[i];
			const y = testFun(x);
			ys.push(y);
		}

		console.log("us = " + us);
		console.log("xs = " + xs);
		console.log("ys = " + ys);
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		this.#testCheby();
		// user init section
		// measure frame rate
		this.fps;
		this.AvgFps = 0;
		this.oldTime; // for delta time
		this.AvgFpsObj = new Runavg(500);

		// position graphics
		this.startCenter = [0, -5];
		this.startZoom = .125;

		// init coefs
		this.numCoefs = 8;
		this.coefs = Array(this.numCoefs).fill(0);
		this.Err = 0;
		this.sliderMul = 32768;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		makeEle(this.vp, "button", null, null, "Random color", this.#randomColor.bind(this));
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "button", null, null, "Calc coefs taylor", v => 
		{
			this.#calcCoefsTaylor();
			this.#updateSliders();
		});
		makeEle(this.vp, "button", null, null, "Calc coefs cheb", v => 
		{
			this.#calcCoefsCheb();
			this.#updateSliders();
		});
		makeEle(this.vp, "button", null, null, "Reset coefs", v => 
		{
			this.coefs.fill(0);
			this.#updateSliders();
		});
		makeEle(this.vp, "hr");
		for (let i = 0; i < this.numCoefs; ++i) {
			const label = "C" + i;
			const min = -20;
			const max = 20;
			const start = 0;
			const step = 1 / this.sliderMul;
			const precision = 5;
			this.eles[label] = new makeEleSliderCombo(this.vp, label, min, max, start, step, precision,
				(v) => {
					this.dirty = true;
					this.coefs[i] = v;
				}, null, false
			);
			makeEle(this.vp, "hr");
		}
		const funNames = [];
		for (const curFun of this.funs) {
			funNames.push(curFun.name);
		}
		makeEle(this.vp, "pre", null, null, "function");
		makeSelect(this.vp, funNames, (v) => 
		{
			this.curFunIdx = v; 
			this.curFun = this.funs[this.curFunIdx];
			this.coefs = [0, 0, 0, 0];
			this.#updateSliders();
		});
	}	
	
	#updateSliders() {
		for (let i = 0; i < this.numCoefs; ++i) {
			const label = "C" + i;
			this.eles[label].setValue(this.coefs[i]);
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

		// draw taylor
		this.drawFun.changeFunctionG(x => poly.calc(this.coefs, x));
		this.drawFun.draw(false, 400, 0, "green", .04);

		// draw current function
		this.drawFun.changeFunctionG(x => this.curFun.fun(x));
		this.drawFun.draw(false, 400, 0, "red", .02);
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\nAvg fps = " + this.AvgFps.toFixed(2);
		infoStr += "\nError = " + this.Err.toFixed(6);
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
