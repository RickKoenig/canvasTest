'use strict';

const bD = {
    LEFT: 1,
    RIGHT: 2,
    UP: 4,
    DOWN: 8
}

// white is 0, black is 1
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
            switch(val) {
                case 0: // white
                    prefix += "\u25A0"; // VSC
                    //prefix += "\u25A1"; // browsers
                    //prefix += "W";
                    break;
                case 1: // black
                    prefix += "\u25A1"; // VSC
                    //prefix += "\u25A0"; // browsers
                    //prefix += "B";
                    break;
                case 2: // unknown
                    prefix += "x";
                    break;
            }
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

function checkPosition(p, allChecks = true) {
    const doBlackHorizontal = true; // && allChecks == true
    const doBlackVertical = true; // && allChecks == true
    const doIsolated = true;
    let blackSum = getBlackSum(p.board);
    let status = "good";
    // check if blackSum matches goal
    if (p.goal >= 0 && blackSum != p.goal) {
        status = "wrongGoal";
        return status;
    }
    const board = p.board;
    const sizeX = board[0].length;
    const sizeY = board.length;
    // check 2 blacks next to each other horizontal
    if (allChecks && doBlackHorizontal) {
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
    if (allChecks && doBlackVertical) {
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

// brSizeX, brSizeY, bounds, goal
function runBrute(p) {
    console.log("\nrun brute with sizeX = " + p.brSizeX + ", sizeY = " + p.brSizeY 
        + ", goal = " + p.goal + ", bounds = " + getBoundsStr(p.bounds));
    const board = createArray(p.brSizeY, p.brSizeX);
    fillArray(board, 0);
    const andBoard = createArray(p.brSizeY, p.brSizeX);
    fillArray(andBoard, 1);
    const orBoard = createArray(p.brSizeY, p.brSizeX);
    fillArray(orBoard, 0);
    const maxTotal = 1000000000; // don't go too far...
    const doSkipGoal = true; // enable skip binary count when invalid position found (goal, 2blackH, 2blackV)
    const doSkipBlackH = true;
    const doSkipBlackV = true;
    let numSkip = 0;
    let numGood = 0;
    let numBlacksH = 0;
    let numBlacksV = 0;
    let numWrongGoal = 0;
    let numIsolated = 0
    let total = 0;

    let blackSum = getBlackSum(board);
    let curSum = 0;
    const pos = {board: board, bounds: p.bounds, goal: p.goal};
    do {
        let status = checkPosition(pos, false);
        switch(status) {
            case "good":
                for (let j = 0; j < p.brSizeY; ++j) {
                    for (let i = 0; i < p.brSizeX; ++i) {
                        const v = board[j][i];
                        andBoard[j][i] &= v;
                        orBoard[j][i] |= v;
                    }
                }
                ++numGood;
                break;
            case "wrongGoal":
                ++numWrongGoal;
                break;
            case "isolated":
                ++numIsolated;
                break;
            case "2blacksH":
                ++numBlacksH;
                break;
            case "2blacksV":
                ++numBlacksV;
                break;
        }

        // show good boards sometimes
        //if (true) { // show everything
        //if (status != "good") { // show all bads
        //if (status == "isolated") { // show isolated bads
        if (status == "good") { // show goods

            // show array
            console.log("------- blackSum = " + blackSum + ", status = " + status + " -------");
            printBoard(board);
        }
        // next board
        let brk = false;
        for (let j = 0; j < board.length; ++j) {
            if (brk) {
                break;
            }
            const row = board[j];
            const mj = j *  row.length;
            for(let i = 0; i < row.length; ++i) {
                if (row[i]) { // 1 to 0
                    row[i] = 0;
                    --curSum; // and move to next digit
                } else { // 0 to 1
                    // skip invalid goals
                    const idx = i + mj;
                    if (doSkipGoal && p.goal >= 0 && curSum >= p.goal) { // bad goal
                        numSkip += 1 << idx; // don't change to a 1, goto next digit
                    } else if (doSkipBlackH && (i < row.length - 1) ? row[i + 1] : false) { // bad blackH
                        numSkip += 1 << idx; // don't change to a 1, goto next digit
                    } else if (doSkipBlackV && (j < board.length - 1) ? board[j + 1][i] : false) { // bad blackV
                        numSkip += 1 << idx; // don't change to a 1, goto next digit
                    } else { // good, no skip
                        row[i] = 1; // 0 to 1
                        ++curSum;
                        brk = true; // done with this board
                        break;
                    }
                }
            }
        }
        // watch array for too many iterations
        ++total;
        if (total >= maxTotal) {
            console.log("%cMAX TOTAL  HIT, too many boards!! " + total, "color: red");
            break;
        }
        // blackSum next array
        blackSum = getBlackSum(board);
    } while (blackSum > 0); // see we reached the beginning
    console.log("(good = " + numGood 
        + ", goal = " + numWrongGoal 
        + ", black horz = " + numBlacksH
        + ", black vert = " + numBlacksV
        + ", isolated = " + numIsolated
        + ") skip = " + numSkip 
        + ", total = " + (total + numSkip));
    if (numGood > 0) {
        console.log("AND board");
        printBoard(andBoard);
        console.log("OR board");
        printBoard(orBoard);
        const mergeBoard = createArray(p.brSizeY, p.brSizeX);
        for (let j = 0; j < p.brSizeY; ++j) {
            for (let i = 0; i < p.brSizeX; ++i) {
                const vAndOr = andBoard[j][i] + orBoard[j][i];
                let combine;
                switch(vAndOr) {
                    case 0:
                        combine = 0;
                        break;
                    case 1:
                        combine = 2;
                        break;
                    case 2:
                        combine = 1;
                        break;
                }
                mergeBoard[j][i] = combine;
            }
        }
        console.log("merge board");
        printBoard(mergeBoard);
    }
}

function runHeyawake() {
    /*
        2D square, find valid solutions
        white is 0, black is 1
    */
    console.log("%c\nheyawake test", "color: yellow");

    // special positions
    const special = true;
    if (special) {
        console.log("\ncheck some special positions");
        const specialPositions = [
            /*
            {
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
            },
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
            {brSizeX: 3, brSizeY: 3, bounds: bD.LEFT, goal: 4},
            {brSizeX: 5, brSizeY: 7, bounds: bD.UP, goal: 14},
            {brSizeX: 5, brSizeY: 5, bounds: bD.LEFT | bD.UP, goal: 10},
            /*{brSizeX: 3, brSizeY: 3, bounds: bD.UP | bD.LEFT, goal: 4},
            {brSizeX: 3, brSizeY: 2, bounds: bD.RIGHT, goal: 3},
            {brSizeX: 2, brSizeY: 2, bounds: bD.UP | bD.LEFT, goal: 2},
            {brSizeX: 3, brSizeY: 3, bounds: bD.UP | bD.LEFT | bD.UP | bD.DOWN, goal: 4},*/
        ];
        for (const b of brutes) {
            runBrute(b);
        }
    }
}
