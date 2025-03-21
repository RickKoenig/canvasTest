'use strict';

const boardDirections = {
    UP: 1,
    DOWN: 2,
    LEFT: 4,
    RIGHT: 8
}

function isIsolatedOld(arr, blackSum) {
    //return true;
    // only check nearest neighbors
    // BFS (Later)
    // top and left are blocked
    const sizeX = arr[0].length;
    const sizeY = arr.length;
    for (let j = 0; j < sizeY - 1; ++j) {
        for (let i = 0; i < sizeX - 1; ++i) {
            let surround = 0;
            if (arr[j][i] == 1) { // only see if whites are surrounded
                continue;
            }
            // left
            if (i == 0) {
                ++surround;
            } else if (arr[j][i - 1] == 1) {
                ++surround;
            }
            // top
            if (j == 0) {
                ++surround;
            } else if (arr[j - 1][i] == 1) {
                ++surround;
            }
            // right
            if (arr[j][i + 1] == 1) {
                ++surround;
            }
            // bottom
            if (arr[j + 1][i] == 1) {
                ++surround;
            }
            if (surround == 4) {
                return true;
            }
        }
    }
    return false;
}

function isIsolated(arr, blackSum) {
    const whiteSum = sqMax * sqMax - blackSum;
    //return true;
    // BFS NOW !!
    // top and left are blocked
    //let freeSum = 0;
    let newSum;
    do  {
        newSum = 0;
    } while(newSum);

    for (let j = 0; j < sqMax - 1; ++j) {
        const jm = j * sqMax;
        for (let i = 0; i < sqMax - 1; ++i) {
            let surround = 0;
            const idx = jm + i;
            if (arr[idx] == 1) {
                continue;
            }
            // left
            if (i == 0) {
                ++surround;
            } else if (arr[idx - 1] == 1) {
                ++surround;
            }
            // top
            if (j == 0) {
                ++surround;
            } else if (arr[idx - sqMax] == 1) {
                ++surround;
            }
            // right
            if (arr[idx + 1] == 1) {
                ++surround;
            }
            // bottom
            if (arr[idx + sqMax] == 1) {
                ++surround;
            }
            if (surround == 4) {
                return true;
            }
        }
    }
    return false;
}

function checkPosition(p) {
    //return ""; // valid position
    //return "test";
    let blackSum = getBlackSum(p.board);
    // check array
    let status = ""; // good
    // check if blackSum matches goal
    if (p.goal >= 0 && blackSum != p.goal) {
        status = "wrong goal";
        return status;
    }
    //return ""; // test early good
    const arr = p.board;
    const sizeX = arr[0].length;
    const sizeY = arr.length;
    // check 2 blacks next to each other horizontal
    for (let j = 0; j < sizeY; ++j) {
        for (let i = 0; i < sizeX - 1; ++i) {
            if (arr[j][i] == 1) {
                if (arr[j][i + 1] == 1) {
                    status = "2blacksH";
                    return status;
                }
            }
        }
    }
    // check 2 blacks next to each other vertical
    for (let j = 0; j < sizeY - 1; ++j) {
        for (let i = 0; i < sizeX; ++i) {
            if (arr[j][i] == 1) {
                if (arr[j + 1][i] == 1) {
                    status = "2blacksV";
                    return status;
                }
            }
        }
    }
    //return status;
    // check if white is isolated/trapped
    const iso = isIsolatedOld(arr, blackSum, p.bounds);
    if (iso) {
        status = "isolated";
    }
    return status;
}

function getBlackSum(arr2d) {
    let sum = 0;
    for (const arr of arr2d) {
        sum += arr.reduce((acc, cur) => acc + cur, 0);
    }
    return sum;
}

function printBoard(arr) {
    for (let j = 0; j < arr.length; ++j) {
        //let row = "";
        let row = "%c";
        for (let i = 0; i < arr[0].length; ++i) {
            //const idx = jm + i;
            //row += arr[idx] ?  "\u25A0" : "\u25A1"; // browsers
            row += arr[j][i] ?  "\u25A1" : "\u25A0"; // VSC
            //row += arr[idx] ?  "B" : "W";
        }
        console.log(row, "color: lightgray;"); 
    }
}

// brSizeX, brSizeY, bounds, goal
function runBrute(p) {
    console.log("\nrun brute with sizeX = " + p.brSizeX + ", sizeY = " + p.brSizeY + ", goal = " + p.goal);
    let arr2d = createArray(p.brSizeY, p.brSizeX);
    fillArray(arr2d,0);
    const maxWatch = 1000000000;
    let watch = 0;
    let numGood = 0;
    let blackSum = getBlackSum(arr2d);
    const pos = {board: arr2d, bounds: p.bounds, goal: p.goal};
    do {
        let status = checkPosition(pos);
        if (!status) {
            ++numGood;
        }
        // show good boards sometimes
        //if (true) {
        if (!status) {
            if (!status) status = "good";
            // show array
            console.log("------- id = " + watch + ", blackSum = " + blackSum + ", status = " + status + " -------");
            printBoard(arr2d);
        }

        // next array
        let brk = false;
        for(let j = 0; j < arr2d.length; ++j) {
            if (brk) {
                break;
            }
            const arr = arr2d[j];
            for(let i = 0; i < arr.length; ++i) {
                arr[i] ^= 1;
                if (arr[i] != 0) {
                    brk = true;
                    break;
                }
            }
        }
        // watch array for too many iterations
        ++watch;
        if (watch >= maxWatch) {
            break;
        }
        // blackSum next array
        blackSum = getBlackSum(arr2d);
    } while (blackSum > 0); // see we reached the beginning
    console.log("good = " + numGood + ", bad = " + (watch - numGood) + ", total = " + watch);
}

function runHeyawake() {
    /*
        2D square in upper left corner FOR NOW, find valid solutions
        white is 0, black is 1
    */
    console.log("\nheyawake test");

    // special positions
    const special = true;
    if (special) {
        console.log("\ncheck some special positions");
        const specialPositions = [
            {
                board: [
                    [1, 0, 1, 0, 1],
                    [0, 0, 0, 0, 0],
                    [1, 0, 1, 0, 1],
                    [0, 0, 0, 1, 0],
                    [1, 0, 1, 0, 1]
                ],
                bounds: boardDirections.UP | boardDirections.LEFT,
                goal: 10,
            },
            {
                board: [
                    [0, 1, 0],
                    [1, 0, 1],
                ],
                bounds: boardDirections.UP | boardDirections.LEFT,
                goal: 3,
            }
        ];
        for (const pos of specialPositions) {
            let status = checkPosition(pos);
            if (!status) status = "good";
            const blackSum = getBlackSum(pos.board);
            console.log("status = " + status + ", goal = " + pos.goal + ", blackSum = " + blackSum);
            printBoard(pos.board);
        }
    }
    // try to solve for valid positions using some brute force
    const brute = true;
    if (brute) {
        // brSizeX, brSizeY, bounds, goal
        const brutes = [
            {brSizeX: 5, brSizeY: 5, bounds: boardDirections.UP | boardDirections.LEFT, goal: 10},
            {brSizeX: 3, brSizeY: 3, bounds: boardDirections.UP | boardDirections.LEFT, goal: 4},
            {brSizeX: 3, brSizeY: 2, bounds: boardDirections.UP | boardDirections.LEFT, goal: 2},
            {brSizeX: 2, brSizeY: 2, bounds: boardDirections.UP | boardDirections.LEFT, goal: 2},
        ];
        for (const b of brutes) {
            runBrute(b);
        }
    }
}
