#### English [Русский](https://github.com/nikorgl/solidity/tree/main/7_platform/README.ru.md)
# Sample multi functional project

## Task
The platform will consist of several contracts (ACDMToken, XXXToken, Betting, DAO, ACDMPlatfofm).
### ACDMToken description 
- name = ACADEM Coin
- symbol = ACDM
- decimals = 6

### XXXToken Description 
- name = ACADEM Coin
- symbol = ACDM
- decimals = 18

XXXToken must be flipped to Uniswap. The initial price of the token is 0.00001 ETH.

### Staking description 
The staking contract accepts LP tokens (XXX/ETH). 
Frozen tokens are locked on X_days after this time they can withdraw their tokens. 
Every week, users are awarded a reward, 3% of their contribution. 
The reward can be withdrawn at any time. 
Reward credited to XXXToken.
X_days is set only with the help of DAO voting.

### DAO description
To participate in the DAO voting, the user needs to make a deposit in the staking. 
The weight in the voting depends on the deposit in the staking 
(for example: I made 100 LP in the staking, taking part in the voting I have the weight of 100 votes).

### Description of ACDMPlatfofm
There are 2 rounds of "Trade" and "Sale", which follow each other, starting with the sale round.
Each round lasts 3 days.

#### Basic concepts:
"Sale" round - In this round, the user can buy ACDM tokens at a fixed price from the platform for ETH.

"Trade" round - in this round, users can buy ACDM tokens from each other for ETH.

Referral program — The referral program has two levels, users receive rewards in ETH.

#### Description of the "Sale" round:
The price of the token increases with each round and is calculated according to the formula (see the excel file). 
The number of tokens issued in each Sale round is different and depends on the total trading volume in the "Trade" round. 
The round may end prematurely if all tokens have been sold out. 
At the end of the round, unsold tokens are burned. 
The very first round sells tokens worth 1ETH (100,000 ACDM)

Calculation example: 
Trading volume in a trade round = 0.5 ETH (the total amount of ETH for which users traded within one trade round) 0,5/0,0000187 = 26737.96. 
(0,0000187 = the price of the token in the current round)
Therefore, 26737.96 ACDM tokens will be available for sale in the Sale round.

#### Description of the "Trade" round:
User_1 places an order to sell ACDM tokens for a certain amount in ETH. 
User_2 buys tokens for ETH. The order may not be fully redeemed. 
Also, the order can be revoked and the user will get back his tokens that have not been sold yet. 
Received ETH they are immediately sent to the user in their metamask wallet. 
At the end of the round, all open orders move to the next TRADE round..

#### Description of the Referral program:
When registering, the user specifies his referrer (the referrer must already be registered on the platform).
When buying ACDM tokens in the Sale round, referrer_1 will receive 5% (this parameter is regulated through the DAO) of its purchase, 
referrer_2 will receive 3% (this parameter is regulated through the DAO), the platform itself will receive 92%, in the absence of referrers, 
the platform receives everything.
When buying in the Trade round, the user who has placed an order for the sale of ACDM tokens will receive 95% of ETH and 2.5% 
(this parameter is regulated through the DAO) will receive referrers. 
In case of their absence, the platform takes these percentages to a special account to which there is access only through DAO voting.
Price ETH = lastPrice*1,03+0,000004

Through the DAO vote, users will decide to give this commission to the ovner or to
Buy these ETH XXXToken on Uniswap and then burn them.

Requirements
- Write all smart contracts
- Write full-fledged tests for the entire system
- Write deployment scripts
- Upload to the test network
- Write tasks on on basic methods
- Verify contracts


## Info about deployed contracts

### XXX token
https://rinkeby.etherscan.io/address/0xCC7C56a676A1b4bafdbDbd9Ac93554e57abBBBd0

### ACDM token
https://rinkeby.etherscan.io/address/0x9Fda078095Bd368be59A5c7F9aba688a6E528586

### Liquidity provider token
https://rinkeby.etherscan.io/token/0x70BDD02Fa5B4D453068284Fcd010e4162c97B2a5

### Staking contract
https://rinkeby.etherscan.io/address/0xD81a9c5F7DDc93Be261687d3c05156ac024E3aF1

### DAO contract
https://rinkeby.etherscan.io/address/0xe994921e3cdf9EAe5361ff67131207411E5357ef

### ACDM platform
https://rinkeby.etherscan.io/address/0x21eb640e3BDB3B9EB45cc3cC2de9695240B8c4d2
