/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// WARNING: WIP

struct P2EData {
    uint256 minimum;
    uint256 maximum;
    address tokenAddress;
}

struct P2EConfig {
    P2EData data;
}
