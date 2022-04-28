import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Token721 } from "../typechain";
import { IPFS_URI_721 } from "../const";

describe("Token721", function () {
  let token: Token721;
  let signers: SignerWithAddress[];

  before(async () => {
    signers = await ethers.getSigners();
    const tokenFactory = await ethers.getContractFactory("Token721");
    token = await tokenFactory.deploy(IPFS_URI_721);
    await token.deployed();
  });

  it("Should get correct tokenURI", async () => {
    const tokenId = 1;
    await token.mint(signers[0].address, tokenId);
    expect(await token.tokenURI(tokenId)).eq(`${IPFS_URI_721}${tokenId}`);
  });

  it("Should not minted by alien", async () => {
    await expect(token.connect(signers[1]).mint(signers[1].address, 1)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
});
