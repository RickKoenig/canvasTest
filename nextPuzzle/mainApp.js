'use strict';
class Piece {
	constructor(pos) {
		this.pos = vec2.clone(pos);
	}

	draw(user, rad) {
		const pos = [this.pos[0] - rad, this.pos[1] - rad];
		const scale = [2 * rad, 2 * rad];
		user.drawPrim.drawRectangle(pos, scale, "peru");
		user.drawPrim.drawRectangleO(pos, scale, .05, "black");
	}
}

class PieceContainer {
	// pieces are on even 'x' numbers from -8 to +8
	constructor(user, boardX, boardY) {
		this.boardX = boardX;
		this.boardY = boardY;
		this.user = user;
		this.selectDist = .85 * .5;
		this.container = [];
	    this.statesEnum = makeEnum(["IDLE", "DRAGGING"]);
		this.state = this.statesEnum.IDLE;
		this.idx = -1; // which object in container is being dragged
		this.min = -8;
		this.max = 8;
		this.step = 1;
		this.bothDir = false;
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

	proc() {
		const mbut = this.user.input.mouse.mbut[Mouse.LEFT];
		const lmbut = this.user.input.mouse.lmbut[Mouse.LEFT];
		// change states
		switch(this.state) {
			case this.statesEnum.IDLE:
				if (mbut && !lmbut) {
					// PICK up piece if within range
					for (let i = 0; i < this.container.length; ++i) {
						const userMouse = this.user.plotter2d.userMouse;
						const curPiece = this.container[i];
						const curObjPos = curPiece.pos;
						const dist = vec2.dist(userMouse, curObjPos);
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
					const curObjPos = this.container[this.idx].pos;
					let x = curObjPos[0];
					let y = curObjPos[1];
					x = Math.round(x);
					y = Math.round(y);
					curObjPos[0] = x;
					curObjPos[1] = y;
					console.log("switch to IDLE");
					this.startPos = null;
					this.endPos = null;
					if (this.user.penInfo) {
						this.user.penInfo.penSteps = null;
					}
				}
				break;
		}
		// run states
		switch(this.state) {
			// MOVE piece
			case this.statesEnum.DRAGGING:
				const curPiece = this.container[this.idx];
				const mousePos = this.user.plotter2d.userMouse;
				this.endPos = vec2.clone(mousePos);
				// keep within bounds of the board
				this.endPos[0] = range(0, this.endPos[0], this.boardX - 1);
				this.endPos[1] = range(0, this.endPos[1], this.boardY - 1);
				this.startPos = vec2.clone(curPiece.pos);
				//const result = curPiece.pos;
				// avoid other pieces
				this.user.penInfo = this.#avoidPiece(this.startPos, this.endPos, this.user.avoidLoc); // set this in mainApp
				curPiece.pos = this.user.penInfo.resultP;//vec2.add(curPiece.pos, curPiece.pos, this.user.penInfo.penVec);
				break;
		}
		return 1;
	}
	
	#avoidPiece(startP, endP, avoid) {
		const moveSteps = 5; // move slowly
		let pen = Number.MAX_VALUE;
		let penDir = -1;
		let penVec = vec2.create();
		let resultP = vec2.create();
		//let pen = Number.MAX_VALUE;
		//let penDir = -1;
		//let penVec = vec2.create();

		//return {pen: pen, penDir: penDir, penVec: penVec};
		
		
		const avoidX = avoid[0];
		const avoidY = avoid[1];
		const dirVecs = [
			[-1, 0], // left
			[1, 0], // right
			[0, -1], // down
			[0, 1] // up
		];

		// get smallest positive pen > 0
		// left
		const pLeft = endP[0] - avoidX + 1;
		if (pLeft < pen) {
			pen = pLeft;
			penDir = 0;
		}
		// right
		const pRight = avoidX - endP[0] + 1;
		if (pRight < pen) {
			pen = pRight;
			penDir = 1;
		}
		// bottom
		const pBottom = endP[1] - avoidY + 1;
		if (pBottom < pen) {
			pen = pBottom;
			penDir = 2;
		}
		// top
		const pTop = avoidY - endP[1] + 1;
		if (pTop < pen) {
			pen = pTop;
			penDir = 3;
		}
		// the rest
		if (pen <= 0) {
			pen = 0; // no positive pens found, set to 0
			penDir = -1;
		}
		if (penDir >= 0) {
			vec2.scale(penVec, dirVecs[penDir], pen);
		}
		vec2.add(resultP, endP, penVec);
		const penSteps = [];
		for (let i = 0; i < moveSteps; ++i) {
			const t = i / (moveSteps - 1);
			const ps = vec2.create();
			vec2.sub(ps, endP, startP);
			vec2.scale(ps, ps, t);
			vec2.add(ps, ps, startP);
			penSteps.push(ps);
		}
		return {pen: pen, penDir: penDir, penVec: penVec, resultP: resultP, penSteps: penSteps};
	}

	draw() {
		// reverse order
		for (let i = this.container.length - 1; i >= 0; --i) {
			const so = this.container[i];
			so.draw(this.user, this.selectDist);
		}
	}

	#checkOpen(x) {
		return true;
		if (x < this.min || x > this.max) {
			return false;
		}
		for (const p of this.container) {
			if (p.pos[0] == x) {
				return false;
			}
		}
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
		// hardcoded for 9 by 1 board
		for (let j = 0; j < this.boardY; ++j) {
			const cornerY = j + .5;
			for (let i = 0; i < this.boardX; ++i) {
				const cornerX = i + .5;
				this.user.drawPrim.drawRectangleCenter([cornerX - .5, cornerY - .5], [.8, .8], "#0003");
			}
		}
		this.user.drawPrim.drawRectangleCenter(this.user.avoidLoc,[1,1],"#f004");
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
		this.avoidLoc = [5, 3];
		this.penInfo = {pen: 0, penDir: -1, penVec: [0, 0]};

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
			{ 
				pos: [0, 5],
			}, {
				pos: [1, 1],
			}, {
				pos: [0, 0],
			}, { 
				pos: [1, 0],
			}, { 
				pos: [3, 0],
			}, {
				pos: [7, 0],
			}, { 
				pos: [1, 3],
			}, { 
				pos: [7, 5],
			}
		];
		this.pieceContainer = new PieceContainer(this, this.boardX, this.boardY);
		for (const pieceData of pieceDataArr) {
			let slideObj = new Piece(pieceData.pos);
			this.pieceContainer.add(slideObj);
		}
		this.winner = false;
		this.loser = false;
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		this.winCount = 0; // frame counter
		// measure frame rate
		this.fps;
		this.AvgFps = 0;
		this.oldTime; // for delta time
		this.AvgFpsObj = new Runavg(500);

		this.#initBoard();
		this.#initPieces();
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

		this.pieceContainer.proc();
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
	}

	#userDraw() {
		const bigCursor = false; // true for mobile
		this.board.draw();
		this.pieceContainer.draw();
		const lineWid = .02;
		// draw cursor, when pressed / touched
		if (this.input.mouse.mbut[Mouse.LEFT]) {
			const pntM = vec2.clone(this.plotter2d.userMouse);
			const isDragging = this.pieceContainer.isDragging();
			if (isDragging) {
				// touch selected
				if (bigCursor) {
					this.drawPrim.drawCircleO(pntM, 2, .25, "black");
					this.drawPrim.drawCircleO(pntM, 2, .05, "white");
				}

				const fromPnt = vec2.create();
				const curPnt = this.pieceContainer.container[this.pieceContainer.idx];

				this.drawPrim.drawCircle(pntM, .05, "darkred");
				this.drawPrim.drawLine(pntM, curPnt.pos, .025, "black");
			} else {
				// touch NOT selected
				if (bigCursor) this.drawPrim.drawCircleO(pntM, 2, .0375, "gray");
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
		if (this.penInfo && this.penInfo.penSteps) {
			for (const penPnt of this.penInfo.penSteps) {
				this.drawPrim.drawCircle(penPnt, .05, "blue");			}
		}
		/*
		if (this.pieceContainer.startPos) {
			this.drawPrim.drawCircle(this.pieceContainer.startPos, .05, "red");
		}
		if (this.pieceContainer.endPos) {
			this.drawPrim.drawCircle(this.pieceContainer.endPos, .05, "green");
		}*/
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Info";
		infoStr += "\n\nAvg fps = " + this.AvgFps.toFixed(2);
		infoStr += "\npen = " + this.penInfo.pen.toFixed(2);
		infoStr += "\npenDir = " + this.penInfo.penDir;
		infoStr += "\npenX = " + this.penInfo.penVec[0].toFixed(2);
		infoStr += "\npenY = " + this.penInfo.penVec[1].toFixed(2);
		infoStr += "\n\n";
		this.eles.textInfoLog.innerText = infoStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
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
