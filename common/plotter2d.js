'use strict';

// handle screen, NFC, user/cam spaces,    allow mouse to UI control the user/cam space
class Plotter2d {
    // enum spaces
    static spaces = makeEnum(["SCREEN", "NDC", "USER"]);

    scaleReset() {
        this.zoom = this.startZoom;
		this.invZoom = 1 / this.zoom;
        this.logZoom = Math.log(this.zoom);
        this.coordReset = true;
    }

    xTransReset() {
        this.center[0] = this.startCenter[0];
        this.coordReset = true;
    }

    yTransReset() {
        this.center[1] = this.startCenter[1];
        this.coordReset = true;
    }

    constructor(canvas, ctx, vp, startCenter = [0,0], startZoom = 1, fixedSize) {
        this.canvas = canvas;
        this.ctx = ctx; // only used for trans and scale, save and restore
        this.vp = vp;
        this.fixedSize = fixedSize;
        // mouse in user/cam space
        this.userMouse = vec2.create(); // current mouse coords in user/cam space
        this.coordReset = false;
    
        // screen space dimensions of <canvas> / <div>
        this.W = vec2.create();
        this.WMin = 0;
    
        // screen to NDC space
        this.trans = vec2.create();
        this.scl = 0;
        this.ndcMin = vec2.create();
        this.ndcMax = vec2.create();
    
        // NDC to  user/cam space
        this.camMin = vec2.create();
        this.camMax = vec2.create();
        this.center = vec2.clone(startCenter);
        this.startCenter = vec2.clone(startCenter);

        this.startZoom= startZoom;
        this.zoom= 1;
        this.invZoom= 1;
        this.logZoom= 0;
        this.minLogZoom = -6.6;
        this.maxLogZoom = 4;

        this.scaleReset();
        // good state is one ctx.default in the stack and some active current state
        this.ctx.save();
        this.curSpace = Plotter2d.spaces.SCREEN;

        if (this.vp) {
            // add the UI for the user/cam space (reset and info)
            // text and buttons 
            this.pieces = {
                mouse: 
                {
                    preId: "textMouse",
                },
                xTrans: 
                {
                    preId: "textXTransCam",
                    butId: "buttonXTransCam",
                    butText: "X Trans Camera Reset",
                    reset: this.xTransReset
                },
                yTrans: {
                    preId: "textYTransCam",
                    butId: "buttonYTransCam",
                    butText: "Y Trans Camera Reset",
                    reset: this.yTransReset
                },
                scale: {
                    preId: "textScaleCam",
                    butId: "buttonScaleCam",
                    butText: "Scale Camera Reset",
                    reset: this.scaleReset
                }
            };
            
            const pieces = Object.values(this.pieces);
            // makeElements
            makeEle(this.vp, "hr");
            for (const piece of pieces) {
                const pre = makeEle(this.vp, "pre", piece.preId);
                makeEle(pre, "span", piece.preId);
                if (piece.butId) { // also add eventListeners for the button
                    makeEle(this.vp, "button", piece.butId, null, piece.butText, piece.reset.bind(this));
                }
            }
            
            // setup textInfoEle for each piece
            for (const piece of pieces) {
                const textInfoEle = document.getElementById(piece.preId);
                piece.textInfoEle = textInfoEle;
            }
        }
    }

    #newcenter(i, pnt) {
        let nc = vec2.create();
        nc[0] = pnt[0] - (i[0] - this.W[0] / 2) / (this.zoom * this.WMin / 2);
        nc[1] = pnt[1] - (i[1] - this.W[1] / 2) / (-this.zoom * this.WMin / 2);
        this.center = nc;
    }

    #screen2userCam(i) {
        let r = vec2.create();
        r[0] = this.center[0] + (i[0] - this.W[0]/2)/(this.zoom*this.WMin/2);
        r[1] = this.center[1] + (i[1] - this.W[1]/2)/(-this.zoom*this.WMin/2);
        this.userMouse = r;
    }

    // return correct zoom for a given space
    getZoom(ndcScale) {
        if (this.curSpace != Plotter2d.spaces.USER) {
            return 1;
        }
        // only in user space, scale back to NDC
        const zoom = ndcScale ? this.invZoom : 1;
        return zoom;
    }

    // set canvas to its background color by setting its dimensions
    clearCanvas() {
        this.canvas.width = this.canvas.width;
        this.canvas.height = this.canvas.height;
    }

	// given size of window or a fixed size set canvas size
	#calcCanvasSize() {
        let wid;
        let hit;
        if (this.fixedSize) {
			// set canvas size to a fixed size
			wid = this.fixedSize[0];
			hit = this.fixedSize[1];
		} else {
			// set canvas size depending on window size
			// TODO: get rid of magic numbers
			wid = window.innerWidth - 450; // window is global
			hit = window.innerHeight - 100;
			wid = Math.max(200, wid);
			hit = Math.max(750, hit);
		}
        if (this.canvas.width == wid && this.canvas.height) {
            return false;
        }
        this.canvas.width = wid;
        this.canvas.height = hit;
        return true;
    }

    proc(vp, mouse, whichBut = Mouse.LEFT) {
        let dirt = this.#calcCanvasSize();
        if (this.coordReset) {
            dirt = true;
            this.coordReset = false;
        }
        this.W[0] = this.canvas.width;
        this.W[1] = this.canvas.height;

        this.WMin = Math.min(this.W[0], this.W[1]);
        // use the mouse to navigate the user/cam space
        let pnt = vec2.clone(mouse.mxy);
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
                this.logZoom += m * lzoomspeed;
                this.logZoom = range(this.minLogZoom, this.logZoom, this.maxLogZoom);
                this.zoom = Math.exp(this.logZoom);
                this.invZoom = 1 / this.zoom;
    
                // zoom to where the mouse is
                this.#newcenter(pnt, this.userMouse);
                dirt = true;
            }
    
            if (mouse.mbut[whichBut]) {
                const f = 1 / (this.zoom * this.WMin / 2);
                // where is the mouse in float coords
                this.center[0] -= mouse.dmxy[0]*f;
                this.center[1] += mouse.dmxy[1]*f;
                dirt = true;
            }
        } 

        let temp = vec2.create();

        vec2.scale(temp, this.ndcMin, this.invZoom);
        vec2.add(this.camMin, temp, this.center);
        vec2.scale(temp, this.ndcMax, this.invZoom);
        vec2.add(this.camMax, temp, this.center);
        
        if (this.vp) {
            // xtrans
            this.pieces.xTrans.textInfoEle.innerText = "center[0] = " 
                + this.center[0].toFixed(2);
            // ytrans
            this.pieces.yTrans.textInfoEle.innerText = "center[1] = " 
                + this.center[1].toFixed(2);
            // scale
            this.pieces.scale.textInfoEle.innerText = "zoom=" 
                + this.zoom.toFixed(4) + ", logZ=" + this.logZoom.toFixed(4);
            // mouse
            this.pieces.mouse.textInfoEle.innerText = "Mouse = (" 
                + this.userMouse[0].toFixed(2) + ", " + this.userMouse[1].toFixed(2) + ")";
        }
        return dirt;
    }

    setSpace(space) {
        // canvas stack set to default every frame
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
            this.ctx.scale(this.scl, -this.scl); // screen to NDC space
            this.ctx.translate(this.trans[0], this.trans[1]);
            // ###### now in NDC space
            break;
        case Plotter2d.spaces.USER:
            // to USER space
            this.ctx.scale(this.scl, -this.scl); // screen to NDC space
            this.ctx.translate(this.trans[0], this.trans[1]);
            // NDC to user/cam space
            this.ctx.scale(this.zoom, this.zoom);
            this.ctx.translate(-this.center[0], -this.center[1]);
            // ###### now in user/cam space
            break;
        }
        this.curSpace = space;
    }
}
