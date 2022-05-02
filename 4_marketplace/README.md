# NFT marketplace project

## NFT contract
https://rinkeby.etherscan.io/address/0x05661a2bA0964Ff3Df64e4cDbb8e5DF582869E75
## NFT collection
https://testnets.opensea.io/collection/nitoknft
## ERC-20 contract
https://rinkeby.etherscan.io/address/0x97C534978625289E9d17BccCd5C3bE2C0309A7F4
## Marketplace contract
https://rinkeby.etherscan.io/address/0x1d29f54632bbB0c50E7FeBB5E191451EA5a3704b


## Task:
Write a marketplace contract that should include the NFT creation function, as well as the auction functionality.
The auction lasts 3 days from the start of the auction. 
During this period, the auction cannot be canceled. 
If more than two bids are collected after the expiration of the period, 
the auction is considered to have taken place and the auction creator completes it 
(the NFT passes to the last bidder and tokens to the auction creator). 
Otherwise, the tokens are returned to the last bidder, and the NFT remains with the creator.

- Write an NFT marketplace contract
- Write full-fledged tests for the contract
- Write a deployment script
- Upload to the test network
- Write a task on mint
- Verify the contract

Requirements
- createItem() function - creating a new item, accesses the NFT contract and calls the mint function
- mint() function, which only the marketplace contract should have access to
- listItem() function is an exhibition for the sale of an item
- buyItem() function - purchase of an item
- cancel() function - canceling the sale of the exhibited item
- listItemOnAuction() function is an exhibition of an item for sale in an auction
- makeBid() function - place a bid on an auction item with a specific id
- finishAuction() function - complete the auction and send the NFT to the winner
- cancelAuction() function - cancel the auction

