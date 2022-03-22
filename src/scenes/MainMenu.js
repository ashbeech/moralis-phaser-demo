import Phaser from "phaser";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";

// Phaser event emitter
var emitter = new Phaser.Events.EventEmitter();

// initial vars for game (optional)
const initState = { player: {}, score: 0, nft: "", gameOver: false };

// reducer
function reducer(state = initState, action) {
  switch (action.type) {
    case LOAD_NFT:
      emitter.emit("LOAD_NFT", action);
      return { ...state };
    default:
      return state;
  }
}

// event types
export const LOAD_NFT = "LOAD_NFT";
let valid_nft_image = "";

// redux
export const nftEvents = createStore(
  reducer,
  applyMiddleware(thunkMiddleware, createLogger())
);

export default class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");

    // 6.
    // display image from metadata (demoNFTimageURL = event.nft) in game

    // set-up an event handler for loading a valid NFT
    emitter.on("LOAD_NFT", (event) => {
      // check user has signed-in; id exists
      console.log("NFT:", event.nft);
      // set it for use later
      valid_nft_image = event.nft;
    });
  }

  // 7.
  // in Phaser we need to load outside URL before displaying
  preload() {
    // set identifier as 'validnft' for image url
    this.load.image("validnft", valid_nft_image);
  }

  create() {
    this.add.image(512, 384, "title");
    // 8.
    // display valid NFT within game's mainmenu to demonstrate it worked
    this.add.image(512, 384, "validnft");
    let sign = this.add.image(512, -400, "logo");

    this.tweens.add({
      targets: sign,
      y: 180,
      ease: "Bounce.easeOut",
      duration: 2000,
    });

    let cactus1 = this.add.image(150, 680, "assets", "cactus");
    let cactus2 = this.add.image(880, 680, "assets", "cactus").setFlipX(true);

    this.tweens.add({
      targets: cactus1,
      props: {
        scaleX: { value: 0.9, duration: 250 },
        scaleY: { value: 1.1, duration: 250 },
        angle: { value: -20, duration: 500, delay: 250 },
        y: { value: 660, duration: 250 },
      },
      ease: "Sine.easeInOut",
      repeat: -1,
      yoyo: true,
    });

    this.tweens.add({
      targets: cactus2,
      props: {
        scaleX: { value: 0.9, duration: 250 },
        scaleY: { value: 1.1, duration: 250 },
        angle: { value: 20, duration: 500, delay: 250 },
        y: { value: 660, duration: 250 },
      },
      ease: "Sine.easeInOut",
      repeat: -1,
      yoyo: true,
    });

    this.music = this.sound.play("music", { loop: true });

    this.input.once("pointerdown", () => {
      this.sound.stopAll();

      this.sound.play("shot");

      this.scene.start("MainGame");
    });
  }
}
