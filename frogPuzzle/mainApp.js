'use strict';
class Piece {
	constructor(pos, leftFace) {
		this.pos = vec2.clone(pos);
		this.leftFace = leftFace;
		this.canMove = false;
	}

	draw(user, rad) {
		const pos = [this.pos[0] - rad, this.pos[1] - rad];
		const scale = [rad * 2, rad * 2];
		if (this.leftFace) {
			user.drawPrim.drawImage(user.frogBlue, pos, scale, true); // look left
		} else {
			user.drawPrim.drawImage(user.frogGreen, pos, scale);
		}
		if (this.canMove) {
			user.drawPrim.drawCircle(this.pos, rad * .25, "black"); // reference dot
		}
	}
}

class PieceContainer {
	// pieces are on even 'x' numbers from -8 to +8
	constructor(user, selectDist) {
		this.user = user;
		this.selectDist = selectDist;
		this.container = [];
	    this.statesEnum = makeEnum(["IDLE", "DRAGGING"]);
		this.state = this.statesEnum.IDLE;
		this.idx = -1; // which object in container is being dragged
		this.min = -8;
		this.max = 8;
		this.step = 2;
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
		for (const curPiece of this.container) {
			if (curPiece.canMove) {
				return false;
			}
		}
		return true;
	}

	getWinner() {
		if (this.state == this.statesEnum.DRAGGING) {
			return false;
		}
		// see if winner
		let winGood = 0;
		const parr = this.container;
		for (let i = 0; i < 8; ++i) {
			if (parr[i].pos[0] > 0 && !parr[i].leftFace) {
				++winGood;
			} else if (parr[i].pos[0] < 0 && parr[i].leftFace) {
				++winGood;
			}
		}
		return winGood == 8;
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
						const dist = Math.abs(userMouse[0] - curObjPos[0]);
						if (curPiece.canMove && dist < this.selectDist) {
							this.state = this.statesEnum.DRAGGING;
							this.idx = i;
							this.#setBounds();
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
					// find closest left, middle, right
					if (2 * x < this.left + this.middle) {
						x = this.left;
					} else if (2 * x > this.middle + this.right) {
						x = this.right;
					} else {
						x = this.middle;
					}
					curObjPos[0] = x;
					curObjPos[1] = 0;
					console.log("switch to IDLE");
				}
				break;
		}
		// run states
		this.#setCanMove();
		switch(this.state) {
			// update piece
			case this.statesEnum.DRAGGING:
				const curPiece = this.container[this.idx];
				let mousePosX = this.user.plotter2d.userMouse[0];
				// keep within bounds
				mousePosX = range(this.left, mousePosX, this.right);
				curPiece.pos[0] = mousePosX;
				const moveDistRight = this.right - this.middle;
				const moveDistLeft = this.left - this.middle;
				if (moveDistRight == 2 * this.step) {
					curPiece.pos[1] = this.#parabola(mousePosX - this.middle);
				} else if (moveDistLeft == -2 * this.step) {
					curPiece.pos[1] = this.#parabola(this.middle - mousePosX);
				} else {
					curPiece.pos[1] = 0;
				}
				break;
		}
		return 1;
	}

	draw() {
		// reverse order
		for (let i = this.container.length - 1; i >= 0; --i) {
			const so = this.container[i];
			so.draw(this.user, this.selectDist);
		}
	}
	// pass in even integers
	#checkOpen(x) {
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

	#setCanMove() {
		for (const curPiece of this.container) {
			curPiece.canMove = false;
		}
		if (this.state == this.statesEnum.IDLE) {
			for (const curPiece of this.container) {
				const x = curPiece.pos[0];
				if (curPiece.leftFace) {
					if (this.#checkOpen(x - this.step)) {
						curPiece.canMove = true;
					} else if (this.#checkOpen(x - 2 * this.step)) {
						curPiece.canMove = true;
					}
				} else { // rightFace
					if (this.#checkOpen(x + this.step)) {
						curPiece.canMove = true;
					} else if (this.#checkOpen(x + 2 * this.step)) {
						curPiece.canMove = true;
					}
				}
			}
		}
	}

	#setBounds() {
		// find if a frog can move to a left or right open square
		const curPiece = this.container[this.idx];
		const x = curPiece.pos[0];
		// calc left opening
		const left1 = this.#checkOpen(x - this.step);
		const left2 = this.#checkOpen(x - 2 * this.step);
		if (left1) {
			this.left = x - this.step; // move 1 to the left
		} else if (left2) {
			this.left = x - 2 * this.step; // jump 2 to the left
		} else {
			this.left = x;
		}
		this.middle = x;
		// calc right opening
		const right1 = this.#checkOpen(x + this.step);
		const right2 = this.#checkOpen(x + 2 * this.step);
		if (right1) {
			this.right = x + this.step; // move 1 to the left
		} else if (right2) {
			this.right = x + 2 * this.step; // jump 2 to the left
		} else {
			this.right = x;
		}
		if (!this.bothDir) { // only allow green frogs to move to the right etc.
			if (curPiece.leftFace) {
				this.right = x;
			} else {
				this.left = x;
			}
		}
	}

	// arc of the jump
	#parabola(x) {
		return x * (4 - x) * .5;
	}
}

class Board {
	constructor(user, lineSegments, pieceRad) {
		this.user = user;
		this.lineSegments = lineSegments;
		this.pieceRad = pieceRad;
	}

	draw() {
		// draw puzzle outline
		this.user.drawPrim.drawLinesParametric(this.lineSegments, .05, undefined, false, "black");
		// hardcoded for 9 by 1 board
		for (let i = -4; i <= 4; ++i) {
			this.user.drawPrim.drawRectangleCenter([2 * i, 0], [1.6, 1.6], "#0003");
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

		// load svg images
		this.#loadSvgs("frog", "../fourier/frog");

		// load a badge bitmap
		this.bm = new Image();
		//this.bm.onload = () => this.bmLoaded = true;
		this.bm.onerror = function(e) {
        	console.error('Error loading bm image!');
			console.log(e);
    	};		
		this.bm.src = '../../engw/common/sptpics/wonMedal.png';

		// USER before UI built
		this.#userInit();

		const safe = .25;
		const extraWidth = 9 + safe; // show more left and right
		const extraHeight = 5 + safe;
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

	#loadSvgs(baseSvg, baseName) {
		const exts = [
			//"",
			"Green",
			"Blue"
		];
		for (const ext of exts) {
			this.#load1Svg(baseSvg + ext, baseName + ext + ".svg");
		}
	}

	#load1Svg(svg, name) {
		const img = new Image();
		this[svg] = img;
		img.onerror = function(e) {
        	console.error('Error loading ' + svg +  ' image!');
			console.log(e);
    	};		
		img.src = name;

	}

	#randomColor() {
		const r = getRandomInt(256);
		const g = getRandomInt(256);
		const b = getRandomInt(256);
		this.vp.style.background = `rgb(${r}, ${g}, ${b}`;
	}

	#initBoard() {
		// frog puzzle
		const pointsFrog = [
			[-9, -1],
			[-9, 1],
			[9, 1],
			[9, -1],
			[-9, -1]
		];

		this.boards = [
			{
				lineSegments: pointsFrog,
			}
		];

		this.curBoard = 0;
		const board = this.boards[this.curBoard];
		this.board = new Board(this, board.lineSegments, this.pieceRad);
	}

	#initPieces() {
		// slide objects and container
		const dist = this.pieceDist;
		const safe = .95; // select more inside circle radius
		const pieceDataArr = [
			{ 
				pos: [-8, 0],
				leftFace: false
			}, {
				pos: [-6, 0],
				leftFace: false
			}, {
				pos: [-4, 0],
				leftFace: false
			}, { 
				pos: [-2, 0],
				leftFace: false
			}, { 
				pos: [2, 0],
				leftFace: true
			}, {
				pos: [4, 0],
				leftFace: true
			}, { 
				pos: [6, 0],
				leftFace: true
			}, { 
				pos: [8, 0],
				leftFace: true
			}
		];
		const pieceDataArrTest = [
			{ 
				pos: [-4, 0],
				leftFace: false
			}, {
				pos: [4, 0],
				leftFace: false
			}, {
				pos: [6, 0],
				leftFace: false
			}, { 
				pos: [8, 0],
				leftFace: false
			}, { 
				pos: [-8, 0],
				leftFace: true
			}, {
				pos: [-6, 0],
				leftFace: true
			}, { 
				pos: [-2, 0],
				leftFace: true
			}, { 
				pos: [2, 0],
				leftFace: true
			}
		];
		this.pieceContainer = new PieceContainer(this, dist * safe);
		for (const pieceData of pieceDataArr) {
			let slideObj = new Piece(pieceData.pos, pieceData.leftFace);
			this.pieceContainer.add(slideObj);
		}
		this.winner = false;
		this.loser = false;
	}

	#userInit() {
		// user init section
		this.winCount = 0; // frame counter
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.pieceDist = .9; // how tight the fit is, IMPORTANT
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
			makeEle(this.vp, "hr");
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
		this.winner |= this.pieceContainer.getWinner();
		if (this.winner) {
			this.loser = false;
		} else {
			this.loser = this.pieceContainer.getLoser();
		}
		if (this.winner) {
			if (this.winCount < 360) {
				++this.winCount;
			}
		} else {
			this.winCount = 0;
		}
	}

	#userDraw() {
		this.ctx.save();
		this.ctx.translate(0, -.5);
		// draw disc objects
		this.pieceContainer.draw();
		this.board.draw();
		// draw cursor, when pressed / touched
		if (this.input.mouse.mbut[Mouse.LEFT]) {
			const pnt = vec2.clone(this.plotter2d.userMouse);
			pnt[1] = 0;
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
		const textScale = [2, .15];
		const textYStart = -1.5;
		const textYstep = -.9;
		this.drawPrim.drawText([0, textYStart], textScale
		  , "Move green frogs to the right"
		  , "black", "#0002");
		this.drawPrim.drawText([0, textYStart + textYstep], textScale
		  , "Move blue frogs to the left"
		  , "black", "#0002");
		this.drawPrim.drawText([0, textYStart + 2 * textYstep], textScale
		  , landscape ? "Landscape mode" : "Portrait mode"
		  , "#000c", "#0002");
		if (!landscape) {
			this.drawPrim.drawText([0, textYStart + 3 * textYstep], textScale
			  , "Landscape mode looks better"
		  	  , "darkred", "#0002");
		}
		if (this.loser) {
			this.drawPrim.drawText([0, 3], [1, .15]
			, "OOPS !!"
			, "darkred", "#0002");
		}
		const scale = .125 + this.winCount * .015;
		const offset = -scale / 2;

		if (this.winCount > 0) {
			this.drawPrim.drawImage(this.bm, [offset, 3.5 + offset], [scale, scale]);
		}
		this.ctx.restore();
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "\nInfo";
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
