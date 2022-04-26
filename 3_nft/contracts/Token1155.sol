//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract Token1155 is ERC1155, Ownable {
  using Strings for uint256;

  string public name = "NiToken1155";
  string public baseUri;

  constructor(string memory _baseUri) ERC1155(_baseUri) {
    baseUri = _baseUri;
  }

  function uri(uint256 tokenId) public view override returns (string memory) {
    return string(abi.encodePacked(baseUri, tokenId.toString()));
  }

  function mint(
    address to,
    uint256 tokenId,
    uint256 amount
  ) external onlyOwner {
    _mint(to, tokenId, amount, "");
  }
}
