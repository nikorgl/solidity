import * as fs from "fs";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";

task("deployToken")
  .addParam("tokenname", "ERC20 token name")
  .addParam("tokensymbol", "ERC20 token symbol")
  .addOptionalParam("decimals", "Decimals number")
  .setAction(async (taskArgs, { ethers }) => {
    const tokenFactory = await ethers.getContractFactory("Token20");
    const token = await tokenFactory.deploy(
      taskArgs.tokenname,
      taskArgs.tokensymbol,
      taskArgs.decimals || 18
    );
    await token.deployed();
    return token;
  });

task("deployStaking")
  .addParam("lptoken", "Liguidity provider token")
  .addParam("xtoken", "Reward token")
  .setAction(async (taskArgs, { ethers }) => {
    const stakingFactory = await ethers.getContractFactory("Staking");
    const staking = await stakingFactory.deploy(
      taskArgs.lptoken,
      taskArgs.xtoken,
      604800, // 7 days
      2592000, // 1 month
      30 // 3 percent
    );
    await staking.deployed();

    return staking;
  });

task("deployDAO")
  .addParam("staking", "Staking contract address")
  .addParam("chairman", "Chairman address")
  .addParam("voteperiod", "Period of proposal voting")
  .addParam("mintokens", "Minimum number of tokens required for a quorum")
  .setAction(async (taskArgs, { ethers }) => {
    const daoFactory = await ethers.getContractFactory("DAO");
    const dao = await daoFactory.deploy(
      taskArgs.staking,
      taskArgs.chairman,
      taskArgs.voteperiod,
      taskArgs.mintokens
    );
    await dao.deployed();

    return dao;
  });

task("deployPlatform")
  .addParam("token", "Token ACDM address")
  .addParam("dao", "DAO address")
  .addParam("roundperiod", "Period of round")
  .addParam("tradevolume", "Initial trade volume")
  .addParam("saleprice", "Initial sale price of ACDM token")
  .setAction(async (taskArgs, { ethers }) => {
    const token = await ethers.getContractAt("Token20", taskArgs.token);

    const platformFactory = await ethers.getContractFactory("Platform");
    const platform = await platformFactory.deploy(
      token.address,
      taskArgs.dao,
      taskArgs.roundperiod,
      ethers.utils.parseEther(taskArgs.tradevolume),
      ethers.utils.parseEther(taskArgs.saleprice)
    );
    await platform.deployed();

    await token.grantRole(await token.DEFAULT_ADMIN_ROLE(), platform.address);

    return platform;
  });

const WETH_ADDR = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
task("addLiquidity", "Add liquidity")
  .addParam("xtoken", "XXX token address")
  .addParam("xvalue", "Tokens amount")
  .addParam("ethvalue", "WETH amount")
  .setAction(async (taskArgs, { ethers }) => {
    const xvalue = ethers.utils.parseEther(taskArgs.xvalue);
    const evalue = ethers.utils.parseEther(taskArgs.ethvalue);
    const [owner] = await ethers.getSigners();
    const uniswapRouter = await ethers.getContractAt(
      "IUniswapV2Router01",
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );
    const xtoken = await ethers.getContractAt("Token20", taskArgs.xtoken);
    await xtoken.mint(owner.address, xvalue);
    console.log("XXX token minted");
    await xtoken.approve(uniswapRouter.address, xvalue);
    console.log("XXX token approved");

    const ethtoken = await ethers.getContractAt("Token20", WETH_ADDR);
    await ethtoken.approve(uniswapRouter.address, evalue);
    console.log("WETH token approved");

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    const timestamp = block.timestamp;

    console.log("Block Timestamp:", timestamp);

    const tx = await uniswapRouter.addLiquidityETH(
      xtoken.address,
      xvalue,
      xvalue,
      evalue,
      owner.address,
      timestamp + 300
    );

    await tx.wait();
    console.log("Created LP");
  });

task("findLP", "Find LP token address")
  .addParam("xtoken", "XXX token address")
  .setAction(async (taskArgs, { ethers }) => {
    const uniswapFactory = await ethers.getContractAt(
      "IUniswapV2Factory",
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
    );
    const address = await uniswapFactory.getPair(taskArgs.xtoken, WETH_ADDR);
    fs.appendFileSync(".env", `\nADDRESS_LPTOKEN=${address}`);
    console.log(`LP pair address ${address}`);
    return address;
  });
