'use strict';

// doesn't need pos
// pos stored somewhere else for speed in solving
class Piece {
	constructor(o, pieceSize) {
		this.color = o.color;
		//this.id = o.id;
		this.shapeData = o.shapeData;
		this.pieceSize = pieceSize;
		this.minPoint = vec2.clone(this.shapeData[0]);
		this.maxPoint = vec2.clone(this.shapeData[0]);
		// calc bounding box for shape
		for (let i = 1; i < this.shapeData.length; ++i) {
			const sd = this.shapeData[i];
			vec2.min(this.minPoint, this.minPoint, sd);
			vec2.max(this.maxPoint, this.maxPoint, sd);
		}
	}
	// keep piece in range of board
	boardRange(boardX, boardY, pos) {
		pos[0] = range(-this.minPoint[0], pos[0], boardX - 1 - this.maxPoint[0]);
		pos[1] = range(-this.minPoint[1], pos[1], boardY - 1 - this.maxPoint[1]);
		return pos;
	}

	draw(user, hilit, idx, pos) {
		const smallerRad = [.995, .995];
		const bigWidth = .06;
		const sqPos = vec2.create();
		for (const offsetPos of this.shapeData) {
			vec2.add(sqPos, offsetPos, pos);
			user.drawPrim.drawRectangleCenterO(sqPos, smallerRad, bigWidth, hilit ? "black" : "peru");
		}
		for (const offsetPos of this.shapeData) {
			vec2.add(sqPos, offsetPos, pos);
			user.drawPrim.drawRectangleCenter(sqPos, smallerRad, this.color);
		}
		//const txt = this.id; // print id
		//const txt = idx; // print idx
		const txt = "" + idx + "," + pos[2];
		//const txt = "" + idx + "," + this.id;
		user.drawPrim.drawText(pos, [.4, .4]
		, txt, "white", "black");
	}
}

// needs pos, doen't need to check borders
class GoalPiece {
	constructor(o, pieceSize) {
		this.pos = vec2.clone(o.pos);
		this.color = o.color;
		this.id = o.id;
		this.shapeData = o.shapeData;
		this.pieceSize = pieceSize;
		this.minPoint = vec2.clone(this.shapeData[0]);
		this.maxPoint = vec2.clone(this.shapeData[0]);
		// calc bounding box for shape
		for (let i = 1; i < this.shapeData.length; ++i) {
			const sd = this.shapeData[i];
			vec2.min(this.minPoint, this.minPoint, sd);
			vec2.max(this.maxPoint, this.maxPoint, sd);
		}
	}

	draw(user, hilit, idx) {
		const smallerRad = [.995, .995];
		const bigWidth = .06;
		const sqPos = vec2.create();
		for (const offsetPos of this.shapeData) {
			vec2.add(sqPos, offsetPos, this.pos);
			user.drawPrim.drawRectangleCenterO(sqPos, smallerRad, bigWidth, hilit ? "black" : "peru");
		}
		for (const offsetPos of this.shapeData) {
			vec2.add(sqPos, offsetPos, this.pos);
			user.drawPrim.drawRectangleCenter(sqPos, smallerRad, this.color);
		}
		const txt = this.id; // print id
		//const txt = idx; // print idx
		user.drawPrim.drawText(this.pos, [.1, .1]
		, txt, "white", "black");
	}
}

class PieceContainer {
	// pieces rest on whole numbers 0, 0 to boardX -1, boardY - 1
	constructor(user, pieceData, boardX, boardY, pieceSize) {
		this.idx = -1;
		this.curConf = 0; // 0 is the main one, others are generated
		this.pieceSize = pieceSize;
		this.statesEnumStrs = ["IDLE", "DRAGGING"];
		this.boardX = boardX;
		this.boardY = boardY;
		this.user = user;

		this.dragOffset = [0, 0];
		this.container = []; // doesn't have the pos of the piece
		this.posContainer = []; // just holds the pos of a piece
		this.posMasterContainer = []; // just holds the original pos of a piece
		for (const po of pieceData.piecePos) {
			const p = new Piece(po, pieceSize);
			this.container.push(p);
			this.posContainer.push([po.pos[0], po.pos[1], po.id]);
		}
		this.posMasterContainer = PieceContainer.clonePosPieces(this.posContainer);

		// make copies of posContainer
		this.posContainers = [this.posContainer]; // many configurations of the pieces


		// make copies
		const maxDepth = 2;
		let scanEnd = 0;
		for (let j = 0; j < maxDepth; ++j) { // how deep to go
			const scanBegin = scanEnd;
			scanEnd = this.posContainers.length;
			for (let np = scanBegin; np < scanEnd; ++np) { // search for new moves
				for (let idx = 0; idx < this.posContainer.length; ++idx) {
					if (this.posContainer[idx][2] < 0) continue; // id
					for (const dir of dirVecs) {
						const moveCont = PieceContainer.clonePosPieces(this.posContainers[np]);
						const result = PieceContainer.snapMovePiece(dir, this.container, moveCont, idx
							, this.boardX, this.boardY);
						if (result != null) {
							let i;
							for (i = 0; i < this.posContainers.length; ++i) { // see if already moved here
								const posCont = this.posContainers[i]
								if (PieceContainer.isSameConf(moveCont, posCont)) {
									break;
								}
							}
							if (i == this.posContainers.length) {
								this.posContainers.push(moveCont); // new position
							}
						}
					}
				}
			}
		}

		
		// build goal container
		this.goalContainer = [];
		for (const go of pieceData.goalPos) {
			const p = new GoalPiece(go, pieceSize);
			this.goalContainer.push(p);
		}

	    this.statesEnum = makeEnum(this.statesEnumStrs);
		this.state = this.statesEnum.IDLE;
		this.idx = -1; // which object in container is being dragged
		//this.user.pIdx = -1;
	}

	// return true if same conf
	static isSameConf(posNew, posContainer) {
		//return false;
		for (let i = 0; i < posContainer.length; ++i) {
			const pn = posNew[i];
			const pc = posContainer[i];
			if (pc.id < 0) return true;;
			if (pn[0] != pc[0]) return false;
			if (pn[1] != pc[1]) return false;
		}
		return true;
	}

	static clonePosPieces(cont) {
		const retCont = [];
		for (let i = 0; i < cont.length; ++i) {
			const retP = vec3.clone(cont[i]);
			retCont.push(retP);
		}
		return retCont;
	}

	static compPieces(a, b) {
		let aID = a[2];
		let bID = b[2];
		const maxID = 10000;
		if (aID < 0) aID = maxID;
		if (bID < 0) bID = maxID;
		const id = aID - bID;
		if (id) return id;
		const pos1 =  a[1] - b[1];
		if (pos1) return pos1;
		const pos0 =  a[0] - b[0];
		//if (pos0) return pos0;
		return pos0;
	}
	
	// sort by id's then posy, then posx, only modify posCont
	// return new idx after sorting
	static sortPieces(posCont, idx) {
		let curPos;
		if (idx != null) curPos = posCont[idx];
		posCont.sort(PieceContainer.compPieces);
		let newIdx = null;
		if (idx != null) {
			for (let i = 0; i < posCont.length; ++i) {
				const pos = posCont[i];
				if (pos[0] == curPos[0] && pos[1] == curPos[1]) {
					newIdx = i;
					return newIdx;
				}
			}
		}
		return newIdx;
	}

	static compPieceData(a, b) {
		let aID = a.id;
		let bID = b.id;
		const maxID = 10000;
		if (aID < 0) aID = maxID;
		if (bID < 0) bID = maxID;
		const id = aID - bID;
		if (id) return id;
		const pos1 =  a.pos[1] - b.pos[1];
		if (pos1) return pos1;
		const pos0 =  a.pos[0] - b.pos[0];
		//if (pos0) return pos0;
		return pos0;
	}
	
	// sort by id's then posy, then posx
	static sortPieceData() {
		//return;
		console.log("---------- do sortPieceData -------------");
		for(const level of pieceData.pieceDataArrArr) {
			const piecePos = level.piecePos;
			console.log("level " + level.name + " has " + piecePos.length + " pieces");
			piecePos.sort(PieceContainer.compPieceData);
		}
		console.log("---------- END do sortPieceData -------------");

	}

	resetPieces() {
		console.log("in piececontainer resetpieces");
		//if (this.curConf != 0) return;
		for (let i = 0; i < this.posContainer.length; ++i) {
			const pos = this.posContainer[i];
			const origPos = this.posMasterContainer[i];
			vec2.copy(pos, origPos);
		}
	}

	changeConf(dir) {
		console.log("change conf to " + dir);
		this.curConf = moveWrap(this.curConf, this.posContainers.length, dir);
		this.posContainer = this.posContainers[this.curConf];

	}

	isDragging() {
		return this.state == this.statesEnum.DRAGGING;
	}

	// achieved over total goals
	getGoalsMet() {
		let goalsMet = 0;
		for (const oneGoal of this.goalContainer) {
			for (let i = 0; i < this.container.length; ++i) {
				const piecePos = this.posContainer[i];
				const onePiece = this.container[i];
				if (oneGoal.id == piecePos[2]
				//if (oneGoal.id == onePiece.id 
					&& oneGoal.pos[0] == piecePos[0] 
					&& oneGoal.pos[1] == piecePos[1]) {
						++goalsMet;
						break;
				}
			}
		}
		return [goalsMet, this.goalContainer.length];
	}

	static getLoser() {
		return false;
	}

	// take piece container and make arr of points without idx
	static makeAvoidPieces(container, posContainer, idx) {
		const avoidLocs = [];
		const po1 = container[idx]; // current piece
		for (let i = 0; i < container.length; ++i) {
			if (i == idx) {
				continue;
			}
			const po2 = container[i]; // other pieces
			const po2Pos = posContainer[i];
			// do a convolution, some overlap
			for (const sq2 of po2.shapeData) {
				for (const sq1 of po1.shapeData) {
					const offset = vec2.create();
					vec2.add(offset, sq2, po2Pos);
					vec2.sub(offset, offset, sq1);
					avoidLocs.push(offset);
				}
			}
		}
		return avoidLocs;
	}

	// move pieces with whole number increments
	// return newIdx if move the piece, null if not
	static snapMovePiece(dir, container, posContainer, idx, boardX, boardY) {
		if (idx < 0) {
			console.log("snapMovePiece idx < 0");
			return null;
		}
		console.log("\nin snapmovepiece with " + dir);
		const pce = container[idx];
		const pos = posContainer[idx];
		vec2.add(pos, pos, dir); // move to new location
		const disable = false;
		if (disable) {
			const newIdx = PieceContainer.sortPieces(posContainer, idx);
			return newIdx;
		}
		// check borders
		if (pos[0] < -pce.minPoint[0]
			|| pos[1] < -pce.minPoint[1]
			|| pos[0] >= boardX - pce.maxPoint[0]
			|| pos[1] >= boardY - pce.maxPoint[1]) {
			vec2.sub(pos, pos, dir); // put it back
			console.log("blocked by border");
			return null;
		}
		// check other pieces
		const avoidLocs = PieceContainer.makeAvoidPieces(container, posContainer, idx); // take container of pieces and remove self and just make arr of pos
		const pen = avoidPieces(pos, avoidLocs, pce.pieceSize);
		if (pen > 0) {
			vec2.sub(pos, pos, dir); // put it back
			console.log("blocked by other piece");
			return null;
		}
		console.log("move freely");
		const newIdx = PieceContainer.sortPieces(posContainer, idx);
		return newIdx; 
	}

	proc(mbut, lmbut, fmxy) {
		// change states
		switch(this.state) {
			case this.statesEnum.IDLE:
				if (mbut && !lmbut) {
					// PICK up piece if within range
					const roundMouse = [Math.round(fmxy[0]), Math.round(fmxy[1])];
					const sum = vec2.create();
					for (let i = 0; i < this.container.length; ++i) {
						const curPiecePos = this.posContainer[i];
						if (curPiecePos[2] < 0) {
						//if (curPiece.id < 0) {
							continue;
						}
						const curPiece = this.container[i];
						const curPieceShapeData = curPiece.shapeData;
						//this.user.pIdx = -1;
						this.idx = -1;
						for (const s of curPieceShapeData) {
							vec2.add(sum, s, curPiecePos);
							if (sum[0] == roundMouse[0] && sum[1] == roundMouse[1]) {
								this.state = this.statesEnum.DRAGGING;
								this.idx = i;
								//this.user.pIdx = i;
								this.dragOffset = vec2.create();
								vec2.sub(this.dragOffset, curPiecePos, roundMouse);
								//console.log("switch to DRAG");
								break;
							}
						}
						if (this.state == this.statesEnum.DRAGGING) {
							break;
						}
					}
				}
				break;
			case this.statesEnum.DRAGGING:
				if (!mbut && lmbut) {
					// DROP piece
					this.state = this.statesEnum.IDLE;
					const curObjPos = this.posContainer[this.idx];
					vec2.snap(curObjPos, curObjPos, 0);
					this.idx = PieceContainer.sortPieces(this.posContainer, this.idx);
					this.dragOffset = [0, 0];
					//console.log("switch to IDLE");
				}
				break;
		}
		// run states
		switch(this.state) {
			// MOVE piece
			case this.statesEnum.DRAGGING:
				// adjust stuff for drag offset
				const pce = this.container[this.idx];
				const curPos = this.posContainer[this.idx];
				let mousePos = fmxy;
				let endPos = vec2.clone(mousePos);
				vec2.add(endPos, endPos, this.dragOffset);
				// keep within bounds of the board
				this.startPos = vec2.clone(curPos);
				endPos = pce.boardRange(this.boardX, this.boardY, endPos); // keep the piece on the board
				this.avoidLocs = PieceContainer.makeAvoidPieces(this.container, this.posContainer, this.idx); // take container of pieces and remove self and just make arr of pos
				const newPos = solvePath(
					this.startPos, endPos, this.avoidLocs, this.pieceSize, this.user.slow, this.user.solveSpeed);
				vec2.copy(curPos, newPos); // update container with curPiece REFERENCE
				break;
		}
	}
	
	draw() {
		// draw the pieces, alt mode shrink when dragging
		const shrink = false;
		if (shrink && this.state == this.statesEnum.DRAGGING) {
			this.user.drawPrim.drawRectangleCenter(this.container[this.idx].pos, [.8, .8], "#f00");
			for (const al of this.avoidLocs) {
				this.user.drawPrim.drawRectangleCenter(al, [.8, .8], "#080");
			}
		} else {
			const container = this.user.showGoal ? this.goalContainer : this.container;
			// reverse order, for UI
			for (let i = container.length - 1; i >= 0; --i) {
				const so = container[i];
				const pos = this.posContainer[i];
				so.draw(this.user, this.state == this.statesEnum.DRAGGING && i == this.idx, i, pos);
			}
		}
	}
}

class Board {
	constructor(user, boardX, boardY) {
		this.user = user;
		this.boardX = boardX;
		this.boardY = boardY;
	}

	draw() {
		// draw puzzle outline
		this.user.drawPrim.drawRectangleO([-.5, -.5], [this.boardX, this.boardY], .04);
		for (let j = 0; j < this.boardY; ++j) {
			const cornerY = j + .5;
			for (let i = 0; i < this.boardX; ++i) {
				const cornerX = i + .5;
				this.user.drawPrim.drawRectangleCenter([cornerX - .5, cornerY - .5], [.8, .8], "#0003");
			}
		}
	}
}

