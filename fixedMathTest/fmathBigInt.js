'use strict';

// do a consistent fixed point system in javascript
// TODO: convert to BigInt

class FMathBigInt {

	static {
		// BigInts
		FMathBigInt.intBits = 2n;
		FMathBigInt.fracBits = 2n;

		//FMathBigInt.JSBits = 32n; // for overflow
		FMathBigInt.mulFracFactor = 1n << FMathBigInt.fracBits;
		//FMathBigInt.mulJS = 1n << FMathBigInt.JSBits; // for overflow

		FMathBigInt.addRound = 0n;// TODO:FMathNum.intPow(2, FMathNum.JSBits - FMathNum.intBits - 1);

		// Numbers
		FMathBigInt.epsilonNum = 1 / Number(FMathBigInt.mulFracFactor);
		FMathBigInt.overNum = 1 << (Number(FMathBigInt.intBits) - 1);
		// binary
		// example: if intBits = 3, fracBits = 3
		// iiif ff00 0000 0000 0000 0000 0000 0000
		// example: if intBits = 2, fracBits = 2
		// iiff 0000 0000 0000 0000 0000 0000 0000
	}

	// helpers
	/*static numberToHex32(n) {
		const uVal = n < 0 ? (n + FMathBigInt.mulJS) : n; // convert to unsigned
		const str = uVal.toString(16);
		const strPad = '0x' + str.padStart(8, '0');
		return strPad;  // hex string
	}*/

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
			raw: 0n // 32 bit
		};
	}

	static fromNumber(n) {
		const toInt = Math.round(n * Number(FMathBigInt.mulFracFactor));
		const out = FMathBigInt.create();
		out.raw = BigInt(toInt);
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
		out.raw = (n * FMathBigInt.mulFracFactor);
		return out;
	}

	// output
	static toNumber(f) {
		return Number(f.raw) / Number(FMathBigInt.mulFracFactor);
	}

	static toPrettyString(f) {
		const n = FMathBigInt.toNumber(f);
		return FMathBigInt.numberToPrettyString(n);
	}

	/*
	static toRawString(f) {
		return FMathBigInt.numberToHex32(f.raw);
	}*/

	// unary operators
	static neg(out, a) {
		out.raw = -a.raw;// & FMathBigInt.mask;
		return out;
	}
	
	static floor = function(out, a) {
//FMathBigInt.mulFracFactor
		const b = a.raw / FMathBigInt.mulFracFactor;//Number(a) >> Number(FMathBigInt.fracBits);
		out.raw =  b * FMathBigInt.mulFracFactor;//BigInt(b << Number(FMathBigInt.fracBits));//3n;//a.raw;// & FMathBigInt.floorMask;
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
	
	// check
	static inv = function(out, a) {
		out.raw = 1;
		return out;
	}

	// binary operators
	static add = function(out, a, b) {
		out.raw = (a.raw + b.raw) & FMathBigInt.mask;
		return out;
	}

	static sub = function(out, a, b) {
		out.raw = (a.raw - b.raw) & FMathBigInt.mask;
		return out;
	}

	static mul = function(out, a, b) {
		//console.log("\naraw = " + FMathBigInt.numberToHex32(a.raw));
		//console.log("braw = " + FMathBigInt.numberToHex32(b.raw));
		const ar = a.raw >> (FMathBigInt.JSBits - FMathBigInt.intBits - FMathBigInt.fracBits);
		const br = b.raw >> (FMathBigInt.JSBits - FMathBigInt.intBits - FMathBigInt.fracBits);
		let outr = ar * br;
		outr <<= (FMathBigInt.JSBits - FMathBigInt.intBits - 2 * FMathBigInt.fracBits);
		outr += 1 << (FMathBigInt.JSBits - FMathBigInt.intBits - FMathBigInt.fracBits - 1); // rounding
		out.raw = outr & FMathBigInt.mask;
		//console.log("craw = " + FMathBigInt.numberToHex32(out.raw));
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