import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import StakeArtifact from "../artifacts/contracts/Staking.sol/Staking.json";
dotenv.config();

task("stake", "Stake a stake")
  .addParam("amount", "Stake amount")
  .setAction(async (taskArgs, hre) => {
    const { LPTOKEN_ADDR, STAKING_ADDR } = process.env;
    const accounts = await hre.ethers.getSigners();

    const staking = new hre.ethers.Contract(String(STAKING_ADDR), StakeArtifact.abi, accounts[0]);

    const lpToken = await hre.ethers.getContractAt("Token", String(LPTOKEN_ADDR));
    let tx = await lpToken.approve(staking.address, hre.ethers.utils.parseEther(taskArgs.amount));
    await tx.wait();
    console.log(`Approved ${taskArgs.amount} tokens`);
    tx = await staking.stake(hre.ethers.utils.parseEther(taskArgs.amount));
    await tx.wait();
    console.log(`Staked ${taskArgs.amount} tokens`);
  });
