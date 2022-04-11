// code from App.jsx to re-insert at later date

// import for reading metadata json file
import axios from "axios";
import MainMenu, { nftEvents, LOAD_NFT, APPROVED } from "./scenes/MainMenu.js";
import {
  useMoralis,
  // 1.
  // import NFT component
  useNFTBalances,
  // P2E integration: 1. import Moralis func for contracts
  useWeb3ExecuteFunction,
} from "react-moralis";

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

// inside login func
// begin check: permission only if holds NFT from collection 0x…
//checkNFTBalance(_user);

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

// TODO: add logout functionality within Phaser game UI/UX
/*
  const logOut = async () => {
    await logout();
    console.log("logged out");
  };
  */

// ---

// place inside MainMenu.js

// reducer
function reducer(state = initState, action) {
  switch (action.type) {
    case LOAD_NFT:
      emitter.emit("LOAD_NFT", action);
      return { ...state };
    case STARTGAME:
      emitter.emit("STARTGAME", action);
      return { ...state };
    default:
      return state;
  }
}

// event types
export const LOAD_NFT = "LOAD_NFT";
let valid_nft_image = "";

// place inside MainMenu.js constructor()

// 6.
// display image from metadata (demoNFTimageURL = event.nft) in game

// set-up an event handler for loading a valid NFT
/*
    emitter.on("LOAD_NFT", (event) => {
      // check user has signed-in; id exists
      console.log("NFT:", event.nft);
      // set it for use later
      valid_nft_image = event.nft;
    });
    */

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
