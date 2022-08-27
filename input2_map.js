let mclick = [0,0,0];
let mbutcur = [0,0,0];
let mbutlast = [0,0,0];
let mbuthold = [0,0,0];

let maparea = null;
let rawwheeldelta = 0;
let infullscreen = null;
let lastinside = [0,0,0];

const mapAreaFocus = false;

function getxcode(e) {
	if (infullscreen) {
		return e.clientX;
	} else {
		return e.clientX - e.currentTarget.offsetLeft;
	}
}

function getycode(e) {
	if (infullscreen) {
		return e.clientY;
	} else {
		return e.clientY - e.currentTarget.offsetTop;
	}
}

// event mouse down
function bmoused(e) {
	maparea.focus(); // get keyboard working on maparea
	mbutcur[e.button] = 1;
	mbuthold[e.button] = 1;
	showInputEventStats("(Mdown[" + e.button + "] " + getxcode(e) + " " + getycode(e) + ") ");
	e.preventDefault();
}

// event mouse up
function bmouseu(e) {
	mbuthold[e.button] = 0;
	showInputEventStats("(Mup[" + e.button + "] " + getxcode(e) + " " + getycode(e) + ") ");
	++mclick[e.button];
	e.preventDefault();
}

// event mouse over
function bmouseov(e) {
	const verbose = false;
	if (verbose) {
		showInputEventStats("(Mover " + getxcode(e) + " " + getycode(e) + ") ");
	}
}

// event mouse exit
function bmouseou(e) {
	lastinside[0] = mbutcur[0];
	lastinside[1] = mbutcur[1];
	lastinside[2] = mbutcur[2];
	showInputEventStats("(Mout " + getxcode(e) + " " + getycode(e) + ") ");
}


// event mouse enter
function bmouseenter(e) {
	if (mapAreaFocus) {
		maparea.focus(); // get keyboard working on maparea
	}
	mbutcur[0] = lastinside[0];
	mbutcur[1] = lastinside[1];
	mbutcur[2] = lastinside[2];
	showInputEventStats("(Min[" + e.button + "] " + getxcode(e) + " " + getycode(e) + ") ");
}

// event mouse move
function bmousem(e) {
	if (e.layerX == null) {
		input.mx = getxcode(e); // doesn't work with scrollbars
		input.my = getycode(e);
	} else {
		input.mx = e.layerX; // works with scrollbars
		input.my = e.layerY;
	}
	if (input.mx < 0) {
		input.mx = 0;
	}
	if (input.my < 0) {
		input.my = 0;
	}
}

// event mouse click, doesn't seem to work if you click on an image on the map, and you click on it, implement with bmoused and bmouseu
function bmousec(e) {
	showInputEventStats("(Mclick[" + e.button + "] " + getxcode(e) + " " + getycode(e) + ") ");
	if (e.preventDefault) {
        e.preventDefault();
	}
}

// event mouse wheel changed
function bmousewheel(e) {

	if (e.wheelDelta) {
		rawwheeldelta += e.wheelDelta/120;
	} else if (e.detail) { /** Mozilla case. */
                /** In Mozilla, sign of delta is different than in IE.
                 * Also, delta is multiple of 3.
                 */
 		rawwheeldelta += -e.detail/3;
	}
	if (e.preventDefault) {
        e.preventDefault();
	}
}

function btouchstart(e)
{
	logger("touchstart\n");
	input.mx = Math.floor(e.touches[0].pageX);
	input.my = Math.floor(e.touches[0].pageY);
	mbutcur[0] = 1;
	mbuthold[0] = 1;
	if (e.preventDefault) {
		e.preventDefault();
	}
}

function btouchmove(e)
{
	logger("touchmove\n");
	input.mx = Math.floor(e.touches[0].pageX);
	input.my = Math.floor(e.touches[0].pageY);
	mbutcur[0] = 1;
	mbuthold[0] = 1;
	if (e.preventDefault) {
		e.preventDefault();
	}
}

function btouchend(e)
{
	logger("touchend\n");
	mbutcur[0] = 0;
	mbuthold[0] = 0;
	if (e.preventDefault) {
		e.preventDefault();
	}
}

function updateMouseStats() {
	mouseStats = 
	"mx " + input.mx + 
	", my " + input.my + 
	", mz " + input.wheelPos + 
	", mdz " + input.wheelDelta + 
	"<br>mbut [" + input.mbut + "]"+ 
	", mclick [" + input.mclick + "]";
}

function mapinit() {
	maparea = document.getElementById('drawarea');
	// kill right click save image
	maparea.addEventListener('contextmenu', function (e) {
		//document.body.innerHTML += '<p>Right-click is disabled</p>'
		e.preventDefault();
	  }, false);

	maparea.onclick = bmousec;
	maparea.onmousedown = bmoused;
	maparea.onmouseup = bmouseu;
	maparea.onmousemove = bmousem;
	maparea.onmouseover = bmouseov;
	maparea.onmouseout = bmouseou;
	maparea.onmouseenter = bmouseenter;
	maparea.onmousewheel = bmousewheel; 
	maparea.addEventListener('DOMMouseScroll', bmousewheel, false);
}

function mapproc()
{
	// mouse clicks in current frame
	input.mclick[0] = mclick[0];
	input.mclick[1] = mclick[1];
	input.mclick[2] = mclick[2];
	mclick[0] = mclick[1] = mclick[2] = 0;

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
	updateKeyboardStats();
}
