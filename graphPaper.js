const minGrid = [-100, -100];
const maxGrid = [100, 100];
const shrink = .05; // clip a little in NDC space to add axis labels X and Y

// draw
function drawOneGrid(ctx, spacing, lineWidth, color) {
	ctx.beginPath();
	// horizontal lines
	for (let j = minGrid[1]; j <= maxGrid[1]; j += spacing) {
		if (j >= camMin[1] && j <= camMax[1]) {
			ctx.moveTo(minGrid[0], j);
			ctx.lineTo(maxGrid[0], j);
		}
	}
	// vertical lines
	for (let i = minGrid[0]; i <= maxGrid[0]; i += spacing) {
		if (i >= camMin[0] && i <= camMax[0]) {
			ctx.moveTo(i, minGrid[1]);
			ctx.lineTo(i, maxGrid[1]);
		}
	}
	ctx.strokeStyle = color;
	ctx.lineWidth = lineWidth;
	ctx.stroke();
}

function drawGrid(ctx) {
	// in ctx clip
	let fine = .25;
	let med = 1;
	let larger = 10;
	// fine grid
	drawOneGrid(ctx, fine, .005, "rgb(133, 216, 252)");
	// medium grid
	drawOneGrid(ctx, med, .0075, "rgb(96,204,252)");
	// larger grid
	drawOneGrid(ctx, larger, .01, "rgb(74, 184, 231)");
	// axis
	ctx.beginPath();
	ctx.lineTo(minGrid[0], 0);
	ctx.lineTo(maxGrid[0], 0);
	ctx.moveTo(0, minGrid[1]);
	ctx.lineTo(0, maxGrid[1]);
	ctx.strokeStyle = "rgb(68, 109, 126)";
	ctx.lineWidth = .0125;
	ctx.stroke();
}

function drawAxis(ctx) {
	// axis
	ctx.beginPath();
	ctx.lineTo(minGrid[0] * 2, 0);
	ctx.lineTo(maxGrid[0] * 2, 0);
	ctx.moveTo(0, minGrid[1] * 2);
	ctx.lineTo(0, maxGrid[1] * 2);
	ctx.strokeStyle = "rgb(68, 109, 126)";
	ctx.lineWidth = .0125;
	ctx.stroke();

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
		if (zoom < level.lessZoom) {
			break;
		}
	}
	level = levels[i];

	for (let i = minGrid[0]; i <= maxGrid[0]; i += level.step) {
		drawAText(ctx
			, [i + tensSize * invZoom * level.xGap, -tensSize * invZoom * level.yGap] // offset away slightly from grid
			, [tensSize, tensSize]
			, i.toFixed(level.fix)
			, true
		);
	}
	for (let j = minGrid[1]; j <= maxGrid[1]; j += level.step) {
		drawAText(ctx
			, [ tensSize * invZoom * level.xGap, j - tensSize * invZoom * level.yGap] // offset away slightly from grid
			, [tensSize, tensSize]
			, j.toFixed(level.fix)
			, true
		);
	}
}

function drawAxisNames(ctx) {
	let size = .05;
	const hAxis = doParametric ? "X" : "T";
	drawAText(ctx, [camMax[0] - shrink * invZoom/ 2, 0], [size, size], hAxis, true, "white");
	drawAText(ctx, [0, camMax[1] - shrink * invZoom/ 2, 0], [size, size], "Y", true, "white");
}
