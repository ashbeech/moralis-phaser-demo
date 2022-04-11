import Phaser from "phaser";
import Boot from "./scenes/Boot.js";
import Preloader, { authEvents, AUTH } from "./scenes/Preloader.js";
import MainMenu, { mainMenuEvents, APPROVED } from "./scenes/MainMenu.js";
import MainGame from "./scenes/Game.js";
import { useState, useEffect } from "react";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
// import for reading metadata json file
import axios from "axios";

import {
  useMoralis,
  // P2E integration: 1. import Moralis func for contracts
  useWeb3ExecuteFunction,
} from "react-moralis";

// P2E integration: 2. create ABI dir for P2E contracts
//import { abi as tokenABI } from "./contracts/abis/GameToken.json";
import * as tokenABI from "./contracts/abis/GameToken.json";
//import { abi as P2EABI } from "./contracts/abis/P2EGame.json";

let game = null;

const initState = { player: {}, score: 0, nft: "", gameOver: false };

//event types
export const GET_PLAYER = "GET_PLAYER";
export const LOGIN_PLAYER = "LOGIN_PLAYER";
// P2E integration: 3. set-up  comms to Phaser scripts
export const APPROVE = "APPROVE";
export const UPDATE_SCORE = "UPDATE_SCORE";
export const GAME_OVER = "GAME_OVER";

const TOKEN_CONTRACT = "0x8e04737EFa4b3FBfEe20f6965032a949A7f4d0Cd"; //process.env.REACT_APP_TOKEN_CONTRACT;
//const P2E_CONTRACT = process.env.REACT_APP_P2E_CONTRACT;

// reducer
function reducer(state = initState, action) {
  switch (action.type) {
    case GET_PLAYER:
      return { ...state, player: action.player };
    case LOGIN_PLAYER:
      game.events.emit("LOGIN_PLAYER", "Login player");
      return { ...state, score: action.score };
    // P2E integration: 4. emit event to Phaser scripts
    case APPROVE:
      game.events.emit("APPROVE", "Player approves use of tokens");
      return { ...state, score: action.score };
    case UPDATE_SCORE:
      return { ...state, score: action.score };
    case GAME_OVER:
      // emit Phaser game event to trigger on-chain
      /* 
      game.events.emit(
        "BLOCK_CHECK",
        "Test Chain Connectivity: Check Some Block Data"
      );
       */
      return { ...state, score: action.score, gameOver: true };
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
  const {
    initialize,
    isInitialized,
    authenticate,
    isAuthenticated,
    user,
    logout,
    Moralis,
    web3,
    enableWeb3,
    isWeb3Enabled,
    isWeb3EnableLoading,
    web3EnableError,
  } = useMoralis();

  const [loaded, setLoaded] = useState(false);

  function startGame(_user) {
    console.log("USER:", _user);
    // communicate to Phaser game that player is authenticated
    authEvents.dispatch({ type: AUTH, player: _user });
  }

  useEffect(() => {
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading) enableWeb3();
    console.log("web3 is enabled: ", isWeb3Enabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled]);

  // web3 interface
  const { fetch } = useWeb3ExecuteFunction();

  // approve token (fungible)
  const approval = async () => {
    const options = {
      abi: tokenABI,
      contractAddress: TOKEN_CONTRACT,
      functionName: "approve",
      params: {
        spender: "0xd154B4D816FFF60893b92b6d418ef8aE5F505233",
        amount: "0",
      },
    };

    await fetch({
      params: options,
      onSuccess: (response) => console.log("TOKEN APPROVE:", response),
      onComplete: () => console.log("Fetched"),
      onError: (error) => console.log("Error", error),
    });
  };

  const login = async () => {
    if (!isAuthenticated) {
      await enableWeb3();
      console.log("Is Web3 Enabled:", isWeb3Enabled);
      await authenticate({
        signingMessage: "Log in using Moralis",
        //,   onComplete: () => alert("🎉"),
      })
        .then(function (_user) {
          console.log("logged in user:", _user);
          console.log(_user?.get("ethAddress"));
          console.log("Moralis Intialised:", isInitialized);
          console.log("Is Authenticated:", isAuthenticated);
          if (!_user) {
            // TODO: More elegantly handle failure to sign in.
            authEvents.dispatch({ type: AUTH, player: null });
            logout();
            console.log("logged out");
          } else {
            startGame(_user);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  };

  if (!loaded) {
    setLoaded(true);
    const config = {
      type: Phaser.AUTO,
      //gameTitle: "Phaser x Moralis",
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
      // init instance of phaser game as per config
      game = new Phaser.Game(config);
      // listen to in-game events
      // before starting we sign in with wallet
      game.events.on("LOGIN_PLAYER", (event) => {
        console.log("⛓⛓⛓ Login via Web3 Wallet ⛓⛓⛓");
        // trigger wallet authentication
        login();
      });
      game.events.on("APPROVE", (event) => {
        console.log("⛓⛓⛓ Approve funds via Web3 Wallet ⛓⛓⛓");
        // trigger approval via web3 wallet
        approval();
      });
    }
    /*     
    // when GAME_OVER interact with chain
    game.events.on("BLOCK_CHECK", (event) => {
      console.log("⛓⛓⛓ Game Event Triggered Web3 Func ⛓⛓⛓");
      // trigger fetching of on-chain data to test connection
      fetch();
    });
    */
  }

  return (
    <>
      {/*<pre style={{ color: "#FFF" }}>{JSON.stringify(user, null, 2)}</pre>*/}
    </>
  );
}

export default App;
