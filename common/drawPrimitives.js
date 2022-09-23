'use strict';

class DrawPrimitives {
    constructor(ctx, params) {
        this.ctx = ctx; // canvas 2D context
        this.params = params // state of user/cam space
    }

    // test user space limits
    drawACircleO(pnt, rad, lineWidth = .01, color = "magenta", ndcScale = false) {
        this.ctx.beginPath();
        const zm = ndcScale ? this.params.invZoom : 1;
        this.ctx.lineWidth = lineWidth * zm;
        this.ctx.arc(pnt[0], pnt[1], rad * zm, 0, Math.PI * 2);
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    drawARectangle(center, size, color = "black", ndcScale = false) {
        const zm = ndcScale ? this.params.invZoom : 1;
        this.ctx.lineWidth = .02 * zm;
        let sx = size[0] * zm;
        let sy = size[1] * zm;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(center[0] - sx / 2
            , center[1] - sy / 2
            , sx
            , sy);
    
    }

    drawAText(center, size, txt, fore = "black", back = undefined, NDC = false) {
        let textYSize = 1;
        if (back) {
            this.drawARectangle(center, [size[0], size[1]], back, NDC);
        }
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.translate(center[0], center[1]);
        const zm = NDC ? this.params.invZoom : 1;
        let sy = size[1] * zm;
        this.ctx.scale(sy, -sy);
        const adjCenter = .33; // TODO: no magic numbers, comes from font
        this.ctx.translate(-center[0], -center[1] + adjCenter);
        this.ctx.font = 'bold ' + textYSize + 'px serif';
        this.ctx.fillStyle = fore; 
        let text = txt;
        
        this.ctx.fillText(text, center[0], center[1]);
        this.ctx.restore();
    }

}
