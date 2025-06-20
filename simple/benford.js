'use strict';

// positive only
function getFirstDigitBignum(n) {
    if (n == 0n) {
        return 0n;
    }
    while (n > 9n) {
        n /= 10n;
    }
    return n;
}

function getFirstDigit(n) {
    if (n == 0) {
        return 0;
    }
    while (n > 9) {
        n = Math.floor(n / 10);
    }
    return n;
}

function calcBenford() {
    let benSum = 0;
    const benProbs = [];
    benProbs.push(0); // don't use digit 0
    for (let n = 1; n < 10; n += 1) {
        const p = Math.log10(1 + 1 / n);
        benProbs.push(p);
        benSum += p;
    }
    return benProbs;
}

function calcPowers2(sampleSize) {
    const digs = Array(10).fill(0);
    let p = 1n;
    for (let i = 0n; i < sampleSize; ++i) {
        const fd = getFirstDigitBignum(p);
        ++digs[fd];
        p *= 2n;
    }
    for (let i = 0; i < 10; ++i) {
        digs[i] /= sampleSize;
    }
    return digs;
}

function calcUniform(sampleSize) {
    const uniProbs = Array(10).fill(0);
    for (let i = 0; i < sampleSize; ++i) {
        const v = getFirstDigit(Math.floor(Math.random() * sampleSize));
        //const v = getFirstDigit(i);
        ++uniProbs[v];
    }
    for (let i = 0; i < 10; ++i) {
        uniProbs[i] /= sampleSize;
    }
    return uniProbs;
}
    
function calcExp(sampleSize) {
    const expProbs = Array(10).fill(0);
    const lgss = Math.log10(sampleSize);
    for (let i = 0; i < sampleSize; ++i) {
        const v = getFirstDigit(Math.floor(Math.pow(10, Math.random() * lgss)));
        //const v = getFirstDigit(Math.floor(Math.pow(10, lgss * i / sampleSize)));
        ++expProbs[v];
    }
    for (let i = 0; i < 10; ++i) {
        expProbs[i] /= sampleSize;
    }
    return expProbs;
}

function doBenford() {
    console.log("doing Benford analysis");
    const sampleSize = 1000;

    // calc Benford's formula
    const benProbs = calcBenford();
    const benSum = benProbs.reduce((partialSum, a) => partialSum + a, 0);

    // calc powers of 2
    const pow2Probs = calcPowers2(sampleSize);
    const pow2Sum = benProbs.reduce((partialSum, a) => partialSum + a, 0);

    // calc uniform distribution that will fail the Benford test
    const uniformProbs = calcUniform(sampleSize);
    const uniformSum = uniformProbs.reduce((partialSum, a) => partialSum + a, 0);

    // calc exp distribution random values that will pass Benford test
    const expProbs = calcExp(sampleSize);
    const expSum = expProbs.reduce((partialSum, a) => partialSum + a, 0);

    // print benProbs
    console.log("");
    for (let i = 0; i < 10; ++i) {
        console.log("i = " + i + ", benProbs = " + benProbs[i].toFixed(6).padEnd(8));
    }
    console.log(`total Benford probability = ${benSum.toFixed(6).padEnd(8)}`);
    
    // print pow2Probs
    console.log("");
    for (let i = 0; i < 10; ++i) {
        console.log("i = " + i + ", pow2Probs = " + pow2Probs[i].toFixed(6).padEnd(8)
            + " ,diff = " + (pow2Probs[i] - benProbs[i]).toFixed(6).padEnd(8));
    }
    console.log(`total pow2 probability = ${pow2Sum.toFixed(6).padEnd(8)}`);
    
    // print uniformProbs
    console.log("");
    for (let i = 0; i < 10; ++i) {
        console.log("i = " + i + ", uniformProbs = " + uniformProbs[i].toFixed(6).padEnd(8)
            + " ,diff = " + (uniformProbs[i] - benProbs[i]).toFixed(6).padEnd(8));
    }
    console.log(`total uniform probability = ${uniformSum.toFixed(6).padEnd(8)}`);
    
    // print expProbs
    console.log("");
    for (let i = 0; i < 10; ++i) {
        console.log("i = " + i + ", expProbs = " + expProbs[i].toFixed(6).padEnd(8)
            + " ,diff = " + (expProbs[i] - benProbs[i]).toFixed(6).padEnd(8));
    }
    console.log(`total exp probability = ${expSum.toFixed(6).padEnd(8)}`);
}

