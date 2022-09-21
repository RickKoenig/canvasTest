'use strict';

class Plotter2d {
    constructor(ctx) {
        this.ctx = ctx;

        // some SWITCHES
        // test screen space
        this.screenSpaceTests = true;
        // end some SWITCHES

        this.params = {
            // mouse in user/cam space
            plot : [0, 0],

            // screen space dimensions of <canvas> / <div>
            W : [0, 0],
            WMin : 0,

            // screen to NDC space
            trans : [0, 0],
            scl : 0,
            ndcMin: [0, 0],
            ndcMax: [0, 0],

            // NDC to  user/cam space
            camMin: [0, 0],
            camMax: [0, 0],
            center: [0, 0],
            startZoom: 1,
            zoom: 1,
            invZoom: 1,
            logZoom: 0
        };
        this.scaleReset();
    }

	scaleReset() {
        const p = this.params;
        p.zoom = p.startZoom;
		p.invZoom = 1 / p.zoom;
        p.logZoom = Math.log(p.zoom);
    }

    #newcenter(i, pnt) {
        const p = this.params;
        let nc = Array(2);
        nc[0] = pnt[0] - (i[0] - p.W[0] / 2) / (p.zoom * p.WMin / 2);
        nc[1] = pnt[1] - (i[1] - p.W[1] / 2) / (-p.zoom * p.WMin / 2);
        return nc;
    }
        
    #calcCanvasSpacesUI(wid, hit, mouse) {
        const p = this.params;
        let pnt = [mouse.mx, mouse.my];
        p.plot = this.#screen2math(pnt);
        p.W[0] = wid;
        p.W[1] = hit;

        p.WMin = Math.min(p.W[0], p.W[1]);
        // calc min and max of NDC space and scale and translate
        if (p.W[0] >= p.W[1]) { // landscape
            p.ndcMax[0] = p.W[0] / p.W[1];
            p.ndcMin[0] = -p.ndcMax[0];
            p.ndcMax[1] = 1;
            p.ndcMin[1] = -1;
    
            p.scl = p.W[1] / 2;
            p.trans[0] = p.ndcMax[0];
            p.trans[1] = -1;
        } else { // portrait
            p.ndcMax[0] = 1;
            p.ndcMin[0] = -1;
            p.ndcMax[1] = p.W[1] / p.W[0];
            p.ndcMin[1] = -p.ndcMax[1];
    
            p.scl = p.W[0] / 2;
            p.trans[0] = 1;
            p.trans[1] = -p.ndcMax[1];
        }

        

        if (mouse.wheelDelta) { // wheel mouse
            let m = mouse.wheelDelta > 0 ? 1 : -1;
            let lzoomspeed = 1/16;
            if (mouse.mbut[Mouse.MMIDDLE]) { // faster wheel mouse when middle button held down
                lzoomspeed *= 4;
            }
            p.logZoom += m * lzoomspeed;
            p.logZoom = range(-5, p.logZoom, 5);
        }

        p.zoom = Math.exp(p.logZoom);
        p.invZoom = 1 / p.zoom;
        
        
        if (mouse.wheelDelta) { // zoom where the mouse is
            p.center = this.#newcenter(pnt, p.plot);
        }
        if (mouse.mbut[0]) {
            const f = 1 / (p.zoom * p.WMin / 2);
            // where is the mouse in float coords
            p.center[0] -= mouse.dmx*f;
            p.center[1] += mouse.dmy*f;
        }

        p.camMin[0] = p.ndcMin[0] * p.invZoom + p.center[0];
        p.camMin[1] = p.ndcMin[1] * p.invZoom + p.center[1];
        p.camMax[0] = p.ndcMax[0] * p.invZoom + p.center[0];
        p.camMax[1] = p.ndcMax[1] * p.invZoom + p.center[1];
    }

    // screen space circle
    #drawACircleOScreen(pnt, rad) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 2.5;
        this.ctx.arc(pnt[0], pnt[1], rad, 0, Math.PI * 2);
        this.ctx.strokeStyle = "red";
        this.ctx.stroke();
    }

    #screen2math(i) {
        let p = this.params;
        let r = Array(2);
        r[0] = p.center[0] + (i[0] - p.W[0]/2)/(p.zoom*p.WMin/2);
        r[1] = p.center[1] + (i[1] - p.W[1]/2)/(-p.zoom*p.WMin/2);
        return r;
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

        this.#calcCanvasSpacesUI(wid, hit, input);

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
