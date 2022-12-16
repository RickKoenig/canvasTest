'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now, assume 60hz refresh rate
class MainApp {
	constructor() {
		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		this.eles = {}; // keep track of eles in vertical panel

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		this.#userLoad(); // async load assets
	}

	// USER: add more members or classes to MainApp
	#userLoad() {
		const imageNames = [
			//"Bark.png",
			//"panel.jpg",
			//"maptestnck.png",
			"roomsIdx.png",
			"roomsPal.png"
		];
		this.#loadImages(imageNames);
	}

	// after user assets loaded
	// before user UI built
	// TODO: promise to learn promises
	#userInit() {
		this.fixedSize = [1024, 768];
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.frame = 0;
		this.fracFrame = 0;

		this.backgndColor = Bitmap32.strToColor32("lightblue");

		// bitmaps
		this.#initBitmaps();

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER, no vp means don't use any ui for trans and scale
		// only use screen space
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, null, this.startCenter, this.startZoom, this.fixedSize, true); 
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);

		// USER build UI
		this.#userBuildUI();
		

		// start it off
		this.#animate();
	}

	#userBuildUI() {
		// info bar
		makeEle(this.vp, "hr");
		this.eles.info = makeEle(this.vp, "pre", null, null, "Info");
		makeEle(this.vp, "hr");
		// reset sim
		makeEle(this.vp, "button", null, null, "Restart Sim",this.#restartSim.bind(this));
		// sim speed
		{
			const label = "Sim Speed";
			const step = .125;
			const min = 0;
			const max = 10;
			const start = .125;
			const prec = 3;
			const callback = (v) => {this.simSpeed = v};
			new makeEleCombo(this.vp, label, min, max, start, step, prec, callback);
		}
	}

	#userProc() { // USER:
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
		this.#drawBitmaps();
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		this.eles.info.innerText 
		= "Avg fps = " + this.avgFps.toFixed(2)
		+ "\nMouse = (" + this.input.mouse.mxy[0] 
		+ "," + this.input.mouse.mxy[1] + ")"
		+ "\nFrame = " + this.frame;
	}

	// proc
	#animate() {
		// update input system
		this.input.proc();
		// interact with mouse, calc all spaces
		this.plotter2d.proc(this.vp, this.input.mouse);
		// keep animation going
		requestAnimationFrame(() => this.#animate());

		// USER: do USER stuff
		 this.#userProc(); // proc and draw
		// update UI, vertical panel text
		this.#userUpdateInfo();
	}

	// async load images
	// TODO: promise to learn promises
	#loadOneBitmap() {
		++this.loadcnt;
		if (this.loadcnt == this.reqcnt) {
			// everything is now loaded
			this.#userInit();
		}
	}

	#loadImages(imageNames) {
		this.images = {};
		this.loadcnt = 0;
		this.reqcnt = imageNames.length;
		if (this.reqcnt == 0) {
			this.#userInit(); // nothing to do
		}

		for (const imgName of imageNames) {
			const idx = imgName.indexOf(".");
			const shortImgName = imgName.slice(0, idx);

			const imgEle = new Image();
			imgEle.src = "../bitmaps/" + imgName;
			this.images[shortImgName] = imgEle;
			  
			if (imgEle.complete) {
				this.#loadOneBitmap();
			} else {
				imgEle.addEventListener('load', () => {
					this.#loadOneBitmap();
				})
				imgEle.addEventListener('error', function() {
					alert('error');
				});
			}
		}
	}

	#setDacRange(dacs, sIdx, eIdx, sCol, eCol) {
		sCol = Bitmap32.colorRGBA(sCol); // convert to .r, .g, .b, .a
		eCol = Bitmap32.colorRGBA(eCol); // convert to .r, .g, .b, .a
		for (let i = sIdx; i <= eIdx; ++i) {
			const r = Math.floor((eCol.r * (i - sIdx) + sCol.r * (eIdx - i)) / (eIdx - sIdx));
			const g = Math.floor((eCol.g * (i - sIdx) + sCol.g * (eIdx - i)) / (eIdx - sIdx));
			const b = Math.floor((eCol.b * (i - sIdx) + sCol.b * (eIdx - i)) / (eIdx - sIdx));
			dacs[i] = Bitmap32.color32(r, g, b);
		}
	}
	
	#clipmask8(srcBm, dstBm, andArr, orArr) {
		if (srcBm.size[0] != dstBm.size[0] || srcBm.size[1] != dstBm.size[1]) {
			console.log("clipmask8 dim mismatch!");
			return;
		}
		const p = srcBm.size[0] * srcBm.size[1];
		const s = srcBm.data32;
		const d = dstBm.data32;
		for (let i = 0; i < p; ++i) {
			const sin = s[i];// & 0xff;
			const and8 = andArr[sin];
			const or8 = orArr[sin];
			d[i] = d[i] & and8 | or8;
			//d[i] = vin;
		}
	}
	
	#scanRoom() {

	}

	#heatHouseUI() {
		// toggle doors, windows, thermostats, and heaters
		if (!this.input.mouse.mclick[Mouse.LEFT]) {
			return;
		}
	// draw background
		const mx = Math.floor(this.input.mouse.mxy[0] / 8);
		const my = Math.floor(this.input.mouse.mxy[1] / 8);
		//S32 col,newcol;
		//video_lock();
		//mx=MX/8;
		//my=MY/8;
		const roomsIdxBm = this.bitmapList.roomsIdx;
		const col = roomsIdxBm.clipGetPixel([mx,my]);
		const black = this.colorsEnum.black;
		const white = this.colorsEnum.white;
		const red = this.colorsEnum.red;
		const lightred = this.colorsEnum.lightred;
		const lightmagenta = this.colorsEnum.lightmagenta;
		const green = this.colorsEnum.green;
		const lightgreen = this.colorsEnum.lightgreen;
		const blue = this.colorsEnum.blue;
		const lightblue = this.colorsEnum.lightblue;
		if (col != black && col != white) {
			let newcol;
			switch(col) {
			case red:	
				newcol = lightred;
				break;
			case lightred:
			case lightmagenta:
				newcol = red;
				break;
			case green:	
				newcol = lightgreen;
				break;
			case lightgreen:
				newcol = green;
				break;
			case blue:	
				newcol = lightblue;
				break;
			case lightblue:
				newcol = blue;
				break;
			}
			//roomsIdxBm.clipPutPixel([mx, my], newcol);
			roomsIdxBm.clipFloodFill([mx, my], newcol);
			this.#scanRoom();
		}
	}
	
	#buildSimBm() {
	// palette colors, 8 bit
		const colors8 = [
			"black", "blue", "green", "cyan",
			"red", "magenta","brown","lightgray",
			"darkgray","lightblue","lightgreen","lightcyan",
			"lightred","lightmagenta","yellow","white"
		];
		this.colorsEnum = makeEnum(colors8);
		this.RX = 128;
		this.RY = 96;
		this.p = this.RX * this.RY;
		
		this.XSIZE = 1024;
		this.YSIZE = 768;
		this.zoomRatio = 8;
		// build palettized Bm here
		//this.bitmapList.roomsIdxBmZoom = new Bitmap32([this.XSIZE, this.YSIZE]);
		this.bitmapList.work8Bm = new Bitmap32([this.RX, this.RY], this.colorsEnum.blue);
		this.bitmapList.work8BmZoom = new Bitmap32([this.XSIZE, this.YSIZE]);
		const roomsDac = this.bitmapList.roomsPal.data32;
		// strip off tracer colors from room
		const roomsIdxBm = this.bitmapList.roomsIdx;
		const p = roomsIdxBm.size[0] * roomsIdxBm.size[1];
		const data = roomsIdxBm.data32;
		for (let i = 0; i < p; ++i) {
			let p = data[i];
			p &= 0xff;
			data[i] = p;
		}

		//this.bitmapList.room32BmZoom = new Bitmap32([this.XSIZE, this.YSIZE]);
		//const mainBm = this.bitmapList.mainBm;
		//const room32BmZoom = this.bitmapList.room32BmZoom;

		//bitmap8 *room,*bigroom; //,*heat,*oldheat;
		//bitmap8* B8;
		this.heat = new Uint32Array(this.p);
		this.oldheat = new Uint32Array(this.p);
		this.heat.fill(64 * 65536);
		this.oldheat.fill(64 * 65536);
		//C32 dacs[256];
		//U8 andor[512];
		this.dacs = new Uint32Array(256);
		this.andArr = new Uint8Array(256);
		this.orArr = new Uint8Array(256);

		const C32BLUE = Bitmap32.color32(0,0,170);
		const C32LIGHTGREEN = Bitmap32.color32(85,255,85);
		const C32YELLOW = Bitmap32.color32(255,255,85);
		const C32RED = Bitmap32.color32(170,0,0);
		const C32MAGENTA = Bitmap32.color32(170,0,170);

		//copy(stdpalette,stdpalette+16,dacs);
		this.dacs.set(roomsDac.subarray(0, 16), 0);
		this.#setDacRange(this.dacs, 16, 80, C32BLUE, C32LIGHTGREEN);
		this.#setDacRange(this.dacs, 80, 160, C32LIGHTGREEN, C32YELLOW);
		this.#setDacRange(this.dacs, 160, 255, C32YELLOW, C32RED);
		this.thresholdTemp = 135; // on or off at this temp
		this.dacs[this.thresholdTemp] = C32MAGENTA;
		for (let i = 16; i <= 255; ++i) {
			if (i&1) { // dither colors a little
				this.dacs[i] ^= 0x80808;
			}
		}

		this.#scanRoom();

		// setup and or mask
		for (let i = 0; i < 256; ++i) {
			this.andArr[i] = 0x00;
			this.orArr[i] = i;
		}
		this.andArr[this.colorsEnum.blue] = 0xff;
		this.orArr[this.colorsEnum.blue] = 0x00;
		this.andArr[this.colorsEnum.black] = 0xff;
		this.orArr[this.colorsEnum.black] = 0x00;
	
		//S32 nthermostats;
		//S32 nheaters;
		//S32 nwindows;
		//pointi2 *thermostats;
		//pointi2 *heaters;
		//pointi2 *windows;
		this.thermostats = [];
		this.heaters = [];
		this.windows = [];
		
		//S32 heateron;
		this.heateron = false;
	}

	#restartSim() {
		this.frame = 0;
		this.fracFrame = 0;
	}

	#runSim() {
		this.fracFrame += this.simSpeed;
		while(this.fracFrame >= 1) {
			this.#runSimFrame();
			--this.fracFrame;
		}
	}

	#runSimFrame() {
		//for (p=0;p<250;p++)
		//	doheat();
		const work8Bm = this.bitmapList.work8Bm;

		// temp, just work with a const cold temperature
		work8Bm.clipRect([0,0], work8Bm.size, this.colorsEnum.blue);
		++this.frame;
	}

	#initBitmaps() {
		this.bitmapList = {};
		// draw everything here before sent to canvas
		this.bitmapList.mainBm = new Bitmap32(this.fixedSize);

		// already fully loaded images, copy images to bitmap list
		for (const imageName in this.images) {
			this.bitmapList[imageName] = new Bitmap32(this.images[imageName]); // construct bitmap32 from <images>
		}

		// build rooms32 and zoom
		this.#buildSimBm();
		this.#restartSim();
/*
		// test flood fill
		const bt = new Uint32Array([
			3, 3, 3, 3, 3,
			3, 4, 4, 4, 4,
			4, 4, 4, 3, 4,
			4, 4, 4, 3, 4,
			3, 4, 3, 4, 4,
		]);
		this.bitmapList.testFF = new Bitmap32([5, 5], bt);
		this.bitmapList.testFFflood = new Bitmap32(this.bitmapList.testFF.size);
		Bitmap32.clipBlit(this.bitmapList.testFF, [0, 0]
			, this.bitmapList.testFFflood, [0, 0]
			, this.bitmapList.testFF.size);
		this.bitmapList.testFFflood.clipFloodFill([2, 2], 17);
*/
		//this.#initTestLine();


		const listBitmaps = true;
		if (listBitmaps) {
			// list all bitmaps created
			const keys = Object.keys(this.bitmapList);
			console.log("num bitmaps = " + keys.length);
			for (let bmName of keys) {
				const bm = this.bitmapList[bmName];
				console.log("bitmap " 
					+ bmName.padEnd(24," ") 
					+ "dim (" + bm.size[0].toString().padStart(4) 
					+ "," + bm.size[1].toString().padStart(4) + ")");
			}
		}
	}
/*
	#initTestLine() {
		this.lineP0 = [100, 80];
		this.lineP1 = [400, 100];
	}

	#drawTestLine(mainBm) {
		//console.log("TEST LINE");
		let p0 = [5, 3];
		let p1 = [-11, -7];
		const smallBm = this.bitmapList.roomsIdx;
		//console.log("BM size = " + smallBm.size);
		//console.log ("IN  p0 = " + p0 + ", p1 = " + p1);
		const res = this.bitmapList.roomsIdx.lineClip(p0, p1);
		if (res) {
			//console.log ("OUT p0 = " + p0 + ", p1 = " + p1);
		} else {
			//console.log ("false");
		}
		const mouse = this.input.mouse;
		const mxy = mouse.mxy;
		if (this.input.mouse.mbut[Mouse.LEFT]) {
			vec2.copy(this.lineP0, mxy);
		}
		if (this.input.mouse.mbut[Mouse.RIGHT]) {
			vec2.copy(this.lineP1, mxy);
		}

		mainBm.clipCircle(this.lineP0, 10, Bitmap32.strToColor32("red"));
		mainBm.clipCircle(this.lineP1, 10, Bitmap32.strToColor32("yellow"));
		mainBm.clipLine(this.lineP0, this.lineP1, Bitmap32.strToColor32("green"));
	}
*/
	#drawBitmaps() {
		const mainBm = this.bitmapList.mainBm;
		const roomsIdxBm = this.bitmapList.roomsIdx;
		const roomsIdxBmZoom = this.bitmapList.roomsIdxBmZoom;
		const work8Bm = this.bitmapList.work8Bm;
		const work8BmZoom = this.bitmapList.work8BmZoom;
		// start with background
		mainBm.fill(this.backgndColor);

		// run the simulation
		this.#runSim();

		if (true) {
			// build and draw palettized rooms Bm
			//Bitmap32.zoomBM(roomsIdxBm, roomsIdxBmZoom, [this.zoomRatio, this.zoomRatio]);

			//Bitmap32.clipBlit(roomsIdxBmZoom, [0,0], work8BmZoom, [0, 0], work8BmZoom.size);
			this.#clipmask8(roomsIdxBm, work8Bm, this.andArr, this.orArr);
			Bitmap32.zoomBM(work8Bm, work8BmZoom, [this.zoomRatio, this.zoomRatio]);
		} else {
			// build and draw palettized rooms Bm
			Bitmap32.zoomBM(roomsIdxBm, roomsIdxBmZoom, [this.zoomRatio, this.zoomRatio]);
			Bitmap32.zoomBM(work8Bm, work8BmZoom, [this.zoomRatio, this.zoomRatio]);

			//Bitmap32.clipBlit(roomsIdxBmZoom, [0,0], work8BmZoom, [0, 0], work8BmZoom.size);
			this.#clipmask8(roomsIdxBmZoom, work8BmZoom, this.andArr, this.orArr);
		}
		// draw palette
		for (let i = 0; i < 256; i++) {
			work8BmZoom.clipRect([i * 4 ,0 ], [4, 16], i);
		}

		this.#heatHouseUI(); // click on stuff inside the heat house bitmap, effects source roomsIdxBm
		// hilit current palette color
		//const palIdx = 30;//clipgetpixel8(B8,MX,MY);
		const mxy = this.input.mouse.mxy;
		const palIdx = work8BmZoom.clipGetPixel(mxy);
		// TODO: clipRectO
		const black = this.colorsEnum.black;
		work8BmZoom.clipLine([palIdx*4-1,0],[palIdx*4-1,15],black);
		work8BmZoom.clipLine([palIdx*4-2,0],[palIdx*4-2,15],black);
		work8BmZoom.clipLine([palIdx*4+4,0],[palIdx*4+4,15],black);
		work8BmZoom.clipLine([palIdx*4+5,0],[palIdx*4+5,15],black);

		Bitmap32.palettize(work8BmZoom, mainBm, this.dacs);

		//this.#drawTestLine(mainBm);

		const drawCursor = true;
		if (drawCursor) {
			// very simple cursor
			const colGreen = Bitmap32.strToColor32("red");
			mainBm.clipCircle(mxy, 2, colGreen);
		}


		// finally draw background to canvas
		this.ctx.putImageData(mainBm.imageData, 0, 0);
	}
}

const mainApp = new MainApp();
