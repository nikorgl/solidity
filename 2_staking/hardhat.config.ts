import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "./tasks/findLP";
import "./tasks/stake";
import "./tasks/claim";
import "./tasks/unstake";

dotenv.config();

const accounts = [];
for (let i = 1; process.env[`PRIVATE_KEY${i}`]; i++)
  accounts.push(String(process.env[`PRIVATE_KEY${i}`]));

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
