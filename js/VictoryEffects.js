/**
 * VictoryEffects creates short-lived celebratory particles from the active board.
 * It avoids continuous emitters so every burst can be cleaned up immediately.
 */
class VictoryEffects {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.delayedCalls = [];
        this.depth = 80;
        this.variants = new Set(['soft-confetti', 'sparkle-stars', 'cell-pop', 'mixed-gentle', 'off']);
    }

    play(variant = 'sparkle-stars') {
        const effect = this.variants.has(variant) ? variant : 'sparkle-stars';
        this.cleanup();
        if (effect === 'off') return;

        const board = this.getBoardData();
        if (!board || board.cells.length === 0) return;

        if (effect === 'soft-confetti') {
            this.spawnSoftConfetti(board);
        } else if (effect === 'cell-pop') {
            this.spawnCellPop(board);
        } else if (effect === 'mixed-gentle') {
            this.spawnMixedGentle(board);
        } else {
            this.spawnSparkleStars(board);
        }
    }

    preview() {
        this.play(this.scene.selectedVictoryEffect || 'sparkle-stars');
    }

    cleanup() {
        this.delayedCalls.forEach(call => call.remove(false));
        this.delayedCalls = [];

        this.particles.forEach(particle => {
            if (!particle || !particle.scene) return;
            this.scene.tweens.killTweensOf(particle);
            particle.destroy();
        });
        this.particles = [];
    }

    getBoardData() {
        const scene = this.scene;
        if (!scene.cs || scene.boardX === undefined || scene.boardY === undefined) return null;

        const centerX = scene.boardX + (scene.activeGridCols * scene.cs) / 2;
        const centerY = scene.boardY + (scene.activeGridRows * scene.cs) / 2;
        const cells = [];

        for (let r = 0; r < scene.activeGridRows; r++) {
            for (let c = 0; c < scene.activeGridCols; c++) {
                const value = scene.grid && scene.grid[r] ? scene.grid[r][c] : null;
                if (value === null && !this.isPreviewableBoard()) continue;
                cells.push({
                    c,
                    r,
                    value,
                    x: scene.boardX + c * scene.cs + scene.cs / 2,
                    y: scene.boardY + r * scene.cs + scene.cs / 2,
                    distance: Phaser.Math.Distance.Between(
                        centerX,
                        centerY,
                        scene.boardX + c * scene.cs + scene.cs / 2,
                        scene.boardY + r * scene.cs + scene.cs / 2
                    )
                });
            }
        }

        return {
            centerX,
            centerY,
            cellSize: scene.cs,
            cells: cells.length ? cells : this.getAllBoardCells(centerX, centerY)
        };
    }

    isPreviewableBoard() {
        const scene = this.scene;
        if (!scene.grid) return true;
        return scene.grid.every(row => row.every(cell => cell === null || cell === '__obstacle__'));
    }

    getAllBoardCells(centerX, centerY) {
        const scene = this.scene;
        const cells = [];
        for (let r = 0; r < scene.activeGridRows; r++) {
            for (let c = 0; c < scene.activeGridCols; c++) {
                const x = scene.boardX + c * scene.cs + scene.cs / 2;
                const y = scene.boardY + r * scene.cs + scene.cs / 2;
                cells.push({
                    c,
                    r,
                    value: null,
                    x,
                    y,
                    distance: Phaser.Math.Distance.Between(centerX, centerY, x, y)
                });
            }
        }
        return cells;
    }

    getParticleLimit(multiplier = 1) {
        const width = this.scene.scale.width || window.innerWidth || 1024;
        const base = width < 600 ? 72 : 112;
        return Math.max(24, Math.round(base * multiplier));
    }

    sampleCells(cells, count) {
        const shuffled = [...cells].sort(() => Math.random() - 0.5);
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(shuffled[i % shuffled.length]);
        }
        return result;
    }

    spawnSoftConfetti(board, multiplier = 1) {
        const colors = [0xff4f8b, 0xffa51f, 0xffd23f, 0x16c7d9, 0x52d66f, 0x9b6dff, 0xffffff];
        const count = Math.min(this.getParticleLimit(multiplier * 1.08), Math.max(48, board.cells.length * 9));
        this.sampleCells(board.cells, count).forEach((cell, index) => {
            const delay = index * 4;
            const call = this.scene.time.delayedCall(delay, () => {
                const particle = this.createParticle('victory_confetti', cell, Phaser.Utils.Array.GetRandom(colors));
                const angle = Phaser.Math.Angle.Between(board.centerX, board.centerY, cell.x, cell.y) + Phaser.Math.FloatBetween(-0.8, 0.8);
                const distance = Phaser.Math.FloatBetween(board.cellSize * 1.35, board.cellSize * 3.15);
                const driftX = Math.cos(angle) * distance + Phaser.Math.FloatBetween(-28, 28);
                const driftY = Math.sin(angle) * distance + Phaser.Math.FloatBetween(-20, 44);

                particle.setScale(Phaser.Math.FloatBetween(0.74, 1.22) * (board.cellSize / 92));
                particle.setAlpha(1);
                particle.setAngle(Phaser.Math.Between(0, 180));

                this.scene.tweens.add({
                    targets: particle,
                    x: particle.x + driftX,
                    y: particle.y + driftY + board.cellSize * 0.45,
                    angle: particle.angle + Phaser.Math.Between(120, 420),
                    alpha: 0,
                    scaleX: particle.scaleX * Phaser.Math.FloatBetween(0.75, 1.05),
                    scaleY: particle.scaleY * Phaser.Math.FloatBetween(0.75, 1.05),
                    duration: Phaser.Math.Between(1050, 1500),
                    ease: 'Cubic.easeOut',
                    onComplete: () => this.destroyParticle(particle)
                });
            });
            this.delayedCalls.push(call);
        });
    }

    spawnSparkleStars(board, multiplier = 1) {
        this.spawnOutlineStars(board);

        const colors = [0xffb000, 0xffc029, 0xffd75a];
        const count = Math.min(this.getParticleLimit(multiplier * 0.28), Math.max(8, board.cells.length * 2));
        this.sampleCells(board.cells, count).forEach((cell, index) => {
            const delay = Phaser.Math.Between(80, 220) + index * 12;
            const call = this.scene.time.delayedCall(delay, () => {
                const texture = Math.random() > 0.35 ? 'victory_star' : 'victory_sparkle';
                const particle = this.createParticle(texture, cell, Phaser.Utils.Array.GetRandom(colors));
                const angle = Phaser.Math.Angle.Between(board.centerX, board.centerY, cell.x, cell.y) + Phaser.Math.FloatBetween(-1.1, 1.1);
                const distance = Phaser.Math.FloatBetween(board.cellSize * 0.45, board.cellSize * 1.1);

                particle.setScale(0.16);
                particle.setAlpha(0);

                this.scene.tweens.add({
                    targets: particle,
                    x: particle.x + Math.cos(angle) * distance,
                    y: particle.y + Math.sin(angle) * distance - Phaser.Math.FloatBetween(8, 26),
                    angle: Phaser.Math.Between(-110, 110),
                    alpha: 0,
                    scale: Phaser.Math.FloatBetween(0.78, 1.08) * (board.cellSize / 92),
                    duration: Phaser.Math.Between(720, 980),
                    ease: 'Cubic.easeOut',
                    onComplete: () => this.destroyParticle(particle)
                });
            });
            this.delayedCalls.push(call);
        });
    }

    spawnOutlineStars(board) {
        const placements = [
            {
                startX: board.centerX,
                startY: board.centerY + board.cellSize * 0.08,
                x: board.centerX - board.cellSize * 0.2,
                y: board.centerY - board.cellSize * 1.1,
                scale: 1.52,
                angle: 8,
                delay: 0,
                hold: 520
            },
            {
                startX: board.centerX - board.cellSize * 0.12,
                startY: board.centerY + board.cellSize * 0.18,
                x: board.centerX - board.cellSize * 1.62,
                y: board.centerY - board.cellSize * 0.62,
                scale: 1.18,
                angle: -16,
                delay: 95,
                hold: 430
            },
            {
                startX: board.centerX + board.cellSize * 0.16,
                startY: board.centerY + board.cellSize * 0.12,
                x: board.centerX + board.cellSize * 1.42,
                y: board.centerY - board.cellSize * 0.38,
                scale: 1.04,
                angle: 18,
                delay: 175,
                hold: 360
            },
            {
                startX: board.centerX,
                startY: board.centerY + board.cellSize * 0.18,
                x: board.centerX + board.cellSize * 0.58,
                y: board.centerY + board.cellSize * 0.22,
                scale: 0.72,
                angle: -7,
                delay: 235,
                hold: 300
            }
        ];

        placements.forEach(config => {
            const call = this.scene.time.delayedCall(config.delay, () => {
                const star = this.scene.add.image(config.startX, config.startY, 'victory_star_outline');
                star.setDepth(this.depth + 0.6);
                star.setTint(0xffc43d);
                star.setAlpha(0.92);
                star.setAngle(config.angle - 18);
                star.setScale(0.08);
                this.particles.push(star);

                this.scene.tweens.add({
                    targets: star,
                    x: config.x,
                    y: config.y,
                    alpha: 0,
                    scale: config.scale * 1.28 * (board.cellSize / 92),
                    angle: config.angle,
                    duration: 980 + config.hold,
                    ease: 'Cubic.easeOut',
                    onComplete: () => this.destroyParticle(star)
                });
            });
            this.delayedCalls.push(call);
        });
    }

    spawnCellPop(board) {
        const sortedCells = [...board.cells].sort((a, b) => a.distance - b.distance);
        const maxParticles = this.getParticleLimit(0.82);
        let emitted = 0;

        sortedCells.forEach((cell, cellIndex) => {
            const perCell = Math.min(3, Math.max(2, Math.floor(maxParticles / sortedCells.length)));
            for (let i = 0; i < perCell && emitted < maxParticles; i++) {
                emitted++;
                const delay = cellIndex * 28 + i * 18;
                const call = this.scene.time.delayedCall(delay, () => {
                    const particle = this.createParticle('victory_sparkle', cell, Phaser.Math.Between(0, 1) ? 0xfff6bc : 0xffffff);
                    const angle = (Math.PI * 2 * i) / perCell + Phaser.Math.FloatBetween(-0.45, 0.45);
                    const distance = Phaser.Math.FloatBetween(board.cellSize * 0.34, board.cellSize * 0.82);
                    particle.setScale(0.12);
                    particle.setAlpha(0.95);

                    this.scene.tweens.add({
                        targets: particle,
                        x: particle.x + Math.cos(angle) * distance,
                        y: particle.y + Math.sin(angle) * distance,
                        alpha: 0,
                        scale: Phaser.Math.FloatBetween(0.26, 0.38) * (board.cellSize / 92),
                        duration: Phaser.Math.Between(430, 620),
                        ease: 'Back.easeOut',
                        onComplete: () => this.destroyParticle(particle)
                    });
                });
                this.delayedCalls.push(call);
            }
        });
    }

    spawnMixedGentle(board) {
        this.spawnSparkleStars(board, 0.48);
        const call = this.scene.time.delayedCall(120, () => this.spawnSoftConfetti(board, 0.36));
        this.delayedCalls.push(call);
    }

    createParticle(texture, cell, tint) {
        const particle = this.scene.add.image(
            cell.x + Phaser.Math.FloatBetween(-4, 4),
            cell.y + Phaser.Math.FloatBetween(-4, 4),
            texture
        );
        particle.setDepth(this.depth + Phaser.Math.FloatBetween(0, 0.5));
        particle.setTint(tint);
        particle.setBlendMode(Phaser.BlendModes.NORMAL);
        this.particles.push(particle);
        return particle;
    }

    destroyParticle(particle) {
        const index = this.particles.indexOf(particle);
        if (index >= 0) this.particles.splice(index, 1);
        if (particle && particle.scene) particle.destroy();
    }
}
