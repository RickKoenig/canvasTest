'use strict';

class poly {
    // TODO: switch from object with coefs member to just an array of coefs
    // coefs[0] + coefs[1] * x + coefs[2] * x^2 etc.
    constructor(p) {
        // constructors should only return objects, (like arrays)
        return poly.create(p);
        /*
        return new Number(34);
        return [3, 4, 5];
        const coefs = p?.coefs ? p.coefs : p; // polynomial or array or nothing
        if (coefs) {
            this.coefs = coefs.slice();
            poly.prune(this);
        } else { // default
            this.coefs = [];
        }*/
    }

    static create(p) {
        let ret;
        if (p) {
            ret = p.slice();
            poly.prune(ret);
        } else { // default
            ret = [];
        }
        return ret;
    }


    static copy(out, p) {
        if (p) {
            out.splice(0, p.length, ...p);
        } else {
            out.length = 0;
        }
        return out;
    }

    // remove highest degrees with value of 0 
    static prune(p) {
        while(p.length) {
            if (p.at(-1)) { // check last element for 0
                break;
            }
            p.pop();
        }
        return p;
    }

    static degree(p) {
        return p.length - 1;
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
        for (let i = 0; i < p.length; ++i) {
            if (vertical) {
                str += "   ";
            }
            const c = p[i];
            let s;
            if (Number.isInteger(c)) {
                s = c.toFixed(0);
            } else {
                s = c.toFixed(fix);
            }
            s = s.padStart(10);
            str += s;
            if (i != p.length - 1) {
                str += ", ";
            }
            if (vertical) {
                str += '\n';
            }
        }
        str += "], degree = ";
        str += p.length - 1;
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
    static binOp(out, p0c, p1c, op) {
        p0c = p0c.slice();
        p1c = p1c.slice();
        const maxIdx = Math.max(p0c.length, p1c.length);
        out.length = 0; // clear out
        for (let i = 0; i < maxIdx; ++i) {
            let a = p0c[i];
            if (!a) {
                a = 0;
            }
            let b = p1c[i];
            if (!b) {
                b = 0;
            }
            const c = op(a, b);
            out.push(c);
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
    static mul(out, p0c, p1c) {
        p0c = p0c.slice();
        p1c = p1c.slice();
        out.length = 0;
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
                let c = out[k];
                if (!c) {
                    c = 0;
                }
                c += a * b;
                out[k] = c;
            }
        }
        return out;
    }

    // scale
    static scale(out, p, scl) {
        if (!scl) {
            out.length = 0;
            return out;
        }
        for (let i = 0; i < p.length; ++i) {
            out[i] = scl * p[i];
        }
        return out;
    }

    // f(g))
    static compose(out, f, g) {
        f = f.slice();
        g = g.slice();
        out.length = 0;
        const gPow = new poly([1]); // multiplicative identity
        const term = new poly();
        for (let i = 0; i < f.length; ++i) {
            poly.copy(term, gPow);
            poly.scale(term, term, f[i]);
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

    static derivative(out, p) {
        for (let i = 1; i < p.length; ++i) {
            out[i] = i * p[i];
        }
        out.shift();
        return out;
    }

    // find just one root using bisection method
    // assumes a root can be found inside xRange and xRange is of opposite signs
    static #findRoot(fun, xRange) {
        let numSteps = 20;
        let xLeft = xRange[0];
        let xRight = xRange[1];
        let yLeft = fun(xLeft);
        let yLeftPositive = yLeft >= 0;
        while(--numSteps >= 0) {
            const xMid = (xLeft + xRight) * .5;
            const yMid = fun(xMid);
            const yMidPositive = yMid >= 0;
            if (yMidPositive == yLeftPositive) {
                // move in from the left
                xLeft = xMid;
            } else {
                // move in from the right
                xRight = xMid;

            }
        }
        let xMiddle = (xLeft + xRight) * .5;
        return xMiddle;
    }

    // only roots that cross the line
    // only roots that have non zero derivative, can't change direction at y = 0, no duplicate roots
    static findRoots(fun, xRange) {
        const roots = [];
        const step = 12;
        const iStep = 1 / step;
        let lastX = xRange[0];
        let lastPositive = fun(lastX) >= 0;
        let x = xRange[0] + iStep;
        for (; x <= xRange[1]; x += iStep) {
            const positive = fun(x) >= 0;
            if (positive != lastPositive) {
                const root = poly.#findRoot(fun, [lastX, x]);
                roots.push(root);
            }
            lastPositive = positive;
            lastX = x;       
        }
        return roots;
    }
}
