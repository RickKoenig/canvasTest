'use strict';

class positBits {
    constructor(numBits, bp) {
        this.numBits = numBits;
        this.bp = bp;

        // print early before bits get mangled
        this.#print();
        // get sign bit
        const s = this.#getBits(1);
        let r, e, f;
        let k;
        this.rat;
        if (this.bp == 0) { // special cases for 0 and infinity
            // get rational for special cases
            this.rat = s ? "NaR" : 0;
            this.rat += " special";
        } else {
            // get regime, unary coding
            const firstBit = this.#peekBits(1);
            // get exponent, 2 bits
            // get fraction
            console.log( "      s = " + s + ", firstbit = " + firstBit + ", k = " + k + ", r = " + r + ", e = " + e + ", f = " + f);
            // get rational
            this.rat = bp;
        }
    }

    #bpToStr() {
        let ret = "";
        let nb = this.numBits;
        while(nb--) {
            const mask = 1 << nb;
            ret += mask & this.bp ? "1" : "0";
        }
        return ret;
    }

    #peekBits(nb) {
        if (nb < this.numBits) { // more than enough bits
            const rShift = this.numBits - nb;
            const mask = (1 << rShift) - 1;
            const ret = (this.bp >> rShift) & mask;
            return ret;
        } else if (nb == this.numBits) { // match
            return this.bp;
        } else {  // nb > this.numBits, // pad bits needed with 0's
            const lShift = nb - this.numBits;
            const ret = this.bp << lShift;
            return ret;
        }
    }

    #getBits(nb) {
        const ret = this.#peekBits(nb);
        const rShift = Math.min(this.numBits, nb);
        //this.bp >>= rShift;
        this.numBits -= rShift;
        const mask = (1 << this.numBits) - 1;
        this.bp &= mask;
        return ret;
    }
    
    #print() {
        const bpStr = this.#bpToStr();
        console.log("   PRINT POSIT int value of bp = " + this.bp 
            + ", bit pattern string = '" + bpStr + "', numBits = " + this.numBits);
    }

    getRatVal() {
        return this.rat;
    }
}

function analyzePosits(numBits, bp) {
    const posit = new positBits(numBits, bp);
    const ratVal = posit.getRatVal();
    console.log("      rat value = " + ratVal);
}

function doPosits() {
    console.log("doing posits");
    const minBits = 1;
    const maxBits = 3;
    for (let numBits = minBits; numBits <= maxBits; ++numBits) {
        console.log("numBits = " + numBits);
        for (let bp = 0; bp < 1 << numBits; ++bp) {
            analyzePosits(numBits, bp);
        }
        console.log("");
    }
    console.log("done posits");
}
