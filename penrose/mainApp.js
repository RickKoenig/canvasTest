'use strict';

class PenTile extends Shape {
	static smallAngle = degToRad(36);
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
		super.setupPolyPnts(this.smallAngle, false); // make a skinny rhombus
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
		super.setupPolyPnts(this.smallAngle * 2, true); // make a fat rhombus
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

		this.rotMode = true;
		this.snapMode = true;
		this.redBarWidth = .25; // for add remove tiles
		// Penrose tiles
		this.tiles = [];
		this.tiles.push(new Tile(SkinnyShape, [0, 0], 0));
		this.tiles.push(new Tile(SkinnyShape, [0, .375], PenTile.smallAngle));
		this.tiles.push(new Tile(SkinnyShape, [0, .75], PenTile.smallAngle * 2));
		this.tiles.push(new Tile(FatShape, [1, 0], 0));
		this.tiles.push(new Tile(FatShape, [1, .375], PenTile.smallAngle));
		this.tiles.push(new Tile(FatShape, [1, .75], PenTile.smallAngle * 2));
		this.editTiles = new EditTiles(this.tiles);

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .25;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");

		makeEle(this.vp, "span", null, "marg", "Rotation Mode");
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Left Right Arrow Keys");
		this.eles.rotMode = makeEle(this.vp, "input", "rotMode", null, "ho", (val) => {
			this.rotMode = val;
			//console.log("rotmode = " + val);
		}, "checkbox");
		this.eles.rotMode.checked = this.rotMode;
		makeEle(this.vp, "hr");
		makeEle(this.vp, "span", null, "marg", "Snap Mode");
		this.eles.snapMode = makeEle(this.vp, "input", "snapMode", null, "ho", (val) => {
			this.snapMode = val;
			//console.log("snapMode = " + val);
		}, "checkbox");
		this.eles.snapMode.checked = this.snapMode;
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
		const key = this.input.keyboard.key;
		const keyCodes = keyTable.keyCodes;
		let rotStep = 0;
		switch(key) {
		case keyCodes.RIGHT:
			rotStep -= PenTile.smallAngle; // clockwise
			//console.log("rot = " + rotStep);
			break;
		case keyCodes.LEFT:
			rotStep += PenTile.smallAngle; // counter clockwise
			//console.log("rot = " + rotStep);
			break;
		}
		this.delDeselect = this.plotter2d.ndcMouse[0] - this.plotter2d.ndcMin[0] < .25;
		this.dirty = this.editTiles.proc(this.input.mouse
			, this.plotter2d.userMouse
			, this.snapMode, this.rotMode, rotStep, this.delDeselect) 
			|| this.dirty;
	}

	#userDraw() {
		// shapes
		this.editTiles.draw(this.drawPrim, this.plotter2d.userMouse);

		// draw red add delete bar
		this.plotter2d.setSpace(Plotter2d.spaces.NDC);
		const col = this.delDeselect ? "#ff0000c0" : "#ff000080";
		this.drawPrim.drawRectangle(this.plotter2d.ndcMin
			, [.25, (this.plotter2d.ndcMax[1] - this.plotter2d.ndcMin[1])]
			, col);
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
