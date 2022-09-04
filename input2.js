'use strict';

//let input; // object that has all input in it

// input
let inputEventsStats = "";
let keyboardStats = "";
let mouseStats = "";

class Input {
    constructor() {
        this.keybuff = new Array(); // unicode keys pressed
        this.keystate = new Array(); // keycode keys currently down 0 or 1, indexed by keycode
        this.key = 0;
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
    }
}

Input.MLEFT = 0;
Input.MMIDDLE = 1;
Input.MRIGHT = 2;

function initinput() {
	input = new Input();
	keyinit();
	mapinit();
}

function inputproc() {
	keyproc();
	mapproc();
}

function showInputEventStats(eventStr) {
	inputEventsStats = eventStr + inputEventsStats;
	let maxSize = 75;
	inputEventsStats = inputEventsStats.substring(0,maxSize);
}
