'use strict';

// do a consistent fixed point system in javascript
// using BigInt
// completely static
// no longer used

class FMathBigInt {

	static {
		// BigInts
		FMathBigInt.intBits = 2n; // for overflow
		FMathBigInt.fracBits = 2n;
		FMathBigInt.addRound = 1n << (FMathBigInt.fracBits - 1n); // .5

		// Numbers
		FMathBigInt.mulFracFactor = 1 << Number(FMathBigInt.fracBits);
		FMathBigInt.epsilonNum = 1 / FMathBigInt.mulFracFactor;
		FMathBigInt.overNum = Number(1n << (FMathBigInt.intBits- 1n));

		// FMath
		FMathBigInt.one = {raw: BigInt(FMathBigInt.mulFracFactor)};
	}

	// helpers
	static numberToPrettyString(n) {
		let ret = n.toString();
		if (ret >= 0) {
			ret = " " + ret;
		}
		ret = ret.padEnd(8);
		return ret;
	}

	// create
	static create = function() {
		return {
			raw: 0n
		};
	}

	static fromNumber(n) {
		const out = FMathBigInt.create();
		FMathBigInt.setNumber(out, n);
		return out;
	}
	
	static clone(f) {
		return clone(f);
	}

	// replace
	static copy(out, f) {
		out.raw = f.raw;
		return out;
	}

	static setNumber(out, n) {
		const toInt = Math.round(n * FMathBigInt.mulFracFactor);
		out.raw = BigInt(toInt);
		return out;
	}

	// output
	static toNumber(f) {
		return Number(f.raw) / FMathBigInt.mulFracFactor;
	}

	static toPrettyString(f) {
		const n = FMathBigInt.toNumber(f);
		return FMathBigInt.numberToPrettyString(n);
	}

	// unary operators
	static neg(out, a) {
		out.raw = -a.raw;
		return out;
	}
	
	static trunc = function(out, a) {
		if (a.raw >= 0) {
			out.raw = a.raw >> FMathBigInt.fracBits << FMathBigInt.fracBits;
		} else {
			out.raw = -(-(a.raw) >> FMathBigInt.fracBits << FMathBigInt.fracBits);
		}
		return out;
	}

	static floor = function(out, a) {
		out.raw = a.raw >> FMathBigInt.fracBits << FMathBigInt.fracBits;
		return out;
	}

	static ceil(out, a) {
		FMathBigInt.neg(out, a);
		FMathBigInt.floor(out, out);
		FMathBigInt.neg(out, out);
		return out;
	}

	static round(out, a) {
		out.raw = a.raw + FMathBigInt.addRound;
		FMathBigInt.floor(out, out);
		return out;
	}
	
	static inv = function(out, a) {
		return FMathBigInt.div(out, FMathBigInt.one, a);
	}

	// binary operators
	static add = function(out, a, b) {
		out.raw = a.raw + b.raw;
		return out;
	}

	static sub = function(out, a, b) {
		out.raw = a.raw - b.raw;
		return out;
	}

	static mul = function(out, a, b) {
		out.raw = a.raw * b.raw;
		out.raw += FMathBigInt.addRound;
		out.raw >>= FMathBigInt.fracBits;
		return out;
	}

	static div = function(out, a, b) {
		let aRaw = a.raw;
		let bRaw = b.raw;
		aRaw <<= FMathBigInt.fracBits;
		let bRawH = bRaw / 2n;
		if (aRaw < 0 != bRaw < 0) { // XOR
			bRawH = -bRawH;
		}
		aRaw += bRawH;
		out.raw = aRaw / bRaw;
		return out;
	}

	static mod = function(out, a, b) {
		let q = a.raw / b.raw; // div with trunc, a straight BigInt
		let btq = b.raw * q; // back to FMath
		btq = a.raw - btq;
		out.raw = btq;
		return out;
	}

	// TODO: add comparison operators, or just do a.raw < b.raw etc. ...
}