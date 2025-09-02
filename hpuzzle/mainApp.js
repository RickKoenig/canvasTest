'use strict';
class Piece {
	constructor(pos, rad, color) {
		this.pos = vec2.clone(pos);
		this.rad = rad;
		this.color = color;
	}

	draw(user, small) {
		if (small) {
			user.drawPrim.drawCircleO(this.pos, this.rad  * .25, .025, this.color);
			user.drawPrim.drawCircle(this.pos, this.rad  * .025, this.color);
		} else {
			user.drawPrim.drawCircle(this.pos, this.rad, this.color);
			user.drawPrim.drawCircle(this.pos, this.rad * .1, "black");
			if (this.mark) {
				user.drawPrim.drawCircle(this.pos, this.rad * .035, "white");
			}
		}
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
					const snap = .125;
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
		//for (const so of this.container) {
		for (let i = this.container.length - 1; i >= 0; --i) {
			const so = this.container[i];
			so.draw(this.user, i == 0);
		}
	}
}

class Board {
	constructor(user, lineSegments, squares, pieceRad) {
		this.user = user;
		this.lineSegments = lineSegments;
		this.squares = squares;
		this.pieceRad = pieceRad;
	}

	// see if a square in the direction, true or false
	#checkSquareDir(i, j, di, dj) {
		i += di;
		j += dj;
		return (i >= 0 && i < this.squares[0].length
		  & j >= 0 && j < this.squares.length
		  && this.squares[j][i]);

	}

	checkCollision(pos) {
		this.collInfo = {
			// best choice
			pos: vec2.clone(pos),
			flip0: false,
			flip1: false,
			quad1: [0, 0],
			mark: false
		};
		let pi = Math.round(pos[0] / 2) + 2;
		let pj = Math.round(pos[1] / 2) + 1;
		let sqPos = vec2.create();
		let sqCenter;
		if (this.#checkSquareDir(pi, pj, 0, 0)) {

			// inside, goto square space
			sqCenter = [2 * pi - 4, 2 * pj - 2];
			vec2.sub(sqPos, this.collInfo.pos, sqCenter);
		} else {

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
			pi = bestI;
			pj = bestJ;

			// go inside closest square's space
			sqCenter = [2 * pi - 4, 2 * pj - 2];
			sqPos = vec2.create();
			vec2.sub(sqPos, this.collInfo.pos, sqCenter);
			// clip to inside square
			sqPos[0] = range(-1, sqPos[0], 1);
			sqPos[1] = range(-1, sqPos[1], 1);
		}

		// now move inside the square, maybe closer to the center
		const pathWidth = 1 - this.pieceRad; // for each side

		// calc quadrant
		//this.collInfo.quadrant = 0;
		this.collInfo.flip0 = sqPos[0] < 0;
		this.collInfo.flip1 = sqPos[1] < 0;
		// move to quadrant space
		const dir = vec2.fromValues(1, 1); // default direction
		if (this.collInfo.flip0) {
			sqPos[0] = -sqPos[0];
			dir[0] = -dir[0];
		}
		if (this.collInfo.flip1) {
			sqPos[1] = -sqPos[1];
			dir[1] = -dir[1];
		}

		vec2.scale(this.collInfo.quad1, dir, .5);
		vec2.add(this.collInfo.quad1, sqCenter, this.collInfo.quad1);

		// calc connect
		const rightOpen = this.#checkSquareDir(pi, pj, dir[0], 0);
		const topOpen = this.#checkSquareDir(pi, pj, 0, dir[1]);

		if (rightOpen && topOpen) {
			// special, concave section
			//if (false) {
 			// if diagonal, no restrictions, everything open
 			if (!this.#checkSquareDir(pi, pj, dir[0], dir[1])) {
				// concave corner, try circle arc
				/*if (sqPos[0] > pathWidth && sqPos[0] < 1 
				  && sqPos[1] > pathWidth && sqPos[1] < 1) {
					let dist = vec2.length(sqPos);
					dist = Math.min(1, dist - pathWidth);
					this.collInfo.circlePart = true;
					//dist = 1;
					vec2.scale(sqPos, sqPos, 1);
				}*/

 				// no diagonal, concave corner
				if (sqPos[0] > pathWidth && sqPos[0] < 1
				  && sqPos[1] > pathWidth && sqPos[1] < 1) {
					// circle arc
					const dist = vec2.dist(sqPos, [1, 1]);
					if (dist < this.user.pieceRad) {
						this.collInfo.mark = true;
						// make piece be pieceRad distance from corner [1, 1]
						vec2.sub(sqPos, [1, 1], sqPos);
						vec2.scale(sqPos, sqPos, this.user.pieceRad / dist);
						vec2.sub(sqPos, [1, 1], sqPos);
					}
				} else { // concave sides, pick closest one
					if (sqPos[0] > sqPos[1]) {
						sqPos[1] = Math.min(sqPos[1], pathWidth);
					} else {
						sqPos[0] = Math.min(sqPos[0], pathWidth);
					}
				}
			}
		} else {
			if (!rightOpen) {
				sqPos[0] = Math.min(sqPos[0], pathWidth);
			}
			if (!topOpen) {
				sqPos[1] = Math.min(sqPos[1], pathWidth);
			}
		}

		/*
		const connect = this.#checkSquareDir(pi, pj, dir[0], dir[1]);
		if (!connect) {
			// no connecting path, more restrictions
			sqPos[0] = Math.min(sqPos[0], pathWidth);
		}
		sqPos[1] = range(-pathWidth, sqPos[1], pathWidth);
		*/

		// go back to square space
		if (this.collInfo.flip0) {
			sqPos[0] = -sqPos[0];
		}
		if (this.collInfo.flip1) {
			sqPos[1] = -sqPos[1];
		}

		// go back to user space
		vec2.add(this.collInfo.pos, sqPos, sqCenter);
		this.collInfo.sqCenter = vec2.clone(sqCenter);	
		return this.collInfo;
	}

	draw() {
		// draw puzzle outline
		this.user.drawPrim.drawLinesParametric(this.lineSegments, .05, undefined, false, "black");
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

		const safe = .75;
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
			[-5, -3],
			[-5, 1],
			[1, 1],
			[1, -3],
			[-5, -3]
		];

		const squaresTest1 = [
			[true, true, true],
			[true, true, true]
		];

		// test2 puzzle
		const pointsTest2 = [
			[-5, -3],
			[-5, 1],
			[-3, 1],
			[-3, -1],
			[1, -1],
			[1, -3],
			[-5, -3]
		];

		const squaresTest2 = [
			// upside down
			[true, true, true],
			[true, false, false],
		];

		// test3 puzzle
		const pointsTest3 = [
			[-5, -3],
			[-5, -1],
			[-1, -1],
			[-1, 1],
			[-3, 1],
			[-3, -3],
			[-5, -3]
		];

		const squaresTest3 = [
			// upside down
			[true, false],
			[false, true]
		];

		// test4 puzzle
		const pointsTest4 = [
			[-5, -3],
			[-5, -1],
			[-1, -1],
			[-1, -3],
			[-5, -3],
		];

		const squaresTest4 = [
			// upside down
			[true, true]
		];

		this.boards = [
			{
				lineSegments: pointsH,
				squares: squaresH
			}, {
				lineSegments: pointsTest1,
				squares: squaresTest1
			}, {
				lineSegments: pointsTest2,
				squares: squaresTest2
			}, {
				lineSegments: pointsTest3,
				squares: squaresTest3
			}, {
				lineSegments: pointsTest4,
				squares: squaresTest4
			}
		];

		this.curBoard = 0;
		const board = this.boards[this.curBoard];
		this.board = new Board(this, board.lineSegments, board.squares, this.pieceRad);
	}

	#nextBoard() {
		++this.curBoard;
		if (this.curBoard >= this.boards.length) {
			this.curBoard -= this.boards.length;
		}
		const board = this.boards[this.curBoard];
		this.board = new Board(this, board.lineSegments, board.squares, this.pieceRad);
	}

	#prevBoard() {
		--this.curBoard;
		if (this.curBoard < 0) {
			this.curBoard += this.boards.length;
		}
		const board = this.boards[this.curBoard];
		this.board = new Board(this, board.lineSegments, board.squares, this.pieceRad);
	}

	#initPieces() {
		// slide objects and container
		const rad = this.pieceRad;
		const safe = .95; // select more inside circle radius
		const pieceDataArr = [
			{ pos: [-2, 0],
				color: "red"
			}, {
				pos: [-.5, 1.5],
				color: "#0f04"
			}
		];
		this.pieceContainer = new PieceContainer(this, rad * safe);
		for (const pieceData of pieceDataArr) {
			let slideObj = new Piece(pieceData.pos, rad, pieceData.color);
			this.pieceContainer.add(slideObj);
		}
	}

	#userInit() {
		// user init section
		this.count = 0; // frame counter
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.pieceRad = .75;
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
			makeEle(this.vp, "br");
			makeEle(this.vp, "br");
			makeEle(this.vp, "button", null, null, "next board", this.#nextBoard.bind(this));
			makeEle(this.vp, "button", null, null, "prev board", this.#prevBoard.bind(this));

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

		// keep points inside
		const parr = this.pieceContainer.container;
		//for (let i = 0; i < parr.length; ++i) {
			this.collInfo = this.board.checkCollision(parr[0].pos);
			parr[1].pos = this.collInfo.pos;
			parr[1].mark = this.collInfo.mark;
		//}

		++this.count;
	}

	#userDraw() {
		// draw disc objects
		this.pieceContainer.draw();
		this.board.draw();

		// test, draw line between 2 pieces
		/*
		const parr = this.pieceContainer.container;
		const p0 = parr[0].pos;
		const p1 = parr[1].pos;
		this.drawPrim.drawLine(p0, p1, .05, "black");
		*/
		this.drawPrim.drawLine(this.collInfo.sqCenter
			, this.collInfo.quad1, .0375, "#8884");
		this.drawPrim.drawCircleO(this.collInfo.quad1, .1, .025, "black");
		if (this.collInfo.circlePart) {
			this.drawPrim.drawCircle([-2, 2], .2, "purple");
		}

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
		let infoStr = "\nInfo";
		infoStr += "\ncur board = " + this.curBoard;
		infoStr += "\nflip0 = " + this.collInfo.flip0 + " \nflip1 = " + this.collInfo.flip1;
		if (this.eles.textInfoLog) {
			this.eles.textInfoLog.innerHTML = infoStr;
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
