// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Gold is ERC20 {
    uint256 public constant decimalnumber = 6;
    uint256 public constant totalSupply = 1000000 * 10**decimals;

    constructor() ERC20("Gold", "GLD") {
        _mint(msg.sender, totalSupply);
    }

    function decimals() public view virtual override returns (uint8) {
        return decimalnumber;
    }
}
