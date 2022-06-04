import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
dotenv.config();

task("acdmRedeemOrder", "Redeem order in trade round")
  .addParam("user", "User address")
  .addParam("id", "Order id")
  .addParam("value", "Eth value")
  .setAction(async (taskArgs, { ethers }) => {
    const { ADDRESS_ACDM_PLATFORM } = process.env;
    const platform = await ethers.getContractAt("Platform", ADDRESS_ACDM_PLATFORM);
    const user = await ethers.getSigner(taskArgs.user);
    const tx = await platform
      .connect(user)
      .redeemOrder(taskArgs.id, { value: ethers.utils.parseEther(taskArgs.value) });
    await tx.wait();
    console.log(`Registered. Transaction ${tx.hash}`);
  });
