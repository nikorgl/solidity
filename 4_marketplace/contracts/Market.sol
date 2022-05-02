//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./Token721.sol";
import "./Token20.sol";
import "hardhat/console.sol";

contract Market is Ownable, IERC721Receiver {
  using SafeERC20 for IERC20;
  struct Item {
    address seller;
    uint256 price;
    bool isActive;
    uint256 startAt;
    uint256 auctionPeriod;
    uint256 bid;
    address bidder;
    uint256 bidCount;
  }
  Token721 public nftToken;
  IERC20 public token;
  mapping(uint256 => Item) public items;
  uint256 public auctionPeriod;
  uint256 public bidMinCount;

  event ItemCreated(address indexed seller, uint256 indexed tokenId);
  event ItemListed(address indexed seller, uint256 indexed tokenId, uint256 price);
  event ItemBought(address indexed buyer, uint256 indexed tokenId, uint256 price);
  event ItemCanceled(uint256 indexed tokenId);
  event AuctionItemListed(
    address indexed seller,
    uint256 indexed tokenId,
    uint256 startBid
  );
  event AuctionItemBidden(address indexed bidder, uint256 indexed tokenId, uint256 bid);
  event AuctionFinished(address indexed buyer, uint256 indexed tokenId, uint256 bid);
  event AuctionCanceled(uint256 indexed tokenId);

  constructor(
    address _nftToken,
    address _token,
    uint256 _auctionPeriod,
    uint256 _bidMinCount
  ) {
    nftToken = Token721(_nftToken);
    token = Token20(_token);
    auctionPeriod = _auctionPeriod;
    bidMinCount = _bidMinCount;
  }

  function createItem() external returns (uint256) {
    uint256 tokenId = mint(msg.sender);
    emit ItemCreated(msg.sender, tokenId);
    return tokenId;
  }

  function mint(address to) public returns (uint256) {
    uint256 tokenId = nftToken.mint(to);
    return tokenId;
  }

  modifier existsItem(uint256 tokenId) {
    require(0 < tokenId && tokenId <= nftToken.currentTokenId(), "Item not exists");
    _;
  }

  modifier activeSale(uint256 tokenId) {
    require(items[tokenId].isActive && items[tokenId].price > 0, "Item is not for sale");
    _;
  }

  modifier enoughTokens(uint256 value) {
    require(
      token.balanceOf(msg.sender) >= value &&
        token.allowance(msg.sender, address(this)) >= value,
      "Too few approved tokens"
    );
    _;
  }

  modifier onlyNftOwner(uint256 tokenId) {
    require(nftToken.ownerOf(tokenId) == msg.sender, "Caller is not owner");
    _;
  }

  modifier onlySeller(uint256 tokenId) {
    require(items[tokenId].seller == msg.sender, "Caller is not seller");
    _;
  }

  function listItem(uint256 tokenId, uint256 price)
    external
    existsItem(tokenId)
    onlyNftOwner(tokenId)
  {
    Item storage item;
    item = items[tokenId];
    item.seller = msg.sender;
    item.price = price;
    item.isActive = true;
    nftToken.safeTransferFrom(msg.sender, address(this), tokenId);
    emit ItemListed(msg.sender, tokenId, price);
  }

  function buyItem(uint256 tokenId)
    external
    existsItem(tokenId)
    activeSale(tokenId)
    enoughTokens(items[tokenId].price)
  {
    Item storage item = items[tokenId];
    item.isActive = false;
    token.safeTransferFrom(msg.sender, item.seller, item.price);
    nftToken.safeTransferFrom(address(this), msg.sender, tokenId);
    emit ItemBought(msg.sender, tokenId, item.price);
  }

  function cancel(uint256 tokenId)
    external
    existsItem(tokenId)
    activeSale(tokenId)
    onlySeller(tokenId)
  {
    items[tokenId].isActive = false;
    nftToken.safeTransferFrom(address(this), msg.sender, tokenId);
    emit ItemCanceled(tokenId);
  }

  function listItemOnAuction(uint256 tokenId, uint256 startBid)
    external
    existsItem(tokenId)
    onlyNftOwner(tokenId)
  {
    Item storage item = items[tokenId];
    item.seller = msg.sender;
    item.startAt = block.timestamp;
    item.bid = startBid;
    item.bidder = address(0);
    item.bidCount = 0;
    item.isActive = true;
    item.auctionPeriod = auctionPeriod;
    nftToken.safeTransferFrom(msg.sender, address(this), tokenId);
    emit AuctionItemListed(msg.sender, tokenId, startBid);
  }

  function makeBid(uint256 tokenId, uint256 bid)
    external
    payable
    existsItem(tokenId)
    activeAuction(tokenId)
    onTime(tokenId)
    enoughBid(tokenId, bid)
    enoughTokens(bid)
  {
    Item storage item = items[tokenId];
    uint256 oldBid = item.bid;
    address oldBidder = item.bidder;
    item.bidCount++;
    item.bid = bid;
    item.bidder = msg.sender;
    token.safeTransferFrom(msg.sender, address(this), bid);
    if (oldBidder != address(0)) token.safeTransfer(oldBidder, oldBid);
    emit AuctionItemBidden(msg.sender, tokenId, bid);
  }

  modifier activeAuction(uint256 tokenId) {
    require(items[tokenId].isActive && items[tokenId].bid > 0, "Item is not at auction");
    _;
  }

  modifier onTime(uint256 tokenId) {
    require(
      block.timestamp < items[tokenId].startAt + items[tokenId].auctionPeriod,
      "Auction time is gone"
    );
    _;
  }

  modifier enoughBid(uint256 tokenId, uint256 bid) {
    require(bid > items[tokenId].bid, "Too small bid");
    _;
  }

  function finishAuction(uint256 tokenId)
    external
    existsItem(tokenId)
    activeAuction(tokenId)
    afterTime(tokenId)
  {
    Item storage item = items[tokenId];
    item.isActive = false;
    if (item.bidCount >= bidMinCount) {
      token.safeTransfer(item.seller, item.bid);
      nftToken.safeTransferFrom(address(this), item.bidder, tokenId);
      emit AuctionFinished(item.bidder, tokenId, item.bid);
    } else {
      token.safeTransfer(item.bidder, item.bid);
      nftToken.safeTransferFrom(address(this), item.seller, tokenId);
      emit AuctionCanceled(tokenId);
    }
  }

  modifier afterTime(uint256 tokenId) {
    require(
      items[tokenId].startAt + items[tokenId].auctionPeriod < block.timestamp,
      "Auction is not gone"
    );
    _;
  }

  function setAuctionPeriod(uint256 value) external onlyOwner positive(value) {
    auctionPeriod = value;
  }

  function setBidMinCount(uint256 value) external onlyOwner positive(value) {
    bidMinCount = value;
  }

  modifier positive(uint256 value) {
    require(value > 0, "Value must be positive");
    _;
  }

  function onERC721Received(
    address,
    address,
    uint256,
    bytes memory
  ) public virtual returns (bytes4) {
    return this.onERC721Received.selector;
  }
}
