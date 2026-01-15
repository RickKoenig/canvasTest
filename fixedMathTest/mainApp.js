'use strict';

// do a consistent fixed point system in javascript

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp.numInstances;
	}

	mul(a, b) {
		return a * b;
	}

	constructor() {
		console.log("\n############# creating instance of MainApp");
		++MainApp.numInstances;

		this.doChebyshev = true;
		this.xRange = [0, Math.PI / 2];
		//this.xRange = [0, 1];
		//this.fun = Math.atan;
		//this.fun = (x) => Math.sin(x * (Math.PI / 2));
		this.fun = Math.sin;
		//unitTest(4, 12, 4, false, this.doChebyshev, this.xRange[0], this.xRange[1]); // false
		unitTest(3, 12, 5, false, this.doChebyshev, this.xRange[0], this.xRange[1]); // false

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

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		// measure frame rate
		this.fps;
		this.AvgFps = 0;
		this.oldTime; // for delta time
		this.AvgFpsObj = new Runavg(500);

		// position graphics
		this.startCenter = [0, 0];
		this.startZoom = .7;
		this.pos = [0, 0];

		// init coefs
		this.coefs = [0, 0, 0, 0];
		this.cbCoefs = [0, 0, 0, 0];
		this.Err = 0;
		this.res = 32;
		this.sliderMul = 1024;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		makeEle(this.vp, "button", null, null, "Random color", this.#randomColor.bind(this));
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "button", null, null, "Calc coefs", v => 
		{
			makeCalcCoefs2(this.cbCoefs, this.doChebyshev, this.fun, this.xRange[0], this.xRange[1]);
			this.#updateSliders();
			this.coefs = chebyToRawCoefs(this.cbCoefs);
			convertCoefs(this.coefs, this.xRange[0], this.xRange[1]);
		});
		makeEle(this.vp, "hr");
		for (let i = 0; i < 4; ++i) {
			const label = "C" + (1 + 2 * i);
			const min = -2;
			const max = 2;
			const start = 0;
			const step = 1 / (this.res * this.sliderMul);
			const precision = 5;
			this.eles[label] = new makeEleCombo(this.vp, label, min, max, start, step, precision,
				(v) => {
					this.dirty = true;
					this.cbCoefs[i] = v;
					this.coefs = chebyToRawCoefs(this.cbCoefs);
					convertCoefs(this.coefs, this.xRange[0], this.xRange[1]);
				}
			);
			makeEle(this.vp, "hr");
		}
	}	
	
	#updateSliders() {
		for (let i = 0; i < 4; ++i) {
			const label = "C" + (1 + 2 * i);
			this.eles[label].setValue(this.cbCoefs[i]);
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
		this.Err = getMaxErr(this.coefs, false, this.fun, this.xRange[0], this.xRange[1]);
	}

	#userDraw() {
		function normAngOne(a) {
			let neg = a < 0;
			let na = neg ? -a : a;
			na %= 4;
			if (na >= 3) {
				na -= 4;
			} else if (na >= 1) {
				na = 2 - na;
			}
			if (neg) {
				na = -na;
			}
			return na;
		}
		this.drawFun.changeFunctionG(normAngOne);
		this.drawFun.draw(false, 500, 0, "darkmagenta", .01);
		this.drawFun.changeFunctionG((x) => this.fun(x));
		this.drawFun.draw(false, 400, 0, "red", .002);
		this.drawFun.changeFunctionG(calcCoef.bind(this, this.coefs, false));
		this.drawFun.draw(false, 400, 0, "green", .0014);
		this.drawPrim.drawCircleO([this.coefs[2], this.coefs[3]], 1.5 / this.res, .125 / this.res, "green"); // cursor
		this.drawPrim.drawCircleO(this.coefs, 1.5 / this.res, .125 / this.res, "red"); // cursor
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\nAvg fps = " + this.AvgFps.toFixed(2);
		const fix = 9;
		const rawCoefs = this.coefs;//chebyToRawCoefs(this.coefs);
		infoStr += "\nX1 = " + rawCoefs[0].toFixed(fix)
			+ "\nX3 = " + rawCoefs[1].toFixed(fix)
			+ "\nX5 = " + rawCoefs[2].toFixed(fix)
			+ "\nX7 = " + rawCoefs[3].toFixed(fix)
		infoStr += "\nError = " + this.Err.toFixed(6);
		infoStr += "\nrange = " + this.xRange[0].toFixed(5) + ", " + this.xRange[1].toFixed(5);
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
