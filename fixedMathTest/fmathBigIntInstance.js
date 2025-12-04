'use strict';

// do a consistent fixed point system in javascript
// using BigInt
// create a static like class with 2 parameters

class FMathBigIntInstance {
	static masterFrac = 32; // master of high precision constants, 32 bit fraction
	constructor(intPart, fracPart) { // intPart is for overflow if needed
		this.version = .125; // try to keep as N / (2^p)
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
			TWOPI: Math.PI * 2,
			HALFPI: Math.PI / 2,
			ATAN_I : -0.0464964749,
            ATAN_J : 0.15931422,
            ATAN_K : 0.327622764,

		};
        // consistency, make a copy from generate
        this.generated32 = { // times 2 to the masterFrac power, rounded to nearest BigInt
			// built in
			PI: 13493037705n,
			E: 11674931555n,
			SQRT2: 6074001000n,
			SQRT1_2: 3037000500n,
			LN10: 9889527671n,
			LN2: 2977044472n,
			LOG10E: 1865280597n,
			LOG2E: 6196328019n,
			// extra
			ZERO: 0n,
			ONE: 4294967296n,
			TWO: 8589934592n,
			THREE: 12884901888n,
			FOUR: 17179869184n,
			HALF: 2147483648n,
			THIRD: 1431655765n,
			FOURTH: 1073741824n,
			TWOPI: 26986075409n,
			HALFPI: 6746518852n,
			ATAN_I: -199700839n,
			ATAN_J: 684249365n,
			ATAN_K: 1407129057n,
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
			let str = "\ngenerate 'this.generated32'\n\n";
			str += "// built in\n";
			for (const cName of this.constNamesMath) {
				const big = BigInt(Math.round((2 ** 32) * Math[cName]));
				str += cName + ": " + big + "n,\n";
			}
			str += "// extra\n";
			for (const cName of this.constNamesExtra) {
				const val = this.constObjectsExtra[cName];
				const big = BigInt(Math.round((2 ** 32) * val));
				str += cName + ": " + big + "n,\n";
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
		n += 1n << BigInt(from - to - 1); // round
		const out = n >> BigInt(from - to);
		return out;
	}

	// create
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

	setNumber(out, n) {
		const toInt = Math.round(n * this.mulFracFactor);
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

	// basic
	// unary operators
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

	// binary operators
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

	// TODO: add comparison operators, or just do a.raw < b.raw etc. ...

	// more advanced functions

	// trigonometric

	// output (-PI to PI]
	normAngRad(out, a) {
        const r = this.create();
        this.mod(out, a, this.TWOPI);
        if (out.raw > this.PI.raw) {
            this.sub(out, out, this.TWOPI);
        } else if (out.raw <= -this.PI.raw) {
            this.add(out, out, this.TWOPI);
        }
		return out;
	}

	sinNoNorm(out, a) {
		const steps = 20;
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

	sin(out, a) {
		const na = this.create();
		this.normAngRad(na, a);
		this.sinNoNorm(out, a);
		return out;
	}

	cosNoNorm(out, a) {
		const steps = 20;
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

	cos(out, a) {
		const na = this.create();
		this.normAngRad(na, a);
		this.cosNoNorm(out, a);
		return out;
	}

	// slightly broken
	tan(out, a) {
		const na = this.create();
		this.normAngRad(na, a);
		const x = this.create();
		const y = this.create();
		this.cos(x, na);
		this.sin(y, na);
		this.div(out, y, x);
		return out;
	}

//    asin
//    acos
	atan(out, y) {
		return this.atan2(out, y, this.ONE);
	}

	atan2(out, y, x) {
		const xa = this.create();
		const ya = this.create();
		const num = this.create();
		const den = this.create();
		const a = this.create();
		const s = this.create();
		const r = this.create();
		// Horner scheme. The minimax approximation was computed using the Remez algorithm
		/* const xa = Math.abs(x);
		const ya = Math.abs(y);
		const a = Math.min (xa, ya) / Math.max (xa, ya);
		const s = a * a; */
		this.abs(xa, x);
		this.abs(ya, y);
		this.min(num, xa, ya);
		this.max(den, xa, ya);
		if (den.raw == 0n) {
			out.raw = 0n; // avoid division by zero
			return out;
		}
		this.div(a, num, den);
		this.mul(s, a, a);

		this.mul(r, this.ATAN_I, s);
		this.add(r, r, this.ATAN_J);
		this.mul(r, r, s);
		this.sub(r, r, this.ATAN_K);
		this.mul(r, r, s);
		this.mul(r, r, a);
		this.add(r, r, a);
		//let r = ((I * s + J) * s - K) * s * a + a;
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

	// hyperbolic
//    sinh
//    cosh
//    tanh
//    acosh
//    asinh
//    atanh

	// exponents
	exp(out, a) {
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
			this.mul(n, n, a);
			this.add(m, m, this.ONE);
			this.mul(d, d, m);
		}
		this.div(term, n, d);
		this.add(sum, sum, term);
		out.raw = sum.raw;
		return out;
	}
//    pow(b, e)

	// logarithms
//    log
//    log10
//    log2

	sqrt(out, a) {
		const steps = 8;
		if (a.raw <= 0n) {
			out.raw = 0;
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

//    cbrt

	// miscellaneous
//    random

}
