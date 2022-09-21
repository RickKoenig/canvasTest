'use strict';

// setup different spaces and UI the user/cam space with the mouse
class Plotter2d {
    constructor(ctx) {
        this.ctx = ctx;

        // some SWITCHES
        // test screen space
        this.screenSpaceTests = true;
        // end some SWITCHES

        // control the zoom and pan
        this.params = new Params();
    }

    // screen space circle
    #drawACircleOScreen(pnt, rad) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 2.5;
        this.ctx.arc(pnt[0], pnt[1], rad, 0, Math.PI * 2);
        this.ctx.strokeStyle = "red";
        this.ctx.stroke();
    }

    proc(wid, hit, input) {
        let p = this.params;
        // these 'restore's do nothing the first time thru
        // but it eliminates calling a cleanup funciton
        // back to NDC space
        this.ctx.restore();
        // back to canvas/screen space
        this.ctx.restore();
        // back to all defaults
        //this.ctx.restore(); // they cancel (restore, save)
        // all restored

        //this.ctx.save(); // save all the defaults

        this.params.calcCanvasSpacesUI(wid, hit, input);

        // ###### canvas/screen space
        if (this.screenSpaceTests) {
            this.#drawACircleOScreen([0, 0], 20);
            this.#drawACircleOScreen([p.W[0], 0], 20);
            this.#drawACircleOScreen([0, p.W[1]], 20);
            this.#drawACircleOScreen([p.W[0], p.W[1]], 20);
            this.#drawACircleOScreen([p.W[0] * .5, p.W[1] * .5], 20);
        }

        // to NDC space
        this.ctx.save(); // screen space saved
        this.ctx.scale(p.scl, -p.scl); // math to screen space
        this.ctx.translate(p.trans[0], p.trans[1]);

        // to user/cam space
        this.ctx.save(); // NDC space saved
        this.ctx.scale(p.zoom, p.zoom);
        this.ctx.translate(-p.center[0], -p.center[1]);
        // ###### user/cam space
    }
}
