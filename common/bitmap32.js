class Bitmap32 {

	//static errorColor = Bitmap32.strToColor32("hotpink");
	static errorColor = NaN;
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
		if (Array.isArray(arg1) || arg1.constructor == Float32Array) { // size and optional uInt8ClampedData or color32
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

	static colorRGBA(c32) {
		const ret = {};
		ret.r = c32 & 0xff;
		c32 >>>= 8;
		ret.g = c32 & 0xff;
		c32 >>>= 8;
		ret.b = c32 & 0xff;
		c32 >>>= 8;
		ret.a = c32 & 0xff;
		return ret;
	}

	 // #rrggbb : hex 00 to ff, no alpha
	 // OR
	 // rgba(r,g,b,a)
	static strToColor32(str, alpha = 1) {
		var ctx = document.createElement("canvas").getContext("2d");
		ctx.fillStyle = str;
		const rgbaStr = ctx.fillStyle;
		 // #rrggbb : hex 00 to ff, no alpha
		 if (rgbaStr.startsWith("#")) {
			const r = Number("0x" + rgbaStr.slice(1,3));
			const g = Number("0x" + rgbaStr.slice(3,5));
			const b = Number("0x" + rgbaStr.slice(5,7));
			const a8 = Math.round(alpha * 255);
			return Bitmap32.color32(r, g, b, a8);
		// has alpha, rgba(r,g,b,a) : decimal 0 to 255, alpha 0 to 1
		} else if (rgbaStr.startsWith('rgba(')) { 
			const stIdx = rgbaStr.indexOf("(") + 1;
			const endIdx = rgbaStr.indexOf(")");
			const inTxt = rgbaStr.slice(stIdx, endIdx);
			const splt = inTxt.split(",");
			const r = Number(splt[0]);
			const g = Number(splt[1]);
			const b = Number(splt[2]);
			const a = Number(splt[3]);
			const a8 = Math.round(alpha * a * 255);
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

	fill(color32 = Bitmap32.color32()) {
		this.data32.fill(color32);
	}

	/////////////////////// pixels ////////////////////////////////
	pointClip(p) { // return true if in range of bitmap, 0 otherwise
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
		return this.data32[p[0] + Math.round(p[1]) * this.size[0]];
	}

	clipGetPixel(p) {
		if (this.pointClip(p)) {
			return this.data32[p[0] + Math.round(p[1]) * this.size[0]];
		}
		return Bitmap32.errorColor;
	}

	fastPutPixel(p, color32) {
		this.data32[p[0] + Math.round(p[1]) * this.size[0]] = color32;
	}

	clipPutPixel(p, color32) {
		if (this.pointClip(p)) {
			this.data32[p[0] + Math.round(p[1]) * this.size[0]] = color32;
		}
	}

	/////////////////////// lines ////////////////////////////////
	static swapPoints(p0, p1) {
		[p0[0], p1[0]] = [p1[0], p0[0]];
		[p0[1], p1[1]] = [p1[1], p0[1]];
	}

	lineClip(p0, p1) {
		const bigClip = 30000;
		if (p0[0] < -bigClip) {
			return false;
		}
		if (p0[0] > bigClip) {
			return false;
		}
		if (p0[1] < -bigClip) {
			return false;
		}
		if (p0[1] > bigClip) {
			return false;
		}
		if (p1[0] < -bigClip) {
			return false;
		}
		if (p1[0] > bigClip) {
			return false;
		}
		if (p1[1] < -bigClip) {
			return false;
		}
		if (p1[1] > bigClip) {
			return false;
		}
		const margin = 0; // 100 if testing clipping
		const left = margin;
		const right = this.size[0] - margin;
		const top = margin;
		const bot = this.size[1] - margin;
		while(true) {
			let code0 = 0;
			if (p0[0] < left) {
				code0 = 1;
			} else if (p0[0] >= right) {
				code0 = 4;
			}
			if (p0[1] < top) {
				code0 |= 2;
			} else if (p0[1] >= bot) {
				code0 |= 8;
			}
			let code1 = 0;
			if (p1[0] < left) {
				code1 = 1;
			} else if (p1[0] >= right) {
				code1 = 4;
			}
			if (p1[1] < top) {
				code1 |= 2;
			} else if (p1[1] >= bot) {
				code1 |= 8;
			}
			if (!(code0 | code1)) {
				return true; // no more clipping necessary
			}
			if (code0 & code1) {
				return false; // don't draw line that can't be seen
			}
			if (!code0) {
				Bitmap32.swapPoints(p0, p1);
				// swap codes
				[code0, code1] = [code1, code0];
			}
			if (code0 & 1) { //left
				const ynew = Math.floor((left - p0[0]) * (p1[1] - p0[1]) / (p1[0] - p0[0]));
				p0[1] += ynew;
				p0[0] = left;
			} else if (code0 & 2) {	// top
				const xnew = Math.floor((top - p0[1]) * (p1[0] - p0[0]) / (p1[1] - p0[1]));
				p0[0] += xnew;
				p0[1] = top;
			} else if (code0 & 4) {	// right
				const ynew = Math.floor((right - 1 - p0[0]) * (p1[1] - p0[1]) / (p1[0] - p0[0]));
				p0[1] += ynew;
				p0[0] = right - 1;
			} else { // bottom
				const xnew = Math.floor((bot - 1 - p0[1]) * (p1[0] - p0[0]) / (p1[1] - p0[1]));
				p0[0] += xnew;
				p0[1] = bot - 1;
			}
		}
	}

	clipLine(p0orig, p1orig, color) {
		const p0 = vec2.clone(p0orig);
		const p1 = vec2.clone(p1orig);
		if (this.lineClip(p0, p1)) {
			this.fastLine(p0, p1, color);
		}
	}

	fastLine(p0, p1, color) {
		const data = this.data32;
		let x0 = p0[0];
		let y0 = p0[1];
		let x1 = p1[0];
		let y1 = p1[1];
		let dx = x1 - x0;
		let dy = y1 - y0;
		let ostep = this.size[0];
		let cstep = 1;
		if (dx < 0) {
			dx = -dx;
			dy = -dy;
			[x0, x1] = [x1, x0];
			[y0, y1] = [y1, y0];
		}
		let idx = x0 + y0 * ostep;
		if (dy < 0) {
			ostep = -ostep;
			dy = -dy;
		}
		if (dx < dy) {
			[x0, y0] = [y0, x0];
			[x1, y1] = [x1, y0];
			[dx, dy] = [dy, dx];
			[ostep, cstep] = [cstep, ostep];
		}
		let err = dx >>> 1;
		let cnt = dx;
		do {
			data[idx] = color;
			err -= dy;
			if (err < 0) {
				err += dx;
				idx += ostep;
			}
			idx += cstep;
		} while(cnt--);
	}

	/////////////////////// rectangles ////////////////////////////////
	rectangleClip(p, s) { // return true if there's a rectangle to draw, 0 otherwise
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
		let start = p[0] + Math.round(p[1]) * this.size[0];
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
		
		let srcIdx = sourceStart[0] + srcSize[0] * Math.round(sourceStart[1]);
		let dstIdx = destStart[0] + dstSize[0] * Math.round(destStart[1]);
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

	clipHLine(p, xs, color32) {
		this.clipRect(p, [xs, 1], color32);
	}
	
	clipCircle(p, r, c) {
		r = Math.floor(r);
		let x = p[0];
		let y = p[1];
		let sx = this.size[0];
		let sy = this.size[1];
		// draw a dot for 0 or less radius
		if (r <= 0) {
			this.clipPutPixel(p,c);
			return;
		}
		// circle completely off bitmap, don't draw
		if (x - r >= sx) { // right
			return;
		}
		if (x + r < 0) { // left
			return;
		}
		if (y - r >= sy) { // bottom
			return;
		}
		if (y + r < 0) { // top
			return;
		}
		// draw a solid Bresenham circle
		let cir_xorg = x;
		let cir_yorg = y;
		x = 0;
		y = r;
		let e = (y << 1) - 1;
		while(x <= y) {
			this.clipHLine([cir_xorg - y, cir_yorg - x], 2 * y + 1, c);
			this.clipHLine([cir_xorg - y, cir_yorg + x], 2 * y + 1, c);
			e -= (x << 2) + 2;
			if (e < 0) {
				e += (y << 2) + 2;
				this.clipHLine([cir_xorg - x, cir_yorg - y], 2 * x + 1, c);
				this.clipHLine([cir_xorg - x, cir_yorg + y], 2 * x + 1, c);
				--y;
			}
			++x;
		}
	}

	static zoomBM(srcBM, destBM, zoomVal) {
		const zoomX = zoomVal[0];
		const zoomY = zoomVal[1];
		const srcSizeX = srcBM.size[0];
		const srcSizeY = srcBM.size[1];
		if (srcSizeX * zoomX != destBM.size[0] || srcSizeY * zoomY != destBM.size[1]) {
			return; // dimensions don't match
		}
		const srcData = srcBM.data32;
		let srcIdx = 0;
		const destData = destBM.data32;
		let destIdx = 0;
		const stepBack = srcSizeX;
		
		for (let j = 0; j < srcSizeY; ++j) { // walk source Y
			for (let n = 0; n < zoomY; ++n) { // repeat for this source Y
				for (let i = 0; i < srcSizeX; ++i) { // walk source X
					const val = srcData[srcIdx++];
					for (let m = 0; m < zoomX; ++m) { // fill dest
						destData[destIdx++] = val;
					}
				}
				srcIdx -= stepBack;
			}
			srcIdx += stepBack; // cancel '-= stepBack'
		}
	}

	// convert an index bitmap(srcBM) to a palettized bitmap(destBM) using (palette)
	static palettize(srcBM, destBM, palette) {
		const srcSizeX = srcBM.size[0];
		const srcSizeY = srcBM.size[1];
		if (srcSizeX != destBM.size[0] || srcSizeY != destBM.size[1]) {
			return; // dimensions don't match
		}
		const prod = srcSizeX * srcSizeY;
		const srcData = srcBM.data32;
		const destData = destBM.data32;
		for (let i = 0; i < prod; ++i) {
			const idx = srcData[i] & 0xff; // use the red channel
			destData[i] = palette[idx];
		}
	}

	// clipped flood fill
	#fillStackSize() {
		return this.fillStack.length;
	}

	#fillPush(x,y) {
		this.fillStack.push([x, y]);
	}

	#fillPop() {
		const ret = this.fillStack.pop();
		return ret;
	}

	clipFloodFill(p, c) {
		let x = p[0];
		let y = p[1];
		this.fillStack = [];
		const r = this.clipGetPixel([x, y]);
		if (r == c || isNaN(r) || r == Bitmap32.errorColor) {
			return;
		}
		this.#fillPush(x, y);
		while(this.#fillStackSize()) {
			//////// got work to do
			const p = this.#fillPop();
			x = p[0]; y = p[1];
			this.clipPutPixel([x,y], c);
			////// find start of run
			let st = x;
			while(true) {
				if (this.clipGetPixel([--st, y]) != r) {
					++st;
					break;
				}
				this.clipPutPixel([st, y], c);
			}
			///// find end of run
			let end = x;
			while(true) {
				if (this.clipGetPixel([++end, y]) !=r ) {
					--end;
					break;
				}
				this.clipPutPixel([end, y], c);
			}
			/////// scan for upper runs to do
			let curr = this.clipGetPixel([st, y - 1]);
			for (x = st; x <= end; ++x) {
				const next = this.clipGetPixel([x + 1, y -1 ]);
				if (((next != r) || (x == end)) && (curr == r)) {
					this.#fillPush(x, y - 1);
				}
				curr = next;
			}
			////// scan for lower runs to do
			curr = this.clipGetPixel([st,y + 1]);
			for (x = st; x <= end; ++x) {
				const next = this.clipGetPixel([x + 1, y + 1]);
				if (((next != r) || (x == end)) && (curr == r)) {
					this.#fillPush(x, y+ 1);
				}
				curr = next;
			}
		}
	}

}
