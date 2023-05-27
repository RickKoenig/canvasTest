'use strict';

// a test shape
class SimpleShape1 extends Shape {
	static setupPolyPnts() {
		this.polyPnts = [
			[-1, 0],
			[0, 3],
			[1, 0]
		];
		super.setupPolyPnts();
	}

	// very custom draw
	static draw(drawPrim, id, doHilit = false) {
		const ctx = drawPrim.ctx;
		const colAdjust = doHilit ? .3 : 0;
		const colHilit = Bitmap32.colorAdd("blue", colAdjust);
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
			[-.25, -.25],
			[-.25,  .25],
			[ .25,  .25],
			[ .25, -.25]
		];
		super.setupPolyPnts();
	}

	// very custom draw
	static draw(drawPrim, id, doHilit = false) {
		const ctx = drawPrim.ctx;
		const colAdjust = doHilit ? .3 : 0;
		const colHilit = Bitmap32.colorAdd("#444", colAdjust);
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

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// tiles, test simple tiles
		this.tiles = [];
		
		this.tiles.push(new Tile(SimpleShape1, [0, 0], degToRad(0)));
		this.tiles.push(new Tile(SimpleShape2, [1, 0], degToRad(0)));
		this.editOptions = {
			deselectFun: this.#deselectFun.bind(this),
			moveToTop: false
		};
		this.editTiles = new EditTiles(this.tiles, .0625, degToRad(22.5)); // snap amount if snapMode == true

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = 1;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
	}		
	
	#isInside(tile, testPoint) {
		const inside = penetrateConvexPoly(tile.worldPolyPnts, testPoint);
		return inside > 0;
	}

	// tiles and tile index
	#deselectFun(tiles, idx) {
		const tile = tiles[idx];
		tile.rot = snapNum(tile.rot, degToRad(22.5));
		tile.pos[0] = snapNum(tile.pos[0], .0625);
		tile.pos[1] = snapNum(tile.pos[1], .0625);
		tile.updateWorldPoly();
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
		this.dirty = this.editTiles.proc(this.input.mouse
			, this.plotter2d.userMouse
			, this.editOptions)
			 || this.dirty;
		// inside outside test
		this.inside = this.#isInside(this.tiles[0], this.plotter2d.userMouse);
		this.isectPoly = Tile.doIsectTiles(this.tiles[0], this.tiles[1]);
	}

	#userDraw() {
		// tiles
		this.editTiles.draw(this.drawPrim);
		this.drawPrim.drawLinesParametric(this.isectPoly, .01, .02, true
			, "green", "brown");
		}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Dirty Count = " + this.dirtyCount;
		countStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		countStr += "\nInside[0] = " + this.inside;
		countStr += "\nPoly points = " + this.isectPoly.length;
		countStr += "\nPoly area = " + calcPolyArea(this.isectPoly).toFixed(3); 
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
}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
