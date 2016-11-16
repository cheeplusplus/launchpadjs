const GRID_WIDTH = 9;
const GRID_HEIGHT = 8;

const MIDI_CODES = {
    "NOTE_ON": 0x90,
    "NOTE_OFF": 0x80,
    "CONTROLLER_CHANGE": 0xB0
};

const COLORS = {
    "Off": 0x0C,
    "RedLow": 0x0D,
    "RedHigh": 0x0F,
    "AmberLow": 0x1D,
    "AmberHigh": 0x3F,
    "GreenLow": 0x1C,
    "GreenHigh": 0x3C
};


class LaunchpadController {
    constructor(input, output) {
        this.input = input;
        this.output = output;

        this.input.onmidimessage = (msg) => this.onMsg(msg);
    }

    static get_xy_from_key(key) {
        for (let row = 0; row < GRID_HEIGHT; row++) {
            const offset = (row * 0x10)
            if (key >= offset && key <= (offset+(GRID_WIDTH-1))) {
                return [row, key-offset];
            }
        }
        return [-1,-1];
    }

    static get_key_from_xy(x, y) {
        return ((0x10 * x) + y);
    }

    static get_x_from_control(key) {
        return (key - 0x68);
    }

    static get_control_from_x(x) {
        return (0x68 + x);
    }

    static get_name_from_color(color) {
        if (!color) return COLORS.Off;

        let name;
        for (let key in COLORS) {
            if (COLORS[key] === color) {
                return key;
            }
        }
    }

    onMsg(msg) {
        const [ev, k, vel] = msg.data;
    
        if (ev == MIDI_CODES.NOTE_ON) {
            const [x, y] = LaunchpadController.get_xy_from_key(k);
            this.onNoteEvent(x, y, vel);
        } else if (ev == MIDI_CODES.CONTROLLER_CHANGE) {
            const x = LaunchpadController.get_x_from_control(k);
            this.onControllerEvent(x, vel);
        }
    }

    onNoteEvent(x, y, velocity) {}
    onControllerEvent(x, velocity) {}

    resetColors() {
        this.output.send([MIDI_CODES.CONTROLLER_CHANGE, 0x0, 0x0]);
    }

    setNoteColor(x, y, color) {
        const key = LaunchpadController.get_key_from_xy(x, y);
        this.output.send([MIDI_CODES.NOTE_ON, key, color]);
    }

    setControllerColor(x, color) {
        const key = LaunchpadController.get_control_from_x(x);
        this.output.send([MIDI_CODES.CONTROLLER_CHANGE, key, color]);
    }
}

class StatefulLaunchpadController extends LaunchpadController {
    constructor(...args) {
        super(...args);

        // TODO: Make these 1D

        // Create velocity arrays
        this.buttonStates1 = new Array(GRID_WIDTH);
        for (let x = 0; x < GRID_WIDTH; x++) {
            this.buttonStates1[x] = new Uint8Array(GRID_HEIGHT);
        }

        this.buttonStates2 = new Uint8Array(GRID_WIDTH);

        // Create color state arrays
        this.colorStates1 = new Array(GRID_WIDTH);
        for (let x = 0; x < GRID_WIDTH; x++) {
            this.colorStates1[x] = new Uint8Array(GRID_HEIGHT);
        }

        this.colorStates2 = new Uint8Array(GRID_WIDTH);
    }

    onNoteEvent(x, y, velocity) {
        this.buttonStates1[x][y] = velocity;
        return velocity > 0;
    }

    getNoteVelocity(x, y) {
        return this.buttonStates1[x][y];
    }

    onControllerEvent(x, velocity) {
        this.buttonStates2[x] = velocity;
        return velocity > 0;
    }

    getControllerVelocity(x) {
        return this.buttonStates2[x];
    }

    setNoteColor(x, y, color) {
        super.setNoteColor(x, y, color);

        this.colorStates1[x][y] = color;
    }

    getNoteColor(x, y) {
        return this.colorStates1[x][y];
    }

    setControllerColor(x, color) {
        super.setControllerColor(x, color);

        this.colorStates2[x] = color;
    }

    getControllerColor(x) {
        return this.colorStates2[x];
    }
}

class LaunchpadManager {
    constructor(controller_constructor = LaunchpadController) {
        this.controller_constructor = controller_constructor;
    }

    init() {
        return navigator.requestMIDIAccess().then((midi) => this.registerMidi(midi));
    }

    registerMidi(midi) {
        let targetInput, targetOutput;

        for (let input of midi.inputs.values()) {
            if (input.name.indexOf("Launchpad") > -1) {
                targetInput = input;
                break;
            }
        }
        
        for (let output of midi.outputs.values()) {
            if (output.name.indexOf("Launchpad") > -1) {
                targetOutput = output;
                break;
            }
        }
        
        return new this.controller_constructor(targetInput, targetOutput);
    }
}
