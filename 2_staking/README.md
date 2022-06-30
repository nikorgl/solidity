#### English [Русский](https://github.com/nikorgl/solidity/tree/main/2_staking/README.ru.md)

# Staking of liquidity provider token: sample project

## Task
Write a smart staking contract, create a liquidity pool on uniswap in the test network. The staking contract accepts LP tokens, after a certain time (for example, 10 minutes), the user is awarded rewards in the form of reward tokens written in the first week. The number of tokens depends on the amount of tokens zasteykannyh LP (for example, 20 percent). It is also possible to withdraw the tokens sealed with LP after a certain time (for example, 20 minutes).
- Create a liquidity pool
- Implement the staking functionality in a smart contract
- Write full-fledged tests for the contract
- Write a deployment script
- Upload to the test network
- Write tasks on stake, unstake, claim
- Verify the contract

Requirements
- stake function(uint256 amount) - debits tokens in the amount of amount from the user to the LP staking contract, updates the user's balance in the contract
- claim() function - writes off the reward tokens available as rewards from the betting contract
- unstake() function - writes off tokens available for withdrawal from the LP staking contract
- Admin functions for changing the staking parameters (freezing time, percentage)

LP token based on WETH and NiT token.
Reward token is NiT token.


## Info about deployed contract
NiT Token address:

https://rinkeby.etherscan.io/address/0xace294036fE7546e6bB8288Ea17ebc7287Bb7E2b

LP Token address:

https://rinkeby.etherscan.io/address/0x9770e2356AB2A7c00d0934958cf99285E75475B4

Staking contract address:

https://rinkeby.etherscan.io/address/0x3Bf979B038562Df98B026965e92392D217082F22

