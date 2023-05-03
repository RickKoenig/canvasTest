'use strict';

// simple fraction class
// Thanks to Brandon Jones, Colin MacKenzie IV. for the template borrowed from vec2.js
// Rick Koenig, from vec2.js to bigFraction.js

/**
 * @class rational
 * @name fraction
 */
var fraction = {};

/**
 * Creates a new, 0 fraction OR pass in 1 int OR pass in two ints
 *
 * @returns {fraction} a new fraction
 */
 
const bigMath = {
  abs(x) {
    return x < 0n ? -x : x
  },
  sign(x) {
    if (x === 0n) return 0n
    return x < 0n ? -1n : 1n
  },
  pow(base, exponent) {
    return base ** exponent
  },
  min(value, ...values) {
    for (const v of values)
      if (v < value) value = v
    return value
  },
  max(value, ...values) {
    for (const v of values)
      if (v > value) value = v
    return value
  },
};

fraction.gcd = function(a, b) {
	if (!b) {
		return a;
	}
	return fraction.gcd(b, a % b);
}

// reduces a fraction to lowest terms, makes numerator non negative
fraction.reduce = function(f) {
	var r = fraction.gcd(bigMath.abs(f[0]), bigMath.abs(f[1]));
	if (r > 0n) {
		if (f[1] < 0n) {
			r = -r;
		}
		f[0] /= r;
		f[1] /= r;
	} else {
		f[0] = 0n;
		f[1] = 0n;
	}
};

fraction.create = function(w, n, d) {
    var out = Array(2);
	fraction.set(out, w, n, d);
    return out;
};

/**
 * Creates a new fraction initialized with values from an existing fraction number
 *
 * @param {fraction} a fraction number to clone
 * @returns {fraction} a new fraction number
 */
fraction.clone = function(a) {
    var out = Array(2);
	if (a == undefined) {
		out[0] = 0n;
		out[1] = 1n;
	} else if (typeof a == 'number') {
		out[0] = BigInt(a);
		out[1] = 1n;
	} else if (typeof a == 'bigint') {
		out[0] = a;
		out[1] = 1n;
	} else {
		out[0] = a[0];
		out[1] = a[1];
	}
    return out;
};

/**
 * Copy the values from one fraction to another
 *
 * @param {fraction} out the receiving fraction number
 * @param {fraction} a the source fraction number
 * @returns {fraction} out
 */
fraction.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

function bigintCreate(n) {
	var b;
	try {
		b = BigInt(n);
	} catch {
		b = 0n;
	}
	return b;
}


/**
 * Set the components of a fraction to the given values
 *
 * @param {fraction} out the receiving fraction number
 * @param {Number} w whole number
 * @param {Number} n numerator
 * @param {Number} d denominator
 * @returns {fraction} out
 */
// or function(out, n, d) {
// or function(out, s) {
fraction.set = function(out, w, n, d) {
	if (typeof w === 'string') {
		// tricky, parse string into 1: an integer or, 2: a fraction or, 3: a mixed fraction
		var c = w.trim();
		var splitDivide = c.split("/", 2);
		splitDivide[0] = splitDivide[0].trim();
		var left = splitDivide[0].split(" "); // left side of '/'
		left[0] = left[0].trim(); // array of stuff in left side of divide split by spaces
		var res;
		if (splitDivide.length > 1) { // has a divide '/'
			splitDivide[1] = splitDivide[1].trim();
			left = left.filter(n => n); // remove all empty arrays in left
			res = left; // could be size 1 or 2
			res.push(splitDivide[1]); // denominator
		} else {
			res = left;
		}
		if (res.length == 1) { // like a
			res.push(0);
			res.push(1);
		} else if (res.length == 2) { // like a / b
			res.unshift(0);
		} // else  like a  b / c
		w = res[0];
		n = res[1];
		d = res[2];
	}
	// shift args right if no 'd'
	var to = typeof d;
	if (to !== 'number' && to !== 'bigint' && to !== 'string') {
		d = n;
		n = w;
		w = 0n;
	}
	if (w == null) {
		w = 0n;
	}
	if (n == null) {
		n = 0n;
	}
	if (d == null) {
		d = 1n;
	}
	w = bigintCreate(w);
	n = bigintCreate(n);
	d = bigintCreate(d);
	if (w > 0n) {
		out[0] = w * d + n;
	} else if (w < 0n) { // make -1 1/2 be -1 - 1/2 or -3/2
		out[0] = w * d - n;
	} else {
		out[0] = n;
	}
	out[1] = d;
	fraction.reduce(out);
    return out;
};

/**
 * Adds two fraction's
 *
 * @param {fraction} out the receiving fraction number
 * @param {fraction} a the first operand
 * @param {fraction} b the second operand
 * @returns {fraction} out
 */
fraction.add = function(out, a, b) {
	var g = fraction.gcd(a[1], b[1]);
	if (g == 0n) {
		out[0] = 0n;
		out[1] = 0n;
		fraction.reduce(out);
	} else {
		var x = a[1] / g;
		var y = b[1] / g;
		out[0] = a[0] * y + b[0] * x;
		out[1] = a[1] * b[1] / g;
		fraction.reduce(out);
	}
    return out;
};

/**
 * Alias for {@link fraction.add}
 * @function
 */
fraction.plus = fraction.add;

/**
 * Subtracts two fraction's
 *
 * @param {fraction} out the receiving fraction number
 * @param {fraction} a the first operand
 * @param {fraction} b the second operand
 * @returns {fraction} out
 */
fraction.subtract = function(out, a, b) {
	var g = fraction.gcd(a[1], b[1]);
	if (g == 0n) {
		out[0] = 0n;
		out[1] = 0n;
		fraction.reduce(out);
	} else {
		var x = a[1] / g;
		var y = b[1] / g;
		out[0] = a[0] * y - b[0] * x;
		out[1] = a[1] * b[1] / g;
		fraction.reduce(out);
	}
    return out;
};

/**
 * Alias for {@link fraction.subtract}
 * @function
 */
fraction.sub = fraction.subtract;

/**
 * Multiplies two fraction's
 *
 * @param {fraction} out the receiving fraction number
 * @param {fraction} a the first operand
 * @param {fraction} b the second operand
 * @returns {fraction} out
 */
fraction.multiply = function(out, a, b) {
	out[0] = a[0] * b[0];
	out[1] = a[1] * b[1];
	fraction.reduce(out);
    return out;
};

/**
 * Alias for {@link fraction.multiply}
 * @function
 */
fraction.mul = fraction.multiply;

/**
 * Divides two fraction's
 *
 * @param {fraction} out the receiving fraction number
 * @param {fraction} a the first operand
 * @param {fraction} b the second operand
 * @returns {fraction} out
 */
fraction.divide = function(out, a, b) {
	var n = a[0] * b[1];
	var d = a[1] * b[0];
	out[0] = n;
	out[1] = d;
	fraction.reduce(out);
    return out;
};

/**
 * Alias for {@link fraction.divide}
 * @function
 */
fraction.div = fraction.divide;

/**
 * Calculates the absolute value of a fraction
 *
 * @param {fraction} out the receiving fraction number
 * @param {fraction} a fraction number to calculate absolute value of
 * @returns {Number} absolute value of a
 */
fraction.abs = function (out, a) {
	out[0] = a[0];
	out[1] = a[1];
	fraction.reduce(out);
	out[0] = bigMath.abs(out[0]);
    return out;
};

/**
 * Negates the components of a fraction
 *
 * @param {fraction} out the receiving fraction number
 * @param {fraction} a fraction number to negate
 * @returns {fraction} out
 */
fraction.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = a[1];
    return out;
};

fraction.neg = fraction.negate;

fraction.reciprocal = function(out, a) {
	var n = a[0];
	var d = a[1];
	if (n < 0n) {
		n = -n;
		d = -d;
	}
	out[0] = d;
	out[1] = n;
	return out;
}

fraction.inverse = fraction.reciprocal;
fraction.inv = fraction.inverse;

/**
 * Returns a string representation of a fraction
 *
 * @param {fraction} fraction to represent as a string
 * @returns {String} string representation of the fraction
 */
fraction.toString = function(a, mixed) {
	if (a[1] == 0n) {
		return "NaN";
	}
	var w = 0n;
	var n = a[0];
	var d = a[1];
	if (mixed) {
		w = n / d;
		var n = n - w * d;
		if (w < 0n) {
			n = -n;
		}
	}
	if (d == 1n) {
		if (w == 0n) {
			return '' + n;
		} else {
			return '' + w;
		}
	} else {
		if (w == 0n) {
			return '' + n  + "/" + d;
		} else {
			return '' + w + " " + n  + "/" + d;
		}
	}
};

fraction.isWhole = function(f) {
	return f[1] == 1n;

}

// test the many methods of fraction
fraction.test = function() {
	logger("unit test of fraction\n");
	// TODO: add unit test
};

if(typeof(exports) !== 'undefined') {
    exports.fraction = fraction;
}
