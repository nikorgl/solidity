import * as fs from "fs";
import hre, { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const signers = await ethers.getSigners();

  const xtokenArgs = {
    tokenname: "NiTokenXXX",
    tokensymbol: "NiXXX",
    decimals: "18",
  };
  const xtoken = await hre.run("deployToken", xtokenArgs);
  console.log(`XXX token  deployed. Address ${xtoken.address}`);

  await hre.run("addLiquidity", {
    xtoken: xtoken.address,
    xvalue: String(ethers.utils.parseEther("5000")),
    ethvalue: String(ethers.utils.parseEther("0.05")),
  });
  const lptoken = await hre.run("findLP", {
    xtoken: "0xCC7C56a676A1b4bafdbDbd9Ac93554e57abBBBd0",
  });

  const acdmtokenArgs = {
    tokenname: "tokenACDM",
    tokensymbol: "ACDM",
    decimals: "6",
  };
  const acdmtoken = await hre.run("deployToken", acdmtokenArgs);
  console.log(`ACDM token  deployed. Address ${acdmtoken.address}`);

  const stakingArgs = {
    lptoken,
    xtoken: xtoken.address,
  };
  const staking = await hre.run("deployStaking", stakingArgs);
  console.log(`Staking deployed. Address ${staking.address}`);

  const daoArgs = {
    staking: staking.address,
    chairman: signers[0].address,
    voteperiod: "259200",
    mintokens: "1000",
  };
  const dao = await hre.run("deployDAO", daoArgs);
  console.log(`DAO deployed. Address ${dao.address}`);
  await staking.grantRole(await staking.DAO_ROLE(), dao.address);
  await staking.setDAOAddress(dao.address);

  const platformArgs = {
    token: acdmtoken.address,
    dao: dao.address,
    roundperiod: "259200",
  };
  const platform = await hre.run("deployPlatform", platformArgs);
  console.log(`ACDM platform deployed. Address ${platform.address}`);

  if ((await hre.ethers.provider.getNetwork()).chainId !== 31337) {
    fs.appendFileSync(".env", `\nADDRESS_XXXTOKEN=${xtoken.address}`);
    fs.appendFileSync(".env", `\nADDRESS_ACDMTOKEN=${acdmtoken.address}`);
    fs.appendFileSync(".env", `\nADDRESS_STAKING=${staking.address}`);
    fs.appendFileSync(".env", `\nADDRESS_DAO=${dao.address}`);
    fs.appendFileSync(".env", `\nADDRESS_CHAIRMAN=${signers[0].address}`);
    fs.appendFileSync(".env", `\nADDRESS_ACDM_PLATFORM=${platform.address}`);
    await new Promise((resolve) => setTimeout(resolve, 30000));
    await hre.run("verify:verify", {
      address: xtoken.address,
      constructorArguments: Object.values(xtokenArgs),
    });
    await hre.run("verify:verify", {
      address: acdmtoken.address,
      constructorArguments: Object.values(acdmtokenArgs),
    });
    await hre.run("verify:verify", {
      address: staking.address,
      constructorArguments: Object.values(stakingArgs),
    });
    await hre.run("verify:verify", {
      address: dao.address,
      constructorArguments: Object.values(daoArgs),
    });
    await hre.run("verify:verify", {
      address: platform.address,
      constructorArguments: Object.values(platformArgs),
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
