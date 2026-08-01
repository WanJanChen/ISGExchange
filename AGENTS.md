# AGENTS.md - AI 開發協作與架構規範 (雲端同步版)

## 1. 專案概述 (Project Overview)
- **專案名稱：** 演唱會應援禮物交換與成本管理工具 (IdolSupportGiftExchange & Cost Tracker)
- **核心目標：** 為個人追星需求打造的跨裝置雲端記帳與交換管理工具。能在電腦端輕鬆規劃預算/輸入成本，並在演唱會現場透過手機即時同步、打勾交換狀態。
- **預計技術棧：** React (Vite) / TypeScript / Tailwind CSS / Supabase (PostgreSQL 雲端資料庫)
- **設計風格：** Mobile-First（行動端優先）、簡潔、高對比且易於單手操作。

---

## 2. 雲端資料庫架構 (Supabase Database Schema)
請 AI 在編寫 API 操作與 TypeScript 型態 (`/src/types/index.ts`) 時，務必符合以下 PostgreSQL 資料表結構與關聯：

1. **`events` 表 (主活動專案):**
   - `id`: uuid (Primary Key)
   - `title`: text (例如："2026 SEVENTEEN TOUR in Kaohsiung")
   - `created_at`: timestamp

2. **`expenses` 表 (製作成本清單 - 關聯至 events):**
   - `id`: uuid (Primary Key)
   - `event_id`: uuid (Foreign Key -> events.id, ON DELETE CASCADE)
   - `item_name`: text (例如："貼紙印製費", "霧面小卡")
   - `amount`: numeric (金額)
   - `note`: text (選填備註)

3. **`event_dates` 表 (活動多個日期/場次 - 關聯至 events):**
   - `id`: uuid (Primary Key)
   - `event_id`: uuid (Foreign Key -> events.id, ON DELETE CASCADE)
   - `date_label`: text (例如："2026-04-18", "Day 1")

4. **`exchanges` 表 (禮物交換清單 - 關聯至 event_dates):**
   - `id`: uuid (Primary Key)
   - `event_date_id`: uuid (Foreign Key -> event_dates.id, ON DELETE CASCADE)
   - `contact_handle`: text (例如："@instagram_id" 或 X 帳號)
   - `receiver_item_text`: text (對方提供的禮物描述)
   - `receiver_item_image`: text (對方禮物照片/Supabase Storage URL 或 Base64 縮圖)
   - `sender_item_text`: text (我方提供的禮物描述)
   - `is_prepared`: boolean (預設 false，我方品項是否已準備好)
   - `is_completed`: boolean (預設 false，現場是否已完成交換)
   - `note`: text (備註，如："約在 3 號出口前")

---

## 3. 前端 UI/UX 與跨裝置互動規範

1. **行動裝置體驗 (Mobile-First Design):**
   - 所有按鈕、Toggle 開關點擊區域需符合手機操作規範（至少 44x44px），方便現場單手點擊。
   - 狀態切換（`已準備` / `已交換`）需具備明顯的視覺反饋（如：綠色標籤切換、劃掉文字效果、打勾 Icon）。

2. **多層級頁面切換與雲端同步：**
   - **主頁：** 展示所有演唱會活動卡片（包含自動加總的當次「應援總成本」）。
   - **活動內頁：** 頂部提供「日期頁籤 (Tabs)」快速切換不同場次，並有「製作成本管理」的專屬區塊。
   - **數據更新：** 切換狀態或新增資料時，需同步更新至 Supabase，並帶有輕量的 Loading 或 Success 提示。

3. **圖片處理與效能：**
   - 上傳對方禮物照片時，需限制圖片尺寸或自動壓縮，確保上傳至雲端或資料庫時不會耗費過多頻寬。

---

## 4. 程式碼規範與 Supabase 整合 (Code Style & Structure)

- **檔案目錄結構：**
  - `/src/lib/supabase.ts`：初始化 Supabase Client（自 `.env` 讀取 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`）。
  - `/src/components/`：模組化 UI 組件（如 `EventCard`, `ExchangeList`, `ExpenseTable`）。
  - `/src/types/`：集中定義 TypeScript 介面與 Supabase Database Types。
  - `/src/services/` 或 `/src/hooks/`：將對 Supabase 的 API 讀寫（CRUD）封裝為獨立函式或 Custom Hooks。
- **邏輯與驗證：**
  - 表單輸入需有 basic validation（如：金額不可為負數、社群帳號不可空白）。
  - 當場次無交換資料時，需顯示友好且符合追星情境的空白頁提示 (Empty State)。
  - 處理網絡非同步請求時，必須包含 `try-catch` 錯誤處理，避免畫面崩潰。
  
## 5. Git 操作
  - 請勿自動執行任何git相關操作，若有需要進行動作，請以文字提示。