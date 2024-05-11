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

	#clickSound() {
	// audio context from gesture
		if (!this.audioCtx) {
			this.audioCtx = new window.AudioContext();
		}
		const oscillator = this.audioCtx.createOscillator();
		const gainNode = this.audioCtx.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(this.audioCtx.destination);

		gainNode.gain.value = .125;
		oscillator.frequency.value = 2000;
		const duration = .5;
		oscillator.type = 'sine';
		oscillator.start();
		oscillator.stop(this.audioCtx.currentTime + duration / 1000); // click
	}

	#physicsReset() {
		let massM1;
		// keep mass M1 when reseting
		if (this.phyObjs) massM1 = this.phyObjs[1].mass;
		this.phyObjs = [
			{ // Obj0
				mass: 1,
				velX: .5,
				posX: 1.25
			}, { // Obj1
				mass: 1,
				velX: .4,
				posX: 2.25
			}
		];
		if (massM1) this.phyObjs[1].mass = massM1;
		this.count = 0;
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		this.count = 0; // frame counter

		// objects
		this.leftWall = 0;
		this.rightWall = 3;
		this.wallWidth = .01;
		this.objRadius = .25;
		this.#physicsReset();
		this.running = false;

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [2, 0];
		this.startZoom = .5;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		// info
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
		// combo playback speed
		{
			const label = "Playback speed";
			const min = -3;
			const max = 3;
			const start = 0;
			const step = .25;
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
				this.eles.playStopButton.innerHTML = this.running ? "STOP" : "PLAY";
			}
		);
		// resetsimulation button
		makeEle(this.vp, "button", null, null, "Start over",
			() => {
				this.#physicsReset();
				this.running = false;
				this.eles.playStopButton.innerHTML = "PLAY";
			}
		);
		makeEle(this.vp, "hr");

		// combo mass right object
		{
			const label = "Mass of Obj2";
			const min = 0;
			const max = 6;
			const start = 0;
			const step = .5;
			const precision = 0;
			new makeEleCombo(this.vp, label, min, max, start, step, precision
				, (outVal) => {
					this.#physicsReset();
					this.phyObjs[1].mass = outVal;
					this.running = false;
					this.eles.playStopButton.innerHTML = "PLAY";
				}
				// conversion from internal 'in' value to an external 'out' value
				, (val) => Math.floor(Math.pow(10, val))
			);
		}
	}

	#updatePhysics(step) {
		if (this.running && this.avgFps) {
			for (const phyObj of this.phyObjs) {
				// move
				phyObj.posX += phyObj.velX * step / this.avgFps;
			}
			for (const phyObj of this.phyObjs) {
				// collide with walls
				// left wall
				if (phyObj.velX < 0) {
					let penLeft = this.leftWall - phyObj.posX + this.objRadius;
					if (penLeft > 0) {
						phyObj.posX += 2 * penLeft;
						phyObj.velX = -phyObj.velX;
						this.#clickSound();
						++this.count;
					}
				}
				// right wall
				if (phyObj.velX > 0) {
					let penRight = phyObj.posX - this.rightWall + this.objRadius;
					if (penRight > 0) {
						phyObj.posX -= 2 * penRight;
						phyObj.velX = -phyObj.velX;
						this.#clickSound();
						++this.count;
					}
				}
				for (const phyObj of this.phyObjs) {
					// collide with phyObjs, assume only 2 phyObjs, and for now just a mass of 1 for both objects
				}
			}
		}
	} 

	/*	#updatePhysics(step) {
		if (this.running && this.avgFps) {
			// move
			this.posX += this.velX * step / this.avgFps;
			// collide
			let penLeft = this.leftWall - this.posX + this.objRadius;
			let penRight = this.posX - this.rightWall + this.objRadius;
			if (penLeft > 0) {
				this.posX += 2 * penLeft;
				this.velX = -this.velX;
				this.#clickSound();
				++this.count;
			} else if (penRight > 0) {
				this.posX -= 2 * penRight;
				this.velX = -this.velX;
				this.#clickSound();
				++this.count;
			}
		}
	} */

	#userProc() {
		// proc objects
		this.#updatePhysics(this.playSpeed);
		
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
	}

	#userDraw() {
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
		this.drawPrim.drawLine([this.rightWall, -5], [this.rightWall, 5], this.wallWidth, "red");
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Collisions = " + this.count;
		countStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		this.eles.textInfoLog.innerText = countStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.plotter2d.proc(this.vp, this.input.mouse, Mouse.LEFT);
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
