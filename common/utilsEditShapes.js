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

	proc(mouse, userMouse) { // mouse buttons and user/cam space mouse coord
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

// a generic poly tile, abstract, needs a draw(drawPrim, doHilit = false)
class ShapeTile {
	constructor(poly, pos, rot) {
		this.poly = poly;
		if (pos) {
			this.pos = vec2.clone(pos);
		} else {
			this.pos = vec2.create();
		}
		if (rot !== undefined) {
			this.rot = rot;
		} else {
			this.rot = 0;
		}
	}

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
		/*
		this.norms  = [];
		this.Ds = [];
		for (let pnt of this.polyPnts) {
			this.norms.push([3,4]);
			this.Ds.push(5);
		}*/
	}

	isInside(userMouse) {
		return penetrateConvexPoly(this.poly, userMouse, this.pos, this.rot) > 0;
		//return false;

		
		//const pntRad = .25;
		//return vec2.squaredDistance(userMouse, this.pos) < pntRad * pntRad; // one less space to stop fictional errors, VSC
		

	}

}




// drag shapes around
class EditShapes {
	constructor(shapes) {
		this.shapes = shapes; // ShapeTile or derived classes
		this.curPntIdx = -1; // current select point for edit
		this.hilitPntIdx = -1; // hover over
		this.startRot = 0;
		this.startRegPoint = vec2.create();
		this.regPoint = vec2.create(); // where in shape mouse is clicked on selection
	}

	getHilitIdx() { // selected has higher priority than hilit
		const hilitIdx = this.curPntIdx >= 0 ? this.curPntIdx : this.hilitPntIdx;
		return hilitIdx;
	}

	proc(mouse, userMouse) { // mouse buttons and user/cam space mouse coord
		let dirt = mouse.dmxy[0] || mouse.dmxy[1]; // any movement
		this.hilitPntIdx = -1
		// edit stuff on the graph paper
		let but = mouse.mbut[Mouse.LEFT];
		let lastBut = mouse.lmbut[Mouse.LEFT];

		// hilit hover
		// check topmost points first
		for (let i = this.shapes.length - 1; i >= 0; --i) {
			const shape = this.shapes[i];
			const inside = shape.isInside(userMouse);
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
					const shape = this.shapes[this.curPntIdx];
					vec2.sub(this.startRegPoint, userMouse, shape.pos);
					this.startRot = shape.rot;
					const moveToTop = true;
					if (moveToTop) {
						const result = this.shapes.splice(this.curPntIdx, 1);
						this.shapes.push(result[0]);
						this.curPntIdx = this.shapes.length - 1;
					}
				}
			}
		}
		if (but) {
			dirt = true;
		} else {
			// DESELECT point when mouse not pressed
			if (this.curPntIdx >= 0) {
				dirt = true;
			}
			this.curPntIdx = -1;
		}
		//  MOVE selected point
		if (this.curPntIdx >= 0) {
			const shape = this.shapes[this.curPntIdx];
			shape.rot += normAngRadSigned(degToRad(1));
			vec2.rot(this.regPoint, this.startRegPoint, shape.rot - this.startRot);
			vec2.sub(shape.pos, userMouse, this.regPoint);
		}
		return dirt;
	}

	draw(drawPrim) {
		const hilitPntIdx2 = this.getHilitIdx();
		const ctx = drawPrim.ctx;
		for (let j = 0; j < this.shapes.length; ++j) {
			const shape = this.shapes[j];
			shape.draw(drawPrim, j, hilitPntIdx2 == j);
		}
	}
}
