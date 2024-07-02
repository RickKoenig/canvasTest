'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
class MainApp {

	// assume times and freqs are equal size, <= maxFft, and powers of 2
	constructor() {
		console.log("\n############# creating instance of MainApp");

		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		this.eles = {}; // keep track of eles in vertical panel

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
		this.#animate();
	}

	#timeReset() {
		this.time = 0;
	}

	// how much to move in a frame
	// proc stuff here
	#timeStep(fullStep, forceRunning) {
		let step = fullStep;
		// time step
		if ((this.running || forceRunning) && this.avgFpsRound) {
			if (this.reverse) step = -step;
			this.time += step;
			if (this.time < 0) ++this.time;
			if (this.time >= 1) --this.time;
		}
		const key = this.input.keyboard.key;
		// toggle scroll lock
		if (key == 's'.charCodeAt(0)) {
			this.scrollLock = !this.scrollLock;
			this.eles.scrollLock.checked = this.scrollLock;
		}	

		// region of interest
		const r = 1 + .25 * (this.depth - 1);
		const ang = 2 * Math.PI * this.time;
		this.roi = [r * Math.cos(ang), r * Math.sin(ang)];
	}
	#initElements() {
		this.numElements = 8; // a power of 2
		this.timeDom = Array(this.numElements);
		this.freqDom = Array(this.numElements);
		for (let i = 0; i < this.numElements; ++i) {
			this.timeDom[i] = [0, 0];
			this.freqDom[i] = [0, 0];
		}

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [4.7, 2.5];
		this.startZoom = .16;

	}

	// USER: add more members or classes to MainApp
	#userInit() {
		this.fft = new Fft();
		// user init section
		this.#initElements();
		this.#timeReset();
		this.scrollLock = false;
		this.noLastSine = true;

		// objects
		this.running = false;

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .69;
	}

	#userBuildUI() {
		// scroll lock
		makeEle(this.vp, "hr");
		makeEle(this.vp, "span", null, "marg", "Scroll Lock");
		this.eles.scrollLock = makeEle(this.vp, "input", "scrollLock", null, "ho", (val) => {
			this.scrollLock = this.eles.scrollLock.checked;
		}, "checkbox");
		this.eles.scrollLock.checked = this.scrollLock;
		makeEle(this.vp, "br");

		// no last sine
		makeEle(this.vp, "span", null, "marg", "No highest freq sine");
		this.eles.noLastSine = makeEle(this.vp, "input", "noLastSine", null, "ho", (val) => {
			this.noLastSine = this.eles.noLastSine.checked;
		}, "checkbox");
		this.eles.noLastSine.checked = this.noLastSine;
		
		// info
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		// combo playback speed
		{
			const label = "Depth";
			const min = 1;
			const max = 20;
			const start = 1;
			const step = 1;
			const precision = 0;
			this.speedCombo = new makeEleCombo(this.vp, label, min, max, start, step, precision
				, (outVal) => {
					this.depth = outVal;
				}
			);
		}

		makeEle(this.vp, "hr");

		// combo playback speed
		{
			const label = "Playback speed";
			const min = -4;
			const max = 0;
			const start = -1;
			const step = .0625;
			const precision = 4;
			this.speedCombo = new makeEleCombo(this.vp, label, min, max, start, step, precision
				, (outVal) => {
					this.playSpeed = outVal;
				}
				// conversion from internal 'in' value to an external 'out' value
				, (val) => Math.pow(10, val)
			);
		}
		// stop / pause button
		this.eles.playStopButton = makeEle(this.vp, "button", null, null, "PLAY",
			() => {
				this.running = !this.running;
				this.eles.playStopButton.innerHTML = this.running ? "PAUSE" : "PLAY";
			}
		);
		makeEle(this.vp, "button", null, null, "STEP",
			() => {
				const step = .125;
				this.#timeStep(step, true);
			}
		);
		makeEle(this.vp, "button", null, null, "REVERSE",
			() => {
				this.reverse = !this.reverse;
			}
		);
		// reset simulation button
		makeEle(this.vp, "button", null, null, "REWIND",
			() => {
				this.#timeReset();
				this.reverse = false;
				this.running = false;
				this.eles.playStopButton.innerHTML = "PLAY";
			}
		);
		makeEle(this.vp, "hr");
	}

	#userProc() {
		// proc objects
		if (this.avgFpsRound) this.#timeStep(this.playSpeed / this.avgFpsRound);
		
		// update FPS
		if (this.oldTime === undefined) {
			this.oldTime = performance.now();
			this.fps = 0;
		} else {
			const newTime = performance.now();
			const deltaTime =  newTime - this.oldTime;
			this.oldTime = newTime;
			this.fps = 1000 / deltaTime;
		}
		this.avgFps = this.avgFpsObj.add(this.fps);
		this.avgFpsRound = Math.round(this.avgFps);
	}

	#userDraw() {
		const time = this.time % 1;
		this.drawPrim.drawCircleO([0, 0], 1,  .001, "black");
		const ang = 2 * Math.PI * time;
		for (let d = 0; d < this.depth; ++d) {
			const r = 1 + .25 * d;
			const center = [r * Math.cos(ang), r * Math.sin(ang)];
			this.drawPrim.drawCircle(center, .04,  this.noLastSine ? "red" : "green");
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "";
		infoStr += "Avg fps = " + this.avgFpsRound.toString();
		infoStr += "\nTIME = " + this.time.toFixed(3);
		this.eles.textInfoLog.innerText = infoStr;
	}

	// proc
	#animate() {
		// update input system
		this.input.proc();
		// user proc
		this.#userProc();
		// plotter2d UI proc
		this.plotter2d.proc(this.vp, this.input.mouse, Mouse.LEFT, this.scrollLock ? this.roi : null);

		// start drawing
		this.plotter2d.clearCanvas();
		// calc all coord spaces
		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);
		// now in user/cam space
		this.graphPaper.draw();
		// USER: do USER draw stuff
		this.#userDraw(); //draw
		// update UI, text
		this.#userUpdateInfo();

		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
