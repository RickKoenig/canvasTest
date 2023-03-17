'use strict';

let codeWord;
function javaScriptTests() {
	// test out features of javascript here
	console.log("javacript tests!");
	//inheritanceTests();
	//codeWord = rudolphSim();
	//console.log("codeword = '" + codeWord + "'");
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp.#numInstances;
	}

	constructor() {
		javaScriptTests();
		console.log("\n############# creating instance of MainApp");
		++MainApp.#numInstances;

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
	#userInit() {
		const startAddRemovePoints = true;
		// user init section
		this.count = 0; // frame counter

		this.numPnts = 5;
		this.pntRad = .15; // size of point
		this.pnts = createArray(this.numPnts, 2); // array of 'two' dimensional points
		for (let i = 0; i < this.numPnts; ++i) {
			this.pnts[i] = [.25 + .5 * i, .5 + .25 * i];
		}

		this.numPnts2 = 6; // some more editable points, test add remove and generic draw
		this.pntRad2 = .05; // size of point
		this.pnts2 = createArray(this.numPnts2, 2); // array of 'two' dimensional points
		for (let i = 0; i < this.pnts2.length; ++i) {
			this.pnts2[i] = [.25 + .5 * i, 1.5 + .25 * i - .375 * (i % 2)];
		}
		// interactive edit of points
		this.editPnts = new EditPnts(this.pnts, this.pntRad);
		this.editPnts2 = new EditPnts(this.pnts2, this.pntRad2, startAddRemovePoints);

		// before firing up Plotter2d
		this.startCenter = [0, 1];
		this.startZoom = .5;
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
			const label = "test combo";
			const min = 33;
			const max = 87;
			const start = 44;
			const step = 3;
			const precision = 4;
			const callback = null;
			new makeEleCombo(this.vp, label, min, max, start, step, precision, callback);
		}
		makeEle(this.vp, "hr");
		makeEle(this.vp, "span", null, "marg", "Add remove points");
		this.eles.addRemovePoints = makeEle(this.vp, "input", "addRemovePoints", null, "ho", (val) => {
			console.log("checkbox addRemovePoints, value = " + val);
			this.editPnts2.setAddRemove(val);
			this.dirty = true;
		}, "checkbox");
		this.eles.addRemovePoints.checked = this.editPnts2.getAddRemove();
	}		
	
	#userProc() {
		// proc
		++this.count;
		// pass in the buttons and the user/cam space mouse from drawPrim
		this.dirty = this.editPnts.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
		this.dirty = this.editPnts2.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
	}

	#userDraw() {
		// draw with hilits on some points
		for (let i = 0; i < this.numPnts; ++i) {
			this.drawPrim.drawCircle(this.pnts[i], this.pntRad, "green");
			const hilitPntIdx = this.editPnts.getHilitIdx();
			let doHilit = i == hilitPntIdx;
			this.drawPrim.drawCircleO(this.pnts[i], this.pntRad, .01, doHilit ? "yellow" : "black");
		}
		// draw some extra stuff like lines and midpoints
		const mid = vec2.create();
		for (let i = 0; i < this.numPnts - 1; ++i) {
			const p0 = this.pnts[i];
			//const p1 = this.pnts[(i + 1) % this.numPnts];
			const p1 = this.pnts[i + 1];
			this.drawPrim.drawLine(p0, p1, "darkgray");
			midPnt(mid, p0, p1);
			this.drawPrim.drawCircleO(mid, .05, undefined, "magenta");
		}

		this.editPnts2.draw(this.drawPrim, this.plotter2d.userMouse);
		/*
		// draw with hilits on some points2
		const hilitPntIdx2 = this.editPnts2.getHilitIdx();
		for (let i = 0; i < this.numPnts2; ++i) {
			this.drawPrim.drawCircle(this.pnts2[i], this.pntRad2, "green");
			let doHilit = i == hilitPntIdx2;
			this.drawPrim.drawCircleO(this.pnts2[i], this.pntRad2, .01, doHilit ? "yellow" : "black");
		} */
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Frame Count = " + this.count;
		if (codeWord) {
			countStr += "\nCodeword = '" + codeWord + "'";
		}
		countStr += "\nDirty Count = " + this.dirtyCount;
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

	#resetCounter() {
		this.count = 0;
	}
}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
