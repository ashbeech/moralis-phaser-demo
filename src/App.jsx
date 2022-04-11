import Phaser from "phaser";
import Boot from "./scenes/Boot.js";
import Preloader, { authEvents, AUTH } from "./scenes/Preloader.js";
import MainMenu, { nftEvents, LOAD_NFT, APPROVED } from "./scenes/MainMenu.js";
import MainGame from "./scenes/Game.js";
import { useState, useEffect } from "react";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";

// import for reading metadata json file
import axios from "axios";

import {
  useMoralis,
  //useMoralisWeb3Api,
  //useMoralisWeb3ApiCall,
  // 1.
  // import NFT component
  useNFTBalances,
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
  /* 
  // TODO: right contract and interface with it via useweb3executefunction()
  // https://github.com/MoralisWeb3/react-moralis/#useweb3executefunction

  // test connection to a connected chain
  const [block, setBlock] = useState("100000"); // <-- example block height

  const Web3Api = useMoralisWeb3Api();
  const { _fetch, _data } = useMoralisWeb3ApiCall(Web3Api.native.getBlock, {
    block_number_or_hash: block,
  });

  // update feedback on re-renders
  useEffect(() => {
    if (_data) {
      console.log("BLOCK DATA:", _data);
    }
    if (user) {
      console.log(user);
    }
  }, [_data, user]);
*/

  function startGame(_user) {
    console.log("USER:", _user);
    // communicate to Phaser game that player is authenticated
    authEvents.dispatch({ type: AUTH, player: _user });
  }

  // 2.
  // we declare the func that will allow us to easily grab NFTs from a user's wallet
  const { getNFTBalances } = useNFTBalances();

  // 3.
  // declare contract address that the game deems valid; to allow access to a player
  const check_address = "0xed34a7149b1a80c06e368354ac2b746807118f83"; // <-- enter your valid 'NFT collection' contract address
  const network_chain_id = "0x13881"; // <-- enter chain id you want to target

  //  NOTES:
  // • chain id for Polygon Mumbai testnet: 0x13881
  // • check for token_address: 0x…
  // • TEST: switch between user wallet addresses that hold and don't hold, valid NFT

  const nftMetadata = [];
  const findNFTMetadata = async (___data) => {
    let p = 0;
    for (let i = 0; i < ___data.length; i++) {
      console.log(___data[i].token_address);
      if (___data[i].token_address === check_address) {
        console.log(___data[i].token_uri);
        nftMetadata[p] = ___data[i].token_uri;
        p++;
      }
    }
  };

  let demoNFTimageURL = "";
  const getJSON = async (_metadata) => {
    try {
      // grab remote json file (likely IPFS)
      await axios.get(_metadata).then((res) => {
        console.log("Initial Image URL:", res.data?.image);
        // set URL
        demoNFTimageURL = res.data?.image;
        // if already is a moralis ipfs link, then skip further processing
        if (demoNFTimageURL.match("moralis")) {
        } else {
          let imageSplit = res.data?.image.split("/");
          console.log("IMAGE CID:", res.data?.image.split("/"));
          // FYI the file's CID can also be displayed from any other IPFS node URL prefix e.g. https://ipfs.io/ipfs/CID/xxx.png
          demoNFTimageURL =
            "https://ipfs.moralis.io:2053/ipfs/" +
            imageSplit[2] +
            "/" +
            imageSplit[3];
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  // 5.
  // processor NFT metadata to locate renderable image data
  const compileNFT = async (___user, __data) => {
    await findNFTMetadata(__data);
    await getJSON(nftMetadata[0]);
    console.log("Final NFT Image URL:", demoNFTimageURL);

    // TODO: further checks to validate metadata available
    if (demoNFTimageURL === "") {
    } else {
      // valid NFT holders can play; change scene within Phaser
      // communicate that with Phaser component
      // --> 6. is in MainMenu.js -->
      nftEvents.dispatch({ type: LOAD_NFT, nft: demoNFTimageURL });
      // start game
      startGame(___user);
    }
  };

  // 4.
  // check user's balance for token contract address matching above
  const checkNFTBalance = async (__user) => {
    let valid = false;
    await getNFTBalances({
      params: {
        chain: network_chain_id,
      },
    })
      .then(function (_data) {
        console.log(_data);
        // check for matching results in user's wallet
        if (!_data || _data?.result.length === 0) {
          // no NFTs returned = false
          console.log("Nope");
          authEvents.dispatch({ type: AUTH, player: null });
          logout();
          console.log("User logged-out");
        } else {
          valid = _data.result.some(
            (elem) => elem.token_address === check_address
          );
          // TODO: More elegantly handle failure to sign in.
          if (valid) {
            // valid NFT to allow access found
            console.log("ACCESS GRANTED", valid);
            // pass NFT data onto processor funcs
            compileNFT(__user, _data.result);
          } else {
            // no valid NFT in possesion of user
            // print access denied feedback
            console.log("ACCESS DENIED: No Valid NFT");
          }
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    return valid;
  };

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

    //const transaction = await Moralis.executeFunction(options);
    //console.log(transaction.hash);
    // --> "0x39af55979f5b690fdce14eb23f91dfb0357cb1a27f387656e197636e597b5b7c"

    // Wait until the transaction is confirmed
    //await transaction.wait();

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
            // begin check: permission only if holds NFT from collection 0x…
            //checkNFTBalance(_user);
            startGame(_user);
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  };

  // TODO: add logout functionality within Phaser game UI/UX
  /*
  const logOut = async () => {
    await logout();
    console.log("logged out");
  };
  */

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
