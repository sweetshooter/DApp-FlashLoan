// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 如果價格被攻擊者操控變低，錢就會被轉走

// (任何有 getPrice() 函式的合約，我都可以叫它 oracle，只要你告訴我它的地址。)
interface IOracle {
    function getPrice() external view returns (uint256);
}

contract VictimContract {
    address public owner;
    address public oracle;
    address public attacker;
    uint256 public threshold = 1000;

    constructor(address _oracle, address _attacker) payable {
        owner = msg.sender;
        oracle = _oracle;
        attacker = _attacker;
    }

    function trigger() public {
        require(msg.sender == attacker, "Not authorized");
        uint256 currentPrice = IOracle(oracle).getPrice();

        require(currentPrice < threshold, "Price too high");
        payable(attacker).transfer(address(this).balance);
    
        
    }

    // 合約可以接受 ETH 存款
    receive() external payable {}
}
