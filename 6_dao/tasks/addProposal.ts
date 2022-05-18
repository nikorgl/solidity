import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

task("addProposal")
  .addParam("recipient", "Recipient contract address")
  .addParam("calldata", "Encoded function with signature")
  .addParam("description", "Proposal description")
  .setAction(async (taskArgs, { ethers }) => {
    const chairmanAddress = process.env["ADDRESS_CHAIRMAN"];
    if (!chairmanAddress) throw Error("No chairman address provided");
    const chairman = await ethers.getSigner(chairmanAddress);

    const contractAddress = process.env["ADDRESS_DAO"];
    if (!contractAddress) throw Error("No DAO address provided");
    const dao = await ethers.getContractAt("DAO", contractAddress);

    const tx = await dao
      .connect(chairman)
      .addProposal(taskArgs.recipient, taskArgs.calldata, taskArgs.description);
    const receipt = await tx.wait();
    console.log(
      "Event ProposalAdded emited with args: ",
      receipt.events?.filter((x: any) => {
        return x.event == "ProposalAdded";
      })[0].args
    );
  });
