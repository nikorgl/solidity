import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
dotenv.config();

task("acdmRemoveOrder", "Remove order in trade round")
  .addParam("user", "User address")
  .addParam("id", "Order id")
  .setAction(async (taskArgs, { ethers }) => {
    const { ADDRESS_ACDM_PLATFORM } = process.env;
    const platform = await ethers.getContractAt("Platform", ADDRESS_ACDM_PLATFORM);
    const user = await ethers.getSigner(taskArgs.user);
    const tx = await platform.connect(user).removeOrder(taskArgs.id);
    await tx.wait();
    console.log(`Order removed. Transaction ${tx.hash}`);
  });
