'use strict';

class Plotter2d {
    constructor(ctx) {
        this.ctx = ctx;

        // some SWITCHES
        // test screen space
        this.screenSpaceTests = true;

        // test NDC space
        this.NDCSpaceTests = true;

        // test user/cam space
        this.textTests = true;
        this.circleTest = true;
        // end some SWITCHES

        this.params = {
            // mouse in user/cam space
            plot : [0, 0],

            // screen space
            W : [0, 0],
            WMin : 0,

            // NDC space
            trans : [0, 0],
            scl : 0,
            ndcMin: [0, 0],
            ndcMax: [0, 0],

            // user/cam space
            camMin: [0, 0],
            camMax: [0, 0],
            center: [0, 0],
            startZoom: 1,
            zoom: 1,
            invZoom: 1,
            lzoom: 0

        };

        this.scaleReset();

        // drawing user/cam space grid and function
        //this.showGrid = true;
        //this.showFunction = true;
        // end some SWITCHES

    }

	scaleReset() {
        const p = this.params;
        p.zoom = p.startZoom;
		p.invZoom = 1 / p.zoom;
        p.lzoom = Math.log(p.zoom);
    }

    calcCanvasSpacesUI(wid, hit, mouse) {
        const p = this.params;
        let pnt = [mouse.mx, mouse.my];
        p.plot = this.screen2math(pnt);
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

        p.camMin[0] = p.ndcMin[0] * p.invZoom + p.center[0];
        p.camMin[1] = p.ndcMin[1] * p.invZoom + p.center[1];
        p.camMax[0] = p.ndcMax[0] * p.invZoom + p.center[0];
        p.camMax[1] = p.ndcMax[1] * p.invZoom + p.center[1];
        }

    // screen space circle
    #drawACircleScreen(pnt, rad) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 2.5;
        this.ctx.arc(pnt[0], pnt[1], rad, 0, Math.PI * 2);
        this.ctx.strokeStyle = "red";
        this.ctx.stroke();
    }

    // test user space limits
    drawACircle(pnt, NDC, rad = .05) {
        const p = this.params;
        this.ctx.beginPath();
        const zm = NDC ? p.invZoom : 1;
        this.ctx.lineWidth = .005 * zm;
        this.ctx.arc(pnt[0], pnt[1], rad * zm, 0, Math.PI * 2);
        this.ctx.strokeStyle = "green";
        this.ctx.stroke();
    }

    drawAText(center, size, txt, NDC, background) {
        const p = this.params;
        let textYSize = 1;
        if (background) {
            this.drawARectangle(center,[size[0], size[1]],NDC,background);
        }
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.translate(center[0], center[1]);
        const zm = NDC ? p.invZoom : 1;
        let sy = size[1] * zm;
        this.ctx.scale(sy, -sy);
        this.ctx.translate(-center[0], -center[1] + .33); // TODO: no magic numbers, comes from font
        this.ctx.font = 'bold ' + textYSize + 'px serif';
        this.ctx.fillStyle = "blue"; 
        let text = txt;
        
        this.ctx.fillText(text, center[0], center[1]);
        this.ctx.restore();
    }

    drawARectangle(center, size, NDC, background) {
        const p = this.params;
        const zm = NDC ? p.invZoom : 1;
        this.ctx.lineWidth = .02 * zm;
        let sx = size[0] * zm;
        let sy = size[1] * zm;
        this.ctx.fillStyle = background;
        this.ctx.fillRect(center[0] - sx / 2
            , center[1] - sy / 2
            , sx
            , sy);
    
    }

    screen2math(i) {
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

        this.calcCanvasSpacesUI(wid, hit, input);

        // ###### canvas/screen space
        if (this.screenSpaceTests) {
            this.#drawACircleScreen([0, 0], 20);
            this.#drawACircleScreen([p.W[0], 0], 20);
            this.#drawACircleScreen([0, p.W[1]], 20);
            this.#drawACircleScreen([p.W[0], p.W[1]], 20);
            this.#drawACircleScreen([p.W[0] * .5, p.W[1] * .5], 20);
        }

        // to NDC space
        this.ctx.save(); // screen space saved
        this.ctx.scale(p.scl, -p.scl); // math to screen space
        this.ctx.translate(p.trans[0], p.trans[1]);

        // ###### NDC space
        if (this.NDCSpaceTests) {
            let p = this.params;
            this.drawAText([p.ndcMin[0] + .25 , p.ndcMin[1] + .125], [.25, .25], "NDC");
            this.drawAText([p.ndcMax[0] - .25 , p.ndcMax[1] - .125], [.25, .25], "NDC");
            this.drawACircle([0, 0], false, .125);
            this.drawACircle([-1, -1], false, .125);
            this.drawACircle([1, -1], false, .125);
            this.drawACircle([-1, 1], false, .125);
            this.drawACircle([1, 1], false, .125);  
        }
        
        // to user/cam space
        this.ctx.save(); // NDC space saved
        this.ctx.scale(p.zoom, p.zoom);
        this.ctx.translate(-p.center[0], -p.center[1]);
        // ###### user/cam space
        if (this.textTests) {
            this.drawAText([.5, 0], [.125 * 7, .125], "User Text", false, "darkgray");
            this.drawAText([-.5, 0], [.125 * 7, .125], "User Text NDC", true, "darkgray");
        }

        if (this.circleTest) {
            this.drawACircle([.25, 0], false);
            this.drawACircle([-.25, 0], false);
            this.drawACircle([0, .25], false);
            this.drawACircle([0, -.25], false);
            this.drawACircle([.5, 0], true);
            this.drawACircle([-.5, 0], true);
            this.drawACircle([0, .5], true);
            this.drawACircle([0, -.5], true);
        }
    }
}
