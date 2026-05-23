// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DACBulkSender
 * @notice Advanced bulk sender contract for DAC Testnet
 * @dev Supports native DACC and ERC20 token bulk transfers
 *      with gas optimization and reentrancy protection
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DACBulkSender is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ============================================================
    // Events
    // ============================================================

    event NativeBulkSend(
        address indexed sender,
        uint256 totalAmount,
        uint256 recipientCount
    );

    event TokenBulkSend(
        address indexed sender,
        address indexed token,
        uint256 totalAmount,
        uint256 recipientCount
    );

    event EmergencyWithdraw(
        address indexed owner,
        uint256 amount
    );

    event EmergencyTokenWithdraw(
        address indexed owner,
        address indexed token,
        uint256 amount
    );

    // ============================================================
    // Errors
    // ============================================================

    error ArrayLengthMismatch();
    error EmptyRecipients();
    error InsufficientValue();
    error ZeroAddress();
    error ZeroAmount();
    error BatchTooLarge();
    error TransferFailed(address recipient);

    // ============================================================
    // Constants
    // ============================================================

    uint256 public constant MAX_BATCH_SIZE = 500;

    // ============================================================
    // Constructor
    // ============================================================

    constructor() Ownable(msg.sender) {}

    // ============================================================
    // Native DACC Bulk Transfer
    // ============================================================

    /**
     * @notice Send native DACC to multiple recipients in one transaction
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send (in wei)
     */
    function bulkSendNative(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable nonReentrant {
        uint256 length = recipients.length;

        if (length == 0) revert EmptyRecipients();
        if (length != amounts.length) revert ArrayLengthMismatch();
        if (length > MAX_BATCH_SIZE) revert BatchTooLarge();

        uint256 totalRequired = 0;
        for (uint256 i = 0; i < length; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();
            totalRequired += amounts[i];
            unchecked { ++i; }
        }

        if (msg.value < totalRequired) revert InsufficientValue();

        // Execute transfers
        for (uint256 i = 0; i < length; ) {
            (bool success, ) = recipients[i].call{value: amounts[i]}("");
            if (!success) revert TransferFailed(recipients[i]);
            unchecked { ++i; }
        }

        // Refund excess
        uint256 excess = msg.value - totalRequired;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            if (!refundSuccess) revert TransferFailed(msg.sender);
        }

        emit NativeBulkSend(msg.sender, totalRequired, length);
    }

    /**
     * @notice Send equal amounts of native DACC to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amount Amount to send to each recipient (in wei)
     */
    function bulkSendNativeEqual(
        address[] calldata recipients,
        uint256 amount
    ) external payable nonReentrant {
        uint256 length = recipients.length;

        if (length == 0) revert EmptyRecipients();
        if (length > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (amount == 0) revert ZeroAmount();

        uint256 totalRequired = amount * length;
        if (msg.value < totalRequired) revert InsufficientValue();

        for (uint256 i = 0; i < length; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            (bool success, ) = recipients[i].call{value: amount}("");
            if (!success) revert TransferFailed(recipients[i]);
            unchecked { ++i; }
        }

        // Refund excess
        uint256 excess = msg.value - totalRequired;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            if (!refundSuccess) revert TransferFailed(msg.sender);
        }

        emit NativeBulkSend(msg.sender, totalRequired, length);
    }

    // ============================================================
    // ERC20 Token Bulk Transfer
    // ============================================================

    /**
     * @notice Send ERC20 tokens to multiple recipients
     * @dev Requires prior approval of totalAmount to this contract
     * @param token ERC20 token contract address
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send
     */
    function bulkSendToken(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant {
        uint256 length = recipients.length;

        if (token == address(0)) revert ZeroAddress();
        if (length == 0) revert EmptyRecipients();
        if (length != amounts.length) revert ArrayLengthMismatch();
        if (length > MAX_BATCH_SIZE) revert BatchTooLarge();

        IERC20 tokenContract = IERC20(token);
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < length; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();
            totalAmount += amounts[i];
            unchecked { ++i; }
        }

        // Transfer tokens from sender to recipients
        for (uint256 i = 0; i < length; ) {
            tokenContract.safeTransferFrom(msg.sender, recipients[i], amounts[i]);
            unchecked { ++i; }
        }

        emit TokenBulkSend(msg.sender, token, totalAmount, length);
    }

    /**
     * @notice Send equal amounts of ERC20 tokens to multiple recipients
     * @param token ERC20 token contract address
     * @param recipients Array of recipient addresses
     * @param amount Amount to send to each recipient
     */
    function bulkSendTokenEqual(
        address token,
        address[] calldata recipients,
        uint256 amount
    ) external nonReentrant {
        uint256 length = recipients.length;

        if (token == address(0)) revert ZeroAddress();
        if (length == 0) revert EmptyRecipients();
        if (length > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (amount == 0) revert ZeroAmount();

        IERC20 tokenContract = IERC20(token);

        for (uint256 i = 0; i < length; ) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            tokenContract.safeTransferFrom(msg.sender, recipients[i], amount);
            unchecked { ++i; }
        }

        emit TokenBulkSend(msg.sender, token, amount * length, length);
    }

    // ============================================================
    // Emergency Functions (Owner Only)
    // ============================================================

    /**
     * @notice Emergency withdraw native currency stuck in contract
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        if (!success) revert TransferFailed(msg.sender);
        emit EmergencyWithdraw(msg.sender, balance);
    }

    /**
     * @notice Emergency withdraw ERC20 tokens stuck in contract
     * @param token ERC20 token address to withdraw
     */
    function emergencyTokenWithdraw(address token) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        tokenContract.safeTransfer(msg.sender, balance);
        emit EmergencyTokenWithdraw(msg.sender, token, balance);
    }

    // ============================================================
    // Receive function
    // ============================================================

    receive() external payable {}
}
