require("dotenv").config();
module.exports = async (taskArgs, { ethers }) => {
    const accounts = await ethers.getSigners();
    for (const account of accounts) {
        console.log(
            `Account ${account.address} balance`,
            ethers.utils.formatEther(await account.getBalance())
        );
    }
    const contractAddr = process.env.CONTRACT_ADDR;
    console.log(
        `Donate contract ${contractAddr} balance`,
        ethers.utils.formatEther(await ethers.provider.getBalance(contractAddr))
    );
};
