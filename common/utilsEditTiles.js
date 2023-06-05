'use strict';

// a generic poly tile, abstract, needs a draw and points
// static
class Shape {
	// called only once, center and TODO: calc N and D
	// polyPnts: array of points
	// rotFactor: for UI rotate object with drag mouse
	// boundRadius: smallest circle containing all points
	// area: area of poly
	// return offset of points to center them
	static setupPolyPnts() {
		// center points
		const avg = vec2.create();
		for (let pnt of this.polyPnts) {
			vec2.add(avg, avg, pnt);
		}
		vec2.scale(avg, avg, 1 / this.polyPnts.length);
		for (let pnt of this.polyPnts) {
			vec2.sub(pnt, pnt, avg);
		}
		let farDist2 = 0;
		for (let pnt of this.polyPnts) {
			const dist2 = vec2.squaredLength(pnt);
			if (dist2 > farDist2) {
				farDist2 = dist2;
			}
		}
		this.boundRadius = Math.sqrt(farDist2);
		this.rotFactor = 1.25 / farDist2; // (torque) That's it!, try a little more turn
		this.area = calcPolyArea(this.polyPnts);
		// edge angles
		const anEdge = vec2.create();
		this.edgeAngles = Array(this.polyPnts.length);
		for (let i = 0; i < this.polyPnts.length; ++i) {
			let j = (i + 1) % this.polyPnts.length;
			vec2.sub(anEdge, this.polyPnts[j], this.polyPnts[i]);
			const ang = Math.atan2(anEdge[1], anEdge[0]);
			this.edgeAngles[i] = ang;
		}
		return avg;
	}


	// make commands for simple polys, (no arcs or notches)
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
				break;
			}
		}
	}
}

// has a Shape, not static
class Tile {
	constructor(shape, pos, rot) {
		this.shape = shape;
		this.pos = vec2.clone(pos);
		this.rot = normAngRadSigned(rot);
		this.kind = shape.kind; // string for serialization
		this.createWorldPoly();
		this.updateWorldPoly();
	}

	static loadTiles(slot, factory) {
		const tiles = [];
		const penTilesStr = localStorage.getItem(slot);
		let penTilesObj = [];
		if (penTilesStr) {
			penTilesObj = JSON.parse(penTilesStr);
		}
		if (penTilesObj.length) {
			console.log("loading " + penTilesObj.length + " tiles on slot " + slot);
			for (let penTileObj of penTilesObj) {
				const kind = penTileObj.kind; // name of object
				const shapeObj = factory[kind]; // object itself
				if (!shapeObj) { // skip unrecognized shapes
					console.error("unknown tile kind " + kind);
					continue;
				}
				const pos = vec2.clone(penTileObj.pos);
				const rot = penTileObj.rot;
				const colorIdx = penTileObj.colorIdx !== undefined ? penTileObj.colorIdx : 0; // only used on hat tiles
				tiles.push(new this(shapeObj, pos, rot, colorIdx)); // WOW, 'new this' create the callers class
			}
		}
		return tiles;
	}

	static saveTiles(tiles, slot) {
		console.log("saving " + tiles.length + " tiles on slot " + slot);
		localStorage.setItem(slot, JSON.stringify(tiles));
	}

	createWorldPoly() {
		this.worldPolyPnts = Array(this.shape.polyPnts.length);
		for (let i = 0; i < this.shape.polyPnts.length; ++i) {
			this.worldPolyPnts[i] = vec2.create();
		}
	}

	updateWorldPoly() {
		for (let i = 0; i < this.worldPolyPnts.length; ++i) {
			const pntO = this.shape.polyPnts[i];
			const pntW = this.worldPolyPnts[i]; // reference
			vec2.rot(pntW, pntO, this.rot);
			vec2.add(pntW, pntW, this.pos);
		}
	}

	clone() {
		const ret = new Tile(this.shape, this.pos, this.rot);
		return ret;
	}

	// draw the outline of a tile
	static doPath(ctx, cmds) {
		ctx.beginPath();
        ctx.lineJoin = "round";
		Shape.runCmds(ctx, cmds);
		ctx.closePath();
	}

	draw(drawPrim, id, doHilit = false, options = null, overlap = false) {
		const ctx = drawPrim.ctx;
		ctx.save();
		ctx.translate(this.pos[0], this.pos[1]);
		if (this.shape.draw) {
			ctx.save(); // keep font level
			ctx.rotate(this.rot);
			this.shape.draw(drawPrim, id, doHilit, options, overlap);
			ctx.restore();
		}
		// draw ids when no options
		if (this.shape.drawLevel && (!options || options.drawIds)) {
			this.shape.drawLevel(drawPrim, id);
		}
		ctx.restore();
	}

	isInside(userMouse) {
		const br = this.shape.boundRadius;
		const sd = vec2.sqrDist(userMouse, this.pos);
		if (sd > br * br) {
			return false; // early out
		}
		return penetrateConvexPoly(this.worldPolyPnts, userMouse) > 0;
	}	

	static doIsectTiles(tileA, tileB) {
		return calcPolyIntsectBoundcircle(tileA.worldPolyPnts, tileA.shape.boundRadius, tileA.pos
			, tileB.worldPolyPnts, tileB.shape.boundRadius, tileB.pos);
	}

	isOverlap(tileB, thresh = .01) {
		const tileA = this;
		if (tileA === tileB) {
			return false; // can't overlap over self
		} 
		const justCircleBounds = false; // false for proper overlap operation
		if (justCircleBounds) {
			// just check circle boundaries
			return calcIntsectBoundcircle(tileA.shape.boundRadius, tileA.pos
				, tileB.shape.boundRadius, tileB.pos);
		} else {
			// proper way
			const isectPoly = calcPolyIntsectBoundcircle(tileA.worldPolyPnts, tileA.shape.boundRadius, tileA.pos
				, tileB.worldPolyPnts, tileB.shape.boundRadius, tileB.pos);
			const areaIsect = calcPolyArea(isectPoly);
			const totalArea = tileA.shape.area + tileB.shape.area;
			return areaIsect > thresh * totalArea;
		}
	}

	static calcConnectDist(master, masterEdge, slave, slaveEdge) { // master, slave
		const d0 = vec2.sqrDist(master.worldPolyPnts[masterEdge]
			, slave.worldPolyPnts[(slaveEdge + 1) % slave.shape.polyPnts.length])
		const d1 = vec2.sqrDist(master.worldPolyPnts[(masterEdge + 1) % master.shape.polyPnts.length]
			, slave.worldPolyPnts[slaveEdge])
		return d0 + d1;
	}

	// snap one tile next to another
	static connectTiles(master, masterEdge, slave, slaveEdge) {
		const gapTiles = 1.0001; // > 1, then a gap between tiles
		const rOffset0 = vec2.create();
		const totOffset = vec2.create();
		const angsSlave = slave.shape.edgeAngles;
		const angsMaster = master.shape.edgeAngles;

		// meet up at 180 degrees
		const ang = angsMaster[masterEdge] - angsSlave[slaveEdge] + Math.PI;
		const pidx0 = (slaveEdge + 1) % slave.shape.polyPnts.length; // edge going in opposite direction
		const pidx1 = masterEdge;
		const offset1 = master.shape.polyPnts[pidx1];
		const offset0 = slave.shape.polyPnts[pidx0];
		vec2.rot(rOffset0, offset0, ang);
		vec2.sub(totOffset, offset1, rOffset0);
		vec2.rot(totOffset, totOffset, master.rot);
		vec2.scale(totOffset, totOffset, gapTiles); // make a gap
		vec2.add(slave.pos, master.pos, totOffset);
		slave.rot = normAngRadSigned(master.rot + ang);
		slave.updateWorldPoly();
	}

	static clearDups(tiles) {
		// TODO: optimize, go from N^2 to N*log(n)
		const threshAng = degToRad(10);
		const closeDist = .125;
		for (let i = 0; i < tiles.length;) { // inc i only when not deleting
			const ti1 = tiles[i];
			let j;
			for (j = i + 1; j < tiles.length; ++j) {
				const ti2 = tiles[j];
				let ra = ti1.rot - ti2.rot;
				ra = normAngRadSigned(ra);
				if (ti1.kind === ti2.kind
					&& Math.abs(ra) < threshAng 
					&& vec2.sqrDist(ti1.pos, ti2.pos) < closeDist * closeDist) {
					break;
				}
			}
			if (j != tiles.length) {
				tiles.splice(i, 1);
			} else {
				++i;
			}
		}
	}

	// find best connection between tiles or null if none
	static findBestSnapTile(tiles, slaveIdx, snapDistThresh = .3) {
		const sTile = tiles[slaveIdx]; //slave
		let bestTileIdx = -1;
		let bestSlaveEdge;
		let bestMasterEdge;
		let bestNotchID;
		let bestDist2 = snapDistThresh; // must be less than this for a snap
		for (let masteridx = 0; masteridx < tiles.length; ++masteridx) {
			if (masteridx === slaveIdx) {
				continue; // skip self
			}
			const mTile = tiles[masteridx]; // master
			const distPoints2 = vec2.sqrDist(sTile.pos, mTile.pos);
			let distRad2 = sTile.shape.boundRadius + mTile.shape.boundRadius;
			distRad2 *= distRad2;
			// do the best
			if (distPoints2 < distRad2) {
				// run through all the edge fits
				for (let me = 0; me < mTile.shape.polyPnts.length; ++me ) {
					for (let se = 0; se < sTile.shape.polyPnts.length; ++se) {
						let mnid, snid;
						// match up select edges if notches tables exist, otherwise just connect any edges
						if (mTile.shape.masterNotches && sTile.shape.slaveNotches) {
							mnid = mTile.shape.masterNotches[me];
							snid = sTile.shape.slaveNotches[se];
							if (mnid != snid) {
								continue; // doesn't match
							}
						}
						// have matching edges OR no notch check, all edges are valid then
						const connectDist = Tile.calcConnectDist(mTile, me
							, sTile, se); // master, slave
						if (connectDist < bestDist2) {
							bestDist2 = connectDist;
							bestTileIdx = masteridx;
							bestSlaveEdge = se;
							bestMasterEdge = me;
							bestNotchID = mnid;
						}
					}
				}
			// end do the best
			}
		}
		if (bestTileIdx >= 0) {
			const ret = {
				masterTileIdx : bestTileIdx,
				masterEdge : bestMasterEdge,
				slaveTileIdx : slaveIdx,
				slaveEdge : bestSlaveEdge,
				bestDist2: bestDist2,
				notchId: bestNotchID
			}
			return ret;
		}
		return null;
	}
}

// drag tiles around
class EditTiles {
	constructor(tiles) {
		this.tiles = tiles; // array of Tiles
		this.curPntIdx = -1; // current select point for edit
		this.hilitPntIdx = -1; // hover over
		this.startRot = 0;
		this.startRegPoint = vec2.create();
		this.regPoint = vec2.create(); // where in tile, mouse is clicked on selection
		this.lastUserMouse = vec2.create(); // for rotation of tile
	}

	getHilitIdx() { // selected has higher priority than hilit
		const hilitIdx = this.curPntIdx >= 0 ? this.curPntIdx : this.hilitPntIdx;
		return hilitIdx;
	}

	getCurSelected() {
		return this.curPntIdx;
	}

	deselect() {
		this.curPntIdx = -1;
		this.hilitPntIdx = -1;
	}

	deleteHilited() {
		if (this.hilitPntIdx >=0) {
			this.tiles.splice(this.hilitPntIdx, 1);
			this.deselect();
		}
	}

	addTileSelect(tile, userMouse) {
		this.curPntIdx = this.tiles.length;
		this.hilitPntIdx = this.curPntIdx;
		this.tiles.push(tile);

		vec2.sub(this.startRegPoint, userMouse, tile.pos);
		vec2.copy(this.lastUserMouse, userMouse);
		this.startRot = tile.rot;
	}

	#calcHilit(userMouse) {
		// check topmost points first
		for (let i = this.tiles.length - 1; i >= 0; --i) {
			const tile = this.tiles[i];
			const inside = tile.isInside(userMouse);
			if (inside) {
				this.hilitPntIdx = i;
				break;
			}
		}
	}
	
	proc(mouse, userMouse
			/*
			, rotStep = 0 // usually with arrow keys
			, delDeselect = false // delete Tile when deselected
			, deselectFun = null // call when deselected
			, doMove = true // mouse buttons and user/cam space mouse coord
			, moveToTop = true // deselect will put object to the top
			, cloneSelect = false // clone when selected
			*/
			, options) {
		let rotStep = 0;
		let delDeselect = false;
		let deselectFun = null;
		let doMove = true; // allow tiles to move
		let moveToTop = true; // reorder tiles
		let cloneSelect = false; // clone when selected
		if (options) {
			if (options.rotStep !== undefined) {
				rotStep = options.rotStep;
			}
			if (options.delDeselect !== undefined) {
				delDeselect = options.delDeselect;
			}
			if (options.deselectFun !== undefined) {
				deselectFun = options.deselectFun;
			}
			if (options.doMove !== undefined) {
				doMove = options.doMove;
			}
			if (options.moveToTop !== undefined) {
				moveToTop = options.moveToTop;
			}
			if (options.cloneSelect !== undefined) {
				cloneSelect = options.cloneSelect;
			}
		}
		let dirt = mouse.dmxy[0] || mouse.dmxy[1]; // any movement
		this.hilitPntIdx = -1
		// edit stuff on the graph paper
		let but = mouse.mbut[Mouse.LEFT];
		let lastBut = mouse.lmbut[Mouse.LEFT];

		// hilit hover
		this.#calcHilit(userMouse);
		if (this.curPntIdx < 0) {
			// nothing selected
			if (this.hilitPntIdx >= 0) {
				// something hilighted
				if (but && !lastBut) {
					//mouse button up to down, SELECT a piece for movement
					this.curPntIdx = this.hilitPntIdx;
					let tile = this.tiles[this.curPntIdx];
					vec2.sub(this.startRegPoint, userMouse, tile.pos);
					vec2.copy(this.lastUserMouse, userMouse);
					this.startRot = tile.rot;
					if (moveToTop) {
						const result = this.tiles.splice(this.curPntIdx, 1);
						this.tiles.push(result[0]);
						this.curPntIdx = this.tiles.length - 1;
						tile = this.tiles[this.curPntIdx];
					}
					if (cloneSelect) { // make a copy of a newly selected tile
						const cloneTile = tile.clone();
						this.curPntIdx = this.tiles.length;
						this.tiles.push(cloneTile);
					}
				}
			}
		}
		if (but) {
			dirt = true;
		} else {
			// DESELECT point when mouse not pressed
			if (this.curPntIdx >= 0) {
				if (delDeselect) { // delete tile when deselected
					this.tiles.splice(this.curPntIdx, 1);
					this.hilitPntIdx = -1;
				} else {
					if (deselectFun) { // custom do something when deselected
						this.tiles[this.curPntIdx].updateWorldPoly();
						deselectFun(this.tiles, this.curPntIdx);
					}
				}
				dirt = true;
			}
			this.#calcHilit(userMouse); // recalc hilit after things delected or deleted
			this.curPntIdx = -1;
		}
		//  MOVE selected point
		if (this.curPntIdx >= 0 && doMove) {
			const tile = this.tiles[this.curPntIdx];
			const delMouse = vec2.create();

			vec2.sub(delMouse, userMouse, this.lastUserMouse);
			const rotAmount = vec2.cross2d(this.regPoint, delMouse);
			tile.rot += rotAmount * tile.shape.rotFactor;
			tile.rot += rotStep;
			tile.rot = normAngRadSigned(tile.rot);

			vec2.rot(this.regPoint, this.startRegPoint, tile.rot - this.startRot);
			vec2.sub(tile.pos, userMouse, this.regPoint);
			vec2.copy(this.lastUserMouse, userMouse);
			tile.updateWorldPoly();
		}
		return dirt;
	}

	draw(drawPrim, options, doOverlap) {
		// first pass, see which tiles overlap hilighted tile
		const markOverlap = Array(this.tiles.length);
		const hilitPntIdx = this.getHilitIdx();
		const nearRadOnly = false; // proper way is this is false
		if (hilitPntIdx >= 0 && doOverlap) {
			let someOverlap = false;
			const hilitTile = this.tiles[hilitPntIdx];
			for (let j = 0; j < this.tiles.length; ++j) {
				const tile = this.tiles[j];
				// first check inner bounding radius, early in
				let overlap = false;
				if (tile.shape.nearRad !== undefined && hilitTile.shape.nearRad !== undefined
						&& tile !== hilitTile) {
					const dist2 = vec2.sqrDist(hilitTile.pos, tile.pos);
					let sumRad = tile.shape.nearRad + hilitTile.shape.nearRad;
					sumRad *= sumRad;
					overlap = dist2 < sumRad;
				}
				if (!overlap && !nearRadOnly) {
					overlap = hilitTile.isOverlap(tile);
				}
				if (overlap) {
					someOverlap = true;
					markOverlap[j] = true;
				}
			}
			if (someOverlap) {
				markOverlap[hilitPntIdx] = true;
			}
		}
		// second pass, draw the tiles
		for (let i = 0; i < this.tiles.length; ++i) {
			const tile = this.tiles[i];
			const doHilit = hilitPntIdx == i;
			tile.draw(drawPrim, i, doHilit, options, markOverlap[i]);
		}
	}
}
