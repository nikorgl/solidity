const donateArtifact = require("../artifacts/contracts/Donate.sol/Donate.json");
require("dotenv").config();
module.exports = async ({ address, sum }, { ethers }) => {
    const [account] = await ethers.getSigners();
    const donateContract = new ethers.Contract(
        process.env.CONTRACT_ADDR,
        donateArtifact.abi,
        account
    );
    const result = await donateContract.withdraw(
        address,
        ethers.utils.parseEther(sum)
    );
    console.log(result);
};
