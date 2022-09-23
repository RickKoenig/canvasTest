'use strict';

'use strict';

// handle screen, NFC, user/cam spaces,    allow mouse to UI control the user/cam space
class Plotter2d {

    constructor() {
        // mouse in user/cam space
        this.userMouse = [0, 0];
    
        // screen space dimensions of <canvas> / <div>
        this.W = [0, 0];
        this.WMin = 0;
    
        // screen to NDC space
        this.trans = [0, 0];
        this.scl = 0;
        this.ndcMin= [0, 0];
        this.ndcMax= [0, 0];
    
        // NDC to  user/cam space
        this.camMin= [0, 0];
        this.camMax= [0, 0];
        this.center= [0, 0];

        this.startZoom= 1;
        this.zoom= 1;
        this.invZoom= 1;
        this.logZoom= 0

        this.scaleReset();
    }

	scaleReset() {
        this.zoom = this.startZoom;
		this.invZoom = 1 / this.zoom;
        this.logZoom = Math.log(this.zoom);
    }

    #newcenter(i, pnt) {
        let nc = Array(2);
        nc[0] = pnt[0] - (i[0] - this.W[0] / 2) / (this.zoom * this.WMin / 2);
        nc[1] = pnt[1] - (i[1] - this.W[1] / 2) / (-this.zoom * this.WMin / 2);
        this.center = nc;
    }

    #screen2math(i) {
        let r = Array(2);
        r[0] = this.center[0] + (i[0] - this.W[0]/2)/(this.zoom*this.WMin/2);
        r[1] = this.center[1] + (i[1] - this.W[1]/2)/(-this.zoom*this.WMin/2);
        this.userMouse = r;
    }

    #setCtxTransScaleUserCam(ctx) {
        // these 'restore's do nothing the first time thru
        // but it eliminates calling a cleanup funciton
        // back to NDC space
        ctx.restore();
        // back to canvas/screen space
        ctx.restore();
        // back to all defaults
        //ctx.restore(); // they cancel (restore, save)
        // all restored

        //ctx.save(); // save all the defaults

/*
        // ###### canvas/screen space
        if (this.screenSpaceTests) {
            this.#drawACircleOScreen([0, 0], 20);
            this.#drawACircleOScreen([params.W[0], 0], 20);
            this.#drawACircleOScreen([0, params.W[1]], 20);
            this.#drawACircleOScreen([params.W[0], params.W[1]], 20);
            this.#drawACircleOScreen([params.W[0] * .5, params.W[1] * .5], 20);
        }
*/
        // to NDC space
        ctx.save(); // screen space saved
        ctx.scale(this.scl, -this.scl); // math to screen space
        ctx.translate(this.trans[0], this.trans[1]);

        // to user/cam space
        ctx.save(); // NDC space saved
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.center[0], -this.center[1]);
        // ###### user/cam space
    }

    #procUserCamUI(wid, hit, mouse) {
        // use the mouse to navigate the user/cam space
        let pnt = [mouse.mx, mouse.my];
        this.#screen2math(pnt);
        this.W[0] = wid;
        this.W[1] = hit;

        this.WMin = Math.min(this.W[0], this.W[1]);
        // calc min and max of NDC space and scale and translate
        if (this.W[0] >= this.W[1]) { // landscape
            this.ndcMax[0] = this.W[0] / this.W[1];
            this.ndcMin[0] = -this.ndcMax[0];
            this.ndcMax[1] = 1;
            this.ndcMin[1] = -1;
    
            this.scl = this.W[1] / 2;
            this.trans[0] = this.ndcMax[0];
            this.trans[1] = -1;
        } else { // portrait
            this.ndcMax[0] = 1;
            this.ndcMin[0] = -1;
            this.ndcMax[1] = this.W[1] / this.W[0];
            this.ndcMin[1] = -this.ndcMax[1];
    
            this.scl = this.W[0] / 2;
            this.trans[0] = 1;
            this.trans[1] = -this.ndcMax[1];
        }

        if (mouse.wheelDelta) { // wheel mouse
            let m = mouse.wheelDelta > 0 ? 1 : -1;
            let lzoomspeed = 1/16;
            if (mouse.mbut[Mouse.MMIDDLE]) { // faster wheel mouse when middle button held down
                lzoomspeed *= 4;
            }
            this.logZoom += m * lzoomspeed;
            this.logZoom = range(-5, this.logZoom, 5);
        }

        this.zoom = Math.exp(this.logZoom);
        this.invZoom = 1 / this.zoom;
        
        
        if (mouse.wheelDelta) { // zoom where the mouse is
            this.#newcenter(pnt, this.userMouse);
        }
        if (mouse.mbut[0]) {
            const f = 1 / (this.zoom * this.WMin / 2);
            // where is the mouse in float coords
            this.center[0] -= mouse.dmx*f;
            this.center[1] += mouse.dmy*f;
        }

        this.camMin[0] = this.ndcMin[0] * this.invZoom + this.center[0];
        this.camMin[1] = this.ndcMin[1] * this.invZoom + this.center[1];
        this.camMax[0] = this.ndcMax[0] * this.invZoom + this.center[0];
        this.camMax[1] = this.ndcMax[1] * this.invZoom + this.center[1];
    }

    proc(wid, hit, mouse, ctx) {
        // run interactive user/cam space navigation
        this.#procUserCamUI(wid, hit, mouse);
        // set ctx to user/cam space
        this.#setCtxTransScaleUserCam(ctx);
    }

}



/*
// setup different spaces and UI the user/cam space with the mouse
class Plotter2d {
    constructor(ctx) {
        this.ctx = ctx;

        // some SWITCHES
        // test screen space
        this.screenSpaceTests = false;
        // end some SWITCHES

        // control the zoom and pan
        //this.params = new Params();
    }

    // screen space circle
    #drawACircleOScreen(pnt, rad) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 2.5;
        this.ctx.arc(pnt[0], pnt[1], rad, 0, Math.PI * 2);
        this.ctx.strokeStyle = "red";
        this.ctx.stroke();
    }

    proc(params) {
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


        // ###### canvas/screen space
        if (this.screenSpaceTests) {
            this.#drawACircleOScreen([0, 0], 20);
            this.#drawACircleOScreen([params.W[0], 0], 20);
            this.#drawACircleOScreen([0, params.W[1]], 20);
            this.#drawACircleOScreen([params.W[0], params.W[1]], 20);
            this.#drawACircleOScreen([params.W[0] * .5, params.W[1] * .5], 20);
        }

        // to NDC space
        this.ctx.save(); // screen space saved
        this.ctx.scale(params.scl, -params.scl); // math to screen space
        this.ctx.translate(params.trans[0], params.trans[1]);

        // to user/cam space
        this.ctx.save(); // NDC space saved
        this.ctx.scale(params.zoom, params.zoom);
        this.ctx.translate(-params.center[0], -params.center[1]);
        // ###### user/cam space
    }
}
*/