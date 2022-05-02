//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Token20 is ERC20, Ownable {
  using SafeERC20 for ERC20;

  constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

  function mint(address to, uint256 value) public onlyOwner {
    _mint(to, value);
  }
}
