'use strict';

function javaScriptTests() {
	// test out features of javascript here
	console.log("START javascript tests!");
	//inheritanceTests();
	//const codeWord = rudolphSim();
	//runScratch();
	//console.log("codeword = '" + codeWord + "'");
	console.log("DONE javascript tests!");
}

// a test shape
class SimpleShape1 extends Shape {
	static setupPolyPnts() {
		this.polyPnts = [
			[-.25, .25],
			[0, .5],
			[.25, 0]
		];
		super.setupPolyPnts();
	}

	// very custom draw
	static draw(drawPrim, id, doHilit = false) {
		const ctx = drawPrim.ctx;
		const colAdjust = doHilit ? .3 : 0;
		const colHilit = Bitmap32p.colorAdd("green", colAdjust);
		drawPrim.drawPoly(this.polyPnts, .025, colHilit, "black");
	}

	// no rotation
	static drawLevel(drawPrim, id) {
		// don't rotate the text
		const radius = .025;
		drawPrim.drawCircle([0,0], radius, "brown", ); // center
		const size = radius * 2;
		drawPrim.drawText([0, 0], [size, size], id, "white");
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
	}
}

// another test tile
class SimpleShape2 extends Shape {
	static setupPolyPnts() {
		this.polyPnts = [
			[-.125, 0],
			[0, .25],
			[1.125, 0]
		];
		super.setupPolyPnts();
	}

	// very custom draw
	static draw(drawPrim, id, doHilit = false) {
		const ctx = drawPrim.ctx;
		const colAdjust = doHilit ? .3 : 0;
		const colHilit = Bitmap32p.colorAdd("gray", colAdjust);
		drawPrim.drawPoly(this.polyPnts, .025, colHilit, "blue");
		const radius = .025;
		drawPrim.drawCircle([0,0], radius, "red", ); // center
		const size = radius * 2;
		// rotate the text too
		drawPrim.drawText([0, 0], [size, size], id, "black");
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
	}
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp.numInstances;
	}

	constructor() {
		javaScriptTests();
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

	// data has 4 elements c0, p0, p1, c1
	// slope of p0 = c0 - p0
	// slope of p1 = p1 - c1
	// return p(t)
	static #bMat = [
		[0, 1, 0, 0],
		[1, -1, 0, 0],
		[-2, -1, 2, 1],
		[1, 1, -1, -1]
	];

	#bezier1d(pntsY, t) {
		const powers = [1, t, t * t, t * t * t];
		const timeRow = [];
		for (let j = 0; j < powers.length; ++j) { // powers
			let sum = 0;
			for (let i = 0; i < powers.length; ++i) { // pnts
				sum += powers[i] * MainApp.#bMat[i][j];
			}
			timeRow.push(sum);
		}
		let sumY = 0;
		for (let i = 0; i < powers.length; ++i) {
			sumY += timeRow[i] * pntsY[i];
		}
		return sumY;
	}

	#bezier2d(origPnts, t) {
		const moreControl = true;
		let pnts;
		if (moreControl) {
			// increase control points by a factor of 2
			pnts = Array(origPnts.length);
			pnts[0] = [ // C0
				2 * origPnts[0][0] - origPnts[1][0],
				2 * origPnts[0][1] - origPnts[1][1]
			];
			pnts[1] = [ // P0
				origPnts[1][0],
				origPnts[1][1]
			];
			pnts[2] = [ // P1
				origPnts[2][0],
				origPnts[2][1]
			];
			pnts[3] = [ // C1
				2 * origPnts[3][0] - origPnts[2][0],
				2 * origPnts[3][1] - origPnts[2][1]
			];
		} else {
			pnts = origPnts;
		}
		const powers = [1, t, t * t, t * t * t];
		const timeRow = [];
		for (let j = 0; j < powers.length; ++j) { // powers
			let sum = 0;
			for (let i = 0; i < powers.length; ++i) { // pnts
				sum += powers[i] * MainApp.#bMat[i][j];
			}
			timeRow.push(sum);
		}
		let sumP = [0, 0];
		for (let i = 0; i < powers.length; ++i) {
			const pnt = pnts[i];
			for (let d = 0; d < 2; ++d) {
				sumP[d] += timeRow[i] * pnt[d];
			}
		}
		return sumP;
	}

	#strToPoint(str, offset, scale) {
		const splitStr = str.split(",");
		const pnt = [parseFloat(splitStr[0]), parseFloat(splitStr[1])];
		pnt[0] *= scale;
		pnt[0] += offset[0];
		pnt[1] *= -scale;
		pnt[1] += offset[1];
		return pnt;
	}

	#svgPathToPoints(pathStr, offset, scale, tweenSegments) {
		//console.log("The path string is:\n'" + pathStr + "'");
		const splitStr = pathStr.trim().split(/\s+/);
		/*
		// show splitStr
		console.log("split len = " + splitStr.length);
		for (let i = 0; i < splitStr.length; ++i) {
			const s = splitStr[i];
			console.log(" Idx " + i + " '" + s + "' len "+ s.length);
		}*/
		let startPoint;
		const points = [];
		let oldPnt, newPnt;
		let C0;
		let C1;
		let bezPnts;
		for (let i = 0; i < splitStr.length; ++i) {
			const tok = splitStr[i];
			console.log("read idx " + i + " value " + tok);
			switch(tok) {
			case 'M': // mark
				console.log("M at " + i);
				startPoint = this.#strToPoint(splitStr[i + 1], offset, scale);
				oldPnt = startPoint.slice();
				i += 1;
				points.push(startPoint);
				break;
			case 'C': // cubic
				console.log("C at " + i);
				C0 = this.#strToPoint(splitStr[i + 1], offset, scale);
				C1 = this.#strToPoint(splitStr[i + 2], offset, scale);
				newPnt = this.#strToPoint(splitStr[i + 3], offset, scale);
				bezPnts = [C0, oldPnt, newPnt, C1];
				i += 3;
				for (let j = 0; j < tweenSegments; ++j) {
					const bp = this.#bezier2d(bezPnts, j / tweenSegments);
					points.push(bp);
				}
				oldPnt = newPnt;
				break;
			case 'z': // close
			case 'Z':
				console.log("z at " + i);
				//points.push(startPoint.slice());
				break;
			}
		}
		console.log("num points = " + points.length);
		return points;
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

		// tiles, test simple tiles
		this.tiles = [];
		
		this.tiles.push(new Tile(SimpleShape1, [0, 0], degToRad(0)));
		this.tiles.push(new Tile(SimpleShape1, [0, .375], degToRad(30)));
		this.tiles.push(new Tile(SimpleShape1, [0, .75], degToRad(45)));
		this.tiles.push(new Tile(SimpleShape2, [1, 0], degToRad(0)));
		this.tiles.push(new Tile(SimpleShape2, [1, .375], degToRad(30)));
		this.tiles.push(new Tile(SimpleShape2, [1, .75], degToRad(45))); 
		this.editTiles = new EditTiles(this.tiles);

		// pnts 3, test inside outside stuff, first start with a line
		// try some Bezier curves
		// 1d points
		this.pnts3 = [
			[-2, 1.9],
			[-3, 2.2],
			[-2, 1.5],
			[-3, 1.8]
		];
		const numPnts3 = this.pnts3.length;
		this.pntRad3 = .05; // size of point
		this.editPnts3 = new EditPnts(this.pnts3, this.pntRad3); // defaults, no add remove points

		// 2d points
		this.pnts4 = [
			[2, -3],
			[1, -2],
			[5, -2],
			[4, -3]
		];
		this.pnts4b = [
			[-2, 2.9],
			[-3, 3.2],
			[-2, 2.5],
			[-3, 2.8]
		];
		const numPnts4 = this.pnts4.length;
		this.pntRad4 = .05; // size of point
		this.editPnts4 = new EditPnts(this.pnts4, this.pntRad4); // defaults, no add remove points

		// svg path string
		const pathStr = svgPath_8thNote;
		const offset = [0, 0];
		const scale = .1;
		const tweenSegments = 32;
		this.pnts5 = this.#svgPathToPoints(pathStr, offset, scale, tweenSegments);
		const testGrid = false;
		if (testGrid) {
			// an array of points to test against Tiles
			this.testPntsGrid = []; 
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
		}

		// before firing up Plotter2d
		this.startCenter = [.21, 1.52];
		this.startZoom = .37;
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
		this.dirty = this.editTiles.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
		this.dirty = this.editPnts3.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
		this.dirty = this.editPnts4.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
		// constrain 4 points for 1D Bezier to fixed X positions
		const constrain = [-2, -3, -2, -3]; // C0, P0, P1, C1
		for (let i = 0; i < this.pnts3.length; ++i) {
			this.pnts3[i][0] = constrain[i];
		}
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

		// pnts 2, test add remove points
		this.editPnts2.draw(this.drawPrim, this.plotter2d.userMouse);

		// tiles, manipulate polygons, drag and rotate
		this.editTiles.draw(this.drawPrim);

		// pnts 3, test 1D Bezier curves, 4 y values, c0, p0, p1, c1
		this.editPnts3.draw(this.drawPrim, this.plotter2d.userMouse);
		const numInterpPoints = 20;
		const stepSizeX = 1 / numInterpPoints;
		let pntsY = [];
		// just the Y component
		const dataY = [];
		for (let i = 0; i < this.pnts3.length; ++i) {
			dataY.push(this.pnts3[i][1]);
		}
		// interpolate and draw all the Y data points
		for (let i = 0; i <= numInterpPoints; ++i) {
			const t = i / numInterpPoints;
			const pntY = this.#bezier1d(dataY, t);
			pntsY.push(pntY);
		}
		this.drawPrim.drawLinesSimple(pntsY, .025, .04
			, -3, stepSizeX
			, undefined, "darkred");

		// pnts 4, test 2D Bezier curves, 4 2D points, c0, p0, p1, c1
		this.editPnts4.draw(this.drawPrim, this.plotter2d.userMouse);
		const pnts = [];
		for (let i = 0; i <= numInterpPoints; ++i) {
			const t = i / numInterpPoints;
			const pnt = this.#bezier2d(this.pnts4, t);
			pnts.push(pnt);
		}
		this.drawPrim.drawLinesParametric(pnts, .025, .04, undefined
			, undefined, "darkred");

		this.drawPrim.drawLinesParametric(this.pnts5, .0125, .02
			//,undefined, undefined, undefined, undefined, true); // ndcscale = true
		);
		//);
/*		drawLinesParametric(pnts, lineWidth = .01, circleSize = 0, close = false
			, lineColor = "black", circleColor = "green", offset = [0, 0], ndcScale = false) {*/
			

		if (this.testPntsGrid) {
			// test point grid with last tile
			const tile = this.editTiles.tiles[this.editTiles.tiles.length - 1];
			for (let pnt of this.testPntsGrid) {
				const inside = tile.isInside(pnt);
				this.drawPrim.drawCircle(pnt, .0075, inside ? "black" : "red"); // black inside, red outside
			}
		}
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
