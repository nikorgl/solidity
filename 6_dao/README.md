#### English [Русский](https://github.com/nikorgl/solidity/tree/main/6_dao/README.ru.md)

# Sample DAO project

## Task
It is necessary to implement a smart contract that will trigger the signature of the function through user voting.
- Write a DAO contract
- Write full-fledged tests for the contract
- Write a deployment script
- Upload to the test network
- Write a task on vote, addProposal, finish, deposit.
- Verify the contract

Requirements
- To participate in the voting, users need to deposit tokens for voting.
- Users can withdraw tokens from the DAO only after the end of all the votes in which they participated.
- Only the chairman can propose a vote.
- To participate in the voting, the user needs to make a deposit, one token, one vote.
- The user can participate in voting with the same tokens, that is, the user has contributed 100 tokens, he can participate in voting No. 1 with all 100 tokens and in voting No. 2 also with all 100 tokens.
- Any user can finish the voting after a certain amount of time set in the constructor.

## Info about deployed contract

### ERC-20 contract
https://rinkeby.etherscan.io/address/0xC06F7b5cdAccd18A37639FdceCE943e7eD744c7E

### DAO contract
https://rinkeby.etherscan.io/address/0x041361172cA855d1863BaB7eF0fBdec63677fCEF

