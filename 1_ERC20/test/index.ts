import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";

import { Token__factory, Token } from "../typechain";

const { expect } = chai;

describe("Token", () => {
  let tokenFactory: Token__factory;
  let token: Token;
  let signers: SignerWithAddress[];
  const sum = 2222;

  beforeEach(async () => {
    tokenFactory = await ethers.getContractFactory("Token");
    token = await tokenFactory.deploy();
    await token.deployed();

    signers = await ethers.getSigners();
  });

  it("It should be transfered", async () => {
    await expect(() =>
      token.transfer(signers[1].address, sum)
    ).to.changeTokenBalances(token, [signers[0], signers[1]], [-sum, sum]);
  });

  it("Transfer with insufficient balance should be reverted", async () => {
    await expect(
      token.connect(signers[1]).transfer(signers[2].address, sum)
    ).to.be.revertedWith("Insufficient balance");
  });

  it("Transfer from another account should be successful", async () => {
    await token.transfer(signers[1].address, sum);
    await token.connect(signers[1]).approve(signers[2].address, sum);
    expect(await token.allowance(signers[1].address, signers[2].address)).equal(
      sum
    );

    await expect(() =>
      token
        .connect(signers[2])
        .transferFrom(signers[1].address, signers[0].address, sum)
    ).to.changeTokenBalances(token, [signers[1], signers[0]], [-sum, sum]);
  });

  it("Transfer with insufficient allowance from another account should be reverted", async () => {
    await token.transfer(signers[1].address, sum);
    await expect(
      token
        .connect(signers[2])
        .transferFrom(signers[1].address, signers[0].address, sum)
    ).to.be.revertedWith("Insufficient allowance");
  });

  it("Mint should be successful", async () => {
    const totalSupply = await token.totalSupply();
    await expect(() =>
      token.mint(signers[1].address, sum)
    ).to.changeTokenBalance(token, signers[1], sum);
    expect(await token.totalSupply()).equal(totalSupply.add(sum));
  });

  it("Burn should be successful", async () => {
    const totalSupply = await token.totalSupply();
    await expect(() =>
      token.burn(signers[0].address, sum)
    ).to.changeTokenBalance(token, signers[0], -sum);
    expect(await token.totalSupply()).equal(totalSupply.sub(sum));
  });

  it("Mint to zero address should be reverted", async () => {
    await expect(
      token.mint(ethers.constants.AddressZero, sum)
    ).to.be.revertedWith("Zero address");
  });

  it("Mint from alien should be reverted", async () => {
    await expect(
      token.connect(signers[1]).mint(signers[0].address, sum)
    ).to.be.revertedWith("Caller is not owner");
  });
});
