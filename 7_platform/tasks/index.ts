import "./deploys";
import "./staking_claim.ts";
import "./staking_stake.ts";
import "./staking_unstake.ts";
import "./dao_addProposal";
import "./dao_finish";
import "./dao_vote";

import { task } from "hardhat/config";
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});
