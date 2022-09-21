'use strict';

// handle screen, NFC, user/cam spaces,    allow mouse to UI control the user/cam space
class Params {

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
        //let p = this.params;
        let r = Array(2);
        r[0] = this.center[0] + (i[0] - this.W[0]/2)/(this.zoom*this.WMin/2);
        r[1] = this.center[1] + (i[1] - this.W[1]/2)/(-this.zoom*this.WMin/2);
        this.userMouse = r;
        //return r;
    }

    calcCanvasSpacesUI(wid, hit, mouse) {
        //const p = this.params;
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

}
