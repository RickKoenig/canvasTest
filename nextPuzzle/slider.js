'use strict';

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

		//const startLevel = "levelm";
		//const startLevel = "levele";
		//const startLevel = "smallheart";
		//const startLevel = "level07";
		const startLevel = "verysmall";
		this.curBoard = pieceData.pieceDataArrArr.findIndex(user => user.name === startLevel);
		this.curBoard = Math.max(0, this.curBoard);
		console.log("start on level = " + startLevel);

		// build pieces


		// modify some pieceData
		const touchUpLevel07 = pieceData.pieceDataArrArr.find(user => user.name === "level07");
		// add complicated border to level07, towers of hanoi puzzle
		// top border
		for (let j = 0; j < 5; ++j) {
			for (let i = 0; i < 11 - j; ++i) {
				touchUpLevel07.piecePos.push({pos: [i, j], id: -1, color: "black", shapeData: pieceData.shapes.sq1});

			}
		}
		// bottom border
		for (let j = 9; j >= 6; --j) {
			for (let i = -j + 13; i < 2 + j; ++i) {
				touchUpLevel07.piecePos.push({pos: [i, j], id: -1, color: "black", shapeData: pieceData.shapes.sq1});
			}
		}

		// sort piecedata by id's and position
		PieceContainer.sortPieceData();

		//this.pIdx = -1;
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
		console.log("initpieces, curboard = " + this.curBoard);
		// slide objects and container
		this.pieceSize = .875;
		this.maxDepth = 200;
		this.maxConf = 20000;
		
		this.curPieceData = pieceData.pieceDataArrArr[this.curBoard];
		this.boardX = this.curPieceData.boardSize[0];
		this.boardY = this.curPieceData.boardSize[1];
	
		this.pieceContainer = new PieceContainer(this, this.curPieceData
			, this.boardX, this.boardY, this.pieceSize, this.maxDepth, this.maxConf);
		this.winner = false;
		this.loser = false;
	}

	#nextBoard(dir) {
		console.log("next board with " + dir);
		this.curBoard = moveWrap(this.curBoard, pieceData.pieceDataArrArr.length, dir);
		this.#userInit();
		this.#resetGraphics();
	}

	#resetPieces() {
		this.pieceContainer.resetPieces();
	}

	#nextConf(dir) {
		console.log("next configuration with " + dir);
		this.pieceContainer.changeConf(dir);
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
		makeEle(this.vp, "button", null, null, "Reset Pieces", this.#resetPieces.bind(this));
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
		makeEle(this.vp, "hr");
		makeEle(this.vp, "button", null, null, "Next conf", this.#nextConf.bind(this, 1));
		makeEle(this.vp, "button", null, null, "Prev conf", this.#nextConf.bind(this, -1));
	}		
	
	#userProc() {
		// proc
		const mbut = this.input.mouse.mbut[Mouse.LEFT];
		const lastmbut = this.input.mouse.lmbut[Mouse.LEFT];
		if (!this.pieceContainer.isDragging() && this.pieceContainer.idx != null && this.pieceContainer.idx >= 0) {
			let dir = null;
			switch(this.input.keyboard.key) {
				case  keyTable.keyCodes.LEFT:
					dir = [-1, 0];
					break;
				case  keyTable.keyCodes.RIGHT:
					dir = [1, 0];
					break;
				case  keyTable.keyCodes.DOWN:
					dir = [0, -1];
					break;
				case  keyTable.keyCodes.UP:
					dir = [0, 1];
					break;
			}
			if (dir) {
				const newIdx = PieceContainer.snapMovePiece(
					dir
					, this.pieceContainer.container, this.pieceContainer.posContainer, this.pieceContainer.idx
					,this.boardX, this.boardY);
				if (newIdx != null) this.pieceContainer.idx = newIdx;
			}
		}
		this.pieceContainer.proc(mbut, lastmbut, this.plotter2d.userMouse);

		this.goals = this.pieceContainer.getGoalsMet(this.pieceContainer.posContainer);
		if (this.goals[1] == 0) {
			this.winner =  false; // can't win if no goals
		} else {
			this.winner = this.goals[0] == this.goals[1];
		}


		if (this.winner) {
			this.loser = false;
		} else {
			this.loser = PieceContainer.getLoser();
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
				const curPntPos = this.pieceContainer.posContainer[this.pieceContainer.idx];
				const sum = vec2.create();
				vec2.sub(sum, curPntPos, this.pieceContainer.dragOffset);
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
		infoStr += "\nboard = " + this.curPieceData.name + "\nboardidx = " + this.curBoard;
		
		infoStr += "\nmaxDepth = " + this.maxDepth;
		infoStr += "\nmaxConf = " + this.maxConf;
		
		infoStr += "\nstate = " + this.pieceContainer.statesEnumStrs[this.pieceContainer.state];
		infoStr += "\ngoals = " + this.goals[0] + " / " + this.goals[1];
		infoStr += "\npIdx = " + this.pieceContainer.idx;
		infoStr += "\nconf = " + this.pieceContainer.curConf + " / " + this.pieceContainer.posContainers.length;
		infoStr += "\n\nAvg fps = " + this.AvgFps.toFixed(2);
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
