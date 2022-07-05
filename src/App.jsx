import Phaser from "phaser";
import Boot from "./scenes/Boot.js";
import Preloader /*, { authEvents, AUTH }*/ from "./scenes/Preloader.js";
import MainMenu /*, { STARTGAME }*/ from "./scenes/MainMenu.js";
import MainGame from "./scenes/Game.js";
import { useState, useEffect } from "react";
import Store, { playerLogged, UPDATE_SCORE } from "./Store";
import { Moralis } from "moralis";
import {
  useMoralis,
  // P2E integration: 1. import Moralis func for contracts
  useWeb3ExecuteFunction,
} from "react-moralis";
// P2E integration: 2. create ABI dir for P2E contracts
import tokenABI from "./contracts/abis/GameToken.json";
//import P2EABI from "./contracts/abis/P2EGame.json"; // <--  likely don't need on client-side as Cloud Functions will handle

// TODOS:
// * Integrated GameToken contract funcs: STARTGAME.
// * Integrated P2E contract funcs: startGame, playerWon, playerLost.
// * startGame, playerWon, playerLost feedback is reflected in UX/UI e.g. player token balance changes shown on screen, not just in MetaMask pop-up.
// * Re-factored redux integration.
// * More elegantly handled user's failure to sign in.

let game = null;

const TOKEN_CONTRACT = process.env.REACT_APP_TOKEN_CONTRACT;
const P2E_CONTRACT = process.env.REACT_APP_P2E_CONTRACT;

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
        spender: P2E_CONTRACT, // <-- INSERT DEPLOYED P2E CONTRACT ADDRESS AKA ESCROW CONTRACT
        amount: "0", // <-- this is set to maximum allowance in ERC20 GameToken contract (not best practice)
      },
    };

    await fetch({
      params: options,
      onSuccess: (
        response //console.log("placeholder"),
      ) =>
        //authEvents.dispatch({ type: AUTH, player: _user }),
        Store.dispatch({ type: UPDATE_SCORE, score: 10 }),
      onComplete: () => console.log("Fetched"),
      onError: (error) => console.log("Error", error),
    });
  };

  // WINGAME spend of token (fungible) from escrow (+winnings)
  // result will be value transferred to player
  const win = async (_params) => {
    // init Moralis API web3 interface
    const web3 = await Moralis.enableWeb3();
    // run cloud function: activate admin bot account
    const signedTransaction = await Moralis.Cloud.run("playerWon", _params);
    const fulfillTx = await web3.eth.sendSignedTransaction(
      signedTransaction.rawTransaction
    );
    // test transaction feedback
    console.log(fulfillTx);
  };

  // When state changes, trigger corresponding web3 actions here
  const handleStateChange = async () => {
    let state = Store.getState();
    console.log(state.players);
    // If state has no player logged-in…
    if (state.players[0] === undefined) {
      //state.players[0] = _user?.get("ethAddress");
      login(state.players);
      //state.players[0] = "hi.";
    } else {
    }
  };

  const login = async (_players) => {
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
            //authEvents.dispatch({ type: AUTH, player: null });
            logout();
            console.log("logged out");
          } else {
            //console.log("USER AUTHED?:", _user?.authenticated());
            //Store.dispatch(playerLogged(_user?.get("ethAddress")));
            _players[0] = _user?.get("ethAddress");
            startGame(_players[0]);
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

      console.log(Store);
      const unsubscribe = Store.subscribe(() => handleStateChange());
    }
  }

  return (
    <>
      {/*<pre style={{ color: "#FFF" }}>{JSON.stringify(user, null, 2)}</pre>*/}
    </>
  );
}

export default App;
