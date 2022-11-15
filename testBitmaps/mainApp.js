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
		const imageNames = ["Bark.png", "panel.jpg", "maptestnck.png"];
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

		// bitmaps
		this.#initTestBitmaps(this.ctx, this.fixedSize);

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER, no vp means don't use any ui for trans and scale
		// only use screen space
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, null, this.startCenter, this.startZoom, this.fixedSize); 
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.#animate();
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.info = makeEle(this.vp, "pre", null, "Info");
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
		this.#drawTestBitmaps(this.ctx
			, [this.plotter2dCanvas.width, this.plotter2dCanvas.height]);

		// checker board
		const checkX = 16;
		const checkY = 16;
		for (let j = 0; j < checkY; ++j) {
			for (let i = 0; i < checkX; ++i) {
				const color = (i & 1) ^ (j & 1) ? "white" : "black";
				this.drawPrim.drawRectangle([175 + i, 75 + j], [1, 1], color);
			}
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		this.eles.info.innerText 
		= "Avg fps = " + this.avgFps.toFixed(2)
		+ "\nMouse = (" + this.input.mouse.mxy[0] + "," + this.input.mouse.mxy[1] + ")";
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

	#loadOneBitmap() {
		++this.loadcnt;
		if (this.loadcnt == this.reqcnt) {
			// everything is now loaded
			this.#userInit();
		}
	}

	#loadImages(imageNames) {
		// TODO: promise to learn promises
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

	#initTestBitmaps() {
		// TODO: promise to learn promises
		this.bitmapData = {};
		for (const imageName in this.images) { // already fully loaded images
			this.bitmapData[imageName] = new Bitmap32(this.images[imageName]);
		}
		this.bitmapData["solidColor"] = new Bitmap32([200, 150], "green");
		
		this.bitmapData["blacky"] = new Bitmap32([200, 150]);
		
		const c32blue = Bitmap32.strToColor32("blue");
		const c32red = Bitmap32.strToColor32("red");
		const c32green = Bitmap32.strToColor32("green");
		const c32yellow = Bitmap32.strToColor32("yellow");
		const c32pink = Bitmap32.strToColor32("pink");

		const data = new Uint32Array(
			[
				c32blue, c32red, c32green, c32yellow,
				c32pink, c32pink, c32pink, c32pink,
				c32yellow, c32red, c32yellow, c32green,
				c32green, c32pink, c32yellow, c32blue
			]
		);
		this.bitmapData["data"] = new Bitmap32([4, 4], data); // from uint32 data
		this.bitmapData["putPixel"] = new Bitmap32([128, 64]); // Bitmap32 test draw methods
	}

	#drawTestBitmaps() {
		// update putPixel test bitmap
		const dest = this.bitmapData["putPixel"];
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

			
		// draw all bitmaps in a grid onto the canvas
		let cnt = 0;
		for (const imageName in this.bitmapData) {
			let xo = cnt % 3;
			let yo = Math.floor(cnt / 3);
			this.ctx.putImageData(this.bitmapData[imageName].imageData
				, xo * 275 + 10, yo * 275 + 10);
			++cnt;
		}
	}
}

const mainApp = new MainApp();
