// Simple "paint" example

const color_control_map = [COLORS.RedHigh, COLORS.RedLow, COLORS.AmberHigh, COLORS.AmberLow, COLORS.GreenHigh, COLORS.GreenLow, COLORS.Off];

class DrawingController extends StatefulLaunchpadController {
    constructor(...args) {
        super(...args);

        this.activeColor = COLORS.RedHigh;
    }

    reset() {
        this.resetColors();

        for (let x = 0; x < GRID_WIDTH; x++) {
            this.setControllerColor(x+1, color_control_map[x]);
        }
    }

    onNoteEvent(x, y, velocity) {
        const pressed = super.onNoteEvent(x, y, velocity);
        if (!pressed) return;
        
        this.setNoteColor(x, y, this.activeColor);
    }

    onControllerEvent(x, velocity) {
        const pressed = super.onControllerEvent(x, velocity);
        if (!pressed) return;

        if (x === 0) {
            this.reset();
            setStatus("Cleared!");
        } else {
            this.activeColor = color_control_map[x-1];
            document.getElementById("status2").innerText = "Current color: " + LaunchpadController.get_name_from_color(this.activeColor);
        }
    }
}

// Debug using this variable in console
let ctrl;

function init() {
    const manager = new LaunchpadManager(DrawingController);
    manager.init().then(controller => {
        ctrl = controller;
        controller.reset();
        document.getElementById("status").innerText = "Ready!";
    });
}
