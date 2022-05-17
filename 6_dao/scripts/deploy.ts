import * as fs from "fs";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const tokenname = "TokenDAO0420";
  const tokensymbol = "TD0420)";
  const voteperiod = "600";
  const mintokens = "1000";
  const [chairman] = await hre.ethers.getSigners();
  const [dao, token] = await hre.run("deploy", {
    chairman: chairman.address,
    tokenname,
    tokensymbol,
    voteperiod,
    mintokens,
  });
  console.log(`Token ${tokenname} deployed. Address ${token.address}`);
  console.log(`DAO deployed. Address ${dao.address}`);

  fs.appendFileSync(".env", `\nADDRESS_TOKEN=${token.address}`);
  fs.appendFileSync(".env", `\nADDRESS_DAO=${dao.address}`);
  fs.appendFileSync(".env", `\nADDRESS_CHAIRMAN=${chairman.address}`);
  await new Promise((resolve) => setTimeout(resolve, 30000));
  await hre.run("verify:verify", {
    address: token.address,
    constructorArguments: [tokenname, tokensymbol],
  });
  await hre.run("verify:verify", {
    address: dao.address,
    constructorArguments: [token.address, chairman.address, voteperiod, mintokens],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
