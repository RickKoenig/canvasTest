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

	#initFt() {
		this.maxFft = 1024;
		this.fftTable = [];
		// build a trig table
		for (let i = 0; i < this.maxFft; ++i) {
			const ang = 2 * Math.PI * i / this.maxFft;
			this.fftTable.push([Math.cos(ang), Math.sin(ang)]);
		}
	}

	#ft(times, freqs) {

		const newTimes = Array(times.length);
		newTimes[0] = times[0];
		for (let i = 1; i < times.length; ++i) {
			newTimes[i] = times[times.length - i];
		}
		times = newTimes;
		this.#iFt(times, freqs);
		return;

		//this.#fft(times, freqs);
		//return;
		const numEle = times.length;
		const scl = 1 / Math.sqrt(numEle);
		//const scl = 1 / numEle;
		for (let f = 0; f < numEle; ++f) {
			freqs[f] = compf.create();
			const tStep = f * this.maxFft / numEle;
			let tIdx = 0;
			for (let t = 0; t < numEle; ++t) {
				const exp = this.fftTable[(tIdx) & (this.maxFft - 1)];
				tIdx -= tStep;
				const term = compf.create();
				compf.mul(term, times[t], exp);
				compf.add(freqs[f], freqs[f], term);
			}
			compf.scale(freqs[f], freqs[f], scl);
		}
	}

	#iFt(freqs, times) {
		this.#iFft(freqs, times);
		return;
		const numEle = freqs.length;
		const scl = 1 / Math.sqrt(numEle);
		for (let t = 0; t < numEle; ++t) {
			times[t] = compf.create();
			const fStep = t * this.maxFft / numEle;
			let fIdx = 0;
			for (let f = 0; f < numEle; ++f) {
				const exp = this.fftTable[(fIdx) & (this.maxFft - 1)];
				fIdx += fStep;
				const term = compf.create();
				compf.mul(term, freqs[f], exp);
				compf.add(times[t], times[t], term);
			}
			compf.scale(times[t], times[t], scl);
		}
	}

	#fft(times, freqs) {
		this.#fftRec(times, freqs);
		const numEle = times.length;
		const scl = 1 / Math.sqrt(numEle);
		for (let i = 0; i < numEle; ++i) {
			compf.scale(freqs[i], freqs[i], scl);
		}
	}

	#iFft(freqs, times) {
		this.#iFftRec(freqs, times);
		const numEle = freqs.length;
		const scl = 1 / Math.sqrt(numEle);
		for (let i = 0; i < numEle; ++i) {
			compf.scale(times[i], times[i], scl);
		}
	}

	#fftRec(times, freqs) {
		const numElements = freqs.length;
		for (let i = 0; i < numElements; ++i) {
			freqs[i] = compf.create();
		}
		// trivial case
		if (numElements == 1) {
			compf.copy(freqs[0], times[0]);
			return;
		}
		// split into evens and odds
		const half = numElements >> 1;
		const timesEven = Array(half);
		const timesOdd = Array(half);
		for (let i = 0; i < half; ++i) {
			const even = i << 1;
			timesEven[i] = times[even];
			timesOdd[i] = times[even + 1];
		}
		const freqsEven = Array(half);
		const freqsOdd = Array(half);
		// recurse at half size for both evens and odds
		this.#iFftRec(timesEven, freqsEven);
		this.#iFftRec(timesOdd, freqsOdd);
		// adjust the odd elements
		const fStep = this.maxFft / numElements;
		let fIdx = 0;
		for (let i = 0; i < half; ++i) {
			const exp = this.fftTable[fIdx & (this.maxFft - 1)];
			//console.log("fstep = " + fStep + ", fidx = " + fIdx);
			fIdx += fStep;
			compf.mul(freqsOdd[i], freqsOdd[i], exp);
		}

		// weave back to full size
		for (let i = 0; i < half; ++i) {
			compf.add(freqs[i], freqsEven[i], freqsOdd[i]);
			compf.sub(freqs[i + half], freqsEven[i], freqsOdd[i]);
		}
	}

	#iFftRec(freqs, times) {
		const numElements = times.length;
		for (let i = 0; i < numElements; ++i) {
			times[i] = compf.create();
		}
		// trivial case
		if (numElements == 1) {
			compf.copy(times[0], freqs[0]);
			return;
		}
		// split into evens and odds
		const half = numElements >> 1;
		const freqsEven = Array(half);
		const freqsOdd = Array(half);
		for (let i = 0; i < half; ++i) {
			const even = i << 1;
			freqsEven[i] = freqs[even];
			freqsOdd[i] = freqs[even + 1];
		}
		const timesEven = Array(half);
		const timesOdd = Array(half);
		// recurse at half size for both evens and odds
		this.#iFftRec(freqsEven, timesEven);
		this.#iFftRec(freqsOdd, timesOdd);
		// adjust the odd elements
		const tStep = this.maxFft / numElements;
		let tIdx = 0;
		for (let i = 0; i < half; ++i) {
			const exp = this.fftTable[tIdx];
			tIdx += tStep;
			compf.mul(timesOdd[i], timesOdd[i], exp);
		}

		// weave back to full size
		for (let i = 0; i < half; ++i) {
			compf.add(times[i], timesEven[i], timesOdd[i]);
			compf.sub(times[i + half], timesEven[i], timesOdd[i]);
		}
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

	#timeReset() {
		this.sepDist = 5;
		this.time = 0;
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

	// how much to move in a frame
	// proc stuff here
	#timeStep(fullStep, forceRunning) {
		let step = fullStep;
		this.cursorObj.pos = this.plotter2d.userMouse.slice();
		const mousePos = this.cursorObj.pos;
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
		// edit points		
		this.hilitX = Math.round(mousePos[0] * this.numElements / 8);
		this.#editPoints(mousePos[1]);
		// time step
		const numEle = this.timeDom.length;
		if (this.doInverse) {
			this.#iFt(this.freqDom, this.timeDom);
		} else {
			this.#ft(this.timeDom, this.freqDom);
		}
		if ((this.running || forceRunning) && this.avgFpsRound) {
			this.time += step;
		}
	}

	#lessElements() {
		if (this.numElements <= 1) return;
		this.numElements >>= 1;
		this.#timeReset();
	}

	#moreElements() {
		const maxElements = 64;
		if (this.numElements >= maxElements) return;
		this.numElements <<= 1;
		this.#timeReset();
	}

	#testFft() {
		console.log("test fft");
		const numElements = 16;
		const freqs = Array(numElements);
		for (let i = 0; i < numElements; ++i) {
			freqs[i] = [Math.random(), Math.random()];
		}
		const times = Array(numElements);
		this.#iFt(freqs, times); // ift freqs to times
		const newFreqs = Array(numElements);
		this.#ft(times, newFreqs); // ft times to freqs
		for (let i = 0; i < numElements; ++i) {
			const diff = compf.create();
			compf.sub(diff, freqs[i], newFreqs[i]);
			console.log("diff = " + compf.str(diff, 8));
		}
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		this.#initFt();
		this.#testFft();
		// user init section
		this.doInverse = true;
		this.snapMode = false;
		this.numElements = 1 << 1;
		this.#timeReset();

		// objects
		this.running = false;

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldmousePos; // for delta mousePos
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

		makeEle(this.vp, "span", null, "marg", "Frequency Domain");
		this.eles.doInverse = makeEle(this.vp, "input", "doInverse", null, "ho", (val) => {
			this.doInverse = this.eles.doInverse.checked;
		}, "checkbox");
		this.eles.doInverse.checked = this.doInverse;
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Snap Mode");
		this.eles.snapDomain = makeEle(this.vp, "input", "snapMode", null, "ho", (val) => {
			this.snapMode = this.eles.snapDomain.checked;
		}, "checkbox");
		this.eles.snapDomain.checked = this.snapMode;
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
		makeEle(this.vp, "button", null, null, "Reset",
			() => {
				this.#timeReset();
			}
		);
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
				this.#timeStep(1, true);
			}
		);
		// reset simulation button
		makeEle(this.vp, "button", null, null, "Start over",
			() => {
				this.#timeReset();
				this.running = false;
				this.eles.playStopButton.innerHTML = "PLAY";
			}
		);
		makeEle(this.vp, "hr");
	}

	#userProc() {
		// proc objects
		if (this.avgFpsRound) this.#timeStep(this.playSpeed / this.avgFpsRound);
		
		// update FPS
		if (this.oldmousePos === undefined) {
			this.oldmousePos = performance.now();
			this.fps = 0;
		} else {
			const newmousePos = performance.now();
			const delmousePos =  newmousePos - this.oldmousePos;
			this.oldmousePos = newmousePos;
			this.fps = 1000 / delmousePos;
		}
		this.avgFps = this.avgFpsObj.add(this.fps);
		this.avgFpsRound = Math.round(this.avgFps);
	}

	#userDraw() {
		const sepAxis = 100;
		const extra = 16 / Math.max(8,this.numElements);
		const realRad = .135 * extra;
		const imagRad = .1 * extra;
		const outlineRad = .175 * extra;
		const outline = .05 * extra;
		const textSize = .5;
		const textLeft = -1.5;
		const rectOutlineSize = [1.5, .75];
		//const rectOutlineLeft = -1.5;
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
			const x = i * 8 / this.numElements;
			const ampReal = this.timeDom[i][0];
			const centerReal = [x, ampReal];
			const ampImag = this.timeDom[i][1];
			const centerImag = [x, ampImag];
			this.drawPrim.drawCircle(centerReal, realRad,  "red");	
			this.drawPrim.drawCircle(centerImag, imagRad,  "green");	
			if (this.hilitX == i && !this.doInverse) {
				this.drawPrim.drawCircleO(centerReal, outlineRad,  outline, "black");	
				this.drawPrim.drawCircleO(centerImag, outlineRad,  outline, "black");	
			}
		}
		// draw frequency domain points
		for (let i = 0; i < this.freqDom.length; ++i) {
			const x = i * 8 / this.numElements;
			const ampReal = this.freqDom[i][0];
			const centerReal = [x, ampReal + this.sepDist];
			const ampImag = this.freqDom[i][1];
			const centerImag = [x, ampImag + this.sepDist];
			this.drawPrim.drawCircle(centerReal, realRad,  "red");	
			this.drawPrim.drawCircle(centerImag, imagRad,  "green");	
			if (this.hilitX == i & this.doInverse) {
				this.drawPrim.drawCircleO(centerReal, outlineRad,  outline, "black");	
				this.drawPrim.drawCircleO(centerImag, outlineRad,  outline, "black");	
			}
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "";
		infoStr += "time = " + this.time.toFixed(3);
		infoStr += "\nAvg fps = " + this.avgFpsRound.toFixed(2);
		infoStr += this.doInverse ? "\nEdit Frequency Domain" : "\nEdit Time Domain";
		infoStr += "\nNum Elements " + this.numElements;
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
