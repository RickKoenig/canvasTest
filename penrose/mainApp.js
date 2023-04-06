'use strict';

// a Penrose tile
class Tile {
	constructor(pos, rot = 0, fat = false, colMul = 1) {
		if (pos) {
			this.pos = vec2.clone(pos);
		} else {
			this.pos = vec2.create();
		}
		this.rot = rot;
		this.fat = fat;
		let ang;
		if (fat) {
			ang = 72;
			this.col = "darkolivegreen";
		} else {
			ang = 36;
			this.col = "darkgreen";
		}
		ang = degToRad(ang);
		const sa = .5 * Math.sin(ang);
		const ca = .5 * Math.cos(ang);

		this.pnts = [
			[-.5 - ca, -sa],
			[-.5 + ca,  sa],
			[ .5 + ca,  sa],
			[ .5 - ca, -sa]
		];

		this.colMul = colMul;
	}

	draw(drawPrim) {
		const ctx = drawPrim.ctx;
		//const aPoly = [[-.5, 0], [0, .25], [.5, 0], [0, -.25]];
		ctx.save();
		ctx.translate(this.pos[0], this.pos[1]);
		ctx.rotate(this.rot);
		drawPrim.drawPoly(this.pnts, .025, Bitmap32.colorMul(this.col, this.colMul), "black");
		const col1 = "#2040ff";
		const col2 = "indianred";
		if (this.fat) {
			drawPrim.drawArcO(this.pnts[0], .25, .075, degToRad(0), degToRad(72), Bitmap32.colorMul(col1, this.colMul));
			drawPrim.drawArcO(this.pnts[2], .75, .075, degToRad(180), degToRad(180 + 72), Bitmap32.colorMul(col2, this.colMul));
		} else {
			drawPrim.drawArcO(this.pnts[1], .25, .075, degToRad(180 + 36), degToRad(0), Bitmap32.colorMul(col1, this.colMul));
			drawPrim.drawArcO(this.pnts[3], .25, .075, degToRad(36), degToRad(180 ), Bitmap32.colorMul(col2, this.colMul));
		}
		/*for (let i in this.pnts) {
			const pnt = this.pnts[i];
			drawPrim.drawArcO(pnt, .2, .05, degToRad(30), degToRad(60), "magenta");
		}*/
		ctx.restore();
		drawPrim.drawCircle(this.pos, .025, "brown", ); // center
	}
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	constructor() {
		console.log("Play with Penrose tiles");
		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		//this.vp = null; // OR, no vertical panel UI
		this.eles = {}; // keep track of eles in vertical panel

		// add all elements from vp to ele if needed
		// uncomment if you need elements from vp html
		//populateElementIds(this.vp, this.eles);

		// USER before UI built
		this.#userInit();

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, this.vp, this.startCenter, this.startZoom);
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

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.startZoom = .5;

		this.tiles = [];
		this.tiles.push(new Tile([-1.5,.75], degToRad(0), false));
		this.tiles.push(new Tile([.75, .5], degToRad(0), true));
		this.tiles.push(new Tile([-1.5,-1], degToRad(-18), false, 1.5));
		this.tiles.push(new Tile([.75, -1.25], degToRad(-36), true, 1.5));
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
		makeEle(this.vp, "span", null, "marg", "Show graph paper");
		this.eles.showGraphPaper = makeEle(this.vp, "input", "showGraphPaper", null, "ho", () => this.dirty = true, "checkbox");
		this.eles.showGraphPaper.checked = true;
	}		
	
	#userProc() {
		// proc
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
	}

	#userDraw() {
		for (let tile of this.tiles) {
			tile.draw(this.drawPrim);
		}
		// test darken an brighten a css color
		const col = "goldenrod";
		for  (let i = -5; i <= 5; ++i) {
			const col2 = Bitmap32.colorMul(col, .2 * i + 1)
			this.drawPrim.drawCircle([.5 * i, 1.5], .125, col2);
		}
	}
__
	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Dirty Count = " + this.dirtyCount;
		countStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		this.eles.textInfoLog.innerText = countStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT) || this.dirty;
		// USER: do USER stuff
		this.#userProc(); // proc

		// draw when dirty
		if (this.dirty) {
			this.plotter2d.clearCanvas();
			// interact with mouse, calc all spaces
			// goto user/cam space
			this.plotter2d.setSpace(Plotter2d.spaces.USER);
			// now in user/cam space
			if (this.eles.showGraphPaper.checked) {
				this.graphPaper.draw("X", "Y");
			}
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
