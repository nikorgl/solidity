//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./IERC20.sol";

contract Token is IERC20 {
    string public name = "NiToken";
    string public symbol = "NiT";
    uint8 public decimals = 18;
    uint256 private _totalSupply = 1e30;
    address private owner;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;


    function totalSupply() public override view returns (uint256) {
        return _totalSupply;
    }

    constructor() {
        owner = msg.sender;
        _balances[msg.sender] = _totalSupply;
    }

    function balanceOf(address _addr) public override view returns (uint256 balance) {
        return _balances[_addr];
    }

    modifier sufficientBalance(address _addr, uint256 _value) {
        require(_balances[_addr] >= _value, "Insufficient balance");
        _;
    }

    function transfer(address _to, uint256 _value)
        public
        override
        sufficientBalance(msg.sender, _value)
        returns (bool success)
    {
        return _transfer(msg.sender, _to, _value);
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) private returns (bool success) {
        _balances[_from] -= _value;
        _balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    modifier sufficientAllowance(address _from, uint256 _value) {
        require(
            _allowances[_from][msg.sender] >= _value,
            "Insufficient allowance"
        );
        _;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        public
        override
        sufficientBalance(_from, _value)
        sufficientAllowance(_from, _value)
        returns (bool success)
    {
        _allowances[_from][msg.sender] -= _value;
        return _transfer(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value)
        public
        override
        returns (bool success)
    {
        _allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender)
        public
        override
        view
        returns (uint256 remaining)
    {
        return _allowances[_owner][_spender];
    }

    modifier isOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    modifier nonZeroAddress(address account) {
        require(account != address(0), "Zero address");
        _;
    }

    function mint(address account, uint256 amount)
        external
        isOwner
        nonZeroAddress(account)
    {
        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    function burn(address account, uint256 amount)
        external
        isOwner
        nonZeroAddress(account)
        sufficientBalance(account, amount)
    {
        _totalSupply -= amount;
        _balances[account] -= amount;
        emit Transfer(account, address(0), amount);
    }
}
