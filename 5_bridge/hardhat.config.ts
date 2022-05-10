import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "./tasks";

dotenv.config();

const accounts = [];
for (let i = 1; process.env[`PRIVATE_KEY${i}`]; i++)
  accounts.push(String(process.env[`PRIVATE_KEY${i}`]));

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts,
    },
    bsctest: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey:
      process.argv[process.argv.indexOf("--network") + 1] === "bsctest"
        ? process.env.BSCSCAN_API_KEY
        : process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
