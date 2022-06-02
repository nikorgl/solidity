import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
dotenv.config();

task("stakingUnstake", "Unstake a stake").setAction(async (taskArgs, { ethers }) => {
  const { ADDRESS_STAKING } = process.env;
  const staking = await ethers.getContractAt("Staking", ADDRESS_STAKING);
  const tx = await staking.unstake();
  await tx.wait();
  console.log(`Unstaked. Transaction ${tx.hash}`);
});
