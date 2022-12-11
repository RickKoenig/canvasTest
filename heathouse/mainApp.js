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

	#buildSimBm() {
		this.zoomRatio = 6;
		// build palettized Bm here
		this.bitmapList.rooms32Bm = new Bitmap32(this.bitmapList.roomsIdx.size);
		this.bitmapList.rooms32BmZoom = new Bitmap32(
			[this.bitmapList.roomsIdx.size[0] * this.zoomRatio
			, this.bitmapList.roomsIdx.size[1] * this.zoomRatio]);

		const mainBm = this.bitmapList.mainBm;
		const rooms32BmZoom = this.bitmapList.rooms32BmZoom;
		this.offsetRoom = [
			(mainBm.size[0] - rooms32BmZoom.size[0])/2
			, (mainBm.size[1] - rooms32BmZoom.size[1])/2];
		this.RX = 128;
		this.RY = 96;
		this.p = this.RX * this.RY;
		
		this.XSIZE = 1024;
		this.YSIZE = 768;

		//bitmap8 *room,*bigroom; //,*heat,*oldheat;
		//bitmap8* B8;
		this.bitmapList.roomBm = new Bitmap32([this.RX, this.RY]);
		this.heat = new Uint32Array(this.p);
		this.oldheat = new Uint32Array(this.p);

		//C32 dacs[256];
		//U8 andor[512];
		this.dacs = new Uint32Array(256);
		this.andor = new Uint8Array(512);

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
		// run the simulation
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

	#drawBitmaps() {
		const mainBm = this.bitmapList.mainBm;
		const roomsPalBm = this.bitmapList.roomsPal;
		const roomsPalBmData = roomsPalBm.data32;
		const roomsIdxBm = this.bitmapList.roomsIdx;
		const rooms32Bm = this.bitmapList.rooms32Bm;
		const rooms32BmZoom = this.bitmapList.rooms32BmZoom;
		// start with background
		mainBm.fill(this.backgndColor);

		this.#runSim();
		
		// build and draw palettized rooms Bm
		Bitmap32.palettize(roomsIdxBm, rooms32Bm, roomsPalBm.data32);
		Bitmap32.zoomBM(rooms32Bm, rooms32BmZoom, [this.zoomRatio, this.zoomRatio]);
		Bitmap32.clipBlit(rooms32BmZoom, [0, 0], mainBm, this.offsetRoom, rooms32BmZoom.size);
		//Bitmap32.clipBlit(rooms32Bm, [0, 0], mainBm, [220, 150], rooms32Bm.size);

		// very simple cursor
		const p = this.input.mouse.mxy;
		const colRed = Bitmap32.strToColor32("red");
		mainBm.clipCircle(p, 2, colRed);

		// finally draw background to canvas
		this.ctx.putImageData(mainBm.imageData, 0, 0);
	}
}

const mainApp = new MainApp();
