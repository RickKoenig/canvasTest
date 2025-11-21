'use strict';

function unitTest(intP, fracP) {
    //const FMath = FMathNum; // static 
    //const FMath = FMathBigInt; // static
    //const FMath = FMathBigIntInstance; // static
    const FMath = new FMathBigIntInstance(intP, fracP); // instance

    console.log("begin testFMath");
    console.log(`intBits = ${FMath.intBits}, fracBits = ${FMath.fracBits}`);
    console.log("epsilonNum = " + FMath.epsilonNum);
    console.log("overNum = " + FMath.overNum);
    const doFromNumber = false;
    const doUnary = false;
    const doPrecUnary = true;
    const doMul = false;
    const doPrecMul = false;
    const doDiv = false;
    const doPrecDiv = false;
    const doMod = false;
    const doPrecMod = false;
    const testConstants = true;

    if (doFromNumber) {
        console.log("do fromNumber");
        for (let n = -FMath.overNum; n <= FMath.overNum; n += FMath.epsilonNum * .25) {
            const f = FMath.fromNumber(n);
            console.log("n = " + FMath.numberToPrettyString(n) 
                + ", f = " + FMath.toPrettyString(f)
                + '  #');
        }
    }
    if (doUnary) {
        console.log("do unary ops");
        const fNeg = FMath.create();
        const fAbs = FMath.create();
        const fSign = FMath.create();
        const fTrunc = FMath.create();
        const fFloor = FMath.create();
        const fCeil = FMath.create();
        const fRound = FMath.create();
        const fInv = FMath.create();
        const fSqrt = FMath.create();
        for (let n = -FMath.overNum; n <= FMath.overNum; n += FMath.epsilonNum) {
            /*if (n == 0) {
                continue;
            }*/
            const f = FMath.fromNumber(n);
            FMath.neg(fNeg, f);
            FMath.abs(fAbs, f);
            FMath.sign(fSign, f);
            FMath.trunc(fTrunc, f);
            FMath.floor(fFloor, f);
            FMath.ceil(fCeil, f);
            FMath.round(fRound, f);
            FMath.inv(fInv, f);
            FMath.sqrt(fSqrt, f);
            console.log("f = " + FMath.toPrettyString(f)
//					+ ",      fNeg = " + FMath.toPrettyString(fNeg)
                + ",      fAbs = " + FMath.toPrettyString(fAbs)
                + ",      fSign = " + FMath.toPrettyString(fSign)
                + ",      fTrunc = " + FMath.toPrettyString(fTrunc)
//					+ ",      fFloor = " + FMath.toPrettyString(fFloor)
//					+ ",      fCeil = " + FMath.toPrettyString(fCeil)
//					+ ",      fRound = " + FMath.toPrettyString(fRound)
                + ",      fInv = " + FMath.toPrettyString(fInv)
                + ",      fSqrt = " + FMath.toPrettyString(fSqrt)
                + '  #');
        }
    }
    if (doPrecUnary) {
        const parms = [
            //{	name: "neg",	op: (n) => -n,			fOp : FMath.neg.bind(FMath),	errRatio: .5},
            //{	name: "abs",	op: (n) => Math.abs(n),	fOp : FMath.abs.bind(FMath),	errRatio: .5},
            //{	name: "sign",	op: (n) => Math.sign(n),fOp : FMath.sign.bind(FMath),	errRatio: .5},
            //{	name: "trunc",	op: (n) => Math.trunc(n),fOp : FMath.trunc.bind(FMath),	errRatio: .5},
            //{	name: "floor",	op: (n) => Math.floor(n),fOp : FMath.floor.bind(FMath),	errRatio: .5},
            //{	name: "ceil",	op: (n) => Math.ceil(n),fOp : FMath.ceil.bind(FMath),	errRatio: .5},
            //{	name: "round",	op: (n) => Math.round(n),fOp : FMath.round.bind(FMath),	errRatio: .5},
            {	name: "inv",	op: (n) => 1 / n,		fOp : FMath.inv.bind(FMath),	errRatio: .5},
            {	name: "sqrt",	op: (n) => n >= 0 ? Math.sqrt(n) : 0,fOp : FMath.sqrt.bind(FMath),	errRatio: 1},
        ];
        for (const parm of parms) {
            console.log("\n========\ndo prec " + parm.name);
            let maxAbsDelta = 0;
            let maxN = "---";
            let maxC = "---";
            let maxFn = "---";
            const errRatio = parm.errRatio; // get to the best number
            const fc = FMath.create();
            for (let b = -FMath.overNum; b <= FMath.overNum; b += FMath.epsilonNum) {
                const fb = FMath.fromNumber(b);
                const c = b ? parm.op(b) : 0;
                parm.fOp(fc, fb);
                const nfc = FMath.toNumber(fc);
                const delta = c - nfc
                const absDelta = Math.abs(delta);
                if (absDelta > maxAbsDelta) {
                    maxAbsDelta = absDelta;
                    maxN = b;
                    maxC = c;
                    maxFn = clone(fc);
                }
                let str = "check absDelta " + parm.name + "(" + FMath.toPrettyString(fb)
                        + ") = " + FMath.toPrettyString(fc) + ", n = " + c.toFixed(5)
                        + ", delta = " + delta.toFixed(5);
                // half an epsilon is good (errRatio == .5) // lower is better, more than 1 is worse
                if (absDelta > errRatio * FMath.epsilonNum) {
                    console.log(str);
                } else {
                    if (false) {
                        console.log(str);
                    }
                }
            }
            const maxFnStr = typeof maxFn == 'object' ? FMath.toPrettyString(maxFn) : "---";
            console.log("maxAbsDelta = " 
                + maxAbsDelta.toFixed(7) + ", max err ratio = " 
                + (maxAbsDelta / FMath.epsilonNum).toFixed(7) + " maxErrLocation: n = " + maxN);
            let str = "check absDelta " + parm.name + "(" + maxN
                    + ") = " + maxFnStr + ", result = " + maxC
                    + ", delta = " + maxAbsDelta.toFixed(5);
            // half an epsilon is good (errRatio == .5) // lower is better, more than 1 is worse
            console.log(str);
        }
    }
    if (doMul) {
        console.log("do binary op mul");
        const fc = FMath.create();
        for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
            const fa = FMath.fromNumber(a);
            for (let b = -FMath.overNum; b < FMath.overNum; b += FMath.epsilonNum) {
                const fb = FMath.fromNumber(b);
                FMath.mul(fc, fa, fb);
                console.log(FMath.toPrettyString(fa) + " * " + FMath.toPrettyString(fb)
                    + " = " + FMath.toPrettyString(fc));
            }
        }
    }
    // compare number with FMath
    if (doPrecMul) {
        console.log("do prec mul");
        let maxAbsDelta = 0;
        let maxA = 0;
        let maxB = 0;
        const errRatio = 2; // get to the best number
        const fc = FMath.create();
        for (let b = -FMath.overNum; b < FMath.overNum; b += FMath.epsilonNum) {
            const fb = FMath.fromNumber(b);
            for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
                const c = a * b;
                const fa = FMath.fromNumber(a);
                FMath.mul(fc, fa, fb);
                const nfc = FMath.toNumber(fc);
                const delta = c - nfc
                const absDelta = Math.abs(delta);
                if (absDelta > maxAbsDelta) {
                    maxAbsDelta = absDelta;
                    maxA = a;
                    maxB = b;
                }
                if (errRatio * absDelta > FMath.epsilonNum) {
                    console.error("Too much absDelta !! " + FMath.toPrettyString(fa) + " * " + FMath.toPrettyString(fb)
                        + " = " + FMath.toPrettyString(fc) + ",c = " + c.toFixed(5)
                        + ", delta = " + delta.toFixed(5));
                }
            }
        }
        console.log("maxAbsDelta = " + maxAbsDelta + ", maxA = " + maxA + ", maxB = " + maxB);
    }
    if (doDiv) {
        console.log("do binary op div");
        const fc = FMath.create();
        for (let b = -FMath.overNum; b < FMath.overNum; b += FMath.epsilonNum) {
            const fb = FMath.fromNumber(b);
            if (b == 0) {
                continue;
            }
            for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
                const fa = FMath.fromNumber(a);
                    FMath.div(fc, fa, fb);
                    console.log(FMath.toPrettyString(fa) + " / " + FMath.toPrettyString(fb)
                        + " = " + FMath.toPrettyString(fc));
                }
            }
    }
    if (doPrecDiv) {
        console.log("do prec div");
        let maxAbsDelta = 0;
        let maxA = 0;
        let maxB = 0;
        const errRatio = 2; // get to the best number
        const fc = FMath.create();
        //for (let b = 1.5; b <= 1.5; b += FMath.epsilonNum) {
        for (let b = -FMath.overNum; b <= FMath.overNum; b += FMath.epsilonNum) {
            /*if (b == 0) {
                continue;
            }*/
            const fb = FMath.fromNumber(b);
            //for (let a = 1.75; a <= 1.75; a += FMath.epsilonNum) {
            for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
                const c = b != 0 ? a / b : 0;
                const fa = FMath.fromNumber(a);
                FMath.div(fc, fa, fb);
                const nfc = FMath.toNumber(fc);
                const delta = c - nfc
                const absDelta = Math.abs(delta);
                if (absDelta > maxAbsDelta) {
                    maxAbsDelta = absDelta;
                    maxA = a;
                    maxB = b;
                }
                if (errRatio * absDelta > FMath.epsilonNum) {
                    console.error("check absDelta " + FMath.toPrettyString(fa) + " / " + FMath.toPrettyString(fb)
                        + " = " + FMath.toPrettyString(fc) + ",c = " + c.toFixed(5)
                        + ", delta = " + delta.toFixed(5));
                } else {
                    if (false) {
                        console.log("check absDelta " + FMath.toPrettyString(fa) + " / " + FMath.toPrettyString(fb)
                            + " = " + FMath.toPrettyString(fc) + ",c = " + c.toFixed(5)
                            + ", delta = " + delta.toFixed(5));
                    }
                }
            }
        }
        console.log("maxAbsDelta = " + maxAbsDelta + ", maxA = " + maxA + ", maxB = " + maxB);
    }
    if (doMod) {
        console.log("do binary op mod");
        
        const fc = FMath.create();
        for (let b = -FMath.overNum; b < FMath.overNum; b += FMath.epsilonNum) {
            const fb = FMath.fromNumber(b);
            if (b == 0) {
                continue;
            }
            for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
                const fa = FMath.fromNumber(a);
                FMath.mod(fc, fa, fb);
                console.log(FMath.toPrettyString(fa) + " % " + FMath.toPrettyString(fb)
                    + " = " + FMath.toPrettyString(fc));
            }
        }
    }
    if (doPrecMod) {
        console.log("do prec mod");
        let maxAbsDelta = 0;
        let maxA = 0;
        let maxB = 0;
        const errRatio = 2; // get to the best number
        const fc = FMath.create();
        //for (let b = 1.5; b <= 1.5; b += FMath.epsilonNum) {
        for (let b = -FMath.overNum; b < FMath.overNum; b += FMath.epsilonNum) {
        //for (let b = FMath.epsilonNum; b < FMath.overNum; b += FMath.epsilonNum) {
            if (b == 0) {
                continue;
            }
            const fb = FMath.fromNumber(b);
            //for (let a = 1.75; a <= 1.75; a += FMath.epsilonNum) {
            for (let a = -FMath.overNum; a < FMath.overNum; a += FMath.epsilonNum) {
            //for (let a = 0; a < FMath.overNum; a += FMath.epsilonNum) {
                const c = a % b;
                const fa = FMath.fromNumber(a);
                FMath.mod(fc, fa, fb);
                const nfc = FMath.toNumber(fc);
                const delta = c - nfc
                const absDelta = Math.abs(delta);
                if (absDelta > maxAbsDelta) {
                    maxAbsDelta = absDelta;
                    maxA = a;
                    maxB = b;
                }
                if (errRatio * absDelta > FMath.epsilonNum) {
                    console.error("check absDelta " + FMath.toPrettyString(fa) + " % " + FMath.toPrettyString(fb)
                        + " = " + FMath.toPrettyString(fc) + ",c = " + c.toFixed(5)
                        + ", delta = " + delta.toFixed(5));
                } else {
                    if (false) {
                        console.log("check absDelta " + FMath.toPrettyString(fa) + " % " + FMath.toPrettyString(fb)
                            + " = " + FMath.toPrettyString(fc) + ",c = " + c.toFixed(5)
                            + ", delta = " + delta.toFixed(5));
                    }
                }
            }
        }
        console.log("maxAbsDelta = " + maxAbsDelta + ", maxA = " + maxA + ", maxB = " + maxB);
    }
    if (testConstants) {
        console.log("\n========\ntest constants");
        const mFrac = 32; // keep at this value
        Math.ZERO = 0;
        Math.ONE = 1;
        const constNames = [
            "ZERO",
            "ONE",
            "PI",
            "E",
            "SQRT2",
            "SQRT1_2",
            "LN10",
            "LN2",
            "LOG10E",
            "LOG2E"
        ];
        // consistency
        const master32 = { // times 2 to the mFrac power, rounded to nearest BigInt
            ZERO: 0n,
            ONE: 4294967296n,
            PI: 13493037705n,
            E: 11674931555n,
            SQRT2: 6074001000n,
            SQRT1_2: 3037000500n,
            LN10: 9889527671n,
            LN2: 2977044472n,
            LOG10E: 1865280597n,
            LOG2E: 6196328019n
        };
        const fix32p32 = new FMathBigIntInstance(mFrac, mFrac); // instance, high precision
        const generate = false;
        const test = true;
        if (generate) {
            console.log("generate");
            for (const cName of constNames) {
                const c = Math[cName];
                const fc = fix32p32.fromNumber(c);
                const fcn = fix32p32.toPrettyString(fc);
                //console.log(cName + " = " + c + " " + fcn);
                console.log(cName + ": " + fc.raw + "n,");
            }
        }
        if (test) {
            const fc32 = FMath.create(); // 32
            const ft = FMath.create(); // tFrac
            for (const cName of constNames) {
                const c = Math[cName];
                fc32.raw = master32[cName];
                for (let tFrac = 0; tFrac <= 32; ++tFrac) {
                    const fixTest = new FMathBigIntInstance(tFrac, tFrac); // make fit here
                    ft.raw = FMathBigIntInstance.convert(fc32.raw, mFrac, tFrac);
                    const fc32s = fix32p32.toPrettyString(fc32);
                    const fts = fixTest.toPrettyString(ft);
                    const absDelta = Math.abs(c - fixTest.toNumber(ft));
                    const err = absDelta / fixTest.epsilonNum;
                    console.log(cName + " n = " + c
                        + ", fc32 = " + fc32s
                        + ", ft" + tFrac + " = " + fts
                        + " del = " + absDelta
                        + " err = " + err
                    );
                }
            }
        }
    }
    console.log("end testFMath");
}
