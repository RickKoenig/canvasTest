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

function merge(inArr) {
    const outArr = inArr.slice();
    for (let i = 0; i < outArr.length; ++i) {
        let v = outArr[i];
        let v2 = 0;
        const mergeRules = [[17, 8], [9, 4], [5, 2], [3, 1]];
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

function castleCraftMerge() {
    console.log("doing castle craft merge\n");
    for (let i = 0; i < 171; ++i) {
        const inArr = [i];
        const outArr = merge(inArr);
        console.log("in = A: " + i.toString().padStart(3) + "    out = " + prettyArray(outArr));
    }
}
