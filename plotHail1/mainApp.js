'use strict';

// draw a tree of hail nodes
class Node {
	static offset = [30,10];// draw node tree starting at position 'offset'

	constructor(x, y, n, rad) {
		this.p = vec2.fromValues(x * .5 + Node.offset[0] + .5, y * .5 + Node.offset[1] + .5);
		this.n = n;
		this.r = rad;
		this.next = []; // next x, 1 or 2
		this.prev = []; // prev x, 0 or 1
	}

	draw(drawPrim, doExpand, hilit) {
		const pnt = this.p;
		if (hilit) {
			drawPrim.drawCircleO(pnt, this.r, .08, "green");
		} else {
			drawPrim.drawCircleO(pnt, this.r, .01, "black");
		}
		drawPrim.drawCircle(pnt, this.r, this.n % 3 ? "lightgray" : "lightblue");
		const str = this.n.toString();
		const scl = this.r * 4.05 / (str.length + 1); // text smaller for large numbers
		// brighter node for other '1' that's not the root 1 - 2 - '1'
		const txtcol = !doExpand && this.n == 1 && this.prev.length != 0 ? "cyan" : "black";
		drawPrim.drawText(pnt, [scl, scl], str, txtcol);
	}
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now, assume 60hz refresh rate
class MainApp {

	#initPowers() {
		console.log("Hail Stats");
		console.log("2^n - 1 START");

		const maxHailBlocks = 4;//40;
		const hailBlockSize = 100;
		this.arrHailRatio = [];
		// setup worker thread
		if (window.Worker) {
			this.hailWorker = new Worker("worker.js");
			// get back results from worker
			this.hailWorker.onmessage = (e) => {
				let result = e.data;
				if (result.constructor == ArrayBuffer) {
					result = new Float32Array(result); // convert ArrayBuffer to Float32Array
					result = Array.from(result); // convert Float32Array to Array
					this.arrHailRatio = this.arrHailRatio.concat(result);
					if (this.arrHailRatio.length == maxHailBlocks * hailBlockSize) {
						// got all the data transferred over, kill worker
						console.log("Kill worker");
						this.hailWorker.terminate();
					}
					this.dirty = true;
				} else {
					console.log(`Message received from worker NOT AN FLOAT32ARRAY'${result}'`);
				}
			}
			// send a task message to the worker
			this.hailWorker.postMessage([maxHailBlocks, hailBlockSize]);
		}
		// done setup worker thread
		console.log("2^n - 1 DONE");
	}

	#drawPowers() {
		const step = 1; // .1;
		this.drawPrim.drawLinesSimple(this.arrHailRatio, .0175, .02 // linewidth, circlesize
			, step, step // start, stepX
			, "green", "black");
	}

	
	// use bigFraction
	static big2o3 = fraction.create(2, 3);
	static big3o2 = fraction.create(3, 2);
	static big2 = fraction.create(2);
	static big1o2 = fraction.create(1, 2);
	static big1o3 = fraction.create(1, 3);
	#hailMove(val, dirX, dirY) {
		const f = fraction;
		const ma = MainApp;
		let ret = f.clone(val);
		if (dirX == 0) {
			if (dirY == 1) { // up
				// ret = 2 * val
				return f.mul(ret, ret, ma.big2);
			} else if (dirY == -1) { // down
				// ret = 1/2 * val
				return f.mul(ret, ret, ma.big1o2);
			}
		} else if (dirY == 0) {
			if (dirX == 1) { // right
				// ret = (2 * val - 1) / 3
				// ret = 2/3 * val - 1/3
				return f.sub(ret, f.mul(ret, ret, ma.big2o3), ma.big1o3);
			} else if (dirX == -1) { // left
				// ret = (3 * val + 1) / 2
				// ret = 3/2 * val + 1/2
				return f.add(ret, f.mul(ret, ret, ma.big3o2), ma.big1o2);
			}
		}
		return ret;
	}

	#initFreeGroup() {
		this.fgNode = [10, 20];
		this.fgValue = fraction.create(7);
		this.fgLevels = 6;
	}

	#updateValue() {
		this.fgValue = fraction.create(this.eles.fgEdit.value);
		this.dirty = true;
	}

	static dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
	#drawNodeFg(pos, value, textSize, sep, level = 0, dir = [0, 0]) {
		// draw
		const mainWhole = fraction.isWhole(value);
		const hilitColor = "green";
		if (level != this.fgLevels) {
			for (let pntNext of MainApp.dirs) {
				//  recurse
				if (pntNext[0] == -dir[0] && pntNext[1] == -dir[1]) {
					continue; // don't go back to where we came from
				}
				let newPos = vec2.create();
				let pntSep = vec2.create();
				vec2.scale(pntSep, pntNext, sep);
				vec2.add(newPos, pos, pntSep);
				this.drawPrim.drawLine(pos, newPos, .015, "black");
				const newValue = this.#hailMove(value, pntNext[0], pntNext[1]);
				this.#drawNodeFg(newPos, newValue
					, textSize * this.textRatio, sep * this.lineRatio
					, level + 1, pntNext);
			}
		}
		this.drawPrim.drawCircleO(pos, textSize, .04, "black");
		this.drawPrim.drawCircle(pos, textSize, mainWhole ? hilitColor : "lightgray");
		const str = fraction.toString(value, false);
		const scl = textSize * 4.05 / (str.length + 1); // text smaller for large numbers
		this.drawPrim.drawText(pos, [scl, scl], str, "black");
	}

	#procFreeGroup() {
		// UI
		let dirX = 0;
		let dirY = 0;
		switch(this.input.keyboard.key) {
			case keyTable.keyCodes.RIGHT:
				dirX = 1;
				break;
			case keyTable.keyCodes.LEFT:
				dirX = -1;
				break;
			case keyTable.keyCodes.UP:
				dirY = 1;
				break;
			case keyTable.keyCodes.DOWN:
				dirY = -1;
				break;
		}
		if (dirX != 0 || dirY != 0) {
			this.fgValue = this.#hailMove(this.fgValue, dirX, dirY, this.sep);
			this.eles.fgEdit.value = fraction.toString(this.fgValue);
			this.dirty = true;
		}
	}

	#drawFreeGroup() {
		this.#drawNodeFg(this.fgNode, this.fgValue, this.textSize, this.lineSize);
	}

	// count number of trailing zeros in a string
	static #trailingZerosStr(str) {
		if (typeof(str) !== 'string') {
			return 0;
		}
		let ret = 0;
		for (let pos = str.length - 1; pos >= 0; --pos) {
			if (str[pos] != '0') {
				return ret;
			} else {
				++ret;
			}
		}
		return ret;
	}

	constructor() {
		console.log("mainapp hail");

		this.fpsScreen = 60;
		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		//this.vp = null; // OR, no vertical panel UI
		this.eles = {}; // keep track of eles in vertical panel

		// add all elements from vp to ele if needed
		// uncomment if you need elements from vp html
		//populateElementIds(this.vp, this.eles);

		// USER before UI built
		this.#userInit();

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER
		//const center = [10, 30]; // focus on freegroup
		//const zoom = .0958;
		const center = [7, 6.7]; // focus on hail blocks
		const zoom = .14;
		this.plotter2d = new Plotter2d(this.plotter2dCanvas
			, this.ctx, this.vp, center, zoom, false, false);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim, [-400, -400], [400, 400]);

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.dirty = true; // draw at least once
		this.dirtyCount = 100;
		this.#animate();
	}

	#initLevels() {
		// params
		this.nodeRad = .15;
		//this.doExpand = true; // draw the loop 1-2-1-2 etc.
		this.doThrees = false; // don't create multiples of 3
		this.drawThrees = false; // don't expand 3-6-12, 9-18-36 etc. if false
		this.loose = true; // make look cleaner
		this.numLevels = 15;

		this.levels = []; // array of level, level is array of nodes
		this.nodes = []; // all the nodes location
		for (let lev = 0; lev < this.numLevels; ++lev) {
			const level = [];
			if (lev == 0) {
				// start if off with one node with value of 1 and no connections
				const node = new Node(0, 0, 1, this.nodeRad);
				this.nodes.push(node);
				level.push(node);
			} else { // go back to prev level and connect the nodes
				const prevLevel = this.levels[lev - 1];
				// run through all nodes in prev level to make new nodes for current level
				for (let prevNode of prevLevel) {
					const val = prevNode.n;
					if (this.doExpand || val != 1 || lev != 3) { // handle special case for 1 2 1 loop
						if (this.drawThrees || val % 3 != 0) {
							const node = new Node(level.length, lev, val * 2, this.nodeRad); // times two PATH, inv (1/2 * input)
							this.nodes.push(node);
							level.push(node);
							node.prev.push(prevNode);
							prevNode.next.push(node);
						}
					}
					if (val % 3 == 2) { // inv (3/2 * input + 1/2) divide by three PATH
						const newVal = (val * 2 - 1) / 3;
						if (this.doThrees || newVal % 3 != 0) {
							const node = new Node(level.length, lev, newVal, this.nodeRad);
							this.nodes.push(node);
							level.push(node);
							node.prev.push(prevNode);
							prevNode.next.push(node);
						}
					}
				}
			}
			this.levels[lev] = level;
		}
		// more spacing
		if (this.loose) {
			const level = this.levels[this.numLevels - 1];
			for (let lev = 0; lev < level.length; ++lev) {
				let node = level[lev];
				let x = node.p[0];
				while(node.n % 2 == 0) {
					node = node.prev[0];
					node.p[0] = x;
				}
			}
		}
		this.nodePnts = Array(this.nodes.length);
		this.editPnts = new EditPnts(this.nodePnts, this.nodeRad);
	}

	#drawLevels() {
		for (let i = 0; i < this.levels.length; ++i) {
			let level = this.levels[i];
			// draw line to prev nodes
			for (let node of level) {
				for (let prevNode of node.prev) {
					const pnt = node.p;
					const pntPrev = prevNode.p;
					this.drawPrim.drawLine(pnt, pntPrev, .01, "red");
				}
			}
			// draw line to next nodes
			for (let node of level) {
				for (let nextNode of node.next) {
					const pnt = node.p;
					const pntNext = nextNode.p;
					this.drawPrim.drawLine(pnt, pntNext, .01, "green");
				}
			}
		}
		
		// draw the nodes from nodes array
		const hilitIdx = this.editPnts.getHilitIdx();
		for (let i = 0; i < this.nodes.length; ++i) {
			const nod = this.nodes[i];
			nod.draw(this.drawPrim, this.doExpand, i == hilitIdx);
		}
	}

	// some kind of hack
	#nodeToPnts() {
		for (let i = 0; i < this.nodes.length; ++i) {
			this.nodePnts[i] = this.nodes[i].p;
		}
	}

	#pntsToNode() {
		for (let i = 0; i < this.nodes.length; ++i) {
			this.nodes[i].p = this.nodePnts[i];
		}
	}

	// USER: add more members or classes to mainApp
	#userInit() {
		this.avgFpsObj = new Runavg(500);
		this.#initPowers();
		this.#initFreeGroup();
		this.#initLevels();
		this.minHailBlocksMoves = 7;
		this.hailBlocks = new HailBlocks(this.drawPrim);
	}

	#userBuildUI() {
		// text info log
		makeEle(this.vp, "hr");
		
		// info
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, "textInfo", "textInfoLog placeholder");


		makeEle(this.vp, "hr");
		// value
		makeEle(this.vp, "span", null, "fgv", "Free Group Value");
		makeEle(this.vp, "br");

		this.eles.fgEdit = makeEle(this.vp, "textarea", "editValue", "editbox", fraction.toString(this.fgValue, false));
		// submit value
		makeEle(this.vp, "button", null, null, "Update freegroupValue",this.#updateValue.bind(this));
		makeEle(this.vp, "hr");
		
		// check boxes
		makeEle(this.vp, "span", null, "marg", "Show nodes");
		this.eles.showNodes = makeEle(this.vp, "input", "showNodes", null, "hy", () => this.dirty = true, "checkbox");
		this.eles.showNodes.checked = false;
		
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Show powers of 2");
		this.eles.checkboxPow2 = makeEle(this.vp, "input", "checkboxPow2", null, "hi", () => this.dirty = true, "checkbox");
		this.eles.checkboxPow2.checked = false;

		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Show freeGroup");
		this.eles.freeGroup = makeEle(this.vp, "input", "freeGroup", null, "hu", () => this.dirty = true, "checkbox");
		this.eles.freeGroup.checked = false;
		
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Show hailBlocks");
		this.eles.hailBlocks = makeEle(this.vp, "input", "hailBlocks", null, "hu", () => this.dirty = true, "checkbox");
		this.eles.hailBlocks.checked = true;
		
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Show graph paper");
		this.eles.showGraph = makeEle(this.vp, "input", "showGraphpaper", null, "ho", () => this.dirty = true, "checkbox");
		this.eles.showGraph.checked = true;

		// freegroup start text size slider combo
		{
			this.minStartTextSize = .125;
			this.maxStartTextSize = 8;
			this.startTextSize = 1;
			makeEle(this.vp, "hr");
			// start lineStep UI
			const label = "freeGroup start Text size";
			const min = this.minStartTextSize;
			const max = this.maxStartTextSize;
			const start = this.startTextSize;
			const step = .01;
			const precision = 2;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,  (v) => {this.textSize = v; this.dirty = true});
			// end lineStep UI
		}

		// freegroup text ratio slider combo
		{
			this.minTextRatio = .125;
			this.maxTextRatio = 8;
			this.startTextRatio = .68;
			makeEle(this.vp, "hr");
			// start lineStep UI
			const label = "freeGroup Text Ratio";
			const min = this.minTextRatio;
			const max = this.maxTextRatio;
			const start = this.startTextRatio;
			const step = .01;
			const precision = 2;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,  (v) => {this.textRatio = v; this.dirty = true});
			// end lineStep UI
		}

		// freegroup start line size slider combo
		{
			this.minstartLineSize = .125;
			this.maxstartLineSize = 8;
			this.startLineSize = 5;
			makeEle(this.vp, "hr");
			// start lineStep UI
			const label = "freeGroup start Line size";
			const min = this.minstartLineSize;
			const max = this.maxstartLineSize;
			const start = this.startLineSize;
			const step = .01;
			const precision = 2;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,  (v) => {this.lineSize = v; this.dirty = true});
			// end lineStep UI
		}
		// freegroup line ratio slider combo
		{
			this.minlineRatio = .125;
			this.maxlineRatio = 8;
			this.startlineRatio = .49;
			makeEle(this.vp, "hr");
			// start lineStep UI
			const label = "freeGroup Line Ratio";
			const min = this.minlineRatio;
			const max = this.maxlineRatio;
			const start = this.startlineRatio;
			const step = .01;
			const precision = 2;
			new makeEleCombo(this.vp, label, min, max, start, step, precision,  (v) => {this.lineRatio = v; this.dirty = true});
			// end lineStep UI
		}
		makeEle(this.vp, "hr");
	}

	#userProc() { // USER:
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

		if (this.eles.freeGroup.checked) {
			this.#procFreeGroup();
		}
		this.#nodeToPnts();
		this.dirty = this.editPnts.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
		this.#pntsToNode();
	}

	#userDraw() {
		if (this.eles.showGraph.checked) {
			this.graphPaper.draw(this.doParametric ? "X" : "T", "Y");
		}
		if (this.eles.checkboxPow2.checked) {
			this.#drawPowers();
		}
		if (this.eles.freeGroup.checked) {
			this.#drawFreeGroup();
		}
		if (this.eles.showNodes.checked) {
			this.#drawLevels();
		}
		if (this.eles.hailBlocks.checked) {
			this.hailBlocks.draw(this.drawPrim, this.minHailBlocksMoves);
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		if (!this.vp) {
			return;
		}
		const p = this.plotter2d;
		// show inputEventsStats
		const fpsStr = "FPS = " + this.avgFps.toFixed(2) + "\n"
			+ "Use the arrow keys\nto navigate\nthe Free Group\n"
			+ "Dirty Count = " + this.dirtyCount + "\n"
			+ "Max Value = " + this.hailBlocks.getMaxValue();
		this.eles.textInfoLog.innerText = fpsStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		// interact with mouse, calc all spaces
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT) || this.dirty;
		this.#userProc(); // proc

		// draw when dirty
		//this.dirty = true;
		if (this.dirty) {
			this.plotter2d.clearCanvas();
			// goto user/cam space
			this.plotter2d.setSpace(Plotter2d.spaces.USER);
			// now in user/cam space
			// USER: do USER stuff
			this.#userDraw(); // proc and draw
		}

		// update UI, vertical panel text
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
