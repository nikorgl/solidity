import * as fs from "fs";
import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
dotenv.config();

interface TaskArgs {
  user: string;
  validator: string;
  tokenname: string;
  tokensymbol: string;
}

task("deploy")
  .addParam("user", "Contract user address")
  .addParam("validator", "Validator address")
  .addParam("tokenname", "ERC20 token name")
  .addParam("tokensymbol", "ERC20 token symbol")
  .setAction(async (taskArgs: TaskArgs, hre) => {
    const ethers = hre.ethers;
    const { chainId } = await ethers.provider.getNetwork();

    const user = await ethers.getSigner(taskArgs.user);
    const tokenFactory = await ethers.getContractFactory("Token20");
    const bridgeFactory = await ethers.getContractFactory("Bridge");

    console.log(`\nNetwork with chain ID ${chainId}`);
    const token = await tokenFactory.deploy(taskArgs.tokenname, taskArgs.tokensymbol);
    await token.deployed();
    console.log(`Token  ${taskArgs.tokenname} deployed. Address ${token.address}`);

    const bridge = await bridgeFactory.deploy(token.address, taskArgs.validator);
    await bridge.deployed();
    console.log(`Bridge deployed. Address ${bridge.address}`);
    console.log(`Validator ${taskArgs.validator}`);

    await token.mint(user.address, ethers.utils.parseEther("1000000000"));
    await token.transferOwnership(bridge.address);

    if (chainId !== 31337) {
      fs.appendFileSync(".env", `\nCHAIN${chainId}_TOKEN=${token.address}`);
      fs.appendFileSync(".env", `\nCHAIN${chainId}_USER=${taskArgs.user}`);
      fs.appendFileSync(".env", `\nCHAIN${chainId}_BRIDGE=${bridge.address}`);
      fs.appendFileSync(".env", `\nCHAIN${chainId}_VALIDATOR=${taskArgs.validator}`);
      await new Promise((resolve) => setTimeout(resolve, 30000));
      await hre.run("verify:verify", {
        address: token.address,
        constructorArguments: [taskArgs.tokenname, taskArgs.tokensymbol],
      });
      await hre.run("verify:verify", {
        address: bridge.address,
        constructorArguments: [token.address, taskArgs.validator],
      });
    }

    return [chainId, bridge, token];
  });
