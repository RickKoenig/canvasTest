'use strict';

// a generic poly tile, abstract, needs a draw and point
// static
class Shape {
	// called only once, center and TODO: calc N and D
	static setupPolyPnts() {
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
		this.rotFactor = 1.25 / farDist2; // That's it!, try a little more turn
	}
}

// has a Shape, not static
class Tile {
	constructor(shape, pos, rot) {
		this.shape = shape;
		this.pos = vec2.clone(pos);
		this.rot = rot;
		this.kind = shape.kind; // for serialization
	}

	clone(rhs) {
		const ret = new Tile(this.shape, this.pos, this.rot);
		return ret;
	}

	draw(drawPrim, id, doHilit = false, options) {
		const ctx = drawPrim.ctx;
		ctx.save();
		ctx.translate(this.pos[0], this.pos[1]);
		if (this.shape.draw) {
			ctx.save(); // keep font level
			ctx.rotate(this.rot);
			this.shape.draw(drawPrim, id, doHilit, options);
			ctx.restore();
		}
		// draw ids when no options
		if (this.shape.drawLevel && (!options || options.drawIds)) {
			this.shape.drawLevel(drawPrim, id);
		}
		ctx.restore();
	}

	isInside(userMouse) {
		return penetrateConvexPoly(this.shape.polyPnts, userMouse, this.pos, this.rot) > 0;
	}	
}

// drag tiles around
class EditTiles {
	constructor(tiles, snapTransAmount = 0, snapRotAmount = degToRad(36)) {
		this.tiles = tiles; // Tile
		this.curPntIdx = -1; // current select point for edit
		this.hilitPntIdx = -1; // hover over
		this.startRot = 0;
		this.startRegPoint = vec2.create();
		this.regPoint = vec2.create(); // where in tile, mouse is clicked on selection
		this.lastUserMouse = vec2.create(); // for rotation of tile
		this.snapTransAmount = snapTransAmount;
		this.snapRotAmount = snapRotAmount;
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

	addTile(tile, userMouse) {
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
		, snapMode = false
		, rotStep = 0 // usually with arrow keys
		, delDeselect = false
		, doMove = true) { // mouse buttons and user/cam space mouse coord
		*/
		, options) {
		
		let snapMode = false;
		let rotStep = 0;
		let delDeselect = false;
		let doMove = true; // also when false, prevent reordering of tiles
		if (options) {
			if (options.snapMode !== undefined) {
				snapMode = options.snapMode;
			}
			if (options.rotStep !== undefined) {
				rotStep = options.rotStep;
			}
			if (options.delDeselect !== undefined) {
				delDeselect = options.delDeselect;
			}
			if (options.doMove !== undefined) {
				doMove = options.doMove;
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
					const tile = this.tiles[this.curPntIdx];
					vec2.sub(this.startRegPoint, userMouse, tile.pos);
					vec2.copy(this.lastUserMouse, userMouse);
					this.startRot = tile.rot;
					const moveToTop = doMove;
					if (moveToTop) {
						const result = this.tiles.splice(this.curPntIdx, 1);
						this.tiles.push(result[0]);
						this.curPntIdx = this.tiles.length - 1;
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
					if (snapMode) {
						const tile = this.tiles[this.curPntIdx];
						tile.rot = snap(tile.rot, this.snapRotAmount);
						tile.pos[0] = snap(tile.pos[0], this.snapTransAmount);
						tile.pos[1] = snap(tile.pos[1], this.snapTransAmount);
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
		}
		return dirt;
	}

	draw(drawPrim, options) {
		const hilitPntIdx2 = this.getHilitIdx();
		const ctx = drawPrim.ctx;
		for (let j = 0; j < this.tiles.length; ++j) {
			const tile = this.tiles[j];
			tile.draw(drawPrim, j, hilitPntIdx2 == j, options);
		}
	}
}
