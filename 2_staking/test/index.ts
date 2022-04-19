import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Staking, Token } from "../typechain";

describe("Staking", function () {
  let lpToken: Token;
  let rewardToken: Token;
  let staking: Staking;
  let signers: SignerWithAddress[];
  const sum = 1e5;
  const percent = 10;
  const rewardPeriod = 5;
  const lockStakePeriod = 10;

  before(async () => {
    signers = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("Token");
    lpToken = await tokenFactory.deploy();
    await lpToken.deployed();
    lpToken.transfer(signers[1].address, 2 * sum);

    rewardToken = await tokenFactory.deploy();
    await rewardToken.deployed();

    const stakingFactory = await ethers.getContractFactory("Staking");
    staking = await stakingFactory.deploy(
      lpToken.address,
      rewardToken.address,
      rewardPeriod,
      lockStakePeriod,
      percent
    );
    await staking.deployed();
    await rewardToken.transfer(staking.address, 2 * sum);
  });

  it("Should staked", async function () {
    await lpToken.connect(signers[1]).approve(staking.address, sum * 2);
    await expect(() => staking.connect(signers[1]).stake(sum)).to.changeTokenBalance(
      lpToken,
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
    await ethers.provider.send("evm_increaseTime", [0.3 * rewardPeriod ]);
    await staking.connect(signers[1]).stake(sum);
    const wallet = await staking.wallets(signers[1].address);
    firstStakeReward = sum * percent / 100 *
      (Number(wallet.updatedAt) - Number(wallet.createdAt)) / rewardPeriod;
  });

  it("Should rewarded", async function () {
    await ethers.provider.send("evm_increaseTime", [rewardPeriod]);
    await expect(() => staking.connect(signers[1]).claim()).to.changeTokenBalance(
      rewardToken,
      signers[1],
      Number(firstStakeReward)
        + sum * 2 * percent / 100
    );
  });

  it("Should not unstaked too soon", async function () {
    await expect(staking.connect(signers[1]).unstake()).to.be.revertedWith("Too soon");
  });

  it("Should not unstaked if zero balance", async function () {
    await expect(staking.connect(signers[2]).unstake()).to.be.revertedWith("Zero balance");
  });

  it("Should unstaked", async function () {
    await ethers.provider.send("evm_increaseTime", [lockStakePeriod - rewardPeriod]);
    await expect(() => staking.connect(signers[1]).unstake()).to.changeTokenBalance(
      lpToken,
      signers[1],
      sum * 2
    );
  });

  it("Should staking parameters be changed", async function () {
    await staking.setRewardPeriod(77);
    expect(await staking.rewardPeriod()).equal(77);
    await staking.setLockStakePeriod(88);
    expect(await staking.lockStakePeriod()).equal(88);
    await staking.setRewardPercent(99);
    expect(await staking.rewardPercent()).equal(99);
  });
});
