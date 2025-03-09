'use strict';

function runHeyawake() {
    /*
        2D square in upper right corner, find valid solutions
        // white is 0, black is 1
    */
    console.log("\n\n\n\nheyawake test");
    const sqMax = 5;
    const arr = Array(sqMax * sqMax);
    arr.fill(0);
    const maxWatch = 3000000000;
    let watch = 0;
    const init = 0;
    let sum = arr.reduce((acc, cur) => acc + cur, init);
    const goal = 10; // -1 for no goal
    let numGood = 0;
    do {
        // check array
        let status = "good";
        let bail = false;
        // check if sum matches goal
        if (goal >= 0 && sum != goal) {
            status = "wrong goal";
            bail = true;
        }
        // check 2 blacks next to each other horizontal
        if (!bail) {
            for (let j = 0; j < sqMax; ++j) {
                const jm = j * sqMax;
                for (let i = 0; i < sqMax - 1; ++i) {
                    const idx = jm + i;
                    if (arr[idx] == 1) {
                        if (arr[idx + 1] == 1) {
                            status = "2blacksH";
                            bail = true;
                            break;
                        }
                    }
                }
                if (bail) {
                    break;
                }
            }
        }
        // check 2 blacks next to each other vertical
        if (!bail) {
            for (let j = 0; j < sqMax - 1; ++j) {
                const jm = j * sqMax;
                for (let i = 0; i < sqMax; ++i) {
                    const idx = jm + i;
                    if (arr[idx] == 1) {
                        if (arr[idx + sqMax] == 1) {
                            status = "2blacksV";
                            bail = true;
                            break;
                        }
                    }
                }
                if (bail) {
                    break; - 1
                }
            }
        }
        // check if white is isolated/trapped
        if (!bail) {
        //if (false) {
            // BFS (Later)
            for (let j = 0; j < sqMax - 1; ++j) {
                const jm = j * sqMax;
                for (let i = 0; i < sqMax - 1; ++i) {
                    let surround = 0;
                    const idx = jm + i;
                    if (i == 0) {
                        ++surround;
                    } else if (arr[idx - 1] == 1) {
                        ++surround;
                    }
                    if (j == 0) {
                        ++surround;
                    } else if (arr[idx - sqMax] == 1) {
                        ++surround;
                    }
                    if (arr[idx + 1] == 1) {
                        ++surround;
                    }
                    if (arr[idx + sqMax] == 1) {
                        ++surround;
                    }
                    if (surround == 4) {
                        status = "isolated";
                        bail = true;
                    }
                }
            }

        }
        if (!bail) {
            ++numGood;
        }
        //if (false) {
        if (!bail) {
            // show array
            console.log("------- id = " + watch + ", sum = " + sum + ", status = " + status + " -------");
            for (let j = 0; j < sqMax; ++j) {
                const jm = j * sqMax;
                let row = "";
                for (let i = 0; i < sqMax; ++i) {
                    const idx = jm + i;
                    row += arr[idx] ? "B" : "W";
                }
                console.log(row);
            }
        }
        // next array
        for(let i = 0; i < arr.length; ++i) {
            arr[i] ^= 1;
            if (arr[i] != 0) {
                break;
            }
        }
        // watch array
        ++watch;
        if (watch == maxWatch) {
            break;
        }
        // sum next array
        sum = arr.reduce((acc, cur) => acc + cur, init);
    } while (sum > 0);
    console.log("good = " + numGood + ", bad = " + (watch - numGood) + ", total = " + watch);
}
