'use strict';

class board {
    constructor(numLeaves, maxTokens) {
        this.numLeaves = numLeaves;
        this.maxTokens = maxTokens;
        this.token = 0; // number of tokens on the board(played), same as last token played
        this.leaf = 0; // leaf where the next token will be placed
        this.tokenPos = []; // in token, out leaf
        this.leaves = createArray(numLeaves, 0); // each leaf is an array of tokens
    }

    // check validity before calling, 'leaf' is reset to 0 for next token placment
    #addToken() {
        this.leaves[this.leaf].push(++this.token);
        this.tokenPos[this.token] = this.leaf;
        this.leaf = 0;
    }

    // 'leaf' is where token was removed from
    #removeToken() {
        this.leaf = this.tokenPos[this.token];
        this.tokenPos[this.token--] = null;
        this.leaves[this.leaf].pop();
    }

    // make sure new token is not the sum of any other tokens on this leaf
    #checkToken() {
        return true;
        const newToken = this.token + 1;
        return this.leaves[this.leaf].length < 2;
        //return this.token < 2;
        //return true;
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
        if (this.token < this.maxTokens) {
            if (this.#checkToken()) {
                this.#addToken();
                return true;
            }
        }
        let innerWatch = 0;
        while(this.token > 0) {
            // watchdog
            ++innerWatch;
            const maxWatch = 40;
            if (innerWatch >= maxWatch) {
                console.log("inner watch hit !!");
                return false;
            }
            // try to move token across
            //while(this.leaf < this.numLeaves) {
                this.#removeToken();
                ++this.leaf;
                if (this.leaf < this.numLeaves) {
                    // no redundant cases, don't play if leaf to the left is empty
                    if (this.leaves[this.leaf - 1].length > 0) {
                        if (this.#checkToken()) {
                            this.#addToken();
                            return true;
                        }
                    }
                }
            //}
            // try to go back up, then move across
            console.log("going back up");
            continue;
        }
    }
}

function doLadybug() {
    console.log("doing ladybug puzzle");
    const numLeaves = 3;
    const maxTokens = 3;
    const game = new board(numLeaves, maxTokens);
    let outerWatch = 0;
    const maxOuterWatch = 2000;
    do {
        console.log("");
        game.printBoard();
        ++outerWatch;
        if (outerWatch >= maxOuterWatch) {
            console.log("outer watch hit");
            break;
        }
    } while(game.nextPos());
    console.log("done ladybug puzzle, outerWatch = " + outerWatch);
}
