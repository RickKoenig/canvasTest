'use strict';

class board {
    constructor(numLeaves, maxTokens) {
        this.numLeaves = numLeaves;
        this.maxTokens = maxTokens;
        this.numTokens = 0; // number of tokens on the board(played), same as last.numTokens played
        this.leaf = 0; // leaf where the next.numTokens will be placed
        this.tokenPos = []; // in.numTokens - 1, out leaf
        this.leaves = createArray(numLeaves, 0); // each leaf is an array of tokens
    }

    // check validity before calling, 'leaf' is reset to 0 for next.numTokens placment
    #addToken() {
        this.leaves[this.leaf].push(++this.numTokens);
        //this.tokenPos[this.numTokens] = this.leaf;
        this.tokenPos.push(this.leaf);
        this.leaf = 0;
    }

    // 'leaf' is where.numTokens was removed from
    #removeToken() {
        this.leaf = this.tokenPos.pop();
        --this.numTokens;
        //this.leaf = this.tokenPos[this.numTokens];
        //this.tokenPos[this.numTokens--] = null;
        this.leaves[this.leaf].pop();
    }

    // make sure new.numTokens is not the sum of any other tokens on this leaf
    // return true if allowed
    #checkToken() {
        //return true; // always good
        //return this.leaves[this.leaf].length < 2; // can't be placed if 2 or more leafs already present
        const newToken = this.numTokens + 1;
        return !doSumCheck(this.leaves[this.leaf], newToken); // leaf can't be sum of 2 other leaves
    }

    printBoard() {
        let str = JSON.stringify(this.leaves);
        console.log(str);
        str = JSON.stringify(this.tokenPos);
        console.log(str + "\n");
    }
    
    // depth first iteration for now, tricky
    nextPos() {
        // try to go deeper
        if (this.numTokens < this.maxTokens) {
            if (this.#checkToken()) {
                this.#addToken();
                return true;
            } else {
                this.#addToken(); // but move across
            }
        }
        let innerWatch = 0;
        while(this.numTokens > 0) {
            // watchdog
            ++innerWatch;
            const maxWatch = 400;
            if (innerWatch >= maxWatch) {
                console.log("inner watch hit !!");
                return false;
            }
            // try to move.numTokens across
            if (this.numTokens == 0) {
                return false;
            }
            this.#removeToken();
            ++this.leaf;
            if (this.leaf < this.numLeaves) {
                // no redundant cases, don't play if leaf to the left is empty
                if (this.leaves[this.leaf - 1].length > 0) {
                //if (true) {
                    if (this.#checkToken()) {
                        this.#addToken(); // good move
                        return true;
                    } else {
                        this.#addToken(); // bad move, move across
                        continue;
                    }
                } else {
                    continue;
                }
            }
            // try to go back up, then move across
            //console.log("going back up");
            continue;
        }
        //console.log("done sequence");
        return false;
    }
}

// return indices if found sum, null otherwise
// assumes ascending array
function doSumCheck(arr, target) {
    const len = arr.length;
    if (len < 2) {
        //console.log("too few elements");
        return null;
    }
    if (arr[0] * 2 > target) {
        //console.log("first element too big");
        return null;
    }
    if (arr[len - 1] * 2 < target) {
        //console.log("last element too small");
        return null;
    }
    let left = 0;
    let right = len - 1;
    while(left < right) {
        const sum = arr[left] + arr[right];
        if (sum > target) {
            --right;
        } else if (sum < target) {
            ++left;
        } else {
            //console.log("sum found");
            return [left, right];
        }
    }
    //console.log("no sum found");
    return null;
}

function doLadybug() {
    console.log("doing ladybug puzzle");
    const minLeaves = 1;
    const maxLeaves = 3;
    const maxTokens = 1000;
    for (let numLeaves = minLeaves; numLeaves <= maxLeaves; ++numLeaves) {
        let maxTokensPlayed = 0;
        console.log("\nNUM LEAVES = " + numLeaves);
        const game = new board(numLeaves, maxTokens);
        let outerWatch = 0;
        const maxOuterWatch = 20000000000;
        do {
            if (game.numTokens > maxTokensPlayed) {
                maxTokensPlayed = game.numTokens;
                console.log("maxTokensPlayed now at " + maxTokensPlayed);
            }
            if (true) {
            //if (false) {
            //if (outerWatch % 20000000 == 0) {
            //if (game.numTokens >= maxTokensPlayed) {
                //console.log("outerWatch now at " + outerWatch);
                //game.printBoard();
            }
            ++outerWatch;
            if (outerWatch >= maxOuterWatch) {
                console.log("outer watch hit");
                break;
            }
        } while(game.nextPos());
        console.log("total positions = " + outerWatch);
    }
    console.log("\ndone ladybug puzzle");
}
