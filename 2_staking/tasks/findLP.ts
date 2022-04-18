import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

task("findLP", "Find LP token address").setAction(async (_, hre) => {
  const { TOKEN_ADDR } = process.env;
  const WETH_ADDR = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
  if (!TOKEN_ADDR) throw Error("Empty token address");

  const uniswapFactory = await hre.ethers.getContractAt(
    "IUniswapV2Factory",
    "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
  );
  const address = await uniswapFactory.getPair(TOKEN_ADDR, WETH_ADDR);
  console.log(address);
});
