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

	#defaultTimeData = [
		[
			[1.5, 1.5]
		],
		[
			[1.5, 1.5],
			[3, 2]
		],
		[
			[1, 0],
			[.5, 1],
			[-.75, .75],
			[-.5, -.5]
		],
		[
			[
				1, 0
			],
			[
				1.5, 1.5
			],
			[
				0,
				1
			],
			[
				-1.5,
				1.5
			],
			[
				-1,
				0
			],
			[
				-1.5,
				-1.5
			],
			[
				0,
				-1
			],
			[
				3,
				-1.5
			]
			],
	];

	/*
const raw = 'M 2002,7851 C 1941,7868 1886,7906 1835,7964 C 1784,8023 1759,8088 1759,8158 C 1759,8202 1774,8252 1803,8305 
C 1832,8359 1876,8398 1933,8423 C 1952,8427 1961,8437 1961,8451 C 1961,8456 1954,8461 1937,8465 C 1846,8442 1771,8393 1713,8320 
C 1655,8246 1625,8162 1623,8066 C 1626,7963 1657,7867 1716,7779 C 1776,7690 1853,7627 1947,7590 L 1878,7235 C 1724,7363 1599,7496 1502,7636 
C 1405,7775 1355,7926 1351,8089 C 1353,8162 1368,8233 1396,8301 C 1424,8370 1466,8432 1522,8489 C 1635,8602 1782,8661 1961,8667 
C 2022,8663 2087,8652 2157,8634 L 2002,7851 z M 2074,7841 L 2230,8610 C 2384,8548 2461,8413 2461,8207 C 2452,8138 2432,8076 2398,8021 
C 2365,7965 2321,7921 2265,7889 C 2209,7857 2146,7841 2074,7841 z M 1869,6801 C 1902,6781 1940,6746 1981,6697 
C 2022,6649 2062,6592 2100,6528 C 2139,6463 2170,6397 2193,6330 C 2216,6264 2227,6201 2227,6143 C 2227,6118 2225,6093 2220,6071 
C 2216,6035 2205,6007 2186,5988 C 2167,5970 2143,5960 2113,5960 C 2053,5960 1999,5997 1951,6071 C 1914,6135 1883,6211 1861,6297 
C 1838,6384 1825,6470 1823,6557 C 1828,6656 1844,6737 1869,6801 z M 1806,6859 C 1761,6697 1736,6532 1731,6364 
C 1732,6256 1743,6155 1764,6061 C 1784,5967 1813,5886 1851,5816 C 1888,5746 1931,5693 1979,5657 C 2022,5625 2053,5608 2070,5608 
C 2083,5608 2094,5613 2104,5622 C 2114,5631 2127,5646 2143,5666 C 2262,5835 2322,6039 2322,6277 C 2322,6390 2307,6500 2277,6610 
C 2248,6719 2205,6823 2148,6920 C 2090,7018 2022,7103 1943,7176 L 2024,7570 C 2068,7565 2098,7561 2115,7561 
C 2191,7561 2259,7577 2322,7609 C 2385,7641 2439,7684 2483,7739 C 2527,7793 2561,7855 2585,7925 
C 2608,7995 2621,8068 2621,8144 C 2621,8262 2590,8370 2528,8467 C 2466,8564 2373,8635 2248,8681 
C 2256,8730 2270,8801 2291,8892 C 2311,8984 2326,9057 2336,9111 C 2346,9165 2350,9217 2350,9268 
C 2350,9347 2331,9417 2293,9479 C 2254,9541 2202,9589 2136,9623 C 2071,9657 1999,9674 1921,9674 
C 1811,9674 1715,9643 1633,9582 C 1551,9520 1507,9437 1503,9331 C 1506,9284 1517,9240 1537,9198 
C 1557,9156 1584,9122 1619,9096 C 1653,9069 1694,9055 1741,9052 C 1780,9052 1817,9063 1852,9084 
C 1886,9106 1914,9135 1935,9172 C 1955,9209 1966,9250 1966,9294 C 1966,9353 1946,9403 1906,9444 
C 1866,9485 1815,9506 1754,9506 L 1731,9506 C 1770,9566 1834,9597 1923,9597 
C 1968,9597 2014,9587 2060,9569 C 2107,9550 2146,9525 2179,9493 C 2212,9461 2234,9427 2243,9391 
C 2260,9350 2268,9293 2268,9222 C 2268,9174 2263,9126 2254,9078 C 2245,9031 2231,8968 2212,8890 
C 2193,8813 2179,8753 2171,8712 C 2111,8727 2049,8735 1984,8735 C 1875,8735 1772,8713 1675,8668 
C 1578,8623 1493,8561 1419,8481 C 1346,8401 1289,8311 1248,8209 C 1208,8108 1187,8002 1186,7892 
C 1190,7790 1209,7692 1245,7600 C 1281,7507 1327,7419 1384,7337 C 1441,7255 1500,7180 1561,7113 C 1623,7047 1704,6962 1806,6859 z';

	*/

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
		this.numElements = this.#defaultTimeData[slotNum].length;
		this.depth = this.numElements;
		this.timeDom = Array(this.numElements);
		this.freqDom = Array(this.numElements);
		this.slots[slotNum] = {times: this.timeDom, freqs: this.freqDom};
		for (let i = 0; i < this.numElements; ++i) {
			this.timeDom[i] = this.#defaultTimeData[slotNum][i].slice();
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
		/*
		// test output to debug console for copy paste
		const someData = [[3, 4], "hello", {hi:"ho"}];
		const str = JSON.stringify(someData, null, '   ');
		console.log("info =\n " + str);
		*/
		this.fft = new Fft();
		//this.fft.testFft();
		// user init section
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
