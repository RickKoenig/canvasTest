'use strict';

// do long division, looking for repeating decimals
function divToStr(n, d) {
    const verbose = false;
    let maxDigits = 100; // safety
    const w = Math.floor(n / d);
    let r = n - w * d; // multiply by 10 for numbers to the right of decimal point
    let wholeStr = `${w.toString().padStart(3)}.`;
    const remArray = [r]; // keep track of remainders
    let qStr = "";
    let qStartStr = "";
    let qRepeatStr = "";
    let digits;
    for(digits = 0; digits < maxDigits; ++digits ) {
        r *= 10;
        const q = Math.floor(r / d);
        r -= q * d;
        qStr += q;
        if (!r) { // remainder is 0, terminate
            qStartStr = qStr;
            if (verbose) {
                qRepeatStr = " T";
            }
            break;
        }
        let idx = remArray.indexOf(r);
        if (idx >= 0) { // remainder is in array, it's a repeat, split qStr into 'start and repeat'
            qStartStr = qStr.substring(0, idx);
            qRepeatStr = "[" + qStr.substring(idx, qStr.length) + "]";
            if (verbose) {
                qRepeatStr += ", repeat " + (qStr.length - idx) + " remainders [" + remArray + "]";
            }
            break;
        }
        remArray.push(r);
    }
    if (digits == maxDigits) {
        return ("MAXDIGITS " + d);
    }
    return wholeStr + qStartStr + qRepeatStr;
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




// some test of hail with N * X + 1, not just 3 * X + 1
function doHailFunc(num, multNum) {
    if (num % 2n) { // odd
        num = (multNum * num + 1n) / 2n;
    } else { // even
        num /= 2n;
    }
    return num;
}

function runHail(num, multNum, maxSteps, maxValue) {
    num = BigInt(num);
    multNum = BigInt(multNum);
    let steps = 0;
    let reason;
    const stepArr = [num];
    const repStepArr = [];
    while(true) {
        const done = false;
        if (done) {
            if (num == 0 || num == 1) {
                reason = "DONE";
                break;
            }
        }
        if (stepArr.length >= maxSteps) {
            reason = "MAXSTEPS";
            break;
        }
        if (num > maxValue) {
            reason = "TOOBIG";
            break;
        }
        // check for repeats first, then push number onto stack
        num = doHailFunc(num, multNum);
        const idx = stepArr.indexOf(num);
        if (idx >= 0) {
            reason = "REPEAT";
            break;
        }
        // no conditions, just push the new number
        stepArr.push(num);
        ++steps;
    }
    //return stepArr;
    return {
        reason: reason,
        steps: stepArr,
        repSteps: ["foo"]
    };
}

function hailTests() {
    console.log(">>>>>>>>>> hail tests");
    // use bigInt, busy calc wait (slow)
    const minNum = 0;
    const maxNum = 10;
    const multNum = 3;
    const maxSteps = 1000;
    const maxValue = 10000000000000000000000000000000000000000000000000000000n;
    for (let num = minNum; num <= maxNum; ++num) {
        const res = runHail(num, multNum, maxSteps, maxValue);
        console.log(`num = ${num.toString().padStart(3)}, reason = ${res.reason}\
, numSteps = ${(res.steps.length - 1).toString().padStart(4)}\
, repeat states at end = ${res.repSteps}, states = ${res.steps}`);
    }
    // end busy wait
    console.log("<<<<<<<<<< hail tests");
}
// done hail

///// SOME SCRATCH /////////
// some random skew functions and their names
const skewFuns = [
	{name: "sqrt", fun: Math.sqrt},
	{name: "identity", fun: (x) => x},
	{name: "square", fun: (x) => x * x},
	{name: "fifth power", fun: (x) => x * x * x * x * x},
	{name: "fifth root", fun: (x) => Math.pow(x, .2)},
	{name: "exponent", fun: Math.exp},
	{name: "ln+1", fun: (x) => Math.log(x + 1)},
	{name: "sine", fun: Math.sin},
	{name: "pieces", fun: (x) => {
			const mx = 5 / 8;
			const my = 1 / 3;
			if (x < mx) return x * my / mx;
			return my + (x - mx) * (1 - my) / (1 - mx);
		}
	}
];

// average of skewed rands
function calcExpectVal(skewFun, numShots, doRand) {
	// 1  1d point for now
	let sum = 0;
	for (let i = 0; i < numShots; ++i) {
		let rnd = doRand
			? Math.random() 
			: i / numShots;
		rnd = skewFun(rnd);
		sum += rnd;
	}
	return sum / numShots; // average

	// 2d next

}

function randomNumberTest() {
	let retStr = "";
	const randRes = 1000000;
	for(let skewFun of skewFuns) {
		retStr += "\n---- fun name ---- = " + skewFun.name;
		retStr += "\nno  Random expectVal = " + calcExpectVal(skewFun.fun, randRes, false).toFixed(6);
		retStr += "\nyes Random expextVal = " + calcExpectVal(skewFun.fun, randRes, true).toFixed(6);
		}
	return retStr;
}

function randomNumbertests() {
	console.log("start random number tests");
	const scratchText = randomNumberTest();
	console.log(scratchText);
	console.log("end random number tests");
}
///// END SOME SCRATCH /////////

function runScratch() {
    console.log("DOING SCRATCH!");
    //repDecimalTests();
    //hailTests();
    randomNumbertests();
}
