const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(" 部署帳號:", deployer.address);

  // 部署 oracle（初始價格 2000）
  const Oracle = await ethers.getContractFactory("FakeOracle");
  const oracle = await Oracle.deploy(2000);
  await oracle.waitForDeployment();
  console.log(" Oracle 部署於:", oracle.target);

  // 先部署 attacker（暫時給 dummy address）
  const Attacker = await ethers.getContractFactory("AttackerContract");
  const attacker = await Attacker.deploy(oracle.target, ethers.ZeroAddress);
  await attacker.waitForDeployment();
  console.log(" Attacker 部署於:", attacker.target);

  // 部署 victim（認可 attacker 合約），原始版
  /*
  const Victim = await ethers.getContractFactory("VictimContract");
  const victim = await Victim.deploy(oracle.target, attacker.target, {
    value: ethers.parseEther("0.01"),
  });
  await victim.waitForDeployment();
  console.log(" Victim (原始) 部署於:", victim.target);
  */

  // TWAP 版 VictimContract
  const VictimTWAP = await ethers.getContractFactory("VictimContractTWAP");
  const victimTWAP = await VictimTWAP.deploy(oracle.target, attacker.target, {
    value: ethers.parseEther("0.01"),
  });
  await victimTWAP.waitForDeployment();
  console.log("Victim (TWAP) 部署於:", victimTWAP.target);

  // 設定 victim 地址到 attacker 合約（若支援 setter）
  await attacker.setVictim(victimTWAP.target);

  console.log(" 部署完成！請至frontend/script.js 填寫地址資料");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
