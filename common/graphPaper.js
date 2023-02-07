'use strict';

class GraphPaper {
    static levels = [
        {step: 100, fix: 0, xGap: .5, yGap: .5, lineWidth: .08, color: "rgb(22, 100, 180)", lessTextZoom: .01, lessGridZoom: .01},
        {step: 10, fix: 0, xGap: .5, yGap: .5, lineWidth: .02, color: "rgb(74, 184, 231)", lessTextZoom: .1, lessGridZoom: .1},
        {step: 1, fix: 0, xGap: .5, yGap: .5, lineWidth: .008, color: "rgb(96,204,252)", lessTextZoom: .7, lessGridZoom: .7},
        {step: .25, fix: 2, xGap: 1.1, yGap: .5, lineWidth: .005, color: "rgb(133, 216, 252)"},
    ];

    constructor(drawPrims, minGrid = [-100, -100], maxGrid = [100, 100]) {
        this.dp = drawPrims;
        this.ctx = drawPrims.ctx;
        this.plotter2d = drawPrims.plotter2d;

        this.minGrid = vec2.clone(minGrid);
        this.maxGrid = vec2.clone(maxGrid);
        this.shrink = .05; // clip a little in NDC space to add axis labels X and Y
        this.minZoom = .00025; // don't draw thin lines
    }

// draw in user/cam space
    #drawOneGrid(spacing, lineWidth, color) {
        this.ctx.beginPath();
        // vertical lines
        for (let i = this.minGrid[0]; i <= this.maxGrid[0]; i += spacing) {
            if (i >= this.plotter2d.camMin[0] && i <= this.plotter2d.camMax[0]) {
                this.ctx.moveTo(i, this.minGrid[1]);
                this.ctx.lineTo(i, this.maxGrid[1]);
            }
        }
        // horizontal lines
        for (let j = this.minGrid[1]; j <= this.maxGrid[1]; j += spacing) {
            if (j >= this.plotter2d.camMin[1] && j <= this.plotter2d.camMax[1]) {
                this.ctx.moveTo(this.minGrid[0], j);
                this.ctx.lineTo(this.maxGrid[0], j);
            }
        }
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.stroke();
    }

    #drawGrid() {
        for (let i = GraphPaper.levels.length - 1; i >= 0; --i) {
            const level = GraphPaper.levels[i];
            if (level.lineWidth * this.plotter2d.zoom >= this.minZoom || i == 0) {
                if (i != 0 || this.plotter2d.zoom < .1) {
                    this.#drawOneGrid(level.step, level.lineWidth, level.color); // don't draw 100's when zoomed in
                }
            }
        }
    }

    #drawAxis() {
        // axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.minGrid[0] * 2, 0);
        this.ctx.lineTo(this.maxGrid[0] * 2, 0);
        this.ctx.moveTo(0, this.minGrid[1] * 2);
        this.ctx.lineTo(0, this.maxGrid[1] * 2);
        this.ctx.strokeStyle = "rgb(68, 109, 126)";
        this.ctx.lineWidth = .0125;
        this.ctx.stroke();

        // axis text numbers
        let textSize = .05;
        let level;
        let i;
        for (i = 0; i < GraphPaper.levels.length - 1; ++i) {
            level = GraphPaper.levels[i];
            if (this.plotter2d.zoom < level.lessTextZoom) {
                break;
            }
        }
        level = GraphPaper.levels[i];

        const slack = .5 * this.plotter2d.invZoom; // slight overdraw for clipping
        // horizontal
        for (let i = this.minGrid[0]; i <= this.maxGrid[0]; i += level.step) {
            // clip
            if (i < this.plotter2d.camMin[0] - slack || i > this.plotter2d.camMax[0] + slack) { // a little slack
                continue;
            }
            this.dp.drawText(
                  [i + textSize * this.plotter2d.invZoom * level.xGap, -textSize * this.plotter2d.invZoom * level.yGap] // offset away slightly from grid
                , [textSize, textSize]
                , i.toFixed(level.fix)
                , "blue"
                , undefined
                , true
            );
        }
        // vertical
        for (let j = this.minGrid[1]; j <= this.maxGrid[1]; j += level.step) {
            // clip
            if (j < this.plotter2d.camMin[1] - slack || j > this.plotter2d.camMax[1] + slack) { // a little slack
                continue;
            }
            this.dp.drawText(
                  [ textSize * this.plotter2d.invZoom * level.xGap, j - textSize * this.plotter2d.invZoom * level.yGap] // offset away slightly from grid
                , [textSize, textSize]
                , j.toFixed(level.fix)
                , "blue"
                , undefined
                , true
            );
        }
    }

    #drawAxisNames(hAxis, vAxis) {
        let size = .05;
        this.dp.drawText([this.plotter2d.camMax[0] - this.shrink * this.plotter2d.invZoom/ 2, 0], [size, size], hAxis, undefined, "white", true);
        this.dp.drawText([0, this.plotter2d.camMax[1] - this.shrink * this.plotter2d.invZoom/ 2], [size, size], vAxis, undefined, "white", true);
    }

    draw(axisH, axisV) {
        // grid lines
        this.#drawGrid();
        // axis lines and text numbers
        this.#drawAxis();
        // names of axes
        this.#drawAxisNames(axisH, axisV);
    }
}
