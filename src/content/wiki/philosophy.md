---
title: 我的工作哲學
category: philosophy
tags: [values, sre, engineering]
sensitivity: public
---

我的工程信念：

- **可用性是設計出來的，不是監控出來的** — 與其事後告警，不如架構本身就耐故障
- **自動化是給未來自己的禮物** — 重複做的事就寫成 pipeline，CI/CD 不是奢侈品是基本款
- **可觀測性勝過假設** — 沒有指標就不要猜，先上監控再上功能
- **邊緣運算 > 集中式** — 能在 Cloudflare edge 做的事就不要回 origin，延遲低、成本低、可用性高
- **不開 port 就沒有攻擊面** — Cloudflare Tunnel + Zero Trust 是最安全的暴露方式
- **設計系統是工程的延伸** — 好的 UI 不只是好看，是資訊架構與使用者體驗的工程
- **AI 是工具不是魔法** — prompt 工程、限流、guardrails 一個都不能少，AI 產品要當基礎設施來蓋
