'use strict';

// do a consistent fixed point system in javascript
// using BigInt
// create a static like class with 2 parameters
// just use primitive BigInt

class FMathBigIntInstanceALT {
	static masterFrac = 32; // master of high precision constants, 32 bit fraction
	static guardFrac = 32;
	static guard = new FMathBigIntInstanceALT(0, this.guardFrac);
	constructor(intPart, fracPart) { // intPart is for overflow if needed
		this.version = 200; // integer
		// BigInts
		this.intBits = BigInt(intPart); // for overflow
		this.fracBits = BigInt(fracPart);
		this.addRound = 1n << (this.fracBits - 1n); // .5

		// Numbers
		this.mulFracFactor = Number(2n ** this.fracBits);
		this.epsilonNum = 1 / this.mulFracFactor;
		this.overNum = Number(1n << (this.intBits- 1n));

		// constants
        this.constNamesMath = [
            "PI",
            "E",
            "SQRT2",
            "SQRT1_2",
            "LN10",
            "LN2",
            "LOG10E",
            "LOG2E",
        ];
		this.constNamesExtra = [];
		this.constNames = []; // merged Math and Extra
		this.constObjectsExtra = {
			ZERO: 0,
			ONE: 1,
			TWO: 2,
			THREE: 3,
			FOUR: 4,
			HALF: 1 / 2,
			THIRD: 1 / 3,
			FOURTH: 1 / 4,
			EIGHTH: 1 / 8,
			TWOPI: Math.PI * 2,
			HALFPI: Math.PI / 2,
			QUARTERPI: Math.PI / 4,
			THREEHALFPI: 3 * Math.PI / 2,

			PHI: (Math.sqrt(5) + 1) / 2,

			// remez atan odd
			ATAN_1r : 0.99920654296875,
			ATAN_3r : -0.3212890625,
			ATAN_5r : 0.146484375,
			ATAN_7r : -0.0390625,

			// remez sin odd
			SIN_1r: 0.9999251234196375,
			SIN_3r: -0.16651744389484935,
			SIN_5r: 0.008220467914556176,
			SIN_7r: -0.00016554684008878345,

			// remez asin odd
			ASIN_1r: 0.9678828,
			ASIN_3r: 0.8698691,
			ASIN_5r: -2.166373,
			ASIN_7r: 1.848968,

			// taylor asin odd
			ASIN_1t: 1,
			ASIN_3t: 1 / 6,
			ASIN_5t: 3 / 40,
			ASIN_7t: 5 / 112,
			ASIN_9t: 35 / 1152,

			// taylor asin
			
			// remez tan odd
			TAN_1r: 0.9996531301086894,
			TAN_3r: 0.3396489719996322,
			TAN_5r: 0.10293455475618167,
			TAN_7r: 0.1059499776568214,

			// exp offsets
			E_1_2 : Math.exp(.5), // e^^(1/2)
			E_1_4 : Math.exp(.25), // e^^(1/4)
			E_1_8 : Math.exp(.125), // e^^(1/8)
			E_M1 : Math.exp(-1), // e^^(-1) or 1 / e
			E_M1_2 : Math.exp(-.5), // e^^(-1/2)
			E_M1_4 : Math.exp(-.25), // e^^(-1/4)
			E_M1_8 : Math.exp(-.125), // e^^(-1/8)
		};
		
        // consistency, make a copy from generate
        this.generated32 = { // times 2 to the masterFrac power, rounded to nearest BigInt
			// built in
			PI: 13493037705n, // 3.141592653589793
			E: 11674931555n, // 2.718281828459045
			SQRT2: 6074001000n, // 1.4142135623730951
			SQRT1_2: 3037000500n, // 0.7071067811865476
			LN10: 9889527671n, // 2.302585092994046
			LN2: 2977044472n, // 0.6931471805599453
			LOG10E: 1865280597n, // 0.4342944819032518
			LOG2E: 6196328019n, // 1.4426950408889634
			// extra
			ZERO: 0n, // 0
			ONE: 4294967296n, // 1
			TWO: 8589934592n, // 2
			THREE: 12884901888n, // 3
			FOUR: 17179869184n, // 4
			HALF: 2147483648n, // 0.5
			THIRD: 1431655765n, // 0.3333333333333333
			FOURTH: 1073741824n, // 0.25
			EIGHTH: 536870912n, // 0.125
			// pi
			TWOPI: 26986075409n, // 6.283185307179586
			HALFPI: 6746518852n, // 1.5707963267948966
			QUARTERPI: 3373259426n, // 0.7853981633974483
			THREEHALFPI: 20239556557n, // 4.71238898038469	

			PHI: 6949403065n, // 1.618033988749895
			
			// remez atan odd
			ATAN_1r: 4291559424n, // 0.99920654296875
			ATAN_3r: -1379926016n, // -0.3212890625
			ATAN_5r: 629145600n, // 0.146484375
			ATAN_7r: -167772160n, // -0.0390625
			
			// remez sin odd
			SIN_1r: 4294645704n, // 0.9999251234196375
			SIN_3r: -715186976n, // -0.16651744389484935
			SIN_5r: 35306641n, // 0.008220467914556176
			SIN_7r: -711018n, // -0.00016554684008878345

			// remez asin odd
			ASIN_1r: 4157024972n, // 0.9678828
			ASIN_3r: 3736059336n, // 0.8698691
			ASIN_5r: -9304501186n, // -2.166373
			ASIN_7r: 7941257091n, // 1.848968

			// taylor asin odd
			ASIN_1t: 4294967296n, // 1
			ASIN_3t: 715827883n, // 0.16666666666666666
			ASIN_5t: 322122547n, // 0.075
			ASIN_7t: 191739611n, // 0.044642857142857144
			ASIN_9t: 130489458n, // 0.030381944444444444

			// remez tan odd
			TAN_1r: 4293477501n, // 0.9996531301086894
			TAN_3r: 1458781227n, // 0.3396489719996322
			TAN_5r: 442100546n, // 0.10293455475618167
			TAN_7r: 455051689n, // 0.1059499776568214

			// exp offsets
			E_1_2: 7081203938n, // 1.6487212707001282
			E_1_4: 5514847172n, // 1.2840254166877414
			E_1_8: 4866835547n, // 1.1331484530668263
			E_M1: 1580030169n, // 0.36787944117144233
			E_M1_2: 2605029347n, // 0.6065306597126334
			E_M1_4: 3344923893n, // 0.7788007830714049
			E_M1_8: 3790295335n, // 0.8824969025845955
		};
		// get all the names of extras
		for (const extraCon in this.constObjectsExtra) {
			this.constNamesExtra.push(extraCon);
		}
		// merge math and extra
		this.constNames = this.constNamesMath.concat(this.constNamesExtra);
		this.constNumbers = {};
		// get Math numbers from Math object
		for (const con of this.constNamesMath) {
			this.constNumbers[con] = Math[con];
		}
		// get extra numbers from constObjectsExtra object
		for (const con in this.constObjectsExtra) {
			this.constNumbers[con] = this.constObjectsExtra[con];
		}
		const generate = false;
		if (generate) { // turn on to get BigInt values from Numbers, paste that into generated32 above
			// built in math constants
			let str = "\ngenerate 'this.generated32' constants\n\n";
			str += "// built in\n";
			for (const cName of this.constNamesMath) {
				const val = Math[cName];
				const big = BigInt(Math.round((2 ** 32) * val));
				str += cName + ": " + big + "n, // " + val + "\n";
			}
			str += "// extra\n";
			for (const cName of this.constNamesExtra) {
				const val = this.constObjectsExtra[cName];
				const big = BigInt(Math.round((2 ** 32) * val));
				str += cName + ": " + big + "n, // " + val + "\n";
			}
			console.log(str);
			console.log("END generate\n");
		}
		// setup constants into instance
		for (const cName of this.constNames) {
			let fix = this.generated32[cName];
			if (fix === undefined) {
				fix = 0n;
			}
			const ft = this.create(); // tFrac
			fix = FMathBigIntInstanceALT.convert(fix, FMathBigIntInstanceALT.masterFrac, fracPart);
			this[cName] = fix;
		}
	}

	// helpers
	numberToPrettyString(n) {
		let ret = n.toString();
		if (ret >= 0) {
			ret = " " + ret;
		}
		ret = ret.padEnd(8);
		return ret;
	}

	// conversion between different bit sizes, BigInt
	static convert(n, from, to) {
		const rShift = BigInt(from - to);
		n += 1n << BigInt(rShift - 1n); // round
		const out = n >> BigInt(rShift);
		return out;
	}

	// create from number
	create = function(n) {
		let fix = 0n;
		if (n) {
			fix = this.setNumber(n);
		}
		return fix;
	}

	// these are now primitives, no need for clone or copy

	setNumber(n, round = true) {
		let toInt;
		const v = n * this.mulFracFactor;
		if (round) {
			toInt = Math.round(v);
		} else {
			toInt = Math.floor(v);
		}
		const fix = BigInt(toInt);
		return fix;
	}

	// output
	toNumber(f) {
		return Number(f) / this.mulFracFactor;
	}

	toPrettyString(f) {
		const n = this.toNumber(f);
		return this.numberToPrettyString(n);
	}
/*
	// unary operators
*/
	// basic
	neg(a) {
		return -a;
	}

	abs(a) {
		return a < 0n ? -a : a;
	}

	sign(a) {
		let s;
		if (a > 0n) {
			s = this.mulFracFactor;
		} else if (a < 0n) {
			s = -this.mulFracFactor;
		} else {
			s = 0n;
		}
		return s;
	}
	
	trunc(a) {
		if (a >= 0) {
			return a >> this.fracBits << this.fracBits;
		} else {
			return -(-(a) >> this.fracBits << this.fracBits);
		}
	}

	floor(a) {
		return a >> this.fracBits << this.fracBits;
	}

	ceil(a) {
		a = this.neg(a);
		a = this.floor(a);
		a = this.neg(a);
		return a;
	}

	round(a) {
		a += this.addRound;
		return this.floor(a);
	}

	inv(a) {
		// don't do divide by zero
		if (a == 0n) {
			return 0n;
		}
		return this.div(this.ONE, a);
	}

	// comparisons between fixed numbers work fine with bigint

	// basic binary operators
	min(a, b) {
		return a < b ? a : b;
	}

	max(a, b) {
		return a > b ? a : b;
	}

	// keep b within range of 'a' and 'c'
	range(a, b, c) {
		if (b < a) {
			return a;
		} 
		if (b > c) {
			return c;
		}
		return b;
	}

	add(a, b) {
		return a + b;
	}

	sub(a, b) {
		return a - b;
	}

	mul(a, b) {
		let out = a * b;
		out += this.addRound;
		out >>= this.fracBits;
		return out;
	}

	div(a, b) {
		if (b == 0n) {
			return 0n;
		}
		a <<= this.fracBits;
		let bH = b / 2n;
		if (a < 0 != b < 0) { // XOR
			bH = -bH;
		}
		a += bH;
		return a / b;
	}

	mod(a, b) {
		if (b == 0n) {
			return 0n;
		}
		let q = a / b; // div with trunc, a straight BigInt
		let btq = b * q; // back to FMath
		return a - btq;
	}

	// coefs 0 is 1, 1 is 3, 2 is 5, 3 is 7, etc.
	calcCoefFixOdd(x, ...coefs) {
		let out = 0n;
		let x2 = this.create();
		x2 = this.mul(x, x);
		const nCoefs = coefs.length;
		out = coefs[nCoefs - 1];
		for (let i = nCoefs - 2; i >= 0; --i) {
			out = this.mul(out, x2); // c7
			out = this.add(out, coefs[i]); // c5
		}
		out = this.mul(out, x);
		// for nCoefs = 4: 
		// const x2 = x * x;
		// let out = (((c7 * x2 + c5) * x2 + c3) * x2 + c1) * x;
		return out;
	}

	calcCoefFix(x, coefs) {
		if (!coefs.length) {
			return 0n;
		}
		// horner's method
		let t = coefs[coefs.length - 1];
		for (let i = coefs.length - 2; i >= 0; --i ) {
			t = this.mul(t, x); // TODO: not needed on last iteration
			t = this.add(t, coefs[i]);
		}
		return t;
	}

	// roots
	sqrtA(a) {
		if (a <= 0) {
			return this.ZERO;
		}
		const steps = 20;
		let guess = this.TWO; // r = 2;
		let newGuess = 0;
		for (let i = 0; i < steps; ++i) {
			newGuess = this.div(a, guess); // newGuess = a / guess;
			guess = this.add(newGuess, guess); // guess = (newGuess + guess) / 2;
			guess = this.mul(guess, this.HALF);
		}
		return guess;
	}

	// candidate sqrt
	sqrt = this.sqrtA;

	cbrtN(a) {
		if (a == 0n) {
			return 0n;
		}
		// newton's method
		// gn = 1 / 3 * (a / (g * g) + 2 * g);
		// gn = (a / 3) / (g * g) + 2 / 3 * g;
		// best guess near 1 is g = (a + 2) / 3
		const aOver3 = this.div(a, this.THREE);
		const twoOver3 = this.div(this.TWO, this.THREE);
		// calc first guess
		let g = a;
		if (a < 0n) {
			g = this.neg(g);
		}
		g = this.add(g, this.TWO);
		g = this.div(g, this.THREE);
		if (a < 0n) {
			g = this.neg(g);
		}
		const numSteps = 20;
		// step
		for (let i = 0; i < numSteps; ++i) {
			const g2 = this.mul(g, g);
			const term1 = this.div(aOver3, g2);
			const term2 = this.mul(twoOver3, g);
			g = this.add(term1, term2);
		}
		return g;
	}

	cbrtP(a) {
		// power log method
		let neg = false;
		if (a < 0) {
			neg = true;
			a = this.neg(a);
		}
		let ret = this.pow(a, this.THIRD);
		if (neg) {
			ret = this.neg(ret);
		}
		return ret;
	}

	cbrtNG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.cbrtN(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}

	// candidate cbrt
	//cbrt = this.cbrtP;
	//cbrt = this.cbrtN;
	cbrt = this.cbrtNG;

	hypot(a, b) {
		return this.sqrt(this.add(this.mul(a, a), this.mul(b, b)));
	}

	// more advanced functions

	// trigonometric

	// output (-PI to PI]
	normAngRad(a) {
        a = this.mod(a, this.TWOPI);
        if (a > this.PI) {
            a = this.sub(a, this.TWOPI);
        } else if (a <= -this.PI) {
            a = this.add(a, this.TWOPI);
        }
		return a;
	}

	// output (-PI/2 to PI/2]
	normAngRadHalf(a) {
        a = this.mod(a, this.PI);
        if (a > this.HALFPI) {
            a = this.sub(a, this.PI);
        } else if (a <= -this.HALFPI) {
            a = this.add(a, this.PI);
        }
		return a;
	}

	// closest triangle wave to sin function
	normAngRadSin(a) {
		const neg = a < this.ZERO;
		if (neg) {
			a = this.neg(a); // or na = -n;
		}
		a = this.mod(a, this.TWOPI); // 2 * PI
		if (a >= this.THREEHALFPI) { // 3 / 2 * PI
			a = this.sub(a, this.TWOPI); // 2 * PI
		} else if (a >= this.HALFPI) { //PI / 2
			a = this.sub(this.PI, a); //PI
		}
		return a;
	}

	// taylor N steps
	#sinTNoNorm(a) {
		const steps = 8;
		let sum = this.ZERO;
		let term = this.ZERO;
		let n = a;
		let d = this.ONE;
		let m = this.ONE;
		let i = 0;
		while(true) {
			term = this.div(n, d);
			sum = this.add(sum, term);
			if (++i == steps) {
				break;
			}
			n = this.mul(n, a);
			n = this.mul(n, a);
			n = this.neg(n);
			m = this.add(m, this.ONE);
			d = this.mul(d, m);
			m = this.add(m, this.ONE);
			d = this.mul(d, m);
		}
		//console.log("in = " + this.toPrettyString(a) + "out = " + this.toPrettyString(sum));
		return sum;
	}

	sinT(a) {
		const na = this.normAngRad(a);
		const ret = this.#sinTNoNorm(na);
		return ret;
	}

	// remez
	#sinRNoNorm(a) {
		const ret = this.calcCoefFixOdd(a, this.SIN_1r, this.SIN_3r, this.SIN_5r, this.SIN_7r);
		return ret;
	}

	sinR(a) {
		const neg = a < this.ZERO;
		a = this.normAngRadSin(a);
		let ret = this.#sinRNoNorm(a);
		if (ret > this.ONE) {
			ret = this.ONE;
		} else if (ret < -this.ONE) {
			ret = -this.ONE;
		}
		if (neg) {
			ret = this.neg(ret);
		}
		return ret;
	}

	sinTG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.sinT(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}

	sinRG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.sinR(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}

	// candidate sin
	//sin = this.sinT;
	//sin = this.sinTG;
	//sin = this.sinR;
	sin = this.sinRG;


	// taylor N steps
	#cosTNoNorm(a) {
		const steps = 6;
		let n = this.ONE;
		let d = this.ONE;
		let m = this.ZERO;
		let sum = this.ZERO;
		let i = 0;
		while(true) {
			const term = this.div(n, d);
			sum = this.add(sum, term);
			if (++i == steps) {
				break;
			}
			n = this.mul(n, a);
			n = this.mul(n, a);
			n = this.neg(n);
			m = this.add(m, this.ONE);
			d = this.mul(d, m);
			m = this.add(m, this.ONE);
			d = this.mul(d, m);
		}
		return sum;
	}

	cosT(a) {
		const na = this.normAngRad(a);
		const ret = this.#cosTNoNorm(na);
		return ret;
	}

	cosR(a) {
		a = this.add(a, this.HALFPI);
		const ret = this.sinR(a);
		return ret;
	}

	cosTG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.cosT(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}
	
	cosRG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.cosR(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}

	// candidate cos
	//cos = this.cosT;
	//cos = this.cosTG;
	//cos = this.cosR;
	cos = this.cosRG;

	// remez
	tanRNoNorm(a) {
		const ret = this.calcCoefFixOdd(a, this.TAN_1r, this.TAN_3r, this.TAN_5r, this.TAN_7r);
		return ret;
	}

	tanR(a) {
		a = this.normAngRadHalf(a); // (-PI/2 to PI/2]
		let ret;
		if (a > this.QUARTERPI) {
			a = this.sub(this.HALFPI, a)
			ret = this.tanRNoNorm(a);
			ret = this.inv(ret);
		} else if (a < -this.QUARTERPI) {
			let mp = this.HALFPI;
			mp = this.neg(mp);
			a = this.sub(mp, a)
			ret = this.tanRNoNorm(a);
			ret = this.inv(ret);
		} else {
			ret = this.tanRNoNorm(a);
		}
		return ret;
	}

	tanRG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.tanR(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}

	// candidate tan
	//tan = this.tanR;
	tan = this.tanRG;

	// remez
	aSinRNoCheck(y) {
		const ret = this.calcCoefFixOdd(y, this.ASIN_1r, this.ASIN_3r, this.ASIN_5r, this.ASIN_7r);
		return ret;
	}

	aSinR(y) {
		const ay = this.abs(y);
		if (ay > this.ONE) {
			return this.create();
		}
		const ret = this.aSinRNoCheck(y);
		return ret;
	}

	aSinRG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.aSinR(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}

	// taylor
	aSinTNoCheck(y) {
		const ya = this.abs(y);
		if (ya >= this.SQRT1_2) {
			let my = this.mul(y, y);
			my = this.sub(this.ONE, my);
			my = this.sqrt(my);
			let ret = this.calcCoefFixOdd(my, this.ASIN_1t, this.ASIN_3t, this.ASIN_5t, this.ASIN_7t, this.ASIN_9t);
			ret = this.sub(this.HALFPI, ret);
			if (y < 0n) {
				ret = this.neg(ret);
			}
			return ret;
		}
		const ret = this.calcCoefFixOdd(y, this.ASIN_1t, this.ASIN_3t, this.ASIN_5t, this.ASIN_7t, this.ASIN_9t);
		return ret;
	}

	aSinT(y) {
		const ay = this.abs(y);
		if (ay > this.ONE) {
			return this.ZERO;
		}
		const ret = this.aSinTNoCheck(y);
		return ret;
	}

	aSinTG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.aSinT(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}

	// candidate asin
	asin = this.aSinT;
	//asin = this.aSinTG;
	//asin = this.aSinR;
	//asin = this.aSinRG;

	aCosT(y) {
		const ay = this.abs(y);
		if (ay > this.ONE) {
			return this.ZERO;
		}
		let ret  = this.aSinTNoCheck(y);
		ret = this.sub(this.HALFPI, ret);
		return ret;
	}

	aCosTG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.aCosT(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}

	// candidate acos
	//acos = this.aCosT;
	acos = this.aCosTG;

	// promote to atan2
	atan(m) {
		const ret = this.atan2(m, this.ONE);
		return ret;
	}

	// remez
	atan2R(y, x) {
		const xa = this.abs(x);
		const ya = this.abs(y);
		const num = this.min(xa, ya);
		const den = this.max(xa, ya);
		if (den == 0n) {
			return 0n; // avoid division by zero
		}
		const m = this.div(num, den); // 0 to 1
		let ret = this.calcCoefFixOdd(m, this.ATAN_1r, this.ATAN_3r, this.ATAN_5r, this.ATAN_7r);
		if (ya > xa) {
			ret = this.sub(this.HALFPI, ret);
		}
		if (x < 0n) {
			ret = this.sub(this.PI, ret);
		}
		if (y < 0n) {
			ret = this.neg(ret);
		}
		return ret;
	}

	atan2RG(y, x) {
		// don't need to convert, it's a ratio
		//x = FMathBigIntInstanceALT.convert(x, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		//y = FMathBigIntInstanceALT.convert(y, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		let ret = FMathBigIntInstanceALT.guard.atan2R(y, x);
		ret = FMathBigIntInstanceALT.convert(ret, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return ret;
	}

	// candidate atan2
	atan2 = this.atan2R;
	//atan2 = this.atan2RG;

	// exponents
	expA(a) {
		const neg = a < 0n; // do inverse at end if neg exp
		let aa = a;
		if (neg) {
			aa = this.neg(aa);
		}
		const steps = 20;
		let sum = this.create();
		let term;
		let n = this.ONE;
		let d = this.ONE;
		let m = this.create(); // or = this.ZERO
		let i = 0;
		while(true) {
			term = this.div(n, d);
			sum = this.add(sum, term);
			if (++i == steps) {
				break;
			}
			n = this.mul(n, aa);
			m = this.add(m, this.ONE);
			d = this.mul(d, m);
		}
		term = this.div(n, d);
		sum = this.add(sum, term);
		if (neg) {
			sum = this.inv(sum);
		}
		return sum;
	}

	expAG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.expA(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}

	// candidate exp
	exp = this.expA;
	//exp = this.expAG;

	pow(b, e) {
		const low = this.create(3 / 32);
		if (b <= low) {
			return 0n;
		}
		let lb = this.log(b);
		lb = this.mul(lb, e);
		return this.exp(lb);
	}

	// logarithms
	logA(mx) {
		const low = this.create(1 / 16);
		if (mx <= low) {
			return this.create(); // or 0n, or this.ZERO
		}
		
		// move arg close to 1 for better results
		let offset = this.ZERO;
		let watch = 20;
		
		while (mx >= this.E_1_4 && watch > 0) {
			offset = this.add(offset, this.FOURTH);
			mx = this.mul(mx, this.E_M1_4);
			--watch;
		}

		while (mx < this.E_M1_2 && watch > 0) {
			offset = this.sub(offset, this.HALF);
			mx = this.mul(mx, this.E_1_2);
			--watch;
		}

		if (!watch) {
			console.error("watch hit!!!");
			return this.ZERO;
		}

		let d = this.ONE;
		mx = this.sub(mx, this.ONE);
		let n = mx;
		mx = this.neg(mx);
		const steps = 10;
		let y = 0n; // or this.create(), or this.ZERO
		let term = this.div(n, d);
		y = this.add(y, term);
        //console.log("n = " + this.toPrettyString(n)
		//	+ ", d = " + this.toPrettyString(d));
		for (let i = 1; i < steps; ++i) {
			n = this.mul(n, mx);
			d = this.add(d, this.ONE);
			term = this.div(n, d);
			y = this.add(y, term);
	        //console.log("n = " + this.toPrettyString(n)
			//	+ ", d = " + this.toPrettyString(d));
		}
		y = this.add(y, offset);
		return y;
	}

	logAG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.logA(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}
	// candidate log
	//log = this.logA;
	log = this.logAG;

	log10(y) {
		let ret = this.log(y);
		ret = this.mul(ret, this.LOG10E);
		return ret;
	}

	log2(y) {
		let ret = this.log(y);
		ret = this.mul(ret, this.LOG2E);
		return ret;
	}

	// hyperbolic
	sinh(a) {
		let neg = false;
		if (a < 0n) { // how does this help?
			a = -a;
			neg = true;
		}
		const e = this.exp(a);
		const inve = this.inv(e);
		let terms = this.sub(e, inve);
		terms = this.mul(terms, this.HALF);
		if (neg) {
			terms = -terms;
		}
		return terms;
	}

	cosh(a) {
		if (a < 0n) { // how does this help?
			a = -a;
		}
		const e = this.exp(a);
		const inve = this.inv(e);
		let terms = this.add(e, inve);
		terms = this.mul(terms, this.HALF);
		return terms;
	}

	tanh(a) {
		const e = this.exp(a);
		const inve = this.inv(e);
		const topTerms = this.sub(e, inve);
		const botTerms = this.add(e, inve);
		const ret = this.div(topTerms, botTerms);
		return ret;
	}

	// asinh NYI
	// acosh NYI

	atanhA(a) {
		const na = this.abs(a);
		const compare = this.create(15 / 16);
		//if (true) {
		if (na >= compare) {
			return 0n;
		}
		const steps = 30;
		let sum = 0n;
		let term = this.create();
		let n = a;
		let d = this.ONE;
		let i = 0;
		while(true) {
			term = this.div(n, d);
			sum = this.add(sum, term);
			if (++i == steps) {
				break;
			}
			d = this.add(d, this.TWO);
			n = this.mul(n, a);
			n = this.mul(n, a);
		}
		return sum;
	}

	atanhAG(a) {
		a = FMathBigIntInstanceALT.convert(a, this.fracBits, FMathBigIntInstanceALT.guard.fracBits);
		a = FMathBigIntInstanceALT.guard.atanhA(a);
		a = FMathBigIntInstanceALT.convert(a, FMathBigIntInstanceALT.guard.fracBits, this.fracBits);
		return a;
	}
	// candidate atanh
	atanh = this.atanhA;
	//atanh = this.atanhAG;

	// miscellaneous
	random(a) { // placeholder NYI
		const n = Math.random();
		const fix = this.setNumber(n, false);
		return fix;
	} 
}
