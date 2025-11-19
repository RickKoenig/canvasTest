'use strict';

// do a consistent fixed point system in javascript

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

		this.#testFMath(2, 2);

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

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.dirty = true; // draw at least once
		this.dirtyCount = 100;
		this.#animate();
	}

	#testFMath(intP, fracP) {
		//const FMath = FMathNum; // static 
		//const FMath = FMathBigInt; // static
		//const FMath = FMathBigIntInstance; // static
		const FMath = new FMathBigIntInstance(intP, fracP); // instance

		console.log("begin testFMath");
		console.log(`intBits = ${FMath.intBits}, fracBits = ${FMath.fracBits}`);
		console.log("epsilonNum = " + FMath.epsilonNum);
		console.log("overNum = " + FMath.overNum);
		const doFromNumber = false;
		const doUnary = false;
		const doPrecUnary = true;
		const doMul = false;
		const doPrecMul = false;
		const doDiv = false;
		const doPrecDiv = false;
		const doMod = false;
		const doPrecMod = false;

		if (doFromNumber) {
			console.log("do fromNumber");
			for (let n = -FMath.overNum; n <= FMath.overNum; n += FMath.epsilonNum * .25) {
				const f = FMath.fromNumber(n);
				console.log("n = " + FMath.numberToPrettyString(n) 
					+ ", f = " + FMath.toPrettyString(f)
					+ '  #');
			}
		}
		if (doUnary) {
			console.log("do unary ops");
			const fNeg = FMath.create();
			const fAbs = FMath.create();
			const fTrunc = FMath.create();
			const fFloor = FMath.create();
			const fCeil = FMath.create();
			const fRound = FMath.create();
			const fInv = FMath.create();
			const fSqrt = FMath.create();
			for (let n = -FMath.overNum; n <= FMath.overNum; n += FMath.epsilonNum) {
				/*if (n == 0) {
					continue;
				}*/
				const f = FMath.fromNumber(n);
				FMath.neg(fNeg, f);
				FMath.abs(fAbs, f);
				FMath.trunc(fTrunc, f);
				FMath.floor(fFloor, f);
				FMath.ceil(fCeil, f);
				FMath.round(fRound, f);
				FMath.inv(fInv, f);
				FMath.sqrt(fSqrt, f);
				console.log("f = " + FMath.toPrettyString(f)
//					+ ",      fNeg = " + FMath.toPrettyString(fNeg)
					+ ",      fAbs = " + FMath.toPrettyString(fAbs)
					+ ",      fTrunc = " + FMath.toPrettyString(fTrunc)
//					+ ",      fFloor = " + FMath.toPrettyString(fFloor)
//					+ ",      fCeil = " + FMath.toPrettyString(fCeil)
//					+ ",      fRound = " + FMath.toPrettyString(fRound)
					+ ",      fInv = " + FMath.toPrettyString(fInv)
					+ ",      fSqrt = " + FMath.toPrettyString(fSqrt)
					+ '  #');
			}
		}
		if (doPrecUnary) {
			const parms = [
				//{	name: "neg",	op: (n) => -n,			fOp : FMath.neg.bind(FMath),	errRatio: .5},
				//{	name: "abs",	op: (n) => Math.abs(n),	fOp : FMath.abs.bind(FMath),	errRatio: .5},
				//{	name: "trunc",	op: (n) => Math.trunc(n),fOp : FMath.trunc.bind(FMath),	errRatio: .5},
				//{	name: "floor",	op: (n) => Math.floor(n),fOp : FMath.floor.bind(FMath),	errRatio: .5},
				//{	name: "ceil",	op: (n) => Math.ceil(n),fOp : FMath.ceil.bind(FMath),	errRatio: .5},
				//{	name: "round",	op: (n) => Math.round(n),fOp : FMath.round.bind(FMath),	errRatio: .5},
				//{	name: "inv",	op: (n) => 1 / n,		fOp : FMath.inv.bind(FMath),	errRatio: .5},
				{	name: "sqrt",	op: (n) => n >= 0 ? Math.sqrt(n) : 0,fOp : FMath.sqrt.bind(FMath),	errRatio: 1},
			];
			for (const parm of parms) {
				console.log("\n========\ndo prec " + parm.name);
				let maxAbsDelta = 0;
				let maxN = "---";
				let maxC = "---";
				let maxFn = "---";
				const errRatio = parm.errRatio; // get to the best number
				const fc = FMath.create();
				for (let b = -FMath.overNum; b <= FMath.overNum; b += FMath.epsilonNum) {
					const fb = FMath.fromNumber(b);
					const c = b ? parm.op(b) : 0;
					parm.fOp(fc, fb);
					const nfc = FMath.toNumber(fc);
					const delta = c - nfc
					const absDelta = Math.abs(delta);
					if (absDelta > maxAbsDelta) {
						maxAbsDelta = absDelta;
						maxN = b;
						maxC = c;
						maxFn = clone(fc);
					}
					let str = "check absDelta " + parm.name + "(" + FMath.toPrettyString(fb)
							+ ") = " + FMath.toPrettyString(fc) + ",n = " + c.toFixed(5)
							+ ", delta = " + delta.toFixed(5);
					// half an epsilon is good (errRatio == .5) // lower is better, more than 1 is worse
					if (absDelta > errRatio * FMath.epsilonNum) {
						console.log(str);
					} else {
						if (false) {
							console.log(str);
						}
					}
				}
				console.log("maxAbsDelta = " 
					+ maxAbsDelta.toFixed(7) + ", max err ratio = " 
					+ (maxAbsDelta / FMath.epsilonNum).toFixed(7) + " maxErrLocation: n = " + maxN);
				let str = "check absDelta " + parm.name + "(" + maxN
						+ ") = " + FMath.toPrettyString(maxFn) + ", result = " + maxC
						+ ", delta = " + maxAbsDelta.toFixed(5);
				// half an epsilon is good (errRatio == .5) // lower is better, more than 1 is worse
				console.log(str);
			}
		}
		if (doMul) {
			console.log("do binary op mul");
			const fc = FMath.create();
			for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
				const fa = FMath.fromNumber(a);
				for (let b = -FMath.overNum; b < FMath.overNum; b += FMath.epsilonNum) {
					const fb = FMath.fromNumber(b);
					FMath.mul(fc, fa, fb);
					console.log(FMath.toPrettyString(fa) + " * " + FMath.toPrettyString(fb)
						+ " = " + FMath.toPrettyString(fc));
				}
			}
		}
		// compare number with FMath
		if (doPrecMul) {
			console.log("do prec mul");
			let maxAbsDelta = 0;
			let maxA = 0;
			let maxB = 0;
			const errRatio = 2; // get to the best number
			const fc = FMath.create();
			for (let b = -FMath.overNum; b < FMath.overNum; b += FMath.epsilonNum) {
				const fb = FMath.fromNumber(b);
				for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
					const c = a * b;
					const fa = FMath.fromNumber(a);
					FMath.mul(fc, fa, fb);
					const nfc = FMath.toNumber(fc);
					const delta = c - nfc
					const absDelta = Math.abs(delta);
					if (absDelta > maxAbsDelta) {
						maxAbsDelta = absDelta;
						maxA = a;
						maxB = b;
					}
					if (errRatio * absDelta > FMath.epsilonNum) {
						console.error("Too much absDelta !! " + FMath.toPrettyString(fa) + " * " + FMath.toPrettyString(fb)
							+ " = " + FMath.toPrettyString(fc) + ",c = " + c.toFixed(5)
							+ ", delta = " + delta.toFixed(5));
					}
				}
			}
			console.log("maxAbsDelta = " + maxAbsDelta + ", maxA = " + maxA + ", maxB = " + maxB);
		}
		if (doDiv) {
			console.log("do binary op div");
			const fc = FMath.create();
			for (let b = -FMath.overNum; b < FMath.overNum; b += FMath.epsilonNum) {
				const fb = FMath.fromNumber(b);
				if (b == 0) {
					continue;
				}
				for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
					const fa = FMath.fromNumber(a);
						FMath.div(fc, fa, fb);
						console.log(FMath.toPrettyString(fa) + " / " + FMath.toPrettyString(fb)
							+ " = " + FMath.toPrettyString(fc));
					}
				}
		}
		if (doPrecDiv) {
			console.log("do prec div");
			let maxAbsDelta = 0;
			let maxA = 0;
			let maxB = 0;
			const errRatio = 2; // get to the best number
			const fc = FMath.create();
			//for (let b = 1.5; b <= 1.5; b += FMath.epsilonNum) {
			for (let b = -FMath.overNum; b <= FMath.overNum; b += FMath.epsilonNum) {
				/*if (b == 0) {
					continue;
				}*/
				const fb = FMath.fromNumber(b);
				//for (let a = 1.75; a <= 1.75; a += FMath.epsilonNum) {
				for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
					const c = b != 0 ? a / b : 0;
					const fa = FMath.fromNumber(a);
					FMath.div(fc, fa, fb);
					const nfc = FMath.toNumber(fc);
					const delta = c - nfc
					const absDelta = Math.abs(delta);
					if (absDelta > maxAbsDelta) {
						maxAbsDelta = absDelta;
						maxA = a;
						maxB = b;
					}
					if (errRatio * absDelta > FMath.epsilonNum) {
						console.error("check absDelta " + FMath.toPrettyString(fa) + " / " + FMath.toPrettyString(fb)
							+ " = " + FMath.toPrettyString(fc) + ",c = " + c.toFixed(5)
							+ ", delta = " + delta.toFixed(5));
					} else {
						if (true) {
							console.log("check absDelta " + FMath.toPrettyString(fa) + " / " + FMath.toPrettyString(fb)
								+ " = " + FMath.toPrettyString(fc) + ",c = " + c.toFixed(5)
								+ ", delta = " + delta.toFixed(5));
						}
					}
				}
			}
			console.log("maxAbsDelta = " + maxAbsDelta + ", maxA = " + maxA + ", maxB = " + maxB);
		}
		if (doMod) {
			console.log("do binary op mod");
			
			const fc = FMath.create();
			for (let b = -FMath.overNum; b < FMath.overNum; b += FMath.epsilonNum) {
				const fb = FMath.fromNumber(b);
				if (b == 0) {
					continue;
				}
				for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
					const fa = FMath.fromNumber(a);
					FMath.mod(fc, fa, fb);
					console.log(FMath.toPrettyString(fa) + " % " + FMath.toPrettyString(fb)
						+ " = " + FMath.toPrettyString(fc));
				}
			}
		}
		if (doPrecMod) {
			console.log("do prec mod");
			let maxAbsDelta = 0;
			let maxA = 0;
			let maxB = 0;
			const errRatio = 2; // get to the best number
			const fc = FMath.create();
			//for (let b = 1.5; b <= 1.5; b += FMath.epsilonNum) {
			for (let b = -FMath.overNum; b < FMath.overNum; b += FMath.epsilonNum) {
			//for (let b = FMath.epsilonNum; b < FMath.overNum; b += FMath.epsilonNum) {
				if (b == 0) {
					continue;
				}
				const fb = FMath.fromNumber(b);
				//for (let a = 1.75; a <= 1.75; a += FMath.epsilonNum) {
				for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
				//for (let a = 0; a < FMath.overNum; a += FMath.epsilonNum) {
					const c = a % b;
					const fa = FMath.fromNumber(a);
					FMath.mod(fc, fa, fb);
					const nfc = FMath.toNumber(fc);
					const delta = c - nfc
					const absDelta = Math.abs(delta);
					if (absDelta > maxAbsDelta) {
						maxAbsDelta = absDelta;
						maxA = a;
						maxB = b;
					}
					if (errRatio * absDelta > FMath.epsilonNum) {
						console.error("check absDelta " + FMath.toPrettyString(fa) + " % " + FMath.toPrettyString(fb)
							+ " = " + FMath.toPrettyString(fc) + ",c = " + c.toFixed(5)
							+ ", delta = " + delta.toFixed(5));
					} else {
						if (false) {
							console.log("check absDelta " + FMath.toPrettyString(fa) + " % " + FMath.toPrettyString(fb)
								+ " = " + FMath.toPrettyString(fc) + ",c = " + c.toFixed(5)
								+ ", delta = " + delta.toFixed(5));
						}
					}
				}
			}
			console.log("maxAbsDelta = " + maxAbsDelta + ", maxA = " + maxA + ", maxB = " + maxB);

		}
		console.log("end testFMath");
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
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		makeEle(this.vp, "button", null, null, "Random color", this.#randomColor.bind(this));
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
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

		// some graphics
		const mbut = this.input.mouse.mbut[Mouse.LEFT];
		if (mbut) {
			this.pos = vec2.clone(this.plotter2d.userMouse);
		}
	}

	#userDraw() {
		const lineWid = .02;
    	this.drawPrim.drawRectangleO([0, 0], [1, 1], lineWid);
		this.drawPrim.drawCircleO(this.pos, .1, .005, "brown"); // center
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\n\nAvg fps = " + this.AvgFps.toFixed(2);
		infoStr += "\n\n";
		this.eles.textInfoLog.innerText = infoStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT) || this.dirty;
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
