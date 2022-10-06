'use strict';

// handle the html elements, do the UI on verticalButtons, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	static #numInstances = 0; // test static members
	constructor() {
		console.log("creating instance of MainApp");
		++MainApp.#numInstances;

		//console.log("ids of verticalButtons");
		// put all elements with getElementById from 'verticalButtons' into MainApp class
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

		this.startCenter = [.5, .5];
		this.startZoom = .5;

		// add all the event listeners and initialize elements
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
		this.plotter2d = new Plotter2d(this.ctx, this.startCenter, this.startZoom);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		// user init section
		this.numPnts = 5;
		this.pntRad = .05; // size of point
		this.pnts = createArray(this.numPnts, 2); // array of 'two' dimensional points
		for (let i = 0; i < this.numPnts; ++i) {
			this.pnts[i] = [.25 + .5 * i, .5 + .25 * i];
		}

		this.numPnts2 = 3;
		this.pntRad2 = .15; // size of point
		this.pnts2 = createArray(this.numPnts2, 2); // array of 'two' dimensional points
		for (let i = 0; i < this.numPnts2; ++i) {
			this.pnts2[i] = [.25 + .5 * i, 1.5 + .25 * i];
		}

		// interactive edit of points
		this.editPnts = new EditPnts(this.pnts, this.pntRad);
		this.editPnts2 = new EditPnts(this.pnts2, this.pntRad2);

		// start off the repeated calls to #animate
		this.#animate();
	}

	#buttonScaleCamReset() {
		this.plotter2d.scaleReset();
	}

	#buttonXTransCamReset() {
		this.plotter2d.xTransReset();
	}

	#buttonYTransCamReset() {
		this.plotter2d.yTransReset();
	}

	static getNumInstances() { // test static methods
		return MainApp.#numInstances;
	}

	// update some of the UI all innerHTML
	#updateUI() {
		const p = this.plotter2d;
		const plotMouse =  "<br>Move points around<br>and press buttons<br>"
			+ "LMB to edit, RMB to navigate"
			+ "<br>mouse = (" + p.userMouse[0].toFixed(2) 
			+ ", " + p.userMouse[1].toFixed(2) + ")";
		this.title.innerHTML = plotMouse;
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

	// user section
	#proc() {
		// proc
		// pass in the buttons and the user/cam space mouse from drawPrim
		this.editPnts.proc(this.input.mouse, this.plotter2d.userMouse);
		this.editPnts2.proc(this.input.mouse, this.plotter2d.userMouse);


		// draw with hilits on some points
		const hilitPntIdx = this.editPnts.getHilitIdx();
		for (let i = 0; i < this.numPnts; ++i) {
			this.drawPrim.drawCircle(this.pnts[i], this.pntRad, "green");
			let doHilit = i == hilitPntIdx;
			this.drawPrim.drawCircleO(this.pnts[i], this.pntRad, .01, doHilit ? "yellow" : "black");
		}
		// draw some extra stuff like lines and midpoints
		for (let i = 0; i < this.numPnts; ++i) {
			const p0 = this.pnts[i];
			const p1 = this.pnts[(i + 1) % this.numPnts];
			this.drawPrim.drawLine(p0, p1, "darkgray");
			const mid = midPnt(p0, p1);
			this.drawPrim.drawCircleO(mid, .05, undefined, "magenta");
		}

		// draw with hilits on some points2
		const hilitPntIdx2 = this.editPnts2.getHilitIdx();
		for (let i = 0; i < this.numPnts2; ++i) {
			this.drawPrim.drawCircle(this.pnts2[i], this.pntRad2, "green");
			let doHilit = i == hilitPntIdx2;
			this.drawPrim.drawCircleO(this.pnts2[i], this.pntRad2, .01, doHilit ? "yellow" : "black");
		}
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

		// calc all spaces, interact with mouse if doMapMode is true
		this.plotter2d.proc(wid, hit, this.input.mouse, Mouse.RIGHT); 

		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);

		// now in user/cam space
		this.graphPaper.draw("X", "Y");

		this.#proc(); // do user stuff

		// update UI, text
		this.#updateUI();
		
		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
console.log("Num instances of MainApp = " + MainApp.getNumInstances()); // and test static methods
