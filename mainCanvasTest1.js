'use strict';

// handle the html elements, do the UI on verticalButtons, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #instances = 0; // test static members
	constructor() {
		console.log("creating instance of MainApp");
		++MainApp.#instances;

		// get all the elements, clean this up, make an array/list/object of all this stuff

		// input log
		this.textInputLog = document.getElementById("textInputLog");

		// main canvas
		this.drawarea = document.getElementById("drawarea");
		this.mycanvas2 = document.getElementById("mycanvas2");
		this.ctx = mycanvas2.getContext("2d");
		this.canvasDimTxt = document.getElementById("canvasDimTxt"); // where to update text for canvas dimensions

		// Parametric checkbox
		this.checkboxParametric = document.getElementById("checkboxParametric");
		// debug checkbox
		this.checkboxDebug = document.getElementById("checkboxDebug");

		// slider phase
		this.sliderPhase = document.getElementById("sliderPhase");
		this.textPhase = document.getElementById("textPhase");
		this.buttonPhase = document.getElementById("buttonPhase");

		// slider freq
		this.sliderFreq = document.getElementById("sliderFreq");
		this.textFreq = document.getElementById("textFreq");
		this.buttonFreq = document.getElementById("buttonFreq");

		// number of line steps
		this.sliderLineStep = document.getElementById("sliderLineStep");
		this.textLineStep = document.getElementById("textLineStep");
		this.buttonLineStep = document.getElementById("buttonLineStep");

		// scale camera
		this.textScalelCam = document.getElementById("textScaleCam");
		this.buttonScaleCam = document.getElementById("buttonScaleCam");

		// x trans camera
		this.textXTransCam = document.getElementById("textXTransCam");
		this.buttonXTransCam = document.getElementById("buttonXTransCam");

		// y trans camera
		this.textYTransCam = document.getElementById("textYTransCam");
		this.buttonYTransCam = document.getElementById("buttonYTransCam");

		// user functions
		this.labelFunctionF1 = document.getElementById("labelFunctionF1");
		this.labelFunctionF2 = document.getElementById("labelFunctionF2");
		this.editFunctionF = document.getElementById("editFunctionF");
		this.editFunctionF.style="height:20px"; // make smaller than default
		this.editFunctionG = document.getElementById("editFunctionG");
		this.editFunctionG.style="height:20px"; // make smaller than default		
		this.textFunctionF = document.getElementById("textFunctionF");
		this.textFunctionG = document.getElementById("textFunctionG");
		this.buttonSubmitFunctions = document.getElementById("submitFunctions");

		// some SWITCHES
		this.doDebug = false; // show a lot of messages, input, dimensions etc.
		this.userCircleTest = false;
		this.testText = "test text";
		this.doParametric = false; // normal or parametric function(s)
		this.runFunGenTests = false; // test function generator
		// end some SWITCHES

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

		this.input = new Input(this.drawarea, this.mycanvas2);
		this.plotter2d = new Plotter2d(this.ctx);
		this.graphPaper = new GraphPaper(this.ctx, this.plotter2d);
		this.drawFun = new DrawFun(this.ctx, this.plotter2d);

		if (this.runFunGenTests) {
			FunGen.runTests();
		}


		this.textStartFunctionF = "t";
		this.textStartFunctionG = "sin(t) + 1/3*sin(3*t) + 1/5*sin(5*t) + 1/7*sin(7*t) + 1/9*sin(9*t)";
		this.#resetFunctions();
		this.#submitFunctions();
		this.buttonSubmitFunctions.addEventListener('click', () => {
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


		this.#animate();
	}



	#buttonScaleCamReset() {
		//const p = this.plotter2d.params;
		//p.zoom = .1;
		//p.lzoom = .2;
		this.plotter2d.scaleReset();
	}

	#buttonXTransCamReset() {
		const p = this.plotter2d.params;
		p.center[0] = 0;
	}

	#buttonYTransCamReset() {
		const p = this.plotter2d.params;
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
			let lenMinus1 = funStr.length - 1;
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
 		editFunctionF.style.height = editFunctionF.scrollHeight + extraHeight + 'px';
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
 		editFunctionG.style.height = editFunctionG.scrollHeight + extraHeight + 'px';
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

	static getInstances() { // test static methods
		return MainApp.#instances;
	}

	// update some of the UI
	#updateUI() {
		const plotHeader = "Move sliders, Press buttons<br> Enter functions<br>";

		let p = this.plotter2d.params;
		const plotMouse =  "<br>plot MX = " + p.plot[0].toFixed(2) 
						+ ", plot MY = " + p.plot[1].toFixed(2);

		const fpsStr = "<br>FPS " + this.avgFps.toFixed(2);
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
		
		textScaleCam.innerHTML = "zoom = " + p.zoom.toFixed(4) + ", logZoom = " + p.lzoom.toFixed(3);
		
		const vis = this.doParametric ? "" : "none";
		labelFunctionF1.style.display = vis;
		editFunctionF.style.display = vis;
		labelFunctionF2.style.display = vis;
		textFunctionF.style.display = vis;

		textXTransCam.innerHTML = "center[0] = " + p.center[0].toFixed(2);
		textYTransCam.innerHTML = "center[1] = " + p.center[1].toFixed(2);

		// show inputEventsStats
		textInputLog.innerHTML = this.doDebug
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
		 // TODO: no magic numbers
		if (fixedDim) {
			const fixedSize = [800, 600];
			// set canvas size to a fixed size
			this.mycanvas2.width = fixedSize[0];
			this.mycanvas2.height = fixedSize[1];
		} else {
			// set canvas size depending on window size
			// TODO: get rid of magic numbers
			let wid = window.innerWidth - 450;
			let hit = window.innerHeight - 100;
			this.mycanvas2.width = Math.max(200, wid);
			this.mycanvas2.height = Math.max(750, hit);
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
		this.input.proc(this.mycanvas2);

		// update text and sliders
		this.#updateUI();
	
		// update phase given freq
		this.phase += this.freq * (this.maxPhase - this.minPhase) / this.fpsScreen;
		let twoPI = 2 * Math.PI;
		if (this.phase >= twoPI) {
			this.phase -= twoPI;
		} else if (this.phase < 0) {
			this.phase += twoPI;
		}
	
		// test keyboard type a string
		if (this.doDebug) {
			let key = this.input.keyboard.key;
			if (key) {
				if (key == keyTable.keycodes.BACKSPACE) {
					this.testText = this.testText.slice(0,this.testText.length - 1);
				} else {
					this.testText += String.fromCharCode(this.input.keyboard.key);
				}
			}
		}

		// re-adjust canvas size depending on the window resize
		this.#calcCanvasSize();

		if (this.userCircleTest) {
			// first user test canvas before calling plotter2d proc, screen space
			// draw a circle at some coords, use the mouse or canvas size
			this.ctx.beginPath();
			this.ctx.lineWidth = 10;
			this.ctx.arc(this.input.mouse.mx, this.input.mouse.my, 30, 0, Math.PI * 2);
			this.ctx.strokeStyle = "green";
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.lineWidth = 10;
			this.ctx.arc(this.mycanvas2.width / 2, this.mycanvas2.height / 2, 30, 0, Math.PI * 2);
			this.ctx.strokeStyle = "green";
			this.ctx.stroke();
		}
	
		this.plotter2d.proc(this.mycanvas2.width, this.mycanvas2.height, this.input.mouse);
		this.graphPaper.draw(this.doParametric ? "X" : "T", "Y");
		this.drawFun.draw(this.doParametric, this.lineStep, this.phase, this.graphPaper);
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

let mainApp = new MainApp();
console.log("instances of MainApp = " + MainApp.getInstances()); // and test static methods
