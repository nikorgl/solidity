//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./DAO.sol";
import "hardhat/console.sol";

contract Staking is AccessControl {
  using SafeERC20 for IERC20;
  struct Wallet {
    uint256 balance;
    uint256 createdAt;
    uint256 updatedAt;
    uint256 reward;
  }
  mapping(address => Wallet) public wallets;
  IERC20 public lptoken;
  IERC20 public xxxtoken;
  address public dao;
  bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");
  uint256 public rewardPeriod;
  uint256 public lockStakePeriod;
  uint256 public rewardPercent;

  modifier positive(uint256 value) {
    require(value > 0, "Value must be positive");
    _;
  }

  constructor(
    address _lptoken,
    address _xxxtoken,
    uint256 _rewardPeriod,
    uint256 _lockStakePeriod,
    uint256 _rewardPercent
  ) {
    lptoken = IERC20(_lptoken);
    xxxtoken = IERC20(_xxxtoken);
    rewardPeriod = _rewardPeriod;
    lockStakePeriod = _lockStakePeriod;
    rewardPercent = _rewardPercent;
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function setDAOAddress(address addr) external onlyRole(DEFAULT_ADMIN_ROLE) {
    dao = addr;
  }

  function stake(uint256 value) external {
    lptoken.safeTransferFrom(msg.sender, address(this), value);
    if (wallets[msg.sender].balance > 0) {
      updateReward();
    } else {
      wallets[msg.sender].createdAt = block.timestamp;
      wallets[msg.sender].updatedAt = wallets[msg.sender].createdAt;
    }
    wallets[msg.sender].balance += value;
  }

  function claim() external {
    require(
      wallets[msg.sender].createdAt + rewardPeriod <= block.timestamp,
      "Too soon"
    );
    updateReward();
    uint256 reward = wallets[msg.sender].reward;
    wallets[msg.sender].reward = 0;
    xxxtoken.safeTransfer(msg.sender, reward);
  }

  function unstake() external {
    require(wallets[msg.sender].balance > 0, "Zero balance");
    require(
      DAO(dao).votersEndTime(msg.sender) < block.timestamp,
      "You have unfinished proposals"
    );
    require(
      block.timestamp >= wallets[msg.sender].createdAt + lockStakePeriod,
      "Too soon"
    );
    lptoken.safeTransfer(msg.sender, wallets[msg.sender].balance);
  }

  function setLockStakePeriod(uint256 value)
    external
    positive(value)
    onlyRole(DAO_ROLE)
  {
    lockStakePeriod = value;
  }

  function setRewardPeriod(uint256 value)
    external
    positive(value)
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    rewardPeriod = value;
  }

  function setRewardPercent(uint256 value)
    external
    positive(value)
    onlyRole(DEFAULT_ADMIN_ROLE)
  {
    rewardPercent = value;
  }

  function updateReward() private {
    wallets[msg.sender].reward +=
      (wallets[msg.sender].balance *
        rewardPercent *
        (block.timestamp - wallets[msg.sender].updatedAt)) /
      1000 /
      rewardPeriod;
    wallets[msg.sender].updatedAt = block.timestamp;
  }
}
