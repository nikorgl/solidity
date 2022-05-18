import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

task("vote")
  .addParam("addr", "Participant address")
  .addParam("id", "Proposal ID")
  .addParam("will", "Yes or No? (boolean)")
  .setAction(async (taskArgs, { ethers }) => {
    const signer = await ethers.getSigner(taskArgs.addr);

    const contractAddress = process.env["ADDRESS_DAO"];
    if (!contractAddress) throw Error("No DAO address provided");
    const dao = await ethers.getContractAt("DAO", contractAddress);

    const tx = await dao.connect(signer).vote(taskArgs.id, taskArgs.will);
    const receipt = await tx.wait();
    console.log(
      "Event Vote emited with args: ",
      receipt.events?.filter((x: any) => {
        return x.event == "Vote";
      })[0].args
    );
  });
