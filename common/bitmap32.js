class Bitmap32 {
	// members:
	//		size : 2d array of dimensions
	//		imageData : ImageData
	//		data32 : Uint32Array, mirror of above

	// constructor args:
	//		<image> : image init, note: image should already be loaded
	//		size, Uint32Array : data init from color32 values AABBGGRR (native)
	//		size, color32 : uint32 solid color32 value AABBGGRR like 0xff008000 (native) OR a colorString value like "green"
	//		size : default color solid opaque black, 0xff000000
	
    constructor(arg1, arg2) {
		let isfillColor32 = false;
		let isData32 = false;
		let fillColor32 = Bitmap32.color32(); // opaque black is the default
		if (Array.isArray(arg1)) { // size and optional uInt8ClampedData or color32
			this.size = vec2.clone(arg1);
			if (arg2 && arg2.constructor == Uint32Array) { // data
				isData32 = true;
				const u32a = arg2;
				const ab = u32a.buffer;
				const u8a = new Uint8ClampedArray(ab);
				this.imageData = new ImageData(u8a, this.size[0], this.size[1]);
			} else { // no data so set fillColor32 to opaque black or arg2
				isfillColor32 = true; // fill after we have data32
				this.imageData = new ImageData(this.size[0], this.size[1]);
				if (arg2 !== undefined) {
					if (typeof arg2 == 'string') {
						fillColor32 = Bitmap32.strToColor32(arg2);
					} else {
						fillColor32 = arg2; 
					}
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
		const data8 = this.imageData.data;
		const ab = data8.buffer;
		this.data32 = new Uint32Array(ab);
		if (isfillColor32) {
			this.data32.fill(fillColor32);
		}
	}

	// helpers for native color
	// return Uint32 for color hex: AABBGGRR (native)
	static color32(r = 0, g = 0, b = 0, a = 255) {
		return 256 * (256 * (256 * a + b) + g) + r;
	}

	static strToColor32(str, alpha = 1) {
		var ctx = document.createElement("canvas").getContext("2d");
		ctx.fillStyle = str;
		const rgbaStr = ctx.fillStyle;
		if (rgbaStr.startsWith("#")) { //#rrggbb : hex 00 to ff, no alpha
			const r = Number("0x" + rgbaStr.slice(1,3));
			const g = Number("0x" + rgbaStr.slice(3,5));
			const b = Number("0x" + rgbaStr.slice(5,7));
			const a8 = Math.round(alpha * 255);
			return Bitmap32.color32(r, g, b, a8);
		} else if (rgbaStr.startsWith('rgba(')) { // has alpha, rgba(r, g, b, a) : decimal 0 to 255, alpha 0 to 1
			const stIdx = rgbaStr.indexOf("(") + 1;
			const endIdx = rgbaStr.indexOf(")");
			const inTxt = rgbaStr.slice(stIdx, endIdx);
			const splt = inTxt.split(",");
			const r = Number(splt[0]);
			const g = Number(splt[1]);
			const b = Number(splt[2]);
			const a = Number(splt[3]);
			const a8 = Math.round(a * 255);
			return Bitmap32.color32(r, g, b, a8);
		}
	}

	static color32ToStr(c32) {
		const r = c32 & 0xff;
		const g = (c32 >> 8) & 0xff;
		const b = (c32 >> 16) & 0xff;
		const a = (c32 >> 24) & 0xff;
		return "#" + r.toString(16).padStart(2, "0")
				   + g.toString(16).padStart(2, "0") 
				   + b.toString(16).padStart(2, "0") 
				   + a.toString(16).padStart(2, "0");
	}
}
