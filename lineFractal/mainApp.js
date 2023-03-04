'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	constructor() {
		console.log("build line fractal main app");
		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		//this.vp = null; // OR, no vertical panel UI
		this.eles = {}; // keep track of eles in vertical panel

		// add all elements from vp to ele if needed
		// uncomment if you need elements from vp html
		//populateElementIds(this.vp, this.eles);

		// USER before UI built
		this.#userInit();

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

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
	#userInit() {
		// user init section
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.pntRad = .02; // size of point
		this.pnts = [[0, 0], [7/8, 1/8], [1, 1], [9/8, 1/8], [2, 0]];

		// interactive edit of points
		this.editPnts = new EditPnts(this.pnts, this.pntRad);

		// before firing up Plotter2d
		this.startCenter = [.5, .5];
		this.startZoom = .5;
	}

	#calcFractalDimension(pnts) {
		return pnts.length * 1.1;

	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		// line step slider combo
		{
			makeEle(this.vp, "hr");
			// start depth UI
			const label = "Fractal depth";
			const min = 0;
			const max = 8;
			const start = 2;
			const step = 1;
			const precision = 0;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,  (v) => {
				this.depth = v;
				this.dirty = true;});
			// end depth UI
		}
	}		
	
	#userProc() {
		// proc
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
		// pass in the buttons and the user/cam space mouse from drawPrim
		this.dirty = this.editPnts.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
	}

	#drawFractal(pnts, level) {
		//this.depth;
		// draw lines between points
		if (level > 0) {
			for (let i = 0; i < pnts.length - 1; ++i) {
				const p0 = pnts[i];
				const p1 = pnts[i + 1];
				this.drawPrim.drawLine(p0, p1, .005, "black");
				const deepPnts = [];
				for (let j = 0; j < pnts.length; ++j) {
					const pd = vec2.clone(pnts[j]);
					vec2.scale(pd, pd, .25);
					let p = vec2.clone(p0);
					vec2.add(p, p, pd);
					deepPnts.push(p);
				}
				this.#drawFractal(deepPnts, level - 1);
				//midPnt(mid, p0, p1);
				//this.drawPrim.drawCircleO(mid, .05, undefined, "magenta");
			}
		}
	}

	#userDraw() {
		// draw with hilits on some points
		const hilitPntIdx = this.editPnts.getHilitIdx();
		for (let i = 0; i < this.pnts.length; ++i) {
			this.drawPrim.drawCircle(this.pnts[i], this.pntRad, "green");
			let doHilit = i == hilitPntIdx;
			this.drawPrim.drawCircleO(this.pnts[i], this.pntRad, .01, doHilit ? "yellow" : "black");
		}
		this.#drawFractal(this.pnts, this.depth);
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		this.fractalDimension = this.#calcFractalDimension(this.pnts);
		let countStr = "Dirty Count = " + this.dirtyCount;
		countStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		countStr += "\nFractal dimension = " + this.fractalDimension.toFixed(3);
		countStr += "\nFractal draw depth = " + this.depth;
		this.eles.textInfoLog.innerText = countStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT) || this.dirty;
		// USER: do USER stuff
		this.#userProc(); // proc

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
