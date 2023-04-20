'use strict';

class PenShape extends Shape {
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

	static drawTriNotch(drawPrim, pos, ang) {
		drawPrim.drawCircle(pos, .25, "white");
	}

	static draw(drawPrim, id, doHilit = false, fat, options) {
		let colAdjust = doHilit ? .3 : 0;
		const col = fat ? "#a08000" : "#008000";
		const colHilit = Bitmap32.colorAdd(col, colAdjust);
		drawPrim.drawPoly(this.polyPnts, .025, colHilit, "black");
		const col1 = "#2040ff";   // a blue
		const col2 = "indianred"; // a red
		const col1Hilit = Bitmap32.colorAdd(col1, colAdjust);
		const col2Hilit = Bitmap32.colorAdd(col2, colAdjust);
		if (options.drawArcs) {
			if (fat) {
				drawPrim.drawArcO(this.polyPnts[0], .25, .075, degToRad(0), degToRad(72), col1Hilit);
				drawPrim.drawArcO(this.polyPnts[2], .75, .075, degToRad(180), degToRad(180 + 72), col2Hilit);
			} else {
				drawPrim.drawArcO(this.polyPnts[1], .25, .075, degToRad(180 + 36), degToRad(0), col1Hilit);
				drawPrim.drawArcO(this.polyPnts[3], .25, .075, degToRad(36), degToRad(180 ), col2Hilit);
			}
		}
		if (options.drawNotches) {
			const pnt = vec2.create();
			const smallDist = 1 / 3;
			const largeDist = 2 / 3;
			const lineWidth = .025;
			const rad = .075;
			if (fat) {
				vec2.lerp(pnt, this.polyPnts[0], this.polyPnts[1], largeDist);
				this.drawTriNotch(drawPrim, pnt,degToRad(36));
				vec2.lerp(pnt, this.polyPnts[1], this.polyPnts[2], largeDist);
				drawPrim.drawArcO(pnt, rad, lineWidth, degToRad(180), 0, "blue");
				vec2.lerp(pnt, this.polyPnts[2], this.polyPnts[3], smallDist);
				drawPrim.drawArcO(pnt, rad, lineWidth, degToRad(72 + 180), degToRad(72), "blue");
				vec2.lerp(pnt, this.polyPnts[3], this.polyPnts[0], smallDist);
				drawPrim.drawCircleO(pnt, rad, lineWidth, "red");
			} else {
				vec2.lerp(pnt, this.polyPnts[0], this.polyPnts[1], smallDist);
				drawPrim.drawCircleO(pnt, rad, lineWidth, "red");
				vec2.lerp(pnt, this.polyPnts[1], this.polyPnts[2], largeDist);
				drawPrim.drawCircleO(pnt, rad, lineWidth, "red");
				vec2.lerp(pnt, this.polyPnts[2], this.polyPnts[3], smallDist);
				drawPrim.drawArcO(pnt, rad, lineWidth, degToRad(36 + 180), degToRad(36), "blue");
				vec2.lerp(pnt, this.polyPnts[3], this.polyPnts[0], largeDist);
				drawPrim.drawArcO(pnt, rad, lineWidth, 0, degToRad(180), "blue");
			}
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
class SkinnyShape extends PenShape {
	static setupPolyPnts() {
		super.setupPolyPnts(this.smallAngle, false); // make a skinny rhombus
	}

	static draw(drawPrim, id, doHilit = false, options) {
		super.draw(drawPrim, id, doHilit, false, options);
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "skinny";
	}
}

// tile 2
class FatShape extends PenShape {
	static setupPolyPnts() {
		super.setupPolyPnts(this.smallAngle * 2, true); // make a fat rhombus
	}

	static draw(drawPrim, id, doHilit = false, options) {
		super.draw(drawPrim, id, doHilit, true, options);
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "fat";
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

		// auto save
		addEventListener("beforeunload", this.#saveOnExit.bind(this));
	}

	#loadOnInit() {
		this.tiles = [];
		const penTilesStr = localStorage.getItem("penTiles");
		let penTilesObj = [];
		if (penTilesStr) {
			penTilesObj = JSON.parse(penTilesStr);
		}
		if (penTilesObj.length) {
			console.log("loading " + penTilesObj.length + " tiles on init");
			for (let penTileObj of penTilesObj) {
				let kind = null;
				switch(penTileObj.kind) {
				case 'skinny':
					kind = SkinnyShape;
					break;
				case 'fat':
					kind = FatShape;
					break;
				default:
					alert("unknown tile kind " + penTileObj.kind);
					break;
				}
				const pos = vec2.clone(penTileObj.pos);
				const rot = penTileObj.rot;
				this.tiles.push(new Tile(kind, pos, rot));
			}
		} else {
			this.tiles.push(new Tile(SkinnyShape, [0, 0], 0));
			this.tiles.push(new Tile(SkinnyShape, [0, .375], PenShape.smallAngle));
			this.tiles.push(new Tile(SkinnyShape, [0, .75], PenShape.smallAngle * 2));
			this.tiles.push(new Tile(FatShape, [1, 0], 0));
			this.tiles.push(new Tile(FatShape, [1, .375], PenShape.smallAngle));
			this.tiles.push(new Tile(FatShape, [1, .75], PenShape.smallAngle * 2));
			console.log("creating " + this.tiles.length + " tiles on init");
		}
	}

	#saveOnExit() {
		console.log("saving " + this.tiles.length + " tiles on exit");
		localStorage.setItem("penTiles", JSON.stringify(this.tiles));
	}

	#clearTiles() {
		this.tiles.length = 0;
		this.dirty = true;

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
		this.drawArcs = true;
		this.drawNotches = true;
		this.redBarWidth = .25; // for add remove tiles
		// Penrose tiles
		this.protoTiles = [];
		// let proc position them proto tiles
		this.protoTiles.push(new Tile(SkinnyShape, [0, 0], 0));
		this.protoTiles.push(new Tile(FatShape, [0, 0], 0));
		this.#loadOnInit();
		this.editTiles = new EditTiles(this.tiles);
		this.editProtoTiles = new EditTiles(this.protoTiles);

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
		}, "checkbox");
		this.eles.rotMode.checked = this.rotMode;

		makeEle(this.vp, "br");
		makeEle(this.vp, "br");

		makeEle(this.vp, "span", null, "marg", "Snap Angle Mode");
		this.eles.snapMode = makeEle(this.vp, "input", "snapMode", null, "ho", (val) => {
			this.snapMode = val;
		}, "checkbox");
		this.eles.snapMode.checked = this.snapMode;
		makeEle(this.vp, "br");
		makeEle(this.vp, "br");

		makeEle(this.vp, "span", null, "marg", "Draw Arcs");
		this.eles.drawArcs = makeEle(this.vp, "input", "draw arcs", null, "ho", (val) => {
			if (this.drawNotches) {
				this.drawArcs = val;
			}
			this.eles.drawArcs.checked = this.drawArcs;
			this.dirty = true;
		}, "checkbox");
		this.eles.drawArcs.checked = this.drawArcs;
		makeEle(this.vp, "br");

		makeEle(this.vp, "span", null, "marg", "Draw Notches");
		this.eles.drawNotches = makeEle(this.vp, "input", "draw notches", null, "ho", (val) => {
			if (this.drawArcs) {
				this.drawNotches = val;
			}
			this.eles.drawNotches.checked = this.drawNotches;
			this.dirty = true;
		}, "checkbox");
		this.eles.drawNotches.checked = this.drawNotches;

		makeEle(this.vp, "br");
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "'Del' key to delete hilited tiles");
		// clear tiles
		makeEle(this.vp, "button", null, null, "Clear all tiles",this.#clearTiles.bind(this));
	}		
	
	#userProc() {
		// proc
		// this.dirty = true;
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

		// process input
		// pass in the buttons and the user/cam space mouse from drawPrim
		const key = this.input.keyboard.key;
		const keyCodes = keyTable.keyCodes;
		let rotStep = 0;
		switch(key) {
		case keyCodes.RIGHT:
			rotStep -= PenShape.smallAngle; // clockwise
			break;
		case keyCodes.LEFT:
			rotStep += PenShape.smallAngle; // counter clockwise
			break;
		case keyCodes.DELETE:
			this.editTiles.deleteHilited();
			this.dirty = true;
			break;
		}

		// remove tiles if deselected in the red area
		this.delDeselect = this.plotter2d.ndcMouse[0] - this.plotter2d.ndcMin[0] < this.redBarWidth;
		this.dirty = this.editTiles.proc(this.input.mouse
			, this.plotter2d.userMouse
			, this.snapMode, this.rotMode, rotStep, this.delDeselect) 
			|| this.dirty;
		
		this.dirty = this.editProtoTiles.proc(this.input.mouse
			, this.plotter2d.userMouse
			, false, false, rotStep, false, false) 
			|| this.dirty;
		
		if (this.editTiles.getHilitIdx() >= 0) {
			// don't hilit both proto tiles and main tiles
			this.editProtoTiles.deselect();
		}
		// update proto tiles positions to user space
		const yPos = [.75, .25]; // skinny, fat
		for (let i = 0; i < this.protoTiles.length; ++i) {
			const tile = this.protoTiles[i];
			const ndc = [this.plotter2d.ndcMin[0] + this.redBarWidth / 2, yPos[i]]; 
			const user = tile.pos;
			this.plotter2d.ndcToUser(user, ndc);
		}
		// select and add a proto tile to the main tiles
		const protoSelected = this.editProtoTiles.getCurSelected()
		if (protoSelected >=0) {
			this.editProtoTiles.deselect();
			const newTile = this.protoTiles[protoSelected].clone();
			this.editTiles.addTile(newTile, this.plotter2d.userMouse);
		}
	}

	#userDraw() {
		const options = {
			drawArcs: this.drawArcs,
			drawNotches: this.drawNotches
		};
		// proto shapes
		this.editProtoTiles.draw(this.drawPrim, options);
		// main shapes
		this.editTiles.draw(this.drawPrim, options);
		// draw red add delete bar
		this.plotter2d.setSpace(Plotter2d.spaces.NDC);
		const col = this.delDeselect ? "#ff000040" : "#ff000020";
		this.drawPrim.drawRectangle(this.plotter2d.ndcMin
			, [this.redBarWidth, (this.plotter2d.ndcMax[1] - this.plotter2d.ndcMin[1])]
			, col);
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Dirty Count = " + this.dirtyCount;
		infoStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		infoStr += "\n Number of tiles = " + this.tiles.length;
		this.eles.textInfoLog.innerText = infoStr;
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
