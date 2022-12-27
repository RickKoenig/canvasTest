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
function arrDim(arr) {
    let ret = [];
    while(Array.isArray(arr)) {
        ret.push(arr.length);
        arr = arr[0];
    }
    return ret;
}

// 0 E, 1 W, 2 N, 3 S, 4 A, 5 D etc.
function doMove(topo, keys, edges, /*visited, */curState, dir) {
    const newPos = curState.pos.slice();
    const pm = 1 - 2 * (dir % 2); // plus minus +1 or -1
    const idx = Math.floor(dir / 2);
    const idx2 = newPos.length - idx - 1; // other way
    let val = newPos[idx];
    val += pm;
    if (val < 0) { // out of bounds
        return null;
    } else if (val >= topo[idx2]) {
        return null;
    }
    newPos[idx] = val;
    const newState = {
        pos: newPos,
        gold: curState.gold
    };
    return newState;
}

function runSim(mazeData) {
    const startPos = mazeData.startPos;
    const finishPos = mazeData.finishPos;
    const keys = mazeData.keys;
    const edges = mazeData.edges;

    // get dimensions of keys, this will give the complete structure of the maze
    const topo = arrDim(keys); // topology, start with (not curGold, is curGold) [g][z][y][x]
    const visited = createArray([2].concat(topo));
    fillArray(visited, false); // [g][z][y][x]

    const curState = {
        pos : startPos.slice(),
        gold : 0
    };
    console.log("curState = " + JSON.stringify(curState) + "\n");
    // move
    curState.pos = startPos;
    const dirStr = ['E', 'W', 'N', 'S', 'A', 'D'];
    const dirEnum = makeEnum(dirStr);
    const numDims = startPos.length;
    const dir = dirEnum.D;
    for (let i = 0; i < startPos.length * 2; ++i) {
        const newState = doMove(topo, keys, edges, /*visited, */curState, i)
        console.log("move = " + dirStr[i] + ", newState = " + JSON.stringify(newState));
    }
}


function rudolphSim() {
    // 12 verts/nodes, 3 dimensional, x = 3(W,E), y = 2(N,S), z = 2(A,D)
    console.log("############# Rudolph Simulation");
    const arrowEnum = makeEnum(["none", "all", "bigger", "smaller", "goldBigger", "goldSmaller"]);
    const E = makeEnum(["n", "a", "p", "m", "gp", "gm"]); // shorthand, same enum

    
    // mazeData

    const mazeData1 = {
        startPos: 
            [0, 0, 0],
        finishPos:
            [2, 0, 0],
        keys: [
            [
                [false, false, false],
                [false, false, false]
            ],
            [
                [false, false, false],
                [false, false, false]
            ]
        ],
        edges: [
            // move in x
            [
                [
                    [ E.n,  E.n],
                    [ E.n,  E.n]
                ],
                [
                    [ E.n,  E.n],
                    [ E.n,  E.n]
                ]
            ],
            // move in y
            [
                [
                    [ E.n,  E.n,  E.n]
                ],
                [
                    [ E.n,  E.n,  E.n]
                ]
            ],
            // move in z
            [
                [
                    [ E.n,  E.n,  E.n],
                    [ E.n,  E.n,  E.n]
                ]
            ]
        ]
    }

    runSim(mazeData1);
}


function javaScriptTests() {
    // test out features of javascript here
    console.log("javacript tests!");
    //inheritanceTests();
    rudolphSim();
    console.log("");
}
