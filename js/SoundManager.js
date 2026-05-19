/**
 * SoundManager — manages all game audio playback and volume settings.
 * Properties like sfxVolume, soundPitchRange etc. live on the scene for easy access from SettingsUI.
 */
class SoundManager {
    constructor(scene) {
        this.scene = scene;
    }

    static getHintSounds() {
        return [
            'SFX_Pop_Mouth_Low_1',
            'SFX_Pop_Bubble_Single_2',
            'SFX_Pop_Bubble_Single_1',
            'SFX_Player_Collect_Pop_3',
            'SFX_Match_Bright_1',
            'SFX_Pop_Mouth_Med_1',
            'SFX_Pop_Mouth_Low_3',
            'SFX_Pop_Mouth_Low_2',
            'SFX_UI_Button_Click_Generic_1',
            'SFX_UI_Button_Click_Generic_2',
            'SFX_UI_Notification_Popup_1',
            'SFX_UI_Notification_Popup_2'
        ];
    }

    static getUiClickSounds() {
        return [
            'SFX_UI_Button_Click_Generic_1',
            'SFX_UI_Button_Click_Select_2',
            'SFX_UI_Button_Click_Settings_Switch_1'
        ];
    }

    /**
     * Load all audio assets. Called from GameScene.preload().
     */
    preloadSounds() {
        const scene = this.scene;

        // Load sounds (only the ones that actually exist in assets/sounds)
        const availableSoundNums = [3, 4, 5];
        availableSoundNums.forEach(num => {
            scene.load.audio(`twit${num}`, `assets/sounds/twit${num}.wav`);
        });

        // Load rotation sounds
        const rotationSounds = [
            'SFX_Movement_Swoosh_Fast_1',
            'SFX_Movement_Swoosh_Fast_2',
            'SFX_Movement_Swoosh_Fast_3',
            'SFX_Movement_Swoosh_Med_1',
            'SFX_Movement_Swoosh_Med_2',
            'SFX_Movement_Swoosh_Med_3'
        ];
        rotationSounds.forEach(soundName => {
            scene.load.audio(soundName, `assets/sounds/${soundName}.wav`);
        });

        // Load placement sounds
        const putSounds = [
            'card-place-1',
            'card-place-2',
            'card-slide-1',
            'card-slide-6',
            'click1',
            'click2',
            'click3'
        ];
        putSounds.forEach(soundName => {
            scene.load.audio(soundName, `assets/sounds/put/${soundName}.ogg`);
        });

        // Load background music
        scene.load.audio('bg_music', 'assets/music/main_theme.ogg');

        // Load win sounds
        const winSounds = [
            { key: 'win_achievement_pop', file: 'SFX_UI_Success_Achievement_Pop_1.wav' },
            { key: 'win_marimba', file: 'floraphonic-marimba-win-f-2-209688.mp3' },
            { key: 'win_levelup_05', file: 'universfield-level-up-05-326133.mp3' },
            { key: 'synth_win_01_cute_arpeggio', file: 'synth_win_01_cute_arpeggio.wav' },
            { key: 'synth_win_02_magic_sparkle', file: 'synth_win_02_magic_sparkle.wav' },
            { key: 'synth_win_03_rising_chords', file: 'synth_win_03_rising_chords.wav' },
            { key: 'synth_win_04_retro_level_up', file: 'synth_win_04_retro_level_up.wav' },
            { key: 'synth_win_05_happy_melody', file: 'synth_win_05_happy_melody.wav' },
            { key: 'synth_win_06_cosmic_success', file: 'synth_win_06_cosmic_success.wav' },
            { key: 'synth_win_07_triumphant_fanfare', file: 'synth_win_07_triumphant_fanfare.wav' },
            { key: 'synth_win_08_gentle_bell', file: 'synth_win_08_gentle_bell.wav' },
            { key: 'synth_win_09_sparkling_cascade', file: 'synth_win_09_sparkling_cascade.wav' },
            { key: 'synth_win_10_jelly_bounce', file: 'synth_win_10_jelly_bounce.wav' }
        ];
        winSounds.forEach(sound => {
            scene.load.audio(sound.key, `assets/sounds/win/${sound.file}`);
        });

        SoundManager.getHintSounds().forEach(soundName => {
            scene.load.audio(soundName, `assets/sounds/hint/${soundName}.wav`);
        });

        SoundManager.getUiClickSounds().forEach(soundName => {
            scene.load.audio(soundName, `assets/sounds/click/${soundName}.wav`);
        });
    }

    /**
     * Initialize volume and sound selection properties on the scene. Called from GameScene.create().
     */
    initDefaults() {
        const scene = this.scene;
        scene.sfxVolume = parseFloat(localStorage.getItem('jellycats_sfx_volume') || '0.8');
        scene.meowVolume = parseFloat(localStorage.getItem('jellycats_meow_volume') || '0.8');
        scene.swooshVolume = parseFloat(localStorage.getItem('jellycats_swoosh_volume') || '0.6');
        scene.putVolume = parseFloat(localStorage.getItem('jellycats_put_volume') || '0.25');
        scene.returnVolume = parseFloat(localStorage.getItem('jellycats_return_volume') || '0.8');
        scene.winVolume = parseFloat(localStorage.getItem('jellycats_win_volume') || '0.5');
        scene.uiClickVolume = parseFloat(localStorage.getItem('jellycats_ui_click_volume') || '0.8');
        scene.selectedPlacementSound = localStorage.getItem('jellycats_selected_placement_sound') || 'click3';
        scene.selectedReturnSound = localStorage.getItem('jellycats_selected_return_sound') || 'SFX_Movement_Swoosh_Med_1';
        scene.selectedWinSound = localStorage.getItem('jellycats_selected_win_sound') || 'win_levelup_05';
        scene.selectedHintSound = localStorage.getItem('jellycats_selected_hint_sound') || 'SFX_UI_Notification_Popup_1';
        scene.selectedUiClickSound = localStorage.getItem('jellycats_selected_ui_click_sound') || 'SFX_UI_Button_Click_Generic_1';
        scene.bgMusicVolume = parseFloat(localStorage.getItem('jellycats_bg_music_volume') || '0.6');
        scene.playerMusicVolume = parseFloat(localStorage.getItem('jellycats_player_music_volume') || '1');
        scene.playerSfxVolume = parseFloat(localStorage.getItem('jellycats_player_sfx_volume') || '1');
    }

    /**
     * Start background music. Called from GameScene.create().
     */
    startBackgroundMusic() {
        const scene = this.scene;
        try {
            scene.bgMusic = scene.sound.add('bg_music', { loop: true, volume: this.getMusicVolume() });
            scene.bgMusic.play();
        } catch (e) {
            console.warn('Failed to initialize background music:', e);
        }
    }

    _getPitchRate() {
        const scene = this.scene;
        let rateVal = 1.0;
        if (scene.soundPitchRange && scene.soundPitchRange > 0) {
            rateVal = Phaser.Math.FloatBetween(1.0 - scene.soundPitchRange, 1.0 + scene.soundPitchRange);
        }
        return rateVal;
    }

    getMusicVolume() {
        const scene = this.scene;
        const base = scene.bgMusicVolume !== undefined ? scene.bgMusicVolume : 0.6;
        const player = scene.playerMusicVolume !== undefined ? scene.playerMusicVolume : 1;
        return Phaser.Math.Clamp(base * player, 0, 1);
    }

    getSfxVolume(baseVolume) {
        const scene = this.scene;
        const player = scene.playerSfxVolume !== undefined ? scene.playerSfxVolume : 1;
        return Phaser.Math.Clamp(baseVolume * player, 0, 1);
    }

    applyMusicVolume() {
        const scene = this.scene;
        if (scene.bgMusic) scene.bgMusic.setVolume(this.getMusicVolume());
    }

    playMeow() {
        const scene = this.scene;
        try {
            const availableSoundNums = [3, 4, 5];
            const randomSoundNum = Phaser.Utils.Array.GetRandom(availableSoundNums);
            const soundKey = `twit${randomSoundNum}`;
            
            if (scene.cache.audio.exists(soundKey)) {
                const baseVolume = (scene.sfxVolume !== undefined ? scene.sfxVolume : 0.8) * (scene.meowVolume !== undefined ? scene.meowVolume : 0.8);
                const finalVolume = this.getSfxVolume(baseVolume);
                scene.sound.play(soundKey, { rate: this._getPitchRate(), volume: finalVolume });
            }
        } catch (e) {
            console.warn('Failed to play meow sound:', e);
        }
    }

    playRotation() {
        const scene = this.scene;
        try {
            const soundKey = scene.selectedRotationSound || 'SFX_Movement_Swoosh_Fast_1';
            
            // Stop any playing meow/purr sounds to prevent overlap when rotating
            const availableSoundNums = [3, 4, 5];
            availableSoundNums.forEach(num => {
                scene.sound.stopByKey(`twit${num}`);
            });
            
            if (scene.cache.audio.exists(soundKey)) {
                const baseVolume = (scene.sfxVolume !== undefined ? scene.sfxVolume : 0.8) * (scene.swooshVolume !== undefined ? scene.swooshVolume : 0.8);
                const finalVolume = this.getSfxVolume(baseVolume);
                scene.sound.play(soundKey, { rate: this._getPitchRate(), volume: finalVolume });
            }
        } catch (e) {
            console.warn('Failed to play rotation sound:', e);
        }
    }

    playPlacement() {
        const scene = this.scene;
        try {
            const soundKey = scene.selectedPlacementSound || 'card-place-1';
            
            if (scene.cache.audio.exists(soundKey)) {
                const baseVolume = (scene.sfxVolume !== undefined ? scene.sfxVolume : 0.8) * (scene.putVolume !== undefined ? scene.putVolume : 0.8);
                const finalVolume = this.getSfxVolume(baseVolume);
                scene.sound.play(soundKey, { rate: this._getPitchRate(), volume: finalVolume });
            }
        } catch (e) {
            console.warn('Failed to play placement sound:', e);
        }
    }

    playReturn() {
        const scene = this.scene;
        try {
            const soundKey = scene.selectedReturnSound || 'SFX_Movement_Swoosh_Fast_1';
            
            if (scene.cache.audio.exists(soundKey)) {
                const baseVolume = (scene.sfxVolume !== undefined ? scene.sfxVolume : 0.8) * (scene.returnVolume !== undefined ? scene.returnVolume : 0.8);
                const finalVolume = this.getSfxVolume(baseVolume);
                scene.sound.play(soundKey, { rate: this._getPitchRate(), volume: finalVolume });
            }
        } catch (e) {
            console.warn('Failed to play return sound:', e);
        }
    }

    playWin() {
        const scene = this.scene;
        try {
            const soundKey = scene.selectedWinSound || 'win_achievement_pop';
            
            if (scene.cache.audio.exists(soundKey)) {
                const baseVolume = (scene.sfxVolume !== undefined ? scene.sfxVolume : 0.8) * (scene.winVolume !== undefined ? scene.winVolume : 0.8);
                const finalVolume = this.getSfxVolume(baseVolume);
                scene.sound.play(soundKey, { rate: 1.0, volume: finalVolume });
            }
        } catch (e) {
            console.warn('Failed to play win sound:', e);
        }
    }

    playHint() {
        const scene = this.scene;
        try {
            const soundKey = scene.selectedHintSound || 'SFX_UI_Notification_Popup_1';

            if (scene.cache.audio.exists(soundKey)) {
                const baseVolume = scene.sfxVolume !== undefined ? scene.sfxVolume : 0.8;
                const finalVolume = this.getSfxVolume(baseVolume);
                scene.sound.play(soundKey, { rate: this._getPitchRate(), volume: finalVolume });
            }
        } catch (e) {
            console.warn('Failed to play hint sound:', e);
        }
    }

    playUiClick() {
        const scene = this.scene;
        try {
            const soundKey = scene.selectedUiClickSound || 'SFX_UI_Button_Click_Generic_1';

            if (scene.cache.audio.exists(soundKey)) {
                const baseVolume = (scene.sfxVolume !== undefined ? scene.sfxVolume : 0.8) * (scene.uiClickVolume !== undefined ? scene.uiClickVolume : 0.8);
                const finalVolume = this.getSfxVolume(baseVolume);
                scene.sound.play(soundKey, { rate: 1.0, volume: finalVolume });
            }
        } catch (e) {
            console.warn('Failed to play UI click sound:', e);
        }
    }

    bindUiClickEvents() {
        const scene = this.scene;
        if (scene.uiClickSoundsBound) return;
        scene.uiClickSoundsBound = true;

        const shouldPlayFor = (target) => {
            if (!target || !target.closest) return false;
            const element = target.closest('button');
            if (!element || element.disabled) return false;
            if (element.id === 'btn-play-ui-click-sound') return false;
            if (element.closest('#game-container')) return false;
            return true;
        };

        document.addEventListener('click', (event) => {
            if (shouldPlayFor(event.target)) this.playUiClick();
        }, true);

        document.addEventListener('change', (event) => {
            if (!event.target || !event.target.closest) return;
            const element = event.target.closest('select, input[type="checkbox"], input[type="radio"], input[type="color"]');
            if (element && !element.disabled && !element.closest('#game-container')) this.playUiClick();
        }, true);
    }
}
