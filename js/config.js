// Default premium layout settings for each cat
const DEFAULT_SETTINGS = {
    orangeSolo: { originX: 0.5, originY: 0.5, offsetX: 0, offsetY: -10, scaleX: 0.56, scaleY: 0.54 },
    creamCurl: { originX: 0.377, originY: 0.32, offsetX: 34, offsetY: 2, scaleX: 0.63, scaleY: 0.5 },
    graySit: { originX: 0.336, originY: 0.221, offsetX: 8, offsetY: 14, scaleX: 0.58, scaleY: 0.58 },
    calicoStretch: { originX: 0.375, originY: 0.25, offsetX: 4, offsetY: 29, scaleX: 0.58, scaleY: 0.63 },
    blackLong: { originX: 0.5, originY: 0.5, offsetX: -1, offsetY: 147, scaleX: 0.5, scaleY: 0.7 },
    cat1: { originX: 0.5, originY: 0.5, offsetX: 50, offsetY: 95, scaleX: 0.24, scaleY: 0.24 },
    cat2: { originX: 0.5, originY: 0.5, offsetX: 48, offsetY: 48, scaleX: 0.17, scaleY: 0.17 },
    cat3: { originX: 0.5, originY: 0.5, offsetX: 55, offsetY: 95, scaleX: 0.24, scaleY: 0.24 },
    cat4: { originX: 0.5, originY: 0.5, offsetX: 105, offsetY: 48, scaleX: 0.24, scaleY: 0.24 }
};

const DEFAULT_BOARD_ROW_SCALES = {
    4: 1.4,
    5: 1.25,
    6: 1.15,
    7: 1.07,
    8: 1.0
};

// Ensure updated defaults are loaded once without deleting saved profiles.
if (localStorage.getItem('jellycats_settings_version') !== 'v4') {
    [
        'jellycats_editor_settings',
        'jellycats_global_zoom',
        'jellycats_bg_scale_multiplier',
        'jellycats_board_scale',
        'jellycats_board_scale_mode',
        'jellycats_board_row_scales',
        'jellycats_board_adaptive_strength',
        'jellycats_selected_rotation_sound',
        'jellycats_selected_return_sound',
        'jellycats_selected_placement_sound',
        'jellycats_selected_win_sound',
        'jellycats_jelly_multiplier',
        'jellycats_stiffness',
        'jellycats_damping',
        'jellycats_breathe_speed_scale',
        'jellycats_breathe_amp_scale',
        'jellycats_hint_duration',
        'jellycats_layout_offset_y',
        'jellycats_rug_padding_cells',
        'jellycats_rug_mode',
        'jellycats_grid_gap',
        'jellycats_grid_radius',
        'jellycats_glow_thickness',
        'jellycats_glow_blur',
        'jellycats_show_blocks',
        'jellycats_fill_occupied',
        'jellycats_grid_highlight_color',
        'jellycats_grid_line_thickness',
        'jellycats_sound_pitch_range',
        'jellycats_sfx_volume',
        'jellycats_meow_volume',
        'jellycats_swoosh_volume',
        'jellycats_put_volume',
        'jellycats_return_volume',
        'jellycats_win_volume',
        'jellycats_bg_music_volume',
        'jellycats_shadow_enabled',
        'jellycats_shadow_opacity',
        'jellycats_dust_enabled',
        'jellycats_dust_count',
        'jellycats_dust_scale',
        'jellycats_dust_distribution',
        'jellycats_dust_edge_ratio',
        'jellycats_sleep_z_enabled',
        'jellycats_sleep_z_scale',
        'jellycats_sleep_z_opacity'
    ].forEach(key => localStorage.removeItem(key));
    localStorage.setItem('jellycats_settings_version', 'v4');
}

// Load modified settings from localStorage (if any)
const savedSettings = JSON.parse(localStorage.getItem('jellycats_editor_settings') || '{}');
const savedDeletedPieceIds = JSON.parse(localStorage.getItem('jellycats_deleted_piece_ids') || '[]');
const legacyDeletedPieceIds = Array.isArray(savedSettings.__deletedPieceIds) ? savedSettings.__deletedPieceIds : [];
const DELETED_PIECE_IDS = [...new Set([
    ...(Array.isArray(savedDeletedPieceIds) ? savedDeletedPieceIds : []),
    ...legacyDeletedPieceIds
])];
const isPieceDeleted = (id) => DELETED_PIECE_IDS.includes(id);

// Merge saved settings with defaults
const CURRENT_SETTINGS = {};
for (let key in DEFAULT_SETTINGS) {
    CURRENT_SETTINGS[key] = { ...DEFAULT_SETTINGS[key], ...savedSettings[key] };
}

const PIECE_DEFS = [
    {
        id: 'orangeSolo',
        imagePath: CURRENT_SETTINGS.orangeSolo.imagePath || 'assets/cats/orangeSolo.png',
        color: CURRENT_SETTINGS.orangeSolo.color || 0xffaa44,
        cells: CURRENT_SETTINGS.orangeSolo.cells || [[0,0]],
        originX: CURRENT_SETTINGS.orangeSolo.originX,
        originY: CURRENT_SETTINGS.orangeSolo.originY,
        offsetX: CURRENT_SETTINGS.orangeSolo.offsetX,
        offsetY: CURRENT_SETTINGS.orangeSolo.offsetY,
        scaleX: CURRENT_SETTINGS.orangeSolo.scaleX,
        scaleY: CURRENT_SETTINGS.orangeSolo.scaleY,
        showsSleepZ: CURRENT_SETTINGS.orangeSolo.showsSleepZ !== false
    },
    {
        id: 'creamCurl',
        imagePath: CURRENT_SETTINGS.creamCurl.imagePath || 'assets/cats/creamCurl.png',
        color: CURRENT_SETTINGS.creamCurl.color || 0xffeebb,
        cells: CURRENT_SETTINGS.creamCurl.cells || [[0,0], [1,0], [1,1]],
        originX: CURRENT_SETTINGS.creamCurl.originX,
        originY: CURRENT_SETTINGS.creamCurl.originY,
        offsetX: CURRENT_SETTINGS.creamCurl.offsetX,
        offsetY: CURRENT_SETTINGS.creamCurl.offsetY,
        scaleX: CURRENT_SETTINGS.creamCurl.scaleX,
        scaleY: CURRENT_SETTINGS.creamCurl.scaleY,
        showsSleepZ: CURRENT_SETTINGS.creamCurl.showsSleepZ !== false
    },
    {
        id: 'graySit',
        imagePath: CURRENT_SETTINGS.graySit.imagePath || 'assets/cats/graySit.png',
        color: CURRENT_SETTINGS.graySit.color || 0x9999a0,
        cells: CURRENT_SETTINGS.graySit.cells || [[0,0], [0,1], [0,2], [1,2]],
        originX: CURRENT_SETTINGS.graySit.originX,
        originY: CURRENT_SETTINGS.graySit.originY,
        offsetX: CURRENT_SETTINGS.graySit.offsetX,
        offsetY: CURRENT_SETTINGS.graySit.offsetY,
        scaleX: CURRENT_SETTINGS.graySit.scaleX,
        scaleY: CURRENT_SETTINGS.graySit.scaleY,
        showsSleepZ: CURRENT_SETTINGS.graySit.showsSleepZ !== false
    },
    {
        id: 'calicoStretch',
        imagePath: CURRENT_SETTINGS.calicoStretch.imagePath || 'assets/cats/calicoStretch.png',
        color: CURRENT_SETTINGS.calicoStretch.color || 0xe88a5d,
        cells: CURRENT_SETTINGS.calicoStretch.cells || [[0,0], [0,1], [1,1], [1,2]],
        originX: CURRENT_SETTINGS.calicoStretch.originX,
        originY: CURRENT_SETTINGS.calicoStretch.originY,
        offsetX: CURRENT_SETTINGS.calicoStretch.offsetX,
        offsetY: CURRENT_SETTINGS.calicoStretch.offsetY,
        scaleX: CURRENT_SETTINGS.calicoStretch.scaleX,
        scaleY: CURRENT_SETTINGS.calicoStretch.scaleY,
        showsSleepZ: CURRENT_SETTINGS.calicoStretch.showsSleepZ !== false
    },
    {
        id: 'blackLong',
        imagePath: CURRENT_SETTINGS.blackLong.imagePath || 'assets/cats/blackLong.png',
        color: CURRENT_SETTINGS.blackLong.color || 0x444444,
        cells: CURRENT_SETTINGS.blackLong.cells || [[0,0], [0,1], [0,2], [0,3]],
        originX: CURRENT_SETTINGS.blackLong.originX,
        originY: CURRENT_SETTINGS.blackLong.originY,
        offsetX: CURRENT_SETTINGS.blackLong.offsetX,
        offsetY: CURRENT_SETTINGS.blackLong.offsetY,
        scaleX: CURRENT_SETTINGS.blackLong.scaleX,
        scaleY: CURRENT_SETTINGS.blackLong.scaleY,
        showsSleepZ: CURRENT_SETTINGS.blackLong.showsSleepZ !== false
    },
    {
        id: 'cat1',
        imagePath: CURRENT_SETTINGS.cat1.imagePath || 'assets/cats/1.png',
        color: CURRENT_SETTINGS.cat1.color || 0xcf6b70,
        cells: CURRENT_SETTINGS.cat1.cells || [[0,0], [1,0], [0,1]],
        originX: CURRENT_SETTINGS.cat1.originX,
        originY: CURRENT_SETTINGS.cat1.originY,
        offsetX: CURRENT_SETTINGS.cat1.offsetX,
        offsetY: CURRENT_SETTINGS.cat1.offsetY,
        scaleX: CURRENT_SETTINGS.cat1.scaleX,
        scaleY: CURRENT_SETTINGS.cat1.scaleY,
        showsSleepZ: CURRENT_SETTINGS.cat1.showsSleepZ !== false
    },
    {
        id: 'cat2',
        imagePath: CURRENT_SETTINGS.cat2.imagePath || 'assets/cats/2.png',
        color: CURRENT_SETTINGS.cat2.color || 0xc979d3,
        cells: CURRENT_SETTINGS.cat2.cells || [[0,0], [1,0], [0,1], [1,1]],
        originX: CURRENT_SETTINGS.cat2.originX,
        originY: CURRENT_SETTINGS.cat2.originY,
        offsetX: CURRENT_SETTINGS.cat2.offsetX,
        offsetY: CURRENT_SETTINGS.cat2.offsetY,
        scaleX: CURRENT_SETTINGS.cat2.scaleX,
        scaleY: CURRENT_SETTINGS.cat2.scaleY,
        showsSleepZ: CURRENT_SETTINGS.cat2.showsSleepZ !== false
    },
    {
        id: 'cat3',
        imagePath: CURRENT_SETTINGS.cat3.imagePath || 'assets/cats/3.png',
        color: CURRENT_SETTINGS.cat3.color || 0xff8d25,
        cells: CURRENT_SETTINGS.cat3.cells || [[0,0], [0,1], [1,1]],
        originX: CURRENT_SETTINGS.cat3.originX,
        originY: CURRENT_SETTINGS.cat3.originY,
        offsetX: CURRENT_SETTINGS.cat3.offsetX,
        offsetY: CURRENT_SETTINGS.cat3.offsetY,
        scaleX: CURRENT_SETTINGS.cat3.scaleX,
        scaleY: CURRENT_SETTINGS.cat3.scaleY,
        showsSleepZ: CURRENT_SETTINGS.cat3.showsSleepZ !== false
    },
    {
        id: 'cat4',
        imagePath: CURRENT_SETTINGS.cat4.imagePath || 'assets/cats/4.png',
        color: CURRENT_SETTINGS.cat4.color || 0xb300a9,
        cells: CURRENT_SETTINGS.cat4.cells || [[0,0], [1,0], [2,0], [1,1]],
        originX: CURRENT_SETTINGS.cat4.originX,
        originY: CURRENT_SETTINGS.cat4.originY,
        offsetX: CURRENT_SETTINGS.cat4.offsetX,
        offsetY: CURRENT_SETTINGS.cat4.offsetY,
        scaleX: CURRENT_SETTINGS.cat4.scaleX,
        scaleY: CURRENT_SETTINGS.cat4.scaleY,
        showsSleepZ: CURRENT_SETTINGS.cat4.showsSleepZ !== false
    }
];

for (let i = PIECE_DEFS.length - 1; i >= 0; i--) {
    if (isPieceDeleted(PIECE_DEFS[i].id)) {
        delete DEFAULT_SETTINGS[PIECE_DEFS[i].id];
        PIECE_DEFS.splice(i, 1);
    }
}

Object.keys(savedSettings).forEach(id => {
    if (id.startsWith('__') || isPieceDeleted(id)) return;
    if (PIECE_DEFS.some(piece => piece.id === id)) return;

    const saved = savedSettings[id];
    if (!saved || !Array.isArray(saved.cells) || saved.cells.length === 0) return;

    DEFAULT_SETTINGS[id] = {
        originX: saved.originX !== undefined ? saved.originX : 0.5,
        originY: saved.originY !== undefined ? saved.originY : 0.5,
        offsetX: saved.offsetX !== undefined ? saved.offsetX : 0,
        offsetY: saved.offsetY !== undefined ? saved.offsetY : 0,
        scaleX: saved.scaleX !== undefined ? saved.scaleX : 0.45,
        scaleY: saved.scaleY !== undefined ? saved.scaleY : 0.45
    };

    PIECE_DEFS.push({
        id,
        imagePath: saved.imagePath || 'assets/cats/orangeSolo.png',
        color: saved.color || 0x8ecae6,
        cells: saved.cells,
        originX: DEFAULT_SETTINGS[id].originX,
        originY: DEFAULT_SETTINGS[id].originY,
        offsetX: DEFAULT_SETTINGS[id].offsetX,
        offsetY: DEFAULT_SETTINGS[id].offsetY,
        scaleX: DEFAULT_SETTINGS[id].scaleX,
        scaleY: DEFAULT_SETTINGS[id].scaleY,
        showsSleepZ: saved.showsSleepZ !== false
    });
});

const GRID_COLS = 8;
const GRID_ROWS = 8;
const DEFAULT_GRID_ROWS = 4;
const BASE_CS = 100;
