require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("dotenv").config();

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        rinkeby: {
            url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
            accounts: [
                process.env.PRIVATE_KEY1,
                process.env.PRIVATE_KEY2,
                process.env.PRIVATE_KEY3,
            ],
        },
    },
    solidity: "0.8.4",
};
