//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract Token721 is ERC721, Ownable {
  string public baseUri;
  using Counters for Counters.Counter;
  Counters.Counter public currentTokenId;

  constructor(
    string memory name,
    string memory symbol,
    string memory _baseUri
  ) ERC721(name, symbol) {
    baseUri = _baseUri;
  }

  function _baseURI() internal view override returns (string memory) {
    return baseUri;
  }

  function mint(address to) external onlyOwner returns (uint256) {
    currentTokenId.increment();
    uint256 newItemId = currentTokenId.current();
    _safeMint(to, newItemId);
    return newItemId;
  }
}
