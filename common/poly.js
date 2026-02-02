'use strict';

class poly {
    // coefs[0] + coefs[1] * x + coefs[2] * x^2 etc.
    constructor(p) {
        const coefs = p?.coefs ? p.coefs : p; // polynomial or array or nothing
        if (coefs) {
            this.coefs = coefs.slice();
            poly.prune(this);
        } else { // default
            this.coefs = [];
        }
    }

    static copy(out, p) {
        const coefs = p?.coefs ? p.coefs : p; // polynomial or array or nothing
        if (coefs) {
            out.coefs = coefs.slice();
        } else {
            out.coefs = [];
        }
        return out;
    }

    // remove highest degrees with value of 0 
    static prune(p) {
        const a = p.coefs;
        while(a.length) {
            if (a.at(-1)) { // check last element for 0
                break;
            }
            a.pop();
        }
        return p;
    }

    static degree(p) {
        return p.coefs.length - 1;
    }

    static print(p, label) {
        let str = "";
        const fix = 6;
        const pad = 10;
        const vertical = true;
        str += label;
        str += ": coefs = [";
        if (vertical) {
            str += '\n';
        }
        for (let i = 0; i < p.coefs.length; ++i) {
            if (vertical) {
                str += "   ";
            }
            const c = p.coefs[i];
            let s;
            if (Number.isInteger(c)) {
                s = c.toFixed(0);
            } else {
                s = c.toFixed(fix);
            }
            s = s.padStart(10);
            str += s;
            if (i != p.coefs.length - 1) {
                str += ", ";
            }
            if (vertical) {
                str += '\n';
            }
        }
        str += "], degree = ";
        str += p.coefs.length - 1;
        console.log(str);
        //console.log(label + ": coefs = [" + p.coefs + "], degree = " + (p.coefs.length - 1));
    }

    // return p(x)
    static calc(p, x) {
        const coefs = p?.coefs ? p.coefs : p; // polynomial or array or nothing
        if (!coefs.length) {
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

    // add and sub
    static binOp(out, p0, p1, op) {
        const p0c = p0.coefs;
        const p1c = p1.coefs;
        const maxIdx = Math.max(p0c.length, p1c.length);
        out.coefs = []; // clear out
        for (let i = 0; i < maxIdx; ++i) {
            let a = p0c[i];
            if (!a) {
                a = 0;
            }
            let b = p1c[i];
            if (!b) {
                b = 0;
            }
            out.coefs[i] = op(a, b);
        }
        poly.prune(out);
        return out;
    }

    // just these two, additive
    static add(out, p0, p1) {
        this.binOp(out, p0, p1, (a, b) => a + b);
        return out;
    }

    static sub(out, p0, p1) {
        this.binOp(out, p0, p1, (a, b) => a - b);
        return out;
    }

    // no pruning necessary
    static mul(out, p0, p1) {
        const p0c = p0.coefs;
        const p1c = p1.coefs;
        out.coefs = [];
        for (let j = 0; j < p0c.length; ++j) {
            let b = p0c[j];
            if (!b) {
                b = 0;
            }
            for (let i = 0; i < p1c.length; ++i) {
                let a = p1c[i];
                if (!a) {
                    a = 0;
                }
                const k = i + j;
                let c = out.coefs[k];
                if (!c) {
                    c = 0;
                }
                c += a * b;
                out.coefs[k] = c;
            }
        }
        return out;
    }

    // scale
    static scale(out, p, scl) {
        if (!scl) {
            out.coefs = [];
            return out;
        }
        for (let i = 0; i < p.coefs.length; ++i) {
            out.coefs[i] = scl * p.coefs[i];
        }
        return out;
    }

    // f(g))
    static compose(out, f, g) {
        out.coefs = [];
        const gPow = new poly([1]); // multiplicative identity
        const term = new poly();
        for (let i = 0; i < f.coefs.length; ++i) {
            poly.copy(term, gPow);
            poly.scale(term, term, f.coefs[i]);
            poly.add(out, out, term);
            poly.mul(gPow, gPow, g);
        }
        return out;
    }

    // make a poly of (x + offset) ^ exp
    // using exp(base()), f(g())
    static power(out, offset, exp) {
        // make exponent
        const fa = Array(exp).fill(0);
        fa.push(1);
        const f = new poly(fa);
        // make base
        const g = new poly([offset, 1]);
        poly.compose(out, f, g);
        return out;
    }

    // return new polynomial p(x + offset)
    static shift(out, p, offset) {
        // make base
        const g = new poly([offset, 1]);
        poly.compose(out, p, g);
        return out;
    }
}
