// screen space circle
function drawACircleScreen(ctx, p, rad) {
	ctx.beginPath();
	ctx.lineWidth = 2.5;
	ctx.arc(p[0], p[1], rad, 0, Math.PI * 2);
	ctx.strokeStyle = "red";
	ctx.stroke();
}
// test user space limits
function drawACircle(ctx, p, NDC, rad = .05) {
	ctx.beginPath();
	const zm = NDC ? invZoom : 1;
	ctx.lineWidth = .005 * zm;
	ctx.arc(p[0], p[1], rad * zm, 0, Math.PI * 2);
	ctx.strokeStyle = "green";
	ctx.stroke();
}

function drawARectangle(ctx, center, size, NDC, background) {
	//ctx.strokeStyle = background;
	const zm = NDC ? invZoom : 1;
	ctx.lineWidth = .02 * zm;
	let sx = size[0] * zm;
	let sy = size[1] * zm;
	/*
	ctx.strokeRect(center[0] - sx / 2
		, center[1] - sy / 2
		, sx
		, sy);
	*/
	ctx.fillStyle = background;
	ctx.fillRect(center[0] - sx / 2
		, center[1] - sy / 2
		, sx
		, sy);

}

function drawAText(ctx, center, size, txt, NDC, background) {
	let textYSize = 1;
	if (background) {
		drawARectangle(ctx,center,[size[0], size[1]],NDC,background);
	}
	ctx.save();
	ctx.textAlign = 'center';
	ctx.translate(center[0], center[1]);
	const zm = NDC ? invZoom : 1;
	let sy = size[1] * zm;
	ctx.scale(sy, -sy);
	ctx.translate(-center[0], -center[1] + .33); // TODO: no magic numbers, comes from font
	ctx.font = 'bold ' + textYSize + 'px serif';
	ctx.fillStyle = "blue"; 
	let text = txt;
	
	ctx.fillText(text, center[0], center[1]);
	ctx.restore();
}
