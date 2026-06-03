'use strict';

// running average class
if (true) {
	console.log("hhhhhhhhhhhhhhhhhhhhhiiiiiiiiiiiiiiiiiiii");
//if (!window.Runavg) {
	class Runavg {
		constructor(nele) {
			this.nele = nele;
			this.arr = [];
			this.idx = 0;
			this.sum = 0;
		}

		add(num) {
			if (this.arr.length == this.nele) { // array filled up
				this.sum -= this.arr[this.idx];
				this.arr[this.idx] = num;
				this.sum += num;
				++this.idx;
				if (this.idx == this.nele)
					this.idx = 0;
			} else { // building up array
				this.arr[this.idx] = num;
				this.sum += num;
				++this.idx;
				if (this.idx == this.nele)
					this.idx = 0;
			}
			return this.sum/this.arr.length;
		}
	}
	console.log("done make Runavg");
	let ra = new Runavg(50);
	// Attach the class to the global scope
	globalThis.Runavg = Runavg;
}

// convert float number to css percent
function floatToCSSPercent(f) {
	f *= 100;
	const fs = f.toString();
	const str = fs + "%";
	return str;
}

// make an object name value pairs based on url like:
// engw/engw3dtest/index.html?startstate=qcomp&startcircuit=teleport2random&startmode=expo
function doURLParams() {
	var ss = window.location.search;
	let URLparams = {};
	if (ss.charAt(0) == '?') {
		// we have args
		ss = ss.substring(1); // past '?'
		var namevals = ss.split('&');
		var i;
		for (i=0;i<namevals.length;++i) {
			var nv = namevals[i];
			var nvs = nv.split('=');
			if (nvs.length == 2) {
				URLparams[nvs[0]] = decodeURI(nvs[1]);
			}
		}
	}
	return URLparams;
}
