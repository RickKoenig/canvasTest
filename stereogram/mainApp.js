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
		this.minSep = 50;
		this.maxSep = 300;
		this.startSep = 140;
		this.startDepthMul = 2;

		this.depthText = 1; // draw text at this depth

		this.maxFrames = 512; // for animation

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.backgndColor = Bitmap32p.strToColor32("lightblue");

		// bitmaps
		this.frame = 0;
		this.#initBitmaps(this.ctx, this.fixedSize);

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
		// separation
		makeEle(this.vp, "hr");
		{
			const label = "Separation";
			const min = this.minSep; //this.triSize * 2;
			const max = this.maxSep;
			const start = this.startSep;
			const step = 1;
			const callback = (v) => {this.separation = v};
			new makeEleCombo(this.vp, label, min, max, start, step, 0, callback);
		}
		// depth
		{
			const label = "Depth Mult";
			const min = -4;
			const max = 4;
			const start = this.startDepthMul;
			const step = 1;
			const callback = (v) => {this.depthMul = v};
			new makeEleCombo(this.vp, label, min, max, start, step, 0, callback);
		}
		// show depth map checkbox
		const ele = makeEle(this.vp, "span", "marg", null, "Show depth map");
		this.eles.showDepthmap = makeEle(ele, "input", null, null, null, null, "checkbox");
		//this.eles.showDepthmap.checked = true;
		// animation speed
		{
			const label = "Anim speed";
			const min = -8;
			const max = 8;
			const start = .25;
			const step = .25;
			const callback = (v) => {this.animSpeed = v};
			new makeEleCombo(this.vp, label, min, max, start, step, 2, callback);
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
		const ff = this.frame * 2 * Math.PI / this.maxFrames;
		this.sin = Math.sin(ff);
		this.cos = Math.cos(ff);
		this.cos5 = Math.cos(ff * 5);
		this.frame += .0625 * this.animSpeed;
		if (this.frame >= this.maxFrames) {
			this.frame -= this.maxFrames;
		} else if (this.frame < 0) {
			this.frame += this.maxFrames;
		}
	}

	#userDraw() {
		this.#drawBitmaps();
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		this.eles.info.innerText 
		= "Avg fps = " + this.avgFps.toFixed(2)
		+ "\nFrame = (" + this.frame.toFixed(2) + "/" + this.maxFrames + ")"
		+ "\nMouse = (" + this.input.mouse.mxy[0] 
		+ "," + this.input.mouse.mxy[1] + ")";
	}

	// proc
	#animate() {
		//  proc
		// update input system
		this.input.proc();
		// interact with mouse, calc all spaces
		this.plotter2d.proc(this.vp, this.input.mouse);
		// keep animation going
		requestAnimationFrame(() => this.#animate());

		// USER: do USER stuff
		 this.#userProc(); // proc and draw
		// update UI, vertical panel text

		// draw
		this.#userDraw();

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
		// create a Bitmap32p with some text on it
		const textString = "Hello!";
		// make a 2D context for the text
		const cvs = document.createElement('canvas');
		cvs.width = 590;
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
		ctxTxt.fillStyle = Bitmap32p.color32ToStr(depthColor32); // text color
		ctxTxt.fillText(textString, centerX, centerY);
		const textBM = new Bitmap32p([cvs.width, cvs.height]
			, ctxTxt.getImageData(0, 0, cvs.width, cvs.height).data);
		return textBM;
	}

	// -128 to 127 on significant red channel, tracers on green and blue channels for 'show depth'
	#depthToColor32(depth) {
		depth = Math.floor(depth);
		let r = depth;
		if (depth < 0) { // make unsigned
			r = depth + 256;
		}
		const r16 = r * 16;
		let g = r16 & 0xff;
		let b = (r16 >> 4) & 0xff;
		const col32 = Bitmap32p.color32(r, g, b);
		return col32;
	}

	#drawBall(dmap, p, r, d, dmul) {
		for (let y = 0; y <= r; ++y) {
			let dep = d + y  * dmul;
			if (dep < 0) {
				dep = 0;
			}
			let dc32 = this.#depthToColor32(dep);
			const x = Math.sqrt(r * r - y * y);
			dmap.clipCircle(p, x, dc32);
		}

	}

	#updateDepthMap() {
		// depth bitmap, use red channel for depth
		const mainBM = this.bitmapList.mainBM;
		if (!this.bitmapList.depthmap) {
			this.bitmapList.depthmap = new Bitmap32p([mainBM.size[0], mainBM.size[1] - this.triSize]);
		} else {
			this.bitmapList.depthmap.fill();
		}
		const depthmapBM = this.bitmapList.depthmap;
		const depthTextColor32 = this.#depthToColor32(this.depthText);
		// some text
		const textBM = this.#makeTextBM(depthTextColor32);
		Bitmap32p.clipBlit(textBM, [0 ,0]
			, depthmapBM, [100, 0]
			, textBM.size);
		// rectangles
		for (let i = 0; i < 8; ++i ) {
			const dc32 = this.#depthToColor32(i);
			depthmapBM.clipRect([100 + 15 * i, 180 + 15 * i], [300 - 30 * i,300 - 30 * i], dc32);
		}
		// more rectangles
		for (let i = 0; i < 8; ++i ) {
			const dc32 = this.#depthToColor32(-i);
			depthmapBM.clipRect([400 + 15 * i, 180 + 15 * i], [300 - 30 * i,300 - 30 * i], dc32);
		}
		// cone
		for (let i = 0; i < 8; ++i ) {
			const dc32 = this.#depthToColor32(i);
			depthmapBM.clipCircle([785, 195], 75 - 5 * i, dc32);
		}
		// inverted cone
		for (let i = 0; i < 8; ++i ) {
			const dc32 = this.#depthToColor32(-i);
			depthmapBM.clipCircle([785, 395], 75 - 5 * i, dc32);
		}
		// animate some balls
		this.#drawBall(depthmapBM, [115 + 80 + this.sin * 50, 485 + 60], 50, 2, .1);
		this.#drawBall(depthmapBM, [365 + 80 , 485 + 60], 50, 2 + 6 * this.sin, .1);
		this.#drawBall(depthmapBM, [615 + 80 + this.sin * 150, 555 + 60 + this.cos * 50], 50, 2, .1);
		this.#drawBall(depthmapBM, [615 + 80 - this.sin * 150, 555 + 60 - this.cos * 50], 50, 2 + this.cos5 * 4, .1);
	}

	#initBitmaps() {
		this.bitmapList = {};
		// draw everything here before sent to canvas
		this.bitmapList.mainBM = new Bitmap32p(this.fixedSize);

		// already fully loaded images, copy to bitmap list
		for (const imageName in this.images) {
			this.bitmapList[imageName] = new Bitmap32p(this.images[imageName]); // construct Bitmap32p from <images>
		}
		
		// draw depth map
		this.#updateDepthMap();


		// pattern bitmap, for now use random
		this.bitmapList.pattern = new Bitmap32p([this.maxSep, this.fixedSize[1] - this.triSize]);
		const patData = this.bitmapList.pattern.data32;
		for (let i = 0; i < patData.length; ++i) {
			patData[i] = 0xff000000 + 0x1000000 * Math.random();
		}

		// triangle bitmap used for cross eye alignment
		this.bitmapList.triangle = new Bitmap32p([2 * this.triSize - 1, this.triSize], this.backgndColor);
		for (let i = 0; i < this.triSize; ++i) {
			this.bitmapList.triangle.clipRect([this.triSize - i - 1, i], [2 * i + 1, 1], Bitmap32p.strToColor32("black"));
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
		const mainBM = this.bitmapList.mainBM;
		// start with background
		mainBM.fill(this.backgndColor);
		let patternToStereo = false;
		// draw pattern bm onto background, no depthmap
		if (patternToStereo) {
			for (let x = 0; x < this.fixedSize[0]; x += this.separation) {
				Bitmap32p.clipBlit(this.bitmapList.pattern, [0, 0]
					, mainBM, [x, 0]
					, [this.separation, this.bitmapList.pattern.size[1]]);
			}
		}

		let patternAndDepthToStereo = true;
		// draw random bm onto background with depthmap
		if (patternAndDepthToStereo) {
			this.#updateDepthMap();
			const patternBM = this.bitmapList.pattern;
			const mainBMdata = mainBM.data32;
			let destIdxRight = this.separation;
			let destIdxStart = this.separation;
			const depthmap = this.bitmapList.depthmap;
			const depthmapdata = depthmap.data32;
			let imageIdx = 0;
			let imageIdxStart = imageIdx;

			// copy 1 copy of pattern to left to start things off
			Bitmap32p.clipBlit(patternBM, [0, 0]
				, mainBM, [0, 0]
				, [this.separation, patternBM.size[1]]);
			// now copy pixel by pixel using a depth bitmap
			for (let j = 0; j < patternBM.size[1]; ++j) {
				for (let i = 0; i < mainBM.size[0] - this.separation; ++i) {
					const valCol = depthmapdata[imageIdx++];
					let depth = ((valCol + 0x80) & 0xff) - 0x80;
					depth *= this.depthMul;
					const dist = this.separation - depth;
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
			Bitmap32p.clipBlit(this.bitmapList.depthmap, [0, 0]
				, mainBM, patternOffset
				, this.bitmapList.depthmap.size);
		}

		// draw alignment triangles to backgound
		const leftTriX = mainBM.size[0] / 2 - Math.floor((1 + this.separation) / 2);
		const rightTriX = mainBM.size[0] / 2 + Math.floor(this.separation / 2);
		Bitmap32p.clipBlit(this.bitmapList.triangle, [0,0]
			, mainBM, [leftTriX - this.bitmapList.triangle.size[1] + 1, mainBM.size[1] - this.bitmapList.triangle.size[1]]
			, this.bitmapList.triangle.size);
		Bitmap32p.clipBlit(this.bitmapList.triangle, [0,0]
			, mainBM, [rightTriX - this.bitmapList.triangle.size[1] + 1, mainBM.size[1] - this.bitmapList.triangle.size[1]]
			, this.bitmapList.triangle.size);

		// very simple cursor
		const p = this.input.mouse.mxy;
		const colRed = Bitmap32p.strToColor32("red");
		const p0 = [p[0] - 2, p[1]];
		const p1 = [p[0] + 2, p[1]];
		const p2 = [p[0], p[1] - 2];
		const p3 = [p[0], p[1] + 2];
		mainBM.clipPutPixel(p0, colRed);
		mainBM.clipPutPixel(p1, colRed);
		mainBM.clipPutPixel(p2, colRed);
		mainBM.clipPutPixel(p3, colRed);

		// finally draw background to canvas
		this.ctx.putImageData(mainBM.imageData, 0, 0);
	}
}

const mainApp = new MainApp();
