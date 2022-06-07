import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Platform, Token20 } from "../typechain";
function parseUnits(value: number) {
  return ethers.utils.parseUnits(value.toFixed(7), 6);
}
function parseEther(value: number) {
  return ethers.utils.parseEther(value.toFixed(7));
}

describe("ACDM platform", () => {
  let platform: Platform;
  let token: Token20;
  let signers: SignerWithAddress[];
  let dao: SignerWithAddress;
  const roundperiod = "259200";
  let tradeVolume = 100000;
  let price1 = 0.00001;
  let price2 = 0.0000143;

  before(async () => {
    signers = await ethers.getSigners();
    dao = signers[19];
    token = await hre.run("deployToken", {
      tokenname: "tokenACDM",
      tokensymbol: "ACDM",
      decimals: "6",
    });
    platform = await hre.run("deployPlatform", {
      token: token.address,
      dao: dao.address,
      roundperiod,
      tradevolume: "1",
      saleprice: "0.00001",
    });
  });

  describe("Registration", () => {
    it("6 users should be registered", async () => {
      for (let i = 1; i <= 8; i++) {
        await expect(
          platform
            .connect(signers[i])
            .register(i > 1 ? signers[i - 1].address : ethers.constants.AddressZero)
        )
          .to.emit(platform, "UserRegistered")
          .withArgs(
            signers[i].address,
            i > 1 ? signers[i - 1].address : platform.address
          );
      }
    });
    it("Registration with non-exist user should be reverted", async () => {
      await expect(
        platform.connect(signers[18]).register(signers[19].address)
      ).to.be.revertedWith("Wrong referrer");
    });
    it("Second registration of the same user should be reverted", async () => {
      await expect(
        platform.connect(signers[1]).register(signers[2].address)
      ).to.be.revertedWith("Already registered");
    });
  });

  describe("Sale Round 1", () => {
    it("Start sale round", async () => {
      const block = await ethers.provider.getBlock(
        await ethers.provider.getBlockNumber()
      );
      await expect(() =>
        expect(platform.startSaleRound())
          .emit(platform, "SaleRoundStarted")
          .withArgs(
            parseUnits(tradeVolume),
            parseEther(price1),
            block.timestamp + parseInt(roundperiod) + 1
          )
      ).to.changeTokenBalance(token, platform, parseUnits(tradeVolume));
    });
    it("Second start of sale round should be reverted", async () => {
      await expect(platform.startSaleRound()).to.be.revertedWith("Already started");
    });
    it("Buying too much ACDM tokens should be reverted", async () => {
      await expect(
        platform.connect(signers[1]).buyACDM({ value: parseEther(1.001) })
      ).to.be.revertedWith("Not enough tokens for sale");
    });
    it("Too early trade start should be reverted", async () => {
      await expect(platform.startTradeRound()).to.be.revertedWith(
        "Previous round did not end"
      );
    });
    it("Buying ACDM tokens with checking token balance and referral rewards", async () => {
      for (let i = 1; i <= 4; i++) {
        const eth = i * 0.1;
        let income = eth;
        const refers: SignerWithAddress[] = [];
        const refersWallets: BigNumber[] = [];
        if (i > 1) {
          refers.push(signers[i - 1]);
          refersWallets.push(parseEther(eth * 0.05));
          income -= eth * 0.05;
        }
        if (i > 2) {
          refers.push(signers[i - 2]);
          refersWallets.push(parseEther(eth * 0.03));
          income -= eth * 0.03;
        }
        await expect(() =>
          expect(() =>
            platform.connect(signers[i]).buyACDM({ value: parseEther(eth) })
          ).to.changeEtherBalances(refers, refersWallets)
        ).to.changeTokenBalance(token, signers[i], parseUnits((i * 0.1) / price1));
        await expect(() =>  platform.withdraw()).to.changeEtherBalance(dao, parseEther(income));
      }
    });
    it("Adding order in sale round should be reverted", async () => {
      await expect(platform.addOrder(100, 100)).to.be.revertedWith("Round is over");
    });
  });

  describe("Trade Round 1", () => {
    it("Start trade round", async () => {
      tradeVolume = 0;
      await platform.startTradeRound();
      expect((await platform.round()).tradeVolume).eq(0);
    });
    it("Second start of trade round should be reverted", async () => {
      await expect(platform.startTradeRound()).to.be.revertedWith("Already started");
    });
    it("4 orders should be added", async () => {
      for (let i = 1; i <= 4; i++) {
        const tokenAmount = (i * 0.1) / price1;
        const orderPrice = price1 * i;
        const etherAmount = i * i * 0.1;
        await token
          .connect(signers[i])
          .approve(platform.address, parseUnits(tokenAmount));
        await expect(() =>
          expect(
            platform
              .connect(signers[i])
              .addOrder(parseUnits(tokenAmount), parseEther(etherAmount))
          )
            .emit(platform, "OrderAdded")
            .withArgs(
              i,
              signers[i].address,
              parseUnits(tokenAmount),
              parseEther(etherAmount),
              parseEther(orderPrice)
            )
        ).to.changeTokenBalance(token, signers[i], parseUnits(-tokenAmount));
      }
    });
    it("Buying too much ACDM tokens should be reverted", async () => {
      await expect(platform.redeemOrder(1, { value: parseEther(1) })).to.be.revertedWith(
        "Not enough tokens for trade"
      );
    });
    it("Too early sale start should be reverted", async () => {
      await expect(platform.startSaleRound()).to.be.revertedWith(
        "Previous round did not end"
      );
    });
    it("Removing order by alien should be reverted", async () => {
      await expect(platform.removeOrder(1)).to.be.revertedWith("Only owner");
    });
    it("Removing one order", async () => {
      await expect(platform.connect(signers[4]).removeOrder(4))
        .emit(platform, "OrderClosed")
        .withArgs(4);
    });
    it("Trying to by removed order should be reverted", async () => {
      await expect(platform.redeemOrder(4, { value: 1 })).to.be.revertedWith(
        "Order over"
      );
    });
    it("3 orders should be redeemed partly", async () => {
      for (let i = 1; i <= 3; i++) {
        const etherAmount = (i * i * 0.1) / 2;
        const orderPrice = price1 * i;
        tradeVolume += etherAmount / price2;
        await expect(() =>
          platform
            .connect(signers[i + 4])
            .redeemOrder(i, { value: parseEther(etherAmount) })
        ).to.changeTokenBalance(
          token,
          signers[i + 4],
          parseUnits(etherAmount / orderPrice)
        );
      }
    });
  });
  describe("Sale Round 2", () => {
    it("Start sale round. Minted tokens amount should be calculated from trade volume", async () => {
      await ethers.provider.send("evm_increaseTime", [Number(roundperiod)]);
      expect((await platform.round()).salePrice).eq(parseEther(price2));
      await expect(() => platform.startSaleRound()).to.changeTokenBalance(
        token,
        platform,
        parseUnits(Math.floor(tradeVolume))
      );
    });
  });
  describe("Trade Round 2", () => {
    it("Start trade round", async () => {
      await ethers.provider.send("evm_increaseTime", [Number(roundperiod)]);
      await ethers.provider.send("evm_mine", []);
      await expect(() => platform.startTradeRound()).to.changeTokenBalance(
        token,
        platform,
        parseUnits(-Math.floor(tradeVolume))
      );
    });

    it("3 orders should be redeemed fully", async () => {
      for (let i = 1; i <= 3; i++) {
        const eth = (i * i * 0.1) / 2;
        const orderPrice = price1 * i;
        const refers: SignerWithAddress[] = [];
        const refersWallets: BigNumber[] = [];
        refers.push(signers[i]);
        refersWallets.push(parseEther(eth * 0.95));
        if (i > 1) {
          refers.push(signers[i - 1]);
          refersWallets.push(parseEther(eth * 0.025));
        }
        if (i > 2) {
          refers.push(signers[i - 1]);
          refersWallets.push(parseEther(eth * 0.025));
        }
        await expect(() =>
          platform.connect(signers[i + 4]).redeemOrder(i, { value: parseEther(eth) })
        ).to.changeEtherBalances(refers, refersWallets);
      }
    });
  });
});
