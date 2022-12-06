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
			"maptestnck.png",
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

		this.backgndColor = Bitmap32.strToColor32("lightblue");

		// bitmaps
		this.#initBitmaps(this.ctx, this.fixedSize);

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
		+ "," + this.input.mouse.mxy[1] + ")";
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

	#initBitmaps() {
		this.bitmapList = {};
		// draw everything here before sent to canvas
		this.bitmapList.mainBM = new Bitmap32(this.fixedSize);

		// already fully loaded images, copy to bitmap list
		for (const imageName in this.images) {
			this.bitmapList[imageName] = new Bitmap32(this.images[imageName]); // construct bitmap32 from <images>
		}

		// build simBM
		this.simBMsize = 128;
		this.zoomRatio = 3;
		this.bitmapList.simBM = new Bitmap32([this.simBMsize, this.simBMsize]);
		// for now random pixels
		const simData = this.bitmapList.simBM.data32;
		for (let i = 0; i < simData.length; ++i) {
			simData[i] = 0xff000000 + 0x1000000 * Math.random(); // alpha 0xff and the rest 2^24
		}

		this.bitmapList.simBM = this.bitmapList.dpaint2Palette; // override temp

		this.bitmapList.zoomSimBM =  new Bitmap32(
			[this.bitmapList.simBM.size[0] * this.zoomRatio
			, this.bitmapList.simBM.size[1] * this.zoomRatio]);

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
		this.bitmapList.samplerBM = new Bitmap32([16, 16]);
	}

	// collect color palette from an image that is 16 by 16 rectangles
	#sampler() {
		const mainBM = this.bitmapList.mainBM;
		const samplerBM = this.bitmapList.samplerBM;
		const offx = 14;
		const offy = 16;
		const stepx = 16;
		const stepy = 10;
		const paletteBM = new Bitmap32([16, 16]);
		this.bitmapList.paletteBM = paletteBM;
		for (let j = 0; j < 16; ++j) {
			const posy = offy + stepy * j;
			for (let i = 0; i < 16; ++i) {
				const posx = offx + stepx * i;
				const pos = [posx, posy];
				const val = mainBM.clipGetPixel(pos);
				mainBM.clipCircle(pos, 1, Bitmap32.strToColor32("lightgreen"));
				mainBM.clipPutPixel(pos, val);
				samplerBM.clipPutPixel([j, i], val); // switch X and Y
			}
		}
	}

	#drawBitmaps() {
		const mainBM = this.bitmapList.mainBM;
		// start with background
		mainBM.fill(this.backgndColor);

		// zoom simBM to zoomSimBM
		const simBM = this.bitmapList.simBM;
		const zoomSimBM = this.bitmapList.zoomSimBM;
		Bitmap32.zoomBM(simBM, zoomSimBM, [this.zoomRatio, this.zoomRatio]);
		// draw simBM
		Bitmap32.clipBlit(simBM, [0, 0]
			, mainBM, [0, 0]
			, simBM.size);
		/*
		// draw zoomSimBM
		Bitmap32.clipBlit(zoomSimBM, [0, 0]
			, mainBM, [(mainBM.size[0] - zoomSimBM.size[0]) / 2, (mainBM.size[1] - zoomSimBM.size[1]) / 2]
			, zoomSimBM.size);
		*/

		// sample 
		this.#sampler(); // sample dpaint2Palette

		// draw sampler bitmap
		Bitmap32.clipBlit(this.bitmapList.samplerBM, [0, 0]
			, mainBM, [400, 500]
			, this.bitmapList.samplerBM.size);


		// very simple cursor
		const p = this.input.mouse.mxy;
		const colRed = Bitmap32.strToColor32("red");
		mainBM.clipCircle(p, 10, colRed);

		// finally draw background to canvas
		this.ctx.putImageData(mainBM.imageData, 0, 0);
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