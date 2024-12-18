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
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, /*this.vp*/null, this.startCenter, this.startZoom, this.fixedSize);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.#animate();
	}



////////// USER SECTION /////////
	#initEnergies() {
		this.maxQnum = 8;
		this.curQnum = 1; // 1 to maxQnum inclusive
		this.amps = new Array(this.maxQnum + 1).fill(0); // amps[0] is never used
		this.amps[1] = 10;
		this.amps[2] = 12;
		this.phases = new Array(this.maxQnum + 1).fill(0); // amps[0] is never used
		this.phases[1] = 45;
		this.phases[2] = -30;
		this.#updateEnergies();
	}

	#updateEnergies() {
		this.energiesText = "    Qnum Energy  Amp   Phase\n";
		for (let q = 1; q <= this.maxQnum; ++q) {
			const eng = q * q;
			const engStr = String(eng).padStart(2);
			this.energiesText += (q == this.curQnum ? ">>> " : "    ")
				+ "   " + q + "    " + engStr 
				+ " " + this.amps[q].toFixed(1).padStart(5) 
				+ "  " + this.phases[q].toFixed(1).padStart(6) + "\n";
		}
		this.#updateAmpSlider(this.amps[this.curQnum]);
		this.#updatePhaseSlider(this.phases[this.curQnum]);
	}

	#addQState(accAmp, accPhase, amp, phase) {
		accPhase *= Math.PI / 180;
		phase *= Math.PI / 180;
		const yt1 = accAmp * Math.sin(accPhase);
		const xt1 = accAmp * Math.cos(accPhase);
		const yt2 = amp * Math.sin(phase);
		const xt2 = amp * Math.cos(phase);
		const xtacc = xt1 + xt2;
		const ytacc = yt1 + yt2;
		const resAmp = sqrt(xtacc * xtacc + ytacc * ytacc);
		const resPhase = S32(atan2(ytacc, xtacc) * TIMESIZE / TWOPI);
		const ampPhase = {
			/*

			//logger("atan value = %f", atan2(ytacc, xtacc));
			accPhase = S32(atan2(ytacc, xtacc) * TIMESIZE / TWOPI);
		
			//accAmp = amp;
			//accPhase = 2048;// phase;
			//logger("addQState amp acc = %f, ph acc = %f\n", ampacc, phacc);
*/
			amp: resAmp,
			phase: resPhase
		}
		return ampPhase
	}

	#updateAmpSlider(val) {
		if (this.eles.ampSliderDOM) {
			this.eles.ampSliderDOM.setValue(val);
		}
	}

	#updatePhaseSlider(val) {
		if (this.eles.phaseSliderDOM) {
			this.eles.phaseSliderDOM.setValue(val);
		}
	}

	#updateEnergyList() {
		if (this.eles.energyListDom) {
			this.#updateEnergies();
			this.eles.energyListDom.innerText = this.energiesText;
		}
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .98;

		// animate
		this.fpsScreen = 60;
		this.freq = 0;
		this.minFreq = -2;
		this.maxFreq = 2;
		this.stepFreq = .01;

		// linestep
		this.minLineStep = 0;
		this.maxLineStep = 200;
		this.startLineStep = 8;
		this.displayMode = 0; // 8 different display modes, TODO: maybe an enum

		// for sine wave like functions, add a phase to the input of the function(s)
		// placeholder
		this.phase = 0; // [0 to 2 * PI)
		this.minPhase = 0;
		this.maxPhase = Math.PI * 2;
		this.stepPhase = .0005;

		// quantum state
		this.#initEnergies();
	}

	#userBuildUI() {
		if (!this.vp) {
			return;
		}
		// elements
		this.eles = {};
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
			this.eles.phaseCombo = new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => {this.phase = v});
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

		makeEle(this.vp, "hr");
		this.eles.quantInfo = makeEle(this.vp, "pre", null, null, "quantInfo");
		makeEle(this.vp, "button", null, "lessWidth", "Prev", () => this.displayMode = (this.displayMode - 1) & 7);
		makeEle(this.vp, "button", null, "lessWidth", "Next", () => this.displayMode = (this.displayMode + 1) & 7);
	
		makeEle(this.vp, "hr");

		//makeEle(this.vp, "pre", null, "energyList", "values");
		this.eles.energyListDom = makeEle(this.vp, "pre", null, null, "ENERGIES");
		this.eles.energyListDom = makeEle(this.vp, "pre", null, "energyList", "energy list text");
		this.#updateEnergyList(); // UI
		// Quantum Number slider combo  1 to maxQnum inclusive, (0 not used)
		{
			const label = "Q Number";
			const min = 1;
			const max = this.maxQnum;
			const start = 1;
			const step = 1;
			const precision = 0;
			new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => {
				this.curQnum = v;
				this.#updateAmpSlider(this.amps[this.curQnum]);
				this.#updateEnergyList(); // UI
			}, null, false);
		}
		// amplitude slider combo
		{
			const label = "Amplitude";
			const min = 0;
			const max = 100;
			const start = 0;
			const step = .1;
			const precision = 1;
			this.eles.ampSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => null, null, false);
			this.#updateAmpSlider(this.amps[this.curQnum]);
		}
		// phase slider combo
		{
			const label = "Phase";
			const min = -180;
			const max = 180;
			const start = 0;
			const step = .1;
			const precision = 1;
			this.eles.phaseSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => null, null, false);
			this.#updatePhaseSlider(this.phases[this.curQnum]);
		}
		// spread slider combo
		{
			const label = "Guass Energy Spread";
			const min = 0;
			const max = 100;
			const start = 0;
			const step = .1;
			const precision = 0;
			this.eles.spreadSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => null, null, false);
		}
		makeEle(this.vp, "button", null, "lessWidth", "replace", () => {
			this.amps[this.curQnum] = parseFloat(this.eles.ampSliderDOM.getValue());
			this.phases[this.curQnum] = parseFloat(this.eles.phaseSliderDOM.getValue());
			this.#updateEnergyList();
		});
		makeEle(this.vp, "button", null, "lessWidth", "add", () => {
			const ampPhase = this.#addQState(
				  this.amps[this.curQnum]
				, this.phases[this.curQnum]
				, parseFloat(this.eles.ampSliderDOM.getValue())		
				, parseFloat(this.eles.phaseSliderDOM.getValue())		
			);
			this.amps[this.curQnum] = ampPhase.amp;
			this.phases[this.curQnum] = ampPhase.phase;

			this.#updateEnergyList();
			this.#updateAmpSlider(this.amps[this.curQnum]);
			this.#updatePhaseSlider(this.phases[this.curQnum]);
		});
		makeEle(this.vp, "br");
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Reset Energies", () => {
			this.amps.fill(0);
			this.phases.fill(0);
			this.#updateEnergyList(); // UI
			this.#updateAmpSlider(this.amps[this.curQnum]);
			this.#updatePhaseSlider(this.phases[this.curQnum]);
		});
		makeEle(this.vp, "button", null, null, "Calculate", () => null);

		makeEle(this.vp, "hr");
		makeEle(this.vp, "br");
		
		makeEle(this.vp, "button", null, null, "Quit Program", () => {
			window.location.href = "../../index.html#plotter2d";
		});
	}

	#userProc() {
		// proc
		// update phase given freq
		if (this.freq !== 0) {
			this.phase += this.freq * (this.maxPhase - this.minPhase) / this.fpsScreen;
			this.phase = normAngRadUnsigned(this.phase);
			this.eles.phaseCombo.setValue(this.phase);
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
		this.eles.quantInfo.innerText = "Quant INFO\nDisplay mode = " + this.displayMode;
	}

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


//// END USER SECTION ///////

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
