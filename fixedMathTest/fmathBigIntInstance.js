'use strict';

// do a consistent fixed point system in javascript
// using BigInt
// create a static like class with 2 parameters

class FMathBigIntInstance {
	static mFrac = 32; // master high precision constants
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
        // consistency
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
	create = function() {
		return {
			raw: 0n
		};
	}

	fromNumber(n) {
		const out = this.create();
		this.setNumber(out, n);
		return out;
	}
	
	clone(f) {
		return clone(f);
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
	
	trunc = function(out, a) {
		if (a.raw >= 0) {
			out.raw = a.raw >> this.fracBits << this.fracBits;
		} else {
			out.raw = -(-(a.raw) >> this.fracBits << this.fracBits);
		}
		return out;
	}

	floor = function(out, a) {
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
	
	inv = function(out, a) {
		// don't do divide by zero
		if (a.raw == 0n) {
			out.raw = 0;
			return out;
		}
		return this.div(out, this.one, a);
	}

	// binary operators
	add = function(out, a, b) {
		out.raw = a.raw + b.raw;
		return out;
	}

	sub = function(out, a, b) {
		out.raw = a.raw - b.raw;
		return out;
	}

	mul = function(out, a, b) {
		out.raw = a.raw * b.raw;
		out.raw += this.addRound;
		out.raw >>= this.fracBits;
		return out;
	}

	div = function(out, a, b) {
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

	mod = function(out, a, b) {
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
//    cos
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

	// logarithms
//    log
//    log10
//    log2

	// exponents
//    exp
//    pow(b, e)

	sqrt = function(out, a) {
		if (a.raw <= 0n) {
			out.raw = 0;
			return out;
		}
		let two = this.fromNumber(2);
		let r = this.clone(two);
		let adr = this.create();
		for (let i = 0; i < 8; ++i) {
			this.div(adr, a, r);
			this.add(r, adr, r);
			this.div(r, r, two);
		}
		out.raw = r.raw;
		return out;
	}

//    cbrt

	// miscellaneous
//    random

}
