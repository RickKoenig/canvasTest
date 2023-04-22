'use strict';

class PenShape extends Shape {
	static smallAngle = degToRad(36);

	static setupPolyPnts(ang, fat) {
		// rhombus
		const sa = Math.sin(ang);
		const ca = Math.cos(ang);
		this.polyPnts = [
			[0, 0],
			[ca, sa],
			[1 + ca, sa],
			[1, 0]
		];
		this.fat = fat;
		super.setupPolyPnts();
		// setup draw commands
	}

	static triOffs = [[-.05, 0], [0, .1], [.05, 0]];
	static addTriNotch(ctx, pos, ang, ccw = false) {
		const pnt = vec2.create();
		const rotOff = vec2.create();
		vec2.rotate(rotOff, this.triOffs[0], ang);
		vec2.add(pnt, rotOff, pos);
		ctx.lineTo(pnt[0], pnt[1]);
		vec2.rotate(rotOff, this.triOffs[1], ang);
		if  (ccw) {
			vec2.add(pnt, pos, rotOff);
		} else {
			vec2.sub(pnt, pos, rotOff);
		}
		ctx.lineTo(pnt[0], pnt[1]);
		vec2.rotate(rotOff, this.triOffs[2], ang);
		vec2.add(pnt, rotOff, pos);
		ctx.lineTo(pnt[0], pnt[1]);
	}

	static doPath(ctx, fat, options) {
		const smallDist = 1 / 3;
		const largeDist = 2 / 3;
		const rad = .075;
		const pnt = vec2.create();
		ctx.beginPath();
		if (options.drawNotches) {
			if (fat) {
				ctx.moveTo(this.polyPnts[0][0], this.polyPnts[0][1]);
				vec2.lerp(pnt, this.polyPnts[0], this.polyPnts[1], largeDist);
				this.addTriNotch(ctx, pnt, degToRad(72));
				ctx.lineTo(this.polyPnts[1][0], this.polyPnts[1][1]);
				vec2.lerp(pnt, this.polyPnts[1], this.polyPnts[2], largeDist);
				ctx.arc(pnt[0], pnt[1], rad, degToRad(180), 0);
				ctx.lineTo(this.polyPnts[2][0], this.polyPnts[2][1]);
				vec2.lerp(pnt, this.polyPnts[2], this.polyPnts[3], smallDist);
				ctx.arc(pnt[0], pnt[1], rad, degToRad(72), degToRad(72 + 180), true);
				ctx.lineTo(this.polyPnts[3][0], this.polyPnts[3][1]);
				vec2.lerp(pnt, this.polyPnts[3], this.polyPnts[0], smallDist);
				this.addTriNotch(ctx, pnt, degToRad(180),true);
			} else {
				ctx.moveTo(this.polyPnts[0][0], this.polyPnts[0][1]);
				vec2.lerp(pnt, this.polyPnts[0], this.polyPnts[1], smallDist);
				this.addTriNotch(ctx, pnt, degToRad(36), true);
				ctx.lineTo(this.polyPnts[1][0], this.polyPnts[1][1]);
				vec2.lerp(pnt, this.polyPnts[1], this.polyPnts[2], largeDist);
				this.addTriNotch(ctx, pnt, degToRad(0), false);
				ctx.lineTo(this.polyPnts[2][0], this.polyPnts[2][1]);
				vec2.lerp(pnt, this.polyPnts[2], this.polyPnts[3], smallDist);
				ctx.arc(pnt[0], pnt[1], rad, degToRad(36), degToRad(36 + 180), true);
				ctx.lineTo(this.polyPnts[3][0], this.polyPnts[3][1]);
				vec2.lerp(pnt, this.polyPnts[3], this.polyPnts[0], largeDist);
				ctx.arc(pnt[0], pnt[1], rad, degToRad(0), degToRad(0 + 180));
			}
		} else {
			// test draw commands with no notches, TODO: make work with notches
			// and put into setupPolyPoints etc.
			const cmds = [];
			for (let polyPnt of this.polyPnts) {
				const cmd = {
					pnt: polyPnt,
					kind: "point"
				}
				cmds.push(cmd);
			}

			let first = true;
			for (let cmd of cmds) {
				switch (cmd.kind) {
				case "point":
					if (first) {
						ctx.moveTo(cmd.pnt[0], cmd.pnt[1]);
					} else {
						ctx.lineTo(cmd.pnt[0], cmd.pnt[1]);
					}
					break;
				}
				first = false;
			}
/*
			let first = true;
			for (let polyPnt of this.polyPnts) {
				if (first) {
					ctx.moveTo(polyPnt[0], polyPnt[1]);
					first = false;
				} else {
					ctx.lineTo(polyPnt[0], polyPnt[1]);
				}
			} */
		}
		ctx.closePath();
	}

	static draw(drawPrim, id, doHilit = false, fat, options) {
		let colAdjust = doHilit ? .3 : 0;
		const col = fat ? "#a08000" : "#008000";
		const colHilit = Bitmap32.colorAdd(col, colAdjust);
		const ctx = drawPrim.ctx;
		const lineWidth = .025;
		const arcWidth = .075;
		const arcRad1 = .25;
		const arcRad2 = 1 - arcRad1;
		this.doPath(ctx, fat, options);
		ctx.fillStyle = colHilit;
		ctx.fill();
		if (options.drawArcs) {
			const col1 = "#2040ff";   // a blue
			const col2 = "indianred"; // a red
			const col1Hilit = Bitmap32.colorAdd(col1, colAdjust);
			const col2Hilit = Bitmap32.colorAdd(col2, colAdjust);
			if (fat) {
				drawPrim.drawArcO(this.polyPnts[0], arcRad1, arcWidth, degToRad(0), degToRad(72), col1Hilit);
				drawPrim.drawArcO(this.polyPnts[2], arcRad2, arcWidth, degToRad(180), degToRad(180 + 72), col2Hilit);
			} else {
				drawPrim.drawArcO(this.polyPnts[1], arcRad1, arcWidth, degToRad(180 + 36), degToRad(0), col1Hilit);
				drawPrim.drawArcO(this.polyPnts[3], arcRad1, arcWidth, degToRad(36), degToRad(180 ), col2Hilit);
			}
		}
		this.doPath(ctx, fat, options);
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = "black";
		ctx.stroke();
	}

	static drawLevel(drawPrim, id) {
		const radius = .075;
		drawPrim.drawCircle([0,0], radius, "brown", ); // center
		const size = radius * 2;
		drawPrim.drawText([0, 0], [size, size], id, "white");
	}
}

// tile 1
class SkinnyShape extends PenShape {
	static setupPolyPnts() {
		super.setupPolyPnts(this.smallAngle, false); // make a skinny rhombus
	}

	static draw(drawPrim, id, doHilit = false, options) {
		super.draw(drawPrim, id, doHilit, false, options);
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "skinny";
	}
}

// tile 2
class FatShape extends PenShape {
	static setupPolyPnts() {
		super.setupPolyPnts(this.smallAngle * 2, true); // make a fat rhombus
	}

	static draw(drawPrim, id, doHilit = false, options) {
		super.draw(drawPrim, id, doHilit, true, options);
	}

	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
		this.kind = "fat";
	}
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #numInstances = 0; // test static members
	static getNumInstances() { // test static methods
		return MainApp.#numInstances;
	}

	constructor() {
		console.log("\n############# creating instance of MainApp");
		++MainApp.#numInstances;

		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		//this.vp = null; // OR, no vertical panel UI
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

		// auto save
		addEventListener("beforeunload", this.#saveOnExit.bind(this));
	}

	#loadOnInit() {
		this.tiles = [];
		const penTilesStr = localStorage.getItem("penTiles");
		let penTilesObj = [];
		if (penTilesStr) {
			penTilesObj = JSON.parse(penTilesStr);
		}
		if (penTilesObj.length) {
			console.log("loading " + penTilesObj.length + " tiles on init");
			for (let penTileObj of penTilesObj) {
				let kind = null;
				switch(penTileObj.kind) {
				case 'skinny':
					kind = SkinnyShape;
					break;
				case 'fat':
					kind = FatShape;
					break;
				default:
					alert("unknown tile kind " + penTileObj.kind);
					break;
				}
				const pos = vec2.clone(penTileObj.pos);
				const rot = penTileObj.rot;
				this.tiles.push(new Tile(kind, pos, rot));
			}
		} else {
			this.tiles.push(new Tile(SkinnyShape, [0, 2], 0));
			this.tiles.push(new Tile(FatShape, [2, 2], 0));
			console.log("creating " + this.tiles.length + " tiles on init");
		}
	}

	#saveOnExit() {
		console.log("saving " + this.tiles.length + " tiles on exit");
		localStorage.setItem("penTiles", JSON.stringify(this.tiles));
	}

	#clearTiles() {
		this.tiles.length = 0;
		this.dirty = true;

	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.rotMode = true;
		this.snapMode = true;
		this.drawArcs = true;
		this.drawNotches = true;
		this.drawIds = true;
		this.redBarWidth = .25; // for add remove tiles
		// Penrose tiles
		this.protoTiles = [];
		// let proc position them proto tiles
		this.protoTiles.push(new Tile(SkinnyShape, [0, 0], 0));
		this.protoTiles.push(new Tile(FatShape, [0, 0], 0));
		this.#loadOnInit();
		this.editTiles = new EditTiles(this.tiles);
		this.editProtoTiles = new EditTiles(this.protoTiles);

		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .35;
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");

		makeEle(this.vp, "span", null, "marg", "Rotation Mode");
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "Left Right Arrow Keys");
		this.eles.rotMode = makeEle(this.vp, "input", "rotMode", null, "ho", (val) => {
			this.rotMode = val;
		}, "checkbox");
		this.eles.rotMode.checked = this.rotMode;

		makeEle(this.vp, "br");
		makeEle(this.vp, "br");

		makeEle(this.vp, "span", null, "marg", "Snap Angle Mode");
		this.eles.snapMode = makeEle(this.vp, "input", "snapMode", null, "ho", (val) => {
			this.snapMode = val;
		}, "checkbox");
		this.eles.snapMode.checked = this.snapMode;
		makeEle(this.vp, "br");
		makeEle(this.vp, "br");

		makeEle(this.vp, "span", null, "marg", "Draw Arcs");
		this.eles.drawArcs = makeEle(this.vp, "input", "draw arcs", null, "ho", (val) => {
			if (this.drawNotches) {
				this.drawArcs = val;
			}
			this.eles.drawArcs.checked = this.drawArcs;
			this.dirty = true;
		}, "checkbox");
		this.eles.drawArcs.checked = this.drawArcs;
		makeEle(this.vp, "br");

		makeEle(this.vp, "span", null, "marg", "Draw Notches");
		this.eles.drawNotches = makeEle(this.vp, "input", "draw notches", null, "ho", (val) => {
			if (this.drawArcs) {
				this.drawNotches = val;
			}
			this.eles.drawNotches.checked = this.drawNotches;
			this.dirty = true;
		}, "checkbox");
		this.eles.drawNotches.checked = this.drawNotches;
		makeEle(this.vp, "br");

		makeEle(this.vp, "span", null, "marg", "Draw Ids");
		this.eles.drawIds = makeEle(this.vp, "input", "draw ids", null, "ho", (val) => {
			this.drawIds = val;
			this.dirty = true;
		}, "checkbox");
		this.eles.drawIds.checked = this.drawIds;

		makeEle(this.vp, "br");
		makeEle(this.vp, "br");
		makeEle(this.vp, "span", null, "marg", "'Del' key to delete hilited tiles");
		// clear tiles
		makeEle(this.vp, "button", null, null, "Clear all tiles",this.#clearTiles.bind(this));
	}		
	
	#userProc() {
		// proc
		// this.dirty = true;
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

		// process input
		// pass in the buttons and the user/cam space mouse from drawPrim
		const key = this.input.keyboard.key;
		const keyCodes = keyTable.keyCodes;
		let rotStep = 0;
		switch(key) {
		case keyCodes.RIGHT:
			rotStep -= PenShape.smallAngle; // clockwise
			break;
		case keyCodes.LEFT:
			rotStep += PenShape.smallAngle; // counter clockwise
			break;
		case keyCodes.DELETE:
			this.editTiles.deleteHilited();
			this.dirty = true;
			break;
		}

		// remove tiles if deselected in the red area
		this.delDeselect = this.plotter2d.ndcMouse[0] - this.plotter2d.ndcMin[0] < this.redBarWidth;
		this.dirty = this.editTiles.proc(this.input.mouse
			, this.plotter2d.userMouse
			, this.snapMode, this.rotMode, rotStep, this.delDeselect) 
			|| this.dirty;
		
		this.dirty = this.editProtoTiles.proc(this.input.mouse
			, this.plotter2d.userMouse
			, false, false, rotStep, false, false) 
			|| this.dirty;
		
		if (this.editTiles.getHilitIdx() >= 0) {
			// don't hilit both proto tiles and main tiles
			this.editProtoTiles.deselect();
		}
		// update proto tiles positions to user space
		const yPos = [.75, .25]; // skinny, fat
		for (let i = 0; i < this.protoTiles.length; ++i) {
			const tile = this.protoTiles[i];
			const ndc = [this.plotter2d.ndcMin[0] + this.redBarWidth / 2, yPos[i]]; 
			const user = tile.pos;
			this.plotter2d.ndcToUser(user, ndc);
		}
		// select and add a proto tile to the main tiles
		const protoSelected = this.editProtoTiles.getCurSelected()
		if (protoSelected >=0) {
			this.editProtoTiles.deselect();
			const newTile = this.protoTiles[protoSelected].clone();
			this.editTiles.addTile(newTile, this.plotter2d.userMouse);
		}
	}

	#testDraw() {
		/*
		this.ctx.beginPath();
		this.ctx.lineJoin = "round";
		this.ctx.moveTo(-1, 1);
		this.ctx.lineTo(0, 0);
		this.ctx.lineTo(1, 1);
		this.ctx.lineWidth = .1;
		this.ctx.strokeStyle = "cyan";
		this.ctx.fillStyle = "red";
		this.ctx.closePath();
		this.ctx.fill();
		this.ctx.stroke();*/

		//this.plotter2d.setSpace(Plotter2d.spaces.SCREEN);
		const ctx = this.ctx;
		ctx.save();
		ctx.scale(.005, .005); // zoom in real close to the example
		
		// Tangential lines
		ctx.beginPath();
		ctx.strokeStyle = "gray";
		ctx.lineWidth = 1;
		ctx.moveTo(200, 20);
		ctx.lineTo(200, 130);
		ctx.lineTo(50, 20);
		ctx.stroke();

		// Arc
		ctx.beginPath();
		ctx.strokeStyle = "black";
		ctx.fillStyle = "green";
		ctx.lineWidth = 5;
		ctx.moveTo(200, 20);
		ctx.arcTo(200, 130, 50, 20, 40);
		ctx.closePath();
		//ctx.lineTo(50, 20);
		ctx.fill();
		ctx.stroke();

		// test
		ctx.beginPath();
		ctx.strokeStyle = "black";
		ctx.fillStyle = "green";
		ctx.lineWidth = 2;
		ctx.moveTo(250, 20);
		ctx.arc(300, 20, 20, degToRad(180), degToRad(0), true);
		ctx.arc(400, 20, 20, degToRad(180), degToRad(0), false);
		ctx.lineTo(450, 20);
		ctx.lineTo(250, 130);
		//ctx.lineTo(250, 20);
		//ctx.arc(325, 210, 30, 0, Math.PI / 8);
		ctx.closePath();
		//ctx.lineTo(50, 20);
		ctx.fill();
		ctx.stroke();

		// Start point
		ctx.beginPath();
		ctx.fillStyle = "blue";
		ctx.arc(200, 20, 5, 0, 2 * Math.PI);
		ctx.fill();

		// Control points
		ctx.beginPath();
		ctx.fillStyle = "red";
		ctx.arc(200, 130, 5, 0, 2 * Math.PI); // Control point one
		ctx.arc(50, 20, 5, 0, 2 * Math.PI); // Control point two
		ctx.fill();
		ctx.restore();
	}

	#userDraw() {
		const options = {
			drawArcs: this.drawArcs,
			drawNotches: this.drawNotches,
			drawIds: this.drawIds
		};
		// proto shapes
		this.editProtoTiles.draw(this.drawPrim, options);
		// main shapes
		this.editTiles.draw(this.drawPrim, options);
		//this.#testDraw();
		// draw red add delete bar
		this.plotter2d.setSpace(Plotter2d.spaces.NDC);
		const col = this.delDeselect ? "#ff000040" : "#ff000020";
		this.drawPrim.drawRectangle(this.plotter2d.ndcMin
			, [this.redBarWidth, (this.plotter2d.ndcMax[1] - this.plotter2d.ndcMin[1])]
			, col);
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let infoStr = "Dirty Count = " + this.dirtyCount;
		infoStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		infoStr += "\n Number of tiles = " + this.tiles.length;
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

		//this.dirty = true; // test, always draw every frame
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
