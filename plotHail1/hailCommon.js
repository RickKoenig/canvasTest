'use strict';

function hailStep(bn) {
    bn = BigInt(bn);
    if (bn % 2n == 0) { // even
        return bn / 2n;
    } else { // odd
        return (3n * bn + 1n) / 2n;
    }
}

function countHailSteps(bn) {
    let ret = 0;
    while(bn != 1) {
        bn = hailStep(bn);
        ++ret;
    }
    return ret;
}

// return an array of booleans with true for up and false for down
function recordHailSteps(bn) {
    bn = BigInt(bn);
    const ret = {
        moves : [],
        numbers : [],
        maxValue : bn
    };
    while(bn != 1) {
        ret.moves.push(bn % 2n == 1); // if odd, then step goes up
        bn = hailStep(bn);
        ret.numbers.push(bn);
        if (bn > ret.maxValue) ret.maxValue = bn;
    }
    return ret;
}
