'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp.numInstances;
	}

	constructor() {
		console.log("\n############# creating instance of MainApp");
		++MainApp.numInstances;

		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		//this.vp = null; // OR, no vertical panel UI
		this.eles = {}; // keep track of eles in vertical panel

		// add all elements from vp to ele if needed
		// uncomment if you need elements from vp html
		//populateElementIds(this.vp, this.eles);

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
		console.log("click sound");
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		this.count = 0; // frame counter

		// objects
		this.leftWall = 0;
		this.rightWall = 3;
		this.wallWidth = .01;
		this.posX = 1;
		this.velX = 1;
		this.rad = .125;

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
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "button", null, null, "Reset Counter", this.#resetCounter.bind(this));
		makeEle(this.vp, "button", null, null, "Reset Counter 10000", 
			() => {
				this.count = 10000;
			}
		);
		makeEle(this.vp, "hr");
		{
			const label = "test combo";
			const min = 33;
			const max = 87;
			const start = 44;
			const step = 3;
			const precision = 4;
			const callback = null;
			new makeEleCombo(this.vp, label, min, max, start, step, precision, callback);
		}
		makeEle(this.vp, "button", null, null, "Setup audio context, PLAY",
			() => {
				console.log("gesture sound");
			}
		);
	}		
	
	#userProc() {
		// proc objects
		if (this.avgFps) {
			this.posX += this.velX / this.avgFps;
			let penLeft = this.leftWall - this.posX;
			let penRight = this.posX - this.rightWall;
			if (penLeft > 0) {
				this.posX += 2 * penLeft;
				this.velX = -this.velX;
				this.#clickSound();
			} else if (penRight > 0) {
				this.posX -= 2 * penRight;
				this.velX = -this.velX;
				this.#clickSound();
			}
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

		// update count
		++this.count;
	}

	#userDraw() {
		// pnts
		const pnt = [1.5, 1];
		this.drawPrim.drawCircleO([this.posX, 0], this.rad, undefined, "magenta");
		this.drawPrim.drawLine([this.leftWall, -5], [this.leftWall, 5], this.wallWidth, "red");
		this.drawPrim.drawLine([this.rightWall, -5], [this.rightWall, 5], this.wallWidth, "red");
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Frame Count = " + this.count;
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

	#resetCounter() {
		this.count = 0;
	}
}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
