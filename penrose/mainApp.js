'use strict';

// a Penrose tile
class Tile {
	constructor(pos, rot = 0, fat = false) {
		if (pos) {
			this.pos = vec2.clone(pos);
		} else {
			this.pos = vec2.create();
		}
		this.rot = rot;
		this.fat = fat;
		let ang;
		if (fat) {
			ang = 72;
			this.col = "green";
		} else {
			ang = 36;
			this.col = "red";
		}
		ang = degToRad(ang);
		const sa = .5 * Math.sin(ang);
		const ca = .5 * Math.cos(ang);

		this.pnts = [
			[-.5 - ca, -sa],
			[-.5 + ca,  sa],
			[ .5 + ca,  sa],
			[ .5 - ca, -sa]
		];
	}

	draw(drawPrim) {
		//const aPoly = [[-.5, 0], [0, .25], [.5, 0], [0, -.25]];
		drawPrim.ctx.save();
		drawPrim.ctx.translate(this.pos[0], this.pos[1]);
		drawPrim.ctx.rotate(this.rot);
		drawPrim.drawPoly(this.pnts, .025, this.col, "blue");
		for (let pnt of this.pnts) {
			drawPrim.drawCircleO(pnt, .2, .05, "magenta");
		}
		drawPrim.ctx.restore();
		drawPrim.drawCircleO(this.pos, .1, .005, "brown", );
	}
}

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	constructor() {
		console.log("Play with Penrose tiles");
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
		this.dirty = true; // draw at least once
		this.dirtyCount = 100;
		this.#animate();
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// user init section
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.startZoom = .5;

		this.tiles = [];
		this.tiles.push(new Tile([-1.5,.75], degToRad(0), false));
		this.tiles.push(new Tile([.75, .5], degToRad(0), true));
		this.tiles.push(new Tile([-1.5,-1], degToRad(-18), false));
		this.tiles.push(new Tile([.75, -1.25], degToRad(-36), true));
	}

	#userBuildUI() {
		makeEle(this.vp, "hr");
		this.eles.textInfoLog = makeEle(this.vp, "pre", null, null, "textInfoLog");
		makeEle(this.vp, "hr");
		makeEle(this.vp, "span", null, "marg", "Show graph paper");
		this.eles.showGraphPaper = makeEle(this.vp, "input", "showGraphPaper", null, "ho", () => this.dirty = true, "checkbox");
		this.eles.showGraphPaper.checked = true;
	}		
	
	#userProc() {
		// proc
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
	}

	#userDraw() {
		for (let tile of this.tiles) {
			tile.draw(this.drawPrim);
		}
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		let countStr = "Dirty Count = " + this.dirtyCount;
		countStr += "\nAvg fps = " + this.avgFps.toFixed(2);
		this.eles.textInfoLog.innerText = countStr;
	}

	// proc
	#animate() {
		// proc
		// update input system
		this.input.proc();
		this.dirty = this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT) || this.dirty;
		// USER: do USER stuff
		this.#userProc(); // proc

		// draw when dirty
		if (this.dirty) {
			this.plotter2d.clearCanvas();
			// interact with mouse, calc all spaces
			// goto user/cam space
			this.plotter2d.setSpace(Plotter2d.spaces.USER);
			// now in user/cam space
			if (this.eles.showGraphPaper.checked) {
				this.graphPaper.draw("X", "Y");
			}
			// USER: do USER stuff
			this.#userDraw(); //draw
		}
		// update UI, text
		this.#userUpdateInfo();

		if (this.dirty) {
			this.dirtyCount = 100;
		} else {
			--this.dirtyCount;
			if (this.dirtyCount < 0) {
				this.dirtyCount = 0;
			}
		}
		this.dirty = false; // turn off drawing unless something changes

		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();

/*
#define MAKEPENROSE
#ifdef MAKEPENROSE
bitmap32* ptfat,*ptthin;
const S32 PRX = 128;
const S32 PRY = 128;
const float angfat  = 72*PIOVER180; // 72 degrees
const float angthin = 36*PIOVER180; // 36 degrees
const S32 border = 3;
const float circlesize = 15;

struct circleinfo {
	bool right;
	bool bottom;
	bool big;
};
struct tileinfo {
	C32 backcolor;
	float ang;
	circleinfo cis[2];
	C8* fname;
};
tileinfo tilethin = {
	C32GREEN,
	angthin,
	{
		{true,false,false}, // blue
		{false,true,false} // red
	},
	"thin.png"
};
tileinfo tilefat = {
	C32LIGHTGREEN,
	angfat,
	{
		{false,false,false}, // blue
		{true,true,true} // red
	},
	"fat.png"
};

bitmap32* maketile(const tileinfo& ti)
{
	const S32 minn = 1;
	const S32 mind = 5;
	const S32 maxn = 4;
	const S32 maxd = 5;

	static const C32 circol[2] = {C32BLUE,C32RED};
	bitmap32* ret;
	S32 i,j;
	S32 maxj = (S32)(PRY*sinf(ti.ang));
	ret = bitmap32alloc(PRX*2,PRY*2,C32(0,0,0,0)); // background color
	S32 minim = (S32)(maxj/tanf(ti.ang));
	for (j=0;j<PRY;++j) {
		S32 mini = (S32)(j/tanf(ti.ang));
		S32 maxi = mini + PRX;
		S32 borderx = (S32)(border/sinf(ti.ang));
		for (i=0;i<PRX*2;++i) {
			if (j<maxj && i>= mini && i<maxi) {
				C32 c = ti.backcolor; // base tile color, maybe pass in
				if (j<border || j>=maxj-border)
					c = C32BLACK;
				if (i<mini+borderx || i>=maxi-borderx)
					c = C32BLACK;
				// do rules, blue and red circles
				int k;
				for (k=0;k<2;++k) {
					S32 tvi = i;
					S32 tvj = j;
					if (ti.cis[k].right) {
						tvi -= PRX;
					}
					if (ti.cis[k].bottom) {
						tvi -= minim;
						tvj -= maxj;
					}
					S32 d2 = tvi*tvi + tvj*tvj;
					S32 d2min;
					S32 d2max;
					if (ti.cis[k].big) {
						d2min = (S32)(maxn*PRX/maxd-circlesize/2);
						d2max = (S32)(maxn*PRX/maxd+circlesize/2);
					} else {
						d2min = (S32)(minn*PRX/mind-circlesize/2);
						d2max = (S32)(minn*PRX/mind+circlesize/2);
					}
					d2min *= d2min;
					d2max *= d2max;
	//				if (d2<PRX/4+circlesize/2 && d2>=PRX/4-circlesize/2)
					if (d2>=d2min && d2<d2max)
						c = circol[k];
					clipputpixel32(ret,i,j,c);
				}
			}
		}
	} 
	pushandsetdir("penrose");
	gfxwrite32(ti.fname,ret);
	popdir();
	return ret;
}

void makepenrose()
{
	ptthin = maketile(tilethin);
	ptfat = maketile(tilefat);
}

void drawpenrose()
{
	clipblit32(ptthin,B32,0,0,10,10,ptthin->size.x,ptthin->size.y);
	clipblit32(ptfat,B32,0,0,10+2*PRX+10,10,ptfat->size.x,ptfat->size.y);
}

void exitpenrose()
{
	bitmap32free(ptfat);
	bitmap32free(ptthin);
}
#endif
*/