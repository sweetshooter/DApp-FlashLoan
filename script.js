const oracleContractAddress = "0x5FEB67e81FDD589d0b924DE4829442e1c64117D4";
const attackerContractAddress = "0x08745b1604bf6d1F882c478920eBa2011Fd32eC6";
const victimContractAddress = "0xc930B7Fb8B0bb37574FCB0740BCF472015Bd24C5";
const victimContractAddress_TWAP = "0x9a4ea1E341BA69e7eeE0488aDD470f3A25889d50"; // 改成實際 TWAP victim 部署地址

const attackerAbi = [
  "function attack(uint256 fakePrice) external",
  "function withdraw() external",
  "function setVictim(address) external",
  "function owner() view returns (address)",
  "function victim() view returns (address)"
];

const victimTwapAbi = [
  "function recordPrice() external",
  "function getTWAP() external view returns (uint256)"
];

let provider, signer, attackerContract, victimTwapContract;

document.getElementById("connect").onclick = async () => {
  if (!window.ethereum) {
    alert("請安裝 Metamask");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  attackerContract = new ethers.Contract(attackerContractAddress, attackerAbi, signer);
  victimTwapContract = new ethers.Contract(victimContractAddress_TWAP, victimTwapAbi, signer);

  await attackerContract.setVictim(victimContractAddress);
  console.log("Victim set:", await attackerContract.victim());

  const connectBtn = document.getElementById("connect");
  connectBtn.innerText = "已連線";
  connectBtn.style.backgroundColor = "green";

  document.getElementById("wallet-address").innerText = await signer.getAddress();

  updateVictimBalance();
  updateAttackerBalance();
  updateVictimTwapBalance();
  updateTWAPValue();
};

document.getElementById("attack").onclick = async () => {
  try {
    await attackerContract.attack.staticCall(900);
  } catch (err) {
    console.error("staticCall revert:", err.error?.message || err.reason || err.message);
  }

  try {
    const tx = await attackerContract.attack(900);
    await tx.wait();
    alert("原始 Victim 攻擊完成");
    await updateAttackerBalance();
    await updateVictimBalance();
  } catch (err) {
    alert("攻擊失敗：" + (err.reason || err.message));
  }
};

document.getElementById("attack-twap").onclick = async () => {
  try {
    await attackerContract.setVictim(victimContractAddress_TWAP);
    const tx = await attackerContract.attack(900);
    await tx.wait();
    alert("TWAP Victim 攻擊完成！");
    await updateAttackerBalance();
    await updateVictimTwapBalance();
    await updateTWAPValue();
  } catch (err) {
    alert("TWAP 攻擊失敗：" + (err.reason || err.message));
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
    const tx = await victimTwapContract.recordPrice();
    await tx.wait();
    alert("TWAP 價格紀錄完成");
    await updateTWAPValue();
  } catch (err) {
    alert("記錄失敗：" + (err.reason || err.message));
  }
};

async function updateVictimBalance() {
  const balance = await provider.getBalance(victimContractAddress);
  document.getElementById("victim-balance").innerText = ethers.formatEther(balance);
}

async function updateVictimTwapBalance() {
  const balance = await provider.getBalance(victimContractAddress_TWAP);
  document.getElementById("victim-twap-balance").innerText = ethers.formatEther(balance);
}

async function updateAttackerBalance() {
  const balance = await provider.getBalance(attackerContractAddress);
  document.getElementById("attacker-balance").innerText = ethers.formatEther(balance);
}

async function updateTWAPValue() {
  try {
    const twap = await victimTwapContract.getTWAP();
    document.getElementById("twap-value").innerText = twap.toString();
  } catch {
    document.getElementById("twap-value").innerText = "尚未建立";
  }
}
