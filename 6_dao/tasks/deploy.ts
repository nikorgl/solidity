import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

task("deploy")
  .addParam("chairman", "Chairman address")
  .addParam("tokenname", "ERC20 token name")
  .addParam("tokensymbol", "ERC20 token symbol")
  .addParam("voteperiod", "Period of proposal voting")
  .addParam("mintokens", "Minimum number of tokens required for a quorum")
  .setAction(async (taskArgs, hre) => {
    const ethers = hre.ethers;
    const signers = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("Token20");
    const token = await tokenFactory.deploy(taskArgs.tokenname, taskArgs.tokensymbol);
    await token.deployed();
    for (const i in signers)
      await token.mint(signers[i].address, ethers.utils.parseEther("1000000000"));

    const daoFactory = await ethers.getContractFactory("DAO");
    const dao = await daoFactory.deploy(
      token.address,
      taskArgs.chairman,
      taskArgs.voteperiod,
      taskArgs.mintokens
    );
    await dao.deployed();

    return [dao, token];
  });
