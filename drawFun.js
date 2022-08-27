// line steps
const startLineStep = 150;
let lineStep = 0;

function lineStepChange(id) {
	textLineStep.innerHTML = "Line Step = " + parseInt(id.value);
	lineStep = parseFloat(id.value);
}

function lineStepReset() {
	lineStep = startLineStep;
	sliderLineStep.value = lineStep;
	lineStepChange(sliderLineStep);
}

function submitFunctionF() {
	let funStr = editFunctionF.value;
	// remove newlines at end of function string if there from a submit by hitting CR
	while(true) {
		let lenMinus1 = funStr.length - 1;
		if (funStr[lenMinus1] == '\n') {
			funStr = funStr.substring(0,lenMinus1);
			editFunctionF.value = funStr;
		} else {
			break;
		}
		editFunctionF.style.height = editFunctionF.scrollHeight + 'px'; // make editbox bigger, TODO: what does this do ???
	}
	strToFunctionF(funStr);
}
	
function submitFunctionG() {
	let funStr = editFunctionG.value;
	// remove newlines at end of function string if there from a submit by hitting CR
	while(true) {
		let lenMinus1 = funStr.length - 1;
		if (funStr[lenMinus1] == '\n') {
			funStr = funStr.substring(0,lenMinus1);
			editFunctionG.value = funStr;
		} else {
			break;
		}
		editFunctionG.style.height = editFunctionG.scrollHeight + 'px'; // make editbox bigger, TODO: what does this do ???
	}
	strToFunctionG(funStr);
}

function submitFunctions() {
	submitFunctionF();
	submitFunctionG();
}
	
function strToFunctionF(funStr) {
	drawFunctionF = generateDrawFunction(addMathPrefix(funStr));
	textFunctionF.innerHTML = "'x = " + funStr + "'";
}

function strToFunctionG(funStr) {
	drawFunctionG = generateDrawFunction(addMathPrefix(funStr));
	textFunctionG.innerHTML = "'y = " + funStr + "'";
}

function drawFunctions(ctx) {
	const maxXY = 250
	if (doParametric) { //x = F(t) , y = G(t + p)
		if (!drawFunctionF) {
			console.log("no draw functionF !!!");
		}
		if (!drawFunctionG) {
			console.log("no draw functionG !!!");
		}
		if (showFunction && drawFunctionF && drawFunctionG) {
			// draw a user defined function, default is a sine wave
			ctx.beginPath();
			for (let s = 0; s <= lineStep; ++s) {
				let t = s / lineStep; // t goes from [0 to 1]
				t *= Math.PI * 2; // t goes from [0 to 2 * PI]
				let x;
				try { // drawFunction might be defined, but if you run it, it might generate an error
					x = drawFunctionF(t);
				} catch (err) {
					//console.error("Error drawing function: <<< " + err + " >>>");
				}
				let y;
				try { // drawFunction might be defined, but if you run it, it might generate an error
					y = drawFunctionG(t + phase);
				} catch (err) {
					//console.error("Error drawing function: <<< " + err + " >>>");
				}
				if (Math.abs(x) <= maxXY && Math.abs(y) <= maxXY) {
					ctx.lineTo(x, y);
				}
			}
			ctx.strokeStyle = "blue";
			ctx.lineWidth = .01;
			ctx.stroke();
		}
	} else { // y = G(t + p)
		if (!drawFunctionG) {
			console.log("no draw functionG !!!");
		}
		if (showFunction && drawFunctionG) {
			// draw a user defined function, default is a sine wave
			ctx.beginPath();
			const margin = 0;//.25; // test min and max range
			const minX = Math.max(camMin[0], minGrid[0]) + margin;
			const maxX = Math.min(camMax[0], maxGrid[0]) - margin;
			for (let s = 0; s <= lineStep; ++s) {
				let t = s / lineStep; //  t goes from [0 to 1]
				t = lerp(minX, maxX, t); // t goes from [minX to maxX]
				let y;
				try { // drawFunction might be defined, but if you run it, it might generate an error
					y = drawFunctionG(t + phase);
				} catch (err) {
					console.error("Error drawing function: <<< " + err + " >>>");
				}
				if (Math.abs(y) <= maxXY) {
					ctx.lineTo(t, y);
				}
			}
			ctx.strokeStyle = "blue";
			ctx.lineWidth = .01;
			ctx.stroke();
		}
	}
}
