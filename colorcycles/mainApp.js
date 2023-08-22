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
			"dpaint2Palette.png"
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

		this.backgndColor = Bitmap32p.strToColor32("lightblue");

		// bitmaps
		this.#initBitmaps();

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER, no vp means don't use any ui for trans and scale
		// only use screen space
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, null, this.startCenter, this.startZoom, this.fixedSize); 
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
		// num colors
		{
			const label = "Set Num Colors";
			this.numColorsMin = 1;
			this.numColorsMax = 64;
			this.numColorsCur = this.numColorsStart;
			const min = this.numColorsMin;
			const max = this.numColorsMax;
			const start = this.numColorsStart;
			const callback = (v) => {this.numColors = v};
			new makeEleCombo(this.vp, label, min, max, start, 0, 0, callback);
		}
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
	}

	#userDraw() {
		this.#drawBitmaps();
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		this.eles.info.innerText 
		= "Avg fps = " + this.avgFps.toFixed(2)
		+ "\nMouse = (" + this.input.mouse.mxy[0] 
		+ "," + this.input.mouse.mxy[1] + ")"
		+ "\nNum Colors = " + this.numColorsCur
		+ "\nFrame = " + this.frame
		+ "\nEat Count = " + this.eatCount.toFixed().padStart(5) 
		+ "/" + this.simBmSize * this.simBmSize;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		// interact with mouse, calc all spaces
		this.plotter2d.proc(this.vp, this.input.mouse);

		// keep animation going
		requestAnimationFrame(() => this.#animate());

		// USER: do USER stuff
		this.#userProc(this.vp, this.input.mouse, Mouse.RIGHT); // proc

		// always draw
		this.#userDraw(); // draw

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
		this.bitmapList.simBm = new Bitmap32p([this.simBmSize, this.simBmSize]);
		this.bitmapList.simBm2 = new Bitmap32p([this.simBmSize, this.simBmSize]);
	}

	#restartSim() {
		this.numColorsCur = this.numColors;
		const simData = this.bitmapList.simBm.data32;
		for (let i = 0; i < simData.length; ++i) {
			 // straight value index
			 simData[i] = Math.floor(this.numColorsCur * Math.random());
		}
		this.frame = 0;
		this.fracFrame = 0;
		this.eatCount = 0;
	}

	#runSim() {
		this.fracFrame += this.simSpeed;
		while(this.fracFrame >= 1) {
			this.#runSimFrame();
			--this.fracFrame;
		}
	}

	#runSimFrame() {
		const simBm = this.bitmapList.simBm; // current
		const simBm2 = this.bitmapList.simBm2; // copy, read from simBm2 to update simBm
		Bitmap32p.clipBlit(simBm, [0, 0], simBm2, [0, 0], simBm.size);
		this.eatCount = 0;

		// run the simulation
		for (let j = 0; j < this.simBmSize; ++j) {
			for (let i = 0; i < this.simBmSize; ++i) {
				let val = simBm2.fastGetPixel([i, j]) + 1; // eater color
				if (val == this.numColorsCur) {
					val = 0;
				}
				let eatMark = false;
				if (simBm2.fastGetPixel([i, (j + 1) & (this.simBmSize - 1)]) == val) { // power of 2
					eatMark = true;
				} else if (simBm2.fastGetPixel([i, (j - 1) & (this.simBmSize - 1)]) == val) { // power of 2
					eatMark = true;
				} else if (simBm2.fastGetPixel([(i + 1)  & (this.simBmSize - 1), j]) == val) { // power of 2
					eatMark = true;
				} else if (simBm2.fastGetPixel([(i - 1)  & (this.simBmSize - 1), j]) == val) { // power of 2
					eatMark = true;
				}
				if (eatMark) {
					simBm.fastPutPixel([i, j], val);
					++this.eatCount;
				}
			}
	
		}
		++this.frame;
	}

	#initBitmaps() {
		this.bitmapList = {};
		// draw everything here before sent to canvas
		this.bitmapList.mainBm = new Bitmap32p(this.fixedSize);

		// already fully loaded images, copy images to bitmap list
		for (const imageName in this.images) {
			this.bitmapList[imageName] = new Bitmap32p(this.images[imageName]); // construct Bitmap32p from <images>
		}

		// color management
		this.numColorsMin = 1;
		this.numColorsMax = 60;
		this.numColorsStart = 20;

		// build simBm
		this.simBmSize = 128; // power of 2
		this.zoomRatio = 5;
		this.numColors = this.numColorsStart;
		this.#buildSimBm();
		this.#restartSim();

		// create palletized simBM and zoomSimBmPal
		this.bitmapList.simBmPal = new Bitmap32p([this.simBmSize, this.simBmSize]);
		this.bitmapList.zoomSimBmPal =  new Bitmap32p(
			[this.bitmapList.simBm.size[0] * this.zoomRatio
			, this.bitmapList.simBm.size[1] * this.zoomRatio]);

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
		// start with background
		mainBm.fill(this.backgndColor);

		this.#runSim();

		//const simBm = this.bitmapList.simBm;
		const simBmPal = this.bitmapList.simBmPal;
		const zoomSimBmPal = this.bitmapList.zoomSimBmPal;
		const offSim = [(mainBm.size[0] - zoomSimBmPal.size[0]) / 2
			, (mainBm.size[1] - zoomSimBmPal.size[1]) / 2];
		const simBm = this.bitmapList.simBm;
		this.hilit = -1;
		{
			const mxy = this.input.mouse.mxy;
			const zoomSimBmPal = this.bitmapList.zoomSimBmPal;
			if (mxy[0] >= offSim[0] 
					&& mxy[1] >= offSim[1] 
					&& mxy[0] < offSim[0] + zoomSimBmPal.size[0] 
					&& mxy[1] < offSim[1] + zoomSimBmPal.size[1]) {
				const px = Math.floor((mxy[0] - offSim[0]) / this.zoomRatio);
				const py = Math.floor((mxy[1] - offSim[1]) / this.zoomRatio);
				const pos = [px, py];
				this.hilit = simBm.fastGetPixel(pos);
			}
		}
		// draw paletteBm
		const paletteBm = this.bitmapList.dpaint2Palette;
		const paletteBmdata = paletteBm.data32;
		for (let j = 0; j < this.numColorsCur; ++j) {
			const val = paletteBmdata[j];
			const x = Math.floor(j / 16);
			const y = j % 16;
			if (this.hilit == j) {
				mainBm.clipRect([19 + 20 * x, 19 + 20 * y], [20, 20], Bitmap32p.strToColor32("white"));
			}
			mainBm.clipRect([21 + 20 * x, 21 + 20 * y], [16, 16], val);

		}
		// palettize and zoom simBm
		Bitmap32p.palettize(this.bitmapList.simBm
			, this.bitmapList.simBmPal
			, this.bitmapList.dpaint2Palette.data32)
		Bitmap32p.zoomBM(simBmPal, zoomSimBmPal, [this.zoomRatio, this.zoomRatio]);
		// draw zoomSimBmPal
		Bitmap32p.clipBlit(zoomSimBmPal, [0, 0]
			, mainBm, offSim
			, zoomSimBmPal.size);

		// very simple cursor
		const p = this.input.mouse.mxy;
		const colRed = Bitmap32p.strToColor32("red");
		mainBm.clipCircle(p, 1, colRed);

		// finally draw background to canvas
		this.ctx.putImageData(mainBm.imageData, 0, 0);
	}
}

const mainApp = new MainApp();
