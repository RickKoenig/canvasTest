'use strict';

const bD = {
    LEFT: 1,
    RIGHT: 2,
    UP: 4,
    DOWN: 8
}

function findFirstWhite(board) {
    for (let j = 0; j < board.length; ++j) {
        const row = board[j];
        for (let i = 0; i < row.length; ++i) {
            if (row[i] == 0) {
                return [i, j];
            }
        }
    }
    return null;
}

// return false if no whites are isolated
function isIsolated(board, bounds) {
    const sizeX = board[0].length;
    const sizeY = board.length;
    if (sizeX == 1 && sizeY == 1) {
        return false; // a 1 by 1 is always good for any bounds
    }
    // BFS now !
    // has at least 1 white
    const blackSum = getBlackSum(board);
    const whiteSum = sizeX * sizeY - blackSum;
    const visited = createArray(sizeY, sizeX);
    let numVisited = 0;
    fillArray(visited, false);
    let nexts = []; // array of coords for new visits
    // setup visited seeds
    if (!(bounds & bD.LEFT)) {
        const i = 0;
        for (let j = 0; j < sizeY; ++j) {
            if (!visited[j][i] && board[j][i] == 0) { // white
                visited[j][i] = true;
                ++numVisited;
                nexts.push([i, j]);
            }
        }
    }
    if (!(bounds & bD.RIGHT)) {
        const i = sizeX - 1;
        for (let j = 0; j < sizeY; ++j) {
            if (!visited[j][i] && board[j][i] == 0) { // white
                visited[j][i] = true;
                ++numVisited;
                nexts.push([i, j]);
            }
        }
    }
    if (!(bounds & bD.UP)) {
        const j = 0;
        for (let i = 0; i < sizeX; ++i) {
            if (!visited[j][i] && board[j][i] == 0) { // white
                visited[j][i] = true;
                ++numVisited;
                nexts.push([i, j]);
            }
        }
    }
    if (!(bounds & bD.DOWN)) {
        const j = sizeY - 1;
        for (let i = 0; i < sizeX; ++i) {
            if (!visited[j][i] && board[j][i] == 0) { // white
                visited[j][i] = true;
                ++numVisited;
                nexts.push([i, j]);
            }
        }
    }
    // fully bounded, seed with first white
    if (bounds == (bD.LEFT | bD.RIGHT | bD.UP | bD.DOWN)) {
        let [i, j] = findFirstWhite(board);
        visited[j][i] = true;
        ++numVisited;
        nexts.push([i, j]);
    }
    // run through new visits
    while(nexts.length) {
        //console.log("new visits = " + nexts.length);
        const olds = nexts;
        nexts = [];
        for (const p of olds) {
            let [i, j] = p;
            // left
            if (i > 0 && board[j][i - 1] == 0 && !visited[j][i - 1]) {
                visited[j][i - 1] = true;
                ++numVisited;
                nexts.push([i - 1, j]);
            }
            // right
            if (i < sizeX - 1 && board[j][i + 1] == 0 && !visited[j][i + 1]) {
                visited[j][i + 1] = true;
                ++numVisited;
                nexts.push([i + 1, j]);
            }
            // up
            if (j > 0 && board[j - 1][i] == 0 && !visited[j - 1][i]) {
                visited[j - 1][i] = true;
                ++numVisited;
                nexts.push([i, j - 1]);
            }
            // down
            if (j < sizeY - 1 && board[j + 1][i] == 0 && !visited[j + 1][i]) {
                visited[j + 1][i] = true;
                ++numVisited;
                nexts.push([i, j + 1]);
            }
        }
    }
    //console.log("total visited = " + numVisited);
    return numVisited != whiteSum;
}

function checkPosition(p) {
    const doGoal = true;
    const doBlackHorizontal = true;
    const doBlackVertical = true;
    const doIsolated = true;
    const doBad = false;
    if (doBad) {
        return "bad";
    }
    let blackSum = getBlackSum(p.board);
    let status = ""; // no status is good
    // check if blackSum matches goal
    if (doGoal && p.goal >= 0 && blackSum != p.goal) {
        status = "wrong goal";
        return status;
    }
    const board = p.board;
    const sizeX = board[0].length;
    const sizeY = board.length;
    // check 2 blacks next to each other horizontal
    if (doBlackHorizontal) {
        for (let j = 0; j < sizeY; ++j) {
            for (let i = 0; i < sizeX - 1; ++i) {
                if (board[j][i] == 1) {
                    if (board[j][i + 1] == 1) {
                        status = "2blacksH";
                        return status;
                    }
                }
            }
        }
    }
    // check 2 blacks next to each other vertical
    if (doBlackVertical) {
        for (let j = 0; j < sizeY - 1; ++j) {
            for (let i = 0; i < sizeX; ++i) {
                if (board[j][i] == 1) {
                    if (board[j + 1][i] == 1) {
                        status = "2blacksV";
                        return status;
                    }
                }
            }
        }
    }
    // check if white is isolated/trapped
    if (doIsolated) {
        const iso = isIsolated(board, p.bounds);
        if (iso) {
            status = "isolated";
        }
    }
    return status;
}

function getBlackSum(board) {
    let sum = 0;
    for (const row of board) {
        sum += row.reduce((acc, cur) => acc + cur, 0);
    }
    return sum;
}

function printBoard(board) {
    for (const row of board) {
        //let prefix = "";
        let prefix = "%c";
        for (const val of row) {
            //prefix += val ?  "\u25A0" : "\u25A1"; // browsers
            prefix += val ?  "\u25A1" : "\u25A0"; // VSC
            //prefix += val ?  "B" : "W";
        }
        console.log(prefix, "color: lightgray;"); 
    }
}

function getBoundsStr(b) {
    if (b == 0) {
        return "none";
    }
    let s = "";
    if (b & bD.LEFT) s += "L";
    if (b & bD.RIGHT) s += "R";
    if (b & bD.UP) s += "U";
    if (b & bD.DOWN) s += "D";
    return s;
}

// brSizeX, brSizeY, bounds, goal
function runBrute(p) {
    console.log("\nrun brute with sizeX = " + p.brSizeX + ", sizeY = " + p.brSizeY 
        + ", goal = " + p.goal + ", bounds = " + getBoundsStr(p.bounds));
    let board = createArray(p.brSizeY, p.brSizeX);
    fillArray(board,0);
    const maxWatch = 1000000000;
    let watch = 0;
    let numGood = 0;
    let blackSum = getBlackSum(board);
    let curSum = 0;
    const pos = {board: board, bounds: p.bounds, goal: p.goal};
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
            printBoard(board);
        }
        // next board
        let brk = false;
        for(let j = 0; j < board.length; ++j) {
            if (brk) {
                break;
            }
            const row = board[j];
            for(let i = 0; i < row.length; ++i) {
                if (row[i]) { // 1 to 0
                    row[i] = 0;
                    --curSum;
                //} else if (true) { // 0 to 1, check if blackSum >= goal
                } else if (curSum < p.goal) { // 0 to 1, check if blackSum >= goal
                    // only if curSum < goal
                    row[i] = 1;
                    ++curSum;
                    brk = true;
                    break;
                }
            }
        }
/*
        // next array
        let brk = false;
        for(let j = 0; j < board.length; ++j) {
            if (brk) {
                break;
            }
            const row = board[j];
            for(let i = 0; i < row.length; ++i) {
                row[i] ^= 1;
                if (row[i] != 0) {
                    brk = true;
                    break;
                }
            }
        }
*/        // watch array for too many iterations
        ++watch;
        if (watch >= maxWatch) {
            break;
        }
        // blackSum next array
        blackSum = getBlackSum(board);
    } while (blackSum > 0); // see we reached the beginning
    console.log("good = " + numGood + ", bad = " + (watch - numGood) + ", total = " + watch);
}

function runBinaryTest() {
    const board = createArray(3, 3);
    fillArray(board, 0);
    //let blackSum; // number of 1's in the array
    let curSum = 0; // a better way than getBlackSum
    let count = 0;
    const goal = 1; // black is 1, white is 0, goal is num blacks
    console.log("\nrun binary test, goal = " + goal);
    // next array, with constraints
    do {
        console.log("count = " + (count++).toString().padStart(2) + ", " + JSON.stringify(board));

        // next board
        let brk = false;
        for(let j = 0; j < board.length; ++j) {
            if (brk) {
                break;
            }
            const row = board[j];
            for(let i = 0; i < row.length; ++i) {
                if (row[i]) { // 1 to 0
                    row[i] = 0;
                    --curSum;
                } else if (curSum < goal) { // 0 to 1, check if blackSum >= goal
                    // only if curSum < goal
                    row[i] = 1;
                    ++curSum;
                    brk = true;
                    break;
                }
            }
        }
    } while (curSum > 0); // see if we reached the beginning optimized
    console.log("count = " + count);
}

function runHeyawake() {
    runBinaryTest();
    /*
        2D square in upper left corner FOR NOW, find valid solutions
        white is 0, black is 1
    */
    console.log("%c\nheyawake test", "color: yellow");

    // special positions
    const special = true;
    if (special) {
        console.log("\ncheck some special positions");
        const specialPositions = [
            /*{
                board: [
                    [1, 0, 1, 0, 1],
                    [0, 0, 0, 0, 0],
                    [1, 0, 1, 0, 1],
                    [0, 0, 0, 1, 0],
                    [1, 0, 1, 0, 1]
                ],
                bounds: bD.LEFT | bD.UP,
                goal: 10,
            },
            {
                board: [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
                bounds: 0,//bD.LEFT | bD.UP,
                goal: 0,
            },
            {
                board: [
                    [0, 1, 0],
                    [1, 0, 1],
                ],
                bounds: 0,//bD.LEFT | bD.UP,
                goal: 3,
            }
            {
                board: [
                    [0, 0, 0],
                    [1, 0, 1],
                    [0, 0, 0],
                ],
                bounds: bD.LEFT | bD.UP | bD.RIGHT | bD.DOWN,
                goal: -1,
            }*/
        ];
        for (const pos of specialPositions) {
            console.log("");
            printBoard(pos.board);
            let status = checkPosition(pos);
            if (!status) status = "good";
            const blackSum = getBlackSum(pos.board);
            console.log("status = " + status + ", goal = " + pos.goal + ", bounds = " + getBoundsStr(pos.bounds) + ", blackSum = " + blackSum);
        }
    }
    // try to solve for valid positions using some brute force
    console.log("\ncheck some brute force positions");
    const brute = true;
    if (brute) {
        // brSizeX, brSizeY, bounds, goal
        const brutes = [
            {brSizeX: 5, brSizeY: 5, bounds: bD.LEFT | bD.UP, goal: 10},
            {brSizeX: 3, brSizeY: 3, bounds: bD.UP | bD.LEFT, goal: 4},
            {brSizeX: 3, brSizeY: 2, bounds: bD.RIGHT, goal: 3},
            {brSizeX: 2, brSizeY: 2, bounds: bD.UP | bD.LEFT, goal: 2},
            {brSizeX: 3, brSizeY: 3, bounds: bD.UP | bD.LEFT | bD.UP | bD.DOWN, goal: 4},
        ];
        for (const b of brutes) {
            runBrute(b);
        }
    }
}
