import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
dotenv.config();

task("acdmStartTrade", "Start trade round").setAction(async (taskArgs, { ethers }) => {
  const { ADDRESS_ACDM_PLATFORM } = process.env;
  const platform = await ethers.getContractAt("Platform", ADDRESS_ACDM_PLATFORM);
  const tx = await platform.startSaleRound();
  await tx.wait();
  console.log(`Trade round started. Transaction ${tx.hash}`);
});
