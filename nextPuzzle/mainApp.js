'use strict';

class Piece {
	static draw(user, pos, hilit, pieceSize) {
		const smaller = pieceSize;
		let smallerRad = [smaller, smaller];
		const smalWidth = .015;
		const bigWidth = .08;
		const darkCol = "#0006";
		const col = hilit ? "yellow" : "peru";
		user.drawPrim.drawRectangleCenter(pos, smallerRad, col);
		user.drawPrim.drawRectangleCenterO(pos, smallerRad, bigWidth, darkCol);
		user.drawPrim.drawRectangleCenterO(pos, smallerRad, smalWidth, "white");
	}
}

class PieceContainer {
	// pieces are on even 'x' numbers from -8 to +8
	constructor(user, boardX, boardY, pieceSize) {
		this.pieceSize = pieceSize;
		this.statesEnumStrs = ["IDLE", "DRAGGING"];
		this.boardX = boardX;
		this.boardY = boardY;
		this.user = user;
		const smaller = pieceSize;
		this.selectDist = smaller * .5;
		this.container = [];
	    this.statesEnum = makeEnum(this.statesEnumStrs);
		this.state = this.statesEnum.IDLE;
		this.idx = -1; // which object in container is being dragged
	}

	add(so) {
		this.container.push(so);
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

	proc(mbut, lmbut, fmxy) {
		// change states
		switch(this.state) {
			case this.statesEnum.IDLE:
				if (mbut && !lmbut) {
					// PICK up piece if within range
					for (let i = 0; i < this.container.length; ++i) {
						const userMouse = fmxy;
						const curPiece = this.container[i];
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
					const curObjPos = this.container[this.idx];
					let x = curObjPos[0];
					let y = curObjPos[1];
					x = Math.round(x);
					y = Math.round(y);
					curObjPos[0] = x;
					curObjPos[1] = y;
					//console.log("switch to IDLE");
				}
				break;
		}
		// run states
		switch(this.state) {
			// MOVE piece
			case this.statesEnum.DRAGGING:
				const curPiece = this.container[this.idx];
				let mousePos = fmxy;
				this.endPos = vec2.clone(mousePos);
				// keep within bounds of the board
				this.startPos = vec2.clone(curPiece);
				this.endPos[0] = range(0, this.endPos[0], this.boardX - 1);
				this.endPos[1] = range(0, this.endPos[1], this.boardY - 1);
				vec2.copy(curPiece, this.endPos); // default, if no collisions
				const avoidLocs = this.container.toSpliced(this.idx, 1); // remove self
				const newPos = solvePath(
					this.startPos, this.endPos, avoidLocs, this.user.pieceSize, this.user.slow, this.user.solveSpeed);
				vec2.copy(curPiece, newPos); // update container with curPiece REFERENCE
				break;
		}
	}
	
	draw() {
		// reverse order
		for (let i = this.container.length - 1; i >= 0; --i) {
			const so = this.container[i];
			Piece.draw(this.user, so, this.state == this.statesEnum.DRAGGING && i == this.idx, this.pieceSize);
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
		const extraX = this.boardX / 2;
		const extraY = this.boardY / 2;
		this.startCenter = [this.boardX / 2 - .5, this.boardY / 2 - .5];
		this.startZoom = 1;
		this.plotter2d = new Plotter2d(
			this.plotter2dCanvas, this.ctx, null
			,this.startCenter, this.startZoom, null, extraX + safe, extraY + safe);
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

	#randomColor() {
		const r = getRandomInt(256);
		const g = getRandomInt(256);
		const b = getRandomInt(256);
		this.vp.style.background = `rgb(${r}, ${g}, ${b}`;
	}

	#initBoard() {
		this.board = new Board(this, this.boardX, this.boardY);
	}

	#initPieces() {
		// slide objects and container
		this.pieceSize = .875;
		// build board
		const pieceDataArr = [];
		// add 3 columns of pieces to board
		for (let j = 0; j < this.boardY; ++j) {
			for (let i = 0; i < 3; ++i) {
				pieceDataArr.push([i, j]);
			}
		}
		this.pieceContainer = new PieceContainer(this, this.boardX, this.boardY, this.pieceSize);
		for (const pieceData of pieceDataArr) {
			let slideObj = vec2.clone(pieceData);
			this.pieceContainer.add(slideObj);
		}
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
		const bigCursor = false; // true for mobile
		this.board.draw();
		this.pieceContainer.draw();
		// draw cursor, when pressed / touched
		if (this.input.mouse.mbut[Mouse.LEFT]) {
			const pntM = this.plotter2d.userMouse;
			const isDragging = this.pieceContainer.isDragging();
			if (bigCursor) {
				if (isDragging) {
					this.drawPrim.drawCircleO(pntM, 2, .25, "black");
					this.drawPrim.drawCircleO(pntM, 2, .05, "white");
				} else {
					this.drawPrim.drawCircleO(pntM, 2, .0375, "gray");
				}
			}
			// show line where we would like to go
			if (isDragging) {
				const curPnt = this.pieceContainer.container[this.pieceContainer.idx];
				this.drawPrim.drawLine(pntM, curPnt, .025, "black");
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
