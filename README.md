# Align Canvas

純前端的 KPI 關係畫布 Web App。把一整批 KPI 放到畫布上，拉出它們之間的「正向 / 負向 × 直接 / 間接」四種影響關係，再透過 Highlight 找出指標的上下游依賴。資料完全存放在瀏覽器 IndexedDB，也可以隨時 export / import JSON。

## 功能

- **批次新增指標**：一行一個名稱，支援去空行與去重。
- **拖拉建立關係**：從節點右側拉線到另一節點，選擇方向（正向 / 負向）與強度（直接 / 間接），自動以不同線條樣式呈現。
- **Highlight 上下游**：點選節點後按「Highlight」，會以雙向 BFS 找出所有祖先與後代（transitive），其餘節點與邊變淡。
- **自動排版**：使用 dagre 依關係方向做階層排版，可切換水平 / 垂直方向，也可手動拖曳微調並儲存。
- **Undo / Redo**：完整的歷史堆疊（新增 / 刪除 / 編輯 / 批次 / 拖曳 / 匯入）皆可復原，支援 `Cmd/Ctrl+Z`、`Cmd/Ctrl+Shift+Z`。
- **匯出 / 匯入 JSON**：匯入支援覆蓋或合併模式；格式含版本欄位以便未來升級。
- **從網址列匯入（`?import=`）**：在網址帶上遠端 JSON 的連結即可開啟即載入，方便團隊用 GitHub 等靜態檔共用同一份圖；若本機已有儲存資料，會先詢問是否覆寫再寫入 IndexedDB（見下節）。
- **IndexedDB 持久化**：開啟自動還原上次狀態，變動 300ms debounce 寫回。

## 從網址匯入（團隊共用）

在部署網址或本機 `npm run dev` 的頁面網址加上查詢參數 `import`，值為**可公開下載的 JSON 完整 URL**（建議用 `encodeURIComponent` 包起來，避免 `&` 等字元截斷查詢字串）：

```text
https://bobchao.github.io/align-canvas/?import=ENCODED_JSON_URL
```

- **行為**
  - 若本機 IndexedDB **沒有**圖資（0 個 KPI、0 條關係），會直接下載該 JSON 並載入圖，介面偏好（如排版方向）仍沿用本機其他設定；載入成功後網址列會自動**移除** `?import=`，避免重新整理再抓一次。
  - 若本機 **已經有**圖，會顯示確認：說明遠端筆數與本機筆數，**確定**後才以遠端內容覆寫本機儲存（效果等同匯入的「覆蓋」）；**取消**則保留本機畫布。
- **遠端檔案格式**：與「匯出 JSON」相同（`version: 1`，含 `kpis` / `relations`）。
- **CORS**：瀏覽器會以 `fetch` 向該 URL 要內容，遠端需允許**跨網域讀取**（常見的 GitHub `raw`、Gist `raw`、或附帶正確 CORS 的靜態空間通常可用；若被擋可改放至可設 CORS 的 bucket，或團隊內部代存服務）。
- **安全**：只接受 `http://` 或 `https://` 的 `import` 參數值。

## 關係樣式對應

| 方向 | 強度 | 線條 |
| --- | --- | --- |
| 正向 | 直接 | 綠色實線 + 箭頭 |
| 正向 | 間接 | 綠色虛線 + 箭頭 |
| 負向 | 直接 | 紅色實線 + 箭頭 |
| 負向 | 間接 | 紅色虛線 + 箭頭 |

## 技術棧

- Vite + React 19 + TypeScript
- `@xyflow/react`（原 React Flow）做畫布渲染
- `dagre` 負責 DAG 階層排版
- `zustand` 狀態管理 + 自製 command-pattern undo / redo
- `idb` 封裝 IndexedDB
- Tailwind CSS、lucide-react、nanoid

## 開發指令

```bash
npm install     # 安裝依賴
npm run dev     # 啟動開發伺服器 (Vite)
npm run build   # 型別檢查 + 產生正式版
npm run preview # 預覽正式版
```

## GitHub Pages

- 已配置 `vite.config.ts` 的 `base: '/align-canvas/'`，可直接部署到專案頁面。
- Push 到 `main` 後會由 GitHub Actions 自動 build + deploy。
- 部署網址：`https://bobchao.github.io/align-canvas/`

## 鍵盤快捷鍵

| 快捷鍵 | 功能 |
| --- | --- |
| `Cmd/Ctrl + Z` | 復原 |
| `Cmd/Ctrl + Shift + Z` / `Cmd/Ctrl + Y` | 重做 |
| `Esc` | 取消 Highlight / 選取 |
