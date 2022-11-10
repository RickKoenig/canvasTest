class Bitmap32 {
    constructor(ctx, size, uInt8ClampedData) {
        this.ctx = ctx;
        this.size = vec2.clone(size);
        this.data8 = uInt8ClampedData;
        this.data32 = new Uint32Array(this.data8);
        //this.imageData = new ImageData(size[0], size[1]);
    }
}

/*



var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
var img = document.getElementById('myimg');
canvas.width = img.width;
canvas.height = img.height;
context.drawImage(img, 0, 0 );
var myData = context.getImageData(0, 0, img.width, img.height);


		// test bitmaps (ImageData)
		const width = size[0]
		const height = size[1];
		var ab = new ArrayBuffer(width * height * 4);
		const arr = new Uint8ClampedArray(ab);
		const arr4 = new Uint32Array(ab);
		// Fill the array with the some RGBA values
		for (let i = 0; i < arr4.length; ++i) {
			arr4[i] = getRandomInt(256*256*256) + 256*256*256*255;
		}
		// Initialize a new ImageData object
		let imageData = new ImageData(arr, size[0], size[1]);
		// Draw image data to the canvas
		ctx.putImageData(imageData, 0, 0);
*/
