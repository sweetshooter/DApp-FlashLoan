# Flash Loan 攻擊模擬 DApp（DeFi 安全測試專案）

本專案旨在模擬去中心化金融（DeFi）中常見的 Flash Loan 攻擊手法，並評估防禦機制的實用性。藉由設計可操控的 Oracle 合約與具邏輯缺陷的 Victim 合約，本專案展示如何透過價格操控實施一次完整的攻擊流程。同時，亦實作具備 TWAP（Time-Weighted Average Price）防禦機制的版本，作為對照組。

本專案包含完整的智能合約部署、前端互動介面、單元測試腳本，以及 Netlify 前端部署教學，適合用於 DeFi 教學、智能合約安全測試與研究模擬。

---

## 專案結構說明

```bash

├── contracts/              # 智能合約程式碼（Solidity）
│   ├── AttackerContract.sol
│   ├── VictimContract_TWAP.sol # 加入 TWAP 防禦機制
│   └── FakeOracle.sol
│
├── test/                   # 測試腳本（Hardhat + Mocha）
│   ├── attacker_twap.test.js
│   └── victim_twap.test.js
│
├── scripts/                # Hardhat 部署腳本
│   └── deploy.js
│
├── front-end/              # 前端 DApp 靜態檔案
│   ├── index.html
│   └── script.js
│
├── README.md               # 本說明文件
├── hardhat.config.js       # Hardhat 設定檔
└── .env                    # 私鑰與 RPC 設定（不公開）

```
## 開發環境

- 智能合約語言：Solidity  
- 開發工具：Hardhat  
- 前端互動：HTML + JavaScript + Ethers.js  
- 測試網路：Sepolia Testnet  
- 合約互動介面：Metamask（連接測試網）
- 部署平台：Netlify（前端）


## 如何執行專案

- 安裝依賴套件
- npm install
- 編譯合約
- npx hardhat compile

## 部署到 Sepolia 測試網

請先於 .env 設定以下環境變數：

    SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/你的Infura或Alchemy金鑰
    PRIVATE_KEY=你的測試錢包私鑰（不公開）

部屬指令

    npx hardhat run scripts/deploy.js --network sepolia

執行單元測試

    npx hardhat test

    測試項目涵蓋：

    - 成功觸發 Flash Loan 攻擊（操控 oracle → 提款）
    - 非授權者無法提款
    - 未滿足價格條件時無法提款
    - TWAP 機制能阻擋瞬間攻擊
    - 攻擊者需多次更新價格歷史才能繞過 TWAP

## 部署前端 DApp 到公開網址

方法：使用 Netlify

- 將 index.html 與 script.js 上傳到 GitHub repo

- 登入 https://app.netlify.com
- 選擇你的 repo → 選「Deploy from Git」

- 設定：
    - Build command: 空
    - Publish directory: /（根目錄）

- 取得公開網址

## 操作說明

- 連接錢包（MetaMask）至 Sepolia 測試網
- 初始化 TWAP（5筆價格為 2000）
- 可使用按鈕：
    - 開關 TWAP 機制（可切換至無防禦模式）
    - 發動攻擊（將 Oracle 價格改為 900 並觸發 Victim）
    - 記錄價格（模擬低價壓價）
    - 提款
    - 重設 TWAP（回到高價）
    - 匯款給 Victim（補充受害者餘額）
    
## 安全機制概念

攻擊手法

- 攻擊者透過假 Oracle 設定低價（如 900）
- 觸發 Victim 提款邏輯
- 若 TWAP 未啟用或平均價格過低 → 可成功提款

防禦機制（TWAP）

- Victim 合約會紀錄過去數筆價格
- 若啟用 TWAP，則僅當 TWAP 價格低於門檻（如 1000）才允許提款
- 防止單筆瞬間價格操控（需多次紀錄，增加攻擊成本）