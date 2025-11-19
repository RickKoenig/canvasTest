'use strict';

// do a consistent fixed point system in javascript
// using BigInt
// create a static like class with 2 parameters

class FMathBigIntInstance {
	constructor(intPart, fracPart) {
		// BigInts
		this.intBits = BigInt(intPart); // for overflow
		this.fracBits = BigInt(fracPart);
		this.addRound = 1n << (this.fracBits - 1n); // .5

		// Numbers
		this.mulFracFactor = 1 << Number(this.fracBits);
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

	// advanced
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

	// TODO: add comparison operators, or just do a.raw < b.raw etc. ...
}

/*
class CMath {
	// constants
    // keep all Math constants for now
    static E = Math.E;
    static LN10 = Math.LN10;
    static LN2 = Math.LN2;
    static LOG10E = Math.LOG10E;
    static LOG2E = Math.LOG2E;
    static PI = Math.PI;
    static SQRT1_2 = Math.SQRT1_2;
    static SQRT2 = Math.SQRT2;

    // functions
    static acosh = Math.acosh;
    static acos = Math.acos;
    static asinh = Math.asinh;
    static asin = Math.asin;
    static atan2 = Math.atan2;
    static atanh = Math.atanh;
    static atan = Math.atan;
    static cbrt = Math.cbrt;
    static cosh = Math.cosh;
    static cos(a) {
    static exp = Math.exp;
    static log10 = Math.log10;
    static log2 = Math.log2;
    static log = Math.log;
    static pow = Math.pow;
    static random = Math.random;
    static sign = Math.sign;
    static sinh = Math.sinh;
    static sin(a) {
    static tanh = Math.tanh;
    static tan = Math.tan;
}
*/