'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
class MainApp {

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

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		this.#timeReset();

		// objects
		this.running = false;

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldmousePos; // for delta mousePos
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [5, 2.5];
		this.startZoom = .16;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		// info
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");

		makeEle(this.vp, "span", null, "marg", "Frequency Domain");
		this.eles.freqDomain = makeEle(this.vp, "input", "freqDomain", null, "ho", (val) => {
			this.freqDomain = this.eles.freqDomain.checked;
		}, "checkbox");
		this.eles.freqDomain.checked = this.freqDomain;
		makeEle(this.vp, "hr");

		// combo playback speed
		{
			const label = "Playback speed";
			const min = -3;
			const max = 3;
			const start = 0;
			const step = .0625;
			const precision = 3;
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
				this.#timeStep(1, true);
			}
		);
		// reset simulation button
		makeEle(this.vp, "button", null, null, "Start over",
			() => {
				this.#timeReset();
				this.running = false;
				this.eles.playStopButton.innerHTML = "PLAY";
			}
		);
		makeEle(this.vp, "hr");

	}
	#timeReset() {
		this.sepDist = 5;
		this.time = 0;
		const logOrder = 3;
		this.elements = 1 << logOrder;
		this.timeDom = [];
		for (let i = 0; i < this.elements; ++i) {
			this.timeDom.push([.25 + .125 * i, .5 - .125 * i]);
		}
		this.freqDom = [];
		/*for (let i = 0; i < this.elements; ++i) {
			this.freqDom.push([.25 + .25 * i, .5 - .25 * i]);
		}*/
		this.hilit = -1;
		this.cursorObj = {
			pos: [0, 0],
			pressed: false
		}
	}

	// how much to move in a frame
	// proc stuff here
	#timeStep(fullStep, forceRunning) {
		let step = fullStep;
		this.cursorObj.pos = this.plotter2d.userMouse.slice();
		const mousePos = this.cursorObj.pos;
		this.cursorObj.pressedLeft = this.input.mouse.mbut[Mouse.LEFT];
		this.cursorObj.pressedRight = this.input.mouse.mbut[Mouse.RIGHT];
		this.hilit = Math.round(mousePos[0]);
		if (this.hilit >=0 && this.hilit < this.elements) {
			if (this.freqDomain) {
				if (this.cursorObj.pressedLeft) {
					this.freqDom[this.hilit][0] = mousePos[1] - this.sepDist;
				}
				if (this.cursorObj.pressedRight) {
					this.freqDom[this.hilit][1] = mousePos[1] - this.sepDist;
				}
			} else {
				if (this.cursorObj.pressedLeft) {
					this.timeDom[this.hilit][0] = mousePos[1];
				}
				if (this.cursorObj.pressedRight) {
					this.timeDom[this.hilit][1] = mousePos[1];
				}
			}
		}
		const numEle = this.timeDom.length;
		if (this.freqDomain) {
			// freq to time
			for (let i = 0; i < this.timeDom.length; ++i) {
				const freq = this.freqDom[numEle - 1 - i];
				this.timeDom[i] = [-freq[0], -freq[1]];
			}
		} else {
			// time to freq
			for (let i = 0; i < this.timeDom.length; ++i) {
				const time = this.timeDom[numEle - 1 - i];
				this.freqDom[i] = [-time[0], -time[1]];
			}
		}
		if ((this.running || forceRunning) && this.avgFpsRound) {
			this.time += step;
		}
	}

	#userProc() {
		// proc objects
		if (this.avgFpsRound) {
			this.#timeStep(this.playSpeed / this.avgFpsRound);
		}
		
		// update FPS
		if (this.oldmousePos === undefined) {
			this.oldmousePos = performance.now();
			this.fps = 0;
		} else {
			const newmousePos = performance.now();
			const delmousePos =  newmousePos - this.oldmousePos;
			this.oldmousePos = newmousePos;
			this.fps = 1000 / delmousePos;
		}
		this.avgFps = this.avgFpsObj.add(this.fps);
		this.avgFpsRound = Math.round(this.avgFps);
	}

	#userDraw() {
		const sepAxis = 10;
		const realRad = .135;
		const imagRad = .1;
		const outlineRad = .175;
		const outline = .05;
		const textSize = .5;
		const textLeft = -.75;
		// draw sep line
		this.drawPrim.drawLine([0, this.sepDist], [sepAxis, this.sepDist], undefined, "blue");
		// draw labels
		this.drawPrim.drawText([textLeft, 0], [textSize, textSize], "Time");
		this.drawPrim.drawText([textLeft, this.sepDist], [textSize, textSize], "Freq");

		// draw time domain points
		for (let i = 0; i < this.timeDom.length; ++i) {
			const ampReal = this.timeDom[i][0];
			const centerReal = [i, ampReal];
			const ampImag = this.timeDom[i][1];
			const centerImag = [i, ampImag];
			this.drawPrim.drawCircle(centerReal, realRad,  "red");	
			this.drawPrim.drawCircle(centerImag, imagRad,  "green");	
			if (this.hilit == i && !this.freqDomain) {
				this.drawPrim.drawCircleO(centerReal, outlineRad,  outline, "black");	
				this.drawPrim.drawCircleO(centerImag, outlineRad,  outline, "black");	
			}
		}
		// draw frequency domain points
		for (let i = 0; i < this.freqDom.length; ++i) {
			const ampReal = this.freqDom[i][0];
			const centerReal = [i, ampReal + this.sepDist];
			const ampImag = this.freqDom[i][1];
			const centerImag = [i, ampImag + this.sepDist];
			this.drawPrim.drawCircle(centerReal, realRad,  "red");	
			this.drawPrim.drawCircle(centerImag, imagRad,  "green");	
			if (this.hilit == i & this.freqDomain) {
				this.drawPrim.drawCircleO(centerReal, outlineRad,  outline, "black");	
				this.drawPrim.drawCircleO(centerImag, outlineRad,  outline, "black");	
			}
		}
		// draw cursor (temp ?)
/*		this.drawPrim.drawCircle(this.cursorObj.pos, .125,  "blue");			
		if (this.cursorObj.pressed) {
			this.drawPrim.drawCircleO(this.cursorObj.pos, outlineRad,  undefined, "red");			
		} */

		/*
		// phyObjs
		for (const phyObj of this.phyObjs) {
			const center = [phyObj.posX, .25];
			let size = this.objRadius * 2.9 / (.5 + Math.floor(Math.log10(phyObj.mass)));
			size = Math.min(.5, size);
			this.drawPrim.drawCircleO(center, this.objRadius, undefined, "magenta");
			this.drawPrim.drawText(center, [size, size], phyObj.mass);
		}
		// walls
		this.drawPrim.drawLine([this.leftWall, -5], [this.leftWall, 5], this.wallWidth, "red");
		//this.drawPrim.drawLine([this.rightWall, -5], [this.rightWall, 5], this.wallWidth, "red"); */
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "";
		infoStr += this.freqDomain ? "Edit Frequency Domain" : "Edit Time Domain";
		infoStr += "\ntime = " + this.time.toFixed(3);
		infoStr += "\nAvg fps = " + this.avgFpsRound.toFixed(2);
		this.eles.textInfoLog.innerText = infoStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.plotter2d.proc(this.vp, this.input.mouse, Mouse.MIDDLE);
		// USER: do USER stuff
		this.#userProc(); // proc

		this.plotter2d.clearCanvas();
		// interact with mouse, calc all spaces
		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);
		// now in user/cam space
		this.graphPaper.draw("X", "Y");
		// USER: do USER stuff
		this.#userDraw(); //draw
		// update UI, text
		this.#userUpdateInfo();

		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
