import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

interface TaskArgs {
  chainid: string;
  to: string;
  value: number;
}

task("swap")
  .addParam("chainid", "Chain id of receiver network")
  .addParam("to", "Receiver address")
  .addParam("value", "Amount to send")
  .setAction(async (taskArgs: TaskArgs, { ethers }) => {
    const { chainId: chainIdFrom } = await ethers.provider.getNetwork();

    const contractAddress = process.env[`CHAIN${chainIdFrom}_BRIDGE`];
    if (!contractAddress) throw Error("No bridge address provided");
    const bridge = await ethers.getContractAt("Bridge", contractAddress);

    const userAddress = process.env[`CHAIN${chainIdFrom}_USER`];
    if (!userAddress) throw Error("No user address provided");
    const user = await ethers.getSigner(userAddress);

    const tx = await bridge
      .connect(user)
      .swap(taskArgs.chainid, taskArgs.to, taskArgs.value);
    const receipt = await tx.wait();
    console.log(
      "Event SwapInitialized emited with args: ",
      receipt.events?.filter((x: any) => {
        return x.event == "SwapInitialized";
      })[0].args
    );
  });
