'use strict';

function unitTest(intP, fracP) {
    //const FMath = FMathNum; // static 
    //const FMath = FMathBigInt; // static
    const FMath = FMathBigIntInstance; // static
    const FMathInst = new FMath(intP, fracP); // instance

    console.log("begin testFMath");
    console.log(`intBits = ${FMathInst.intBits}, fracBits = ${FMathInst.fracBits}, version = ${FMathInst.version}`);
    console.log("epsilonNum = " + FMathInst.epsilonNum);
    console.log("overNum = " + FMathInst.overNum);

    const doVerbose = false;
    const testConstants = false;
    const docreate = false;
    const doPrecUnary = true;
    const doPrecBinary = false;

    if (docreate) {
        console.log("do create");
        for (let n = -FMathInst.overNum; n <= FMathInst.overNum; n += FMathInst.epsilonNum * .25) {
            const f = FMathInst.create(n);
            console.log("n = " + FMathInst.numberToPrettyString(n) 
                + ", f = " + FMathInst.toPrettyString(f)
                + '  #');
        }
    }
    if (doPrecUnary) {
        console.log("UNARY FUNCTIONS");
        const parms = [
            {	name: "neg",	op: (n) => -n,			fOp : FMathInst.neg.bind(FMathInst),	errRatio: .5},
            {	name: "abs",	op: (n) => Math.abs(n),	fOp : FMathInst.abs.bind(FMathInst),	errRatio: .5},
            {	name: "sign",	op: (n) => Math.sign(n),fOp : FMathInst.sign.bind(FMathInst),	errRatio: .5},
            {	name: "trunc",	op: (n) => Math.trunc(n),fOp : FMathInst.trunc.bind(FMathInst),	errRatio: .5},
            {	name: "floor",	op: (n) => Math.floor(n),fOp : FMathInst.floor.bind(FMathInst),	errRatio: .5},
            {	name: "ceil",	op: (n) => Math.ceil(n),fOp : FMathInst.ceil.bind(FMathInst),	errRatio: .5},
            {	name: "round",	op: (n) => Math.round(n),fOp : FMathInst.round.bind(FMathInst),	errRatio: .5},
            {	name: "inv",	op: (n) => n ? 1 / n : 0,fOp : FMathInst.inv.bind(FMathInst),	errRatio: .5},
            
            {	name: "sqrt",	op: (n) => n > 0 ? Math.sqrt(n) : 0,fOp : FMathInst.sqrt.bind(FMathInst),	errRatio: 5},
            {	name: "cbrt",	op: (n) => Math.cbrt(n),fOp : FMathInst.cbrt.bind(FMathInst),	errRatio: 30},

            {	name: "sin",	op: (n) => Math.sin(n),fOp : FMathInst.sin.bind(FMathInst),	errRatio: 4},
            {	name: "cos",	op: (n) => Math.cos(n),fOp : FMathInst.cos.bind(FMathInst),	errRatio: 4},
            
            {	name: "tan",	op: (n) => // skip angles close to 90 degrees
                    Math.abs(Math.abs(n) % Math.PI - Math.PI / 2) >= 2 / 8 * Math.PI / 2
                 ? Math.tan(n) 
                 : 0
                 ,fOp : FMathInst.tan.bind(FMathInst),	errRatio: 200}, // slightly broken
            //asin
            //acos
            {	name: "atan",	op: (n) => Math.atan(n),fOp : FMathInst.atan.bind(FMathInst),	errRatio: 15},

            
            {	name: "exp",	op: (n) => Math.exp(n),fOp : FMathInst.exp.bind(FMathInst),	errRatio: 25},
            {	name: "log",	op: (n) => n > 3 / 32 ? Math.log(n) : 0, fOp : FMathInst.log.bind(FMathInst),	errRatio: 40},
            {	name: "log10",	op: (n) => n > 3 / 32 ? Math.log10(n) : 0, fOp : FMathInst.log10.bind(FMathInst),	errRatio: 40},
            {	name: "log2",	op: (n) => n > 3 / 32 ? Math.log2(n) : 0, fOp : FMathInst.log2.bind(FMathInst),	errRatio: 40},
            
            {	name: "sinh",	op: (n) => Math.sinh(n),fOp : FMathInst.sinh.bind(FMathInst),	errRatio: 40},
            {	name: "cosh",	op: (n) => Math.cosh(n),fOp : FMathInst.cosh.bind(FMathInst),	errRatio: 40},
            {	name: "tanh",	op: (n) => Math.tanh(n),fOp : FMathInst.tanh.bind(FMathInst),	errRatio: 25},
            //asinh
            //acosh
            //atanh

            {	name: "random",	op: (n) => Math.random(), fOp : FMathInst.random.bind(FMathInst),	errRatio: 60000},
        ];
        for (const parm of parms) {
            console.log("======== do prec " + parm.name);
            let maxAbsDelta = 0;
            let maxStr = "100% ACCURATE !!";
            const errRatio = parm.errRatio; // get to the best number
            const fc = FMathInst.create();
            for (let a = -FMathInst.overNum; a <= FMathInst.overNum; a += FMathInst.epsilonNum) {
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
            {	name: "add",	op: (a, b) => a + b,        fOp : FMathInst.add.bind(FMathInst),	errRatio: .125},
            {	name: "sub",	op: (a, b) => a - b,        fOp : FMathInst.sub.bind(FMathInst),	errRatio: .125},
            {	name: "mul",	op: (a, b) => a * b,        fOp : FMathInst.mul.bind(FMathInst),	errRatio: .75},
            {	name: "div",	op: (a, b) => b ? a / b : 0,        fOp : FMathInst.div.bind(FMathInst),	errRatio: 1.25},
            {	name: "mod",	op: (a, b) => b ? a % b : 0,        fOp : FMathInst.mod.bind(FMathInst),	errRatio: .125},

            {	name: "min",	op: (a, b) => a < b ? a : b,        fOp : FMathInst.min.bind(FMathInst),	errRatio: .125},
            {	name: "max",	op: (a, b) => a > b ? a : b,        fOp : FMathInst.max.bind(FMathInst),	errRatio: .125},

            {	name: "hypot",	op: (a, b) => Math.sqrt(a * a + b * b),fOp : FMathInst.hypot.bind(FMathInst),	errRatio: 16},
            {	name: "pow",	op: (b, e) => b > 3 / 32 ? Math.pow(b, e) : 0,fOp : FMathInst.pow.bind(FMathInst),	errRatio: 2000},
            {	name: "atan2",	op: (y, x) => Math.atan2(y, x),fOp : FMathInst.atan2.bind(FMathInst),	errRatio: 2},
        ];
        for (const parm of parms) {
            console.log("======== do prec " + parm.name);
            let maxAbsDelta = 0;
            let maxStr = "100% ACCURATE !!";
            const errRatio = parm.errRatio; // get to the best number
            const fc = FMathInst.create();
            for (let b = -FMathInst.overNum; b <= FMathInst.overNum; b += FMathInst.epsilonNum) {
                //if (b == 0) {
                //    continue;
                //}
                const fb = FMathInst.create(b);
                for (let a = -FMathInst.overNum; a <= FMathInst.overNum; a += FMathInst.epsilonNum) {
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
