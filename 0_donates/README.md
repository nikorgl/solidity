#### English [Русский](https://github.com/nikorgl/solidity/tree/main/0_donates/README.ru.md)

## Task
Write a smart contract for accepting donations in the form of native currency (ETH, BNB, MATIC...)

The main functionality
1) Make a donation (use msg.value);
2) Withdraw the donation to a specific address. This action can only be done by the contract creator;
3) Store the addresses of all users who have made donations;
4) Store the donation amounts of each user;
5) Write a unit test (use npx hardhat test);
6) Write a script deploy to the rinkeby test network (use "hardhat run scripts/NAME_FILE --network rinkeby");
7) Write tasks for the rinkeby network (use "npx hardhat NAME_FILE -- network renkeby").

The checklist for the decision (each item must be completed):
- Initialized the project on the hardhat framework
- There is one in the project folder .gitignore has the following content (it must be created before the 1st commit so that extra files do not appear in the repository):
  -- node_modules
  -- .env
  -- coverage
  -- coverage.json
  -- typechain
  -- hardhat chache files
  -- hardhat artifacts
- Correctly configured hardhat.config.js (ts), hardhat has detailed documentation on each parameter
- All private data (private key, mnemonic, Infura access keys, Alchemy...) saved to a .env file, which should only remain with you!
- A .sol file has been created in the contracts folder, which contains the source code of the contract
- The contract has the function of depositing any donation amount in the native currency of the blockchain
- The contract has a function for withdrawing any amount to any address, while the function can only be called by the owner of the contract
- The contract has a view function that returns a list of all users who have ever made a donation. The list should not include duplicate elements
- The contract has a view function that allows you to get the total amount of all
- The solidity-coverage plugin is installed and configured in the project
- There are unit test files in the test folder that provide 100% coverage of the contract for all indicators (statements, branches, functions, lines)
- The project is published for all users to choose from github/gitlab/bitbucket
- There is a script in the scripts folder for publishing a contract to one of the test networks
- There are hardhat tasks in the tasks folder that allow you to interact with the published contract (make a donation, withdraw money to a certain address in a certain amount, get a list of donors, get the amount of donations from a certain address)
