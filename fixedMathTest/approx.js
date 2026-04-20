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
    if (!isFinite(c)) {
        console.log("is infinite !!!");
    }
    
    while(ac >= 1) {
        ac /= 10;
        absDelta /= 10;
        ++shift;
    }
    
    let rat = absDelta / epsilon;
    return {rat: rat, shift: shift};
}

function logtest2(x) {
    let d = 1;
    --x;
    let n = x;
    const steps = 10;
    let y = 0;
    y += n / d;
    //console.log("n = " + n + ", d = " + d);
    for (let i = 1; i < steps; ++i) {
        n *= -x;
        ++d;
        y += n / d;
        //console.log("n = " + n + ", d = " + d);
    }
    return y;
}

// find symmetries, for trig and other functions
// triangle wave
function normAngOneSin(a) {
    let neg = a < 0;
    let na = neg ? -a : a;
    na %= 4;
    if (na >= 3) {
        na -= 4;
    } else if (na >= 1) {
        na = 2 - na;
    }
    if (neg) {
        na = -na;
    }
    return na;
}
