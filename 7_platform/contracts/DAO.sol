//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Staking.sol";
import "hardhat/console.sol";

contract DAO is AccessControl {
  Staking public staking;
  bytes32 public constant CHAIRMAN_ROLE = keccak256("CHAIRMAN_ROLE");
  uint256 public votePeriod;
  uint256 public minVotesForQuorum;

  mapping(address => uint256) public votersEndTime;

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
    address _staking,
    address _chairman,
    uint256 _votePeriod,
    uint256 _minVotesForQuorum
  ) {
    staking = Staking(_staking);
    _setupRole(CHAIRMAN_ROLE, _chairman);
    votePeriod = _votePeriod;
    minVotesForQuorum = _minVotesForQuorum;
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

  function vote(uint256 id, bool will) external proposalIsActive(id) positiveBallance {
    Proposal storage proposal = proposals[id];
    require(block.timestamp < proposal.endTime, "Proposal is over");
    require(!proposal.voted[msg.sender], "Already voted");
    proposal.voted[msg.sender] = true;
    (uint256 balance, , , ) = staking.wallets(msg.sender);
    if (will) proposal.yesVotes += balance;
    proposal.totalVotes += balance;
    if (votersEndTime[msg.sender] < proposal.endTime)
      votersEndTime[msg.sender] = proposal.endTime;
    emit Vote(id, msg.sender, will);
  }

  function finish(uint256 id) external proposalIsActive(id) {
    Proposal storage proposal = proposals[id];
    require(proposal.endTime < block.timestamp, "Proposal is not over");
    proposal.isActive = false;
    if (
      proposal.yesVotes > proposal.totalVotes / 2 &&
      proposal.totalVotes >= minVotesForQuorum
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

  modifier positiveBallance() {
    (uint256 balance, , , ) = staking.wallets(msg.sender);
    require(balance > 0, "You have no stakes");
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
