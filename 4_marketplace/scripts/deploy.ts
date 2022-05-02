import * as fs from "fs";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

import {
  IPFS_URI_721,
  NAME_721,
  SYMBOL_721,
  NAME_20,
  SYMBOL_20,
  MARKET_AUCTION_PERIOD,
  MARKET_BID_MIN_COUNT,
} from "../const";
async function main() {
  const signers = await ethers.getSigners();

  const Token721 = await ethers.getContractFactory("Token721");
  const token721 = await Token721.deploy(NAME_721, SYMBOL_721, IPFS_URI_721);
  await token721.deployed();
  console.log("NFT contract deployed to:", token721.address);
  fs.appendFileSync(".env", `\nTOKEN721_ADDR=${token721.address}`);
  for (let i = 1; i <= 3; i++) {
    await token721.mint(signers[0].address);
    console.log(`Minted NFT token with ID ${i}`);
  }

  const Token20 = await ethers.getContractFactory("Token20");
  const token20 = await Token20.deploy(NAME_20, SYMBOL_20);
  await token20.deployed();
  console.log("ERC-20 contract deployed to:", token20.address);
  fs.appendFileSync(".env", `\nTOKEN20_ADDR=${token20.address}`);
  for (const i in [0, 1, 2]) {
    await token20.mint(signers[i].address, 1e10);
    console.log(`Minted ERC20 on  ${signers[i].address}`);
  }

  const marketFactory = await ethers.getContractFactory("Market");
  const market = await marketFactory.deploy(
    token721.address,
    token20.address,
    MARKET_AUCTION_PERIOD,
    MARKET_BID_MIN_COUNT
  );
  await market.deployed();
  await token721.transferOwnership(market.address);
  console.log("Market deployed to:", market.address);
  fs.appendFileSync(".env", `\nMARKET_ADDR=${market.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
