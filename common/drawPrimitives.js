'use strict';

// 'O' means outline

class DrawPrimitives {
    constructor(plotter2d) {
        this.plotter2d = plotter2d // state of user/cam space
        this.ctx = plotter2d.ctx;
    }

    drawCircle(pnt, rad, color = "magenta", ndcScale = false) {
        this.ctx.beginPath();
        const ndcZoom = this.plotter2d.getZoom(ndcScale);
        this.ctx.arc(pnt[0], pnt[1], rad * ndcZoom, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    drawCircleO(pnt, rad, lineWidth = .01, color = "magenta", ndcScale = false) {
        this.ctx.beginPath();
        const ndcZoom = this.plotter2d.getZoom(ndcScale);
        this.ctx.lineWidth = lineWidth * ndcZoom;
        this.ctx.arc(pnt[0], pnt[1], rad * ndcZoom, 0, Math.PI * 2);
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    drawRectangle(topLeft, size, color = "black", ndcScale = false) {
        const ndcZoom = this.plotter2d.getZoom(ndcScale);
        const sizeScale = vec2.create();
        vec2.scale(sizeScale, size, ndcZoom);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(topLeft[0], topLeft[1], sizeScale[0], sizeScale[1]);
    }

    drawRectangleO(topLeft, size, lineWidth, color = "black", ndcScale = false) {
        const ndcZoom = this.plotter2d.getZoom(ndcScale);
        this.ctx.lineWidth = lineWidth * ndcZoom;
        const sizeScale = vec2.create();
        vec2.scale(sizeScale, size, ndcZoom);
        this.ctx.fillStyle = color;
        this.ctx.strokeRect(topLeft[0], topLeft[1], sizeScale[0], sizeScale[1]);
    }

    drawRectangleCenter(center, size, color = "black", ndcScale = false) {
        const ndcZoom = this.plotter2d.getZoom(ndcScale);
        let sx = size[0] * ndcZoom;
        let sy = size[1] * ndcZoom;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(center[0] - sx / 2
            , center[1] - sy / 2
            , sx
            , sy);
    }

    drawRectangleCenterO(center, size, lineWidth = .01, color = "black", ndcScale = false) {
        const ndcZoom = this.plotter2d.getZoom(ndcScale);
        this.ctx.lineWidth = lineWidth * ndcZoom;
        let sx = size[0] * ndcZoom;
        let sy = size[1] * ndcZoom;
        this.ctx.fillStyle = color;
        this.ctx.strokeRect(center[0] - sx / 2
            , center[1] - sy / 2
            , sx
            , sy);
    }

    drawLine(p0, p1, lineWidth = .01, color = "black", ndcScale = false) {
        const ndcZoom = this.plotter2d.getZoom(ndcScale);
        this.ctx.beginPath();
        this.ctx.moveTo(p0[0], p0[1]);
        this.ctx.lineTo(p1[0], p1[1]);
        this.ctx.lineWidth = lineWidth * ndcZoom;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    drawText(center, size, txt, fore = "black", back = undefined, ndcScale = false) {
        let textYSize = 1;
        if (back) {
            this.drawRectangleCenter(center, [size[0], size[1]], back, ndcScale);
        }
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.translate(center[0], center[1]);
        const ndcZoom = this.plotter2d.getZoom(ndcScale);
        let sy = size[1] * ndcZoom;
        // invert the font scale y for NDC and USER spaces for they run y from bottom to top
        this.ctx.scale(sy, this.plotter2d.curSpace == Plotter2d.spaces.SCREEN ? sy : -sy);
        //sy = .5 + .01 * sy;
        //this.ctx.scale(sy, -sy);
        //console.log("scale = [" + sy + "," + -sy + "]");
        const adjCenter = .33; // TODO: no magic numbers, comes from font
        this.ctx.translate(-center[0], -center[1] + adjCenter);
        this.ctx.font = 'bold ' + textYSize + 'px serif';
        this.ctx.fillStyle = fore; 
        let text = txt;
        
        this.ctx.fillText(text, center[0], center[1]);
        this.ctx.restore();
    }
}
