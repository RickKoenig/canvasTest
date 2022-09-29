'use strict';

// handle the html elements, do the UI on verticalButtons, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #numInstances = 0; // test static members
	constructor() {
		console.log("creating instance of MainApp");
		++MainApp.#numInstances;


		//const iter = true;
		//if (iter) {
			// get all the elements automatically
			// children of verticalButtons

			console.log("ids of verticalButtons");
			const vb = document.getElementById("verticalButtons");
			const vba = vb.getElementsByTagName("*");
			for (const htmle of vba) {
				if (htmle.id.length) {
					this[htmle.id] = document.getElementById(htmle.id);
				}
			}

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// some SWITCHES
		this.doDebug = false; // show a lot of messages, input, dimensions etc.
		this.doParametric = false; // normal or parametric function(s)
		this.runFunGenTests = false; // test function generator
		// end some SWITCHES

		// test keyboard normal typing
		this.testText = "";

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

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFps = 0;
		this.fpsScreen = 60; // TODO: make work with different refresh rates

		// speed of update
		this.num = 1;
		this.den = 1;
		this.cur = 0;
		this.avgFpsObj = new Runavg(500);
		// end speed of update



		// add all the event listeners and initialize elements

		// Parametric check box, could 'poll' this, but test events on a simple Boolean event
		this.checkboxParametric.addEventListener('change', () => {
			//console.log("parametric changed to " + this.checkboxParametric.checked);
			this.doParametric = this.checkboxParametric.checked;
		});
		this.checkboxParametric.checked = this.doParametric; // UI checkbox toggle init

		// Debug check box, could 'poll' this, but test events on a simple Boolean event
		this.checkboxDebug.addEventListener('change', () => {
			//console.log("debug changed to " + this.checkboxDebug.checked);
			this.doDebug = this.checkboxDebug.checked;
		});
		this.checkboxDebug.checked = this.doDebug; // UI checkbox toggle init

		// phase
		// phase slider
		this.sliderPhase.min = this.minPhase;
		this.sliderPhase.max = this.maxPhase;
		this.sliderPhase.step = this.stepPhase;
		this.sliderPhase.value = this.phase;
		this.sliderPhase.addEventListener('input', () => {
			//console.log("sliderPhase input, this = " + this.sliderPhase.value);
			this.phase = parseFloat(this.sliderPhase.value);
		});
		// phase reset button
		this.buttonPhase.addEventListener('click', () => {
			//console.log("buttonPhase reset");
			this.#buttonPhaseReset();
		});

		// freq
		// freq slider
		this.sliderFreq.min = this.minFreq;
		this.sliderFreq.max = this.maxFreq;
		this.sliderFreq.step = this.stepFreq;
		this.sliderFreq.value = this.freq;
		this.sliderFreq.addEventListener('input', () => {
			//console.log("sliderFreq input, this = " + this.sliderFreq.value);
			this.freq = parseFloat(this.sliderFreq.value);
		});
		// freq reset button
		this.buttonFreq.addEventListener('click', () => {
			//console.log("buttonFreq reset");
			this.#buttonFreqReset();
		});

		// line step
		// linestep slider
		this.sliderLineStep.min = this.minLineStep;
		this.sliderLineStep.max = this.maxLineStep;
		this.sliderLineStep.value = this.startLineStep;
		this.sliderLineStep.addEventListener('input', () => {
			//console.log("sliderLineStep input, this = " + this.sliderLineStep.value);
			this.lineStep = parseFloat(this.sliderLineStep.value);
		});
		// linestep reset button
		this.buttonLineStep.addEventListener('click', () => {
			//console.log("buttonLineStep reset");
			this.#buttonLineStepReset();
		});

		// fire up all instances of the classes that are needed
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.plotter2d = new Plotter2d(this.ctx);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);
		this.drawFun = new DrawFun(this.graphPaper);

		if (this.runFunGenTests) {
			FunGen.runTests();
		}

		this.textStartFunctionF = "t";
		this.textStartFunctionG = "sin(t) + 1/3*sin(3*t) + 1/5*sin(5*t) + 1/7*sin(7*t) + 1/9*sin(9*t)";
		this.#resetFunctions();
		this.#submitFunctions();
		this.submitFunctions.addEventListener('click', () => {
			//console.log("button submitFunctions");
			this.#submitFunctions();
		});
		// function edit box
		this.editFunctionF.addEventListener("keyup", ({key}) => {
			if (key === "Enter") {
				this.#submitFunctionF();
			}
		});
		// function edit box
		this.editFunctionG.addEventListener("keyup", ({key}) => {
			if (key === "Enter") {
				this.#submitFunctionG();
			}
		});


		// scale reset button
		this.buttonScaleCam.addEventListener('click', () => {
			//console.log("scale camera reset");
			this.#buttonScaleCamReset();
		});
		// x trans reset button
		this.buttonXTransCam.addEventListener('click', () => {
			//console.log("X trans camera reset");
			this.#buttonXTransCamReset();
		});
		// y trans reset button
		this.buttonYTransCam.addEventListener('click', () => {
			//console.log("Y trans camera reset");
			this.#buttonYTransCamReset();
		});

		// start it off
		this.#animate();
	}



	#buttonScaleCamReset() {
		this.plotter2d.scaleReset();
	}

	#buttonXTransCamReset() {
		const p = this.plotter2d;
		p.center[0] = 0;
	}

	#buttonYTransCamReset() {
		const p = this.plotter2d;
		p.center[1] = 0;
	}

	#resetFunctions() {
		this.editFunctionF.value = this.textStartFunctionF;
		this.editFunctionG.value = this.textStartFunctionG;
	}

	#submitFunctions() {
		this.#submitFunctionF();
		this.#submitFunctionG();
	}

	#stripNewlinesAtEnd(funStr) {
		// remove newlines at end of function string if there from a submit by hitting CR
		while(true) {
			const lenMinus1 = funStr.length - 1;
			if (funStr[lenMinus1] == '\n') {
				funStr = funStr.substring(0,lenMinus1);
			} else {
				break;
			}
		}
		return funStr;
	}

	#submitFunctionF() {
		const funStr = this.#stripNewlinesAtEnd(this.editFunctionF.value);
		this.editFunctionF.value = funStr;
 		// make UI editbox bigger, noscroll
		const extraHeight = -4; // ???
 		this.editFunctionF.style.height = this.editFunctionF.scrollHeight + extraHeight + 'px';
		const subFun = FunGen.stringToFunction(funStr);
		if (subFun) {
			this.drawFun.changeFunctionF(subFun);
			this.textFunctionF.innerHTML = funStr;
		}
	}

	#submitFunctionG() {
		const funStr = this.#stripNewlinesAtEnd(this.editFunctionG.value);
		this.editFunctionG.value = funStr;
 		// make UI editbox bigger, noscroll
		const extraHeight = -4; // ???
		this.editFunctionG.style.height = this.editFunctionG.scrollHeight + extraHeight + 'px';
		const subFun = FunGen.stringToFunction(funStr);
		if (subFun) {
			this.drawFun.changeFunctionG(subFun);
			this.textFunctionG.innerHTML = funStr;
		}
	}

	#buttonPhaseReset() {
		//console.log("button phase reset");
		this.phase = 0;
	}

	#buttonFreqReset() {
		//console.log("button freq reset");
		this.freq = 0;
	}

	#buttonLineStepReset() {
		//console.log("button lineStep reset");
		this.lineStep = this.startLineStep;
	}

	static getNumInstances() { // test static methods
		return MainApp.#numInstances;
	}

	// update some of the UI
	#updateUI() {
		const plotHeader = "Move sliders, Press buttons<br> Enter functions<br>";

		const p = this.plotter2d;
		const plotMouse =  "<br>plot MX = " + p.userMouse[0].toFixed(2) 
						+ ", plot MY = " + p.userMouse[1].toFixed(2);

		const fpsStr = "<br>FPS " + this.avgFps.toFixed(2); // update average frame rate
		if (this.doDebug) {
			const plotterDebugInfo = "<br>Screen draw dim = (" + p.W[0] + " , " + p.W[1] + ")"
			+ "<br><br>ndcMin[0] = " + p.ndcMin[0].toFixed(2) + ", ndcMin[1] = "  + p.ndcMin[1].toFixed(2)
			+ "<br>ndcMax[0] = " + p.ndcMax[0].toFixed(2) + ", ndcMax[1] = "  + p.ndcMax[1].toFixed(2)
			+ "<br><br>camMin[0] = " + p.camMin[0].toFixed(2) + ", camMin[1] = "  + p.camMin[1].toFixed(2)
			+ "<br>camMax[0] = " + p.camMax[0].toFixed(2) + ", camMax[1] = "  + p.camMax[1].toFixed(2)
			+ "<br>";
			this.canvasDimTxt.innerHTML = plotterDebugInfo + plotMouse + fpsStr;
		} else {
			let useInfo = this.doParametric
						? "x = F(t),  y = G(t + p)<br>0 <= t < 2*PI" 
						: "y = G(t + p)<br>" + p.camMin[0].toFixed(2) 
							+ " <= t < " + p.camMax[0].toFixed(2);
			useInfo += "<br>0 <= p < 2*PI";
			this.canvasDimTxt.innerHTML = plotHeader + useInfo + plotMouse + fpsStr;
		}
		
		this.textScaleCam.innerHTML = "zoom = " + p.zoom.toFixed(4) + ", logZoom = " + p.logZoom.toFixed(3);
		
		const vis = this.doParametric ? "" : "none";
		this.labelFunctionF1.style.display = vis;
		this.editFunctionF.style.display = vis;
		this.labelFunctionF2.style.display = vis;
		this.textFunctionF.style.display = vis;

		this.textXTransCam.innerHTML = "center[0] = " + p.center[0].toFixed(2);
		this.textYTransCam.innerHTML = "center[1] = " + p.center[1].toFixed(2);

		// show inputEventsStats
		this.textInputLog.innerHTML = this.doDebug
			? "TestText:'" + this.testText + "'<br>"
			+ "Mstat:" + this.input.mouse.stats + "<br>"
			+ "Kstat:" + this.input.keyboard.stats + "<br>"
			+ "Mevent: " + this.input.mouse.events + "<br>"
			+ "Kevent: " + this.input.keyboard.events
			: "";


		// update sliders
		this.sliderPhase.value = this.phase;
		this.sliderFreq.value = this.freq;
		this.sliderLineStep.value = this.lineStep;

		this.textPhase.innerHTML = "sliderPhase (p) = " + this.phase.toFixed(2);
		this.textFreq.innerHTML = "sliderFreq = " + this.freq.toFixed(2);
		this.textLineStep.innerHTML = "Line Step = " + this.lineStep.toFixed();
	}

	// given size of window or a fixed size set canvas size
	#calcCanvasSize() {
		const fixedDim = false;
		if (fixedDim) {
			const fixedSize = [800, 600];
			// set canvas size to a fixed size
			this.plotter2dCanvas.width = fixedSize[0];
			this.plotter2dCanvas.height = fixedSize[1];
		} else {
			// set canvas size depending on window size
			// TODO: get rid of magic numbers
			const wid = window.innerWidth - 450;
			const hit = window.innerHeight - 100;
			this.plotter2dCanvas.width = Math.max(200, wid);
			this.plotter2dCanvas.height = Math.max(750, hit);
		}
	}

	// slower rate of speed, skip sometimes, depends on num and den
	#proc() {
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
	
		// update input system
		this.input.proc();

		// update phase given freq
		this.phase += this.freq * (this.maxPhase - this.minPhase) / this.fpsScreen;
		const twoPI = 2 * Math.PI;
		if (this.phase >= twoPI) {
			this.phase -= twoPI;
		} else if (this.phase < 0) {
			this.phase += twoPI;
		}
	
		// test keyboard, edit a string
		if (this.doDebug) {
			const key = this.input.keyboard.key;
			if (key) {
				if (key == keyTable.keycodes.BACKSPACE) {
					this.testText = this.testText.slice(0,this.testText.length - 1);
				} else {
					this.testText += String.fromCharCode(this.input.keyboard.key);
				}
			}
		}
		
		// update text and sliders
		this.#updateUI();

		// re-adjust canvas size depending on the window resize
		this.#calcCanvasSize();

		// proc/draw all the classes
		const wid = this.plotter2dCanvas.width;
		const hit = this.plotter2dCanvas.height;

		// interact with mouse, calc all spaces
        this.plotter2d.proc(wid, hit, this.input.mouse);

		
		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);

		// now in user/cam space
		this.graphPaper.draw(this.doParametric ? "X" : "T", "Y");
		this.drawFun.draw(this.doParametric, this.lineStep, this.phase, this.graphPaper);

		if (this.doDebug) {
		//if (this.testDrawPrims) {
			// test new drawPrimitives class in user/cam space
			const r = 255;
			const g = 255;
			const b = 0;
			const colStrGen = "rgb(" + r + "," +  g + "," +  b + ")";
			const ndcScale = true; // just to show that the argument is ndcScale true/false

			// USER space
			// circles outline
			const lineWidth = undefined;
			this.drawPrim.drawACircleO([.5, .525], .125, lineWidth, "cyan");
			this.drawPrim.drawACircleO([.5, .475], .125, lineWidth, "brown", ndcScale);
			// rectangles outline
			this.drawPrim.drawARectangleO([.5, .25], [.25, .125], lineWidth, "blue");
			this.drawPrim.drawARectangleO([.5, 0], [.25, .125], lineWidth, "red", ndcScale);
			// circles fill
			this.drawPrim.drawACircle([.5, -.25], .0625, "cyan");
			this.drawPrim.drawACircle([.5, -.3], .0625, "brown", ndcScale);
			// rectangles fill
			this.drawPrim.drawARectangle([.5, -.52], [.25, .125], "blue");
			this.drawPrim.drawARectangle([.5, -.72], [.25, .125], "red", ndcScale);
			// lines
			this.drawPrim.drawALine([.375, -.9125], [.625, -.7875], lineWidth, "red");
			this.drawPrim.drawALine([.375, -1.0125], [.625, -.8875], lineWidth, "red", ndcScale);
			// text
			this.drawPrim.drawAText([.5, .875], [.255, .0625], "USER", "green", colStrGen);
			this.drawPrim.drawAText([.5, .75], [.55, .0625], "USER NDCSCALE", "green", colStrGen, ndcScale);

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
					this.drawPrim.drawALine(pentPoints[i], pentPoints[j], .01, "rgb(160, 90, 250)", ndcScale);
				}
			}

			// ndc space
			this.plotter2d.setSpace(Plotter2d.spaces.NDC);
			// circles outline
			this.drawPrim.drawACircleO([-.5, .525], .125, lineWidth, "brown");
			this.drawPrim.drawACircleO([-.5, .475], .125, lineWidth, "brown", ndcScale);
			// rectangles outline
			this.drawPrim.drawARectangleO([-.5, .25], [.25, .125], lineWidth, "green");
			this.drawPrim.drawARectangleO([-.5, 0], [.25, .125], lineWidth, "green", ndcScale);
			// circles fill
			this.drawPrim.drawACircle([-.5, -.25], .0625, "brown");
			this.drawPrim.drawACircle([-.5, -.3], .0625, "brown", ndcScale);
			// rectangles fill
			this.drawPrim.drawARectangle([-.5, -.52], [.25, .125], "green");
			this.drawPrim.drawARectangle([-.5, -.72], [.25, .125], "green", ndcScale);
			// lines
			this.drawPrim.drawALine([-.625, -.9125], [-.375, -.7875], lineWidth, "red");
			this.drawPrim.drawALine([-.625, -1.0125], [-.375, -.8875], lineWidth, "red", ndcScale);
			// text
			this.drawPrim.drawAText([-.5, .875], [.25, .0625], "NDC", "green", colStrGen);
			this.drawPrim.drawAText([-.5, .75], [.5, .0625], "NDC NDCSCL", "green", colStrGen, ndcScale);
		
			// SCREEN space
			this.plotter2d.setSpace(Plotter2d.spaces.SCREEN);
			// circles outline
			this.drawPrim.drawACircleO([120, 180], 40, 5, "blue");
			this.drawPrim.drawACircleO([120, 200], 40, 5, "blue", ndcScale);
			// rectangles outline
			this.drawPrim.drawARectangleO([120, 300], [80, 50], 5, "purple");
			this.drawPrim.drawARectangleO([120, 370], [80, 50], 5, "purple", ndcScale);
			// circles fill
			this.drawPrim.drawACircle([120, 480], 20, "blue");
			this.drawPrim.drawACircle([120, 500], 20, "blue", ndcScale);
			// rectangles fill
			this.drawPrim.drawARectangle([120, 600], [80, 50], "purple");
			this.drawPrim.drawARectangle([120, 670], [80, 50], "purple", ndcScale);
			// lines
			this.drawPrim.drawALine([70, 720], [170, 780], 5, "red");
			this.drawPrim.drawALine([70, 760], [170, 820], 5, "red", ndcScale);
			// text
			this.drawPrim.drawAText([120, 50], [160, 30], "SCN", "white", "blue");
			this.drawPrim.drawAText([120, 100], [200, 30], "SCN NDCSCL", "white", "blue", ndcScale);
		}
	}

	#animate() {
		// speed of update
		this.cur += this.num;
		if (this.cur >= this.num) {
			this.cur -= this.den;
			this.#proc();
		}
		// end speed of update
	
		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
