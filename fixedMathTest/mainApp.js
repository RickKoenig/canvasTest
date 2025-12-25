'use strict';

// do a consistent fixed point system in javascript

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp.numInstances;
	}

	mul(a, b) {
		return a * b;
	}

	testBind() {
		console.log("in test bind");
		const a = 3;
		const b = 4;
		const m = this.mul(a, b);
		console.log(m);

		const triple = this.mul.bind(null, 3);
		const c = 10;
		const d = triple(c);
		console.log(d);
	}

	constructor() {
		console.log("\n############# creating instance of MainApp");
		++MainApp.numInstances;

		unitTest(2, 6);
		this.testBind();

		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
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
		//const vp = this.vp;
		const vp = null;
		this.plotter2d = new Plotter2d(
			this.plotter2dCanvas, this.ctx, vp
			, this.startCenter, this.startZoom);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		this.drawFun = new DrawFun(this.graphPaper);
		//this.drawFun.changeFunctionG(function(x) {return(x * x)});

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.dirty = true; // draw at least once
		this.dirtyCount = 100;
		this.#animate();
	}


	#randomColor() {
		const r = getRandomInt(256);
		const g = getRandomInt(256);
		const b = getRandomInt(256);
		this.vp.style.background = `rgb(${r}, ${g}, ${b}`;
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		// measure frame rate
		this.fps;
		this.AvgFps = 0;
		this.oldTime; // for delta time
		this.AvgFpsObj = new Runavg(500);

		// position graphics
		this.startCenter = [.5, .5];
		this.startZoom = 1.8;
		this.pos = [0, 0];
		this.coefs = [0, 0, 0, 0];
		this.Err = 0;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		makeEle(this.vp, "button", null, null, "Random color", this.#randomColor.bind(this));
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
		{
			for (let i = 0; i < 4; ++i) {
				const label = "C" + (1 + 2 * i);
				const min = -1;
				const max = 1;
				const start = 0;
				const step = 1 / 32;
				const precision = 5;
				new makeEleCombo(this.vp, label, min, max, start, step, precision,
					(v) => {
						this.C1 = v;
						this.dirty = true;
						this.coefs[i] = v;
					}
				);
			}
		}
	}		
	
	#userProc() {
		// proc
		//this.dirty = true;
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
		this.AvgFps = this.AvgFpsObj.add(this.fps);
		this.Err = getMaxErr(this.coefs);
	}

	#userDraw() {
		const lineWid = .02;
    	this.drawPrim.drawRectangleO([0, 0], [1, 1], lineWid);
		this.drawFun.changeFunctionG((x) => Math.atan(x));
		this.drawFun.draw(false, 400, 0, "red");
		this.drawFun.changeFunctionG(calcCoef.bind(this, ...this.coefs));
		this.drawFun.draw(false, 400, 0, "green");
		this.drawPrim.drawCircleO(this.coefs, .01, .005, "red"); // cursor
		this.drawPrim.drawCircleO([this.coefs[2], this.coefs[3]], .01, .005, "green"); // cursor
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\n\nAvg fps = " + this.AvgFps.toFixed(2);
		infoStr += "\n\nX1 = " + this.coefs[0] 
			+ "\nX3 = "+ this.coefs[1]
			+ "\nX5 = "+ this.coefs[2]
			+ "\nX7 = "+ this.coefs[3]
		infoStr += "\n\nError = " + this.Err.toFixed(6);
		this.eles.textInfoLog.innerText = infoStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.LEFT) || this.dirty;
		// USER: do USER stuff
		this.#userProc(); // proc

		this.dirty = true; // test, always draw every frame
		//this.dirty = false;
		// draw when dirty
		if (this.dirty) {
			this.plotter2d.clearCanvas();
			// goto user/cam space
			this.plotter2d.setSpace(Plotter2d.spaces.USER);
			// now in user/cam space
			this.graphPaper.draw("X", "Y");
			// USER: do USER stuff
			this.#userDraw(); //draw
		}
		// update UI, text
		this.#userUpdateInfo();

		if (this.dirty) {
			this.dirtyCount = 100;
		} else {
			--this.dirtyCount;
			if (this.dirtyCount < 0) {
				this.dirtyCount = 0;
			}
		}
		this.dirty = false; // turn off drawing unless something changes

		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
