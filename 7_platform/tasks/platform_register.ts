import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
dotenv.config();

task("acdmRegister", "Register in ACDM platform")
  .addParam("user", "User address")
  .addOptionalParam("referrer", "Referrer address")
  .setAction(async (taskArgs, { ethers }) => {
    const { ADDRESS_ACDM_PLATFORM } = process.env;
    const platform = await ethers.getContractAt("Platform", ADDRESS_ACDM_PLATFORM);
    const user = await ethers.getSigner(taskArgs.user);
    const tx = await platform
      .connect(user)
      .register(taskArgs.referrer || ethers.constants.AddressZero);
    await tx.wait();
    console.log(`Registered. Transaction ${tx.hash}`);
  });
