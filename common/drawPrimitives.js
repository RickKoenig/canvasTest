'use strict';

// 'O' means outline

class DrawPrimitives {
    constructor(plotter2d) {
        this.plotter2d = plotter2d // state of user/cam space
        this.ctx = plotter2d.ctx;
    }

    drawCircle(pnt, rad, color = "magenta", ndcScale = false) {
        this.ctx.beginPath();
        const ndcZoom = this.plotter2d.getNdcZoom(ndcScale);
        this.ctx.arc(pnt[0], pnt[1], rad * ndcZoom, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    drawCircleO(pnt, rad, lineWidth = .01, color = "magenta", ndcScale = false) {
        this.drawArcO(pnt, rad, lineWidth, 0, 2 * Math.PI, color, ndcScale);
    }

    drawArcO(pnt, rad, lineWidth = .01, arcStart, arcEnd, color = "magenta", ndcScale = false) {
        this.ctx.beginPath();
        const ndcZoom = this.plotter2d.getNdcZoom(ndcScale);
        this.ctx.lineWidth = lineWidth * ndcZoom;
        this.ctx.arc(pnt[0], pnt[1], rad * ndcZoom, arcStart, arcEnd);
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    drawRectangle(corner, size, color = "black", ndcScale = false) {
        const ndcZoom = this.plotter2d.getNdcZoom(ndcScale);
        const sizeScale = vec2.create();
        vec2.scale(sizeScale, size, ndcZoom);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(corner[0], corner[1], sizeScale[0], sizeScale[1]);
    }

    drawRectangleO(corner, size, lineWidth, color = "black", ndcScale = false) {
        const ndcZoom = this.plotter2d.getNdcZoom(ndcScale);
        this.ctx.lineWidth = lineWidth * ndcZoom;
        const sizeScale = vec2.create();
        vec2.scale(sizeScale, size, ndcZoom);
        this.ctx.strokeStyle = color;
        this.ctx.strokeRect(corner[0], corner[1], sizeScale[0], sizeScale[1]);
    }

    drawRectangleCenter(center, size, color = "black", ndcScale = false) {
        const ndcZoom = this.plotter2d.getNdcZoom(ndcScale);
        let sx = size[0] * ndcZoom;
        let sy = size[1] * ndcZoom;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(center[0] - sx / 2
            , center[1] - sy / 2
            , sx
            , sy);
    }

    drawRectangleCenterO(center, size, lineWidth = .01, color = "black", ndcScale = false) {
        const ndcZoom = this.plotter2d.getNdcZoom(ndcScale);
        this.ctx.lineWidth = lineWidth * ndcZoom;
        let sx = size[0] * ndcZoom;
        let sy = size[1] * ndcZoom;
        this.ctx.strokeStyle = color;
        this.ctx.strokeRect(center[0] - sx / 2
            , center[1] - sy / 2
            , sx
            , sy);
    }

    drawLine(p0, p1, lineWidth = .01, color = "black", ndcScale = false) {
        const ndcZoom = this.plotter2d.getNdcZoom(ndcScale);
        this.ctx.beginPath();
        this.ctx.moveTo(p0[0], p0[1]);
        this.ctx.lineTo(p1[0], p1[1]);
        this.ctx.lineWidth = lineWidth * ndcZoom;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    drawCross(p, size = 1, lineWidth = .01, color = "black", ndcScale = false) {
        this.drawLine([p[0] - size, p[1]], [p[0] + size, p[1]], lineWidth, color, ndcScale);
        this.drawLine([p[0], p[1] - size], [p[0], p[1] + size], lineWidth, color, ndcScale);
    }

    // an array of y values, x steps to the right
    // connected line and optional circles on vertices
    drawLinesSimple(pntsY, lineWidth = .01, circleSize = 0
            , startX = 0, stepX = 1
            , lineColor = "black", circleColor = "green", ndcScale = false) {
        const ndcZoom = this.plotter2d.getNdcZoom(ndcScale);
        this.ctx.lineWidth = lineWidth * ndcZoom;
        if (lineWidth > 0 && pntsY.length >= 2) {
            this.ctx.lineJoin = "round";
            this.ctx.lineCap = "round";
            const lineColorIsArray = lineColor instanceof Array;
            if (lineColorIsArray) {
                // colors per line segment
                let X = startX;
                for (let idx = 0; idx < pntsY.length - 1; ++idx) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(X, pntsY[idx]);
                    X += stepX;
                    this.ctx.lineTo(X, pntsY[idx + 1]);
                    this.ctx.strokeStyle = lineColor[idx];
                    this.ctx.stroke();
                }
            } else {
                // same color for all line segments
                this.ctx.strokeStyle = lineColor;
                this.ctx.beginPath();
                this.ctx.moveTo(startX, pntsY[0]);
                let X = startX;
                for(let idx = 1; idx < pntsY.length; ++idx) {
                    X += stepX;
                    this.ctx.lineTo(X, pntsY[idx]);
                }
                this.ctx.stroke();
            }
        }

        // optional draw circles on vertices
        if (circleSize > 0 && pntsY.length >= 1) {
            let X = startX;
            this.ctx.fillStyle = circleColor;
            for (let idx = 0; idx < pntsY.length; ++idx) {
                this.ctx.beginPath();
                this.ctx.arc(X, pntsY[idx], circleSize * ndcZoom * .5, 0, 2 * Math.PI);
                this.ctx.fill();
                X += stepX;
            }
        }
    }

    // an array of x,y values, if close is true, connect first point to last point
    drawLinesParametric(pnts, lineWidth = .01, circleSize = 0, close = false
        , lineColor = "black", circleColor = "green", offset = [0, 0], ndcScale = false) {
        const ndcZoom = this.plotter2d.getNdcZoom(ndcScale);
        this.ctx.lineWidth = lineWidth * ndcZoom;
        if (lineWidth > 0 && pnts.length >= 2) {
            this.ctx.lineJoin = "round";
            this.ctx.lineCap = "round";
            const lineColorIsArray = lineColor instanceof Array;
            if (lineColorIsArray) {
                // colors per line segment
                for (let idx = 0; idx < pnts.length - 1; ++idx) {
                    let pnt = pnts[idx];
                    this.ctx.beginPath();
                    this.ctx.moveTo(pnt[0], pnt[1]);
                    pnt = pnts[idx + 1];
                    this.ctx.lineTo(pnt[0], pnt[1]);
                    this.ctx.strokeStyle = lineColor[idx];
                    this.ctx.stroke();
                }
                if (close) {
                    const idx = pnts.length - 1;
                    let pnt = pnts[idx];
                    this.ctx.beginPath();
                    this.ctx.moveTo(pnt[0], pnt[1]);
                    pnt = pnts[0];
                    this.ctx.lineTo(pnt[0], pnt[1]);
                    this.ctx.strokeStyle = lineColor[idx];
                    this.ctx.stroke();
                }
            } else {
                // same color for all line segments
                this.ctx.strokeStyle = lineColor;
                this.ctx.beginPath();
                const pnt = pnts[0];
                this.ctx.moveTo(pnt[0] + offset[0], pnt[1] + offset[1]);
                for(let idx = 1; idx < pnts.length; ++idx) {
                    const pnt = pnts[idx];
                    this.ctx.lineTo(pnt[0] + offset[0], pnt[1] + offset[1]);
                }
                if (close) {
                    this.ctx.closePath();
                }
                this.ctx.stroke();
            }
        }

        // optional draw circles on vertices
        if (circleSize > 0) {
            this.ctx.fillStyle = circleColor;
            for (let idx = 0; idx < pnts.length; ++idx) {
                const pnt = pnts[idx];
                this.ctx.beginPath();
                this.ctx.arc(pnt[0] + offset[0], pnt[1] + offset[1], circleSize * ndcZoom, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    // draw a polygon with optional outline
    drawPoly(pnts, outlineRatio = 0 
        , fillColor = "black", outLineColor = "green") {
        if (pnts.length < 3) {
            return;
        }
        const outerColor = outlineRatio > 0 ? outLineColor : fillColor;

        // first pass, outlinecolor  if outlineRatio > 0  or fillcolor
        this.ctx.beginPath();
        this.ctx.lineJoin = "round";
        const pnt = pnts[0];
        this.ctx.moveTo(pnt[0], pnt[1]);
        let idx = 1;
        while(idx < pnts.length) {
            const pnt = pnts[idx];
            this.ctx.lineTo(pnt[0], pnt[1]);
            ++idx;
        }
        this.ctx.closePath();
        this.ctx.fillStyle = outerColor;
        this.ctx.fill();

        // second pass, fillcolor, only if outlineRatio > 0
        if (outlineRatio > 0) {
            this.ctx.save();
            const scl = 1 - outlineRatio;
            this.ctx.scale(scl, scl);
            this.ctx.beginPath();
            const pnt = pnts[0];
            this.ctx.moveTo(pnt[0], pnt[1]);
            let idx = 1;
            while(idx < pnts.length) {
                const pnt = pnts[idx];
                this.ctx.lineTo(pnt[0], pnt[1]);
                ++idx;
            }
            this.ctx.closePath();
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    drawText(center, size, txt, foreColor = "black", backColor = undefined, ndcScale = false) {
        let textYSize = 1;
        const ndcZoom = 1;
        const ndcZoomText = this.plotter2d.getNdcZoom(ndcScale) * this.plotter2d.extraZoom;
        const ndcZoomRect = this.plotter2d.extraZoom;
        if (backColor) {
            this.drawRectangleCenter(center, [size[0] * ndcZoomRect, size[1] * ndcZoomRect], backColor, ndcScale);
        }
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.translate(center[0], center[1]);
        let sy = size[1] * ndcZoomText;
        // invert the font scale y for NDC and USER spaces for they run y from bottom to top
        this.ctx.scale(sy, this.plotter2d.curSpace == Plotter2d.spaces.SCREEN ? sy : -sy);
        const adjCenter = .33; // TODO: no magic numbers, comes from font
        this.ctx.translate(-center[0], -center[1] + adjCenter);
        this.ctx.font = 'bold ' + textYSize + 'px serif';
        this.ctx.fillStyle = foreColor; 
        let text = txt;
        
        this.ctx.fillText(text, center[0], center[1]);
        this.ctx.restore();
    }
}
