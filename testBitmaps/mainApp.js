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
			"Bark.png",
			"panel.jpg",
			"maptestnck.png"
		];
		this.#loadImages(imageNames);
	}

	// after user assets loaded
	// before user UI built
	// TODO: promise to learn promises
	#userInit() {
		this.triSize = 10; // alignment triangles
		this.fixedSize = [1024, 768];

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// bitmaps
		this.#initBitmaps(this.ctx, this.fixedSize);

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER, no vp means don't use any ui for trans and scale
		// only use screen space
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, null, this.startCenter, this.startZoom, this.fixedSize, true); 
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		//this.drawPrim = new DrawPrimitives(this.plotter2d);

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
		{
			const label = "Separation";
			const min = this.triSize * 2 - 1;
			const max = 300;
			const start = 32;
			const step = 1;
			//const precision = 1;
			const callback = (v) => {this.separation = v};
			new makeEleCombo(this.vp, label, min, max, start, step, 0, callback);
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

		// test bitmaps
		this.#drawBitmaps();
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		this.eles.info.innerText 
		= "Avg fps = " + this.avgFps.toFixed(2)
		+ "\nMouse = (" + this.input.mouse.mxy[0] 
		+ "," + this.input.mouse.mxy[1] + ")";
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

	#initBitmaps() {
		this.bitmapData = {};
		// draw everything here before sent to canvas
		const backgndColor = Bitmap32.strToColor32("lightblue");
		this.bitmapData.backgnd = new Bitmap32(this.fixedSize);

		// already fully loaded images
		for (const imageName in this.images) {
			this.bitmapData[imageName] = new Bitmap32(this.images[imageName]);
		}
		// Bitmap32 test draw methods
		this.bitmapData.drawTest = new Bitmap32([128, 64]); 

		// create a bitmap32 with some text on it
		const cvs = document.createElement('canvas');
		cvs.width = 192;
		cvs.height = 64;
		const ctxTxt = cvs.getContext("2d");
		// clear ctx to color
		ctxTxt.fillStyle = "blue";
		ctxTxt.fillRect(0, 0, cvs.width, cvs.height);
		const centerX = cvs.width / 2;
		const centerY = cvs.height / 2;
		ctxTxt.textAlign = 'center';
		ctxTxt.translate(centerX, centerY);
		const textSize = 50;
		ctxTxt.scale(textSize, textSize);
		const adjCenter = .33; // hmm..
		ctxTxt.translate(-centerX, -centerY + adjCenter);
		ctxTxt.font = 'bold 1px serif';
		ctxTxt.fillStyle = "yellow"; 
		const text = "Hello!";
		ctxTxt.fillText(text, centerX, centerY);
		this.bitmapData.text = new Bitmap32([cvs.width, cvs.height]
			, ctxTxt.getImageData(0, 0, cvs.width, cvs.height).data);

		// random bitmap
		this.bitmapData.random = new Bitmap32([400, this.fixedSize[1] - this.triSize]);
		const rndData = this.bitmapData.random.data32;
		for (let i = 0; i < rndData.length; ++i) {
			rndData[i] = 0xff000000 + 0x1000000 * Math.random();
		}

		// triangle bitmap used for cross eye alignment
		this.bitmapData.triangle = new Bitmap32([2 * this.triSize - 1, this.triSize], backgndColor);
		for (let i = 0; i < this.triSize; ++i) {
			this.bitmapData.triangle.clipRect([this.triSize - i - 1, i], [2 * i + 1, 1], Bitmap32.strToColor32("black"));
		}
	

		// list all bitmaps created
		const keys = Object.keys(this.bitmapData);
		console.log("num bitmaps = " + keys.length);
		for (let bmName of keys) {
			const bm = this.bitmapData[bmName];
			console.log("bitmap " 
				+ bmName.padEnd(12," ") 
				+ "dim (" + bm.size[0].toString().padStart(4) 
				+ "," + bm.size[1].toString().padStart(4) + ")");
		}
	}

	#drawBitmaps() {

		// start with background
		const mainBM = this.bitmapData.backgnd;
		mainBM.fill(Bitmap32.strToColor32("lightblue"));

		this.bit
		// update drawTest test bitmap
		const dest = this.bitmapData["drawTest"];
		dest.fill(Bitmap32.strToColor32("green"));
		
		// pixel test
		{
			const mt = this.bitmapData["maptestnck"];
			//const color = this.bitmapData["maptestnck"].clipGetPixel(this.input.mouse.mxy);
			const srcPos = vec2.create();
			const offset = vec2.fromValues(-60, -40);
			for (let j = 0; j < 10; ++j) {
				for (let i = 0; i < 10; ++i) {
					vec2.add(srcPos, this.input.mouse.mxy, offset);
					vec2.add(srcPos, srcPos, [i, j]);
					dest.clipPutPixel([100 + i, 10 + j], mt.clipGetPixel(srcPos));
				}
			}
		}
		
		// rectangle test
		const p = vec2.create();
		vec2.add(p, this.input.mouse.mxy, [-200, -200]);
		const s = vec2.fromValues(30, 20);
		dest.clipRect(p, s, Bitmap32.strToColor32("red"));
		//console.log("done dest rect");
		
		// blit test
		Bitmap32.clipBlit(this.bitmapData.maptestnck, [0,0]
			,dest, [this.input.mouse.mxy[0] - 100, this.input.mouse.mxy[1] - 100]
			, this.bitmapData.maptestnck.size);

		// draw drawTest bm onto background
		Bitmap32.clipBlit(dest, [0, 0]
			, mainBM, [0, 0]
			, dest.size);

		// draw random bm onto background
		Bitmap32.clipBlit(this.bitmapData.random, [0, 0]
			, mainBM, [600, 0]
			, this.bitmapData.random.size);

		// draw text bm onto background
		Bitmap32.clipBlit(this.bitmapData.text, [0, 0]
			, mainBM, [300, 0]
			, this.bitmapData.text.size);

		// draw alignment triangles onto backgound
		const leftTriX = mainBM.size[0] / 2 - Math.floor((1 + this.separation) / 2);
		const rightTriX = mainBM.size[0] / 2 + Math.floor(this.separation / 2);
		Bitmap32.clipBlit(this.bitmapData.triangle, [0,0]
			, mainBM, [leftTriX - this.bitmapData.triangle.size[1] + 1, mainBM.size[1] - this.bitmapData.triangle.size[1]]
			, this.bitmapData.triangle.size);
		Bitmap32.clipBlit(this.bitmapData.triangle, [0,0]
			, mainBM, [rightTriX - this.bitmapData.triangle.size[1] + 1, mainBM.size[1] - this.bitmapData.triangle.size[1]]
			, this.bitmapData.triangle.size);

		mainBM.clipPutPixel(this.input.mouse.mxy, Bitmap32.strToColor32("red"));


		// draw background onto canvas
		this.ctx.putImageData(mainBM.imageData, 0, 0);
	}
}

const mainApp = new MainApp();
