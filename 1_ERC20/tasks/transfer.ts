import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import TokenArtifact from "../artifacts/contracts/Token.sol/Token.json";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

task("transfer", "Transfer")
  .addParam("to", "Receiver address")
  .addParam("sum", "Amount")
  .setAction(async (taskArgs, { ethers }) => {
    const accounts = await ethers.getSigners();
    const token = new ethers.Contract(
        process.env.CONTRACT_ADDR ? process.env.CONTRACT_ADDR : '',
        TokenArtifact.abi,
        accounts[0],
    );
    await token.transfer(taskArgs.to, taskArgs.sum);
  });
