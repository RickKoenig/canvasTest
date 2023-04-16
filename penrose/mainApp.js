'use strict';

class PenTile extends Shape {
	static setupPolyPnts(ang, fat) {
		// rhombus
		const sa = Math.sin(ang);
		const ca = Math.cos(ang);
		this.polyPnts = [
			[0, 0],
			[ca, sa],
			[1 + ca, sa],
			[1, 0]
		];
		this.fat = fat;
		super.setupPolyPnts();
	}

	static draw(drawPrim, id, doHilit = false, fat) {
		let colAdjust = doHilit ? .3 : 0;
		const col = fat ? "#a08000" : "#008000";
		const colHilit = Bitmap32.colorAdd(col, colAdjust);
		drawPrim.drawPoly(this.polyPnts, .025, colHilit, "black");
		const col1 = "#2040ff";   // a blue
		const col2 = "indianred"; // a red
		const col1Hilit = Bitmap32.colorAdd(col1, colAdjust);
		const col2Hilit = Bitmap32.colorAdd(col2, colAdjust);
		if (fat) {
			drawPrim.drawArcO(this.polyPnts[0], .25, .075, degToRad(0), degToRad(72), col1Hilit);
			drawPrim.drawArcO(this.polyPnts[2], .75, .075, degToRad(180), degToRad(180 + 72), col2Hilit);
		} else {
			drawPrim.drawArcO(this.polyPnts[1], .25, .075, degToRad(180 + 36), degToRad(0), col1Hilit);
			drawPrim.drawArcO(this.polyPnts[3], .25, .075, degToRad(36), degToRad(180 ), col2Hilit);
		}
	}

	static drawLevel(drawPrim, id, doHilit) {
		const radius = .075;
		drawPrim.drawCircle([0,0], radius, "brown", ); // center
		const size = radius * 2;
		drawPrim.drawText([0, 0], [size, size], id, "white");
	}
}

// tile 1
class SkinnyShape extends PenTile {
	static setupPolyPnts() {
		super.setupPolyPnts(degToRad(36), false); // make a skinny rhombus
	}

	static draw(drawPrim, id, doHilit = false) {
		super.draw(drawPrim, id, doHilit, false);
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
	}
}

// tile 2
class FatShape extends PenTile {
	static setupPolyPnts() {
		super.setupPolyPnts(degToRad(72), true); // make a fat rhombus
	}

	static draw(drawPrim, id, doHilit = false) {
		super.draw(drawPrim, id, doHilit, true);
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
	}
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp.#numInstances;
	}

	constructor() {
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
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// Penrose tiles
		this.tiles = [];
		this.tiles.push(new Tile(SkinnyShape, [0, 0], degToRad(0)));
		this.tiles.push(new Tile(SkinnyShape, [0, .375], degToRad(30)));
		this.tiles.push(new Tile(SkinnyShape, [0, .75], degToRad(45)));
		this.tiles.push(new Tile(FatShape, [1, 0], degToRad(0)));
		this.tiles.push(new Tile(FatShape, [1, .375], degToRad(30)));
		this.tiles.push(new Tile(FatShape, [1, .75], degToRad(45)));
		this.editTiles = new EditTiles(this.tiles);

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .3;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
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
		this.dirty = this.editTiles.proc(this.input.mouse, this.plotter2d.userMouse) || this.dirty;
	}

	#userDraw() {
		// shapes
		this.editTiles.draw(this.drawPrim, this.plotter2d.userMouse);
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Dirty Count = " + this.dirtyCount;
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

/*
// a Penrose tile
class Tile {
	constructor(pos, rot = 0, fat = false, colHilit) {
		if (pos) {
			this.pos = vec2.clone(pos);
		} else {
			this.pos = vec2.create();
		}
		this.rot = rot;
		this.fat = fat;
		let ang;
		if (fat) {
			ang = 72;
			this.col = "darkolivegreen";
		} else {
			ang = 36;
			this.col = "darkgreen";
		}
		ang = degToRad(ang);
		const sa = Math.sin(ang);
		const ca = Math.cos(ang);

		this.pnts = [
			[0, 0],
			[ca,  sa],
			[1 + ca,  sa],
			[1, 0]
		];
		// decide between mul or add
		this.colAdjust = colHilit ? .3 : 0;
	}

	draw(drawPrim) {
		const ctx = drawPrim.ctx;
		ctx.save();
		ctx.translate(this.pos[0], this.pos[1]);
		ctx.rotate(this.rot);
		const colHilit = Bitmap32.colorAdd(this.col, this.colAdjust);
		drawPrim.drawPoly(this.pnts, .025, colHilit, "black");
		const col1 = "#2040ff";   // a blue
		const col2 = "indianred"; // a red
		const col1Hilit = Bitmap32.colorAdd(col1, this.colAdjust);
		const col2Hilit = Bitmap32.colorAdd(col2, this.colAdjust);
		if (this.fat) {
			drawPrim.drawArcO(this.pnts[0], .25, .075, degToRad(0), degToRad(72), col1Hilit);
			drawPrim.drawArcO(this.pnts[2], .75, .075, degToRad(180), degToRad(180 + 72), col2Hilit);
		} else {
			drawPrim.drawArcO(this.pnts[1], .25, .075, degToRad(180 + 36), degToRad(0), col1Hilit);
			drawPrim.drawArcO(this.pnts[3], .25, .075, degToRad(36), degToRad(180 ), col2Hilit);
		}
		ctx.restore();
		drawPrim.drawCircle(this.pos, .025, "brown", ); // center
	}
}

// a collection of Penrose tiles
class Tiles {
	
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	constructor() {
		console.log("Play with Penrose tiles");
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

		this.startZoom = .5;

		this.tiles = [];
		this.tiles.push(new Tile([-1.5,.75], degToRad(0), false));
		this.tiles.push(new Tile([.75, .5], degToRad(0), true));
		this.tiles.push(new Tile([-1.5,-1], degToRad(-18), false, .3));
		this.tiles.push(new Tile([.75, -1.25], degToRad(-36), true, .3));
//		this.tiles.push(new Tile([-1.5,-1], degToRad(-18), false, 1.5));
//		this.tiles.push(new Tile([.75, -1.25], degToRad(-36), true, 1.5));
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
		makeEle(this.vp, "span", null, "marg", "Show graph paper");
		this.eles.showGraphPaper = makeEle(this.vp, "input", "showGraphPaper", null, "ho", () => this.dirty = true, "checkbox");
		this.eles.showGraphPaper.checked = true;
	}		
	
	#userProc() {
		// proc
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
	}

	#userDraw() {
		for (let tile of this.tiles) {
			tile.draw(this.drawPrim);
		}
		// test darken an brighten a css color
		const col = "goldenrod";
		for  (let i = -5; i <= 5; ++i) {
			const col2 = Bitmap32.colorMul(col, .2 * i + 1)
			this.drawPrim.drawCircle([.5 * i, 1.5], .125, col2);
		}
	}
__
	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Dirty Count = " + this.dirtyCount;
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

		// draw when dirty
		if (this.dirty) {
			this.plotter2d.clearCanvas();
			// interact with mouse, calc all spaces
			// goto user/cam space
			this.plotter2d.setSpace(Plotter2d.spaces.USER);
			// now in user/cam space
			if (this.eles.showGraphPaper.checked) {
				this.graphPaper.draw("X", "Y");
			}
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
*/