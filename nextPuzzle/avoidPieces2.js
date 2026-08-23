'use strict';

const avoid1Piece = function(startP, endP, avoidP) {
    let penDir = -1;
    let penVec = vec2.create();
    
    const dirVecs = [
        [-1, 0], // left
        [1, 0], // right
        [0, -1], // down
        [0, 1] // up
    ];

    const checkP = vec2.clone(endP);
    const newPos = vec2.clone(endP);

    const pieceSize = 1;//.75;

    let pen = Number.MAX_VALUE;

    const avoidX = avoidP[0];
    const avoidY = avoidP[1];
    let pLeft, pRight, pBottom, pTop;

// left
    pLeft = checkP[0] - avoidX + pieceSize;
    if (pLeft < pen) {
        pen = pLeft;
        penDir = 0;
    }
    // right
    pRight = avoidX - checkP[0] + pieceSize;
    if (pRight < pen) {
        pen = pRight;
        penDir = 1;
    }
    // bottom
    pBottom = checkP[1] - avoidY + pieceSize;
    if (pBottom < pen) {
        pen = pBottom;
        penDir = 2;
    }
    // top
    pTop = avoidY - checkP[1] + pieceSize;
    if (pTop < pen) {
        pen = pTop;
        penDir = 3;
    }
    // the rest
    if (pen <= 0) {
        pen = 0; // no positive pens found, set to 0
        penDir = -1;
    }
    if (penDir >= 0) { // found penetration, adjust
        vec2.scale(penVec, dirVecs[penDir], pen);
        vec2.add(newPos, checkP, penVec);
    }
    return {newPos, pen};
};

const avoidPieces = function(startP, endP, avoidPs) {
    //const ret = vec2.clone(endP);
    //return ret;
    const resultsP = [];
    for (let i = 0; i < avoidPs.length; ++i) {
        const avoidP = avoidPs[i];
        let result = avoid1Piece(startP, endP, avoidP);
        resultsP.push(result);
    }
    
    let bestIdx = -1;
    // best min dist
    // find best index
    // best min pen > 0
    let bestPen = Number.MAX_VALUE;
    for (let i = 0; i < resultsP.length; ++i) {
        const pen = resultsP[i].pen;
        if (pen < bestPen && pen > 0) {
            bestPen = pen;
            bestIdx = i;
        }
    }
    if (bestIdx >= 0) {
        return resultsP[bestIdx].newPos;
    } else {
        return endP;
    }	
};

// intersect line with 2 by 2 square at avoidP
// return start and end intersections or -1, -1 to -.5, -.5 if none
const slabCalc = function(startP, endP, avoidP) {
    const epsilon = .1;
    const big = 100;
    let invDirX = big;
    let invDirY = big;
    const dir = vec2.create();
    vec2.sub(dir, startP, endP);
    const pEnter = vec2.create();
    const pExit = vec2.create();
    if (Math.abs(dir[0]) >= epsilon) { // too close to divide by 0
        invDirX = 1 / dir[0];
    }
    if (Math.abs(dir[1]) >= epsilon) { // too close to divide by 0
        invDirY = 1 / dir[1];
    }
// bot
    const botY = avoidP[1] - 1;
    const tBot = (botY - startP[1]) * invDirY;
    const botX = startP[0] + tBot * dir[0];
// top
    const topY = avoidP[1] + 1;
    const tTop = (topY - startP[1]) * invDirY;
    const topX = startP[0] + tTop * dir[0];

// right
    const leftX = avoidP[0] - 1;
    const tLeft = (leftX - startP[0]) * invDirX;
    const leftY = startP[1] + tLeft * dir[1];
// left
    const rightX = avoidP[0] + 1;
    const tRight = (topY - startP[0]) * invDirX;
    const rightY = startP[1] + tRight * dir[1];

    //vec2.set(pEnter, botX, botY);
    //vec2.set(pExit, topX, topY);
    vec2.set(pEnter, leftX, leftY);
    vec2.set(pExit, rightX, rightY);
    return {pEnter, pExit};
};
