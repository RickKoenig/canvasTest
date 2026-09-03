'use strict';

const dirVecs = [
    [-1, 0], // left
    [1, 0], // right
    [0, -1], // down
    [0, 1] // up
];

const avoid1Piece = function(startP, endP, avoidP, pieceSize) {
    const checkP = vec2.clone(endP);
    let pen = Number.MAX_VALUE;
    const avoidX = avoidP[0];
    const avoidY = avoidP[1];
    let pLeft, pRight, pBottom, pTop;
// left
    pLeft = checkP[0] - avoidX + pieceSize;
    if (pLeft < pen) {
        pen = pLeft;
    }
    // right
    pRight = avoidX - checkP[0] + pieceSize;
    if (pRight < pen) {
        pen = pRight;
    }
    // bottom
    pBottom = checkP[1] - avoidY + pieceSize;
    if (pBottom < pen) {
        pen = pBottom;
    }
    // top
    pTop = avoidY - checkP[1] + pieceSize;
    if (pTop < pen) {
        pen = pTop;
    }
    // the rest
    if (pen <= 0) {
        pen = 0; // no positive pens found, set to 0
    }
    return pen;
};

const avoidPieces = function(startP, endP, avoidPs, pieceSize) {
    for (let i = 0; i < avoidPs.length; ++i) {
        const avoidP = avoidPs[i];
        let result = avoid1Piece(startP, endP, avoidP, pieceSize);
        if (result > 0) {
            return result;
        }
    }
    return 0;
};

const solvePath = function(startPos, endPos, avoidLocs, pieceSize, slowA, solveSpeedA) {
    const slow = 1 / slowA;
    const slow2 = slow * slow;
    const moveV = vec2.create();
    const curPos = vec2.clone(startPos);
    for (let i = 0; i < solveSpeedA; ++i) {
        const dist2 = vec2.sqrDist(curPos, endPos) * 4; // add a little move dist to settle down
        if (slow2 > dist2) { // already arrived, close enough
            return curPos;
        }
        vec2.sub(moveV, endPos, curPos);
        vec2.normalize(moveV, moveV);
        vec2.scale(moveV, moveV, slow);
        const oldPos = vec2.clone(curPos);
        vec2.add(curPos, curPos, moveV); // see if this new curPos penetrates
        let pen = avoidPieces(oldPos, curPos, avoidLocs, pieceSize);
        if (!pen) {
            continue; // move freely
        }
        // penetrated, restrict movements, find a new direction
        vec2.copy(curPos, oldPos); // go back to before penetration
        const signX = Math.sign(endPos[0] - curPos[0]);
        const signY = Math.sign(endPos[1] - curPos[1]);
        // see if penetrates right left
        curPos[0] += slow * signX; // move left right
        pen = avoidPieces(oldPos, curPos, avoidLocs, pieceSize);
        if (pen) {
            // yes left right blocked, restrict to up and down
            vec2.copy(curPos, oldPos); // go back to before penetration
            if (Math.abs(endPos[1] - curPos[1]) * 2 <= slow) { // too close to move
                return curPos;
            }
            curPos[1] += slow * signY;
            pen = avoidPieces(oldPos, curPos, avoidLocs, pieceSize);
            if (pen) {
                // totally blocked
                vec2.copy(curPos, oldPos); // go back to before penetration
                return curPos;
            }
            continue; // move up and down
        }
        // no left right penetration, check up down penetration
        vec2.copy(curPos, oldPos); // go back to before penetration
        // see if penetrates up down
        curPos[1] += slow * signY; // move up down
        pen = avoidPieces(oldPos, curPos, avoidLocs, pieceSize);
        if (!pen) {
            continue;
        }
        vec2.copy(curPos, oldPos); // go back to before penetration
        // yes, restrict to left and right
        if (Math.abs(endPos[0] - curPos[0]) * 2 <= slow) { // too close to move
            return curPos;
        }
        curPos[0] += slow * signX;
        pen = avoidPieces(oldPos, curPos, avoidLocs, pieceSize);
        if (pen) {
            // totally blocked
            vec2.copy(curPos, oldPos); // go back to before penetration
            return curPos;
        }
    }
    return curPos;
};
