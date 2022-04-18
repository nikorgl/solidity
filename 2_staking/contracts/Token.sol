//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "hardhat/console.sol";

contract Token is ERC20, Ownable {
  using SafeERC20 for ERC20;

  constructor() ERC20("NiToken", "NiT") {
    _mint(msg.sender, 1e30);
  }
}
