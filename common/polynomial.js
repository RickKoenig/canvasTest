'use strict';

class polynomial {
    // coefs[0] + coefs[1] * x + coefs[2] * x^2 etc.
    constructor(p) {
        const coefs = p.coefs ? p.coefs : p; // polynomial or array
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

    // return p(x)
    calc(x) {
        return 0;
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

    // (x + a) ^ e
    power() {

    }

    shift(p, offset) {
        const backup = new polynomial(p);
        this.prune();
    }
}
