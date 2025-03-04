'use strict';

class makeFunSHO {
	// internal, Q starts at 0
    constructor(maxQ) {
		/*
		const genCoefs = [
			[ 1],					// Q0: 1
			[ 0,   2],				// Q1: 2x
			[-2,   0,   4],			// Q2: 4x^2 - 2
			[ 0, -12,   0, 8],		// Q3:  8x^3 - 12x
			[12,   0, -48, 0, 16]	// Q4: 16x^4 =48x^2 + 12
		];
		*/
		// coefs, build up from last poly
		this.genCoefs = [[1], [0, 2]]; // starter
		for (let q = 2; q <= maxQ; ++q) {
			const lastCoefs = this.genCoefs[q - 1];
			const coefs = [];
			for (let k = 0; k <= q; ++k) {
				let left, right;
				if (k == 0) {
					left = 0;
				} else {
					left = 2 * lastCoefs[k - 1];
				}
				if (k >= q - 1) {
					right = 0;
				} else {
					right = -(k + 1) * lastCoefs[k + 1];
				}
				coefs.push(left + right);
			}
			this.genCoefs.push(coefs);
		}
        // normals
        this.normals = [];
		makeFunSHO.piVal = Math.pow(Math.PI, -.25);
		for (let q = 0; q <= maxQ; ++q) {
			const norm = makeFunSHO.#calcNormal(q);
			this.normals.push(norm);
		}
        //console.log("normals");
        //console.log(this.normals);

    }

	static #factorial(n) {
		let r = 1;
		while(n > 0) {
			r *= n--;
		}
		return r;
	}

	static #calcNormal(q) {
		const ret = makeFunSHO.piVal / (Math.sqrt(Math.pow(2, q) * makeFunSHO.#factorial(q)));
		return ret;
	}

    #calcPoly(x, q) {
		const coefs = this.genCoefs[q];
		let r = 0;
		for (let i = coefs.length - 1; i >= 0; --i) {
			r = r * x + coefs[i];
		}
		return r;
    }

    getFun() {
        return (x, q) => this.normals[q] * Math.exp(-x * x / 2) * this.#calcPoly(x, q);
    }

	getEnergy(q) {
		return 1 + 2 * q;
	}
}
