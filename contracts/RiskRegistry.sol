// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SentinelFi Risk Registry
/// @notice Public on-chain registry of risk verdicts for HSK Chain tokens / addresses.
///         Any HSK dApp can read `riskOf(token)` before letting a user swap,
///         lend, or stake. Verdicts are produced by the SentinelFi AI Copilot
///         and signed by an authorized attestor.
/// @dev    Designed to be permissionless to READ and permissioned to WRITE.
///         The hackathon deployment authorizes a single attestor key controlled
///         by the SentinelFi backend. v2 will move to a multi-attestor /
///         stake-weighted oracle.
contract RiskRegistry {
    // ---------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------

    enum Level {
        UNKNOWN,
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    struct Verdict {
        uint8 score;        // 0-100
        Level level;
        uint64 updatedAt;   // unix seconds
        address attestor;
        bytes32 reasonHash; // keccak256 of off-chain reason payload (IPFS / DB)
    }

    // ---------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------

    address public owner;
    mapping(address => bool) public isAttestor;
    mapping(address => Verdict) private _verdicts;

    // ---------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------

    event VerdictPublished(
        address indexed token,
        uint8 score,
        Level level,
        address indexed attestor,
        bytes32 reasonHash
    );
    event AttestorSet(address indexed attestor, bool allowed);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ---------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "RR: not owner");
        _;
    }

    modifier onlyAttestor() {
        require(isAttestor[msg.sender], "RR: not attestor");
        _;
    }

    // ---------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------

    constructor(address initialAttestor) {
        owner = msg.sender;
        isAttestor[initialAttestor] = true;
        emit OwnershipTransferred(address(0), msg.sender);
        emit AttestorSet(initialAttestor, true);
    }

    // ---------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------

    function setAttestor(address attestor, bool allowed) external onlyOwner {
        isAttestor[attestor] = allowed;
        emit AttestorSet(attestor, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "RR: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ---------------------------------------------------------------
    // Attestor writes
    // ---------------------------------------------------------------

    function publish(
        address token,
        uint8 score,
        Level level,
        bytes32 reasonHash
    ) external onlyAttestor {
        require(score <= 100, "RR: score > 100");
        require(level != Level.UNKNOWN, "RR: unknown level");
        _verdicts[token] = Verdict({
            score: score,
            level: level,
            updatedAt: uint64(block.timestamp),
            attestor: msg.sender,
            reasonHash: reasonHash
        });
        emit VerdictPublished(token, score, level, msg.sender, reasonHash);
    }

    // ---------------------------------------------------------------
    // Public reads — the API every HSK dApp can call
    // ---------------------------------------------------------------

    /// @notice Full verdict for a token. Returns zeroed struct if never scanned.
    function riskOf(address token) external view returns (Verdict memory) {
        return _verdicts[token];
    }

    /// @notice Short helper for swap guards. Returns (score, level, isStale).
    /// @param  token    address to look up
    /// @param  maxAgeSeconds the longest a verdict can be before it's stale
    function quickCheck(address token, uint64 maxAgeSeconds)
        external
        view
        returns (uint8 score, Level level, bool isStale)
    {
        Verdict memory v = _verdicts[token];
        if (v.updatedAt == 0) {
            return (0, Level.UNKNOWN, true);
        }
        isStale = (block.timestamp - v.updatedAt) > maxAgeSeconds;
        return (v.score, v.level, isStale);
    }

    /// @notice Convenience guard for integrators.
    ///         Reverts if the token has a CRITICAL verdict or no verdict at all.
    function requireSafe(address token, uint64 maxAgeSeconds) external view {
        Verdict memory v = _verdicts[token];
        require(v.updatedAt != 0, "RR: no verdict");
        require(
            (block.timestamp - v.updatedAt) <= maxAgeSeconds,
            "RR: verdict stale"
        );
        require(v.level != Level.CRITICAL, "RR: token flagged CRITICAL");
    }
}