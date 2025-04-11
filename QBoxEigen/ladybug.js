'use strict';

// global
let leaves = [];
let tokenPos = [];

class board {
    constructor(numLeaves, maxTokens) {
        this.numLeaves = numLeaves;
        this.maxTokens = maxTokens;
        this.token = 0;
        this.leaf = 0;
        this.tokenPos = [];
        this.leaves = [];
        this.#initLeaves();
        this.watch = 0;
    }

    // empty arrays for all leaves
    #initLeaves() {
        for (let i = 0; i < this.numLeaves; ++i) {
            this.leaves.push([]);
        }
    }

    printLeaves() {
        const str = JSON.stringify(this.leaves);
        console.log(str);
    }

    printTokenPos() {
        const str = JSON.stringify(this.tokenPos);
        console.log(str);
    }
    
    // check before calling
    #addToken() {
        this.leaves[this.leaf].push(++this.token);
        this.tokenPos[this.token] = this.leaf;
    }

    // return leaf removed from
    #removeToken() {
        const leaf = this.tokenPos[this.token];
        this.tokenPos[this.token--] = null;
        this.leaves[leaf].pop();
        return leaf;
        //return leaves[leaves.length - 1];
    }

    // Depth First Search for now
    nextPos() {
        ++this.watch;
        const maxWatch = 20;
        let good = this.watch < maxWatch;
        if (!good) {
            console.log("watch hit !!");
        }
        while(true) {
            // try to go deeper
            if (this.token < this.maxTokens) {
                //this.leaf = 0;
                this.#addToken();
                this.leaf = 0;
            // try to move token across
            } else {
                this.leaf = this.#removeToken();
                ++this.leaf;
                if (this.leaf < this.numLeaves) {
                    this.#addToken();
                // try to go back up
                } else {
                    console.log("going back up");
                    if (this.token == 0) {
                        return false;
                    } else {
                        this.leaf = this.#removeToken();
                        ++this.leaf;
                        continue;
                    }
                }
            } 
            return good;
        }
    }
}

function initLeaves(numLeaves) {
    for (let i = 0; i < numLeaves; ++i) {
        leaves.push([]);
    }
    /*
    // place '1' token
    leaves[0].push(1);
    */
}

function printLeaves() {
    const str = JSON.stringify(this.leaves);
    console.log(str);
}

function printTokenPos() {
    const str = JSON.stringify(this.tokenPos);
}

// return success
function addToken(token, leaf) {
    leaves[leaf].push(token);
    tokenPos[token] = leaf;
    return true;
}

// return leaf removed from
function removeToken(token) {
    const leaf = tokenPos[token];
    leaves[leaf].pop();
    //return leaves[leaves.length - 1];
    return leaf;
};

function doLadybug() {
    console.log("doing ladybug puzzle");
    const numLeaves = 3;
    const maxTokens = 1;
    const game = new board(numLeaves, maxTokens);
    initLeaves(numLeaves);

    while(true) {
        console.log("");
        game.printLeaves();
        game.printTokenPos();
        if (!game.nextPos()) {
            break;
        }
    }
}

/*
function doLadybug() {
    console.log("doing ladybug puzzle");
    const numLeaves = 3;
    const maxTokens = 3;
    const game = new board(numLeaves, maxTokens);
    initLeaves(numLeaves);

    // DFS
    let token = 0;
    let leaf = 0;
    let watchInner = 0;
    let watchOuter = 0;
    while(true) {
        // next token
        while(true) {
            ++token; // depth first
            if (leaf < numLeaves && token <= maxTokens && addToken(token, leaf)) {
                leaf = 0;
                // good token
                //--token;
                break;
            } else { // move to new leaf, otherwise remove a token
                --token;
                if (token > 0) {
                    removeToken(token);
                }
                --token;
                ++leaf;
                if (leaf < numLeaves) {
                    ++token;
                    addToken(token, leaf);
                    break;
                } else {
                    if (token <= 0) {
                        break;
                    }
                    const popLeaf = removeToken(token);
                    console.log("popLeaf = " + popLeaf);
                    --token;
                    leaf = popLeaf + 1;
                }
            }
            ++watchInner;
            if (watchInner > 1000) {
                console.log("watch inner hit !!");
                break;
            }
        } 
        // done next token

        if (token <= 0) {
            break;
        }
        // print token
        console.log("\ntoken = " + token + ", leaf = " + leaf);
        printLeaves();

        ++watchOuter;
        if (watchOuter > 250) {
            console.log("watch outerhit !!");
            break;
        }
        //token = 0;
    }
    console.log("watchOuter = " + watchOuter);
}
*/
