'use strict';

// a generic poly tile, abstract, needs a draw and point
// static
class Shape {
	// called only once, center and TODO: calc N and D
	// polyPnts: array of points
	// rotFactor: for UI rotate object with drag mouse
	// boundRadius: smallest circle containing all points
	// area: area of poly
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
		this.rotFactor = 1.25 / farDist2; // That's it!, try a little more turn
		this.area = calcPolyArea(this.polyPnts);
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
		return penetrateConvexPoly(this.shape.polyPnts, this.pos, this.rot, userMouse) > 0;
	}	

	static doIsectTiles(tileA, tileB) {
		return calcPolyIntsectBoundcircle(tileA.shape.polyPnts, tileA.shape.boundRadius, tileA.pos, tileA.rot
			, tileB.shape.polyPnts, tileB.shape.boundRadius, tileB.pos, tileB.rot);
	}

	static isOverlap(tileA, tileB, thresh = .01) {
		if (tileA === tileB) {
			return false; // can't overlap over self
		}
		const isectPoly = calcPolyIntsectBoundcircle(tileA.shape.polyPnts, tileA.shape.boundRadius, tileA.pos, tileA.rot
			, tileB.shape.polyPnts, tileB.shape.boundRadius, tileB.pos, tileB.rot);
		const areaIsect = calcPolyArea(isectPoly);
		const totalArea = tileA.shape.area + tileB.shape.area;
		return areaIsect > thresh * totalArea;
	}
}

// drag tiles around
class EditTiles {
	constructor(tiles/*, snapTransAmount = 0, snapRotAmount = degToRad(36)*/) {
		this.tiles = tiles; // Tile
		this.curPntIdx = -1; // current select point for edit
		this.hilitPntIdx = -1; // hover over
		this.startRot = 0;
		this.startRegPoint = vec2.create();
		this.regPoint = vec2.create(); // where in tile, mouse is clicked on selection
		this.lastUserMouse = vec2.create(); // for rotation of tile
		//this.snapTransAmount = snapTransAmount;
		//this.snapRotAmount = snapRotAmount;
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
		//, snapMode = false
		, rotStep = 0 // usually with arrow keys
		, delDeselect = false // delete Tile when deselected
		, deselectFun = null // call when deselected
		, doMove = true//  mouse buttons and user/cam space mouse coord
		, moveToTop = true//  deselect will put object to the top
		*/
		, options) {
		
		//let snapMode = false;
		let rotStep = 0;
		let delDeselect = false;
		let deselectFun = null;
		let moveFun = null;
		let doMove = true; // allow tiles to move
		let moveToTop = true; // reorder tiles
		if (options) {
			//if (options.snapMode !== undefined) {
			//	snapMode = options.snapMode;
			//}
			if (options.rotStep !== undefined) {
				rotStep = options.rotStep;
			}
			if (options.delDeselect !== undefined) {
				delDeselect = options.delDeselect;
			}
			if (options.deselectFun !== undefined) {
				deselectFun = options.deselectFun;
			}
			if (options.moveFun !== undefined) {
				moveFun = options.moveFun;
			}
			if (options.doMove !== undefined) {
				doMove = options.doMove;
			}
			if (options.moveToTop !== undefined) {
				moveToTop = options.moveToTop;
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
					if (deselectFun) { // custom do something when deselected
						deselectFun(this.tiles, this.curPntIdx);
					}
						//if (snapMode) {
					//	const tile = this.tiles[this.curPntIdx];
						//tile.rot = snap(tile.rot, this.snapRotAmount);
						//tile.pos[0] = snap(tile.pos[0], this.snapTransAmount);
						//tile.pos[1] = snap(tile.pos[1], this.snapTransAmount);
					//}
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
			if (moveFun) {
				moveFun(this.tiles, this.curPntIdx);
			}
		}
		return dirt;
	}

	draw(drawPrim, options, doOverlap) {
		// first pass, see which tiles overlap hilighted tile
		const markOverlap = new Array(this.tiles.length);
		const hilitPntIdx = this.getHilitIdx();
		if (hilitPntIdx >= 0 && doOverlap) {
			let someOverlap = false;
			const hilitTile = this.tiles[hilitPntIdx];
			for (let j = 0; j < this.tiles.length; ++j) {
				const overlap = Tile.isOverlap(hilitTile, this.tiles[j]);
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
