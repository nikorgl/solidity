const donateArtifact = require("../artifacts/contracts/Donate.sol/Donate.json");
require("dotenv").config();
module.exports = async (taskArgs, { ethers }) => {
    const [account] = await ethers.getSigners();
    const donateContract = new ethers.Contract(
        process.env.CONTRACT_ADDR,
        donateArtifact.abi,
        account
    );
    const result = await donateContract.getUsers();
    console.log(result);
};
