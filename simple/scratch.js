'use strict';

// do division by hand looking for repeating decimals
function repCalc(d) {
    let numDigits = 30;
    let repStr = "0.";
    let r = 10; // shift right for numbers to the right of decimal point
    while(r && numDigits--) {
        const q = Math.floor(r / d);
        r -= q * d;
        r *= 10;
        repStr = repStr.concat(q);
    }
    return repStr;
}

function runScratch() {
    console.log("DOING SCRATCH!");
    for (let d = 2; d < 30; ++d) {
        const repStr = repCalc(d);
        console.log(`den = ${d.toString().padStart(3)}, repStr = ${repStr}`);
    }
}
