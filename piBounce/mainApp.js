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

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		this.collisions = 0; // frame counter

		// objects
		this.#physicsReset();
		this.running = false;

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [3, 0];
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
			this.#physicsStep(60, true);
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

	#physicsReset() {
		this.leftWall = 0;
		this.rightWall = 6;
		this.wallWidth = .01;
		this.objRadius = .25;
		this.collisionTypes = makeEnum([
			"objWallLeft",
			"objWallRight",
			"objs"
		]);

		let massM1;
		// keep mass M1 when reseting
		if (this.phyObjs) massM1 = this.phyObjs[1].mass;
		// 2 objects and 1 or 2 walls
		this.phyObjs = [
			{ // Obj0
				mass: 1,
				posX: 2,
				velX: -1
			}, { // Obj1
				mass: 1,
				posX: 5,
				velX: 0
			}
		];
		if (massM1) this.phyObjs[1].mass = massM1;
		this.collisions = 0;
		this.time = 0;
	}

	// step time at collision
	#predictCollWallLeft(po) {
		if (po.velX >= 0) return Number.MAX_VALUE;
		const stepColl = (po.posX - this.leftWall - this.objRadius) / -po.velX;
		return stepColl;
	}

	#predictCollWallRight(po) {

	}

	// how much to move in a frame
	#physicsStep(step, force) {
		if ((this.running || force) && this.avgFps) {
			step /= this.avgFps;
			// predict collisions
			let stepColl = Number.MAX_VALUE;
			let stepType = null;
			let collObjWall = -1;
			for (let i = 0; i < this.phyObjs.length; ++i) {
				const phyObj = this.phyObjs[i];
				const predStep = this.#predictCollWallLeft(phyObj);
				if (predStep < stepColl) {
					stepColl = predStep;
					stepType = this.collisionTypes.objWallLeft;
					collObjWall = i;
				}
				console.log("pred step = " + predStep);
			}
			for (const phyObj of this.phyObjs) {
				// move
				phyObj.posX += phyObj.velX * step;
				// collide with walls
				// left wall
				if (phyObj.velX < 0) {
					let penLeft = this.leftWall - phyObj.posX + this.objRadius;
					if (penLeft > 0) {
						phyObj.posX += 2 * penLeft;
						phyObj.velX = -phyObj.velX;
						this.#clickSound();
						++this.collisions;
					}
				}
				// right wall
				if (phyObj.velX > 0) {
					let penRight = phyObj.posX - this.rightWall + this.objRadius;
					if (penRight > 0) {
						phyObj.posX -= 2 * penRight;
						phyObj.velX = -phyObj.velX;
						this.#clickSound();
						++this.collisions;
					}
				}
				//for (const phyObj of this.phyObjs) {
					// collide with phyObjs, assume only 2 phyObjs, and for now just a mass of 1 for both objects
				//}
			}
			this.time += step;
		}
	}

	// how much to move in a frame
	#physicsStepOld(step) {
		if (this.running && this.avgFps) {
			step /= this.avgFps;
			for (const phyObj of this.phyObjs) {
				// move
				phyObj.posX += phyObj.velX * step;
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
						++this.collisions;
					}
				}
				// right wall
				if (phyObj.velX > 0) {
					let penRight = phyObj.posX - this.rightWall + this.objRadius;
					if (penRight > 0) {
						phyObj.posX -= 2 * penRight;
						phyObj.velX = -phyObj.velX;
						this.#clickSound();
						++this.collisions;
					}
				}
				//for (const phyObj of this.phyObjs) {
					// collide with phyObjs, assume only 2 phyObjs, and for now just a mass of 1 for both objects
				//}
			}
			this.time += step;
		}
	}

	#userProc() {
		// proc objects
		this.#physicsStep(this.playSpeed);
		
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
		let countStr = "Collisions = " + this.collisions;
		countStr += "\ntime = " + this.time.toFixed(3);
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
