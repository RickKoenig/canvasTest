'use strict';

// math helpers
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

function midPnt(out, p0, p1) {
	vec2.add(out, p1, p0);
	vec2.scale(out, out, .5);
}

function lerp(A, B, t) {
	return A + (B - A) * t;
}

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

function degToRad(a) {
	return a * (Math.PI / 180);
}

function radToDeg(a) {
	return a * (180 / Math.PI);
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
