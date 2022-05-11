import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Bridge, Token20 } from "../typechain";

describe("Bridge testing", () => {
  let chainId0: string;
  let chainId1: string;
  let bridge0: Bridge;
  let bridge1: Bridge;
  let token0: Token20;
  let token1: Token20;
  let validator0: SignerWithAddress;
  let validator1: SignerWithAddress;
  let sender: SignerWithAddress;
  let receiver: SignerWithAddress;
  let nonce = 1;
  let value = 1e10;

  before(async () => {
    [validator0, validator1, sender, receiver] = await ethers.getSigners();
    [chainId0, bridge0, token0] = await hre.run("deploy", {
      user: sender.address,
      validator: validator0.address,
      tokenname: "Etherik",
      tokensymbol: "eik",
    });
    [chainId1, bridge1, token1] = await hre.run("deploy", {
      user: receiver.address,
      validator: validator1.address,
      tokenname: "Binansik",
      tokensymbol: "bik",
    });
  });

  describe("Swapping", () => {
    it("Swapping should burn amount and emit SwapInitialized event", async () => {
      await expect(() =>
        expect(bridge0.connect(sender).swap(chainId1, receiver.address, value))
          .to.emit(bridge0, "SwapInitialized")
          .withArgs(chainId1, sender.address, receiver.address, value, nonce)
      ).to.changeTokenBalance(token0, sender, -value);
    });
    it("Second swapping", async () => {
      await expect(() =>
        expect(bridge0.connect(sender).swap(chainId1, receiver.address, value))
          .to.emit(bridge0, "SwapInitialized")
          .withArgs(chainId1, sender.address, receiver.address, value, nonce + 1)
      ).to.changeTokenBalance(token0, sender, -value);
    });
  });

  describe("Redeem", () => {
    let hash: any;
    it("Redeem with non-validator signature should be reverted", async () => {
      hash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "address", "uint256", "uint256"],
        [chainId1, sender.address, receiver.address, value, nonce]
      );
      let signature = await receiver.signMessage(ethers.utils.arrayify(hash));
      await expect(
        bridge1.connect(receiver).redeem(sender.address, value, nonce, signature)
      ).to.be.revertedWith("Invalid signature");
    });
    it("Redeem with sender signature should mint amount and emit Redeem event", async () => {
      hash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "address", "uint256", "uint256"],
        [chainId1, sender.address, receiver.address, value, nonce]
      );
      let signature = await validator1.signMessage(ethers.utils.arrayify(hash));
      await expect(() =>
        expect(bridge1.connect(receiver).redeem(sender.address, value, nonce, signature))
          .to.emit(bridge1, "Redeem")
          .withArgs(sender.address, receiver.address, value, nonce)
      ).to.changeTokenBalance(token1, receiver, value);
    });
    it("Redeem front-running should be reverted", async () => {
      hash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "address", "uint256", "uint256"],
        [chainId1, sender.address, receiver.address, value, nonce + 1]
      );
      let signature = await validator1.signMessage(ethers.utils.arrayify(hash));
      await expect(async () => {
        bridge1.connect(receiver).redeem(sender.address, value, nonce + 1, signature);
        await expect(
          bridge1.connect(receiver).redeem(sender.address, value, nonce + 1, signature)
        ).to.be.revertedWith("Transfer already processed");
      }).to.changeTokenBalance(token1, receiver, value);
    });
  });
});
