'use strict';

function chebyToRawCoefs(coefs) {
    const a1 = coefs[0] - 3 * coefs[1] + 5 * coefs[2] - 7 * coefs[3];
    const b1 = 4 * coefs[1] - 20 * coefs[2] + 56 * coefs[3];
    const c1 = 16 * coefs[2] - 112 * coefs[3];
    const d1 = 64 * coefs[3];
    return [a1, b1, c1, d1];
}

function calcCoef(coefs, doChebyshev, x) { // 1, 3, 5, 7
    const s = x * x;
    if (doChebyshev) {
        coefs = chebyToRawCoefs(coefs);
    }
    return x * (coefs[0] + s * (coefs[1] + s * (coefs[2]  + s * coefs[3])));
}

function getMaxErr(coefs, doChebyshev, fun, start, finish) {
    let maxE = 0;
    for (let x = start; x <= finish; x += 1 / 32) {
        const math = fun(x);
        const calc = calcCoef(coefs, doChebyshev, x);
        const E = Math.abs(calc - math);
        if (E > maxE) {
            maxE = E;
        }
    }
    return maxE;
}

// 1, 3, 5, 7
// assume start == 0
function convertCoefs(coefs, start, finish) {
    //finish = 1;
    finish = 1 / finish;
    const step = finish * finish;
    coefs[0] *= finish;
    finish *= step;
    coefs[1] *= finish;
    finish *= step;
    coefs[2] *= finish;
    finish *= step;
    coefs[3] *= finish
}

function makeCalcCoefsDeeperRemez(coefs, step, doChebyshev, fun, start, finish) {
    //console.log("deeper2");
    let maxWatch = 20000;
    let watch = 0;
    let dim = 4;
    while(++watch < maxWatch) {
        let EMin = getMaxErr(coefs, doChebyshev, fun, start, finish);
        let cBase = coefs.slice();
        let coefMin = coefs.slice();
        let done = true;
        const iArr = [-1, -1, -1, -1];
        let dig = 0;
        while(++watch < maxWatch && dig < dim) {
            for (let i = 0; i < dim; ++i) {
                coefs[i] = cBase[i] + step * iArr[i];
            }
            const E = getMaxErr(coefs, doChebyshev, fun, start, finish);
            if (E < EMin) {
                coefMin = coefs.slice();
                EMin = E;
                done = false;
            }
			//console.log("iarr" + iArr);
			// move to next iteration
            while(dig < dim && ++watch < maxWatch) {
				++iArr[dig];
				if (iArr[dig] > 1) {
					iArr[dig++] = -1;
				} else {
					dig = 0;
					break;
				}
			}
            // done move to next iteration
		}
        coefs.splice(0, coefMin.length, ...coefMin);
        if (done) {
            break;
        }
    }
    if (watch == maxWatch) {
        console.error("watch2 hit !!, watch = " + watch);
    } else {
        //console.log(`watch2 = ${watch} / ${maxWatch}`);
    }
}

// Remez coefs, in Chebyshev space
// for now assume start is 0, scale only
function makeCalcCoefsRemez(coefs, doChebyshev, fun, start, finish) { // 1, 3, 5, 7
    if (!coefs.length) {
        coefs.length = 4;
        coefs.fill(0);
    }
    // new function with input range 0 to 1
    const funXform = (x) => fun(x * finish);
    const startStep = 5;
    const endStep = 15;// 15;
    for (let i = startStep; i <= endStep; ++i) {
        const step = 1 / 2 ** i; // refine step
        makeCalcCoefsDeeperRemez(coefs, step, doChebyshev, funXform, 0, 1);
    }
}

function calcErrRatio(c, absDelta, epsilon) {
    let ac = Math.abs(c);
    // absolute when ac < 1
    // relative when ac >= 1
    let shift = 0;
    
    while(ac >= 1) {
        ac /= 10;
        absDelta /= 10;
        ++shift;
    }
    
    let rat = absDelta / epsilon;
    return {rat: rat, shift: shift};
}

function unitTest(intP, fracP, displayP, positiveOnly, doChebyshev, funs) {
    let skipP;
    skipP = intP + fracP - displayP;
    if (skipP < 0) {
        skipP = 0; // full display
    }
    if (displayP <=0) { // full display
        skipP = 0;
    }
    const FMath = FMathBigIntInstance; // static, uses BigInt, interface
    const FMathInst = new FMath(intP, fracP); // instance

    console.log("begin testFMath");
    console.log(`masterBits = ${FMath.masterFrac}, guardBits (when needed) = ${FMath.guardFrac}`);
    console.log(`intBits = ${FMathInst.intBits}, fracBits = ${FMathInst.fracBits}, version = ${FMathInst.version}`);
    console.log("epsilonNum = " + FMathInst.epsilonNum);
    console.log("overNum = -" + FMathInst.overNum + " to " + FMathInst.overNum);

    const testCalcCoefFix = false;
    const testMinMax = false;
    const doVerbose = true;
    const testConstants = false;
    const doPrecUnary = true;
    const doPrecBinary = false;
    const playWithConvert = true;
	if (playWithConvert) {
		console.log("test convert");
	}

    if (testCalcCoefFix) {
        const poly = [
            // 2x^2 + 3x + 5
            FMathInst.create(5),
            FMathInst.create(3),
            FMathInst.create(2)
        ];
        const x = FMathInst.create(1);
        console.log(FMathInst.toPrettyString(x));
        const y = FMathInst.create();
        FMathInst.mul(y, x, FMathInst.THREE);
        console.log(FMathInst.toPrettyString(y));
        FMathInst.calcCoefFix(y, x, poly);
        FMathInst.calcCoefFix(y, y, poly);
        console.log(FMathInst.toPrettyString(y));
    }

    if (testMinMax) { // Remez algorithm, try atan, sin, then try more functions, in floating point
        for (const curFun of funs) {
            console.log("\nTest MIN MAX unary '" + curFun.name + "'");
            let maxEtaylor = 0;
            let maxEXtaylor = 0;
            let maxEremez = 0;
            let maxEXremez = 0;
            const coefsRemezCheby = [];
            const xRange = curFun.xRange;
            const start = xRange[0];
            const finish = xRange[1];
            makeCalcCoefsRemez(coefsRemezCheby, doChebyshev, curFun.altFun ? curFun.altFun : curFun.fun, start, finish);
            const coefsRemez = chebyToRawCoefs(coefsRemezCheby);
            convertCoefs(coefsRemez, start, finish);
            const fixed = 6;
            for (let x = 0; x <= finish; x += 2 ** (1 - displayP)) { //} / 32) { // 64
                const math = curFun.fun(x);
                // deltas
                // Taylor
                const taylor = calcCoef(curFun.tayCoef, false, x);
                const Etaylor = Math.abs(taylor - math);
                if (Etaylor > maxEtaylor) {
                    maxEtaylor = Etaylor;
                    maxEXtaylor = x;
                }
                // Remez
                const remez = calcCoef(coefsRemez, false, x);
                const Eremez = Math.abs(remez - math);
                if (Eremez > maxEremez) {
                    maxEremez = Eremez;
                    maxEXremez = x;
                }
                console.log("x = " + x.toFixed(fixed) + ", " + curFun.name + " = " + math.toFixed(fixed)
                    + ", [taylor = " + taylor.toFixed(fixed) + ", E = " + Etaylor.toFixed(fixed) + "]"
                    + ", [remez = " + remez.toFixed(fixed) + ", E = " + Eremez.toFixed(fixed) + "]");
            }
            console.log("maxEtaylorX = " + maxEXtaylor.toFixed(fixed) + ", maxEtaylor = " + maxEtaylor.toFixed(fixed));
            console.log("maxEremezX = " + maxEXremez.toFixed(fixed) + ", maxEremez = " + maxEremez.toFixed(fixed)
                + ", calcCoefsRemez = " + coefsRemez
            );
        }
    }

    if (doPrecUnary) {
        console.log("\nUNARY FUNCTIONS");
        const parms = [

            // basic
            // test
            //{	name: "pow4a",	op: (n) => n * n * n * n,fOp : FMathInst.pow4a.bind(FMathInst),	errRatio: 4},
            //{	name: "pow4b",	op: (n) => n * n * n * n,fOp : FMathInst.pow4b.bind(FMathInst),	errRatio: 4},
            //{	name: "pow8a",	op: (n) => n ** 8,		fOp : FMathInst.pow8a.bind(FMathInst),	errRatio: 4},
            //{	name: "pow8b",	op: (n) => n ** 8,		fOp : FMathInst.pow8b.bind(FMathInst),	errRatio: 4},
            /*
            {	name: "neg",	op: (n) => -n,			fOp : FMathInst.neg.bind(FMathInst),	errRatio: .5},
            {	name: "abs",	op: (n) => Math.abs(n),	fOp : FMathInst.abs.bind(FMathInst),	errRatio: .5},
            {	name: "sign",	op: (n) => Math.sign(n),fOp : FMathInst.sign.bind(FMathInst),	errRatio: .5},
            {	name: "trunc",	op: (n) => Math.trunc(n),fOp : FMathInst.trunc.bind(FMathInst),	errRatio: .5},
            {	name: "floor",	op: (n) => Math.floor(n),fOp : FMathInst.floor.bind(FMathInst),	errRatio: .5},
            {	name: "ceil",	op: (n) => Math.ceil(n),fOp : FMathInst.ceil.bind(FMathInst),	errRatio: .5},
            {	name: "round",	op: (n) => Math.round(n),fOp : FMathInst.round.bind(FMathInst),	errRatio: .5},
            {	name: "inv",	op: (n) => n ? 1 / n : 0,fOp : FMathInst.inv.bind(FMathInst),	errRatio: .5},
            */
            // roots 
            
            //{	name: "sqrt",	op: (n) => n > 0 ? Math.sqrt(n) : 0,fOp : FMathInst.sqrt.bind(FMathInst),	errRatio: 20},
            {	name: "cbrt",	op: (n) => Math.cbrt(n),fOp : FMathInst.cbrt.bind(FMathInst),	errRatio: 300},
            
            // trigonometric
            /*
            {	name: "sin",	op: (n) => Math.sin(n),fOp : FMathInst.sin.bind(FMathInst),	errRatio: 5},
            {	name: "cos",	op: (n) => Math.cos(n),fOp : FMathInst.cos.bind(FMathInst),	errRatio: 5},
            {	name: "tan",	op: (n) => Math.tan(n),fOp : FMathInst.tan.bind(FMathInst),	errRatio: 25}, // remez

            {	name: "asin",	op: (n) => Math.abs(n) > 1 ? 0 : Math.asin(n),fOp : FMathInst.asin.bind(FMathInst),	errRatio: 100},
            {	name: "acos",	op: (n) => Math.abs(n) > 1 ? 0 : Math.acos(n),fOp : FMathInst.acos.bind(FMathInst),	errRatio: 250},
            {	name: "atan",	op: (n) => Math.atan(n),fOp : FMathInst.atan.bind(FMathInst),	errRatio: 15},
            */
            // exponents, logarithms
            /*
            {	name: "exp",	op: (n) => Math.exp(n),fOp : FMathInst.exp.bind(FMathInst),	errRatio: 25},
            {	name: "log",	op: (n) => n > 3 / 32 ? Math.log(n) : 0, fOp : FMathInst.log.bind(FMathInst),	errRatio: 40},
            {	name: "log10",	op: (n) => n > 3 / 32 ? Math.log10(n) : 0, fOp : FMathInst.log10.bind(FMathInst),	errRatio: 40},
            {	name: "log2",	op: (n) => n > 3 / 32 ? Math.log2(n) : 0, fOp : FMathInst.log2.bind(FMathInst),	errRatio: 40},
            */
            // hyperbolic
            /*
            {	name: "sinh",	op: (n) => Math.sinh(n),fOp : FMathInst.sinh.bind(FMathInst),	errRatio: 40},
            {	name: "cosh",	op: (n) => Math.cosh(n),fOp : FMathInst.cosh.bind(FMathInst),	errRatio: 40},
            {	name: "tanh",	op: (n) => Math.tanh(n),fOp : FMathInst.tanh.bind(FMathInst),	errRatio: 25},
            
            //asinh NYI
            //acosh NYI
            //{	name: "atanh",	op: (n) => Math.abs(n) < 15 / 16 ? Math.atanh(n): 0,fOp : FMathInst.atanh.bind(FMathInst),	errRatio: 25},
            // //{	name: "atanh",	op: (n) => Math.atanh(n), fOp: FMathInst.atanh.bind(FMathInst),	errRatio: 25},
            */

            // misc
            //{	name: "random",	op: (n) => Math.random(), fOp : FMathInst.random.bind(FMathInst),	errRatio: 60000},
        ];
        const stepP = FMathInst.epsilonNum * 2 ** skipP;
        for (const parm of parms) {
            console.log("\n======== do prec " + parm.name);
            let maxErrRat = 0;
            let maxStr = "100% ACCURATE !!";
            let minX = Number.NaN;
            let minVal = Number.MAX_VALUE;
            let maxX = Number.NaN;
            let maxVal = -Number.MAX_VALUE;
            let zeroVal = Number.NaN;
            let firstval = Number.NaN;
            let lastVal = Number.NaN;
            const fc = FMathInst.create();
            const startA = positiveOnly ? 0 : -FMathInst.overNum;
            const endA = FMathInst.overNum;
            const timeLoopStart = performance.now();
            for (let a = startA; a <= endA; a += stepP) {
                const fa = FMathInst.create(a);
                //const c = a ? parm.op(a) : 0;
                const c = parm.op(a); // float
                parm.fOp(fc, fa); // fixed
                const nfc = FMathInst.toNumber(fc);
                if (a == startA) {
                    firstval = nfc;
                }
                if (a == endA) {
                    lastVal = nfc;
                }
                if (a == 0) {
                    zeroVal = nfc;
                }
                if (nfc < minVal) {
                    minVal = nfc;
                    minX = a;
                }
                if (nfc > maxVal) {
                    maxVal = nfc;
                    maxX = a;
                }
                const delta = c - nfc;
                const absDelta = Math.abs(delta);
                const {rat: errRat, shift} = calcErrRatio(c, absDelta, FMathInst.epsilonNum);
                //const errRat = absDelta / FMathInst.epsilonNum;
                let str = "check absDelta " + parm.name + "(" + FMathInst.toPrettyString(fa)
                        + ") = " + FMathInst.toPrettyString(fc) + ", n = " + c.toFixed(5)
                        + ", delta = " + delta.toFixed(5) 
                        + ", errorRatio" + shift + " = " + errRat.toFixed(5)
                        + ", errorThreshold = " + parm.errRatio.toFixed(5);
                if (errRat > maxErrRat) {
                    maxErrRat = errRat;
                    maxStr = str;
                }
                // half an epsilon is good (errRatio == .5) // lower is better, more than 1 is worse
                if (errRat > parm.errRatio) {
                    console.error(str);
                } else {
                    if (doVerbose) {
                        console.log(str);
                    }
                }
            }
            const timeLoopEnd = performance.now();
            console.log("  max error: " + maxStr);
            console.log("    min val(" + minX + ") = " + minVal + ", max val(" + maxX + ") = " + maxVal + ", zero val(0) = " + zeroVal
                + ", first val(" + startA + ") = " + firstval + ", last val(" + endA + ") = " + lastVal);
            console.log("time in seconds = " + (timeLoopEnd - timeLoopStart) / 1000);
        }
    }
    if (doPrecBinary) {
        console.log("BINARY FUNCTIONS");
        const parms = [
            //{	name: "add",	op: (a, b) => a + b,        fOp : FMathInst.add.bind(FMathInst),	errRatio: .125},
            //{	name: "sub",	op: (a, b) => a - b,        fOp : FMathInst.sub.bind(FMathInst),	errRatio: .125},
            //{	name: "mul",	op: (a, b) => a * b,        fOp : FMathInst.mul.bind(FMathInst),	errRatio: .75},
            {	name: "div",	op: (a, b) => b ? a / b : 0,        fOp : FMathInst.div.bind(FMathInst),	errRatio: 1.25},
            {	name: "mod",	op: (a, b) => b ? a % b : 0,        fOp : FMathInst.mod.bind(FMathInst),	errRatio: .125},
            /*
            {	name: "min",	op: (a, b) => a < b ? a : b,        fOp : FMathInst.min.bind(FMathInst),	errRatio: .125},
            {	name: "max",	op: (a, b) => a > b ? a : b,        fOp : FMathInst.max.bind(FMathInst),	errRatio: .125},

            {	name: "hypot",	op: (a, b) => Math.sqrt(a * a + b * b),fOp : FMathInst.hypot.bind(FMathInst),	errRatio: 16}, */
            //{	name: "pow",	op: (b, e) => b > 3 / 32 ? Math.pow(b, e) : 0,fOp : FMathInst.pow.bind(FMathInst),	errRatio: 43000},
            //{	name: "atan2",	op: (y, x) => Math.atan2(y, x),fOp : FMathInst.atan2.bind(FMathInst),	errRatio: 2},
        ];
        const stepP = FMathInst.epsilonNum * 2 ** skipP;
        for (const parm of parms) {
            console.log("======== do prec " + parm.name);
            let maxErrRat = 0;
            let maxStr = "100% ACCURATE !!";
            const fc = FMathInst.create();
            for (let b = -FMathInst.overNum; b <= FMathInst.overNum; b += stepP) {
                //if (b == 0) {
                //    continue;
                //}
                const fb = FMathInst.create(b);
                for (let a = -FMathInst.overNum; a <= FMathInst.overNum; a += stepP) {
                    const fa = FMathInst.create(a);
                    const c = parm.op(a, b); // float
                    parm.fOp(fc, fa, fb); // fixed
                    const nfc = FMathInst.toNumber(fc);
                    const delta = c - nfc
                    const absDelta = Math.abs(delta);
                    //const errRat = absDelta / FMathInst.epsilonNum;
                    const {rat: errRat, shift} = calcErrRatio(c, absDelta, FMathInst.epsilonNum);
                    let str = "check absDelta " + parm.name + "(" + FMathInst.toPrettyString(fa)
                            + ", " + FMathInst.toPrettyString(fb)
                            + ") = " + FMathInst.toPrettyString(fc) + ", n = " + c.toFixed(5)
                            + ", delta = " + delta.toFixed(5) 
                            + ", errorRat = " + errRat.toFixed(5)
                            + ", errorThreshold = " + parm.errRatio.toFixed(5);
                if (errRat > maxErrRat) {
                    maxErrRat = errRat;
                    maxStr = str;
                }
                    // half an epsilon is good (errRatio == .5) // lower is better, more than 1 is worse
                if (errRat > parm.errRatio) {
                        console.error(str);
                    } else {
                        if (doVerbose) {
                            console.log(str);
                        }
                    }
                }
            }
            console.log("  max error: " + maxStr);
        }
    }
    if (testConstants) {
        console.log("\n========\ntest constants");
        for (const cName of FMathInst.constNames) {
            let n = FMathInst.constNumbers[cName]; // Number
            if (n === undefined) {
                n = 0;
            }
            let f = FMathInst[cName]; // frac object
            if (f === undefined) {
                f = FMathInst.create();
            }
            const fts = FMathInst.toPrettyString(f);
            const absDelta = Math.abs(n - FMathInst.toNumber(f));
            const errRatio = absDelta / FMathInst.epsilonNum;
            if (errRatio > .5) {
                console.error("test constants, error ratio > .5");
            }
            console.log(cName + " n = " + n.toFixed(6)
                + ", ft" + fracP + " = " + fts
                + " del = " + absDelta.toFixed(6)
                + " errRatio = " + errRatio.toFixed(6)
            );
        }
    //}
    console.log("========\nEND test constants");
    }
    console.log("end testFMath");
}
