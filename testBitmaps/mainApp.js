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
			const min = this.triSize * 2;
			const max = 300;
			const start = 100;
			const step = 1;
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
		this.bitmapList = {};
		// draw everything here before sent to canvas
		const backgndColor = Bitmap32.strToColor32("lightblue");
		this.bitmapList.backgnd = new Bitmap32(this.fixedSize);

		// already fully loaded images
		for (const imageName in this.images) {
			this.bitmapList[imageName] = new Bitmap32(this.images[imageName]); // construct bitmap32 form
		}

		// create a bitmap32 with some text on it
		{
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
			this.bitmapList.text = new Bitmap32([cvs.width, cvs.height]
				, ctxTxt.getImageData(0, 0, cvs.width, cvs.height).data);
		}

		// image bitmap
		this.bitmapList.image = new Bitmap32([600, 400], "green");

		// random bitmap
		this.bitmapList.random = new Bitmap32([400, this.fixedSize[1] - this.triSize]);
		const rndData = this.bitmapList.random.data32;
		for (let i = 0; i < rndData.length; ++i) {
			rndData[i] = 0xff000000 + 0x1000000 * Math.random();
		}

		// triangle bitmap used for cross eye alignment
		this.bitmapList.triangle = new Bitmap32([2 * this.triSize - 1, this.triSize], backgndColor);
		for (let i = 0; i < this.triSize; ++i) {
			this.bitmapList.triangle.clipRect([this.triSize - i - 1, i], [2 * i + 1, 1], Bitmap32.strToColor32("black"));
		}
	

		// list all bitmaps created
		const keys = Object.keys(this.bitmapList);
		console.log("num bitmaps = " + keys.length);
		for (let bmName of keys) {
			const bm = this.bitmapList[bmName];
			console.log("bitmap " 
				+ bmName.padEnd(12," ") 
				+ "dim (" + bm.size[0].toString().padStart(4) 
				+ "," + bm.size[1].toString().padStart(4) + ")");
		}
	}

	#drawBitmaps() {
		// start with background
		const mainBM = this.bitmapList.backgnd;
		mainBM.fill(Bitmap32.strToColor32("lightblue"));



		// draw random bm onto background
		for (let x = 0; x < this.fixedSize[0]; x += this.separation) {
			Bitmap32.clipBlit(this.bitmapList.random, [0, 0]
				, mainBM, [x, 0]
				, [this.separation, this.bitmapList.random.size[1]]);
		}

		let drawText;
		drawText = true;
		// draw text bm onto background
		if (drawText) {
			Bitmap32.clipBlit(this.bitmapList.text, [0, 0]
				, mainBM, [10, 10]
				, this.bitmapList.text.size);
		}

		let drawImage;
		drawImage = true;
		const imageOffset = [(this.fixedSize[0] - this.bitmapList.image.size[0]) / 2
		, (this.fixedSize[1] - this.bitmapList.image.size[1]) / 2];
		// draw image onto background
		if (drawImage) {
			Bitmap32.clipBlit(this.bitmapList.image, [0, 0]
				, mainBM, imageOffset
				, this.bitmapList.image.size);
		}

		// draw alignment triangles onto backgound
		const leftTriX = mainBM.size[0] / 2 - Math.floor((1 + this.separation) / 2);
		const rightTriX = mainBM.size[0] / 2 + Math.floor(this.separation / 2);
		Bitmap32.clipBlit(this.bitmapList.triangle, [0,0]
			, mainBM, [leftTriX - this.bitmapList.triangle.size[1] + 1, mainBM.size[1] - this.bitmapList.triangle.size[1]]
			, this.bitmapList.triangle.size);
		Bitmap32.clipBlit(this.bitmapList.triangle, [0,0]
			, mainBM, [rightTriX - this.bitmapList.triangle.size[1] + 1, mainBM.size[1] - this.bitmapList.triangle.size[1]]
			, this.bitmapList.triangle.size);

		mainBM.clipPutPixel(this.input.mouse.mxy, Bitmap32.strToColor32("red"));


		// draw background onto canvas
		this.ctx.putImageData(mainBM.imageData, 0, 0);
	}
}

const mainApp = new MainApp();
