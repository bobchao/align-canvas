# Align Canvas

純前端的 KPI 關係畫布 Web App。把一整批 KPI 放到畫布上，拉出它們之間的「正向 / 負向 × 直接 / 間接」四種影響關係，再透過 Highlight 找出指標的上下游依賴。資料完全存放在瀏覽器 IndexedDB，也可以隨時 export / import JSON。

## 功能

- **批次新增指標**：一行一個名稱，支援去空行與去重。
- **拖拉建立關係**：從節點右側拉線到另一節點，選擇方向（正向 / 負向）與強度（直接 / 間接），自動以不同線條樣式呈現。
- **Highlight 上下游**：點選節點後按「Highlight」，會以雙向 BFS 找出所有祖先與後代（transitive），其餘節點與邊變淡。
- **自動排版**：使用 dagre 依關係方向做階層排版，可切換水平 / 垂直方向，也可手動拖曳微調並儲存。
- **Undo / Redo**：完整的歷史堆疊（新增 / 刪除 / 編輯 / 批次 / 拖曳 / 匯入）皆可復原，支援 `Cmd/Ctrl+Z`、`Cmd/Ctrl+Shift+Z`。
- **匯出 / 匯入 JSON**：匯入支援覆蓋或合併模式；格式含版本欄位以便未來升級。
- **IndexedDB 持久化**：開啟自動還原上次狀態，變動 300ms debounce 寫回。

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
