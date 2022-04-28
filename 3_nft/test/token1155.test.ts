import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Token1155 } from "../typechain";
import { IPFS_URI_1155 } from "../const";

describe("Token1155", function () {
  let token: Token1155;
  let signers: SignerWithAddress[];

  before(async () => {
    signers = await ethers.getSigners();
    const tokenFactory = await ethers.getContractFactory("Token1155");
    token = await tokenFactory.deploy(IPFS_URI_1155);
    await token.deployed();
  });

  it("Should get correct tokenURI", async () => {
    const tokenId = 1;
    await token.mint(signers[0].address, tokenId, 1);
    expect(await token.uri(tokenId)).eq(`${IPFS_URI_1155}${tokenId}`);
  });

  it("Should not minted by alien", async () => {
    const tokenId = 2;
    await expect(token.connect(signers[1]).mint(signers[1].address, tokenId, 1)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
});
