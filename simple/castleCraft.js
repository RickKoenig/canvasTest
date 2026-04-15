'use strict';

function prettyArray(arr) {
    let ret = "";
    const cca = 'A'.charCodeAt(0);
    for (let i = 0; i < arr.length; ++i) {
        const letter = String.fromCharCode(cca + i); // 0 ==> 'A', 1 ==> 'B' etc.
        ret += "" + letter + ": " + arr[i] + ", ";
    }
    ret = ret.slice(0, -2);
    return ret;
}

const mergeRules = [[17, 8], [9, 4], [5, 2], [3, 1]];

function merge(inArr) {
    const outArr = inArr.slice();
    for (let i = 0; i < outArr.length; ++i) {
        let v = outArr[i];
        let v2 = 0;
        for (const mr of mergeRules) {
            while (v >= mr[0]) {
                v2 += mr[1];
                v -= mr[0];
            }
        }
        outArr[i] = v;
        if (v2 > 0) {
            const i2 = i + 1;
            if (i2 == outArr.length) {
                outArr.push(v2);
            }
        }
    }
    return outArr;
}

function unMerge(inArr) {
    const outArr = inArr.slice();
    let watch = 100;
    while(outArr.length > 1) {
        let v = outArr[outArr.length - 1];
        for (const rule of mergeRules) {
            while(v >= rule[1]) {
                v -= rule[1];
                outArr[outArr.length - 2] += rule[0];
            }
        }
        outArr.pop();
        --watch;
        if (watch < 0) {
            console.error("watch hit!");
            break;
        }
    }
    return outArr[0];
}

function castleCraftMerge() {
    console.log("doing castle craft merge\n");
    //for (let i = 5; i <= 5; ++i) {
    //for (let i = 0; i <= 17; ++i) {
    for (let i = 0; i <= 362; ++i) {
        const inArr = [i];
        const outArr = merge(inArr);
        const um = unMerge(outArr);
        if (i == um) {
            console.log("in = A: " + i.toString().padStart(3) + ",  unmerge = " 
                + um.toString().padStart(3) + ",    out = " + prettyArray(outArr));
        } else {
            console.error("in = A: " + i.toString().padStart(3) + ",  unmerge = " 
                + um.toString().padStart(3) + ",    out = " + prettyArray(outArr));
        }
    }
    const testArrs = [
        [0, 0, 5, 0, 0, 4],
        [5, 1, 5, 0, 0, 1, 1],
        [0, 0, 0, 8, 0, 1, 1],
        [13, 4, 2, 8, 0, 1, 1],
        [1, 0, 10, 8, 0, 1, 1],
        [8, 14, 12, 8, 0, 1, 1],
        [0, 0, 0, 0, 0, 4, 1],
        [0, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 0, 0, 3],
        [0, 0, 0, 0, 0, 0, 0, 1],
    ];
    console.log("");
    for (const testArr of testArrs) {
        const unmerged = unMerge(testArr);
        console.log("merged in = " + prettyArray(testArr) + ",  unmerged out = " + unmerged);
    }
}
