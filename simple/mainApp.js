'use strict';

let codeWord;
function javaScriptTests() {
	// test out features of javascript here
	console.log("javacript tests!");
	//inheritanceTests();
	//codeWord = rudolphSim();
	//console.log("codeword = '" + codeWord + "'");
}

// a test tile
class SimpleTile extends ShapeTile {
	static polyPnts = [
		[-.25, .25],
		[0, .5],
		[.5, 0]
	];

	draw(drawPrim, doHilit = false) {
		const ctx = drawPrim.ctx;
		const colAdjust = doHilit ? .3 : 0;
		const colHilit = Bitmap32.colorAdd("green", colAdjust);
		ctx.save();
		ctx.translate(this.pos[0], this.pos[1]);
		ctx.rotate(this.rot);
		drawPrim.drawPoly(SimpleTile.polyPnts, .025, colHilit, "black");
		drawPrim.drawCircle([0,0], .025, "brown", ); // center
		ctx.restore();
	}
}
SimpleTile.setupPolyPnts(); // call once, center points,  maybe setup some statics

class SimpleTile2 {}// TODO

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp.#numInstances;
	}

	constructor() {
		javaScriptTests();
		console.log("\n############# creating instance of MainApp");
		++MainApp.#numInstances;

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
	#userInit() {
		// user init section
		this.count = 0; // frame counter
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// pnts, some custom drawing
		const numPnts = 5;
		this.pntRad = .15; // size of point
		this.pnts = createArray(numPnts, 2); // array of 'two' dimensional points
		for (let i = 0; i < numPnts; ++i) { // simple parabola curve
			this.pnts[i] = [.25 + .5 * i, 3.5 - .25 * i + .1 * i * i];
		}
		this.editPnts = new EditPnts(this.pnts, this.pntRad); // defaults, no add remove points

		// pnts 2, test add remove points
		const numPnts2 = 6; // some more editable points, test add remove and generic draw
		this.pntRad2 = .05; // size of point
		const pnts2 = createArray(numPnts2, 2); // array of 'two' dimensional points
		for (let i = 0; i < numPnts2; ++i) {
			pnts2[i] = [.25 + .5 * i, 2.5 + .25 * i - .375 * (i % 2)];
		}
		const minPnts2 = 4;
		const maxPnts2 = 8;
		const startAddRemovePoints2 = false;
		this.editPnts2 = new EditPnts(pnts2, this.pntRad2, startAddRemovePoints2, minPnts2, maxPnts2);

		// shapes, test simple shapes
		this.shapes = [];
		this.shapes.push(new SimpleTile([0, 0], degToRad(0)));
		this.shapes.push(new SimpleTile([-2, 2.5], 30));
		this.shapes.push(new SimpleTile([-1, 2.25], degToRad(45)));
		this.editShapes = new EditShapes(this.shapes);

		// pnts 3, test inside outside stuff, first start with a line
		this.pnts3 = [[-1.75, 1.5], [-1.5, -1.25]];
		const numPnts3 = this.pnts3.length;
		this.pntRad3 = .05; // size of point
		this.editPnts3 = new EditPnts(this.pnts3, this.pntRad3); // defaults, no add remove points

		this.testPntsGrid = []; // an array of points to test against pnts3 line
		const minX = -1;
		const maxX = 1;
		const minY = -1;
		const maxY = 1;
		const numX = 80;
		const numY = 80;
		for (let j = 0; j < numY; ++j) {
			let Y = minY + (maxY - minY) * j / (numY - 1);
			for (let i = 0; i < numX; ++i) {
				let X = minX + (maxX - minX) * i / (numX - 1);
				const pnt = [X, Y];
				this.testPntsGrid.push(pnt);
			}
		}

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .9;
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
			const label = "test combo";
			const min = 33;
			const max = 87;
			const start = 44;
			const step = 3;
			const precision = 4;
			const callback = null;
			new makeEleCombo(this.vp, label, min, max, start, step, precision, callback);
		}
		makeEle(this.vp, "hr");
		makeEle(this.vp, "span", null, "marg", "Add remove points");
		this.eles.addRemovePoints = makeEle(this.vp, "input", "addRemovePoints", null, "ho", (val) => {
			//console.log("checkbox addRemovePoints, value = " + val);
			this.editPnts2.setAddRemove(val);
			this.dirty = true;
		}, "checkbox");
		this.eles.addRemovePoints.checked = this.editPnts2.getAddRemove();
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
		// pass in the buttons and the user/cam space mouse from drawPrim
		this.dirty = this.editPnts.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
		this.dirty = this.editPnts2.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
		this.dirty = this.editShapes.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
		this.dirty = this.editPnts3.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
		++this.count;
	}

	#userDraw() {
		// pnts
		this.editPnts.draw(this.drawPrim, this.plotter2d.userMouse);
		// draw some extra stuff like midpoints
		const mid = vec2.create();
		for (let i = 0; i < this.pnts.length; ++i) {
			const p0 = this.pnts[i];
			const p1 = this.pnts[(i + 1) % this.pnts.length];
			//const p1 = this.pnts[i + 1];
			this.drawPrim.drawLine(p0, p1, .03, "darkgray");
			midPnt(mid, p0, p1);
			this.drawPrim.drawCircleO(mid, .05, undefined, "magenta");
		}

		// pnts 2
		this.editPnts2.draw(this.drawPrim, this.plotter2d.userMouse);

		// shapes
		this.editShapes.draw(this.drawPrim, this.plotter2d.userMouse);

		// pnts 2
		this.editPnts3.draw(this.drawPrim, this.plotter2d.userMouse);

		// test point grid
		const shapePos = this.shapes[0].pos;
		const shapeRot = this.shapes[0].rot;
		for (let pnt of this.testPntsGrid) {
			//const pen = penetrateLine(this.pnts3[0], this.pnts3[1], pnt);
			const pen = penetrateConvexPoly(SimpleTile.polyPnts, pnt, shapePos, shapeRot);
			this.drawPrim.drawCircle(pnt, .0075, pen > 0 ? "black" : "red"); // black inside, red outside
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Frame Count = " + this.count;
		if (codeWord) {
			countStr += "\nCodeword = '" + codeWord + "'";
		}
		countStr += "\nDirty Count = " + this.dirtyCount;
		countStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		this.eles.textInfoLog.innerText = countStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT) || this.dirty;
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

	#resetCounter() {
		this.count = 0;
	}
}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
