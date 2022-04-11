// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GameToken.sol";

contract P2EGame {
    address admin;
    uint256 public totalBalance;

    // this is the erc20 GameToken contract address
    address constant tokenAddress = 0x8e04737EFa4b3FBfEe20f6965032a949A7f4d0Cd; // <-- INSERT DEPLYED ERC20 TOKEN CONTRACT HERE

    struct Game {
        uint256 id;
        address treasury;
        uint256 amount;
        bool locked;
        bool spent;
    }

    mapping(address => mapping(uint256 => Game)) public balances;

    modifier onlyAdmin() {
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
    }

    // player startGames
    // staked tokens get moved to the escrow (this contract)
    function startGame(
        uint256 _gameId,
        address _treasury,
        uint256 _amount
    ) external returns (uint256) {
        GameToken token = GameToken(tokenAddress);
        // approve contract to spend amount tokens
        require(
            token.approve(address(this), _amount),
            "P2EGame: approval has failed"
        );
        require(
            _amount >= 1000000000000000000,
            "P2EGame: must insert 1 whole token"
        );
        token.transferFrom(msg.sender, address(this), _amount);

        totalBalance += _amount;

        balances[msg.sender][_gameId].amount = _amount;
        balances[msg.sender][_gameId].treasury = _treasury;
        balances[msg.sender][_gameId].locked = true;
        balances[msg.sender][_gameId].spent = false;
        return token.balanceOf(msg.sender);
    }

    // retrieve current state of game funds in escrow
    function gameState(address _player, uint256 _gameId)
        external
        view
        returns (
            uint256,
            bool,
            address
        )
    {
        return (
            balances[_player][_gameId].amount,
            balances[_player][_gameId].locked,
            balances[_player][_gameId].treasury
        );
    }

    // admin unlocks tokens in escrow once game's outcome decided
    function playerWon(uint256 _gameId, address _player)
        external
        onlyAdmin
        returns (bool)
    {
        // allows player to withdraw
        balances[_player][_gameId].locked = false;

        GameToken token = GameToken(tokenAddress);
        token.transfer(_player, balances[_player][_gameId].amount);

        totalBalance -= balances[_player][_gameId].amount;
        balances[_player][_gameId].spent = true;
        return true;
    }

    // admin sends funds to treasury if player loses game
    function playerLost(address _player, uint256 _gameId)
        external
        onlyAdmin
        returns (bool)
    {
        GameToken token = GameToken(tokenAddress);
        token.transfer(
            balances[_player][_gameId].treasury,
            balances[_player][_gameId].amount
        );

        balances[_player][_gameId].spent = true;
        totalBalance -= balances[_player][_gameId].amount;
        return true;
    }

    // player is able to withdraw unlocked tokens
    function withdraw(uint256 _gameId) external returns (bool) {
        require(
            balances[msg.sender][_gameId].locked == false,
            "This escrow is still locked"
        );
        require(
            balances[msg.sender][_gameId].spent == false,
            "Already withdrawn"
        );

        GameToken token = GameToken(tokenAddress);
        token.transfer(msg.sender, balances[msg.sender][_gameId].amount);

        totalBalance -= balances[msg.sender][_gameId].amount;
        balances[msg.sender][_gameId].spent = true;
        return true;
    }
}
