'use strict';

// handle the html elements, do the UI on verticalButtons, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #numInstances = 0; // test static members
	constructor() {
		console.log("creating instance of MainApp");
		++MainApp.#numInstances;

		console.log("ids of verticalButtons");
		const vb = document.getElementById("verticalButtons");
		const vba = vb.getElementsByTagName("*");
		for (const htmle of vba) {
			if (htmle.id.length) {
				this[htmle.id] = document.getElementById(htmle.id);
			}
		}

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// some SWITCHES
		this.doMapMode = false; // show a lot of messages, input, dimensions etc.
		// end some SWITCHES

		// add all the event listeners and initialize elements

		// MODE EDIT/MOVE
		this.checkboxMapMode.addEventListener('change', () => {
			//console.log("parametric changed to " + this.checkboxParametric.checked);
			this.doMapMode = this.checkboxMapMode.checked;
		});
		this.checkboxMapMode.checked = this.doMapMode; // UI checkbox toggle init

		// scale reset button
		this.buttonScaleCam.addEventListener('click', () => {
			//console.log("scale camera reset");
			this.#buttonScaleCamReset();
		});
		// x trans reset button
		this.buttonXTransCam.addEventListener('click', () => {
			//console.log("X trans camera reset");
			this.#buttonXTransCamReset();
		});
		// y trans reset button
		this.buttonYTransCam.addEventListener('click', () => {
			//console.log("Y trans camera reset");
			this.#buttonYTransCamReset();
		});

		// fire up all instances of the classes that are needed
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.plotter2d = new Plotter2d(this.ctx);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		

		// user init section
		this.numPnts = 5;
		this.pntRad = .03125;
		this.threshRad = .0625;
		this.pnts = createArray(this.numPnts, 2);
		fillArray(this.pnts, 0);


		// start it off
		this.#animate();
	}

	#buttonScaleCamReset() {
		this.plotter2d.scaleReset();
	}

	#buttonXTransCamReset() {
		const p = this.plotter2d;
		p.center[0] = 0;
	}

	#buttonYTransCamReset() {
		const p = this.plotter2d;
		p.center[1] = 0;
	}

	static getNumInstances() { // test static methods
		return MainApp.#numInstances;
	}

	// update some of the UI
	#updateUI() {
		const p = this.plotter2d;
		const plotMouse =  "Move points around<br>and press buttons"
			+ "<br>mouse = (" + p.userMouse[0].toFixed(2) 
			+ ", " + p.userMouse[1].toFixed(2) + ")";
		this.title.innerHTML = plotMouse;
		this.mode.innerHTML = this.doMapMode ? "MOVE" : "EDIT";
		this.textScaleCam.innerHTML = "zoom = " + p.zoom.toFixed(4) + ", logZoom = " + p.logZoom.toFixed(3);
		this.textXTransCam.innerHTML = "center[0] = " + p.center[0].toFixed(2);
		this.textYTransCam.innerHTML = "center[1] = " + p.center[1].toFixed(2);
	}

	// given size of window or a fixed size set canvas size
	#calcCanvasSize() {
		const fixedDim = false;
		if (fixedDim) {
			const fixedSize = [800, 600];
			// set canvas size to a fixed size
			this.plotter2dCanvas.width = fixedSize[0];
			this.plotter2dCanvas.height = fixedSize[1];
		} else {
			// set canvas size depending on window size
			// TODO: get rid of magic numbers
			const wid = window.innerWidth - 450;
			const hit = window.innerHeight - 100;
			this.plotter2dCanvas.width = Math.max(200, wid);
			this.plotter2dCanvas.height = Math.max(750, hit);
		}
	}

	#dist2dsq(p0, p1) {
		const d = [p1[0] - p0[0], p1[1] - p0[1]];
		return d[0] * d[0] + d[1] * d[1];
	}


	// user section
	#proc() {
		const key = this.input.keyboard.key;
		// 'm' keyboard shortcut
		if (key) {
			switch(key) {
			case 'm'.charCodeAt(0) :
				this.doMapMode = !this.doMapMode;
				this.checkboxMapMode.checked = this.doMapMode; // UI checkbox toggle init
			}
		}

		if (!this.doMapMode) {
			// do edit mode instead, modify p0
			let butDown = this.input.mouse.mbutcur[0];
			if (butDown) {
				this.pnts[0] = this.plotter2d.userMouse;
			}
		}
		this.drawPrim.drawCircle(this.pnts[0], this.pntRad, "green");
		const inside = this.#dist2dsq(this.pnts[0], this.plotter2d.userMouse) < this.threshRad * this.threshRad;
		this.drawPrim.drawCircleO(this.pnts[0], this.threshRad, .0025, inside ? "magenta" : "brown");
	}

	// process every frame
	#animate() {
		// update input system
		this.input.proc();

		// re-adjust canvas size depending on the window resize
		this.#calcCanvasSize();

		// proc/draw all the classes
		const wid = this.plotter2dCanvas.width;
		const hit = this.plotter2dCanvas.height;

		// interact with mouse, calc all spaces
		this.plotter2d.proc(wid, hit, this.input.mouse, this.doMapMode);

		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);

		// now in user/cam space
		this.graphPaper.draw("X", "Y");

		this.#proc();

		// update UI, text
		this.#updateUI();
		
		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}

}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
