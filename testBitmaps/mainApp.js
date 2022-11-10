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

		// USER before UI built
		this.#loadBitmaps();
	}

	// after assets loaded
	// TODO: promise to learn promises
	#isloaded() {
		this.#userInit();
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

	// USER: add more members or classes to MainApp
	#userInit() {
		this.fixedSize = [800, 600];
		this.useSliders = false;
		this.rectSize = vec2.create();

		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		// some rectangle
		this.sliderstartSize = vec2.fromValues(300, 200);
		this.sliderSize = vec2.clone(this.sliderstartSize);
		this.minSize = vec2.create();
		this.maxSize = vec2.clone(this.fixedSize);

		// bitmaps
		//this.bm = new Bitmap32(this.ctx, this.fixedSize);
		this.#initTestBitmaps(this.ctx, this.fixedSize);
	}

	#userBuildUI() {
		// width height slider combo
		{
			makeEle(this.vp, "hr");
			// start width UI
			let label = "Width";
			let min = this.minSize[0];
			let max = this.maxSize[0];
			let start = this.sliderstartSize[0];
			let step = 1;
			let precision = 0;
			this.widthEle = new makeEleCombo(this.vp, label, min, max, start, step, precision
				, (v) => {this.sliderSize[0] = v});
			// end width UI

			// start height UI
			label = "Height";
			min = this.minSize[1];
			max = this.maxSize[1];
			start = this.sliderstartSize[1];
			step = 1;
			precision = 0;
			this.heightEle = new makeEleCombo(this.vp, label, min, max, start, step, precision
				, (v) => {this.sliderSize[1] = v});
			// end height UI
		}

		makeEle(this.vp, "hr");
		makeEle(this.vp, "button", null, null, "Reset All"
			, () => {this.widthEle.resetValue(); this.heightEle.resetValue(); }
		);

		makeEle(this.vp, "hr");
		const ele = makeEle(this.vp, "span", null, "marg", "Use Sliders, Not mouse");
		this.eles.checkboxUseSliders = makeEle(ele, "input", "checkboxUseSliders", null, "checkboxUseSliders", null, "checkbox");
		this.eles.checkboxUseSliders.checked = this.useSliders; // UI checkbox toggle init

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

		const mxy = this.input.mouse.mxy;
		this.useSliders = this.eles.checkboxUseSliders.checked; // poll, UI checkbox toggle use sliders
		if (this.useSliders) { // rect size is from sliders
			vec2.copy(this.rectSize, this.sliderSize);
		} else { // rect size and sliders are from mouse
			if (this.input.mouse.mbut[0]) {
				vec2.copy(this.rectSize, mxy);
				this.widthEle.setValue(mxy[0]);
				this.heightEle.setValue(mxy[1]);
			}
		}
		// test bitmap
		this.#drawTestBitmap(this.ctx
			, [this.plotter2dCanvas.width, this.plotter2dCanvas.height]);

			this.drawPrim.drawRectangle([0, 0], this.rectSize, "red");
			this.drawPrim.drawRectangleO([0, 0], this.rectSize, 5);
	
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
		const area = this.rectSize[0] * this.rectSize[1];
		this.eles.info.innerText 
			= "Info: width = " + this.rectSize[0]
			+ "\nheight = " + this.rectSize[1]
			+ "\narea = " + area
			+ "\navg fps = " + this.avgFps.toFixed(2);
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

	#loadOne() {
		++this.loadcnt;
		if (this.loadcnt == this.reqcnt) {
			// everything is now loaded
			this.#isloaded();
		}

	}

	#loadBitmaps() {
		// TODO: promise to learn promises
		this.imageNames = ["maptestnck.png", "panel.jpg", "Bark.png"];
		this.images = {};
		this.loadcnt = 0;
		this.reqcnt = this.imageNames.length;

		for (const imgName of this.imageNames) {
			//console.log(`imgName = ${imgName}`);
			const idx = imgName.indexOf(".");
			const shortImg = imgName.slice(0, idx);
			//console.log(`shortimg = ${shortImg}`);

			const imgEle = new Image();
			imgEle.src = "../bitmaps/" + imgName;
			this.images[shortImg] = imgEle;
			  
			if (imgEle.complete) {
				this.#loadOne();
			} else {
				imgEle.addEventListener('load', () => {
					this.#loadOne();
				})
				imgEle.addEventListener('error', function() {
					alert('error');
				});
			}
		}
	}

	#initTestBitmaps() {
		// TODO: promise to learn promises
		this.imageData = {};
		for (const image in this.images) {
			console.log(`short name = ${image}`);
			//this.imageData[image] = this.ctx.getImageData(0, 0, this.images[image].width, this.images[image].height);
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');
			const img = this.images[image];
			canvas.width = img.width;
			canvas.height = img.height;
			context.drawImage(img, 0, 0 );
			this.imageData[image] = context.getImageData(0, 0, img.width, img.height);
		}
	}

	#drawTestBitmap() {
		/*
		var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
var img = document.getElementById('myimg');
canvas.width = img.width;
canvas.height = img.height;
context.drawImage(img, 0, 0 );
var myData = context.getImageData(0, 0, img.width, img.height);
*/
//		const bm = new Bitmap32(ctx, size); // NYI

		// test bitmaps (ImageData)
		const width = this.fixedSize[0]
		const height = this.fixedSize[1];
		var ab = new ArrayBuffer(width * height * 4);
		const arr = new Uint8ClampedArray(ab);
		const arr4 = new Uint32Array(ab);
		// Fill the array with the some RGBA values
		for (let i = 0; i < arr4.length; ++i) {
			arr4[i] = getRandomInt(256*256*256) + 256*256*256*255;
		}
		// Initialize a new ImageData object
		let imageData = new ImageData(arr, this.fixedSize[0], this.fixedSize[1]);
		// Draw image data to the canvas
		this.ctx.putImageData(imageData, 0, 0);
		
		this.ctx.putImageData(this.imageData.Bark, 0, 0);
		this.ctx.putImageData(this.imageData.maptestnck, 512, 0);
		this.ctx.putImageData(this.imageData.panel, 600, 0);
		
	}
}

const mainApp = new MainApp();
