'use strict';

class QuantApp extends QBox1D {
	initEnergies() {
        
		QBox1D.genBox = new makeFunSHO(this.maxQNum);
		QBox1D.funBox = QBox1D.genBox.getFun();
        /*
		QBox1D.genBox = new makeFunBox(this.maxQNum);
		QBox1D.funBox = QBox1D.genBox.getFun();
        */
		this.scrollQOffset = 0; // scroll amount
		this.curQnum = 1; // 1 to maxQNum inclusive

		// Qnum internal starts at 0
		this.amps = new Array(this.maxQNum).fill(0); // amps[0] is NOW used
		this.phases = new Array(this.maxQNum).fill(0); // amps[0] is NOW used
		this.amps[0] = 50;
		this.phases[0] = 0;
		//this.amps[1] = 50;
		//this.phases[1] = 0;

		this.updateEnergyList();
		//this.#compute();
	}

    userInit() {
		// measure frame rate
		this.fps;
		this.avgFps = 0;
		this.oldTime; // for delta time
		this.avgFpsObj = new Runavg(500);
		// before firing up Plotter2d
		//const centerProb = true;

		// animate
		this.fpsScreen = 60;
		this.numXSteps = 1024; // for drawing
		this.numTSteps = 1024;
		this.displayMode = QBox1D.displayModesEnum.X_P_T; // 8 different display modes
		this.rotateAxis = vec2.create(); // for RIX free

		this.maxQNum = 20;
		this.maxShowQnum = 16; // scroll window size
		// for sine wave like functions, add a phase to the input of the function(s)
		this.animTime = 0; // [0 to 1]
		this.animPos = 0; // [0 to 1]
		this.animMin = 0;
		this.animMax = 1;
		this.animStep = 1 / 1000000;
		this.animPrecision = 5;

		this.freq = 0;
		this.freqMin = -1 / 8;
		this.freqMax = 1 / 8;
		this.freqStep = 1 / 20000;
		this.freqPrecision = 5;

		// quantum state
		this.initEnergies();
		this.energiesMouseX = 0;
		this.energiesMouseY = 0;
	}
}
