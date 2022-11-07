'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now, assume 60hz refresh rate
class MainApp {
	constructor() {

		this.fixedSize = [800, 600];

		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		this.eles = {}; // keep track of eles in vertical panel

		// USER before UI built
		this.#userInit();

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

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
		this.useSliders = false;

		// some rectangle
		this.sliderstartSize = vec2.fromValues(300, 200);
		this.sliderSize = vec2.clone(this.sliderstartSize);
		this.minSize = vec2.create();
		this.maxSize = vec2.clone(this.fixedSize);
	}

	#userBuildUI() {
		// width slider combo
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

		const ele = makeEle(this.vp, "span", null, "marg", "Use Sliders");
		this.eles.checkboxUseSliders = makeEle(ele, "input", "checkboxUseSliders", null, "checkboxUseSliders", null, "checkbox");
		this.eles.checkboxUseSliders.checked = this.useSliders; // UI checkbox toggle init

		makeEle(this.vp, "hr");
		this.eles.info = makeEle(this.vp, "pre", null, "Info");
	}

	#userProc() { // USER:
		this.useSliders = this.eles.checkboxUseSliders.checked; // UI checkbox toggle init
		this.rectSize = this.useSliders ? this.sliderSize : this.input.mouse.mxy;
		this.drawPrim.drawRectangle([0, 0], this.rectSize, "red");
		this.drawPrim.drawRectangleO([0, 0], this.rectSize, 5);
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		const area = this.rectSize[0] * this.rectSize[1];
		this.eles.info.innerText 
			= "Info: width = " + this.rectSize[0]
			+ "\nheight = " + this.rectSize[1]
			+ "\narea = " + area;
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
}

const mainApp = new MainApp();
