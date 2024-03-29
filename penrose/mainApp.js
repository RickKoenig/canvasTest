'use strict';

class PenShape extends Shape {
	static smallAngle = degToRad(36);
	static largeAngle = this.smallAngle * 2;
	static golden = (Math.sqrt(5) + 1) / 2;
	static invGolden = 1 / this.golden;

	static setupPolyPnts(ang) {
		// rhombus
		const sa = Math.sin(ang);
		const ca = Math.cos(ang);
		this.polyPnts = [
			[0, 0],
			[ca, sa],
			[1 + ca, sa],
			[1, 0]
		];
		super.setupPolyPnts();
		// swap in and out for slave, (notch in 'fits' notch out)
		this.notchEnum = makeEnum(["TRI_IN", "TRI_OUT", "ARC_IN", "ARC_OUT"]);
		// setup draw commands for faster drawing
		this.cmdsNoNotches = this.makeCmds(this.polyPnts);
		// prep notch commands
		this.cmdsNotches = [];
		this.smallDist = 1 / 3;
		this.largeDist = 2 / 3;
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

	// fat is for colors and arcs
	static draw(drawPrim, id, doHilit = false, fat, options, overlap = false) {
		const ctx = drawPrim.ctx;
		const zoomHilit = false;
		const bounds = false; // clipping circles
		if (doHilit && zoomHilit) {
			ctx.save();
			ctx.scale(PenShape.golden, PenShape.golden);
		}
		// fill the tile
		Tile.doPath(ctx, options.drawNotches ? this.cmdsNotches: this.cmdsNoNotches);
		const col = fat ? "#a08000" : "#008000";
		let colAdjust = doHilit ? .3 : 0;
		const colHilit = Bitmap32p.colorAdd(col, colAdjust);
		ctx.fillStyle = colHilit;
		ctx.fill();
		// draw arcs
		if (options.drawArcs) {
			const arcWidth = .075;
			const arcRad1 = .25;
			const arcRad2 = 1 - arcRad1;
			const col1 = "#2040ff";   // a blue
			const col2 = "indianred"; // a red
			const col1Hilit = Bitmap32p.colorAdd(col1, colAdjust);
			const col2Hilit = Bitmap32p.colorAdd(col2, colAdjust);
			if (fat) {
				drawPrim.drawArcO(this.polyPnts[0], arcRad1, arcWidth, degToRad(0), degToRad(72), col1Hilit);
				drawPrim.drawArcO(this.polyPnts[2], arcRad2, arcWidth, degToRad(180), degToRad(180 + 72), col2Hilit);
			} else {
				drawPrim.drawArcO(this.polyPnts[1], arcRad1, arcWidth, degToRad(180 + 36), degToRad(0), col1Hilit);
				drawPrim.drawArcO(this.polyPnts[3], arcRad1, arcWidth, degToRad(36), degToRad(180 ), col2Hilit);
			}
		}
		// outline the tile
		Tile.doPath(ctx, options.drawNotches ? this.cmdsNotches: this.cmdsNoNotches);
		const lineWidth = .025;
		ctx.lineWidth = overlap ? lineWidth * 3 : lineWidth;
		ctx.strokeStyle = overlap ? "red" : "black";
		ctx.stroke();

		if (bounds) {
			drawPrim.drawArcO([0, 0], this.nearRad, lineWidth, degToRad(0), degToRad(360), "white");
			drawPrim.drawArcO([0, 0], this.boundRadius, lineWidth, degToRad(0), degToRad(360), "blue");
		}
		if (doHilit && zoomHilit) {
			ctx.restore();
		}
	}

	// horizontal level text
	static drawLevel(drawPrim, id) {
		const radius = .075;
		drawPrim.drawCircle([0,0], radius, "brown"); // center
		const size = radius * 2;
		drawPrim.drawText([0, 0], [size, size], id, "white");
	}
}

// shape 1
class SkinnyShape extends PenShape {
	static setupPolyPnts() {
		super.setupPolyPnts(this.smallAngle); // make a skinny rhombus
		
		const ne = this.notchEnum;
		this.masterNotches = [ne.TRI_OUT, ne.TRI_IN, ne.ARC_OUT, ne.ARC_IN];
		// swap slave notches in and out for edge matcher
		this.slaveNotches = [ne.TRI_IN, ne.TRI_OUT, ne.ARC_IN, ne.ARC_OUT];
	}

	static draw(drawPrim, id, doHilit = false, options, overlap) {
		super.draw(drawPrim, id, doHilit, false, options, overlap);
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.nearRad = .25; // easier overlap
		this.kind = "skinny"; // serialization

		// build notches for skinny shape
		let pnt = vec2.create();
		let cmd = {
			pnt: this.polyPnts[0],
			kind: "moveTo"
		}
		this.cmdsNotches.push(cmd);

		vec2.lerp(pnt, this.polyPnts[0], this.polyPnts[1], this.smallDist);
		this.addTriNotchCmd(this.cmdsNotches, pnt, degToRad(36), true);

		cmd = {
			pnt: this.polyPnts[1],
			kind: "lineTo"
		}
		this.cmdsNotches.push(cmd);

		pnt = vec2.create();
		vec2.lerp(pnt, this.polyPnts[1], this.polyPnts[2], this.largeDist);
		this.addTriNotchCmd(this.cmdsNotches, pnt, degToRad(0), false);

		cmd = {
			pnt: this.polyPnts[2],
			kind: "lineTo"
		}
		this.cmdsNotches.push(cmd);

		pnt = vec2.create();
		vec2.lerp(pnt, this.polyPnts[2], this.polyPnts[3], this.smallDist);
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
		vec2.lerp(pnt, this.polyPnts[3], this.polyPnts[0], this.largeDist);
		cmd = {
			pnt: pnt,
			kind: "arc",
			ang: degToRad(90),
			ccw: false
		}
		this.cmdsNotches.push(cmd);
	}
}

// shape 2
class FatShape extends PenShape {
	static setupPolyPnts() {
		super.setupPolyPnts(this.smallAngle * 2); // make a fat rhombus

		const ne = this.notchEnum;
		this.masterNotches = [ne.TRI_IN, ne.ARC_IN, ne.ARC_OUT, ne.TRI_OUT];
		// swap slave notches in and out for edge matcher
		this.slaveNotches = [ne.TRI_OUT, ne.ARC_OUT, ne.ARC_IN, ne.TRI_IN];
	}

	static draw(drawPrim, id, doHilit = false, options, overlap) {
		super.draw(drawPrim, id, doHilit, true, options, overlap);
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		
		this.nearRad = .45; // easier overlap
		this.kind = "fat"; // for serialization

		// build notches for fat shape
		let pnt = vec2.create();
		let cmd = {
			pnt: this.polyPnts[0],
			kind: "moveTo"
		}
		this.cmdsNotches.push(cmd);

		vec2.lerp(pnt, this.polyPnts[0], this.polyPnts[1], this.largeDist);
		this.addTriNotchCmd(this.cmdsNotches, pnt, degToRad(72), false);

		cmd = {
			pnt: this.polyPnts[1],
			kind: "lineTo"
		}
		this.cmdsNotches.push(cmd);

		pnt = vec2.create();
		vec2.lerp(pnt, this.polyPnts[1], this.polyPnts[2], this.largeDist);
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
		vec2.lerp(pnt, this.polyPnts[2], this.polyPnts[3], this.smallDist);
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
		vec2.lerp(pnt, this.polyPnts[3], this.polyPnts[0], this.smallDist);
		this.addTriNotchCmd(this.cmdsNotches, pnt, degToRad(180), true);
	}
}

PenShape.factory = {
	skinny: SkinnyShape,
	fat: FatShape
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return this.numInstances;
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

		// auto save
		addEventListener("beforeunload", this.#savePenTiles.bind(this, "penSlot0"));
	}

	#clearPenTiles() {
		this.tiles.length = 0;
		this.editTiles.deselect();
		this.input.setFocus(); // back to canvas/div
		this.dirty = true;
	}

	#clearPenDups() {
		console.log("clear pen dups, len = " + this.tiles.length);
		Tile.clearDups(this.tiles);
		this.editTiles.deselect();
		this.input.setFocus(); // back to canvas/div
		this.dirty = true;
	}

	// generate more tiles
	#deflatePenTiles() {
		const spreadOnly = false;
		const zoomOut = true;
		console.log("deflate tiles, len = " + this.tiles.length);
		if (!this.tiles.length) {
			return; // nothing to do!
		}
		const golden = PenShape.golden;
		const invGolden = PenShape.invGolden;
		if (zoomOut) {
			this.plotter2d.setZoom(this.plotter2d.getZoom() / golden);
			this.plotter2d.transReset();
		}

		// center tiles
		const center = vec2.create();
		for (let tile of this.tiles) {
			vec2.add(center, center, tile.pos);
		}
		vec2.scale(center, center, 1 / this.tiles.length);
		for (let tile of this.tiles) {
			vec2.sub(tile.pos, tile.pos, center);
		}

		// move tiles apart 
		for (let tile of this.tiles) {
			vec2.scale(tile.pos, tile.pos, golden);
			// no need for updateWorldPoly since these tiles will be replaced	
			if (spreadOnly) {
				tile.updateWorldPoly();
			}
		}
		if (spreadOnly) {
			this.dirty = true;
			return;
		}

		// setup the geometry for the new generated tiles
		const smallAngle = PenShape.smallAngle;
		const newTiles = [];
		const oxs = FatShape.polyPnts[0][0] + golden * SkinnyShape.polyPnts[2][0];
		const oys = FatShape.polyPnts[0][1] + golden * SkinnyShape.polyPnts[2][1];
		const skinnyCommand = [
			{shape: FatShape, pos: [
				-oxs,
				-oys
			], rot: 0},

			{shape: SkinnyShape, pos: [
				0 + FatShape.polyPnts[2][0] - oxs,
				0 + FatShape.polyPnts[2][1] - 2 * FatShape.polyPnts[1][1] - oys
			], rot: -3 * smallAngle},

			{shape: SkinnyShape, pos: [
				0 + FatShape.polyPnts[2][0] + invGolden / 2 + invGolden / 2 * Math.cos(smallAngle) - oxs,
				0 + FatShape.polyPnts[2][1] - 2 * FatShape.polyPnts[1][1] + invGolden / 2 * Math.sin(smallAngle) - oys
			], rot: 3 * smallAngle},

			{shape: FatShape, pos: [
				0 + FatShape.polyPnts[2][0] + golden / 2 - oxs,
				0 + FatShape.polyPnts[2][1] - oys
			], rot: 4 * smallAngle},

			// original for reference
			/*{shape: SkinnyShape, pos: [
				0,
				0
			], rot: 0}*/
		];
		const r3 = vec2.create();
		vec2.rot(r3, FatShape.polyPnts[1], smallAngle);
		const oxf = (2 - invGolden) * FatShape.polyPnts[2][0];
		const oyf = (2 - invGolden) * FatShape.polyPnts[2][1];
		const fatCommand = [
			{shape: FatShape, pos: [
				FatShape.polyPnts[2][0] * 2 - oxf,
				FatShape.polyPnts[2][1] * 2 - oyf,
			], rot: 5 * smallAngle},
			{shape: FatShape, pos: [
				FatShape.polyPnts[2][0] - oxf,
				FatShape.polyPnts[2][1] - Math.sin(smallAngle) - oyf		
			], rot: 4 * smallAngle},

			{shape: FatShape, pos: [
				FatShape.polyPnts[2][0] + r3[0] - oxf,
				FatShape.polyPnts[2][1] + r3[1] - oyf
			], rot: 6 * smallAngle},
			
			{shape: SkinnyShape, pos: [
				FatShape.polyPnts[2][0] + SkinnyShape.polyPnts[2][0] - oxf,
				FatShape.polyPnts[2][1] - SkinnyShape.polyPnts[2][1] - oyf
			], rot: 4 * smallAngle},

			{shape: SkinnyShape, pos: [
				FatShape.polyPnts[2][0] - oxf,
				FatShape.polyPnts[2][1] + FatShape.polyPnts[1][1] * 2 - oyf
			], rot: 2 * smallAngle},

			// original for reference
			/*{shape: FatShape, pos: [
				0,
				0
			], rot: 0}*/
		];
		for (let tile of this.tiles) {
			const rot = tile.rot;
			const pos = vec2.clone(tile.pos);
			const penCommand = tile.kind === "skinny" ? skinnyCommand : fatCommand;
			for (let com of penCommand) {
				const comRot = com.rot;
				const comPos = vec2.clone(com.pos);
				vec2.rot(comPos, comPos, rot);
				vec2.add(comPos, comPos, pos);
				let newTile = new Tile(com.shape, comPos, normAngRadSigned(rot + comRot));
				newTiles.push(newTile);
			}
		}
		this.tiles = newTiles;
		this.editTiles = new EditTiles(this.tiles);
		this.#clearPenDups();
	}
	
	#loadPenTiles(slot, starter) {
		this.tiles = Tile.loadTiles(slot, PenShape.factory);
		if (starter && !this.tiles.length) {
			this.tiles.push(new Tile(SkinnyShape, [0, 0], 0));
			this.tiles.push(new Tile(FatShape, [2, 0], 0));
			console.log("creating " + this.tiles.length + " starter tiles");
		}
		this.editTiles = new EditTiles(this.tiles);
		if (this.input) {
			this.input.setFocus(); // back to canvas/div, input might not be ready
		}
		this.dirty = true;
	}

	#savePenTiles(slot) {
		Tile.saveTiles(this.tiles, slot);
		if (this.input) {
			this.input.setFocus(); // back to canvas/div
		}
	}

	// tiles and tile index
	#deselectFun(tiles, idx) {
		const curTile = tiles[idx];
		if (this.snapAngle) {
			curTile.rot = snapNum(curTile.rot, PenShape.smallAngle * .5);
			curTile.updateWorldPoly();
		}
		if (this.snapTile & this.tiles.length >= 2) {
			const info = Tile.findBestSnapTile(this.tiles, idx);
			if  (info) {
				// master, slave, master, slave, and has edge angles
				Tile.connectTiles(this.tiles[info.masterTileIdx], info.masterEdge
					, this.tiles[info.slaveTileIdx], info.slaveEdge); 
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
		this.drawArcs = true;
		this.drawNotches = true;
		this.drawIds = false;
		this.redBarWidth = .25; // for add remove tiles
		// Penrose tiles
		this.protoTiles = [];
		// let proc position those proto tiles with zoom and pan UI
		this.protoTiles.push(new Tile(SkinnyShape, [0, 0], 0));
		this.protoTiles.push(new Tile(FatShape, [0, 0], 0));
		this.#loadPenTiles("penSlot0", true);
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
		makeEle(this.vp, "span", null, "marg", "'Shift' key to clone select");
		// deflate tiles
		makeEle(this.vp, "br");
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Decompose tiles", this.#deflatePenTiles.bind(this));
		// clear duplicates
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Clear Duplicates", this.#clearPenDups.bind(this));
		// clear tiles
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Clear all tiles", this.#clearPenTiles.bind(this));
		// load save slots
		makeEle(this.vp, "br");
		const numSlots = 5;
		for (let sn = 1; sn <= numSlots; ++sn) {
			makeEle(this.vp, "br");
			makeEle(this.vp, "button", null, "short", "Load " + sn
				, this.#loadPenTiles.bind(this, "penSlot" + sn, false));
			makeEle(this.vp, "button", null, "short", "Save " + sn
				, this.#savePenTiles.bind(this, "penSlot" + sn));
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
			this.editOptions.rotStep -= PenShape.smallAngle * .5; // clockwise
			break;
		case keyCodes.LEFT:
			this.editOptions.rotStep += PenShape.smallAngle * .5; // counter clockwise
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
			this.editTiles.addTileSelect(newTile, this.plotter2d.userMouse);
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
		const keyCodes = keyTable.keyCodes;
		infoStr += "\n Shift = " + !!this.input.keyboard.keystate[keyCodes.SHIFT];

		const curSelIdx = this.editTiles.getCurSelected();
		if (curSelIdx >= 0) {
			infoStr += "\n Current selected = " + curSelIdx;
			const info = Tile.findBestSnapTile(this.tiles, curSelIdx);
			if (info) {
				infoStr += "\n master tile = " + info.masterTileIdx
				infoStr += "\n master edge = " + info.masterEdge
				infoStr += "\n slave tile = " + info.slaveTileIdx
				infoStr += "\n slave edge = " + info.slaveEdge
				infoStr += "\n notch id = " + info.notchId
				infoStr	+= "\nbest dist = " + info.bestDist2.toFixed(2);
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
