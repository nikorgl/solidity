import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

task("deposit")
  .addParam("addr", "Participant address")
  .addParam("value", "Amount value")
  .setAction(async (taskArgs, { ethers }) => {
    const signer = await ethers.getSigner(taskArgs.addr);

    const contractAddress = process.env["ADDRESS_DAO"];
    if (!contractAddress) throw Error("No DAO address provided");
    const dao = await ethers.getContractAt("DAO", contractAddress);

    const tokenAddress = process.env["ADDRESS_TOKEN"];
    if (!tokenAddress) throw Error("No token address provided");
    const token = await ethers.getContractAt("Token20", tokenAddress);

    await token.connect(signer).approve(dao.address, taskArgs.value);
    const tx = await dao.connect(signer).deposit(taskArgs.value);
    const receipt = await tx.wait();
    console.log(
      "Event Deposit emited with args: ",
      receipt.events?.filter((x: any) => {
        return x.event == "Deposit";
      })[0].args
    );
  });
