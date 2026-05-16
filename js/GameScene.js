        class GameScene extends Phaser.Scene {
            constructor() {
                super('GameScene');
                // Логическая сетка
                this.activeGridCols = GRID_COLS;
                this.activeGridRows = typeof DEFAULT_GRID_ROWS !== 'undefined' ? DEFAULT_GRID_ROWS : GRID_ROWS;
                this.currentLevel = null;
                this.currentSavedLevelId = null;
                this.levelManager = new LevelManager();
                this.obstacles = [];
                this.holes = [];
                this.victoryJumpMode = 'sequential';
                this.obstacleSprites = [];
                this.obstacleVisualMode = localStorage.getItem('jellycats_obstacle_visual_mode') || 'soft-pad';
                this.obstacleAssetSet = localStorage.getItem('jellycats_obstacle_asset_set') || 'current';
                this.obstacleXOffset = parseInt(localStorage.getItem('jellycats_obstacle_x_offset') || '0', 10);
                this.obstacleYOffset = parseInt(localStorage.getItem('jellycats_obstacle_y_offset') || '0', 10);
                this.obstacleScalePercent = parseInt(localStorage.getItem('jellycats_obstacle_scale') || '100', 10);
                this.obstaclesAboveCats = localStorage.getItem('jellycats_obstacles_above_cats') === 'true';
                this.obstacleShadowSettings = this.loadObstacleShadowSettings();
                this.grid = this.createEmptyGrid();
                this.pieces = [];
                this.ghosts = [];
                this.previewGridCells = []; // Список подсвечиваемых при перетаскивании ячеек предпросмотра
                this.jellyMultiplier = 1.0; // По умолчанию нормальный уровень желейности
                this.jellyStiffness = 0.35; // Жесткость пружины по умолчанию
                this.jellyDamping = 0.55;   // Затухание пружины по умолчанию
            }

            preload() {
                // Генерируем текстуры программно
                this.generateTextures();

                // Load PNG cat images
                PIECE_DEFS.forEach(def => {
                    this.load.image(def.id, def.imagePath || `assets/cats/${def.id}.png`);
                });

                // Load room background image
                this.load.image('room_background', 'assets/room-rug-background.png');
                this.load.image('rug_square', 'assets/rug-square.png');
                for (let i = 1; i <= 15; i++) {
                    const suffix = String(i).padStart(2, '0');
                    this.load.image(`obstacle_plant_${suffix}`, `assets/obstacles/icon_${suffix}.png`);
                }
                for (let i = 1; i <= 2; i++) {
                    const suffix = String(i).padStart(2, '0');
                    this.load.image(`obstacle_topdown_${suffix}`, `assets/obstacles/topdown_${suffix}.png`);
                }
                for (let i = 1; i <= 4; i++) {
                    const suffix = String(i).padStart(2, '0');
                    this.load.image(`obstacle_imagegen_${suffix}`, `assets/obstacles/imagegen_topdown_${suffix}.png`);
                }

                // Load sounds (only the ones that actually exist in assets/sounds)
                const availableSoundNums = [3, 4, 5];
                availableSoundNums.forEach(num => {
                    this.load.audio(`twit${num}`, `assets/sounds/twit${num}.wav`);
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
                    this.load.audio(soundName, `assets/sounds/${soundName}.wav`);
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
                    this.load.audio(soundName, `assets/sounds/put/${soundName}.ogg`);
                });

                // Load background music
                this.load.audio('bg_music', 'assets/music/main_theme.ogg');

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
                    this.load.audio(sound.key, `assets/sounds/win/${sound.file}`);
                });

            }

            create() {
                // Добавляем фоновое изображение комнаты на задний план
                this.bgImage = this.add.image(0, 0, 'room_background');
                this.bgImage.setOrigin(0.5, 0.5);
                this.bgImage.setDepth(-10);

                // Фон
                this.cameras.main.setBackgroundColor('#f4ede4');
                
                this.rugGraphic = this.add.graphics();
                this.rugGraphic.setDepth(-4);

                this.rugImage = this.add.image(0, 0, 'rug_square');
                this.rugImage.setOrigin(0.5, 0.5);
                this.rugImage.setDepth(-3.9);

                this.rugNineSlice = this.add.container(0, 0);
                this.rugNineSlice.setDepth(-3.9);
                this.rugNineSlice.setVisible(false);
                this.rugNineSlicePieces = null;

                // Графика поля (ковер)
                this.boardGraphic = this.add.graphics();
                this.boardGraphic.setDepth(-2);
                
                // Создаем игровые объекты
                this.createPieces();

                // Настраиваем события перетаскивания
                this.setupInput();

                // Первичная раскладка
                this.updateLayout();

                // Слушаем изменение размера окна
                this.scale.on('resize', this.updateLayout, this);

                // Привязка UI кнопок
                document.getElementById('btn-restart').onclick = () => this.restartLevel();
                document.getElementById('btn-next').onclick = () => this.loadNextSavedLevel();
                this.setupLevelQuickNav();

                this.soundManager = new SoundManager(this);
                this.dustSystem = new DustSystem(this);
                this.victoryEffects = new VictoryEffects(this);
                
                // Initialize UI and Managers
                this.settingsUI = new SettingsUI(this);
                this.settingsUI.init();
                
                this.profileManager = new ProfileManager(this);
                this.profileManager.init();
                
                this.editorPanel = new EditorPanel(this);
                this.editorPanel.init();

                this.levelFactoryPanel = new LevelFactoryPanel(this);
                this.levelFactoryPanel.init();
                
                // Setup sounds and background music
                this.soundManager.initDefaults();
                this.soundManager.startBackgroundMusic();
                
                // Finalize initial state
                this.updateBlocksVisibility();
                this.dustSystem.createParticles();
            }

            autosaveActiveProfile() {
                if (this.profileManager) {
                    this.profileManager.autosave();
                }
            }

            setupLevelQuickNav() {
                this.quickNav = {
                    prev: document.getElementById('btn-level-prev-saved'),
                    next: document.getElementById('btn-level-next-saved'),
                    counter: document.getElementById('level-quick-nav-counter')
                };
                if (this.quickNav.prev) this.quickNav.prev.onclick = () => this.navigateSavedLevel('previous');
                if (this.quickNav.next) this.quickNav.next.onclick = () => this.navigateSavedLevel('next');
                this.updateLevelQuickNav();
            }

            updateLevelQuickNav() {
                if (!this.quickNav) return;
                const levels = this.levelManager.getLevels();
                const activeId = this.getCurrentSavedLevelId(levels);
                const index = levels.findIndex(level => level.id === activeId);
                const hasLevels = levels.length > 0;
                if (this.quickNav.prev) this.quickNav.prev.disabled = !hasLevels;
                if (this.quickNav.next) this.quickNav.next.disabled = !hasLevels;
                if (this.quickNav.counter) this.quickNav.counter.textContent = `${index >= 0 ? index + 1 : 0} / ${levels.length}`;
            }

            navigateSavedLevel(direction) {
                const currentId = this.getCurrentSavedLevelId();
                const level = direction === 'previous'
                    ? this.levelManager.getPreviousLevel(currentId)
                    : this.levelManager.getNextLevel(currentId);
                if (!level) return;
                this.dismissWinModal();
                this.loadLevel(level, false);
                if (this.levelFactoryPanel) {
                    this.levelFactoryPanel.activeCandidateIndex = -1;
                    this.levelFactoryPanel.renderCandidates();
                    this.levelFactoryPanel.renderSavedLevels();
                    this.levelFactoryPanel.updateHeartButton(level);
                }
            }

            loadNextSavedLevel() {
                const level = this.levelManager.getNextLevel(this.getCurrentSavedLevelId());
                if (!level) {
                    this.restartLevel();
                    return;
                }
                this.dismissWinModal();
                this.loadLevel(level, false);
                if (this.levelFactoryPanel) {
                    this.levelFactoryPanel.activeCandidateIndex = -1;
                    this.levelFactoryPanel.renderCandidates();
                }
            }

            getCurrentSavedLevelId(levels = this.levelManager.getLevels()) {
                if (!this.currentLevel) return null;
                if (this.currentSavedLevelId && levels.some(level => level.id === this.currentSavedLevelId)) {
                    return this.currentSavedLevelId;
                }
                const matching = this.levelManager.findMatchingLevel(this.currentLevel, levels);
                return matching ? matching.id : this.currentLevel.id;
            }

            rememberCurrentSavedLevel(level, levels = this.levelManager.getLevels()) {
                if (!level) {
                    this.currentSavedLevelId = null;
                    return null;
                }
                const matching = this.levelManager.findMatchingLevel(level, levels);
                this.currentSavedLevelId = matching
                    ? matching.id
                    : (level.id && levels.some(saved => saved.id === level.id) ? level.id : null);
                return this.currentSavedLevelId;
            }

            dismissWinModal() {
                const ui = document.getElementById('ui-layer');
                const modal = document.getElementById('win-modal');
                if (!ui || !modal) return;
                ui.classList.remove('fade-in');
                modal.classList.remove('scale-in');
                setTimeout(() => {
                    ui.classList.add('opacity-0', 'invisible');
                    modal.classList.add('scale-90');
                }, 10);
            }

            createEmptyGrid() {
                const grid = Array(this.activeGridRows).fill(null).map(() => Array(this.activeGridCols).fill(null));
                (this.holes || []).forEach(hole => {
                    if (hole.x >= 0 && hole.x < this.activeGridCols && hole.y >= 0 && hole.y < this.activeGridRows) {
                        grid[hole.y][hole.x] = '__hole__';
                    }
                });
                (this.obstacles || []).forEach(obstacle => {
                    if (obstacle.x >= 0 && obstacle.x < this.activeGridCols && obstacle.y >= 0 && obstacle.y < this.activeGridRows) {
                        grid[obstacle.y][obstacle.x] = '__obstacle__';
                    }
                });
                return grid;
            }

            loadLevel(level, showSolved = false) {
                if (this.victoryEffects) this.victoryEffects.cleanup();
                this.currentLevel = level;
                this.rememberCurrentSavedLevel(level);
                this.activeGridCols = Math.min(GRID_COLS, Math.max(1, level.grid.cols));
                this.activeGridRows = Math.min(GRID_ROWS, Math.max(1, level.grid.rows));
                this.obstacles = Array.isArray(level.obstacles) ? level.obstacles : [];
                this.holes = Array.isArray(level.holes) ? level.holes : [];
                this.pendingSolvedPreview = showSolved;
                this.rebuildPiecesFromDefs(null, () => {
                    if (showSolved) this.applySolvedPreview(level);
                });
                this.updateLevelQuickNav();
                if (this.levelFactoryPanel) {
                    this.levelFactoryPanel.renderSavedLevels();
                    this.levelFactoryPanel.updateHeartButton(level);
                }
            }

            clearLevel() {
                if (this.victoryEffects) this.victoryEffects.cleanup();
                this.currentLevel = null;
                this.currentSavedLevelId = null;
                this.activeGridCols = GRID_COLS;
                this.activeGridRows = typeof DEFAULT_GRID_ROWS !== 'undefined' ? DEFAULT_GRID_ROWS : GRID_ROWS;
                this.obstacles = [];
                this.holes = [];
                this.rebuildPiecesFromDefs();
                this.updateLevelQuickNav();
            }

            clearObstacleSprites() {
                (this.obstacleSprites || []).forEach(sprite => sprite.destroy());
                this.obstacleSprites = [];
            }

            loadObstacleShadowSettings() {
                return {
                    angle: parseInt(localStorage.getItem('jellycats_obstacle_shadow_angle') || '135', 10),
                    distance: parseInt(localStorage.getItem('jellycats_obstacle_shadow_distance') || '14', 10),
                    opacity: parseInt(localStorage.getItem('jellycats_obstacle_shadow_opacity') || '24', 10),
                    size: parseInt(localStorage.getItem('jellycats_obstacle_shadow_size') || '78', 10)
                };
            }

            setObstacleShadowSettings(settings) {
                this.obstacleShadowSettings = { ...this.obstacleShadowSettings, ...settings };
                localStorage.setItem('jellycats_obstacle_shadow_angle', this.obstacleShadowSettings.angle);
                localStorage.setItem('jellycats_obstacle_shadow_distance', this.obstacleShadowSettings.distance);
                localStorage.setItem('jellycats_obstacle_shadow_opacity', this.obstacleShadowSettings.opacity);
                localStorage.setItem('jellycats_obstacle_shadow_size', this.obstacleShadowSettings.size);
                this.renderObstacleSprites();
            }

            renderObstacleSprites() {
                this.clearObstacleSprites();
                if (!this.obstacles || this.obstacles.length === 0) return;
                const mode = this.getObstacleVisualMode();
                const shadow = this.obstacleShadowSettings || this.loadObstacleShadowSettings();

                this.obstacles.forEach((obstacle, index) => {
                    if (obstacle.x < 0 || obstacle.x >= this.activeGridCols || obstacle.y < 0 || obstacle.y >= this.activeGridRows) return;
                    const textureKey = obstacle.assetKey || this.getObstacleTextureKey(obstacle, index);
                    if (!this.textures.exists(textureKey)) return;
                    const centerX = this.boardX + obstacle.x * this.cs + this.cs / 2;
                    const centerY = this.boardY + obstacle.y * this.cs + this.cs / 2;
                    const depthBase = this.obstaclesAboveCats ? 30 : -1;
                    const plantDepth = depthBase + obstacle.y * 0.1 + obstacle.x * 0.001;
                    const shadowDepth = plantDepth - 0.05;
                    if (shadow.opacity > 0 && shadow.size > 0) {
                        const radians = Phaser.Math.DegToRad(shadow.angle);
                        const dx = Math.cos(radians) * shadow.distance;
                        const dy = Math.sin(radians) * shadow.distance;
                        const shadowGraphic = this.add.graphics();
                        shadowGraphic.setDepth(shadowDepth);
                        shadowGraphic.fillStyle(0x3c1f18, shadow.opacity / 100);
                        shadowGraphic.fillEllipse(
                            centerX + this.obstacleXOffset + dx,
                            centerY + this.obstacleYOffset + dy + this.cs * 0.18,
                            this.cs * (shadow.size / 100),
                            this.cs * (shadow.size / 100) * 0.38
                        );
                        this.obstacleSprites.push(shadowGraphic);
                    }

                    const sprite = this.add.image(
                        centerX + this.obstacleXOffset,
                        centerY + this.obstacleYOffset,
                        textureKey
                    );
                    sprite.setDepth(plantDepth);
                    sprite.setOrigin(0.5, mode === 'plant-only' ? 0.55 : 0.58);
                    const sizeRatio = mode === 'plant-only' ? 1.08 : mode === 'muted-cell' ? 0.72 : 0.9;
                    const maxSize = this.cs * sizeRatio * (this.obstacleScalePercent / 100);
                    const scale = Math.min(maxSize / sprite.width, maxSize / sprite.height);
                    sprite.setScale(scale);
                    this.obstacleSprites.push(sprite);
                });
            }

            setObstacleVisualMode(mode) {
                this.obstacleVisualMode = mode || 'soft-pad';
                localStorage.setItem('jellycats_obstacle_visual_mode', this.obstacleVisualMode);
                this.drawBoard();
                this.renderObstacleSprites();
            }

            setObstacleAssetSet(assetSet) {
                this.obstacleAssetSet = assetSet || 'current';
                localStorage.setItem('jellycats_obstacle_asset_set', this.obstacleAssetSet);
                this.renderObstacleSprites();
            }

            setObstacleXOffset(offset) {
                this.obstacleXOffset = parseInt(offset || 0, 10);
                localStorage.setItem('jellycats_obstacle_x_offset', this.obstacleXOffset);
                this.renderObstacleSprites();
            }

            setObstacleYOffset(offset) {
                this.obstacleYOffset = parseInt(offset || 0, 10);
                localStorage.setItem('jellycats_obstacle_y_offset', this.obstacleYOffset);
                this.renderObstacleSprites();
            }

            setObstacleScalePercent(scalePercent) {
                this.obstacleScalePercent = parseInt(scalePercent || 100, 10);
                localStorage.setItem('jellycats_obstacle_scale', this.obstacleScalePercent);
                this.renderObstacleSprites();
            }

            setObstaclesAboveCats(isAbove) {
                this.obstaclesAboveCats = !!isAbove;
                localStorage.setItem('jellycats_obstacles_above_cats', this.obstaclesAboveCats.toString());
                this.renderObstacleSprites();
            }

            getObstacleVisualMode() {
                const select = document.getElementById('level-obstacle-visual');
                if (select && select.value && select.value !== this.obstacleVisualMode) {
                    this.obstacleVisualMode = select.value;
                }
                return this.obstacleVisualMode || 'soft-pad';
            }

            getObstacleTextureKey(obstacle, index) {
                const levelId = this.currentLevel && this.currentLevel.id ? this.currentLevel.id : 'preview';
                let hash = 0;
                const source = `${levelId}:${obstacle.x},${obstacle.y}:${index}`;
                for (let i = 0; i < source.length; i++) {
                    hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
                }
                const assetSet = this.obstacleAssetSet || 'current';
                if (assetSet === 'imagegen') {
                    const assetIndex = Math.abs(hash % 4) + 1;
                    return `obstacle_imagegen_${String(assetIndex).padStart(2, '0')}`;
                }
                if (assetSet === 'topdown') {
                    const assetIndex = Math.abs(hash % 2) + 1;
                    return `obstacle_topdown_${String(assetIndex).padStart(2, '0')}`;
                }
                if (assetSet === 'mixed' && Math.abs(hash % 3) === 0) {
                    const assetIndex = Math.abs(hash % 4) + 1;
                    return `obstacle_imagegen_${String(assetIndex).padStart(2, '0')}`;
                }
                const assetIndex = Math.abs(hash % 15) + 1;
                return `obstacle_plant_${String(assetIndex).padStart(2, '0')}`;
            }

            updateBlocksVisibility() {
                const show = this.showBlocks !== undefined ? this.showBlocks : true;
                
                this.pieces.forEach(p => {
                    p.list.forEach(child => {
                        // Если это фоновая подушка блока (имеет текстуру block_base)
                        if (child.texture && child.texture.key === 'block_base') {
                            child.setAlpha(show ? 0.45 : 0.0);
                        }
                    });
                    
                    if (p.ghost) {
                        p.ghost.list.forEach(child => {
                            if (child.texture && child.texture.key === 'block_base') {
                                child.setAlpha(show ? 0.4 : 0.0);
                            }
                        });
                    }
                });
            }

            generateTextures() {
                // 1. Текстура базового блока (скругленный квадрат с псевдо-3D)
                let blockG = this.make.graphics({x: 0, y: 0, add: false});
                const r = 16; // радиус скругления
                
                // Основной цвет (белый, будем красить tint-ом)
                blockG.fillStyle(0xffffff, 1);
                blockG.fillRoundedRect(0, 0, BASE_CS, BASE_CS, r);
                
                // Внутренняя тень снизу
                blockG.fillStyle(0x000000, 0.15);
                blockG.fillRoundedRect(0, BASE_CS - 15, BASE_CS, 15, {tl: 0, tr: 0, bl: r, br: r});
                
                // Блик сверху
                blockG.fillStyle(0xffffff, 0.4);
                blockG.fillRoundedRect(0, 0, BASE_CS, 15, {tl: r, tr: r, bl: 0, br: 0});
                
                blockG.generateTexture('block_base', BASE_CS, BASE_CS);

                // 2. Текстура кошачьей мордочки (с ушками)
                let faceG = this.make.graphics({x: 0, y: 0, add: false});
                
                // Мордочка (глаза и нос)
                faceG.fillStyle(0x333333, 1); // Темно-серый
                // Глаза
                faceG.fillCircle(BASE_CS * 0.3, BASE_CS * 0.45, BASE_CS * 0.08);
                faceG.fillCircle(BASE_CS * 0.7, BASE_CS * 0.45, BASE_CS * 0.08);
                // Носик
                faceG.fillTriangle(
                    BASE_CS * 0.5, BASE_CS * 0.65, 
                    BASE_CS * 0.45, BASE_CS * 0.55, 
                    BASE_CS * 0.55, BASE_CS * 0.55
                );
                
                // Усы
                faceG.lineStyle(3, 0x333333, 0.6);
                faceG.moveTo(BASE_CS * 0.25, BASE_CS * 0.55); faceG.lineTo(BASE_CS * 0.05, BASE_CS * 0.5);
                faceG.moveTo(BASE_CS * 0.25, BASE_CS * 0.65); faceG.lineTo(BASE_CS * 0.05, BASE_CS * 0.65);
                faceG.moveTo(BASE_CS * 0.75, BASE_CS * 0.55); faceG.lineTo(BASE_CS * 0.95, BASE_CS * 0.5);
                faceG.moveTo(BASE_CS * 0.75, BASE_CS * 0.65); faceG.lineTo(BASE_CS * 0.95, BASE_CS * 0.65);

                faceG.generateTexture('cat_face', BASE_CS, BASE_CS);

                // 3. Dust particle texture (soft white radial glow)
                let dustG = this.make.graphics({x: 0, y: 0, add: false});
                for (let i = 8; i > 0; i--) {
                    dustG.fillStyle(0xffffff, (9 - i) * 0.1);
                    dustG.fillCircle(8, 8, i);
                }
                dustG.generateTexture('dust_particle', 16, 16);

                // 4. Victory effect textures
                let sparkleG = this.make.graphics({x: 0, y: 0, add: false});
                for (let i = 10; i > 0; i--) {
                    sparkleG.fillStyle(0xffffff, (11 - i) * 0.08);
                    sparkleG.fillCircle(12, 12, i);
                }
                sparkleG.fillStyle(0xffffff, 0.95);
                sparkleG.fillCircle(12, 12, 3);
                sparkleG.generateTexture('victory_sparkle', 24, 24);

                let starG = this.make.graphics({x: 0, y: 0, add: false});
                const starPoints = [];
                for (let i = 0; i < 10; i++) {
                    const radius = i % 2 === 0 ? 12 : 5;
                    const angle = -Math.PI / 2 + i * Math.PI / 5;
                    starPoints.push(new Phaser.Geom.Point(14 + Math.cos(angle) * radius, 14 + Math.sin(angle) * radius));
                }
                starG.fillStyle(0xffffff, 1);
                starG.fillPoints(starPoints, true);
                starG.generateTexture('victory_star', 28, 28);

                let outlineStarG = this.make.graphics({x: 0, y: 0, add: false});
                const outlineStarPoints = [];
                for (let i = 0; i < 10; i++) {
                    const radius = i % 2 === 0 ? 44 : 18;
                    const angle = -Math.PI / 2 + i * Math.PI / 5;
                    outlineStarPoints.push(new Phaser.Geom.Point(52 + Math.cos(angle) * radius, 52 + Math.sin(angle) * radius));
                }
                outlineStarG.lineStyle(5, 0xffffff, 1);
                outlineStarG.strokePoints(outlineStarPoints, true);
                outlineStarG.generateTexture('victory_star_outline', 104, 104);

                let confettiG = this.make.graphics({x: 0, y: 0, add: false});
                confettiG.fillStyle(0xffffff, 1);
                confettiG.fillRoundedRect(1, 2, 28, 12, 4);
                confettiG.fillStyle(0xffffff, 0.34);
                confettiG.fillRoundedRect(3, 3, 24, 4, 2);
                confettiG.generateTexture('victory_confetti', 30, 16);
            }

            getLevelPieceEntries() {
                if (!this.currentLevel) {
                    return PIECE_DEFS.map(def => ({ instanceId: def.id, pieceId: def.id, def }));
                }
                if (Array.isArray(this.currentLevel.pieces) && this.currentLevel.pieces.length > 0) {
                    return this.currentLevel.pieces.map((piece, index) => {
                        const def = PIECE_DEFS.find(item => item.id === piece.pieceId);
                        return def ? {
                            instanceId: piece.instanceId || `${piece.pieceId}-${index + 1}`,
                            pieceId: piece.pieceId,
                            def
                        } : null;
                    }).filter(Boolean);
                }
                const activePieceIds = Array.isArray(this.currentLevel.pieceIds) ? this.currentLevel.pieceIds : null;
                return activePieceIds
                    ? activePieceIds.map((id, index) => {
                        const def = PIECE_DEFS.find(item => item.id === id);
                        return def ? { instanceId: `${id}-${index + 1}`, pieceId: id, def } : null;
                    }).filter(Boolean)
                    : PIECE_DEFS.map(def => ({ instanceId: def.id, pieceId: def.id, def }));
            }

            createPieces() {
                const entriesToCreate = this.getLevelPieceEntries();

                entriesToCreate.forEach(entry => {
                    const def = entry.def;
                    // Создаем боевой контейнер
                    let container = this.add.container(0, 0);
                    container.def = def;
                    container.instanceId = entry.instanceId;
                    container.pieceId = entry.pieceId;
                    container.cells = JSON.parse(JSON.stringify(def.cells)); // Клонируем ячейки
                    container.isPlaced = false;
                    container.setDepth(40);
                    container.gridX = null;
                    container.gridY = null;
                    container.color = def.color;
                    container.breathePhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
                    container.zTimer = Phaser.Math.FloatBetween(500, 2000); // Random delay before first Zzz bubble
                    
                    // Создаем ghost контейнер (полупрозрачный)
                    let ghost = this.add.container(0, 0);
                    ghost.setAlpha(0.4);
                    ghost.setVisible(false);

                    // Собираем фигуру из блоков
                    def.cells.forEach(c => {
                        let cx = c[0] * BASE_CS;
                        let cy = c[1] * BASE_CS;

                        // Блок для основной фигуры (подложка под котика с полупрозрачностью для красоты)
                        let img = this.add.image(cx, cy, 'block_base');
                        img.setTint(def.color);
                        img.setAlpha(0.45); // Make it slightly semi-transparent to look like a soft pillow
                        img.gridX = c[0]; // сохраняем относительные координаты в объекте
                        img.gridY = c[1];
                        // Делаем сам спрайт интерактивным, чтобы ловить клики по всей фигуре
                        img.setInteractive({ cursor: 'pointer', draggable: true });

                        // Надежное свечение при наведении мыши (hover) прямо на блок
                        img.on('pointerover', () => {
                            const catImg = container.list.find(child => child.isCatImage);
                            if (catImg && catImg.postFX) {
                                if (!container.isDragging && !catImg.glowEffect) {
                                    catImg.postFX.clear();
                                    let thickness = this.glowThickness !== undefined ? this.glowThickness : 6;
                                    let blur = this.glowBlur !== undefined ? this.glowBlur : 24;
                                    if (thickness > 0) {
                                        catImg.glowEffect = catImg.postFX.addGlow(0xffffff, thickness, 0, false, 0.1, blur);
                                    }
                                }
                            }
                        });

                        img.on('pointerout', () => {
                            const catImg = container.list.find(child => child.isCatImage);
                            if (catImg && catImg.postFX && !container.isDragging) {
                                catImg.postFX.clear();
                                catImg.glowEffect = null;
                            }
                        });

                        container.add(img);

                        // Блок для ghost фигуры
                        let gImg = this.add.image(cx, cy, 'block_base');
                        gImg.setTint(def.color);
                        ghost.add(gImg);
                    });

                    // Добавляем красивую тень котика (со смещением и темным тинтом)
                    let catShadow = this.add.image(def.offsetX + 4, def.offsetY + 6, def.id);
                    catShadow.setOrigin(def.originX, def.originY);
                    catShadow.setScale(def.scaleX, def.scaleY);
                    catShadow.setTint(0x110500); // Глубокий, теплый коричнево-черный оттенок тени вместо чисто серого
                    catShadow.setAlpha(this.shadowOpacity !== undefined ? this.shadowOpacity : 0.25);
                    catShadow.isCatShadow = true;
                    container.add(catShadow);

                    // Добавляем красивую PNG картинку котика поверх блоков с точной точкой привязки
                    let catImg = this.add.image(def.offsetX, def.offsetY, def.id);
                    catImg.setOrigin(def.originX, def.originY);
                    catImg.setScale(def.scaleX, def.scaleY);
                    catImg.isCatImage = true;
                    catImg.targetX = def.offsetX;
                    catImg.targetY = def.offsetY;
                    catImg.targetAngle = 0;
                    // Делаем сам спрайт интерактивным, чтобы ловить клики по всей фигуре (с учетом прозрачности)
                    catImg.setInteractive({ pixelPerfect: true, cursor: 'pointer', draggable: true });

                    // Надежное свечение при наведении мыши (hover) прямо на котика
                    catImg.on('pointerover', () => {
                        if (catImg.postFX) {
                            if (!container.isDragging && !catImg.glowEffect) {
                                catImg.postFX.clear();
                                let thickness = this.glowThickness !== undefined ? this.glowThickness : 6;
                                let blur = this.glowBlur !== undefined ? this.glowBlur : 24;
                                if (thickness > 0) {
                                    catImg.glowEffect = catImg.postFX.addGlow(0xffffff, thickness, 0, false, 0.1, blur);
                                }
                            }
                        }
                    });

                    catImg.on('pointerout', () => {
                        if (catImg.postFX && !container.isDragging) {
                            catImg.postFX.clear();
                            catImg.glowEffect = null;
                        }
                    });

                    container.add(catImg);

                    container.ghost = ghost;
                    this.pieces.push(container);
                    this.ghosts.push(ghost);
                });
            }

            rebuildPiecesFromDefs(selectedId = null, afterRebuild = null) {
                if (this.victoryEffects) this.victoryEffects.cleanup();
                this.tweens.killAll();
                this.grid = this.createEmptyGrid();
                this.previewGridCells = [];

                this.pieces.forEach(piece => piece.destroy(true));
                this.ghosts.forEach(ghost => ghost.destroy(true));
                this.pieces = [];
                this.ghosts = [];

                PIECE_DEFS.forEach(def => {
                    if (!this.textures.exists(def.id)) {
                        this.load.image(def.id, def.imagePath || `assets/cats/${def.id}.png`);
                    }
                });

                const finishRebuild = () => {
                    this.createPieces();
                    this.updateLayout();
                    this.updateBlocksVisibility();
                    this.drawBoard();
                    if (selectedId && this.editorPanel && this.editorPanel.refreshAfterRebuild) {
                        this.editorPanel.refreshAfterRebuild(selectedId);
                    }
                    if (afterRebuild) afterRebuild();
                };

                if (this.load.list.size > 0) {
                    this.load.once('complete', finishRebuild);
                    this.load.start();
                } else {
                    finishRebuild();
                }
            }

            applySolvedPreview(level) {
                this.grid = this.createEmptyGrid();
                (level.placements || []).forEach(placement => {
                    const container = placement.instanceId
                        ? this.pieces.find(piece => piece.instanceId === placement.instanceId)
                        : this.pieces.find(piece => piece.def.id === placement.pieceId && !piece.isPlaced);
                    if (!container) return;
                    container.setDepth(0);
                    container.cells = JSON.parse(JSON.stringify(placement.cells));
                    this.applyContainerShape(container, placement.cells, placement.rotation || 0);
                    container.isPlaced = true;
                    container.gridX = placement.x;
                    container.gridY = placement.y;
                    container.x = this.boardX + placement.x * this.cs + this.cs / 2;
                    container.y = this.boardY + placement.y * this.cs + this.cs / 2;
                    container.startX = container.x;
                    container.startY = container.y;
                    container.cells.forEach(([cx, cy]) => {
                        this.grid[placement.y + cy][placement.x + cx] = container.instanceId || container.def.id;
                    });
                });
                this.drawBoard();
                this.renderObstacleSprites();
            }

            applyContainerShape(container, cells, rotation = 0) {
                let blockIndex = 0;
                container.list.forEach(child => {
                    if (child.gridX === undefined || child.gridY === undefined) return;
                    const cell = cells[blockIndex] || cells[cells.length - 1];
                    child.gridX = cell[0];
                    child.gridY = cell[1];
                    child.x = cell[0] * BASE_CS;
                    child.y = cell[1] * BASE_CS;
                    blockIndex++;
                });
                if (container.ghost) {
                    container.ghost.list.forEach((child, index) => {
                        const cell = cells[index] || cells[cells.length - 1];
                        child.x = cell[0] * BASE_CS;
                        child.y = cell[1] * BASE_CS;
                    });
                }

                const rotatePoint = (x, y, turns) => {
                    let nx = x;
                    let ny = y;
                    for (let i = 0; i < turns; i++) {
                        const tx = -ny;
                        ny = nx;
                        nx = tx;
                    }
                    return { x: nx, y: ny };
                };
                const turns = ((rotation % 4) + 4) % 4;
                let rotatedDefCells = JSON.parse(JSON.stringify(container.def.cells));
                for (let i = 0; i < turns; i++) {
                    rotatedDefCells = rotatedDefCells.map(([x, y]) => [-y, x]);
                }
                const minCellX = Math.min(...rotatedDefCells.map(cell => cell[0]));
                const minCellY = Math.min(...rotatedDefCells.map(cell => cell[1]));
                const normalizedOffsetX = -minCellX * BASE_CS;
                const normalizedOffsetY = -minCellY * BASE_CS;
                const catImg = container.list.find(child => child.isCatImage);
                const catShadow = container.list.find(child => child.isCatShadow);
                [catImg, catShadow].forEach(sprite => {
                    if (!sprite) return;
                    const baseX = sprite.isCatShadow ? container.def.offsetX + 4 : container.def.offsetX;
                    const baseY = sprite.isCatShadow ? container.def.offsetY + 6 : container.def.offsetY;
                    const point = rotatePoint(baseX, baseY, turns);
                    sprite.x = point.x + normalizedOffsetX;
                    sprite.y = point.y + normalizedOffsetY;
                    sprite.targetX = sprite.x;
                    sprite.targetY = sprite.y;
                    sprite.angle = turns * 90;
                    sprite.realAngle = turns * 90;
                    sprite.targetAngle = turns * 90;
                });
            }

            getPieceRestingDepth(container) {
                return container && container.isPlaced ? 0 : 40;
            }

            setupInput() {
                this.input.on('dragstart', (pointer, gameObject) => {
                    let container = gameObject.parentContainer;
                    
                    // Clear any previous meow timer if still running
                    if (container.meowTimer) {
                        clearTimeout(container.meowTimer);
                        container.meowTimer = null;
                    }

                    // Start a 120ms delay timer. If user holds the cat for longer than 120ms, 
                    // we play the meow/purr sound (so it plays on grab/touch down).
                    // If they release it earlier (quick click/tap to rotate), we cancel the timer
                    // and play ONLY the rotation sound, completely avoiding audio overlapping!
                    container.meowTimer = setTimeout(() => {
                        if (container.isLifted) {
                            this.soundManager.playMeow();
                        }
                    }, 120);
                    
                    // Поднимаем фигуру наверх
                    this.children.bringToTop(container);
                    container.setDepth(50);
                    
                    // Запоминаем начальные данные для клика/возврата
                    container.dragStartX = container.x;
                    container.dragStartY = container.y;
                    container.pointerDownTime = this.time.now;
                    container.isDragging = false;
                    container.isLifted = true;
                    
                    // Добавляем эффект белой обводки вокруг картинки котика (свечение по PNG-контуру)
                    const catImg = container.list.find(child => child.isCatImage);
                    if (catImg && catImg.postFX) {
                        catImg.postFX.clear(); // Безопасно сбрасываем старые фильтры
                        let thickness = this.glowThickness !== undefined ? this.glowThickness : 6;
                        let blur = this.glowBlur !== undefined ? this.glowBlur : 24;
                        if (thickness > 0) {
                            catImg.glowEffect = catImg.postFX.addGlow(0xffffff, thickness, 0, false, 0.1, blur);
                        }
                    }

                    // Отменяем предыдущие анимации желе
                    this.tweens.killTweensOf(container);

                    // Добавляем эффект моментального поднятия с легким желейным вздохом (растягивание вверх от инерции)
                    const mult = this.jellyMultiplier !== undefined ? this.jellyMultiplier : 1.0;
                    this.tweens.add({
                        targets: container,
                        scaleX: container.targetScale * (1.05 - 0.03 * mult),
                        scaleY: container.targetScale * (1.05 + 0.06 * mult),
                        duration: 110,
                        ease: 'Quad.easeOut',
                        onComplete: () => {
                            if (!container.isDragging) {
                                // Плавно возвращаем к стандартному масштабу "поднятия" в воздухе
                                this.tweens.add({
                                    targets: container,
                                    scaleX: container.targetScale * 1.05,
                                    scaleY: container.targetScale * 1.05,
                                    duration: 180,
                                    ease: 'Back.easeOut'
                                });
                            }
                        }
                    });

                    // Сохраняем информацию о том, где стояла фигура
                    if (container.isPlaced) {
                        container.wasPlacedAt = { x: container.gridX, y: container.gridY };
                        this.removeFromGrid(container);
                    } else {
                        container.wasPlacedAt = null;
                    }
                });

                this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
                    let container = gameObject.parentContainer;
                    
                    // Move container taking main camera zoom into account
                    const zoom = this.cameras.main.zoom;
                    let dx = (pointer.position.x - pointer.prevPosition.x) / zoom;
                    let dy = (pointer.position.y - pointer.prevPosition.y) / zoom;
                    container.x += dx;
                    container.y += dy;

                    // Drag threshold with zoom scaling to maintain consistent physical gesture distance
                    const dragDistScreen = Phaser.Math.Distance.Between(container.dragStartX, container.dragStartY, container.x, container.y) * zoom;
                    if (dragDistScreen > 5) {
                        if (!container.isDragging) {
                            container.isDragging = true;
                            // Отменяем анимации "хватания", так как потащили
                            this.tweens.killTweensOf(container);
                        }
                        
                        // --- Желейный эффект при перетаскивании (Установка целей для физики пружины) ---
                        const mult = this.jellyMultiplier !== undefined ? this.jellyMultiplier : 1.0;

                        // 1. Целевой наклон по ходу движения
                        let targetRotation = dx * 0.015 * mult;
                        container.jellyDragRotation = Phaser.Math.Clamp(targetRotation, -0.2 * mult, 0.2 * mult);

                        // 2. Целевое сжатие и растяжение от скорости (squash and stretch)
                        let speedX = Math.abs(dx);
                        let speedY = Math.abs(dy);
                        
                        let stretchFactorX = 1 + speedX * 0.008 * mult;
                        let stretchFactorY = 1 + speedY * 0.008 * mult;
                        
                        container.jellyDragStretchX = stretchFactorX / stretchFactorY;
                        container.jellyDragStretchY = stretchFactorY / stretchFactorX;
                    }

                    // Обновляем Ghost preview
                    this.updateGhostPreview(container);
                });

                this.input.on('dragend', (pointer, gameObject) => {
                    let container = gameObject.parentContainer;
                    container.ghost.setVisible(false);

                    // Очищаем подсветку ячеек предпросмотра на сетке
                    this.previewGridCells = [];
                    this.drawBoard();

                    // Убираем эффект белой обводки вокруг картинки котика
                    const catImg = container.list.find(child => child.isCatImage);
                    if (catImg && catImg.postFX) {
                        catImg.postFX.clear();
                    }

                    let clickTime = this.time.now - container.pointerDownTime;
                    
                    let wasDragging = container.isDragging;
                    container.isDragging = false;
                    container.isLifted = false;

                    // Clear meow timer on release to prevent delayed meows after rotation
                    if (container.meowTimer) {
                        clearTimeout(container.meowTimer);
                        container.meowTimer = null;
                    }
                    
                    this.tweens.killTweensOf(container);
                    
                    const mult = this.jellyMultiplier !== undefined ? this.jellyMultiplier : 1.0;
                    
                    // Опускаем фигуру с желейным отскоком
                    this.tweens.add({
                        targets: container,
                        scaleX: container.targetScale,
                        scaleY: container.targetScale,
                        rotation: 0,
                        duration: mult > 0 ? 500 : 150,
                        ease: mult > 0 ? 'Elastic.easeOut' : 'Quad.easeOut',
                        easeParams: mult > 0 ? [1.2 * mult, 0.5] : undefined
                    });

                    // Логика Тап = Поворот
                    if (!wasDragging && clickTime < 300) {
                        // Сначала только логически и внутренне поворачиваем фигуру (без анимации x/y всего контейнера)
                        this.rotatePiece(container, pointer, false);
                        
                        // Play rotation sound on tap/rotate
                        this.soundManager.playRotation();
                        
                        // Если фигура стояла на поле, примагничиваем ее к сетке с учетом нового положения
                        if (container.wasPlacedAt) {
                            // Находим ближайшую клетку сетки для нового положения контейнера
                            let localX = container.targetX_after_rotate - this.boardX - this.cs/2;
                            let localY = container.targetY_after_rotate - this.boardY - this.cs/2;
                            let newX = Math.round(localX / this.cs);
                            let newY = Math.round(localY / this.cs);

                            if (this.canPlace(container.cells, newX, newY)) {
                                this.placePiece(container, newX, newY);
                            } else {
                                this.returnToStart(container, true, true);
                            }
                        } else {
                            // Если фигура не была на сетке, анимируем ее перемещение в рассчитанную точку поворота
                            this.tweens.add({
                                targets: container,
                                x: container.targetX_after_rotate,
                                y: container.targetY_after_rotate,
                                duration: 200,
                                ease: 'Back.easeOut',
                                onComplete: () => container.setDepth(this.getPieceRestingDepth(container))
                            });
                        }
                        return;
                    }

                    // Логика Drop = Попытка установить
                    let localX = container.x - this.boardX - this.cs/2;
                    let localY = container.y - this.boardY - this.cs/2;
                    let gridX = Math.round(localX / this.cs);
                    let gridY = Math.round(localY / this.cs);

                    let hasOverlapWithGrid = false;
                    container.cells.forEach(([cx, cy]) => {
                        let gx = gridX + cx;
                        let gy = gridY + cy;
                        if (gx >= 0 && gx < this.activeGridCols && gy >= 0 && gy < this.activeGridRows) {
                            hasOverlapWithGrid = true;
                        }
                    });

                    if (this.canPlace(container.cells, gridX, gridY)) {
                        this.placePiece(container, gridX, gridY);
                    } else if (hasOverlapWithGrid) {
                        this.returnToStart(container, true, true);
                    } else {
                        // Оставляем котика там, где его бросили, если он не над сеткой
                        container.startX = container.x;
                        container.startY = container.y;
                    container.setDepth(40);
                    }
                });
            }

            update(time, delta) {
                // Update atmospheric dust particles
                this.dustSystem.update(time, delta);

                const mult = this.jellyMultiplier !== undefined ? this.jellyMultiplier : 1.0;
                
                this.pieces.forEach(container => {
                    // Обрабатываем желейную физику пружины ТОЛЬКО когда котика тащат
                    if (container.isDragging) {
                        if (mult <= 0) {
                            let baseScale = container.targetScale * 1.05;
                            container.scaleX = baseScale;
                            container.scaleY = baseScale;
                            container.rotation = 0;
                            return;
                        }

                        // 1. Плавное затухание "целевой деформации", если мышь остановилась
                        container.jellyDragStretchX = Phaser.Math.Linear(container.jellyDragStretchX || 1, 1, 0.15);
                        container.jellyDragStretchY = Phaser.Math.Linear(container.jellyDragStretchY || 1, 1, 0.15);
                        container.jellyDragRotation = Phaser.Math.Linear(container.jellyDragRotation || 0, 0, 0.15);

                        let baseScale = container.targetScale * 1.05;
                        let targetScaleX = baseScale * container.jellyDragStretchX;
                        let targetScaleY = baseScale * container.jellyDragStretchY;
                        let targetRotation = container.jellyDragRotation;

                        // Ограничения для целей
                        let minLimit = baseScale * (1 - 0.15 * mult);
                        let maxLimit = baseScale * (1 + 0.25 * mult);
                        targetScaleX = Phaser.Math.Clamp(targetScaleX, minLimit, maxLimit);
                        targetScaleY = Phaser.Math.Clamp(targetScaleY, minLimit, maxLimit);

                        // 2. Симуляция пружины (Spring Physics)
                        if (!container.jellyVelX) container.jellyVelX = 0;
                        if (!container.jellyVelY) container.jellyVelY = 0;
                        if (!container.jellyVelR) container.jellyVelR = 0;

                        // Константы пружины
                        const stiffness = this.jellyStiffness !== undefined ? this.jellyStiffness : 0.35; // Возвратная сила пружины (жесткость)
                        const damping = this.jellyDamping !== undefined ? this.jellyDamping : 0.55;   // Затухание пружины (сопротивление среды)

                        // Закон Гука
                        let forceX = (targetScaleX - container.scaleX) * stiffness;
                        let forceY = (targetScaleY - container.scaleY) * stiffness;
                        let forceR = (targetRotation - container.rotation) * stiffness;

                        // Обновление скоростей с затуханием
                        container.jellyVelX = (container.jellyVelX + forceX) * damping;
                        container.jellyVelY = (container.jellyVelY + forceY) * damping;
                        container.jellyVelR = (container.jellyVelR + forceR) * damping;

                        // Применение скоростей
                        container.scaleX += container.jellyVelX;
                        container.scaleY += container.jellyVelY;
                        container.rotation += container.jellyVelR;
                    }

                    // Обновляем позицию, угол, масштаб и видимость тени котика в реальном времени
                    const catImg = container.list.find(child => child.isCatImage);
                    const catShadow = container.list.find(child => child.isCatShadow);

                    const isSleeping = !container.isDragging && !container.isLifted;

                    if (catImg) {
                        if (isSleeping) {
                            // Breathe animation logic
                            let speedFactor = this.breatheSpeedScale !== undefined ? this.breatheSpeedScale : 1.0;
                            let ampFactor = this.breatheAmpScale !== undefined ? this.breatheAmpScale : 1.0;

                            let breatheFactorX = Math.sin(time * 0.0012 * speedFactor + container.breathePhase) * 0.005 * ampFactor; // custom speed/amplitude horizontal breath
                            let breatheFactorY = Math.sin(time * 0.0012 * speedFactor + container.breathePhase - 0.2) * 0.008 * ampFactor; // custom speed/amplitude vertical breath
                            
                            catImg.setScale(
                                container.def.scaleX * (1 + breatheFactorX),
                                container.def.scaleY * (1 + breatheFactorY)
                            );
                            
                            // Spawn Zzz text particles
                            if (container.zTimer === undefined) container.zTimer = Phaser.Math.FloatBetween(500, 2000);
                            container.zTimer -= delta;
                            if (container.zTimer <= 0) {
                                container.zTimer = Phaser.Math.FloatBetween(2000, 3500); // reset delay
                                this.dustSystem.spawnZParticle(container);
                            }
                        } else {
                            // Reset to normal scale when lifted or dragged
                            catImg.setScale(container.def.scaleX, container.def.scaleY);
                        }
                    }

                    if (catImg && catShadow) {
                        const isShadowOn = this.shadowEnabled !== false;
                        catShadow.setVisible(isShadowOn);
                        
                        if (isShadowOn) {
                            let baseOpacity = this.shadowOpacity !== undefined ? this.shadowOpacity : 0.25;
                            
                            // Динамический эффект подъема при перетаскивании котика
                            let targetOffsetX = 4;
                            let targetOffsetY = 6;
                            let targetShadowScale = 1.0;
                            let targetOpacity = baseOpacity;
                            
                            const isLifted = container.isDragging || container.isLifted;
                            
                            if (isLifted) {
                                // Кот "поднимается" выше: тень отодвигается дальше и становится немного более прозрачной
                                targetOffsetX = 12;
                                targetOffsetY = 18;
                                targetShadowScale = 0.95; // Из-за удаления от поверхности
                                targetOpacity = baseOpacity * 0.7; // Слегка рассеивается
                            }
                            
                            if (catShadow.currentOffsetX === undefined) catShadow.currentOffsetX = targetOffsetX;
                            if (catShadow.currentOffsetY === undefined) catShadow.currentOffsetY = targetOffsetY;
                            if (catShadow.currentShadowScale === undefined) catShadow.currentShadowScale = targetShadowScale;
                            if (catShadow.currentOpacity === undefined) catShadow.currentOpacity = targetOpacity;
                            
                            // Адаптивная скорость возвращения: тень приземляется очень быстро, а взлетает плавно
                            let lerpFactor = isLifted ? 0.25 : 0.45;
                            
                            // Плавная линейная интерполяция значений для сглаживания подъема
                            catShadow.currentOffsetX = Phaser.Math.Linear(catShadow.currentOffsetX, targetOffsetX, lerpFactor);
                            catShadow.currentOffsetY = Phaser.Math.Linear(catShadow.currentOffsetY, targetOffsetY, lerpFactor);
                            catShadow.currentShadowScale = Phaser.Math.Linear(catShadow.currentShadowScale, targetShadowScale, lerpFactor);
                            catShadow.currentOpacity = Phaser.Math.Linear(catShadow.currentOpacity, targetOpacity, lerpFactor);
                            
                            catShadow.x = catImg.x + catShadow.currentOffsetX;
                            catShadow.y = catImg.y + catShadow.currentOffsetY;
                            catShadow.angle = catImg.angle;
                            catShadow.setScale(catImg.scaleX * catShadow.currentShadowScale, catImg.scaleY * catShadow.currentShadowScale);
                            catShadow.setOrigin(catImg.originX, catImg.originY);
                            catShadow.setAlpha(catShadow.currentOpacity);
                        }
                    }
                });
            }

            rotatePiece(container, pointer, shouldTweenXY = true) {
                let cx, cy;
                if (!pointer) {
                    let minX = Math.min(...container.cells.map(c => c[0]));
                    let maxX = Math.max(...container.cells.map(c => c[0]));
                    let minY = Math.min(...container.cells.map(c => c[1]));
                    let maxY = Math.max(...container.cells.map(c => c[1]));
                    cx = (minX + maxX) / 2;
                    cy = (minY + maxY) / 2;
                }

                // Математика поворота 90 град по часовой: (x, y) -> (-y, x)
                container.cells = container.cells.map(([x, y]) => [-y, x]);

                let targetX, targetY;

                if (pointer) {
                    // Вращение вокруг курсора (чтобы точка под мышкой осталась на месте)
                    let lx = (pointer.worldX - container.x) / container.scaleX;
                    let ly = (pointer.worldY - container.y) / container.scaleY;
                    targetX = pointer.worldX + ly * container.scaleX;
                    targetY = pointer.worldY - lx * container.scaleY;
                } else {
                    // Программное вращение вокруг геометрического центра
                    let dx = cx + cy;
                    let dy = cy - cx;
                    let shiftX = dx * BASE_CS * container.scaleX;
                    let shiftY = dy * BASE_CS * container.scaleY;
                    targetX = container.x + shiftX;
                    targetY = container.y + shiftY;
                }

                container.targetX_after_rotate = targetX;
                container.targetY_after_rotate = targetY;

                if (shouldTweenXY) {
                    this.tweens.add({
                        targets: container,
                        x: targetX,
                        y: targetY,
                        duration: 200,
                        ease: 'Back.easeOut'
                    });
                }

                if (!container.isPlaced) {
                    container.startX = targetX;
                    container.startY = targetY;
                }

                // Анимируем перемещение спрайтов внутри контейнера
                container.list.forEach(child => {
                    this.tweens.killTweensOf(child);

                    if (child.isCatImage) {
                        if (child.targetX === undefined) child.targetX = child.x;
                        if (child.targetY === undefined) child.targetY = child.y;
                        if (child.targetAngle === undefined) child.targetAngle = child.angle;
                        if (child.realAngle === undefined) child.realAngle = child.angle;

                        // Вращаем не только угол, но и смещение картинки относительно (0,0) контейнера!
                        let nx = -child.targetY;
                        let ny = child.targetX;

                        child.targetX = nx;
                        child.targetY = ny;
                        child.targetAngle += 90;

                        // Имитируем свойство angle без внутреннего ограничения Phaser [-180, 180]
                        this.tweens.add({
                            targets: child,
                            realAngle: child.targetAngle,
                            x: child.targetX,
                            y: child.targetY,
                            duration: 200,
                            ease: 'Back.easeOut',
                            onUpdate: () => {
                                child.angle = child.realAngle;
                            }
                        });
                        return;
                    }

                    let nx = -child.gridY;
                    let ny = child.gridX;
                    child.gridX = nx;
                    child.gridY = ny;

                    this.tweens.add({
                        targets: child,
                        x: nx * BASE_CS,
                        y: ny * BASE_CS,
                        duration: 200,
                        ease: 'Back.easeOut'
                    });
                });

                // Сразу обновляем ghost контейнер, чтобы он совпадал с основной фигурой
                container.ghost.list.forEach((gChild, index) => {
                    this.tweens.killTweensOf(gChild);
                    let cell = container.cells[index];
                    gChild.x = cell[0] * BASE_CS;
                    gChild.y = cell[1] * BASE_CS;
                });
            }

            updateGhostPreview(container) {
                let localX = container.x - this.boardX - this.cs/2;
                let localY = container.y - this.boardY - this.cs/2;
                let gridX = Math.round(localX / this.cs);
                let gridY = Math.round(localY / this.cs);

                let hasOverlap = false;
                let newPreviewCells = [];

                container.cells.forEach(([cx, cy]) => {
                    let gx = gridX + cx;
                    let gy = gridY + cy;
                        if (gx >= 0 && gx < this.activeGridCols && gy >= 0 && gy < this.activeGridRows) {
                        hasOverlap = true;
                        let status = this.grid[gy][gx] === null ? 'valid' : 'invalid';
                        newPreviewCells.push({ r: gy, c: gx, status: status });
                    }
                });

                if (hasOverlap) {
                    container.ghost.setVisible(true);
                    container.ghost.x = this.boardX + gridX * this.cs + this.cs/2;
                    container.ghost.y = this.boardY + gridY * this.cs + this.cs/2;
                    // Опускаем ghost под основные фигуры
                    this.children.moveBelow(container.ghost, container);

                    // Оптимизация: перерисовываем сетку только если координаты реально изменились или статус ячеек поменялся
                    let isChanged = !this.previewGridCells || this.previewGridCells.length !== newPreviewCells.length ||
                        newPreviewCells.some((cell, idx) => {
                            let oldCell = this.previewGridCells[idx];
                            return !oldCell || oldCell.r !== cell.r || oldCell.c !== cell.c || oldCell.status !== cell.status;
                        });

                    if (isChanged) {
                        this.previewGridCells = newPreviewCells;
                        this.drawBoard();
                    }
                } else {
                    container.ghost.setVisible(false);

                    // Если фигура вышла за пределы сетки, сбрасываем подсветку предпросмотра
                    if (this.previewGridCells && this.previewGridCells.length > 0) {
                        this.previewGridCells = [];
                        this.drawBoard();
                    }
                }
            }

            canPlace(cells, gridX, gridY) {
                for (let [cx, cy] of cells) {
                    let gx = gridX + cx;
                    let gy = gridY + cy;
                    // Проверка границ
                    if (gx < 0 || gx >= this.activeGridCols || gy < 0 || gy >= this.activeGridRows) return false;
                    // Проверка пересечений
                    if (this.grid[gy][gx] !== null) return false;
                }
                return true;
            }

            placePiece(container, gridX, gridY) {
                container.isPlaced = true;
                container.setDepth(0);
                container.gridX = gridX;
                container.gridY = gridY;

                // Магнитим к сетке
                let targetX = this.boardX + gridX * this.cs + this.cs/2;
                let targetY = this.boardY + gridY * this.cs + this.cs/2;

                this.tweens.add({
                    targets: container,
                    x: targetX,
                    y: targetY,
                    duration: 150,
                    ease: 'Quad.easeOut'
                });

                // Play placement sound
                this.soundManager.playPlacement();

                // Записываем в логическую сетку
                container.cells.forEach(([cx, cy]) => {
                    this.grid[gridY + cy][gridX + cx] = container.instanceId || container.def.id;
                });

                // Перерисовываем сетку, чтобы закрасить занятые ячейки зеленым
                this.drawBoard();

                // Проверяем победу
                this.checkWin();
            }

            removeFromGrid(container) {
                container.isPlaced = false;
                let gx = container.gridX;
                let gy = container.gridY;
                
                if (gx !== null && gy !== null) {
                    container.cells.forEach(([cx, cy]) => {
                        this.grid[gy + cy][gx + cx] = null;
                    });
                }
                
                container.gridX = null;
                container.gridY = null;

                // Перерисовываем сетку, чтобы убрать зеленую заливку у освободившихся ячеек
                this.drawBoard();
            }

            returnToStart(container, playSound = false, restoreDepthOnComplete = false) {
                if (playSound) {
                    this.soundManager.playReturn();
                }
                this.tweens.add({
                    targets: container,
                    x: container.startX,
                    y: container.startY,
                    duration: 300,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        if (restoreDepthOnComplete) container.setDepth(this.getPieceRestingDepth(container));
                    }
                });
            }

            playVictoryJump() {
                const mode = this.victoryJumpMode || 'sequential';
                if (mode === 'off') return;

                const tweenPiece = (piece) => {
                    if (!piece || !piece.active) return;
                    this.tweens.add({
                        targets: piece,
                        y: piece.y - 15,
                        yoyo: true,
                        duration: 200,
                        ease: 'Sine.easeInOut'
                    });
                };

                if (mode === 'simultaneous') {
                    this.pieces.forEach(piece => tweenPiece(piece));
                    return;
                }

                this.pieces.forEach((piece, i) => {
                    this.time.delayedCall(i * 100, () => tweenPiece(piece));
                });
            }

            checkWin() {
                let isFull = this.grid.every(row => row.every(cell => cell !== null));
                if (isFull) {
                    // Play win sound
                    this.soundManager.playWin();
                    if (this.victoryEffects) this.victoryEffects.play(this.selectedVictoryEffect);

                    // Мягкая реакция котиков (прыжок)
                    this.playVictoryJump();

                    // Показываем UI
                    setTimeout(() => {
                        const ui = document.getElementById('ui-layer');
                        const modal = document.getElementById('win-modal');
                        ui.classList.remove('opacity-0', 'invisible');
                        ui.classList.add('fade-in');
                        modal.classList.remove('scale-90');
                        modal.classList.add('scale-in');
                    }, 800);
                }
            }

            restartLevel() {
                if (this.victoryEffects) this.victoryEffects.cleanup();
                // Скрываем UI
                const ui = document.getElementById('ui-layer');
                const modal = document.getElementById('win-modal');
                ui.classList.remove('fade-in');
                modal.classList.remove('scale-in');
                
                setTimeout(() => {
                    ui.classList.add('opacity-0', 'invisible');
                    modal.classList.add('scale-90');
                }, 10);

                // Очищаем сетку
                this.grid = this.createEmptyGrid();

                // Возвращаем фигуры
                this.pieces.forEach(p => {
                    this.removeFromGrid(p);
                    // Возвращаем на исходные места в доке
                    p.startX = p.dockX;
                    p.startY = p.dockY;
                    this.returnToStart(p);
                });
            }

            updateLayout() {
                let w = this.scale.gameSize.width;
                let h = this.scale.gameSize.height;
                let isPortrait = w < h;
                const layoutCols = GRID_COLS;
                const layoutRows = GRID_ROWS;
                const boardScale = this.getBoardScale() * this.getAdaptiveLevelScale();
                const boardWidth = () => this.cs * this.activeGridCols;
                const boardHeight = () => this.cs * this.activeGridRows;
                const maxBoardWidth = () => this.cs * layoutCols;
                const maxBoardHeight = () => this.cs * layoutRows;
                const makeRowZones = (count, y, xMin, xMax) => {
                    if (count <= 1) return [{ x: (xMin + xMax) / 2, y }];
                    return Array.from({ length: count }, (_, i) => ({
                        x: Phaser.Math.Linear(xMin, xMax, i / (count - 1)),
                        y
                    }));
                };

                // Расчет размеров и позиций
                if (isPortrait) {
                    // Мобильная раскладка
                    const boardAreaW = w * 0.92;
                    const boardAreaH = h * 0.34;
                    const boardAreaX = w / 2 - boardAreaW / 2;
                    const boardAreaY = h * 0.12 + this.getLayoutOffsetY();
                    this.cs = Math.min(boardAreaW / layoutCols, boardAreaH / layoutRows) * boardScale;
                    this.boardX = boardAreaX + boardAreaW / 2 - boardWidth() / 2;
                    this.boardY = boardAreaY + boardAreaH / 2 - boardHeight() / 2;

                    // Зоны для 5 фигур внизу
                    const pieceCount = Math.max(1, this.pieces ? this.pieces.length : 1);
                    let bottomY = boardAreaY + boardAreaH + 34;
                    let availH = Math.max(180, h - bottomY);
                    const rowCount = Math.max(3, Math.ceil(pieceCount / 3));
                    this.startZones = [];
                    for (let row = 0; row < rowCount; row++) {
                        const t = rowCount === 1 ? 0.5 : row / (rowCount - 1);
                        this.startZones.push(...makeRowZones(3, bottomY + availH * (0.16 + t * 0.72), w * 0.18, w * 0.82));
                    }
                } else {
                    // Десктопная раскладка
                    const boardAreaW = w * 0.72;
                    const boardAreaH = h * 0.52;
                    const boardAreaX = w / 2 - boardAreaW / 2;
                    const boardAreaY = h * 0.12 + this.getLayoutOffsetY();
                    this.cs = Math.min(boardAreaW / layoutCols, boardAreaH / layoutRows) * boardScale;
                    this.boardX = boardAreaX + boardAreaW / 2 - boardWidth() / 2;
                    this.boardY = boardAreaY + boardAreaH / 2 - boardHeight() / 2;

                    // Зоны по бокам
                    const pieceCount = Math.max(1, this.pieces ? this.pieces.length : 1);
                    let lx = Math.max(w * 0.1, boardAreaX);
                    let rx = Math.min(w * 0.9, boardAreaX + boardAreaW);
                    let bottomY = boardAreaY + boardAreaH + 58;
                    const rowCount = Math.max(2, Math.ceil(pieceCount / 5));
                    const rowGap = rowCount <= 1 ? 0 : Math.min(this.cs * 1.35, Math.max(42, (h - bottomY - 72) / Math.max(1, rowCount - 1)));
                    this.startZones = [];
                    for (let row = 0; row < rowCount; row++) {
                        const cols = row % 2 === 0 ? 5 : 4;
                        const inset = row % 2 === 0 ? 0 : this.cs * 0.65;
                        this.startZones.push(...makeRowZones(cols, Math.min(h - 72, bottomY + row * rowGap), lx + inset, rx - inset));
                    }
                }

                this.updateFloorBackground(w, h);
                this.drawRug();
                this.drawBoard();

                // Обновляем позицию и масштаб фонового изображения комнаты
                this.renderObstacleSprites();

                // Обновляем масштаб и позиции фигур
                let scale = this.cs / BASE_CS;
                
                this.pieces.forEach((p, i) => {
                    p.targetScale = scale;
                    p.setScale(scale);
                    p.ghost.setScale(scale);
                    
                    // Центрируем фигуру в стартовой зоне по ее визуальному центру
                    let minX = Math.min(...p.cells.map(c => c[0]));
                    let maxX = Math.max(...p.cells.map(c => c[0]));
                    let minY = Math.min(...p.cells.map(c => c[1]));
                    let maxY = Math.max(...p.cells.map(c => c[1]));
                    let cx = (minX + maxX) / 2;
                    let cy = (minY + maxY) / 2;

                    const zone = this.startZones[i] || this.startZones[this.startZones.length - 1];
                    p.dockX = zone.x - cx * BASE_CS * scale;
                    p.dockY = zone.y - cy * BASE_CS * scale;
                    
                    // Если фигура не была поставлена игроком вне сетки
                    if (!p.isPlaced && p.startX === undefined) {
                        p.startX = p.dockX;
                        p.startY = p.dockY;
                    }

                    if (p.isPlaced) {
                        // Перерасчитываем позицию на доске при ресайзе
                        p.x = this.boardX + p.gridX * this.cs + this.cs/2;
                        p.y = this.boardY + p.gridY * this.cs + this.cs/2;
                    } else if (!p.isDragging) {
                        // Если ресайз, фигуры возвращаются в док для избежания вылета за экран
                        p.startX = p.dockX;
                        p.startY = p.dockY;
                        p.x = p.startX;
                        p.y = p.startY;
                    }
                });
            }

            getBoardScale() {
                if (this.boardScale !== undefined) return this.boardScale;
                return parseFloat(localStorage.getItem('jellycats_board_scale') || '1.0');
            }

            getBoardScaleMode() {
                return this.boardScaleMode || localStorage.getItem('jellycats_board_scale_mode') || 'adaptive';
            }

            getBoardRowScales() {
                const defaults = typeof DEFAULT_BOARD_ROW_SCALES !== 'undefined'
                    ? DEFAULT_BOARD_ROW_SCALES
                    : { 4: 1.4, 5: 1.25, 6: 1.15, 7: 1.07, 8: 1.0 };
                let saved = {};
                if (this.boardRowScales) saved = this.boardRowScales;
                else {
                    try {
                        saved = JSON.parse(localStorage.getItem('jellycats_board_row_scales') || '{}');
                    } catch (e) {
                        saved = {};
                    }
                }
                return [4, 5, 6, 7, 8].reduce((result, rows) => {
                    const value = parseFloat(saved[rows]);
                    result[rows] = Number.isFinite(value) ? value : defaults[rows];
                    return result;
                }, {});
            }

            getAdaptiveLevelScale() {
                if (this.getBoardScaleMode() !== 'adaptive') return 1;
                const rows = Phaser.Math.Clamp(Math.round(this.activeGridRows || 4), 4, 8);
                return this.getBoardRowScales()[rows] || 1;
            }

            getLayoutOffsetY() {
                if (this.layoutOffsetY !== undefined) return this.layoutOffsetY;
                return parseInt(localStorage.getItem('jellycats_layout_offset_y') || '0', 10);
            }

            getRugPaddingCells() {
                if (this.rugPaddingCells !== undefined) return this.rugPaddingCells;
                return parseFloat(localStorage.getItem('jellycats_rug_padding_cells') || '1.25');
            }

            getRugMode() {
                return this.rugMode || localStorage.getItem('jellycats_rug_mode') || 'sprite';
            }

            updateFloorBackground(w, h) {
                if (!this.bgImage) return;
                const source = this.bgImage.texture && this.bgImage.texture.getSourceImage
                    ? this.bgImage.texture.getSourceImage()
                    : null;
                const sourceW = source && source.width ? source.width : 1672;
                const sourceH = source && source.height ? source.height : 941;
                const coverScale = Math.max(w / sourceW, h / sourceH);
                const bgMultiplier = this.bgScaleMultiplier !== undefined
                    ? this.bgScaleMultiplier
                    : parseFloat(localStorage.getItem('jellycats_bg_scale_multiplier') || '1.0');
                const finalScale = coverScale * Math.max(1, bgMultiplier);

                this.bgImage.setScale(finalScale);
                this.bgImage.setPosition(w / 2, h / 2);
            }

            drawRug() {
                if (!this.rugGraphic) return;
                this.rugGraphic.clear();

                const mode = this.getRugMode();
                const layout = this.getRugLayout(mode === 'nine-slice' || mode === 'stretch' ? 'rect' : 'square');

                if (this.rugImage) {
                    this.rugImage.setVisible(mode === 'sprite' || mode === 'stretch');
                    if (mode === 'sprite' || mode === 'stretch') {
                        this.rugImage.setPosition(layout.centerX, layout.centerY);
                        this.rugImage.setDisplaySize(layout.rugW, layout.rugH);
                    }
                }

                if (this.rugNineSlice) {
                    this.rugNineSlice.setVisible(mode === 'nine-slice');
                    if (mode === 'nine-slice') {
                        this.drawNineSliceRug(layout);
                    }
                }

                if (mode === 'sprite' || mode === 'stretch') return;
                if (mode === 'nine-slice') return;
                this.drawRugShadow(layout);
                this.drawProceduralRug(layout);
            }

            getRugLayout(shape = 'square') {
                const activeWidth = this.cs * this.activeGridCols;
                const activeHeight = this.cs * this.activeGridRows;
                const pad = this.cs * this.getRugPaddingCells();
                const centerX = this.boardX + activeWidth / 2;
                const centerY = this.boardY + activeHeight / 2;
                const rugCells = Math.max(this.activeGridCols, this.activeGridRows, 4);
                const rugW = shape === 'rect' ? activeWidth + pad * 2 : rugCells * this.cs + pad * 2;
                const rugH = shape === 'rect' ? activeHeight + pad * 2 : rugCells * this.cs + pad * 2;
                const rugX = centerX - rugW / 2;
                const rugY = centerY - rugH / 2;
                const radius = Math.min(this.cs * 0.42, 42);

                return { rugX, rugY, rugW, rugH, centerX, centerY, radius };
            }

            ensureNineSliceRugPieces(sourceW, sourceH, slice) {
                const texture = this.textures.get('rug_square');
                const frames = {
                    tl: [0, 0, slice, slice],
                    top: [slice, 0, sourceW - slice * 2, slice],
                    tr: [sourceW - slice, 0, slice, slice],
                    left: [0, slice, slice, sourceH - slice * 2],
                    center: [slice, slice, sourceW - slice * 2, sourceH - slice * 2],
                    right: [sourceW - slice, slice, slice, sourceH - slice * 2],
                    bl: [0, sourceH - slice, slice, slice],
                    bottom: [slice, sourceH - slice, sourceW - slice * 2, slice],
                    br: [sourceW - slice, sourceH - slice, slice, slice]
                };

                Object.entries(frames).forEach(([key, frame]) => {
                    const frameName = `rug-nine-${key}`;
                    if (!texture.has(frameName)) {
                        texture.add(frameName, 0, frame[0], frame[1], frame[2], frame[3]);
                    }
                });

                if (this.rugNineSlicePieces || !this.rugNineSlice) return;

                this.rugNineSlicePieces = Object.keys(frames).reduce((pieces, key) => {
                    const isCorner = key === 'tl' || key === 'tr' || key === 'bl' || key === 'br';
                    const piece = isCorner
                        ? this.add.image(0, 0, 'rug_square', `rug-nine-${key}`)
                        : this.add.tileSprite(0, 0, 1, 1, 'rug_square', `rug-nine-${key}`);
                    piece.setOrigin(0, 0);
                    this.rugNineSlice.add(piece);
                    pieces[key] = piece;
                    return pieces;
                }, {});
            }

            drawNineSliceRug({ rugX, rugY, rugW, rugH }) {
                const source = this.textures.get('rug_square').getSourceImage();
                const sourceW = source && source.width ? source.width : 512;
                const sourceH = source && source.height ? source.height : 512;
                const slice = 96;

                this.ensureNineSliceRugPieces(sourceW, sourceH, slice);
                if (!this.rugNineSlicePieces) return;

                const left = Math.min(slice, sourceW * 0.3, rugW * 0.32);
                const right = left;
                const top = Math.min(slice, sourceH * 0.3, rugH * 0.32);
                const bottom = top;
                const centerW = Math.max(1, rugW - left - right);
                const centerH = Math.max(1, rugH - top - bottom);
                const p = this.rugNineSlicePieces;

                const setPiece = (piece, x, y, w, h) => {
                    piece.setPosition(x, y);
                    if (piece.type === 'TileSprite') {
                        piece.setSize(Math.max(1, w), Math.max(1, h));
                    } else {
                        piece.setDisplaySize(Math.max(1, w), Math.max(1, h));
                    }
                };

                setPiece(p.tl, rugX, rugY, left, top);
                setPiece(p.top, rugX + left, rugY, centerW, top);
                setPiece(p.tr, rugX + left + centerW, rugY, right, top);

                setPiece(p.left, rugX, rugY + top, left, centerH);
                setPiece(p.center, rugX + left, rugY + top, centerW, centerH);
                setPiece(p.right, rugX + left + centerW, rugY + top, right, centerH);

                setPiece(p.bl, rugX, rugY + top + centerH, left, bottom);
                setPiece(p.bottom, rugX + left, rugY + top + centerH, centerW, bottom);
                setPiece(p.br, rugX + left + centerW, rugY + top + centerH, right, bottom);
            }

            drawRugShadow({ rugX, rugY, rugW, rugH, radius }) {
                this.rugGraphic.fillStyle(0x8f345b, 0.24);
                this.rugGraphic.fillRoundedRect(rugX + this.cs * 0.06, rugY + this.cs * 0.08, rugW, rugH, radius);
            }

            drawProceduralRug({ rugX, rugY, rugW, rugH, radius }) {
                this.rugGraphic.fillStyle(0xee87a0, 0.92);
                this.rugGraphic.fillRoundedRect(rugX, rugY, rugW, rugH, radius);

                const border = Math.max(8, this.cs * 0.14);
                this.rugGraphic.fillStyle(0xd75d85, 0.88);
                this.rugGraphic.fillRoundedRect(rugX, rugY, rugW, rugH, radius);
                this.rugGraphic.fillStyle(0xf293aa, 0.94);
                this.rugGraphic.fillRoundedRect(
                    rugX + border,
                    rugY + border,
                    rugW - border * 2,
                    rugH - border * 2,
                    Math.max(2, radius - border * 0.55)
                );

                const patternX = rugX + border * 1.15;
                const patternY = rugY + border * 1.15;
                const patternW = rugW - border * 2.3;
                const patternH = rugH - border * 2.3;
                const stripeW = Math.max(this.cs * 0.76, patternW / 8);
                for (let x = patternX - stripeW * 0.5; x < patternX + patternW + stripeW; x += stripeW) {
                    this.drawChevronStripe(x, patternY, stripeW, patternH);
                }

                this.rugGraphic.lineStyle(Math.max(2, this.cs * 0.035), 0xb94876, 0.74);
                this.rugGraphic.strokeRoundedRect(rugX, rugY, rugW, rugH, radius);

                const innerPad = Math.max(8, this.cs * 0.18);
                this.rugGraphic.lineStyle(Math.max(2, this.cs * 0.022), 0xffc1cf, 0.46);
                this.rugGraphic.strokeRoundedRect(
                    rugX + innerPad,
                    rugY + innerPad,
                    rugW - innerPad * 2,
                    rugH - innerPad * 2,
                    Math.max(2, radius - innerPad)
                );
            }

            drawChevronStripe(x, y, w, h) {
                const midX = x + w * 0.55;
                const notch = w * 0.42;
                const points = [
                    new Phaser.Geom.Point(x, y),
                    new Phaser.Geom.Point(midX, y),
                    new Phaser.Geom.Point(midX + notch, y + h * 0.16),
                    new Phaser.Geom.Point(midX, y + h * 0.32),
                    new Phaser.Geom.Point(midX + notch, y + h * 0.48),
                    new Phaser.Geom.Point(midX, y + h * 0.64),
                    new Phaser.Geom.Point(midX + notch, y + h * 0.80),
                    new Phaser.Geom.Point(midX, y + h),
                    new Phaser.Geom.Point(x, y + h),
                    new Phaser.Geom.Point(x + notch, y + h * 0.80),
                    new Phaser.Geom.Point(x, y + h * 0.64),
                    new Phaser.Geom.Point(x + notch, y + h * 0.48),
                    new Phaser.Geom.Point(x, y + h * 0.32),
                    new Phaser.Geom.Point(x + notch, y + h * 0.16)
                ];

                this.rugGraphic.fillStyle(0xffc1ca, 0.24);
                this.rugGraphic.fillPoints(points, true);
            }

            drawBoard() {
                this.boardGraphic.clear();
                
                // Считываем текущие настройки разделения и закругления клеток
                let gap = this.gridGap !== undefined ? this.gridGap : parseInt(localStorage.getItem('jellycats_grid_gap') || '4');
                let radius = this.gridRadius !== undefined ? this.gridRadius : parseInt(localStorage.getItem('jellycats_grid_radius') || '4');
                
                // Считываем цвет и толщину обводки из настроек
                let highlightColor = parseInt((this.gridHighlightColor || '#10b981').replace('#', '0x'), 16);
                let thickness = this.gridLineThickness !== undefined ? this.gridLineThickness : 2;

                // Рисуем отдельные ячейки-плитки с тонким разделением между ними, как на референсе
                for (let r = 0; r < this.activeGridRows; r++) {
                    for (let c = 0; c < this.activeGridCols; c++) {
                        // Расчет координат отдельной ячейки с учетом зазора
                        let cellX = this.boardX + c * this.cs + gap / 2;
                        let cellY = this.boardY + r * this.cs + gap / 2;
                        let cellSize = this.cs - gap;

                        // Проверяем, занята ли эта клетка
                        let cellValue = this.grid && this.grid[r] ? this.grid[r][c] : null;
                        if (cellValue === '__hole__') continue;
                        let isObstacle = cellValue === '__obstacle__';
                        let isOccupied = cellValue !== null;

                        // Проверяем, находится ли клетка в предпросмотре (при наложении перетаскиваемой фигуры)
                        let previewCell = this.previewGridCells && this.previewGridCells.find(cell => cell.r === r && cell.c === c);

                        if (previewCell) {
                            // Клетка в режиме предпросмотра (зеленая/красная в зависимости от занятости)
                            let color = previewCell.status === 'valid' ? highlightColor : 0xef5350; // Мягкий красный цвет для занятых

                            // Фон: мягкий полупрозрачный цвет (прозрачность 0.22)
                            this.boardGraphic.fillStyle(color, 0.22);
                            this.boardGraphic.fillRoundedRect(cellX, cellY, cellSize, cellSize, radius);

                            // Рамка: яркий контур (прозрачность 0.95)
                            this.boardGraphic.lineStyle(thickness, color, 0.95);
                            this.boardGraphic.strokeRoundedRect(cellX, cellY, cellSize, cellSize, radius);
                        } else if (isObstacle) {
                            const obstacleMode = this.getObstacleVisualMode();
                            if (obstacleMode === 'soft-pad') {
                                this.boardGraphic.fillStyle(0x5a2f2b, 0.22);
                                this.boardGraphic.fillRoundedRect(cellX + cellSize * 0.04, cellY + cellSize * 0.2, cellSize * 0.92, cellSize * 0.62, radius * 1.8);
                                this.boardGraphic.fillStyle(0xfff1ef, 0.16);
                                this.boardGraphic.fillRoundedRect(cellX + cellSize * 0.12, cellY + cellSize * 0.1, cellSize * 0.76, cellSize * 0.54, radius * 1.2);
                            } else if (obstacleMode === 'muted-cell') {
                                this.boardGraphic.fillStyle(0x1f6f3b, 0.24);
                                this.boardGraphic.fillRoundedRect(cellX, cellY, cellSize, cellSize, radius);
                                this.boardGraphic.lineStyle(Math.max(2, thickness), 0x1f8f48, 0.5);
                                this.boardGraphic.strokeRoundedRect(cellX, cellY, cellSize, cellSize, radius);
                            }
                        } else if (isOccupied) {
                            // Изысканный выбранный цвет для занятой клетки
                            // Фон: остается обычным полупрозрачным белым (прозрачность 0.18) или закрашивается цветом выделения
                            if (this.fillOccupied) {
                                this.boardGraphic.fillStyle(highlightColor, 0.22);
                            } else {
                                this.boardGraphic.fillStyle(0xffffff, 0.18);
                            }
                            this.boardGraphic.fillRoundedRect(cellX, cellY, cellSize, cellSize, radius);

                            // Рамка: яркий выбранный контур (прозрачность 0.95)
                            this.boardGraphic.lineStyle(thickness, highlightColor, 0.95);
                            this.boardGraphic.strokeRoundedRect(cellX, cellY, cellSize, cellSize, radius);
                        } else {
                            // Обычная пустая клетка (мягкий белый цвет)
                            // Фон: белый (прозрачность 0.18)
                            this.boardGraphic.fillStyle(0xffffff, 0.18);
                            this.boardGraphic.fillRoundedRect(cellX, cellY, cellSize, cellSize, radius);

                            // Рамка: белый (прозрачность 0.95)
                            this.boardGraphic.lineStyle(thickness, 0xffffff, 0.95);
                            this.boardGraphic.strokeRoundedRect(cellX, cellY, cellSize, cellSize, radius);
                        }
                    }
                }
            }
            updateBlocksVisibility() {
                const show = this.showBlocks !== undefined ? this.showBlocks : true;
                
                this.pieces.forEach(p => {
                    p.list.forEach(child => {
                        // Если это фоновая подушка блока (имеет текстуру block_base)
                        if (child.texture && child.texture.key === 'block_base') {
                            child.setAlpha(show ? 0.45 : 0.0);
                        }
                    });
                    
                    if (p.ghost) {
                        p.ghost.list.forEach(child => {
                            if (child.texture && child.texture.key === 'block_base') {
                                child.setAlpha(show ? 0.4 : 0.0);
                            }
                        });
                    }
                });
            }

            setGlobalZoom(zoomVal) {
                this.currentZoom = zoomVal;
                this.cameras.main.setZoom(zoomVal);

                // Update text label
                const label = document.getElementById('zoom-value-label');
                if (label) {
                    label.textContent = `${Math.round(zoomVal * 100)}%`;
                }
            }
}
