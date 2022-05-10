//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";
import "./Token20.sol";

contract Bridge {
  using ECDSA for bytes32;
  using Counters for Counters.Counter;
  Counters.Counter public nonceCounter;
  Token20 public token;
  mapping(address => mapping(uint256 => bool)) public processedNonces;
  address public validator;

  event SwapInitialized(
    uint256 indexed chainId,
    address indexed from,
    address indexed to,
    uint256 value,
    uint256 nonce
  );
  event Redeem(
    address indexed from,
    address indexed to,
    uint256 indexed value,
    uint256 nonce
  );

  constructor(address _token, address _validator) {
    token = Token20(_token);
    validator = _validator;
  }

  function swap(
    uint256 chainId,
    address to,
    uint256 value
  ) external {
    nonceCounter.increment();
    token.burn(msg.sender, value);
    emit SwapInitialized(chainId, msg.sender, to, value, nonceCounter.current());
  }

  function redeem(
    address from,
    uint256 value,
    uint256 nonce,
    bytes memory signature
  ) external {
    require(processedNonces[from][nonce] == false, "Transfer already processed");
    processedNonces[from][nonce] = true;
    require(
      keccak256(abi.encodePacked(block.chainid, from, msg.sender, value, nonce))
        .toEthSignedMessageHash()
        .recover(signature) == validator,
      "Invalid signature"
    );
    token.mint(msg.sender, value);
    emit Redeem(from, msg.sender, value, nonce);
  }
}
