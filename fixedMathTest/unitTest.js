'use strict';

function unitTest(intP, fracP) {
    //const FMath = FMathNum; // static 
    //const FMath = FMathBigInt; // static
    const FMath = FMathBigIntInstance; // static
    const FMathInst = new FMath(intP, fracP); // instance

    console.log("begin testFMath");
    console.log(`intBits = ${FMathInst.intBits}, fracBits = ${FMathInst.fracBits}`);
    console.log("epsilonNum = " + FMathInst.epsilonNum);
    console.log("overNum = " + FMathInst.overNum);
    const docreate = false;
    const doUnary = true;
    const doPrecUnary = true;
    const doMul = false;
    const doPrecMul = false;
    const doDiv = false;
    const doPrecDiv = false;
    const doMod = false;
    const doPrecMod = false;
    const testConstants = false;

    if (docreate) {
        console.log("do create");
        for (let n = -FMathInst.overNum; n <= FMathInst.overNum; n += FMathInst.epsilonNum * .25) {
            const f = FMathInst.create(n);
            console.log("n = " + FMathInst.numberToPrettyString(n) 
                + ", f = " + FMathInst.toPrettyString(f)
                + '  #');
        }
    }
    if (doUnary) {
        console.log("do unary ops");
        const fNeg = FMathInst.create();
        const fAbs = FMathInst.create();
        const fSign = FMathInst.create();
        const fTrunc = FMathInst.create();
        const fFloor = FMathInst.create();
        const fCeil = FMathInst.create();
        const fRound = FMathInst.create();
        const fInv = FMathInst.create();
        const fSqrt = FMathInst.create();
        const fExp = FMathInst.create();
        for (let n = -FMathInst.overNum; n <= FMathInst.overNum; n += FMathInst.epsilonNum) {
            /*if (n == 0) {
                continue;
            }*/
            const f = FMathInst.create(n);
            FMathInst.neg(fNeg, f);
            FMathInst.abs(fAbs, f);
            FMathInst.sign(fSign, f);
            FMathInst.trunc(fTrunc, f);
            FMathInst.floor(fFloor, f);
            FMathInst.ceil(fCeil, f);
            FMathInst.round(fRound, f);
            FMathInst.inv(fInv, f);
            FMathInst.sqrt(fSqrt, f);
            FMathInst.exp(fExp, f);
            console.log("f = " + FMathInst.toPrettyString(f)
//					+ ",      fNeg = " + FMathInst.toPrettyString(fNeg)
//                + ",      fAbs = " + FMathInst.toPrettyString(fAbs)
//                + ",      fSign = " + FMathInst.toPrettyString(fSign)
                + ",      fTrunc = " + FMathInst.toPrettyString(fTrunc)
//					+ ",      fFloor = " + FMathInst.toPrettyString(fFloor)
//					+ ",      fCeil = " + FMathInst.toPrettyString(fCeil)
//					+ ",      fRound = " + FMathInst.toPrettyString(fRound)
                + ",      fInv = " + FMathInst.toPrettyString(fInv)
                + ",      fSqrt = " + FMathInst.toPrettyString(fSqrt)
                + ",      fExp = " + FMathInst.toPrettyString(fExp)
                + '  #');
        }
    }
    if (doPrecUnary) {
        const parms = [
            //{	name: "neg",	op: (n) => -n,			fOp : FMathInst.neg.bind(FMathInst),	errRatio: .5},
            //{	name: "abs",	op: (n) => Math.abs(n),	fOp : FMathInst.abs.bind(FMathInst),	errRatio: .5},
            //{	name: "sign",	op: (n) => Math.sign(n),fOp : FMathInst.sign.bind(FMathInst),	errRatio: .5},
            //{	name: "trunc",	op: (n) => Math.trunc(n),fOp : FMathInst.trunc.bind(FMathInst),	errRatio: .5},
            //{	name: "floor",	op: (n) => Math.floor(n),fOp : FMathInst.floor.bind(FMathInst),	errRatio: .5},
            //{	name: "ceil",	op: (n) => Math.ceil(n),fOp : FMathInst.ceil.bind(FMathInst),	errRatio: .5},
            //{	name: "round",	op: (n) => Math.round(n),fOp : FMathInst.round.bind(FMathInst),	errRatio: .5},
            //{	name: "inv",	op: (n) => 1 / n,		fOp : FMathInst.inv.bind(FMathInst),	errRatio: .5},
            //{	name: "sqrt",	op: (n) => n >= 0 ? Math.sqrt(n) : 0,fOp : FMathInst.sqrt.bind(FMathInst),	errRatio: 1},
            {	name: "exp",	op: (n) => Math.exp(n),fOp : FMathInst.exp.bind(FMathInst),	errRatio: 4},
        ];
        for (const parm of parms) {
            console.log("\n========\ndo prec " + parm.name);
            let maxAbsDelta = 0;
            let maxN = "---";
            let maxC = "---";
            let maxFn = "---";
            const errRatio = parm.errRatio; // get to the best number
            const fc = FMathInst.create();
            for (let b = -FMathInst.overNum; b <= FMathInst.overNum; b += FMathInst.epsilonNum) {
                const fb = FMathInst.create(b);
                //const c = b ? parm.op(b) : 0;
                const c = parm.op(b);
                parm.fOp(fc, fb);
                const nfc = FMathInst.toNumber(fc);
                const delta = c - nfc
                const absDelta = Math.abs(delta);
                if (absDelta > maxAbsDelta) {
                    maxAbsDelta = absDelta;
                    maxN = b;
                    maxC = c;
                    maxFn = clone(fc);
                }
                let str = "check absDelta " + parm.name + "(" + FMathInst.toPrettyString(fb)
                        + ") = " + FMathInst.toPrettyString(fc) + ", n = " + c.toFixed(5)
                        + ", delta = " + delta.toFixed(5);
                // half an epsilon is good (errRatio == .5) // lower is better, more than 1 is worse
                if (absDelta >= errRatio * FMathInst.epsilonNum) {
                    console.log(str);
                } else {
                    if (false) {
                        console.log(str);
                    }
                }
            }
            const maxFnStr = typeof maxFn == 'object' ? FMathInst.toPrettyString(maxFn) : "---";
            console.log("maxAbsDelta = " 
                + maxAbsDelta.toFixed(7) + ", max err ratio = " 
                + (maxAbsDelta / FMathInst.epsilonNum).toFixed(7) + " maxErrLocation: n = " + maxN);
            let str = "check absDelta " + parm.name + "(" + maxN
                    + ") = " + maxFnStr + ", result = " + maxC
                    + ", delta = " + maxAbsDelta.toFixed(5);
            // half an epsilon is good (errRatio == .5) // lower is better, more than 1 is worse
            console.log(str);
        }
    }
    if (doMul) {
        console.log("do binary op mul");
        const fc = FMathInst.create();
        for (let a = -FMathInst.overNum; a < FMathInst.overNum; a += FMathInst.epsilonNum) {
            const fa = FMathInst.create(a);
            for (let b = -FMathInst.overNum; b < FMathInst.overNum; b += FMathInst.epsilonNum) {
                const fb = FMathInst.create(b);
                FMathInst.mul(fc, fa, fb);
                console.log(FMathInst.toPrettyString(fa) + " * " + FMathInst.toPrettyString(fb)
                    + " = " + FMathInst.toPrettyString(fc));
            }
        }
    }
    // compare number with FMathInst
    if (doPrecMul) {
        console.log("do prec mul");
        let maxAbsDelta = 0;
        let maxA = 0;
        let maxB = 0;
        const errRatio = 2; // get to the best number
        const fc = FMathInst.create();
        for (let b = -FMathInst.overNum; b < FMathInst.overNum; b += FMathInst.epsilonNum) {
            const fb = FMathInst.create(b);
            for (let a = -FMathInst.overNum; a < FMathInst.overNum; a += FMathInst.epsilonNum) {
                const c = a * b;
                const fa = FMathInst.create(a);
                FMathInst.mul(fc, fa, fb);
                const nfc = FMathInst.toNumber(fc);
                const delta = c - nfc
                const absDelta = Math.abs(delta);
                if (absDelta > maxAbsDelta) {
                    maxAbsDelta = absDelta;
                    maxA = a;
                    maxB = b;
                }
                if (errRatio * absDelta > FMathInst.epsilonNum) {
                    console.error("Too much absDelta !! " + FMathInst.toPrettyString(fa) + " * " + FMathInst.toPrettyString(fb)
                        + " = " + FMathInst.toPrettyString(fc) + ",c = " + c.toFixed(5)
                        + ", delta = " + delta.toFixed(5));
                }
            }
        }
        console.log("maxAbsDelta = " + maxAbsDelta + ", max err ratio = " 
                + (maxAbsDelta / FMathInst.epsilonNum).toFixed(7) + ", maxA = " + maxA + ", maxB = " + maxB);
    }
    if (doDiv) {
        console.log("do binary op div");
        const fc = FMathInst.create();
        for (let b = -FMathInst.overNum; b < FMathInst.overNum; b += FMathInst.epsilonNum) {
            const fb = FMathInst.create(b);
            if (b == 0) {
                continue;
            }
            for (let a = -FMathInst.overNum; a < FMathInst.overNum; a += FMathInst.epsilonNum) {
                const fa = FMathInst.create(a);
                    FMathInst.div(fc, fa, fb);
                    console.log(FMathInst.toPrettyString(fa) + " / " + FMathInst.toPrettyString(fb)
                        + " = " + FMathInst.toPrettyString(fc));
                }
            }
    }
    if (doPrecDiv) {
        console.log("do prec div");
        let maxAbsDelta = 0;
        let maxA = 0;
        let maxB = 0;
        const errRatio = 2; // get to the best number
        const fc = FMathInst.create();
        //for (let b = 1.5; b <= 1.5; b += FMathInst.epsilonNum) {
        for (let b = -FMathInst.overNum; b <= FMathInst.overNum; b += FMathInst.epsilonNum) {
            /*if (b == 0) {
                continue;
            }*/
            const fb = FMathInst.create(b);
            //for (let a = 1.75; a <= 1.75; a += FMathInst.epsilonNum) {
            for (let a = -FMathInst.overNum; a < FMathInst.overNum; a += FMathInst.epsilonNum) {
                const c = b != 0 ? a / b : 0;
                const fa = FMathInst.create(a);
                FMathInst.div(fc, fa, fb);
                const nfc = FMathInst.toNumber(fc);
                const delta = c - nfc
                const absDelta = Math.abs(delta);
                if (absDelta > maxAbsDelta) {
                    maxAbsDelta = absDelta;
                    maxA = a;
                    maxB = b;
                }
                if (errRatio * absDelta > FMathInst.epsilonNum) {
                    console.error("check absDelta " + FMathInst.toPrettyString(fa) + " / " + FMathInst.toPrettyString(fb)
                        + " = " + FMathInst.toPrettyString(fc) + ",c = " + c.toFixed(5)
                        + ", delta = " + delta.toFixed(5));
                } else {
                    if (false) {
                        console.log("check absDelta " + FMathInst.toPrettyString(fa) + " / " + FMathInst.toPrettyString(fb)
                            + " = " + FMathInst.toPrettyString(fc) + ",c = " + c.toFixed(5)
                            + ", delta = " + delta.toFixed(5));
                    }
                }
            }
        }
        console.log("maxAbsDelta = " + maxAbsDelta + ", max err ratio = " 
                + (maxAbsDelta / FMathInst.epsilonNum).toFixed(7) + ", maxA = " + maxA + ", maxB = " + maxB);
    }
    if (doMod) {
        console.log("do binary op mod");
        
        const fc = FMathInst.create();
        for (let b = -FMathInst.overNum; b < FMathInst.overNum; b += FMathInst.epsilonNum) {
            const fb = FMathInst.create(b);
            if (b == 0) {
                continue;
            }
            for (let a = -FMathInst.overNum; a < FMathInst.overNum; a += FMathInst.epsilonNum) {
                const fa = FMathInst.create(a);
                FMathInst.mod(fc, fa, fb);
                console.log(FMathInst.toPrettyString(fa) + " % " + FMathInst.toPrettyString(fb)
                    + " = " + FMathInst.toPrettyString(fc));
            }
        }
    }
    if (doPrecMod) {
        console.log("do prec mod");
        let maxAbsDelta = 0;
        let maxA = 0;
        let maxB = 0;
        const errRatio = 2; // get to the best number
        const fc = FMathInst.create();
        //for (let b = 1.5; b <= 1.5; b += FMathInst.epsilonNum) {
        for (let b = -FMathInst.overNum; b < FMathInst.overNum; b += FMathInst.epsilonNum) {
        //for (let b = FMathInst.epsilonNum; b < FMathInst.overNum; b += FMathInst.epsilonNum) {
            if (b == 0) {
                continue;
            }
            const fb = FMathInst.create(b);
            //for (let a = 1.75; a <= 1.75; a += FMathInst.epsilonNum) {
            for (let a = -FMathInst.overNum; a < FMathInst.overNum; a += FMathInst.epsilonNum) {
            //for (let a = 0; a < FMathInst.overNum; a += FMathInst.epsilonNum) {
                const c = a % b;
                const fa = FMathInst.create(a);
                FMathInst.mod(fc, fa, fb);
                const nfc = FMathInst.toNumber(fc);
                const delta = c - nfc
                const absDelta = Math.abs(delta);
                if (absDelta > maxAbsDelta) {
                    maxAbsDelta = absDelta;
                    maxA = a;
                    maxB = b;
                }
                if (errRatio * absDelta > FMathInst.epsilonNum) {
                    console.error("check absDelta " + FMathInst.toPrettyString(fa) + " % " + FMathInst.toPrettyString(fb)
                        + " = " + FMathInst.toPrettyString(fc) + ",c = " + c.toFixed(5)
                        + ", delta = " + delta.toFixed(5));
                } else {
                    if (false) {
                        console.log("check absDelta " + FMathInst.toPrettyString(fa) + " % " + FMathInst.toPrettyString(fb)
                            + " = " + FMathInst.toPrettyString(fc) + ",c = " + c.toFixed(5)
                            + ", delta = " + delta.toFixed(5));
                    }
                }
            }
        }
        console.log("maxAbsDelta = " + maxAbsDelta + ", max err ratio = " 
                + (maxAbsDelta / FMathInst.epsilonNum).toFixed(7) + ", maxA = " + maxA + ", maxB = " + maxB);
    }
    if (testConstants) {
        console.log("\n========\ntest constants");
        for (const cName of FMathInst.constNames) {
            const c = Math[cName];
            for (let tFrac = 0; tFrac <= FMath.mFrac; ++tFrac) {
                const fixTest = new FMath(tFrac, tFrac); // make use less frac bits
                const ft = fixTest[cName];
                const fts = fixTest.toPrettyString(ft);
                const absDelta = Math.abs(c - fixTest.toNumber(ft));
                const errRatio = absDelta / fixTest.epsilonNum;
                console.log(cName + " n = " + c
                    + ", ft" + tFrac + " = " + fts
                    + " del = " + absDelta
                    + " errRatio = " + errRatio
                );
            }
        }
    }
    console.log("end testFMath");
}
