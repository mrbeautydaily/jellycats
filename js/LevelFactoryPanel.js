/**
 * LevelFactoryPanel - DOM controls for generating, reviewing, and saving levels.
 */
class LevelFactoryPanel {
    constructor(scene) {
        this.scene = scene;
        this.manager = new LevelManager();
        this.generator = new LevelGenerator(PIECE_DEFS);
        this.candidates = [];
        this.activeCandidateIndex = -1;
        this.mode = 'generate';
        this.drawTool = 'free';
        this.drawRows = 6;
        this.drawCols = 6;
        this.drawCells = [];
        this.drawCandidate = null;
        this.isPainting = false;
    }

    init() {
        this.panel = document.getElementById('level-factory-panel');
        this.btnToggle = document.getElementById('btn-level-factory-toggle');
        this.btnClose = document.getElementById('btn-level-factory-close');
        this.pieceList = document.getElementById('level-piece-list');
        this.candidateList = document.getElementById('level-candidate-list');
        this.savedList = document.getElementById('saved-level-list');
        this.status = document.getElementById('level-factory-status');
        this.saveButton = document.getElementById('btn-level-save-candidate');
        this.drawGrid = document.getElementById('draw-grid');
        this.drawSummary = document.getElementById('draw-summary');
        this.drawPieceList = document.getElementById('draw-piece-list');

        this.bindControls();
        this.renderPieces();
        this.resetDrawCells();
        this.renderDrawGrid();
        this.renderCandidates();
        this.renderSavedLevels();
        this.updateHeartButton();
    }

    bindControls() {
        this.btnToggle.onclick = () => {
            this.renderPieces();
            this.panel.classList.toggle('translate-x-full');
        };
        this.btnClose.onclick = () => this.panel.classList.add('translate-x-full');

        document.getElementById('btn-level-generate').onclick = () => this.generateBatch();
        document.getElementById('btn-level-next').onclick = () => this.showNextCandidate();
        this.saveButton.onclick = () => this.acceptActiveCandidate();
        document.getElementById('btn-level-regenerate').onclick = () => this.regenerateActiveCandidate();
        document.getElementById('btn-level-rebuild').onclick = () => this.rebuildFromManualSettings();
        document.getElementById('btn-level-export').onclick = () => this.exportLevels();
        document.getElementById('btn-level-tab-generate').onclick = () => this.setMode('generate');
        document.getElementById('btn-level-tab-draw').onclick = () => this.setMode('draw');
        document.getElementById('draw-grid-cols').onchange = () => this.resizeDrawGrid();
        document.getElementById('draw-grid-rows').onchange = () => this.resizeDrawGrid();
        document.getElementById('btn-draw-clear').onclick = () => this.clearDrawGrid();
        document.getElementById('btn-draw-generate-cats').onclick = () => this.generateDrawCats();
        document.getElementById('btn-draw-preview').onclick = () => this.previewDrawLevel();
        document.getElementById('btn-draw-save').onclick = () => this.saveDrawLevel();
        document.querySelectorAll('.draw-tool').forEach(btn => {
            btn.onclick = () => this.setDrawTool(btn.dataset.drawTool);
        });
        const referenceInput = document.getElementById('draw-reference-input');
        const referenceDrop = document.getElementById('draw-reference-drop');
        if (referenceDrop && referenceInput) {
            referenceDrop.onclick = () => referenceInput.click();
            referenceInput.onchange = () => this.loadReferencePreview(referenceInput.files && referenceInput.files[0]);
        }
        document.addEventListener('pointerup', () => { this.isPainting = false; });
        const obstacleVisual = document.getElementById('level-obstacle-visual');
        if (obstacleVisual) {
            obstacleVisual.value = this.scene.obstacleVisualMode || 'soft-pad';
            const syncObstacleVisual = () => this.scene.setObstacleVisualMode(obstacleVisual.value);
            obstacleVisual.onchange = syncObstacleVisual;
            obstacleVisual.oninput = syncObstacleVisual;
        }
        const obstacleAssetSet = document.getElementById('level-obstacle-asset-set');
        if (obstacleAssetSet) {
            obstacleAssetSet.value = this.scene.obstacleAssetSet || 'current';
            const syncObstacleAssetSet = () => this.scene.setObstacleAssetSet(obstacleAssetSet.value);
            obstacleAssetSet.onchange = syncObstacleAssetSet;
            obstacleAssetSet.oninput = syncObstacleAssetSet;
        }
        const obstacleTopLayer = document.getElementById('obstacle-top-layer-toggle');
        if (obstacleTopLayer) {
            obstacleTopLayer.checked = !!this.scene.obstaclesAboveCats;
            obstacleTopLayer.onchange = () => this.scene.setObstaclesAboveCats(obstacleTopLayer.checked);
        }
        this.bindObstacleShadowControls();
    }

    bindObstacleShadowControls() {
        const controls = [
            { id: 'obstacle-x-offset', label: 'obstacle-x-offset-label', suffix: 'px', key: 'xOffset', get: () => this.scene.obstacleXOffset || 0, set: value => this.scene.setObstacleXOffset(value) },
            { id: 'obstacle-y-offset', label: 'obstacle-y-offset-label', suffix: 'px', key: 'yOffset', get: () => this.scene.obstacleYOffset || 0, set: value => this.scene.setObstacleYOffset(value) },
            { id: 'obstacle-scale', label: 'obstacle-scale-label', suffix: '%', key: 'scale', get: () => this.scene.obstacleScalePercent || 100, set: value => this.scene.setObstacleScalePercent(value) },
            { id: 'obstacle-shadow-angle', label: 'obstacle-shadow-angle-label', suffix: '°', key: 'angle' },
            { id: 'obstacle-shadow-distance', label: 'obstacle-shadow-distance-label', suffix: 'px', key: 'distance' },
            { id: 'obstacle-shadow-opacity', label: 'obstacle-shadow-opacity-label', suffix: '%', key: 'opacity' },
            { id: 'obstacle-shadow-size', label: 'obstacle-shadow-size-label', suffix: '%', key: 'size' }
        ];
        const settings = this.scene.obstacleShadowSettings || this.scene.loadObstacleShadowSettings();
        controls.forEach(control => {
            const input = document.getElementById(control.id);
            const label = document.getElementById(control.label);
            if (!input) return;
            const currentValue = control.get ? control.get() : settings[control.key];
            input.value = currentValue;
            if (label) label.textContent = `${currentValue}${control.suffix}`;
            const sync = () => {
                const value = parseInt(input.value, 10);
                if (label) label.textContent = `${value}${control.suffix}`;
                if (control.set) {
                    control.set(value);
                } else {
                    this.scene.setObstacleShadowSettings({ [control.key]: value });
                }
            };
            input.oninput = sync;
            input.onchange = sync;
        });
    }

    renderPieces() {
        this.pieceList.innerHTML = '';
        if (this.drawPieceList) this.drawPieceList.innerHTML = '';
        PIECE_DEFS.forEach(piece => {
            const label = document.createElement('label');
            label.className = 'flex items-center justify-between gap-2 rounded-lg border border-orange-100 bg-white px-2.5 py-2 text-xs font-bold text-slate-700';
            label.innerHTML = `
                <span class="flex items-center gap-2">
                    <input type="checkbox" class="level-piece-checkbox accent-orange-500" value="${piece.id}">
                    <span>${piece.id}</span>
                </span>
                <span class="text-orange-500">${piece.cells.length}</span>
            `;
            this.pieceList.appendChild(label);
            if (this.drawPieceList) {
                const drawLabel = label.cloneNode(true);
                const input = drawLabel.querySelector('input');
                if (input) input.className = 'draw-piece-checkbox accent-orange-500';
                this.drawPieceList.appendChild(drawLabel);
            }
        });
    }

    setMode(mode) {
        this.mode = mode === 'draw' ? 'draw' : 'generate';
        const generateSection = document.getElementById('level-generate-section');
        const drawSection = document.getElementById('level-draw-section');
        const generateTab = document.getElementById('btn-level-tab-generate');
        const drawTab = document.getElementById('btn-level-tab-draw');
        if (generateSection) generateSection.classList.toggle('hidden', this.mode !== 'generate');
        if (drawSection) drawSection.classList.toggle('hidden', this.mode !== 'draw');
        if (generateTab) generateTab.className = this.mode === 'generate'
            ? 'rounded-lg bg-sky-500 px-3 py-2 text-sm font-extrabold text-white'
            : 'rounded-lg px-3 py-2 text-sm font-extrabold text-slate-600 hover:bg-sky-50';
        if (drawTab) drawTab.className = this.mode === 'draw'
            ? 'rounded-lg bg-emerald-500 px-3 py-2 text-sm font-extrabold text-white'
            : 'rounded-lg px-3 py-2 text-sm font-extrabold text-slate-600 hover:bg-sky-50';
        this.renderDrawGrid();
    }

    setDrawTool(tool) {
        this.drawTool = ['free', 'obstacle', 'erase'].includes(tool) ? tool : 'free';
        document.querySelectorAll('.draw-tool').forEach(btn => {
            const active = btn.dataset.drawTool === this.drawTool;
            const activeClass = {
                free: 'draw-tool rounded-xl bg-emerald-500 px-2 py-2 text-xs font-extrabold text-white',
                obstacle: 'draw-tool rounded-xl bg-sky-500 px-2 py-2 text-xs font-extrabold text-white',
                erase: 'draw-tool rounded-xl bg-slate-500 px-2 py-2 text-xs font-extrabold text-white'
            }[btn.dataset.drawTool];
            btn.className = active
                ? activeClass
                : 'draw-tool rounded-xl bg-slate-100 px-2 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-200';
        });
    }

    resetDrawCells(fill = 'hole') {
        this.drawCells = Array(this.drawRows).fill(null).map(() => Array(this.drawCols).fill(fill));
        this.drawCandidate = null;
    }

    resizeDrawGrid() {
        const nextCols = Math.max(1, Math.min(8, parseInt(document.getElementById('draw-grid-cols').value || this.drawCols, 10)));
        const nextRows = Math.max(1, Math.min(8, parseInt(document.getElementById('draw-grid-rows').value || this.drawRows, 10)));
        document.getElementById('draw-grid-cols').value = nextCols;
        document.getElementById('draw-grid-rows').value = nextRows;
        const nextCells = Array(nextRows).fill(null).map((_, y) =>
            Array(nextCols).fill(null).map((__, x) => this.drawCells[y] && this.drawCells[y][x] ? this.drawCells[y][x] : 'hole')
        );
        this.drawCols = nextCols;
        this.drawRows = nextRows;
        this.drawCells = nextCells;
        this.drawCandidate = null;
        this.renderDrawGrid();
        this.updateDrawSummary();
    }

    clearDrawGrid() {
        this.resetDrawCells('hole');
        this.renderDrawGrid();
        this.updateDrawSummary('Draw grid cleared.');
    }

    paintDrawCell(x, y) {
        if (!this.drawCells[y] || this.drawCells[y][x] === undefined) return;
        this.drawCells[y][x] = this.drawTool === 'erase' ? 'hole' : this.drawTool;
        this.drawCandidate = null;
        this.renderDrawCell(x, y);
        this.updateDrawSummary();
    }

    renderDrawGrid() {
        if (!this.drawGrid) return;
        this.drawGrid.innerHTML = '';
        this.drawGrid.style.gridTemplateColumns = `repeat(${this.drawCols}, minmax(0, 1fr))`;
        const size = Math.max(22, Math.min(44, Math.floor(360 / Math.max(this.drawCols, this.drawRows))));
        for (let y = 0; y < this.drawRows; y++) {
            for (let x = 0; x < this.drawCols; x++) {
                const cell = document.createElement('button');
                cell.type = 'button';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.style.width = `${size}px`;
                cell.style.height = `${size}px`;
                cell.onpointerdown = event => {
                    event.preventDefault();
                    this.isPainting = true;
                    this.paintDrawCell(x, y);
                };
                cell.onpointerenter = () => {
                    if (this.isPainting) this.paintDrawCell(x, y);
                };
                this.drawGrid.appendChild(cell);
                this.renderDrawCell(x, y);
            }
        }
    }

    renderDrawCell(x, y) {
        if (!this.drawGrid) return;
        const cell = this.drawGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!cell) return;
        const state = this.drawCells[y][x];
        const base = 'rounded-md border text-[10px] font-black transition-colors';
        if (state === 'free') {
            cell.className = `${base} border-emerald-300 bg-emerald-100 text-emerald-700`;
            cell.textContent = '';
        } else if (state === 'obstacle') {
            cell.className = `${base} border-sky-300 bg-sky-100 text-sky-700`;
            cell.textContent = 'B';
        } else {
            cell.className = `${base} border-slate-100 bg-slate-50/60 text-slate-300`;
            cell.textContent = '';
        }
    }

    loadReferencePreview(file) {
        if (!file) return;
        const preview = document.getElementById('draw-reference-preview');
        const placeholder = document.getElementById('draw-reference-placeholder');
        const reader = new FileReader();
        reader.onload = () => {
            if (preview) {
                preview.src = reader.result;
                preview.classList.remove('hidden');
            }
            if (placeholder) placeholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    getDrawPieceIds() {
        if (!document.getElementById('draw-use-selected-cats').checked) return [];
        return [...document.querySelectorAll('.draw-piece-checkbox:checked')].map(input => input.value);
    }

    buildDrawOptions() {
        const holes = [];
        const obstacles = [];
        let freeCount = 0;
        for (let y = 0; y < this.drawRows; y++) {
            for (let x = 0; x < this.drawCols; x++) {
                const state = this.drawCells[y][x];
                if (state === 'free') freeCount++;
                else if (state === 'obstacle') obstacles.push({ x, y, type: 'plant' });
                else holes.push({ x, y });
            }
        }
        return {
            grid: { cols: this.drawCols, rows: this.drawRows },
            holes,
            obstacles,
            pieceIds: this.getDrawPieceIds(),
            freeCount
        };
    }

    setDrawBusy(isBusy) {
        this.isGeneratingDrawLevel = !!isBusy;
        [
            'btn-draw-generate-cats',
            'btn-draw-preview',
            'btn-draw-save',
            'btn-draw-clear'
        ].forEach(id => {
            const button = document.getElementById(id);
            if (button) button.disabled = !!isBusy;
        });
        document.querySelectorAll('.draw-tool, .draw-piece-checkbox, #draw-use-selected-cats, #draw-grid-cols, #draw-grid-rows').forEach(input => {
            input.disabled = !!isBusy;
        });
    }

    async generateDrawCats() {
        if (this.isGeneratingDrawLevel) return null;
        this.generator = new LevelGenerator(PIECE_DEFS);
        const options = this.buildDrawOptions();
        if (options.freeCount === 0) {
            this.updateDrawSummary('Paint at least one cat cell first.');
            return null;
        }
        if (document.getElementById('draw-use-selected-cats').checked && options.pieceIds.length === 0) {
            this.updateDrawSummary('Check at least one cat or turn off selected-only mode.');
            return null;
        }
        this.setDrawBusy(true);
        this.updateDrawSummary(`Generating cats for ${options.freeCount} cells...`);
        await new Promise(resolve => setTimeout(resolve, 0));
        try {
            const level = await this.generator.generateFromMaskAsync({
                ...options,
                maxMs: options.freeCount >= 48 ? 1500 : 2200,
                maxSteps: options.freeCount >= 48 ? 35000 : 65000,
                yieldEvery: 700
            });
            if (!level) {
                this.drawCandidate = null;
                const timedOut = this.generator.lastMaskFailure === 'timeout';
                this.updateDrawSummary(timedOut
                    ? 'Could not solve within time; try fewer cells or allow all cats.'
                    : 'No solvable cat set found for this drawing.');
                return null;
            }
            this.drawCandidate = level;
            this.candidates.unshift(level);
            this.activeCandidateIndex = 0;
            this.renderCandidates();
            this.previewCandidate(level);
            const usedFallback = !!this.generator.lastMaskUsedFallback;
            this.updateDrawSummary(`${usedFallback ? 'Fast-filled' : 'Generated'} ${level.pieces.length} cats for ${options.freeCount} cells.`);
            return level;
        } finally {
            this.setDrawBusy(false);
        }
    }

    async previewDrawLevel() {
        if (!this.drawCandidate) await this.generateDrawCats();
        if (this.drawCandidate) this.previewCandidate(this.drawCandidate);
    }

    async saveDrawLevel() {
        if (!this.drawCandidate) await this.generateDrawCats();
        if (!this.drawCandidate) return;
        const saved = this.manager.acceptLevel(this.drawCandidate);
        this.scene.currentLevel = saved;
        this.drawCandidate = saved;
        this.renderSavedLevels();
        this.updateHeartButton(saved);
        if (this.scene.updateLevelQuickNav) this.scene.updateLevelQuickNav();
        this.updateDrawSummary(`Saved ${saved.name}.`);
    }

    updateDrawSummary(text = null) {
        if (!this.drawSummary) return;
        if (text) {
            this.drawSummary.textContent = text;
            return;
        }
        const options = this.buildDrawOptions();
        this.drawSummary.textContent = `${options.freeCount} cat cells, ${options.obstacles.length} blocks, ${options.holes.length} empty spots.`;
    }

    generateBatch() {
        this.generator = new LevelGenerator(PIECE_DEFS);
        const options = this.getOptions();
        this.candidates = this.generator.generateBatch(options);
        this.activeCandidateIndex = this.candidates.length ? 0 : -1;
        this.renderCandidates();
        if (this.activeCandidate) this.previewCandidate(this.activeCandidate);
        this.updateHeartButton();
        this.setStatus(this.candidates.length ? `Generated ${this.candidates.length} candidate(s).` : 'No valid layouts found. Try different pieces or grid.');
    }

    showNextCandidate() {
        if (this.candidates.length === 0) {
            this.generateBatch();
            return;
        }
        this.activeCandidateIndex = (this.activeCandidateIndex + 1) % this.candidates.length;
        this.previewCandidate(this.activeCandidate);
        this.renderCandidates();
        this.updateHeartButton();
    }

    regenerateActiveCandidate() {
        const level = this.generator.generateOne(this.getOptions());
        if (!level) {
            this.setStatus('Could not regenerate with these settings.');
            return;
        }
        if (this.activeCandidateIndex >= 0) this.candidates[this.activeCandidateIndex] = level;
        else {
            this.candidates = [level];
            this.activeCandidateIndex = 0;
        }
        this.previewCandidate(level);
        this.renderCandidates();
        this.updateHeartButton();
        this.setStatus('Candidate regenerated.');
    }

    rebuildFromManualSettings() {
        const options = this.getOptions(true);
        const totalCells = options.pieceIds
            .map(id => PIECE_DEFS.find(piece => piece.id === id))
            .filter(Boolean)
            .reduce((sum, piece) => sum + piece.cells.length, 0);
        const area = options.grid.cols * options.grid.rows;
        options.obstacleCount = Math.max(0, area - totalCells);
        const level = this.generator.generateOne(options);
        if (!level) {
            this.setStatus('Manual settings do not produce a valid layout yet.');
            return;
        }
        this.candidates.unshift(level);
        this.activeCandidateIndex = 0;
        this.previewCandidate(level);
        this.renderCandidates();
        this.updateHeartButton();
        this.setStatus('Manual candidate rebuilt.');
    }

    acceptActiveCandidate() {
        const level = this.activeCandidate || this.scene.currentLevel;
        if (!level) return;

        const wasSaved = this.manager.isLevelSaved(level);
        const saved = this.manager.acceptLevel(level);
        if (this.activeCandidate && !wasSaved) {
            this.candidates.splice(this.activeCandidateIndex, 1);
            this.activeCandidateIndex = -1;
        }
        this.scene.currentLevel = saved;
        this.renderCandidates();
        this.renderSavedLevels();
        this.updateHeartButton();
        if (this.scene.updateLevelQuickNav) this.scene.updateLevelQuickNav();
        this.setStatus(wasSaved ? `${saved.name} is already in saved levels.` : `Saved ${saved.name}.`);
    }

    previewCandidate(level) {
        this.scene.loadLevel(level, true);
        document.getElementById('level-grid-cols').value = level.grid.cols;
        document.getElementById('level-grid-rows').value = level.grid.rows;
        document.getElementById('level-obstacle-count').value = level.obstacles.length;
        this.updateHeartButton(level);
        const catCount = (level.pieces || level.pieceIds || []).length;
        this.setStatus(`${level.name}: ${catCount} cats, ${level.grid.cols}x${level.grid.rows}, ${level.obstacles.length} blocks.`);
    }

    renderCandidates() {
        this.candidateList.innerHTML = '';
        if (this.candidates.length === 0) {
            this.candidateList.innerHTML = '<div class="text-xs font-semibold text-slate-400">No candidates yet.</div>';
            return;
        }
        this.candidates.forEach((level, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = [
                'w-full rounded-lg border px-3 py-2 text-left text-xs font-bold transition-colors',
                index === this.activeCandidateIndex ? 'border-orange-300 bg-orange-100 text-orange-700' : 'border-slate-100 bg-white text-slate-600 hover:bg-orange-50'
            ].join(' ');
            const catCount = (level.pieces || level.pieceIds || []).length;
            btn.textContent = `${index + 1}. ${level.difficulty} ${level.grid.cols}x${level.grid.rows} · ${catCount} cats`;
            btn.onclick = () => {
                this.activeCandidateIndex = index;
                this.previewCandidate(level);
                this.renderCandidates();
                this.updateHeartButton(level);
            };
            this.candidateList.appendChild(btn);
        });
    }

    renderSavedLevels() {
        this.savedList.innerHTML = '';
        const levels = this.manager.getLevels();
        if (levels.length === 0) {
            this.savedList.innerHTML = '<div class="text-xs font-semibold text-slate-400">No saved levels yet.</div>';
            return;
        }
        levels.forEach((level, index) => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2 py-2';
            row.innerHTML = `
                <button type="button" class="saved-level-load flex-1 text-left text-xs font-bold text-slate-700">${index + 1}. ${level.name} · ${level.grid.cols}x${level.grid.rows}</button>
                <button type="button" class="saved-level-up rounded-md bg-slate-50 px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-100 disabled:opacity-35" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button type="button" class="saved-level-down rounded-md bg-slate-50 px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-100 disabled:opacity-35" ${index === levels.length - 1 ? 'disabled' : ''}>↓</button>
                <button type="button" class="saved-level-delete rounded-md bg-rose-50 px-2 py-1 text-xs font-bold text-rose-500">Delete</button>
            `;
            row.querySelector('.saved-level-load').onclick = () => {
                this.activeCandidateIndex = -1;
                this.scene.loadLevel(level, false);
                this.renderCandidates();
                this.updateHeartButton(level);
            };
            row.querySelector('.saved-level-up').onclick = () => {
                this.manager.moveLevel(level.id, 'up');
                this.renderSavedLevels();
                if (this.scene.updateLevelQuickNav) this.scene.updateLevelQuickNav();
            };
            row.querySelector('.saved-level-down').onclick = () => {
                this.manager.moveLevel(level.id, 'down');
                this.renderSavedLevels();
                if (this.scene.updateLevelQuickNav) this.scene.updateLevelQuickNav();
            };
            row.querySelector('.saved-level-delete').onclick = () => {
                const levelName = level.name || `Level ${index + 1}`;
                if (!window.confirm(`Вы уверены, что хотите удалить уровень "${levelName}"?`)) {
                    return;
                }
                this.manager.deleteLevel(level.id);
                this.renderSavedLevels();
                this.updateHeartButton();
                if (this.scene.updateLevelQuickNav) this.scene.updateLevelQuickNav();
            };
            this.savedList.appendChild(row);
        });
    }

    exportLevels() {
        const blob = new Blob([JSON.stringify(this.manager.exportPayload(), null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jellycats_levels.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getOptions(forceManualGrid = false) {
        const pieceIds = [...document.querySelectorAll('.level-piece-checkbox:checked')].map(input => input.value);
        const grid = forceManualGrid ? {
            cols: parseInt(document.getElementById('level-grid-cols').value || GRID_COLS, 10),
            rows: parseInt(document.getElementById('level-grid-rows').value || GRID_ROWS, 10)
        } : null;
        return {
            difficulty: document.getElementById('level-difficulty').value,
            count: parseInt(document.getElementById('level-batch-count').value || 1, 10),
            minPieces: parseInt(document.getElementById('level-min-pieces').value || 2, 10),
            maxPieces: parseInt(document.getElementById('level-max-pieces').value || 4, 10),
            obstacleCount: document.getElementById('level-obstacles-enabled').checked
                ? document.getElementById('level-obstacle-count').value
                : 0,
            obstaclesEnabled: document.getElementById('level-obstacles-enabled').checked,
            pieceIds,
            grid
        };
    }

    setStatus(text) {
        if (this.status) this.status.textContent = text;
    }

    updateHeartButton(level = this.activeCandidate || this.scene.currentLevel) {
        if (!this.saveButton) return;
        const isSaved = level && this.manager.isLevelSaved(level);
        this.saveButton.textContent = isSaved ? '♥ Saved' : '♡ Save';
        this.saveButton.className = [
            'rounded-xl px-3 py-2.5 text-sm font-extrabold transition-colors',
            isSaved ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
        ].join(' ');
        this.saveButton.disabled = !level;
    }

    get activeCandidate() {
        return this.activeCandidateIndex >= 0 ? this.candidates[this.activeCandidateIndex] : null;
    }
}
