// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GameToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract P2EGame is Ownable {
    // admin address
    address private admin;
    // balance of tokens held in escrow
    uint256 public escrowBalance;
    // this is the erc20 GameToken contract address
    address constant tokenAddress = 0x8e04737EFa4b3FBfEe20f6965032a949A7f4d0Cd; // <-- INSERT DEPLYED ERC20 TOKEN CONTRACT HERE
    uint256 public maxSupply;
    uint256 public unit;

    // game data tracking
    struct Game {
        uint256 id;
        address treasury;
        uint256 amount;
        bool locked;
        bool spent;
    }
    // map game to balances
    mapping(address => mapping(uint256 => Game)) public balances;

    // only admin account can unlock escrow
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

    // admin starts game
    // staked tokens get moved to the escrow (this contract)
    function startGame(
        uint256 _gameId,
        address _player,
        address _treasury,
        uint256 _p_amount,
        uint256 _t_amount
    ) external onlyAdmin returns (uint256) {
        GameToken token = GameToken(tokenAddress);
        unit = token.unit();
        // approve contract to spend amount tokens
        // NOTE: this approval method doesn't work and player must approve token contract directly
        //require(token.approve(address(this), _amount), "P2EGame: approval has failed");
        // must include amount >1 token (1000000000000000000)
        require(_amount >= unit, "P2EGame: must insert 1 whole token");
        // transfer from player to the contract's address to be locked in escrow
        token.transferFrom(_player, address(this), _p_amount);
        token.transferFrom(_treasury, address(this), _t_amount);
        // balance
        escrowBalance += _amount;

        balances[_player][_gameId].amount = _amount;
        balances[_player][_gameId].treasury = _treasury;
        balances[_player][_gameId].locked = true;
        balances[_player][_gameId].spent = false;
        return token.balanceOf(_player);
    }

    // admin unlocks tokens in escrow once game's outcome decided
    function playerWon(
        uint256 _gameId,
        address _player,
        uint256 _winnings
    ) external onlyAdmin returns (bool) {
        GameToken token = GameToken(tokenAddress);
        maxSupply = token.maxSupply();
        // allows player to withdraw
        balances[_player][_gameId].locked = false;
        // validate winnings
        require(_winnings < maxSupply, "P2EGame: winnings exceed max supply");
        // final winnings = balance locked in escrow + in-game winnings
        balances[_player][_gameId].amount =
            balances[_player][_gameId].amount +
            _winnings;
        // transfer to player the final winnings
        token.transfer(_player, _winnings);
        // TODO: add post-transfer funcs to `_afterTokenTransfer` to validate transfer

        // amend escrow balance
        escrowBalance -= balances[_player][_gameId].amount;
        // set game balance to spent
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
        // transfer to treasury the balance locked in escrow
        token.transfer(
            balances[_player][_gameId].treasury,
            balances[_player][_gameId].amount
        );
        // TODO: add post-transfer funcs to `_afterTokenTransfer` to validate transfer

        // amend escrow balance
        escrowBalance -= balances[_player][_gameId].amount;
        // set game balance to spent
        balances[_player][_gameId].spent = true;
        return true;
    }

    // player is able to withdraw unlocked tokens without admin if unlocked
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
        // transfer to player of game (msg.sender) the value locked in escrow
        token.transfer(msg.sender, balances[msg.sender][_gameId].amount);
        // TODO: add post-transfer funcs to `_afterTokenTransfer` to validate transfer
        // amend escrow balance
        escrowBalance -= balances[msg.sender][_gameId].amount;
        // set game balance to spent
        balances[msg.sender][_gameId].spent = true;
        return true;
    }
}
