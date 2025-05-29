const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();

  const abi = [
    "function getTWAP() view returns (uint256)",
    "function recordPrice() external"
  ];

  const address = "0x12f6aa49f9dcb2b036f0ab6c26de2a4b39bc2aa7";
  const victim = await ethers.getContractAt(abi, address, signer);

  try {
    console.log("嘗試呼叫 recordPrice()...");
    const tx = await victim.recordPrice();
    await tx.wait();
    console.log("✅ TWAP 價格記錄成功！");
  } catch (err) {
    console.error("❌ 記錄價格失敗：", err.reason || err.message);
  }

  try {
    const twap = await victim.getTWAP();
    console.log("目前 TWAP 值為：", twap.toString());
  } catch (err) {
    console.error("❌ 無法取得 TWAP：", err.reason || err.message);
  }
}

main().catch((err) => {
  console.error("腳本執行錯誤：", err);
});
