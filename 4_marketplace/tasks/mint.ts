import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

interface TaskArgs {
  to: string;
}

task("mint")
  .addParam("to", "Address to mint")
  .setAction(async (taskArgs: TaskArgs, hre) => {
    const { MARKET_ADDR } = process.env;
    const token = await hre.ethers.getContractAt("Market", String(MARKET_ADDR));
    await token.mint(taskArgs.to);
    console.log("Minted");
  });
