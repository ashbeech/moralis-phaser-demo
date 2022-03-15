import Phaser from "phaser";
import Boot from "./scenes/Boot.js";
import Preloader, { authEvents, AUTH } from "./scenes/Preloader.js";
import MainMenu from "./scenes/MainMenu.js";
import MainGame from "./scenes/Game.js";
import { useState, useEffect } from "react";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";

import {
  useMoralis,
  useMoralisWeb3Api,
  useMoralisWeb3ApiCall,
} from "react-moralis";

let game = null;

const initState = { players: [], score: 0, gameOver: false };

//event types
export const GET_PLAYERS = "GET_PLAYERS";
export const LOGIN_PLAYER = "LOGIN_PLAYER";
export const UPDATE_SCORE = "UPDATE_SCORE";
export const GAME_OVER = "GAME_OVER";

// reducer
function reducer(state = initState, action) {
  switch (action.type) {
    case GET_PLAYERS:
      return { ...state, players: action.players };
    case LOGIN_PLAYER:
      game.events.emit("LOGIN_PLAYER", "Check Block at Time of Game Over");
      return { ...state, players: [...state.players, action.player] };
    case UPDATE_SCORE:
      return { ...state, score: action.score };
    case GAME_OVER:
      // emit Phaser game event to trigger on-chain
      game.events.emit("BLOCK_CHECK", "Check Block at Time of Game Over");
      return { ...state, gameOver: true };
    default:
      return state;
  }
}

// redux
export const events = createStore(
  reducer,
  applyMiddleware(thunkMiddleware, createLogger())
);

function App() {
  const { authenticate, isAuthenticated, isAuthenticating, logout } =
    useMoralis();
  const [loaded, setLoaded] = useState(false);
  const [block, setBlock] = useState("100000"); // <-- example block height

  // TODO: right contract and interface with it via useweb3executefunction()
  // https://github.com/MoralisWeb3/react-moralis/#useweb3executefunction

  // test connection to a connected chain
  const Web3Api = useMoralisWeb3Api();
  const { fetch, data } = useMoralisWeb3ApiCall(Web3Api.native.getBlock, {
    block_number_or_hash: block,
  });

  // update feedback on re-renders
  useEffect(() => {
    if (data) {
      console.log("BLOCK DATA:", data);
    }
  }, [data]);

  function startGame() {
    // communicate to Phaser game that player is authenticated
    //if (user) {
    authEvents.dispatch({ type: AUTH, score: 0 });
    //}
  }

  const login = async () => {
    if (!isAuthenticated) {
      await authenticate({ signingMessage: "Log in using Moralis" })
        .then(function (user) {
          console.log("logged in user:", user);
          console.log(user?.get("ethAddress"));
          console.log("AUTHENTICATED:", isAuthenticated);
          startGame();
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  };

  // TODO: add logout functionality to game
  const logOut = async () => {
    await logout();
    console.log("logged out");
  };

  if (!loaded) {
    setLoaded(true);
    const config = {
      type: Phaser.AUTO,
      //gameTitle: "ReactJS x Phaser x Moralis",
      parent: "game-container",
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
      autoFocus: true,
      fps: {
        target: 60,
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 200 },
          debug: false,
        },
      },
      backgroundColor: "#282c34",
      scale: {
        mode: Phaser.Scale.ScaleModes.NONE,
      },
      scene: [Boot, Preloader, MainMenu, MainGame],
    };
    // init 2d game (Phaser canvas element)
    if (game === null) {
      game = new Phaser.Game(config);
    }

    // listen to in-game events
    // before starting we sign in with wallet
    game.events.on("LOGIN_PLAYER", (event) => {
      console.log("⛓⛓⛓ Login via Web3 Wallet ⛓⛓⛓");
      // trigger wallet authentication
      //logOut();
      login();
    });
    // when GAME_OVER interact with chain
    game.events.on("BLOCK_CHECK", (event) => {
      console.log("⛓⛓⛓ Game Event Triggered Web3 Func ⛓⛓⛓");
      // trigger fetching of on-chain data to test connection
      fetch();
    });
  }

  return <></>;
}

export default App;
