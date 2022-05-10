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


