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
        const character = this.add.sprite(100, 500, 'Bricks Main Character');
        character.setScale(25);
        if (character.setAntialias) {
            character.setAntialias(false);
        }

        // --- Platform logic ---
        // Platform parameters
        const platformWidth = character.displayWidth * 1.1;
        const platformHeight = 32; // or use the actual height of your platform image

        // Calculate max jump distance based on jump velocity, gravity, and platform speed
        // Time to apex: t = -jumpVelocity / gravity
        // Total air time: T = 2 * t
        // Max horizontal distance: maxJumpDist = platformSpeed * T
        const jumpVelocity = -18;
        const gravity = 1.2;
        const platformSpeed = 4;
        const timeToApex = Math.abs(jumpVelocity) / gravity;
        const totalAirTime = 2 * timeToApex;
        const maxJumpDist = platformSpeed * totalAirTime;

        // Set platformGap to be a bit less than maxJumpDist for playability
        // Reduce the multiplier to bring platforms a bit closer together
        const platformGap = Math.min(character.displayWidth * 1.5, maxJumpDist * 0.75);
        const platformYStep = character.displayHeight * 0.7 // vertical step for jumping
        const numPlatforms = Math.ceil(this.scale.width / (platformWidth + platformGap)) + 2;

        // Create a group for platforms
        this.platforms = this.add.group();

        // Fill the screen with platforms at different heights
        let x = 0;
        let lastY = 600;
        let platformGaps = [];
        for (let i = 0; i < numPlatforms; i++)
        {
            // Restrict vertical step so platforms are always reachable by jump
            let minY = 300;
            let maxY = this.scale.height - platformHeight - 10;
            // Limit the vertical difference between platforms to the max jump height
            const maxJumpHeight = Math.abs(jumpVelocity * jumpVelocity / (2 * gravity));
            let yStep = Phaser.Math.Between(-platformYStep, platformYStep);
            // Clamp so the next platform is not higher than maxJumpHeight above the last
            if (yStep < 0 && Math.abs(yStep) > maxJumpHeight)
            {
                yStep = -maxJumpHeight;
            }
            let y = Phaser.Math.Clamp(
                lastY + yStep,
                minY,
                maxY
            );
            // Randomize platform gap between 1.0x and 1.5x character width
            const randomGapMultiplier = Phaser.Math.FloatBetween(1.0, 1.5);
            const randomPlatformGap = character.displayWidth * randomGapMultiplier;
            platformGaps.push(randomPlatformGap);

            const platform = this.add.image(x, y, 'Bricks Platform');
            platform.setOrigin(0, 0);
            platform.setDisplaySize(platformWidth, platformHeight);
            this.textures.get('Bricks Platform').setFilter(Phaser.Textures.FilterMode.NEAREST);
            this.platforms.add(platform);
            x += platformWidth + randomPlatformGap;
            lastY = y;
        }

        // Place the character on the first platform
        const firstPlatform = this.platforms.getChildren()[0];
        character.x = firstPlatform.x + platformWidth / 2;
        character.y = firstPlatform.y - character.displayHeight / 2;
        this.groundY = character.y;

        // --- Jump logic ---
        this.isJumping = false;
        this.jumpVelocity = jumpVelocity;
        this.gravity = gravity;
        this.velocityY = 0;

        this.input.keyboard.on('keydown', (event) => {
            if (!this.isJumping && (event.code === 'Space' || event.code === 'ArrowUp'))
            {
                this.isJumping = true;
                this.velocityY = this.jumpVelocity;
            }
        });

        // --- Platform movement and collision ---
        this.platformSpeed = 2; // Slower platform speed (was 4)
        const normalGravity = gravity;
        const fastFallGravity = 8.5; // Increased for faster falling

        // Store platformGaps for recycling
        this.platformGaps = platformGaps;

        this.events.on('update', () => {
            // Move platforms to the left
            this.platforms.getChildren().forEach(platform => {
                platform.x -= this.platformSpeed;
            });

            // Recycle platforms that go off screen
            this.platforms.getChildren().forEach((platform, idx) => {
                if (platform.x + platform.displayWidth < 0)
                {
                    // Find the rightmost platform
                    let rightmost = this.platforms.getChildren().reduce((max, p) =>
                        p.x > max.x ? p : max, platform);
                    // New y position
                    let minY = 300;
                    let maxY = this.scale.height - platformHeight - 10;
                    let yStep = Phaser.Math.Between(-platformYStep, platformYStep);
                    const maxJumpHeight = Math.abs(jumpVelocity * jumpVelocity / (2 * gravity));
                    if (yStep < 0 && Math.abs(yStep) > maxJumpHeight) {
                        yStep = -maxJumpHeight;
                    }
                    let y = Phaser.Math.Clamp(
                        rightmost.y + yStep,
                        minY,
                        maxY
                    );
                    // Generate a new random gap for this recycled platform
                    const randomGapMultiplier = Phaser.Math.FloatBetween(1.0, 1.5);
                    const randomPlatformGap = character.displayWidth * randomGapMultiplier;
                    this.platformGaps[idx] = randomPlatformGap;

                    platform.x = rightmost.x + platformWidth + randomPlatformGap;
                    platform.y = y;
                }
            });

            // Collision detection: check if character lands on a platform
            let landed = false;
            this.platforms.getChildren().forEach(platform => {
                // Land if any part of the character's bottom overlaps the platform (use <= and > for correct edge case)
                const prevBottom = character.y + character.displayHeight / 2 - (this.velocityY || 0);
                const currBottom = character.y + character.displayHeight / 2;
                const left = character.x - character.displayWidth / 2;
                const right = character.x + character.displayWidth / 2;
                const platformLeft = platform.x;
                const platformRight = platform.x + platform.displayWidth;
                const horizontalOverlap = right > platformLeft && left < platformRight;
                const wasAbove = prevBottom <= platform.y;
                const nowOnOrBelow = currBottom >= platform.y && prevBottom <= platform.y + platformHeight;
                const falling = this.velocityY >= 0;
                const onPlatform =
                    wasAbove &&
                    nowOnOrBelow &&
                    horizontalOverlap &&
                    falling;
                if (onPlatform)
                {
                    character.y = platform.y - character.displayHeight / 2;
                    this.groundY = character.y;
                    this.isJumping = false;
                    this.velocityY = 0;
                    landed = true;
                }
            });

            // Character jump/fall
            if (this.isJumping)
            {
                character.y += this.velocityY;
                this.velocityY += normalGravity;
            }
            // Allow character to fall and land even if not jumping
            if (!landed && !this.isJumping)
            {
                character.y += fastFallGravity; // Use faster gravity here
            }

            // Update stopwatch if active
            if (this.stopwatchActive) {
                this.elapsedTime += this.game.loop.delta / 1000;
                this.stopwatchText.setText(this.elapsedTime.toFixed(2));
            }

            // If not landed and character is completely below the screen, reset to first platform
            if (!landed && character.y - character.displayHeight / 2 > this.scale.height)
            {
                // Stop the stopwatch
                this.stopwatchActive = false;

                const firstPlatform = this.platforms.getChildren()[0];
                character.x = firstPlatform.x + platformWidth / 2;
                character.y = firstPlatform.y - character.displayHeight / 2;
                this.groundY = character.y;
                this.isJumping = false;
                this.velocityY = 0;

                // Optionally, reset stopwatch after a short delay
                this.time.delayedCall(1000, () => {
                    this.elapsedTime = 0;
                    this.stopwatchActive = true;
                });
            }

            // Ensure animation keeps playing
            character.anims.play('Bricks Main Character', true);
        });
    }

    update()
    {
        this.events.emit('update');
    }
}
