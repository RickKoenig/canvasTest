'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now, assume 60hz refresh rate
class Node {
	static offset = 20; // draw node tree starting at position 20,20

	constructor(x, y, n, rad) {
		this.p = vec2.fromValues(x * .5 + Node.offset + .5, y * .5 + Node.offset + .5);
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
		const scl = this.r * 4.5 / (str.length + 1); // text smaller for large numbers
		// brighter node for other '1' that's not the root 1 - 2 - '1'
		const txtcol = !doExpand && this.n == 1 && this.prev.length != 0 ? "cyan" : "black";
		drawPrim.drawText(pnt, [scl, scl], str, txtcol);
	}
}

class MainApp {

	static dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
	#initPowers() {
		console.log("Hail Stats");
		console.log("2^n - 1 START");

		const maxHailBlocks = 20;
		const hailBlockSize = 25;
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
						console.log("Kill worker");
						this.hailWorker.terminate();
					}
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
		this.drawPrim.drawLinesSimple(this.arrHailRatio, .125, .2, 1, 1, "green", "black");
	}



	#hailMove(val, dirX, dirY) {
		// TODO: make work with bigFraction
		if (dirX == 0) {
			if (dirY == 1) { // up
				return 2 * val;
			} else if (dirY == -1) { // down
				return val / 2;
			}
		} else if (dirY == 0) {
			if (dirX == 1) { // right
				return (2 * val - 1) / 3;
			} else if (dirX == -1) { // left
				return (3 * val + 1) / 2;
			}
		}
		return val;
	}

	#initFreeGroup() {
		this.fgNode = [10, 30];
		this.fgValue = 7; // TODO: make work with bigFraction
		this.fgLevels = 4;
		this.fgSep = 4;
		this.fgSepRatio = .51;
		this.fgSizeRatio = .6;
	}

	#updateValue() {
		// TODO: make work with bigFraction
		const val = Number(this.eles.fgEdit.value);
		if (Number.isNaN(val)) {
			this.eles.fgEdit.value = this.fgValue;
			return;
		}
		this.fgValue = val;
	}

	#drawNodeFg(pos, value, rad, sep, level = 0, dir = [0, 0]) {
		// draw
		if (level != this.fgLevels) {
			for (let pntNext of MainApp.dirs) {
				if (pntNext[0] == -dir[0] && pntNext[1] == -dir[1]) {
					continue;
				}
				let newPos = vec2.create();
				let pntSep = vec2.create();
				vec2.scale(pntSep, pntNext, sep);
				vec2.add(newPos, pos, pntSep);
				this.drawPrim.drawLine(pos, newPos, .015, "black");
				this.#drawNodeFg(newPos, value
					, rad * this.fgSizeRatio, sep * this.fgSepRatio
					, level + 1, pntNext);
			}
		}
		this.drawPrim.drawCircleO(pos, rad, .08, "black");
		this.drawPrim.drawCircle(pos, rad, "lightgray");
		const str = value.toFixed(2).toString();
		const scl = rad * 4.5 / (str.length + 1); // text smaller for large numbers
		this.drawPrim.drawText(pos, [scl, scl], str, "black");
	}

	#drawFreeGroup() {
		// UI
		let dirX = 0;
		let dirY = 0;
		switch(this.input.keyboard.key) {
			case keyTable.keycodes.RIGHT:
				dirX = 1;
				break;
			case keyTable.keycodes.LEFT:
				dirX = -1;
				break;
			case keyTable.keycodes.UP:
				dirY = 1;
				break;
			case keyTable.keycodes.DOWN:
				dirY = -1;
				break;
		}
		// TODO: make work with bigFraction
		if (dirX != 0 || dirY != 0) {
			this.fgValue = this.#hailMove(this.fgValue, dirX, dirY, this.sep);
			this.eles.fgEdit.value = this.fgValue;
		}

		this.#drawNodeFg(this.fgNode, this.fgValue, 1, this.fgSep);
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

	static #hailStep(bn) {
		if (bn % 2n == 0) { // even
			return bn / 2n;
		} else { // odd
			return (3n * bn + 1n) / 2n;
		}
	}

	static #countHailSteps(bn) {
		let ret = 0;
		while(bn != 1) {
			bn = MainApp.#hailStep(bn);
			++ret;
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
		this.plotter2d = new Plotter2d(this.plotter2dCanvas
			, this.ctx, this.vp, [10, 30], .09);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim, [-4000, -4000], [4000, 4000]);

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.#animate();
	}

	#initLevels() {
		// params
		this.nodeRad = .15;
		//this.doExpand = true; // draw the loop 1-2-1-2 etc.
		//this.doThrees = true; // don't create multiples of 3
		this.drawThrees = true; // don't expand 3-6-12, 9-18-36 etc.
		this.loose = true; // make look cleaner
		this.numLevels = 20;

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
		this.nodePnts = new Array(this.nodes.length);
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
	}

	#userBuildUI() {
		// text info log
		makeEle(this.vp, "hr");
		// info
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, "textInfo", "textInfoLog");
		// value
		// TODO: make work with bigFraction
		this.eles.fgEdit = makeEle(this.vp, "textarea", "editValue", "editbox", this.fgValue);
		// submit value
		makeEle(this.vp, "button", null, null, "Update value",this.#updateValue.bind(this));
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

		this.#nodeToPnts();
		this.editPnts.proc(this.input.mouse, this.plotter2d.userMouse);
		this.#pntsToNode();

		this.#drawPowers();
		this.#drawFreeGroup();
		this.#drawLevels();
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		if (!this.vp) {
			return;
		}
		const p = this.plotter2d;
		// show inputEventsStats
		const fpsStr = "FPS = " + this.avgFps.toFixed(2) + "\n"
			+ "Use the arrow keys\nto navigate\nthe Free Group";
		this.eles.textInfoLog.innerText = fpsStr;
	}

	// proc
	#animate() {
		// update input system
		this.input.proc();
		// interact with mouse, calc all spaces
		this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT);
		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);
		// now in user/cam space
		this.graphPaper.draw(this.doParametric ? "X" : "T", "Y");
		// keep animation going
		requestAnimationFrame(() => this.#animate());

		// USER: do USER stuff
		 this.#userProc(); // proc and draw
		// update UI, vertical panel text
		this.#userUpdateInfo();
	}
}

const mainApp = new MainApp();
