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

		//1st triangle
		this.pntRad = .05; // size of point
		this.pnts = [
			[1, 1],
			[2, 1],
			[1.5, 2]
		];
		this.numPnts = this.pnts.length;

		// interactive edit of points
		this.editPnts = new EditPnts(this.pnts, this.pntRad);

		// 2nd triangle
		this.pntRad2 = .07; // size of point
		this.pnts2 = [
			[-1, .25],
			[0, .25],
			[-.5, 1.25]
		];
		this.numPnts2 = this.pnts2.length;

		// interactive edit of points
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

	#calcTriPerimeter(pnts) {
		let perm = 0;
		for (let i = 0; i < 3; ++i) {
			let j = (i + 1) %3;
			perm += dist2d(pnts[i], pnts[j]);
		}
		return perm;
	}

	// TODO: use glMatrix package
	#calcTriArea(pnts) {
		const del1 = [pnts[1][0] - pnts[0][0], pnts[1][1] - pnts[0][1]];
		const del2 = [pnts[2][0] - pnts[0][0], pnts[2][1] - pnts[0][1]];
		return .5 * Math.abs(del1[0] * del2[1] - del1[1] * del2[0]);
	}

	#calcTriOutside(pnts) {
		const slope01 = [pnts[1][0] - pnts[0][0], pnts[1][1] - pnts[0][1]];
		const slope02 = [pnts[2][0] - pnts[0][0], pnts[2][1] - pnts[0][1]];
		const p0 = midPnt(pnts[0], pnts[1]);
		const p2 = midPnt(pnts[0], pnts[2]);
		// perpendicular
		const p1 = [p0[0] + slope01[1], p0[1] - slope01[0]];
		const p3 = [p2[0] + slope02[1], p2[1] - slope02[0]];
		const isect = getIntSect(p0, p1, p2, p3);
		return {
			center: isect,
			radius: dist2d(isect, pnts[0])
		};
	}

	#calcTriInside(pnts) {
		const lens = [];
		for (let i = 0; i < 3; ++i) {
			const j = (i + 1) % 3;
			lens.push(dist2d(pnts[i], pnts[j]));
		}
		// s0 + s1 = len0, s1 + s2 = len1, s2 + s0 = len2
		// solve a, b, c
		let slv = new Array(3);
		slv[0]  = ( lens[0] - lens[1] + lens[2]) / 2;
		slv[1]  = ( lens[0] + lens[1] - lens[2]) / 2;
		slv[2]  = (-lens[0] + lens[1] + lens[2]) / 2;

		const newMidPnts = [];
		for (let i = 0; i < 3; ++i) {
			const j = (i + 1) % 3;
			const newMidPnt = new Array(2);
			const del = [pnts[j][0] - pnts[i][0], pnts[j][1] - pnts[i][1]];
			const rat = slv[i] / lens[i]; // walk the line to where we want to go
			newMidPnt[0] = pnts[i][0] + del[0] * rat;
			newMidPnt[1] = pnts[i][1] + del[1] * rat;
			newMidPnts.push(newMidPnt);
		}
		return this.#calcTriOutside(newMidPnts);
	}

	#calcSectors(pnts)
	{
		const ret = [
			[[.1, .3], [.2, .4]],
			[[.12, .33], [.24, .48]],
			[[.14, .36], [.28, .44]]
		];
		return ret;

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
	
		this.triangleInfo.innerHTML = "Perimeter: " 
								+ this.#calcTriPerimeter(this.pnts).toFixed(3) + "<br>Area: "
								+ this.#calcTriArea(this.pnts).toFixed(3);
	}

	#proc() {
		// proc
		// pass in the buttons and the user/cam space mouse from drawPrim
		this.editPnts.proc(this.input.mouse, this.plotter2d.userMouse);
		this.editPnts2.proc(this.input.mouse, this.plotter2d.userMouse);


		// 1st set of points
		// draw with hilits on some points
		const hilitPntIdx = this.editPnts.getHilitIdx();
		for (let i = 0; i < this.numPnts; ++i) {
			this.drawPrim.drawCircle(this.pnts[i], this.pntRad * .5, "green");
			if (i == hilitPntIdx) {
				this.drawPrim.drawCircleO(this.pnts[i], this.pntRad, .01, "yellow");
			}
		}
		// draw lines connecting the 3 points
		for (let i = 0; i < this.numPnts; ++i) {
			const p0 = this.pnts[i];
			const p1 = this.pnts[(i + 1) % this.numPnts];
			this.drawPrim.drawLine(p0, p1, .01, "brown");
		}

		const cirInside = this.#calcTriInside(this.pnts);
		const cirOutside = this.#calcTriOutside(this.pnts);

		this.drawPrim.drawCircleO(cirInside.center, cirInside.radius, .01, "magenta");
		this.drawPrim.drawCircleO(cirOutside.center, cirOutside.radius, .01, "blue");




		// 2nd set of points
		const hilitPntIdx2 = this.editPnts2.getHilitIdx();
		for (let i = 0; i < this.numPnts2; ++i) {
			this.drawPrim.drawCircle(this.pnts2[i], this.pntRad2 * .5, "green");
			if (i == hilitPntIdx2) {
				this.drawPrim.drawCircleO(this.pnts2[i], this.pntRad2, .01, "black");
			}
		}
		// draw lines connecting the 3 points
		for (let i = 0; i < this.numPnts2; ++i) {
			const p0 = this.pnts2[i];
			const p1 = this.pnts2[(i + 1) % this.numPnts];
			this.drawPrim.drawLine(p0, p1, .01, "darkcyan");
		}
		// calc ang bi/tri sectors
		const sect = this.#calcSectors(this.pnts2);
		for (let i = 0; i < this.numPnts2; ++i) {
			const p0 = sect[i][0];
			const p1 = sect[i][1];
			this.drawPrim.drawLine(p0, p1, .01, "maroon");
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
