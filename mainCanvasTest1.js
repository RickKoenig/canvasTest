'use strict';

// handle the html elements, do the UI on verticalButtons, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #instances = 0; // test static members

	constructor() {
		console.log("creating mainApp");
		++MainApp.#instances;

		// get all the elements, clean this up, make an array/list/object of all this stuff

		// input log
		this.textInputLog = document.getElementById("textInputLog");

		// main canvas
		this.drawarea = document.getElementById("drawarea");
		this.mycanvas2 = document.getElementById("mycanvas2");
		this.mycanvas2Ctx = mycanvas2.getContext("2d");
		this.canvasDimTxt = document.getElementById("canvasDimTxt"); // where to update text for canvas dimensions

		// Parametric checkbox
		this.checkboxParametric = document.getElementById("checkboxParametric");

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
		this.textSclCam = document.getElementById("textSclCam");

		// x trans camera
		this.textXTransCam = document.getElementById("textXTransCam");

		// y trans camera
		this.textYTransCam = document.getElementById("textYTransCam");

		// user functions
		this.labelFunctionF1 = document.getElementById("labelFunctionF1");
		this.labelFunctionF2 = document.getElementById("labelFunctionF2");
		this.editFunctionF = document.getElementById("editFunctionF");
		this.editFunctionG = document.getElementById("editFunctionG");
		this.textFunctionF = document.getElementById("textFunctionF");
		this.textFunctionG = document.getElementById("textFunctionG");

		this.startTextFunctionF = "t";
		this.startTextFunctionG = "sin(t) + 1/3*sin(3*t) + 1/5*sin(5*t) + 1/7*sin(7*t) + 1/9*sin(9*t)";

		// some SWITCHES
		this.verboseDebug = false; // show a lot of messages, input, dimensions etc.
		this.doParametric = true; // normal or parametric function(s)
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

		// linestep, for plotter2 function drawer
		this.startLineStep = 150;
		this.lineStep = this.startLineStep;
		this.maxLineStep = 500;
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
			console.log("parametric changed to " + this.checkboxParametric.checked);
			this.doParametric = this.checkboxParametric.checked;
		});
		this.checkboxParametric.checked = this.doParametric; // UI checkbox toggle init

		// phase
		// phase slider
		this.sliderPhase.min = this.minPhase;
		this.sliderPhase.max = this.maxPhase;
		this.sliderPhase.step = this.stepPhase;
		this.sliderPhase.value = this.phase;
		this.sliderPhase.addEventListener('input', () => {
			console.log("sliderPhase input, this = " + this.sliderPhase.value);
			this.phase = parseFloat(this.sliderPhase.value);
		});
		// phase reset button
		this.buttonPhase.addEventListener('click', () => {
			console.log("buttonPhase reset");
			this.#buttonPhaseReset();
		});

		// freq
		// freq slider
		this.sliderFreq.min = this.minFreq;
		this.sliderFreq.max = this.maxFreq;
		this.sliderFreq.step = this.stepFreq;
		this.sliderFreq.value = this.freq;
		this.sliderFreq.addEventListener('input', () => {
			console.log("sliderFreq input, this = " + this.sliderFreq.value);
			this.freq = parseFloat(this.sliderFreq.value);
		});
		// freq reset button
		this.buttonFreq.addEventListener('click', () => {
			console.log("buttonFreq reset");
			this.#buttonFreqReset();
		});

		// line step
		// linestep slider
		this.sliderLineStep.min = this.minLineStep;
		this.sliderLineStep.max = this.maxLineStep;
		//this.sliderLineStep.step = this.stepFreq;
		this.sliderLineStep.value = this.startLineStep;
		this.sliderLineStep.addEventListener('input', () => {
			console.log("sliderLineStep input, this = " + this.sliderLineStep.value);
			this.lineStep = parseFloat(this.sliderLineStep.value);
		});
		// linestep reset button
		this.buttonLineStep.addEventListener('click', () => {
			console.log("buttonLineStep reset");
			this.#buttonLineStepReset();
		});

/*
		<pre class="noMargins"><span id="textLineStep">hum0</span></pre>
		<input type="range" min="1" max="500" value="0" 
			class="slider" id="sliderLineStep"
			oninput="lineStepChange(this)" onchange="lineStepChange(this)">
		<button onclick="lineStepReset()">Line Step Reset</button>
		<hr>
 */

		/*
		// function edit box
		this.editFunctionF.addEventListener("keyup", ({key}) => {
			if (key === "Enter") {
				this.submitFunctionF();
			}
		}); */
/*
		this.editFunctionF.innerHTML = this.startTextFunctionF;

		this.editFunctionG.addEventListener("keyup", ({key}) => {
			if (key === "Enter") {
				this.submitFunctionG();
			}
		});
		this.editFunctionG.innerHTML = this.startTextFunctionG;
*/


//submitFunctions();

		//initinput();
		this.#animate();
	};

	// phase
	/*
	sliderPhaseChange(id) {
		let flt = parseFloat(id.value);
		this.textPhase.innerHTML = "sliderPhase (p) = " + flt.toFixed(2);
		this.phase = flt;
	}
*/
	#buttonPhaseReset() {
		console.log("button phase reset");
		this.phase = 0;
	}

	// freq
	/*
	sliderFreqChange(id) {
		let flt = parseFloat(id.value);
		this.textFreq.innerHTML = "sliderFreq = " + flt.toFixed(2);
		this.freq = flt;
	}
*/
	#buttonFreqReset() {
		console.log("button freq reset");
		this.freq = 0;
	}

	#buttonLineStepReset() {
		console.log("button lineStep reset");
		this.lineStep = this.startLineStep;
	}

static getInstances() { // test static methods
		return MainApp.#instances;
	};

	// update some of the UI
	#updateUI() {
		
		const plotHeader = "<pre>Move sliders, Press buttons<br> Enter functions<br>";

		const plotMouse =  "plotMouse"; /*"<br>plot MX = " + plot[0].toFixed(2) 
						+ ", plot MY = " + plot[1].toFixed(2);*/
		const fpsStr = "<br>FPS " + this.avgFps.toFixed(2);
		//avgFps = 0;
		if (false/*this.verboseDebug*/) {
			const plotterDebugInfo = "plotterDebugInfo";/*"<br>Screen draw dim = (" + W[0] + " , " + W[1] + ")"
			+ "<br><br>ndcMin[0] = " + ndcMin[0].toFixed(2) + ", ndcMin[1] = "  + ndcMin[1].toFixed(2)
			+ "<br>ndcMax[0] = " + ndcMax[0].toFixed(2) + ", ndcMax[1] = "  + ndcMax[1].toFixed(2)
			+ "<br><br>camMin[0] = " + camMin[0].toFixed(2) + ", camMin[1] = "  + camMin[1].toFixed(2)
			+ "<br>camMax[0] = " + camMax[0].toFixed(2) + ", camMax[1] = "  + camMax[1].toFixed(2)
			+ "<br>";*/
			this.canvasDimTxt.innerHTML = plotHeader + plotterDebugInfo + plotMouse + fpsStr;
		} else {
			let useInfo = this.doParametric
						? "YES x = F(t),  y = G(t + p)<br>0 <= t < 2*PI" 
						: "NO<br>NO"/*  y = G(t + p)<br>" + camMin[0].toFixed(2) 
							+ " <= t < " + camMax[0].toFixed(2);*/;
			useInfo += "<br>0 <= p < 2*PI";
			this.canvasDimTxt.innerHTML = plotHeader + useInfo + plotMouse + fpsStr;
		}
		/*
		textSclCam.innerHTML = "zoomCam = " + zoom.toFixed(4) + ", logZoomCam = " + lzoom.toFixed(3);
		*/
		const vis = this.doParametric ? "" : "none";
		labelFunctionF1.style.display = vis;
		editFunctionF.style.display = vis;
		labelFunctionF2.style.display = vis;
		textFunctionF.style.display = vis;
/*
		textXTransCam.innerHTML = "center[0] = " + center[0].toFixed(2);
		textYTransCam.innerHTML = "center[1] = " + center[1].toFixed(2);

		// show inputEventsStats
		if (verboseDebug) {
			textInputLog.innerHTML = "INPUT LOG<br><br>Mstat: " + mouseStats + "<br><br>"
				+ "Kstat:" + keyboardStats + "<br><br>"
				+ "Input event: " + inputEventsStats;
		}
		*/

		// update sliders
		this.sliderPhase.value = this.phase;
		this.sliderFreq.value = this.freq;
		this.sliderLineStep.value = this.lineStep;

		this.textPhase.innerHTML = "sliderPhase (p) = " + this.phase.toFixed(2);
		this.textFreq.innerHTML = "sliderFreq = " + this.freq.toFixed(2);
		this.textLineStep.innerHTML = "Line Step = " + this.lineStep.toFixed();
		
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
	
		//inputproc();
		//plotter2dproc();
		//calcNdcAndCam();
		this.phase += this.freq * (this.maxPhase - this.minPhase) / this.fpsScreen;
		let twoPI = 2 * Math.PI;
		if (this.phase >= twoPI) {
			this.phase -= twoPI;
		} else if (this.phase < 0) {
			this.phase += twoPI;
		}
	
		this.#updateUI();
	
		// draw everything to canvas
		//draw(mycanvas2Ctx);
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
console.log("instances of MainApp = " + MainApp.getInstances()); // test static methods

/*
// functions

sclCamReset();
sliderPhaseChange(sliderPhase);
sliderFreqChange(sliderFreq);
lineStepReset();
xTransCamReset();
yTransCamReset();

*/
