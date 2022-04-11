import Phaser from "phaser";
import Boot from "./scenes/Boot.js";
import Preloader, { authEvents, AUTH } from "./scenes/Preloader.js";
import MainMenu, { mainMenuEvents, STARTGAME } from "./scenes/MainMenu.js";
import MainGame from "./scenes/Game.js";
import { useState, useEffect } from "react";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import {
  useMoralis,
  // P2E integration: 1. import Moralis func for contracts
  useWeb3ExecuteFunction,
} from "react-moralis";
// P2E integration: 2. create ABI dir for P2E contracts
import tokenABI from "./contracts/abis/GameToken.json";
//import P2EABI from "./contracts/abis/P2EGame.json";

// TODOS:
// - Integrated GameToken contract funcs: STARTGAME.
// - Integrated P2E contract funcs: startGame, playerWon, playerLost.
// - startGame, playerWon, playerLost feedback is reflected in UX/UI e.g. player token balance changes shown on screen, not just in MetaMask pop-up.
// - Re-factored redux integration.
// - More elegantly handled user's failure to sign in.

let game = null;

const initState = { player: {}, score: 0, nft: "", gameOver: false };

//event types
export const GET_PLAYER = "GET_PLAYER";
export const LOGIN_PLAYER = "LOGIN_PLAYER";
// P2E integration: 3. set-up  comms to Phaser scripts
//export const STARTGAME = "STARTGAME";
export const UPDATE_SCORE = "UPDATE_SCORE";
export const GAME_OVER = "GAME_OVER";

const TOKEN_CONTRACT = process.env.REACT_APP_TOKEN_CONTRACT;
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
    case STARTGAME:
      game.events.emit("STARTGAME", "Player STARTGAME");
      return { ...state, score: action.score };
    case UPDATE_SCORE:
      return { ...state, score: action.score };
    case GAME_OVER:
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
    isInitialized,
    authenticate,
    isAuthenticated,
    logout,
    enableWeb3,
    isWeb3Enabled,
    isWeb3EnableLoading,
  } = useMoralis();

  const [loaded, setLoaded] = useState(false);

  const startGame = async (_user) => {
    console.log("USER:", _user);
    // communicate to Phaser game that player is authenticated
    await approval(_user);
  };

  useEffect(() => {
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading) enableWeb3();
    console.log("Web3 Enabled: ", isWeb3Enabled);
    console.log("Authenticated: ", isAuthenticated);
    console.log("Moralis Intialised:", isInitialized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWeb3Enabled, isAuthenticated, isInitialized]);

  // web3 interface
  const { fetch } = useWeb3ExecuteFunction();

  // STARTGAME spend of token (fungible) into escrow
  // result will be an allowance for the game to use once you start a game
  const approval = async (_user) => {
    const options = {
      abi: tokenABI.abi,
      contractAddress: TOKEN_CONTRACT,
      functionName: "approve",
      params: {
        spender: "0x…", // <-- INSERT DEPLOYED P2E CONTRACT ADDRESS e.g. "0x…"/0xd154B4D816FFF60893b92b6d418ef8aE5F505233
        amount: "0", // <-- this is set to maximum allowance in ERC20 GameToken contract (not best practice)
      },
    };

    await fetch({
      params: options,
      onSuccess: (response) =>
        authEvents.dispatch({ type: AUTH, player: _user }),
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
      })
        .then(function (_user) {
          console.log("logged in user:", _user);
          console.log(_user?.get("ethAddress"));
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
      gameTitle: "P2E Bank Panic | Phaser x Moralis",
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
      /*       
      game.events.on("STARTGAME", (event) => {
        console.log("⛓⛓⛓ STARTGAME funds via Web3 Wallet ⛓⛓⛓");
        // trigger approval via web3 wallet
        approval();
      });
 */
    }
  }

  return (
    <>
      {/*<pre style={{ color: "#FFF" }}>{JSON.stringify(user, null, 2)}</pre>*/}
    </>
  );
}

export default App;
