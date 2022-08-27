// some SWITCHES

// fixed size canvas or not
const  fixed = false; // static dimensions, else dimensions grow with window size
const fixedSize = [800, 600];

// end some SWITCHES

let plot = [0, 0];
let camMin = [0, 0];
let camMax = [0, 0];
let ndcMin = [0, 0];
let ndcMax = [0, 0];
let trans = Array(2);
let scl = 0;

// plotter2d
let startZoom = 1;//.25;
let zoom ;
let lzoom = 0; // log zoom
// let invZoom = 1;

// for user/cam
let center = [0, 0]; // 2d coords of center

// canvas drawing context
const W = Array(2); // canvas dimensions, TODO: maybe another name

let WMin; // the smaller dimension of W for aspect ratio

function xTransCamReset() {
	center[0] = 0;
}

function yTransCamReset() {
	center[1] = 0;
}

function sclCamReset() {
	zoom = startZoom;
	lzoom = Math.log(zoom); // yes, zoom
	invZoom = 1 / zoom;
}

// TODO: no magic numbers
function calcNdcAndCam() {
	if (fixed) {
		// set canvas size to a fixed size
		mycanvas2.width = fixedSize[0];
		mycanvas2.height = fixedSize[1];
	} else {
		// set canvas size depending on window size
		// magic numbers
		let wid = window.innerWidth - 450;
		let hit = window.innerHeight - 100;
		mycanvas2.width = Math.max(200, wid);
		mycanvas2.height = Math.max(750, hit);
	}
	W[0] = mycanvas2.width;
	W[1] = mycanvas2.height;
	WMin = Math.min(W[0], W[1]);
	// calc min and max of NDC space and scale and translate
	if (W[0] >= W[1]) { // landscape
		ndcMax[0] = W[0] / W[1];
		ndcMin[0] = -ndcMax[0];
		ndcMax[1] = 1;
		ndcMin[1] = -1;

		scl = W[1] / 2;
		trans[0] = ndcMax[0];
		trans[1] = -1;
	} else { // portrait
		ndcMax[0] = 1;
		ndcMin[0] = -1;
		ndcMax[1] = W[1] / W[0];
		ndcMin[1] = -ndcMax[1];

		scl = W[0] / 2;
		trans[0] = 1;
		trans[1] = -ndcMax[1];
	}

	camMin[0] = ndcMin[0] * invZoom + center[0];
	camMin[1] = ndcMin[1] * invZoom + center[1];
	camMax[0] = ndcMax[0] * invZoom + center[0];
	camMax[1] = ndcMax[1] * invZoom + center[1];
}

function calcCanvasSpacesUI() {
	let p = [input.mx, input.my];
	plot = screen2math(p);

	if (input.wheelDelta) { // wheel mouse
		let m = input.wheelDelta > 0 ? 1 : -1;
		let lzoomspeed = 1/16;
		if (input.mbut[Input.MMIDDLE]) { // faster wheel mouse when middle button held down
			lzoomspeed *= 4;
		}
		lzoom += m * lzoomspeed;
		lzoom = range(-5, lzoom, 5);
	}

	zoom = Math.exp(lzoom);
	invZoom = 1 / zoom;
	if (input.wheelDelta) { // zoom where the mouse is
		center = newcenter(p,plot);
	}
	if (input.mbut[0]) {
		let f = 1 / (zoom * WMin / 2);
		// where is the mouse in float coords
		center[0] -= input.dmx*f;
		center[1] += input.dmy*f;
	}
}

function screen2math(i) {
	let r = Array(2);
	r[0] = center[0] + (i[0] - W[0]/2)/(zoom*WMin/2);
	r[1] = center[1] + (i[1] - W[1]/2)/(-zoom*WMin/2);
	return r;
}

function newcenter(i,p)
{
	let nc = Array(2);
	nc[0] = p[0] - (i[0] - W[0]/2)/(zoom*WMin/2);
	nc[1] = p[1] - (i[1] - W[1]/2)/(-zoom*WMin/2);
	return nc;
}
