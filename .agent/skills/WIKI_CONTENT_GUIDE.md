# Wiki 內容撰寫指南

吉祥物回答「關於我」的所有事實來源是 `src/content/wiki/*.md`。

## 檔案格式

每個 markdown 檔頭必須有 frontmatter：

```markdown
---
title: <顯示標題>
category: <identity | skills | experience | projects | philosophy | contact | 自訂>
tags: [tag1, tag2]
sensitivity: public   # MVP 只支援 public；其他值會被 inline 時過濾掉
---

<body markdown>
```

## 撰寫準則

1. **以第一人稱撰寫**：「我目前擔任 SRE...」而不是「hsjinde 目前擔任...」。LLM 在第一人稱人格下直接引用。
2. **事實優於修辭**：寫具體專案名、年限、數字；避免「很多」「豐富」「擅長」這種 LLM 難引用的形容詞。
3. **絕不寫 PII**：私人手機、住址、身分證、薪資、密碼、健康狀況一律不寫。Email 已在聯絡頁可接受。
4. **主題單一**：`skills.md` 只講技術；`projects.md` 只講專案。重複內容用「詳見 `projects.md` 的 OpenClaw 段」引用。
5. **每個段落 < 200 字**：過長的段落 LLM 易在 inline 時被截斷。
6. **sensitivity 欄位**：MVP 只認 `public`；未來招募方版會用 `internal`，私人助理版會用 `private`。

## 新增 wiki 檔的流程

1. 在 `src/content/wiki/` 開新 `.md` 檔，命名以 category 為主（`projects-openclaw.md`）
2. 填好 frontmatter + body
3. 在 `functions/api/chat-wiki.ts` 的 `WIKI_FILES` array 加入該檔名（Task 1.2 會說明）
4. `npm run build` 重新 inline，commit，部署
