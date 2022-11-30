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

		this.backgndColor = Bitmap32.strToColor32("lightblue");

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
		// separation
		makeEle(this.vp, "hr");
		{
			const label = "Separation";
			const min = 50;//this.triSize * 2;
			const max = this.maxSep;
			const start = 200;
			const step = 1;
			const callback = (v) => {this.separation = v};
			new makeEleCombo(this.vp, label, min, max, start, step, 0, callback);
		}
		// depth
		{
			const label = "Depth Mult";
			const min = -32;
			const max = 32;
			const start = this.startDepthMul;
			const step = 1;
			const callback = (v) => {this.depthMul = v};
			new makeEleCombo(this.vp, label, min, max, start, step, 0, callback);
		}
		// show depth map checkbox
		const ele = makeEle(this.vp, "span", "marg", null, "Show depth map");
		this.eles.showDepthmap = makeEle(ele, "input", null, null, null, null, "checkbox");
		//this.eles.showDepthmap.checked = true;
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

	#makeTextBM(depthColor32) {
		// create a bitmap32 with some text on it
		const textString = "Hello!";
		// make a 2D context for the text
		const cvs = document.createElement('canvas');
		cvs.width = 650;
		cvs.height = 180;
		const ctxTxt = cvs.getContext("2d");
		// clear ctx to color
		ctxTxt.fillStyle = "black"; // background color
		ctxTxt.fillRect(0, 0, cvs.width, cvs.height);
		// text position and size
		const centerX = cvs.width / 2;
		const centerY = cvs.height / 2;
		ctxTxt.textAlign = 'center';
		ctxTxt.translate(centerX, centerY);
		const textSize = 225;
		ctxTxt.scale(textSize, textSize);
		const adjCenter = .33; // hmm..
		ctxTxt.translate(-centerX, -centerY + adjCenter);
		// text font and color
		ctxTxt.font = 'bold 1px serif';
		ctxTxt.fillStyle = Bitmap32.color32ToStr(depthColor32); // text color
		ctxTxt.fillText(textString, centerX, centerY);
		const textBM = new Bitmap32([cvs.width, cvs.height]
			, ctxTxt.getImageData(0, 0, cvs.width, cvs.height).data);
		return textBM;
	}

	// -128 to 127
	#depthToColor32(depth) {
		let r = depth;
		if (depth < 0) {
			r = depth + 256;
		}
		let g = (r * 16) & 0xff;
		let b = (r * 16) >> 4;
		const col32 = Bitmap32.color32(r, g, b);
		return col32;
	}

	#initBitmaps() {
		this.bitmapList = {};
		// draw everything here before sent to canvas
		this.bitmapList.mainBM = new Bitmap32(this.fixedSize);

		// already fully loaded images, copy to bitmap list
		for (const imageName in this.images) {
			this.bitmapList[imageName] = new Bitmap32(this.images[imageName]); // construct bitmap32 from <images>
		}

		// depth bitmap, use red channel for depth
		const testDepth = 1;
		const mainBM = this.bitmapList.mainBM;
		this.bitmapList.depthmap = new Bitmap32([mainBM.size[0], mainBM.size[1] - this.triSize]);
		const depthColor32 = this.#depthToColor32(testDepth);
		// rectangles
		for (let i = 0; i < 8; ++i ) {
			const dc32 = this.#depthToColor32(i);
			this.bitmapList.depthmap.clipRect([200 + 15 * i,180 + 15 * i],[500 - 30 * i,300 - 30 * i],dc32);
		}
		// more rectangles
		for (let i = 0; i < 8; ++i ) {
			const dc32 = this.#depthToColor32(-i);
			this.bitmapList.depthmap.clipRect([200 + 15 * i,450 + 15 * i],[500 - 30 * i,300 - 30 * i],dc32);
		}

		// horizontal lines test
		for (let i = 0; i < 16; ++i ) {
			const dc32 = this.#depthToColor32(i + 1);
			this.bitmapList.depthmap.clipHLine([100 + i, 200 + i * 2], 150 - i, dc32);
			//clipRect([200 + 15 * i,450 + 15 * i],[500 - 30 * i,300 - 30 * i],dc32);
		}

		// some text
		const textBM = this.#makeTextBM(depthColor32);
		Bitmap32.clipBlit(textBM, [0 ,0]
			, this.bitmapList.depthmap, [100, 0]
			, textBM.size);
		/*
		// test depth with lots of rectangles
		for (let i = 0; i < 64; ++i) {
			const j = (i - 32) * 4;
			const dc = this.#depthToColor32(j);
			this.bitmapList.depthmap.clipRect([10 + 11 * i, 300], [10, 10], dc);
		}
*/
		// pattern bitmap, for now use random
		this.bitmapList.pattern = new Bitmap32([this.maxSep, this.fixedSize[1] - this.triSize]);
		const patData = this.bitmapList.pattern.data32;
		for (let i = 0; i < patData.length; ++i) {
			patData[i] = 0xff000000 + 0x1000000 * Math.random();
		}

		// triangle bitmap used for cross eye alignment
		this.bitmapList.triangle = new Bitmap32([2 * this.triSize - 1, this.triSize], this.backgndColor);
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
		const mainBM = this.bitmapList.mainBM;
		mainBM.fill(this.backgndColor);

		let patternToStereo = false;
		// draw pattern bm onto background, no depth
		if (patternToStereo) {
			for (let x = 0; x < this.fixedSize[0]; x += this.separation) {
				Bitmap32.clipBlit(this.bitmapList.pattern, [0, 0]
					, mainBM, [x, 0]
					, [this.separation, this.bitmapList.pattern.size[1]]);
			}
		}

		let patternAndDepthToStereo = true;
		// draw random bm onto background
		if (patternAndDepthToStereo) {
			const patternBM = this.bitmapList.pattern;
			const mainBMdata = mainBM.data32;
			let destIdxRight = this.separation;
			let destIdxStart = this.separation;
			const depthmap = this.bitmapList.depthmap;
			const depthmapdata = depthmap.data32;
			let imageIdx = 0;
			let imageIdxStart = imageIdx;

			// copy 1 copy of pattern to left to start things off
			Bitmap32.clipBlit(patternBM, [0, 0]
				, mainBM, [0, 0]
				, [this.separation, patternBM.size[1]]);
			// now copy pixel by pixel using a depth bitmap
			for (let j = 0; j < patternBM.size[1]; ++j) {
				for (let i = 0; i < mainBM.size[0] - this.separation; ++i) {
					const valCol = depthmapdata[imageIdx++];
					let depth = ((valCol + 0x80) & 0xff) - 0x80;
					depth *= this.depthMul;
					const dist = this.separation + depth;
					const destIdxLeft = destIdxRight - dist
					mainBMdata[destIdxRight++] =  mainBMdata[destIdxLeft];
				}
				destIdxStart += mainBM.size[0];
				destIdxRight = destIdxStart;
				imageIdxStart += depthmap.size[0];
				imageIdx = imageIdxStart;
			}
		}

		// draw depth bitmap to mainBM
		let drawDepthmap = this.eles.showDepthmap.checked;
		if (drawDepthmap) {
			const patternOffset = [this.separation, 0];
			Bitmap32.clipBlit(this.bitmapList.depthmap, [0, 0]
				, mainBM, patternOffset
				, this.bitmapList.depthmap.size);
		}

		// draw alignment triangles to backgound
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

		mainBM.clipCircle(p, this.separation / 8, colRed);

		// finally draw background to canvas
		this.ctx.putImageData(mainBM.imageData, 0, 0);
	}
}

const mainApp = new MainApp();
