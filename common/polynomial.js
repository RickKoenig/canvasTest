'use strict';

class polynomial {
    // coefs[0] + coefs[1] * x + coefs[2] * x^2 etc.
    constructor(p) {
        const coefs = p?.coefs ? p.coefs : p; // polynomial or array
        if (coefs) {
            this.coefs = coefs.slice();
        } else { // default
            this.coefs = [];
        }
        this.prune(this.coefs);
    }

    degree() {
        return this.coefs.length - 1;
    }

    print(label) {
        console.log(label + ": coefs = [" + this.coefs + "]");
    }

    // (x + offset) ^ exp
    // return new polynomial
    //if offset == 5 and exp == 2 then return [25, 10, 1]
    static power(offset, exp) {
        const base = new polynomial([offset, 1]);
        const ret = new polynomial([1]);
        for (let i = 0; i < exp; ++i) {
            ret.mul(base);
        }
        return ret;
    }

    // return new polynomial p(x + offset)
    shift(p, offset) {
        const backup = new polynomial(p);
        this.prune();
    }

    // return p(x)
    calc(x) {
        const coefs = this.coefs;
        if (!this.coefs.length) {
            return 0;
        }
        let i = coefs.length - 1;
        let ret = coefs[i];
        while(i--) {
            ret *= x;
            ret += coefs[i];
        }
        return ret;
    }
    
    // all these functions are MUTABLE
    // remove highest degrees with value of 0 
    prune() {
        const a = this.coefs;
        while(a.length) {
            if (a.at(-1)) {
                break;
            }
            a.pop();
        }
    }

    // just these two, additive
    add(rhs) {
        this.binOp(rhs, (a, b) => a + b);
    }

    sub(rhs) {
        this.binOp(rhs, (a, b) => a - b);
    }

    // scale
    scale(scl) {
        if (!scl) {
            this.coefs.length = 0;
            return;
        }
        for (let i = 0; i < this.coefs.length; ++i) {
            this.coefs[i] *= scl;
        }
    }

    // no pruning necessary
    mul(rhs) {
        const lhs = this.coefs;
        rhs = rhs.coefs;
        this.coefs = [];
        for (let j = 0; j < lhs.length; ++j) {
            let b = lhs[j];
            if (!b) {
                b = 0;
            }
            for (let i = 0; i < rhs.length; ++i) {
                let a = rhs[i];
                if (!a) {
                    a = 0;
                }
                const k = i + j;
                let c = this.coefs[k];
                if (!c) {
                    c = 0;
                }
                c += a * b;
                this.coefs[k] = c;
            }
        }
    }

    // add and sub
    binOp(rhs, op) {
        const maxIdx = Math.max(this.coefs.length, rhs.coefs.length);
        for (let i = 0; i < maxIdx; ++i) {
            let a = this.coefs[i];
            if (!a) {
                a = 0;
            }
            let b = rhs.coefs[i];
            if (!b) {
                b = 0;
            }
            this.coefs[i] = op(a, b);
        }
        this.prune();
    }
}
