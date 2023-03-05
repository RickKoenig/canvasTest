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
		//this.pnts = [[0, 0], [7/8, 1/8], [1, 1], [9/8, 1/8], [2, 0]];
		this.pnts = [[3, 2], [4, 4], [5, 3], [6,-1]];
		this.pnts2 = [[1, 1], [3, 1]];
		this.newpnts = new Array(this.pnts2.length);
		// interactive edit of points
		this.editPnts = new EditPnts(this.pnts, this.pntRad);
		this.editPnts2 = new EditPnts(this.pnts2, this.pnt2Rad);

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
			const start = 1;
			const step = 1;
			const precision = 0;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,  (v) => {
				this.depth = v;
				this.dirty = true;});
			// end depth UI
		}
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Show all levels");
		this.eles.showAllLevels = makeEle(this.vp, "input", "showAllLevels", null, "ho", () => this.dirty = true, "checkbox");
		this.eles.showAllLevels.checked = true;
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Show edit points");
		this.eles.showEditPoints = makeEle(this.vp, "input", "showEditPoints", null, "ho", () => this.dirty = true, "checkbox");
		this.eles.showEditPoints.checked = true;
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
		this.dirty = this.editPnts2.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
	}

	#buildMat(pIn, pOut) {
		//let matA = mat2.create();
		//let matB = mat2.create();
		let pInR = vec2.create();
		vec2.perp(pInR, pIn);
		let pOutR = vec2.create();
		vec2.perp(pOutR, pOut);
		//matA[0] = 
		let matA= [pIn[0], pIn[1], pInR[0], pInR[1]];
		mat2.invert(matA, matA);
		let matB= [pOut[0], pOut[1], pOutR[0], pOutR[1]];
		let matP = mat2.create();
		mat2.mul(matP, matB, matA);
		//matA[0] = 10;
		//matA[3] = 100;
		return matP;
	}

	#testBuildMat() {
		let pntsOff = vec2.create();
		let pnts2Off = vec2.create();
		vec2.sub(pntsOff, this.pnts[this.pnts.length - 1], this.pnts[0]);
		vec2.sub(pnts2Off, this.pnts2[1], this.pnts2[0]);
		let mat = this.#buildMat(pntsOff, pnts2Off);
		/*const testPnts = [
			[1, 0],
			[0, 1],
			
			[0, 0],
			[-1, 2],
			[1, -2], 
			[1, 2], 
			[-1, -2],
			[2, 1],
			[2, -1],
			[-2, 1],
			[-2, -1],
		];
		*/
		for (let i = 0; i < this.pnts.length; ++i) {
			let pIn = vec2.clone(this.pnts[i]);
			vec2.sub(pIn, pIn, this.pnts[0]);
			let pOut = vec2.create();
			vec2.transformMat2(pOut, pIn, mat);
			//console.log("pin = " + vec2.str(pIn) + " pout = " + vec2.str(pOut));
			vec2.add(pOut, pOut, this.pnts2[0]);
			this.newpnts[i] = pOut;
		}
		/*
		for (let i = 0; i < this.pnts.length; ++i) {
			let inPnt = this.pnts[i];
			let outPnt = vec2.fromValues(inPnt[0] + .25, inPnt[1] + .25);
			this.newpnts[i] = outPnt;
		}*/
	}
/*
	#testLog(pntsOff, pnts, level) {
		console.log("level " + level);
		for (let i = 0; i < pnts.length - 1; ++i) {
			const p0 = pnts[i];
			const p1 = pnts[i + 1];
			console.log("p0 = " + vec2.str(pnts[i]) + " p1 = " + vec2.str(pnts[i + 1]));
			let p0r = vec2.clone(p0);
			vec2.perp(p0r, p0r);
			let mat0 = mat2.clone([3, 4, 5, 6]);
			console.log("mat0 = " + mat0);
			for (let i = 0; i < pntsOff.length; ++i) {
				console.log("pntOff[" + i + "] = " + vec2.str(pntsOff[i]));
			}
		}
	}
*/
	#drawFractal(pntsOff, pnts, level) {
		if (level <= 0) {
			return; // nothing to draw
		}
		//this.#testLog(pntsOff, pnts, level);
		for (let i = 0; i < pnts.length - 1; ++i) {
			const p0 = pnts[i];
			const p1 = pnts[i + 1];
			if (this.eles.showAllLevels.checked || level == 1) {
				this.drawPrim.drawLine(p0, p1, .005, "black");
			}
			if (level > 1) {
				// go deeper
				const deepPnts = [];
				for (let j = 0; j < pnts.length; ++j) {
					const pd = vec2.clone(pnts[j]);
					vec2.scale(pd, pd, .25);
					let p = vec2.clone(p0);
					vec2.add(p, p, pd);
					deepPnts.push(p);
				}
				this.#drawFractal(pntsOff, deepPnts, level - 1);
			}
		}
	}

	#userDraw() {
		// draw with hilits on some points
		if (this.eles.showEditPoints.checked) {
			const hilitPntIdx = this.editPnts.getHilitIdx();
			for (let i = 0; i < this.pnts.length; ++i) {
				this.drawPrim.drawCircle(this.pnts[i], this.pntRad, "green");
				let doHilit = i == hilitPntIdx;
				this.drawPrim.drawCircleO(this.pnts[i], this.pntRad, .01, doHilit ? "yellow" : "black");
			}
		}
		this.drawPrim.drawCircle(this.pnts2[0], this.pnt2Rad, "green");
		this.drawPrim.drawCircle(this.pnts2[1], this.pnt2Rad, "green");
		this.drawPrim.drawLine(this.pnts2[0], this.pnts2[1], .02, "blue");
		this.#drawFractal(this.pntsOff, this.pnts, this.depth);
		this.#testBuildMat();
		/*for (let i = 0; i < this.newpnts.length; ++i) {
			this.drawPrim.drawCircle(this.newpnts[i], this.pntRad, "green");
			//let doHilit = i == hilitPntIdx;
			//this.drawPrim.drawCircleO(this.newpnts[i], this.pntRad, .01, doHilit ? "yellow" : "black");
		}*/

		//drawLinesParametric(pnts, close = false, lineWidth = .01, circleSize = .01
		//	, lineColor = "black", circleColor = "red", ndcScale = false) {
		this.drawPrim.drawLinesParametric(this.newpnts, false, .75 * this.pnt2Rad, this.pnt2Rad);
			//for (let i = 0; i < this.newpnts.length - 1; ++i) {
			//this.drawPrim.drawLine(this.newpnts[i], this.newpnts[i + 1], .03, "blue");
			//let doHilit = i == hilitPntIdx;
			//this.drawPrim.drawCircleO(this.newpnts[i], this.pntRad, .01, doHilit ? "yellow" : "black");
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
