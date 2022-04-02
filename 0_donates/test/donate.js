const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Donate", function () {
    let Donate;
    let donate;
    let owner;
    let acc1;
    const sum = [
        parseInt(Math.random() * 1000),
        parseInt(Math.random() * 1000),
        parseInt(Math.random() * 1000),
    ];

    it("Deployed", async function () {
        Donate = await ethers.getContractFactory("Donate");
        donate = await Donate.deploy();
        await donate.deployed();
        [owner, acc1] = await ethers.getSigners();
        expect(donate.address).to.be.properAddress;
    });

    it("Making donation", async function () {
        await expect(() =>
            owner.sendTransaction({ to: donate.address, value: sum[0] })
        ).to.changeEtherBalance(donate, sum[0]);

        await expect(() =>
            acc1.sendTransaction({ to: donate.address, value: sum[1] })
        ).to.changeEtherBalance(donate, sum[1]);

        await expect(() =>
            owner.sendTransaction({ to: donate.address, value: sum[2] })
        ).to.changeEtherBalance(donate, sum[2]);
    });

    it("Withdrawal test for owner", async function () {
        await expect(() =>
            donate.withdraw(acc1.address, sum[0])
        ).to.changeEtherBalances([donate, acc1], [-sum[0], sum[0]]);
    });

    it("Withdrawal test for alien", async function () {
        await expect(
            donate.connect(acc1).withdraw(acc1.address, sum[1])
        ).to.be.revertedWith("Caller is not owner");
    });

    it("Get users test", async function () {
        expect(await donate.getUsers()).deep.to.equal([
            owner.address,
            acc1.address,
        ]);
    });

    it("Get user donates test", async function () {
        expect(await donate.getUserDonates(owner.address)).equal(
            parseInt(sum[0]) + parseInt(sum[2])
        );
    });
});
