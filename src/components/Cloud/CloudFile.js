const p2e_contract_address = "0xB53D00eD7601a090867A75463428a6940fACdc39"; // Deployed P2EGame.sol contract
const p2e_abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "NewGame",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "balance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "balances",
    outputs: [
      {
        internalType: "address",
        name: "treasury",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "locked",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "spent",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_player",
        type: "address",
      },
      {
        internalType: "address",
        name: "_treasury",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_p",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_t",
        type: "uint256",
      },
    ],
    name: "createGame",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "gameId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_player",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_gameId",
        type: "uint256",
      },
    ],
    name: "gameState",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_player",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_gameId",
        type: "uint256",
      },
    ],
    name: "playerLost",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_gameId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_player",
        type: "address",
      },
    ],
    name: "playerWon",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_gameId",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
]; // P2EGame.sol contract ABI

const adminBotK = "INSERT_PRIVATE_KEY"; // <-- CRITICAL WARNING: DO NOT INCLUDE IF THIS FILE WILL BE UNECRYPTED OR IN PUBLIC DIR ON LIVE SERVER
const web3 = Moralis.web3ByChain("0x13881"); // Mumbai Testnet
/*
  // just trying-out different methods
  const web3 = new Moralis.Web3(
    new Moralis.Web3.providers.HttpProvider(
      "https://speedy-nodes-nyc.moralis.io/2f9030e63c6503c12a1e7340/polygon/mumbai"
    )
  );
*/
//const adminBotAccount = web3.eth.accounts.wallet.add(adminBotK);
const adminBot = new web3.eth.Contract(p2e_abi, p2e_contract_address);

Moralis.Cloud.define("createGame", async (request) => {
  const functionCall = adminBot.methods
    .createGame(
      request.params._player,
      request.params._treasury,
      request.params._p,
      request.params._t
    )
    .encodeABI();
  let transactionBody = {
    to: p2e_contract_address,
    //nonce: nonceOperator,
    data: functionCall,
    gas: 3000000,
    gasPrice: web3.utils.toWei("3000000", "gwei"),
  };
  let signedTransaction = await web3.eth.accounts.signTransaction(
    transactionBody,
    adminBotK
  );
  /*
  logger.info("-------------------------------");
  logger.info(JSON.stringify(signedTransaction));
  logger.info("------ Signed Tx ------");
  */
  return signedTransaction;
});

Moralis.Cloud.define("gameId", async (request) => {
  const contract = new web3.eth.Contract(p2e_abi, p2e_contract_address);
  const id = await contract.methods
    .gameId()
    .call()
    .catch((e) => logger.error(`callName: ${e}${JSON.stringify(e, null, 2)}`));
  return id;
});

Moralis.Cloud.define("maxSupply", async (request) => {
  const maxSupply = await adminBot.methods
    .maxSupply()
    .call()
    .catch((e) => logger.error(`callName: ${e}${JSON.stringify(e, null, 2)}`));
  return maxSupply;
});
