'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	constructor() {
		console.log("creating instance of MainApp");
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
		//this.fixedSize = [800, 600];
		this.fixedSize = null;
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, this.vp, this.startCenter, this.startZoom, this.fixedSize);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.#animate();
	}




	// USER: add more members or classes to MainApp
	#userInit() {
		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .98;

		// for sine wave like functions, add a phase to the input of the function(s)
		this.phase = 0; // [0 to 2 * PI)
		this.minPhase = 0;
		this.maxPhase = Math.PI * 2;
		this.stepPhase = .0005;

		this.fpsScreen = 60;

		this.freq = 0;
		this.minFreq = -2;
		this.maxFreq = 2;
		this.stepFreq = .01;

		// linestep
		this.minLineStep = 0;
		this.maxLineStep = 200;
		this.startLineStep = 8;

	}

	#userBuildUI() {
		if (!this.vp) {
			return;
		}
		// elements
		this.eles = {};
		makeEle(this.vp, "hr");
		this.eles.quantInfo = makeEle(this.vp, "pre", null, null, "quantInfo");

		// line step slider combo
		{
			makeEle(this.vp, "hr");
			// start lineStep UI
			const label = "Line step";
			const min = this.minLineStep;
			const max = this.maxLineStep;
			const start = this.startLineStep;
			const step = 1;
			const precision = 0;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,  (v) => {this.numSteps = v});
			// end lineStep UI
		}

		// phase slider combo
		makeEle(this.vp, "hr");
		{
			// start phase UI
			const label = "Phase (p)";
			const min = this.minPhase;
			const max = this.maxPhase;
			const start = 0;
			const step = this.stepPhase;
			const precision = 2;
			this.phaseCombo = new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => {this.phase = v});
			// end phase UI
		}
	
		// frequency slider combo
		{
			// start freq UI
			const label = "Frequency";
			const min = this.minFreq;
			const max = this.maxFreq;
			const start = 0;
			const step = this.stepFreq;
			const precision = 2;
			new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => {this.freq = v});
			// end freq UI
		}
	}

	#userProc() {
		// proc
		// update phase given freq
		if (this.freq !== 0) {
			this.phase += this.freq * (this.maxPhase - this.minPhase) / this.fpsScreen;
			this.phase = normAngRadUnsigned(this.phase);
			this.phaseCombo.setValue(this.phase);
		}
		this.#buildFunData();
	}

	#userDraw() {
		this.#drawFunData();
	}

	#userUpdateInfo() {
		if (!this.vp) {
			return;
		}
		this.eles.quantInfo.innerText = "Quant INFO";
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#buildFunData() {
		this.funData = [];
		for (let i = 0; i <= this.numSteps; ++i) {
			const a = i * Math.PI / this.numSteps;
			const v = Math.sin(a) * Math.cos(this.phase);
			this.funData.push(v);
		}
	}

	#drawFunData() {
		this.drawPrim.drawLinesSimple(this.funData, undefined, undefined, -1, 2 / this.numSteps);
	}




	// process every frame
	#animate() {
		//  proc
		// update input system
		this.input.proc();
		// interact with mouse, calc all spaces
		this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT);
		this.#userProc();

		// draw
		this.plotter2d.clearCanvas();
		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);
		// now in user/cam space
		this.graphPaper.draw("X", "Y");
		// USER: do USER stuff
		this.#userDraw(); // draw

		// update UI, text
		this.#userUpdateInfo();

		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
