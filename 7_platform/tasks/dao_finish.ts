import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
dotenv.config();

task("daoFinish")
  .addParam("id", "Proposal ID")
  .setAction(async (taskArgs, { ethers }) => {
    const contractAddress = process.env["ADDRESS_DAO"];
    if (!contractAddress) throw Error("No DAO address provided");
    const dao = await ethers.getContractAt("DAO", contractAddress);

    const tx = await dao.finish(taskArgs.id);
    const receipt = await tx.wait();

    let events = receipt.events?.filter((x: any) => {
      return x.event == "ProposalFinished";
    });
    if (typeof events === "object" && events.length) {
      console.log("Event ProposalFinished emited with args: ", events[0].args);
    } else {
      events = receipt.events?.filter((x: any) => {
        return x.event == "ProposalCancelled";
      });
      if (typeof events === "object" && events.length)
        console.log("Event ProposalCancelled emited with args: ", events[0].args);
    }
  });
