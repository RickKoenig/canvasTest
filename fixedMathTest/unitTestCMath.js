'use strict';

function unitTestCMath(intP, fracP, displayP, positiveOnly) {
    //const FMath = FMathBigIntInstance; // static, uses BigInt, interface
    //const FMathInst = new FMath(intP, fracP); // instance

    const mulFracFactor = 2 ** fracP;
    const epsilonNum = 1 / mulFracFactor;
    const overNum = 2 ** (intP - 1);

    console.log("\n\nbegin testFMath CMATH");
    console.log("epsilonNum = " + epsilonNum);
    console.log("overNum = -" + overNum + " to " + overNum);

    const doVerbose = false;
    const doPrecUnary = true;
    const doPrecBinary = true;

    if (doPrecUnary) {
        console.log("\nUNARY FUNCTIONS");
        const parms = [
            /*
            // roots 
            {	name: "sqrt",	op: (n) => n > 0 ? Math.sqrt(n) : 0, cOp : (n) => CMath.sqrt(n),	errRatio: 2},
            {	name: "cbrt",	op: (n) => Math.cbrt(n),cOp : (n) => CMath.cbrt(n),	errRatio: 2},
            */
            /*
            // trigonometric
            {	name: "sin",	op: (n) => Math.sin(n), cOp : (n) => CMath.sin(n),	errRatio: 5},
            {	name: "cos",	op: (n) => Math.cos(n), cOp : (n) => CMath.cos(n), 	errRatio: 5},
            {	name: "tan",	op: (n) => Math.tan(n), cOp : (n) => CMath.tan(n),	errRatio: 100}, // remez

            {	name: "asin",	op: (n) => Math.abs(n) > 1 ? 0 : Math.asin(n), cOp : (n) => CMath.asin(n),	errRatio: 100},
            {	name: "acos",	op: (n) => Math.abs(n) > 1 ? 0 : Math.acos(n), cOp : (n) => CMath.acos(n),	errRatio: 100},
            {	name: "atan",	op: (n) => Math.atan(n), cOp: (n) => CMath.atan(n),	errRatio: 10},
            */
            /*
            // exponents, logarithms
            {	name: "exp",	op: (n) => Math.exp(n), cOp : (n) => CMath.exp(n),	errRatio: 5},
            {	name: "log",	op: (n) => n > 1 / 16 ? Math.log(n) : 0, cOp : (n) => CMath.log(n),	errRatio: 2},
            {	name: "log10",	op: (n) => n > 1 / 16 ? Math.log10(n) : 0, cOp : (n) => CMath.log10(n),	errRatio: 2},
            {	name: "log2",	op: (n) => n > 1 / 16 ? Math.log2(n) : 0, cOp : (n) => CMath.log2(n),	errRatio: 2},
            */
            /*
            // hyperbolic
            {	name: "sinh",	op: (n) => Math.sinh(n), cOp : (n) => CMath.sinh(n),	errRatio: 10},
            {	name: "cosh",	op: (n) => Math.cosh(n), cOp : (n) => CMath.cosh(n),	errRatio: 10},
            {	name: "tanh",	op: (n) => Math.tanh(n), cOp : (n) => CMath.tanh(n),	errRatio: 5},
            //asinh NYI
            //acosh NYI
            {	name: "atanh",	op: (n) => Math.abs(n) < 15 / 16 ? Math.atanh(n): 0, cOp : (n) => CMath.atanh(n),	errRatio: 25},
            */
        ];

        let skipP = intP + fracP - displayP;
        if (skipP < 0) {
            skipP = 0; // full display
        }
        if (displayP <=0) { // full display
            skipP = 0;
        }
        const stepP = epsilonNum * 2 ** skipP;
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
            const startA = positiveOnly ? 0 : -overNum;
            const endA = overNum;
            const timeLoopStart = performance.now();
            let count = 0;
            for (let a = startA; a <= endA; a += stepP) {
                ++count;
                const nf = parm.op(a); // float
                const nfc = parm.cOp(a); // CMath
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
                const delta = nf - nfc;
                const absDelta = Math.abs(delta);
                const {rat: errRat, shift} = calcErrRatio(nf, absDelta, epsilonNum);
                let str = "check absDelta " + parm.name + "(" + a
                        + ") = " + nfc + ", n = " + nf.toFixed(5)
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
            //{	name: "hypot",	op: (a, b) => Math.sqrt(a * a + b * b), cOp : (a, b) => CMath.hypot(a, b),	errRatio: 2},
            //{	name: "pow",	op: (b, e) => b > 3 / 32 ? Math.pow(b, e) : 0, cOp : (b, e) => CMath.pow(b, e),	errRatio: 30},
            //{	name: "atan2",	op: (y, x) => Math.atan2(y, x), cOp : (y, x) => CMath.atan2(y, x),	errRatio: 10},
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
        const stepP = epsilonNum * 2 ** skipP;
        //const stepP2 = stepP * stepP;
        for (const parm of parms) {
            console.log("======== do prec " + parm.name);
            let maxErrRat = 0;
            let maxStr = "100% ACCURATE !!";
            const timeLoopStart = performance.now();
            let count = 0;
            for (let b = -overNum; b <= overNum; b += stepP) {
                //console.log("b = " + b);
                //if (b == 0) {
                //    continue;
                //}
                const fb = 0;
                for (let a = -overNum; a <= overNum; a += stepP) {
                    ++count;
                    const nf = parm.op(a, b); // float
                    const nfc = parm.cOp(a, b); // CMath
                    const delta = nf - nfc
                    const absDelta = Math.abs(delta);
                    const {rat: errRat, shift} = calcErrRatio(nf, absDelta, epsilonNum);
                    let str = "check absDelta " + parm.name + "(" + a
                            + ", " + b
                            + ") = " + nfc + ", n = " + nf.toFixed(5)
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
    console.log("end testFMath CMath");
}
