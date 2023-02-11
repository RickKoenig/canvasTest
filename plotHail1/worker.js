'use strict';

importScripts("hailCommon.js");

onmessage = (e) => {
    console.log("W: 2^n - 1   Start");
    console.log('W: Message received from main script: ' + e.data);
    const maxHailBlocks = e.data[0];
    const hailBlockSize = e.data[1];
    let bestRatio = 0;
    let hp = 1;
    for (let blockNum = 0; blockNum < maxHailBlocks; ++blockNum) {
        console.log(`W: #### checking ${hp}`);
        let sendData = new Float32Array(hailBlockSize);
        for (let blockIdx = 0; blockIdx < hailBlockSize; ++blockIdx) {
            const n = 2n ** BigInt(hp) - 1n;
            const hs = countHailSteps(n);
            const ns = n > 1000000 ? "big" : n;
            let ratio = hs / hp;
            sendData[blockIdx] = ratio;
            if (ratio > bestRatio) {
                bestRatio = ratio;
            }
            if (ratio >= bestRatio) {
                const ratStr = ratio.toFixed(5);
                console.log(`W: Best Hail steps for 2^${hp} - 1 = ${ns} is ${hs}, steps/pow = ${ratStr}`);
            }
            ++hp;
        }
        console.log(`W: #### checking 'DONE' 1 to ${hp - 1}`);
        if (sendData.length > 0) {
            postMessage(sendData.buffer, [sendData.buffer]);
        }
    }
    console.log("W: 2^n - 1   Finished");
}
