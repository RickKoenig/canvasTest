'use strict';

class calculus {

	static funToArray(f, q, minX, maxX, numSteps, square) { // inclusive
		const arr = [];
		for (let i = 0; i <= numSteps; ++i) {
			const x = minX + i * (maxX - minX) / numSteps;
			const fx = f(x, q);
			if (square) {
				arr.push(fx * fx);
			} else {
				arr.push(fx);
			}
		}
		return arr;
	}

	// 1st derivative
	static diff(f, x, q, epsilon = .005) {
		return((f(x + epsilon / 2, q) - f(x - epsilon / 2, q)) / epsilon);
	}

	// 2nd derivative
	static diff2(f, x, q, epsilon = .005) {
		return((f(x + epsilon, q) - 2 * f(x, q) + f(x - epsilon, q)) / (epsilon * epsilon));
	}

    // integration
	// Trapezoidal Rule
	static calcAreaT(fun, square, q, start, end, numSteps) {
		//console.log("calcAreaT with q = " + q);
		let fStart = fun(start, q);
		let fEnd = fun(end, q);
		if (square) {
			fStart *= fStart;
			fEnd *= fEnd;
		}
		const sum1 = fStart + fEnd;
		let sum2 = 0;
		const span = end - start;
		for (let i = 1; i <= numSteps - 1; ++i) {
			const x = start + span * i / numSteps;
			let val = fun(x, q);
			if (square) {
				val *= val;
			}
			sum2 += val;
		}
		return 1 / 2 * (sum1 + 2 * sum2) * span / numSteps;
	}

	// Simpsons Rule
	static calcAreaS(fun, square, q, start, end, numSteps) {
		if (numSteps %2 == 1) {
			++numSteps;
		}
		//console.log("calcAreaS with q = " + q);
		// endpoints
		let fStart = fun(start, q);
		let fEnd = fun(end, q);
		if (square) {
			fStart *= fStart;
			fEnd *= fEnd;
		}
		const sum1 = fStart + fEnd;
		//console.log("sum1---");
		//console.log(0);
		//console.log(numSteps);
		let sum2 = 0;
		let sum4 = 0;
		const span = end - start;
		// sum2
		//console.log("sum2---");
		for (let i = 2; i <= numSteps - 1; i += 2) {
			//console.log(i);
			const x = start + span * i / numSteps;
			let val = fun(x, q);
			if (square) {
				val *= val;
			}
			sum2 += val;
		}
		// sum4
		//console.log("sum4---");
		for (let i = 1; i <= numSteps; i += 2) {
			//console.log(i);
			const x = start + span * i / numSteps;
			let val = fun(x, q);
			if (square) {
				val *= val;
			}
			sum4 += val;
		}
		return 1 / 3 * (sum1 + 2 * sum2 + 4 * sum4) * span / numSteps;
	}

}