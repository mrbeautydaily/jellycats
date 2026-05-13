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
            return Array.isArray(levels) ? levels : [];
        } catch (err) {
            return [];
        }
    }

    saveLevels(levels) {
        localStorage.setItem(this.storageKey, JSON.stringify(levels));
    }

    acceptLevel(level) {
        const levels = this.getLevels();
        const saved = {
            ...level,
            id: level.id && !level.id.startsWith('candidate-') ? level.id : `level-${Date.now()}`,
            name: level.name || `Level ${levels.length + 1}`,
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

    exportPayload() {
        return {
            app: 'Jellycats',
            version: 'levels-v1',
            exportedAt: new Date().toISOString(),
            levels: this.getLevels()
        };
    }
}
