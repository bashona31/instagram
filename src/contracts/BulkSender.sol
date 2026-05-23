// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
}

contract DACBulkSender {
    address public owner;
    uint256 public constant MAX_BATCH = 500;
    bool private locked;

    event NativeBulkSend(address indexed sender, uint256 total, uint256 count);
    event TokenBulkSend(address indexed sender, address indexed token, uint256 total, uint256 count);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier noReentrant() { require(!locked, "Locked"); locked = true; _; locked = false; }

    constructor() { owner = msg.sender; }

    function bulkSendNative(address[] calldata to, uint256[] calldata amounts) external payable noReentrant {
        require(to.length == amounts.length && to.length > 0 && to.length <= MAX_BATCH, "Invalid");
        uint256 total;
        for (uint256 i; i < to.length;) {
            require(to[i] != address(0) && amounts[i] > 0, "Zero");
            total += amounts[i];
            unchecked { ++i; }
        }
        require(msg.value >= total, "Insufficient");
        for (uint256 i; i < to.length;) {
            (bool ok,) = to[i].call{value: amounts[i]}("");
            require(ok, "Transfer failed");
            unchecked { ++i; }
        }
        if (msg.value > total) {
            (bool ok,) = msg.sender.call{value: msg.value - total}("");
            require(ok, "Refund failed");
        }
        emit NativeBulkSend(msg.sender, total, to.length);
    }

    function bulkSendToken(address token, address[] calldata to, uint256[] calldata amounts) external noReentrant {
        require(token != address(0) && to.length == amounts.length && to.length > 0 && to.length <= MAX_BATCH, "Invalid");
        uint256 total;
        for (uint256 i; i < to.length;) {
            require(to[i] != address(0) && amounts[i] > 0, "Zero");
            IERC20(token).transferFrom(msg.sender, to[i], amounts[i]);
            total += amounts[i];
            unchecked { ++i; }
        }
        emit TokenBulkSend(msg.sender, token, total, to.length);
    }

    function emergencyWithdraw() external onlyOwner {
        (bool ok,) = msg.sender.call{value: address(this).balance}("");
        require(ok);
    }

    function emergencyTokenWithdraw(address token) external onlyOwner {
        IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }

    receive() external payable {}
}
