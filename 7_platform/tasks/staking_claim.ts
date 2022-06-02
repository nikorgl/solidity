import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
dotenv.config();

task("stakingClaim", "Claim a reward").setAction(async (taskArgs, { ethers }) => {
  const { ADDRESS_STAKING } = process.env;
  const staking = await ethers.getContractAt("Staking", ADDRESS_STAKING);
  const tx = await staking.claim();
  await tx.wait();
  console.log(`Claimed. Transaction ${tx.hash}`);
});
