import Phaser from "phaser";

export default class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("loading", "assets/bank-panic/loading.png");
  }

  create() {
    this.scene.start("Preloader");
  }
}
