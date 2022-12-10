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
			"roomsIdx.png",
			"roomsPal.png"
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
		+ "\nFrame = " + this.frame;
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
	}

	#restartSim() {
		this.frame = 0;
		this.fracFrame = 0;
	}

	#runSim() {
		this.fracFrame += this.simSpeed;
		while(this.fracFrame >= 1) {
			this.#runSimFrame();
			--this.fracFrame;
		}
	}

	#runSimFrame() {
		// run the simulation
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

		// build rooms32 and zoom
		this.zoomRatio = 6;
		// build palettized Bm here
		this.bitmapList.rooms32Bm = new Bitmap32(this.bitmapList.roomsIdx.size);
		this.bitmapList.rooms32BmZoom = new Bitmap32(
			[this.bitmapList.roomsIdx.size[0] * this.zoomRatio
			, this.bitmapList.roomsIdx.size[1] * this.zoomRatio]);

		const mainBm = this.bitmapList.mainBm;
		const rooms32BmZoom = this.bitmapList.rooms32BmZoom;
		this.offsetRoom = [
			(mainBm.size[0] - rooms32BmZoom.size[0])/2
			, (mainBm.size[1] - rooms32BmZoom.size[1])/2];
		this.#buildSimBm();
		this.#restartSim();

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
		const roomsPalBm = this.bitmapList.roomsPal;
		const roomsPalBmData = roomsPalBm.data32;
		const roomsIdxBm = this.bitmapList.roomsIdx;
		const rooms32Bm = this.bitmapList.rooms32Bm;
		const rooms32BmZoom = this.bitmapList.rooms32BmZoom;
		// start with background
		mainBm.fill(this.backgndColor);

		this.#runSim();
		
		// build and draw palettized rooms Bm
		Bitmap32.palettize(roomsIdxBm, rooms32Bm, roomsPalBm.data32);
		Bitmap32.zoomBM(rooms32Bm, rooms32BmZoom, [this.zoomRatio, this.zoomRatio]);
		Bitmap32.clipBlit(rooms32BmZoom, [0, 0], mainBm, this.offsetRoom, rooms32BmZoom.size);
		//Bitmap32.clipBlit(rooms32Bm, [0, 0], mainBm, [220, 150], rooms32Bm.size);

		// very simple cursor
		const p = this.input.mouse.mxy;
		const colRed = Bitmap32.strToColor32("red");
		mainBm.clipCircle(p, 2, colRed);

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

/*
// heat in a house
#include <m_eng.h>

#include "u_states.h"

#define USENAMESPACE
#ifdef USENAMESPACE
namespace u_s_heat_house {
#endif

#define RX 128
#define RY 96

#define XSIZE 1024
#define YSIZE 768

bitmap8 *room,*bigroom; //,*heat,*oldheat;
U32 *heat,*oldheat;
C32 dacs[256];//,dacs2[256];
U8 andor[512];

S32 nthermostats;
S32 nheaters;
S32 nwindows;
//S32 nwalls;
pointi2 *thermostats;
pointi2 *heaters;
pointi2 *windows;
//pointi2 *walls;

S32 heateron;

bitmap8* B8;

void scanroom()
{
	S32 i,j,c;
	nthermostats=nheaters=nwindows=0;
	for (j=0;j<RY;j++)
		for (i=0;i<RX;i++) {
			c=fastgetpixel8(room,i,j);
			if (c) {
				switch (c) {
				//case red:
				case lightred:
				case lightmagenta:
					nheaters++;
					break;
				case lightgreen:
					nthermostats++;
					break;
				case lightblue:
					nwindows++;
					break;
//				case blue:
//				case white:
//					nwalls++;
//					break;
				}
			}
		}
	if (thermostats)
		delete[](thermostats);
	thermostats=new pointi2[nthermostats+1];
	if (heaters)
		delete[](heaters);
	heaters=new pointi2[nheaters+1];
	if (windows)
		delete[](windows);
	windows=new pointi2[nwindows+1];
//	if (walls)
//		memfree(walls);
//	walls=memalloc((nwalls+1)*sizeof(struct pointi2));
	nthermostats=nheaters=nwindows=0;
	for (j=0;j<RY;j++)
		for (i=0;i<RX;i++) {
			c=fastgetpixel8(room,i,j);
			if (c) {
				switch (c) {
				//case red:
				case lightred:
				case lightmagenta:
					heaters[nheaters].x=i;
					heaters[nheaters++].y=j;
					break;
				case lightgreen:
					thermostats[nthermostats].x=i;
					thermostats[nthermostats++].y=j;
					break;
				case lightblue:
					windows[nwindows].x=i;
					windows[nwindows++].y=j;
					break;
//				case white:
//				case blue:
//					walls[nwalls].x=i;
//					walls[nwalls++].y=j;
//					break;
				}
			}
		}
}

void setdacrange(S32 s,S32 e,C32 ds,C32 de)
{
	S32 i;
	for (i=s;i<=e;i++) {
		dacs[i].r=(de.r*(i-s)+ds.r*(e-i))/(e-s);
		dacs[i].g=(de.g*(i-s)+ds.g*(e-i))/(e-s);
		dacs[i].b=(de.b*(i-s)+ds.b*(e-i))/(e-s);
	}
}

void doheat()
{
	U32 *t;
	U32 *p,*p2;
	U8 *w;
	S32 i,j,c,x,y;
	S32 lastheateron=heateron;
	heateron = 0; // should be 0, test with 1
	for (i=0;i<nthermostats;i++) {
		x=thermostats[i].x;
		y=thermostats[i].y;
		c=heat[x+y*RX];
		c>>=18;
		//if (true) {
		if (c<=135) {
			heateron=1;
			break;
		}
	}
	if (heateron)
		for (i=0;i<nheaters;i++)
			fastputpixel8(room,heaters[i].x,heaters[i].y,lightmagenta);
	else
		for (i=0;i<nheaters;i++)
			fastputpixel8(room,heaters[i].x,heaters[i].y,lightred);
	if (heateron)
		for (i=0;i<nheaters;i++)
			heat[heaters[i].x+heaters[i].y*RX]=1023*65536;
	for (i=0;i<nwindows;i++)
		heat[windows[i].x+windows[i].y*RX]=64*65536;
	t=oldheat;
	oldheat=heat;
	heat=t;
	for (j=1;j<RY-1;j++) {
		p=oldheat+RX*j+1;
		p2=heat+RX*j+1;
		w=room->data+RX*j+1;
		for (i=1;i<RX-1;i++,p++,p2++,w++) {
			if (w[1]==white || w[1]==lightblue)
				c=p[0];
			else
				c=p[1];
			if (w[-1]==white || w[-1]==lightblue)
				c+=p[0];
			else
				c+=p[-1];
			if (w[-RX]==white || w[-RX]==lightblue)
				c+=p[0];
			else
				c+=p[-RX];
			if (w[RX]==white || w[RX]==lightblue)
				c+=p[0];
			else
				c+=p[RX];
			c+=2;
			c>>=2;
			p2[0]=c;
		}
	}
}

void video_setpalette(const C32* dacs)
{
}

#ifdef USENAMESPACE
} /// end namespace u_s_heat_house
using namespace u_s_heat_house;
#endif


void heathouseinit()
{
	S32 i;
	S32 p=RX*RY;
	video_setupwindow(XSIZE,YSIZE);
	pushandsetdir("heathouse");
	room = gfxread8("rooms.pcx",dacs);
	logger("rooms size = %d, %d\n",room->size.x,room->size.y);
	popdir();
////////////////////////// main
	bigroom=bitmap8alloc(XSIZE,YSIZE,-1);
	B8=bitmap8alloc(XSIZE,YSIZE,blue);
	heat=new U32[RX*RY];
	oldheat=new U32[RX*RY];
	for (i=0;i<p;i++) {
		heat[i]=64*65536;
		oldheat[i]=64*65536;
	}
	//memcpy(dacs,wininfo.stdpalette,sizeof(struct rgb24)*16);
	copy(stdpalette,stdpalette+16,dacs);
	setdacrange(16,80,C32BLUE,C32LIGHTGREEN);
	setdacrange(80,160,C32LIGHTGREEN,C32YELLOW);
	setdacrange(160,255,C32YELLOW,C32RED);
	dacs[135]=C32MAGENTA;
	for (i=16;i<=255;i++) {
		if (i&1) {
			dacs[i].r^=8;
			dacs[i].g^=8;
			dacs[i].b^=8;
		}
	}
//	setdacrange(16,40,rgbblue,rgblightgreen);
//	setdacrange(40,80,rgblightgreen,rgbyellow);
//	setdacrange(80,135,rgbyellow,rgbred);
//	setdacrange(136,255,rgbdarkgray,rgbwhite);
//	for (i=16;i<=135;i++)
//		dacs2[2*i-16]=dacs[i];
//	for (i=136;i<=255;i++)
//		dacs2[2*i-255]=dacs[i];
	video_setpalette(dacs);
	scanroom();
#if 1
	for (i = 0; i < 256; i++) {
		andor[i] = 0x00;
		andor[i + 256] = i;
	}
#if 1
	andor[blue] = 0xff;
	andor[blue + 256] = 0x00;
	andor[black] = 0xff;
	andor[black + 256] = 0x00;
#endif
#else
	for (i = 0; i < 256; i++) {
		andor[i] = 0;
		andor[i + 256] = i;
	}
	andor[0] = 0xff;
#endif
}

void heathouseproc()
{
	if (KEY==K_ESCAPE)
		poporchangestate(STATE_MAINMENU);

#if 1
// draw background
	S32 p;
	static S32 oldbut;
	S32 mx,my;
	S32 col,newcol;
	//video_lock();
	if (MBUT&!oldbut) {
		mx=MX/8;
		my=MY/8;
		col=clipgetpixel8(room,mx,my);
		if (col!=black && col!=white) {
			switch(col) {
			case red:	
				newcol=lightred;
				break;
			case lightred:
			case lightmagenta:
				newcol=red;
				break;
			case green:	
				newcol=lightgreen;
				break;
			case lightgreen:
				newcol=green;
				break;
			case blue:	
				newcol=lightblue;
				break;
			case lightblue:
				newcol=blue;
				break;
			}
			clipfloodfill8(room,mx,my,newcol);
			scanroom();
		}
	}
	for (p=0;p<250;p++)
		doheat();
	oldbut=MBUT;
#endif
}

void heathousedraw2d()
{
	S32 i,j,wv;
	U32 *ip;
	U8 v;
	//clipclear32(B32,C32(0,0,255));	
	for (j=0;j<RY;j++) {
		ip=heat+RX*j;
		for (i=0;i<RX;i++,ip++) {
			wv=*ip>>18;
//			if (wv>=200)
//				v=200+(wv-200)*55/823;
//			else
//				v=wv;
			v=wv;
			fastrect8(B8,i<<3,j<<3,8,8,v);
		}
	}
#if 1
	clipscaleblit8(room,bigroom);

	clipmask8(bigroom,B8,andor);
	//clipblit8(bigroom, B8, 0, 0, 0, 0, bigroom->size.x, bigroom->size.y);

	for (i=0;i<256;i++)
		cliprect8(B8,i*4,0,i*4+4,16,i);
	i=clipgetpixel8(B8,MX,MY);
	clipline8(B8,i*4-1,0,i*4-1,15,black);
	clipline8(B8,i*4-2,0,i*4-2,15,black);
	clipline8(B8,i*4+4,0,i*4+4,15,black);
	clipline8(B8,i*4+5,0,i*4+5,15,black);
#endif
	//bitmap32* b32 =
	convert8to32(B8,dacs,B32);
	//bitmap32* b32 = bitmap32alloc(B8->size.x,B8->size.y,C32GREEN);
	//clipblit32(b32,B32,0,0,0,0,b32->size.x,b32->size.y);
	//bitmap32free(b32);
	outtextxyf32(B32,4,WY-8-4,C32WHITE,"Heat House");
	//video_unlock();
}

void heathouseexit()
{
	C32* stddacs = stdpalette;	// get std palette
	video_setpalette(stddacs);	// set it in window
	bitmap8free(room);
	bitmap8free(bigroom);
	delete[] heat;
	delete[] oldheat;
	delete[] thermostats;
	thermostats=0;
	delete[] windows;
	windows = 0;
//	memfree(walls);
//	walls=NULL;
	delete[] heaters;
	heaters = 0;
	bitmap8free(B8);
}

*/