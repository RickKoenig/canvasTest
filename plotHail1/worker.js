'use strict';

importScripts("hailCommon.js");

onmessage = (e) => {
    console.log("W: 2^n - 1   Start");
    const maxHailBlocks = e.data[0];
    const hailBlockSize = e.data[1];
    console.log("W: Worker Task is " + maxHailBlocks + " blocks of " + hailBlockSize + " elements each");
    let bestRatio = 0;
    let hailPower = 1; // start with 1
    for (let blockNum = 0; blockNum < maxHailBlocks; ++blockNum) {
        console.log(`W: #### checking ${hailPower} to ${hailPower + hailBlockSize - 1}`);
        let sendData = new Float32Array(hailBlockSize);
        for (let blockIdx = 0; blockIdx < hailBlockSize; ++blockIdx) {
            const n = 2n ** BigInt(hailPower) - 1n;
            const hs = countHailSteps(n);
            const ns = n > 1000000 ? "big" : n;
            let ratio = hs / hailPower;
            //console.log(`value ${n}, power ${hailPower}, hailSteps ${hs}, ratio ${ratio.toFixed(4)}`);
            //console.log(`power ${hailPower}, hailSteps ${hs}, ratio ${ratio.toFixed(4)}`);
            sendData[blockIdx] = ratio;
            if (ratio > bestRatio) {
                bestRatio = ratio;
            }
            if (ratio >= bestRatio) { // show ties
                const ratStr = ratio.toFixed(5);
                //console.log(`W: Best Hail steps for 2^${hailPower} - 1 = ${ns} is ${hs}, steps/pow = ${ratStr}`);
            }
            ++hailPower;
        }
        if (sendData.length > 0) {
            postMessage(sendData.buffer, [sendData.buffer]);
        }
    }
    console.log("W: 2^n - 1   Finished");
}
