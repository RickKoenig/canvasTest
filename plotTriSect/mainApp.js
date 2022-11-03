'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	constructor() {
		console.log("creating instance of MainApp");

		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		//this.vp = null; // OR, no vertical panel UI
		this.eles = {}; // keep track of eles in vertical panel

		// add all elements from vp to ele if needed
		// uncomment if you need elements from vp html
		//populateElementIds(this.vp, this.eles);

		// USER before UI built
		this.#userInit();

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, this.vp, this.startCenter, this.startZoom);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.#animate();
	}

	// USER: add more members or classes to MainApp
	#userInit() {
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
		
		// before firing up Plotter2d
		this.startCenter = [.5, .5];
		this.startZoom = .5;
	}

	#userBuildUI() {
		if (!this.vp) {
			return;
		}
		// elements
		this.eles = {};
		makeEle(this.vp, "hr");
		this.eles.triInfo = makeEle(this.vp, "pre", null, null, "triInfo");
	}

	#userProc() {
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

		// draw interior and exterior circles
		const cirInside = this.#calcTriInside(this.pnts);
		const cirOutside = this.#calcTriOutside(this.pnts);

		this.drawPrim.drawCircleO(cirInside.center, cirInside.radius, .01, "magenta");
		this.drawPrim.drawCircleO(cirOutside.center, cirOutside.radius, .01, "blue");


		// 2nd set of points, do trisect equilateral triangle problem
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
		const sects = this.#calcSectors(this.pnts2);

		const isects = new Array(3);
		// draw sectors
		for (let i = 0; i < sects.length; ++i) {
			const k = (i + 1) % sects.length;
			const sect0 = sects[i];
			const sect1 = sects[k];
			// calc and draw the intsect of triSect lines
			const line0 = sect0[0];
			const line1 = sect1[1];
			const isect = getIntSect(line0[0], line0[1], line1[0], line1[1]);
			if (isect) {
				this.drawPrim.drawCircle(isect, .02, "black");
				isects[i] = isect;
			}
		}
		// draw interior triangle
		for (let i = 0; i < isects.length; ++i) {
			const j = (i + 2) % isects.length;
			this.drawPrim.drawLine(isects[i], isects[j], .01, "black");
			this.drawPrim.drawLine(this.pnts2[i], isects[i], .01, "brown");
			this.drawPrim.drawLine(this.pnts2[i], isects[j], .01, "brown");
		}
	}

	#userUpdateInfo() {
		if (!this.vp) {
			return;
		}
		this.eles.triInfo.innerText = "Perimeter " 
			+ this.#calcTriPerimeter(this.pnts).toFixed(3) 
			+ "\nArea: "
			+ this.#calcTriArea(this.pnts).toFixed(3);
	}

	// process every frame
	#animate() {
		// update input system
		this.input.proc();
		// interact with mouse, calc all spaces
		this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT);
		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);
		// now in user/cam space
		this.graphPaper.draw("X", "Y");
		// keep animation going
		requestAnimationFrame(() => this.#animate());

		// USER: do USER stuff
		this.#userProc(); // proc and draw
		// update UI, text
		this.#userUpdateInfo();
	}
	
	// USER: update some of the UI in vertical panel if there is some in the HTML
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

	#deltaLine(pnt, angM) {
		const delM = new Array(2);
		delM[0] = Math.cos(angM);
		delM[1] = Math.sin(angM);
		const scl = .25;
		const offset = [pnt[0] + delM[0] * scl, pnt[1] + delM[1] * scl];
		const ln = [pnt, offset];
		return ln;
	}

	#calcSectors(pnts) {
		const numSect = 3; // triSect angles
		const ret = new Array(3); // 3 for triangle
		for (let i = 0; i < 3; ++i) {
			const sect = new Array(numSect - 1);

			const j = (i + 1) % 3;
			const k = (i + 2) % 3;
			const del0 = new Array(2);
			const del1 = new Array(2);
			del0[0] = pnts[j][0] - pnts[i][0];
			del0[1] = pnts[j][1] - pnts[i][1];
			del1[0] = pnts[k][0] - pnts[i][0];
			del1[1] = pnts[k][1] - pnts[i][1];
			// murder some kittens ('IQ')
			const ang0 = Math.atan2(del0[1], del0[0]);
			const ang1 = Math.atan2(del1[1], del1[0]);

			let dela = ang1 - ang0;
			dela = normAngRadSigned(dela);
			for (let j = 0; j < numSect - 1; ++j) {
				let angM = ang0 + dela * (j + 1) / numSect; // skip 0 and numSect
				angM = normAngRadUnsigned(angM);
				const lnM = this.#deltaLine(pnts[i], angM);
				sect[j] = lnM;
			}
			ret[i] = sect;
		}
		return ret;
	}
}

const mainApp = new MainApp();
