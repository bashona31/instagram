// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract DACBulkSender {
    address public owner;
    uint256 public constant MAX_BATCH_SIZE = 500;

    event NativeBulkSend(address indexed sender, uint256 totalAmount, uint256 recipientCount);
    event TokenBulkSend(address indexed sender, address indexed token, uint256 totalAmount, uint256 recipientCount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    error ArrayLengthMismatch();
    error EmptyRecipients();
    error InsufficientValue();
    error ZeroAddress();
    error ZeroAmount();
    error BatchTooLarge();
    error TransferFailed(address recipient);
    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    bool private locked;
    modifier noReentrant() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        owner = msg.sender;
    }

    function bulkSendNative(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable noReentrant {
        uint256 len = recipients.length;
        if (len == 0) revert EmptyRecipients();
        if (len != amounts.length) revert ArrayLengthMismatch();
        if (len > MAX_BATCH_SIZE) revert BatchTooLarge();

        uint256 total = 0;
        for (uint256 i = 0; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();
            total += amounts[i];
            unchecked { ++i; }
        }
        if (msg.value < total) revert InsufficientValue();

        for (uint256 i = 0; i < len;) {
            (bool ok, ) = recipients[i].call{value: amounts[i]}("");
            if (!ok) revert TransferFailed(recipients[i]);
            unchecked { ++i; }
        }

        uint256 excess = msg.value - total;
        if (excess > 0) {
            (bool ok, ) = msg.sender.call{value: excess}("");
            if (!ok) revert TransferFailed(msg.sender);
        }

        emit NativeBulkSend(msg.sender, total, len);
    }

    function bulkSendNativeEqual(
        address[] calldata recipients,
        uint256 amount
    ) external payable noReentrant {
        uint256 len = recipients.length;
        if (len == 0) revert EmptyRecipients();
        if (len > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (amount == 0) revert ZeroAmount();

        uint256 total = amount * len;
        if (msg.value < total) revert InsufficientValue();

        for (uint256 i = 0; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            (bool ok, ) = recipients[i].call{value: amount}("");
            if (!ok) revert TransferFailed(recipients[i]);
            unchecked { ++i; }
        }

        uint256 excess = msg.value - total;
        if (excess > 0) {
            (bool ok, ) = msg.sender.call{value: excess}("");
            if (!ok) revert TransferFailed(msg.sender);
        }

        emit NativeBulkSend(msg.sender, total, len);
    }

    function bulkSendToken(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external noReentrant {
        uint256 len = recipients.length;
        if (token == address(0)) revert ZeroAddress();
        if (len == 0) revert EmptyRecipients();
        if (len != amounts.length) revert ArrayLengthMismatch();
        if (len > MAX_BATCH_SIZE) revert BatchTooLarge();

        uint256 total = 0;
        for (uint256 i = 0; i < len;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();
            total += amounts[i];
            IERC20(token).transferFrom(msg.sender, recipients[i], amounts[i]);
            unchecked { ++i; }
        }

        emit TokenBulkSend(msg.sender, token, total, len);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = msg.sender.call{value: bal}("");
        if (!ok) revert TransferFailed(msg.sender);
        emit EmergencyWithdraw(msg.sender, bal);
    }

    function emergencyTokenWithdraw(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(msg.sender, bal);
    }

    receive() external payable {}
}
