'use strict';

class GraphPaper {
    constructor(drawPrims) {
        this.dp = drawPrims;
        this.ctx = drawPrims.ctx;
        this.plotter2d = drawPrims.plotter2d;

        this.minGrid = [-100, -100];
        this.maxGrid = [100, 100];
        this.shrink = .05; // clip a little in NDC space to add axis labels X and Y
    }

// draw in user/cam space
    #drawOneGrid(spacing, lineWidth, color) {
        this.ctx.beginPath();
        // horizontal lines
        for (let j = this.minGrid[1]; j <= this.maxGrid[1]; j += spacing) {
            if (j >= this.plotter2d.camMin[1] && j <= this.plotter2d.camMax[1]) {
                this.ctx.moveTo(this.minGrid[0], j);
                this.ctx.lineTo(this.maxGrid[0], j);
            }
        }
        // vertical lines
        for (let i = this.minGrid[0]; i <= this.maxGrid[0]; i += spacing) {
            if (i >= this.plotter2d.camMin[0] && i <= this.plotter2d.camMax[0]) {
                this.ctx.moveTo(i, this.minGrid[1]);
                this.ctx.lineTo(i, this.maxGrid[1]);
            }
        }
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.stroke();
    }

    #drawGrid() {
        // in ctx clip
        let fine = .25;
        let med = 1;
        let larger = 10;
        // fine grid
        this.#drawOneGrid(fine, .005, "rgb(133, 216, 252)");
        // medium grid
        this.#drawOneGrid(med, .0075, "rgb(96,204,252)");
        // larger grid
        this.#drawOneGrid(larger, .01, "rgb(74, 184, 231)");
        // axis
        this.ctx.beginPath();
        this.ctx.lineTo(this.minGrid[0], 0);
        this.ctx.lineTo(this.maxGrid[0], 0);
        this.ctx.moveTo(0, this.minGrid[1]);
        this.ctx.lineTo(0, this.maxGrid[1]);
        this.ctx.strokeStyle = "rgb(68, 109, 126)";
        this.ctx.lineWidth = .0125;
        this.ctx.stroke();
    }

    #drawAxis() {
        // axis
        this.ctx.beginPath();
        this.ctx.lineTo(this.minGrid[0] * 2, 0);
        this.ctx.lineTo(this.maxGrid[0] * 2, 0);
        this.ctx.moveTo(0, this.minGrid[1] * 2);
        this.ctx.lineTo(0, this.maxGrid[1] * 2);
        this.ctx.strokeStyle = "rgb(68, 109, 126)";
        this.ctx.lineWidth = .0125;
        this.ctx.stroke();

        // axis numbers
        let tensSize = .05;
        let level;
        let levels = [
            {step: 10, fix: 0, xGap: .5, yGap: .5, lessZoom: .1},
            {step: 1, fix: 0, xGap: .5, yGap: .5, lessZoom: .6},
            {step: .25, fix: 2, xGap: 1.2, yGap: .5},
        ];
        let i;
        for (i = 0; i < levels.length - 1; ++i) {
            level = levels[i];
            if (this.plotter2d.zoom < level.lessZoom) {
                break;
            }
        }
        level = levels[i];

        for (let i = this.minGrid[0]; i <= this.maxGrid[0]; i += level.step) {
            this.dp.drawAText(
                  [i + tensSize * this.plotter2d.invZoom * level.xGap, -tensSize * this.plotter2d.invZoom * level.yGap] // offset away slightly from grid
                , [tensSize, tensSize]
                , i.toFixed(level.fix)
                , "blue"
                , undefined
                , true
            );
        }
        for (let j = this.minGrid[1]; j <= this.maxGrid[1]; j += level.step) {
            this.dp.drawAText(
                  [ tensSize * this.plotter2d.invZoom * level.xGap, j - tensSize * this.plotter2d.invZoom * level.yGap] // offset away slightly from grid
                , [tensSize, tensSize]
                , j.toFixed(level.fix)
                , "blue"
                , undefined
                , true
            );
        }
    }

    #drawAxisNames(hAxis, vAxis) {
        let size = .05;
        this.dp.drawAText([this.plotter2d.camMax[0] - this.shrink * this.plotter2d.invZoom/ 2, 0], [size, size], hAxis, undefined, "white", true);
        this.dp.drawAText([0, this.plotter2d.camMax[1] - this.shrink * this.plotter2d.invZoom/ 2], [size, size], vAxis, undefined, "white", true);
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

