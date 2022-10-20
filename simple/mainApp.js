'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #numInstances = 0; // test static members

	static getNumInstances() { // test static methods
		return MainApp.#numInstances;
	}

	constructor() {
		console.log("creating instance of MainApp");
		++MainApp.#numInstances;

		// vertical panel UI
		const vp = document.getElementById("verticalPanel");

		// USER:
		this.#userInit();

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, vp, this.startCenter, this.startZoom);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		 // add all elements from vp to ele if needed
		// uncomment if you need elements from vp
		/*
		this.ele = {};
		populateElementIds(vp, this.ele);
		*/

		// start it off
		this.#animate();
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		this.numPnts = 5;
		this.pntRad = .05; // size of point
		this.pnts = createArray(this.numPnts, 2); // array of 'two' dimensional points
		for (let i = 0; i < this.numPnts; ++i) {
			this.pnts[i] = [.25 + .5 * i, .5 + .25 * i];
		}

		this.numPnts2 = 3;
		this.pntRad2 = .15; // size of point
		this.pnts2 = createArray(this.numPnts2, 2); // array of 'two' dimensional points
		for (let i = 0; i < this.numPnts2; ++i) {
			this.pnts2[i] = [.25 + .5 * i, 1.5 + .25 * i];
		}
		// interactive edit of points
		this.editPnts = new EditPnts(this.pnts, this.pntRad);
		this.editPnts2 = new EditPnts(this.pnts2, this.pntRad2);

		// before firing up Plotter2d
		this.startCenter = [.5, .5];
		this.startZoom = .5;
	}

	#userProc() {
		// proc
		// pass in the buttons and the user/cam space mouse from drawPrim
		this.editPnts.proc(this.input.mouse, this.plotter2d.userMouse);
		this.editPnts2.proc(this.input.mouse, this.plotter2d.userMouse);


		// draw with hilits on some points
		const hilitPntIdx = this.editPnts.getHilitIdx();
		for (let i = 0; i < this.numPnts; ++i) {
			this.drawPrim.drawCircle(this.pnts[i], this.pntRad, "green");
			let doHilit = i == hilitPntIdx;
			this.drawPrim.drawCircleO(this.pnts[i], this.pntRad, .01, doHilit ? "yellow" : "black");
		}
		// draw some extra stuff like lines and midpoints
		for (let i = 0; i < this.numPnts; ++i) {
			const p0 = this.pnts[i];
			const p1 = this.pnts[(i + 1) % this.numPnts];
			this.drawPrim.drawLine(p0, p1, "darkgray");
			const mid = midPnt(p0, p1);
			this.drawPrim.drawCircleO(mid, .05, undefined, "magenta");
		}

		// draw with hilits on some points2
		const hilitPntIdx2 = this.editPnts2.getHilitIdx();
		for (let i = 0; i < this.numPnts2; ++i) {
			this.drawPrim.drawCircle(this.pnts2[i], this.pntRad2, "green");
			let doHilit = i == hilitPntIdx2;
			this.drawPrim.drawCircleO(this.pnts2[i], this.pntRad2, .01, doHilit ? "yellow" : "black");
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
	}

	// proc
	#animate() {
		// update input system
		this.input.proc();
		// interact with mouse, calc all spaces
		this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT);
		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);
		// now in user/cam space
		this.graphPaper.draw("X", "Y");
		// keep animation going
		requestAnimationFrame(() => this.#animate());

		// USER: do USER stuff
		this.#userProc(); // proc and draw
		// update UI, text
		this.#userUpdateInfo();
	}
}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
