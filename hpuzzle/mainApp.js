'use strict';
class Piece {
	constructor(pos, rad, color) {
		this.pos = vec2.clone(pos);
		this.rad = rad;
		this.color = color;
	}

	draw(user) {
		user.drawPrim.drawCircle(this.pos, this.rad, this.color);
		user.drawPrim.drawCircle(this.pos, this.rad * .05, "black");
	}
}

class PieceContainer {
	constructor(user, selectRad) {
		this.user = user;
		this.selectRad2 = selectRad * selectRad;
		this.container = [];
	    this.statesEnum = makeEnum(["IDLE", "DRAGGING"]);
		this.state = this.statesEnum.IDLE;
		this.idx = -1; // which object in container is being dragged
		this.startDragPos = null;
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
							this.startDragPos = vec2.clone(this.user.plotter2d.userMouse);
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
					const snap = 2;
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
		// reverse order
		for (let i = this.container.length - 1; i >= 0; --i) {
			const so = this.container[i];
			so.draw(this.user);
		}
	}
}

class Board {
	constructor(user, lineSegments, squares, pieceRad) {
		this.user = user;
		this.lineSegments = lineSegments;
		this.squares = squares;
		this.origSquares = clone(squares);
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
		// mark pieces on board as filled
		this.squares = clone(this.origSquares);
		const pieceCont = this.user.pieceContainer;
		const cont = pieceCont.container;
		for (let i = 0; i < cont.length; ++i) {
			if (i != pieceCont.idx) {
				let pi = Math.round(cont[i].pos[0] / 2) + 2;
				let pj = Math.round(cont[i].pos[1] / 2) + 1;
				this.squares[pj][pi] = false;
			}
		}
		this.collInfo = {
			// best choice
			pos: vec2.clone(pos),
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
		const flip0 = sqPos[0] < 0;
		const flip1 = sqPos[1] < 0;
		// move to quadrant space
		const dir = vec2.fromValues(1, 1); // default direction
		if (flip0) {
			sqPos[0] = -sqPos[0];
			dir[0] = -dir[0];
		}
		if (flip1) {
			sqPos[1] = -sqPos[1];
			dir[1] = -dir[1];
		}
		const quad = vec2.create();
		vec2.scale(quad, dir, .5);
		vec2.add(quad, sqCenter, quad);

		// calc connect
		const rightOpen = this.#checkSquareDir(pi, pj, dir[0], 0);
		const topOpen = this.#checkSquareDir(pi, pj, 0, dir[1]);

		if (rightOpen && topOpen) {
			// special, concave section
 			// if diagonal, no restrictions, everything open
 			if (!this.#checkSquareDir(pi, pj, dir[0], dir[1])) {
				// concave corner, try circle arc
 				// no diagonal, concave corner
				if (sqPos[0] > pathWidth && sqPos[0] < 1
				  && sqPos[1] > pathWidth && sqPos[1] < 1) {
					// circle arc
					const dist = vec2.dist(sqPos, [1, 1]);
					if (dist < this.user.pieceRad) {
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

		// go back to square space
		if (flip0) {
			sqPos[0] = -sqPos[0];
		}
		if (flip1) {
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

		const safe = .25;
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
			{ 
				pos: [-4, -2],
				color: "#0b0e"
			}, {
				pos: [-4, 0],
				color: "#0b0e"
			}, { 
				pos: [-4, 2],
				color: "#0b0e"
			}, { 
				pos: [4, -2],
				color: "#00fe"
			}, {
				pos: [4, 0],
				color: "#00fe"
			}, { 
				pos: [4, 2],
				color: "#00fe"
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
		this.winCount = 0; // frame counter
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.pieceRad = .875; // how tight the fit is, IMPORTANT
		this.#initBoard();
		this.#initPieces();

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = 1;
	}

	#userBuildUI() {
		if (window.isMobile) {
			makeEle(this.vp, "hr");
			makeEle(this.vp, "br");
			makeEle(this.vp, "button", null, null, "Reset Pieces", this.#initPieces.bind(this));
			makeEle(this.vp, "br");
			makeEle(this.vp, "br");
			makeEle(this.vp, "button", null, null, "Random color", this.#randomColor.bind(this));
			this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
			this.stepRat = .10;
			this.iterations = 40;
			makeEle(this.vp, "hr");
/*			{
				const label = "iterations";
				const min = 1;
				const max = 100;
				const start = 40;
				const step = 1;
				const precision = 0;
				new makeEleSliderCombo(this.vp, label, min, max, start, step, precision,
					(v) => {
						this.iterations = v;
						this.dirty = true;
					}
				);
			}
			makeEle(this.vp, "hr");
			{
				const label = "step ratio";
				const min = .01;
				const max = .99;
				const start = .10;
				const step = .01;
				const precision = 2;
				new makeEleSliderCombo(this.vp, label, min, max, start, step, precision,
					(v) => {
						this.stepRat = v;
						this.dirty = true;
					}
				);
			}
			makeEle(this.vp, "br");
			makeEle(this.vp, "br");
			makeEle(this.vp, "button", null, null, "next board", this.#nextBoard.bind(this));
			makeEle(this.vp, "button", null, null, "prev board", this.#prevBoard.bind(this));
*/
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

		// keep pieces inside board puzzle
		const parr = this.pieceContainer.container;
		let halfPoint = null;
		if (this.pnts && this.pnts.length > 0) {
			halfPoint = vec2.clone(this.pnts[Math.floor(this.pnts.length / 2)]);
		}
		this.pnts = [];
		const idx = this.pieceContainer.idx;
		if (idx >= 0) { // dragging piece idx
			let walk;
			if (halfPoint) {
				walk = vec2.clone(halfPoint);
			} else {
				walk = vec2.clone(this.pieceContainer.startDragPos);
			}
			walk = this.board.checkCollision(walk).pos;
			this.pnts.push(vec2.clone(walk));
			const diff = vec2.create();
			for (let i = 1; i < this.iterations; ++i) {
				vec2.sub(diff, parr[idx].pos, walk);
				vec2.scale(diff, diff, this.stepRat);
				vec2.add(walk, walk, diff);
				walk = this.board.checkCollision(walk).pos;
				this.pnts.push(vec2.clone(walk));
			}
			parr[idx].pos = vec2.clone(walk); // set result
		}

		// see if winner
		let winGood = 0;
		// green right
		for (let i = 0; i < 3; ++i) {
			if (parr[i].pos[0] == 4) {
				++winGood;
			}
		}
		// blue left
		for (let i = 3; i < 6; ++i) {
			if (parr[i].pos[0] == -4) {
				++winGood;
			}
		}
		if (winGood == 6) {
			if (this.winCount < 360) {
			++this.winCount;
			}
		} else {
			this.winCount = 0;
		}
	}

	#userDraw() {
		// draw disc objects
		this.pieceContainer.draw();
		this.board.draw();
		// draw cursor, when pressed / touched
		if (this.input.mouse.mbut[Mouse.LEFT]) {
			const pnt = this.plotter2d.userMouse;
			const isDragging = this.pieceContainer.isDragging();
			if (isDragging) {
				// touch selected
				this.drawPrim.drawCircleO(pnt, 2, .25, "black");
				this.drawPrim.drawCircleO(pnt, 2, .05, "white");

			} else {
				// touch NOT selected
				this.drawPrim.drawCircleO(pnt, 2, .0375, "gray");
			}
		}
		const landscape = this.plotter2dCanvas.width > this.plotter2dCanvas.height;
		this.drawPrim.drawText([0, -1.3], [1.82, .14]
		  , "Move green circles to the right"
		  , "black", "#0002");
		this.drawPrim.drawText([0, -1.8], [1.82, .14]
		  , "Move blue circles to the left"
		  , "black", "#0002");
		if (!landscape) {
			this.drawPrim.drawText([0, -2.3], [1.82, .14]
			  , "Landscape mode looks better"
		  	  , "darkred", "#0002");
		}
		this.drawPrim.drawText([0, -2.8], [1.2, .14]
		  , landscape ? "Landscape mode" : "Portrait mode"
		  , "#000c", "#0002");
		const scaleWinText = [1, .2];
		vec2.scale(scaleWinText, scaleWinText, .125 + this.winCount * .006);
		if (this.winCount > 0) {
			this.drawPrim.drawText([0, 0],scaleWinText
		  	  , "You Win !!"
		  	  , "black", "#0002");
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "\nInfo";
		//infoStr += "\ncur board = " + this.curBoard;
		infoStr += "\nfps = " + this.avgFps.toFixed(3) + "\n\n";
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
