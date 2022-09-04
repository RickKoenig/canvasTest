'use strict';

let keystatecur;
let keystatehold;

function isbrowserdebugkey(k) {
    return k == keycodes.F12;
}

function getkey() {
    const ret = input.keybuff.shift();
    if (!ret) {
        return 0;
    }
    return ret;
}

function getkeycode(e) {
    if (e.keyCode) {
        return e.keyCode;
    }
    return e.charCode;
}

// event
function bkeyp(e) { // press
    showInputEventStats("(KP " + getkeycode(e).toString(16) + ") ");
}

// event
function bkeyd(e) { // down
    const maxbuflen = 4;
    let val = getkeycode(e);
    showInputEventStats("(KD " + val.toString(16) + ") ");
    val = kukd2ascii[val];
    if (val) {
        keystatecur[val] = 1;
        keystatehold[val] = 1;
        if (input.keybuff.length < maxbuflen) {
            if (keystatehold[keycodes.SHIFT]) { // no nudges for SHIFT
                val = noshift2shift[val];
            }
            if (val != keycodes.SHIFT) { // don't push SHIFT
                input.keybuff.push(val);
            }
        }
        if (isbrowserdebugkey(val)) {
            return;
        }
    }
    e.returnValue = false;
    if (e.preventDefault) {
        e.preventDefault();
    }
}

// event
function bkeyu(e) { // up
    let val = getkeycode(e);
    showInputEventStats("(KU " + val.toString(16) + ") ");
    val = kukd2ascii[val];
    if (val) {
        keystatehold[val] = 0;
        if (isbrowserdebugkey(val)) {
            return;
        }
    }
    e.returnValue = false;
    if (e.preventDefault) {
        e.preventDefault();
    }
}

function keyinit() {
    keystatecur = new Array(); // keycode keys currently down 0 or 1, indexed by keycode
    keystatehold = new Array(); // keycode keys currently down 0 or 1, indexed by keycode
    let keyarea = document.getElementById('drawarea');
    keyarea.focus();
    keyarea.addEventListener('keydown',bkeyd,false);
    keyarea.addEventListener('keypress',bkeyp,false);
    keyarea.addEventListener('keyup',bkeyu,false);
}

function keyproc()
{
    // buffered keyboard input
    input.key = getkey();
    // keystate, allow for nudges
    input.keystate = keystatecur;
    keystatecur = keystatehold.slice(0); // copy array
}

function updateKeyboardStats() {
    // show keystate
    keyboardStats = "keyState [";
    let len = input.keystate.length;
    let i;
    for (i=0;i<len;++i) {
        if (input.keystate[i])
            keyboardStats += i.toString(16) + " ";
    }
    keyboardStats += "]<br>key " + input.key.toString(16) + 
    " keybufflen " + input.keybuff.length;
}
