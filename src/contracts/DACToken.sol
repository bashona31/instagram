// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DACToken - Full-featured ERC20 Token
 * @notice Deployable via the Token Creator UI
 * @dev Includes: Ownable, Mintable, Burnable, Pausable, ReentrancyGuard
 */
contract DACToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;
    bool public paused;
    bool private locked;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Paused(address account);
    event Unpaused(address account);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier whenNotPaused() { require(!paused, "Paused"); _; }
    modifier noReentrant() { require(!locked); locked = true; _; locked = false; }

    constructor(string memory name_, string memory symbol_, uint256 initialSupply_, uint8 decimals_) {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        owner = msg.sender;
        _mint(msg.sender, initialSupply_);
    }

    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external whenNotPaused returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Allowance exceeded");
        allowance[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }

    function pause() external onlyOwner { paused = true; emit Paused(msg.sender); }
    function unpause() external onlyOwner { paused = false; emit Unpaused(msg.sender); }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0) && to != address(0), "Zero address");
        require(balanceOf[from] >= amount, "Insufficient");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "Zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
