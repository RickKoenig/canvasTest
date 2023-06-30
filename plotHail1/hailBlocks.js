'use strict';

// build an array of hail moves for drawing later
class HailBlocks {
    
    constructor() {
        // do some negatives for comparision, must be 0 or less, -5 is different, don't handle for now
        this.minNum = 0; // handle negative numbers, offset into array
        this.maxNum = 64;
        this.movesList = []; // moves: true for up, false for down, and numbers:
        this.maxValue = 0n;
        // hand do a few negative values
        switch(this.minNum) {
            case -4: this.movesList.push({moves: [false, false], numbers: [-2, -1]}); // 2 moves for -3
            case -3: this.movesList.push({moves: [true, false, false, false], numbers: [-8, -4, -2, -1]}); // 4 moves for -3
            case -2: this.movesList.push({moves: [false], numbers: [-1]}); // 1 move for -2
            case -1: this.movesList.push({moves: []}); // no moves for -1
        }
        this.movesList.push({moves: []}); // no moves for 0
        for (let i = 1; i <= this.maxNum; ++i) {
            const result = recordHailSteps(i);
            if (result.maxValue > this.maxValue) this.maxValue = result.maxValue;
            this.movesList.push(result);
        }
    }

    draw(dp, minHailMoves) {
        const sz = .6;
        const size = vec2.fromValues(sz, sz);
        const rad = sz / 2;
        const smaller = .95; // slightly smaller lines
        const lineWidth = .04;
        for (let i = 0; i < this.movesList.length; ++i) {
            const result = this.movesList[i];
            let j = 0; // need 'j' later
            for (; j < result.moves.length; ++j) {
                const center = vec2.fromValues(i + this.minNum, j + 1);
                dp.drawRectangleCenter(center, size, result.moves[j] ? "green" : "red");
                dp.drawRectangleCenterO(center, size, .01, "black");
                dp.drawText(center, [size[0] * .5, size[1] * .5], result.numbers[j], "yellow");
            }
            dp.drawLine([i + this.minNum - .5 * smaller, .5 + result.moves.length]
                , [i + this.minNum + .5 * smaller, .5 + result.moves.length]
                , lineWidth, "blue");
            // made it to '1' or '0' or '-1', see if any extra moves to draw
            let startNum = 0;
            const theNum = i + this.minNum;
            if (theNum >= 1) {
                startNum = 1; // 4, 2, 1, 4, 2, '1'
            } else if (theNum < 0) { // 0, 0, '0'
                startNum = -1; // -1, -1, '-1'
            }
            let move = startNum % 2;
            let extraNum = hailStep(BigInt(startNum));
            for (; j < minHailMoves; ++j) {
                const center = vec2.fromValues(i + this.minNum, j + 1);
                dp.drawCircle(center, rad, move ? "green" : "red");
                dp.drawCircleO(center, rad, .01, "black");
                dp.drawText(center, [size[0] * .5, size[1] * .5], extraNum, "yellow");
                move = extraNum % 2n;
                extraNum = hailStep(extraNum);
            }
            // draw vertical bars, dividing sections by powers of 2
            for (let i = 0; i <= this.movesList.length; ++i) {
                let mod = 2;
                for (j = 0; j < minHailMoves; ++j) {
                    const theNum = i + this.minNum;
                    //if (j %2) continue;
                    if (theNum % mod != 0) continue;
                    mod *= 2;
                    dp.drawLine([i -.5 + this.minNum, j + 1 - .5 * smaller]
                        , [i -.5 + this.minNum, j + 1 + .5 * smaller]
                        , lineWidth, "brown");
                }
            }
        }
    }

    getMaxValue() {
        return this.maxValue;
    }
}