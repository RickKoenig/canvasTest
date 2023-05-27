'use strict';

class HatShape extends Shape {
	static snapAmount = degToRad(15);
	static hexInnerRad = .5;
	static hexOuterRad = this.hexInnerRad / Math.cos(degToRad(30));
	static debug = true;

	// a tiling of hexagons, 12 points 30 degrees
	static hexagonCoordCenter(i, j) {
		const ret = vec2.fromValues(
			  i * 2 * this.hexInnerRad * Math.cos(degToRad(30))
			, i * 2 * this.hexInnerRad * Math.sin(degToRad(30)) + j * 2 * this.hexInnerRad);
		return ret;
	}
	
	static hexagonCoord(i, j, ang = 0, doLong = false) {
		const centPos = this.hexagonCoordCenter(i, j);
		const curRad = doLong ? this.hexOuterRad : this.hexInnerRad;
		const offset = vec2.fromValues(
			curRad * Math.cos(ang)
			, curRad * Math.sin(ang));
		const ret = vec2.create();
		vec2.add(ret, centPos, offset);
		return ret;
	}

	static makeCmds(pnts) {
		const cmds = [];
		let first = true;
		for (let polyPnt of pnts) {
			const cmd = {
				pnt: polyPnt,
				kind: first ? "moveTo" : "lineTo"
			}
			first = false;
			cmds.push(cmd);
		}
		return cmds;
	}

	static setupPolyPnts(mir) {
		// 13 points
		this.polyPnts = [
			this.hexagonCoordCenter(0, 0), 			
			this.hexagonCoord(0, 0, degToRad(180 + 30), false),
			this.hexagonCoord(0, 0, degToRad(180), true),
			this.hexagonCoord(0, 0, degToRad(90 + 30), true),
			this.hexagonCoord(0, 0, degToRad(90), false),

			this.hexagonCoordCenter(0, 1),
			this.hexagonCoord(0, 1, degToRad(30), false),
			this.hexagonCoord(0, 1, degToRad(0), true),
			this.hexagonCoord(0, 1, degToRad(-30), false),
			this.hexagonCoordCenter(1, 0),

			this.hexagonCoord(1, 0, degToRad(270), false),
			this.hexagonCoord(0, 0, degToRad(0), true),
			this.hexagonCoord(0, 0, degToRad(0 - 30), false)
		];

		// 4 five sided convex polygons for inside and overlap tests
		const pnts0 = [
			this.hexagonCoordCenter(0, 0), 			
			this.hexagonCoord(0, 0, degToRad(180 + 30), false),
			this.hexagonCoord(0, 0, degToRad(180), true),
			this.hexagonCoord(0, 0, degToRad(90 + 30), true),
			this.hexagonCoord(0, 0, degToRad(90), false)
		];
		const pnts1 = [
			this.hexagonCoordCenter(0, 0),
			this.hexagonCoord(0, 0, degToRad(90), false),
			this.hexagonCoord(0, 0, degToRad(60), true),
			this.hexagonCoord(0, 0, degToRad(0), true),
			this.hexagonCoord(0, 0, degToRad(-30), false)
		];
		const pnts2 = [
			this.hexagonCoordCenter(1, 0),
			this.hexagonCoord(1, 0, degToRad(270), false),
			this.hexagonCoord(1, 0, degToRad(270 - 30), true),
			this.hexagonCoord(1, 0, degToRad(180), true),
			this.hexagonCoord(1, 0, degToRad(180 - 30), false)
		];
		const pnts3 = [
			this.hexagonCoordCenter(0, 1),
			this.hexagonCoord(0, 1, degToRad(30), false),
			this.hexagonCoord(0, 1, degToRad(0), true),
			this.hexagonCoord(0, 1, degToRad(-60), true),
			this.hexagonCoord(0, 1, degToRad(270), false)
		];
		this.convexPnts = [
			pnts0, pnts1, pnts2, pnts3
		];

		const numConvexPolys = this.convexPnts.length;
		const numConvexSides = pnts0.length;
		 // scratch for isInside()
		this.worldConvexInside = Array(numConvexSides);
		for (let i = 0; i < numConvexSides; ++i) {
			this.worldConvexInside[i] = vec2.create();
		}
		// scratch for overlap four sets of 5 points
		// in world coords for 2 hat tiles
		this.worldOverlapA = Array(numConvexPolys);
		this.worldOverlapB = Array(numConvexPolys);
		for (let i = 0; i < numConvexPolys; ++i) {
			const A = this.worldOverlapA[i] = Array(numConvexSides);
			const B = this.worldOverlapB[i] = Array(numConvexSides);
			for (let j = 0; j < numConvexSides; ++j) {
				A[j] = vec2.create();
				B[j] = vec2.create();
			}
		}

		this.nearRad = .45 * this.hexInnerRad; // easier overlap, number hand picked visually
		if (mir) {
			this.color = "#22f";
			// and flip the geometry
			// first flip the points in the X
			for (let i = 0; i < this.polyPnts.length; ++i) {
				this.polyPnts[i][0] *= -1;
			}
			// next reverse the array
			this.polyPnts.reverse();
		} else {
			this.color = "#282";
		}
		const centerOffset = super.setupPolyPnts();
		// adjust all the 4 pentagon convex polys
		for (let pnts of this.convexPnts) {
			for (let pnt of pnts) {
				if (mir) {
					pnt[0] *= -1;
				}
				vec2.sub(pnt, pnt, centerOffset);
			}
			if (mir) {
				pnts.reverse();
			}
		}

		// setup draw commands for faster drawing
		this.drawCmds = this.makeCmds(this.polyPnts);
		if (this.debug) {
			// draw one of four convex pentagons
			this.convexCmds = this.makeCmds(this.convexPnts[2]);
		}
	}

	// draw the outline of a tile
	static doPath(ctx, cmds) {
		ctx.beginPath();
        ctx.lineJoin = "round";
		this.runCmds(ctx, cmds);
		ctx.closePath();
	}

	static draw(drawPrim, id, doHilit = false, options, overlap = false) {
		const ctx = drawPrim.ctx;
		ctx.strokeStyle = overlap ? "red" : "black";
		const bounds = true; // clipping circles
		const edgeLabels = true;

		// fill the tile
		this.doPath(ctx, this.drawCmds);
		const col = this.color;
		let colAdjust = doHilit ? .3 : 0;
		const colHilit = Bitmap32.colorAdd(col, colAdjust);
		ctx.fillStyle = colHilit;
		ctx.fill();

		// outline the tile
		this.doPath(ctx, this.drawCmds);
		const lineWidth = .01;
		ctx.lineWidth = overlap ? lineWidth * 3 : lineWidth;
		ctx.stroke();

		if (this.debug) {
			// draw some convex five sided polys
			ctx.strokeStyle = "cyan";
			this.doPath(ctx, this.convexCmds);
			ctx.lineWidth = .02;
			ctx.stroke();

			// debugging stuff
			if (bounds) {
				drawPrim.drawArcO([0, 0], this.nearRad, lineWidth, degToRad(0), degToRad(360), "white");
				drawPrim.drawArcO([0, 0], this.boundRadius, lineWidth, degToRad(0), degToRad(360), "blue");
			}
			if (edgeLabels) {
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(this.nearRad, 0); // reference angle
				ctx.strokeStyle = "pink";
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
	}

	// horizontal level text
	static drawLevel(drawPrim, id, edgeHilit = false) {
		const radius = .025;
		drawPrim.drawCircle([0,0], radius, edgeHilit ? "yellow" : "brown"); // center
		const size = radius * 2;
		drawPrim.drawText([0, 0], [size, size], id, edgeHilit ? "black" : "white");
	}
}

// shape 1
class OrigHatShape extends HatShape {
	static setupPolyPnts() {
		super.setupPolyPnts(false); // default
	}
	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "hatOrig";
	}
}

// shape 2
class MirrorHatShape extends HatShape {
	static setupPolyPnts() {
		super.setupPolyPnts(true); // mirror
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "hatMirror";
	}
}

HatShape.factory = {
	hatOrig: OrigHatShape,
	hatMirror: MirrorHatShape
}

class HatTile extends Tile {
	// TODO: can this be used from the base class
	clone() {
		const ret = new HatTile(this.shape, this.pos, this.rot);
		return ret;
	}

	isInside(userMouse) {
		const br = this.shape.boundRadius;
		const sd = vec2.sqrDist(userMouse, this.pos);
		if (sd > br * br) {
			return false; // early out
		}
		// see if inside one of four 5 sided convex polys
		const thresh = -.01;
		for (let convexPoly of this.shape.convexPnts) {
			for (let i = 0; i < convexPoly.length; ++i) {
				const pntO = convexPoly[i];
				const pntW = this.shape.worldConvexInside[i]; // reference
				vec2.rot(pntW, pntO, this.rot);
				vec2.add(pntW, pntW, this.pos);
			}
			const pen = penetrateConvexPoly(this.shape.worldConvexInside, userMouse);
			if (pen > thresh) {
				return true;
			}
		}
		return false;
	}

	isOverlap(tileB, thresh = .01) {
		const tileA = this;
		if (tileA === tileB) {
			return false; // can't overlap over self
		}
		const td = vec2.sqrDist(tileA.pos, tileB.pos);
		if (td < tileA.shape.nearRad * tileA.shape.nearRad) {
			return true; // early in
		}
		if (!calcIntsectBoundcircle(tileA.shape.boundRadius, tileA.pos
				, tileB.shape.boundRadius, tileB.pos)) {
			return false; // early out
		}
		// move everything to world coords
		const numConvexPolys = tileA.shape.convexPnts.length;
		const pnts0 = tileA.shape.convexPnts[0];
		const numConvexSides = pnts0.length;
		for (let i = 0; i < numConvexPolys; ++i) {
			const Ao = tileA.shape.convexPnts[i];
			const Bo = tileB.shape.convexPnts[i];
			const Aw = tileA.shape.worldOverlapA[i];
			const Bw = tileB.shape.worldOverlapB[i];
			for (let j = 0; j < numConvexSides; ++j) {
				let pntO = Ao[j];
				let pntW = Aw[j]; // reference
				vec2.rot(pntW, pntO, tileA.rot);
				vec2.add(pntW, pntW, tileA.pos);
				pntO = Bo[j];
				pntW = Bw[j]; // reference
				vec2.rot(pntW, pntO, tileB.rot);
				vec2.add(pntW, pntW, tileB.pos);
			}
		}
		// check all convex polys
		for (let i = 0; i < numConvexPolys; ++i) {
			for (let j = 0; j < numConvexPolys; ++j) {
				const isectPoly = calcPolyIntsect(tileA.shape.worldOverlapA[i], tileB.shape.worldOverlapB[j]);
				const areaIsect = calcPolyArea(isectPoly);
				MainApp.areaIsect += areaIsect;
				if (MainApp.areaIsect > thresh) {
					return true;
				}
		
			}
		}
		// nothing
		return false;
	}
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static areaIsect = 0;
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
		addEventListener("beforeunload", this.#saveHatTiles.bind(this, "hatSlot0"));
	}

	#clearHatTiles() {
		this.tiles.length = 0;
		this.editTiles.deselect();
		this.input.setFocus(); // back to canvas/div
		this.dirty = true;
	}

	#clearHatDups() {
		console.log("clear hat dups, len = " + this.tiles.length);
		Tile.clearDups(this.tiles);
		const threshAng = degToRad(10);
		const closeDist = .125;
		this.editTiles.deselect();
		this.input.setFocus(); // back to canvas/div
		this.dirty = true;
	}

	// generate more tiles
	#deflateTiles() {
		console.log("deflate hat tiles");
	}

	#loadHatTiles(slot, starter) {
		this.tiles = HatTile.loadTiles(slot, HatShape.factory);
		if (starter && !this.tiles.length) {
			this.tiles.push(new HatTile(OrigHatShape, [0, 0], 0));
			this.tiles.push(new HatTile(MirrorHatShape, [2, 0], 0));
			console.log("creating " + this.tiles.length + " starter tiles");
		}
		this.editTiles = new EditTiles(this.tiles);
		if (this.input) {
			this.input.setFocus(); // back to canvas/div, input might not be ready
		}
		this.dirty = true;
	}

	#saveHatTiles(slot) {
		Tile.saveTiles(this.tiles, slot);
		if (this.input) {
			this.input.setFocus(); // back to canvas/div
		}
	}

	// tiles and tile index
	#deselectFun(tiles, idx) {
		const curTile = tiles[idx];
		if (this.snapAngle) {
			curTile.rot = snapNum(curTile.rot, HatShape.snapAmount);
			curTile.updateWorldPoly();
		}
		if (this.snapTile & this.tiles.length >= 2) {
			const info = Tile.findBestSnapTile(this.tiles, idx, this.snapTileThresh);
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
		this.snapTileThresh = .03;
		this.drawIds = true;
		this.redBarWidth = .25; // for add remove tiles
		// Hat tiles
		this.protoTiles = [];
		// let proc position those proto tiles with zoom and pan UI
		this.protoTiles.push(new HatTile(OrigHatShape, [0, 0], 0));
		this.protoTiles.push(new HatTile(MirrorHatShape, [0, 0], 0));
		this.#loadHatTiles("hatSlot0", true);
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
		this.startZoom = .3;
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
		// deflate tiles
		makeEle(this.vp, "br");
		makeEle(this.vp, "br");
		this.eles.decompose = makeEle(this.vp, "button", null, null, "Decompose tiles", this.#deflateTiles.bind(this));
		this.eles.decompose.disabled = true;
		// clear duplicates
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Clear Duplicates", this.#clearHatDups.bind(this));
		// clear tiles
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Clear all tiles", this.#clearHatTiles.bind(this));
		// load save slots
		makeEle(this.vp, "br");

		const numSlots = 5;
		for (let sn = 1; sn <= numSlots; ++sn) {
			makeEle(this.vp, "br");
			makeEle(this.vp, "button", null, "short", "Load " + sn
				, this.#loadHatTiles.bind(this, "hatSlot" + sn, false));
			makeEle(this.vp, "button", null, "short", "Save " + sn
				, this.#saveHatTiles.bind(this, "hatSlot" + sn));
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
			this.editOptions.rotStep -= HatShape.snapAmount; // clockwise
			break;
		case keyCodes.LEFT:
			this.editOptions.rotStep += HatShape.snapAmount; // counter clockwise
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
		MainApp.areaIsect = 0;
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
		infoStr += "\n areaIsect = " + MainApp.areaIsect.toFixed(2);
		const curSelIdx = this.editTiles.getCurSelected();
		if (curSelIdx >= 0) {
			infoStr += "\n Current selected = " + curSelIdx;
			const info = Tile.findBestSnapTile(this.tiles, curSelIdx, this.snapTileThresh);
			if (info) {
				infoStr += "\n mastertile = " + info.masterTileIdx
				infoStr += "\n masteredge = " + info.masterEdge
				infoStr += "\n slavetile = " + info.slaveTileIdx
				infoStr += "\n slaveedge = " + info.slaveEdge
				infoStr	+= "\nbestdist = " + info.bestDist2.toFixed(3);
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
