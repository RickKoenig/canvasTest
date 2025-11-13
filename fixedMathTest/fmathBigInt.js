'use strict';

// do a consistent fixed point system in javascript
// using BigInt

class FMathBigInt {

	static {
		// BigInts
		FMathBigInt.intBits = 2n; // for overflow
		FMathBigInt.fracBits = 2n;
		FMathBigInt.addRound = 1n << (FMathBigInt.fracBits - 1n); // .5

		// Numbers
		FMathBigInt.mulFracFactor = 1 << Number(FMathBigInt.fracBits);
		FMathBigInt.epsilonNum = 1 / FMathBigInt.mulFracFactor;
		FMathBigInt.overNum = 1 << (Number(FMathBigInt.intBits) - 1);
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
		let bigARaw = 1n << (2n * FMathBigInt.fracBits);
		out.raw = bigARaw / a.raw;
		return out;
	}

	// binary operators
	static add = function(out, a, b) {
		out.raw = (a.raw + b.raw);
		return out;
	}

	static sub = function(out, a, b) {
		out.raw = (a.raw - b.raw);
		return out;
	}

	static mul = function(out, a, b) {
		out.raw = a.raw * b.raw;
		out.raw += FMathBigInt.addRound;
		out.raw >>= FMathBigInt.fracBits;
		return out;
	}

	static div = function(out, a, b) {
		let bigARaw = a.raw << FMathBigInt.fracBits;
		out.raw = bigARaw / b.raw;
		return out;
	}

	// TODO
	static mod = function(out, a, b) {
		return out;
	}

	// TODO: add comparison operators, or just do a.raw < b.raw etc. ...
}