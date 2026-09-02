'use strict';

const dirVecs = [
    [-1, 0], // left
    [1, 0], // right
    [0, -1], // down
    [0, 1] // up
];

const avoid1Piece = function(startP, endP, avoidP) {
    let penDir = -1;
    let penVec = vec2.create();
    
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

const avoidPieces = function(startP, endP, avoidPs, pieceSize) {
    const resultsP = [];
    for (let i = 0; i < avoidPs.length; ++i) {
        const avoidP = avoidPs[i];
        //let result = avoid1Piece(startP, endP, avoidP);
        let result = slabCalc(startP, endP, avoidP, pieceSize);
        resultsP.push(result);
    }
    
    let bestIdx = -1;
    // best min dist
    // find best index
    // best min time with a valid direction > 0
    let bestTime = Number.MAX_VALUE;
    for (let i = 0; i < resultsP.length; ++i) {
        const result = resultsP[i];
        const dir = result.dir;
        if (dir >= 0) {
            const t = result.tMin;
            if (t < bestTime) {
                bestTime = t;
                bestIdx = i;
            }
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
const slabCalc = function(startP, endP, avoidP, pieceSize) {
    const epsilon = .1;
    const big = 100;
    let invDirX = big;
    let invDirY = big;

    const dirV = vec2.create();
    let dir = -1;
    let wDir = -1;
    let pen = 0;
    vec2.sub(dirV, endP, startP);
    const pEnter = vec2.fromValues(-1, -1);
    const pExit = vec2.fromValues(-.5, -.5);
    if (Math.abs(dirV[0]) >= epsilon) { // too close to divide by 0
        invDirX = 1 / dirV[0];
    }
    if (Math.abs(dirV[1]) >= epsilon) { // too close to divide by 0
        invDirY = 1 / dirV[1];
    }    

// left
    const leftX = avoidP[0] - pieceSize;
    const tLeft = (leftX - startP[0]) * invDirX;
// right
    const rightX = avoidP[0] + pieceSize;
    const tRight = (rightX - startP[0]) * invDirX;

    let tXmin, tXmax;
    let dirX;
    if (tLeft < tRight) {
        dirX = 0;
        tXmin = tLeft;
        tXmax = tRight;
    } else {
        dirX = 1;
        tXmin = tRight;
        tXmax = tLeft;
    }

// bot
    const botY = avoidP[1] - pieceSize;
    const tBot = (botY - startP[1]) * invDirY;
// top
    const topY = avoidP[1] + pieceSize;
    const tTop = (topY - startP[1]) * invDirY;

    let tYmin, tYmax;
    let dirY;
    if (tBot < tTop) {
        dirY = 2;
        tYmin = tBot;
        tYmax = tTop;
    } else {
        dirY = 3;
        tYmin = tTop;
        tYmax = tBot;
    }

// all, max of min, min of max
    let tMin, tMax;
    if (tXmin > tYmin) {
        wDir = dirX;
        tMin = tXmin;
    } else {
        wDir = dirY;
        tMin = tYmin;
    }
    if (tXmax < tYmax) {
        tMax = tXmax;
    } else {
        tMax = tYmax;
    }

    const newPos = vec2.clone(endP);
    const negT = -.025;

    if (tMin > 0 && tMin < 1 && tMin < tMax) {
        dir = wDir;
        vec2.lerp(pEnter, startP, endP, tMin);
        vec2.lerp(pExit, startP, endP, tMax);

        const penV = vec2.create();
        vec2.sub(penV, pEnter, endP);
        const dv = vec2.clone(dirVecs[dir]);
        pen = vec2.dot(penV, dv);

        vec2.scale(dv, dv, pen - negT);
        vec2.add(newPos, dv, endP);
    }
    return {pEnter, pExit, tMin, dir, pen, newPos};
};
