// Инициализация Phaser
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.RESIZE, // Автоматический ресайз
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
