'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	constructor() {
		// vertical panel UI
		const vp = document.getElementById("verticalPanel");

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// fire up all instances of the classes that are needed (part1)
		// vp is for UI trans, scale info, reset and USER
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, vp);

		// fire up all instances of the classes that are needed (part2)
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		 // add all elements from vp to this
		 populateElementIds(vp, this);

		// start it off
		this.#animate();

		// USER
		this.#userInit();
	}

	// USER
	#userInit() {
	}

	// update some of the UI
	#userUpdateInfo() {
		const p = this.plotter2d;
		const plotMouse =  "Hail 1 test<br>"
			+ "<br>Mouse = (" + p.userMouse[0].toFixed(2) + ", " + p.userMouse[1].toFixed(2) + ")";
		this.title.innerHTML = plotMouse;
	}

	#userProc() {
		this.drawPrim.drawCircle([.75, .5], .08, "green");
		this.drawPrim.drawCircle([this.plotter2d.userMouse[0], this.plotter2d.userMouse[1]], .08, "green");
	}

	// proc
	#animate() {
		// update input system
		this.input.proc();
		// interact with mouse, calc all spaces
		this.plotter2d.proc(this.vp, this.input.mouse);
		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);
		// now in user/cam space
		this.graphPaper.draw(this.doParametric ? "X" : "T", "Y");
		// keep animation going
		requestAnimationFrame(() => this.#animate());

		// do USER stuff
		 this.#userProc(); // proc and draw
		// update UI, vertical panel text
		this.#userUpdateInfo();

	}
}

const mainApp = new MainApp();
