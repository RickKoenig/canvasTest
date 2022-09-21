'use strict';

// combine Keyboard and Mouse in this Input class
class Input {
    constructor(divDraw) {
        this.keyboard = new Keyboard(divDraw);
        this.mouse = new Mouse(divDraw);
    }

    proc(area) { // either a <div> or a <canvas>
        this.keyboard.proc();
        this.mouse.proc(area); // just for size
    }
}
