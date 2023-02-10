'use strict';

onmessage = (e) => {
    console.log('Message received from main script' + e.data);
    //const workerResult = `Result: ${e.data[0] * e.data[1]}`;
    console.log('Posting message back to main script');
    //postMessage('workerResult');
    postMessage(e.data);

    console.log("W: worker start!");
    postMessage("worker start!");
    let i = 0;
    for (let i = 0; i <= 2_000; ++i) {
        if (i % 1_000 == 0) {
            postMessage(`from worker message ${i}`);
        }
    }
    
    const fb = new Float32Array(10);
    for (let i = 0; i < 10; ++i) {
        fb[i] = .3 * i;
    }
    
    console.log("len before post = " + fb.length);
    postMessage(fb.buffer, [fb.buffer]);
    console.log("len after post = " + fb.length);
    console.log("W: worker finish!");
    postMessage("worker finish!");
}
