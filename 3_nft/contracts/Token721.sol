//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Token721 is ERC721, Ownable {
  string public baseUri;

  constructor(string memory _baseUri) ERC721("NiToken721", "NiFT") {
    baseUri = _baseUri;
  }

  function _baseURI() internal view override returns (string memory) {
    return baseUri;
  }

  function mint(address to, uint256 tokenId) external onlyOwner {
    _safeMint(to, tokenId);
  }
}
