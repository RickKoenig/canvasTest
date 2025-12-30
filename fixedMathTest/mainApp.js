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
		this.startCenter = [0, 0];
		this.startZoom = .7;
		this.pos = [0, 0];
		this.coefs = [0, 0, 0, 0];
		this.Err = 0;

		// build error array
		this.errArr = [];
		this.res = 64;
		for (let y = -1; y <= 1; y += 1 / this.res) {
			const errRow = [];
			for (let x = -1; x <= 1; x += 1 / this.res) {
				//const err = x * x + y * y;
				const coefs = [x, y, 0, 0];
				const err = getMaxErr(coefs);
				errRow.push(err);
			}
			this.errArr.push(errRow);
		}
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
				const step = 1 / 256;
				const precision = 5;
				new makeEleCombo(this.vp, label, min, max, start, step, precision,
					(v) => {
						this.dirty = true;
						this.coefs[i] = v;
					}
				);
			}
			{
				const label = "offset";
				const min = -16;
				const max = 16;
				const start = 0;
				const step = 1 / 256;
				const precision = 5;
				new makeEleCombo(this.vp, label, min, max, start, step, precision,
					(v) => {
						this.dirty = true;
						this.offset = v;
					}
				);
			}
			{
				const label = "mag";
				const min = 1;
				const max = 100;
				const start = 1;
				const step = 1 / 256;
				const precision = 5;
				new makeEleCombo(this.vp, label, min, max, start, step, precision,
					(v) => {
						this.dirty = true;
						this.mag = v;
					}
				);
			}
			makeEle(this.vp, "br");
			this.doColor = true;
			makeEle(this.vp, "span", null, "marg", "Color");
			this.eles.doColor = makeEle(this.vp, "input", "doColor", null, "ho", (v) => {
				this.dirty = true;
				this.doColor = v;
			}, "checkbox");
			this.eles.doColor.checked = this.doColor;
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
		for (let y = -1, j = 0; y <= 1; y += 1 / this.res, ++j) {
			const errRow = this.errArr[j];
			for (let x = -1, i = 0; x <= 1; x += 1 / this.res, ++i) {
				this.drawPrim.drawCircle([x, y], .00012 * this.res, "black");
				//this.drawPrim.drawCircle([x, y], .012, "green");
				const err = errRow[i];
				const errCol = Bitmap32p.intensityToStr(err * this.mag + this.offset, this.doColor);
				this.drawPrim.drawCircle([x, y], .00011 * this.res, errCol);
			}
		}
		for (let x = 0; x <= 1; x += 1 / this.res) {
			this.drawPrim.drawCircle([x, -1.25], .00012 * this.res, "black");
			const strcol = Bitmap32p.intensityToStr(x, this.doColor);
			//const strcol = Bitmap32p.colorArrToStr([x, 0, 0]);
			this.drawPrim.drawCircle([x, -1.25], .00011 * this.res, strcol);
		}
		//this.drawPrim.drawRectangleO([0, 0], [1, 1], lineWid);
		this.drawFun.changeFunctionG((x) => Math.atan(x));
		this.drawFun.draw(false, 400, 0, "red");
		this.drawFun.changeFunctionG(calcCoef.bind(this, ...this.coefs));
		this.drawFun.draw(false, 400, 0, "green");
		this.drawPrim.drawCircleO(this.coefs, .03, .015, "red"); // cursor
		this.drawPrim.drawCircleO([this.coefs[2], this.coefs[3]], .03, .015, "green"); // cursor
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\nAvg fps = " + this.AvgFps.toFixed(2);
		infoStr += "\nX1 = " + this.coefs[0] 
			+ "\nX3 = "+ this.coefs[1]
			+ "\nX5 = "+ this.coefs[2]
			+ "\nX7 = "+ this.coefs[3]
		infoStr += "\nError = " + this.Err.toFixed(6);
		const min = this.offset;
		const max = this.offset + this.mag;
		infoStr += "\nRange = [" + min.toFixed(3) + ", " + max.toFixed(3) + "]";
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
