require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("dotenv").config();
const balances = require("./tasks/balances");
const makeDonation = require("./tasks/make-donation");
const withdraw = require("./tasks/withdraw");
const users = require("./tasks/users");
const userDonates = require("./tasks/user-donates");

task("balances", "Prints the list of accounts and balances", balances);
task("make-donation", "Make a donation")
    .addParam("address", "The account's address who make a donation")
    .addParam("sum", "Sum of donation")
    .setAction(makeDonation);
task("withdraw", "Withdraw a certain sum to certain address")
    .addParam("address", "The account's address where to send")
    .addParam("sum", "Sum of withdrawal")
    .setAction(withdraw);
task("users", "List of users who have made donations", users);
task("user-donates", "List of user's donations")
    .addParam("address", "The account's address where to send")
    .setAction(userDonates);

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
