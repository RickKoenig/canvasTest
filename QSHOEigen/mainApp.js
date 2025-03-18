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

	// USER: add more members or classes to MainApp
	static diffEqSHO(f, x, q) {
		const E = q + 1 / 2;
		return .5 * calculus.diff2(f, x, q) + (E - .5 * x * x) * f(x, q);
	}

	// check validity of differential equations
	#setupEigen() {
		MainApp.genSHO = new makeFunSHO(this.maxQNum);
		MainApp.funSHO = MainApp.genSHO.getFun();

		const xStart = -10;
		const xEnd = 10;
		const numSteps = 1000;

		for (let q = 0; q <= this.maxQNum; ++q) {

			//console.log("test diffeq");
			let maxErr = 0;
			let errorStr = "";
			for (let i = 0; i <= numSteps; ++i) {
				const x = xStart + i * (xEnd - xStart) / numSteps;
				const error = MainApp.diffEqSHO(MainApp.funSHO, x,  q);
				const absErr = Math.abs(error);
				if (absErr > maxErr) {
					maxErr = absErr;
				}
				const errThresh = 10;
				if (false) {
				//if (Math.abs(error) >= errThresh) {
					const fx = MainApp.funSHO(x, q);
					errorStr += "\n\tx = " + x.toFixed(3).padStart(8) 
						+ ", fx = " + fx.toFixed(4).padStart(9)
						+ ", error = " + error.toFixed(8).padStart(11);
				}
			}
			
			// calc area
			//console.log("test area");
			const area = calculus.calcAreaS(MainApp.funSHO, true, q, xStart, xEnd, numSteps);
			console.log("Qnum = " + q.toString().padStart(3) + ", Max Error = " + maxErr.toFixed(6).padStart(8) + " Area = " + area.toFixed(6).padStart(8) + errorStr);
		}
	}

	#calcParaCoef(p0, ph, p1) {
		const a = 2 * (p1 + p0) - 4 * ph;
		const b = 4 * ph - 3 * p0 - p1;
		const c = p0;
		return [a, b, c];
	}

	#quad(a, b, c, x) {
		return x * (a * x + b) + c;
	}

	#testArea() {
		console.log("test area");
		const area = calculus.calcAreaS((x) => x * x, false, null, 2, 3, 10);
		console.log("area = " + area);
		console.log("test parabola");
		const Ypnts = [11, 13, 17];
		const arr = this.#calcParaCoef(...Ypnts);
		let [a,b,c] = arr;
		for (let i = 0; i <= 10; ++i) {
			const x = i / 10;
			const y = this.#quad(a, b, c, x);
			console.log("x = " + x.toFixed(4).padStart(7) + ", y = " + y.toFixed(4).padStart(7));
		}
		console.log("Ypoints " + Ypnts[0] + " " + Ypnts[1] + " " + Ypnts[2]);
		console.log("coefs " + a + " " + b + " " + c);
	}

	#userInit() {
		// user init section
		this.maxQNum = 57;
		this.startQNum = 0;
		this.curQnum = 0; // internal Q starts at 0
		this.numDrawSteps = 400; // 'numSteps + 1' points
		this.minXDraw = -14;
		this.maxXDraw = 14;
		this.#setupEigen();

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .25;
		this.#testArea();
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
		{
			const label = "QNum";
			const min = 1;
			const max = this.maxQNum + 1;
			const start = this.startQNum + 1;
			const step = 1;
			const precision = 0;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,
				(v) => {
					this.curQnum = v - 1;
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
	}

	#userDraw() {
		this.energy = MainApp.genSHO.getEnergy(this.curQnum);
		const funArr2 = calculus.funToArray(MainApp.funSHO, this.curQnum, this.minXDraw, this.maxXDraw, this.numDrawSteps, true);
		const funArr = calculus.funToArray(MainApp.funSHO, this.curQnum, this.minXDraw, this.maxXDraw, this.numDrawSteps);
		this.drawPrim.drawLinesSimple(funArr, undefined, undefined, this.minXDraw, (this.maxXDraw - this.minXDraw) / (funArr.length - 1), "red");
		this.drawPrim.drawLinesSimple(funArr2, undefined, undefined, this.minXDraw, (this.maxXDraw - this.minXDraw) / (funArr.length - 1), "blue");
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Avg fps = " + this.avgFps.toFixed(2);
		infoStr += "\nEnergy level = " + this.energy;
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
