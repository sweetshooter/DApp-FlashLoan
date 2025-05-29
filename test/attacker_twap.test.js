const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AttackerContract vs VictimContract_TWAP 測試", function () {
  let oracle, victim, attackerContract, owner, attacker;

  beforeEach(async () => {
    [owner, attacker] = await ethers.getSigners();

    // 部署 oracle（起始價格 2000）
    const Oracle = await ethers.getContractFactory("FakeOracle");
    oracle = await Oracle.deploy(2000);

    // 部署 attacker 合約（暫時不設 victim (ethers.ZeroAddress)，因為Victim 尚未部署，沒辦法事先填入地址）
    const Attacker = await ethers.getContractFactory("AttackerContract");
    attackerContract = await Attacker.deploy(oracle.target, ethers.ZeroAddress);

    // 部署 victim（使用 TWAP 版本）
    const VictimTWAP = await ethers.getContractFactory("VictimContractTWAP");
    victim = await VictimTWAP.deploy(oracle.target, attackerContract.target, {
      value: ethers.parseEther("1"),
    });

    // 綁定 victim 到 attacker 合約
    await attackerContract.setVictim(victim.target);

    // 記錄高價（2000）五筆 → 保證初期 TWAP 高
    for (let i = 0; i < 5; i++) {
      await oracle.setPrice(2000);
      await victim.recordPrice();
    }
  });

  it("Attacker 無法成功觸發 trigger，因為 TWAP 太高", async () => {
    // 攻擊者嘗試 attack（將 oracle 改成 900 並觸發 trigger）
    await expect(
      attackerContract.connect(owner).attack(900)
    ).to.be.revertedWith("TWAP too high");

    // victim 餘額應該還在
    const balance = await ethers.provider.getBalance(victim.target);
    expect(balance).to.equal(ethers.parseEther("1"));
  });

  it("Attacker 多次壓低價格 → 成功攻擊 TWAP victim", async () => {
    // 模擬連續五筆低價（900），更新 Oracle + record
    for (let i = 0; i < 5; i++) {
      await oracle.setPrice(900);
      await victim.recordPrice();
    }

    // 此時 TWAP = 900，應該允許提款
    await attackerContract.connect(owner).attack(900);

    const victimBal = await ethers.provider.getBalance(victim.target);
    const attackerBal = await ethers.provider.getBalance(attackerContract.target);

    expect(victimBal).to.equal(0);
    expect(attackerBal).to.equal(ethers.parseEther("1"));
  });
});
