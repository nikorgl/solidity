import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const { LPTOKEN_ADDR, TOKEN_ADDR } = process.env;
  if (!LPTOKEN_ADDR) throw Error("Empty LP token address");
  if (!TOKEN_ADDR) throw Error("Empty token address");

  const stakingFactory = await ethers.getContractFactory("Staking");
  const staking = await stakingFactory.deploy(LPTOKEN_ADDR, TOKEN_ADDR, 10 * 60, 20 * 60, 1);
  await staking.deployed();

  console.log("Staking deployed to:", staking.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
