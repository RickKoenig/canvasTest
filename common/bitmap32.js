class Bitmap32 {
	// members:
	//		size
	//		imageData : ImageData
	//		data8 : uInt8ClampedData, mirror of above
	//		data32 : Uint32Array, mirror of above
	// constructor args:
	//		<image> : image init
	//		size, Uint32Array : data init from color32 values AABBGGRR (native)
	//		size, color32 : uint32 solid color32 value AABBGGRR (native)
	//		size : solid opaque black
	// other combinations can be done with the helpers color32 and colorStrToRGBA
    constructor(arg1, arg2) {
		//console.log("typeof arg2 = " + typeof arg2);
		let uInt8ClampedData;
		if (typeof arg2 == "foo") {
			Uint32Array = arg2;
		}

		let isSolidColor = false;
		let fillColor = Bitmap32.color32(); // opaque black is the default
		if (Array.isArray(arg1)) { // size and optional uInt8ClampedData or color32
			this.size = vec2.clone(arg1);
			if (false) { // data
				const ab = arg2.buffer;
				const u32a = new Uint32Array(ab);
				this.imageData = new ImageData(Uint32Array, this.size[0], this.size[1]);
			} else { // no data so set to black or arg2
				isSolidColor = true;
				this.imageData = new ImageData(this.size[0], this.size[1]);
				if (arg2 !== undefined) {
					fillColor = arg2;
				} else {
				}
			}
		} else { // <image>
			const image = arg1;
			const canvas = document.createElement('canvas');
			canvas.width = image.width;
			canvas.height = image.height;
			const ctx = canvas.getContext('2d');
			this.size = [canvas.width, canvas.height];
			ctx.drawImage(image, 0, 0 );
			this.imageData = ctx.getImageData(0, 0, image.width, image.height);
		}
		this.data8 = this.imageData.data;
		const ab = this.data8.buffer;
		this.data32 = new Uint32Array(ab);
		if (isSolidColor) {
			this.data32.fill(fillColor);
		}
		console.log("arr8 len = " + this.data8.length + " arr32 len = " + this.data32.length);
	}

	// helpers for native color
	// return Uint32 for color hex: AABBGGRR (native)
	static color32(r = 0, g = 0, b = 0, a = 255) {
		return 256 * (256 * (256 * a + b) + g) + r;
	}

	static colorStrToRGBA(str, alpha = 1) {
		var ctx = document.createElement("canvas").getContext("2d");
		ctx.fillStyle = str;
		console.log('color conversion results');
		const rgbaStr = ctx.fillStyle;
		if (rgbaStr.startsWith("#")) { //#rrggbb : hex 00 to ff, no alpha
			const r = Number("0x" + rgbaStr.slice(1,3));
			const g = Number("0x" + rgbaStr.slice(3,5));
			const b = Number("0x" + rgbaStr.slice(5,7));
			console.log("hex conv = " + r + " " + g + " " + b);
			const a8 = Math.round(alpha * 255);
			return Bitmap32.color32(r, g, b, a8);
		} else if (rgbaStr.startsWith('rgba(')) { // has alpha, rgba(r, g, b, a) : decimal 0 to 255, alpha 0 to 1
			const stIdx = rgbaStr.indexOf("(") + 1;
			const endIdx = rgbaStr.indexOf(")");
			const inTxt = rgbaStr.slice(stIdx, endIdx);
			console.log("rgba conv = '" + inTxt + "'");
			const splt = inTxt.split(",");
			console.log("hi");
		}
		//return ctx.fillStyle;
	}
}

/*

td color = '#0000ff'
localhost꞉88/plotter2d/testBitmaps/mainApp.js:230
std color = 'rgba(3, 4, 0, 0.996)'
localhost꞉88/plotter2d/testBitmaps/mainApp.js:232
std color = '#345678'

d = document.createElement("div");
d.style.color = "white";
document.body.appendChild(d)
//Color in RGB 
window.getComputedStyle(d).color

function standardize_color(str){
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = str;
    return ctx.fillStyle;
}

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
