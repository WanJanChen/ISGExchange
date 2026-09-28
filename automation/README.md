# 每 3 天自動查詢演出資料

這個第一版工具會：開啟網站 → 登入 → 點進指定或第一場演出 → 等待資料載入 → 關閉瀏覽器。

## 1. 建立執行環境

請在 PowerShell 進入本資料夾後執行：

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m playwright install chromium
```

如果電腦沒有 Python 3.12，也可將第一行改為 `py -3 -m venv .venv`。

## 2. 設定網站與帳密

複製 `.env.example` 為 `.env`，填入登入 Email 與密碼：

```powershell
Copy-Item .env.example .env
notepad .env
```

`.env` 已被 Git 忽略，請勿把真實帳密提交到版本庫。

`ISG_EVENT_TITLE` 可填完整演出名稱；留空時會點進清單中的第一場演出。

## 3. 手動試跑

第一次建議將 `.env` 中的 `ISG_HEADLESS` 改為 `false`，然後執行：

```powershell
.\run-keep-alive.ps1
```

成功時會在 `logs/keep-alive.log` 出現「演出資料查詢成功，任務完成」。失敗時會保存 `error-screenshot.png`。

## 4. 設定 Windows 每 3 天執行

先確認手動試跑成功，再以目前 Windows 使用者建立排程：

```powershell
$script = (Resolve-Path .\run-keep-alive.ps1).Path
$action = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$script`""
schtasks /Create /TN "ISGExchange Keep Alive" /TR $action /SC DAILY /MO 3 /ST 09:00 /F
```

排程會每 3 天上午 9:00 執行。電腦若完全關機，該次不會執行；可以在 Windows 工作排程器中啟用「錯過排程後儘快執行」。

測試已建立的排程：

```powershell
schtasks /Run /TN "ISGExchange Keep Alive"
```
