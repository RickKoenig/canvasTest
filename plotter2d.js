// some SWITCHES

// test screen space
const screenSpaceTests = false;

// test NDC space
const NDCSpaceTests = false;

// test user/cam space
const textTests = false;
const circleTest = false;

// drawing user/cam space grid and function
const showGrid = true;
const showFunction = true;
// end some SWITCHES

function plotter2dproc() {
	calcCanvasSpacesUI();
}

function draw(ctx) {
	ctx.save(); // save all the defaults

	// ###### canvas/screen space
	if (screenSpaceTests) {
		drawACircleScreen(ctx, [0, 0], 20);
		drawACircleScreen(ctx, [W[0], 0], 20);
		drawACircleScreen(ctx, [0, W[1]], 20);
		drawACircleScreen(ctx, [W[0], W[1]], 20);
		drawACircleScreen(ctx, [W[0] * .5, W[1] * .5], 20);
	}

	// to NDC space
	ctx.save(); // screen space saved
	ctx.scale(scl, -scl); // math to screen space
	ctx.translate(trans[0], trans[1]);

	// ###### NDC space
	if (NDCSpaceTests) {
		drawAText(ctx, [ndcMin[0] + .25 , ndcMin[1] + .125], [.25, .25], "NDC");
		drawAText(ctx, [ndcMax[0] - .25 , ndcMax[1] - .125], [.25, .25], "NDC");
		drawACircle(ctx, [0, 0], false, .125);
		drawACircle(ctx, [-1, -1], false, .125);
		drawACircle(ctx, [1, -1], false, .125);
		drawACircle(ctx, [-1, 1], false, .125);
		drawACircle(ctx, [1, 1], false, .125);
	}
	
	// to user/cam space
	ctx.save(); // NDC space saved
	ctx.scale(zoom, zoom);
	ctx.translate(-center[0], -center[1]);

	// ###### user/cam space

	// grid lines
	if (showGrid) {
		drawGrid(ctx);
		drawAxis(ctx);
		drawAxisNames(ctx);
	}
	
	// draw some functions
	drawFunctions(ctx);
	if (textTests) {
		drawAText(ctx, [.5, 0], [.125 * 7, .125], "User Text", false, "darkgray");
		drawAText(ctx, [-.5, 0], [.125 * 7, .125], "User Text NDC", true, "darkgray");
	}
	if (circleTest) {
		drawACircle(ctx,[.25, 0], false);
		drawACircle(ctx,[-.25, 0], false);
		drawACircle(ctx,[0, .25], false);
		drawACircle(ctx,[0, -.25], false);
		drawACircle(ctx,[.5, 0], true);
		drawACircle(ctx,[-.5, 0], true);
		drawACircle(ctx,[0, .5], true);
		drawACircle(ctx,[0, -.5], true);
	}

	// back to NDC space
	ctx.restore();
	// back to canvas/screen space
	ctx.restore();
	// back to all defaults
	ctx.restore();
}
