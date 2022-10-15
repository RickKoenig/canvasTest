'use strict';

// handle the html elements, do the UI on verticalButtons, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	constructor() {
		const vb = document.getElementById("verticalButtons");
		populateElementIds(vb, this);

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");


		// fire up all instances of the classes that are needed (part1)
		// vb is for UI trans, scale info and reset
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, vb);
		// add all the event listeners and initialize elements

		// scale reset button
		this.buttonScaleCam.addEventListener('click', () => {
			this.#buttonScaleCamReset();
		});
		// x trans reset button
		this.buttonXTransCam.addEventListener('click', () => {
			this.#buttonXTransCamReset();
		});
		// y trans reset button
		this.buttonYTransCam.addEventListener('click', () => {
			this.#buttonYTransCamReset();
		});
		

		// fire up all instances of the classes that are needed (part2)
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		// start it off
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


	#proc() {
		this.drawPrim.drawCircle([.75, .5], .08, "green");
		this.drawPrim.drawCircle([this.plotter2d.userMouse[0], this.plotter2d.userMouse[1]], .08, "green");
	}

	// update some of the UI
	#updateUI() {
		const p = this.plotter2d;
		const plotMouse =  "Hail 1 test<br>"
			+ "<br>Mouse = (" + p.userMouse[0].toFixed(2) 
			+ ", " + p.userMouse[1].toFixed(2) + ")";
		this.title.innerHTML = plotMouse;
		this.textScaleCam.innerHTML = "zoom = " + p.zoom.toFixed(2) + ", logZ = " + p.logZoom.toFixed(2);
		this.textXTransCam.innerHTML = "center[0] = " + p.center[0].toFixed(2);
		this.textYTransCam.innerHTML = "center[1] = " + p.center[1].toFixed(2);
	}

	// slower rate of speed, skip sometimes, depends on num and den
	#animate() {
		// update input system
		this.input.proc();

		// interact with mouse, calc all spaces
		this.plotter2d.proc(this.input.mouse);

		// update UI, text
		this.#updateUI();
		
		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);

		// now in user/cam space
		this.graphPaper.draw(this.doParametric ? "X" : "T", "Y");

		this.#proc(); // do user stuff

		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
