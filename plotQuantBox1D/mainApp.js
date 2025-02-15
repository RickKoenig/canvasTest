'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	// enum of display modes object
    static displayModesEnum = makeEnum([
		"X_P_T", "X_RI_T", "R_I_T", "RIX_T_FREE",
		"T_P_X", "T_RI_X", "R_I_X", "RIT_X_FREE",
		"NUM"
	]);
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
		this.scrollQOffset = 0; // scroll amount
		this.curQnum = 1; // 1 to maxQnum inclusive

		this.amps = new Array(this.maxQnum + 1).fill(0); // amps[0] is never used
		this.phases = new Array(this.maxQnum + 1).fill(0); // amps[0] is never used
		this.amps[1] = 50;
		this.phases[1] = 0;
		this.amps[2] = 50;
		this.phases[2] = 0;

		this.#updateEnergyList();
		//this.#compute();
	}

	// convert to complex numbers, add and convert back to amp phase
	// for 1 energy level
	#updateQState(accAmp, accPhase, amp, phase, doAdd) { // if doAdd == false then replace
		if (!doAdd) {
			return {
				amp: amp,
				phase: phase
			};
		}
		accPhase *= Math.PI / 180;
		phase *= Math.PI / 180;
		const yt1 = accAmp * Math.sin(accPhase);
		const xt1 = accAmp * Math.cos(accPhase);
		const yt2 = amp * Math.sin(phase);
		const xt2 = amp * Math.cos(phase);
		const xtacc = xt1 + xt2;
		const ytacc = yt1 + yt2;
		const resAmp = Math.sqrt(xtacc * xtacc + ytacc * ytacc);
		const resPhase = Math.atan2(ytacc, xtacc) * 180 / Math.PI;
		const ampPhase = {
			amp: resAmp,
			phase: resPhase
		}
		return ampPhase
	}

	// make (-180 to 180]
	#normalAngDeg(a) {
		a %= 360;
		if (a <= -180) {
			a += 360;
		} else if (a > 180) {
			a -= 360;
		}
		return a;
	}

	// update total quantum state (array of amps and phases from 5 parameters)
	// amp, phase, qnum, spread, add/replace
	#addReplaceEnergy(doAdd) {
		let middleAmp = parseFloat(this.eles.ampSliderDOM.getValue());	
		let phaseDelta = parseFloat(this.eles.phaseSliderDOM.getValue());
		let width = parseFloat(this.eles.spreadSliderDOM.getValue());
		if (width == 0) { // just 1 energy updated
			const ampPhase = this.#updateQState(
				this.amps[this.curQnum]
			  , this.phases[this.curQnum]
			  , parseFloat(this.eles.ampSliderDOM.getValue())		
			  , parseFloat(this.eles.phaseSliderDOM.getValue())
			  , doAdd
			);
			this.amps[this.curQnum] = ampPhase.amp;
			this.phases[this.curQnum] = ampPhase.phase;
		} else {
			for (let q = 1; q <= this.maxQnum; ++q) {
				const shift = (q - this.curQnum);
				const shiftWidth = shift / width;
				let a = middleAmp * Math.exp(-shiftWidth * shiftWidth);
				if (a >= .125) {
					const p = this.#normalAngDeg(shift * phaseDelta);
					const ampPhase = this.#updateQState(
						this.amps[q]
					  , this.phases[q]
					  , parseFloat(a)		
					  , parseFloat(p)
					  , doAdd
					);
					this.amps[q] = ampPhase.amp;
					this.phases[q] = ampPhase.phase;
				}
			}
		}
		this.#updateEnergyList();
	}

	/* // reads amps and phases, writes imags and reals
	#compute() {
	} */

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
		this.energiesText = "    Qnum Energy   Amp   Phase\n";
		for (let q = 1 + this.scrollQOffset; q <= this.maxShowQnum + this.scrollQOffset; ++q) {
			if (q >= 1 && q <= this.maxQnum) {
				const energy = q * q;
				const hilight = q == this.curQnum;
				if (hilight) {
					this.energiesText += "<span id='hilight'>" + ">>> ";
				} else {
					this.energiesText += "    ";
				}
				this.energiesText += " " + q.toString().padStart(3) 
					+ " " + String(energy).padStart(6)
					+ " " + this.amps[q].toFixed(1).padStart(5) 
					+ "  " + this.phases[q].toFixed(1).padStart(6);
				if (hilight) {
					this.energiesText +="</span>"
				}
				this.energiesText += "\n";
			} else {
				this.energiesText += "OUT OF RANGE: qval = " + q + "\n";
			}
		}
		if (this.eles.energyListDom) {
			this.eles.energyListDom.innerHTML = this.energiesText;
		}
		this.#updateAmpSlider(this.amps[this.curQnum]);
		this.#updatePhaseSlider(this.phases[this.curQnum]);
	}

	#updateQnumScroll(v) {
		v = range(1, v, this.maxQnum);
		this.curQnum = v;
		this.scrollQOffset = v - Math.floor(this.maxShowQnum / 2);
		this.scrollQOffset = range(0, this.scrollQOffset, this.maxQnum - this.maxShowQnum);
	}

	#setZoomCenterFromMode() {
		const modeSettings = [
			{ 
				desc: "P on X anim T",
				center: [1, 1],
				zoom: .95,
				hAxis: 'X',
				vAxis: 'P',
				showAxisNumbers: false,
				animX: false,
			},
			{ 
				desc: "RI on X anim T",
				center: [1, 0],
				zoom: .95,
				hAxis: 'X',
				vAxis: 'RI',
				showAxisNumbers: false,
				animX: false,
			},
			{
				desc: "I on R anim T",
				center: [0, 0],
				zoom: .95,
				hAxis: 'R',
				vAxis: 'I',
				showAxisNumbers: false,
				animX: false,
			},
			{
				desc: "RIX anim T free",
				center: [0, 0],
				zoom: .95,
				hAxis: 'X',
				vAxis: 'RI',
				showGrid: false,
				showAxis: false,
				animX: false,
				freeMouse: true
			},
			{ 
				desc: "P on T anim X",
				center: [1, 1],
				zoom: .95,
				hAxis: 'T',
				vAxis: 'P',
				showAxisNumbers: false,
				animX: true,
			},
			{ 
				desc: "RI on T anim X",
				center: [1, 0],
				zoom: .95,
				hAxis: 'T',
				vAxis: 'RI',
				showAxisNumbers: false,
				animX: true,
			},
			{
				desc: "I on R anim X",
				center: [0, 0],
				zoom: .95,
				hAxis: 'R',
				vAxis: 'I',
				showAxisNumbers: false,
				animX: true,
			},
			{
				desc: "RIT anim X free",
				center: [0, 0],
				zoom: .95,
				hAxis: 'T',
				vAxis: 'RI',
				showGrid: false,
				showAxis: false,
				animX: true,
				freeMouse: true
			},
		];
		const mode = this.displayMode;
		const setting = modeSettings[mode];
		this.animX = setting.animX; // otherwise, animT
		this.startCenter = setting.center;
		this.startZoom = setting.zoom;
		this.plotter2d.setTrans(this.startCenter);
		this.plotter2d.setZoom(this.startZoom);
		this.hAxis = setting.hAxis;
		this.vAxis = setting.vAxis;
		this.axis = setting.showAxis;
		this.axisNumbers = setting.showAxisNumbers;
		this.grid = setting.showGrid;
		this.desc = "[" + mode + "] " + setting.desc;
		this.animX = setting.animX;
		this.freeMouse = setting.freeMouse;
		this.eles.animCombo.setValue(this.animX ? this.animPos : this.animTime);
	}
	// USER: add more members or classes to MainApp
	#userInit() {
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);
		// before firing up Plotter2d
		//const centerProb = true;

		// animate
		this.fpsScreen = 60;
		this.numXSteps = 1024; // for drawing
		this.numTSteps = 1024;
		this.displayMode = MainApp.displayModesEnum.X_P_T; // 8 different display modes
		this.rotateAxis = vec2.create(); // for RIX free

		this.maxQnum = 512;
		this.maxShowQnum = 16; // scroll window size
		// for sine wave like functions, add a phase to the input of the function(s)
		this.animTime = 0; // [0 to 1]
		this.animPos = 0; // [0 to 1]
		this.animMin = 0;
		this.animMax = 1;
		this.animStep = 1 / 1000000;
		this.animPrecision = 5;

		this.freq = 0;
		this.freqMin = -1 / 8;
		this.freqMax = 1 / 8;
		this.freqStep = 1 / 20000;
		this.freqPrecision = 5;

		// quantum state
		this.#initEnergies();
		this.energiesMouseX = 0;
		this.energiesMouseY = 0;
	}

	#userBuildUI() {
		if (!this.vp) {
			return;
		}
		// elements
		this.eles = {};
		// phase slider combo
		makeEle(this.vp, "hr");
		{
			// start anim UI
			const label = "Anim";
			const min = this.animMin;
			const max = this.animMax;
			const start = 0;
			const step = this.animStep;
			const precision = this.animPrecision;
			this.eles.animCombo = new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => {
				if (this.animX) {
					this.animPos = v;
				} else {
					this.animTime = v;
				}
			});
			// end phase UI
		}
	
		// frequency slider combo
		{
			const label = "Anim rate";
			const min = this.freqMin;
			const max = this.freqMax;
			const start = 0;
			const step = this.freqStep;
			const precision = this.freqPrecision;
			new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => {this.freq = v});
		}
		
		makeEle(this.vp, "hr");
		this.eles.quantInfo = makeEle(this.vp, "pre", null, null, "quantInfo");
		makeEle(this.vp, "button", null, "lessWidth", "Prev", () => {
			--this.displayMode;
			if (this.displayMode < 0) {
				this.displayMode += MainApp.displayModesEnum.NUM;
			}
			this.#setZoomCenterFromMode();
		});
		makeEle(this.vp, "button", null, "lessWidth", "Next", () => {
			this.displayMode++;
			if (this.displayMode >= MainApp.displayModesEnum.NUM) {
				this.displayMode -= MainApp.displayModesEnum.NUM;
			}
			this.#setZoomCenterFromMode();
		});
	
		makeEle(this.vp, "hr");

		makeEle(this.vp, "pre", null, null, "ENERGIES");
		const energyDOM = makeEle(this.vp, "pre", null, "energyList", "energy list text");
		this.eles.energyListDom = energyDOM;
		energyDOM.addEventListener("click", (e) => {
			this.energiesMouseX = e.offsetX;
			this.energiesMouseY = e.offsetY;
			const rowSize = 20; // tweak
			const mul = 1 / rowSize;
			const add = 0;
			const v = Math.floor(range(1, this.energiesMouseY * mul + add, this.maxQnum));
			this.#updateQnumScroll(v + this.scrollQOffset);
			this.#updateEnergyList();
			this.eles.qNumSliderDOM.setValue(this.curQnum);
		});
		
		this.#updateEnergyList(); // UI
		// Quantum Number slider combo  [1 to maxQnum], (0 not used)
		{
			const label = "Q Number";
			const min = 1;
			const max = this.maxQnum;
			const start = 1;
			const step = 1;
			const precision = 0;
			this.eles.qNumSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => {
				this.#updateQnumScroll(v);
				this.#updateEnergyList(); // UI
			}, null, false);
		}
		// amplitude slider combo
		{
			const label = "Amplitude";
			const min = 0;
			const max = 100;
			const start = 0;
			const step = .5;
			const precision = 1;
			this.eles.ampSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, null, null, false);
		}
		// phase slider combo
		{
			const label = "Phase";
			const min = -180;
			const max = 180;
			const start = 0;
			const step = .5;
			const precision = 1;
			this.eles.phaseSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, null, null, false);
		}
		// spread slider combo
		{
			const label = "Energy Spread";
			const min = 0;
			const max = 100;
			const start = 0;
			const step = 1;
			const precision = 0;
			this.eles.spreadSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, null, null, false);
		}
		makeEle(this.vp, "button", null, "lessWidth", "Replace", () => {
			this.#addReplaceEnergy(false);
		});
		makeEle(this.vp, "button", null, "lessWidth", "Add", () => {
			this.#addReplaceEnergy(true);
		});
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Reset Energies", () => {
			this.amps.fill(0);
			this.phases.fill(0);
			this.#updateEnergyList();
		});
		//makeEle(this.vp, "button", null, null, "Calculate", () => null);

		makeEle(this.vp, "hr");
		
		makeEle(this.vp, "button", null, null, "Quit Program", () => {
			window.location.href = "../../index.html#plotter2d";
		});
		this.#updateEnergyList();
		this.#setZoomCenterFromMode();
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
		// update mouse if in RIX free
		if (this.freeMouse) {
			if (this.input.mouse.mbut[Mouse.LEFT]) {
				this.rotateAxis[0] += this.plotter2d.deltaUserMouse[0];
				this.rotateAxis[1] -= this.plotter2d.deltaUserMouse[1]; // invert y
				// wrap
				if (this.rotateAxis[0] < 0) this.rotateAxis[0] += 1;
				else if (this.rotateAxis[0] >= 1) this.rotateAxis[0] -= 1;
				if (this.rotateAxis[1] < 0) this.rotateAxis[1] += 1;
				else if (this.rotateAxis[1] >= 1) this.rotateAxis[1] -= 1;
			}
		}
		// update anim given freq
		if (this.freq !== 0) {
			const diffAnim = this.animMax - this.animMin;
			if (this.animX) {
				this.animPos += this.freq * diffAnim / this.fpsScreen;
				if (this.animPos < this.animMin) {
					this.animPos += diffAnim;
				} else if (this.animPos >= this.animMax) {
					this.animPos -= diffAnim;
				}
				this.eles.animCombo.setValue(this.animPos);
			} else {
				this.animTime += this.freq * diffAnim / this.fpsScreen;
				if (this.animTime < this.animMin) {
					this.animTime += diffAnim;
				} else if (this.animTime >= this.animMax) {
					this.animTime -= diffAnim;
				}
				this.eles.animCombo.setValue(this.animTime);
			}
		}
		this.#buildFunData();
	}

	#calcAddQ(x, t, norm) {
		let real = 0;
		let imag = 0;
		for (let q = 1; q <= this.maxQnum; ++q) {
			const amp = this.amps[q];
			if (!amp) continue;
			const phase = this.phases[q] / 360;
			const xAng = x * q * Math.PI;
			let xSinAng = Math.sin(xAng);
			const tAng = (t * q * q + phase) * 2 * Math.PI;
			const tAngReal = Math.cos(tAng);
			const tangimag = Math.sin(tAng);
			xSinAng *= amp;
			real += xSinAng * tAngReal;
			imag += xSinAng * tangimag;
		}
		real *= norm;
		imag *= norm;
		const prob = (real * real + imag * imag) * 2;
		this.realData.push(real);
		this.imagData.push(imag);
		this.probData.push(prob);
		const col = this.#getCssColorFromComplex(real, imag);
		this.colorData.push(col);
	}

	// draw at (0, -1) to (2, 1)
	#buildFunData() {
		let sumk = 0;
		for (let q = 1; q <= this.maxQnum; ++q) {
			sumk += this.amps[q];
		}
		if (!sumk) return;
		const norm = 1 / sumk;
		this.realData = [];
		this.imagData = [];
		this.probData = [];
		this.colorData = [];
		if (this.animX) {
			for (let ti = 0; ti <= this.numTSteps; ++ti) {
				const x = this.animPos;
				const t = ti / this.numTSteps;
				this.#calcAddQ(x, t, norm);
			}
		} else {
			for (let xi = 0; xi <= this.numXSteps; ++xi) {
				const x = xi / this.numXSteps;
				const t = this.animTime;
				this.#calcAddQ(x, t, norm);
			}
		}
	}

	#getCssColorFromComplex = function(real, imag) {
		const mag = Math.sqrt(real * real + imag * imag);
		let ang = Math.atan2(imag, real);
		ang *= 180 / Math.PI;
		const brt = 55 * mag;
		return "hsl(" + ang + ",100%," + brt + "%)";
	}
	
	#userDraw() { 									//axis, axisNumbers, grid
		this.graphPaper.draw(this.hAxis, this.vAxis, this.axis, this.axisNumbers, this.grid);
		const lineWidth = .005;
		const step = 2 / (this.animX ? this.numTSteps : this.numXSteps);
		const pnts = [];
		switch(this.displayMode) {
		case MainApp.displayModesEnum.X_P_T:
		case MainApp.displayModesEnum.T_P_X:
			this.drawPrim.drawLinesSimple(this.probData, lineWidth, undefined, 0, step, "blue");
			break;
		case MainApp.displayModesEnum.X_RI_T:
		case MainApp.displayModesEnum.T_RI_X:
			this.drawPrim.drawLinesSimple(this.realData, lineWidth, undefined, 0, step, "red");
			this.drawPrim.drawLinesSimple(this.imagData, lineWidth, undefined, 0, step, "green");
			break;
		case MainApp.displayModesEnum.R_I_T:
		case MainApp.displayModesEnum.R_I_X:
			for (let i = 0; i <= this.realData.length; ++i) {
				const pnt = [this.realData[i], this.imagData[i]];
				pnts.push(pnt);
			}
			this.drawPrim.drawLinesParametric(pnts, lineWidth, 0, false, "blue");
			break;
		case MainApp.displayModesEnum.RIX_T_FREE:
		case MainApp.displayModesEnum.RIT_X_FREE:
			const pitch = this.rotateAxis[1] * 2 * Math.PI;
			const yaw = this.rotateAxis[0] * 2 * Math.PI;
			const pitchS = Math.sin(pitch);
			const pitchC = Math.cos(pitch);
			const yawS = Math.sin(yaw);
			const yawC = Math.cos(yaw);
			// rix to xy matrix
			// I
			const i2x = 0;
			const i2y = pitchC;
			const i2p = [i2x, i2y];
			// R
			const r2x = yawC;
			const r2y = pitchS * yawS;
			const r2p = [r2x, r2y];
			// X
			const x2x = yawS;
			const x2y = -pitchS * yawC;
			const x2p = [x2x, x2y];
			// draw custom axis
			const zerop = [0, 0];
			const axisLineWidth = .0025;
			const r2pNeg = [-r2p[0], -r2p[1]];
			const i2pNeg = [-i2p[0], -i2p[1]];
			this.drawPrim.drawLine(zerop, x2p, axisLineWidth);
			this.drawPrim.drawLine(r2pNeg, r2p, axisLineWidth, "red");
			this.drawPrim.drawLine(i2pNeg, i2p, axisLineWidth, "green");
			let size = .05;
			this.drawPrim.drawText(x2p, [size, size], this.animX ? "T" : "X", undefined, "white", true);
			this.drawPrim.drawText(r2p, [size, size], "R", undefined, "white", true);
			this.drawPrim.drawText(i2p, [size, size], "I", undefined, "white", true);
			
			// build and draw line
			const pnts2 = [];
			for (let i = 0; i <= this.realData.length; ++i) {
				const qx = i / this.realData.length;
				const qr = this.realData[i];
				const qi = this.imagData[i];
				const px = x2x * qx + r2x * qr + i2x * qi;
				const py = x2y * qx + r2y * qr + i2y * qi;
				let pnt2 = [px, py];
				pnts2.push(pnt2);
			}
			this.drawPrim.drawLinesParametric(pnts2, lineWidth, 0, false, this.colorData);
			break;
		}
		const doTestColors = false;
		if (doTestColors) {
			const testData = [.3, .2, .7, .5, .25];
			const testDataP = [
				[2, 1],
				[1, 2],
				[0, 1],
				[1, 0],
				[2, .6]
			];
	
			// last color not used if not 'close'
			//const testColors = ["red", "green", "blue", "yellow", "brown"]; 
			//const testColors = "green";
			const testColors = [
				this.#getCssColorFromComplex(1, 0),
				this.#getCssColorFromComplex(0, 1),
				this.#getCssColorFromComplex(-1, 0),
				this.#getCssColorFromComplex(0, -1),
				this.#getCssColorFromComplex(1, 0)
			];
	
			/*this.drawPrim.drawLinesSimple(testData, .05, .07
				, 0, .25
				, testColors, "red", false);*/
			this.drawPrim.drawLinesParametric(testDataP, .05, .07, false, testColors, "red");
		}
	}

	#userUpdateInfo() {
		if (!this.vp) {
			return;
		}
		let info = this.desc;
		if (this.freeMouse) {
			const pitch = this.rotateAxis[1] * 360;
			const yaw = this.rotateAxis[0] * 360;
			const pitchStr = pitch.toFixed(0);
			const yawStr = yaw.toFixed(0);
			info += "\n pitch = " + pitchStr + ", yaw = " + yawStr;
		} else {
			info += "\n---, ---";
		}
		info += "\nAvg fps = " + this.avgFps.toFixed(2);
		this.eles.quantInfo.innerText = info;
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
		// USER: do USER stuff
		this.#userDraw(); // draw

		// update UI, text
		this.#userUpdateInfo();

		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();








/*
	case T_RI_X: 
		{
			static C32 rgbcolsy[3]={C32RED,C32WHITE,C32GREEN};
			fplot afplot(VIEWXSTART,VIEWYSTART,VIEWXSIZE,VIEWYSIZE,0.0f,-1.0f,1.0f,1.0f,B32,"X","R,I",rgbcolsy);
			afplot.drawaxis();
			afplot.drawlabels();
			afplot.startlinev();
			for (i=0;i<SPACESIZE;++i) {
				float x=i*(1.0f/SPACESIZE);
				float y=reals[lshift(countr,LTIMESIZE-LANIMSIZE)][i];
				afplot.flinev(x,y,C32RED);
			}
			afplot.flinev(1.0f,0.0f,C32RED);
			afplot.startlinev();
			for (i=0;i<SPACESIZE;++i) {
				float x=i*(1.0f/SPACESIZE);
				float y=imags[lshift(countr,LTIMESIZE-LANIMSIZE)][i];
				afplot.flinev(x,y,C32GREEN);
			}
			afplot.flinev(1.0f,0.0f,C32GREEN);
			break;
		}
// p against x, animate t
	case T_P_X: 
		{
			fplot afplot(VIEWXSTART,VIEWYSTART,VIEWXSIZE,VIEWYSIZE,0.0f,0.0f,1.0f,1.0f,B32,"X","P",0);
			afplot.drawaxis();
			afplot.drawlabels();
			afplot.startlinev();
			for (i=0;i<SPACESIZE;++i) {
				float x=i*(1.0f/SPACESIZE);
				float re=reals[lshift(countr,LTIMESIZE-LANIMSIZE)][i];
				float im=imags[lshift(countr,LTIMESIZE-LANIMSIZE)][i];
				float y=re*re+im*im;//probs[lshift(countr,LTIMESIZE-LANIMSIZE)][i];
				afplot.flinev(x,y,C32CYAN);
			}
			afplot.flinev(1.0f,0.0f,C32CYAN);
			break;
		}
// r,i, animate t

float sintb[TRIGSIZE]; // trig table
float ak[ENERGYARRSIZE]; // 0 to 31 // 0 not used
S32 phk[ENERGYARRSIZE]; // quantum states table (energy squareds/momentum, will change for non zero potential function)
//float probs[TIMESIZE][SPACESIZE]; // [t][x];
float reals[TIMESIZE][SPACESIZE]; // [t][x];
float imags[TIMESIZE][SPACESIZE]; // [t][x];
float angstreal[TIMESIZE][ENERGYARRSIZE]; // [t][n]
float angstimag[TIMESIZE][ENERGYARRSIZE]; // [t][n]
float angsx[SPACESIZE][ENERGYARRSIZE]; // [x][n]

	void computeproc()
{
	S32 x,t,n,rt,rx;
	static S32 exlate[ENERGYARRSIZE];
	static S32 nexlate; // build a list of non zero energies
	static float normk;
	if (comptime==0) {
		sumk=0;
		float sumk2=0;
		for (n=1;n<ENERGYARRSIZE;n++) {
			sumk+=ak[n];
			sumk2+=ak[n]*ak[n];
		}
		if (sumk==0) {
			comptime=TIMESIZE;
			return;
		}
// minor differences for normalization
#define LOOK_BETTER
#ifdef LOOK_BETTER
		normk = 1.0f / sumk; // this scales/looks better
#elif
		normk = sqrtf(2.0f / sumk2); // this one is the correct normalizer
#endif
		nexlate=0;
		for (n=1;n<ENERGYARRSIZE;n++) {
			if (ak[n]) {
				exlate[nexlate++]=n;
			}
		}
		perf_start(TEST1);
		for (x=0;x<SPACESIZE;x++)
			for (n=1;n<ENERGYARRSIZE;n++) {
				rx=lshift(n*x,LTRIGSIZE-LSPACESIZE-1);
				angsx[x][n]=sint(rx)*ak[n];
			}
		for (t = 0; t <TIMESIZE; ++t) {
			for (n = 1; n < ENERGYARRSIZE; ++n) {
				rt = lshift(n * n * t + phk[n], LTRIGSIZE - LTIMESIZE);
				angstreal[t][n] = cost(rt);
				angstimag[t][n] = sint(rt);
			}
		}
		perf_end(TEST1);
	}
	if (comptime==TIMESIZE)
		return;
	perf_start(TEST2);
	if (wininfo.fpsavg2>wininfo.fpswanted+2.0f)
		++comprate;
	else if (wininfo.fpscurrent2<wininfo.fpswanted-2.0f) {
		if (comprate<=0)
			comprate=1;
		else if (comprate<10)
			--comprate;
		else
			comprate=comprate*9/10;
	}
	if (comprate<=0)
		comprate=1;
	S32 endtime=comptime+comprate;
	if (endtime>TIMESIZE)
		endtime=TIMESIZE;
	for (t=comptime;t<endtime;++t) {
#ifdef USEVECTOR
		vector<float> & realst=reals[t]; // try and speed this up
		vector<float> & imagst=imags[t];
//		vector<float> & probst=probs[t];
		vector<float> & angstrealt=angstreal[t];
		vector<float> & angstimagt=angstimag[t];
#else
		float* realst=reals[t]; // try and speed this up
		float* imagst=imags[t];
//		float* probst=probs[t];
		float* angstrealt=angstreal[t];
		float* angstimagt=angstimag[t];
#endif
		for (x=0;x<SPACESIZE;++x) {
			float ampr=0,ampi=0;
#ifdef USEVECTOR
			vector<float> & angsxx=angsx[x];
#else
			float* angsxx=angsx[x];
#endif
			perf_start(TEST3);
			S32 np;
			for (np=0;np<nexlate;++np) {
				n=exlate[np];
				float xp=angsxx[n];
				ampr+=xp*angstrealt[n];
				ampi+=xp*angstimagt[n];
			}
			perf_end(TEST3);
			perf_start(TEST4);
			ampr*=normk; // go with graphical normals, better scaling
			ampi*=normk;
			realst[x]=ampr;
			imagst[x]=ampi;
//			probst[x]=ampr*ampr+ampi*ampi;
			perf_end(TEST4);
		}
	}
	comptime=endtime;
	perf_end(TEST2);
}


	}
*/		

