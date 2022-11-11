class Bitmap32 {
	// members:
	//		size
	//		uInt8ClampedData
	//		Uint32Array, mirror of above
	// built by:
	//		size, uInt8ClampedData : data init
	//		size : black init
	//		<image> : image init
    constructor(arg1, uInt8ClampedData) {
		if (Array.isArray(arg1)) { // size and optional uInt8ClampedData
			this.size = vect2.clone(arg1);
			let imageData; // TODO: see if this.imageData is better for some methods
			if (uInt8ClampedData) {
				imageData = new ImageData(uInt8ClampedData, this.size[0], this.size[1]);
			} else { // <image>
				imageData = new ImageData(this.size[0], this.size[1]);
			}
			this.data8 = imageData.data;
			this.data32 = new Uint32Array(this.data8);
		} else {
			const image = arg1;
			const canvas = document.createElement('canvas');
			canvas.width = image.width;
			canvas.height = image.height;
			const ctx = canvas.getContext('2d');
			this.size = [canvas.width, canvas.height];
			context.drawImage(image, 0, 0 );
			this.imageData = ctx.getImageData(0, 0, img.width, img.height);
		}
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
