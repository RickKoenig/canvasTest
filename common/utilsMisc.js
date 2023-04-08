'use strict';

// running average class
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
