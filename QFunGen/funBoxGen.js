'use strict';

class makeFunBox {
	// internal, Q starts at 0
    getFun() {
        return (x, q) => Math.sin((q + 1) * x * Math.PI / 2);
    }

	getEnergy(q) {
        ++q;
		return q * q;
	}
}
