// Standalone extraction of the original speedometer logic.
// CEF bridge calls are supported when uCef exists.
// The functions below can also be called directly from the game bridge.

let turn_left = false;
let turn_right = false;
let turn_signal_timer = null;

function setSpeed(speed) {
    const value = Math.max(0, Math.round(Number(speed) || 0));
    document.getElementById('text_speed').innerText = value;
    setSpeedCircle(value);
}

function setSpeedCircle(speed) {
    const speed_value = Math.round((188.25 / 240) * Math.max(0, Number(speed) || 0));
    document.getElementById('speed_circle').style.strokeDasharray = `${speed_value}% 500%`;
}

function setMileage(mileage) {
    document.getElementById('text_mileage').innerText = `${mileage} км`;
}

function setFuel(fuel) {
    const value = Number(fuel) || 0;
    document.getElementById('text_fuel').innerText = value.toFixed(1);

    const icon = document.getElementById('fuel_icon');
    const text = document.getElementById('text_fuel');

    if (value < 5) {
        icon.classList.add('active');
        text.classList.add('active');
    } else {
        icon.classList.remove('active');
        text.classList.remove('active');
    }
}

function turnLightsHandler() {
    if (turn_left) {
        document.getElementById('turn_signal_left').classList.toggle('active');
    }

    if (turn_right) {
        document.getElementById('turn_signal_right').classList.toggle('active');
    }

    if (!turn_left && !turn_right) {
        clearInterval(turn_signal_timer);
        turn_signal_timer = null;
    }
}

function setTurnLight(type, value) {
    if (type !== 'left' && type !== 'right') return;

    const state = Boolean(value);

    if (type === 'left') {
        turn_left = state;
    } else {
        turn_right = state;
    }

    const element = document.getElementById(`turn_signal_${type}`);
    element.classList.remove('active');

    if (state) {
        element.classList.add('active');

        if (turn_signal_timer === null) {
            turn_signal_timer = setInterval(turnLightsHandler, 400);
        }
    }
}

function setIcon(type, value) {
    const map = {
        lock: 'flag_lock',
        key: 'flag_key',
        light: 'flag_light',
        belt: 'flag_belt',
        engine: 'flag_engine'
    };

    const element = document.getElementById(map[type]);
    if (!element) return;

    element.classList.toggle('active', Boolean(value));
}

// Optional original-style CEF event bridge.
if (typeof uCef !== 'undefined' && uCef && typeof uCef.addEvent === 'function') {
    uCef.addEvent('game:data:speed', (speed) => setSpeed(speed));
    uCef.addEvent('interface:set:speed', (speed) => setSpeed(speed));
    uCef.addEvent('interface:set:fuel', (fuel) => setFuel(fuel));
    uCef.addEvent('interface:set:mileage', (mileage) => setMileage(mileage));

    uCef.addEvent('interace:set:fuelmil', (fuel, mileage) => {
        setFuel(fuel);
        setMileage(mileage);
    });

    uCef.addEvent('interface:set:turnlight', (type, value) => {
        setTurnLight(type, Boolean(parseInt(value)));
    });

    uCef.addEvent('interface:set:turn:left', (value) => {
        setTurnLight('left', Boolean(parseInt(value)));
    });

    uCef.addEvent('interface:set:turn:right', (value) => {
        setTurnLight('right', Boolean(parseInt(value)));
    });

    uCef.addEvent('interface:set:icon', (type) => setIcon(type, true));
    uCef.addEvent('interface:unset:icon', (type) => setIcon(type, false));
}

// Browser test API:
// setSpeed(120); setFuel(8.5); setMileage(12345); setTurnLight('left', true);
