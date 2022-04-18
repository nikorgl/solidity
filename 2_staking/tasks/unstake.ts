import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import StakeArtifact from "../artifacts/contracts/Staking.sol/Staking.json";
dotenv.config();

task("unstake", "Unstake a stake").setAction(async (taskArgs, hre) => {
  const { STAKING_ADDR } = process.env;
  const accounts = await hre.ethers.getSigners();

  const staking = new hre.ethers.Contract(String(STAKING_ADDR), StakeArtifact.abi, accounts[0]);

  const tx = await staking.unstake();
  await tx.wait();
  console.log(`Unstaked. Transaction ${tx.hash}`);
});
