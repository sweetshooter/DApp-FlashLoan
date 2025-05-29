const { expect } = require("chai");
const { ethers } = require("hardhat");

// 你先部署 oracle
// 再部署 attacker（先傳空）
// 再部署 victim，把 attacker 當作合法提款人
// 最後再讓 attacker 合約知道 victim 的真實地址
// 呼叫 attack() → 修改價格 → 呼叫 trigger() → 成功領錢！



describe("AttackerContract Test", function () {
  let oracle, victim, attackerContract, owner, attacker;

  beforeEach(async () => {
    [owner, attacker] = await ethers.getSigners();


    // 部署 oracle（起始價格 2000）
    const Oracle = await ethers.getContractFactory("FakeOracle");
    oracle = await Oracle.deploy(2000);

    // 部署 attacker 合約，傳入 oracle 地址，暫時不給 victim 地址
    const Attacker = await ethers.getContractFactory("AttackerContract");
    // attackerContract = await Attacker.deploy(oracle.target, victim.target);
    attackerContract = await Attacker.deploy(oracle.target, ethers.ZeroAddress); // dummy victim


    // 部署 victim 合約，放 1 ETH，讓 attacker 當可提款地址
    const Victim = await ethers.getContractFactory("VictimContract");
    victim = await Victim.deploy(oracle.target, attackerContract.target, {     //constructor
      value: ethers.parseEther("1"),    // 附帶轉入 1 ETH
    });

    await attackerContract.setVictim(victim.target);


  });

  it("執行 attack() 成功竊取資金", async () => {
    // 執行 attack（將價格設成 900）
    await attackerContract.connect(owner).attack(900);

    // Victim 應該歸零
    const balanceVictim = await ethers.provider.getBalance(victim.target);
    expect(balanceVictim).to.equal(0);

    // AttackerContract 合約應該收到 1 ETH
    const balanceAttackerContract = await ethers.provider.getBalance(attackerContract.target);
    expect(balanceAttackerContract).to.equal(ethers.parseEther("1"));
  });

  it("非 attacker 呼叫 trigger() 應該失敗", async () => {
    // 攻擊者不是 caller
    await oracle.connect(attacker).setPrice(900);

    // owner 嘗試觸發提款
    await expect(
        victim.connect(owner).trigger()
    ).to.be.revertedWith("Not authorized");
    });

    it("Oracle 價格高於 1000 時不能提款", async () => {
        // 價格沒變，保持 2000
        await expect(
            victim.connect(attacker).trigger()
        ).to.be.revertedWith("Not authorized");
    });

    it("攻擊成功後再次 attack 應失敗", async () => {
        await attackerContract.connect(owner).attack(900);

        // victim 已被清空，再攻擊應該失敗或無作用
        await expect(
            attackerContract.connect(owner).attack(800)
        ).to.be.revertedWith("no funds left");
    });

    it("withdraw() 將資金從 attacker 合約轉回攻擊者錢包", async () => {
        await attackerContract.connect(owner).attack(900);

        const balanceBefore = await ethers.provider.getBalance(owner.address);

        const tx = await attackerContract.connect(owner).withdraw();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const balanceAfter = await ethers.provider.getBalance(owner.address);
        expect(balanceAfter).to.be.gt(balanceBefore - gasUsed); // 資金進帳扣掉 gas
    });



});
