// Math members, can't seem to iterate over the Math class
// So here's the list of members and constants
// alphabetical order, longest words first
const mathMembers = [
	// constants
	"E",
	"LN10",
	"LN2",
	"LOG10E",
	"LOG2E",
	"PI",
	"SQRT1_2",
	"SQRT2",

	// functions
	"abs",		// Returns the absolute value of x
	"acosh",	// Returns the hyperbolic arccosine of a number
	"acos", 	// Returns the arccosine of a given number in radians
	"asinh",	// Returns the hyperbolic arccosine of a number
	"asin",		// Returns the arcsine of given number in radians
	"atan2",	// Returns the arctangent of quotient of its arguments
	"atanh",	// Returns the hyperbolic arctangent of x
	"atan",		// Returns the arctangent of given number in radians
	"cbrt",		// Returns the cube root of x
	"ceil",		// Returns the smallest integer greater than or equal to x
	"cosh",		// Returns the hyperbolic cosine of x
	"cos",		// Returns the cosine of x
	"exp",		// Returns the E to the x, where E is Euler's number
	"floor",	// Returns the largest integer less than or equal to x
	"log10",	// Returns the base 10 logarithm of x
	"log2",		// Returns the base 2 logarithm of x
	"log",		// Returns the natural logarithm of x",
	"min",		// Returns the smallest of the given numbers
	"max",		// Returns the largest of the given numbers
	"pow",		// Returns base x to exponent y",
	"random",	// Returns a random number between [0 and 1)
	"round",	// Returns the value of number rounded to nearest integer
	"sign",		// Returns sign of x, -1 or 0 or 1
	"sinh",		// Returns the hyperbolic sine of x
	"sin",		// Returns the sine of x
	"sqrt",		// Returns the square root of x
	"tanh",		// Returns the hyperbolic tangent of a number
	"tan",		// Returns the tangent of given number in radians
];

const testFun = [
	"10 + exp(x) + log10(x) + sinhmin",
	"sin(x) + sinh(x) + PI + E + acosh(x) + cosh(x)",
	"LN2 + LN10",
	"log(x) + log10(x) + log2(x) + log3(x)",
	"tan(x) + atan(x) + atan2(3,x) + atanh(x) + tanh(x)",
	"tanh(x) + atanh(x) + atan2(3,x) + atan(x) + tan(x)",
	"do nothing",
	"maybe sinEEacosh more PEPI fee",
];

for (let f of testFun) {
	//console.log("                00000000001111111111222222222233333333334444444444");
	//console.log("                01234567890123456789012345678901234567890123456789");
	//console.log(" input function '" + f + "'");
	const g = addMathPrefix(f);
	//console.log("output function '" + g + "'");
	//console.log("");
}

function generateDrawFunction(funStr) {
	let fun;
	try {
		fun = Function('"use strict"; let t = arguments[0]; return ' + funStr + ';');
	} catch (err) {
		console.error("Error creating function: <<< " + err + " >>>");
	}
	return fun;
}

function addMathPrefix(f) {
	let pos = 0; // in f
	let offsetSpace = 17; // approx length of 'input function '
	let log = " ".repeat(offsetSpace);
	let g = "";
	while(pos < f.length) {
		let step = 1;
		let foundOne = false;
		for (let m of mathMembers) {
			if (f.startsWith(m, pos)) {
				step = m.length;
				if (step == 1) { // like 'E'
					log += "#";
					log += " ".repeat(step - 1); // less space because of more stuff being logged
				} else { // 2 or more chars
					log += "[";
					log += " ".repeat(step - 2); // less space because of more stuff being logged
					log += "]";
				}
				// add Math. to sub
				g += "Math." + f.substring(pos, pos + step);
				//console.log("(" + pos + "," + step + ")");
				foundOne = true;
				break;
			}
		}
		if (!foundOne) { // log one space for not finding anything
			log += " ";
			g += f[pos];
		}
		pos += step;
	}
	//console.log(log);
	return g;
}
