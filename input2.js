'use strict';

// combine Keyboard and Mouse in this Input class
class Input {
    constructor(divDraw, canvasDraw) {
        this.keyboard = new Keyboard(divDraw);
        this.mouse = new Mouse(divDraw, canvasDraw);
    }

    proc(canvas) {
        this.keyboard.proc();
        this.mouse.proc(canvas);
    }
}
