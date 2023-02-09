console.log("inside a worker!");
postMessage("inside a worker!");
let i = 0;
while(i < 20_000_000) {
    if (i % 1000000 == 0)
    postMessage(`from worker ${i}`);
    ++i;
}
console.log("inside a worker 2!");
postMessage("inside a worker 2!");
