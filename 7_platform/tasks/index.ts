import "./deploys";
import "./staking_claim.ts";
import "./staking_stake.ts";
import "./staking_unstake.ts";
import "./dao_addProposal";
import "./dao_finish";
import "./dao_vote";
import "./platform_addorder.ts";
import "./platform_buyacdm.ts";
import "./platform_redeemorder.ts";
import "./platform_register.ts";
import "./platform_removeorder.ts";
import "./platform_startsale.ts";
import "./platform_starttrade.ts";

import { task } from "hardhat/config";
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});
