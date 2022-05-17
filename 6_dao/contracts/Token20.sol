//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Token20 is ERC20, Ownable {
  constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

  function mint(address addr, uint256 value) public onlyOwner {
    _mint(addr, value);
  }
}
