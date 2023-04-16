'use strict';

class Shp {
	static setupPolyPnts() {
		//console.log("Shp: setupPolyPoints");
		let avg = 0;
		for (let i = 0; i < this.polyPnts.length; ++i) {
			avg += this.polyPnts[i];
		}
		avg /= this.polyPnts.length;
		for (let i = 0; i < this.polyPnts.length; ++i) {
			this.polyPnts[i] -= avg;
		}
		this.largestDist = 0;
		for (let i = 0; i < this.polyPnts.length; ++i) {
			const dist = Math.abs(this.polyPnts[i]);
			if (dist > this.largestDist) {
				this.largestDist = dist;
			}
		}
	}

	static draw() {
		console.log("Shp: draw [" + this.polyPnts + "] largestDist " + this.largestDist);
	}
}

class Shp1 extends Shp {
	static setupPolyPnts() {
		this.polyPnts = [3, 4, 5, 7];
		super.setupPolyPnts();
	}
	static draw() {
		console.log("Shape1: draw");
		super.draw();
	}
	static {
		this.setupPolyPnts(); // call once, center points,  maybe setup some statics
	}
}

class Shp2 extends Shp {
	static setupPolyPnts() {
		this.polyPnts = [ .5, .7, .9, 1.1];
		super.setupPolyPnts();
	}
	static draw() {
		console.log("Shape2: draw");
		super.draw();
	}
	static {
		this.setupPolyPnts();
	}
}

class Til {
	constructor(shape, pos, rot) {
		this.shape = shape;
		this.pos = pos;
		this.rot = rot;
	}

	draw() {
		console.log("Tile: draw " + this.pos + " " + this.rot);
		this.shape.draw();
	}
}

function staticTests() {
    const tiles = [];
    tiles.push(new Til(Shp1, 4, 9));
    tiles.push(new Til(Shp2, 8, 11));
    for (let tile of tiles) {
        tile.draw();
    }
}
