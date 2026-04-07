'use strict';

// do a consistent fixed point system in javascript
// using BigInt
// create a static like class with 2 parameters

class FMathBigIntInstance {
	static masterFrac = 32; // master of high precision constants, 32 bit fraction
	static guardFrac = 32;
	static guard = new FMathBigIntInstance(0, this.guardFrac);
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
			let raw = this.generated32[cName];
			if (raw === undefined) {
				raw = 0n;
			}
			const ft = this.create(); // tFrac
			ft.raw = FMathBigIntInstance.convert(raw, FMathBigIntInstance.masterFrac, fracPart);
			this[cName] = ft;
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
		let raw = 0n;
		const out = {raw: 0n};
		if (n) {
			this.setNumber(out, n);
		}
		return out;
	}

	clone(f) {
		const out = this.create();
		out.raw = f.raw;
		return out;
	}

	// replace
	copy(out, f) {
		out.raw = f.raw;
		return out;
	}

	setNumber(out, n, round = true) {
		let toInt;
		const v = n * this.mulFracFactor;
		if (round) {
			toInt = Math.round(v);
		} else {
			toInt = Math.floor(v);
		}
		out.raw = BigInt(toInt);
		return out;
	}

	// output
	toNumber(f) {
		return Number(f.raw) / this.mulFracFactor;
	}

	toPrettyString(f) {
		const n = this.toNumber(f);
		return this.numberToPrettyString(n);
	}

	// unary operators

	// basic
	neg(out, a) {
		out.raw = -a.raw;
		return out;
	}

	abs(out, a) {
		out.raw = a.raw < 0n ? -a.raw : a.raw;
		return out;
	}

	sign(out, a) {
		let s;
		if (a.raw > 0n) {
			s = this.mulFracFactor;
		} else if (a.raw < 0n) {
			s = -this.mulFracFactor;
		} else {
			s = 0n;
		}
		out.raw = s;
		return out;
	}
	
	trunc(out, a) {
		if (a.raw >= 0) {
			out.raw = a.raw >> this.fracBits << this.fracBits;
		} else {
			out.raw = -(-(a.raw) >> this.fracBits << this.fracBits);
		}
		return out;
	}

	floor(out, a) {
		out.raw = a.raw >> this.fracBits << this.fracBits;
		return out;
	}

	ceil(out, a) {
		this.neg(out, a);
		this.floor(out, out);
		this.neg(out, out);
		return out;
	}

	round(out, a) {
		out.raw = a.raw + this.addRound;
		this.floor(out, out);
		return out;
	}
	
	inv(out, a) {
		// don't do divide by zero
		if (a.raw == 0n) {
			out.raw = 0;
			return out;
		}
		return this.div(out, this.ONE, a);
	}

	// TODO: add comparison operators, or just do a.raw < b.raw etc. ...

	// basic binary operators
	min(out, a, b) {
		out.raw = a.raw < b.raw ? a.raw : b.raw;
		return out;
	}

	max(out, a, b) {
		out.raw = a.raw > b.raw ? a.raw : b.raw;
		return out;
	}

	add(out, a, b) {
		out.raw = a.raw + b.raw;
		return out;
	}

	sub(out, a, b) {
		out.raw = a.raw - b.raw;
		return out;
	}

	mul(out, a, b) {
		out.raw = a.raw * b.raw;
		out.raw += this.addRound;
		out.raw >>= this.fracBits;
		return out;
	}

	div(out, a, b) {
		if (b.raw == 0n) {
			out.raw = 0n;
			return out;
		}
		let aRaw = a.raw;
		let bRaw = b.raw;
		aRaw <<= this.fracBits;
		let bRawH = bRaw / 2n;
		if (aRaw < 0 != bRaw < 0) { // XOR
			bRawH = -bRawH;
		}
		aRaw += bRawH;
		out.raw = aRaw / bRaw;
		return out;
	}

	mod(out, a, b) {
		if (b.raw == 0n) {
			out.raw = 0n;
			return out;
		}
		let q = a.raw / b.raw; // div with trunc, a straight BigInt
		let btq = b.raw * q; // back to FMath
		btq = a.raw - btq;
		out.raw = btq;
		return out;
	}

	// coefs 0 is 1, 1 is 3, 2 is 5, 3 is 7, etc.
	calcCoefFixOdd(out, x, ...coefs) {
		const x2 = this.create();
		this.mul(x2, x, x);
		const nCoefs = coefs.length;
		this.copy(out, coefs[nCoefs - 1]);
		for (let i = nCoefs - 2; i >= 0; --i) {
			this.mul(out, out, x2); // c7
			this.add(out, out, coefs[i]); // c5
		}
		this.mul(out, out, x);
		// for nCoefs = 4: 
		// const x2 = x * x;
		// let out = (((c7 * x2 + c5) * x2 + c3) * x2 + c1) * x;
		return out;
	}
	
	calcCoefFix(out, x, cs) {
		if (!cs.length) {
			this.copy(out, this.ZERO);
			return out;
		}
		// horner's method
		const t = this.clone(cs[cs.length - 1]);
		for (let i = cs.length - 2; i >= 0; --i ) {
			this.mul(t, t, x); // TODO: not needed on last iteration
			this.add(t, t, cs[i]);
		}
		this.copy(out, t);
		return out;
	}

	// roots
	sqrtA(out, a) {
		const steps = 20;
		if (a.raw <= 0n) {
			out.raw = 0n;
			return out;
		}
		const guess = this.clone(this.TWO); // r = 2;
		const newGuess = this.create(); // newGuess;
		for (let i = 0; i < steps; ++i) {
			this.div(newGuess, a, guess); // newGuess = a / guess;
			this.add(guess, newGuess, guess); // guess = (newGuess + guess) / 2;
			this.mul(guess, guess, this.HALF);
		}
		out.raw = guess.raw;
		return out;
	}

	// candidate sqrt
	sqrt = this.sqrtA;


	cbrtN(out, a) {
		if (a.raw == 0n) {
			out.raw = 0n;
			return out;
		}
		// newton's method
		// gn = 1 / 3 * (a / (g * g) + 2 * g);
		// gn = (a / 3) / (g * g) + 2 / 3 * g;
		// best guess near 1 is g = (a + 2) / 3
		const aOver3 = this.create();
		this.div(aOver3, a, this.THREE);
		const twoOver3 = this.create();
		this.div(twoOver3, this.TWO, this.THREE);
		// calc first guess
		const g = this.clone(a);
		if (a.raw < 0n) {
			this.neg(g, g);
		}
		this.add(g, g, this.TWO);
		this.div(g, g, this.THREE);
		if (a.raw < 0n) {
			this.neg(g, g);
		}
		const term1 = this.create();
		const term2 = this.create();
		const numSteps = 20;
		const g2 = this.create();
		// step
		for (let i = 0; i < numSteps; ++i) {
			this.mul(g2, g, g);
			this.div(term1, aOver3, g2);
			this.mul(term2, twoOver3, g);
			this.add(g, term1, term2);
		}
		out.raw = g.raw;
		return out;
	}

	cbrtP(out, a) {
		// power log method
		const aa = this.clone(a);
		let neg = false;
		if (a.raw < 0) {
			neg = true;
			this.neg(aa, aa);
		}
		this.pow(out, aa, this.THIRD);
		if (neg) {
			this.neg(out, out);
		}
		return out;
	}

	cbrtNG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.cbrtN(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}

	// candidate cbrt
	//cbrt = this.cbrtP;
	//cbrt = this.cbrtN;
	cbrt = this.cbrtNG;

	hypot(out, a, b) {
		const a2 = this.create();
		const b2 = this.create();
		return this.sqrt(out, this.add(out, this.mul(a2, a, a), this.mul(b2, b, b)));
	}

	// more advanced functions

	// trigonometric

	// output (-PI to PI]
	normAngRad(out, a) {
        this.mod(out, a, this.TWOPI);
        if (out.raw > this.PI.raw) {
            this.sub(out, out, this.TWOPI);
        } else if (out.raw <= -this.PI.raw) {
            this.add(out, out, this.TWOPI);
        }
		return out;
	}

	// output (-PI/2 to PI/2]
	normAngRadHalf(out, a) {
        this.mod(out, a, this.PI);
        if (out.raw > this.HALFPI.raw) {
            this.sub(out, out, this.PI);
        } else if (out.raw <= -this.HALFPI.raw) {
            this.add(out, out, this.PI);
        }
		return out;
	}

	// closest triangle wave to sin function
	normAngRadSin(na, a) {
		const neg = a.raw < this.ZERO.raw;
		this.copy(na, a);
		if (neg) {
			this.neg(na, na);
		}
		this.mod(na, na, this.TWOPI); // 2 * PI
		if (na.raw >= this.THREEHALFPI.raw) { // 3 / 2 * PI
			this.sub(na, na, this.TWOPI); // 2 * PI
		} else if (na.raw >= this.HALFPI.raw) { //PI / 2
			this.sub(na, this.PI, na); //PI
		}
		return neg;
	}

	// taylor N steps
	#sinTNoNorm(out, a) {
		const steps = 8;
		const sum = this.create();
		const term = this.create();
		const n = this.clone(a);
		const d = this.clone(this.ONE);
		const m = this.clone(this.ONE);
		let i = 0;
		while(true) {
			this.div(term, n, d);
			this.add(sum, sum, term);
			if (++i == steps) {
				break;
			}
			this.mul(n, n, a);
			this.mul(n, n, a);
			this.neg(n, n);
			this.add(m, m, this.ONE);
			this.mul(d, d, m);
			this.add(m, m, this.ONE);
			this.mul(d, d, m);
		}
		out.raw = sum.raw;
		return out;
	}

	sinT(out, a) {
		const na = this.create();
		this.normAngRad(na, a);
		this.#sinTNoNorm(out, na);
		return out;
	}

	// remez
	#sinRNoNorm(out, a) {
		this.calcCoefFixOdd(out, a, this.SIN_1r, this.SIN_3r, this.SIN_5r, this.SIN_7r);
		return out;
	}

	sinR(out, a) {
		const na = this.create();
		const neg = this.normAngRadSin(na, a);
		this.#sinRNoNorm(out, na);
		if (out.raw > this.ONE.raw) {
			out.raw = this.ONE.raw;
		} else if (out.raw < -this.ONE.raw) {
			out.raw = -this.ONE.raw;
		}
		if (neg) {
			this.neg(out, out);
		}
		return out;
	}

	sinTG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.sinT(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}

	sinRG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.sinR(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}

	// candidate sin
	//sin = this.sinT;
	//sin = this.sinTG;
	//sin = this.sinR;
	sin = this.sinRG;

	// taylor N steps
	#cosTNoNorm(out, a) {
		const steps = 6;
		const sum = this.create();
		const term = this.create();
		const n = this.clone(this.ONE);
		const d = this.clone(this.ONE);
		const m = this.clone(this.ZERO);
		let i = 0;
		while(true) {
			this.div(term, n, d);
			this.add(sum, sum, term);
			if (++i == steps) {
				break;
			}
			this.mul(n, n, a);
			this.mul(n, n, a);
			this.neg(n, n);
			this.add(m, m, this.ONE);
			this.mul(d, d, m);
			this.add(m, m, this.ONE);
			this.mul(d, d, m);
		}
		out.raw = sum.raw;
		return out;
	}

	cosT(out, a) {
		const na = this.create();
		this.normAngRad(na, a);
		this.#cosTNoNorm(out, na);
		return out;
	}

	cosR(out, a) {
		const na = this.clone(a);
		this.add(na, na, this.HALFPI);
		this.sinR(out, na);
		return out;
	}

	cosTG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.cosT(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}
	
	cosRG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.cosR(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}

	// candidate cos
	//cos = this.cosT;
	//cos = this.cosTG;
	//cos = this.cosR;
	cos = this.cosRG;

	// remez
	tanRNoNorm(out, a) {
		this.calcCoefFixOdd(out, a, this.TAN_1r, this.TAN_3r, this.TAN_5r, this.TAN_7r);
	}

	tanR(out, a) {
		const na = this.create();
		this.normAngRadHalf(na, a); // (-PI/2 to PI/2]
		if (na.raw > this.QUARTERPI.raw) {
			this.sub(na, this.HALFPI, na)
			this.tanRNoNorm(out, na);
			this.inv(out, out);
		} else if (na.raw < -this.QUARTERPI.raw) {
			const mp = this.clone(this.HALFPI);
			this.neg(mp, mp);
			this.sub(na, mp, na)
			this.tanRNoNorm(out, na);
			this.inv(out, out);
		} else {
			this.tanRNoNorm(out, na);
		}
		return out;
	}

	tanRG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.tanR(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}

	// candidate tan
	tan = this.tanRG;
	//tan = this.tanRG;

	// remez
	aSinRNoCheck(out, y) {
		this.calcCoefFixOdd(out, y, this.ASIN_1r, this.ASIN_3r, this.ASIN_5r, this.ASIN_7r);
		return out;
	}

	aSinR(out, y) {
		const ay = this.clone(y);
		this.abs(ay, y);
		if (ay.raw > this.ONE.raw) {
			out.raw = 0n;
			return out;
		}
		this.aSinRNoCheck(out, y);
		return out;
	}

	aSinRG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.aSinR(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}

	// taylor
	aSinTNoCheck(out, y) {
		const ya = this.create();
		this.abs(ya, y);
		if (ya.raw >= this.SQRT1_2.raw) {
			const my = this.clone(y);
			this.mul(my, my, my);
			this.sub(my, this.ONE, my);
			this.sqrt(my, my);
			this.calcCoefFixOdd(out, my, this.ASIN_1t, this.ASIN_3t, this.ASIN_5t, this.ASIN_7t, this.ASIN_9t);
			this.sub(out, this.HALFPI, out);
			if (y.raw < 0n) {
				this.neg(out, out);
			}
			return out;
		}
		this.calcCoefFixOdd(out, y, this.ASIN_1t, this.ASIN_3t, this.ASIN_5t, this.ASIN_7t, this.ASIN_9t);
		return out;
	}

	aSinT(out, y) {
		const ay = this.clone(y);
		this.abs(ay, y);
		if (ay.raw > this.ONE.raw) {
			out.raw = 0n;
			return out;
		}
		this.aSinTNoCheck(out, y);
		return out;
	}

	aSinTG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.aSinT(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}

	// candidate asin
	//asin = this.aSinR;
	asin = this.aSinT;
	//asin = this.aSinRG;
	//asin = this.aSinTG;

	aCosT(out, y) {
		const ay = this.clone(y);
		this.abs(ay, y);
		if (ay.raw > this.ONE.raw) {
			out.raw = 0n;
			return out;
		}
		this.aSinTNoCheck(out, y);
		this.sub(out, this.HALFPI, out);
		return out;
	}

	aCosTG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.aCosT(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}

	// candidate acos
	//acos = this.aCosR;
	acos = this.aCosT;
	//acos = this.aCosRG;
	//acos = this.aCosTG;

	// promote to atan2
	atan(out, m) {
		return this.atan2(out, m, this.ONE);
	}

	// remez
	atan2R(out, y, x) {
		const xa = this.create();
		const ya = this.create();
		const num = this.create();
		const den = this.create();
		const a = this.create();
		const r = this.create();
		this.abs(xa, x);
		this.abs(ya, y);
		this.min(num, xa, ya);
		this.max(den, xa, ya);
		if (den.raw == 0n) {
			out.raw = 0n; // avoid division by zero
			return out;
		}
		this.div(a, num, den); // 0 to 1
		this.calcCoefFixOdd(r, a, this.ATAN_1r, this.ATAN_3r, this.ATAN_5r, this.ATAN_7r);
		if (ya.raw > xa.raw) {
			this.sub(r, this.HALFPI, r);
		}
		if (x.raw < 0n) {
			this.sub(r, this.PI, r);
		}
		if (y.raw < 0n) {
			this.neg(r, r);
		}
		out.raw = r.raw;
		return out;
	}

	atan2RG(out, y, x) {
		const xSave = x.raw;
		const ySave = y.raw;
		x.raw = FMathBigIntInstance.convert(x.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		y.raw = FMathBigIntInstance.convert(y.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.atan2R(out, y, x);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		x.raw = xSave;
		y.raw = ySave;
		return out;
	}

	// candidate atan2
	//atan2 = this.atan2R;
	atan2 = this.atan2RG;

	// exponents
	expA(out, a) {
		const neg = a.raw < 0n; // do inverse at end if neg exp
		const aa = this.clone(a);
		if (neg) {
			this.neg(aa, aa);
		}
		const steps = 20;
		const sum = this.create();
		const term = this.create();
		const n = this.clone(this.ONE);
		const d = this.clone(this.ONE);
		const m = this.create();
		let i = 0;
		while(true) {
			this.div(term, n, d);
			this.add(sum, sum, term);
			if (++i == steps) {
				break;
			}
			this.mul(n, n, aa);
			this.add(m, m, this.ONE);
			this.mul(d, d, m);
		}
		this.div(term, n, d);
		this.add(sum, sum, term);
		this.copy(out, sum);
		if (neg) {
			this.inv(out, out);
		}
		return out;
	}

	expAG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.expA(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}
	// candidate exp
	exp = this.expA;
	//exp = this.expAG;

	pow(out, b, e) {
		const low = this.create(3 / 32);
		if (b.raw <= low.raw) {
			out.raw = 0n;
			return out;
		}
		const lb = this.create();
		this.log(lb, b);
		this.mul(lb, lb, e);
		this.exp(out, lb);
		return out;
	}

	// logarithms
	logA(out, ox) {
		const low = this.create(1 / 16);
		if (ox.raw <= low.raw) {
			out.raw = 0n;
			return out;
		}
		/*
		if (ox.raw <= this.ZERO.raw) {
			out.raw = 0n;
			return out;
		}*/
		const mx = this.clone(ox);
		
		// move arg close to 1 for better results
		const offset = this.create();
		let watch = 20;
		
		while (mx.raw >= this.E_1_4.raw && watch > 0) {
			this.add(offset, offset, this.FOURTH);
			this.mul(mx, mx, this.E_M1_4);
			--watch;
		}

		while (mx.raw < this.E_M1_2.raw && watch > 0) {
			this.sub(offset, offset, this.HALF);
			this.mul(mx, mx, this.E_1_2);
			--watch;
		}

		if (!watch) {
			console.error("watch hit!!!");
			out.raw = 0n;
			return out;
		}

		const d = this.clone(this.ONE);
		this.sub(mx, mx, this.ONE);
		const n = this.clone(mx);
		this.neg(mx, mx);
		const steps = 10;
		const y = this.create();
		const term = this.create();
		this.div(term, n, d);
		this.add(y, y, term);
        //console.log("n = " + this.toPrettyString(n)
		//	+ ", d = " + this.toPrettyString(d));
		for (let i = 1; i < steps; ++i) {
			this.mul(n, n, mx);
			this.add(d, d, this.ONE);
			this.div(term, n, d);
			this.add(y, y, term);
	        //console.log("n = " + this.toPrettyString(n)
			//	+ ", d = " + this.toPrettyString(d));
		}
		this.add(y, y, offset);
		this.copy(out, y);
		return out;
	}

	logAG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.logA(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}
	// candidate log
	//log = this.logA;
	log = this.logAG;

	log10(out, oy) {
		this.log(out, oy);
		this.mul(out, out, this.LOG10E);
		return out;
	}

	log2(out, oy) {
		this.log(out, oy);
		this.mul(out, out, this.LOG2E);
		return out;
	}

	// hyperbolic
	sinh(out, a) {
		const e = this.create();
		this.exp(e, a);
		const inve = this.create();
		this.inv(inve, e);
		const terms = this.create();
		this.sub(terms, e, inve);
		this.mul(terms, terms, this.HALF);
		out.raw = terms.raw;
		return out;
	}

	cosh(out, a) {
		const e = this.create();
		this.exp(e, a);
		const inve = this.create();
		this.inv(inve, e);
		const terms = this.create();
		this.add(terms, e, inve);
		this.mul(terms, terms, this.HALF);
		out.raw = terms.raw;
		return out;
	}

	tanh(out, a) {
		const e = this.create();
		this.exp(e, a);
		const inve = this.create();
		this.inv(inve, e);

		const topTerms = this.create();
		this.sub(topTerms, e, inve);
		this.mul(topTerms, topTerms, this.HALF);

		const botTerms = this.create();
		this.add(botTerms, e, inve);
		this.mul(botTerms, botTerms, this.HALF);

		this.div(out, topTerms, botTerms);
		return out;
	}

	// asinh NYI
	// acosh NYI

	atanhA(out, a) {
		const na = this.clone(a);
        // Math.abs(n) + Math.PI / 2) % Math.PI - Math.PI / 2 <= 7 / 8 * Math.PI / 2 ? Math.tan(n) : 0
		this.abs(na, na);
		const compare = this.create(15 / 16);
		//if (true) {
		if (na.raw >= compare.raw) {
			out.raw = 0n;
			return out;
		}
		const steps = 30;
		const sum = this.create();
		const term = this.create();
		const n = this.clone(a);
		const d = this.clone(this.ONE);
		let i = 0;
		while(true) {
			this.div(term, n, d);
			this.add(sum, sum, term);
			if (++i == steps) {
				break;
			}
			this.add(d, d, this.TWO);
			this.mul(n, n, a);
			this.mul(n, n, a);
		}
		out.raw = sum.raw;
		return out;
	}

	atanhAG(out, a) {
		const aSave = a.raw;
		a.raw = FMathBigIntInstance.convert(a.raw, this.fracBits, FMathBigIntInstance.guard.fracBits);
		FMathBigIntInstance.guard.atanhA(out, a);
		out.raw = FMathBigIntInstance.convert(out.raw, FMathBigIntInstance.guard.fracBits, this.fracBits);
		a.raw = aSave;
		return out;
	}
	// candidate atanh
	atanh = this.atanhA;
	//atanh = this.atanhAG;

	// miscellaneous
	
	random(out, a) { // placeholder NYI
		const n = Math.random();
		this.setNumber(out, n, false);
		return out;
	}
}
