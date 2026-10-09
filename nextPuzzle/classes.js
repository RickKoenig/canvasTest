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
		const id = pos[2];
		const posOff = vec2.create();
		vec2.add(posOff, pos, [.25, -.25]);
		user.drawPrim.drawText(pos, [.4, .4]
		, id, "white", "black");
		user.drawPrim.drawText(posOff, [.15, .15]
		, idx, "white", "black");
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

	draw(user, hilit) {
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
		user.drawPrim.drawText(this.pos, [.35, .35]
		, txt, "white", "black");
	}
}

class PieceContainer {
	// pieces rest on whole numbers 0, 0 to boardX -1, boardY - 1
	constructor(user, pieceData, boardX, boardY, pieceSize, maxDepth = 0, maxConf = Number.MAX_SAFE_INTEGER) {
		this.idx = -1;
		this.curConf = 0; // 0 is the main one, others are generated
		this.pieceSize = pieceSize;
		this.statesEnumStrs = ["IDLE", "DRAGGING"];
		this.boardX = boardX;
		this.boardY = boardY;
		this.user = user;
		this.maxDepth = maxDepth;
		this.maxConf = maxConf;

		this.dragOffset = [0, 0]; // handle for dragging
		this.container = []; // doesn't have the pos of the piece, has color, shape and bounding box
		this.posContainer = []; // holds the elements of pos of a piece and ID
		this.posMasterContainer = []; // holds the original elements of pos of a piece and ID
		for (const pd of pieceData.piecePos) {
			const p = new Piece(pd, pieceSize);
			this.container.push(p);
			this.posContainer.push([pd.pos[0], pd.pos[1], pd.id]); // x, y, ID
		}
		this.posMasterContainer = PieceContainer.clonePosPieces(this.posContainer);

		// make 1 configuration of posContainer at slot 0, this one you can move
		this.posContainers = [this.posContainer]; // many configurations of the pieces
		const hash = PieceContainer.makeHash(this.posContainer); // keep a hash for all configurations
		const depth = 0;
		const back = -1;
		const forward = -1;
		this.extras = [[hash, depth, back, forward]]; // hash and depth for all configurations

		// build goal container
		this.goalContainer = [];
		for (const go of pieceData.goalPos) {
			const p = new GoalPiece(go, pieceSize);
			this.goalContainer.push(p);
		}

	    this.statesEnum = makeEnum(this.statesEnumStrs);
		this.state = this.statesEnum.IDLE;
		this.idx = -1; // which object in container is being dragged
	}

	static hashTableSize = 1 << 8; // power of 2
	static makeHash(posCont) {
		let hash = 0;
		if (posCont.length == 0) return 0;
		let pc = posCont[0];
		hash += pc[0] + pc[1] * 5;
		if (posCont.length > 1) {
			pc = posCont[1];
			hash *= 25;
			hash += pc[0] + pc[1] * 5;
		}
		return hash & (PieceContainer.hashTableSize - 1);
	}

	showHashTable() {
		const showCounts = false;
		const showEfficiency = true;
		if (showEfficiency) {
			let max = 0;
			for (let i = 0; i < this.hashTable.length; ++i) {
				max = Math.max(this.hashTable[i].length, max);
			}
			const eff = max * this.hashTable.length / (this.posContainers.length - 1);
			const boost = this.hashTable.length / eff;
			console.error("hash table efficiency = " + eff.toFixed(2) 
				+ ", best = 1.0, worst = " + this.hashTable.length + ".0, boost = " + boost.toFixed(2));
		}
		if (showCounts) {
			console.error("hash table counts");
			for (let i = 0; i < this.hashTable.length; ++i) {
				console.log("hashTable[" + i + "] =  " + this.hashTable[i].length);
			}
		}
	}

	solve() {
		// make copies
		let scanEnd = 1;
		this.resetSolve();

		this.t0 = performance.now();
		// see if we are already at the goal
		const goals = this.getGoalsMet(this.posContainer);
		if (goals[1] != 0 && goals[0] == goals[1]) {
			console.error("EARLY goals met !!!");
			console.log(`depth ${0}/${this.maxDepth}, conf ${1}/${this.maxConf}`);
			this.deltaTime();
			return true;
		}

		for (let j = 1; j < this.maxDepth; ++j) { // how deep to go
			const scanBegin = scanEnd;
			scanEnd = this.posContainers.length;
			console.log("depth = " + j + ", scanBegin = " + scanBegin + ", scanEnd = " + (scanEnd - 1)
				+ ", numScan = " + (scanEnd - scanBegin));
			if (scanBegin == scanEnd) {
				console.error("All moves tried, no goal !!!");
				console.log(`depth ${j}/${this.maxDepth}, conf ${this.posContainers.length - 1}/${this.maxConf}`);
				this.deltaTime();
				return false;
			}
			for (let np = scanBegin; np < scanEnd; ++np) { // search for new moves
				for (let idx = 0; idx < this.posContainer.length; ++idx) {
					if (this.posContainer[idx][2] < 0) continue; // id == -1, skip
					for (const dir of dirVecs) {
						const moveCont = PieceContainer.clonePosPieces(this.posContainers[np]);
						const result = PieceContainer.snapMovePiece(dir, this.container, moveCont, idx
							, this.boardX, this.boardY);
						if (result != null) {
							const hash = PieceContainer.makeHash(moveCont);
							let i;
							const hashSlot = this.hashTable[hash];
							for (i = 0; i < hashSlot.length; ++i) { // see if already moved here
								const posCont = hashSlot[i];
								if (PieceContainer.isSameConf(moveCont, posCont)) {
									break;
								}
							}
							if (i == hashSlot.length) {
								if (this.posContainers.length >= this.maxConf) {
									console.error("max configurations met !!!");
									console.log(`depth ${j}/${this.maxDepth}, conf ${this.posContainers.length - 1}/${this.maxConf}`);
									this.deltaTime();
									return false;
								}
								this.posContainers.push(moveCont); // new position
								//this.extras[np][3].push(this.posContainers.length - 1); // update forwards from back
								this.extras.push([hash, j, np, -1]); // hash, depth, back, init forwards
								this.hashTable[hash].push(moveCont);
								// see if goal
								const goals = this.getGoalsMet(moveCont);
								if (goals[1] != 0 && goals[0] == goals[1]) {
									console.error("goals met !!!");
									console.log(`depth ${j}/${this.maxDepth}, conf ${this.posContainers.length - 1}/${this.maxConf}`);
									this.deltaTime();
									return true;
								}
							}
						}
					}
				}
			}
		}
		console.error("max depth met !!!");
		console.log(`depth ${this.maxDepth}/${this.maxDepth}, conf ${this.posContainers.length - 1}/${this.maxConf}`);
		this.deltaTime();
		return false;
	}

	backTrace() {
		console.log("start a backtrace");
		let conf = this.extras.length - 1;
		while(true) {
			const newConf = this.extras[conf][2];
			if (newConf < 1) break;
			this.extras[newConf][3] = conf;
			conf = newConf;
		}
		console.log("finish a backtrace");
	}

	deltaTime() {
		this.t1 = performance.now();
		console.log("time diff = " + ((this.t1 - this.t0) / 1000).toFixed(3) + " sec");
	}

	// return true if same conf
	static isSameConf(posNew, posContainer) {
		//return false;
		for (let i = 0; i < posContainer.length; ++i) {
			const pn = posNew[i];
			const pc = posContainer[i];
			if (pc[2] < 0) return true; // done, hit neg ids at the end
			if (pn[0] != pc[0]) return false;
			if (pn[1] != pc[1]) return false;
		}
		return true;
	}

	static clonePosPieces(cont) {
		const retCont = [];
		for (let i = 0; i < cont.length; ++i) {
			const retP = cont[i].slice();//vec3.clone(cont[i]);
			retCont.push(retP);
		}
		return retCont;
	}

	static comparePieces(a, b) {
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
		return pos0;
	}
	
	// sort by id's then posy, then posx, only modify posCont
	// return new idx after sorting
	static sortPieces(posCont, idx) {
		let curPos;
		if (idx != null) curPos = posCont[idx];
		posCont.sort(PieceContainer.comparePieces);
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

	static comparePieceData(a, b) {
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
		return pos0;
	}
	
	// sort by id's then posy, then posx
	static sortPieceData() {
		//return;
		console.log("---------- do sortPieceData -------------");
		for(const level of pieceData.pieceDataArrArr) {
			const piecePos = level.piecePos;
			console.log("level " + level.name + " has " + piecePos.length + " pieces");
			piecePos.sort(PieceContainer.comparePieceData);
		}
		console.log("---------- END do sortPieceData -------------");

	}

	resetSolve() {
		console.log("in piececontainer resetSolve");

		this.hashTable = Array(PieceContainer.hashTableSize); // make an empty hash table
		for (let i = 0; i < this.hashTable.length; ++i) {
			this.hashTable[i] = [];
		}
		const first = PieceContainer.clonePosPieces(this.posContainers[0]);
		this.posContainers.length = 1; // reset old settings
		this.posContainers.push(first);
		this.extras.length = 1;
		const extra0 = this.extras[0];
		const hash = extra0[0];
		const depth = extra0[1];
		const back = extra0[2];
		const forwards = -1;
		
		this.extras.push([hash, depth ,back, forwards]);
		this.hashTable[hash].push(first);
		this.changeConf(0);
	}

	resetPieces() {
		console.log("in piececontainer resetpieces");
		this.resetSolve();
		this.posContainer = this.posContainers[0];
		for (let i = 0; i < this.posContainer.length; ++i) {
			const pos = this.posContainer[i];
			const origPos = this.posMasterContainer[i];
			vec2.copy(pos, origPos); // don't need to copy id, so vec2
		}
	}

	changeConf(dir) {
		if (dir == 0) {
			this.curConf = 0;
		} else {
			this.curConf = moveWrap(this.curConf, this.posContainers.length, dir);
		}
		this.posContainer = this.posContainers[this.curConf];
		console.log("change conf to " + this.curConf);
	}

	moveBack() {
		if (this.curConf == 1) {
			this.curConf = 0; // switch to edit mode
			this.posContainer = this.posContainers[this.curConf];
			return;
		}
		const newConf = this.extras[this.curConf][2]; // back
		if (newConf < 1) return; // can't move back from the beginning
		this.curConf = newConf;
		this.posContainer = this.posContainers[this.curConf];
		console.log("move back to " + newConf);
	}

	moveForward() {
		if (this.curConf == 0 && this.extras.length > 1) {
			this.curConf = 1; // switch to browse configurations mode
			this.posContainer = this.posContainers[this.curConf];
			return;
		}
		if (this.curConf < 1) return; // can't move forward in edit mode
		const newConf = this.extras[this.curConf][3]; // forward
		if (newConf < 1) return; // can't move forward from end
		this.curConf = newConf;
		this.posContainer = this.posContainers[this.curConf];
		console.log("move forward to " + newConf);
	}

	// TODO: maybe optimize with hash
	findConf(piecePos) {

	}

	hint() {
		if (this.curConf >= 1) return; // only do hints in edit mode
		console.log("in hint");
		let i;
		for (i = 1; i < this.posContainers.length; ++i) {
			const same = PieceContainer.isSameConf(this.posContainers[0]
				, this.posContainers[i]);
			if (same) {
				/*
				this.posContainer = PieceContainer.clonePosPieces(this.posContainers[i]);
				const j = 
				this.posContainers[0] = this.posContainer;*/
				this.curConf = i; 
				this.moveForward();
				this.posContainer = PieceContainer.clonePosPieces(this.posContainers[this.curConf]);
				this.extras[0][0] = PieceContainer.makeHash(this.posContainer);
				this.posContainers[0] = this.posContainer;
				this.curConf = 0;
				break;
			}
		}
	}

	isDragging() {
		return this.state == this.statesEnum.DRAGGING;
	}

	// achieved over total goals
	getGoalsMet(position) {
		let goalsMet = 0;
		for (const oneGoal of this.goalContainer) {
			for (let i = 0; i < position.length; ++i) {
				const piecePos = position[i];
				if (oneGoal.id == piecePos[2]
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
		//console.log("\nin snapmovepiece with " + dir);
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
			//console.log("blocked by border");
			return null;
		}
		// check other pieces
		const avoidLocs = PieceContainer.makeAvoidPieces(container, posContainer, idx); // take container of pieces and remove self and just make arr of pos
		const pen = avoidPieces(pos, avoidLocs, pce.pieceSize);
		if (pen > 0) {
			vec2.sub(pos, pos, dir); // put it back
			//console.log("blocked by other piece");
			return null;
		}
		//console.log("move freely");
		const newIdx = PieceContainer.sortPieces(posContainer, idx);
		return newIdx; 
	}

	proc(mbut, lmbut, fmxy) {
		// change states
		switch(this.state) {
			case this.statesEnum.IDLE:
				if (mbut && !lmbut && this.curConf == 0) {
					// PICK up piece if within range
					const roundMouse = [Math.round(fmxy[0]), Math.round(fmxy[1])];
					const sum = vec2.create();
					for (let i = 0; i < this.container.length; ++i) {
						const curPiecePos = this.posContainer[i];
						if (curPiecePos[2] < 0) {
							continue;
						}
						const curPiece = this.container[i];
						const curPieceShapeData = curPiece.shapeData;
						this.idx = -1;
						for (const s of curPieceShapeData) {
							vec2.add(sum, s, curPiecePos);
							if (sum[0] == roundMouse[0] && sum[1] == roundMouse[1]) {
								this.state = this.statesEnum.DRAGGING;
								this.idx = i;
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
					this.extras[0][0] = PieceContainer.makeHash(this.posContainer);
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
		// draw the pieces
		const container = this.user.showGoal ? this.goalContainer : this.container;
		// reverse order, for UI
		for (let i = container.length - 1; i >= 0; --i) {
			const so = container[i];
			const pos = this.posContainer[i];
			so.draw(this.user, this.state == this.statesEnum.DRAGGING && i == this.idx, i, pos);
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

