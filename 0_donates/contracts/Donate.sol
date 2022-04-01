// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

/**
 * @title Donate
 * @dev Implements donating process
 */
contract Donate {
    address owner;
    address[] users;
    mapping(address => uint256) donates;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {
        if (donates[msg.sender] == 0) users.push(msg.sender);
        donates[msg.sender] += msg.value;
    }

    modifier isOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    function withdraw(address payable _addr, uint256 _sum) public isOwner {
        _addr.transfer(_sum);
    }

    function getUsers() public view returns (address[] memory) {
        return users;
    }

    function getUserDonates(address _addr) public view returns (uint256) {
        return donates[_addr];
    }
}
