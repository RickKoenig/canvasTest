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
		this.maxSep = 300;
		this.startDepthMul = 4;

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
			const max = this.maxSep;
			const start = 150;
			const step = 1;
			const callback = (v) => {this.separation = v};
			new makeEleCombo(this.vp, label, min, max, start, step, 0, callback);
		}
		{
			const label = "Depth Mult";
			const min = -32;
			const max = 32;
			const start = this.startDepthMul;
			const step = 1;
			const callback = (v) => {this.depthMul = v};
			new makeEleCombo(this.vp, label, min, max, start, step, 0, callback);
		}
		const ele = makeEle(this.vp, "span", "marg", null, "Show image");
		this.eles.showImage = makeEle(ele, "input", "checkboxParametric", null, "checkboxParametric", null, "checkbox");
		//this.eles.checkboxParametric.checked = this.doParametric; // UI checkbox toggle init
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
			cvs.width = 650;
			cvs.height = 300;
			const ctxTxt = cvs.getContext("2d");
			// clear ctx to color
			ctxTxt.fillStyle = "black";
			ctxTxt.fillRect(0, 0, cvs.width, cvs.height);
			const centerX = cvs.width / 2;
			const centerY = cvs.height / 2;
			ctxTxt.textAlign = 'center';
			ctxTxt.translate(centerX, centerY);
			const textSize = 250;
			ctxTxt.scale(textSize, textSize);
			const adjCenter = .33; // hmm..
			ctxTxt.translate(-centerX, -centerY + adjCenter);
			ctxTxt.font = 'bold 1px serif';
			ctxTxt.fillStyle = "lightgreen"; 
			const text = "Hello!";
			ctxTxt.fillText(text, centerX, centerY);
			this.bitmapList.text = new Bitmap32([cvs.width, cvs.height]
				, ctxTxt.getImageData(0, 0, cvs.width, cvs.height).data);
		}

		// image bitmap
		const mainBM = this.bitmapList.backgnd;
		this.bitmapList.image = new Bitmap32([mainBM.size[0], mainBM.size[1] - this.triSize], "black");
		this.bitmapList.image.clipRect([200,400],[500,300],Bitmap32.strToColor32("lightgreen"));
		Bitmap32.clipBlit(this.bitmapList.text, [0 ,0]
			, this.bitmapList.image, [100, 0]
			, this.bitmapList.text.size);

		// random bitmap
		this.bitmapList.random = new Bitmap32([this.maxSep, this.fixedSize[1] - this.triSize]);
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


		let drawRandom1 = false;
		// draw random bm onto background
		if (drawRandom1) {
			for (let x = 0; x < this.fixedSize[0]; x += this.separation) {
				Bitmap32.clipBlit(this.bitmapList.random, [0, 0]
					, mainBM, [x, 0]
					, [this.separation, this.bitmapList.random.size[1]]);
			}
		}

		let drawRandom2 = true;
		// draw random bm onto background
		if (drawRandom2) {
			const randBM = this.bitmapList.random;
			//const randBMdata = randBM.data32;
			const mainBMdata = mainBM.data32;
			let destIdxRight = this.separation;
			let destIdxStart = this.separation;
			const image = this.bitmapList.image;
			const imageData = image.data32;
			let imageIdx = 0;
			let imageIdxStart = imageIdx;

			// copy 1 copy of random pattern to left to start things off
			Bitmap32.clipBlit(randBM, [0, 0]
				, mainBM, [0, 0]
				, [this.separation, randBM.size[1]]);
			// now copy pixel by pixel by an offset function/image
			const greenVal = Bitmap32.strToColor32("lightgreen");
			const blueVal = Bitmap32.strToColor32("blue");
			for (let j = 0; j < randBM.size[1]; ++j) {
				for (let i = 0; i < mainBM.size[0] - this.separation; ++i) {
					const valCol = imageData[imageIdx++];
					let depth = 0;
					if (greenVal == valCol) {
						depth = this.depthMul;
					}
					const dist = this.separation + depth;
					const destIdxLeft = destIdxRight - dist
					mainBMdata[destIdxRight++] =  mainBMdata[destIdxLeft];
					//mainBMdata[destIdxRight++] =  depth ? greenVal : blueVal /*mainBMdata[destIdxLeft]*/;
				}
				destIdxStart += mainBM.size[0];
				destIdxRight = destIdxStart;
				imageIdxStart += image.size[0];
				imageIdx = imageIdxStart;
			}

				//mainBMdata[mainBM.size[0] * 5 + 4] = Bitmap32.color32();
			
		}

		let drawText = false;
		// draw text bm onto background
		if (drawText) {
			Bitmap32.clipBlit(this.bitmapList.text, [0, 0]
				, mainBM, [10, 10]
				, this.bitmapList.text.size);
		}

		let drawImage = this.eles.showImage.checked;
		const imageOffset = [this.separation, 0];
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

		// very simple cursor
		const p = this.input.mouse.mxy;
		const p0 = [p[0] - 2, p[1]];
		const p1 = [p[0] + 2, p[1]];
		const p2 = [p[0], p[1] - 2];
		const p3 = [p[0], p[1] + 2];
		const colRed = Bitmap32.strToColor32("red");
		mainBM.clipPutPixel(p0, colRed);
		mainBM.clipPutPixel(p1, colRed);
		mainBM.clipPutPixel(p2, colRed);
		mainBM.clipPutPixel(p3, colRed);


		// draw background onto canvas
		this.ctx.putImageData(mainBM.imageData, 0, 0);
	}
}

const mainApp = new MainApp();
