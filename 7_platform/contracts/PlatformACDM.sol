//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Token20.sol";
import "hardhat/console.sol";

contract Platform is AccessControl {
  using SafeERC20 for Token20;
  Token20 public token;
  address public dao;
  uint256 public roundPeriod;
  mapping(address => address) public referrers;

  enum Step {
    None,
    Trade,
    Sale
  }
  struct Round {
    uint256 endTime;
    uint256 tradeVolume;
    uint256 saleVolume;
    uint256 salePrice;
    Step step;
  }
  Round public round;

  struct Order {
    address owner;
    uint256 amount;
    uint256 price;
  }
  mapping(uint256 => Order) public orders;
  uint256 public orderCount;

  uint256[2][2] public referPercents = [[50, 30], [25, 25]];
  bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");

  constructor(
    address _token,
    address _dao,
    uint256 _roundPeriod,
    uint256 _tradeVolume,
    uint256 _salePrice
  ) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(DAO_ROLE, _dao);
    dao = _dao;
    token = Token20(_token);
    roundPeriod = _roundPeriod;
    round.tradeVolume = _tradeVolume;
    round.salePrice = _salePrice;
  }

  function register(address referrer) external {
    require(referrers[msg.sender] == address(0), "Already registered");
    require(
      (referrer != msg.sender && referrers[referrer] != address(0)) ||
        referrer == address(0),
      "Wrong referrer"
    );
    if (referrer == address(0)) referrer = address(this);
    referrers[msg.sender] = referrer;
    emit UserRegistered(msg.sender, referrer);
  }

  function startSaleRound() external roundCanStart(Step.Sale) {
    round.endTime = block.timestamp + roundPeriod;
    round.step = Step.Sale;
    round.saleVolume = ethToToken(round.tradeVolume, round.salePrice);
    token.mint(address(this), round.saleVolume);
    emit SaleRoundStarted(round.saleVolume, round.salePrice, round.endTime);
  }

  function ethToToken(uint256 eth, uint256 value) internal view returns (uint256) {
    return (eth / value) * 10**token.decimals();
  }

  function buyACDM() external payable roundIsOn(Step.Sale) enoughTokensForSale {
    uint256 tokenValue = ethToToken(msg.value, round.salePrice);
    round.saleVolume -= tokenValue;
    token.safeTransfer(msg.sender, tokenValue);
    payReferrers(msg.value, msg.sender);
  }

  function payReferrers(uint256 value, address addr) internal {
    address[2] memory refers = [referrers[addr], referrers[referrers[addr]]];
    for (uint256 i = 0; i < 2; i++)
      if (refers[i] != address(0) && refers[i] != address(this))
        payable(refers[i]).transfer(
          (value * referPercents[round.step == Step.Sale ? 0 : 1][i]) / 10 / 100
        );
  }

  function startTradeRound() external roundCanStart(Step.Trade) {
    round.endTime = block.timestamp + roundPeriod;
    round.step = Step.Trade;
    round.tradeVolume = 0;
    round.salePrice = (round.salePrice * 103) / 100 + 4e12;
    if (round.saleVolume > 0) token.burn(address(this), round.saleVolume);
    emit TradeRoundStarted(round.endTime);
  }

  function addOrder(uint256 value, uint256 eth)
    external
    roundIsOn(Step.Trade)
    returns (uint256)
  {
    token.safeTransferFrom(msg.sender, address(this), value);
    uint256 id = ++orderCount;
    Order storage order = orders[id];
    order.owner = msg.sender;
    order.amount = value;
    order.price = ethToToken(eth, value);
    emit OrderAdded(id, order.owner, value, eth, order.price);
    return id;
  }

  function redeemOrder(uint256 id)
    external
    payable
    roundIsOn(Step.Trade)
    orderIsOn(id)
    enoughTokensForTrade(id)
  {
    Order storage order = orders[id];
    uint256 value = ethToToken(msg.value, order.price);
    order.amount -= value;
    round.tradeVolume += msg.value;
    token.transfer(msg.sender, value);
    payable(order.owner).transfer(
      (msg.value * (1000 - referPercents[1][0] - referPercents[1][0])) / 10 / 100
    );
    payReferrers(msg.value, order.owner);
    if (order.amount == 0) emit OrderClosed(id);
  }

  function removeOrder(uint256 id) external {
    require(orders[id].owner == msg.sender, "Only owner");
    uint256 value = orders[id].amount;
    orders[id] = orders[0];
    token.safeTransfer(msg.sender, value);
    emit OrderClosed(id);
  }

  function setSaleReferPercents(uint256 val1, uint256 val2) external onlyRole(DAO_ROLE) {
    referPercents[0][0] = val1;
    referPercents[0][1] = val2;
  }

  function setTradeReferPercents(uint256 val1, uint256 val2) external onlyRole(DAO_ROLE) {
    referPercents[1][0] = val1;
    referPercents[1][1] = val2;
  }

  function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
    payable(dao).transfer(address(this).balance);
  }

  modifier roundCanStart(Step step) {
    require(round.step != step, "Already started");
    require(
      round.endTime < block.timestamp ||
        (step == Step.Trade && token.balanceOf(address(this)) == 0),
      "Previous round did not end"
    );
    _;
  }

  modifier roundIsOn(Step step) {
    require(round.step == step && block.timestamp < round.endTime, "Round is over");
    _;
  }

  modifier orderIsOn(uint256 id) {
    require(orders[id].amount > 0, "Order over");
    _;
  }

  modifier enoughTokensForSale() {
    require(
      ethToToken(msg.value, round.salePrice) <= token.balanceOf(address(this)),
      "Not enough tokens for sale"
    );
    _;
  }

  modifier enoughTokensForTrade(uint256 id) {
    require(
      ethToToken(msg.value, orders[id].price) <= orders[id].amount,
      "Not enough tokens for trade"
    );
    _;
  }

  event UserRegistered(address indexed user, address indexed referrer);
  event SaleRoundStarted(
    uint256 indexed amount,
    uint256 indexed price,
    uint256 indexed endTime
  );
  event TradeRoundStarted(uint256 indexed endTime);
  event OrderAdded(
    uint256 indexed id,
    address indexed owner,
    uint256 indexed amountTokens,
    uint256 amountEther,
    uint256 price
  );
  event OrderClosed(uint256 indexed id);
}
