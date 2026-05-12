/**
 * DustSystem — manages atmospheric floating dust particles and Zzz sleep bubbles.
 * Dust properties (dustEnabled, dustCount, etc.) live on the scene for SettingsUI access.
 */
class DustSystem {
    constructor(scene) {
        this.scene = scene;
        scene.dustParticles = [];
    }

    /**
     * Create (or re-create) all dust particles based on current settings.
     */
    createParticles() {
        const scene = this.scene;

        // Clear any existing particles
        if (scene.dustParticles) {
            scene.dustParticles.forEach(p => p.destroy());
        }
        scene.dustParticles = [];

        if (!scene.dustEnabled) return;

        const numParticles = scene.dustCount !== undefined ? scene.dustCount : 45;
        const sizeMult = scene.dustScale !== undefined ? scene.dustScale : 1.0;

        for (let i = 0; i < numParticles; i++) {
            let coords = this.getParticleCoordsByDistribution(scene.dustDistribution || 'everywhere');
            let particle = scene.add.image(coords.x, coords.y, 'dust_particle');
            
            // Apply user-defined size multiplier to scale range (base range is 0.25 to 1.0)
            let scale = Phaser.Math.FloatBetween(0.25, 1.0) * sizeMult;
            particle.setScale(scale);
            
            // Background particles (scale < 0.5 * sizeMult) placed at -5 (behind pieces, in front of wallpaper)
            // Foreground particles placed at 15 (floating in front of cats and grid!)
            let depth = scale < 0.5 * sizeMult ? -5 : 15;
            particle.setDepth(depth);
            
            // Higher alpha values so particles are clearly visible on the light rug background
            let maxAlpha = Phaser.Math.FloatBetween(0.35, 0.75);
            particle.maxAlpha = maxAlpha;
            particle.setAlpha(0); // Start at 0 to fade in smoothly
            
            // Add beautiful soft warm tints representing cozy sunlit room dust
            const warmTints = [0xffffff, 0xfff9e6, 0xfff2d4, 0xffe9be];
            let randomTint = Phaser.Utils.Array.GetRandom(warmTints);
            particle.setTint(randomTint);
            
            // Save particle properties
            particle.baseSpeedX = Phaser.Math.FloatBetween(-0.25, 0.25);
            particle.baseSpeedY = Phaser.Math.FloatBetween(-0.15, -0.6); // Drifts upwards
            
            particle.swaySpeed = Phaser.Math.FloatBetween(0.0008, 0.0025);
            particle.swayAmount = Phaser.Math.FloatBetween(0.3, 1.0);
            particle.swayPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
            
            // Interactive velocity (for mouse push)
            particle.vx = 0;
            particle.vy = 0;
            
            // Smooth fade-in progress on startup
            particle.fadeInProgress = 0;
            particle.fadeInSpeed = Phaser.Math.FloatBetween(0.01, 0.025);
            
            scene.dustParticles.push(particle);
        }
    }

    /**
     * Update dust particles every frame.
     */
    update(time, delta) {
        const scene = this.scene;

        if (!scene.dustEnabled || !scene.dustParticles) {
            if (scene.dustParticles && scene.dustParticles.length > 0) {
                scene.dustParticles.forEach(p => p.destroy());
                scene.dustParticles = [];
            }
            return;
        }

        // Get physical background bounds once per frame for optimal performance
        let bounds = this.getBackgroundBounds();
        let pointer = scene.input.activePointer;

        scene.dustParticles.forEach(p => {
            // 1. Gently fade in on start
            if (p.fadeInProgress < 1) {
                p.fadeInProgress += p.fadeInSpeed * (delta / 16.6);
                p.setAlpha(Phaser.Math.Linear(0, p.maxAlpha, Math.min(p.fadeInProgress, 1)));
            } else {
                // Breathe effect: slow alpha pulsation so they look alive
                let breathe = Math.sin(time * p.swaySpeed + p.swayPhase) * 0.15;
                p.setAlpha(Phaser.Math.Clamp(p.maxAlpha + breathe, 0.2, 0.85));
            }

            // 2. Slow natural drift + sinusoidal horizontal sway
            let sway = Math.sin(time * p.swaySpeed + p.swayPhase) * p.swayAmount;
            let driftX = p.baseSpeedX + sway;
            let driftY = p.baseSpeedY;

            // 3. Mouse repulsion (interactive wind)
            let dx = p.x - pointer.worldX;
            let dy = p.y - pointer.worldY;
            let dist = Math.sqrt(dx * dx + dy * dy);
            const pushRadius = 150; // Distance of mouse influence

            if (dist < pushRadius && dist > 1) {
                // Stronger push the closer the mouse is
                let force = (pushRadius - dist) / pushRadius;
                let pushAngle = Math.atan2(dy, dx);
                
                // Add to velocity
                p.vx += Math.cos(pushAngle) * force * 0.6 * (delta / 16.6);
                p.vy += Math.sin(pushAngle) * force * 0.6 * (delta / 16.6);
            }

            // Apply velocities with damping (friction)
            p.x += (driftX + p.vx) * (delta / 16.6);
            p.y += (driftY + p.vy) * (delta / 16.6);

            // Slow down repulsion velocity over time (friction)
            p.vx *= 0.93;
            p.vy *= 0.93;

            // 4. Wrap around physical background edges smoothly within distribution zone
            const margin = 20;
            if (p.y < bounds.top - margin || p.y > bounds.bottom + margin || p.x < bounds.left - margin || p.x > bounds.right + margin) {
                let coords = this.getParticleCoordsByDistribution(scene.dustDistribution);
                p.x = coords.x;
                p.y = coords.y;
                p.fadeInProgress = 0;
                p.setAlpha(0);
            }
        });
    }

    /**
     * Spawn a floating Zzz text particle above a sleeping cat.
     */
    spawnZParticle(container) {
        const scene = this.scene;
        const catImg = container.list.find(child => child.isCatImage);
        if (!catImg) return;

        // Calculate the world coordinates of the cat's visual center
        let scale = container.targetScale;
        let spawnX = container.x + catImg.x * scale + Phaser.Math.FloatBetween(-15, 15) * scale;
        let spawnY = container.y + catImg.y * scale - 25 * scale + Phaser.Math.FloatBetween(-10, 10) * scale;

        let zText = Phaser.Utils.Array.GetRandom(['z', 'Z', 'zZ']);
        let zSize = Phaser.Math.Between(11, 18) * scale;

        let zSprite = scene.add.text(spawnX, spawnY, zText, {
            fontSize: `${zSize}px`,
            fontFamily: '"Outfit", "Segoe UI", sans-serif',
            fontWeight: 'bold',
            color: '#ffb088', // Soft cozy warm peach color
            stroke: '#ffffff',
            strokeThickness: 2
        });
        zSprite.setOrigin(0.5, 0.5);
        zSprite.setDepth(20); // Floats above all pieces and grid
        zSprite.setAlpha(0.85);

        // Vertical float up and fade out
        scene.tweens.add({
            targets: zSprite,
            y: spawnY - Phaser.Math.FloatBetween(50, 90) * scale,
            alpha: 0,
            angle: Phaser.Math.FloatBetween(-20, 20),
            duration: Phaser.Math.FloatBetween(1800, 2600),
            ease: 'Cubic.easeOut',
            onComplete: () => {
                zSprite.destroy();
            }
        });

        // Horizontal sway (wave) animation
        let swayDist = Phaser.Math.FloatBetween(8, 18) * scale;
        scene.tweens.add({
            targets: zSprite,
            x: spawnX + Phaser.Math.FloatBetween(-5, 5) * scale + swayDist,
            duration: Phaser.Math.FloatBetween(500, 800),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Calculate the visible background bounds for particle containment.
     */
    getBackgroundBounds() {
        const scene = this.scene;
        let w = scene.scale.width;
        let h = scene.scale.height;
        let centerX = scene.boardX + (scene.cs * 4) / 2;
        let centerY = scene.boardY + (scene.cs * 4) / 2;

        // Calculate current scaled background size
        let targetBgScale = (scene.cs * 4) / 480;
        let minScaleX = Math.max(2 * centerX / 1672, 2 * (w - centerX) / 1672);
        let minScaleY = Math.max(2 * centerY / 941, 2 * (h - centerY) / 941);
        let minScale = Math.max(minScaleX, minScaleY);
        let bgMultiplier = scene.bgScaleMultiplier !== undefined ? scene.bgScaleMultiplier : parseFloat(localStorage.getItem('jellycats_bg_scale_multiplier') || '1.0');
        let baseScale = Math.max(targetBgScale, minScale);
        let finalBgScale = baseScale * bgMultiplier;

        let bgW = 1672 * finalBgScale;
        let bgH = 941 * finalBgScale;

        return {
            left: centerX - bgW / 2,
            right: centerX + bgW / 2,
            top: centerY - bgH / 2,
            bottom: centerY + bgH / 2,
            width: bgW,
            height: bgH
        };
    }

    /**
     * Get random spawn coordinates based on the selected distribution mode.
     */
    getParticleCoordsByDistribution(dist) {
        let bounds = this.getBackgroundBounds();
        let x, y;
        
        // Use dustEdgeRatio setting, defaulting to 25% (0.25)
        let edgeRatio = this.scene.dustEdgeRatio !== undefined ? this.scene.dustEdgeRatio : 0.25;

        if (dist === 'sides') {
            // Left edgeRatio or Right edgeRatio of the background width
            if (Phaser.Math.Between(0, 1) === 0) {
                x = Phaser.Math.Between(bounds.left, bounds.left + bounds.width * edgeRatio);
            } else {
                x = Phaser.Math.Between(bounds.right - bounds.width * edgeRatio, bounds.right);
            }
            y = Phaser.Math.Between(bounds.top, bounds.bottom);
        } else if (dist === 'top') {
            // Top edgeRatio of the background height
            x = Phaser.Math.Between(bounds.left, bounds.right);
            y = Phaser.Math.Between(bounds.top, bounds.top + bounds.height * edgeRatio);
        } else if (dist === 'bottom') {
            // Bottom edgeRatio of the background height
            x = Phaser.Math.Between(bounds.left, bounds.right);
            y = Phaser.Math.Between(bounds.bottom - bounds.height * edgeRatio, bounds.bottom);
        } else {
            // everywhere across the physical background
            x = Phaser.Math.Between(bounds.left, bounds.right);
            y = Phaser.Math.Between(bounds.top, bounds.bottom);
        }

        return { x, y };
    }
}
