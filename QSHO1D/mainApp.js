'use strict';

class QSHO1D extends QBox1D {
	initEnergies() {
		const doSHO = true;
        if (doSHO) {
			QBox1D.genBox = new makeFunSHO(this.maxQNum);
			QBox1D.funBox = QBox1D.genBox.getFun();
		} else {
			QBox1D.genBox = new makeFunBox(this.maxQNum);
			QBox1D.funBox = QBox1D.genBox.getFun();
		}
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

	setZoomCenterFromMode() {
		const modeSettings = [
			{ 
				desc: "P on X anim T",
				center: [0, 5.2],
				zoom: .1516,
				hAxis: 'X',
				vAxis: 'P',
				showAxisNumbers: false,
				animX: false,
			},
			{ 
				desc: "RI on X anim T",
				center: [0, 0],
				zoom: .1516,
				hAxis: 'X',
				vAxis: 'RI',
				showAxisNumbers: false,
				animX: false,
			},
			{
				desc: "I on R anim T",
				center: [0, 0],
				zoom: .95,
				hAxis: 'R',
				vAxis: 'I',
				showAxisNumbers: false,
				animX: false,
			},
			{
				desc: "RIX anim T free",
				center: [0, 0],
				zoom: .95,
				hAxis: 'X',
				vAxis: 'RI',
				showGrid: false,
				showAxis: false,
				animX: false,
				freeMouse: true
			},
			{ 
				desc: "P on T anim X",
				center: [1, 1],
				zoom: .95,
				hAxis: 'T',
				vAxis: 'P',
				showAxisNumbers: false,
				animX: true,
			},
			{ 
				desc: "RI on T anim X",
				center: [1, 0],
				zoom: .95,
				hAxis: 'T',
				vAxis: 'RI',
				showAxisNumbers: false,
				animX: true,
			},
			{
				desc: "I on R anim X",
				center: [0, 0],
				zoom: .95,
				hAxis: 'R',
				vAxis: 'I',
				showAxisNumbers: false,
				animX: true,
			},
			{
				desc: "RIT anim X free",
				center: [0, 0],
				zoom: .95,
				hAxis: 'T',
				vAxis: 'RI',
				showGrid: false,
				showAxis: false,
				animX: true,
				freeMouse: true
			},
		];
		this.setGraphicsParms(modeSettings);
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
		this.minDataX = -14;
		this.maxDataX = 14;
		this.displayMode = QBox1D.displayModesEnum.X_P_T; // 8 different display modes
		this.rotateAxis = vec2.create(); // for RIX free

		this.maxQNum = 58;
		this.maxShowQnum = 16; // scroll window size
		this.probScale = 20;
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

	userDraw() {
		this.userDrawCommon();
		if (this.displayMode == QBox1D.displayModesEnum.X_P_T
			|| this.displayMode == QBox1D.displayModesEnum.X_RI_T) {
			const range = Math.sqrt(this.curQnum * 2 + 1);
			this.drawPrim.drawLine([-range, -.25], [-range, .25], .02, "black");
			this.drawPrim.drawLine([range, -.25], [range, .25], .02, "black");
		}
	}
}

// now called in the html
//new QuantApp();
