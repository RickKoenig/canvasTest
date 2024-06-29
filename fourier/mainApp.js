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

	#doSnap(v) {
		if (this.snapMode) {
			v = Math.round(v * 4) / 4;
		}
		return v;
	}

	#lerp(a, b, t) {
		//return a * (1 - t) + b * t;
		return a - (a - b) * t;
	}

	#editPoints(mouseY) {
		if (this.hilitX >=0 && this.hilitX < this.numElements) {
			if (!this.oldHilitX) {
				this.oldHilitX = this.hilitX;
				this.oldMouseY = mouseY;
			}
			// interpolate between mouse X movments
			let curX = this.hilitX;
			let curY = mouseY;

			let deltaX = this.hilitX - this.oldHilitX;
			if (deltaX == 0) deltaX = 1; // at least one
			let cnt = Math.abs(deltaX);
			const startCnt = cnt;
			const dir = -Math.sign(deltaX);

			while(cnt--) {
				curY =this.#lerp(this.oldMouseY,mouseY, cnt / startCnt);
				deltaX += dir;
				if (this.doInverse) {
					if (this.cursorObj.pressedLeft) {
						this.freqDom[curX][0] = this.#doSnap(curY - this.sepDist);
					}
					if (this.cursorObj.pressedRight) {
						this.freqDom[curX][1] = this.#doSnap(curY - this.sepDist);
					}
				} else {
					if (this.cursorObj.pressedLeft) {
						this.timeDom[curX][0] = this.#doSnap(curY);
					}
					if (this.cursorObj.pressedRight) {
						this.timeDom[curX][1] = this.#doSnap(curY);
					}
				}
				curX += dir;
			}

			this.oldHilitX = this.hilitX;
			this.oldMouseY = mouseY;
		}
	}

	#zeroElements() {
		this.sepDist = 5;
		this.compPlaneDist = 12;
		this.timeDom = Array(this.numElements);
		this.freqDom = Array(this.numElements);
		for (let i = 0; i < this.numElements; ++i) {
			this.timeDom[i] = [0, 0];
			this.freqDom[i] = [0, 0];
		}
		this.hilitX = -1;
		this.cursorObj = {
			pos: [0, 0],
			pressed: false
		}
	}

	// proc stuff here
	#procElements() {
		this.cursorObj.pos = this.plotter2d.userMouse.slice();
		const mousePos = this.cursorObj.pos;
		this.tInterp = range(0, mousePos[0] / this.elementsXScale, 1);
		this.cursorObj.pressedLeft = this.input.mouse.mbut[Mouse.LEFT];
		this.cursorObj.pressedRight = this.input.mouse.mbut[Mouse.RIGHT];
		const key = this.input.keyboard.key;
		// toggle domains
		if (key == 't'.charCodeAt(0)) {
			this.doInverse = !this.doInverse;
			this.eles.doInverse.checked = this.doInverse;
		} else if (key == 's'.charCodeAt(0)) {
			this.snapMode = !this.snapMode;
			this.eles.snapDomain.checked = this.snapMode;

		}
		// edit elements		
		this.hilitX = Math.round(mousePos[0] * this.numElements / this.elementsXScale);
		this.#editPoints(mousePos[1]);
		// time step
		const numEle = this.timeDom.length;
		if (this.doInverse) {
			this.fft.iFft(this.freqDom, this.timeDom);
		} else {
			this.fft.fft(this.timeDom, this.freqDom);
		}
	}

	#lessElements() {
		if (this.numElements <= 1) return;
		this.numElements >>= 1;
		const dc = this.eles.depthCombo;
		dc.slider.max = this.numElements.toString();
		dc.setValue(dc.getValue()); // clip if neccesary
		this.#zeroElements();
	}

	#moreElements() {
		const maxElements = 64;
		if (this.numElements >= maxElements) return;
		this.numElements <<= 1;
		const dc = this.eles.depthCombo;
		dc.slider.max = this.numElements.toString();
		dc.setValue(dc.slider.max); // clip if neccesary
		this.#zeroElements();
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		this.fft = new Fft();
		//this.fft.testFft();
		// user init section
		this.doInverse = false;
		this.snapMode = true;
		this.interp = true;
		this.numElements = 1 << 2; // a power of 2
		this.elementsXScale = 8;
		this.noLastSine = false;
		this.lastComponentOnly = false;
		this.complexPlane = true;
		this.#zeroElements();

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [4.7, 2.5];
		this.startZoom = .16;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		// info
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");

		// frequency domain
		makeEle(this.vp, "span", null, "marg", "Frequency domain");
		this.eles.doInverse = makeEle(this.vp, "input", "doInverse", null, "ho", (val) => {
			this.doInverse = this.eles.doInverse.checked;
		}, "checkbox");
		this.eles.doInverse.checked = this.doInverse;

		// snap mode
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Snap Mode");
		this.eles.snapDomain = makeEle(this.vp, "input", "snapMode", null, "ho", (val) => {
			this.snapMode = this.eles.snapDomain.checked;
		}, "checkbox");
		this.eles.snapDomain.checked = this.snapMode;

		// show interp
		makeEle(this.vp, "hr");
		makeEle(this.vp, "span", null, "marg", "Interp");
		this.eles.interp = makeEle(this.vp, "input", "interp", null, "ho", (val) => {
			this.interp = this.eles.interp.checked;
		}, "checkbox");
		this.eles.interp.checked = this.interp;

		// interp depth
		{
			const label = "Interp depth";
			const min = 0;
			const max = this.numElements;
			const start = this.numElements;
			const step = 1;
			const precision = 0;
			this.eles.depthCombo = new makeEleCombo(this.vp, label, min, max, start, step, precision
				, (outVal) => {
					this.depth = outVal;
				}
			);
		}

		// no last sine
		makeEle(this.vp, "hr");
		makeEle(this.vp, "span", null, "marg", "No highest freq sine");
		this.eles.noLastSine = makeEle(this.vp, "input", "noLastSine", null, "ho", (val) => {
			this.noLastSine = this.eles.noLastSine.checked;
		}, "checkbox");
		this.eles.noLastSine.checked = this.noLastSine;

		// last component only
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Last component only");
		this.eles.lastComponentOnly = makeEle(this.vp, "input", "lastComponentOnly", null, "ho", (val) => {
			this.lastComponentOnly = this.eles.lastComponentOnly.checked;
		}, "checkbox");
		this.eles.lastComponentOnly.checked = this.lastComponentOnly;

		// change elements
		makeEle(this.vp, "hr");
		makeEle(this.vp, "button", null, null, "More Elements",
			() => {
				this.#moreElements();
			}
		);
		makeEle(this.vp, "button", null, null, "Less Elements",
			() => {
				this.#lessElements();
			}
		);
		makeEle(this.vp, "button", null, null, "'Zero' Elements",
			() => {
				this.#zeroElements();
			}
		);
		makeEle(this.vp, "hr");

		// show complex plane
		makeEle(this.vp, "span", null, "marg", "Show complex plane");
		this.eles.complexPlane = makeEle(this.vp, "input", "complexPlane", null, "ho", (val) => {
			this.complexPlane = this.eles.complexPlane.checked;
		}, "checkbox");
		this.eles.complexPlane.checked = this.complexPlane;

	}

	#userProc() {
		// proc objects
		this.#procElements();
		
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
		const sepAxis = 100;
		const extra = 16 / Math.max(this.elementsXScale,this.numElements);
		const realRad = .135 * extra;
		const imagRad = .1 * extra;
		const outlineRad = .125 * extra;
		const outline = .025 * extra;
		const textSize = .5;
		const textLeft = -1.5;
		const rectOutlineSize = [1.5, .75];
		// draw sep line
		this.drawPrim.drawLine([0, this.sepDist], [sepAxis, this.sepDist], undefined, "blue");
		// draw labels
		this.drawPrim.drawText([textLeft, 0], [textSize, textSize], "Time");
		if (!this.doInverse) {
			this.drawPrim.drawRectangleCenterO([textLeft, 0], rectOutlineSize, .075);
		}
		this.drawPrim.drawText([textLeft, this.sepDist], [textSize, textSize], "Freq");
		if (this.doInverse) {
			this.drawPrim.drawRectangleCenterO([textLeft, this.sepDist], rectOutlineSize, .075);
		}
		// draw time domain points
		for (let i = 0; i < this.timeDom.length; ++i) {
			const x = i * this.elementsXScale / this.numElements;
			const ampReal = this.timeDom[i][0];
			const centerReal = [x, ampReal];
			const ampImag = this.timeDom[i][1];
			const centerImag = [x, ampImag];
			this.drawPrim.drawCircle(centerReal, realRad * .25,  "red");	
			this.drawPrim.drawCircle(centerImag, imagRad * .25,  "green");	
			if (this.hilitX == i && !this.doInverse) {
				this.drawPrim.drawCircleO(centerReal, outlineRad,  outline, "black");	
				this.drawPrim.drawCircleO(centerImag, outlineRad,  outline, "black");	
			}
		}
		// draw frequency domain points
		for (let i = 0; i < this.freqDom.length; ++i) {
			const x = i * this.elementsXScale / this.numElements;
			const ampReal = this.freqDom[i][0];
			const centerReal = [x, ampReal + this.sepDist];
			const ampImag = this.freqDom[i][1];
			const centerImag = [x, ampImag + this.sepDist];
			this.drawPrim.drawCircle(centerReal, realRad * .25,  "red");	
			this.drawPrim.drawCircle(centerImag, imagRad * .25,  "green");	
			if (this.hilitX == i & this.doInverse) {
				this.drawPrim.drawCircleO(centerReal, outlineRad,  outline, "black");
				this.drawPrim.drawCircleO(centerImag, outlineRad,  outline, "black");
			}
		}
		const dataComplex = [];
		let pnt;
		if (this.interp) {
			const pntArr = this.fft.calcT(this.freqDom, this.tInterp, this.depth, this.noLastSine, this.lastComponentOnly);
			pnt = vec2.clone(pntArr[this.depth]); // last element
			// calc interpolation of time domain
			const resolution = 256;
			const dataReal = [];
			const dataImag = [];
			for (let ti = 0; ti <= resolution; ++ti) {
				const t = ti / resolution;
				const timeValComplexArr = this.fft.calcT(this.freqDom, t, this.depth, this.noLastSine, this.lastComponentOnly);
				const timeValComplex = vec2.clone(timeValComplexArr[this.depth]);
				dataReal.push(timeValComplex[0]);
				dataImag.push(timeValComplex[1]);
				dataComplex.push(timeValComplex);
			}
			// draw interpolation of time domain
			const lineSize = .01;
			const stepX = this.elementsXScale / resolution;
			this.drawPrim.drawLinesSimple(dataReal, lineSize, undefined, 0, stepX, "red");
			this.drawPrim.drawLinesSimple(dataImag, lineSize, undefined, 0, stepX, "green");
			this.drawPrim.drawCircle([this.tInterp * this.elementsXScale, pnt[0]], outlineRad / 3, "red");
			this.drawPrim.drawCircle([this.tInterp * this.elementsXScale, pnt[1]], outlineRad / 3, "green");
		}
		if (this.complexPlane) {
			this.drawPrim.drawLine([this.compPlaneDist, -sepAxis], [this.compPlaneDist, sepAxis], undefined, "blue");
			const compOffset = [this.compPlaneDist, 0];
			this.drawPrim.drawLinesParametric(this.timeDom, undefined, .1, true, undefined, "brown", compOffset);
			if (this.hilitX >= 0 && this.hilitX < this.timeDom.length) {
				const pnt = this.timeDom[this.hilitX];
				this.drawPrim.drawCircleO([pnt[0] + this.compPlaneDist, pnt[1]], outlineRad,  outline, "black");
			}
			if (this.interp) {
				this.drawPrim.drawLinesParametric(dataComplex, undefined, undefined, false,
					 "#9550a3", undefined, compOffset);
				pnt[0] += this.compPlaneDist;
				this.drawPrim.drawCircle(pnt, outlineRad / 4, "purple");
				// now do a straight linear interpolation between the timeDom points
				let idx = this.tInterp * this.timeDom.length;
				let tweenTime = idx % 1;
				idx = Math.floor(idx);
				if (idx == this.timeDom.length) {
					--idx;
					tweenTime = 1;
				}
				const p0 = this.timeDom[idx];
				const p1 = this.timeDom[(idx + 1) % this.timeDom.length];
				const pt = vec2.create();
				vec2.lerp(pt, p0, p1, tweenTime);
				vec2.add(pt, pt, compOffset);
				this.drawPrim.drawCircle(pt, outlineRad / 4, "black");
			}
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "";
		infoStr += "Avg fps = " + this.avgFpsRound.toFixed(2);
		infoStr += this.doInverse ? "\nEdit Frequency Domain" : "\nEdit Time Domain";
		infoStr += "\nNum Elements " + this.numElements;
		infoStr += "\ntInterp = " + this.tInterp.toFixed(3);
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
		this.graphPaper.draw();
		// USER: do USER stuff
		this.#userDraw(); //draw
		// update UI, text
		this.#userUpdateInfo();

		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
