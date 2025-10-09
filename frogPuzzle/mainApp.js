'use strict';
class Piece {
	constructor(pos, rad, color) {
		this.pos = vec2.clone(pos);
		this.rad = rad;
		this.color = color;
	}

	draw(user) {
		const pos = [this.pos[0] - this.rad, this.pos[1] - this.rad];
		const scale = [this.rad * 2, this.rad * 2];
		if (this.color == "green") {
			user.drawPrim.drawImage(user.frogGreen, pos, scale);
		} else if (this.color == "blue") {
			user.drawPrim.drawImage(user.frogBlue, pos, scale, true); // look left
		}
		user.drawPrim.drawCircle(this.pos, this.rad * .15, "black"); // reference dot
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
	constructor(user, lineSegments, pieceRad) {
		this.user = user;
		this.lineSegments = lineSegments;
		this.pieceRad = pieceRad;
	}

	checkCollision(pos) {
		// mark pieces on board as filled
		this.squares = clone(this.origSquares);
		const pieceCont = this.user.pieceContainer;
		const cont = pieceCont.container;
		const sdp = this.user.pieceContainer.startDragPos;
		this.collInfo = {
			// best choice
			pos: vec2.clone(pos),
		};
		this.collInfo.pos[1] = 0;
		this.collInfo.pos[0] = range(-8, this.collInfo.pos[0], 8);
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

		// load an svg image
		this.#loadSvg("frog", "../fourier/frog");

		// USER before UI built
		this.#userInit();

		const safe = .25;
		const extraWidth = 9 + safe; // show more left and right
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

	#loadSvg(baseSvg, baseName) {
		const exts = [
			"",
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
		//this.svgBlue.onload = () => this.svgBlueLoaded = true;
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
		const rad = this.pieceRad;
		const safe = .95; // select more inside circle radius
		const pieceDataArr = [
			{ 
				pos: [-8, 0],
				color: "green"
			}, {
				pos: [-6, 0],
				color: "green"
			}, {
				pos: [-4, 0],
				color: "green"
			}, { 
				pos: [-2, 0],
				color: "green"
			}, { 
				pos: [2, 0],
				color: "blue"
			}, {
				pos: [4, 0],
				color: "blue"
			}, { 
				pos: [6, 0],
				color: "blue"
			}, { 
				pos: [8, 0],
				color: "blue"
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
		if (idx >= 0) { // dragging piece 0
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

		/*
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
		*/
		const winGood = 0;
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
		this.drawPrim.drawText([0, -1.5], [1.82, .14]
		  , "Move green frogs to the right"
		  , "black", "#0002");
		this.drawPrim.drawText([0, -2], [1.82, .14]
		  , "Move blue frogs to the left"
		  , "black", "#0002");
		if (!landscape) {
			this.drawPrim.drawText([0, -2.5], [1.82, .14]
			  , "Landscape mode looks better"
		  	  , "darkred", "#0002");
		}
		this.drawPrim.drawText([0, -3], [1.2, .14]
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
