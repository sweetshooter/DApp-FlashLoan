// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 假的 Oracle，可以手動改價格（這樣攻擊者才能操控它）
contract FakeOracle {
    uint256 private price;

    constructor(uint256 _initialPrice) {
        price = _initialPrice;
    }

    function setPrice(uint256 _price) external {
        price = _price;
    }

    function getPrice() external view returns (uint256) {
        return price;
    }
}
