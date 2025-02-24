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
		this.dirty = true; // draw at least once
		this.dirtyCount = 100;
		this.#animate();
	}

	// USER: add more members or classes to MainApp

	#eigen_n(x) {
		return Math.pow(x, this.curQnum);
	}

	#eigen_n2(x) {
		const a = this.#eigen_n(x, this.curQnum);
		return a * a;

	}

	#funToArray(f, minX, maxX, numSteps) {
		const arr = [];
		for (let i = 0; i <= numSteps; ++i) {
			const x = minX + i * (maxX - minX) / numSteps;
			const fx = f.bind(this, x);
			arr.push(fx(x));
		}
		return arr;
	}

	#resetCounter() {
		this.count = 0;
	}

	// dy/dx = y,    y = c * e^x
	#fun1(x) {
		return 9 * Math.exp(x);
	}
	#diffEq1(x) {
		return this.#diff(this.#fun1, x) - this.#fun1(x);
	}

	// dy/dx = -y,    y = c * e^-x
	#fun2(x) {
		return 7 * Math.exp(-x);
	}
	#diffEq2(x) {
		return this.#diff(this.#fun2, x) + this.#fun2(x);
	}

	// d2y/dx2 = -y,    y = c1 * sin(x) + c2 * cos(x)
	#fun3(x) {
		return Math.cos(x);
	}
	#diffEq3(x) {
		return this.#diff2(this.#fun3, x) + this.#fun3(x);
	}

	// d2y/dx2 = y,    y = c1 * e^x + c2 * e^-x
	#fun4(x) {
		return Math.cosh(x);
		//return 5 * Math.exp(x) + 6 * Math.exp(-x);
	}
	#diffEq4(x) {
		return this.#diff2(this.#fun4, x) - this.#fun4(x);
	}

	// d2y/dx2 = 6,    y = 3 * x^2 + c1 * x + c2
	#fun5(x) {
		return 3 * x * x + 4 * x + 5;
	}
	#diffEq5(x) {
		return this.#diff2(this.#fun5, x) - 6;
	}
	



	// quantum SHO, n = 0
	#fun6(x) {
		const n = 0;
		return  MainApp.normals[n] * Math.exp(-x * x / 2);
	}
	#diffEq6(x) {
		const n = 0;
		const E = n + 1 / 2;
		return .5 * this.#diff2(this.#fun6, x) + (E - .5 * x * x) * this.#fun6(x);
	}

	// quantum SHO, n = 1
	#fun7(x) {
		const n = 1;
		return MainApp.normals[n] * 2 * x * Math.exp(-x * x / 2);
	}
	#diffEq7(x) {
		const n = 1;
		const E = n + 1 / 2;
		return .5 * this.#diff2(this.#fun7, x) + (E - .5 * x * x) * this.#fun7(x);
	}

	// quantum SHO, n = 2
	#fun8(x) {
		const n = 2;
		return MainApp.normals[n] * (4 * x * x - 2) * Math.exp(-x * x / 2);
	}
	#diffEq8(x) {
		const n = 2;
		const E = n + 1 / 2;
		return .5 * this.#diff2(this.#fun8, x) + (E - .5 * x * x) * this.#fun8(x);
	}

	// quantum SHO, n = 3
	#fun9(x) {
		const n = 3;
		return MainApp.normals[n] * (8 * x * x * x - 12 * x) * Math.exp(-x * x / 2);
	}
	#diffEq9(x) {
		const n = 3;
		const E = n + 1 / 2;
		return .5 * this.#diff2(this.#fun9, x) + (E - .5 * x * x) * this.#fun9(x);
	}

	// quantum SHO, n = 4
	#fun10(x) {
		const n = 4;
		return MainApp.normals[n] * (16 * x * x * x * x - 48 * x * x + 12) * Math.exp(-x * x / 2);
	}
	#diffEq10(x) {
		const n = 4;
		const E = n + 1 / 2;
		return .5 * this.#diff2(this.#fun10, x) + (E - .5 * x * x) * this.#fun10(x);
	}

	// 1st derivative
	#diff(f, x) {
		return((f(x + this.epsilon / 2) - f(x - this.epsilon / 2)) / this.epsilon);
	}

	// 2nd derivative
	#diff2(f, x) {
		return((f(x + this.epsilon) - 2 * f(x) + f(x - this.epsilon)) / (this.epsilon * this.epsilon));
	}

	// integration
	#calcArea(fun, square, start, end, numSteps) {
		// Trapezoidal Rule
		let sum = (fun(start) + fun(end)) / 2;
		if (square) {
			sum *= sum;
		}
		const span = end - start;
		for (let i = 1; i <= numSteps - 1; ++i) {
			const x = start + span * i / numSteps;
			let val = fun(x);
			if (square) {
				val *= val;
			}
			sum += val;
		}
		return sum * span / numSteps;
	}

	static #factorial(n) {
		const oldN = n;
		let r = 1;
		while(n) {
			r *= n--;
		}
		console.log("fact of " + oldN + " = " + r);
		return r;
	}

	static calcNormal(n) {
		const ret = MainApp.piVal / (Math.sqrt(Math.pow(2, n) * MainApp.#factorial(n)));
		return ret;
	}

	#calcNormals(start, end) {
		const ret = [];
		for (let n = start; n <= end; ++n) {
			const norm = MainApp.calcNormal(n);
			console.log("normal for n = " + n + " is " + norm);
			ret.push(norm);
		}
		return ret;
	}

	// check validity of differential equations
	#testDiffEq() {
		const equations = [
			/*{
				diffEq: this.#diffEq1,
				fun: this.#fun1,
				name: "exp"
			}, {
				diffEq: this.#diffEq2,
				fun: this.#fun2,
				name: "-exp"
			}, {
				diffEq: this.#diffEq3,
				fun: this.#fun3,
				name: "cos"
			}, {
				diffEq: this.#diffEq4,
				fun: this.#fun4,
				name: "cosh"
			}, {
				diffEq: this.#diffEq5,
				fun: this.#fun5,
				name: "newton"
			}, */{
				diffEq: this.#diffEq6,
				fun: this.#fun6,
				name: "quantum sho, n = 0",
			}, {
				diffEq: this.#diffEq7,
				fun: this.#fun7,
				name: "quantum sho, n = 1",
			}, {
				diffEq: this.#diffEq8,
				fun: this.#fun8,
				name: "quantum sho, n = 2",
			}, {
				diffEq: this.#diffEq9,
				fun: this.#fun9,
				name: "quantum sho, n = 3",
			}, {
				diffEq: this.#diffEq10,
				fun: this.#fun10,
				name: "quantum sho, n = 4",
			}
		];
		MainApp.piVal = Math.pow(Math.PI, -.25);
		MainApp.normals = this.#calcNormals(0,4);
		this.epsilon = .0001;
		const errorThresh = .001;
		const xStart = -10;
		const xEnd = 10;
		const numSteps = 1000;
		console.log("test diffeq");
		for (let j = 0; j < equations.length; ++j) {
			const equation = equations[j];
			let maxErr = 0;
			let errorStr = "";
			for (let i = 0; i <= numSteps; ++i) {
				const x = xStart + i * (xEnd - xStart) / numSteps;
				const fxFun = equation.fun.bind(this);
				const fx = fxFun(x);
				const errorFun = equation.diffEq.bind(this);
				const error = errorFun(x);
				const absErr = Math.abs(error);
				if (absErr > maxErr) {
					maxErr = absErr;
				}
				if (Math.abs(error) >= errorThresh) {
					errorStr += "\n\tx = " + x.toFixed(3).padStart(6) 
						+ ", fx = " + fx.toFixed(4).padStart(9)
						+ ", error = " + error.toFixed(6).padStart(9);
				}
			}
			const area = this.#calcArea(equation.fun, true, xStart, xEnd, numSteps);
			console.log(equation.name.padEnd(20) + " Max Error = " + maxErr.toFixed(6).padStart(8) + " Area = " + area.toFixed(6).padStart(8) + errorStr);
		}
	}

	#userInit() {
		this.#testDiffEq();
		// user init section
		this.count = 0; // frame counter
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .95;

		this.minQNum = 1;
		this.maxQNum = 10;
		this.startQNum = 1;
		//this.curQnum;
		this.numSteps = 40; // 'numSteps + 1' points
		this.minX = -1;
		this.maxX = 1;
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
			const label = "QNum";
			const min = this.minQNum;
			const max = this.maxQNum;
			const start = this.startQNum;
			const step = 1;
			const precision = 0;
			const callback = null;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,
				(v) => {
					this.curQnum = v;
					this.count = v * 10000;
					this.dirty = true;
				}
			);
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
		this.avgFps = this.avgFpsObj.add(this.fps);
		++this.count;
	}

	#userDraw() {
		const funArr = this.#funToArray(this.#eigen_n, this.minX, this.maxX, this.numSteps);
		const funArr2 = this.#funToArray(this.#eigen_n2, this.minX, this.maxX, this.numSteps);
		this.drawPrim.drawLinesSimple(funArr, undefined, undefined, this.minX, (this.maxX - this.minX) / (funArr.length - 1), "red");
		this.drawPrim.drawLinesSimple(funArr2, undefined, undefined, this.minX, (this.maxX - this.minX) / (funArr.length - 1), "blue");
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Frame Count = " + this.count;
		countStr += "\nDirty Count = " + this.dirtyCount;
		countStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		this.eles.textInfoLog.innerText = countStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.LEFT) || this.dirty;
		// USER: do USER stuff
		this.#userProc(); // proc

		//this.dirty = true; // test, always draw every frame
		// draw when dirty
		if (this.dirty) {
			this.plotter2d.clearCanvas();
			// interact with mouse, calc all spaces
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
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // end test static methods
