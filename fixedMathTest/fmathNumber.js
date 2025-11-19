'use strict';

// do a consistent fixed point system in javascript
// using Number
// on hold, trying BigInt instead
// no longer used

class FMathNum {

	//helper
	static intPow(b, e) {
		let r = 1;
		while(e-- > 0) {
			r *= b;
		}
		return r;
	}

	static {
		FMathNum.intBits = 2;//2; // do a max of 13, 13 * 4 = 52, one less then 2 ** 53 - 1, Math.INT_MAX
		FMathNum.fracBits = 2;//2; // do a max of 13

		FMathNum.JSBits = 32; // when javascript works in ints, 2's complement
		FMathNum.mulFracFactor = FMathNum.intPow(2, FMathNum.JSBits - FMathNum.intBits);
		FMathNum.mulJS = FMathNum.intPow(2, FMathNum.JSBits);

		FMathNum.mask = (FMathNum.intPow(2, FMathNum.intBits + FMathNum.fracBits)) - 1; // put all bits to MSB position
		FMathNum.mask *= FMathNum.intPow(2, FMathNum.JSBits - FMathNum.intBits - FMathNum.fracBits);

		FMathNum.floorMask = FMathNum.intPow(2, FMathNum.intBits) - 1;
		FMathNum.floorMask *= FMathNum.intPow(2, FMathNum.JSBits - FMathNum.intBits);

		FMathNum.addRound = FMathNum.intPow(2, FMathNum.JSBits - FMathNum.intBits - 1);

		FMathNum.epsilonNum = 1 / FMathNum.intPow(2, FMathNum.fracBits);
		FMathNum.overNum = FMathNum.intPow(2, FMathNum.intBits - 1);
		// binary
		// example: if intBits = 3, fracBits = 3
		// iiif ff00 0000 0000 0000 0000 0000 0000
		// example: if intBits = 2, fracBits = 2
		// iiff 0000 0000 0000 0000 0000 0000 0000
	}

	// helpers
	static numberToHex32(n) {
		const uVal = n < 0 ? (n + FMathNum.mulJS) : n; // convert to unsigned
		const str = uVal.toString(16);
		const strPad = '0x' + str.padStart(8, '0');
		return strPad;  // hex string
	}

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
			raw: 0 // 32 bit
		};
	}

	static fromNumber(n) {
		const out = FMathNum.create();
		out.raw = (n * FMathNum.mulFracFactor) & FMathNum.mask;
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
		out.raw = (n * FMathNum.mulFracFactor) & FMathNum.mask;
		return out;
	}

	// output
	static toNumber(f) {
		return f.raw / FMathNum.mulFracFactor;
	}
	static toPrettyString(f) {
		const n = FMathNum.toNumber(f);
		return FMathNum.numberToPrettyString(n);
	}

	static toRawString(f) {
		return FMathNum.numberToHex32(f.raw);
	}

	// unary operators
	static neg(out, a) {
		out.raw = -a.raw & FMathNum.mask;
		return out;
	}
	
	static floor = function(out, a) {
		out.raw =  a.raw & FMathNum.floorMask;
		return out;
	}
	static ceil(out, a) {
		FMathNum.neg(out, a);
		FMathNum.floor(out, out);
		FMathNum.neg(out, out);
		return out;
	}

	static round(out, a) {
		out.raw = a.raw + FMathNum.addRound;
		FMathNum.floor(out, out);
		return out;
	}
	
	// check
	static inv = function(out, a) {
		out.raw = 1;
		return out;
	}

	// binary operators
	static add = function(out, a, b) {
		out.raw = (a.raw + b.raw) & FMathNum.mask;
		return out;
	}

	static sub = function(out, a, b) {
		out.raw = (a.raw - b.raw) & FMathNum.mask;
		return out;
	}

	static mul = function(out, a, b) {
		//console.log("\naraw = " + FMathNum.numberToHex32(a.raw));
		//console.log("braw = " + FMathNum.numberToHex32(b.raw));
		const ar = a.raw >> (FMathNum.JSBits - FMathNum.intBits - FMathNum.fracBits);
		const br = b.raw >> (FMathNum.JSBits - FMathNum.intBits - FMathNum.fracBits);
		let outr = ar * br;
		outr <<= (FMathNum.JSBits - FMathNum.intBits - 2 * FMathNum.fracBits);
		outr += 1 << (FMathNum.JSBits - FMathNum.intBits - FMathNum.fracBits - 1); // rounding
		out.raw = outr & FMathNum.mask;
		//console.log("craw = " + FMathNum.numberToHex32(out.raw));
		return out;
	}

	// check
	static div = function(out, a, b) {
		return out;
	}

	// check
	static mod = function(out, a, b) {
		return out;
	}

	// TODO: add comparison operators, or just do a.raw < b.raw etc. ...
}