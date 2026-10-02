// =========================================================
// ПОЛНЫЙ РАБОЧИЙ СКРИПТ ДЛЯ ПЕРВОГО СПИДОМЕТРА (index.html)
// =========================================================

let turn_left = false;
let turn_right = false;
let turn_signal_timer = null;

// 1. Функции обновления элементов верстки первого спидометра
window.setSpeed = function(speed) {
    const value = Math.max(0, Math.round(Number(speed) || 0));
    const speedText = document.getElementById('text_speed');
    const speedCircle = document.getElementById('speed_circle');

    if (speedText) speedText.innerText = value;
    if (speedCircle) {
        // Расчет процентов дуги спидометра (от 0 до 240 км/ч)
        const speed_value = Math.min(188.25, (188.25 / 240) * value);
        speedCircle.style.strokeDasharray = `${speed_value.toFixed(2)}% 500%`;
    }
};

window.setMileage = function(mileage) {
    const mileageElem = document.getElementById('text_mileage');
    if (mileageElem) {
        mileageElem.innerText = `${Math.round(mileage)} км`;
    }
};

window.setFuel = function(fuel) {
    const value = Number(fuel) || 0;
    const fuelText = document.getElementById('text_fuel');
    const fuelIcon = document.getElementById('fuel_icon');

    if (fuelText) fuelText.innerText = value.toFixed(1);

    if (value < 5) {
        if (fuelIcon) fuelIcon.classList.add('active');
        if (fuelText) fuelText.classList.add('active');
    } else {
        if (fuelIcon) fuelIcon.classList.remove('active');
        if (fuelText) fuelText.classList.remove('active');
    }
};

function turnLightsHandler() {
    const leftElem = document.getElementById('turn_signal_left');
    const rightElem = document.getElementById('turn_signal_right');

    if (turn_left && leftElem) leftElem.classList.toggle('active');
    if (turn_right && rightElem) rightElem.classList.toggle('active');

    if (!turn_left && !turn_right) {
        if (leftElem) leftElem.classList.remove('active');
        if (rightElem) rightElem.classList.remove('active');
        clearInterval(turn_signal_timer);
        turn_signal_timer = null;
    }
}

window.setTurnLight = function(type, value) {
    if (type !== 'left' && type !== 'right') return;
    const state = Boolean(value);

    if (type === 'left') turn_left = state;
    if (type === 'right') turn_right = state;

    const elem = document.getElementById(`turn_signal_${type}`);
    if (elem) elem.classList.remove('active');

    if (state && turn_signal_timer === null) {
        turn_signal_timer = setInterval(turnLightsHandler, 400);
    }
};

window.setIcon = function(type, value) {
    const map = {
        lock: 'flag_lock',
        key: 'flag_key',
        light: 'flag_light',
        belt: 'flag_belt',
        engine: 'flag_engine'
    };

    const id = map[type] || type;
    const element = document.getElementById(id);
    if (element) {
        element.classList.toggle('active', Boolean(value));
    }
};

// 2. Инициализация и подписка на события CEF
function initCefEvents() {
    // Работа со стандартным объектом cef (SA-MP / CRMP CEF)
    if (typeof cef !== 'undefined' && cef) {
        // Включаем опрос статистики (клиент GTA начинает отправлять данные скорости)
        cef.emit("game:hud:setComponentVisible", "interface", false);
        cef.emit("game:data:pollPlayerStats", true, 50);

        // Получаем реальную скорость напрямую от клиента игры
        cef.on("game:data:playerStats", (hp, max_hp, arm, breath, wanted, weapon, ammo, max_ammo, money, speed) => {
            const speedKmh = Math.round(speed * 1.4); // Коэффициент перевода скорости GTA в км/ч
            window.setSpeed(speedKmh);
        });

        // Серверные вызовы
        cef.on("game:data:speed", (speed) => window.setSpeed(speed));
        cef.on("interface:set:speed", (speed) => window.setSpeed(speed));
        cef.on("interface:set:fuel", (fuel) => window.setFuel(fuel));
        cef.on("interface:set:mileage", (mileage) => window.setMileage(mileage));

        cef.on("interace:set:fuelmil", (fuel, mileage) => {
            window.setFuel(fuel);
            window.setMileage(mileage);
        });

        cef.on("modern:speed:update", (speed_or_odo, gas_or_odo, gas) => {
            if (gas !== undefined) {
                window.setSpeed(speed_or_odo);
                window.setMileage(gas_or_odo);
                window.setFuel(gas);
            } else {
                window.setMileage(speed_or_odo);
                window.setFuel(gas_or_odo);
            }
        });

        cef.on("interface:set:turnlight", (type, val) => window.setTurnLight(type, Boolean(parseInt(val))));
        cef.on("interface:set:turn:left", (val) => window.setTurnLight('left', Boolean(parseInt(val))));
        cef.on("interface:set:turn:right", (val) => window.setTurnLight('right', Boolean(parseInt(val))));

        cef.on("interface:set:icon", (type) => window.setIcon(type, true));
        cef.on("interface:unset:icon", (type) => window.setIcon(type, false));
    }

    // Поддержка uCef
    if (typeof uCef !== 'undefined' && uCef && typeof uCef.addEvent === 'function') {
        uCef.addEvent('game:data:speed', (speed) => window.setSpeed(speed));
        uCef.addEvent('interface:set:speed', (speed) => window.setSpeed(speed));
        uCef.addEvent('interface:set:fuel', (fuel) => window.setFuel(fuel));
        uCef.addEvent('interface:set:mileage', (mileage) => window.setMileage(mileage));
        uCef.addEvent('interace:set:fuelmil', (fuel, mileage) => {
            window.setFuel(fuel);
            window.setMileage(mileage);
        });
        uCef.addEvent('interface:set:turnlight', (type, value) => window.setTurnLight(type, Boolean(parseInt(value))));
        uCef.addEvent('interface:set:turn:left', (value) => window.setTurnLight('left', Boolean(parseInt(value))));
        uCef.addEvent('interface:set:turn:right', (value) => window.setTurnLight('right', Boolean(parseInt(value))));
        uCef.addEvent('interface:set:icon', (type) => window.setIcon(type, true));
        uCef.addEvent('interface:unset:icon', (type) => window.setIcon(type, false));
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCefEvents);
} else {
    initCefEvents();
}
