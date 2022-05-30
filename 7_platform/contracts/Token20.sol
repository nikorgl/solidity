//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "hardhat/console.sol";

contract Token20 is ERC20, AccessControl {
  uint8 private _decimals;

  constructor(
    string memory name,
    string memory symbol,
    uint8 decimals_
  ) ERC20(name, symbol) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _decimals = decimals_;
  }

  function decimals() public view override returns (uint8) {
    return _decimals;
  }

  function mint(address addr, uint256 value) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _mint(addr, value);
  }

  function burn(address addr, uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _burn(addr, value);
  }
}
