'use strict';

function unitTest(intP, fracP, displayP, positiveOnly, doChebyshev, funs) {
    const FMath = FMathBigIntInstanceALT; // static, uses BigInt, interface
    const FMathInst = new FMath(intP, fracP); // instance

    console.log("begin testFMath");
    console.log(`masterBits = ${FMath.masterFrac}, guardBits (when needed) = ${FMath.guardFrac}`);
    console.log(`intBits = ${FMathInst.intBits}, fracBits = ${FMathInst.fracBits}, version = ${FMathInst.version}`);
    console.log("epsilonNum = " + FMathInst.epsilonNum);
    console.log("overNum = -" + FMathInst.overNum + " to " + FMathInst.overNum);

    const testCalcCoefFix = false;
    const doVerbose = false;
    const testConstants = false;
    const doPrecUnary = false;
    const doPrecBinary = false;

    if (testCalcCoefFix) {
        console.log("\nTEST CALC COEF FIX");
        const poly = [
            // 2x^2 + 3x + 5
            FMathInst.create(5),
            FMathInst.create(3),
            FMathInst.create(2)
        ];
        const x = FMathInst.create(10);
        console.log(FMathInst.toPrettyString(x));
        let y = FMathInst.mul(x, FMathInst.THREE);
        console.log(FMathInst.toPrettyString(y));
        y = FMathInst.calcCoefFix(x, poly);
        console.log(FMathInst.toPrettyString(y));
        y = FMathInst.calcCoefFix(y, poly);
        console.log(FMathInst.toPrettyString(y));
        console.log("should be 10, 30, 235, 111160");
    }

    if (doPrecUnary) {
        console.log("\nUNARY FUNCTIONS");
        const parms = [

            // basic
            {	name: "neg",	op: (n) => -n,			fOp : FMathInst.neg.bind(FMathInst),	errRatio: 0},
            {	name: "abs",	op: (n) => Math.abs(n),	fOp : FMathInst.abs.bind(FMathInst),	errRatio: 0},
            {	name: "sign",	op: (n) => Math.sign(n),fOp : FMathInst.sign.bind(FMathInst),	errRatio: 0},
            {	name: "trunc",	op: (n) => Math.trunc(n),fOp : FMathInst.trunc.bind(FMathInst),	errRatio: 0},
            {	name: "floor",	op: (n) => Math.floor(n),fOp : FMathInst.floor.bind(FMathInst),	errRatio: 0},
            {	name: "ceil",	op: (n) => Math.ceil(n),fOp : FMathInst.ceil.bind(FMathInst),	errRatio: 0},
            {	name: "round",	op: (n) => Math.round(n),fOp : FMathInst.round.bind(FMathInst),	errRatio: 0},
            {	name: "inv",	op: (n) => n ? 1 / n : 0,fOp : FMathInst.inv.bind(FMathInst),	errRatio: .5},

      
            // roots 
            {	name: "sqrt",	op: (n) => n > 0 ? Math.sqrt(n) : 0,fOp : FMathInst.sqrt.bind(FMathInst),	errRatio: 2},
            {	name: "cbrt",	op: (n) => Math.cbrt(n),fOp : FMathInst.cbrt.bind(FMathInst),	errRatio: 2},

         
            // trigonometric
            {	name: "sin",	op: (n) => Math.sin(n),fOp : FMathInst.sin.bind(FMathInst),	errRatio: 5},
            {	name: "cos",	op: (n) => Math.cos(n),fOp : FMathInst.cos.bind(FMathInst),	errRatio: 5},
            {	name: "tan",	op: (n) => Math.tan(n),fOp : FMathInst.tan.bind(FMathInst),	errRatio: 100}, // remez

            {	name: "asin",	op: (n) => Math.abs(n) > 1 ? 0 : Math.asin(n),fOp : FMathInst.asin.bind(FMathInst),	errRatio: 100},
            {	name: "acos",	op: (n) => Math.abs(n) > 1 ? 0 : Math.acos(n),fOp : FMathInst.acos.bind(FMathInst),	errRatio: 100},
            {	name: "atan",	op: (n) => Math.atan(n),fOp : FMathInst.atan.bind(FMathInst),	errRatio: 10},

          
            // exponents, logarithms
            {	name: "exp",	op: (n) => Math.exp(n),fOp : FMathInst.exp.bind(FMathInst),	errRatio: 5},
            {	name: "log",	op: (n) => n > 1 / 16 ? Math.log(n) : 0, fOp : FMathInst.log.bind(FMathInst),	errRatio: 2},
            {	name: "log10",	op: (n) => n > 1 / 16 ? Math.log10(n) : 0, fOp : FMathInst.log10.bind(FMathInst),	errRatio: 2},
            {	name: "log2",	op: (n) => n > 1 / 16 ? Math.log2(n) : 0, fOp : FMathInst.log2.bind(FMathInst),	errRatio: 2},


            // hyperbolic
            {	name: "sinh",	op: (n) => Math.sinh(n),fOp : FMathInst.sinh.bind(FMathInst),	errRatio: 10},
            {	name: "cosh",	op: (n) => Math.cosh(n),fOp : FMathInst.cosh.bind(FMathInst),	errRatio: 10},
            {	name: "tanh",	op: (n) => Math.tanh(n),fOp : FMathInst.tanh.bind(FMathInst),	errRatio: 5},

            //asinh NYI
            //acosh NYI
            {	name: "atanh",	op: (n) => Math.abs(n) < 15 / 16 ? Math.atanh(n): 0, fOp : FMathInst.atanh.bind(FMathInst),	errRatio: 25},

            // misc NYI, maybe some partial implementation
            {	name: "random",	op: (n) => Math.random(), fOp : FMathInst.random.bind(FMathInst),	errRatio: 100000}, // placeholder
        ];

        let skipP = intP + fracP - displayP;
        if (skipP < 0) {
            skipP = 0; // full display
        }
        if (displayP <=0) { // full display
            skipP = 0;
        }
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
            const startA = positiveOnly ? 0 : -FMathInst.overNum;
            const endA = FMathInst.overNum;
            const timeLoopStart = performance.now();
            let count = 0;
            //let a = -4; {
            for (let a = startA; a <= endA; a += stepP) {
                ++count;
                const fa = FMathInst.create(a);
                //const c = a ? parm.op(a) : 0;
                const c = parm.op(a); // float
                const fc = parm.fOp(fa); // fixed
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
            const usTime = 1000 * (timeLoopEnd - timeLoopStart) / count;
            console.log("time in microSeconds each function call = " +  usTime + ", call count = " + count
                + ", total time in seconds = " + (usTime * count) / 1000000);
        }
    }
    if (doPrecBinary) {
        console.log("\nBINARY FUNCTIONS");
        const parms = [
           
            {	name: "add",	op: (a, b) => a + b,        fOp : FMathInst.add.bind(FMathInst),	errRatio: .125},
            {	name: "sub",	op: (a, b) => a - b,        fOp : FMathInst.sub.bind(FMathInst),	errRatio: .125},
            {	name: "mul",	op: (a, b) => a * b,        fOp : FMathInst.mul.bind(FMathInst),	errRatio: .75},
            {	name: "div",	op: (a, b) => b ? a / b : 0,        fOp : FMathInst.div.bind(FMathInst),	errRatio: 1.25},
            {	name: "mod",	op: (a, b) => b ? a % b : 0,        fOp : FMathInst.mod.bind(FMathInst),	errRatio: .125},


            {	name: "min",	op: (a, b) => a < b ? a : b,        fOp : FMathInst.min.bind(FMathInst),	errRatio: .125},
            {	name: "max",	op: (a, b) => a > b ? a : b,        fOp : FMathInst.max.bind(FMathInst),	errRatio: .125},
          
        
            {	name: "hypot",	op: (a, b) => Math.sqrt(a * a + b * b),fOp : FMathInst.hypot.bind(FMathInst),	errRatio: 2},
            {	name: "pow",	op: (b, e) => b > 3 / 32 ? Math.pow(b, e) : 0,fOp : FMathInst.pow.bind(FMathInst),	errRatio: 30},
            {	name: "atan2",	op: (y, x) => Math.atan2(y, x),fOp : FMathInst.atan2.bind(FMathInst),	errRatio: 10},
           
        ];
        if (displayP > 1) {
            displayP >>= 1;
        }
        let skipP = intP + fracP - displayP;
        if (skipP < 0) {
            skipP = 0; // full display
        }
        if (displayP <=0) { // full display
            skipP = 0;
        }
        const stepP = FMathInst.epsilonNum * 2 ** skipP;
        //const stepP2 = stepP * stepP;
        for (const parm of parms) {
            console.log("======== do prec " + parm.name);
            let maxErrRat = 0;
            let maxStr = "100% ACCURATE !!";
            const timeLoopStart = performance.now();
            let count = 0;
            for (let b = -FMathInst.overNum; b <= FMathInst.overNum; b += stepP) {
                //console.log("b = " + b);
                //if (b == 0) {
                //    continue;
                //}
                const fb = FMathInst.create(b);
                for (let a = -FMathInst.overNum; a <= FMathInst.overNum; a += stepP) {
                    ++count;
                    const fa = FMathInst.create(a);
                    const c = parm.op(a, b); // float
                    const fc = parm.fOp(fa, fb); // fixed
                    const nfc = FMathInst.toNumber(fc);
                    const delta = c - nfc
                    const absDelta = Math.abs(delta);
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
            const timeLoopEnd = performance.now();
            console.log("  max error: " + maxStr);
            const usTime = 1000 * (timeLoopEnd - timeLoopStart) / count;
            console.log("time in microSeconds each function call = " +  usTime + ", call count = " + count
                + ", total time in seconds = " + (usTime * count) / 1000000);
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
