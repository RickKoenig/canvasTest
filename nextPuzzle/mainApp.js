'use strict';

class Piece {
	static draw(user, pos, drag, sel) {
		//drag = false;
		//sel = false;
		const rad = [1, 1];
		const smaller = .85;
		let smallerRad = [smaller, smaller];
		let biggerRad = [2, 2];
		let cpos = vec2.clone(pos);
		//cpos = vec2.sub(cpos, cpos, [rad, rad]);
		const scale = [2 * rad, 2 * rad];
		const smalWidth = .015;
		const bigWidth = .08;
		const lightCol = "#fff6";
		const darkCol = "#0006";
		//if (!sel) user.drawPrim.drawRectangleCenterO(cpos, scale, .05, "black");
		if (!drag || !sel) {
			user.drawPrim.drawRectangleCenter(cpos, smallerRad, "peru");
			user.drawPrim.drawRectangleCenterO(cpos, smallerRad, bigWidth, darkCol);
			user.drawPrim.drawRectangleCenterO(cpos, smallerRad, smalWidth, "white");
		}
		if (!sel) {
			user.drawPrim.drawRectangleCenterO(cpos, biggerRad, bigWidth, darkCol);
			user.drawPrim.drawRectangleCenterO(cpos, biggerRad, smalWidth, lightCol);
		}
		if (drag) {
			if (sel) user.drawPrim.drawCircle(pos, .05, "red");
		} else {
			//user.drawPrim.drawRectangleCenter(cpos, scale * smaller, "peru");
		}
	}
}

class PieceContainer {
	static checkDir = {
		xOnly: 0,
		yOnly: 1,
		all: 2
	}
	// pieces are on even 'x' numbers from -8 to +8
	constructor(user, boardX, boardY) {
		this.statesEnumStrs = ["IDLE", "DRAGGING"];
		this.boardX = boardX;
		this.boardY = boardY;
		this.user = user;
		const smaller = .85;
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
		if (this.state == this.statesEnum.DRAGGING) {
			return false;
		}
		return false;
	}

	getWinner() {
		if (this.state == this.statesEnum.DRAGGING) {
			return false;
		}
		// see if winner
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
							console.log("switch to DRAG");
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
					console.log("switch to IDLE");
					this.startPos = null;
					this.endPos = null;
					this.idx = -1;
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
				const avoidLocs = this.container.toSpliced(this.idx, 1);
				for (let i = 0; i < this.user.solveSpeed; ++i) {
					for (let j = 0; j < this.container.length; ++j) {
						const tweenPos = vec2.create();
						vec2.lerp(tweenPos, this.startPos, this.endPos, 1 / this.user.slow);
						const newPiece = avoidPieces(curPiece, tweenPos, avoidLocs); // set this in mainApp
						vec2.copy(curPiece, newPiece); // update container with curPiece REFERENCE
						this.startPos = vec2.clone(curPiece);
					}
				}
				break;
		}
	}
	
	draw() {
		// reverse order
		for (let i = this.container.length - 1; i >= 0; --i) {
			const so = this.container[i];
			Piece.draw(this.user, so, this.state, i == this.idx);
		}
	}

	#checkOpen(x) {
		return true;
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
		//this.avoidLoc = [5, 3];
		//this.penInfo = {pen: 0, penDir: -1, penVec: [0, 0]};

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
		this.winCount = 0;
		// slide objects and container
		const dist = this.pieceDist;
		const safe = .95; // select more inside circle radius
		const pieceDataArr = [
			/*
				[3, 3],
				[3, 2],
				[5, 2],
				[6, 2],
				[5, 1],
				[7, 0],
			*/
				[4, 4],
				[1, 1],
		];
		this.pieceContainer = new PieceContainer(this, this.boardX, this.boardY);
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
		this.holdStart = vec2.fromValues(5.25, 2);
		this.holdEnd = vec2.fromValues(4.875, 3.25);
		this.holdResult = vec2.fromValues(-1, -1);
		this.holdResultEnter = vec2.fromValues(-1, -1);
		this.holdResultExit = vec2.fromValues(-.5, -.5);

		this.#initBoard();
		this.#initPieces();
		this.winCount = 0; // frame counter
		this.solveSpeed = 1;
		this.slow = 10;


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

		const middle = this.input.mouse.mbut[Mouse.MIDDLE];
		const right = this.input.mouse.mbut[Mouse.RIGHT];

		const prec = 4;
		if (right) {
			this.holdStart = vec2.clone(this.plotter2d.userMouse);
			vec2.snap(this.holdStart, this.holdStart, prec);
		}
		if (middle) {
			this.holdEnd = vec2.clone(this.plotter2d.userMouse);
			vec2.snap(this.holdEnd, this.holdEnd, prec);
		}

		this.holdResult = avoidPieces(this.holdStart, this.holdEnd, this.pieceContainer.container);
		const slabResult = slabCalc(this.holdStart, this.holdEnd, this.pieceContainer.container[0]);
		this.holdResultEnter = slabResult.pEnter;
		this.holdResultExit = slabResult.pExit;
		this.winner |= this.pieceContainer.getWinner();
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
		if (this.input.mouse.mbut[Mouse.LEFT] /*|| this.holdMouseBut */) {
			const pntM = vec2.clone(this.plotter2d.userMouse);
			const isDragging = this.pieceContainer.isDragging();
			if (bigCursor) {
				if (isDragging) {
					this.drawPrim.drawCircleO(pntM, 2, .25, "black");
					this.drawPrim.drawCircleO(pntM, 2, .05, "white");
				} else {
					this.drawPrim.drawCircleO(pntM, 2, .0375, "gray");
				}
			}
			// show line where barrier happens, (desired / current mouse pos)
			if (isDragging) {
				const curPnt = this.pieceContainer.container[this.pieceContainer.idx];
				this.drawPrim.drawCircle(pntM, .05, "green");
				this.drawPrim.drawLine(pntM, curPnt, .025, "black");
			}
		}
		if (this.loser) {
			this.drawPrim.drawText([0, 2], [1, .15]
			, "OOPS !!"
			, "darkred", "#0002");
		}

		const scale = .125 + this.winCount * .015;
		const offset = -scale / 2;

		if (this.winCount > 0) {
			this.drawPrim.drawImage(this.bm, [offset, 1.5 + offset], [scale, scale]);
		}
		// draw hold
		this.drawPrim.drawLine(this.holdStart, this.holdEnd, .025, "black", true);
		this.drawPrim.drawCircle(this.holdStart, .125, "red", true);
		this.drawPrim.drawCircle(this.holdEnd, .125, "#0c4", true);
		this.drawPrim.drawCircle(this.holdResult, .04, "blue", true);
		this.drawPrim.drawCircle(this.holdResultEnter, .05, "darkred", true);
		this.drawPrim.drawCircle(this.holdResultExit, .05, "green", true);
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\n\nAvg fps = " + this.AvgFps.toFixed(2);
		//infoStr += "\npen = " + this.penInfo.pen.toFixed(2);
		//infoStr += "\npenDir = " + this.penInfo.penDir;
		//infoStr += "\npenX = " + this.penInfo.penVec[0].toFixed(2);
		//infoStr += "\npenY = " + this.penInfo.penVec[1].toFixed(2);
		//infoStr += "\nholdBut = " + this.holdMouseBut;
		//infoStr += "\nholdSave = " + this.pieceHoldSave[0].toFixed(2) + " " + this.pieceHoldSave[1].toFixed(2);
		infoStr += "\nstate = " + this.pieceContainer.statesEnumStrs[this.pieceContainer.state];
		infoStr += "\n\n";
		this.eles.textInfoLog.innerText = infoStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, null) || this.dirty; // don't use any mouse buttons to move user space
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
