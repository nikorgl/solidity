import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

task("withdraw")
  .addParam("addr", "Participant address")
  .setAction(async (taskArgs, { ethers }) => {
    const signer = await ethers.getSigner(taskArgs.addr);

    const contractAddress = process.env["ADDRESS_DAO"];
    if (!contractAddress) throw Error("No DAO address provided");
    const dao = await ethers.getContractAt("DAO", contractAddress);

    const tx = await dao.connect(signer).withdraw();
    const receipt = await tx.wait();
    console.log(
      "Event Withdraw emited with args: ",
      receipt.events?.filter((x: any) => {
        return x.event == "Withdraw";
      })[0].args
    );
  });
