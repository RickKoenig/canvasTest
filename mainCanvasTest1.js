'use strict';

// elements

// input log
const textInputLog = document.getElementById("textInputLog");

// main canvas
const drawarea = document.getElementById("drawarea");
const mycanvas2 = document.getElementById("mycanvas2");
const mycanvas2Ctx = mycanvas2.getContext("2d");
const canvasDimTxt = document.getElementById("canvasDimTxt"); // where to update text for canvas dimensions

// Parametric checkbox
const checkboxParametric = document.getElementById("checkboxParametric");

// slider phase
const sliderPhase = document.getElementById("sliderPhase");
const textPhase = document.getElementById("textPhase");

// slider freq
const sliderFreq = document.getElementById("sliderFreq");
const textFreq = document.getElementById("textFreq");

// number of line steps
const sliderLineStep = document.getElementById("sliderLineStep");
const textLineStep = document.getElementById("textLineStep");

// scale camera
const textSclCam = document.getElementById("textSclCam");

// x trans camera
const sliderXTransCam = document.getElementById("sliderXTransCam");
const textXTransCam = document.getElementById("textXTransCam");

// y trans camera
const sliderYTransCam = document.getElementById("sliderYTransCam");
const textYTransCam = document.getElementById("textYTransCam");

// user functions
const labelFunctionF1 = document.getElementById("labelFunctionF1");
const labelFunctionF2 = document.getElementById("labelFunctionF2");
const editFunctionF = document.getElementById("editFunctionF");
const editFunctionG = document.getElementById("editFunctionG");
const textFunctionF = document.getElementById("textFunctionF");
const textFunctionG = document.getElementById("textFunctionG");

let startTextFunctionF = "t";
let startTextFunctionG = "sin(t) + 1/3*sin(3*t) + 1/5*sin(5*t) + 1/7*sin(7*t) + 1/9*sin(9*t)";

// some SWITCHES
// show a lot of messages, input, dimensions etc.
const verboseDebug = false;

let doParametric = checkboxParametric.checked; // UI checkbox toggle
// end some SWITCHES

// for sine wave
let phase = 0; // [0 to 2 * PI)
let freq = 0;

let drawFunctionF;
let drawFunctionG;

let fps;
let avgFps = 0;
let oldTime;

// speed of update
let num = 1;
let den = 1;
let cur = 0;
let avgFpsObj = new Runavg(500);
// end speed of update

// function edit box
editFunctionF.addEventListener("keyup", ({key}) => {
	if (key === "Enter") {
		submitFunctionF();
	}
});
editFunctionF.innerHTML = startTextFunctionF;

editFunctionG.addEventListener("keyup", ({key}) => {
	if (key === "Enter") {
		submitFunctionG();
	}
});
editFunctionG.innerHTML = startTextFunctionG;

submitFunctions();

initinput();
animate();

// functions

sclCamReset();
sliderPhaseChange(sliderPhase);
sliderFreqChange(sliderFreq);
lineStepReset();
xTransCamReset();
yTransCamReset();

// Parametric check box
checkboxParametric.addEventListener('change', () => {
	doParametric = checkboxParametric.checked;
});
// events

// phase
function sliderPhaseChange(id) {
	let flt = parseFloat(id.value);
	textPhase.innerHTML = "sliderPhase (p) = " + flt.toFixed(2);
	phase = flt;
}

function buttonPhaseReset() {
	phase = 0;
	updateUI();
}

// frequency
function sliderFreqChange(id) {
	let flt = parseFloat(id.value);
	textFreq.innerHTML = "sliderFreq = " + flt.toFixed(2);
	freq = flt / 100; // slow it down
}

function buttonFreqReset() {
	freq = 0;
	sliderFreq.value = 0;
	sliderFreqChange(sliderFreq);
}

// update some of the UI
function updateUI() {
	const plotHeader = "<pre>Move sliders, Press buttons<br> Enter functions<br>";

	const plotMouse =  "<br>plot MX = " + plot[0].toFixed(2) 
					+ ", plot MY = " + plot[1].toFixed(2);
	const fpsStr = "<br>FPS " + avgFps.toFixed(2);
	if (verboseDebug) {
		const plotterDebugInfo = "<br>Screen draw dim = (" + W[0] + " , " + W[1] + ")"
		+ "<br><br>ndcMin[0] = " + ndcMin[0].toFixed(2) + ", ndcMin[1] = "  + ndcMin[1].toFixed(2)
		+ "<br>ndcMax[0] = " + ndcMax[0].toFixed(2) + ", ndcMax[1] = "  + ndcMax[1].toFixed(2)
		+ "<br><br>camMin[0] = " + camMin[0].toFixed(2) + ", camMin[1] = "  + camMin[1].toFixed(2)
		+ "<br>camMax[0] = " + camMax[0].toFixed(2) + ", camMax[1] = "  + camMax[1].toFixed(2)
		+ "<br>";
		canvasDimTxt.innerHTML = plotHeader + plotterDebugInfo + plotMouse + fpsStr;
	} else {
		let useInfo = doParametric 
					? "x = F(t),  y = G(t + p)<br>0 <= t < 2*PI" 
					: "y = G(t + p)<br>" + camMin[0].toFixed(2) 
						+ " <= t < " + camMax[0].toFixed(2);
		useInfo += "<br>0 <= p < 2*PI";
		canvasDimTxt.innerHTML = plotHeader + useInfo + plotMouse + fpsStr;
	}
	textSclCam.innerHTML = "zoomCam = " + zoom.toFixed(4) + ", logZoomCam = " + lzoom.toFixed(3);
	const vis = doParametric ? "" : "none";
	labelFunctionF1.style.display = vis;
	editFunctionF.style.display = vis;
	labelFunctionF2.style.display = vis;
	textFunctionF.style.display = vis;

	textXTransCam.innerHTML = "center[0] = " + center[0].toFixed(2);
	textYTransCam.innerHTML = "center[1] = " + center[1].toFixed(2);

	// show inputEventsStats
	if (verboseDebug) {
		textInputLog.innerHTML = "INPUT LOG<br><br>Mstat: " + mouseStats + "<br><br>"
			+ "Kstat:" + keyboardStats + "<br><br>"
			+ "Input event: " + inputEventsStats;
	}
	// update sliders
	sliderPhase.value = phase;
	sliderPhaseChange(sliderPhase);
}

// proc 

function slowAnimate() {
	inputproc();
	plotter2dproc();
	calcNdcAndCam();

	phase += freq;
	let twoPI = 2 * Math.PI;
	if (phase >= twoPI) {
		phase -= twoPI;
	} else if (phase < 0) {
		phase += twoPI;
	}

	updateUI();

	// draw everything to canvas
	draw(mycanvas2Ctx);
}

function animate() {
	// update FPS
	if (oldTime === undefined) {
		oldTime = performance.now();
		fps = 0;
	} else {
		const newTime = performance.now();
		const delTime =  newTime - oldTime;
		oldTime = newTime;
		fps = 1000 / delTime;
	}
	avgFps = avgFpsObj.add(fps);

	// speed of update
	cur += num;
	if (cur >= num) {
		cur -= den;
		slowAnimate();
	}
	// end speed of update

	// keep animation going
	requestAnimationFrame(animate);
}
