'use strict';

class Mouse {	
	static MLEFT = 0;
	static MMIDDLE = 1;
	static MRIGHT = 2;
	
	constructor(divDrawArea) {
		//this.infullscreen = false;
		this.ele = divDrawArea;
		this.mclickhold = [0,0,0];
		this.mbutcur = [0,0,0];
		this.mbutlast = [0,0,0];
		this.mbuthold = [0,0,0];

        this.mx = 0;
        this.my = 0;
        this.lmx = 0;
        this.lmy = 0;
        this.dmx = 0;
        this.dmy = 0;
        this.fmx = 0; // -1 to 1, more for asp
        this.fmy = 0; //
        this.mbut = [0, 0, 0];
        this.lmbut = [0, 0, 0];
        this.mclick = [0, 0, 0];
        this.wheelPos = 0;
        this.wheelDelta = 0;
		//this.maparea = null;
		this.rawwheeldelta = 0;
		//this.infullscreen = null;
		this.lastinside = [0,0,0];

		this.mapAreaFocus = false;
        this.events = "";
        this.stats = "";

		// setup event listeners
		// kill right click save image
		this.ele.addEventListener('contextmenu', function (e) {
			//document.body.innerHTML += '<p>Right-click is disabled</p>'
			console.log("prevent right click image save");
			e.preventDefault();
		});
		this.ele.addEventListener("mousedown", (e) => {
			this.bmoused(e);
		});
		this.ele.addEventListener("mouseup", (e) => {
			this.bmouseu(e);
		});
		this.ele.addEventListener("mouseover", (e) => {
			this.bmouseov(e);
		});
		this.ele.addEventListener("mouseout", (e) => {
			this.bmouseou(e);
		});
		this.ele.addEventListener("mouseenter", (e) => {
			this.bmouseenter(e);
		});
		this.ele.addEventListener("mousewheel", (e) => {
			this.bmousewheel(e);
		});
		this.ele.addEventListener("mousemove", (e) => {
			this.bmousem(e);
		});
		this.ele.addEventListener("click", (e) => {
			this.bmousec(e);
		});
    }

	getxcode(e) {
		//if (this.infullscreen) {
		//	return e.clientX;
		//} else {
			return e.clientX - e.currentTarget.offsetLeft;
		//}
	}
	
	getycode(e) {
		//if (this.infullscreen) {
		//	return e.clientY;
		//} else {
			return e.clientY - e.currentTarget.offsetTop;
		//}
	}
	
	// event mouse down
	bmoused(e) {
		this.ele.focus(); // get keyboard working on maparea
		this.mbutcur[e.button] = 1;
		this.mbuthold[e.button] = 1;
		this.#updateEventInfo("(M down[" + e.button + "] " + this.getxcode(e) + " " + this.getycode(e) + ") ");
		e.preventDefault();
	}
	
	// event mouse up
	bmouseu(e) {
		this.mbuthold[e.button] = 0;
		this.#updateEventInfo("(M up[" + e.button + "] " + this.getxcode(e) + " " + this.getycode(e) + ") ");
		++this.mclickhold[e.button];
		e.preventDefault();
	}
	
	// event mouse over
	bmouseov(e) {
		const mouseOverVerbose = true;
		if (mouseOverVerbose) {
			this.#updateEventInfo("(M over " + this.getxcode(e) + " " + this.getycode(e) + ") ");
		}
	}
	
	// event mouse exit
	bmouseou(e) {
		this.lastinside[0] = this.mbutcur[0];
		this.lastinside[1] = this.mbutcur[1];
		this.lastinside[2] = this.mbutcur[2];
		this.#updateEventInfo("(Mout " + this.getxcode(e) + " " + this.getycode(e) + ") ");
	}
	
	
	// event mouse enter
	bmouseenter(e) {
		//if (mapAreaFocus) {
			//maparea.focus(); // get keyboard working on maparea
		//}
		this.mbutcur[0] = this.lastinside[0];
		this.mbutcur[1] = this.lastinside[1];
		this.mbutcur[2] = this.lastinside[2];
		this.#updateEventInfo("(Min[" + e.button + "] " + this.getxcode(e) + " " + this.getycode(e) + ") ");
	}
	
	// event mouse move
	bmousem(e) {
		if (e.layerX == null) {
			this.mx = this.getxcode(e); // doesn't work with scrollbars
			this.my = this.getycode(e);
		} else {
			this.mx = e.layerX; // works with scrollbars
			this.my = e.layerY;
		}
		if (this.mx < 0) {
			this.mx = 0;
		}
		if (this.my < 0) {
			this.my = 0;
		}
	}
	
	// event mouse click, doesn't seem to work if you click on an image on the map, and you click on it, implement with bmoused and bmouseu
	bmousec(e) {
		this.#updateEventInfo("(Mclick[" + e.button + "] " + this.getxcode(e) + " " + this.getycode(e) + ") ");
		if (e.preventDefault) {
			e.preventDefault();
		}
	}
	
	// event mouse wheel changed
	bmousewheel(e) {
	
		if (e.wheelDelta) {
			this.rawwheeldelta += e.wheelDelta/120;
		} else if (e.detail) { /** Mozilla case. */
					/** In Mozilla, sign of delta is different than in IE.
					 * Also, delta is multiple of 3.
					 */
			 this.rawwheeldelta += -e.detail/3;
		}
		if (e.preventDefault) {
			e.preventDefault();
		}
	}
	
    #updateEventInfo(eventStr) {
        this.events = eventStr + this.events;
        const maxSize = 80;
        this.events = this.events.substring(0,maxSize);
    }
    
	updateMouseStats() {
		this.stats = 
		"mx " + this.mx + 
		", my " + this.my + 
		", mz " + this.wheelPos + 
		", mdz " + this.wheelDelta + 
		"<br>mbut [" + this.mbut + "]"+ 
		", mclick [" + this.mclick + "]";
	}
	
	proc() {
		// mouse clicks in current frame
		this.mclick[0] = this.mclickhold[0];
		this.mclick[1] = this.mclickhold[1];
		this.mclick[2] = this.mclickhold[2];
		this.mclickhold[0] = this.mclickhold[1] = this.mclickhold[2] = 0;

		// mouse button: 1 down, 0 up
		this.mbut[0] = this.mbutcur[0]; // allow for nudges
		this.mbut[1] = this.mbutcur[1]; // allow for nudges
		this.mbut[2] = this.mbutcur[2]; // allow for nudges
		this.lmbut[0] = this.mbutlast[0]; // allow for nudges
		this.lmbut[1] = this.mbutlast[1]; // allow for nudges
		this.lmbut[2] = this.mbutlast[2]; // allow for nudges
		this.mbutlast[0] = this.mbutcur[0];
		this.mbutlast[1] = this.mbutcur[1];
		this.mbutlast[2] = this.mbutcur[2];
		this.mbutcur[0] = this.mbuthold[0];
		this.mbutcur[1] = this.mbuthold[1];
		this.mbutcur[2] = this.mbuthold[2];
		this.wheelDelta = this.rawwheeldelta;
		if (this.rawwheeldelta) {
			this.wheelPos += this.rawwheeldelta;
		}
		this.rawwheeldelta = 0;
		this.dmx = this.mx - this.lmx;
		this.dmy = this.my - this.lmy;
		this.lmx = this.mx;
		this.lmy = this.my;
		this.updateMouseStats();
   	}
}
/*
function mapinit() {
	maparea = document.getElementById('drawarea');
	// kill right click save image
	maparea.addEventListener('contextmenu', function (e) {
		//document.body.innerHTML += '<p>Right-click is disabled</p>'
		e.preventDefault();
	  });

	maparea.onclick = bmousec;
	maparea.onmousedown = bmoused;
	maparea.onmouseup = bmouseu;
	maparea.onmousemove = bmousem;
	maparea.onmouseover = bmouseov;
	maparea.onmouseout = bmouseou;
	maparea.onmouseenter = bmouseenter;
	maparea.onmousewheel = bmousewheel; 
	maparea.addEventListener('DOMMouseScroll', bmousewheel);
}
*/
/*
function mapproc()
{
	// mouse clicks in current frame
	input.mclick[0] = mclickhold[0];
	input.mclick[1] = mclickhold[1];
	input.mclick[2] = mclickhold[2];
	mclickhold[0] = mclickhold[1] = mclickhold[2] = 0;

	// mouse button: 1 down, 0 up
	input.mbut[0] = mbutcur[0]; // allow for nudges
	input.mbut[1] = mbutcur[1]; // allow for nudges
	input.mbut[2] = mbutcur[2]; // allow for nudges
	input.lmbut[0] = mbutlast[0]; // allow for nudges
	input.lmbut[1] = mbutlast[1]; // allow for nudges
	input.lmbut[2] = mbutlast[2]; // allow for nudges
	mbutlast[0] = mbutcur[0];
	mbutlast[1] = mbutcur[1];
	mbutlast[2] = mbutcur[2];
	mbutcur[0] = mbuthold[0];
	mbutcur[1] = mbuthold[1];
	mbutcur[2] = mbuthold[2];
	input.wheelDelta = rawwheeldelta;
	if (rawwheeldelta) {
		input.wheelPos += rawwheeldelta;
	}
	rawwheeldelta = 0;
	input.dmx = input.mx - input.lmx;
	input.dmy = input.my - input.lmy;
	input.lmx = input.mx;
	input.lmy = input.my;
	updateMouseStats();
}*/
