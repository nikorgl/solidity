import { expect } from "chai";
import hre, { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Staking, DAO, Token20 } from "../typechain";

describe("Staking", function () {
  let lptoken: Token20;
  let xtoken: Token20;
  let staking: Staking;
  let signers: SignerWithAddress[];
  const sum = 1e5;
  const percent = 3;
  const rewardPeriod = 604800;
  const lockStakePeriod = 2592000;

  before(async () => {
    signers = await ethers.getSigners();

    lptoken = await hre.run("deployToken", {
      tokenname: "tokenLP",
      tokensymbol: "LP",
    });
    lptoken.mint(signers[0].address, 1e10);
    lptoken.transfer(signers[1].address, 2 * sum);

    xtoken = await hre.run("deployToken", {
      tokenname: "TokenXXX",
      tokensymbol: "XXX",
    });
    xtoken.mint(signers[0].address, 1e10);

    staking = await hre.run("deployStaking", {
      lptoken: lptoken.address,
      xtoken: xtoken.address,
    });
    await xtoken.transfer(staking.address, 2 * sum);

    const dao = await hre.run("deployDAO", {
      staking: staking.address,
      chairman: signers[0].address,
      voteperiod: "259200",
      mintokens: "1000",
    });
    await staking.setDAOAddress(dao.address);
  });

  it("Should staked", async function () {
    await lptoken.connect(signers[1]).approve(staking.address, sum * 2);
    await expect(() => staking.connect(signers[1]).stake(sum)).to.changeTokenBalance(
      lptoken,
      signers[1],
      -sum
    );
    expect((await staking.wallets(signers[1].address)).balance).equal(sum);
  });

  it("Should not rewarded too soon", async function () {
    await expect(staking.connect(signers[1]).claim()).to.be.revertedWith("Too soon");
  });

  let firstStakeReward: Number;
  it("Should stake added", async function () {
    await ethers.provider.send("evm_increaseTime", [0.3 * rewardPeriod]);
    await staking.connect(signers[1]).stake(sum);
    const wallet = await staking.wallets(signers[1].address);
    firstStakeReward =
      (((sum * percent) / 100) * (Number(wallet.updatedAt) - Number(wallet.createdAt))) /
      rewardPeriod;
  });

  it("Should rewarded", async function () {
    await ethers.provider.send("evm_increaseTime", [rewardPeriod]);
    await expect(() => staking.connect(signers[1]).claim()).to.changeTokenBalance(
      xtoken,
      signers[1],
      Number(firstStakeReward.toFixed(0)) + (sum * 2 * percent) / 100
    );
  });

  it("Should not unstaked too soon", async function () {
    await expect(staking.connect(signers[1]).unstake()).to.be.revertedWith("Too soon");
  });

  it("Should not unstaked if zero balance", async function () {
    await expect(staking.connect(signers[2]).unstake()).to.be.revertedWith(
      "Zero balance"
    );
  });

  it("Unstake should be success", async function () {
    await ethers.provider.send("evm_increaseTime", [lockStakePeriod - rewardPeriod]);
    await expect(() => staking.connect(signers[1]).unstake()).to.changeTokenBalance(
      lptoken,
      signers[1],
      sum * 2
    );
  });

  it("Staking parameters should be changed", async function () {
    await staking.setRewardPeriod(77);
    expect(await staking.rewardPeriod()).equal(77);
    await staking.setRewardPercent(99);
    expect(await staking.rewardPercent()).equal(99);
  });
});
