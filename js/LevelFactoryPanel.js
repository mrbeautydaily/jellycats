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

        this.bindControls();
        this.renderPieces();
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
        });
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
        this.setStatus(`${level.name}: ${level.pieceIds.length} cats, ${level.grid.cols}x${level.grid.rows}, ${level.obstacles.length} blocks.`);
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
            btn.textContent = `${index + 1}. ${level.difficulty} ${level.grid.cols}x${level.grid.rows} · ${level.pieceIds.length} cats`;
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
