import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Market, Token721, Token20 } from "../typechain";
import {
  IPFS_URI_721,
  NAME_721,
  SYMBOL_721,
  NAME_20,
  SYMBOL_20,
  MARKET_AUCTION_PERIOD,
  MARKET_BID_MIN_COUNT,
} from "../const";

describe("Auction testing", function () {
  let nft: Token721;
  let token: Token20;
  let market: Market;
  let signers: SignerWithAddress[];
  const tokenCount = 10;
  let bid = 100;

  before(async () => {
    signers = await ethers.getSigners();
    const nftFactory = await ethers.getContractFactory("Token721");
    nft = await nftFactory.deploy(NAME_721, SYMBOL_721, IPFS_URI_721);
    await nft.deployed();

    const tokenFactory = await ethers.getContractFactory("Token20");
    token = await tokenFactory.deploy(NAME_20, SYMBOL_20);
    await token.deployed();

    const marketFactory = await ethers.getContractFactory("Market");
    market = await marketFactory.deploy(
      nft.address,
      token.address,
      MARKET_AUCTION_PERIOD,
      MARKET_BID_MIN_COUNT
    );
    await market.deployed();

    await nft.transferOwnership(market.address);
    await token.mint(market.address, 1e10);
    await token.mint(signers[0].address, 1e10);
    await token.mint(signers[2].address, 1e10);
  });

  describe(`Creating ${tokenCount} items`, function () {
    it("Check of NFT token ID counter", async () => {
      for (let nftId = 1; nftId <= tokenCount; nftId++) {
        await market.connect(signers[nftId]).createItem();
        expect(await nft.currentTokenId()).eq(nftId);
      }
    });
    it("NFT token owner should be sender", async () => {
      for (let nftId = 1; nftId <= tokenCount; nftId++)
        expect(await nft.ownerOf(nftId)).eq(signers[nftId].address);
    });
    it("Check of token URI", async () => {
      for (let nftId = 1; nftId <= tokenCount; nftId++)
        expect(await nft.tokenURI(nftId)).eq(`${IPFS_URI_721}${nftId}`);
    });
  });

  describe(`Listing ${tokenCount - 1} items on auction`, function () {
    it("Listing item by alien should be reverted", async () => {
      for (let nftId = 1; nftId <= tokenCount; nftId++)
        await expect(
          market.connect(signers[nftId - 1]).listItemOnAuction(nftId, bid)
        ).to.be.revertedWith("Caller is not owner");
    });
    it("Listing non-exist item should be reverted", async () => {
      await expect(market.listItemOnAuction(tokenCount + 1, bid)).to.be.revertedWith(
        "Item not exists"
      );
    });
    it("List item on auction", async () => {
      for (let nftId = 1; nftId < tokenCount; nftId++) {
        await nft.connect(signers[nftId]).approve(market.address, nftId);
        await expect(market.connect(signers[nftId]).listItemOnAuction(nftId, bid))
          .to.emit(market, "AuctionItemListed")
          .withArgs(signers[nftId].address, nftId, bid);
        expect((await market.items(nftId)).isActive).to.be.true;
        expect(await nft.ownerOf(nftId)).eq(market.address);
      }
    });
  });

  describe("Bidding item", function () {
    it("Bid should be reverted if item not exists", async () => {
      await expect(market.makeBid(tokenCount + 1, bid)).to.be.revertedWith(
        "Item not exists"
      );
    });
    it("Bid should be reverted if item exists but not listed", async () => {
      await expect(market.makeBid(tokenCount, bid)).to.be.revertedWith(
        "Item is not at auction"
      );
    });
    it("Too small bid should be reverted", async () => {
      await expect(market.makeBid(1, bid)).to.be.revertedWith("Too small bid");
    });
    it(`Making bids for ${tokenCount - 1} items`, async () => {
      bid++;
      for (let nftId = 1; nftId < tokenCount; nftId++) {
        await token.approve(market.address, bid);
        await expect(() =>
          expect(market.makeBid(nftId, bid))
            .to.emit(market, "AuctionItemBidden")
            .withArgs(signers[0].address, nftId, bid)
        ).to.changeTokenBalances(token, [signers[0], market], [-bid, bid]);
        expect((await market.items(nftId)).bid).eq(bid);
        expect((await market.items(nftId)).bidder).eq(signers[0].address);
      }
    });
    it(`Making second bid for one item`, async () => {
      bid++;
      const nftId = 1;
      await token.connect(signers[nftId + 1]).approve(market.address, bid);
      await expect(() =>
        market.connect(signers[nftId + 1]).makeBid(nftId, bid)
      ).to.changeTokenBalances(
        token,
        [signers[nftId + 1], market, signers[0]],
        [-bid, bid - (bid - 1), bid - 1]
      );
      expect((await market.items(nftId)).bid).eq(bid);
      expect((await market.items(nftId)).bidder).eq(signers[nftId + 1].address);
    });
    it("Premature finish should be reverted", async () => {
      const nftId = 1;
      await expect(market.finishAuction(nftId)).to.be.revertedWith("Auction is not gone");
    });
    it("Belated bid should be reverted", async () => {
      await ethers.provider.send("evm_increaseTime", [MARKET_AUCTION_PERIOD]);
      await expect(market.makeBid(1, bid + 1)).to.be.revertedWith("Auction time is gone");
    });
  });

  describe("Finishing item", function () {
    it("Finish should be reverted if item not exists", async () => {
      await expect(market.finishAuction(tokenCount + 1)).to.be.revertedWith(
        "Item not exists"
      );
    });
    it("Finish should be reverted if item exists but not listed", async () => {
      await expect(market.finishAuction(tokenCount)).to.be.revertedWith(
        "Item is not at auction"
      );
    });
    describe("Finish success auction", function () {
      const nftId = 1;
      it("Payment should be sent to auctioneer (signers[1])", async () => {
        await expect(() =>
          expect(market.finishAuction(nftId))
            .emit(market, "AuctionFinished")
            .withArgs(signers[2].address, nftId, bid)
        ).to.changeTokenBalances(token, [market, signers[1]], [-bid, bid]);
      });
      it("NFT should be sent to last bidder (signers[2])", async () => {
        expect((await market.items(nftId)).isActive).to.be.false;
        expect(await nft.ownerOf(1)).eq(signers[2].address);
      });
      it("Second finish should be reverted", async () => {
        await expect(market.finishAuction(1)).to.be.revertedWith(
          "Item is not at auction"
        );
      });
    });
    describe("Finish failed auction", function () {
      const nftId = 2;
      it("Payment should be sent to last bidder (signers[0])", async () => {
        await expect(() =>
          expect(market.finishAuction(nftId))
            .emit(market, "AuctionCanceled")
            .withArgs(nftId)
        ).to.changeTokenBalances(token, [market, signers[0]], [1 - bid, bid - 1]);
      });
      it("NFT should be sent to auctioneer (signers[2])", async () => {
        expect((await market.items(nftId)).isActive).to.be.false;
        expect(await nft.ownerOf(1)).eq(signers[2].address);
      });
    });
  });

  describe("Auction parameters setting", function () {
    it("Should be reverted if caller is not marketplace owner", async () => {
      await expect(market.connect(signers[1]).setBidMinCount(5)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
    it("Should be reverted if value is not postive", async () => {
      await expect(market.setBidMinCount(0)).to.be.revertedWith("Value must be positive");
    });
    it("Minimal count of bids should be changed", async () => {
      await market.setBidMinCount(5);
      expect(await market.bidMinCount()).eq(5);
    });
    it("Auction duration should be changed", async () => {
      await market.setAuctionPeriod(999);
      expect(await market.auctionPeriod()).eq(999);
    });
  });

  describe("Try to bid for sale item", function () {
    const nftId = tokenCount;
    const itemPrice = 100;
    it("Listing item", async () => {
      await nft.connect(signers[nftId]).approve(market.address, nftId);
      await expect(market.connect(signers[nftId]).listItem(nftId, itemPrice))
        .to.emit(market, "ItemListed")
        .withArgs(signers[nftId].address, nftId, itemPrice);
    });
    it("Bid should be reverted if item is listed for sale, but not for auction", async () => {
      await expect(market.makeBid(nftId, bid)).to.be.revertedWith(
        "Item is not at auction"
      );
    });
  });
  describe("Try to buy auction item as item for sale", function () {
    const nftId = tokenCount + 1;
    const itemPrice = 100;
    it("Listing item", async () => {
      await expect(market.connect(signers[nftId]).createItem())
        .to.emit(market, "ItemCreated")
        .withArgs(signers[nftId].address, nftId);
      expect(await nft.currentTokenId()).eq(nftId);

      await nft.connect(signers[nftId]).approve(market.address, nftId);
      await expect(market.connect(signers[nftId]).listItemOnAuction(nftId, itemPrice))
        .to.emit(market, "AuctionItemListed")
        .withArgs(signers[nftId].address, nftId, itemPrice);
    });
    it("Buying should be reverted if item is listed for auction, but not for sale", async () => {
      await expect(market.buyItem(nftId)).to.be.revertedWith(
        "Item is not for sale"
      );
    });
  });
});
