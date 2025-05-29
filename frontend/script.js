
const oracleContractAddress = "0x2ea1e699Ac76D6E3470D452e6bcc4dfFDED8d7a4";
const attackerContractAddress = "0x12d9c5ced811768e97B64de48baa438DB0f57B79";
const victimContractAddress = "0x252Ca4885c5fED925E92dfC98e27A879b8168313";

const attackerAbi = [
  "function attack(uint256 fakePrice) external",
  "function withdraw() external",
  "function setVictim(address) external",
  "function owner() view returns (address)",
  "function victim() view returns (address)"
];

const victimAbi = [
  "function recordPrice() external",
  "function getTWAP() external view returns (uint256)",
  "function initTWAP(uint256 value, uint256 count) external",
  "function enableTWAP() external view returns (bool)",
  "function setTWAPEnabled(bool) external",
  "function getPriceHistoryLength() external view returns (uint256)"
];



let provider, signer, attackerContract,  oracleContract, victimContract;

let isConnecting = false;

document.getElementById("connect").onclick = async () => {
  if (isConnecting) return;
  isConnecting = true;

  try {
    if (!window.ethereum) {
      alert("請安裝 MetaMask");
      return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();

    oracleContract = new ethers.Contract(oracleContractAddress, [
      "function setPrice(uint256 _price) external"
    ], signer);

    attackerContract = new ethers.Contract(attackerContractAddress, attackerAbi, signer);
    victimContract = new ethers.Contract(victimContractAddress, victimAbi, signer);

    await attackerContract.setVictim(victimContractAddress);

    document.getElementById("connect").innerText = "已連線";
    document.getElementById("connect").disabled = true;
    document.getElementById("connect").style.backgroundColor = "green";
    document.getElementById("wallet-address").innerText = await signer.getAddress();

    await updateTWAPToggleUI();
    await updateVictimBalance();
    await updateAttackerBalance();
    await updateTWAPValue();

    // 初始化 TWAP：預設五筆高價 2000
    try {
      const length = await victimContract.getPriceHistoryLength();
    
      const tx = await victimContract.initTWAP(2000, 5);
      alert("TWAP 準備初始化，請等待");
      await tx.wait();

      alert("TWAP 初始化完成（2000 × 5）");
      await updateTWAPValue();
    } catch (err) {
      console.error("初始化錯誤：", err);
      alert("初始化失敗：" + (err.reason || err.message));
    }

    } catch (err) {
      console.error("MetaMask 連接錯誤：", err);
      alert("連接失敗：請稍後再試，或確認是否已授權錢包存取。");
    } finally {
      isConnecting = false;
    }
};


document.getElementById("attack").onclick = async () => {
  try {
    await attackerContract.callStatic.attack(900);
  } catch (err) {
    console.error("staticCall revert:", err.error?.message || err.reason || err.message);
  }
  const isTWAPEnabled = await victimContract.enableTWAP();

  try {
    const tx = await attackerContract.attack(900);
    await tx.wait();
    if(isTWAPEnabled) alert("TWAP Victim 攻擊完成");
    else  alert("原始 Victim 攻擊完成");
    await updateAttackerBalance();
    await updateVictimBalance();
  } catch (err) {
    alert("攻擊失敗：" + (err.reason || err.message));
  }
};

document.getElementById("withdraw").onclick = async () => {
  try {
    const tx = await attackerContract.withdraw();
    await tx.wait();
    alert("提款完成");
    await updateAttackerBalance();
  } catch (err) {
    alert("提款失敗：" + (err.reason || err.message));
  }
};

document.getElementById("record-twap").onclick = async () => {
  try {
    await oracleContract.setPrice(900);
    const tx = await victimContract.recordPrice();
    await tx.wait();
    alert("TWAP 價格紀錄完成");
    alert("TWAP 已紀錄一筆價格：900");
    await updateTWAPValue();
  } catch (err) {
    alert("記錄失敗：" + (err.reason || err.message));
  }
};

document.getElementById("refill-victim").onclick = async () => {
  try {
    const addr = victimContractAddress;
    const signerAddr = await signer.getAddress();
    const balance = await provider.getBalance(signerAddr);

    console.log("Signer:", signerAddr);
    console.log("Victim Address:", addr);
    console.log("你的錢包餘額 (ETH):", ethers.utils.formatEther(balance));

    const tx = await signer.sendTransaction({
      to: addr,
      value: ethers.utils.parseEther("0.01"),
      gasLimit: 50000 // 或適量更高一點
    });
    await tx.wait();
    alert("匯款成功");
    await updateVictimBalance();
  } catch (err) {
    console.error("匯款錯誤：", err);
    alert("匯款失敗：" + (err.reason || err.message));
  }
};

document.getElementById("reset-twap").onclick = async () => {
  try {
    const length = await victimContract.getPriceHistoryLength();
    
    const tx = await victimContract.initTWAP(2000, 5);
    await tx.wait();
    alert("TWAP 初始化完成（2000 × 5）");
    await updateTWAPValue();
  } catch (err) {
    console.error("初始化錯誤：", err);
    alert("初始化失敗：" + (err.reason || err.message));
  }
};


document.getElementById("toggle-twap").onclick = async () => {
  try {
    const current = await victimContract.enableTWAP();
    const tx = await victimContract.setTWAPEnabled(!current);
    await tx.wait();
    updateTWAPToggleUI();
  } catch (err) {
    alert("切換 TWAP 防禦失敗：" + (err.reason || err.message));
  }
};


async function updateVictimBalance() {
  const balance = await provider.getBalance(victimContractAddress);
  document.getElementById("victim-balance").innerText = ethers.utils.formatEther(balance);
}

async function updateAttackerBalance() {
  const balance = await provider.getBalance(attackerContractAddress);
  document.getElementById("attacker-balance").innerText = ethers.utils.formatEther(balance);
}

async function updateTWAPValue() {
  try {
    const twap = await victimContract.getTWAP();
    document.getElementById("twap-value").innerText = twap.toString();
  } catch {
    document.getElementById("twap-value").innerText = "尚未建立";
  }
}



async function updateTWAPToggleUI() {
  try {
    const enabled = await victimContract.enableTWAP();
    document.getElementById("toggle-twap").innerText = enabled ? "啟用中" : "已關閉";
    document.getElementById("toggle-twap").style.backgroundColor = enabled ? "green" : "gray";
  } catch (err) {
    document.getElementById("toggle-twap").innerText = "讀取失敗";
  }
}

