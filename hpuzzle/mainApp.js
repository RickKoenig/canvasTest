'use strict';
class Piece {
	constructor(pos, rad, color) {
		this.pos = vec2.clone(pos);
		this.rad = rad;
		this.color = color;
	}

	draw(user) {
		user.drawPrim.drawCircle(this.pos, this.rad ,this.color);
	}
}

class PieceContainer {
	constructor(user, selectRad) {
		this.user = user;
		this.selectRad2 = selectRad * selectRad;
		this.container = [];
	    this.statesEnum = makeEnum(["IDLE", "DRAGGING"]);
		this.state = this.statesEnum.IDLE;
		this.idx = -1; // which object in container
	}

	add(so) {
		this.container.push(so);
	}

	isDragging() {
		return this.state == this.statesEnum.DRAGGING;
	}

	proc() {
		const mbut = this.user.input.mouse.mbut[Mouse.LEFT];
		const lmbut = this.user.input.mouse.lmbut[Mouse.LEFT];
		// change states
		switch(this.state) {
			case this.statesEnum.IDLE:
				if (mbut && !lmbut) {
					// find closest piece
					for (let i = 0; i < this.container.length; ++i) {
						const userMouse = this.user.plotter2d.userMouse;
						const curObjPos = this.container[i].pos;
						const dist = vec2.squaredDistance(userMouse, curObjPos);
						if (dist < this.selectRad2) {
							this.state = this.statesEnum.DRAGGING;
							this.idx = i;
							console.log("switch to DRAG");
							break;
						}
						console.log("user mouse = " + userMouse[0].toFixed(3)
							+ " " + userMouse[1].toFixed(3));
						console.log("cur obj pos = " + curObjPos[0].toFixed(3)
							+ " " + curObjPos[1].toFixed(3));
					}
					console.log("stay in IDLE");
				}
				break;
			case this.statesEnum.DRAGGING:
				if (!mbut && lmbut) {
					this.state = this.statesEnum.IDLE;
					// snap piece to even number when let go
					const curObjPos = this.container[this.idx].pos;
					const snap = .25;
					curObjPos[0] = snap * Math.round(curObjPos[0] / snap);
					curObjPos[1] = snap * Math.round(curObjPos[1] / snap);
					this.idx = -1;
					console.log("switch to IDLE");
				}
				break;
		}
		// run states
		switch(this.state) {
			// update piece
			case this.statesEnum.DRAGGING:
				this.container[this.idx].pos = vec2.clone(this.user.plotter2d.userMouse);
				break;
		}
	}

	draw() {
		for (const so of this.container) {
			so.draw(this.user);
		}
	}
}

class Board {
	constructor(user, lineSegments, squares) {
		this.user = user;
		this.lineSegments = lineSegments;
		this.squares = squares;
	}

	checkCollision(pos) {
		this.collInfo = {
			// best choice
			pos: vec2.clone(pos),
			isPen: false,
		};
		const i = Math.round(pos[0] / 2) + 2;
		const j = Math.round(pos[1] / 2) + 1;
		if (i < 0 || i >= this.squares[0].length
		  || j < 0 | j >= this.squares.length
		  || !this.squares[j][i]) {
			// outside, find closest 'inside' square from 2D array
			let bestI = -1, bestJ = -1;
			let bestDist2 = Number.MAX_VALUE;
			for (let j = 0; j < this.squares.length; ++j) {
				for (let i = 0; i < this.squares[0].length; ++i) {
					if (this.squares[j][i]) {
						const sqCenter = [2 * i - 4, 2 * j - 2];
						const dist2 = vec2.sqrDist(sqCenter, pos);
						if (dist2 < bestDist2) {
							bestI = i;
							bestJ = j;
							bestDist2 = dist2;
						}
					}
				}
			}
			const sqCenter = [2 * bestI - 4, 2 * bestJ - 2];
			this.collInfo.pos[0] = range(sqCenter[0] - 1
				, this.collInfo.pos[0]
				, sqCenter[0] + 1);
			this.collInfo.pos[1] = range(sqCenter[1] - 1
				, this.collInfo.pos[1]
				, sqCenter[1] + 1);
			this.collInfo.isPen = true;
		}
		return this.collInfo;
	}

	draw() {
		// draw puzzle outline
		this.user.drawPrim.drawLinesParametric(this.lineSegments, .05, undefined, false, "black");
		const collPnt = this.collInfo.pos;
		this.user.drawPrim.drawCircle(collPnt, .1 ,"black");
		//for (const coll of this.collInfo.collArr) {
		//	this.user.drawPrim.drawCircle(coll.pos, .05 ,"cyan");
		//}
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

		// USER before UI built
		this.#userInit();

		const safe = .5;
		const extraWidth = 5 + safe; // show more left and right
		const extraHeight = 3 + safe;
		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER
		this.plotter2d = new Plotter2d(
			this.plotter2dCanvas, this.ctx, /*this.vp*/null
			, this.startCenter, this.startZoom,  null, extraWidth, extraHeight);
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

		// 'H' puzzle
		const pointsH = [
			[-5, -3],
			[-5, 3],
			[-3, 3],
			[-3, 1],
			[-1, 1],
			[-1, 3],
			[1, 3],
			[1, 1],
			[3, 1],
			[3, 3],
			[5, 3],
			[5, -3],
			[3, -3],
			[3, -1],
			[-3, -1],
			[-3, -3],
			[-5, -3]
		];

		const squaresH = [
			// upside down
			[true, false, false, false, true],
			[true, true, true, true, true],
			[true, false, true, false, true],
		];

		// test1 puzzle
		const pointsTest1 = [
			[-3, -3],
			[-3, 1],
			[3, 1],
			[3, -3],
			[-3, -3]
		];

		const squaresTest1 = [
			// upside down
			[false, true, true, true],
			[false, true, true, true]
		];

		// test2 puzzle
		const pointsTest2 = [
			[-3, -3],
			[-3, 1],
			[-1, 1],
			[-1, -1],
			[3, -1],
			[3, -3],
			[-3, -3]
		];

		const squaresTest2 = [
			[false, true, true, true],
			[false, true, false, false],
		];

		this.board = new Board(this, pointsH, squaresH);
		//this.board = new Board(this, pointsTest1, squaresTest1);
		//this.board = new Board(this, pointsTest2, squaresTest2);
	}

	#initPieces() {
		// slide objects and container
		const rad = .125;//.75;
		const safe = .95;
		this.pieceContainer = new PieceContainer(this, rad * safe);
		let slideObj = new Piece([-2, 0], rad, "red");
		this.pieceContainer.add(slideObj);
		slideObj = new Piece([-.5, 1.5], rad, "green");
		this.pieceContainer.add(slideObj);
		//slideObj = new Piece([4, -2], rad, "green");
		//this.pieceContainer.add(slideObj);
	}

	#userInit() {
		// user init section
		this.count = 0; // frame counter
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.#initBoard();
		this.#initPieces();

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = 1;
	}

	#userBuildUI() {
		if (window.isMobile) {
			makeEle(this.vp, "button", null, null, "Random color", this.#randomColor.bind(this));
			makeEle(this.vp, "br");
			makeEle(this.vp, "br");
			makeEle(this.vp, "button", null, null, "Reset Pieces", this.#initPieces.bind(this));
			this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
			makeEle(this.vp, "hr");
			{
				const label = "iterations";
				const min = 1;
				const max = 20;
				const start = 1;
				const step = 1;
				const precision = 0;
				new makeEleCombo(this.vp, label, min, max, start, step, precision,
					(v) => {
						this.iterations = v;
						this.dirty = true;
					}
				);
			}
			return;
		}
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
		this.avgFps = this.avgFpsObj.add(this.fps);


		this.pieceContainer.proc();
		const parr = this.pieceContainer.container;
		const p0 = parr[0].pos;
		const p1 = parr[1].pos;
		this.collInfo = this.board.checkCollision(p1);
		++this.count;
	}

	#userDraw() {
		// draw disc objects
		this.pieceContainer.draw();
		this.board.draw();

		// test, draw line between 2 pieces
		const parr = this.pieceContainer.container;
		const p0 = parr[0].pos;
		const p1 = parr[1].pos;
		this.drawPrim.drawLine(p0, p1, .05, "black");
		// end test

		// draw cursor, when pressed / touched
		if (this.input.mouse.mbut[Mouse.LEFT]) {
			const pnt = this.plotter2d.userMouse;
			const isDragging = this.pieceContainer.isDragging();
			if (isDragging) {
				this.drawPrim.drawCircleO(pnt, 2, .25, "black"); // test touch
				this.drawPrim.drawCircleO(pnt, 2, .05, "white"); // test touch

			} else {
				this.drawPrim.drawCircleO(pnt, 2, .0375, "gray"); // test touch
			}
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "\nFrame Count = " + this.count;
		countStr += "\nDirty Count = " + this.dirtyCount;
		countStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		countStr += "\n<span style='color: darkgreen; font-size: 1.25em'>"
			+ (this.collInfo.isPen
			? "&lt; outside &gt;"
			: "&lt; inside &gt;");
		countStr += "</span>"
		countStr += "\n";
		countStr += this.input.mouse.stats;
		if (this.eles.textInfoLog) {
			this.eles.textInfoLog.innerHTML = countStr;
		}
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT) || this.dirty;
		// USER: do USER stuff
		this.#userProc(); // proc
		//this.dirty = true; // test, always draw every frame
		//this.dirty = false;
		// draw when dirty
		if (this.dirty) {
			this.plotter2d.clearCanvas();
			// interact with mouse, calc all spaces
			// goto user/cam space
			this.plotter2d.setSpace(Plotter2d.spaces.USER);
			// now in user/cam space
			this.graphPaper.draw("X", "Y");
			// USER: do USER stuff
			this.#userDraw(); //draw
		}
		// update UI, text
		//if (!window.isMobile) {
			this.#userUpdateInfo();
		//}

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
