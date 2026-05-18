/**
 * SettingsUI — initializes ALL settings panel controls (sliders, toggles, selectors).
 * All properties are stored on the scene object for easy access from other modules.
 */
class SettingsUI {
    constructor(scene) {
        this.scene = scene;
    }

    init() {
        const s = this.scene; // shorthand

        // --- Load all settings from localStorage ---
        s.currentZoom = parseFloat(localStorage.getItem('jellycats_global_zoom') || '0.6');
        s.cameras.main.setZoom(s.currentZoom);
        s.bgScaleMultiplier = parseFloat(localStorage.getItem('jellycats_bg_scale_multiplier') || '1.0');
        s.boardScale = parseFloat(localStorage.getItem('jellycats_board_scale') || '1.0');
        s.boardScaleMode = localStorage.getItem('jellycats_board_scale_mode') || 'adaptive';
        s.boardRowScales = this._loadBoardRowScales();
        s.rugMode = localStorage.getItem('jellycats_rug_mode') || 'sprite';
        s.selectedRotationSound = localStorage.getItem('jellycats_selected_rotation_sound') || 'SFX_Movement_Swoosh_Fast_1';
        s.selectedReturnSound = localStorage.getItem('jellycats_selected_return_sound') || 'SFX_Movement_Swoosh_Med_1';
        s.selectedPlacementSound = localStorage.getItem('jellycats_selected_placement_sound') || 'click3';
        s.selectedWinSound = localStorage.getItem('jellycats_selected_win_sound') || 'win_levelup_05';
        s.selectedHintSound = localStorage.getItem('jellycats_selected_hint_sound') || 'SFX_UI_Notification_Popup_1';
        s.selectedUiClickSound = localStorage.getItem('jellycats_selected_ui_click_sound') || 'SFX_UI_Button_Click_Generic_1';
        s.selectedVictoryEffect = localStorage.getItem('jellycats_victory_effect') || 'sparkle-stars';
        s.victoryJumpMode = localStorage.getItem('jellycats_victory_jump_mode') || 'sequential';
        s.victoryPanelAnimation = localStorage.getItem('jellycats_victory_panel_animation') || 'standard';
        s.victoryButtonVariant = localStorage.getItem('jellycats_victory_button_variant') || '1';
        s.victoryButtonPulseEnabled = localStorage.getItem('jellycats_victory_button_pulse_enabled') !== 'false';
        s.victoryButtonPulseOnHover = localStorage.getItem('jellycats_victory_button_pulse_on_hover') !== 'false';
        s.victoryButtonOffsetY = parseInt(localStorage.getItem('jellycats_victory_button_y') || '0', 10);
        s.victoryTitleOffsetY = parseInt(localStorage.getItem('jellycats_victory_title_y') || '0', 10);
        s.victoryOverlayOpacity = parseFloat(localStorage.getItem('jellycats_victory_overlay_opacity') || '0.18');
        s.victoryOverlayBlur = parseFloat(localStorage.getItem('jellycats_victory_overlay_blur') || '2');
        s.victoryFadeDuration = parseInt(localStorage.getItem('jellycats_victory_fade_duration') || '1000', 10);
        s.jellyMultiplier = parseFloat(localStorage.getItem('jellycats_jelly_multiplier') || '0.6');
        s.jellyStiffness = parseFloat(localStorage.getItem('jellycats_stiffness') || '0.35');
        s.jellyDamping = parseFloat(localStorage.getItem('jellycats_damping') || '0.55');
        s.breatheSpeedScale = parseFloat(localStorage.getItem('jellycats_breathe_speed_scale') || '1.2');
        s.breatheAmpScale = parseFloat(localStorage.getItem('jellycats_breathe_amp_scale') || '1.2');
        s.hintDuration = parseInt(localStorage.getItem('jellycats_hint_duration') || '1700', 10);
        s.layoutOffsetY = parseInt(localStorage.getItem('jellycats_layout_offset_y') || '0', 10);
        s.rugPaddingCells = parseFloat(localStorage.getItem('jellycats_rug_padding_cells') || '1.25');
        s.gridGap = parseInt(localStorage.getItem('jellycats_grid_gap') || '7');
        s.gridRadius = parseInt(localStorage.getItem('jellycats_grid_radius') || '4');
        s.glowThickness = parseFloat(localStorage.getItem('jellycats_glow_thickness') || '6');
        s.glowBlur = parseInt(localStorage.getItem('jellycats_glow_blur') || '3');
        const savedShowBlocks = localStorage.getItem('jellycats_show_blocks');
        s.showBlocks = savedShowBlocks !== null ? savedShowBlocks === 'true' : false;
        const savedFillOccupied = localStorage.getItem('jellycats_fill_occupied');
        s.fillOccupied = savedFillOccupied !== null ? savedFillOccupied === 'true' : true;
        const savedEdgeReturnEnabled = localStorage.getItem('jellycats_edge_return_enabled');
        s.edgeReturnEnabled = savedEdgeReturnEnabled !== null ? savedEdgeReturnEnabled === 'true' : true;
        const savedCustomGameCursor = localStorage.getItem('jellycats_custom_game_cursor');
        s.customGameCursorEnabled = savedCustomGameCursor !== null ? savedCustomGameCursor === 'true' : true;
        if (s.applyGameCursorMode) s.applyGameCursorMode();
        s.gridHighlightColor = localStorage.getItem('jellycats_grid_highlight_color') || '#3cc85f';
        s.gridLineThickness = parseInt(localStorage.getItem('jellycats_grid_line_thickness') || '3');
        s.soundPitchRange = parseFloat(localStorage.getItem('jellycats_sound_pitch_range') || '0.2');
        s.uiClickVolume = parseFloat(localStorage.getItem('jellycats_ui_click_volume') || '0.8');
        s.bgMusicVolume = parseFloat(localStorage.getItem('jellycats_bg_music_volume') || '0.6');
        const savedDustEnabled = localStorage.getItem('jellycats_dust_enabled');
        s.dustEnabled = savedDustEnabled !== null ? savedDustEnabled === 'true' : true;
        s.dustCount = parseInt(localStorage.getItem('jellycats_dust_count') || '85');
        s.dustScale = parseFloat(localStorage.getItem('jellycats_dust_scale') || '1.0');
        s.dustDistribution = localStorage.getItem('jellycats_dust_distribution') || 'sides';
        s.dustEdgeRatio = parseFloat(localStorage.getItem('jellycats_dust_edge_ratio') || '0.25');
        const savedSleepZEnabled = localStorage.getItem('jellycats_sleep_z_enabled');
        s.sleepZEnabled = savedSleepZEnabled !== null ? savedSleepZEnabled === 'true' : true;
        s.sleepZScale = parseFloat(localStorage.getItem('jellycats_sleep_z_scale') || '1.0');
        s.sleepZOpacity = parseFloat(localStorage.getItem('jellycats_sleep_z_opacity') || '0.85');
        const savedShadowEnabled = localStorage.getItem('jellycats_shadow_enabled');
        s.shadowEnabled = savedShadowEnabled !== null ? savedShadowEnabled === 'true' : true;
        s.shadowOpacity = parseFloat(localStorage.getItem('jellycats_shadow_opacity') || '0.25');

        // --- Bind all UI controls ---
        this._bindSoundSelectors();
        this._bindVictoryEffect();
        this._bindSliders();
        this._bindToggles();
        this._bindPanelCollapse();
        this._bindDustControls();
        this._bindSleepZControls();
        this._bindShadowControls();
        this._bindResetButton();
    }

    _bindSoundSelectors() {
        const s = this.scene;

        // Rotation sound
        this._bindSelect('rotation-sound-select', s.selectedRotationSound, (val) => {
            s.selectedRotationSound = val;
            localStorage.setItem('jellycats_selected_rotation_sound', val);
            s.autosaveActiveProfile();
        });
        this._bindButton('btn-play-rotation-sound', () => s.soundManager.playRotation());

        // Return sound
        this._bindSelect('return-sound-select', s.selectedReturnSound, (val) => {
            s.selectedReturnSound = val;
            localStorage.setItem('jellycats_selected_return_sound', val);
            s.autosaveActiveProfile();
        });
        this._bindButton('btn-play-return-sound', () => s.soundManager.playReturn());

        // Placement sound
        this._bindSelect('placement-sound-select', s.selectedPlacementSound, (val) => {
            s.selectedPlacementSound = val;
            localStorage.setItem('jellycats_selected_placement_sound', val);
            s.autosaveActiveProfile();
        });
        this._bindButton('btn-play-placement-sound', () => s.soundManager.playPlacement());

        // Win sound
        this._bindSelect('win-sound-select', s.selectedWinSound, (val) => {
            s.selectedWinSound = val;
            localStorage.setItem('jellycats_selected_win_sound', val);
            s.autosaveActiveProfile();
        });
        this._bindButton('btn-play-win-sound', () => s.soundManager.playWin());

        // Hint sound
        this._bindSelect('hint-sound-select', s.selectedHintSound, (val) => {
            s.selectedHintSound = val;
            localStorage.setItem('jellycats_selected_hint_sound', val);
            s.autosaveActiveProfile();
        });
        this._bindButton('btn-play-hint-sound', () => s.soundManager.playHint());

        this._bindSelect('ui-click-sound-select', s.selectedUiClickSound, (val) => {
            s.selectedUiClickSound = val;
            localStorage.setItem('jellycats_selected_ui_click_sound', val);
            s.autosaveActiveProfile();
        });
        this._bindButton('btn-play-ui-click-sound', () => s.soundManager.playUiClick());

        this._bindSelect('rug-mode-select', s.rugMode, (val) => {
            s.rugMode = val;
            localStorage.setItem('jellycats_rug_mode', val);
            s.drawRug();
            s.autosaveActiveProfile();
        });

        this._bindSelect('board-scale-mode-select', s.boardScaleMode, (val) => {
            s.boardScaleMode = val;
            localStorage.setItem('jellycats_board_scale_mode', val);
            s.updateLayout();
            s.autosaveActiveProfile();
        });
    }

    _bindVictoryEffect() {
        const s = this.scene;
        this._bindSelect('victory-effect-select', s.selectedVictoryEffect, (val) => {
            s.selectedVictoryEffect = val;
            localStorage.setItem('jellycats_victory_effect', val);
            s.autosaveActiveProfile();
        });
        this._bindButton('btn-preview-victory-effect', () => {
            if (s.victoryEffects) s.victoryEffects.preview();
        });
        this._bindSelect('victory-jump-mode-select', s.victoryJumpMode, (val) => {
            s.victoryJumpMode = val;
            localStorage.setItem('jellycats_victory_jump_mode', val);
            s.autosaveActiveProfile();
        });
        this._bindSelect('victory-panel-animation-select', s.victoryPanelAnimation, (val) => {
            s.victoryPanelAnimation = val;
            localStorage.setItem('jellycats_victory_panel_animation', val);
            s.autosaveActiveProfile();
        });
        this._bindSelect('victory-button-variant-select', s.victoryButtonVariant, (val) => {
            s.victoryButtonVariant = val;
            localStorage.setItem('jellycats_victory_button_variant', val);
            if (s.applyVictoryButtonVariant) s.applyVictoryButtonVariant();
            s.autosaveActiveProfile();
        });
        if (s.applyVictoryButtonVariant) s.applyVictoryButtonVariant();
        const pulseToggle = document.getElementById('victory-button-pulse-toggle');
        if (pulseToggle) {
            pulseToggle.checked = s.victoryButtonPulseEnabled !== false;
            pulseToggle.onchange = (e) => {
                s.victoryButtonPulseEnabled = e.target.checked;
                localStorage.setItem('jellycats_victory_button_pulse_enabled', s.victoryButtonPulseEnabled.toString());
                if (s.applyVictoryCtaSettings) s.applyVictoryCtaSettings();
                s.autosaveActiveProfile();
            };
        }
        const pulseHoverToggle = document.getElementById('victory-button-pulse-hover-toggle');
        if (pulseHoverToggle) {
            pulseHoverToggle.checked = s.victoryButtonPulseOnHover !== false;
            pulseHoverToggle.onchange = (e) => {
                s.victoryButtonPulseOnHover = e.target.checked;
                localStorage.setItem('jellycats_victory_button_pulse_on_hover', s.victoryButtonPulseOnHover.toString());
                if (s.applyVictoryCtaSettings) s.applyVictoryCtaSettings();
                s.autosaveActiveProfile();
            };
        }
        this._bindRangeSlider('victory-button-y-slider', 'victory-button-y-value-label', s.victoryButtonOffsetY,
            (val) => `${val}px`,
            (val) => {
                s.victoryButtonOffsetY = parseInt(val, 10);
                localStorage.setItem('jellycats_victory_button_y', s.victoryButtonOffsetY.toString());
                if (s.applyVictoryCtaSettings) s.applyVictoryCtaSettings();
                s.autosaveActiveProfile();
            });
        this._bindRangeSlider('victory-title-y-slider', 'victory-title-y-value-label', s.victoryTitleOffsetY,
            (val) => `${val}px`,
            (val) => {
                s.victoryTitleOffsetY = parseInt(val, 10);
                localStorage.setItem('jellycats_victory_title_y', s.victoryTitleOffsetY.toString());
                if (s.applyVictoryCtaSettings) s.applyVictoryCtaSettings();
                s.autosaveActiveProfile();
            });
        if (s.applyVictoryCtaSettings) s.applyVictoryCtaSettings();
        if (s.applyVictoryOverlaySettings) s.applyVictoryOverlaySettings();
        this._bindRangeSlider('victory-overlay-opacity-slider', 'victory-overlay-opacity-value-label', Math.round(s.victoryOverlayOpacity * 100),
            (val) => `${val}%`,
            (val) => {
                s.victoryOverlayOpacity = parseInt(val, 10) / 100;
                localStorage.setItem('jellycats_victory_overlay_opacity', s.victoryOverlayOpacity.toString());
                if (s.applyVictoryOverlaySettings) s.applyVictoryOverlaySettings();
                s.autosaveActiveProfile();
            });
        this._bindRangeSlider('victory-overlay-blur-slider', 'victory-overlay-blur-value-label', s.victoryOverlayBlur,
            (val) => `${parseFloat(val)}px`,
            (val) => {
                s.victoryOverlayBlur = parseFloat(val);
                localStorage.setItem('jellycats_victory_overlay_blur', s.victoryOverlayBlur.toString());
                if (s.applyVictoryOverlaySettings) s.applyVictoryOverlaySettings();
                s.autosaveActiveProfile();
            });
        this._bindRangeSlider('victory-fade-slider', 'victory-fade-value-label', s.victoryFadeDuration,
            (val) => `${val}ms`,
            (val) => {
                s.victoryFadeDuration = parseInt(val, 10);
                localStorage.setItem('jellycats_victory_fade_duration', s.victoryFadeDuration.toString());
                s.autosaveActiveProfile();
            });
    }

    _bindSliders() {
        const s = this.scene;

        // Global zoom
        this._bindRangeSlider('global-zoom-slider', 'zoom-value-label', s.currentZoom,
            (val) => `${Math.round(val * 100)}%`,
            (val) => { s.setGlobalZoom(parseFloat(val)); s.autosaveActiveProfile(); }, true);

        // Jellyness
        this._bindRangeSlider('jelly-slider', 'jelly-value-label', s.jellyMultiplier,
            (val) => `${Math.round(val * 100)}%`,
            (val) => { s.jellyMultiplier = parseFloat(val); localStorage.setItem('jellycats_jelly_multiplier', val); s.autosaveActiveProfile(); });

        // Stiffness
        this._bindRangeSlider('jelly-stiffness-slider', 'jelly-stiffness-value-label', s.jellyStiffness,
            (val) => `${Math.round(val * 100)}%`,
            (val) => { s.jellyStiffness = parseFloat(val); localStorage.setItem('jellycats_stiffness', val); s.autosaveActiveProfile(); });

        // Damping
        this._bindRangeSlider('jelly-damping-slider', 'jelly-damping-value-label', s.jellyDamping,
            (val) => `${Math.round(val * 100)}%`,
            (val) => { s.jellyDamping = parseFloat(val); localStorage.setItem('jellycats_damping', val); s.autosaveActiveProfile(); });

        // Breathe speed
        this._bindRangeSlider('breathe-speed-slider', 'breathe-speed-value-label', Math.round(s.breatheSpeedScale * 100),
            (val) => `${val}%`,
            (val) => { s.breatheSpeedScale = parseInt(val) / 100; localStorage.setItem('jellycats_breathe_speed_scale', s.breatheSpeedScale.toString()); s.autosaveActiveProfile(); });

        // Breathe amplitude
        this._bindRangeSlider('breathe-amp-slider', 'breathe-amp-value-label', Math.round(s.breatheAmpScale * 100),
            (val) => parseInt(val) === 0 ? 'Выкл' : `${val}%`,
            (val) => { s.breatheAmpScale = parseInt(val) / 100; localStorage.setItem('jellycats_breathe_amp_scale', s.breatheAmpScale.toString()); s.autosaveActiveProfile(); });

        this._bindRangeSlider('hint-duration-slider', 'hint-duration-value-label', s.hintDuration,
            (val) => `${(parseInt(val, 10) / 1000).toFixed(1)}s`,
            (val) => {
                s.hintDuration = parseInt(val, 10);
                localStorage.setItem('jellycats_hint_duration', s.hintDuration.toString());
                s.autosaveActiveProfile();
            });

        // Background scale
        this._bindRangeSlider('bg-scale-slider', 'bg-scale-value-label', s.bgScaleMultiplier,
            (val) => `${Math.round(val * 100)}%`,
            (val) => { s.bgScaleMultiplier = parseFloat(val); localStorage.setItem('jellycats_bg_scale_multiplier', val); s.updateLayout(); s.autosaveActiveProfile(); });

        this._bindRangeSlider('board-scale-slider', 'board-scale-value-label', s.boardScale,
            (val) => `${Math.round(val * 100)}%`,
            (val) => { s.boardScale = parseFloat(val); localStorage.setItem('jellycats_board_scale', val); s.updateLayout(); s.autosaveActiveProfile(); });

        this._bindBoardRowScaleSliders();

        this._bindRangeSlider('layout-offset-y-slider', 'layout-offset-y-value-label', s.layoutOffsetY,
            (val) => `${val}px`,
            (val) => { s.layoutOffsetY = parseInt(val, 10); localStorage.setItem('jellycats_layout_offset_y', val); s.updateLayout(); s.autosaveActiveProfile(); });

        this._bindRangeSlider('rug-padding-slider', 'rug-padding-value-label', s.rugPaddingCells,
            (val) => `${parseFloat(val).toFixed(2)}x`,
            (val) => { s.rugPaddingCells = parseFloat(val); localStorage.setItem('jellycats_rug_padding_cells', val); s.updateLayout(); s.autosaveActiveProfile(); });

        // Grid gap
        this._bindRangeSlider('grid-gap-slider', 'grid-gap-value-label', s.gridGap,
            (val) => `${val}px`,
            (val) => { s.gridGap = parseInt(val); localStorage.setItem('jellycats_grid_gap', val); s.drawBoard(); s.autosaveActiveProfile(); });

        // Grid radius
        this._bindRangeSlider('grid-radius-slider', 'grid-radius-value-label', s.gridRadius,
            (val) => `${val}px`,
            (val) => { s.gridRadius = parseInt(val); localStorage.setItem('jellycats_grid_radius', val); s.drawBoard(); s.autosaveActiveProfile(); });

        // Glow thickness
        this._bindRangeSlider('glow-thickness-slider', 'glow-thickness-value-label', s.glowThickness,
            (val) => parseFloat(val) === 0 ? 'Выкл' : `${val}px`,
            (val) => { s.glowThickness = parseFloat(val); localStorage.setItem('jellycats_glow_thickness', val); s.autosaveActiveProfile(); });

        // Glow blur
        this._bindRangeSlider('glow-blur-slider', 'glow-blur-value-label', s.glowBlur,
            (val) => parseInt(val) === 0 ? 'Резкая' : `${val}px`,
            (val) => { s.glowBlur = parseInt(val); localStorage.setItem('jellycats_glow_blur', val); s.autosaveActiveProfile(); });

        // Grid line thickness
        this._bindRangeSlider('grid-line-slider', 'grid-line-value-label', s.gridLineThickness,
            (val) => `${val}px`,
            (val) => { s.gridLineThickness = parseInt(val); localStorage.setItem('jellycats_grid_line_thickness', val); s.drawBoard(); s.autosaveActiveProfile(); });

        // Background music volume
        this._bindRangeSlider('bg-music-volume-slider', 'bg-music-volume-value-label', Math.round(s.bgMusicVolume * 100),
            (val) => `${val}%`,
            (val) => { s.bgMusicVolume = parseInt(val) / 100; localStorage.setItem('jellycats_bg_music_volume', s.bgMusicVolume.toString()); if (s.bgMusic) s.bgMusic.setVolume(s.bgMusicVolume); s.autosaveActiveProfile(); });

        // Sound pitch range
        this._bindRangeSlider('sound-pitch-slider', 'sound-pitch-value-label', Math.round(s.soundPitchRange * 100),
            (val) => `±${val}%`,
            (val) => { s.soundPitchRange = parseInt(val) / 100; localStorage.setItem('jellycats_sound_pitch_range', s.soundPitchRange.toString()); s.autosaveActiveProfile(); });

        // SFX volume
        this._bindVolumeSlider('sfx-volume-slider', 'sfx-volume-value-label', 'sfxVolume', 'jellycats_sfx_volume');
        // Meow volume
        this._bindVolumeSlider('meow-volume-slider', 'meow-volume-value-label', 'meowVolume', 'jellycats_meow_volume');
        // Swoosh volume
        this._bindVolumeSlider('swoosh-volume-slider', 'swoosh-volume-value-label', 'swooshVolume', 'jellycats_swoosh_volume', 0.6);
        // Put volume
        this._bindVolumeSlider('put-volume-slider', 'put-volume-value-label', 'putVolume', 'jellycats_put_volume', 0.25);
        // Return volume
        this._bindVolumeSlider('return-volume-slider', 'return-volume-value-label', 'returnVolume', 'jellycats_return_volume');
        // Win volume
        this._bindVolumeSlider('win-volume-slider', 'win-volume-value-label', 'winVolume', 'jellycats_win_volume', 0.5);
        // UI click volume
        this._bindVolumeSlider('ui-click-volume-slider', 'ui-click-volume-value-label', 'uiClickVolume', 'jellycats_ui_click_volume');

        // Grid highlight color
        const colorPicker = document.getElementById('grid-color-picker');
        if (colorPicker) {
            colorPicker.value = s.gridHighlightColor;
            colorPicker.onchange = (e) => {
                s.gridHighlightColor = e.target.value;
                localStorage.setItem('jellycats_grid_highlight_color', e.target.value);
                s.drawBoard();
                s.autosaveActiveProfile();
            };
        }
    }

    _bindToggles() {
        const s = this.scene;

        // Show blocks
        const showBlocksToggle = document.getElementById('show-blocks-toggle');
        if (showBlocksToggle) {
            showBlocksToggle.checked = s.showBlocks;
            showBlocksToggle.onchange = (e) => {
                s.showBlocks = e.target.checked;
                localStorage.setItem('jellycats_show_blocks', s.showBlocks.toString());
                s.updateBlocksVisibility();
                s.autosaveActiveProfile();
            };
        }

        // Fill occupied
        const fillOccupiedToggle = document.getElementById('fill-occupied-toggle');
        if (fillOccupiedToggle) {
            fillOccupiedToggle.checked = s.fillOccupied;
            fillOccupiedToggle.onchange = (e) => {
                s.fillOccupied = e.target.checked;
                localStorage.setItem('jellycats_fill_occupied', s.fillOccupied.toString());
                s.drawBoard();
                s.autosaveActiveProfile();
            };
        }

        const edgeReturnToggle = document.getElementById('edge-return-toggle');
        if (edgeReturnToggle) {
            edgeReturnToggle.checked = s.edgeReturnEnabled !== false;
            edgeReturnToggle.onchange = (e) => {
                s.edgeReturnEnabled = e.target.checked;
                localStorage.setItem('jellycats_edge_return_enabled', s.edgeReturnEnabled.toString());
                s.autosaveActiveProfile();
            };
        }

        const customCursorToggle = document.getElementById('custom-game-cursor-toggle');
        if (customCursorToggle) {
            customCursorToggle.checked = s.customGameCursorEnabled !== false;
            customCursorToggle.onchange = (e) => {
                s.customGameCursorEnabled = e.target.checked;
                localStorage.setItem('jellycats_custom_game_cursor', s.customGameCursorEnabled.toString());
                if (s.applyGameCursorMode) s.applyGameCursorMode();
                s.autosaveActiveProfile();
            };
        }
    }

    _bindPanelCollapse() {
        const panelToggle = document.getElementById('btn-zoom-toggle');
        const panelBody = document.getElementById('zoom-panel-body');
        const panel = document.getElementById('zoom-control-panel');

        if (panelToggle && panelBody && panel) {
            const savedCollapsed = localStorage.getItem('jellycats_zoom_panel_collapsed') === 'true';
            if (savedCollapsed) {
                panelBody.classList.add('hidden');
                panelToggle.textContent = '➕';
                panel.classList.remove('gap-4');
                panel.classList.add('gap-0');
            }

            panelToggle.onclick = () => {
                const isCollapsed = panelBody.classList.toggle('hidden');
                panelToggle.textContent = isCollapsed ? '➕' : '➖';
                localStorage.setItem('jellycats_zoom_panel_collapsed', isCollapsed.toString());
                if (isCollapsed) {
                    panel.classList.remove('gap-4');
                    panel.classList.add('gap-0');
                } else {
                    panel.classList.remove('gap-0');
                    panel.classList.add('gap-4');
                }
            };
        }
    }

    _bindDustControls() {
        const s = this.scene;

        const updateDustUIState = () => {
            const enabled = s.dustEnabled;
            const isEverywhere = s.dustDistribution === 'everywhere';
            
            const elCount = document.getElementById('dust-count-container');
            const elSize = document.getElementById('dust-size-container');
            const elDist = document.getElementById('dust-dist-container');
            const elEdge = document.getElementById('dust-edge-container');

            if (elCount) { elCount.style.opacity = enabled ? '1' : '0.4'; elCount.style.pointerEvents = enabled ? 'auto' : 'none'; }
            if (elSize) { elSize.style.opacity = enabled ? '1' : '0.4'; elSize.style.pointerEvents = enabled ? 'auto' : 'none'; }
            if (elDist) { elDist.style.opacity = enabled ? '1' : '0.4'; elDist.style.pointerEvents = enabled ? 'auto' : 'none'; }
            
            const showEdge = enabled && !isEverywhere;
            if (elEdge) { elEdge.style.opacity = showEdge ? '1' : '0.4'; elEdge.style.pointerEvents = showEdge ? 'auto' : 'none'; }
        };

        s.updateDustUIState = updateDustUIState;

        const dustToggle = document.getElementById('dust-toggle');
        if (dustToggle) {
            dustToggle.checked = s.dustEnabled;
            dustToggle.onchange = (e) => {
                s.dustEnabled = e.target.checked;
                localStorage.setItem('jellycats_dust_enabled', s.dustEnabled.toString());
                updateDustUIState();
                s.dustSystem.createParticles();
                s.autosaveActiveProfile();
            };
        }

        this._bindRangeSlider('dust-count-slider', 'dust-count-label', s.dustCount,
            (val) => `${val}`,
            (val) => { s.dustCount = parseInt(val); localStorage.setItem('jellycats_dust_count', val); s.dustSystem.createParticles(); s.autosaveActiveProfile(); });

        this._bindRangeSlider('dust-size-slider', 'dust-size-label', s.dustScale,
            (val) => `${Math.round(val * 100)}%`,
            (val) => { s.dustScale = parseFloat(val); localStorage.setItem('jellycats_dust_scale', val); s.dustSystem.createParticles(); s.autosaveActiveProfile(); });

        const dustDistSelect = document.getElementById('dust-dist-select');
        if (dustDistSelect) {
            dustDistSelect.value = s.dustDistribution;
            dustDistSelect.onchange = (e) => {
                s.dustDistribution = e.target.value;
                localStorage.setItem('jellycats_dust_distribution', s.dustDistribution);
                updateDustUIState();
                s.dustSystem.createParticles();
                s.autosaveActiveProfile();
            };
        }

        this._bindRangeSlider('dust-edge-slider', 'dust-edge-label', Math.round(s.dustEdgeRatio * 100),
            (val) => `${val}%`,
            (val) => { s.dustEdgeRatio = parseInt(val) / 100; localStorage.setItem('jellycats_dust_edge_ratio', s.dustEdgeRatio.toString()); s.dustSystem.createParticles(); s.autosaveActiveProfile(); });

        updateDustUIState();
    }

    _bindShadowControls() {
        const s = this.scene;
        const shadowOpacityContainer = document.getElementById('shadow-opacity-container');

        const updateShadowUIState = () => {
            const enabled = s.shadowEnabled;
            if (shadowOpacityContainer) {
                shadowOpacityContainer.style.opacity = enabled ? '1' : '0.4';
                shadowOpacityContainer.style.pointerEvents = enabled ? 'auto' : 'none';
            }
        };

        s.updateShadowUIState = updateShadowUIState;

        const shadowToggle = document.getElementById('shadow-toggle');
        if (shadowToggle) {
            shadowToggle.checked = s.shadowEnabled;
            shadowToggle.onchange = (e) => {
                s.shadowEnabled = e.target.checked;
                localStorage.setItem('jellycats_shadow_enabled', s.shadowEnabled.toString());
                updateShadowUIState();
                s.autosaveActiveProfile();
            };
        }

        const shadowOpacitySlider = document.getElementById('shadow-opacity-slider');
        const shadowOpacityLabel = document.getElementById('shadow-opacity-value-label');
        if (shadowOpacitySlider && shadowOpacityLabel) {
            shadowOpacitySlider.value = Math.round(s.shadowOpacity * 100);
            shadowOpacityLabel.textContent = `${Math.round(s.shadowOpacity * 100)}%`;
            shadowOpacitySlider.oninput = (e) => {
                const val = parseInt(e.target.value);
                s.shadowOpacity = val / 100;
                shadowOpacityLabel.textContent = `${val}%`;
                localStorage.setItem('jellycats_shadow_opacity', s.shadowOpacity.toString());
                s.autosaveActiveProfile();
            };
        }

        updateShadowUIState();
    }

    _bindSleepZControls() {
        const s = this.scene;
        const sleepZSizeContainer = document.getElementById('sleep-z-size-container');
        const sleepZOpacityContainer = document.getElementById('sleep-z-opacity-container');

        const updateSleepZUIState = () => {
            const enabled = s.sleepZEnabled !== false;
            [sleepZSizeContainer, sleepZOpacityContainer].forEach(container => {
                if (!container) return;
                container.style.opacity = enabled ? '1' : '0.4';
                container.style.pointerEvents = enabled ? 'auto' : 'none';
            });
        };

        s.updateSleepZUIState = updateSleepZUIState;

        const sleepZToggle = document.getElementById('sleep-z-toggle');
        if (sleepZToggle) {
            sleepZToggle.checked = s.sleepZEnabled !== false;
            sleepZToggle.onchange = (e) => {
                s.sleepZEnabled = e.target.checked;
                localStorage.setItem('jellycats_sleep_z_enabled', s.sleepZEnabled.toString());
                if (!s.sleepZEnabled && s.dustSystem && s.dustSystem.clearZParticles) s.dustSystem.clearZParticles();
                updateSleepZUIState();
                s.autosaveActiveProfile();
            };
        }

        this._bindRangeSlider('sleep-z-size-slider', 'sleep-z-size-label', s.sleepZScale,
            (val) => `${Math.round(parseFloat(val) * 100)}%`,
            (val) => {
                s.sleepZScale = parseFloat(val);
                localStorage.setItem('jellycats_sleep_z_scale', s.sleepZScale.toString());
                s.autosaveActiveProfile();
            });

        this._bindRangeSlider('sleep-z-opacity-slider', 'sleep-z-opacity-label', Math.round(s.sleepZOpacity * 100),
            (val) => `${val}%`,
            (val) => {
                s.sleepZOpacity = parseInt(val, 10) / 100;
                localStorage.setItem('jellycats_sleep_z_opacity', s.sleepZOpacity.toString());
                s.autosaveActiveProfile();
            });

        updateSleepZUIState();
    }

    _bindResetButton() {
        const btnReset = document.getElementById('btn-zoom-reset');
        if (btnReset) {
            btnReset.onclick = () => {
                if (!window.confirm('Вы уверены, что хотите сбросить настройки отображения?')) {
                    return;
                }
                const profileSelect = document.getElementById('profile-select');
                if (profileSelect) {
                    profileSelect.value = 'default';
                    profileSelect.onchange();
                }
            };
        }
    }

    // --- Helper methods ---

    _loadBoardRowScales() {
        const defaults = typeof DEFAULT_BOARD_ROW_SCALES !== 'undefined'
            ? DEFAULT_BOARD_ROW_SCALES
            : { 4: 1.4, 5: 1.25, 6: 1.15, 7: 1.07, 8: 1.0 };
        let saved = {};
        try {
            saved = JSON.parse(localStorage.getItem('jellycats_board_row_scales') || '{}');
        } catch (e) {
            saved = {};
        }
        return [4, 5, 6, 7, 8].reduce((result, rows) => {
            const value = parseFloat(saved[rows]);
            result[rows] = Number.isFinite(value) ? value : defaults[rows];
            return result;
        }, {});
    }

    _saveBoardRowScales() {
        localStorage.setItem('jellycats_board_row_scales', JSON.stringify(this.scene.boardRowScales));
    }

    _bindBoardRowScaleSliders() {
        const s = this.scene;
        [4, 5, 6, 7, 8].forEach((rows) => {
            this._bindRangeSlider(`board-row-scale-${rows}-slider`, `board-row-scale-${rows}-value-label`, s.boardRowScales[rows],
                (val) => `${Math.round(parseFloat(val) * 100)}%`,
                (val) => {
                    s.boardRowScales[rows] = parseFloat(val);
                    this._saveBoardRowScales();
                    s.updateLayout();
                    s.autosaveActiveProfile();
                });
        });
    }

    _bindSelect(selectId, initialValue, onChange) {
        const el = document.getElementById(selectId);
        if (el) {
            el.value = initialValue;
            const handleChange = (e) => onChange(e.target.value);
            el.onchange = handleChange;
            el.oninput = handleChange;
        }
    }

    _bindButton(btnId, onClick) {
        const el = document.getElementById(btnId);
        if (el) el.onclick = onClick;
    }

    _bindRangeSlider(sliderId, labelId, initialValue, formatLabel, onChange, skipAutoProfile) {
        const slider = document.getElementById(sliderId);
        const label = document.getElementById(labelId);
        if (slider && label) {
            slider.value = initialValue;
            label.textContent = formatLabel(initialValue);
            slider.oninput = (e) => {
                label.textContent = formatLabel(e.target.value);
                onChange(e.target.value);
            };
        }
    }

    _bindVolumeSlider(sliderId, labelId, propName, storageKey, defaultValue = 0.8) {
        const s = this.scene;
        const slider = document.getElementById(sliderId);
        const label = document.getElementById(labelId);
        if (slider) {
            slider.value = Math.round((s[propName] !== undefined ? s[propName] : defaultValue) * 100);
            if (label) label.textContent = `${slider.value}%`;
            slider.oninput = (e) => {
                const val = parseInt(e.target.value) / 100;
                s[propName] = val;
                if (label) label.textContent = `${e.target.value}%`;
                localStorage.setItem(storageKey, val.toString());
                s.autosaveActiveProfile();
            };
        }
    }
}
