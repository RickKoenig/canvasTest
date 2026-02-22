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

function unitTest(intP, fracP, displayP, positiveOnly, doChebyshev, funs) {
    const skipP = intP + fracP - displayP;
    const FMath = FMathBigIntInstance; // static, uses BigInt, interface
    const FMathInst = new FMath(intP, fracP); // instance

    console.log("begin testFMath");
    console.log(`intBits = ${FMathInst.intBits}, fracBits = ${FMathInst.fracBits}, version = ${FMathInst.version}`);
    console.log("epsilonNum = " + FMathInst.epsilonNum);
    console.log("overNum = " + FMathInst.overNum);

    const testMinMax = false;
    const doVerbose = true;
    const testConstants = false;
    const doPrecUnary = true;
    const doPrecBinary = false;

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
            /*
            // basic
            {	name: "neg",	op: (n) => -n,			fOp : FMathInst.neg.bind(FMathInst),	errRatio: .5},
            {	name: "abs",	op: (n) => Math.abs(n),	fOp : FMathInst.abs.bind(FMathInst),	errRatio: .5},
            {	name: "sign",	op: (n) => Math.sign(n),fOp : FMathInst.sign.bind(FMathInst),	errRatio: .5},
            {	name: "trunc",	op: (n) => Math.trunc(n),fOp : FMathInst.trunc.bind(FMathInst),	errRatio: .5},
            {	name: "floor",	op: (n) => Math.floor(n),fOp : FMathInst.floor.bind(FMathInst),	errRatio: .5},
            {	name: "ceil",	op: (n) => Math.ceil(n),fOp : FMathInst.ceil.bind(FMathInst),	errRatio: .5},
            {	name: "round",	op: (n) => Math.round(n),fOp : FMathInst.round.bind(FMathInst),	errRatio: .5},
            {	name: "inv",	op: (n) => n ? 1 / n : 0,fOp : FMathInst.inv.bind(FMathInst),	errRatio: .5},
            // roots
            {	name: "sqrt",	op: (n) => n > 0 ? Math.sqrt(n) : 0,fOp : FMathInst.sqrt.bind(FMathInst),	errRatio: 5},
            {	name: "cbrt",	op: (n) => Math.cbrt(n),fOp : FMathInst.cbrt.bind(FMathInst),	errRatio: 30},
*/
            // trigonometric
            {	name: "sin",	op: (n) => Math.sin(n),fOp : FMathInst.sin.bind(FMathInst),	errRatio: 4},
            {	name: "sinR",	op: (n) => Math.sin(n),fOp : FMathInst.sinR.bind(FMathInst),errRatio: 4},
            {	name: "cos",	op: (n) => Math.cos(n),fOp : FMathInst.cos.bind(FMathInst),	errRatio: 8},
            {	name: "cosR",	op: (n) => Math.cos(n),fOp : FMathInst.cosR.bind(FMathInst),	errRatio: 4},
            {	name: "tanR",	op: (n) => Math.tan(n),fOp : FMathInst.tanR.bind(FMathInst),	errRatio: 250}, // remez

            {	name: "asinR",	op: (n) => Math.abs(n) > 1 ? 0 : Math.asin(n),fOp : FMathInst.asinR.bind(FMathInst),	errRatio: 150},
            {	name: "acosR",	op: (n) => Math.abs(n) > 1 ? 0 : Math.acos(n),fOp : FMathInst.acosR.bind(FMathInst),	errRatio: 150},
            {	name: "atanR",	op: (n) => Math.atan(n),fOp : FMathInst.atan.bind(FMathInst),	errRatio: 15},
            // exponents, logarithms
            /*
            {	name: "exp",	op: (n) => Math.exp(n),fOp : FMathInst.exp.bind(FMathInst),	errRatio: 25},
            {	name: "log",	op: (n) => n > 3 / 32 ? Math.log(n) : 0, fOp : FMathInst.log.bind(FMathInst),	errRatio: 40},
            {	name: "log10",	op: (n) => n > 3 / 32 ? Math.log10(n) : 0, fOp : FMathInst.log10.bind(FMathInst),	errRatio: 40},
            {	name: "log2",	op: (n) => n > 3 / 32 ? Math.log2(n) : 0, fOp : FMathInst.log2.bind(FMathInst),	errRatio: 40},
            // hyperbolic
            {	name: "sinh",	op: (n) => Math.sinh(n),fOp : FMathInst.sinh.bind(FMathInst),	errRatio: 40},
            {	name: "cosh",	op: (n) => Math.cosh(n),fOp : FMathInst.cosh.bind(FMathInst),	errRatio: 40},
            {	name: "tanh",	op: (n) => Math.tanh(n),fOp : FMathInst.tanh.bind(FMathInst),	errRatio: 25},
            //asinh
            //acosh
            */
            //{	name: "atanh",	op: (n) => Math.abs(n) < 15 / 16 ? Math.atanh(n): 0,fOp : FMathInst.atanh.bind(FMathInst),	errRatio: 25},
            // //{	name: "atanh",	op: (n) => Math.atanh(n), fOp: FMathInst.atanh.bind(FMathInst),	errRatio: 25},

            //{	name: "random",	op: (n) => Math.random(), fOp : FMathInst.random.bind(FMathInst),	errRatio: 60000},
        ];
        const stepP = FMathInst.epsilonNum * 2 ** skipP;
        for (const parm of parms) {
            console.log("\n======== do prec " + parm.name);
            let maxAbsDelta = 0;
            let maxStr = "100% ACCURATE !!";
            const errRatio = parm.errRatio; // get to the best number
            const fc = FMathInst.create();
            const startA = positiveOnly ? 0 : -FMathInst.overNum;
            for (let a = startA; a <= FMathInst.overNum; a += stepP) {
                const fa = FMathInst.create(a);
                //const c = a ? parm.op(a) : 0;
                const c = parm.op(a);
                parm.fOp(fc, fa);
                const nfc = FMathInst.toNumber(fc);
                const delta = c - nfc
                const absDelta = Math.abs(delta);
                let str = "check absDelta " + parm.name + "(" + FMathInst.toPrettyString(fa)
                        + ") = " + FMathInst.toPrettyString(fc) + ", n = " + c.toFixed(5)
                        + ", delta = " + delta.toFixed(5) 
                        + ", errorRatio = " + (absDelta / FMathInst.epsilonNum).toFixed(5)
                        + ", errorThreshold = " + parm.errRatio.toFixed(5);
                if (absDelta > maxAbsDelta) {
                    maxAbsDelta = absDelta;
                    maxStr = str;
                }
                // half an epsilon is good (errRatio == .5) // lower is better, more than 1 is worse
                if (absDelta > errRatio * FMathInst.epsilonNum) {
                    console.error(str);
                } else {
                    if (doVerbose) {
                        console.log(str);
                    }
                }
            }
            console.log("  max error: " + maxStr);
        }
    }
    if (doPrecBinary) {
        console.log("BINARY FUNCTIONS");
        const parms = [
           /* {	name: "add",	op: (a, b) => a + b,        fOp : FMathInst.add.bind(FMathInst),	errRatio: .125},
            {	name: "sub",	op: (a, b) => a - b,        fOp : FMathInst.sub.bind(FMathInst),	errRatio: .125},
            {	name: "mul",	op: (a, b) => a * b,        fOp : FMathInst.mul.bind(FMathInst),	errRatio: .75},
            {	name: "div",	op: (a, b) => b ? a / b : 0,        fOp : FMathInst.div.bind(FMathInst),	errRatio: 1.25},
            {	name: "mod",	op: (a, b) => b ? a % b : 0,        fOp : FMathInst.mod.bind(FMathInst),	errRatio: .125},

            {	name: "min",	op: (a, b) => a < b ? a : b,        fOp : FMathInst.min.bind(FMathInst),	errRatio: .125},
            {	name: "max",	op: (a, b) => a > b ? a : b,        fOp : FMathInst.max.bind(FMathInst),	errRatio: .125},

            {	name: "hypot",	op: (a, b) => Math.sqrt(a * a + b * b),fOp : FMathInst.hypot.bind(FMathInst),	errRatio: 16}, */
            {	name: "pow",	op: (b, e) => b > 3 / 32 ? Math.pow(b, e) : 0,fOp : FMathInst.pow.bind(FMathInst),	errRatio: 2000},
            {	name: "atan2",	op: (y, x) => Math.atan2(y, x),fOp : FMathInst.atan2.bind(FMathInst),	errRatio: 2},
        ];
        const stepP = FMathInst.epsilonNum * 2 ** skipP;
        for (const parm of parms) {
            console.log("======== do prec " + parm.name);
            let maxAbsDelta = 0;
            let maxStr = "100% ACCURATE !!";
            const errRatio = parm.errRatio; // get to the best number
            const fc = FMathInst.create();
            for (let b = -FMathInst.overNum; b <= FMathInst.overNum; b += stepP) {
                //if (b == 0) {
                //    continue;
                //}
                const fb = FMathInst.create(b);
                for (let a = -FMathInst.overNum; a <= FMathInst.overNum; a += stepP) {
                    const fa = FMathInst.create(a);
                    const c = parm.op(a, b);
                    parm.fOp(fc, fa, fb);
                    const nfc = FMathInst.toNumber(fc);
                    const delta = c - nfc
                    const absDelta = Math.abs(delta);
                    let str = "check absDelta " + parm.name + "(" + FMathInst.toPrettyString(fa)
                            + ", " + FMathInst.toPrettyString(fb)
                            + ") = " + FMathInst.toPrettyString(fc) + ", n = " + c.toFixed(5)
                            + ", delta = " + delta.toFixed(5) 
                            + ", errorRatio = " + (absDelta / FMathInst.epsilonNum).toFixed(5)
                            + ", errorThreshold = " + parm.errRatio.toFixed(5);
                    if (absDelta > maxAbsDelta) {
                        maxAbsDelta = absDelta;
                        maxStr = str;
                    }
                    // half an epsilon is good (errRatio == .5) // lower is better, more than 1 is worse
                    if (absDelta > errRatio * FMathInst.epsilonNum) {
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
