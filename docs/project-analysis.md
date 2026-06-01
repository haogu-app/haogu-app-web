# 好顧 App — 完整專案分析報告

> 分析日期：2026-05-31
> Next.js 16.2.6 · React 19 · Tailwind CSS 4 · TypeScript

---

## 1. 所有頁面 (Pages)

| 路由 | 檔案 | 說明 |
|------|------|------|
| `/` | `app/page.tsx` | 唯一頁面，直接渲染 `<App />` |

這是一個**單頁應用（SPA）**，沒有使用 Next.js 的 file-based routing 多頁架構。所有「頁面切換」都是 React state 控制的 Client-side view 切換，URL 永遠維持在 `/`。

---

## 2. 所有 Components

```
components/
├── App.tsx               根元件 — 持有全域 state，控制 view 切換
├── NavBar.tsx            底部導覽列（5 個按鈕 + 中央 FAB）
├── Header.tsx            頂部標題列（含返回按鈕、鈴鐺按鈕）
├── DebugPanel.tsx        API 偵錯面板（顯示 JSONP 連線狀態）
├── QuickRecordModal.tsx  快速記錄 Bottom Sheet Modal
└── views/
    ├── DashboardView.tsx  首頁儀表板
    ├── LineSyncView.tsx   LINE 同步紀錄列表
    ├── RecordsView.tsx    照顧紀錄（含搜尋 + Tab 篩選）
    ├── TasksView.tsx      照顧任務分配（我的 / 其他家人）
    └── SettingsView.tsx   設定（家人管理 + LINE 同步說明）
```

### Component 職責細節

| Component | Props 輸入 | 主要職責 |
|-----------|-----------|---------|
| `App` | — | 持有 `view`、`showDebug`、`isQuickRecordOpen`、`tasks`、`lineSyncs`、`apiStatus` |
| `NavBar` | `currentView`, `setView`, `onQuickRecord` | 切換 view，觸發 QuickRecord |
| `Header` | `title`, `showBack?`, `onBack?` | 標題顯示，選用性返回按鈕 |
| `DebugPanel` | `apiStatus`, `apiErrorDetails`, `lineSyncs` | 顯示 JSONP 狀態與錯誤詳情 |
| `QuickRecordModal` | `isOpen`, `onClose`, `onSubmit` | 手動新增照顧事項 |
| `DashboardView` | `setView`, `tasks`, `lineSyncs` | 顯示摘要、統計圖表、LINE 同步快覽 |
| `LineSyncView` | `onBack`, `lineSyncs`, `onConfirm`, `onDelete` | 列出待確認同步、確認/刪除操作 |
| `RecordsView` | `lineSyncs` | 顯示照顧紀錄時間軸，本地搜尋與篩選 |
| `TasksView` | `lineSyncs` | 照顧任務分配，一鍵 LINE 提醒 |
| `SettingsView` | `showDebug`, `setShowDebug` | 家人列表、LINE 同步說明、Debug 開關 |

---

## 3. 所有 Hooks

| Hook | 檔案 | 說明 |
|------|------|------|
| `useLineSync` | `hooks/useLineSync.ts` | 唯一自訂 Hook |

### `useLineSync` 詳細行為

- 用 **JSONP** 方式呼叫 Google Apps Script URL
- 每 **30 秒**輪詢一次（`setInterval`）
- Timeout 設定為 **10 秒**，逾時設為 ERROR
- 過濾含 `#好顧` 標籤或 `containsTag === 'YES'` 的訊息
- 將原始資料 normalize 成 `RawLineSync[]` 與 `CareTask[]`
- 回傳：`{ lineSyncs, setLineSyncs, tasks, setTasks, apiStatus, apiErrorDetails }`

**狀態機：**

```
LOADING ──► SUCCESS  (JSONP 回呼成功，資料為陣列)
        └─► ERROR    (timeout / script load error / 格式錯誤 / callback 拋例外)
```

**錯誤類型：**

| 錯誤碼 | 觸發條件 |
|--------|---------|
| `TIMEOUT` | 10 秒內 callback 未觸發 |
| `JSONP_LOAD_ERROR` | script element 載入失敗 |
| `FORMAT_ERROR` | callback 收到非陣列資料 |
| `CALLBACK_FAIL` | callback 內部拋出例外 |
| `JSONP_EXCEPTION` | 建立 script element 時發生例外 |

---

## 4. 所有假資料 (Mock / Hardcoded Data)

| 位置 | 變數 | 內容 | 性質 |
|------|------|------|------|
| `lib/constants.ts` | `FAMILY_MEMBERS` | 4 位家庭成員（大女兒、二兒子、媽媽、姑姑）含角色/狀態/最後查看時間 | 完全硬編碼 |
| `components/views/TasksView.tsx` | `members` | `['大女兒', '二兒子', '姑姑']` | 硬編碼，用來 round-robin 分配任務給 lineSyncs |
| `components/views/DashboardView.tsx` | `dynamicStats` fallback | 各類照顧小時數的預設值（`|| 2`, `|| 4`, `|| 1`, `|| 1`） | lineSyncs 為空時的填充數字 |
| `components/views/SettingsView.tsx` | 群組名稱 | 「王家照顧群」 | 硬編碼字串 |

> `GOOGLE_APPS_SCRIPT_URL` 是真實外部端點，非 mock data，但屬硬編碼設定值。

---

## 5. 已完成的功能（真正有邏輯運作）

| 功能 | 說明 |
|------|------|
| JSONP 輪詢 | 每 30 秒向 Google Apps Script 拉取資料，含 timeout / onerror 處理 |
| `#好顧` 過濾 | 只保留含標籤或 `containsTag=YES` 的訊息，其餘忽略 |
| 資料 normalize | 將 Google Sheets 原始格式統一轉換成 `RawLineSync`，填補缺失欄位 |
| 確認 LINE 同步 | 將 LINE 同步轉換為 `CareTask`，從 `lineSyncs` 移除 |
| 刪除 LINE 同步 | 從 `lineSyncs` 移除指定項目 |
| 快速手動記錄 | `QuickRecordModal` 新增 `CareTask`（類型、時間、備註） |
| 任務時間排序 | `addTask` 後自動以 `time.localeCompare` 排序 |
| 本地搜尋 | `RecordsView` 支援即時搜尋 title 與原始訊息 |
| Tab 篩選 | `RecordsView` 依照顧類型篩選（用藥／回診／生理數據／飲食） |
| View 動畫切換 | `AnimatePresence` + `motion.div` 實現頁面滑入滑出 |
| Debug 面板 | 顯示 JSONP 狀態、錯誤碼、callback 是否觸發、timeout 狀態 |
| 時間格式化 | `formatTime` 處理 timestamp、日期字串、純時間字串 |
| 分享近況 | 開啟 `line.me/R/msg/text/` 帶入今日摘要文字 |
| 一鍵提醒家人 | 開啟 LINE 分享帶入指定提醒文字 |

---

## 6. 只有 UI、沒有實際邏輯的功能

| 功能 | 位置 | 問題描述 |
|------|------|---------|
| 同步成功通知 toggle | `SettingsView` | 視覺元素，無 state 綁定，重整後視覺回到預設 |
| 家人查看通知 toggle | `SettingsView` | 同上 |
| 邀請成員 按鈕 | `SettingsView` | `<button>` 無 `onClick`，點擊無任何反應 |
| 解除綁定 按鈕 | `SettingsView` | `<button>` 無 `onClick`，點擊無任何反應 |
| Header 鈴鐺 按鈕 | `Header.tsx` | 所有頁面都有，但 `<button>` 無 `onClick` |
| 照顧投入統計 | `DashboardView` | 數字由 `lineSyncs.length × 固定倍率` 計算，非真實累積數據 |
| 估算價值 | `DashboardView` | `totalHours × 300`，基於假設固定時薪 |
| 家庭成員列表 | `SettingsView` | 完全硬編碼，無法新增、編輯、刪除 |
| 連線中群組 | `SettingsView` | 「王家照顧群」硬編碼，無法管理 |

---

## 7. 資料流圖

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 (App Router)                   │
│                                                              │
│  app/layout.tsx  ──►  <html lang="zh-TW"><body>             │
│  app/page.tsx    ──►  <App />   (唯一路由：/)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼───────┐
                    │   App.tsx    │  ← 全域狀態中心
                    │              │
                    │  state:      │
                    │  · view      │
                    │  · tasks     │
                    │  · lineSyncs │
                    │  · apiStatus │
                    │  · showDebug │
                    └──┬───────────┘
                       │  useLineSync()
                       │
          ┌────────────▼────────────────────────────┐
          │          hooks/useLineSync.ts            │
          │                                          │
          │  JSONP polling (每 30 秒)                │
          │       │                                  │
          │       ▼                                  │
          │  Google Apps Script (外部服務)           │
          │  └── 資料來源：Google Sheets             │
          │                                          │
          │  回傳: lineSyncs[] / tasks[] / apiStatus │
          └──────────────────────────────────────────┘
                       │
         ┌─────────────┼──────────────────────────┐
         │             │                           │
    ┌────▼────┐   ┌────▼────────────────────┐  ┌──▼──────────┐
    │DebugPanel│  │     View Router          │  │  NavBar     │
    │(條件顯示)│  │  (switch on `view`)      │  │ (底部導覽)  │
    └──────────┘  │                          │  └─────────────┘
                  │  'dashboard' ──► DashboardView
                  │  'lineSync'  ──► LineSyncView
                  │  'records'   ──► RecordsView
                  │  'tasks'     ──► TasksView
                  │  'settings'  ──► SettingsView
                  └──────────────────────────────

──────────────── 資料流向 ────────────────────────

  Google Sheets
      │  (JSONP via Google Apps Script)
      ▼
  useLineSync
      │
      ├── lineSyncs[] ──► LineSyncView  (確認 / 刪除)
      │                ──► DashboardView (LINE 快覽)
      │                ──► RecordsView  (時間軸)
      │                ──► TasksView    (任務分配)
      │
      └── tasks[]     ──► DashboardView (今日摘要)

  QuickRecordModal ──── onSubmit ──► addTask() ──► tasks[]
  LineSyncView.confirm ──────────► addTask() + lineSyncs 移除
  LineSyncView.delete  ──────────► lineSyncs 移除

──────────────── lib 工具層 ──────────────────────

  lib/types.ts
    · View ('dashboard' | 'lineSync' | 'records' | 'tasks' | 'settings')
    · CareTask { id, time, title, type, completed }
    · FamilyTask { id, member, title, time, completed }
    · RawLineSync { receivedAt, originalMessage, displayMessage,
                    recordSummary, ... + 中文欄位 }

  lib/utils.ts
    · cn()                  — clsx + tailwind-merge
    · formatTime()          — timestamp / 日期字串 → HH:MM 或 MM/DD HH:MM
    · cleanDisplayMessage() — 移除 #好顧 標籤，清除多餘空白
    · getRecordSummary()    — 從 RawLineSync 萃取最佳摘要文字

  lib/constants.ts
    · GOOGLE_APPS_SCRIPT_URL
    · FAMILY_MEMBERS[]

──────────────── 重要限制 ────────────────────────

  ⚠ 所有 state 存在 React memory
  ⚠ 重整頁面，tasks 與 lineSyncs 清空（無任何持久化）
  ⚠ 無使用者登入，身份完全硬編碼為「大女兒」
  ⚠ 無資料庫，唯一外部資料來源為 Google Sheets JSONP
```

---

## 8. 目前完成度

| 面向 | 完成度 | 說明 |
|------|--------|------|
| UI / 視覺設計 | 90% | 畫面完整，設計系統（色彩、圓角、排版）一致 |
| 前端互動邏輯 | 60% | 核心操作（確認/刪除/新增）可運作，部分按鈕無功能 |
| 外部資料串接 | 50% | JSONP 讀取運作，但為單向唯讀，無法寫回 |
| 資料持久化 | 0% | 重整即消失，無 localStorage 或資料庫 |
| 使用者系統 | 0% | 無登入、無身份驗證、無多用戶支援 |
| 後端 API | 0% | 完全無後端，僅依賴 Google Apps Script |

**整體完成度估算：約 40%**

---

## 9. 下一階段建議

### 優先度高（核心功能缺口）

| 項目 | 建議方案 | 說明 |
|------|---------|------|
| **資料持久化** | Supabase PostgreSQL | tasks 與 lineSyncs 需寫入資料庫，重整後仍保留 |
| **使用者登入** | Supabase Auth（LINE Login / Email） | 「大女兒」應為真實登入用戶，非硬編碼 |
| **家庭成員 CRUD** | Supabase Table + RLS | 邀請、移除、角色管理需後端支撐 |

### 優先度中（體驗完整性）

| 項目 | 建議方案 | 說明 |
|------|---------|------|
| **通知設定儲存** | Supabase user_settings table | Toggle 狀態需持久化至用戶設定 |
| **真實統計數據** | 從 DB 聚合查詢 | 跨月累積照顧時數，取代目前假設倍率計算 |
| **Header 鈴鐺通知** | Supabase Realtime 或 polling | 串接通知清單，點擊顯示未讀提醒 |

### 優先度低（長期規劃）

| 項目 | 建議方案 | 說明 |
|------|---------|------|
| **推播通知** | Web Push API + FCM | 需 service worker，適合 PWA 化後處理 |
| **多裝置同步** | Supabase Realtime | 家人同時查看時即時更新 |
| **LINE Webhook** | 取代現有 JSONP | 改為主動推送，去除 30 秒輪詢延遲 |
| **PWA 化** | next-pwa | 加入 manifest + service worker，支援「加入主畫面」 |

### 建議開發順序

```
Phase 1：資料持久化 + 登入
  └── Supabase 建立 schema
  └── useLineSync 改為讀寫 DB
  └── 登入頁面（LINE Login 或 Email）
  └── 將 tasks / lineSyncs 寫入 DB

Phase 2：家庭成員管理
  └── 邀請機制（link / LINE）
  └── 角色權限（主要照顧者 / 家屬）
  └── SettingsView 接通真實 CRUD

Phase 3：通知與統計
  └── 通知設定持久化
  └── 真實統計聚合
  └── 鈴鐺通知功能

Phase 4：體驗優化
  └── PWA
  └── 推播
  └── LINE Webhook 取代 JSONP
```
