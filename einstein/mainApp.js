'use strict';

// TODO: just a square for now
class HatShape extends Shape {
	static ninetyAngle = degToRad(90);

	static setupPolyPnts(mir) {
		if (mir) {
			// oct
			const rad = 1 / (2 * Math.sin(degToRad(22.5)));
			this.polyPnts = [];
			for (let e = 0; e < 8; ++e) {
				const ang = degToRad(180 + 3 * 22.5) - e * degToRad(45) 
				const pnt = [rad * Math.cos(ang), rad * Math.sin(ang)];
				this.polyPnts.push(pnt);
			}
		} else {
			// square
			this.polyPnts = [
				[ -.75, -.75],
				[ -.5,  .5],
				[  .5,  .5],
				[  .5, -.5]
			];
		}
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
	static doPath(ctx) {
		ctx.beginPath();
        ctx.lineJoin = "round";
		this.runCmds(ctx, this.cmdsNoNotches);
		ctx.closePath();
	}

	static draw(drawPrim, id, doHilit = false, options, overlap = false) {
		const ctx = drawPrim.ctx;
		const bounds = false; // clipping circles
		// fill the tile
		this.doPath(ctx);
		const col = "#008000";
		let colAdjust = doHilit ? .3 : 0;
		const colHilit = Bitmap32.colorAdd(col, colAdjust);
		ctx.fillStyle = colHilit;
		ctx.fill();
		// outline the tile
		this.doPath(ctx);
		const lineWidth = .025;
		ctx.lineWidth = overlap ? lineWidth * 3 : lineWidth;
		ctx.strokeStyle = overlap ? "red" : "black";
		ctx.stroke();

		if (bounds) {
			drawPrim.drawArcO([0, 0], this.nearRad, lineWidth, degToRad(0), degToRad(360), "white");
			drawPrim.drawArcO([0, 0], this.boundRadius, lineWidth, degToRad(0), degToRad(360), "blue");
		}

		ctx.moveTo(0, 0);
		ctx.lineTo(7 / 16, 0); // reference angle
		ctx.stroke();

		for (let i = 0; i < this.polyPnts.length; ++i) {
			const p0 = this.polyPnts[i];
			const p1 = this.polyPnts[(i + 1) % this.polyPnts.length];
			const avg = vec2.create();
			vec2.add(avg, p0, p1);
			const closer = .875;
			vec2.scale(avg, avg, .5 * closer); // move in closer
			ctx.save();
			ctx.translate(avg[0], avg[1]);
			this.drawLevel(drawPrim, i, true);
			ctx.restore();
		}
/*
		ctx.save();
		ctx.translate(-.375, 0);
		this.drawLevel(drawPrim, "0", true);
		ctx.restore();
		ctx.save();
		ctx.translate(0, .375);
		this.drawLevel(drawPrim, "1", true);
		ctx.restore();
		ctx.save();
		ctx.translate(.375, 0);
		this.drawLevel(drawPrim, "2", true);
		ctx.restore();
		ctx.save();
		ctx.translate(0, -.375);
		this.drawLevel(drawPrim, "3", true);
		ctx.restore();
*/
	}

	// horizontal level text
	static drawLevel(drawPrim, id, edgeHilit = false) {
		const radius = .075;
		drawPrim.drawCircle([0,0], radius, edgeHilit ? "yellow" : "brown"); // center
		const size = radius * 2;
		drawPrim.drawText([0, 0], [size, size], id, edgeHilit ? "black" : "white");
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "hat"; // generic
		this.nearRad = .45; // easier overlap
	}
}

// shape 1
class OrigHatShape extends HatShape {
	static setupPolyPnts() {
		super.setupPolyPnts(false); // default
	}

	static draw(drawPrim, id, doHilit = false, options, overlap) {
		super.draw(drawPrim, id, doHilit, options, overlap);
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

	static draw(drawPrim, id, doHilit = false, options, overlap) {
		super.draw(drawPrim, id, doHilit, options, overlap);
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "hatMirror";
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
		addEventListener("beforeunload", this.#saveTiles.bind(this, "hatSlot0"));
	}

	#clearTiles() {
		this.input.setFocus(); // back to canvas/div
		this.tiles.length = 0;
		this.editTiles.deselect();
		this.dirty = true;
	}

	// TODO: move to edit tiles
	#clearDups() {
		console.log("clear dups, len = " + this.tiles.length);

		this.input.setFocus(); // back to canvas/div

		// TODO: optimize, go from N^2 to N*log(n)

		const threshAng = degToRad(10);
		const closeDist = .125;

		for (let i = 0; i < this.tiles.length;) { // inc i only when not deleting
			const ti1 = this.tiles[i];
			let j;
			for (j = i + 1; j < this.tiles.length; ++j) {
				const ti2 = this.tiles[j];
				let ra = Math.abs(ti1.rot - ti2.rot);
				ra = normAngRadUnsigned(ra);
				if (ti1.kind === ti2.kind
					&& ra < threshAng 
					&& vec2.sqrDist(ti1.pos, ti2.pos) < closeDist * closeDist) {
					break;
				}
			}
			if (j != this.tiles.length) {
				this.tiles.splice(i, 1);
			} else {
				++i;
			}
		}
	
		this.editTiles.deselect();
		this.dirty = true;
	}

	// generate more tiles
	
	#deflateTiles() {
		console.log("deflate hat tiles");
	}
	

	// find best connection between tiles or null if none
	#findBestSnapTile(curSelIdx) {
		const curTile = this.tiles[curSelIdx]; //slave
		let bestTileIdx = -1;
		let bestSlaveEdge;
		let bestMasterEdge;
		const snapDistThresh = .3;
		let bestDist2 = snapDistThresh; // must be less than this for a snap
		for (let m = 0; m < this.tiles.length; ++m) {
			if (m === curSelIdx) {
				continue; // skip self
			}
			const tile = this.tiles[m]; // master
			const distPoints2 = vec2.sqrDist(curTile.pos, tile.pos);
			let distRad2 = curTile.shape.boundRadius + tile.shape.boundRadius;
			distRad2 *= distRad2;
			// do the best
			if (distPoints2 < distRad2) {
				// run through all the edge fits
				// match arcs and notches edges
				// [slave, master]
				// TODO: for now do all combinations of edge edge
				let edgeEdgeList;
				const allEdges = false;
				if (allEdges) {
					// everything
					edgeEdgeList = [ // slave master
						[0, 0], [1, 0], [2, 0], [3, 0],
						[0, 1],	[1, 1],	[2, 1],	[3, 1],
						[0, 2],	[1, 2],	[2, 2],	[3, 2],
						[0, 3],	[1, 3],	[2, 3],	[3, 3]
					];
				} else {
					// somethings
					edgeEdgeList = [ // slave master
						[0, 0], [1, 1], [2, 2], [3, 3]
					];
				}
				for (let ee of edgeEdgeList) {
					const se = ee[0];
					const me = ee[1];
					const connectDist = this.#calcConnectDist(tile, me
						, curTile, se); // master, slave
					if (connectDist < bestDist2) {
						bestDist2 = connectDist;
						bestTileIdx = m;
						bestSlaveEdge = se;
						bestMasterEdge = me;
					}
				}
			}
			// end do the best
		}
		if (bestTileIdx >= 0) {
			const ret = {
				masterTileIdx : bestTileIdx,
				masterEdge : bestMasterEdge,
				slaveTileIdx : curSelIdx,
				slaveEdge : bestSlaveEdge,
				bestDist2: bestDist2
			}
			return ret;
		}
		return null;
	}

	// snap one tile next to another
	#connectTiles(master, masterEdge, slave, slaveEdge) {
		//return;
		const angs = [HatShape.ninetyAngle, 0, -HatShape.ninetyAngle, Math.PI];
		const rOffset0 = vec2.create();
		const totOffset = vec2.create();
		// meet up at 180 degrees
		const ang = angs[masterEdge] - angs[slaveEdge] + degToRad(180);
		const pidx0 = (slaveEdge + 1) % 4; // edge going in opposite direction
		const pidx1 = masterEdge;
		const offset1 = master.shape.polyPnts[pidx1];
		const offset0 = slave.shape.polyPnts[pidx0];
		vec2.rot(rOffset0, offset0, ang);
		vec2.sub(totOffset, offset1, rOffset0);
		vec2.rot(totOffset, totOffset, master.rot);
		vec2.scale(totOffset, totOffset, this.gapTiles); // make a gap
		vec2.add(slave.pos, master.pos, totOffset);
		slave.rot = normAngRadSigned(master.rot + ang);
		slave.updateWorldPoly();
	}

	// TODO: move to edit tiles
	#calcConnectDist(master, masterEdge, slave, slaveEdge) { // master, slave
		const d0 = vec2.sqrDist(master.worldPolyPnts[masterEdge]
			, slave.worldPolyPnts[(slaveEdge + 1) % slave.shape.polyPnts.length])
		const d1 = vec2.sqrDist(master.worldPolyPnts[(masterEdge + 1) % master.shape.polyPnts.length]
			, slave.worldPolyPnts[slaveEdge])
		return d0 + d1;
	}

	// TODO: move to edit tiles
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
				case 'hatOrig':
					kind = OrigHatShape;
					break;
				case 'hatMirror':
					kind = MirrorHatShape;
					break;
				default:
					console.error("unknown tile kind " + penTileObj.kind);
					continue;
				}
				const pos = vec2.clone(penTileObj.pos);
				const rot = penTileObj.rot;
				this.tiles.push(new Tile(kind, pos, rot));
			}
		} else if (starterTiles) {
			this.tiles.push(new Tile(OrigHatShape, [0, 0], 0));
			this.tiles.push(new Tile(MirrorHatShape, [2, 0], degToRad(22.5)));
			console.log("creating " + this.tiles.length + " starter tiles");
		}
		this.editTiles = new EditTiles(this.tiles);
		this.dirty = true;
	}

	// TODO: move to edit tiles
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

		this.gapTiles = 1.0001; // > 1, then a gap between tiles
		this.snapAngle = true;
		this.snapTile = true;
		this.drawArcs = true;
		this.drawNotches = true;
		this.drawIds = true;
		this.redBarWidth = .25; // for add remove tiles
		// Penrose tiles
		this.protoTiles = [];
		// let proc position them proto tiles with zoom and pan UI
		this.protoTiles.push(new Tile(OrigHatShape, [0, 0], 0));
		this.protoTiles.push(new Tile(MirrorHatShape, [0, 0], 0));
		this.#loadTiles("hatSlot0", true);
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
		this.eles.decompose = makeEle(this.vp, "button", null, null, "Decompose tiles", this.#deflateTiles.bind(this));
		this.eles.decompose.disabled = true;
		// clear duplicates
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Clear Duplicates", this.#clearDups.bind(this));
		// clear tiles
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Clear all tiles", this.#clearTiles.bind(this));
		// load save slots
		makeEle(this.vp, "br");
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, "short", "Load 1", this.#loadTiles.bind(this, "hatSlot1", false));
		makeEle(this.vp, "button", null, "short", "Save 1", this.#saveTiles.bind(this, "hatSlot1"));
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, "short", "Load 2", this.#loadTiles.bind(this, "hatSlot2", false));
		makeEle(this.vp, "button", null, "short", "Save 2", this.#saveTiles.bind(this, "hatSlot2"));
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, "short", "Load 3", this.#loadTiles.bind(this, "hatSlot3", false));
		makeEle(this.vp, "button", null, "short", "Save 3", this.#saveTiles.bind(this, "hatSlot3"));
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, "short", "Load 4", this.#loadTiles.bind(this, "hatSlot4", false));
		makeEle(this.vp, "button", null, "short", "Save 4", this.#saveTiles.bind(this, "hatSlot4"));
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, "short", "Load 5", this.#loadTiles.bind(this, "hatSlot5", false));
		makeEle(this.vp, "button", null, "short", "Save 5", this.#saveTiles.bind(this, "hatSlot5"));
	}		

	// tiles and tile index
	#deselectFun(tiles, idx) {
		const curTile = tiles[idx];
		if (this.snapAngle) {
			curTile.rot = snap(curTile.rot, HatShape.ninetyAngle * .25);
			curTile.updateWorldPoly();
		}
		if (this.snapTile & this.tiles.length >= 2) {
			const info = this.#findBestSnapTile(idx);
			if  (info) {
				this.#connectTiles(this.tiles[info.masterTileIdx], info.masterEdge
					, this.tiles[info.slaveTileIdx], info.slaveEdge); // master, slave, master, slave
			}
		}
		this.editTiles.deselect();
		this.dirty = true;
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
			this.editOptions.rotStep -= HatShape.ninetyAngle * .125; // clockwise
			break;
		case keyCodes.LEFT:
			this.editOptions.rotStep += HatShape.ninetyAngle * .125; // counter clockwise
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
		infoStr += "\n Shift = " + this.input.keyboard.keystate[keyCodes.SHIFT];
		const curSelIdx = this.editTiles.getCurSelected();
		if (curSelIdx >= 0) {
			infoStr += "\n Current selected = " + curSelIdx;
			const info = this.#findBestSnapTile(curSelIdx);
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
