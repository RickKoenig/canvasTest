class Bitmap32 {

	static errorColor = Bitmap32.strToColor32("hotpink");
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

	clear(color32) {
		this.data32.fill(color32);
	}

	/////////////////////// pixels ////////////////////////////////
	pointClip(p) { // return 1 if in range of bitmap, 0 otherwise
		const x = p[0];
		const y = p[1];
		if (x < 0)
			return 0;
		if (y < 0)
			return 0;
		if (x >= this.size[0])
			return 0;
		if (y >= this.size[1])
			return 0;
		return 1;
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
	rectClip(p, s) { // return 1 if there's a rectangle to draw, 0 otherwise
		// update p and s if clipped
		// trivial check
		if (s[0] == 0 || s[1] == 0) { // no size
			return 0;
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
			return 0;
		}
		// top
		move = -p[1];
		if (move > 0) {
			p[1] += move;
			s[1] -= move;
		}
		if (s[1] <= 0) {
			return 0;
		}
		// right
		move = p[0] + s[0] - this.size[0];
		if (move > 0) {
			s[0] -= move;
		}
		if (s[0] <= 0) {
			return 0;
		}
		// bottom
		move = p[1] + s[1] - this.size[1];
		if (move > 0) {
			s[1] -= move;
		}
		if (s[1] <= 0) {
			return 0;
		}
		return 1;
	}

	fastRect(p, s, color32) {
		//this.clipPutPixel(p, color32);
		//return;
		//this.data32.fill(0);
		for (let j = p[1]; j < p[1] + s[1]; ++j) {
			const start = p[0] + j * this.size[0];
			const end = start + s[0];
			this.data32.fill(color32, start, end);
		}
	}
}

/*void cliprect32(const struct bitmap32* b32,S32 x0,S32 y0,S32 sx,S32 sy,C32 color)
{
	if (rclip32(b32,&x0,&y0,&sx,&sy))
		fastrect32(b32,x0,y0,sx,sy,color);
}


*/

/*
void clipblit32(const bitmap32* s,struct bitmap32* d,S32 sx,S32 sy,S32 dx,S32 dy,S32 tx,S32 ty)
{
	if (bclip32(s,d,&sx,&sy,&dx,&dy,&tx,&ty))
		fastblit32(s,d,sx,sy,dx,dy,tx,ty);
}

void fastblit32(const bitmap32* s,struct bitmap32* d,S32 sx,S32 sy,S32 dx,S32 dy,S32 tx,S32 ty)
{
	S32 i,j;
	U32 sinc,dinc;
	register C32 *sp,*dp;
	if (tx<=0 || ty<=0)
		return;
	sp=s->data+s->size.x*sy+sx;
	dp=d->data+d->size.x*dy+dx;
	sinc=s->size.x;
	dinc=d->size.x;
	for (j=0;j<ty;j++) {
		for (i=0;i<tx;i++)
			dp[i]=sp[i];
//		memcpy(dp,sp,tx<<2);
		sp+=sinc;
		dp+=dinc;
	}
}

bool bclip32(const struct bitmap32* s,const struct bitmap32* d,S32* sx,S32* sy,S32* dx,S32* dy,S32* tx,S32* ty)
{
	S32 move;
// trivial check
	if ((*tx<=0)||(*ty<=0))
		return false;
// left source
	move = s->cliprect.topleft.x - *sx;
	if (move>0) {
		*sx += move;
		*dx += move;
		*tx -= move;
	}
	if (*tx <= 0)
		return false;
// left dest
	move = d->cliprect.topleft.x - *dx;
	if (move>0) {
		*sx += move;
		*dx += move;
		*tx -= move;
	}
	if (*tx <= 0)
		return false;
// top source
	move = s->cliprect.topleft.y - *sy;
	if (move>0) {
		*sy += move;
		*dy += move;
		*ty -= move;
	}
	if (*ty <= 0)
		return false;
// top dest
	move = d->cliprect.topleft.y - *dy;
	if (move>0) {
		*sy += move;
		*dy += move;
		*ty -= move;
	}
	if (*ty <= 0)
		return false;
// right source
	move = (*sx + *tx) - (s->cliprect.topleft.x + s->cliprect.size.x);
	if (move>0)
		*tx -= move;
	if (*tx <= 0)
		return false;
// right dest
	move = (*dx + *tx) - (d->cliprect.topleft.x + d->cliprect.size.x);
	if (move>0)
		*tx -= move;
	if (*tx <= 0)
		return false;
// bottom source
	move = (*sy + *ty) - (s->cliprect.topleft.y + s->cliprect.size.y);
	if (move>0)
		*ty -= move;
	if (*ty <= 0)
		return false;
// bottom dest
	move = (*dy + *ty) - (d->cliprect.topleft.y + d->cliprect.size.y);
	if (move>0)
		*ty -= move;
	if (*ty <= 0)
		return false;
	return true;
}

*/
