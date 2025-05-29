// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOracle {
    function getPrice() external view returns (uint256);
}

contract VictimContractTWAP {
    bool public enableTWAP = true;

    IOracle public oracle;
    address public authorizedAttacker;
    uint256 public withdrawThreshold = 1000;

    uint256[] public priceHistory;
    uint256 public maxHistoryLength = 5; // 可自訂平均時間長度

    constructor(address _oracle, address _attacker) payable {
        oracle = IOracle(_oracle);
        authorizedAttacker = _attacker;
    }

    receive() external payable {}

    function setTWAPEnabled(bool enabled) external {
        // 若需要安全性可加 onlyOwner
        enableTWAP = enabled;
    }

    // Oracle 每次更新價格後，需主動呼叫此函數記錄歷史價格
    function recordPrice() external {
        uint256 price = oracle.getPrice();
        priceHistory.push(price);

        if (priceHistory.length > maxHistoryLength) {
            // 移除最舊的一筆資料，維持固定長度
            for (uint i = 1; i < priceHistory.length; i++) {
                priceHistory[i - 1] = priceHistory[i];
            }
            priceHistory.pop();
        }
    }

    function getTWAP() public view returns (uint256) {
        require(priceHistory.length > 0, "No price data");
        uint256 sum = 0;
        for (uint i = 0; i < priceHistory.length; i++) {
            sum += priceHistory[i];
        }
        return sum / priceHistory.length;
    }

    function trigger() external {
        require(msg.sender == authorizedAttacker, "Not authorized");

        if (enableTWAP) {
            uint256 twap = getTWAP();
            require(twap < withdrawThreshold, "TWAP too high");
        }

        uint256 balance = address(this).balance;
        require(balance > 0, "no funds left");

        payable(msg.sender).transfer(balance);
    }

    function initTWAP(uint256 value, uint256 count) external {
        delete priceHistory;
        for (uint256 i = 0; i < count; i++) {
            priceHistory.push(value);
        }
    }

    function getPriceHistoryLength() external view returns (uint256) {
        return priceHistory.length;
    }

}
