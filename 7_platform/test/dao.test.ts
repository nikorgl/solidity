import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { DAO, Staking, Platform, Token20 } from "../typechain";

describe("DAO testing", () => {
  let dao: DAO;
  let staking: Staking;
  let platform: Platform;
  let lptoken: Token20;
  let acdmtoken: Token20;
  let xtoken: Token20;
  let chairman: SignerWithAddress;
  let signers: SignerWithAddress[];
  const stakes: number[] = [];
  const voteperiod = "259200";
  const allVotes: number[][] = [];
  const proposalCount = 6;
  const calldata: string[] = [];
  const descriptions: string[] = [];

  before(async () => {
    signers = await ethers.getSigners();
    chairman = signers[signers.length - 1];

    lptoken = await hre.run("deployToken", {
      tokenname: "tokenLP",
      tokensymbol: "LP",
    });
    xtoken = await hre.run("deployToken", {
      tokenname: "TokenXXX",
      tokensymbol: "XXX",
    });

    staking = await hre.run("deployStaking", {
      lptoken: lptoken.address,
      xtoken: xtoken.address,
    });

    dao = await hre.run("deployDAO", {
      staking: staking.address,
      chairman: chairman.address,
      voteperiod,
      mintokens: "1000",
    });
    await staking.grantRole(await staking.DAO_ROLE(), dao.address);
    await staking.setDAOAddress(dao.address);

    acdmtoken = await hre.run("deployToken", {
      tokenname: "tokenACDM",
      tokensymbol: "ACDM",
      decimals: "6",
    });
    platform = await hre.run("deployPlatform", {
      token: acdmtoken.address,
      dao: dao.address,
      roundperiod: "259200",
      tradevolume: "1",
      saleprice: "0.00001",
    });

    for (let i = 0; i < signers.length; i++) {
      stakes.push(i * 100);
      lptoken.mint(signers[i].address, stakes[i]);
      await lptoken.connect(signers[i]).approve(staking.address, stakes[i]);
      await staking.connect(signers[i]).stake(stakes[i]);
      await ethers.provider.send("evm_increaseTime", [2592000]);
    }
  });

  describe("Add proposal", () => {
    calldata.push("wrong calldata");
    descriptions.push("proposal with wrong calldata should be not added");

    let abi = ["function setLockStakePeriod(uint256)"];
    let iface = new ethers.utils.Interface(abi);
    calldata.push(iface.encodeFunctionData("setLockStakePeriod", [1]));
    descriptions.push("Approval #1 without quorum will be reverted");

    abi = ["function setLockStakePeriod(uint256)"];
    iface = new ethers.utils.Interface(abi);
    calldata.push(iface.encodeFunctionData("setLockStakePeriod", [2]));
    descriptions.push("Approval #2 will be success finished");

    abi = ["function setLockStakePeriod(uint256)"];
    iface = new ethers.utils.Interface(abi);
    calldata.push(iface.encodeFunctionData("setLockStakePeriod", [0]));
    descriptions.push("Approval #3 will be failure finished");

    abi = ["function setSaleReferPercents(uint256, uint256)"];
    iface = new ethers.utils.Interface(abi);
    calldata.push(iface.encodeFunctionData("setSaleReferPercents", [4, 4]));
    descriptions.push("Approval #4 will be success finished");

    abi = ["function setTradeReferPercents(uint256, uint256)"];
    iface = new ethers.utils.Interface(abi);
    calldata.push(iface.encodeFunctionData("setTradeReferPercents", [5, 5]));
    descriptions.push("Approval #5 will be success finished");

    abi = ["function setTradeReferPercents(uint256, uint256)"];
    iface = new ethers.utils.Interface(abi);
    calldata.push(iface.encodeFunctionData("setTradeReferPercents", [6, 6]));
    descriptions.push("Approval #6 with minority will be cancelled");

    for (let id = 1; id <= proposalCount; id++)
      it(`Adding proposal #${id}`, async () => {
        const recipient = id < 4 ? staking.address : platform.address;
        await expect(
          dao.connect(chairman).addProposal(recipient, calldata[id], descriptions[id])
        )
          .to.emit(dao, "ProposalAdded")
          .withArgs(id, recipient, calldata[id], descriptions[id]);
        await ethers.provider.send("evm_increaseTime", [id < 2 ? -5 : 5]);
      });

    it("Adding proposal with wrong calldata should be reverted", async () => {
      const chairmanRole = await dao.CHAIRMAN_ROLE();
      await expect(
        dao
          .connect(chairman)
          .addProposal(staking.address, calldata[1] + "A", descriptions[1])
      ).to.be.reverted;
    });
    it("Adding proposal from alien should be reverted", async () => {
      const chairmanRole = await dao.CHAIRMAN_ROLE();
      await expect(
        dao.addProposal(staking.address, calldata[1], descriptions[1])
      ).revertedWith(
        `AccessControl: account ${signers[0].address.toLowerCase()} is missing role ${chairmanRole}`
      );
    });
  });

  describe("Vote", () => {
    for (let id = 1; id <= proposalCount; id++) {
      const votes = [0, 0];
      it(`Proposal #${id}. Voting by ${id * 3} participants`, async () => {
        for (let i = 1; i <= id * 3; i++) {
          const will = i < 12;
          votes[+will] += stakes[i];
          await expect(dao.connect(signers[i]).vote(id, will))
            .to.emit(dao, "Vote")
            .withArgs(id, signers[i].address, will);
        }
      });
      it(`Proposal #${id}. Checking votes amount`, async () => {
        allVotes.push(votes);
        expect((await dao.proposals(id)).yesVotes).eq(votes[1]);
        console.log(`        Proposal #${id}. YES votes ${votes[1]}`);
        expect((await dao.proposals(id)).totalVotes).eq(votes[0] + votes[1]);
        console.log(`        Proposal #${id}. NO votes ${votes[0]}`);
      });
    }
    it("Unstaking for voting user should be reverted", async () => {
      await expect(staking.connect(signers[1]).unstake()).revertedWith(
        "You have unfinished proposals"
      );
    });
    it("Voting without stakes should be reverted", async () => {
      await expect(dao.connect(signers[0]).vote(1, true)).to.be.revertedWith(
        "You have no stakes"
      );
    });
    it("Voting for non-exist proposal should be reverted", async () => {
      await expect(dao.connect(signers[1]).vote(10, true)).to.be.revertedWith(
        "No active proposals"
      );
    });
    it("Second voting should be reverted", async () => {
      await expect(dao.connect(signers[1]).vote(1, true)).to.be.revertedWith(
        "Already voted"
      );
    });
    it("Too early finishing should be reverted", async () => {
      await expect(dao.finish(1)).to.be.revertedWith("Proposal is not over");
    });
    it("Too late voting should be reverted", async () => {
      await ethers.provider.send("evm_increaseTime", [Number(voteperiod)]);
      await expect(dao.connect(signers[10]).vote(1, true)).to.be.revertedWith(
        "Proposal is over"
      );
    });
  });

  describe("Finish", () => {
    it("Proposal #1 without quorum should by cancelled", async () => {
      const id = 1;
      await expect(dao.finish(id))
        .to.emit(dao, "ProposalCancelled")
        .withArgs(id, allVotes[id - 1][1], allVotes[id - 1][0] + allVotes[id - 1][1]);
    });
    it("Second finishing should be reverted", async () => {
      await expect(dao.finish(1)).to.be.revertedWith("No active proposals");
    });
    it("Proposal #2. Should call recipient, call should be success", async () => {
      const id = 2;
      await expect(dao.finish(id))
        .to.emit(dao, "ProposalFinished")
        .withArgs(
          id,
          allVotes[id - 1][1],
          allVotes[id - 1][0] + allVotes[id - 1][1],
          true
        );
    });
    it("Proposal #3. Should call recipient, call should be failed", async () => {
      const id = 3;
      await expect(dao.finish(id))
        .to.emit(dao, "ProposalFinished")
        .withArgs(
          id,
          allVotes[id - 1][1],
          allVotes[id - 1][0] + allVotes[id - 1][1],
          false
        );
    });
    it("Proposal #4. Platform ACDM sale round percents changing, call should be success", async () => {
      const id = 4;
      await expect(dao.finish(id))
        .to.emit(dao, "ProposalFinished")
        .withArgs(
          id,
          allVotes[id - 1][1],
          allVotes[id - 1][0] + allVotes[id - 1][1],
          true
        );
    });
    it("Proposal #5. Platform ACDM trade round percents changing, call should be success", async () => {
      const id = 5;
      await expect(dao.finish(id))
        .to.emit(dao, "ProposalFinished")
        .withArgs(
          id,
          allVotes[id - 1][1],
          allVotes[id - 1][0] + allVotes[id - 1][1],
          true
        );
    });
    it("Proposal #6 with minority of YES votes should be cancelled", async () => {
      const id = 6;
      await expect(dao.finish(id))
        .to.emit(dao, "ProposalCancelled")
        .withArgs(id, allVotes[id - 1][1], allVotes[id - 1][0] + allVotes[id - 1][1]);
    });

    it("Unstaking for voted user should be success after proposal finish", async () => {
      await staking.connect(signers[1]).unstake();
    });
  });
});
