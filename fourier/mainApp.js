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
			// handle fast mouse edit movements with lerp
			while(cnt--) {
				curY = lerp(this.oldMouseY,mouseY, cnt / startCnt);
				deltaX += dir;
				if (this.doInverse) {
					if (this.cursorObj.pressedLeft) {
						this.freqDom[curX][0] = this.#doSnap(curY - this.freqOffsetY);
					}
					if (this.cursorObj.pressedRight) {
						this.freqDom[curX][1] = this.#doSnap(curY - this.freqOffsetY);
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

	#resetSlots() {
		this.curSlot = 0;
		this.slots = Array(this.maxSlots);
		for (let i = 0; i < this.maxSlots; ++i) {
			this.#defaultElements(i);
		}
		const curSlotStr = localStorage.getItem("fftCircleCurSlot");
		if (curSlotStr !== null) {
			console.log("got some localStorage");
			const slotStr = localStorage.getItem("fftCircleSlots");
			this.slots = JSON.parse(slotStr);
			this.curSlot = parseInt(curSlotStr);
		}
		this.freqDom = this.slots[this.curSlot].freqs;
		this.timeDom = this.slots[this.curSlot].times;
	}

	#changSlot(newVal) {
		//console.log("change slot from " + this.curSlot + " to " + newVal);
		this.curSlot = newVal;
		this.freqDom = this.slots[this.curSlot].freqs;
		this.timeDom = this.slots[this.curSlot].times;
		this.numElements = this.freqDom.length;
		this.eles.depthCombo.slider.max = this.numElements;
		this.eles.depthCombo.start = this.numElements;
		this.depth = this.numElements;
		this.eles.depthCombo.callbackResetButton();
	}

	#clearElements(slotNum) {
		this.depth = this.numElements;
		this.timeDom = Array(this.numElements);
		this.freqDom = Array(this.numElements);
		this.slots[slotNum] = {times: this.timeDom, freqs: this.freqDom};
		for (let i = 0; i < this.numElements; ++i) {
			this.timeDom[i] = [0, 0];
		}
		this.fft.fft(this.timeDom, this.freqDom);
		this.hilitX = -1;
		this.cursorObj = {
			pos: [0, 0],
			pressed: false
		}
	}

	#defaultElements(slotNum) {
		this.numElements = defaultFourierTimeData[slotNum].length;
		this.depth = this.numElements;
		this.timeDom = Array(this.numElements);
		this.freqDom = Array(this.numElements);
		this.slots[slotNum] = {times: this.timeDom, freqs: this.freqDom};
		for (let i = 0; i < this.numElements; ++i) {
			this.timeDom[i] = defaultFourierTimeData[slotNum][i].slice();
		}
		this.fft.fft(this.timeDom, this.freqDom);
		this.hilitX = -1;
		this.cursorObj = {
			pos: [0, 0],
			pressed: false
		}
	}

	#lessElements() {
		if (this.numElements <= 1) return;
		this.numElements >>= 1;
		const dc = this.eles.depthCombo;
		dc.slider.max = this.numElements.toString();
		dc.setValue(dc.getValue()); // clip if neccesary
		const oldTimes = this.timeDom;
		this.depth = this.numElements;
		this.timeDom = Array(this.numElements);
		this.freqDom = Array(this.numElements);
		this.slots[this.curSlot] = {times: this.timeDom, freqs: this.freqDom};
		for (let i = 0; i < this.numElements; ++i) {
			this.timeDom[i] = oldTimes[2 * i];
		}
		this.fft.fft(this.timeDom, this.freqDom);
		this.hilitX = -1;
		this.cursorObj = {
			pos: [0, 0],
			pressed: false
		}
	}

	#moreElements() {
		const maxElements = 64;
		if (this.numElements >= maxElements) return;
		this.numElements <<= 1;
		const dc = this.eles.depthCombo;
		dc.slider.max = this.numElements.toString();
		dc.setValue(dc.slider.max); // clip if neccesary
		const oldTimes = this.timeDom;
		this.depth = this.numElements;
		this.timeDom = Array(this.numElements);
		this.freqDom = Array(this.numElements);
		this.slots[this.curSlot] = {times: this.timeDom, freqs: this.freqDom};
		for (let i = 0; i < oldTimes.length; ++i) {
			this.timeDom[2 * i] = oldTimes[i];
		}
		for (let i = 0; i < oldTimes.length; ++i) {
			const avg = Array(2);
			const j = (i + 1) % oldTimes.length;
			const out = [0, 0];
			this.timeDom[2 * i + 1]  = out;
			vec2.lerp(out, oldTimes[i], oldTimes[(i + 1) % oldTimes.length], .5);
		};
		this.fft.fft(this.timeDom, this.freqDom);
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
	
	// USER: add more members or classes to MainApp
	#userInit() {
		console.log("8thNote = '" + svgPath_8thNote	+ "'");
		/*
		// test output to debug console for copy paste
		const someData = [[3, 4], "hello", {hi:"ho"}];
		const str = JSON.stringify(someData, null, '   ');
		console.log("info =\n " + str);
		*/
		this.fft = new Fft();
		//this.fft.testFft();
		// user init section
		this.hilitX = -1;
		this.doInverse = false;
		this.snapMode = true;
		this.interp = true;
		this.numElements = 1 << 2; // a power of 2
		this.elementsXScale = 8;
		this.noLastSine = false;
		this.revHighest = false;
		this.lastComponentOnly = false;
		this.complexPlane = true;
		this.maxSlots = 4;
		this.curSlot = 0;
		this.freqOffsetY = 5;
		this.complexPlaneOffset = [11, 2.5];
		this.#resetSlots();

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.avgFpsObj = new Runavg(500);

		// before firing up Plotter2d
		this.startCenter = [4.7, 2.5];
		this.startZoom = .16;

		// call this when exiting page, save slots into localStorage
		window.addEventListener('beforeunload', (outVal) => {
			this.#userExit();
		});
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

		// reverse last freq
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Reverse highest freq");
		this.eles.revHighest = makeEle(this.vp, "input", "revHighest", null, "ho", (val) => {
			this.revHighest = this.eles.revHighest.checked;
		}, "checkbox");
		this.eles.revHighest.checked = this.revHighest;

		// last component only
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Last component only");
		this.eles.lastComponentOnly = makeEle(this.vp, "input", "lastComponentOnly", null, "ho", (val) => {
			this.lastComponentOnly = this.eles.lastComponentOnly.checked;
		}, "checkbox");
		this.eles.lastComponentOnly.checked = this.lastComponentOnly;

		// change slots and elements
		makeEle(this.vp, "hr");
		// load save slot
		{
			const label = "Cur Slot";
			const min = 0;
			const max = this.maxSlots - 1;
			const start = this.curSlot;
			const step = 1;
			const precision = 0;
			this.eles.curSlot = new makeEleCombo(this.vp, label, min, max, start, step, precision
				, (outVal) => {
					this.#changSlot(outVal);
				}, null, false
			);
		}
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
		makeEle(this.vp, "button", null, null, "Clear Elements",
			() => {
				this.#clearElements(this.curSlot);
			}
		);
		makeEle(this.vp, "button", null, null, "Default Elements",
			() => {
				this.#defaultElements(this.curSlot);
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
		const freqSepAxis = 100; // for freq domain
		const extra = 16 / Math.max(this.elementsXScale,this.numElements);
		const realRad = .135 * extra;
		const imagRad = .1 * extra;
		const outlineRad = .125 * extra;
		const outline = .025 * extra;
		const textSize = .5;
		const textLeft = -1.5;
		const rectOutlineSize = [1.5, .75];
		// draw sep line for freq
		this.drawPrim.drawLine([0, this.freqOffsetY], [freqSepAxis, this.freqOffsetY], undefined, "blue");
		// draw labels
		this.drawPrim.drawText([textLeft, 0], [textSize, textSize], "Time");
		if (!this.doInverse) {
			this.drawPrim.drawRectangleCenterO([textLeft, 0], rectOutlineSize, .075);
		}
		this.drawPrim.drawText([textLeft, this.freqOffsetY], [textSize, textSize], "Freq");
		if (this.doInverse) {
			this.drawPrim.drawRectangleCenterO([textLeft, this.freqOffsetY], rectOutlineSize, .075);
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
			const centerReal = [x, ampReal + this.freqOffsetY];
			const ampImag = this.freqDom[i][1];
			const centerImag = [x, ampImag + this.freqOffsetY];
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
			const pntArr = this.fft.calcT(this.freqDom, this.tInterp, this.revHighest, this.noLastSine, this.lastComponentOnly);
			pnt = pntArr[this.depth].slice(); // last element
			// calc interpolation of time domain
			const resolution = 256;
			const dataReal = [];
			const dataImag = [];
			for (let ti = 0; ti <= resolution; ++ti) {
				const t = ti / resolution;
				const timeValComplexArr = this.fft.calcT(this.freqDom, t, this.revHighest, this.noLastSine, this.lastComponentOnly);
				const timeValComplex = timeValComplexArr[this.depth].slice();
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
			this.drawPrim.drawCross(this.complexPlaneOffset, .5, .001, undefined, "blue");
			this.drawPrim.drawLinesParametric(this.timeDom, undefined, .1, true, undefined, "brown", this.complexPlaneOffset);
			if (this.hilitX >= 0 && this.hilitX < this.timeDom.length) {
				const cpnt = this.timeDom[this.hilitX].slice();
				vec2.add(cpnt, cpnt, this.complexPlaneOffset);
				this.drawPrim.drawCircleO(cpnt, outlineRad,  outline, "black");
			}
			if (this.interp) {
				this.drawPrim.drawLinesParametric(dataComplex, undefined, undefined, false,
					 "#9550a3", undefined, this.complexPlaneOffset);
				//pnt[0] += this.complexPlaneOffset[0];
				vec2.add(pnt, pnt, this.complexPlaneOffset);
				this.drawPrim.drawCircle(pnt, outlineRad / 3, "purple");
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
				const pt = [0, 0];
				vec2.lerp(pt, p0, p1, tweenTime);
				vec2.add(pt, pt, this.complexPlaneOffset);
				this.drawPrim.drawCircle(pt, outlineRad / 3, "black");
			}
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "";
		infoStr += "Avg fps = " + this.avgFpsRound.toString();
		infoStr += this.doInverse ? "\nEdit Frequency Domain" : "\nEdit Time Domain";
		infoStr += "\nNum Elements " + this.numElements;
		infoStr += "\ntInterp = " + this.tInterp.toFixed(3);
		this.eles.textInfoLog.innerText = infoStr;
	}

	#userExit() {
		localStorage.setItem("fftCircleCurSlot", this.curSlot);
		localStorage.setItem("fftCircleSlots", JSON.stringify(this.slots));
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.#userProc(); // proc
		this.plotter2d.proc(this.vp, this.input.mouse, Mouse.MIDDLE);
		// USER: do USER stuff

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
