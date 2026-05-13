/**
 * LevelGenerator - builds solvable level candidates from the current PIECE_DEFS.
 */
class LevelGenerator {
    constructor(pieceDefs, maxCols = GRID_COLS, maxRows = GRID_ROWS) {
        this.pieceDefs = pieceDefs;
        this.maxCols = maxCols;
        this.maxRows = maxRows;
    }

    generateBatch(options = {}) {
        const count = parseInt(options.count || 1, 10);
        const levels = [];
        let attempts = 0;
        while (levels.length < count && attempts < count * 80) {
            attempts++;
            const level = this.generateOne({ ...options, seed: Date.now() + attempts + Math.random() });
            if (level) levels.push(level);
        }
        return levels;
    }

    generateOne(options = {}) {
        const difficulty = options.difficulty || 'easy';
        const selectedIds = Array.isArray(options.pieceIds) ? options.pieceIds : [];
        const pieces = selectedIds.length > 0
            ? this.pieceDefs.filter(p => selectedIds.includes(p.id))
            : this.pickPiecesForDifficulty(difficulty, options);
        if (pieces.length === 0) return null;

        const totalCells = pieces.reduce((sum, piece) => sum + piece.cells.length, 0);
        const obstacleCount = options.obstaclesEnabled === false ? 0 : this.getObstacleCount(difficulty, options.obstacleCount);
        const grid = options.grid || this.pickGridForArea(totalCells + obstacleCount, difficulty, options.obstaclesEnabled !== false);
        if (!grid) return null;

        const targetArea = grid.cols * grid.rows;
        const fixedObstacleCount = options.obstaclesEnabled === false ? 0 : Math.max(0, targetArea - totalCells);
        if (targetArea - fixedObstacleCount !== totalCells) return null;
        const obstacles = this.pickObstacles(grid, options.obstacles || null, fixedObstacleCount);
        const solution = this.solve(grid, pieces, obstacles, options.seed);
        if (!solution) return null;

        return {
            id: `candidate-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            name: `${difficulty} ${grid.cols}x${grid.rows}`,
            grid,
            pieceIds: pieces.map(piece => piece.id),
            placements: solution,
            obstacles,
            difficulty,
            status: 'candidate',
            createdAt: new Date().toISOString()
        };
    }

    pickPiecesForDifficulty(difficulty, options = {}) {
        const preset = {
            easy: { min: 2, max: 4, maxCells: 4 },
            medium: { min: 4, max: 6, maxCells: 5 },
            hard: { min: 6, max: 9, maxCells: 16 }
        }[difficulty] || { min: 2, max: 4, maxCells: 4 };
        const min = parseInt(options.minPieces || preset.min, 10);
        const max = parseInt(options.maxPieces || preset.max, 10);
        const targetCount = Phaser.Math.Between(min, Math.min(max, this.pieceDefs.length));
        const pool = this.shuffle(this.pieceDefs.filter(piece => piece.cells.length <= preset.maxCells));
        return pool.slice(0, targetCount);
    }

    getObstacleCount(difficulty, explicitCount) {
        if (explicitCount !== undefined && explicitCount !== '') return parseInt(explicitCount, 10);
        if (difficulty === 'easy') return Phaser.Math.Between(0, 1);
        if (difficulty === 'medium') return Phaser.Math.Between(1, 3);
        return Phaser.Math.Between(2, 5);
    }

    pickGridForArea(area, difficulty, allowExtraCells = true) {
        const candidates = [];
        for (let rows = 2; rows <= this.maxRows; rows++) {
            for (let cols = 2; cols <= this.maxCols; cols++) {
                const gridArea = cols * rows;
                if (allowExtraCells ? gridArea < area : gridArea !== area) continue;
                candidates.push({ cols, rows, score: (gridArea - area) * 10 + Math.abs(cols - rows) + gridArea * 0.01 });
            }
        }
        if (candidates.length === 0) return null;
        candidates.sort((a, b) => a.score - b.score);
        const picked = difficulty === 'hard'
            ? candidates[Math.min(candidates.length - 1, Phaser.Math.Between(0, candidates.length - 1))]
            : candidates[0];
        return { cols: picked.cols, rows: picked.rows };
    }

    pickObstacles(grid, provided, count) {
        if (Array.isArray(provided)) return provided.slice(0, count);
        const allCells = [];
        for (let y = 0; y < grid.rows; y++) {
            for (let x = 0; x < grid.cols; x++) allCells.push({ x, y, type: 'plant' });
        }
        return this.shuffle(allCells).slice(0, count);
    }

    solve(grid, pieces, obstacles, seed) {
        const blocked = new Set(obstacles.map(o => `${o.x},${o.y}`));
        const board = Array(grid.rows).fill(null).map(() => Array(grid.cols).fill(null));
        obstacles.forEach(o => board[o.y][o.x] = '__obstacle__');
        const orderedPieces = this.shuffle([...pieces], seed).sort((a, b) => b.cells.length - a.cells.length);
        const placements = [];

        const placeNext = (index) => {
            if (index >= orderedPieces.length) return true;
            const piece = orderedPieces[index];
            const variants = this.shuffle(this.getRotations(piece.cells), seed + index);
            for (const variant of variants) {
                const cells = variant.cells;
                const positions = this.shuffle(this.getCandidatePositions(grid, cells), seed + index + cells.length);
                for (const pos of positions) {
                    if (!this.canPlaceCells(board, grid, cells, pos.x, pos.y, blocked)) continue;
                    cells.forEach(([cx, cy]) => board[pos.y + cy][pos.x + cx] = piece.id);
                    placements.push({ pieceId: piece.id, x: pos.x, y: pos.y, cells, rotation: variant.rotation });
                    if (placeNext(index + 1)) return true;
                    placements.pop();
                    cells.forEach(([cx, cy]) => board[pos.y + cy][pos.x + cx] = null);
                }
            }
            return false;
        };

        return placeNext(0) ? placements : null;
    }

    getRotations(cells) {
        const variants = [];
        let current = this.normalizeCells(cells);
        for (let i = 0; i < 4; i++) {
            const key = JSON.stringify(current);
            if (!variants.some(v => JSON.stringify(v.cells) === key)) variants.push({ cells: current, rotation: i });
            current = this.normalizeCells(current.map(([x, y]) => [-y, x]));
        }
        return variants;
    }

    normalizeCells(cells) {
        const minX = Math.min(...cells.map(c => c[0]));
        const minY = Math.min(...cells.map(c => c[1]));
        return cells.map(([x, y]) => [x - minX, y - minY]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    }

    getCandidatePositions(grid, cells) {
        const maxX = Math.max(...cells.map(c => c[0]));
        const maxY = Math.max(...cells.map(c => c[1]));
        const positions = [];
        for (let y = 0; y <= grid.rows - maxY - 1; y++) {
            for (let x = 0; x <= grid.cols - maxX - 1; x++) positions.push({ x, y });
        }
        return positions;
    }

    canPlaceCells(board, grid, cells, x, y) {
        for (const [cx, cy] of cells) {
            const gx = x + cx;
            const gy = y + cy;
            if (gx < 0 || gy < 0 || gx >= grid.cols || gy >= grid.rows) return false;
            if (board[gy][gx] !== null) return false;
        }
        return true;
    }

    shuffle(items, seed = Math.random()) {
        const arr = [...items];
        let state = Math.floor((Number(seed) || Math.random()) * 1000000) || Date.now();
        const rand = () => {
            state = (state * 1664525 + 1013904223) % 4294967296;
            return state / 4294967296;
        };
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
