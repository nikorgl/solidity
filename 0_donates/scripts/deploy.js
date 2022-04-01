const { ethers } = require("hardhat");
async function main() {
    const Donate = await ethers.getContractFactory("Donate");
    const donate = await Donate.deploy();
    await donate.deployed();
    console.log("Donate deployed to:", donate.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
