require("dotenv").config();
module.exports = async ({ address, sum }, { ethers }) => {
    const accounts = await ethers.getSigners();
    for (const account of accounts)
        if (address === account.address) {
            const transactionRequest = {
                to: process.env.CONTRACT_ADDR,
                value: ethers.utils.parseEther(sum),
            };
            const sendTransaction = await account.sendTransaction(
                transactionRequest
            );
            await sendTransaction.wait();
        }
};
