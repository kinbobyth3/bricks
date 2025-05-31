import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Get game size
        const { width, height } = this.sys.game.config;

        // Add and resize main-menu image to fill the screen
        const img = this.add.image(width / 2, height / 2, 'main-menu');
        img.setDisplaySize(width, height);

/*        this.add.text(512, 460, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);*/

        this.input.once('pointerdown', () => {

            this.scene.start('Game');

        });
    }
}
