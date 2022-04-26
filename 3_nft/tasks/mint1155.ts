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

task("mint1155")
  .addParam("to", "Address to mint")
  .addParam("tokenid", "Token ID")
  .setAction(async (taskArgs: TaskArgs, hre) => {
    const { TOKEN1155_ADDR } = process.env;
    const token = await hre.ethers.getContractAt("Token1155", String(TOKEN1155_ADDR));
    await token.mint(taskArgs.to, taskArgs.tokenid, 1);
    console.log("Minted");
  });
