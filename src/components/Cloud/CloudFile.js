// Moralis cloud functions:
// * call contract to get admin to distribute tokens on player win, etc
// * return tx response: success/error
// ---
// TODOS:
// * Integrated startGame and playerLost.
// * adminBotKey not stored in file: stored via secure custodian and accessed through their API.

const web3 = Moralis.web3ByChain("0x13881"); // Mumbai Testnet
const p2e_contract_address = "0xd154B4D816FFF60893b92b6d418ef8aE5F505233"; // Deployed P2EGame.sol contract
const p2e_abi = []; // P2EGame.sol contract ABI
const adminBotKey = "INSERT_PRIVATE_KEY"; // <-- CRITICAL WARNING: DO NOT INCLUDE IF THIS FILE WILL BE UNECRYPTED OR IN PUBLIC DIR ON LIVE SERVER
const adminBot = new web3.eth.Contract(p2e_abi, p2e_contract_address);

Moralis.Cloud.define("playerWon", async (request) => {
  /*
    // params from clientside
    const params = {
        gameId: initState.gameId,
        player: initState.player.address,
        winnings: initState.score,
    };
    // params on serverside
    const gameId = request.params.gameId;
    const player = request.params.player;
    const winnings = request.params.winnings;
    const params = request.params
    */

  const functionCall = adminBot.methods.playerWon(request.params).encodeABI();
  transactionBody = {
    to: p2e_contract_address,
    //nonce: nonceOperator,
    data: functionCall,
    gas: 30000,
    gasPrice: web3.utils.toWei("30000", "gwei"),
  };
  signedTransaction = await web3.eth.accounts.signTransaction(
    transactionBody,
    adminBotKey
  );
  return signedTransaction;
});
