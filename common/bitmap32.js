class Bitmap32 {

	static errorColor = Bitmap32.strToColor32("hotpink");
	// members:
	//		size : 2d array of dimensions
	//		imageData : ImageData
	//		data32 : Uint32Array, mirror of above

	// constructor args:
	//		<image> : image init, note: image should already be loaded
	//		size, Uint32Array : data init from color32 values AABBGGRR (native)
	//		size, Uint8ClampedArray : data init from R G B A  R G B A ... values (native)
	//		size, color32 : uint32 solid color32 value AABBGGRR like 0xff008000 (native) OR a colorString value like "green"
	//		size : default color solid opaque black, 0xff000000
	
    constructor(arg1, arg2) {
		let isfillColor32 = false;
		let fillColor32 = Bitmap32.color32(); // opaque black is the default
		if (Array.isArray(arg1)) { // size and optional uInt8ClampedData or color32
			this.size = vec2.clone(arg1);
			if (arg2 && arg2.constructor == Uint32Array) { // data32
				const u32a = arg2;
				const ab = u32a.buffer;
				const u8a = new Uint8ClampedArray(ab);
				this.imageData = new ImageData(u8a, this.size[0], this.size[1]);
			} else if (arg2 && arg2.constructor == Uint8ClampedArray) { // data8
					const u8a = arg2;
					const ab = u8a.buffer;
					const u32a = new Uint32Array(ab);
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

	fill(color32) {
		this.data32.fill(color32);
	}

	/////////////////////// pixels ////////////////////////////////
	pointClip(p) { // return 1 if in range of bitmap, 0 otherwise
		const x = p[0];
		const y = p[1];
		if (x < 0) {
			return false;
		}
		if (y < 0) {
			return false;
		}
		if (x >= this.size[0]) {
			return false;
		}
		if (y >= this.size[1]) {
			return false;
		}
		return true;
	}

	fastGetPixel(p) {
		return this.data32[p[0] + p[1] * this.size[0]];
	}

	clipGetPixel(p) {
		if (this.pointClip(p)) {
			return this.data32[p[0] + p[1] * this.size[0]];
		}
		return Bitmap32.errorColor;
	}

	fastPutPixel(p, color32) {
		this.data32[p[0] + p[1] * this.size[0]] = color32;
	}

	clipPutPixel(p, color32) {
		if (this.pointClip(p)) {
			this.data32[p[0] + p[1] * this.size[0]] = color32;
		}
	}

	/////////////////////// rectangles ////////////////////////////////
	rectangleClip(p, s) { // return 1 if there's a rectangle to draw, 0 otherwise
		// update p and s if clipped
		// trivial check
		if (s[0] == 0 || s[1] == 0) { // no size
			return false;
		}
		// negative sizes
		if (s[0] < 0) {
			s[0] = -s[0];
			p[0] -= s[0];
		}
		if (s[1] < 0) {
			s[1] = -s[1];
			p[1] -= s[1];
		}
		// left
		let move = -p[0];
		if (move > 0) {
			p[0] += move;
			s[0] -= move;
		}
		if (s[0] <= 0) {
			return false;
		}
		// top
		move = -p[1];
		if (move > 0) {
			p[1] += move;
			s[1] -= move;
		}
		if (s[1] <= 0) {
			return false;
		}
		// right
		move = p[0] + s[0] - this.size[0];
		if (move > 0) {
			s[0] -= move;
		}
		if (s[0] <= 0) {
			return false;
		}
		// bottom
		move = p[1] + s[1] - this.size[1];
		if (move > 0) {
			s[1] -= move;
		}
		if (s[1] <= 0) {
			return false;
		}
		return true;
	}

	fastRect(p, s, color32) {
		let start = p[0] + p[1] * this.size[0];
		for (let j = p[1]; j < p[1] + s[1]; ++j) {
			const end = start + s[0];
			this.data32.fill(color32, start, end);
			start += this.size[0];
		}
	}

	clipRect(pOrig, sOrig, color32) {
		const p = vec2.clone(pOrig);
		const s = vec2.clone(sOrig);
		if (this.rectangleClip(p, s)) {
			this.fastRect(p, s, color32);
		}
	}

	/////////////////////// blits ////////////////////////////////
	static fastBlit(sourceBM, sourceStart, destBM, destStart, xferSize) {
		const srcData = sourceBM.data32;
		const srcSize = sourceBM.size;
		const dstData = destBM.data32;
		const dstSize = destBM.size;
		
		let srcIdx = sourceStart[0] + srcSize[0] * sourceStart[1];
		let dstIdx = destStart[0] + dstSize[0] * destStart[1];
		const xferSizeX = xferSize[0];
		try {
			for (let j = 0; j < xferSize[1]; ++j) {
				dstData.set(srcData.subarray(srcIdx, srcIdx + xferSizeX), dstIdx);
				srcIdx += srcSize[0];
				dstIdx += dstSize[0];
			}
		} catch(e) {
			console.log("Blit Error: " + e);
		}
	}

	static clipBlit(sourceBM, sourceStartOrig, destBM, destStartOrig, xferSizeOrig) {
		const sourceStart = vec2.clone(sourceStartOrig);
		const destStart = vec2.clone(destStartOrig);
		const xferSize = vec2.clone(xferSizeOrig);
		if (Bitmap32.blitterClip(sourceBM, sourceStart, destBM, destStart, xferSize)) {
			this.fastBlit(sourceBM, sourceStart, destBM, destStart, xferSize);
		}
	}

	static blitterClip(sourceBM, sourceStart, destBM, destStart, xferSize) {
		// trivial check
		if ((xferSize[0] <= 0) || (xferSize[1] <= 0)) {
			return false;
		}
		const srcSize = sourceBM.size;
		const dstSize = destBM.size;
		// left source
		let move = -sourceStart[0];
		if (move > 0) {
			sourceStart[0] += move;
			destStart[0] += move;
			xferSize[0] -= move;
		}
		if (xferSize[0] <= 0) {
			return false;
		}
		// left dest
		move = -destStart[0];
		if (move > 0) {
			sourceStart[0] += move;
			destStart[0] += move;
			xferSize[0] -= move;
		}
		if (xferSize[0] <= 0) {
			return false;
		}
		// top source
		move = -sourceStart[1];
		if (move > 0) {
			sourceStart[1] += move;
			destStart[1] += move;
			xferSize[1] -= move;
		}
		if (xferSize[1] <= 0) {
			return false;
		}
		// top dest
		move = -destStart[1];
		if (move > 0) {
			sourceStart[1] += move;
			destStart[1] += move;
			xferSize[1] -= move;
		}
		if (xferSize[1] <= 0) {
			return false;
		}
		// right source
		move = sourceStart[0] + xferSize[0] - srcSize[0];
		if (move > 0) {
			xferSize[0] -= move;
		}
		if (xferSize[0] <= 0) {
			return false;
		}
		// right dest
		move = destStart[0] + xferSize[0] - dstSize[0];
		if (move > 0) {
			xferSize[0] -= move;
		}
		if (xferSize[0] <= 0) {
			return false;
		}
		// bottom source
		move = sourceStart[1] + xferSize[1] - srcSize[1];
		if (move > 0) {
			xferSize[1] -= move;
		}
		if (xferSize[1] <= 0) {
			return false;
		}
		// bottom dest
		move = destStart[1] + xferSize[1] - dstSize[1];
		if (move > 0) {
			xferSize[1] -= move;
		}
		if (xferSize[1] <= 0) {
			return false;
		}
		return true;
	}
}
