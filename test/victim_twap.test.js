const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VictimContract_TWAP 防禦測試", function () {
  let oracle, victim, attacker;
  let owner, attackerAddr;

  beforeEach(async () => {
    [owner, attackerAddr] = await ethers.getSigners();

    // 部署 oracle（初始價格 2000）
    const Oracle = await ethers.getContractFactory("FakeOracle");
    oracle = await Oracle.deploy(2000);

    // 部署 VictimContract_TWAP，轉入 1 ETH
    const VictimTWAP = await ethers.getContractFactory("VictimContractTWAP");
    victim = await VictimTWAP.deploy(oracle.target, attackerAddr.address, {
      value: ethers.parseEther("1"),
    });

    // 記錄前幾筆高價（模擬正常狀態）
    await oracle.setPrice(2000);
    for (let i = 0; i < 4; i++) {
      await victim.recordPrice();
    }
  });

  it("TWAP 高於閾值 → 不允許提款", async () => {
    await oracle.setPrice(900); // 模擬操控價格
    await victim.recordPrice(); // 第五筆

    // debug
    const twap = await victim.getTWAP();
    console.log("💡 Current TWAP =", twap.toString());

    // TWAP: (2000*4 + 900)/5 = 1780 > 1000 → 不應該提款成功
    await expect(victim.connect(attackerAddr).trigger()).to.be.revertedWith("TWAP too high");
    
    
});

  it("連續多筆低價 → TWAP 低於閾值 → 可以提款", async () => {
    for (let i = 0; i < 5; i++) {
      await oracle.setPrice(900); // 模擬攻擊者持續壓低價格
      await victim.recordPrice();
    }

    // 這時 TWAP = 900 → 應該允許提款
    const tx = await victim.connect(attackerAddr).trigger();
    await tx.wait();

    const balance = await ethers.provider.getBalance(victim.target);
    expect(balance).to.equal(0);
  });

  it("非授權者無法 trigger", async () => {
    await oracle.setPrice(900);
    await victim.recordPrice();

    await expect(victim.connect(owner).trigger()).to.be.revertedWith("Not authorized");
  });
});
