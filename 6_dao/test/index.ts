import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { DAO, Token20 } from "../typechain";

describe("DAO testing", () => {
  let dao: DAO;
  let token: Token20;
  let chairman: SignerWithAddress;
  let signers: SignerWithAddress[];
  const deposits: number[] = [];
  const voteperiod = "259200";
  const allVotes: number[][] = [];
  const proposalCount = 4;
  const callDataTransferAmount = 999;

  before(async () => {
    signers = await ethers.getSigners();
    chairman = signers[signers.length - 1];

    [dao, token] = await hre.run("deploy", {
      chairman: chairman.address,
      tokenname: "Etherik",
      tokensymbol: "eik",
      voteperiod,
      mintokens: "1000",
    });

    for (let i = 0; i < signers.length; i++) deposits.push(i * 100);
  });

  describe("Deposit & withdraw", () => {
    it("Depositing by 20 participants", async () => {
      for (const i in signers) {
        await token.connect(signers[i]).approve(dao.address, deposits[i]);
        await expect(() =>
          expect(dao.connect(signers[i]).deposit(deposits[i]))
            .to.emit(dao, "Deposit")
            .withArgs(signers[i].address, deposits[i])
        ).to.changeTokenBalances(token, [signers[i], dao], [-deposits[i], deposits[i]]);
      }
    });
    it("Withdraw should be success", async () => {
      let i = 18;
      await expect(() =>
        expect(dao.connect(signers[i]).withdraw())
          .to.emit(dao, "Withdraw")
          .withArgs(signers[i].address, deposits[i])
      ).to.changeTokenBalances(token, [signers[i], dao], [deposits[i], -deposits[i]]);
    });
    it("Front-running withdraw should be reverted", async () => {
      let i = 17;
      dao.connect(signers[i]).withdraw();
      await expect(dao.connect(signers[i]).withdraw()).to.be.revertedWith(
        "You have no deposits"
      );
    });
  });

  describe("Add proposal", () => {
    for (let id = 1; id <= proposalCount; id++) {
      it(`Adding proposal #${id}`, async () => {
        const abi = ["function transferFrom(address, address, uint256)"];
        const iface = new ethers.utils.Interface(abi);
        const calldata = iface.encodeFunctionData("transferFrom", [
          signers[id].address,
          signers[0].address,
          callDataTransferAmount,
        ]);
        const description = "DeScRiPtIoN " + id;
        await expect(
          dao.connect(chairman).addProposal(token.address, calldata, description)
        )
          .to.emit(dao, "ProposalAdded")
          .withArgs(id, token.address, calldata, description);

        await ethers.provider.send("evm_increaseTime", [id < 2 ? -5 : 5]);

        if (id == proposalCount) {
          const chairmanRole = await dao.CHAIRMAN_ROLE();
          await expect(
            dao.addProposal(token.address, calldata, description)
          ).revertedWith(
            `AccessControl: account ${signers[0].address.toLowerCase()} is missing role ${chairmanRole}`
          );
        }
      });
    }
  });

  describe("Vote", () => {
    for (let id = 1; id <= proposalCount; id++) {
      const votes = [0, 0];
      it(`Proposal #${id}. Voting by ${id * 3} participants`, async () => {
        for (let i = 1; i <= id * 3; i++) {
          const will = i < 8;
          votes[+will] += deposits[i];
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
    it("Withdraw by voter before proposal ending should be reverted", async () => {
      await expect(dao.connect(signers[1]).withdraw()).to.be.revertedWith(
        "Deposit is locked"
      );
    });
    it("Voting without deposits should be reverted", async () => {
      await expect(dao.connect(signers[0]).vote(1, true)).to.be.revertedWith(
        "You have no deposits"
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
    it("Proposal without quorum should by cancelled", async () => {
      const id = 1;
      await expect(dao.finish(id))
        .to.emit(dao, "ProposalCancelled")
        .withArgs(id, allVotes[id - 1][1], allVotes[id - 1][0] + allVotes[id - 1][1]);
    });
    it("Second finishing should be reverted", async () => {
      await expect(dao.finish(1)).to.be.revertedWith("No active proposals");
    });
    it("Finishing should call recipient, call should be success", async () => {
      const id = 2;
      await token.connect(signers[id]).approve(dao.address, callDataTransferAmount);
      await expect(dao.finish(id))
        .to.emit(dao, "ProposalFinished")
        .withArgs(id, allVotes[id - 1][1], allVotes[id - 1][0] + allVotes[id - 1][1], true);
    });
    it("Finishing should call recipient, call should be failed", async () => {
      const id = 3;
      await expect(dao.finish(id))
        .to.emit(dao, "ProposalFinished")
        .withArgs(id, allVotes[id - 1][1], allVotes[id - 1][0] + allVotes[id - 1][1], false);
    });
    it("Proposal with minority of YES votes should be cancelled", async () => {
      const id = 4;
      await expect(dao.finish(id))
        .to.emit(dao, "ProposalCancelled")
        .withArgs(id, allVotes[id - 1][1], allVotes[id - 1][0] + allVotes[id - 1][1]);
    });
  });
});
