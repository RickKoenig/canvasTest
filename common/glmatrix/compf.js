// please please get rid of -0
// simple complex number class
// Thanks to Brandon Jones, Colin MacKenzie IV. for the template borrowed from vec2.js
// Rick Koenig, from vec2.js to compf.js

/**
 * @class complex
 * @name compf
 */
var compf = {};

/**
 * Creates a new, empty compf OR pass in 1 real OR pass in two numbers
 *
 * @returns {compf} a new complex number
 */
compf.create = function(r, i) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = r == null ? 0 : r;
    out[1] = i == null ? 0 : i;
    return out;
};

/**
 * Creates a new compf initialized with values from an existing complex number
 *
 * @param {compf} a complex number to clone
 * @returns {compf} a new complex number
 */
compf.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Copy the values from one compf to another
 *
 * @param {compf} out the receiving complex number
 * @param {compf} a the source complex number
 * @returns {compf} out
 */
compf.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Set the components of a compf to the given values
 *
 * @param {compf} out the receiving complex number
 * @param {Number} r real component
 * @param {Number} i imaginary component
 * @returns {compf} out
 */
compf.set = function(out, r, i) {
    out[0] = r == null ? 0 : r;
    out[1] = i == null ? 0 : i;
    return out;
};

/**
 * Adds two compf's
 *
 * @param {compf} out the receiving complex number
 * @param {compf} a the first operand
 * @param {compf} b the second operand
 * @returns {compf} out
 */
compf.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
 * Subtracts two compf's
 *
 * @param {compf} out the receiving complex number
 * @param {compf} a the first operand
 * @param {compf} b the second operand
 * @returns {compf} out
 */
compf.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
 * Alias for {@link compf.subtract}
 * @function
 */
compf.sub = compf.subtract;

/**
 * Multiplies two compf's
 *
 * @param {compf} out the receiving complex number
 * @param {compf} a the first operand
 * @param {compf} b the second operand
 * @returns {compf} out
 */
compf.multiply = function(out, a, b) {
	var ar = a[0];
	var ai = a[1];
	var br = b[0];
	var bi = b[1];
	out[0] = ar*br - ai*bi;
	out[1] = ar*bi + ai*br;
    return out;
};

/**
 * Alias for {@link compf.multiply}
 * @function
 */
compf.mul = compf.multiply;

/**
 * Divides two compf's
 *
 * @param {compf} out the receiving complex number
 * @param {compf} a the first operand
 * @param {compf} b the second operand
 * @returns {compf} out
 */
compf.divide = function(out, a, b) {
	var ar = a[0];
	var ai = a[1];
	var br = b[0];
	var bi = b[1];
	var den = 1/(br*br + bi*bi);
	out[0] = den*( ar*br + ai*bi);
	out[1] = den*(-ar*bi + ai*br);
    return out;
};

/**
 * Alias for {@link compf.divide}
 * @function
 */
compf.div = compf.divide;



/**
 * Scales/Multiplies a compf by a scalar number
 *
 * @param {compf} out the receiving complex number
 * @param {compf} a the complex number to scale
 * @param {Number} b amount to scale the complex number by
 * @returns {compf} out
 */
compf.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};


/**
 * Calculates the absolute value of a compf
 *
 * @param {compf} a complex number to calculate absolute value of
 * @returns {Number} absolute value of a
 */
compf.abs = function (a) {
    var r = a[0],
        i = a[1];
    return Math.sqrt(r*r + i*i);
};

/**
 * Calculates the squared absolute value of a compf
 *
 * @param {compf} a complex number to calculate squared absolute value of
 * @returns {Number} squared absolute value of a
 */
compf.squaredAbs = function (a) {
    var r = a[0],
        i = a[1];
    return r*r + i*i;
};

compf.arg = function (a) {
	return Math.atan2(a[1],a[0]);
};

/**
 * Alias for {@link compf.squaredLength}
 * @function
 */
compf.sqrAbs = compf.squaredAbs;

/**
 * Conjugates the components of a compf
 *
 * @param {compf} out the receiving complex number
 * @param {compf} a complex number to conjugate
 * @returns {compf} out
 */
compf.conjugate = function(out, a) {
    out[0] = a[0];
    out[1] = -a[1];
    return out;
};

compf.conj = compf.conjugate;

/**
 * Negates the components of a compf
 *
 * @param {compf} out the receiving complex number
 * @param {compf} a complex number to negate
 * @returns {compf} out
 */
compf.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

compf.neg = compf.negate;

/**
 * Normalize a compf
 *
 * @param {compf} out the receiving complex number
 * @param {compf} a complex number to normalize
 * @returns {compf} out
 */
compf.normalize = function(out, a) {
    var r = a[0],
        i = a[1];
    var len = r*r + i*i;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

compf.norm = compf.normalize;

/**
 * Returns a string representation of a complex number
 *
 * @param {compf} vec complex number to represent as a string
 * @returns {String} string representation of the complex number
 */
 
// please get rid of -0

compf.fixfloat = function(f,prec) {
	if (prec == null)
		prec = 5;
	// get rid of -0
	var ep = Math.pow(10,-prec);
	if (f < 0 && f > -ep)
		f = 0;
	var ret = f >= 0 ? " " : "";
	return ret + f.toFixed(prec);
	//return ret + f.toExponential();
	//return f;
};

compf.str = function(a,prec) {
    //return '(' + a[0] + ', ' + a[1] + 'i)';
	return '(' + compf.fixfloat(a[0],prec) + "," + compf.fixfloat(a[1],prec) + 'i) ';
	//return "compf.str";
};

// test the many methods of compf
compf.test = function() {
	logger("unit test of compf\n");
	var zv = compf.create();
	var rv = compf.create(3);
	var cv = compf.create(4,5);
	var ccv = compf.clone(cv);
	var tcpy = compf.create();
	compf.copy(tcpy,ccv);
	compf.set(tcpy,40,50);
	var str = compf.str(tcpy);
	
	var tadd = compf.create();
	compf.add(tadd,cv,tcpy);
	var tsub = compf.create();
	compf.sub(tsub,tadd,tcpy);
	var tscale = compf.create();
	compf.scale(tscale,tadd,.5);
	var tdiv = compf.create();
	compf.div(tdiv,tadd,tscale);
	var tmul = compf.create();
	
	var v1 = compf.create(3,4);
	var nv1 = compf.create();
	compf.norm(nv1,v1);
	var tabs = compf.abs(v1);
	var tabssq = compf.sqrAbs(v1);
	
	compf.set(v1,6,5);
	compf.set(cv,1,2);
	compf.div(tdiv,v1,cv);
	compf.mul(tmul,tdiv,cv);
	//compf.div(tdiv,tadd,tscale);

	var tneg = compf.create();
	var tconj = compf.create();
	compf.neg(tneg,v1);
	compf.conj(tconj,v1);
};

if(typeof(exports) !== 'undefined') {
    exports.compf = compf;
}
