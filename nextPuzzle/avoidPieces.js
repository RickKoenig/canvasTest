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
