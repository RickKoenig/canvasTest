'use strict';

// do division by hand looking for repeating decimals
function divToStr(n, d) {
    const verbose = false;
    let maxDigits = 100; // safety
    const w = Math.floor(n / d);
    let r = n - w * d; // multiply by 10 for numbers to the right of decimal point
    let decimalStr = `${w.toString().padStart(3)}.`;
    const remArray = [r]; // keep track of remainders
    let qStr = "";
    let qStartStr = "";
    let qRepStr = "";
    let digits;
    for(digits = 0; digits < maxDigits; ++digits ) {
        r *= 10;
        const q = Math.floor(r / d);
        r -= q * d;
        qStr += q;
        if (!r) { // remainder is 0, terminate
            qStartStr = qStr;
            if (verbose) {
                qRepStr = " T";
            }
            break;
        }
        let idx = remArray.indexOf(r);
        if (idx >= 0) { // remainder is in array, repeat
            qStartStr = qStr.substring(0, idx);
            qRepStr = "[" + qStr.substring(idx, qStr.length) + "]";
            if (verbose) {
                qRepStr += ", repeat " + (qStr.length - idx) + " remainders [" + remArray + "]";
            }
            break;
        }
        remArray.push(r);
    }
    if (digits == maxDigits) {
        return ("MAXDIGITS " + d);
    }
    return decimalStr + qStartStr + qRepStr;// + finishStr;
}

function repDecimalTests() {
    console.log("repeat decimal tests");
    for (let d = 1; d <= 20; ++d) {
        console.log("--------------- denominator = " + d + " ---------------");
        for (let n = 0; n <= 20; ++n) {
            const decimalStr = divToStr(n, d);
            console.log(`${n.toString().padStart(3)} / ${d.toString().padStart(3)}   =   ${decimalStr}`);
        }
    }
}

function runScratch() {
    console.log("DOING SCRATCH!");
    repDecimalTests();
}
