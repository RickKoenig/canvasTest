'use strict';

class Piece {
	// TODO: add piece type/shape
	constructor(o, pieceSize, shapeData) {
		this.pos = o.pos;
		this.color = o.color;
		this.shapeData = shapeData;
		this.pieceSize = pieceSize;
		this.minPoint = vec2.clone(shapeData[0]);
		this.maxPoint = vec2.clone(shapeData[0]);
		for (let i = 1; i < shapeData.length; ++i) {
			const sd = shapeData[i];
			vec2.min(this.minPoint, this.minPoint, sd);
			vec2.max(this.maxPoint, this.maxPoint, sd);
		}
	}
	// keep piece in range of board
	range(boardX, boardY, pos) {
		pos[0] = range(-this.minPoint[0], pos[0], boardX - 1 - this.maxPoint[0]);
		pos[1] = range(-this.minPoint[1], pos[1], boardY - 1 - this.maxPoint[1]);
		return pos;
	}

	draw(user, hilit) {
		const smallerRad = [this.pieceSize, this.pieceSize];
		const smallWidth = .015;
		const bigWidth = .08;
		const darkCol = "#0004";
		const sqPos = vec2.create();
		for (const offsetPos of this.shapeData) {
			vec2.add(sqPos, offsetPos, this.pos);
			user.drawPrim.drawRectangleCenter(sqPos, smallerRad, this.color);
			user.drawPrim.drawRectangleCenterO(sqPos, smallerRad, bigWidth, hilit ? "black" : darkCol);
			user.drawPrim.drawRectangleCenterO(sqPos, smallerRad, smallWidth, "white");
		}
		user.drawPrim.drawRectangleCenter(this.pos, [this.pieceSize / 4, this.pieceSize / 4], "white");
		user.drawPrim.drawRectangleCenterO(this.pos, [this.pieceSize / 4, this.pieceSize / 4], smallWidth, "black");
		const textSize = .05;
	    user.drawPrim.drawText(this.pos, [textSize, textSize], "M");
	}
}

class PieceContainer {
	// pieces are on whole numbers 0, 0 to boardX -1, boardY - 1
	constructor(user, pieceData, pieceShapes, boardX, boardY, pieceSize) {
		this.pieceSize = pieceSize;
		this.statesEnumStrs = ["IDLE", "DRAGGING"];
		this.boardX = boardX;
		this.boardY = boardY;
		this.user = user;
		const smaller = pieceSize;
		this.selectDist = smaller * .5;

		this.container = [];
		for (const po of pieceData) {
			const shapeData = pieceShapes[po.shapeIdx];
			const p = new Piece(po, pieceSize, shapeData);
			this.container.push(p);
		}

	    this.statesEnum = makeEnum(this.statesEnumStrs);
		this.state = this.statesEnum.IDLE;
		this.idx = -1; // which object in container is being dragged
	}

	isDragging() {
		return this.state == this.statesEnum.DRAGGING;
	}

	getLoser() {
		return false;
	}

	getWinner() {
		return false;
	}

	// take piece container and make arr of points without idx
	#makeAvoidPieces() {
		const avoidLocs = [];
		for (let i = 0; i < this.container.length; ++i) {
			if (i == this.idx) {
				continue;
			}
			const po = this.container[i];
			avoidLocs.push(po.pos);
		}
		return avoidLocs;
	}

	proc(mbut, lmbut, fmxy) {
		// change states
		switch(this.state) {
			case this.statesEnum.IDLE:
				if (mbut && !lmbut) {
					// PICK up piece if within range
					for (let i = 0; i < this.container.length; ++i) {
						const userMouse = fmxy;
						const curPiece = this.container[i].pos;
						const dist = vec2.dist(userMouse, curPiece);
						if (dist < this.selectDist) {
							this.state = this.statesEnum.DRAGGING;
							this.idx = i;
							//console.log("switch to DRAG");
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
					//console.log("switch to IDLE");
				}
				break;
		}
		// run states
		switch(this.state) {
			// MOVE piece
			case this.statesEnum.DRAGGING:
				const pce = this.container[this.idx];
				const curPos = pce.pos;
				let mousePos = fmxy;
				this.endPos = vec2.clone(mousePos);
				// keep within bounds of the board
				this.startPos = vec2.clone(curPos);
				this.endPos = pce.range(this.boardX, this.boardY, this.endPos); // keep the piece on the board
				const avoidLocs = this.#makeAvoidPieces(); // take container of pieces and remove self and just make arr of pos
				const newPos = solvePath(
					this.startPos, this.endPos, avoidLocs, this.pieceSize, this.user.slow, this.user.solveSpeed);
				vec2.copy(curPos, newPos); // update container with curPiece REFERENCE
				break;
		}
	}
	
	draw() {
		// reverse order, for UI
		for (let i = this.container.length - 1; i >= 0; --i) {
			const so = this.container[i];
			so.draw(this.user, this.state == this.statesEnum.DRAGGING && i == this.idx);
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
class MainApp2 {
	static numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp2.numInstances;
	}

	constructor() {
		console.log("\n############# creating instance of MainApp2");
		++MainApp2.numInstances;
		this.boardX = 8;
		this.boardY = 6;

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
		this.#userInit();

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

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.dirty = true; // draw at least once
		this.dirtyCount = 100;
		this.#animate();
	}

	#initBoard() {
		this.board = new Board(this, this.boardX, this.boardY);
	}

	#initPieces() {
		// slide objects and container
		this.pieceSize = .875;
		// build pieces
		const pieceShapeEnums = makeEnum(["sq1", "sq2", "sq3", "tee", "el"]);
		const pieceShapes = [
			// sq1
			[
				[0, 0]
			],
			// sq2
			[
				[0, 0],
				[0, 1],
				[1, 0],
				[1, 1]
			],
			// sq3
			[
				[-1, -1],
				[-1, 0],
				[-1, 1],
				[0, -1],
				[0, 0],
				[0, 1],
				[1, -1],
				[1, 0],
				[1, 1]
			],
			// tee
			[
				[-1, 0],
				[0, 0],
				[1, 0],
				[0, -1]
			],
			// el
			[
				[0, 2],
				[0, 1],
				[0, 0],
				[1, 0]
			],
		];
		const pieceDataArr = [
			{pos: [2, 1], color: "red", shapeIdx: pieceShapeEnums.sq1},
			{pos: [4, 2], color: "green", shapeIdx: pieceShapeEnums.sq3},
			{pos: [6, 1], color: "blue", shapeIdx: pieceShapeEnums.el},
			{pos: [2, 4], color: "yellow", shapeIdx: pieceShapeEnums.tee},
			{pos: [6, 4], color: "peru", shapeIdx: pieceShapeEnums.sq1},
		];
		this.pieceContainer = new PieceContainer(this, pieceDataArr, pieceShapes, this.boardX, this.boardY, this.pieceSize);
		this.winner = false;
		this.loser = false;
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section

		this.#initBoard();
		this.#initPieces();
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
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
	}		
	
	#userProc() {
		// proc
		const mbut = this.input.mouse.mbut[Mouse.LEFT];
		const lastmbut = this.input.mouse.lmbut[Mouse.LEFT];
		this.pieceContainer.proc(mbut, lastmbut, this.plotter2d.userMouse);

		this.winner = this.pieceContainer.getWinner();
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
				this.drawPrim.drawLine(pntM, curPnt.pos, .025, "black");
				this.drawPrim.drawCircle(pntM, .05, "green");
			}
		}
		if (this.loser) {
			this.drawPrim.drawText([3.5, 2.5], [1, .15]
			, "OOPS !!"
			, "darkred", "#0002");
		}

		const scale = .125 + this.winCount * .035;
		const offset = -scale / 2;

		if (this.winCount > 0) {
			this.drawPrim.drawImage(this.bm, [3.5 + offset, 2.5 + offset], [scale, scale]);
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\n\nAvg fps = " + this.AvgFps.toFixed(2);
		infoStr += "\nstate = " + this.pieceContainer.statesEnumStrs[this.pieceContainer.state];
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

const mainApp = new MainApp2();
console.log("Num instances of MainApp2 = " + MainApp2.getNumInstances()); // and test static methods
