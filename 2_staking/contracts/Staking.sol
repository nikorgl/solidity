//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Staking is Ownable {
  using SafeERC20 for IERC20;
  IERC20 public lpToken;
  IERC20 public rewardToken;

  uint256 public rewardPeriod;
  uint256 public lockStakePeriod;
  uint256 public rewardPercent;

  struct Wallet {
    uint256 balance;
    uint256 createdAt;
    uint256 updatedAt;
    uint256 reward;
  }
  mapping(address => Wallet) public wallets;

  constructor(
    address _lpToken,
    address _rewardToken,
    uint256 _rewardPeriod,
    uint256 _lockStakePeriod,
    uint256 _rewardPercent
  ) {
    lpToken = IERC20(_lpToken);
    rewardToken = IERC20(_rewardToken);
    rewardPeriod = _rewardPeriod;
    lockStakePeriod = _lockStakePeriod;
    rewardPercent = _rewardPercent;
  }

  function updateReward() private {
    wallets[msg.sender].reward +=
      wallets[msg.sender].balance 
      * rewardPercent 
      * (block.timestamp - wallets[msg.sender].updatedAt) 
      / 100 
      / rewardPeriod;
    wallets[msg.sender].updatedAt = block.timestamp;
  }

  function stake(uint256 _amount) external {
    if (wallets[msg.sender].balance > 0) {
      updateReward();
    } else {
      wallets[msg.sender].createdAt = block.timestamp;
      wallets[msg.sender].updatedAt = wallets[msg.sender].createdAt;
    }
    wallets[msg.sender].balance += _amount;
    lpToken.safeTransferFrom(msg.sender, address(this), _amount);
  }

  function claim() external {
    require(block.timestamp >= wallets[msg.sender].createdAt + rewardPeriod, "Too soon");
    updateReward();
    uint256 reward = wallets[msg.sender].reward;
    wallets[msg.sender].reward = 0;
    rewardToken.safeTransfer(msg.sender, reward);
  }

  function unstake() external {
    require(wallets[msg.sender].balance > 0, "Zero balance");
    require(block.timestamp >= wallets[msg.sender].createdAt + lockStakePeriod, "Too soon");
    lpToken.safeTransfer(msg.sender, wallets[msg.sender].balance);
  }

  function setRewardPeriod(uint256 _value) external onlyOwner {
    rewardPeriod = _value;
  }

  function setLockStakePeriod(uint256 _value) external onlyOwner {
    lockStakePeriod = _value;
  }

  function setRewardPercent(uint256 _value) external onlyOwner {
    rewardPercent = _value;
  }
}
