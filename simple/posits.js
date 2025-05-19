'use strict';

class positBits {
    constructor(numBits, numExpBits, bp) {
        this.numBits = numBits;
        this.numExpBits = numExpBits;
        this.bp = bp;

        // print early before bits get mangled
        this.#print();
        // get sign bit
        const sign = this.#getBits(1);
        if (this.bp == 0) { // special cases for 0 and infinity
            // get rational for special cases
            this.rat = sign ? "NaR" : 0;
            this.rat += " special";
        } else {
            // get regime, unary coding
            const {fb, n, m, k, r}  = this.#getRegime();
            // get exponent, usually 2 bits
            const e = this.#getBits(this.numExpBits);
            // get fraction
            const f = this.bp / Math.pow(2, this.numBits);
            console.log("      sign = " + sign
                 + ", fb = " + fb
                 + ", k = " + k 
                 + ", r = " + r 
                 + ", m = " + m
                 + ", n = " + n
                 + ", e = " + e 
                 + ", f = " + "frac bits left = " + this.numBits 
                 + ", bp = " + this.bp 
                 + ", f = " + f
                );
            // get rational
            const mant = (1 - 3 * sign) + f; // check associative property dependence
            const rMult = 1 << this.numExpBits;
            const exp = (1 - 2 * sign) * (rMult * r + e + sign);
            this.rat = mant * Math.pow(2, exp);
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
            const mask = (1 << nb) - 1;
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
        this.numBits -= rShift;
        const mask = (1 << this.numBits) - 1;
        this.bp &= mask;
        return ret;
    }

    #getRegime() {
        // assume bp != 0
        // unary coding
        // first bit
        const fb = this.#getBits(1);
        let k = 1;
        let watch = 0;
        while(true) {
            const nextBit = this.#getBits(1);
            if (fb != nextBit) {
                break; // bit flipped, done
            }
            ++k;
            ++watch;
            if (watch == 100) {
                throw("'watch hit, getRegime'");
            }
        }
        const n = this.numBits; // how many bits left
        const m = 1 << this.numExpBits;
        let r = fb ? k - 1 : -k;
        const ret = {
            fb: fb,
            n: n,
            k: k,
            r: r,
            m: m
        }
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

function analyzePosits(numBits, numExpBits, bp) {
    const posit = new positBits(numBits, numExpBits, bp);
    const ratVal = posit.getRatVal();
    console.log("      rat value = " + ratVal);
}

function doPosits() {
    console.log("doing posits");
    {
        const nb = 5;
        const eb = 1;
        console.log("" + nb + " bit posits, exp bits = " + eb);
        for (let bp = 0; bp < (1 << nb); ++bp) {
            analyzePosits(nb, eb, bp);
        }
        console.log("done " + nb + " bit posits, exp bits = " + eb + "\n");
    }
    const numExpBits = 2;
    /*
    //analyzePosits(6, numExpBits, 45);
    analyzePosits(9, numExpBits, 203);
    analyzePosits(9, numExpBits, -203);
    const minBits = 1;
    const maxBits = 3;
    const straight = false; // or alternating
    for (let numBits = minBits; numBits <= maxBits; ++numBits) {
        const maxBp = 1 << numBits;
        console.log("numBits = " + numBits);
        if (straight) {
            for (let bp = 0; bp < maxBp; ++bp) {
                analyzePosits(numBits, numExpBits, bp);
            }
        } else { // alternate
            let bp = 0;
            analyzePosits(numBits, bp); // special 0
            for (bp = 1; bp < maxBp / 2; ++ bp) {
                analyzePosits(numBits, numExpBits, bp);
                analyzePosits(numBits, numExpBits, -bp);
            }
            analyzePosits(numBits, numExpBits, bp); // special NaR
        }
        console.log("");
    }*/
    console.log("done posits");
}
