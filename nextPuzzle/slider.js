'use strict';

class Piece {
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
	// keep piece in range of board
	boardRange(boardX, boardY, pos) {
		pos[0] = range(-this.minPoint[0], pos[0], boardX - 1 - this.maxPoint[0]);
		pos[1] = range(-this.minPoint[1], pos[1], boardY - 1 - this.maxPoint[1]);
		return pos;
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
		//const txt = this.id; // print id
		const txt = idx; // print idx
		user.drawPrim.drawText(this.pos, [.1, .1]
		, txt, "white", "black");
	}
}

class PieceContainer {
	// pieces are on whole numbers 0, 0 to boardX -1, boardY - 1
	constructor(user, pieceData, boardX, boardY, pieceSize) {
		this.pieceSize = pieceSize;
		this.statesEnumStrs = ["IDLE", "DRAGGING"];
		this.boardX = boardX;
		this.boardY = boardY;
		this.user = user;

		this.dragOffset = [0, 0];
		this.container = [];
		for (const po of pieceData.piecePos) {
			const p = new Piece(po, pieceSize);
			this.container.push(p);
		}

		this.goalContainer = [];
		for (const go of pieceData.goalPos) {
			const p = new Piece(go, pieceSize);
			this.goalContainer.push(p);
		}

	    this.statesEnum = makeEnum(this.statesEnumStrs);
		this.state = this.statesEnum.IDLE;
		this.idx = -1; // which object in container is being dragged
		this.user.pIdx = -1;
	}

	isDragging() {
		return this.state == this.statesEnum.DRAGGING;
	}

	// achieved over total goals
	getGoalsMet() {
		let goalsMet = 0;
		for (const oneGoal of this.goalContainer) {
			for (const onePiece of this.container) {
				if (oneGoal.id == onePiece.id 
					&& oneGoal.pos[0] == onePiece.pos[0] 
					&& oneGoal.pos[1] == onePiece.pos[1]) {
						++goalsMet;
						break;
				}
			}
		}
		return [goalsMet, this.goalContainer.length];
	}

	getLoser() {
		return false;
	}

	// take piece container and make arr of points without idx
	#makeAvoidPieces(container, idx) {
		const avoidLocs = [];
		const po1 = container[idx]; // current piece
		for (let i = 0; i < container.length; ++i) {
			if (i == idx) {
				continue;
			}
			const po2 = container[i]; // other pieces
			// do a convolution, some overlap
			for (const sq2 of po2.shapeData) {
				for (const sq1 of po1.shapeData) {
					const offset = vec2.create();
					vec2.add(offset, sq2, po2.pos);
					vec2.sub(offset, offset, sq1);
					avoidLocs.push(offset);
				}
			}
		}
		return avoidLocs;
	}

	// move pieces with whole number increments
	// return true if move the piece
	snapMovePiece(dir) {
		if (this.idx < 0) return;
		console.log("\nin snapmovepiece with " + dir);
		const pce = this.container[this.idx];
		const pos = pce.pos;
		vec2.add(pos, pos, dir); // move to new location
		const disable = false;
		if (disable) {
			return true;
		}
		// check borders
		if (pos[0] < -pce.minPoint[0]
			|| pos[1] < -pce.minPoint[1]
			|| pos[0] >= this.boardX - pce.maxPoint[0]
			|| pos[1] >= this.boardY - pce.maxPoint[1]) {
			vec2.sub(pos, pos, dir); // put it back
			console.log("blocked by border");
			return false;
		}
		// check other pieces
		const avoidLocs = this.#makeAvoidPieces(this.container, this.idx); // take container of pieces and remove self and just make arr of pos
		const pen = avoidPieces(pos, avoidLocs, pce.pieceSize);
		if (pen > 0) {
			vec2.sub(pos, pos, dir); // put it back
			console.log("blocked by other piece");
			return false;
		}
		console.log("move freely");
		return true; 
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
						const curPiece = this.container[i];
						if (curPiece.id < 0) {
							continue;
						}
						const curPiecePos = curPiece.pos;
						const curPieceShapeData = curPiece.shapeData;
						this.user.pIdx = -1;
						for (const s of curPieceShapeData) {
							vec2.add(sum, s, curPiecePos);
							if (sum[0] == roundMouse[0] && sum[1] == roundMouse[1]) {
								this.state = this.statesEnum.DRAGGING;
								this.idx = i;
								this.user.pIdx = i;
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
					const curObjPos = this.container[this.idx].pos;
					vec2.snap(curObjPos, curObjPos, 0);
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
				const curPos = pce.pos;
				let mousePos = fmxy;
				let endPos = vec2.clone(mousePos);
				vec2.add(endPos, endPos, this.dragOffset);
				// keep within bounds of the board
				this.startPos = vec2.clone(curPos);
				endPos = pce.boardRange(this.boardX, this.boardY, endPos); // keep the piece on the board
				this.avoidLocs = this.#makeAvoidPieces(this.container, this.idx); // take container of pieces and remove self and just make arr of pos
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
				so.draw(this.user, this.state == this.statesEnum.DRAGGING && i == this.idx, i);
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

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp.numInstances;
	}

	constructor() {
		console.log("\n############# creating instance of MainApp");
		++MainApp.numInstances;

		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		this.eles = {}; // keep track of eles in vertical panel

		// add all elements from vp to ele if needed
		// uncomment if you need elements from vp html
		//populateElementIds(this.vp, this.eles);

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// load a bitmap image
		const list = [
			["frogBlue", '../fourier/frogBlue.svg'],
			["frogGreen", '../fourier/frogGreen.svg'],
			["frog", '../fourier/frog.svg'],
			["svgBlue", '../fourier/8thNoteBlue.svg'],
			["svgGreen", '../fourier/8thNoteGreen.svg'],
			["svg", '../fourier/8thNote.svg'],
			["bm", '../../engw/common/sptpics/wonMedal.png'],
		];
		DrawPrimitives.loadImages(this, list);

		// USER before UI built

		const startLevel = "levelm";
		this.curPieces = pieceData.pieceDataArrArr.findIndex(user => user.name === startLevel);
		this.curPieces = Math.max(0, this.curPieces);
		console.log("start on level = " + startLevel);

		this.pIdx = -1;
		this.#userInit();
		this.#resetGraphics();

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.dirty = true; // draw at least once
		this.dirtyCount = 100;
		this.#animate();
	}

	#resetGraphics() {
		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER
		const safe = .25;
		const safeBottomFactor = 6;
		const safeBottom = .5 * this.boardY / safeBottomFactor; // add some more safe at the bottom for mobile devices
		const extraX = this.boardX / 2;
		const extraY = this.boardY / 2;
		this.startCenter = [this.boardX / 2 - .5, this.boardY / 2 - .5 - safeBottom / 2];
		this.startZoom = 1;
		this.plotter2d = new Plotter2d(
			this.plotter2dCanvas, this.ctx, null
			,this.startCenter, this.startZoom, null, extraX + safe, extraY + safe + safeBottom / 2);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);
	}

	#initBoard() {
		this.board = new Board(this, this.boardX, this.boardY);
	}

	#initPieces() {
		this.winCount = 0;
		console.log("initpieces, curpieces = " + this.curPieces);
		// slide objects and container
		this.pieceSize = .875;
		// build pieces
		// modify some pieceData
		const touchUpLevel07 = pieceData.pieceDataArrArr.find(user => user.name === "level07");
		
		// add complicated border to level07, towers of hanoi puzzle
		// top border
		for (let j = 0; j < 5; ++j) {
			for (let i = 0; i < 11 - j; ++i) {
				touchUpLevel07.piecePos.push({pos: [i, j],id: -1, color: "black", shapeData: pieceData.shapes.sq1});

			}
		}
		// bottom border
		for (let j = 9; j >= 6; --j) {
			for (let i = -j + 13; i < 2 + j; ++i) {
				touchUpLevel07.piecePos.push({pos: [i, j],id: -1, color: "black", shapeData: pieceData.shapes.sq1});
			}
		}
		
		this.curPieceData = pieceData.pieceDataArrArr[this.curPieces];
		this.boardX = this.curPieceData.boardSize[0];
		this.boardY = this.curPieceData.boardSize[1];
	
		this.pieceContainer = new PieceContainer(this, this.curPieceData
			, this.boardX, this.boardY, this.pieceSize);
		this.winner = false;
		this.loser = false;
	}

	#nextBoard(dir) {
		console.log("next board with " + dir);
		this.curPieces = moveWrap(this.curPieces, pieceData.pieceDataArrArr.length, dir);
		this.#userInit();
		this.#resetGraphics();
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		this.#initPieces();
		this.#initBoard();
		this.winCount = 0; // frame counter
		this.solveSpeed = 10;
		this.slow = 20;

		// measure frame rate
		this.fps;
		this.AvgFps = 0;
		this.oldTime; // for delta time
		this.AvgFpsObj = new Runavg(500);
	}

	#userBuildUI() {
		makeEle(this.vp, "button", null, null, "Reset Pieces", this.#initPieces.bind(this));
		makeEle(this.vp, "button", null, null, "Random color", this.#randomColor.bind(this));
		makeEle(this.vp, "hr");
		makeEle(this.vp, "button", null, null, "Next board", this.#nextBoard.bind(this, 1));
		makeEle(this.vp, "button", null, null, "Prev board", this.#nextBoard.bind(this, -1));
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
        makeEle(this.vp, "pre", null, null, "Show Goal");
		this.eles.showGoal = makeEle(this.vp, "input", "showGoal", null, "ho", (val) => {
			this.showGoal = val;
		}, "checkbox");
	}		
	
	#userProc() {
		// proc
		const mbut = this.input.mouse.mbut[Mouse.LEFT];
		const lastmbut = this.input.mouse.lmbut[Mouse.LEFT];
		if (!this.pieceContainer.isDragging()) {
			switch(this.input.keyboard.key) {
				case  keyTable.keyCodes.LEFT:
					this.pieceContainer.snapMovePiece([-1, 0]);
					break;
				case  keyTable.keyCodes.RIGHT:
					this.pieceContainer.snapMovePiece([1, 0]);
					break;
				case  keyTable.keyCodes.DOWN:
					this.pieceContainer.snapMovePiece([0, -1]);
					break;
				case  keyTable.keyCodes.UP:
					this.pieceContainer.snapMovePiece([0, 1]);
					break;
			}
		}
		this.pieceContainer.proc(mbut, lastmbut, this.plotter2d.userMouse);

		this.goals = this.pieceContainer.getGoalsMet();
		if (this.goals[1] == 0) {
			this.winner =  false; // can't win if no goals
		} else {
			this.winner = this.goals[0] == this.goals[1];
		}


		if (this.winner) {
			this.loser = false;
		} else {
			this.loser = this.pieceContainer.getLoser();
		}
		if (this.winner) {
			if (this.winCount < 180) {
				++this.winCount;
			}
		} else {
			this.winCount = 0;
		}

		//this.dirty = true;
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
		this.AvgFps = this.AvgFpsObj.add(this.fps);

	}

	#userDraw() {
		const bigCursor = true; // true for mobile
		this.board.draw();
		this.pieceContainer.draw();
		// draw cursor, when pressed / touched
		if (this.input.mouse.mbut[Mouse.LEFT]) {
			const pntM = this.plotter2d.userMouse;
			const isDragging = this.pieceContainer.isDragging();
			if (bigCursor) {
				if (isDragging) {
					this.drawPrim.drawCircleO(pntM, 2, .25, "#0001");
					this.drawPrim.drawCircleO(pntM, 2, .05, "#fff1");
				} else {
					this.drawPrim.drawCircleO(pntM, 2, .07, "#8884");
				}
			}
			// show line where we would like to go
			if (isDragging) {
				const curPnt = this.pieceContainer.container[this.pieceContainer.idx];
				const sum = vec2.create();
				vec2.sub(sum, curPnt.pos, this.pieceContainer.dragOffset);
				this.drawPrim.drawLine(pntM, sum, .025, "black");
				this.drawPrim.drawCircle(pntM, .05, "green");
			}
		}
		// end game winner/loser
		if (this.loser) {
			this.drawPrim.drawText([3.5, 2.5], [1, .15]
			, "OOPS !!"
			, "darkred", "#0002");
		}
		const scale = .125 + this.winCount * .008;
		const offset = -.5;
		if (this.winCount > 0) {
			this.drawPrim.drawImageCenter(this.bm
				, [this.boardX / 2 + offset, this.boardY / 2 + offset]
				, [scale, scale]);
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\n\nAvg fps = " + this.AvgFps.toFixed(2);
		infoStr += "\nstate = " + this.pieceContainer.statesEnumStrs[this.pieceContainer.state];
		infoStr += "\nboard = " + this.curPieceData.name + "\nboardidx = " + this.curPieces;
		infoStr += "\ngoals = " + this.goals[0] + " / " + this.goals[1];
		infoStr += "\npIdx = " + this.pIdx;
		infoStr += "\n\n";
		this.eles.textInfoLog.innerText = infoStr;
	}

	#randomColor() {
		const r = getRandomInt(256);
		const g = getRandomInt(256);
		const b = getRandomInt(256);
		this.vp.style.background = `rgb(${r}, ${g}, ${b}`;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
 // don't use any mouse buttons to move user space
 		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT) || this.dirty;
		// USER: do USER stuff
		this.#userProc(); // proc

		this.dirty = true; // test, always draw every frame
		//this.dirty = false;
		// draw when dirty
		if (this.dirty) {
			this.plotter2d.clearCanvas();
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
