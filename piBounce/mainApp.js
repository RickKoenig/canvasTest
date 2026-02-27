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
		this.showAlert = true;

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [3, 0];
		this.startZoom = .45;
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
			this.speedCombo = new makeEleSliderCombo(this.vp, label, min, max, start, step, precision
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
				this.doneFlag = false;
				this.doneCount = 0;
			}
		);
		makeEle(this.vp, "button", null, null, "STEP",
			() => {
				this.#physicsStep(1, true);
				this.doneFlag = false;
				this.doneCount = 0;
			}
		);
		// reset simulation button
		makeEle(this.vp, "button", null, null, "Start over",
			() => {
				this.#physicsReset();
				this.running = false;
				this.eles.playStopButton.innerHTML = "PLAY";
				this.doneFlag = false;
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
			new makeEleSliderCombo(this.vp, label, min, max, start, step, precision
				, (outVal) => {
					this.phyObjs[1].mass = outVal;
					this.#physicsReset();
					this.running = false;
					this.eles.playStopButton.innerHTML = "PLAY";
				}
				// conversion from internal 'in' value to an external 'out' value
				, val => Math.floor(Math.pow(10, val))
			);
		}
	}

	#physicsReset() {
		this.leftWall = 0;
		this.rightWall = 6;
		this.wallWidth = .01;
		this.objRadius = .25;
		this.collisionTypesStrs = [
			"none",
			"objWallLeft",
			"objWallRight",
			"objObj"
		];
		this.collisionTypes = makeEnum(this.collisionTypesStrs);

		let massM1;
		// keep mass M1 when reseting
		if (this.phyObjs) massM1 = this.phyObjs[1].mass;
		// 2 objects and 1 or 2 walls
		this.phyObjs = [
			{ // Obj0
				mass: 1,
				posX: 2,
				velX: 0
			}, { // Obj1
				mass: 1,
				posX: 4,
				velX: -1
			}
		];
		if (massM1) this.phyObjs[1].mass = massM1;
		this.collisions = 0;
		this.doneCount = 0;
		this.doneFlag = false;
		this.time = 0;
		for (const po of this.phyObjs) {
			po.invMass = 1 / po.mass;
		}
	}

	// step time at collision
	#predictCollWallLeft(po) {
		if (po.velX >= 0) return Number.MAX_VALUE;
		const stepColl = (po.posX - this.objRadius - this.leftWall) / -po.velX;
		return stepColl;
	}

	/*
	#predictCollWallRight(po) {
		if (po.velX <= 0) return Number.MAX_VALUE;
		const stepColl = (this.rightWall - (po.posX + this.objRadius)) / po.velX;
		return stepColl;
	}*/

	#predictCollObjObj() {
		const p0 = this.phyObjs[0];
		const p1 = this.phyObjs[1];
		if (p0.velX <= p1.velX) return Number.MAX_VALUE;
		const stepColl = ((p1.posX - p0.posX) - 2 * this.objRadius) / (p0.velX - p1.velX);
		return stepColl;
	}

	// just move, no collisions
	#physicsMove(step) {
		//console.log("   move, step amount = " + step.toFixed(5));
		for (const phyObj of this.phyObjs) {
			// move
			phyObj.posX += phyObj.velX * step;
		}
	}

	// how much to move in a frame
	#physicsStep(fullStep, forceRunning) {
		let step = fullStep;
		//let showIntro = true;
		if ((this.running || forceRunning) && this.avgFpsRound) {
			let watchDog = 0;

			const p0 = this.phyObjs[0];
			const p1 = this.phyObjs[1];
			if (p0.velX >= 0 && p0.velX <= p1.velX) {
				this.doneCount += fullStep;
				this.doneFlag = true;
			}

			if (this.doneCount >= 2) {
				this.running = false;
				this.eles.playStopButton.innerHTML = "PLAY";
				this.doneCount = 0;
				return;
			}
			while(step > 0) {
				++watchDog;
				if (watchDog > 100000) {
					if (this.showAlert) {
						alert("watchdog hit in phyicsStep !!");
						this.showAlert = false;
					}
					break;
				}
				// predict collisions in time
				let stepColl = step; // the full amount
				let stepType = this.collisionTypes.none; // no collisions yet
				let collObjWall = -1; // no objects colliding with walls yet
				let predStep;
				for (let i = 0; i < this.phyObjs.length; ++i) {
					const phyObj = this.phyObjs[i];
					// check wall left
					predStep = this.#predictCollWallLeft(phyObj);
					if (predStep < stepColl) {
						stepType = this.collisionTypes.objWallLeft;
						stepColl = predStep;
						collObjWall = i;
					}
					/*
					// check wall right
					predStep = this.#predictCollWallRight(phyObj);
					if (predStep < stepColl) {
						stepType = this.collisionTypes.objWallRight;
						stepColl = predStep;
						collObjWall = i;
					}*/
				}
				
				// check obj to obj
				predStep = this.#predictCollObjObj();
				if (predStep < stepColl) {
					stepType = this.collisionTypes.objObj;
					stepColl = predStep;
				}
				// move to predicted positions for collision if any
				this.#physicsMove(stepColl);
				if (step > 100000000) {
					console.log("big step");
				}
				//if (!showIntro) console.log("step move = " + step.toFixed(4));
				step -= stepColl;
				// any collisions
				switch(stepType) {
				case this.collisionTypes.none:
					break;
				// both left and right wall collisions just negate the velocity
				case this.collisionTypes.objWallLeft:
				//case this.collisionTypes.objWallRight:
					const phyObj = this.phyObjs[collObjWall];
					phyObj.velX = -phyObj.velX;
					this.#clickSound();
					++this.collisions;
					/*if (showIntro) {
						console.log("------- physics step with step = " + step.toFixed(5) + " ----------");
						showIntro = false;
					}
					console.log("      step = " + step.toFixed(4) + " OBJ " + collObjWall + " COLLIDE WITH " + this.collisionTypesStrs[stepType]);
					*/
					break;
				case this.collisionTypes.objObj:
					/*if (showIntro) {
						console.log("------- physics step with step = " + step.toFixed(5) + " ----------");
						showIntro = false;
					}*/
					const p0 = this.phyObjs[0];
					const p1 = this.phyObjs[1];
					const impulse = 2 * (p0.velX - p1.velX) / (p0.invMass + p1.invMass);
					p0.velX -= impulse * p0.invMass;
					p1.velX += impulse * p1.invMass;
					this.#clickSound();
					++this.collisions;
					//console.log("      step = " + step.toFixed(4) + " COLLIDE WITH " + this.collisionTypesStrs[stepType]);
					break;
				}
			}
			this.time += fullStep;
		}
	}

	#userProc() {
		// proc objects
		if (this.avgFpsRound) {
			this.#physicsStep(this.playSpeed / this.avgFpsRound);
		}
		
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
		this.avgFpsRound = Math.round(this.avgFps);
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
		//this.drawPrim.drawLine([this.rightWall, -5], [this.rightWall, 5], this.wallWidth, "red");
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Collisions = " + this.collisions + "\n";
		if (this.doneFlag) infoStr += "Done!";
		infoStr += "\ntime = " + this.time.toFixed(3);
		infoStr += "\nAvg fps = " + this.avgFpsRound.toFixed(2);
		this.eles.textInfoLog.innerText = infoStr;
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
