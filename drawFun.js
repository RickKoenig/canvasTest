'use strict';

class DrawFun {
    constructor(graphPaper) {
        this.ctx = graphPaper.dp.ctx; // canvas 2D context
        this.dp = graphPaper.dp;
		this.params = graphPaper.dp.params;
    }

	functionF(t) {
		return Math.cos(t); // default function
	}

	functionG(t) {
		return Math.sin(t); // default function
	}

	changeFunctionF(f) {
		this.functionF = f;
	}

	changeFunctionG(g) {
		this.functionG = g;
	}

	#drawParametric(lineStep, phase, graphPaper, p) {
		if (!this.functionF) {
			//console.log("no draw functionF !!!");
			return;
		}
		if (!this.functionG) {
			//console.log("no draw functionG !!!");
			return;
		}
		// draw a user defined function, default is a sine wave
		this.ctx.beginPath();
		for (let s = 0; s <= lineStep; ++s) {
			let t = s / lineStep; // t goes from [0 to 1]
			t *= Math.PI * 2; // t goes from [0 to 2 * PI]
			let x;
			try { // drawFunction might be defined, but if you run it, it might generate an error
				x = this.functionF(t);
			} catch (err) {
				//console.error("Error drawing function: <<< " + err + " >>>");
			}
			let y;
			try { // drawFunction might be defined, but if you run it, it might generate an error
				y = this.functionG(t + phase);
			} catch (err) {
				//console.error("Error drawing function: <<< " + err + " >>>");
			}
			if (x >= graphPaper.minGrid[0] && x <= graphPaper.maxGrid[0]) { 
				if (y >= graphPaper.minGrid[1] && y <= graphPaper.maxGrid[1]) { 
					this.ctx.lineTo(x, y);
				}
			}
		}
		this.ctx.strokeStyle = "blue";
		this.ctx.lineWidth = .01;
		this.ctx.stroke();
	}

	#drawNormal(lineStep, phase, graphPaper) {
        const p = this.params;
		if (!this.functionG) {
			//console.log("no draw functionG !!!");
			return;
		}
		// draw a user defined function, default is a sine wave
		this.ctx.beginPath();
		const margin = 0; // .125; // test min and max range, user/cam space
		const minX = Math.max(p.camMin[0], graphPaper.minGrid[0]) + margin;
		const maxX = Math.min(p.camMax[0], graphPaper.maxGrid[0]) - margin;
		for (let s = 0; s <= lineStep; ++s) {
			let t = s / lineStep; //  t goes from [0 to 1]
			t = lerp(minX, maxX, t); // t goes from [minX to maxX]
			let y;
			try { // drawFunction might be defined, but if you run it, it might generate an error
				y = this.functionG(t + phase);
			} catch (err) {
				//console.error("Error drawing function: <<< " + err + " >>>");
				y = t + phase;
			}
			if (y >= graphPaper.minGrid[1] && y <= graphPaper.maxGrid[1]) { 
				this.ctx.lineTo(t, y);
			}
		}
		this.ctx.strokeStyle = "blue";
		this.ctx.lineWidth = .01;
		this.ctx.stroke();
    }

	// 'graphPaper' is used for constraining the function to the size of the graph paper
    draw(doParametric, lineStep, phase, graphPaper, p) {
		if (doParametric) {
			this.#drawParametric(lineStep, phase, graphPaper, p);
		} else {
			this.#drawNormal(lineStep, phase, graphPaper, p);
		}
	}

}
