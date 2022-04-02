const donateArtifact = require("../artifacts/contracts/Donate.sol/Donate.json");
require("dotenv").config();
module.exports = async ({ address }, { ethers }) => {
    const [account] = await ethers.getSigners();
    const donateContract = new ethers.Contract(
        process.env.CONTRACT_ADDR,
        donateArtifact.abi,
        account
    );
    const result = await donateContract.getUserDonates(address);
    for (const donate of result) console.log(ethers.utils.formatEther(donate));
};
