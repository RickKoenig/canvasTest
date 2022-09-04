'use strict';

console.log("javacript tests!");

let steps = 2000;
let dx = 1 / steps;
let dy = 1 / steps;
let F = function(x, y) {
    return 2 * x + y;
};

// calc double integral vert slices (easier)
let sum = 0;
for (let i = 0; i <= steps; ++i) {
    let x = i * dx;
    for (let j = 0; j <= i; ++j) {
        let y = j * dy;
        sum += F(x, y) * dx * dy;
    }
}
console.log("sum1 = " + sum);

// calc double integral horz slices (slightly harder)
sum = 0;
for (let j = 0; j <= steps; ++j) {
    let y = j * dy;
    for (let i = j; i <= steps; ++i) {
            let x = i * dx;
        sum += F(x, y) * dx * dy;
    }
}
console.log("sum2 = " + sum);

// calc definite integral of sin(x) * exp(-x) from 0 to +inf
let hiVal = 20; // close enough to +inf because of exp(-x)
steps = 5000;
dx = hiVal / steps;
F = function(x) {
    return Math.exp(-x) * Math.sin(x);
};
sum = 0;
for (let i = 0; i <= steps; ++i) {
    let x = i * dx;
    sum += F(x) * dx;
}
console.log("sum3 = " + sum);
