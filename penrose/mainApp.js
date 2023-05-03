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
		// setup draw commands for faster drawing
		this.cmdsNoNotches = [];
		let first = true;
		for (let polyPnt of this.polyPnts) {
			const cmd = {
				pnt: polyPnt,
				kind: first ? "moveTo" : "lineTo"
			}
			first = false;
			this.cmdsNoNotches.push(cmd);
		}
		this.cmdsNotches = [];
		const smallDist = 1 / 3;
		const largeDist = 2 / 3;
		let pnt;
		// hand build the notches
		if (this.fat) {
			let cmd = {
				pnt: this.polyPnts[0],
				kind: "moveTo"
			}
			this.cmdsNotches.push(cmd);

			pnt = vec2.create();
			vec2.lerp(pnt, this.polyPnts[0], this.polyPnts[1], largeDist);
			this.addTriNotchCmd(this.cmdsNotches, pnt, degToRad(72), false);

			cmd = {
				pnt: this.polyPnts[1],
				kind: "lineTo"
			}
			this.cmdsNotches.push(cmd);

			pnt = vec2.create();
			vec2.lerp(pnt, this.polyPnts[1], this.polyPnts[2], largeDist);
			cmd = {
				pnt: pnt,
				kind: "arc",
				ang: degToRad(270),
				ccw: false
			}
			this.cmdsNotches.push(cmd);

			cmd = {
				pnt: this.polyPnts[2],
				kind: "lineTo"
			}
			this.cmdsNotches.push(cmd);

			pnt = vec2.create();
			vec2.lerp(pnt, this.polyPnts[2], this.polyPnts[3], smallDist);
			cmd = {
				pnt: pnt,
				kind: "arc",
				ang: degToRad(72 + 90),
				ccw: true
			}
			this.cmdsNotches.push(cmd);

			cmd = {
				pnt: this.polyPnts[3],
				kind: "lineTo"
			}
			this.cmdsNotches.push(cmd);

			pnt = vec2.create();
			vec2.lerp(pnt, this.polyPnts[3], this.polyPnts[0], smallDist);
			this.addTriNotchCmd(this.cmdsNotches, pnt, degToRad(180), true);
		} else { // skinny
			let cmd = {
				pnt: this.polyPnts[0],
				kind: "moveTo"
			}
			this.cmdsNotches.push(cmd);

			pnt = vec2.create();
			vec2.lerp(pnt, this.polyPnts[0], this.polyPnts[1], smallDist);
			this.addTriNotchCmd(this.cmdsNotches, pnt, degToRad(36), true);

			cmd = {
				pnt: this.polyPnts[1],
				kind: "lineTo"
			}
			this.cmdsNotches.push(cmd);

			pnt = vec2.create();
			vec2.lerp(pnt, this.polyPnts[1], this.polyPnts[2], largeDist);
			this.addTriNotchCmd(this.cmdsNotches, pnt, degToRad(0), false);

			cmd = {
				pnt: this.polyPnts[2],
				kind: "lineTo"
			}
			this.cmdsNotches.push(cmd);

			pnt = vec2.create();
			vec2.lerp(pnt, this.polyPnts[2], this.polyPnts[3], smallDist);
			cmd = {
				pnt: pnt,
				kind: "arc",
				ang: degToRad(36 + 90),
				ccw: true
			}
			this.cmdsNotches.push(cmd);

			cmd = {
				pnt: this.polyPnts[3],
				kind: "lineTo"
			}
			this.cmdsNotches.push(cmd);

			pnt = vec2.create();
			vec2.lerp(pnt, this.polyPnts[3], this.polyPnts[0], largeDist);
			cmd = {
				pnt: pnt,
				kind: "arc",
				ang: degToRad(90),
				ccw: false
			}
			this.cmdsNotches.push(cmd);
		}
	}

	// add a triangle notch to the draw commands
	static triOffs = [[-.05, 0], [0, .1], [.05, 0]];
	static addTriNotchCmd(cmds, pos, ang, ccw = false) {
		const rotOff = vec2.create();
		let pnt = vec2.create();
		vec2.rotate(rotOff, this.triOffs[0], ang);
		vec2.add(pnt, rotOff, pos);
		let cmd = {
			pnt: pnt,
			kind: "lineTo",
		};
		cmds.push(cmd);

		pnt = vec2.create();
		vec2.rotate(rotOff, this.triOffs[1], ang);
		if  (ccw) {
			vec2.add(pnt, pos, rotOff);
		} else {
			vec2.sub(pnt, pos, rotOff);
		}
		cmd = {
			pnt: pnt,
			kind: "lineTo",
		};
		cmds.push(cmd);

		pnt = vec2.create();
		vec2.rotate(rotOff, this.triOffs[2], ang);
		vec2.add(pnt, rotOff, pos);
		cmd = {
			pnt: pnt,
			kind: "lineTo",
		};
		cmds.push(cmd);
	}

	// draw commands from an array of commands
	static runCmds(ctx, cmds) {
		const rad = .075;
		for (let cmd of cmds) {
			switch (cmd.kind) {
			case "moveTo":
				ctx.moveTo(cmd.pnt[0], cmd.pnt[1]);
				break;
			case "lineTo":
				ctx.lineTo(cmd.pnt[0], cmd.pnt[1]);
				break;
			case "arc":
				const ang0 = cmd.ang - Math.PI / 2;
				const ang1 = cmd.ang + Math.PI / 2;
				ctx.arc(cmd.pnt[0], cmd.pnt[1], rad, ang0, ang1, cmd.ccw);
			}
		}
	}

	// draw the outline of a tile
	static doPath(ctx, options) {
		ctx.beginPath();
		if (options.drawNotches) {
			this.runCmds(ctx, this.cmdsNotches);
		} else {
			this.runCmds(ctx, this.cmdsNoNotches);
		}
		ctx.closePath();
	}

	static draw(drawPrim, id, doHilit = false, fat, options, overlap = false) {
		// fill the tile
		const ctx = drawPrim.ctx;
		this.doPath(ctx, options);
		const col = fat ? "#a08000" : "#008000";
		let colAdjust = doHilit ? .3 : 0;
		const colHilit = Bitmap32.colorAdd(col, colAdjust);
		ctx.fillStyle = colHilit;
		ctx.fill();
		// draw arcs
		if (options.drawArcs) {
			const arcWidth = .075;
			const arcRad1 = .25;
			const arcRad2 = 1 - arcRad1;
			const col1 = "#2040ff";   // a blue
			const col2 = "indianred"; // a red
			const col1Hilit = Bitmap32.colorAdd(col1, colAdjust);
			const col2Hilit = Bitmap32.colorAdd(col2, colAdjust);
			if (fat) {
				drawPrim.drawArcO(this.polyPnts[0], arcRad1, arcWidth, degToRad(0), degToRad(72), col1Hilit);
				drawPrim.drawArcO(this.polyPnts[2], arcRad2, arcWidth, degToRad(180), degToRad(180 + 72), col2Hilit);
			} else {
				drawPrim.drawArcO(this.polyPnts[1], arcRad1, arcWidth, degToRad(180 + 36), degToRad(0), col1Hilit);
				drawPrim.drawArcO(this.polyPnts[3], arcRad1, arcWidth, degToRad(36), degToRad(180 ), col2Hilit);
			}
		}
		// outline the tile
		this.doPath(ctx, options);
		const lineWidth = .025;
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = overlap ? "red" : "black";
		ctx.stroke();
	}

	// horizontal level text
	static drawLevel(drawPrim, id) {
		const radius = .075;
		drawPrim.drawCircle([0,0], radius, "brown"); // center
		const size = radius * 2;
		drawPrim.drawText([0, 0], [size, size], id, "white");
	}
}

// tile 1
class SkinnyShape extends PenShape {
	static setupPolyPnts() {
		super.setupPolyPnts(this.smallAngle, false); // make a skinny rhombus
	}

	static draw(drawPrim, id, doHilit = false, options, overlap) {
		super.draw(drawPrim, id, doHilit, false, options, overlap);
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

	static draw(drawPrim, id, doHilit = false, options, overlap) {
		super.draw(drawPrim, id, doHilit, true, options, overlap);
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
		addEventListener("beforeunload", this.#saveTiles.bind(this, "penTiles"));
	}

	#clearTiles() {
		this.tiles.length = 0;
		this.dirty = true;
	}

	// snap one tile next to another tile even if doesn't fit
	#connectTiles() {
		// for now if 2 tiles then make tile 0 attract tile 1
		const tile0 = this.tiles[0];
		const offset0 = tile0.shape.polyPnts[0];
		const rOffset0 = vec2.create();
		vec2.rot(rOffset0, offset0, tile0.rot);

		const tile1 = this.tiles[1];
		const offset1 = tile1.shape.polyPnts[0];
		const rOffset1 = vec2.create();
		vec2.rot(rOffset1, offset1, tile1.rot);

		vec2.add(tile0.pos, tile1.pos, rOffset1);
		vec2.add(tile0.pos, tile0.pos, rOffset0);
		tile0.rot = tile1.rot + degToRad(180 + 36);
		tile0.updateWorldPoly();
	}

	#loadTiles(slot, starterTiles) {
		this.tiles = [];
		const penTilesStr = localStorage.getItem(slot);
		let penTilesObj = [];
		if (penTilesStr) {
			penTilesObj = JSON.parse(penTilesStr);
		}
		if (penTilesObj.length) {
			console.log("loading " + penTilesObj.length + " tiles on slot " + slot);
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
					console.error("unknown tile kind " + penTileObj.kind);
					break;
				}
				const pos = vec2.clone(penTileObj.pos);
				const rot = penTileObj.rot;
				this.tiles.push(new Tile(kind, pos, rot));
			}
		} else if (starterTiles) {
			this.tiles.push(new Tile(SkinnyShape, [0, 2], 0));
			this.tiles.push(new Tile(FatShape, [2, 2], 0));
			console.log("creating " + this.tiles.length + " starter tiles");
		}
		this.editTiles = new EditTiles(this.tiles);
		this.dirty = true;
	}

	#saveTiles(slot) {
		console.log("saving " + this.tiles.length + " tiles on slot " + slot);
		localStorage.setItem(slot, JSON.stringify(this.tiles));
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.snapMode = true;
		this.drawArcs = true;
		this.drawNotches = true;
		this.drawIds = true;
		this.redBarWidth = .25; // for add remove tiles
		// Penrose tiles
		this.protoTiles = [];
		// let proc position them proto tiles with zoom and pan UI
		this.protoTiles.push(new Tile(SkinnyShape, [0, 0], 0));
		this.protoTiles.push(new Tile(FatShape, [0, 0], 0));
		this.#loadTiles("penTiles", true);
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
		this.startZoom = .35;
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

		makeEle(this.vp, "span", null, "marg", "Draw Center Ids");
		this.eles.drawIds = makeEle(this.vp, "input", "draw ids", null, "ho", (val) => {
			this.drawIds = val;
			this.dirty = true;
		}, "checkbox");
		this.eles.drawIds.checked = this.drawIds;

		makeEle(this.vp, "br");
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "'Del' key to delete hilited tiles");
		// clear tiles
		makeEle(this.vp, "button", null, null, "Clear all tiles",this.#clearTiles.bind(this));
		// load save slots
		makeEle(this.vp, "br");
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, "short", "Load 1",this.#loadTiles.bind(this, "slot1", false));
		makeEle(this.vp, "button", null, "short", "Save 1",this.#saveTiles.bind(this, "slot1"));
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, "short", "Load 2",this.#loadTiles.bind(this, "slot2", false));
		makeEle(this.vp, "button", null, "short", "Save 2",this.#saveTiles.bind(this, "slot2"));
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, "short", "Load 3",this.#loadTiles.bind(this, "slot3", false));
		makeEle(this.vp, "button", null, "short", "Save 3",this.#saveTiles.bind(this, "slot3"));
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, "short", "Load 4",this.#loadTiles.bind(this, "slot4", false));
		makeEle(this.vp, "button", null, "short", "Save 4",this.#saveTiles.bind(this, "slot4"));
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, "short", "Load 5",this.#loadTiles.bind(this, "slot5", false));
		makeEle(this.vp, "button", null, "short", "Save 5",this.#saveTiles.bind(this, "slot5"));
	}		

	// tiles and tile index
	#deselectFun(tiles, idx) {
		const tile = tiles[idx];
		if (this.snapMode) {
			tile.rot = snap(tile.rot, PenShape.smallAngle);
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
			this.editOptions.rotStep -= PenShape.smallAngle; // clockwise
			break;
		case keyCodes.LEFT:
			this.editOptions.rotStep += PenShape.smallAngle; // counter clockwise
			break;
		case keyCodes.DELETE:
			this.editTiles.deleteHilited();
			this.dirty = true;
			break;
		}

		// remove tiles if deselected in the red area
		this.editOptions.delDeselect = this.plotter2d.ndcMouse[0] - this.plotter2d.ndcMin[0] < this.redBarWidth;
		this.dirty = this.editTiles.proc(this.input.mouse, this.plotter2d.userMouse
			, this.editOptions) 
			|| this.dirty;
		


		// test connect tiles
		if (this.tiles.length == 2) {
			this.#connectTiles();
		}

		this.dirty = this.editProtoTiles.proc(this.input.mouse, this.plotter2d.userMouse
			, this.editProtoOptions) 
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
			tile.updateWorldPoly();
		}
		// select and add a proto tile to the main tiles
		const protoSelected = this.editProtoTiles.getCurSelected()
		if (protoSelected >= 0) {
			this.editProtoTiles.deselect();
			const newTile = this.protoTiles[protoSelected].clone();
			this.editTiles.addTile(newTile, this.plotter2d.userMouse);
		}
	}

	#userDraw() {
		const options = {
			drawArcs: this.drawArcs,
			drawNotches: this.drawNotches,
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
