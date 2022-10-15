'use strict';

// handle screen, NFC, user/cam spaces,    allow mouse to UI control the user/cam space
class Plotter2d {

    // enum spaces
    static spaces = makeEnum(["SCREEN", "NDC", "USER"]);

    constructor(canvas, ctx, vb, startCenter = [0,0], startZoom = 1) {
        this.canvas = canvas;
        this.ctx = ctx; // only used for trans and scale, save and restore
        this.vb = vb;
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

        if (this.vb) {
            const clazz = "noMargins";
            const pieces = [
                {
                    preId: "textXTransCam2",
                    preText: "hum1",
                    butId: "buttonXTransCam2",
                    butText: "X Trans Camera Reset"
                },
                {
                    preId: "textYTransCam2",
                    preText: "hum2",
                    butId: "buttonXTransCam2",
                    butText: "X Trans Camera Reset"
                },
                {
                    preId: "textScaleCam2",
                    preText: "hum3",
                    butId: "buttonScaleCam2",
                    butText: "Scale Camera Reset"
                }
            ];
            for (let piece in pieces) {
                console.log("piece id = " + pieces[piece].preId);

            }
/*
		<hr>
		<pre class="noMargins"><span id="textXTransCam">hum1</span></pre>
		<button id="buttonXTransCam">X Trans Camera Reset</button>

		<hr>
		<pre class="noMargins"><span id="textYTransCam">hum2</span></pre>
		<button id="buttonYTransCam">Y Trans Camera Reset</button>

		<hr>
		<pre class="noMargins"><span id="textScaleCam">hum3</span></pre>
		<button id="buttonScaleCam">Scale Camera Reset</button>
		<hr>
*/
        }
    }

    #setCamPiece() {

    }

    #setCamTransScale() {

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

	// given size of window or a fixed size set canvas size
	#calcCanvasSize() {
		const fixedDim = false;
        if (fixedDim) {
			const fixedSize = [800, 600];
			// set canvas size to a fixed size
			this.canvas.width = fixedSize[0];
			this.canvas.height = fixedSize[1];
		} else {
			// set canvas size depending on window size
			// TODO: get rid of magic numbers
			const wid = window.innerWidth - 450; // window is global
			const hit = window.innerHeight - 100;
			this.canvas.width = Math.max(200, wid);
			this.canvas.height = Math.max(750, hit);
		}
	}

    proc(mouse, whichBut = Mouse.LEFT) {
        this.W[0] = this.canvas.width;
        this.W[1] = this.canvas.height;
        this.#calcCanvasSize();

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

        if (whichBut >= 0) {
            if (mouse.wheelDelta) { // wheel mouse
                let m = mouse.wheelDelta > 0 ? 1 : -1;
                let lzoomspeed = 1/16;
                if (mouse.mbut[Mouse.MIDDLE]) { // faster wheel mouse when middle button held down
                    lzoomspeed *= 4;
                }
                const minLogZoom = -5;
                const maxLogZoom = 4;
                this.logZoom += m * lzoomspeed;
                this.logZoom = range(minLogZoom, this.logZoom, maxLogZoom);
                this.zoom = Math.exp(this.logZoom);
                this.invZoom = 1 / this.zoom;
    
                // zoom to where the mouse is
                this.#newcenter(pnt, this.userMouse);
            }
    
            if (mouse.mbut[whichBut]) {
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
            // to NDC space
            this.ctx.scale(this.scl, -this.scl); // math to screen space
            this.ctx.translate(this.trans[0], this.trans[1]);
            // ###### now in NDC space
            break;
        case Plotter2d.spaces.USER:
            // to USER space
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
