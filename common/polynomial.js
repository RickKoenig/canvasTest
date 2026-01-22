'use strict';

class polynomial {
    constructor(coefs) {
        if (coefs) {
            this.coefs = coefs.slice();
        } else {
            this.coefs = [];
        }
    }

    print(label) {
        console.log(label + ": coefs = [" + this.coefs + "]");
    }

    add(rhs) {
        const sum = new polynomial(this.coefs);
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
            sum.coefs[i] = a + b;
        }
        return sum;
    }

    shift(offset) {
        const s = new polynomial();
    }
}
