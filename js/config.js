// Default premium layout settings for each cat
const DEFAULT_SETTINGS = {
    orangeSolo: { originX: 0.5, originY: 0.5, offsetX: 0, offsetY: -10, scaleX: 0.56, scaleY: 0.54 },
    creamCurl: { originX: 0.377, originY: 0.32, offsetX: 34, offsetY: 2, scaleX: 0.63, scaleY: 0.5 },
    graySit: { originX: 0.336, originY: 0.221, offsetX: 8, offsetY: 14, scaleX: 0.58, scaleY: 0.58 },
    calicoStretch: { originX: 0.375, originY: 0.25, offsetX: 4, offsetY: 29, scaleX: 0.58, scaleY: 0.63 },
    blackLong: { originX: 0.5, originY: 0.5, offsetX: 9, offsetY: 15, scaleX: 0.5, scaleY: 0.7 }
};

// Ensure new custom offsets are loaded by clearing old localStorage once
if (localStorage.getItem('jellycats_settings_version') !== 'v2') {
    localStorage.removeItem('jellycats_editor_settings');
    localStorage.setItem('jellycats_settings_version', 'v2');
}

// Load modified settings from localStorage (if any)
const savedSettings = JSON.parse(localStorage.getItem('jellycats_editor_settings') || '{}');

// Merge saved settings with defaults
const CURRENT_SETTINGS = {};
for (let key in DEFAULT_SETTINGS) {
    CURRENT_SETTINGS[key] = { ...DEFAULT_SETTINGS[key], ...savedSettings[key] };
}

const PIECE_DEFS = [
    { 
        id: 'orangeSolo', 
        color: 0xffaa44, 
        cells: [[0,0]], 
        originX: CURRENT_SETTINGS.orangeSolo.originX, 
        originY: CURRENT_SETTINGS.orangeSolo.originY,
        offsetX: CURRENT_SETTINGS.orangeSolo.offsetX,
        offsetY: CURRENT_SETTINGS.orangeSolo.offsetY,
        scaleX: CURRENT_SETTINGS.orangeSolo.scaleX,
        scaleY: CURRENT_SETTINGS.orangeSolo.scaleY
    },
    { 
        id: 'creamCurl', 
        color: 0xffeebb, 
        cells: [[0,0], [1,0], [1,1]], // Adjusted to match the cat image shape!
        originX: CURRENT_SETTINGS.creamCurl.originX, 
        originY: CURRENT_SETTINGS.creamCurl.originY,
        offsetX: CURRENT_SETTINGS.creamCurl.offsetX,
        offsetY: CURRENT_SETTINGS.creamCurl.offsetY,
        scaleX: CURRENT_SETTINGS.creamCurl.scaleX,
        scaleY: CURRENT_SETTINGS.creamCurl.scaleY
    },
    { 
        id: 'graySit', 
        color: 0x9999a0, 
        cells: [[0,0], [0,1], [0,2], [1,2]], 
        originX: CURRENT_SETTINGS.graySit.originX, 
        originY: CURRENT_SETTINGS.graySit.originY,
        offsetX: CURRENT_SETTINGS.graySit.offsetX,
        offsetY: CURRENT_SETTINGS.graySit.offsetY,
        scaleX: CURRENT_SETTINGS.graySit.scaleX,
        scaleY: CURRENT_SETTINGS.graySit.scaleY
    },
    { 
        id: 'calicoStretch', 
        color: 0xe88a5d, 
        cells: [[0,0], [0,1], [1,1], [1,2]], // Adjusted to match the cat image shape!
        originX: CURRENT_SETTINGS.calicoStretch.originX, 
        originY: CURRENT_SETTINGS.calicoStretch.originY,
        offsetX: CURRENT_SETTINGS.calicoStretch.offsetX,
        offsetY: CURRENT_SETTINGS.calicoStretch.offsetY,
        scaleX: CURRENT_SETTINGS.calicoStretch.scaleX,
        scaleY: CURRENT_SETTINGS.calicoStretch.scaleY
    },
    { 
        id: 'blackLong', 
        color: 0x444444, 
        cells: [[0,0], [0,1], [0,2], [0,3]], 
        originX: CURRENT_SETTINGS.blackLong.originX, 
        originY: CURRENT_SETTINGS.blackLong.originY,
        offsetX: CURRENT_SETTINGS.blackLong.offsetX,
        offsetY: CURRENT_SETTINGS.blackLong.offsetY,
        scaleX: CURRENT_SETTINGS.blackLong.scaleX,
        scaleY: CURRENT_SETTINGS.blackLong.scaleY
    }
];

const BASE_CS = 100; // Базовый размер клетки для генерации текстур
