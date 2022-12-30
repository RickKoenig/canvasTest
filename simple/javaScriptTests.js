'use strict';

// test inheritance
class Shape {
    constructor(pos) {
        this.pos = pos.slice();
    }

    print() {
        console.log("Shape: pos = " + this.pos);
    }

    area() {
        return 0;
    }

    isRound() {
        return false;
    }

    perimeter() {
        return 0;
    }
}

class Circle extends Shape {
    constructor(pos, radius) {
        super(pos);
        this.radius = radius;
    }

    area() {
        return Math.PI * this.radius * this.radius;
    }

    perimeter() {
        return 2 * Math.PI * this.radius;
    }

    isRound() {
        return true;
    }

    print() {
        console.log("Circle");
        super.print();
        console.log("radius = " + this.radius.toFixed(3));
    }
}

class Rect extends Shape {
    constructor(pos, sizeOrig) {
        super(pos);
        this.size = sizeOrig.slice();
    }

    area() {
        return this.size[0] * this.size[1];
    }

    perimeter() {
        return 2 * (this.size[0] + this.size[1]);
    }

    print() {
        console.log("Rect");
        super.print();
        console.log("size = " + this.size);
    }
}

function inheritanceTests() {
    console.log("\n\n############# inheritanceTests");
    const shapeList = [];

    shapeList.push(new Shape([17, 19]));
    shapeList.push(new Shape([23, 29]));
    shapeList.push(new Circle([44, 55], 1));
    shapeList.push(new Rect([447, 559], [16, 9]));

    for (let aShape of shapeList) {
        console.log("============");
        try {
            aShape.print();
            console.log("isRound = " + aShape.isRound());
            console.log("area = " + aShape.area().toFixed(3) + ", perimeter = " + aShape.perimeter().toFixed(3));
        } catch(e) {
            console.error("exception error: " + e);
        }
    }
}







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
function doMove(topo, keys, edges, /*visited, */curState, dir, E) {
    const oldPos = curState.pos;
    const newPos = oldPos.slice();
    const pm = 1 - 2 * (dir % 2); // plus minus +1 or -1
    const idx = Math.floor(dir / 2);

    //const idx2 = newPos.length - idx - 1; // other way
    let val = newPos[idx];
    val += pm;
    if (val < 0) { // out of bounds
        return null;
    } else if (val >= topo[idx]) {
        return null;
    }
    newPos[idx] = val;

    let cmd = 'placeHolder';
    const conct = [idx]; // the 4th dimension for x,y,z direction
    if (pm == 1) {
        // use old pos for edge idx (bigger)
        //cmd = readIndex(edges, oldPos.concat(conct));
        if (cmd == E.n) { // none
            //return null;
        }

    } else { //pm == -1
        // use new pos for edge (smaller)
        //cmd = readIndex(edges, newPos.concat(con));
    }
    //console.log("cmd = " + cmd);

    const newState = {
        pos: newPos,
        gold: curState.gold
    };
    return newState;
}

// 0 E, 1 W, 2 N, 3 S, 4 A, 5 D etc.
function doMoveSeq(topo, keys, edges, /*visited, */curState, moveList, E, dirStr) {
    let newState;
    for (let mv of moveList) {
        newState = doMove(topo, keys, edges, /*visited, */curState, mv, E);
        //console.log("moveSeq = " + dirStr[mv] + ", newState = " + JSON.stringify(newState));
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
    const startPos = mazeData.startPos;
    const finishPos = mazeData.finishPos;
    const keys = mazeData.keys; // switch between normal and revers for gold arrows
    const edges = mazeData.edges;

    // get dimensions of keys, this will give the complete structure of the maze
    let topo = arrDim(keys);//.concat([2]); // topology, start with (not curGold, is curGold) [g][z][y][x]
    let topoR = topo.slice().reverse();
    const visited = createArray(topoR); // gold has 2 states [g][z][y][x]
    //console.log("visited");
    //console.log(visited);
    //topo.reverse(); // now 3,2,2,2
    console.log("topo = " + topo);
    //console.log("topor = " + topoR);
    fillArray(visited, -1); // [g][z][y][x]
    console.log(visited);

    const startState = {
        pos : startPos.slice(),
        gold : 0
    };
    console.log("startState = " + JSON.stringify(startState) + "\n");
    // move
    const dirStr = ['E', 'W', 'N', 'S', 'A', 'D'];
    const dirEnum = makeEnum(dirStr);
    const numDims = startPos.length;
    const dir = dirEnum.D;
    //const newState = doMoveSequence(topo, keys, edges, startState, [0, 0, 2, 2, 1, 1, 3, 3], edgeEnum, dirStr);
    //console.log("newState = " + JSON.stringify(newState));
/* something like 
    [ 
        [ [0],[1] ], // 1st move, list of 1 move sequences
        [ [0, 0], [0, 1], [1, 0], [1, 1] ] // 1st and 2nd move, list of 2 move sequences
    ]; 
    */
   
    const maxMoves = 10;
    const moveLists = [[[]]]; // 0th move has a list of no moves
    writeIndex(visited, startPos, 0); // visited start position
    console.log("num moves = 0");
    console.log("total for 0 moves = 1");

    // calculate moves
    for (let numMoves = 1; numMoves <= maxMoves; ++numMoves) {
        console.log("");
        console.log("num moves = " + numMoves);
        const newMoveListN = []; // list of moves of 'numMoves' size
        // iterate over prev move list, and add new moves to each
        const prevMoveListN = moveLists[numMoves - 1];
        for (let prevMove of prevMoveListN) {
            //console.log("numMoves = " + numMoves + " movePrevList = " + JSON.stringify(prevMove));
            for (let mv = 0; mv < numDims * 2; ++mv) {
                const newMoveSeq = prevMove.concat([mv]);
                const newState = doMoveSeq(topo, keys, edges, startState, newMoveSeq, edgeEnum, dirStr);
                if (newState) {
                    const nm = readIndex(visited, newState.pos);
                    if (nm == -1 || numMoves <= nm) {
                        writeIndex(visited, newState.pos, numMoves);
                        newMoveListN.push(newMoveSeq);
                        console.log("moveSeq = " + moveSeqStr(newMoveSeq, dirStr)
                            + ", newState = " + JSON.stringify(newState));
                    }
                }
            }
        }
        console.log(`total for ${numMoves} moves = ${newMoveListN.length}`);
        moveLists.push(newMoveListN);
        if (!newMoveListN.length) {
            console.log("No More Moves !!!");
            break;
        }
        //console.log(moveLists);
    }

   /*
    for (let numMoves = 0; numMoves < maxMoves; ++numMoves) {
        for (let mv = 0; mv < startPos.length * 2; ++mv) {
            const newState = doMove(topo, keys, edges, startState, mv, edgeEnum)
            console.log("move = " + dirStr[mv] + ", newState = " + JSON.stringify(newState));
            if (newState) {

            }
        }
    }*/
}


function rudolphSim() {
    // 12 verts/nodes, 3 dimensional, x = 3(W,E), y = 2(N,S), z = 2(A,D)
    console.log("############# Rudolph Simulation");
    const arrowEnum = makeEnum(["none", "all", "bigger", "smaller", "goldBigger", "goldSmaller"]);
    const E = makeEnum(["n", "a", "p", "m", "gp", "gm"]); // shorthand, same enum

    
    // mazeData
    const mazeDataTest = {
        startPos: 
            [0, 0],
        finishPos:
            [1, 1],
        keys: [ // 2, 2
            [false, false],
            [false, false],
        ],
        edges: [
            // move in x // 1, 2
            [
                [ 3],
                [ 7]
            ],
            // move in y // 2, 1
            [
                [ 30, 50]
            ]
        ]
    }

    // mazeData
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

    runSim(mazeDataTest, E); // pass in the enums for edge types
}


function javaScriptTests() {
    // test out features of javascript here
    console.log("javacript tests!");
    //inheritanceTests();
    rudolphSim();

/*
    const arr = [ // [2][3][4], (z,y,x)
        [
            [
                2, 3, 5, 7
            ],
            [
                11, 13, 17, 19
            ],
            [
                23, 29, 31, 37
            ]
        ],
        [
            [
                41, 43, 47, 53
            ],
            [
                59, 61, 67, 71
            ],
            [
                73, 79, 83, 89
            ]
        ]
    ]
    const dim = arrDim(arr);
    console.log("test dim = " + dim);
    console.log(arr[1][2][3]);
    const pnt = [3, 2, 1];
    writeIndex(arr, pnt, 555);
    writeIndex(arr, [1,2,1], 666);
    const val2 = readIndex(arr, [1,2,1]);
    console.log("val2 = " + val2);
    const val = readIndex(arr, pnt);
    console.log(val);
    console.log(arr);
*/

    console.log("");
}
