/**
 * LevelManager - localStorage-backed accepted level library.
 */
class LevelManager {
    constructor(storageKey = 'jellycats_levels') {
        this.storageKey = storageKey;
    }

    getLevels() {
        try {
            const levels = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
            return Array.isArray(levels) ? this.normalizeLevels(levels) : [];
        } catch (err) {
            return [];
        }
    }

    saveLevels(levels) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.serializeLevels(levels)));
    }

    acceptLevel(level) {
        const levels = this.getLevels();
        const existing = this.findMatchingLevel(level, levels);
        if (existing) return existing;

        const saved = {
            ...level,
            id: level.id && !level.id.startsWith('candidate-') ? level.id : `level-${Date.now()}-${levels.length + 1}`,
            name: level.name || `Level ${levels.length + 1}`,
            order: levels.length,
            status: 'saved',
            savedAt: new Date().toISOString()
        };
        levels.push(saved);
        this.saveLevels(levels);
        return saved;
    }

    deleteLevel(id) {
        this.saveLevels(this.getLevels().filter(level => level.id !== id));
    }

    moveLevel(id, direction) {
        const levels = this.getLevels();
        const index = levels.findIndex(level => level.id === id);
        if (index === -1) return levels;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= levels.length) return levels;

        [levels[index], levels[targetIndex]] = [levels[targetIndex], levels[index]];
        this.saveLevels(levels);
        return this.getLevels();
    }

    getLevelIndex(id) {
        return this.getLevels().findIndex(level => level.id === id);
    }

    getNextLevel(id) {
        const levels = this.getLevels();
        if (levels.length === 0) return null;
        const index = this.getLevelIndex(id);
        return levels[index === -1 ? 0 : (index + 1) % levels.length];
    }

    getPreviousLevel(id) {
        const levels = this.getLevels();
        if (levels.length === 0) return null;
        const index = this.getLevelIndex(id);
        return levels[index === -1 ? levels.length - 1 : (index - 1 + levels.length) % levels.length];
    }

    findMatchingLevel(level, levels = this.getLevels()) {
        const signature = this.getLevelSignature(level);
        return levels.find(saved => this.getLevelSignature(saved) === signature) || null;
    }

    isLevelSaved(level) {
        return !!this.findMatchingLevel(level);
    }

    normalizeLevels(levels) {
        return [...levels]
            .sort((a, b) => {
                const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
                const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            })
            .map((level, index) => ({
                ...level,
                order: index,
                status: 'saved'
            }));
    }

    serializeLevels(levels) {
        return [...levels].map((level, index) => ({
            ...level,
            order: index,
            status: 'saved'
        }));
    }

    getLevelSignature(level) {
        if (!level) return '';
        const normalizePlacements = (level.placements || []).map(placement => ({
            pieceId: placement.pieceId,
            x: placement.x,
            y: placement.y,
            rotation: placement.rotation,
            cells: placement.cells
        })).sort((a, b) => a.pieceId.localeCompare(b.pieceId));
        const normalizeObstacles = (level.obstacles || []).map(obstacle => ({
            x: obstacle.x,
            y: obstacle.y,
            type: obstacle.type || 'plant',
            assetKey: obstacle.assetKey || ''
        })).sort((a, b) => a.y - b.y || a.x - b.x || a.type.localeCompare(b.type));
        return JSON.stringify({
            grid: level.grid,
            pieceIds: [...(level.pieceIds || [])].sort(),
            placements: normalizePlacements,
            obstacles: normalizeObstacles,
            difficulty: level.difficulty || ''
        });
    }

    exportPayload() {
        return {
            app: 'Jellycats',
            version: 'levels-v1',
            exportedAt: new Date().toISOString(),
            levels: this.getLevels()
        };
    }
}
