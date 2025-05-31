import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // Set texture scale mode to NEAREST for pixel-perfect scaling
        this.textures.get('Bricks Background').setFilter(Phaser.Textures.FilterMode.NEAREST);

        const bg = this.add.image(0, 0, 'Bricks Background').setOrigin(0, 0);
        bg.setDisplaySize(this.scale.width, this.scale.height);

        const config = {
            key: 'Bricks Main Character',
            frames: this.anims.generateFrameNumbers('Bricks Main Character', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        };

        this.textures.get('Bricks Main Character').setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.anims.create(config);

        // Add and scale the main character sprite
        const character = this.add.sprite(100, 500, 'Character').play('Bricks Main Character');
        character.setScale(25); // Adjust scale factor as needed
        if (character.setAntialias) {
            character.setAntialias(false);
        }

        // Add Bricks Platform under the Character
        const platform = this.add.image(character.x, character.y + character.displayHeight / 2 + 10, 'Bricks Platform');
        platform.setOrigin(0.5, 0); // Top-center origin
        // Optionally scale the platform to match the character's width
        platform.setDisplaySize(character.displayWidth, platform.height);
        // Disable anti-aliasing for the platform
        this.textures.get('Bricks Platform').setFilter(Phaser.Textures.FilterMode.NEAREST);

        // --- Jump logic ---
        this.isJumping = false;
        this.jumpVelocity = -18; // upward velocity
        this.gravity = 1.2;
        this.groundY = character.y;
        this.velocityY = 0;

        this.input.keyboard.on('keydown', (event) => {
            if (!this.isJumping && (event.code === 'Space' || event.code === 'ArrowUp')) {
                this.isJumping = true;
                this.velocityY = this.jumpVelocity;
            }
        });

        // Animation will always run since it's set to repeat: -1
        // Only update character's y position for jump
        this.events.on('update', () => {
            if (this.isJumping) {
                character.y += this.velocityY;
                this.velocityY += this.gravity;
                if (character.y >= this.groundY) {
                    character.y = this.groundY;
                    this.isJumping = false;
                    this.velocityY = 0;
                }
            }
            // Platform stays at ground level
            platform.y = this.groundY + character.displayHeight / 2;
        });
    }
}
