'use strict';

class Keyboard {
    constructor(div) {

        // public
        this.key = 0; // current key click from buffer, 0 if no key pressed
        this.keybuff = new Array(); // unicode keys pressed
        this.keystate = new Array(); // keycode keys currently down 0 or 1, indexed by keycode
        this.events = "";
        this.stats = "";

        // private
        this.keystatecur = new Array(); // keycode keys currently down 0 or 1, indexed by keycode
        this.keystatehold = new Array(); // keycode keys currently down 0 or 1, indexed by keycode


        div.focus();
        div.addEventListener("keydown", (e) => {
            this.#bkeyd(e);
        });
        div.addEventListener("keypress", (e) => {
            this.#bkeyp(e);
        });
        div.addEventListener("keyup", (e) => {
            this.#bkeyu(e);
        });
    }

    #isbrowserdebugkey(k) {
        return k == keyTable.keyCodes.F12;
    }

    // event
    #bkeyu(e) { // up
        let val = this.#getkeycode(e);
        //console.log("up " + val);
        this.#updateEventInfo("(KU " + val.toString(16) + ") ");
        val = keyTable.kukd2ascii[val];
        if (val) {
            this.keystatehold[val] = 0;
            if (this.#isbrowserdebugkey(val)) {
                return;
            }
        }
        e.returnValue = false;
        if (e.preventDefault) {
            e.preventDefault();
        }
    }

    // event
    #bkeyp(e) { // press
        //console.log("pressed " + this.#getkeycode(e));
        this.#updateEventInfo("(KP " + this.#getkeycode(e).toString(16) + ") ");
    }
    
    // event
    #bkeyd(e) { // down
        let val = this.#getkeycode(e);
        //console.log("down " + val);
        const maxbuflen = 16;
        this.#updateEventInfo("(KD " + val.toString(16) + ") ");
        val = keyTable.kukd2ascii[val];
        if (val) {
            this.keystatecur[val] = 1;
            this.keystatehold[val] = 1;
            if (this.keybuff.length < maxbuflen) {
                if (this.keystatehold[keyTable.keyCodes.SHIFT]) { // no nudges for SHIFT
                    val = keyTable.noshift2shift[val];
                }
                if (val != keyTable.keyCodes.SHIFT) { // don't push SHIFT
                    this.keybuff.push(val);
                }
            }
            if (this.#isbrowserdebugkey(val)) {
                return;
            }
        }
        e.returnValue = false;
        if (e.preventDefault) {
            e.preventDefault();
        }
    }

    #updateEventInfo(eventStr) {
        this.events = eventStr + this.events;
        const maxSize = 60;
        this.events = this.events.substring(0,maxSize);
    }
    
    // process keyboard events
    #getkeycode(e) {
        if (e.keyCode) {
            return e.keyCode;
        }
        return e.charCode;
    }
    
    #getkey() {
        const ret = this.keybuff.shift();
        if (!ret) {
            return 0;
        }
        return ret;
    }
    
    #updateKeyboardStats() {
        // show keystate
        this.stats = "keyState [";
        let len = this.keystate.length;
        for (let i = 0; i < len; ++i) {
            if (this.keystate[i])
                this.stats += i.toString(16) + " ";
        }
        this.stats += "]<br>key " + this.key.toString(16) + 
        " keybufflen " + this.keybuff.length;
    }

    proc() {
        // buffered keyboard input
        this.key = this.#getkey();
        // keystate, allow for nudges
        this.keystate = this.keystatecur;
        this.keystatecur = this.keystatehold.slice(); // copy array
        this.#updateKeyboardStats();
    }
}
