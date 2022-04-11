// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GameToken.sol";

contract P2EGame {
  address admin;
  uint256 public totalBalance;

  // this is the GameToken erc20 contract address
  address constant tokenAddress = 0x2fCf86f3399271fc15546a62e976F12f78a67358;

  struct Transaction {
      uint256 id;
    address treasury;
    uint256 amount;
    bool locked;
    bool spent;
  }

  mapping(address => mapping(uint256 => Transaction)) public balances;

  modifier onlyAdmin {
    require(msg.sender == admin, "Only admin can unlock escrow.");
    _;
  }

    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` to the
     * account that deploys the contract.
     *
     * See {ERC20-constructor}.
     */
    constructor() {
        admin = msg.sender;
        // mint 100 tokens into the game economy
        //_mint(admin, 100 * 10**decimals());
    }

  // player startGames
  // staked tokens get moved to the escrow (this contract)
  function startGame(uint256 _gameId, address _treasury, uint256 _amount) external returns (uint256) {
    GameToken token = GameToken(tokenAddress);
    token.approve(address(this),_amount);
    token.transferFrom(msg.sender, address(this), _amount);
    
    totalBalance += _amount;

    balances[msg.sender][_gameId].amount = _amount;
    balances[msg.sender][_gameId].treasury = _treasury;
    balances[msg.sender][_gameId].locked = true;
    balances[msg.sender][_gameId].spent = false;
    return token.balanceOf(msg.sender);
  }

  // retrieve current state of game funds in escrow
  function gameState(address _player, uint256 _gameId) external view returns (uint256, bool, address) {
    return ( balances[_player][_gameId].amount, balances[_player][_gameId].locked, balances[_player][_gameId].treasury );
  }

  // admin unlocks tokens in escrow once game's outcome decided
  function playerWon(uint256 _gameId, address _player) onlyAdmin external returns(bool) {
    // allows player to withdraw
    balances[_player][_gameId].locked = false;

    GameToken token = GameToken(tokenAddress);
    token.transfer(_player, balances[_player][_gameId].amount);
    return true;
  }

  // admin sends funds to treasury if player loses game
  function playerLost(address _player, uint256 _gameId) onlyAdmin external returns(bool) {
    GameToken token = GameToken(tokenAddress);
    token.transfer(balances[_player][_gameId].treasury, balances[_player][_gameId].amount);

    balances[_player][_gameId].spent = true;
    totalBalance -= balances[_player][_gameId].amount;
    return true;
  }

  // player is able to withdraw unlocked tokens
  function withdraw(uint256 _gameId) external returns(bool) {
    require(balances[msg.sender][_gameId].locked == false, "This escrow is still locked");
    require(balances[msg.sender][_gameId].spent == false, "Already withdrawn");

    GameToken token = GameToken(tokenAddress);
    token.transfer(msg.sender, balances[msg.sender][_gameId].amount);

    totalBalance -= balances[msg.sender][_gameId].amount;
    balances[msg.sender][_gameId].spent = true;
    return true;
  }

}