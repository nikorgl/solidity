import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

interface TaskArgs {
  from: string;
  to: string;
  value: number;
  nonce: number;
}

task("redeem")
  .addParam("from", "Sender address")
  .addParam("to", "Receiver address")
  .addParam("value", "Sent amount")
  .addParam("nonce", "Nonce of transaction")
  .setAction(async (taskArgs: TaskArgs, { ethers }) => {
    const { chainId } = await ethers.provider.getNetwork();

    const contractAddress = process.env[`CHAIN${chainId}_BRIDGE`];
    if (!contractAddress) throw Error("No bridge address provided");
    const bridge = await ethers.getContractAt("Bridge", contractAddress);

    const sender = await ethers.getSigner(taskArgs.from);
    const receiver = await ethers.getSigner(taskArgs.to);

    const validatorAddress = process.env[`CHAIN${chainId}_VALIDATOR`];
    if (!validatorAddress) throw Error("No validator address provided");
    const validator = await ethers.getSigner(validatorAddress);

    const hash = ethers.utils.solidityKeccak256(
      ["uint256", "address", "address", "uint256", "uint256"],
      [chainId, sender.address, receiver.address, taskArgs.value, taskArgs.nonce]
    );

    const signature = await validator.signMessage(ethers.utils.arrayify(hash));

    const tx = await bridge
      .connect(receiver)
      .redeem(sender.address, taskArgs.value, taskArgs.nonce, signature);
    const receipt = await tx.wait();
    console.log(
      "Event Redeem emited with args: ",
      receipt.events?.filter((x: any) => {
        return x.event == "Redeem";
      })[0].args
    );
  });
