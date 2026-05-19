/**
 * ProfileManager — manages settings profiles: save/load/delete, export/import JSON, autosave.
 * Includes getCurrentState() and applyState() for full settings snapshots.
 */
class ProfileManager {
    constructor(scene) {
        this.scene = scene;
        this.defaultState = {
            globalZoom: 0.6, bgScaleMultiplier: 1.0, boardScale: 1.0,
            boardScaleMode: 'adaptive', boardRowScales: { 4: 1.4, 5: 1.25, 6: 1.15, 7: 1.07, 8: 1.0 },
            gridGap: 7, gridRadius: 4,
            glowThickness: 6, glowBlur: 3, showBlocks: false, fillOccupied: true,
            edgeReturnEnabled: true, customGameCursorEnabled: true,
            gridHighlightColor: '#3cc85f', gridLineThickness: 3,
            jellyMultiplier: 0.6, jellyStiffness: 0.35, jellyDamping: 0.55,
            breatheSpeedScale: 1.2, breatheAmpScale: 1.2, hintDuration: 1700,
            layoutOffsetY: 0, rugPaddingCells: 1.25, rugMode: 'sprite',
            dustEnabled: true, dustCount: 85, dustScale: 1.0, dustDistribution: 'sides', dustEdgeRatio: 0.25,
            sleepZEnabled: true, sleepZScale: 1.0, sleepZOpacity: 0.85,
            soundPitchRange: 0.2, sfxVolume: 0.8, meowVolume: 0.8, swooshVolume: 0.6,
            putVolume: 0.25, returnVolume: 0.8, winVolume: 0.5, uiClickVolume: 0.8, bgMusicVolume: 0.6,
            shadowEnabled: true, shadowOpacity: 0.25,
            rotationSound: 'SFX_Movement_Swoosh_Fast_1', returnSound: 'SFX_Movement_Swoosh_Med_1',
            placementSound: 'click3', winSound: 'win_levelup_05', hintSound: 'SFX_UI_Notification_Popup_1',
            uiClickSound: 'SFX_UI_Button_Click_Generic_1',
            victoryJumpMode: 'sequential', victoryPanelAnimation: 'standard',
            victoryButtonVariant: '1',
            victoryButtonPulseEnabled: true, victoryButtonPulseOnHover: true, victoryButtonOffsetY: 0, victoryTitleOffsetY: 0,
            victoryButtonScale: 1, victoryTitleScale: 1,
            victoryOverlayOpacity: 0.18, victoryOverlayBlur: 2, victoryFadeDuration: 1000,
            playerSettingsButtonScale: 1, playerSettingsButtonOffsetX: 0,
            playerHintButtonScale: 1, playerHintButtonOffsetX: 0,
            playerLevelPanelScale: 1, playerSettingsPanelScale: 1,
            topUiOutlineWidth: 2, topUiOutlineOpacity: 1, topUiOutlineColor: '#111111',
            catSettings: {
                orangeSolo: { originX: 0.5, originY: 0.5, offsetX: 0, offsetY: -10, scaleX: 0.56, scaleY: 0.54, showsSleepZ: true },
                creamCurl: { originX: 0.377, originY: 0.32, offsetX: 34, offsetY: 2, scaleX: 0.63, scaleY: 0.5, showsSleepZ: true },
                graySit: { originX: 0.336, originY: 0.221, offsetX: 8, offsetY: 14, scaleX: 0.58, scaleY: 0.58, showsSleepZ: true },
                calicoStretch: { originX: 0.375, originY: 0.25, offsetX: 4, offsetY: 29, scaleX: 0.58, scaleY: 0.63, showsSleepZ: true },
                blackLong: { originX: 0.5, originY: 0.5, offsetX: -1, offsetY: 147, scaleX: 0.5, scaleY: 0.7, showsSleepZ: true }
            }
        };
    }

    init() {
        const scene = this.scene;
        const self = this;
        const profileSelect = document.getElementById('profile-select');
        const btnSave = document.getElementById('btn-profile-save');
        const btnDelete = document.getElementById('btn-profile-delete');
        const profileNameInput = document.getElementById('profile-name-input');
        const btnExport = document.getElementById('btn-json-export');
        const btnImport = document.getElementById('btn-json-import');
        const fileInput = document.getElementById('json-file-input');

        function getSavedProfiles() { return JSON.parse(localStorage.getItem('jellycats_profiles') || '{}'); }
        function saveProfiles(profiles) { localStorage.setItem('jellycats_profiles', JSON.stringify(profiles)); }

        function renderProfiles() {
            profileSelect.innerHTML = '<option value="default">✨ По умолчанию</option>';
            const profiles = getSavedProfiles();
            for (let name in profiles) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = `📁 ${name}`;
                profileSelect.appendChild(option);
            }
            const activeProfile = localStorage.getItem('jellycats_active_profile') || 'default';
            if (profiles[activeProfile] || activeProfile === 'default') {
                profileSelect.value = activeProfile;
            } else {
                profileSelect.value = 'default';
                localStorage.setItem('jellycats_active_profile', 'default');
            }
            btnDelete.classList.toggle('hidden', profileSelect.value === 'default');
        }

        profileSelect.onchange = () => {
            const selected = profileSelect.value;
            localStorage.setItem('jellycats_active_profile', selected);
            if (selected === 'default') {
                self.applyState(self.defaultState);
                btnDelete.classList.add('hidden');
            } else {
                const state = getSavedProfiles()[selected];
                if (state) self.applyState(state);
                btnDelete.classList.remove('hidden');
            }
        };

        btnSave.onclick = () => {
            let name = profileNameInput.value.trim();
            if (!name) { alert('Мой господин, пожалуйста, введите имя для нового профиля.'); return; }
            const profiles = getSavedProfiles();
            profiles[name] = self.getCurrentState();
            saveProfiles(profiles);
            localStorage.setItem('jellycats_active_profile', name);
            profileNameInput.value = '';
            renderProfiles();
        };

        btnDelete.onclick = () => {
            const selected = profileSelect.value;
            if (selected === 'default') return;
            if (confirm(`Мой господин, вы уверены, что хотите удалить профиль "${selected}"?`)) {
                const profiles = getSavedProfiles();
                delete profiles[selected];
                saveProfiles(profiles);
                localStorage.setItem('jellycats_active_profile', 'default');
                renderProfiles();
                self.applyState(self.defaultState);
            }
        };

        btnExport.onclick = () => {
            const state = self.getCurrentState();
            const activeName = profileSelect.value === 'default' ? 'Default' : profileSelect.value;
            const exportData = { app: 'Jellycats', version: 'v2', profileName: activeName, settings: state };
            const blob = new Blob([JSON.stringify(exportData, null, 4)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `jellycats_settings_${activeName.replace(/[^a-z0-9а-яё_-]/gi, '_')}.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        btnImport.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.app !== 'Jellycats') throw new Error('Некорректный формат файла настроек.');
                    if (!data.settings) throw new Error('В файле отсутствуют настройки.');
                    let profileName = data.profileName || 'Импортированный';
                    if (profileName === 'Default') profileName = 'Импортированный дефолт';
                    const profiles = getSavedProfiles();
                    let uniqueName = profileName; let counter = 1;
                    while (profiles[uniqueName] || uniqueName === 'default') { uniqueName = `${profileName} (${counter})`; counter++; }
                    profiles[uniqueName] = data.settings;
                    saveProfiles(profiles);
                    localStorage.setItem('jellycats_active_profile', uniqueName);
                    renderProfiles();
                    self.applyState(data.settings);
                    fileInput.value = '';
                } catch (err) { alert(`Ошибка импорта настроек: ${err.message}`); }
            };
            reader.readAsText(file);
        };

        renderProfiles();
        const activeProfile = localStorage.getItem('jellycats_active_profile') || 'default';
        if (activeProfile !== 'default') {
            const state = getSavedProfiles()[activeProfile];
            if (state) self.applyState(state);
        }
    }

    autosave() {
        const activeProfile = localStorage.getItem('jellycats_active_profile') || 'default';
        if (activeProfile && activeProfile !== 'default') {
            const profiles = JSON.parse(localStorage.getItem('jellycats_profiles') || '{}');
            profiles[activeProfile] = this.getCurrentState();
            localStorage.setItem('jellycats_profiles', JSON.stringify(profiles));
        }
    }

    getCurrentState() {
        const s = this.scene;
        const catSettings = {};
        const savedEditorSettings = JSON.parse(localStorage.getItem('jellycats_editor_settings') || '{}');
        const savedDeletedPieceIds = JSON.parse(localStorage.getItem('jellycats_deleted_piece_ids') || '[]');
        PIECE_DEFS.forEach(p => {
            catSettings[p.id] = { imagePath: p.imagePath, color: p.color, cells: p.cells, originX: p.originX, originY: p.originY, offsetX: p.offsetX, offsetY: p.offsetY, scaleX: p.scaleX, scaleY: p.scaleY, showsSleepZ: p.showsSleepZ !== false };
        });
        catSettings.__deletedPieceIds = [...new Set([
            ...(Array.isArray(savedDeletedPieceIds) ? savedDeletedPieceIds : []),
            ...(Array.isArray(savedEditorSettings.__deletedPieceIds) ? savedEditorSettings.__deletedPieceIds : [])
        ])];
        return {
            globalZoom: s.currentZoom, bgScaleMultiplier: s.bgScaleMultiplier,
            boardScale: s.boardScale !== undefined ? s.boardScale : 1.0,
            boardScaleMode: s.boardScaleMode || 'adaptive',
            boardRowScales: this.normalizeBoardRowScales(s.boardRowScales),
            gridGap: s.gridGap, gridRadius: s.gridRadius, glowThickness: s.glowThickness, glowBlur: s.glowBlur,
            showBlocks: s.showBlocks, fillOccupied: s.fillOccupied,
            edgeReturnEnabled: s.edgeReturnEnabled !== false,
            customGameCursorEnabled: s.customGameCursorEnabled !== false,
            gridHighlightColor: s.gridHighlightColor, gridLineThickness: s.gridLineThickness,
            jellyMultiplier: s.jellyMultiplier, jellyStiffness: s.jellyStiffness, jellyDamping: s.jellyDamping,
            breatheSpeedScale: s.breatheSpeedScale, breatheAmpScale: s.breatheAmpScale,
            hintDuration: s.hintDuration !== undefined ? s.hintDuration : 1700,
            layoutOffsetY: s.layoutOffsetY !== undefined ? s.layoutOffsetY : 0,
            rugPaddingCells: s.rugPaddingCells !== undefined ? s.rugPaddingCells : 1.25,
            rugMode: s.rugMode || 'sprite',
            dustEnabled: s.dustEnabled, dustCount: s.dustCount, dustScale: s.dustScale,
            dustDistribution: s.dustDistribution, dustEdgeRatio: s.dustEdgeRatio,
            sleepZEnabled: s.sleepZEnabled !== false,
            sleepZScale: s.sleepZScale !== undefined ? s.sleepZScale : 1.0,
            sleepZOpacity: s.sleepZOpacity !== undefined ? s.sleepZOpacity : 0.85,
            soundPitchRange: s.soundPitchRange,
            sfxVolume: s.sfxVolume !== undefined ? s.sfxVolume : 0.8,
            meowVolume: s.meowVolume !== undefined ? s.meowVolume : 0.8,
            swooshVolume: s.swooshVolume !== undefined ? s.swooshVolume : 0.8,
            putVolume: s.putVolume !== undefined ? s.putVolume : 0.8,
            returnVolume: s.returnVolume !== undefined ? s.returnVolume : 0.8,
            winVolume: s.winVolume !== undefined ? s.winVolume : 0.8,
            uiClickVolume: s.uiClickVolume !== undefined ? s.uiClickVolume : 0.8,
            bgMusicVolume: s.bgMusicVolume,
            shadowEnabled: s.shadowEnabled, shadowOpacity: s.shadowOpacity,
            rotationSound: s.selectedRotationSound || 'SFX_Movement_Swoosh_Fast_1',
            returnSound: s.selectedReturnSound || 'SFX_Movement_Swoosh_Fast_1',
            placementSound: s.selectedPlacementSound || 'card-place-1',
            winSound: s.selectedWinSound || 'win_achievement_pop',
            hintSound: s.selectedHintSound || 'SFX_UI_Notification_Popup_1',
            uiClickSound: s.selectedUiClickSound || 'SFX_UI_Button_Click_Generic_1',
            victoryJumpMode: s.victoryJumpMode || 'sequential',
            victoryPanelAnimation: s.victoryPanelAnimation || 'standard',
            victoryButtonVariant: s.victoryButtonVariant || '1',
            victoryButtonPulseEnabled: s.victoryButtonPulseEnabled !== false,
            victoryButtonPulseOnHover: s.victoryButtonPulseOnHover !== false,
            victoryButtonOffsetY: s.victoryButtonOffsetY !== undefined ? s.victoryButtonOffsetY : 0,
            victoryTitleOffsetY: s.victoryTitleOffsetY !== undefined ? s.victoryTitleOffsetY : 0,
            victoryButtonScale: s.victoryButtonScale !== undefined ? s.victoryButtonScale : 1,
            victoryTitleScale: s.victoryTitleScale !== undefined ? s.victoryTitleScale : 1,
            victoryOverlayOpacity: s.victoryOverlayOpacity !== undefined ? s.victoryOverlayOpacity : 0.18,
            victoryOverlayBlur: s.victoryOverlayBlur !== undefined ? s.victoryOverlayBlur : 2,
            victoryEffect: s.selectedVictoryEffect || 'sparkle-stars',
            victoryFadeDuration: s.victoryFadeDuration !== undefined ? s.victoryFadeDuration : 1000,
            playerSettingsButtonScale: s.playerSettingsButtonScale !== undefined ? s.playerSettingsButtonScale : 1,
            playerSettingsButtonOffsetX: s.playerSettingsButtonOffsetX !== undefined ? s.playerSettingsButtonOffsetX : 0,
            playerHintButtonScale: s.playerHintButtonScale !== undefined ? s.playerHintButtonScale : 1,
            playerHintButtonOffsetX: s.playerHintButtonOffsetX !== undefined ? s.playerHintButtonOffsetX : 0,
            playerLevelPanelScale: s.playerLevelPanelScale !== undefined ? s.playerLevelPanelScale : 1,
            playerSettingsPanelScale: s.playerSettingsPanelScale !== undefined ? s.playerSettingsPanelScale : 1,
            topUiOutlineWidth: s.topUiOutlineWidth !== undefined ? s.topUiOutlineWidth : 2,
            topUiOutlineOpacity: s.topUiOutlineOpacity !== undefined ? s.topUiOutlineOpacity : 1,
            topUiOutlineColor: s.topUiOutlineColor || '#111111',
            catSettings: catSettings
        };
    }

    applyState(settings) {
        if (!settings) return;
        if (settings.boardRowScales === undefined) {
            settings = { ...settings, boardRowScales: this.normalizeBoardRowScales() };
        }
        const s = this.scene;

        // 1. Update localStorage
        const lsMap = {
            globalZoom: 'jellycats_global_zoom', bgScaleMultiplier: 'jellycats_bg_scale_multiplier',
            boardScale: 'jellycats_board_scale',
            boardScaleMode: 'jellycats_board_scale_mode',
            boardRowScales: 'jellycats_board_row_scales',
            gridGap: 'jellycats_grid_gap', gridRadius: 'jellycats_grid_radius',
            glowThickness: 'jellycats_glow_thickness', glowBlur: 'jellycats_glow_blur',
            showBlocks: 'jellycats_show_blocks', fillOccupied: 'jellycats_fill_occupied',
            edgeReturnEnabled: 'jellycats_edge_return_enabled', customGameCursorEnabled: 'jellycats_custom_game_cursor',
            gridHighlightColor: 'jellycats_grid_highlight_color', gridLineThickness: 'jellycats_grid_line_thickness',
            jellyMultiplier: 'jellycats_jelly_multiplier', jellyStiffness: 'jellycats_stiffness', jellyDamping: 'jellycats_damping',
            breatheSpeedScale: 'jellycats_breathe_speed_scale', breatheAmpScale: 'jellycats_breathe_amp_scale',
            hintDuration: 'jellycats_hint_duration',
            layoutOffsetY: 'jellycats_layout_offset_y', rugPaddingCells: 'jellycats_rug_padding_cells',
            rugMode: 'jellycats_rug_mode',
            dustEnabled: 'jellycats_dust_enabled', dustCount: 'jellycats_dust_count', dustScale: 'jellycats_dust_scale',
            dustDistribution: 'jellycats_dust_distribution', dustEdgeRatio: 'jellycats_dust_edge_ratio',
            sleepZEnabled: 'jellycats_sleep_z_enabled', sleepZScale: 'jellycats_sleep_z_scale', sleepZOpacity: 'jellycats_sleep_z_opacity',
            soundPitchRange: 'jellycats_sound_pitch_range',
            sfxVolume: 'jellycats_sfx_volume', meowVolume: 'jellycats_meow_volume', swooshVolume: 'jellycats_swoosh_volume',
            putVolume: 'jellycats_put_volume', returnVolume: 'jellycats_return_volume', winVolume: 'jellycats_win_volume',
            uiClickVolume: 'jellycats_ui_click_volume',
            bgMusicVolume: 'jellycats_bg_music_volume',
            shadowEnabled: 'jellycats_shadow_enabled', shadowOpacity: 'jellycats_shadow_opacity',
            rotationSound: 'jellycats_selected_rotation_sound', returnSound: 'jellycats_selected_return_sound',
            placementSound: 'jellycats_selected_placement_sound', winSound: 'jellycats_selected_win_sound',
            hintSound: 'jellycats_selected_hint_sound',
            uiClickSound: 'jellycats_selected_ui_click_sound',
            victoryJumpMode: 'jellycats_victory_jump_mode',
            victoryPanelAnimation: 'jellycats_victory_panel_animation',
            victoryButtonVariant: 'jellycats_victory_button_variant',
            victoryButtonPulseEnabled: 'jellycats_victory_button_pulse_enabled',
            victoryButtonPulseOnHover: 'jellycats_victory_button_pulse_on_hover',
            victoryButtonOffsetY: 'jellycats_victory_button_y',
            victoryTitleOffsetY: 'jellycats_victory_title_y',
            victoryButtonScale: 'jellycats_victory_button_scale',
            victoryTitleScale: 'jellycats_victory_title_scale',
            victoryOverlayOpacity: 'jellycats_victory_overlay_opacity',
            victoryOverlayBlur: 'jellycats_victory_overlay_blur',
            victoryEffect: 'jellycats_victory_effect', victoryFadeDuration: 'jellycats_victory_fade_duration',
            playerSettingsButtonScale: 'jellycats_player_settings_button_scale',
            playerSettingsButtonOffsetX: 'jellycats_player_settings_button_x',
            playerHintButtonScale: 'jellycats_player_hint_button_scale',
            playerHintButtonOffsetX: 'jellycats_player_hint_button_x',
            playerLevelPanelScale: 'jellycats_player_level_panel_scale',
            playerSettingsPanelScale: 'jellycats_player_settings_panel_scale',
            topUiOutlineWidth: 'jellycats_top_ui_outline_width',
            topUiOutlineOpacity: 'jellycats_top_ui_outline_opacity',
            topUiOutlineColor: 'jellycats_top_ui_outline_color'
        };
        for (let key in lsMap) {
            if (settings[key] === undefined) continue;
            const value = key === 'boardRowScales'
                ? JSON.stringify(settings[key])
                : settings[key].toString();
            localStorage.setItem(lsMap[key], value);
        }
        if (settings.catSettings) localStorage.setItem('jellycats_editor_settings', JSON.stringify(settings.catSettings));

        // 2. Update scene variables
        if (settings.globalZoom !== undefined) { s.currentZoom = settings.globalZoom; s.cameras.main.setZoom(s.currentZoom); }
        const directProps = ['bgScaleMultiplier','boardScale','boardScaleMode','gridGap','gridRadius','glowThickness','glowBlur','showBlocks','fillOccupied','edgeReturnEnabled','customGameCursorEnabled',
            'gridHighlightColor','gridLineThickness','jellyMultiplier','jellyStiffness','jellyDamping',
            'breatheSpeedScale','breatheAmpScale','hintDuration','layoutOffsetY','rugPaddingCells','rugMode','dustEnabled','dustCount','dustScale','dustDistribution','dustEdgeRatio',
            'sleepZEnabled','sleepZScale','sleepZOpacity',
            'soundPitchRange','sfxVolume','meowVolume','swooshVolume','putVolume','returnVolume','winVolume','uiClickVolume','victoryJumpMode','victoryPanelAnimation','victoryButtonVariant','victoryButtonPulseEnabled','victoryButtonPulseOnHover','victoryButtonOffsetY','victoryTitleOffsetY','victoryButtonScale','victoryTitleScale','victoryOverlayOpacity','victoryOverlayBlur','victoryFadeDuration','playerSettingsButtonScale','playerSettingsButtonOffsetX','playerHintButtonScale','playerHintButtonOffsetX','playerLevelPanelScale','playerSettingsPanelScale','topUiOutlineWidth','topUiOutlineOpacity','topUiOutlineColor','shadowEnabled','shadowOpacity'];
        directProps.forEach(prop => { if (settings[prop] !== undefined) s[prop] = settings[prop]; });
        if ((settings.playerSettingsButtonScale !== undefined || settings.playerSettingsButtonOffsetX !== undefined || settings.playerHintButtonScale !== undefined || settings.playerHintButtonOffsetX !== undefined || settings.playerLevelPanelScale !== undefined || settings.playerSettingsPanelScale !== undefined) && s.settingsUI) {
            s.settingsUI._applyPlayerUiScale();
        }
        if ((settings.topUiOutlineWidth !== undefined || settings.topUiOutlineOpacity !== undefined || settings.topUiOutlineColor !== undefined) && s.settingsUI) {
            s.settingsUI._applyTopUiOutline();
        }
        if (settings.boardRowScales !== undefined) s.boardRowScales = this.normalizeBoardRowScales(settings.boardRowScales);
        if (settings.bgMusicVolume !== undefined) { s.bgMusicVolume = settings.bgMusicVolume; if (s.soundManager) s.soundManager.applyMusicVolume(); else if (s.bgMusic) s.bgMusic.setVolume(s.bgMusicVolume); }
        if (settings.rotationSound !== undefined) s.selectedRotationSound = settings.rotationSound;
        if (settings.returnSound !== undefined) s.selectedReturnSound = settings.returnSound;
        if (settings.placementSound !== undefined) s.selectedPlacementSound = settings.placementSound;
        if (settings.winSound !== undefined) s.selectedWinSound = settings.winSound;
        if (settings.hintSound !== undefined) s.selectedHintSound = settings.hintSound;
        if (settings.uiClickSound !== undefined) s.selectedUiClickSound = settings.uiClickSound;
        if (settings.victoryJumpMode !== undefined) s.victoryJumpMode = settings.victoryJumpMode;
        if (settings.victoryPanelAnimation !== undefined) s.victoryPanelAnimation = settings.victoryPanelAnimation;
        if (settings.victoryButtonVariant !== undefined && s.applyVictoryButtonVariant) s.applyVictoryButtonVariant();
        if ((settings.victoryButtonPulseEnabled !== undefined || settings.victoryButtonPulseOnHover !== undefined || settings.victoryButtonOffsetY !== undefined || settings.victoryTitleOffsetY !== undefined || settings.victoryButtonScale !== undefined || settings.victoryTitleScale !== undefined) && s.applyVictoryCtaSettings) {
            s.applyVictoryCtaSettings();
        }
        if (settings.victoryOverlayOpacity !== undefined || settings.victoryOverlayBlur !== undefined) {
            if (s.applyVictoryOverlaySettings) s.applyVictoryOverlaySettings();
        }
        if (settings.victoryEffect !== undefined) s.selectedVictoryEffect = settings.victoryEffect;

        // 3. Update PIECE_DEFS and game pieces
        if (settings.catSettings) {
            let needsPieceRebuild = false;
            const storedDeletedPieceIds = JSON.parse(localStorage.getItem('jellycats_deleted_piece_ids') || '[]');
            const deletedPieceIds = [...new Set([
                ...(Array.isArray(storedDeletedPieceIds) ? storedDeletedPieceIds : []),
                ...(Array.isArray(settings.catSettings.__deletedPieceIds) ? settings.catSettings.__deletedPieceIds : [])
            ])];
            localStorage.setItem('jellycats_deleted_piece_ids', JSON.stringify(deletedPieceIds));
            if (deletedPieceIds.length > 0) {
                for (let i = PIECE_DEFS.length - 1; i >= 0; i--) {
                    if (deletedPieceIds.includes(PIECE_DEFS[i].id)) {
                        delete DEFAULT_SETTINGS[PIECE_DEFS[i].id];
                        PIECE_DEFS.splice(i, 1);
                        needsPieceRebuild = true;
                    }
                }
            }
            Object.entries(settings.catSettings).forEach(([id, catSet]) => {
                if (id.startsWith('__') || deletedPieceIds.includes(id)) return;
                if (PIECE_DEFS.some(p => p.id === id)) return;
                if (!catSet || !Array.isArray(catSet.cells) || catSet.cells.length === 0) return;

                DEFAULT_SETTINGS[id] = {
                    originX: catSet.originX !== undefined ? catSet.originX : 0.5,
                    originY: catSet.originY !== undefined ? catSet.originY : 0.5,
                    offsetX: catSet.offsetX !== undefined ? catSet.offsetX : 0,
                    offsetY: catSet.offsetY !== undefined ? catSet.offsetY : 0,
                    scaleX: catSet.scaleX !== undefined ? catSet.scaleX : 0.45,
                    scaleY: catSet.scaleY !== undefined ? catSet.scaleY : 0.45
                };

                PIECE_DEFS.push({
                    id,
                    imagePath: catSet.imagePath || 'assets/cats/orangeSolo.png',
                    color: catSet.color || 0x8ecae6,
                    cells: catSet.cells,
                    originX: DEFAULT_SETTINGS[id].originX,
                    originY: DEFAULT_SETTINGS[id].originY,
                    offsetX: DEFAULT_SETTINGS[id].offsetX,
                    offsetY: DEFAULT_SETTINGS[id].offsetY,
                    scaleX: DEFAULT_SETTINGS[id].scaleX,
                    scaleY: DEFAULT_SETTINGS[id].scaleY,
                    showsSleepZ: catSet.showsSleepZ !== false
                });
                needsPieceRebuild = true;
            });

            PIECE_DEFS.forEach(p => {
                const catSet = settings.catSettings[p.id];
                if (catSet) {
                    if (catSet.imagePath !== undefined) p.imagePath = catSet.imagePath;
                    if (catSet.color !== undefined) p.color = catSet.color;
                    if (catSet.cells !== undefined) {
                        p.cells = catSet.cells;
                        needsPieceRebuild = true;
                    }
                    if (catSet.originX !== undefined) p.originX = catSet.originX;
                    if (catSet.originY !== undefined) p.originY = catSet.originY;
                    if (catSet.offsetX !== undefined) p.offsetX = catSet.offsetX;
                    if (catSet.offsetY !== undefined) p.offsetY = catSet.offsetY;
                    if (catSet.scaleX !== undefined) p.scaleX = catSet.scaleX;
                    if (catSet.scaleY !== undefined) p.scaleY = catSet.scaleY;
                    if (catSet.showsSleepZ !== undefined) p.showsSleepZ = catSet.showsSleepZ !== false;
                    const container = s.pieces.find(pc => pc.def.id === p.id);
                    if (container) {
                        const catImg = container.list.find(child => child.isCatImage);
                        if (catImg) {
                            catImg.setOrigin(p.originX, p.originY); catImg.setScale(p.scaleX, p.scaleY);
                            catImg.x = p.offsetX; catImg.y = p.offsetY;
                            catImg.targetX = p.offsetX; catImg.targetY = p.offsetY;
                        }
                    }
                }
            });
            if (needsPieceRebuild && s.rebuildPiecesFromDefs) {
                s.rebuildPiecesFromDefs();
            }
        }

        // 4. Update HTML inputs
        const uv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        const ut = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        const uc = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

        if (settings.globalZoom !== undefined) { uv('global-zoom-slider', settings.globalZoom); ut('zoom-value-label', `${Math.round(settings.globalZoom * 100)}%`); }
        if (settings.jellyMultiplier !== undefined) { uv('jelly-slider', settings.jellyMultiplier); ut('jelly-value-label', `${Math.round(settings.jellyMultiplier * 100)}%`); }
        if (settings.jellyStiffness !== undefined) { uv('jelly-stiffness-slider', settings.jellyStiffness); ut('jelly-stiffness-value-label', `${Math.round(settings.jellyStiffness * 100)}%`); }
        if (settings.jellyDamping !== undefined) { uv('jelly-damping-slider', settings.jellyDamping); ut('jelly-damping-value-label', `${Math.round(settings.jellyDamping * 100)}%`); }
        if (settings.breatheSpeedScale !== undefined) { uv('breathe-speed-slider', Math.round(settings.breatheSpeedScale * 100)); ut('breathe-speed-value-label', `${Math.round(settings.breatheSpeedScale * 100)}%`); }
        if (settings.breatheAmpScale !== undefined) { uv('breathe-amp-slider', Math.round(settings.breatheAmpScale * 100)); ut('breathe-amp-value-label', settings.breatheAmpScale === 0 ? 'Выкл' : `${Math.round(settings.breatheAmpScale * 100)}%`); }
        if (settings.hintDuration !== undefined) { uv('hint-duration-slider', settings.hintDuration); ut('hint-duration-value-label', `${(parseInt(settings.hintDuration, 10) / 1000).toFixed(1)}s`); }
        if (settings.bgScaleMultiplier !== undefined) { uv('bg-scale-slider', settings.bgScaleMultiplier); ut('bg-scale-value-label', `${Math.round(settings.bgScaleMultiplier * 100)}%`); }
        if (settings.boardScale !== undefined) { uv('board-scale-slider', settings.boardScale); ut('board-scale-value-label', `${Math.round(settings.boardScale * 100)}%`); }
        if (settings.boardScaleMode !== undefined) uv('board-scale-mode-select', settings.boardScaleMode);
        if (settings.boardRowScales !== undefined) {
            [4, 5, 6, 7, 8].forEach((rows) => {
                const value = settings.boardRowScales[rows];
                if (value === undefined) return;
                uv(`board-row-scale-${rows}-slider`, value);
                ut(`board-row-scale-${rows}-value-label`, `${Math.round(value * 100)}%`);
            });
        }
        if (settings.layoutOffsetY !== undefined) { uv('layout-offset-y-slider', settings.layoutOffsetY); ut('layout-offset-y-value-label', `${settings.layoutOffsetY}px`); }
        if (settings.rugPaddingCells !== undefined) { uv('rug-padding-slider', settings.rugPaddingCells); ut('rug-padding-value-label', `${parseFloat(settings.rugPaddingCells).toFixed(2)}x`); }
        if (settings.rugMode !== undefined) uv('rug-mode-select', settings.rugMode);
        if (settings.gridGap !== undefined) { uv('grid-gap-slider', settings.gridGap); ut('grid-gap-value-label', `${settings.gridGap}px`); }
        if (settings.gridRadius !== undefined) { uv('grid-radius-slider', settings.gridRadius); ut('grid-radius-value-label', `${settings.gridRadius}px`); }
        if (settings.glowThickness !== undefined) { uv('glow-thickness-slider', settings.glowThickness); ut('glow-thickness-value-label', settings.glowThickness === 0 ? 'Выкл' : `${settings.glowThickness}px`); }
        if (settings.glowBlur !== undefined) { uv('glow-blur-slider', settings.glowBlur); ut('glow-blur-value-label', settings.glowBlur === 0 ? 'Резкая' : `${settings.glowBlur}px`); }
        if (settings.showBlocks !== undefined) uc('show-blocks-toggle', settings.showBlocks);
        if (settings.fillOccupied !== undefined) uc('fill-occupied-toggle', settings.fillOccupied);
        if (settings.edgeReturnEnabled !== undefined) uc('edge-return-toggle', settings.edgeReturnEnabled);
        if (settings.customGameCursorEnabled !== undefined) uc('custom-game-cursor-toggle', settings.customGameCursorEnabled);
        if (settings.gridHighlightColor !== undefined) uv('grid-color-picker', settings.gridHighlightColor);
        if (settings.gridLineThickness !== undefined) { uv('grid-line-slider', settings.gridLineThickness); ut('grid-line-value-label', `${settings.gridLineThickness}px`); }
        if (settings.dustEnabled !== undefined) uc('dust-toggle', settings.dustEnabled);
        if (settings.dustCount !== undefined) { uv('dust-count-slider', settings.dustCount); ut('dust-count-label', settings.dustCount); }
        if (settings.dustScale !== undefined) { uv('dust-size-slider', settings.dustScale); ut('dust-size-label', `${Math.round(settings.dustScale * 100)}%`); }
        if (settings.dustDistribution !== undefined) uv('dust-dist-select', settings.dustDistribution);
        if (settings.dustEdgeRatio !== undefined) { uv('dust-edge-slider', Math.round(settings.dustEdgeRatio * 100)); ut('dust-edge-label', `${Math.round(settings.dustEdgeRatio * 100)}%`); }
        if (settings.soundPitchRange !== undefined) { uv('sound-pitch-slider', Math.round(settings.soundPitchRange * 100)); ut('sound-pitch-value-label', `±${Math.round(settings.soundPitchRange * 100)}%`); }
        if (settings.sleepZEnabled !== undefined) uc('sleep-z-toggle', settings.sleepZEnabled);
        if (settings.sleepZScale !== undefined) { uv('sleep-z-size-slider', settings.sleepZScale); ut('sleep-z-size-label', `${Math.round(settings.sleepZScale * 100)}%`); }
        if (settings.sleepZOpacity !== undefined) { uv('sleep-z-opacity-slider', Math.round(settings.sleepZOpacity * 100)); ut('sleep-z-opacity-label', `${Math.round(settings.sleepZOpacity * 100)}%`); }
        if (settings.bgMusicVolume !== undefined) { uv('bg-music-volume-slider', Math.round(settings.bgMusicVolume * 100)); ut('bg-music-volume-value-label', `${Math.round(settings.bgMusicVolume * 100)}%`); }
        if (settings.sfxVolume !== undefined) { uv('sfx-volume-slider', Math.round(settings.sfxVolume * 100)); ut('sfx-volume-value-label', `${Math.round(settings.sfxVolume * 100)}%`); }
        if (settings.meowVolume !== undefined) { uv('meow-volume-slider', Math.round(settings.meowVolume * 100)); ut('meow-volume-value-label', `${Math.round(settings.meowVolume * 100)}%`); }
        if (settings.swooshVolume !== undefined) { uv('swoosh-volume-slider', Math.round(settings.swooshVolume * 100)); ut('swoosh-volume-value-label', `${Math.round(settings.swooshVolume * 100)}%`); }
        if (settings.putVolume !== undefined) { uv('put-volume-slider', Math.round(settings.putVolume * 100)); ut('put-volume-value-label', `${Math.round(settings.putVolume * 100)}%`); }
        if (settings.returnVolume !== undefined) { uv('return-volume-slider', Math.round(settings.returnVolume * 100)); ut('return-volume-value-label', `${Math.round(settings.returnVolume * 100)}%`); }
        if (settings.winVolume !== undefined) { uv('win-volume-slider', Math.round(settings.winVolume * 100)); ut('win-volume-value-label', `${Math.round(settings.winVolume * 100)}%`); }
        if (settings.uiClickVolume !== undefined) { uv('ui-click-volume-slider', Math.round(settings.uiClickVolume * 100)); ut('ui-click-volume-value-label', `${Math.round(settings.uiClickVolume * 100)}%`); }
        if (settings.shadowEnabled !== undefined) uc('shadow-toggle', settings.shadowEnabled);
        if (settings.shadowOpacity !== undefined) { uv('shadow-opacity-slider', Math.round(settings.shadowOpacity * 100)); ut('shadow-opacity-value-label', `${Math.round(settings.shadowOpacity * 100)}%`); }
        if (settings.rotationSound !== undefined) uv('rotation-sound-select', settings.rotationSound);
        if (settings.placementSound !== undefined) uv('placement-sound-select', settings.placementSound);
        if (settings.returnSound !== undefined) uv('return-sound-select', settings.returnSound);
        if (settings.winSound !== undefined) uv('win-sound-select', settings.winSound);
        if (settings.hintSound !== undefined) uv('hint-sound-select', settings.hintSound);
        if (settings.uiClickSound !== undefined) uv('ui-click-sound-select', settings.uiClickSound);
        if (settings.victoryJumpMode !== undefined) uv('victory-jump-mode-select', settings.victoryJumpMode);
        if (settings.victoryPanelAnimation !== undefined) uv('victory-panel-animation-select', settings.victoryPanelAnimation);
        if (settings.victoryButtonVariant !== undefined) uv('victory-button-variant-select', settings.victoryButtonVariant);
        if (settings.victoryButtonPulseEnabled !== undefined) uc('victory-button-pulse-toggle', settings.victoryButtonPulseEnabled !== false);
        if (settings.victoryButtonPulseOnHover !== undefined) uc('victory-button-pulse-hover-toggle', settings.victoryButtonPulseOnHover !== false);
        if (settings.victoryButtonOffsetY !== undefined) { uv('victory-button-y-slider', settings.victoryButtonOffsetY); ut('victory-button-y-value-label', `${settings.victoryButtonOffsetY}px`); }
        if (settings.victoryTitleOffsetY !== undefined) { uv('victory-title-y-slider', settings.victoryTitleOffsetY); ut('victory-title-y-value-label', `${settings.victoryTitleOffsetY}px`); }
        if (settings.victoryButtonScale !== undefined) { uv('victory-button-scale-slider', Math.round(settings.victoryButtonScale * 100)); ut('victory-button-scale-value-label', `${Math.round(settings.victoryButtonScale * 100)}%`); }
        if (settings.victoryTitleScale !== undefined) { uv('victory-title-scale-slider', Math.round(settings.victoryTitleScale * 100)); ut('victory-title-scale-value-label', `${Math.round(settings.victoryTitleScale * 100)}%`); }
        if (settings.victoryOverlayOpacity !== undefined) {
            const opacityPercent = Math.round(settings.victoryOverlayOpacity * 100);
            uv('victory-overlay-opacity-slider', opacityPercent);
            ut('victory-overlay-opacity-value-label', `${opacityPercent}%`);
        }
        if (settings.victoryOverlayBlur !== undefined) {
            uv('victory-overlay-blur-slider', settings.victoryOverlayBlur);
            ut('victory-overlay-blur-value-label', `${settings.victoryOverlayBlur}px`);
        }
        if (settings.victoryEffect !== undefined) uv('victory-effect-select', settings.victoryEffect);
        if (settings.victoryFadeDuration !== undefined) { uv('victory-fade-slider', settings.victoryFadeDuration); ut('victory-fade-value-label', `${settings.victoryFadeDuration}ms`); }
        if (settings.playerSettingsButtonScale !== undefined) { uv('player-settings-button-scale-slider', Math.round(settings.playerSettingsButtonScale * 100)); ut('player-settings-button-scale-value-label', `${Math.round(settings.playerSettingsButtonScale * 100)}%`); }
        if (settings.playerSettingsButtonOffsetX !== undefined) { uv('player-settings-button-x-slider', settings.playerSettingsButtonOffsetX); ut('player-settings-button-x-value-label', `${settings.playerSettingsButtonOffsetX}px`); }
        if (settings.playerHintButtonScale !== undefined) { uv('player-hint-button-scale-slider', Math.round(settings.playerHintButtonScale * 100)); ut('player-hint-button-scale-value-label', `${Math.round(settings.playerHintButtonScale * 100)}%`); }
        if (settings.playerHintButtonOffsetX !== undefined) { uv('player-hint-button-x-slider', settings.playerHintButtonOffsetX); ut('player-hint-button-x-value-label', `${settings.playerHintButtonOffsetX}px`); }
        if (settings.playerLevelPanelScale !== undefined) { uv('player-level-panel-scale-slider', Math.round(settings.playerLevelPanelScale * 100)); ut('player-level-panel-scale-value-label', `${Math.round(settings.playerLevelPanelScale * 100)}%`); }
        if (settings.playerSettingsPanelScale !== undefined) { uv('player-settings-panel-scale-slider', Math.round(settings.playerSettingsPanelScale * 100)); ut('player-settings-panel-scale-value-label', `${Math.round(settings.playerSettingsPanelScale * 100)}%`); }
        if (settings.topUiOutlineWidth !== undefined) { uv('top-ui-outline-width-slider', settings.topUiOutlineWidth); ut('top-ui-outline-width-value-label', `${settings.topUiOutlineWidth}px`); }
        if (settings.topUiOutlineOpacity !== undefined) { uv('top-ui-outline-opacity-slider', Math.round(settings.topUiOutlineOpacity * 100)); ut('top-ui-outline-opacity-value-label', `${Math.round(settings.topUiOutlineOpacity * 100)}%`); }
        if (settings.topUiOutlineColor !== undefined) uv('top-ui-outline-color-picker', settings.topUiOutlineColor);

        // Update cat editor sliders if open
        const catSelect = document.getElementById('edit-cat-select');
        if (catSelect) {
            const def = PIECE_DEFS.find(p => p.id === catSelect.value);
            if (def) {
                uv('slider-offsetX', def.offsetX); ut('val-offsetX', def.offsetX);
                uv('slider-offsetY', def.offsetY); ut('val-offsetY', def.offsetY);
                uv('slider-scaleX', def.scaleX); ut('val-scaleX', def.scaleX);
                uv('slider-scaleY', def.scaleY); ut('val-scaleY', def.scaleY);
                uv('slider-originX', def.originX); ut('val-originX', def.originX);
                uv('slider-originY', def.originY); ut('val-originY', def.originY);
                uv('edit-image-path', def.imagePath || `assets/cats/${def.id}.png`);
                uc('edit-sleep-z-toggle', def.showsSleepZ !== false);
            }
        }

        // 5. Trigger scene updates
        if (s.updateDustUIState) s.updateDustUIState();
        if (s.updateSleepZUIState) s.updateSleepZUIState();
        if (s.updateShadowUIState) s.updateShadowUIState();
        if (s.applyGameCursorMode) s.applyGameCursorMode();
        if (s.sleepZEnabled === false && s.dustSystem && s.dustSystem.clearZParticles) s.dustSystem.clearZParticles();
        s.updateBlocksVisibility();
        s.updateLayout();
        s.dustSystem.createParticles();
    }

    normalizeBoardRowScales(scales = {}) {
        const defaults = typeof DEFAULT_BOARD_ROW_SCALES !== 'undefined'
            ? DEFAULT_BOARD_ROW_SCALES
            : { 4: 1.4, 5: 1.25, 6: 1.15, 7: 1.07, 8: 1.0 };
        return [4, 5, 6, 7, 8].reduce((result, rows) => {
            const value = parseFloat(scales[rows]);
            result[rows] = Number.isFinite(value) ? value : defaults[rows];
            return result;
        }, {});
    }
}
