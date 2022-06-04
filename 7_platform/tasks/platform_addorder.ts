import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
dotenv.config();

task("acdmAddOrder", "Add order in trade round")
  .addParam("user", "User address")
  .addParam("acdm", "ACDM token value")
  .addParam("value", "Eth value")
  .setAction(async (taskArgs, { ethers }) => {
    const { ADDRESS_ACDM_PLATFORM, ADDRESS_ACDMTOKEN } = process.env;
    const acdmtoken = await ethers.getContractAt("Token20", ADDRESS_ACDMTOKEN);
    const platform = await ethers.getContractAt("Platform", ADDRESS_ACDM_PLATFORM);
    const user = await ethers.getSigner(taskArgs.user);
    await acdmtoken
      .connect(user)
      .approve(platform.address, ethers.utils.parseUnits(taskArgs.acdm, 6));
    const tx = await platform
      .connect(user)
      .addOrder(
        ethers.utils.parseUnits(taskArgs.acdm, 6),
        ethers.utils.parseEther(taskArgs.value)
      );
    await tx.wait();
    console.log(`Order added. Transaction ${tx.hash}`);
  });
