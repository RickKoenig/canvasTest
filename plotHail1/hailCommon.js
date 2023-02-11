'use strict';

function hailStep(bn) {
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


