'use strict';

// ##############################################  EditPnts  ##########################################
// ##############################################  EditPnts  ##########################################

// drag points around and add and remove them
class EditPnts {
	// all based on pntRad
	static lineWidth = .1;
	static circleWidth = .2;
	static editCircleSize = 1.5;
	static addPointDist = 16; // how far away to select point for adding

	constructor(pnts, pntRad, addRemove = false, minPnts = 0, maxPnts = -1) {
		this.pnts = pnts;
		this.curPntIdx = -1; // current select point for edit
		this.hilitPntIdx = -1; // hover over
		this.pntRad = pntRad;
		this.addRemove = addRemove;
		this.minPnts = minPnts;
		this.maxPnts = maxPnts; // if -1 then no limit
	}

	setAddRemove(ar) {
		this.addRemove = ar;
	}

	getAddRemove() {
		return this.addRemove;
	}

	// midpoints or past endpoints
	#calcAddIdx(userMouse) {
		let ret = -1;
		if (this.maxPnts != -1 && this.pnts.length >= this.maxPnts) {
			// do nothing if too many points
		} else if (this.pnts.length == 0) {
			// just add a point into an empty array of points anywhere (no dist check)
			ret = 0;
		} else if (this.pnts.length == 1) {
			// just add a point at the end of a 1 point array if close enough
			// point in array
			let dist2 = vec2.sqrDist(userMouse, this.pnts[0]);
			const addRange = EditPnts.addPointDist * this.pntRad;
			if (dist2 < addRange * addRange) {
				ret = this.pnts.length;
			}
		} else {
			// find closest distance to mouse
			// start point
			let bestDist2 = vec2.sqrDist(userMouse, this.pnts[0]);
			let bestIdx2 = 0;
			// end point
			let dist2 = vec2.sqrDist(userMouse, this.pnts[this.pnts.length - 1]);
			if (dist2 < bestDist2) {
				bestDist2 = dist2;
				bestIdx2 = this.pnts.length;
			}
			// middle points
			for (let i = 0 ; i < this.pnts.length - 1; ++i) {
				const p0 = this.pnts[i];
				const p1 = this.pnts[i + 1];
				let mid = vec2.create();
				vec2.add(mid, p0, p1);
				vec2.scale(mid, mid, .5);
				const dist2 = vec2.sqrDist(userMouse, mid);
				if (dist2 < bestDist2) {
					bestDist2 = dist2;
					bestIdx2 = i + 1;
				}
			}
			// add a point if close enough
			const addRange = EditPnts.addPointDist * this.pntRad;
			if (bestDist2 < addRange * addRange) {
				ret = bestIdx2;
			}
		}
		return ret;
	}

	getHilitIdx() { // selected has higher priority than hilit
		const hilitIdx = this.curPntIdx >= 0 ? this.curPntIdx : this.hilitPntIdx;
		return hilitIdx;
	}

	proc(mouse, userMouseOrig) { // mouse buttons and user/cam space mouse coord
		const userMouse = vec2.clone(userMouseOrig);
		let dirt = mouse.dmxy[0] || mouse.dmxy[1]; // any movement
		this.hilitPntIdx = -1
		// edit stuff on the graph paper
		let but = mouse.mbut[Mouse.LEFT];
		let lastBut = mouse.lmbut[Mouse.LEFT];

		// hilit hover
		// check topmost points first
		for (let i = this.pnts.length - 1; i >= 0; --i) {
			const inside
				= vec2.squaredDistance(this.pnts[i], userMouse) 
				< this.pntRad* this.pntRad; // one less space to stop fictional errors, VSC
			if (inside) {
				this.hilitPntIdx = i;
				break;
			}
		}
		if (this.curPntIdx < 0) {
			// nothing selected
			if (this.hilitPntIdx >= 0) {
				// something hilighted
				if (but && !lastBut) {
					//mouse button down
					this.curPntIdx = this.hilitPntIdx;
				}
			}
		}
		if (but) {
			dirt = true;
		} else {
			//deselect point when mouse not pressed
			if (this.curPntIdx >= 0) {
				dirt = true;
			}
			this.curPntIdx = -1;
		}
			
		//  move selected point
		if (this.curPntIdx >= 0) {
			this.pnts[this.curPntIdx] = userMouse;
		}
		if (this.addRemove) {
			if (mouse.mclick[Mouse.MIDDLE]) {
				const selPnt = this.getHilitIdx();
				if (selPnt >= 0) {
					// remove point if hovering over a point
					if (this.pnts.length > this.minPnts) {
						this.pnts.splice(selPnt, 1);
						this.curPntIdx = -1;
						this.hilitPntIdx = -1;
						dirt = true;
					}
				} else {
					// add point
					const addIdx = this.#calcAddIdx(userMouse);
					if (addIdx >= 0) {
						this.pnts.splice(addIdx, 0, userMouse);
						this.curPntIdx = addIdx;
						dirt = true;
					}
				}
			}
		}
		return dirt;
	}

	draw(drawPrim, userMouse) {
		// draw with hilits on some points
		for (let i = 0; i < this.pnts.length - 1; ++i) {
			const pnt0 = this.pnts[i];
			const pnt1 = this.pnts[i + 1];
			drawPrim.drawLine(pnt0, pnt1, this.pntRad * EditPnts.lineWidth);
		}
		const hilitPntIdx2 = this.getHilitIdx();
		let isOver = false;
		for (let i = 0; i < this.pnts.length; ++i) {
			drawPrim.drawCircle(this.pnts[i], this.pntRad, "green");
			const size = this.pntRad * 2;
			drawPrim.drawText(this.pnts[i], [size, size], i, "white");
			let doHilit = i == hilitPntIdx2;
			drawPrim.drawCircleO(this.pnts[i], this.pntRad, this.pntRad * EditPnts.circleWidth, doHilit ? "yellow" : "black");
			if (this.addRemove) {
				// remove
				if (doHilit && this.pnts.length > this.minPnts) {
					drawPrim.drawCircleO(this.pnts[i], this.pntRad * EditPnts.editCircleSize, this.pntRad * EditPnts.circleWidth, "red");
					if (i > 0 && i < this.pnts.length - 1) {
						drawPrim.drawLine(this.pnts[i - 1], this.pnts[i + 1], this.pntRad * EditPnts.lineWidth, "green");
					}
					isOver = true;
				}
			}
		}
		// add
		if (this.addRemove && !isOver) {
			let drawTheInsertCircle = true;
			if (this.pnts.length > 0) {
				drawTheInsertCircle = false;
				const addIdx = this.#calcAddIdx(userMouse);
				if (addIdx > 0) { // before point
					drawPrim.drawLine(userMouse, this.pnts[addIdx - 1], this.pntRad * EditPnts.lineWidth, "green");
					drawTheInsertCircle = true;
				}
				if (addIdx != -1 && addIdx < this.pnts.length) { // after point
					drawPrim.drawLine(userMouse, this.pnts[addIdx], this.pntRad * EditPnts.lineWidth, "green");
					drawTheInsertCircle = true;
				}
			}
			if (drawTheInsertCircle) {
				drawPrim.drawCircleO(userMouse
					, this.pntRad * EditPnts.editCircleSize, this.pntRad * EditPnts.circleWidth, "green");
			}
		}
	}
}



// ##############################################  ShapeTile  ##########################################
// ##############################################  ShapeTile  ##########################################

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
		this.pos = pos;
		this.rot = rot;
	}

	draw(drawPrim, id, doHilit = false) {
		const ctx = drawPrim.ctx;
		ctx.save();
		ctx.translate(this.pos[0], this.pos[1]);
		if (this.shape.draw) {
			ctx.save(); // keep font level
			ctx.rotate(this.rot);
			this.shape.draw(drawPrim, id, doHilit);
			ctx.restore();
		}
		if (this.shape.drawLevel) {
			this.shape.drawLevel(drawPrim, id, doHilit);
		}
		ctx.restore();
	}

	isInside(userMouse) {
		return penetrateConvexPoly(this.shape.polyPnts, userMouse, this.pos, this.rot) > 0;
	}	
}

// drag tiles around
class EditTiles {
	constructor(tiles, snapAmount = degToRad(36)) {
		this.tiles = tiles; // Tile
		this.curPntIdx = -1; // current select point for edit
		this.hilitPntIdx = -1; // hover over
		this.startRot = 0;
		this.startRegPoint = vec2.create();
		this.regPoint = vec2.create(); // where in tile, mouse is clicked on selection
		this.lastUserMouse = vec2.create(); // for rotation of tile
		this.snapAmount = snapAmount;
	}

	getHilitIdx() { // selected has higher priority than hilit
		const hilitIdx = this.curPntIdx >= 0 ? this.curPntIdx : this.hilitPntIdx;
		return hilitIdx;
	}

	#doSnap(ang) {
		if (this.snapAmount) {
			ang /= this.snapAmount;
			ang = Math.round(ang);
			ang *= this.snapAmount;
		}
		return ang;
	}

	proc(mouse, userMouse, snapMode = false, rotMode = false, rotStep = 0) { // mouse buttons and user/cam space mouse coord
		let dirt = mouse.dmxy[0] || mouse.dmxy[1]; // any movement
		this.hilitPntIdx = -1
		// edit stuff on the graph paper
		let but = mouse.mbut[Mouse.LEFT];
		let lastBut = mouse.lmbut[Mouse.LEFT];

		// hilit hover
		// check topmost points first
		for (let i = this.tiles.length - 1; i >= 0; --i) {
			const tile = this.tiles[i];
			const inside = tile.isInside(userMouse);
			if (inside) {
				this.hilitPntIdx = i;
				break;
			}
		}
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
					const moveToTop = true;
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
				if (snapMode) {
					const tile = this.tiles[this.curPntIdx];
					tile.rot = this.#doSnap(tile.rot);
				}
				dirt = true;
			}
			this.curPntIdx = -1;
		}
		//  MOVE selected point
		if (this.curPntIdx >= 0) {
			const tile = this.tiles[this.curPntIdx];
			const delMouse = vec2.create();
			if (rotMode) {
				tile.rot += rotStep;
			} else {
				vec2.sub(delMouse, userMouse, this.lastUserMouse);
				const rotAmount = vec2.cross2d(this.regPoint, delMouse);
				tile.rot += rotAmount * tile.shape.rotFactor;
			}
			tile.rot = normAngRadSigned(tile.rot);
			vec2.rot(this.regPoint, this.startRegPoint, tile.rot - this.startRot);
			vec2.sub(tile.pos, userMouse, this.regPoint);
			vec2.copy(this.lastUserMouse, userMouse);
		}
		return dirt;
	}

	draw(drawPrim) {
		const hilitPntIdx2 = this.getHilitIdx();
		const ctx = drawPrim.ctx;
		for (let j = 0; j < this.tiles.length; ++j) {
			const tile = this.tiles[j];
			tile.draw(drawPrim, j, hilitPntIdx2 == j);
		}
	}
}
