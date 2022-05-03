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

describe("Simple sale testing", function () {
  let nft: Token721;
  let token: Token20;
  let market: Market;
  let signers: SignerWithAddress[];
  const nftCount = 5;
  const itemPrice = 99;

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
    await token.mint(signers[1].address, 1e10);
    await token.mint(signers[2].address, 1e10);
  });

  describe("Creating item", function () {
    it("Check of NFT token ID counter", async () => {
      for (let nftId = 1; nftId <= nftCount; nftId++) {
        await expect(market.createItem())
          .to.emit(market, "ItemCreated")
          .withArgs(signers[0].address, nftId);
        expect(await nft.currentTokenId()).eq(nftId);
      }
    });
    it("NFT Token owner should be sender", async () => {
      for (let nftId = 1; nftId <= nftCount; nftId++)
        expect(await nft.ownerOf(nftId)).eq(signers[0].address);
    });
    it("Check of NFT token URI", async () => {
      for (let nftId = 1; nftId <= nftCount; nftId++)
        expect(await nft.tokenURI(nftId)).eq(`${IPFS_URI_721}${nftId}`);
    });
  });

  describe("Listing item", function () {
    it("Listing item by alien should be reverted", async () => {
      await expect(market.connect(signers[1]).listItem(1, itemPrice)).to.be.revertedWith(
        "Caller is not owner"
      );
    });
    it("Listing non-exist item should be reverted", async () => {
      await expect(market.listItem(nftCount + 1, itemPrice)).to.be.revertedWith(
        "Item not exists"
      );
    });
    it("List item", async () => {
      for (let nftId = 1; nftId < nftCount; nftId++) {
        await nft.approve(market.address, nftId);
        await expect(market.listItem(nftId, itemPrice))
          .to.emit(market, "ItemListed")
          .withArgs(signers[0].address, nftId, itemPrice);
        expect((await market.items(nftId)).price).eq(itemPrice);
        expect(await nft.ownerOf(nftId)).eq(market.address);
      }
    });
  });

  describe("Buying item", function () {
    const nftId = 1;
    it("Buy of not selling item should be reverted", async () => {
      await expect(market.buyItem(nftCount)).to.be.revertedWith("Item is not for sale");
    });
    it("Buy without sufficient token amount should be reverted", async () => {
      await expect(market.connect(signers[2]).buyItem(nftId)).to.be.revertedWith(
        "Too few approved tokens"
      );
    });
    it("Buy without approved token amount should be reverted", async () => {
      await expect(market.connect(signers[1]).buyItem(nftId)).to.be.revertedWith(
        "Too few approved tokens"
      );
    });
    it("Buy item", async () => {
      token.connect(signers[1]).approve(market.address, itemPrice);
      await expect(() =>
        expect(market.connect(signers[1]).buyItem(nftId))
          .emit(market, "ItemBought")
          .withArgs(signers[1].address, nftId, itemPrice)
      ).to.changeTokenBalances(token, [signers[1], signers[0]], [-itemPrice, itemPrice]);
      expect((await market.items(nftId)).isActive).to.be.false;
      expect(await nft.ownerOf(nftId)).eq(signers[1].address);
    });
    it("Buy front-running should be reverted", async () => {
      const nftId = 2;
      token.connect(signers[1]).approve(market.address, itemPrice);
      token.connect(signers[2]).approve(market.address, itemPrice);
      market.connect(signers[1]).buyItem(nftId);
      await expect(market.connect(signers[2]).buyItem(nftId)).to.be.revertedWith(
        "Item is not for sale"
      );
    });
  });

  describe("Cancel item", function () {
    const nftId = nftCount - 1;
    it("Cancel of sold item should be reverted", async () => {
      await expect(market.cancel(1)).to.be.revertedWith("Item is not for sale");
    });
    it("Cancel item by alien should be reverted", async () => {
      await expect(market.connect(signers[1]).cancel(nftId)).to.be.revertedWith(
        "Caller is not seller"
      );
    });
    it("Cancel item", async () => {
      await expect(market.cancel(nftId)).to.emit(market, "ItemCanceled").withArgs(nftId);
      expect((await market.items(nftId)).isActive).to.be.false;
      expect(await nft.ownerOf(nftId)).eq(signers[0].address);
    });
    it("Second cancel item should be reverted", async () => {
      await expect(market.cancel(nftId)).to.be.revertedWith("Item is not for sale");
    });
    it("Buy of cancelled item should be reverted", async () => {
      await expect(market.buyItem(nftId)).to.be.revertedWith("Item is not for sale");
    });
  });
});
