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
    address constant tokenAddress = 0x8d85a9492605FD5768883AbC5015a2019BED862E; // <-- INSERT DEPLYED ERC20 TOKEN CONTRACT HERE
    uint256 public maxSupply = 100000000000000000000; // <-- currently set manually for flexibility while in pre-alpha development
    uint256 public unit = 1000000000000000000; // <-- currently set manually for flexibility while in pre-alpha development
    uint256 public gameId;

    // game data tracking
    struct Game {
        address treasury;
        uint256 balance;
        bool locked;
        bool spent;
    }
    // map game to balances
    mapping(address => mapping(uint256 => Game)) public balances;
    // set-up event for emitting once character minted to read out values
    event NewGame(address indexed player, uint256 id);

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
        gameId = 0;
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
            balances[_player][_gameId].balance,
            balances[_player][_gameId].locked,
            balances[_player][_gameId].treasury
        );
    }

    // admin starts game
    // staked tokens get moved to the escrow (this contract)
    function createGame(
        address _player,
        address _treasury,
        uint256 _p,
        uint256 _t
    ) external onlyAdmin returns (bool) {
        GameToken token = GameToken(tokenAddress);
        //unit = token.unit();

        // approve contract to spend amount tokens
        // NOTE: this approval method doesn't work and player must approve token contract directly
        //require(token.approve(address(this), _balance), "P2EGame: approval has failed");
        // must include amount >1 token (1000000000000000000)
        require(_p >= unit, "P2EGame: must insert 1 whole token");
        require(_t >= unit, "P2EGame: must insert more than 1 token");
        // transfer from player to the contract's address to be locked in escrow
        token.transferFrom(msg.sender, address(this), _t);
        token.transferFrom(_player, address(this), _p);

        // escrow balance
        escrowBalance += (_p + _t);

        // iterate game identifier
        gameId++;

        // init game data
        balances[_player][gameId].balance = escrowBalance;
        balances[_player][gameId].treasury = _treasury;
        balances[_player][gameId].locked = true;
        balances[_player][gameId].spent = false;

        emit NewGame(_player, gameId);

        return true;
    }

    // admin unlocks tokens in escrow once game's outcome decided
    function playerWon(uint256 _gameId, address _player)
        external
        onlyAdmin
        returns (bool)
    {
        GameToken token = GameToken(tokenAddress);
        //maxSupply = token.maxSupply();

        // allows player to withdraw
        balances[_player][_gameId].locked = false;
        // validate winnings
        require(
            balances[_player][_gameId].balance < maxSupply,
            "P2EGame: winnings exceed balance in escrow"
        );
        // final winnings = balance locked in escrow + in-game winnings
        // transfer to player the final winnings
        token.transfer(_player, balances[_player][_gameId].balance);
        // TODO: add post-transfer funcs to `_afterTokenTransfer` to validate transfer

        // amend escrow balance
        escrowBalance -= balances[_player][_gameId].balance;
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
            balances[_player][_gameId].balance
        );
        // TODO: add post-transfer funcs to `_afterTokenTransfer` to validate transfer

        // amend escrow balance
        escrowBalance -= balances[_player][_gameId].balance;
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
        token.transfer(msg.sender, balances[msg.sender][_gameId].balance);
        // TODO: add post-transfer funcs to `_afterTokenTransfer` to validate transfer
        // amend escrow balance
        escrowBalance -= balances[msg.sender][_gameId].balance;
        // set game balance to spent
        balances[msg.sender][_gameId].spent = true;
        return true;
    }
}
