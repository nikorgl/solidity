//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Token20.sol";
import "hardhat/console.sol";

contract DAO is AccessControl {
  using SafeERC20 for IERC20;
  IERC20 public token;
  bytes32 public constant CHAIRMAN_ROLE = keccak256("CHAIRMAN_ROLE");
  uint256 public votePeriod;
  uint256 public minTokensForQuorum;

  struct Voter {
    uint256 deposit;
    uint256 lastEndTime;
  }
  mapping(address => Voter) public voters;

  struct Proposal {
    uint256 totalVotes;
    uint256 yesVotes;
    uint256 endTime;
    string description;
    bool isActive;
    mapping(address => bool) voted;
    bytes callData;
    address recipient;
  }
  mapping(uint256 => Proposal) public proposals;
  using Counters for Counters.Counter;
  Counters.Counter public proposalId;

  constructor(
    address _token,
    address _chairman,
    uint256 _votePeriod,
    uint256 _minTokensForQuorum
  ) {
    token = Token20(_token);
    _setupRole(CHAIRMAN_ROLE, _chairman);
    votePeriod = _votePeriod;
    minTokensForQuorum = _minTokensForQuorum;
  }

  function deposit(uint256 value) external {
    token.safeTransferFrom(msg.sender, address(this), value);
    voters[msg.sender].deposit += value;
    emit Deposit(msg.sender, value);
  }

  function withdraw() external positiveDeposit {
    require(voters[msg.sender].lastEndTime < block.timestamp, "Deposit is locked");
    uint256 value = voters[msg.sender].deposit;
    voters[msg.sender].deposit = 0;
    token.safeTransfer(msg.sender, value);
    emit Withdraw(msg.sender, value);
  }

  function addProposal(
    address recipient,
    bytes memory callData,
    string memory description
  ) external onlyRole(CHAIRMAN_ROLE) {
    proposalId.increment();
    Proposal storage proposal = proposals[proposalId.current()];
    proposal.recipient = recipient;
    proposal.callData = callData;
    proposal.description = description;
    proposal.isActive = true;
    proposal.endTime = block.timestamp + votePeriod;
    emit ProposalAdded(proposalId.current(), recipient, callData, description);
  }

  function vote(uint256 id, bool will) external proposalIsActive(id) positiveDeposit {
    Proposal storage proposal = proposals[id];
    require(block.timestamp < proposal.endTime, "Proposal is over");
    require(!proposal.voted[msg.sender], "Already voted");
    proposal.voted[msg.sender] = true;
    Voter storage voter = voters[msg.sender];
    if (will) proposal.yesVotes += voter.deposit;
    proposal.totalVotes += voter.deposit;
    if (voter.lastEndTime < proposal.endTime) voter.lastEndTime = proposal.endTime;
    emit Vote(id, msg.sender, will);
  }

  function finish(uint256 id) external proposalIsActive(id) {
    Proposal storage proposal = proposals[id];
    require(proposal.endTime < block.timestamp, "Proposal is not over");
    proposal.isActive = false;
    if (
      proposal.yesVotes > proposal.totalVotes / 2 &&
      proposal.totalVotes >= minTokensForQuorum
    ) {
      (bool success, ) = proposal.recipient.call(proposal.callData);
      emit ProposalFinished(id, proposal.yesVotes, proposal.totalVotes, success);
    } else {
      emit ProposalCancelled(id, proposal.yesVotes, proposal.totalVotes);
    }
  }

  modifier proposalIsActive(uint256 id) {
    require(proposals[id].isActive, "No active proposals");
    _;
  }

  modifier positiveDeposit() {
    require(voters[msg.sender].deposit > 0, "You have no deposits");
    _;
  }

  event Deposit(address indexed voter, uint256 value);
  event Withdraw(address indexed voter, uint256 value);
  event ProposalAdded(
    uint256 indexed id,
    address indexed recipient,
    bytes indexed callData,
    string description
  );
  event Vote(uint256 indexed id, address indexed voter, bool indexed will);
  event ProposalFinished(
    uint256 indexed id,
    uint256 indexed yesVotes,
    uint256 indexed totalVotes,
    bool successCall
  );
  event ProposalCancelled(
    uint256 indexed id,
    uint256 indexed yesVotes,
    uint256 indexed totalVotes
  );
}
