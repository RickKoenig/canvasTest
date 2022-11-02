'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
class MainApp {
	static #numInstances = 0; // test static members

	static getNumInstances() { // test static methods
		return MainApp.#numInstances;
	}

	constructor() {
		console.log("creating instance of MainApp");
		++MainApp.#numInstances;

		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		//this.vp = null; // OR, no vertical panel UI
		this.eles = {}; // keep track of eles in vertical panel

		 // add all elements from vp to ele if needed
		// uncomment if you need elements from vp html
		populateElementIds(this.vp, this.eles);

		// USER before UI built
		this.#userInit();
		
		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// fire up all instances of the plotter2d classes that are needed
		// this.vp (vertical panel) is for UI trans, scale info, reset and USER
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, this.vp, this.startCenter, this.startZoom);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		this.drawFun = new DrawFun(this.graphPaper);

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.#animate();
	}

	#userInit() {
		// some SWITCHES
		this.doDebug = false; // show a lot of messages, input, dimensions etc.
		this.doParametric = false; // normal or parametric function(s)
		this.runFunGenTests = false; // unit test: function generator
		// end some SWITCHES

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.fpsScreen = 60; // DONE: make work with different refresh rates
		this.useAvgFps = true; // in proc, copy fpsAvgFps to fpsScreen instead of 60

		// speed of frame update as a fraction from 0 to 1
		this.num = 1;
		this.den = 1;
		this.cur = 0;
		this.avgFpsObj = new Runavg(500);
		// end speed of update

		// set start Plotter2d Center and Zoom if needed
		//this.startCenter = [3, 1];
		//this.startZoom = .5;

		if (this.runFunGenTests) {
			FunGen.runTests();
		}
		// test keyboard normal typing
		this.textTextType = "";

		// for sine wave like functions, add a phase to the input of the function(s)
		this.phase = 0; // [0 to 2 * PI)
		this.minPhase = 0;
		this.maxPhase = Math.PI * 2;
		this.stepPhase = .0005;

		this.freq = 0;
		this.minFreq = -2;
		this.maxFreq = 2;
		this.stepFreq = .01;

		this.startLineStep = 150;
		this.lineStep = this.startLineStep;
		this.maxLineStep = 1500;
		this.minLineStep = 1;
	}

	#userBuildUI() {
		if (!this.vp) {
			return;
		}
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, "textInfo", "textInfoLog");
		{
			makeEle(this.vp, "hr");
			// start lineStep UI
			const label = "Line step";
			const min = this.minLineStep;
			const max = this.maxLineStep;
			const start = this.startLineStep;
			const step = 1;
			const precision = 0;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,  (v) => {this.lineStep = v});
			// end lineStep UI
		}

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
		{
			this.eles.labelEditFunctionF = makeEle(this.vp, "pre", "labelEditFunctionF", null, "Enter F(t)");
			this.eles.editFunctionF = makeEle(this.vp, "textarea", "editFunctionF", "editbox");
			makeEle(this.vp, "pre", null, null, "Enter G(t)");
			this.eles.editFunctionG = makeEle(this.vp, "textarea", "editFunctionG", "editbox");
		}

		{
			this.textStartFunctionF = "t";
			this.textStartFunctionG = "sin(t) + 1/3*sin(3*t) + 1/5*sin(5*t) + 1/7*sin(7*t) + 1/9*sin(9*t)";
			// submit functions
			makeEle(this.vp, "button", null, null, "Submit functions",this.#submitFunctions.bind(this));
		}

		this.eles.labelParsedFunctionF = makeEle(this.vp, "pre", null, null, "Parsed F(t)");
		let ele = makeEle(this.vp, "pre", null, "parsedFunction");
		this.eles.textParsedFunctionF = makeEle(ele, "span", "textParsedFunctionF", null, "Function F");

		makeEle(this.vp, "pre", null, null, "Parsed G(t)");
		ele = makeEle(this.vp, "pre", null, "parsedFunction");
		this.eles.textParsedFunctionG = makeEle(ele, "span", "textParsedFunctionG", null, "Function G");

		// add all the event listeners and initialize elements
		// Parametric check box, could 'poll' this, but test events on a simple Boolean event
		this.eles.checkboxParametric.addEventListener('change', () => {
			this.doParametric = this.eles.checkboxParametric.checked;
		});
		this.eles.checkboxParametric.checked = this.doParametric; // UI checkbox toggle init

		// Debug check box, could 'poll' this, but test events on a simple Boolean event
		this.eles.checkboxDebug.addEventListener('change', () => {
			this.doDebug = this.eles.checkboxDebug.checked;
		});
		this.eles.checkboxDebug.checked = this.doDebug; // UI checkbox toggle init

		this.#resetFunctions();
		this.#submitFunctions();
	}

	#resetFunctions() {
		this.eles.editFunctionF.value = this.textStartFunctionF;
		this.eles.editFunctionG.value = this.textStartFunctionG;
	}

	#submitFunctions() {
		this.#submitFunctionF();
		this.#submitFunctionG();
	}

	#submitFunctionF() {
		const funStr = this.eles.editFunctionF.value;
 		// make UI editbox bigger, noscroll
		const extraHeight = -4; // ???
 		this.eles.editFunctionF.style.height = this.eles.editFunctionF.scrollHeight + extraHeight + 'px';
		const subFun = FunGen.stringToFunction(funStr);
		if (subFun) {
			this.drawFun.changeFunctionF(subFun);
			this.eles.textParsedFunctionF.innerText = funStr;
		}
	}

	#submitFunctionG() {
		const funStr = this.eles.editFunctionG.value;
 		// make UI editbox bigger, noscroll
		const extraHeight = -4; // ???
		this.eles.editFunctionG.style.height = this.eles.editFunctionG.scrollHeight + extraHeight + 'px';
		const subFun = FunGen.stringToFunction(funStr);
		if (subFun) {
			this.drawFun.changeFunctionG(subFun);
			this.eles.textParsedFunctionG.innerText = funStr;
		}
	}

	// slower rate of speed, skip sometimes, depends on num and den
	#userProc() {
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
		if (this.useAvgFps) {
			 this.fpsScreen = this.avgFps; // support for different refresh rates
		}

		// update phase given freq
		if (this.freq !== 0) {
			this.phase += this.freq * (this.maxPhase - this.minPhase) / this.fpsScreen;
			this.phase = normAngRadUnsigned(this.phase);
			this.phaseCombo.setValue(this.phase);
		}
	
		// test keyboard, edit a string
		if (this.doDebug) {
			const key = this.input.keyboard.key;
			if (key) {
				if (key == keyTable.keycodes.BACKSPACE) {
					this.textTextType = this.textTextType.slice(0,this.textTextType.length - 1);
				} else if (this.textTextType.length < 20) {
					this.textTextType += String.fromCharCode(key);
				}
			}
		}

		this.drawFun.draw(this.doParametric, this.lineStep, this.phase, this.graphPaper);
		if (this.doDebug) {
			// test new drawPrimitives class in user/cam space
			const r = 255;
			const g = 255;
			const b = 0;
			const colStrGen = "rgb(" + r + "," +  g + "," +  b + ")";
			const ndcScale = true; // just to show that the argument is ndcScale true/false

			// USER space
			// circles outline
			const lineWidth = undefined;
			this.drawPrim.drawCircleO([.5, .525], .125, lineWidth, "cyan");
			this.drawPrim.drawCircleO([.5, .475], .125, lineWidth, "brown", ndcScale);
			// rectangles outline
			this.drawPrim.drawRectangleO([.5, .25], [.25, .125], lineWidth, "blue");
			this.drawPrim.drawRectangleO([.5, 0], [.25, .125], lineWidth, "red", ndcScale);
			// circles fill
			this.drawPrim.drawCircle([.5, -.25], .0625, "cyan");
			this.drawPrim.drawCircle([.5, -.3], .0625, "brown", ndcScale);
			// rectangles fill
			this.drawPrim.drawRectangle([.5, -.52], [.25, .125], "blue");
			this.drawPrim.drawRectangle([.5, -.72], [.25, .125], "red", ndcScale);
			// lines
			this.drawPrim.drawLine([.375, -.9125], [.625, -.7875], lineWidth, "red");
			this.drawPrim.drawLine([.375, -1.0125], [.625, -.8875], lineWidth, "red", ndcScale);
			// text
			this.drawPrim.drawText([.5, .875], [.255, .0625], "USER", "green", colStrGen);
			this.drawPrim.drawText([.5, .75], [.55, .0625], "USER NDCSCALE", "green", colStrGen, ndcScale);

			// draw a pentagram
			{
				const pentPoints = [];
				for (let i = 0; i < 5; ++i) {
					const ang = i * 2 * Math.PI * 2 / 5 + Math.PI / 2;
					const pnt = [.5 * Math.cos(ang), .5 * Math.sin(ang)];
					pentPoints.push(pnt);
				}
				for (let i = 0; i < 5; ++i) {
					const j = (i + 1) % 5;
					this.drawPrim.drawLine(pentPoints[i], pentPoints[j], .01, "rgb(160, 90, 250)", ndcScale);
				}
			}

			// ndc space
			this.plotter2d.setSpace(Plotter2d.spaces.NDC);
			// circles outline
			this.drawPrim.drawCircleO([-.5, .525], .125, lineWidth, "brown");
			this.drawPrim.drawCircleO([-.5, .475], .125, lineWidth, "brown", ndcScale);
			// rectangles outline
			this.drawPrim.drawRectangleO([-.5, .25], [.25, .125], lineWidth, "green");
			this.drawPrim.drawRectangleO([-.5, 0], [.25, .125], lineWidth, "green", ndcScale);
			// circles fill
			this.drawPrim.drawCircle([-.5, -.25], .0625, "brown");
			this.drawPrim.drawCircle([-.5, -.3], .0625, "brown", ndcScale);
			// rectangles fill
			this.drawPrim.drawRectangle([-.5, -.52], [.25, .125], "green");
			this.drawPrim.drawRectangle([-.5, -.72], [.25, .125], "green", ndcScale);
			// lines
			this.drawPrim.drawLine([-.625, -.9125], [-.375, -.7875], lineWidth, "red");
			this.drawPrim.drawLine([-.625, -1.0125], [-.375, -.8875], lineWidth, "red", ndcScale);
			// text
			this.drawPrim.drawText([-.5, .875], [.25, .0625], "NDC", "green", colStrGen);
			this.drawPrim.drawText([-.5, .75], [.5, .0625], "NDC NDCSCL", "green", colStrGen, ndcScale);
		
			// SCREEN space
			this.plotter2d.setSpace(Plotter2d.spaces.SCREEN);
			// circles outline
			this.drawPrim.drawCircleO([120, 180], 40, 5, "blue");
			this.drawPrim.drawCircleO([120, 200], 40, 5, "blue", ndcScale);
			// rectangles outline
			this.drawPrim.drawRectangleO([120, 300], [80, 50], 5, "purple");
			this.drawPrim.drawRectangleO([120, 370], [80, 50], 5, "purple", ndcScale);
			// circles fill
			this.drawPrim.drawCircle([120, 480], 20, "blue");
			this.drawPrim.drawCircle([120, 500], 20, "blue", ndcScale);
			// rectangles fill
			this.drawPrim.drawRectangle([120, 600], [80, 50], "purple");
			this.drawPrim.drawRectangle([120, 670], [80, 50], "purple", ndcScale);
			// lines
			this.drawPrim.drawLine([70, 720], [170, 780], 5, "red");
			this.drawPrim.drawLine([70, 760], [170, 820], 5, "red", ndcScale);
			// text
			this.drawPrim.drawText([120, 50], [160, 30], "SCN", "white", "blue");
			this.drawPrim.drawText([120, 100], [200, 30], "SCN NDCSCL", "white", "blue", ndcScale);
		}
	}

	// update some of the UI
	#userUpdateInfo() {
		const p = this.plotter2d;
		// show inputEventsStats
		const fpsStr = "FPS = " + this.avgFps.toFixed(2) + "\n";
		this.eles.textInfoLog.innerText = fpsStr;

		if (this.doDebug) {
			this.eles.textInfoLog.innerHTML // only use innerHTML in doDebug mode
			= fpsStr
			+ "TextStringTest = " + "'" + this.textTextType + "'"
			+ "<br>Screen draw dim = (" + p.W[0] + " , " + p.W[1] + ")"			+ "<br>ndcMin[0] = " + p.ndcMin[0].toFixed(2) + ", ndcMin[1] = "  + p.ndcMin[1].toFixed(2)
			+ "<br>ndcMax[0] = " + p.ndcMax[0].toFixed(2) + ", ndcMax[1] = "  + p.ndcMax[1].toFixed(2)
			+ "<br>camMin[0] = " + p.camMin[0].toFixed(2) + ", camMin[1] = "  + p.camMin[1].toFixed(2)
			+ "<br>camMax[0] = " + p.camMax[0].toFixed(2) + ", camMax[1] = "  + p.camMax[1].toFixed(2)
			+ "<br>Mstat:" + this.input.mouse.stats
			+ "<br>Kstat:" + this.input.keyboard.stats
			+ "<br>Mevent: " + this.input.mouse.events
			+ "<br>Kevent: " + this.input.keyboard.events;
		} else { // show functions
			this.eles.textInfoLog.innerText += this.doParametric
				? "x = F(t),  y = G(t + p)\n0 <= t < 2*PI" 
				: "y = G(t + p)\n" + this.plotter2d.camMin[0].toFixed(2) 
					+ " <= t < " + this.plotter2d.camMax[0].toFixed(2);
			this.eles.textInfoLog.innerText += "\n0 <= p < 2*PI";
		}

		// hide/show function 'F' when parametric is turned on or off
		const vis = this.doParametric ? "" : "none";
		this.eles.labelEditFunctionF.style.display = vis;
		this.eles.editFunctionF.style.display = vis;
		this.eles.labelParsedFunctionF.style.display = vis;
		this.eles.textParsedFunctionF.style.display = vis;
	}

	#animate() {
		// speed of update
		this.cur += this.num;
		if (this.cur >= this.num) {
			this.cur -= this.den;

			// update input system
			this.input.proc();
			// interact with mouse, calc all spaces
			this.plotter2d.proc(this.vp, this.input.mouse);
			// goto user/cam space
			this.plotter2d.setSpace(Plotter2d.spaces.USER);
			// now in user/cam space
			this.graphPaper.draw(this.doParametric ? "X" : "T", "Y");

			// USER: do USER stuff
			this.#userProc(); // proc and draw
			// update UI, text
			this.#userUpdateInfo();
		}
		// end speed of update
	
		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
