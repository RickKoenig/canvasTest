'use strict';

// Fourier transform package
class Fft {
    constructor(maxEle = 2048) {
        this.minEle = 16;
        if (maxEle < this.minEle) maxEle = this.minEle; // lower bounds
        this.maxFft = maxEle;
        this.fftTable = [];
        // build a trig table
        for (let i = 0; i < this.maxFft; ++i) {
            const ang = 2 * Math.PI * i / this.maxFft;
            this.fftTable.push([Math.cos(ang), Math.sin(ang)]);
        }
    }

    // works for all v > 0
    #isPow2(v) {
        return !(v & (v - 1));
    }

    #checkArgs(a, b) {
        if (a.length != b.length) alert("checkArgs: length mismatch");
        if (!this.#isPow2(a.length)) alert("checkArgs: not a power of 2");
        if (a.length > this.maxFft) alert("sample size too big");
    }

    #ft(times, freqs) {
        this.#checkArgs(times, freqs);
        const numEle = times.length;
        const scl = 1 / numEle;
        for (let f = 0; f < numEle; ++f) {
            freqs[f] = compf.create();
            const tStep = f * this.maxFft / numEle;
            let tIdx = 0;
            for (let t = 0; t < numEle; ++t) {
                const exp = this.fftTable[(tIdx) & (this.maxFft - 1)];
                tIdx -= tStep; // MINUS
                const term = compf.create();
                compf.mul(term, times[t], exp);
                compf.add(freqs[f], freqs[f], term);
            }
            compf.scale(freqs[f], freqs[f], scl);
        }
    }
    
    #iFt(freqs, times) {
        this.#checkArgs(freqs, times);
        const numEle = freqs.length;
        for (let t = 0; t < numEle; ++t) {
            times[t] = compf.create();
            const fStep = t * this.maxFft / numEle;
            let fIdx = 0;
            for (let f = 0; f < numEle; ++f) {
                const exp = this.fftTable[(fIdx) & (this.maxFft - 1)];
                fIdx += fStep; // PLUS
                const term = compf.create();
                compf.mul(term, freqs[f], exp);
                compf.add(times[t], times[t], term);
            }
        }
    }
    
    fft(times, freqs) {
        this.#checkArgs(times, freqs);
        // reverse elements to convert ifft to fft
        const numEle = times.length;
        const newTimes = Array(numEle);
        newTimes[0] = times[0];
        for (let i = 1; i < numEle; ++i) {
            newTimes[i] = times[numEle - i];
        }
        times = newTimes;
        this.iFft(times, freqs);
        const scl = 1 / numEle;
        for (let i = 0; i < numEle; ++i) {
            compf.scale(freqs[i], freqs[i], scl);
        }
    }
    
    iFft(times, freqs) {
        this.#checkArgs(times, freqs);
        const numElements = freqs.length;
        for (let i = 0; i < numElements; ++i) {
            freqs[i] = compf.create();
        }
        // trivial case
        if (numElements == 1) {
            compf.copy(freqs[0], times[0]);
            return;
        }
        // split into evens and odds
        const half = numElements >> 1;
        const timesEven = Array(half);
        const timesOdd = Array(half);
        for (let i = 0; i < half; ++i) {
            const even = i << 1;
            timesEven[i] = times[even];
            timesOdd[i] = times[even + 1];
        }
        const freqsEven = Array(half);
        const freqsOdd = Array(half);
        // recurse at half size for both evens and odds
        this.iFft(timesEven, freqsEven);
        this.iFft(timesOdd, freqsOdd);
        // adjust the odd elements
        const fStep = this.maxFft / numElements;
        let fIdx = 0;
        for (let i = 0; i < half; ++i) {
            const exp = this.fftTable[fIdx & (this.maxFft - 1)];
            //console.log("fstep = " + fStep + ", fidx = " + fIdx);
            fIdx += fStep;
            compf.mul(freqsOdd[i], freqsOdd[i], exp);
        }
        // weave back to full size elements
        for (let i = 0; i < half; ++i) {
            compf.add(freqs[i], freqsEven[i], freqsOdd[i]);
            compf.sub(freqs[i + half], freqsEven[i], freqsOdd[i]);
        }
    }
    
    #cFt(times, freqs, fast = true) {
        if (fast) {
            this.fft(times, freqs);
        } else {
            this.#ft(times, freqs);
        }
    }
    
    #iCft(freqs, times, fast = true) {
        if (fast) {
            this.iFft(freqs, times);
        } else {
            this.#iFt(freqs, times);
        }
    }
    // calc a time domain value with freqs and a time value
    calcT(freqs, t, depth, noLastSine, lastComponentOnly) {
        if (depth === undefined || depth >= freqs.length) depth = freqs.length;
        const ret = compf.create();
        for (let f = 0; f < depth; ++f) {
            if (lastComponentOnly) {
                if (f != depth - 1) {
                    continue;
                }
            }
			const odd = f & 1;
			let uf = f >> 1;
			let sf = (f + 1) >> 1;
			if (odd) {
				uf = freqs.length - 1 - uf;
				sf = -sf;
			}
            const ang = t * sf * Math.PI * 2;
            let exp;
            if (noLastSine && f == freqs.length - 1) {
                // don't do sine for f == depth
                exp = compf.create(Math.cos(ang), 0);
            } else {
                exp = compf.create(Math.cos(ang), Math.sin(ang));
            }
            const term = compf.create();
            compf.mul(term, exp, freqs[uf]);
            compf.add(ret, ret, term);
        }
        return ret;
    }
    
    #testFastNoFast(fastIFt, fastFt) {
        // different combinations of fast and slow ft and ift
        console.log("\ntest fft with fastIft = " + fastIFt + ", fastFt = " + fastFt);
        const numElements = this.minEle;
        const freqs = Array(numElements);
        for (let i = 0; i < numElements; ++i) {
            freqs[i] = [Math.random(), Math.random()];
        }
        const times = Array(numElements);
        this.#iCft(freqs, times, fastIFt); // ift freqs to times
        const newFreqs = Array(numElements);
        this.#cFt(times, newFreqs, fastFt); // ft times to freqs
        for (let i = 0; i < numElements; ++i) {
            const diff = compf.create();
            compf.sub(diff, freqs[i], newFreqs[i]);
            const epsilon = .000005;
            if (Math.abs(diff[0] > epsilon || Math.abs(diff[1] > epsilon))) {
                console.log("diff[" + i.toString().padStart(3) + "] = " + compf.str(diff, 8));
            }
        }
    }
    
    testFft() {
        console.log("test fft");
        this.#testFastNoFast(false, false);
        this.#testFastNoFast(false, true);
        this.#testFastNoFast(true, false);
        this.#testFastNoFast(true, true);
        console.log("test slow ift against fast ift")
        const numElements = this.maxFft >> 1;
        const freqs = Array(numElements);
        for (let i = 0; i < numElements; ++i) {
            freqs[i] = [Math.random(), Math.random()];
        }
        const slowTimes = Array(numElements);
        const fastTimes = Array(numElements);
        const t0 = performance.now();
        this.#iFt(freqs, slowTimes);
        const t1= performance.now();
        console.log("slow ms = " + (t1 - t0).toFixed(4));
        this.iFft(freqs, fastTimes);
        const t2 = performance.now();
        console.log("fast ms = " + (t2 - t1).toFixed(4));
        for (let i = 0; i < numElements; ++i) {
            const diff = compf.create();
            compf.sub(diff, slowTimes[i], fastTimes[i]);
            const epsilon = .0005;
            if (Math.abs(diff[0] > epsilon || Math.abs(diff[1] > epsilon))) {
                console.log("diff[" + i.toString().padStart(3) + "] = " + compf.str(diff, 8));
            }
        }
    }
}

