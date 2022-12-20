'use strict';

// test out features of javascript here

console.log("javacript tests!");

// test inheritance
class Shape {
    constructor(pos) {
        this.pos = vec2.clone(pos);
    }

    print() {
        console.log("Shape: pos = " + this.pos);
    }

    area() {
        return 0;
    }

    perimeter() {
        return 0;
    }
}

class Circle extends Shape {
    constructor(pos, radius) {
        super(pos);
        this.radius = radius;
    }

    area() {
        return Math.PI * this.radius * this.radius;
    }

    perimeter() {
        return 2 * Math.PI * this.radius;
    }

    print() {
        console.log("Circle");
        super.print();
        console.log("radius = " + this.radius.toFixed(3));
    }
}

class Rect extends Shape {
    constructor(pos, sizeOrig) {
        super(pos);
        this.size = vec2.clone(sizeOrig);
    }

    area() {
        return this.size[0] * this.size[1];
    }

    perimeter() {
        return 2 * (this.size[0] + this.size[1]);
    }

    print() {
        console.log("Rect");
        super.print();
        console.log("size = " + this.size);
    }
}

function javaScriptTests() {
    const shapeList = [];

    shapeList.push(new Shape([17, 19]));
    shapeList.push(new Shape([23, 29]));
    shapeList.push(new Circle([44, 55], 1));
    shapeList.push(new Rect([447, 559], [16, 9]));

    for (let aShape of shapeList) {
        console.log("============");
        aShape.print();
        console.log("area = " + aShape.area().toFixed(3) + ", perimeter = " + aShape.perimeter().toFixed(3));

    }
    console.log("\n\n");
}

javaScriptTests();