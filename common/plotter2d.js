'use strict';

'use strict';

// handle screen, NFC, user/cam spaces,    allow mouse to UI control the user/cam space
class Plotter2d {

    // enum spaces
    static spaces = makeEnum(["SCREEN", "NDC", "USER"]);

    constructor(ctx, startCenter = [0,0], startZoom = 1) {
        this.ctx = ctx; // only used for trans and scale, save and restore
        // mouse in user/cam space
        this.userMouse = [0, 0]; // current mouse coords in user/cam space
    
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
        this.center= clone(startCenter);
        this.startCenter= clone(startCenter);

        this.startZoom= startZoom;
        this.zoom= 1;
        this.invZoom= 1;
        this.logZoom= 0;

        this.scaleReset();
        // good state is one ctx.default in the stack and some active current state
        this.ctx.save();
        this.curSpace = Plotter2d.spaces.SCREEN;
    }

	scaleReset() {
        this.zoom = this.startZoom;
		this.invZoom = 1 / this.zoom;
        this.logZoom = Math.log(this.zoom);
    }

xTransReset() {
    this.center[0] = this.startCenter[0];
}

yTransReset() {
    this.center[1] = this.startCenter[1];
}

#newcenter(i, pnt) {
        let nc = Array(2);
        nc[0] = pnt[0] - (i[0] - this.W[0] / 2) / (this.zoom * this.WMin / 2);
        nc[1] = pnt[1] - (i[1] - this.W[1] / 2) / (-this.zoom * this.WMin / 2);
        this.center = nc;
    }

    #screen2userCam(i) {
        let r = Array(2);
        r[0] = this.center[0] + (i[0] - this.W[0]/2)/(this.zoom*this.WMin/2);
        r[1] = this.center[1] + (i[1] - this.W[1]/2)/(-this.zoom*this.WMin/2);
        this.userMouse = r;
    }

    getZoom(ndcScale) {
        if (this.curSpace != Plotter2d.spaces.USER) {
            return 1;
        }
        // only in user space
        const zoom = ndcScale ? this.invZoom : 1;
        return zoom;
    }
/*
    const zm = this.plotter2d.getZoom();
    const zm = ndcScale ? this.plotter2d.invZoom : 1;
*/

    proc(wid, hit, mouse, doNav = true) {
        this.W[0] = wid;
        this.W[1] = hit;

        this.WMin = Math.min(this.W[0], this.W[1]);
        // use the mouse to navigate the user/cam space
        let pnt = [mouse.mx, mouse.my];
        this.#screen2userCam(pnt);
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

        if (doNav) {
            if (mouse.wheelDelta) { // wheel mouse
                let m = mouse.wheelDelta > 0 ? 1 : -1;
                let lzoomspeed = 1/16;
                if (mouse.mbut[Mouse.MMIDDLE]) { // faster wheel mouse when middle button held down
                    lzoomspeed *= 4;
                }
                this.logZoom += m * lzoomspeed;
                this.logZoom = range(-5, this.logZoom, 5);
                this.zoom = Math.exp(this.logZoom);
                this.invZoom = 1 / this.zoom;
    
                // zoom to where the mouse is
                this.#newcenter(pnt, this.userMouse);
            }
    
            if (mouse.mbut[Mouse.MLEFT]) {
                const f = 1 / (this.zoom * this.WMin / 2);
                // where is the mouse in float coords
                this.center[0] -= mouse.dmx*f;
                this.center[1] += mouse.dmy*f;
            }
        } 

        this.camMin[0] = this.ndcMin[0] * this.invZoom + this.center[0];
        this.camMin[1] = this.ndcMin[1] * this.invZoom + this.center[1];
        this.camMax[0] = this.ndcMax[0] * this.invZoom + this.center[0];
        this.camMax[1] = this.ndcMax[1] * this.invZoom + this.center[1];
    }

    setSpace(space) {
        // canvas stack set to default every frame maybe TODO: verify
        // back to canvas/screen space
        this.ctx.restore(); // stack now empty and ctx set back to defaults
        this.ctx.save(); // screen space/defaults saved on stack
        
        switch(space) {
        case Plotter2d.spaces.SCREEN:
            // ###### already in screen/canvas space
            // do nothing
            break;
        case Plotter2d.spaces.NDC:
            // toco NDC space
            this.ctx.scale(this.scl, -this.scl); // math to screen space
            this.ctx.translate(this.trans[0], this.trans[1]);
            // ###### now in NDC space
            break;
        case Plotter2d.spaces.USER:
            // to NDC space
            this.ctx.scale(this.scl, -this.scl); // math to screen space
            this.ctx.translate(this.trans[0], this.trans[1]);
            // to user/cam space
            this.ctx.scale(this.zoom, this.zoom);
            this.ctx.translate(-this.center[0], -this.center[1]);
            // ###### now in user/cam space
            break;
        }
        this.curSpace = space;
    }

}
