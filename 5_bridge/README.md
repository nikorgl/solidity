#### English [Русский](https://github.com/nikorgl/solidity/tree/main/5_bridge/README.ru.md)

# Sample cross-chain bridge project

## Task
Write a cross-chain bridge contract for sending ERC-20 standard tokens between the Ethereum and Binance Smart chain networks.
- Write a Bridge contract
- Write full-fledged tests for the contract
- Write a deployment script
- Upload to the test network
- Write a task on swap, redeem
- Verify the contract

Requirements
- swap() function: debits tokens from the user and emits event ‘swapInitialized’
- redeem() function: calls the ecrecover function and restores the validator's address based on the hashed message and signature, if the address matches the address specified on the bridge contract, tokens are sent to the user


## Info about deployed contracts

## Side Rinkeby
### ERC-20 contract
https://rinkeby.etherscan.io/address/0xf57B91D2C402D41fE77cbc48CE5AB52A34e542E9
### Bridge contract
https://rinkeby.etherscan.io/address/0xDbE4939886DFeeCD432887aC1011E1Dd2892cAD0


## Side BSC
### ERC-20 contract
https://testnet.bscscan.com/address/0xD5c115456F405323114Af033048aB026be8ef58a
### Bridge contract
https://testnet.bscscan.com/address/0xA9C1D6B4940EAaF78f7a7fDB90387487D8ABEC0D


## Info about transfer from Rinkeby to BSC Testnet:
### Swap in Rinkeby
https://rinkeby.etherscan.io/tx/0x4674bfebb98b65b27b015b41dc3229518268ad7948b17d81c695f3d0bc5482b9
### Redeem in BSC Testnet
https://testnet.bscscan.com/tx/0xfee5db5c0b7c74925dd8304fa8fdc3d526868e22b899cbe07831b51aaa6ae9be


