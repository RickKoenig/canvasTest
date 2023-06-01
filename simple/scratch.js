'use strict';

// do division by hand looking for repeating decimals
function repCalc(d) {
    let numDigits = 10;
    let decimalStr = "0.";
    let r = 1; // shift right for numbers to the right of decimal point
    const remArray = [r]; // remainders
    let qStr = "";
    let qStartStr = "";
    let qRepStr = "";
    let finishStr = "what";
    while(r && numDigits--) {
        r *= 10;
        const q = Math.floor(r / d);
        r -= q * d;
        qStr += q;//decimalStr.concat(q);
        if (!r) {
            finishStr = " T";
            break;
        }
        const idx = remArray.indexOf(r);
        if (idx >= 0) {
            finishStr = ` R ${idx}`;
            break;
        }
        remArray.push(r);
    }

    qRepStr = qStr;

    return decimalStr + qStartStr + "[" + qRepStr + "]" + finishStr;
}

function repDecimalTests() {
    console.log("repeat decimal tests");
    for (let d = 2; d < 14; ++d) {
        const decimalStr = repCalc(d);
        console.log(`den = ${d.toString().padStart(3)}, decimalStr = ${decimalStr}`);
    }
}

function runScratch() {
    console.log("DOING SCRATCH!");
    const arr = [3, 5, 7, 11];
    const idx = arr.indexOf(11);
    console.log(`find = ${idx}`);
    repDecimalTests();
}
