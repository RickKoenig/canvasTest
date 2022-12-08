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

		this.#userLoad(); // async load assets
	}

	// USER: add more members or classes to MainApp
	#userLoad() {
		const imageNames = [
			//"Bark.png",
			//"panel.jpg",
			//"maptestnck.png",
			"dpaint2Palette.png"
		];
		this.#loadImages(imageNames);
	}

	// after user assets loaded
	// before user UI built
	// TODO: promise to learn promises
	#userInit() {
		this.fixedSize = [1024, 768];
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);

		this.frame = 0;
		this.fracFrame = 0;

		this.backgndColor = Bitmap32.strToColor32("lightblue");

		// bitmaps
		this.#initBitmaps();

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER, no vp means don't use any ui for trans and scale
		// only use screen space
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, null, this.startCenter, this.startZoom, this.fixedSize, true); 
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);

		// USER build UI
		this.#userBuildUI();
		

		// start it off
		this.#animate();
	}

	#userBuildUI() {
		// info bar
		makeEle(this.vp, "hr");
		this.eles.info = makeEle(this.vp, "pre", null, null, "Info");
		makeEle(this.vp, "hr");
		// num colors
		{
			const label = "Set Num Colors";
			this.numColorsMin = 1;
			this.numColorsMax = 64;
			this.numColorsCur = this.numColorsStart;
			const min = this.numColorsMin;
			const max = this.numColorsMax;
			const start = this.numColorsStart;
			const callback = (v) => {this.numColors = v};
			new makeEleCombo(this.vp, label, min, max, start, 0, 0, callback);
		}
		// reset sim
		makeEle(this.vp, "button", null, null, "Restart Sim",this.#restartSim.bind(this));
		// sim speed
		{
			const label = "Sim Speed";
			const step = .125;
			const min = 0;
			const max = 10;
			const start = .125;
			const prec = 3;
			const callback = (v) => {this.simSpeed = v};
			new makeEleCombo(this.vp, label, min, max, start, step, prec, callback);
		}
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
		this.#drawBitmaps();
	}

	// USER: update some of the UI in vertical panel if there is some in the HTML
	#userUpdateInfo() {
		this.eles.info.innerText 
		= "Avg fps = " + this.avgFps.toFixed(2)
		+ "\nMouse = (" + this.input.mouse.mxy[0] 
		+ "," + this.input.mouse.mxy[1] + ")"
		+ "\nNum Colors = " + this.numColorsCur
		+ "\nFrame = " + this.frame
		+ "\nEat Count = " + this.eatCount.toFixed().padStart(5) 
		+ "/" + this.simBmSize * this.simBmSize;
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

	// async load images
	// TODO: promise to learn promises
	#loadOneBitmap() {
		++this.loadcnt;
		if (this.loadcnt == this.reqcnt) {
			// everything is now loaded
			this.#userInit();
		}
	}

	#loadImages(imageNames) {
		this.images = {};
		this.loadcnt = 0;
		this.reqcnt = imageNames.length;
		if (this.reqcnt == 0) {
			this.#userInit(); // nothing to do
		}

		for (const imgName of imageNames) {
			const idx = imgName.indexOf(".");
			const shortImgName = imgName.slice(0, idx);

			const imgEle = new Image();
			imgEle.src = "../bitmaps/" + imgName;
			this.images[shortImgName] = imgEle;
			  
			if (imgEle.complete) {
				this.#loadOneBitmap();
			} else {
				imgEle.addEventListener('load', () => {
					this.#loadOneBitmap();
				})
				imgEle.addEventListener('error', function() {
					alert('error');
				});
			}
		}
	}

	#buildSimBm() {
		this.bitmapList.simBm = new Bitmap32([this.simBmSize, this.simBmSize]);
		this.bitmapList.simBm2 = new Bitmap32([this.simBmSize, this.simBmSize]);
		// for now random indices in 0 to numColors - 1, read red channel, make gray, palettize later
	}

	#restartSim() {
		this.numColorsCur = this.numColors;
		const simData = this.bitmapList.simBm.data32;
		for (let i = 0; i < simData.length; ++i) {
			 // alpha 0xff and the rest numColors
			 simData[i] = 0xff000000 + 0x010101 * Math.floor(this.numColorsCur * Math.random());
			 // straight value index
			 simData[i] = Math.floor(this.numColorsCur * Math.random());
		}
		this.frame = 0;
		this.fracFrame = 0;
		this.eatCount = 0;
	}

	#runSim() {
		this.fracFrame += this.simSpeed;
		while(this.fracFrame >= 1) {
			this.#runSimFrame();
			--this.fracFrame;
		}
	}

	#runSimFrame() {
		const simBm = this.bitmapList.simBm; // current
		const simBm2 = this.bitmapList.simBm2; // copy, read from simBm2 to update simBm
		Bitmap32.clipBlit(simBm, [0, 0], simBm2, [0, 0], simBm.size);
		this.eatCount = 0;

		// run the simulation
		for (let j = 0; j < this.simBmSize; ++j) {
			for (let i = 0; i < this.simBmSize; ++i) {
				let val = simBm2.fastGetPixel([i, j]) + 1; // eater color
				if (val == this.numColorsCur) {
					val = 0;
				}
				let eatMark = false;
				if (simBm2.fastGetPixel([i, (j + 1) & (this.simBmSize - 1)]) == val) { // power of 2
					eatMark = true;
				} else if (simBm2.fastGetPixel([i, (j - 1) & (this.simBmSize - 1)]) == val) { // power of 2
					eatMark = true;
				} else if (simBm2.fastGetPixel([(i + 1)  & (this.simBmSize - 1), j]) == val) { // power of 2
					eatMark = true;
				} else if (simBm2.fastGetPixel([(i - 1)  & (this.simBmSize - 1), j]) == val) { // power of 2
					eatMark = true;
				}
				if (eatMark) {
					simBm.fastPutPixel([i, j], val);
					++this.eatCount;
				}
			}
	
		}

/*
		for (x=0;x<128;x++)
			for (y=0;y<128;y++)
				{
				val=fastgetpixel(&v,x,y)+1;
				if (val==colors)
					val=0;
				if (fastgetpixel(&v,x,(y+1)&127)==val)
					{
					count++;
					fastputpixel(&b,x,y,val);
					}
				else if (fastgetpixel(&v,x,(y-1)&127)==val)
					{
					count++;
					fastputpixel(&b,x,y,val);
					}
				else if (fastgetpixel(&v,(x+1)&127,y)==val)
					{
					count++;
					fastputpixel(&b,x,y,val);
					}
				else if (fastgetpixel(&v,(x-1)&127,y)==val)
					{
					count++;
					fastputpixel(&b,x,y,val);
					}
				}
*/


		++this.frame;
	}

	#initBitmaps() {
		this.bitmapList = {};
		// draw everything here before sent to canvas
		this.bitmapList.mainBm = new Bitmap32(this.fixedSize);

		// already fully loaded images, copy images to bitmap list
		for (const imageName in this.images) {
			this.bitmapList[imageName] = new Bitmap32(this.images[imageName]); // construct bitmap32 from <images>
		}

		// color management
		this.numColorsMin = 1;
		this.numColorsMax = 60;
		this.numColorsStart = 20;

		// build simBm
		this.simBmSize = 128; // power of 2
		this.zoomRatio = 5;
		this.numColors = this.numColorsStart;
		this.#buildSimBm();
		this.#restartSim();

		// create palletized simBM and zoomSimBmPal
		this.bitmapList.simBmPal = new Bitmap32([this.simBmSize, this.simBmSize]);
		this.bitmapList.zoomSimBmPal =  new Bitmap32(
			[this.bitmapList.simBm.size[0] * this.zoomRatio
			, this.bitmapList.simBm.size[1] * this.zoomRatio]);

		// list all bitmaps created
		const keys = Object.keys(this.bitmapList);
		console.log("num bitmaps = " + keys.length);
		for (let bmName of keys) {
			const bm = this.bitmapList[bmName];
			console.log("bitmap " 
				+ bmName.padEnd(24," ") 
				+ "dim (" + bm.size[0].toString().padStart(4) 
				+ "," + bm.size[1].toString().padStart(4) + ")");
		}
	}

	#drawBitmaps() {
		const mainBm = this.bitmapList.mainBm;
		// start with background
		mainBm.fill(this.backgndColor);

		this.#runSim();

		//const simBm = this.bitmapList.simBm;
		const simBmPal = this.bitmapList.simBmPal;
		const zoomSimBmPal = this.bitmapList.zoomSimBmPal;
		const offSim = [(mainBm.size[0] - zoomSimBmPal.size[0]) / 2
			, (mainBm.size[1] - zoomSimBmPal.size[1]) / 2];
		const simBm = this.bitmapList.simBm;
		this.hilit = -1;
		{
			const mxy = this.input.mouse.mxy;
			const zoomSimBmPal = this.bitmapList.zoomSimBmPal;
			if (mxy[0] >= offSim[0] 
					&& mxy[1] >= offSim[1] 
					&& mxy[0] < offSim[0] + zoomSimBmPal.size[0] 
					&& mxy[1] < offSim[1] + zoomSimBmPal.size[1]) {
				const px = Math.floor((mxy[0] - offSim[0]) / this.zoomRatio);
				const py = Math.floor((mxy[1] - offSim[1]) / this.zoomRatio);
				const pos = [px, py];
				this.hilit = simBm.fastGetPixel(pos);
			}
		}
		// draw paletteBm
		const paletteBm = this.bitmapList.dpaint2Palette;
		const paletteBmdata = paletteBm.data32;
		for (let j = 0; j < this.numColorsCur; ++j) {
			const val = paletteBmdata[j];
			const x = Math.floor(j / 16);
			const y = j % 16;
			if (this.hilit == j) {
				mainBm.clipRect([19 + 20 * x, 19 + 20 * y], [20, 20], Bitmap32.strToColor32("white"));
			}
			mainBm.clipRect([21 + 20 * x, 21 + 20 * y], [16, 16], val);

		}
		/*
		Bitmap32.clipBlit(paletteBm, [0, 0]
			, mainBm, [0, 600]
			, paletteBm.size);
		*/
		// palettize and zoom simBm
		Bitmap32.palettize(this.bitmapList.simBm
			, this.bitmapList.simBmPal
			, this.bitmapList.dpaint2Palette.data32)
		Bitmap32.zoomBM(simBmPal, zoomSimBmPal, [this.zoomRatio, this.zoomRatio]);

		/*
		// palettize simBm to simBmPal
		// zoom simBmPal to zoomSimBmPal
		// draw simBm
		Bitmap32.clipBlit(simBm, [0, 0]
			, mainBm, [0, 0]
			, simBm.size);

		// draw simBmPal
		Bitmap32.clipBlit(simBmPal, [0, 0]
			, mainBm, [0, 300]
			, simBm.size);
*/
		// draw zoomSimBmPal
		Bitmap32.clipBlit(zoomSimBmPal, [0, 0]
			, mainBm, offSim
			, zoomSimBmPal.size);

		// very simple cursor
		const p = this.input.mouse.mxy;
		const colRed = Bitmap32.strToColor32("red");
		mainBm.clipCircle(p, 1, colRed);

		// finally draw background to canvas
		this.ctx.putImageData(mainBm.imageData, 0, 0);
	}
}

const mainApp = new MainApp();

/*
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <graph32\graph32.h>

int x,y,a,b;
int frames;
char str[20];
int val,count;
int colors;

void main()
{
struct bitmap v,b;
mem_init();
// 320 by 200
alloc_bitmap(&b,XSIZE,YSIZE,0);
make_video_bitmap(&v);
randomize();
while(1)
	{
	printf("input # of colors (0 to quit) > ");
	scanf("%d",&colors);
	frames=0;
	if (colors==0)
		break;
	initgraph();
	for (x=0;x<128;x++)
		{
		if (getkey())
			break;
		for (y=0;y<128;y++)
			fastputpixel(&b,x,y,random(colors));
		}
	fastblit(&b,&v,0,0,0,0,XSIZE,YSIZE);
	while(!getkey())
		{
		count=0;
		for (x=0;x<128;x++)
			for (y=0;y<128;y++)
				{
				val=fastgetpixel(&v,x,y)+1;
				if (val==colors)
					val=0;
				if (fastgetpixel(&v,x,(y+1)&127)==val)
					{
					count++;
					fastputpixel(&b,x,y,val);
					}
				else if (fastgetpixel(&v,x,(y-1)&127)==val)
					{
					count++;
					fastputpixel(&b,x,y,val);
					}
				else if (fastgetpixel(&v,(x+1)&127,y)==val)
					{
					count++;
					fastputpixel(&b,x,y,val);
					}
				else if (fastgetpixel(&v,(x-1)&127,y)==val)
					{
					count++;
					fastputpixel(&b,x,y,val);
					}
				}
		frames++;
		fastrect(&b,0,YSIZE-24,XSIZE-1,YSIZE-1,black);
		sprintf(str,"%5d",frames);
		outtextxy(&b,20<<3,22<<3,str,white);
		sprintf(str,"%5d/%5d",count,16384);
		outtextxy(&b,20<<3,24<<3,str,white);
		fastblit(&b,&v,0,0,0,0,XSIZE,YSIZE);
		}
	closegraph();
	}
free_bitmap(&b);
}
*/