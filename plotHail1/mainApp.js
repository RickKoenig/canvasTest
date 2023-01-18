'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now, assume 60hz refresh rate
class Node {
	constructor(x, y, n, rad) {
		this.p = vec2.fromValues(x * .5 + .5, y * .5 + .5);
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
		drawPrim.drawCircle(pnt, this.r, "beige");
		const str = this.n.toString();
		const scl = this.r * 4.5 / (str.length + 1); // text smaller for large numbers
		// brighter node for other '1' that's not the root 1 - 2 - '1'
		const txtcol = !doExpand && this.n == 1 && this.prev.length != 0 ? "cyan" : "black";
		drawPrim.drawText(pnt, [scl, scl], str, txtcol);
	}
}

class MainApp {
	constructor() {
		console.log("mainapp hail");

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
			, this.ctx, this.vp, [3, 3], .25);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.#animate();
	}

	#initLevels() {
		this.nodeRad = .15;
		this.doExpand = false; // draw the loop 1-2-1-2 etc.
		this.numLevels = 10;
		this.levels = []; // array of level, level is array of nodes
		this.nodes = []; // all the nodes location
		for (let lev = 0; lev < this.numLevels; ++lev) { // 11
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
						const node = new Node(level.length, lev, val * 2, this.nodeRad); // times two PATH, inv (1/2 * input)
						this.nodes.push(node);
						level.push(node);
						node.prev.push(prevNode);
						prevNode.next.push(node);
					}
					if (val % 3 == 2) { // inv (3/2 * input + 1/2) divide by three PATH
						const node = new Node(level.length, lev, (val * 2 - 1) / 3, this.nodeRad);
						this.nodes.push(node);
						level.push(node);
						node.prev.push(prevNode);
						prevNode.next.push(node);
					}
				}
			}
			this.levels[lev] = level;
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

	// USER: add more members or classes to MainApp
	#userInit() {
		this.#initLevels();
	}

	#userBuildUI() {
	}

	#userProc() { // USER:
		this.#nodeToPnts();
		this.editPnts.proc(this.input.mouse, this.plotter2d.userMouse);
		this.#pntsToNode();
		/*
		this.drawPrim.drawCircle([.75, .5], .08, "green");
		this.drawPrim.drawCircle([this.plotter2d.userMouse[0]
			, this.plotter2d.userMouse[1]], .08, "green");
		*/
		//let col = Bitmap32.strToColor32("hddi");
		this.#drawLevels();
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
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
