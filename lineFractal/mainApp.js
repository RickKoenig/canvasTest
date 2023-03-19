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

		this.pntRad = .04; // size of point
		this.pnt2Rad = .1; // size of point
		this.pnts = [[1/4, 1/4], [9/8, 1/4], [5/4, 5/4], [11/8, 1/4], [9/4, 1/4]];
		const minPnts = 0;
		const maxPnts = 20;
		// interactive edit of points
		this.editPnts = new EditPnts(this.pnts, this.pntRad, false, minPnts, maxPnts);

		// before firing up Plotter2d
		this.startCenter = [1, .5];
		this.startZoom = 1;
	}

	#calcFractalDimension(pnts) {
		// TODO: works for equal line segments lengths, make work in general case
		if (pnts.length <= 1) {
			return 0;
		}
		if (pnts.length == 2) {
			return 1;
		}
		const first = pnts[0];
		const next = pnts[1];
		const last = pnts[pnts.length - 1];
		const lenOverall = vec2.dist(first, last);
		const lenFirst = vec2.dist(first, next);
		let lenDeeper = 0;
		for (let i = 0; i < pnts.length - 1; ++i) {
			const lenSegment = vec2.dist(pnts[i], pnts[i + 1]);
			lenDeeper += lenSegment;
		}
		return Math.log(lenDeeper / lenFirst) / Math.log(lenOverall / lenFirst);
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
			const start = 4;
			const step = 1;
			const precision = 0;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,  (val) => {
				this.depth = val;
				this.dirty = true;});
			// end depth UI
		}
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Show all levels");
		this.eles.showAllLevels = makeEle(this.vp, "input", "showAllLevels", null, "ho", () => this.dirty = true, "checkbox");
		this.eles.showAllLevels.checked = false;
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Show edit points");
		this.eles.showEditPoints = makeEle(this.vp, "input", "showEditPoints", null, "ho", () => this.dirty = true, "checkbox");
		this.eles.showEditPoints.checked = true;
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Add remove points");
		this.eles.addRemovePoints = makeEle(this.vp, "input", "addRemovePoints", null, "ho", (v) => {
			this.dirty = true;;
			this.editPnts.setAddRemove(v);
		}, "checkbox");
		this.eles.addRemovePoints.checked = false;
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Show graph paper");
		this.eles.showGraphPaper = makeEle(this.vp, "input", "showGraphPaper", null, "ho", () => this.dirty = true, "checkbox");
		this.eles.showGraphPaper.checked = true;
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

	#buildMat(pIn, pOut) {
		let pInR = vec2.create();
		vec2.perp(pInR, pIn);
		let pOutR = vec2.create();
		vec2.perp(pOutR, pOut);
		let matA= [pIn[0], pIn[1], pInR[0], pInR[1]];
		mat2.invert(matA, matA);
		let matB= [pOut[0], pOut[1], pOutR[0], pOutR[1]];
		let matP = mat2.create();
		mat2.mul(matP, matB, matA);
		return matP;
	}

	#drawFractal(pnts, level) {
		if (level <= 0) {
			return; // nothing to draw
		}
		for (let i = 0; i < pnts.length - 1; ++i) {
			const p0 = pnts[i];
			const p1 = pnts[i + 1];
			if (this.eles.showAllLevels.checked || level == 1) {
				this.drawPrim.drawLine(p0, p1, .005, "black");
			}
			if (level > 1) {
				// go deeper
				let pntsOff = vec2.create();
				let pnts2Off = vec2.create();
				vec2.sub(pntsOff, pnts[pnts.length - 1], pnts[0]);
				vec2.sub(pnts2Off, pnts[i + 1], pnts[i]);
				let mat = this.#buildMat(pntsOff, pnts2Off);
				const deepPnts = new Array(pnts.length);
				for (let j = 0; j < pnts.length; ++j) {
					let pIn = vec2.clone(pnts[j]);
					vec2.sub(pIn, pIn, pnts[0]);
					let pOut = vec2.create();
					vec2.transformMat2(pOut, pIn, mat);
					vec2.add(pOut, pOut, pnts[i]);
					deepPnts[j] = pOut;
		
				}
				this.#drawFractal(deepPnts, level - 1);
			}
		}
	}

	#userDraw() {
		// draw with hilits on some points
		if (this.eles.showEditPoints.checked) {
			this.editPnts.draw(this.drawPrim, this.plotter2d.userMouse);
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
			if (this.eles.showGraphPaper.checked) {
				this.graphPaper.draw("X", "Y");
			}
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
