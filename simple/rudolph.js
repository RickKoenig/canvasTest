'use strict';

// returns an array of the dimensions of the input array
// an array of a[3][4][5] will return [5, 4, 3]
function arrDim(arr) {
    let ret = [];
    while(Array.isArray(arr)) {
        ret.push(arr.length);
        arr = arr[0];
    }
    return ret.reverse();
}

function readIndex(arr, pnt) { // arr[z][y][x], where x = pnt[0], y = pnt[1], z = pnt[2] etc.
    for (let idx = pnt.length - 1; idx >= 0; --idx) {
        arr = arr[pnt[idx]];
    }
    return arr; // no longer an Array
}

function writeIndex(arr, pnt, val) { // arr[z][y][x], where x = pnt[0], y = pnt[1], z = pnt[2] etc.
    for (let idx = pnt.length - 1; idx > 0; --idx) {
        arr = arr[pnt[idx]];
    }
    arr[pnt[0]] = val; // writing to a 1 dimensional array
}

// 0 E, 1 W, 2 N, 3 S, 4 A, 5 D etc.
function doMove(topo, keys, edges, curState, dir, E) {
    const oldPos = curState.pos;
    const oldGold = curState.gold;
    const newPos = oldPos.slice();
    const pm = 1 - 2 * (dir % 2); // plus minus +1 or -1
    const idx = Math.floor(dir / 2); // 0 EW, 1 NS, 2 AD etc.

    let val = newPos[idx];
    val += pm;
    if (val < 0) { // out of bounds
        return null;
    } else if (val >= topo[idx]) {
        return null;
    }
    newPos[idx] = val;

    const conct = [idx]; // the 4th dimension for x,y,z direction in edges
    if (pm == 1) {
        // use old pos for main edge idx (bigger)
        const cmd = readIndex(edges, oldPos.concat(conct));
        if (cmd == E.n) {
            return null;
        }
        if (cmd == E.m) { // move right on a left arrow
            return null;
        }
        if (cmd == E.gm && oldGold == 0) { // move right on a left gold arrow, gold = 0
            return null;
        }
        if (cmd == E.gp && oldGold == 1) { // move right on a right gold arrow, gold = 1
            return null;
        }
        // move ok
    } else { //pm == -1
        // use new pos for main edge idx (smaller)
        const cmd = readIndex(edges, newPos.concat(conct));
        if (cmd == E.n) {
            return null;
        }
        if (cmd == E.p) { // move left on a right arrow
            return null;
        }
        if (cmd == E.gp && oldGold == 0) { // move left on a right gold arrow, gold = 0
            return null;
        }
        if (cmd == E.gm && oldGold == 1) { // move left on a left gold arrow, gold = 1
            return null;
        }
        // move ok
    }

    // toggle gold with keys
    let newGold;
    const key = readIndex(keys, newPos);
    if (key) {
        newGold = 1 - oldGold;
    } else {
        newGold = oldGold;
    }


    const newState = {
        pos: newPos,
        gold: newGold
    };
    return newState;
}

// moveList is an array of moves: 0 E, 1 W, 2 N, 3 S, 4 A, 5 D etc.
function doMoveSeq(topo, keys, edges, curState, moveList, E) {
    let newState;
    for (let mv of moveList) {
        newState = doMove(topo, keys, edges, curState, mv, E);
        if (!newState) {
            return null;
        }
        curState = newState;
    }
    return newState;
}

function moveSeqStr(moveList, dirStr) {
    const ret = [];
    for (let mv of moveList) {
        ret.push(dirStr[mv]);
    }
    return ret;
}

function runSim(mazeData, edgeEnum) {
    let ret;
    const startPos = mazeData.startPos;
    const finishPos = mazeData.finishPos;  // goal
    const keys = mazeData.keys; // switch between normal and revers for gold arrows
    const edges = mazeData.edges;
    const stopWhenGoal = false;
    const maxSeq = 10;

    // get dimensions of keys, this will give the complete structure of the maze
    let topo = arrDim(keys);//.concat([2]); // topology, start with (not curGold, is curGold) [g][z][y][x]
    let topoR = topo.slice().reverse();
    const visited = createArray([2].concat(topoR)); // gold has 2 states [g][z][y][x]
    console.log("topo = " + topo);
    fillArray(visited, -1); // [g][z][y][x], -1 means not visited
    console.log("VISITED");
    console.log(visited);

    const startState = {
        pos : startPos.slice(),
        gold : 0
    };
    console.log("startState = " + JSON.stringify(startState) + "\n");
    console.log("goal = " + finishPos);
    // move east, west, north, south, ascend, descend
    const dirStr = ['E', 'W', 'N', 'S', 'A', 'D'];
    const numDims = startPos.length;
   
    /* moveLists, something like 
    [
        [ [] ], no moves, (1)
        [ [0], [1] ], // 1st move, list of 1 move sequences (2)
        [ [0, 0], [0, 1], [1, 0], [1, 1] ] // 1st and 2nd move, list of 2 move sequences (4)
    ]; 
    */
    const moveLists = [[[]]]; // 0th move has a list of no moves, wow

    writeIndex(visited, startPos.concat([startState.gold]), 0); // visited start position
    console.log("num seq = 0");
    console.log("total for 0 moves = 1");

    if (arrayEquals(startPos, finishPos)) {
        console.log("Goal Reached in Zero Moves");
        if (stopWhenGoal) {
            return;
        }
    }

    // calculate moves
    for (let numSeq = 1; numSeq <= maxSeq; ++numSeq) {
        console.log("\nnum seq = " + numSeq);
        const newMoveListN = []; // list of moves of 'numSeq' size
        // iterate over prev sequence list, and add new sequences to each
        const prevMoveListN = moveLists[numSeq - 1];
        let hitGoal = false;
        for (let prevMove of prevMoveListN) {
            for (let mv = 0; mv < numDims * 2; ++mv) {
                const newMoveSeq = prevMove.concat([mv]);
                const newState = doMoveSeq(topo, keys, edges, startState, newMoveSeq, edgeEnum);
                if (newState) {
                    const visitIdx = newState.pos.concat([newState.gold]);
                    const nm = readIndex(visited, visitIdx);
                    if (nm == -1 || numSeq <= nm) {
                        writeIndex(visited, visitIdx, numSeq);
                        newMoveListN.push(newMoveSeq);
                        let goal;
                        if (arrayEquals(newState.pos, finishPos)) {
                            goal = true;
                        }
                        ret = moveSeqStr(newMoveSeq, dirStr);
                        console.log("moveSeq = " + ret
                            + ", newState = " + JSON.stringify(newState) + (goal ? " GOAL" : ""));
                        if (goal) {
                            hitGoal = true;
                        }
                    }
                }
            }
        }
        console.log(`total for ${numSeq} moves = ${newMoveListN.length}`);
        moveLists.push(newMoveListN);
        if (hitGoal) {
            console.log("Goal Reached in " + numSeq + " moves !!! " + (stopWhenGoal ? "DONE" : ""));
            if (stopWhenGoal) {
                return ret;
            }
        }
        if (!newMoveListN.length) {
            console.log("No More Sequences Left DONE");
            return ret;
        }
    }
    console.log("Hit Max Sequence length = " + maxSeq + " !!! DONE");
    return ret;
}

function rudolphSim() {
    console.log("\n############# Rudolph Simulation");
    // none, all, bigger, smaller, goldBigger, goldSmaller
    const E = makeEnum(["n", "a", "p", "m", "gp", "gm"]); // shorthand
    // Y is inverted between 'UP' visual, and 'DOWN' the code array declarations
    // mazeData
    const mazeDataTest1 = {
        startPos: 
            [0, 0],
        finishPos:
            [1, 1],
        keys: [ // 2, 2
            [false, false],
            [false, true],
        ],
        edges: [
            // move in x // 1, 2
            [
                [ E.n],
                [ E.a]
            ],
            // move in y // 2, 1
            [
                [ E.a, E.a]
            ]
        ]
    }

    // mazeData
    // 12 verts/nodes, 3 dimensional, x = 3(W,E), y = 2(N,S), z = 2(A,D)
    const mazeDataReal = {
        startPos: 
            [0, 1, 0],
        finishPos:
            [2, 0, 0],
        keys: [ // 2, 2, 3
            [
                [false, false, false],
                [false, false, false]
            ],
            [
                [true, false, false],
                [false, false, true]
            ]
        ],
        edges: [
            // move in x // 2, 2, 2
            [
                [
                    [E.p , E.m ],
                    [E.p , E.m ]
                ],
                [
                    [E.gm, E.gm],
                    [E.gp, E.gp]
                ]
            ],
            // move in y // 2, 1, 3
            [
                [
                    [ E.gm, E.p, E.gm]
                ],
                [
                    [ E.gp, E.p, E.p]
                ]
            ],
            // move in z // 1, 2, 3
            [
                [
                    [E.m , E.gp, E.gp],
                    [E.gp, E.gp, E.gp]
                ]
            ]
        ]
    }

    const code = runSim(mazeDataReal, E); // pass in the enums for edge types
    return code.join("");
}
