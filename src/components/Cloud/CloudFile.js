const p2e_contract_address = "0x7053c8dB1c4ED4C96c47E322A8517BcAeE4ECaE5"; // Deployed P2EGame.sol contract
const p2e_abi = [
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
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
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
    inputs: [],
    name: "contractBalance",
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
]; // P2EGame.sol contract ABI

const adminBotK = "INSERT_PRIVATE_KEY"; // <-- CRITICAL WARNING: DO NOT INCLUDE IF THIS FILE WILL BE UNECRYPTED OR IN PUBLIC DIR ON LIVE SERVER
//const web3 = Moralis.web3ByChain("0x13881"); // Mumbai Testnet
// just trying-out different methods
const web3Speedy = new Moralis.Web3(
  new Moralis.Web3.providers.HttpProvider(
    "https://speedy-nodes-nyc.moralis.io/2f9030e63c6503c12a1e7340/polygon/mumbai"
  )
);
//const adminBotAccount = web3.eth.accounts.wallet.add(adminBotK);
//const adminBot = new web3.eth.Contract(p2e_abi, p2e_contract_address);

const MainBridge = new web3Speedy.eth.Contract(p2e_abi, p2e_contract_address);

Moralis.Cloud.define("createGame", async (request) => {
  logger.info("--- Starting Game ---");
  const functionCall = MainBridge.methods
    .createGame(
      request.params._player,
      request.params._treasury,
      request.params._p,
      request.params._t
    )
    .encodeABI();
  const transactionBody = {
    to: p2e_contract_address,
    data: functionCall,
    gas: 300000,
    gasPrice: web3Speedy.utils.toWei("3", "gwei"),
  };
  signedTransaction = await web3Speedy.eth.accounts.signTransaction(
    transactionBody,
    adminBotK
  );
  logger.info(signedTransaction.transactionHash);
  fulfillTx = await web3Speedy.eth.sendSignedTransaction(
    signedTransaction.rawTransaction
  );
  logger.info("fulfillTx: " + JSON.stringify(fulfillTx));
  return signedTransaction;
});

Moralis.Cloud.define("playerLost", async (request) => {
  logger.info("--- Player Lost ---");
  const functionCall = MainBridge.methods
    .playerLost(request.params._player, request.params._gameId)
    .encodeABI();
  const transactionBody = {
    to: p2e_contract_address,
    data: functionCall,
    gas: 300000,
    gasPrice: web3Speedy.utils.toWei("3", "gwei"),
  };
  signedTransaction = await web3Speedy.eth.accounts.signTransaction(
    transactionBody,
    adminBotK
  );
  logger.info(signedTransaction.transactionHash);
  fulfillTx = await web3Speedy.eth.sendSignedTransaction(
    signedTransaction.rawTransaction
  );
  logger.info("fulfillTx: " + JSON.stringify(fulfillTx));
  return signedTransaction;
});

Moralis.Cloud.define("playerWon", async (request) => {
  logger.info("--- Player Won ---");
  const functionCall = MainBridge.methods
    .playerWon(request.params._gameId, request.params._player)
    .encodeABI();
  const transactionBody = {
    to: p2e_contract_address,
    data: functionCall,
    gas: 300000,
    gasPrice: web3Speedy.utils.toWei("3", "gwei"),
  };
  signedTransaction = await web3Speedy.eth.accounts.signTransaction(
    transactionBody,
    adminBotK
  );
  logger.info(signedTransaction.transactionHash);
  fulfillTx = await web3Speedy.eth.sendSignedTransaction(
    signedTransaction.rawTransaction
  );
  logger.info("fulfillTx: " + JSON.stringify(fulfillTx));
  return signedTransaction;
});

Moralis.Cloud.define("gameId", async (request) => {
  const id = await MainBridge.methods
    .gameId()
    .call()
    .catch((e) => logger.error(`callName: ${e}${JSON.stringify(e, null, 2)}`));
  return id;
});

Moralis.Cloud.define("maxSupply", async (request) => {
  const maxSupply = await MainBridge.methods
    .maxSupply()
    .call()
    .catch((e) => logger.error(`callName: ${e}${JSON.stringify(e, null, 2)}`));
  return maxSupply;
});
