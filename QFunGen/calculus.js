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
	static calcArea(fun, square, q, start, end, numSteps) {
		//console.log("calcArea with q = " + q);
		// Trapezoidal Rule
		let sum = (fun(start, q) + fun(end, q)) / 2;
		if (square) {
			sum *= sum;
		}
		const span = end - start;
		for (let i = 1; i <= numSteps - 1; ++i) {
			const x = start + span * i / numSteps;
			let val = fun(x, q);
			if (square) {
				val *= val;
			}
			sum += val;
		}
		return sum * span / numSteps;
	}

}