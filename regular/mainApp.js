'use strict';

class RegShape extends Shape {
	static snapAmount = degToRad(15);

	static setupPolyPnts(numSides) {
		// regular polygon
		const rad = 1 / (2 * Math.sin(Math.PI / numSides));
		this.polyPnts = [];
		// last edge is on the bottom, go clockwise
		for (let edge = 0; edge < numSides; ++edge) {
			const ang = Math.PI * (3 / 2 - (1 + edge * 2) / numSides);
			const pnt = [rad * Math.cos(ang), rad * Math.sin(ang)];
			this.polyPnts.push(pnt);
		}
		this.nearRad = .95 * rad * Math.cos(Math.PI / numSides); // easier overlap, a little in
		super.setupPolyPnts();
		// setup draw commands for faster drawing
		this.drawCmds = this.makeCmds(this.polyPnts);
	} 

	static {
		// make some colors for regular polys
		const brt = .2 * 255;
		const sat = .6 * 255;
		this.colorTable = [];
		for (let i = 0; i < 3; ++i) {
			this.colorTable[i] = "";
		}
		const colObj = {};
		const numAngs = 6;
		for (let i = 0; i < numAngs; ++i) {
			const ang = i * 2 * Math.PI / numAngs; // 0 is the brightest, 180 is darkest
			const angR = ang;
			const angG = ang - degToRad(120);
			const angB = ang - degToRad(240);
			colObj.r = brt + sat * Math.cos(angR);
			colObj.g = brt + sat * Math.cos(angG);
			colObj.b = brt + sat * Math.cos(angB);
			colObj.a = 255;
			const col32 = Bitmap32.RGBATocolor32(colObj);
			const colStr = Bitmap32.color32ToStr(col32);
			console.log("colstr = " + colStr);
			this.colorTable[i + 3] = colStr;
		}
	}

	static draw(drawPrim, id, doHilit = false, options, overlap = false) {
		const ctx = drawPrim.ctx;
		const bounds = false; // clipping circles
		const edgeLabels = false;
		// fill the tile
		Tile.doPath(ctx, this.drawCmds);
		const col = this.colorTable[this.polyPnts.length];
		let colAdjust = doHilit ? .3 : 0;
		const colHilit = Bitmap32.colorAdd(col, colAdjust);
		ctx.fillStyle = colHilit;
		ctx.fill();
		// outline the tile
		Tile.doPath(ctx, this.drawCmds);
		const lineWidth = .025;
		ctx.lineWidth = overlap ? lineWidth * 3 : lineWidth;
		ctx.strokeStyle = overlap ? "red" : "black";
		ctx.stroke();

		if (bounds) {
			drawPrim.drawArcO([0, 0], this.nearRad, lineWidth, degToRad(0), degToRad(360), "white");
			drawPrim.drawArcO([0, 0], this.boundRadius, lineWidth, degToRad(0), degToRad(360), "blue");
		}

		if (edgeLabels) {
			ctx.moveTo(0, 0);
			ctx.lineTo(this.nearRad, 0); // reference angle
			ctx.stroke();
	
			for (let i = 0; i < this.polyPnts.length; ++i) {
				const p0 = this.polyPnts[i];
				const p1 = this.polyPnts[(i + 1) % this.polyPnts.length];
				const avg = vec2.create();
				vec2.add(avg, p0, p1);
				const closer = .875;
				vec2.scale(avg, avg, .5 * closer); // move text in closer to center
				ctx.save();
				ctx.translate(avg[0], avg[1]);
				this.drawLevel(drawPrim, i, true);
				ctx.restore();
			}
		}
	}

	// horizontal level text
	static drawLevel(drawPrim, id, edgeHilit = false) {
		const radius = .075;
		drawPrim.drawCircle([0,0], radius, edgeHilit ? "yellow" : "brown"); // center
		const size = radius * 2;
		drawPrim.drawText([0, 0], [size, size], id, edgeHilit ? "black" : "white");
	}
}

// shape 3
class ThreeShape extends RegShape {
	static setupPolyPnts() {
		super.setupPolyPnts(3); // triangle
	}
	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "three";
	}
}

// shape 4
class FourShape extends RegShape {
	static setupPolyPnts() {
		super.setupPolyPnts(4); // square
	}
	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "four";
	}
}

// shape 5
class FiveShape extends RegShape {
	static setupPolyPnts() {
		super.setupPolyPnts(5); // pentagon
	}
	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "five";
	}
}

// shape 6
class SixShape extends RegShape {
	static setupPolyPnts() {
		super.setupPolyPnts(6); // hexagon
	}
	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "six";
	}
}

// shape 7
class SevenShape extends RegShape {
	static setupPolyPnts() {
		super.setupPolyPnts(7); // heptagon
	}
	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "seven";
	}
}

// shape 8
class EightShape extends RegShape {
	static setupPolyPnts() {
		super.setupPolyPnts(8); // octagon
	}
	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "eight";
	}
}

RegShape.factory = {
	three: ThreeShape,
	four: FourShape,
	five: FiveShape,
	six: SixShape,
	seven: SevenShape,
	eight: EightShape
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return this.#numInstances;
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
		addEventListener("beforeunload", this.#saveRegTiles.bind(this, "regSlot0"));
	}

	#clearRegTiles() {
		this.tiles.length = 0;
		this.editTiles.deselect();
		this.input.setFocus(); // back to canvas/div
		this.dirty = true;
	}

	#clearRegDups() {
		console.log("clear reg dups, len = " + this.tiles.length);
		Tile.clearDups(this.tiles);
		this.editTiles.deselect();
		this.input.setFocus(); // back to canvas/div
		this.dirty = true;
	}

	#loadRegTiles(slot, starter) {
		this.tiles = Tile.loadTiles(slot, RegShape.factory);
		if (starter && !this.tiles.length) {
			this.tiles.push(new Tile(ThreeShape, [0, 0], 0));
			this.tiles.push(new Tile(FourShape, [2, 0], degToRad(22.5)));
			console.log("creating " + this.tiles.length + " starter tiles");
		}
		this.editTiles = new EditTiles(this.tiles);
		if (this.input) {
			this.input.setFocus(); // back to canvas/div, input might not be ready
		}
		this.dirty = true;
	}

	#saveRegTiles(slot) {
		Tile.saveTiles(this.tiles, slot);
		if (this.input) {
			this.input.setFocus(); // back to canvas/div
		}
	}

	// tiles and tile index
	#deselectFun(tiles, idx) {
		const curTile = tiles[idx];
		if (this.snapAngle) {
			curTile.rot = snapNum(curTile.rot, RegShape.snapAmount);
			curTile.updateWorldPoly();
		}
		if (this.snapTile & this.tiles.length >= 2) {
			const info = Tile.findBestSnapTile(this.tiles, idx);
			if  (info) {
				Tile.connectTiles(this.tiles[info.masterTileIdx], info.masterEdge
					, this.tiles[info.slaveTileIdx], info.slaveEdge); // master, slave, master, slave
			}
		}
		this.editTiles.deselect();
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

		this.snapAngle = true;
		this.snapTile = true;
		this.drawIds = false;
		this.redBarWidth = .25; // for add remove tiles
		// Reg tiles
		this.protoTiles = [];
		// let proc position those proto tiles with zoom and pan UI
		this.protoTiles.push(new Tile(ThreeShape, [0, 0], 0));
		this.protoTiles.push(new Tile(FourShape, [0, 0], 0)); 
		this.protoTiles.push(new Tile(FiveShape, [0, 0], 0));
		this.protoTiles.push(new Tile(SixShape, [0, 0], 0));
		this.protoTiles.push(new Tile(SevenShape, [0, 0], 0));
		this.protoTiles.push(new Tile(EightShape, [0, 0], 0));
		this.#loadRegTiles("regSlot0", true);
		this.editOptions = {
			rotStep: 0, // set in proc
			delDeselect: false, // set in proc
			deselectFun: this.#deselectFun.bind(this),
			doMove: true,
			moveToTop: true
		};
		this.editProtoOptions = {
			rotStep: 0,
			delDeselect: false,
			deselectFun: null,
			doMove: false,
			moveToTop: false
		};
		this.editProtoTiles = new EditTiles(this.protoTiles);

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .1;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");

		makeEle(this.vp, "span", null, "marg", "Rotate Tiles");
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Left Right Arrow Keys");
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "While Selected");

		makeEle(this.vp, "br");
		makeEle(this.vp, "br");

		makeEle(this.vp, "span", null, "marg", "Snap Angle");
		this.eles.snapAngle = makeEle(this.vp, "input", "snapAngle", null, "ho", (val) => {
			this.snapAngle = val;
		}, "checkbox");
		this.eles.snapAngle.checked = this.snapAngle;
		makeEle(this.vp, "br");

		makeEle(this.vp, "span", null, "marg", "Snap Nearest Tile");
		this.eles.snapTile = makeEle(this.vp, "input", "snapTile", null, "ho", (val) => {
			this.snapTile = val;
			this.dirty = true;
		}, "checkbox");
		this.eles.snapTile.checked = this.snapTile;

		makeEle(this.vp, "br");
		makeEle(this.vp, "br");

		makeEle(this.vp, "span", null, "marg", "Draw Center Ids");
		this.eles.drawIds = makeEle(this.vp, "input", "draw ids", null, "ho", (val) => {
			this.drawIds = val;
			this.dirty = true;
		}, "checkbox");
		this.eles.drawIds.checked = this.drawIds;

		makeEle(this.vp, "br");
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "'Del' key to delete hilited tiles");
		makeEle(this.vp, "span", null, "marg", "'Shift' key to clone select");
		makeEle(this.vp, "br");
		// clear duplicates
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Clear Duplicates", this.#clearRegDups.bind(this));
		// clear tiles
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Clear all tiles", this.#clearRegTiles.bind(this));
		// load save slots
		makeEle(this.vp, "br");

		const numSlots = 5;
		for (let sn = 1; sn <= numSlots; ++sn) {
			makeEle(this.vp, "br");
			makeEle(this.vp, "button", null, "short", "Load " + sn
				, this.#loadRegTiles.bind(this, "regSlot" + sn, false));
			makeEle(this.vp, "button", null, "short", "Save " + sn
				, this.#saveRegTiles.bind(this, "regSlot" + sn));
		}
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
		this.editOptions.rotStep = 0;
		switch(key) {
		case keyCodes.RIGHT:
			this.editOptions.rotStep -= RegShape.snapAmount; // clockwise
			break;
		case keyCodes.LEFT:
			this.editOptions.rotStep += RegShape.snapAmount; // counter clockwise
			break;
		case keyCodes.DELETE:
			this.editTiles.deleteHilited();
			this.dirty = true;
			break;
		}
		this.editOptions.cloneSelect = this.input.keyboard.keystate[keyCodes.SHIFT];

		// remove tiles if deselected in the red area
		this.editOptions.delDeselect = this.plotter2d.ndcMouse[0] - this.plotter2d.ndcMin[0] < this.redBarWidth;
		this.dirty = this.editTiles.proc(this.input.mouse, this.plotter2d.userMouse
			, this.editOptions) 
			|| this.dirty;
		
		this.dirty = this.editProtoTiles.proc(this.input.mouse, this.plotter2d.userMouse
			, this.editProtoOptions) 
			|| this.dirty;
		
		if (this.editTiles.getHilitIdx() >= 0) {
			// don't hilit both proto tiles and main tiles
			this.editProtoTiles.deselect();
		}
		// update proto tiles positions to user space
		//const yPos = [.75, .65, .55]; // skinny, fat
		for (let i = 0; i < this.protoTiles.length; ++i) {
			const yPos = 1 - 2 / this.protoTiles.length * (i + .5);
			const tile = this.protoTiles[i];
			const ndc = [this.plotter2d.ndcMin[0] + this.redBarWidth / 2, yPos]; 
			const user = tile.pos;
			this.plotter2d.ndcToUser(user, ndc);
			tile.updateWorldPoly();
		}
		// select and add a proto tile to the main tiles
		const protoSelected = this.editProtoTiles.getCurSelected()
		if (protoSelected >= 0) {
			this.editProtoTiles.deselect();
			const newTile = this.protoTiles[protoSelected].clone();
			this.editTiles.addTileSelect(newTile, this.plotter2d.userMouse);
		}
	}

	#userDraw() {
		const options = {
			drawIds: this.drawIds
		};
		// proto shapes
		this.editProtoTiles.draw(this.drawPrim, options);
		// main shapes
		this.editTiles.draw(this.drawPrim, options, true);
		// draw red add delete bar
		this.plotter2d.setSpace(Plotter2d.spaces.NDC);
		const col = this.editOptions.delDeselect ? "#ff000040" : "#ff000020";
		this.drawPrim.drawRectangle(this.plotter2d.ndcMin
			, [this.redBarWidth, (this.plotter2d.ndcMax[1] - this.plotter2d.ndcMin[1])]
			, col);
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Dirty Count = " + this.dirtyCount;
		infoStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		infoStr += "\n Number of tiles = " + this.tiles.length;
		const keyCodes = keyTable.keyCodes;
		infoStr += "\n Shift = " + !!this.input.keyboard.keystate[keyCodes.SHIFT];
		const curSelIdx = this.editTiles.getCurSelected();
		if (curSelIdx >= 0) {
			infoStr += "\n Current selected = " + curSelIdx;
			const info = Tile.findBestSnapTile(this.tiles, curSelIdx);
			if (info) {
				infoStr += "\n mastertile = " + info.masterTileIdx
				infoStr += "\n masteredge = " + info.masterEdge
				infoStr += "\n slavetile = " + info.slaveTileIdx
				infoStr += "\n slaveedge = " + info.slaveEdge
				infoStr	+= "\nbestdist = " + info.bestDist2.toFixed(2);
			}
		}
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
