import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
dotenv.config();

task("stakingStake", "Stake a stake")
  .addParam("amount", "Stake amount")
  .setAction(async (taskArgs, { ethers }) => {
    const { ADDRESS_STAKING, ADDRESS_LPTOKEN } = process.env;
    const staking = await ethers.getContractAt("Staking", ADDRESS_STAKING);

    const lpToken = await ethers.getContractAt("Token20", String(ADDRESS_LPTOKEN));
    let tx = await lpToken.approve(
      staking.address,
      ethers.utils.parseEther(taskArgs.amount)
    );
    await tx.wait();
    console.log(`Approved ${taskArgs.amount} tokens`);
    tx = await staking.stake(ethers.utils.parseEther(taskArgs.amount));
    await tx.wait();
    console.log(`Staked ${taskArgs.amount} tokens`);
  });
