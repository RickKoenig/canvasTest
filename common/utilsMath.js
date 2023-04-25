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
// intsect could be beyond the segments
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

// given line segments A-B and  C-D return T, U and Bot
// where intsect is lerp(A, B, T/Bot or lerp(C, D, U/Bot)
// good for checking if intsect is on the line segment
function getIntSectParam(A, B, C, D) {
	const tTop  = (D[0] - C[0]) * (A[1] - C[1]) 
				- (D[1] - C[1]) * (A[0] - C[0]);
	const uTop  = (C[1] - A[1]) * (A[0] - B[0]) 
				- (C[0] - A[0]) * (A[1] - B[1]);
	const bottom  = (D[1] - C[1]) * (B[0] - A[0]) 
				  - (D[0] - C[0]) * (B[1] - A[1]);
	return {T: tTop, U: uTop, Bot: bottom};
}

// how far a test point 'T' goes 'inside' line 'P0' to 'P1' (opposite of normal)
// TODO: optimize, cache N and D
function penetrateLine(P0, P1, offset, rot, T) {
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
	if (rot) {
		vec2.rotate(Toff, Toff, -rot);
	}
	return D - vec2.dot(N, Toff);
}

// TODO: cache N and D
// how far T is inside pnts
function penetrateConvexPoly(pnts, offset, rot, T) {
	let pen = Number.MAX_VALUE;
	for (let j = 0; j < pnts.length; ++j) {
		const P0 = pnts[j];
		const P1 = pnts[(j + 1) % pnts.length];
		const p = penetrateLine(P0, P1, offset, rot, T);
		if (p < pen) {
			pen = p;
		}
	}
	return pen;
}

function calcPolyLineIntsectWorld(polyA, pntB0, pntB1) {
	let insideA = [];
	for (let pnt of polyA) {
		insideA.push(penetrateLine(pntB0, pntB1, null, 0, pnt) > 0);
	}
	const clipPoly = [];
	for (let i = 0; i < insideA.length; ++i) {
		const j = (i + 1) % insideA.length;
		// 4 cases
		if (insideA[i]) {
			if (insideA[j]) { // inside
				clipPoly.push(polyA[i]);
			} else { // going out
				clipPoly.push(polyA[i]);
				const isect = getIntSect(polyA[i], polyA[j], pntB0, pntB1);
				clipPoly.push(isect);
			}
		} else {
			if (insideA[j]) { // going in
				const isect = getIntSect(polyA[i], polyA[j], pntB0, pntB1);
				clipPoly.push(isect);
			} else { // outside, do nothing
	
			}
		}
	}
	return clipPoly;
}

function calcPolyIntsectWorld(polyA, polyB) {
	let isectPoly = polyA;
	for  (let i = 0; i < polyB.length; ++i) {
		const j = (i + 1) %polyB.length;
		isectPoly = calcPolyLineIntsectWorld(isectPoly, polyB[i], polyB[j]);
	}
	return isectPoly;
}

function calcPolyIntsect(polyA, offsetA, rotA, polyB, offsetB, rotB) {
	// TODO: for now just polyA against first edge of polyB
	const polyAWorld = [];
	for (let pnt of polyA) {
		const pntW = vec2.clone(pnt);
		if (rotA) {
			vec2.rot(pntW, pntW, rotA);
		}
		if (offsetA) {
			vec2.add(pntW, pntW, offsetA);
		}
		polyAWorld.push(pntW);
	}
	const polyBWorld = [];
	for (let pnt of polyB) {
		const pntW = vec2.clone(pnt);
		if (rotB) {
			vec2.rot(pntW, pntW, rotB);
		}
		if (offsetB) {
			vec2.add(pntW, pntW, offsetB);
		}
		polyBWorld.push(pntW);
	}
	return calcPolyIntsectWorld(polyAWorld, polyBWorld);
}
