import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import { BigNumberish } from "ethers";
dotenv.config();

interface TaskArgs {
  to: string;
  tokenid: BigNumberish;
}

task("mint721")
  .addParam("to", "Address to mint")
  .addParam("tokenid", "Token ID")
  .setAction(async (taskArgs: TaskArgs, hre) => {
    const { TOKEN721_ADDR } = process.env;
    const token = await hre.ethers.getContractAt("Token721", String(TOKEN721_ADDR));
    await token.mint(taskArgs.to, taskArgs.tokenid);
    console.log("Minted");
  });
