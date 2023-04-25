'use strict';

// math helpers


// 1d
function range(a,b,c) {
	if (b<a)
		return a;
	if (b>c)
		return c;
	return b;
}

function lerp(a, b, t) {
	return a + t * (b - a);
}

function ilog2(t) {
	var r = 0;
	if (t == 0)
		return -1; // error, can YOU take the log of 0?
	// there's a 1 out there somewhere
	while (t) {
		t>>=1;
		++r;
	}
	return r-1;
}

// round down to a power of 2
function makepow2(x) {
	return 1<<ilog2(x);
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

function lerp(A, B, t) {
	return A + (B - A) * t;
}

function degToRad(a) {
	return a * (Math.PI / 180);
}

function radToDeg(a) {
	return a * (180 / Math.PI);
}

// snap to nearest multiple of amount
function snap(v, amount) {
	if (amount) {
		v /= amount;
		v = Math.round(v);
		v *= amount;
	}
	return v;
}

// 0 <= a < 2 * PI
function normAngRadUnsigned(a) {
	let watchDog = 10;
	while(true) {
		if (a < 0) {
			a += 2 * Math.PI;
			--watchDog;
		} else if (a >= 2 * Math.PI) {
			a -= 2 * Math.PI;
			--watchDog;
		} else {
			break;
		}
		if (watchDog == 0) {
			alert("watchDog: normAngRadUnsigned hit");
			return 0;
		}
	}
	return a;
}

// -PI <= a < PI
function normAngRadSigned(a) {
	let watchDog = 10;
	while(true) {
		if (a < -Math.PI) {
			a += 2 * Math.PI;
			--watchDog;
		} else if (a >= Math.PI) {
			a -= 2 * Math.PI;
			--watchDog;
		} else {
			break;
		}
		if (watchDog == 0) {
			alert("watchDog: normAngRadUnsigned hit");
			return 0;
		}
	}
	return a;
}

// 2d
function midPnt(out, p0, p1) {
	vec2.add(out, p1, p0);
	vec2.scale(out, out, .5);
}

// given line segments A-B and  C-D return the intersection point OR null if no intersection
function getIntSect(A, B, C, D) {
	const tTop  = (D[0] - C[0]) * (A[1] - C[1]) 
				- (D[1] - C[1]) * (A[0] - C[0]);
	const uTop  = (C[1] - A[1]) * (A[0] - B[0]) 
				- (C[0] - A[0]) * (A[1] - B[1]);
	const bottom  = (D[1] - C[1]) * (B[0] - A[0]) 
				  - (D[0] - C[0]) * (B[1] - A[1]);
	if (bottom != 0) {
		const t = tTop / bottom;
		const u = uTop / bottom;
		return [lerp(A[0], B[0], t), lerp(A[1], B[1], t)];
	}
	return null;
}

// how far a test point 'T' goes 'inside' line 'P0' to 'P1' (opposite of normal)
// TODO: optimize, cache N and D
function penetrateLine(P0, P1, T, offset, rot) {
	const N = vec2.create();
	vec2.sub(N, P1, P0);
	vec2.perp(N, N);
	vec2.normalize(N, N);
	const D = vec2.dot(N, P0); // or P1, doesn't matter
	const Toff = vec2.create();
	//vec2.rot(N, N, rot);
	if (offset) {
		vec2.sub(Toff, T, offset);
	} else {
		vec2.copy(Toff, T);
	}
	vec2.rotate(Toff, Toff, -rot);
	return D - vec2.dot(N, Toff);
}

// TODO: cache N and D
// how far T is inside pnts
function penetrateConvexPoly(pnts, T, offset, rot) {
	let pen = Number.MAX_VALUE;
	for (let j = 0; j < pnts.length; ++j) {
		const P0 = pnts[j];
		const P1 = pnts[(j + 1) % pnts.length];
		const p = penetrateLine(P0, P1, T, offset, rot);
		if (p < pen) {
			pen = p;
		}
	}
	return pen;
}
