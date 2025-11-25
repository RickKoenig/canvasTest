'use strict';

// do a consistent fixed point system in javascript
// using BigInt
// create a static like class with 2 parameters

class FMathBigIntInstance {
	static mFrac = 32; // master of high precision constants, 32 bit
	constructor(intPart, fracPart) {
		// BigInts
		this.intBits = BigInt(intPart); // for overflow
		this.fracBits = BigInt(fracPart);
		this.addRound = 1n << (this.fracBits - 1n); // .5

		// constants
        Math.ZERO = 0;
        Math.ONE = 1;
        this.constNames = [
            "ZERO",
            "ONE",
            "PI",
            "E",
            "SQRT2",
            "SQRT1_2",
            "LN10",
            "LN2",
            "LOG10E",
            "LOG2E"
        ];
        // consistency, make a copy from generate
        this.master32 = { // times 2 to the mFrac power, rounded to nearest BigInt
            ZERO: 0n,
            ONE: 4294967296n,
            PI: 13493037705n,
            E: 11674931555n,
            SQRT2: 6074001000n,
            SQRT1_2: 3037000500n,
            LN10: 9889527671n,
            LN2: 2977044472n,
            LOG10E: 1865280597n,
            LOG2E: 6196328019n
        };
		const generate = false;
		if (generate) {
			console.log("generate");
			for (const cName of this.constNames) {
				const big = BigInt(Math.round((2 ** 32) * Math[cName]));
				console.log(cName + ": " + big);
			}
		}
		// setup constants into instance
		for (const cName of this.constNames) {
			const raw = this.master32[cName];
			const ft = this.create(); // tFrac
			ft.raw = FMathBigIntInstance.convert(raw, FMathBigIntInstance.mFrac, fracPart);
			this[cName] = ft;
		}

		// Numbers
		this.mulFracFactor = Number(2n ** this.fracBits);
		this.epsilonNum = 1 / this.mulFracFactor;
		this.overNum = Number(1n << (this.intBits- 1n));

		// FMath object
		this.one = {
			raw: BigInt(this.mulFracFactor)
		};
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
		n += 1n << BigInt(from - to - 1);
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
		return this.div(out, this.one, a);
	}

	// binary operators
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
		let q = a.raw / b.raw; // div with trunc, a straight BigInt
		let btq = b.raw * q; // back to FMath
		btq = a.raw - btq;
		out.raw = btq;
		return out;
	}

	// TODO: add comparison operators, or just do a.raw < b.raw etc. ...

	// more advanced functions



// NYI: TODO:

    // functions

	// trigonometric
//    sin
	sin(out, a) {
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
	}
//    cos
	cos(out, a) {
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
	}
//    tan
//    asin
//    acos
//    atan
//    atan2(y, x)

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
		const two = this.create(2); // two = 2;
		const guess = this.clone(two); // r = 2;
		const newGuess = this.create(); // newGuess;
		for (let i = 0; i < steps; ++i) {
			this.div(newGuess, a, guess); // newGuess = a / guess;
			this.add(guess, newGuess, guess); // guess = (newGuess + guess) / 2;
			this.div(guess, guess, two);
		}
		out.raw = guess.raw;
		return out;
	}

//    cbrt

	// miscellaneous
//    random

}
