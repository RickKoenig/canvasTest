'use strict';

// handle the html elements, do the UI on verticalPanel, and init and proc the other classes
// TODO: for now assume 60hz refresh rate
class MainApp {
	constructor() {
		console.log("creating instance of MainApp");
		// vertical panel UI
		this.vp = document.getElementById("verticalPanel");
		//this.vp = null; // OR, no vertical panel UI
		this.eles = {}; // keep track of eles in vertical panel

		// add all elements from vp to ele if needed
		// uncomment if you need elements from vp html
		//populateElementIds(this.vp, this.eles);

		// USER before UI built
		this.#userInit();

		// setup 2D drawing environment
		this.plotter2dDiv = document.getElementById("plotter2dDiv");
		this.plotter2dCanvas = document.getElementById("plotter2dCanvas");
		this.ctx = this.plotter2dCanvas.getContext("2d");

		// fire up all instances of the classes that are needed
		// vp (vertical panel) is for UI trans, scale info, reset and USER
		//this.fixedSize = [800, 600];
		this.fixedSize = null;
		this.plotter2d = new Plotter2d(this.plotter2dCanvas, this.ctx, /*this.vp*/null, this.startCenter, this.startZoom, this.fixedSize);
		this.input = new Input(this.plotter2dDiv, this.plotter2dCanvas);
		this.drawPrim = new DrawPrimitives(this.plotter2d);
		this.graphPaper = new GraphPaper(this.drawPrim);

		// USER build UI
		this.#userBuildUI();

		// start it off
		this.#animate();
	}



////////// USER SECTION /////////
	#initEnergies() {
		this.maxQnum = 16;//32;
		this.maxShowQnum = 8;//16; // scroll window size
		this.scrollQOffset = 0; // scroll amount
		this.curQnum = 1; // 1 to maxQnum inclusive

		this.amps = new Array(this.maxQnum + 1).fill(0); // amps[0] is never used
		this.phases = new Array(this.maxQnum + 1).fill(0); // amps[0] is never used
		this.amps[1] = 50;
		this.phases[1] = 0;
		this.amps[2] = 50;
		this.phases[2] = 0;

		this.#updateEnergyList();
	}

	// convert to complex numbers, add and convert back to amp phase
	// for 1 energy level
	#updateQState(accAmp, accPhase, amp, phase, doAdd) { // if doAdd == false then replace
		if (!doAdd) {
			return {
				amp: amp,
				phase: phase
			};
		}
		accPhase *= Math.PI / 180;
		phase *= Math.PI / 180;
		const yt1 = accAmp * Math.sin(accPhase);
		const xt1 = accAmp * Math.cos(accPhase);
		const yt2 = amp * Math.sin(phase);
		const xt2 = amp * Math.cos(phase);
		const xtacc = xt1 + xt2;
		const ytacc = yt1 + yt2;
		const resAmp = Math.sqrt(xtacc * xtacc + ytacc * ytacc);
		const resPhase = Math.atan2(ytacc, xtacc) * 180 / Math.PI;
		const ampPhase = {
			amp: resAmp,
			phase: resPhase
		}
		return ampPhase
	}

	// make (-180 to 180]
	#normalAngDeg(a) {
		a %= 360;
		if (a <= -180) {
			a += 360;
		} else if (a > 180) {
			a -= 360;
		}
		return a;
	}

	// update total quantum state (array of amps and phases from 5 parameters)
	// amp, phase, qnum, spread, add/replace
	#addReplaceEnergy(doAdd) {
		let middleAmp = parseFloat(this.eles.ampSliderDOM.getValue());	
		let phaseDelta = parseFloat(this.eles.phaseSliderDOM.getValue());
		let width = parseFloat(this.eles.spreadSliderDOM.getValue());
		if (width == 0) { // just 1 energy updated
			const ampPhase = this.#updateQState(
				this.amps[this.curQnum]
			  , this.phases[this.curQnum]
			  , parseFloat(this.eles.ampSliderDOM.getValue())		
			  , parseFloat(this.eles.phaseSliderDOM.getValue())
			  , doAdd
			);
			this.amps[this.curQnum] = ampPhase.amp;
			this.phases[this.curQnum] = ampPhase.phase;
		} else {
			for (let q = 1; q <= this.maxQnum; ++q) {
				const shift = (q - this.curQnum);
				const shiftWidth = shift / width;
				let a = middleAmp * Math.exp(-shiftWidth * shiftWidth);
				if (a >= .125) {
					const p = this.#normalAngDeg(shift * phaseDelta);
					const ampPhase = this.#updateQState(
						this.amps[q]
					  , this.phases[q]
					  , parseFloat(a)		
					  , parseFloat(p)
					  , doAdd
					);
					this.amps[q] = ampPhase.amp;
					this.phases[q] = ampPhase.phase;
				}
			}
		}
		this.#updateEnergyList();
	}

	#compute() {
/*
	case T_RI_X: 
		{
			static C32 rgbcolsy[3]={C32RED,C32WHITE,C32GREEN};
			fplot afplot(VIEWXSTART,VIEWYSTART,VIEWXSIZE,VIEWYSIZE,0.0f,-1.0f,1.0f,1.0f,B32,"X","R,I",rgbcolsy);
			afplot.drawaxis();
			afplot.drawlabels();
			afplot.startlinev();
			for (i=0;i<SPACESIZE;++i) {
				float x=i*(1.0f/SPACESIZE);
				float y=reals[lshift(countr,LTIMESIZE-LANIMSIZE)][i];
				afplot.flinev(x,y,C32RED);
			}
			afplot.flinev(1.0f,0.0f,C32RED);
			afplot.startlinev();
			for (i=0;i<SPACESIZE;++i) {
				float x=i*(1.0f/SPACESIZE);
				float y=imags[lshift(countr,LTIMESIZE-LANIMSIZE)][i];
				afplot.flinev(x,y,C32GREEN);
			}
			afplot.flinev(1.0f,0.0f,C32GREEN);
			break;
		}
// p against x, animate t
	case T_P_X: 
		{
			fplot afplot(VIEWXSTART,VIEWYSTART,VIEWXSIZE,VIEWYSIZE,0.0f,0.0f,1.0f,1.0f,B32,"X","P",0);
			afplot.drawaxis();
			afplot.drawlabels();
			afplot.startlinev();
			for (i=0;i<SPACESIZE;++i) {
				float x=i*(1.0f/SPACESIZE);
				float re=reals[lshift(countr,LTIMESIZE-LANIMSIZE)][i];
				float im=imags[lshift(countr,LTIMESIZE-LANIMSIZE)][i];
				float y=re*re+im*im;//probs[lshift(countr,LTIMESIZE-LANIMSIZE)][i];
				afplot.flinev(x,y,C32CYAN);
			}
			afplot.flinev(1.0f,0.0f,C32CYAN);
			break;
		}
// r,i, animate t

float sintb[TRIGSIZE]; // trig table
float ak[ENERGYARRSIZE]; // 0 to 31 // 0 not used
S32 phk[ENERGYARRSIZE]; // quantum states table (energy squareds/momentum, will change for non zero potential function)
//float probs[TIMESIZE][SPACESIZE]; // [t][x];
float reals[TIMESIZE][SPACESIZE]; // [t][x];
float imags[TIMESIZE][SPACESIZE]; // [t][x];
float angstreal[TIMESIZE][ENERGYARRSIZE]; // [t][n]
float angstimag[TIMESIZE][ENERGYARRSIZE]; // [t][n]
float angsx[SPACESIZE][ENERGYARRSIZE]; // [x][n]

	void computeproc()
{
	S32 x,t,n,rt,rx;
	static S32 exlate[ENERGYARRSIZE];
	static S32 nexlate; // build a list of non zero energies
	static float normk;
	if (comptime==0) {
		sumk=0;
		float sumk2=0;
		for (n=1;n<ENERGYARRSIZE;n++) {
			sumk+=ak[n];
			sumk2+=ak[n]*ak[n];
		}
		if (sumk==0) {
			comptime=TIMESIZE;
			return;
		}
// minor differences for normalization
#define LOOK_BETTER
#ifdef LOOK_BETTER
		normk = 1.0f / sumk; // this scales/looks better
#elif
		normk = sqrtf(2.0f / sumk2); // this one is the correct normalizer
#endif
		nexlate=0;
		for (n=1;n<ENERGYARRSIZE;n++) {
			if (ak[n]) {
				exlate[nexlate++]=n;
			}
		}
		perf_start(TEST1);
		for (x=0;x<SPACESIZE;x++)
			for (n=1;n<ENERGYARRSIZE;n++) {
				rx=lshift(n*x,LTRIGSIZE-LSPACESIZE-1);
				angsx[x][n]=sint(rx)*ak[n];
			}
		for (t = 0; t <TIMESIZE; ++t) {
			for (n = 1; n < ENERGYARRSIZE; ++n) {
				rt = lshift(n * n * t + phk[n], LTRIGSIZE - LTIMESIZE);
				angstreal[t][n] = cost(rt);
				angstimag[t][n] = sint(rt);
			}
		}
		perf_end(TEST1);
	}
	if (comptime==TIMESIZE)
		return;
	perf_start(TEST2);
	if (wininfo.fpsavg2>wininfo.fpswanted+2.0f)
		++comprate;
	else if (wininfo.fpscurrent2<wininfo.fpswanted-2.0f) {
		if (comprate<=0)
			comprate=1;
		else if (comprate<10)
			--comprate;
		else
			comprate=comprate*9/10;
	}
	if (comprate<=0)
		comprate=1;
	S32 endtime=comptime+comprate;
	if (endtime>TIMESIZE)
		endtime=TIMESIZE;
	for (t=comptime;t<endtime;++t) {
#ifdef USEVECTOR
		vector<float> & realst=reals[t]; // try and speed this up
		vector<float> & imagst=imags[t];
//		vector<float> & probst=probs[t];
		vector<float> & angstrealt=angstreal[t];
		vector<float> & angstimagt=angstimag[t];
#else
		float* realst=reals[t]; // try and speed this up
		float* imagst=imags[t];
//		float* probst=probs[t];
		float* angstrealt=angstreal[t];
		float* angstimagt=angstimag[t];
#endif
		for (x=0;x<SPACESIZE;++x) {
			float ampr=0,ampi=0;
#ifdef USEVECTOR
			vector<float> & angsxx=angsx[x];
#else
			float* angsxx=angsx[x];
#endif
			perf_start(TEST3);
			S32 np;
			for (np=0;np<nexlate;++np) {
				n=exlate[np];
				float xp=angsxx[n];
				ampr+=xp*angstrealt[n];
				ampi+=xp*angstimagt[n];
			}
			perf_end(TEST3);
			perf_start(TEST4);
			ampr*=normk; // go with graphical normals, better scaling
			ampi*=normk;
			realst[x]=ampr;
			imagst[x]=ampi;
//			probst[x]=ampr*ampr+ampi*ampi;
			perf_end(TEST4);
		}
	}
	comptime=endtime;
	perf_end(TEST2);
}

*/		
	}


	#updateAmpSlider(val) {
		if (this.eles.ampSliderDOM) {
			this.eles.ampSliderDOM.setValue(val);
		}
	}

	#updatePhaseSlider(val) {
		if (this.eles.phaseSliderDOM) {
			this.eles.phaseSliderDOM.setValue(val);
		}
	}

	#updateEnergyList() {
		this.energiesText = "    Qnum Energy   Amp   Phase\n";
		for (let q = 1 + this.scrollQOffset; q <= this.maxShowQnum + this.scrollQOffset; ++q) {
			if (q >= 1 && q <= this.maxQnum) {
				const energy = q * q;
				const hilight = q == this.curQnum;
				if (hilight) {
					this.energiesText += "<span id='hilight'>" + ">>> ";
				} else {
					this.energiesText += "    ";
				}
				this.energiesText += " " + q.toString().padStart(3) 
					+ "   " + String(energy).padStart(4)
					+ " " + this.amps[q].toFixed(1).padStart(5) 
					+ "  " + this.phases[q].toFixed(1).padStart(6);
				if (hilight) {
					this.energiesText +="</span>"
				}
				this.energiesText += "\n";
			} else {
				this.energiesText += "OUT OF RANGE: qval = " + q + "\n";
			}
		}
		if (this.eles.energyListDom) {
			this.eles.energyListDom.innerHTML = this.energiesText;
		}
		this.#updateAmpSlider(this.amps[this.curQnum]);
		this.#updatePhaseSlider(this.phases[this.curQnum]);
	}

	#updateQnumScroll(v) {
		v = range(1, v, this.maxQnum);
		this.curQnum = v;
		this.scrollQOffset = v - Math.floor(this.maxShowQnum / 2);
		this.scrollQOffset = range(0, this.scrollQOffset, this.maxQnum - this.maxShowQnum);
	}

	// USER: add more members or classes to MainApp
	#userInit() {
		// before firing up Plotter2d
		this.startCenter = [0, 0];
		this.startZoom = .98;

		// animate
		this.fpsScreen = 60;
		this.freq = 0;
		this.minFreq = -2;
		this.maxFreq = 2;
		this.stepFreq = .01;

		this.displayMode = 0; // 8 different display modes, TODO: maybe an enum

		// for sine wave like functions, add a phase to the input of the function(s)
		// placeholder
		this.phase = 0; // [0 to 2 * PI)
		this.minPhase = 0;
		this.maxPhase = Math.PI * 2;
		this.stepPhase = .0005;
		this.numSteps = 250;

		// quantum state
		this.#initEnergies();
		this.mouseX = 0;
		this.mouseY = 0;
	}

	#userBuildUI() {
		if (!this.vp) {
			return;
		}
		// elements
		this.eles = {};
		// phase slider combo
		makeEle(this.vp, "hr");
		{
			// start phase UI
			const label = "Phase (p)";
			const min = this.minPhase;
			const max = this.maxPhase;
			const start = 0;
			const step = this.stepPhase;
			const precision = 2;
			this.eles.phaseCombo = new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => {this.phase = v});
			// end phase UI
		}
	
		// frequency slider combo
		{
			const label = "Frequency";
			const min = this.minFreq;
			const max = this.maxFreq;
			const start = 0;
			const step = this.stepFreq;
			const precision = 2;
			new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => {this.freq = v});
		}

		makeEle(this.vp, "hr");
		this.eles.quantInfo = makeEle(this.vp, "pre", null, null, "quantInfo");
		makeEle(this.vp, "button", null, "lessWidth", "Prev", () => this.displayMode = (this.displayMode - 1) & 7);
		makeEle(this.vp, "button", null, "lessWidth", "Next", () => this.displayMode = (this.displayMode + 1) & 7);
	
		makeEle(this.vp, "hr");

		makeEle(this.vp, "pre", null, null, "ENERGIES");
		const energyDOM = makeEle(this.vp, "pre", null, "energyList", "energy list text");
		this.eles.energyListDom = energyDOM;
		energyDOM.addEventListener("click", (e) => {
			this.mouseX = e.offsetX;
			this.mouseY = e.offsetY;
			const rowSize = 20; // tweak
			const mul = 1 / rowSize;
			const add = 0;
			const v = Math.floor(range(1, this.mouseY * mul + add, this.maxQnum));
			this.#updateQnumScroll(v + this.scrollQOffset);
			this.#updateEnergyList();
			this.eles.qNumSliderDOM.setValue(this.curQnum);
		});
		
		this.#updateEnergyList(); // UI
		// Quantum Number slider combo  [1 to maxQnum], (0 not used)
		{
			const label = "Q Number";
			const min = 1;
			const max = this.maxQnum;
			const start = 1;
			const step = 1;
			const precision = 0;
			this.eles.qNumSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, (v) => {
				this.#updateQnumScroll(v);
				this.#updateEnergyList(); // UI
			}, null, false);
		}
		// amplitude slider combo
		{
			const label = "Amplitude";
			const min = 0;
			const max = 100;
			const start = 0;
			const step = .1;
			const precision = 1;
			this.eles.ampSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, null, null, false);
		}
		// phase slider combo
		{
			const label = "Phase";
			const min = -180;
			const max = 180;
			const start = 0;
			const step = .1;
			const precision = 1;
			this.eles.phaseSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, null, null, false);
		}
		// spread slider combo
		{
			const label = "Energy Spread";
			const min = 0;
			const max = 100;
			const start = 0;
			const step = 1;
			const precision = 0;
			this.eles.spreadSliderDOM = new makeEleCombo(this.vp, label, min, max, start, step, precision, null, null, false);
		}
		makeEle(this.vp, "button", null, "lessWidth", "Replace", () => {
			this.#addReplaceEnergy(false);
		});
		makeEle(this.vp, "button", null, "lessWidth", "Add", () => {
			this.#addReplaceEnergy(true);
		});
		makeEle(this.vp, "br");
		makeEle(this.vp, "button", null, null, "Reset Energies", () => {
			this.amps.fill(0);
			this.phases.fill(0);
			this.#updateEnergyList();
		});
		makeEle(this.vp, "button", null, null, "Calculate", () => null);

		makeEle(this.vp, "hr");
		
		makeEle(this.vp, "button", null, null, "Quit Program", () => {
			window.location.href = "../../index.html#plotter2d";
		});
		this.#updateEnergyList();
	}

	#userProc() {
		// proc
		// update phase given freq
		if (this.freq !== 0) {
			this.phase += this.freq * (this.maxPhase - this.minPhase) / this.fpsScreen;
			this.phase = normAngRadUnsigned(this.phase);
			this.eles.phaseCombo.setValue(this.phase);
		}
		this.#buildFunData();
	}

	#userDraw() {
		this.#drawFunData();
	}

	#userUpdateInfo() {
		if (!this.vp) {
			return;
		}
		this.eles.quantInfo.innerText = "Q: coord = (" + this.mouseX + ", " + this.mouseY 
			+ ")\nDisplay mode = " + this.displayMode;
	}

	#buildFunData() {
		this.funData = [];
		for (let i = 0; i <= this.numSteps; ++i) {
			const a = i * Math.PI / this.numSteps;
			const v = Math.sin(a) * Math.cos(this.phase);
			this.funData.push(v);
		}
	}

	#drawFunData() {
		this.drawPrim.drawLinesSimple(this.funData, .005, undefined, -1, 2 / this.numSteps);
	}


//// END USER SECTION ///////

	// process every frame
	#animate() {
		//  proc
		// update input system
		this.input.proc();
		// interact with mouse, calc all spaces
		this.plotter2d.proc(this.vp, this.input.mouse, Mouse.RIGHT);
		this.#userProc();

		// draw
		this.plotter2d.clearCanvas();
		// goto user/cam space
		this.plotter2d.setSpace(Plotter2d.spaces.USER);
		// now in user/cam space
		this.graphPaper.draw("X", "Y");
		// USER: do USER stuff
		this.#userDraw(); // draw

		// update UI, text
		this.#userUpdateInfo();

		// keep animation going
		requestAnimationFrame(() => this.#animate());
	}
}

const mainApp = new MainApp();
