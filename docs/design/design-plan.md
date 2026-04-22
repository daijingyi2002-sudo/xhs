# Design Plan

## 1. Design North Star

这个产品的视觉和交互不该像“又一个聊天机器人页面”。

它应该同时传达三件事：

1. 可信
2. 有方向感
3. 有训练感

用户要感受到这不是闲聊，而是一次被托管的求职准备过程。

## 2. Overall Direction

Recommended direction:

- editorial + operating console hybrid
- 明亮背景
- 不走默认紫色 AI 风
- 让首页像“求职指挥台”，而不是 SaaS 表单页

## 3. Information Architecture

```text
Home
├─ Agent chat
├─ Resume upload
└─ Entry to recommendations

Jobs
├─ Top 5 cards
└─ Job detail / fit analysis

Interview
└─ Real-time streaming interview

Resume Lab
└─ Bullet rewrite suggestions

Plaza
├─ 推荐岗位
└─ 面试经验内容

Admin
└─ One-page dashboard
```

## 4. Page-by-Page Intent

### Home

Intent:

- 降低首次进入的决策成本
- 让用户马上开始行动

Must show:

- chat entry
- resume upload
- light explanation of what happens next

### Jobs

Intent:

- 把推荐结果做得有解释力，不只是分数排序

### Job Detail

Intent:

- 让用户从“这个岗位适合我吗”走到“我要怎么准备”

### Interview

Intent:

- 强化真实感和训练感
- 让用户感到正在被面试，而不是在看分析报告

### Resume Lab

Intent:

- 输出直接能改的内容

### Plaza

Intent:

- 作为发现页，而不是主战场

## 5. Visual Principles

1. 首页要有强主动作
2. 分析页要有强结构
3. 面试页要减少干扰
4. 广场要轻，但不能廉价
5. 管理看板要像工具，不像营销页

## 6. Suggested Design Tokens

### Color

- background: `#F6F2EA`
- card: `#FFFDF8`
- primary text: `#161616`
- secondary text: `#5D5A55`
- accent: `#C96A13`
- accent soft: `#F0D7BE`
- border: `#DED5C8`
- success: `#2F7A57`
- warning: `#AD6B00`

### Typography

Avoid default system feel.

Recommended pair:

- display / headings: a distinctive serif or semi-serif
- body / UI: a clean grotesk

### Shape

- medium radius
- strong borders
- generous whitespace

## 7. Motion Rules

- use motion to clarify progression, not decorate
- homepage can use staggered reveals
- interview page should keep motion minimal
- plaza cards may use subtle lift and filter transitions

## 8. AI Interaction Rules

- Agent should feel proactive, not verbose
- Streaming should show momentum quickly
- Per-turn feedback should be visually distinct from questions
- Role switch from manager to HR must be clearly visible

## 9. Plaza Design Rules

- two tabs or segmented control:
  - 推荐岗位
  - 面试经验内容
- default organization by role
- detail pages should surface:
  - role
  - company
  - source context
  - QR CTA if URL exists

## 10. Responsive Rules

- homepage stacks gracefully on mobile
- interview stays readable on mobile, but desktop is the showcase layout
- plaza cards become single-column on small screens
- dashboard can reduce to summary cards without dense tables on mobile

## 11. Empty and Error States

Must design explicitly:

- no resume uploaded
- parse failed
- no recommendation yet
- low-confidence role lead
- missing source URL
- no interview history

## 12. What Already Exists

- Product route structure is fixed in [AGENTS.md](C:\Users\28397\Desktop\xhs面试\AGENTS.md)
- Main funnel ordering is fixed
- Plaza structure is fixed to two sections

## 13. NOT in Scope

- full visual design system site
- social interaction design
- comment system
- dark-mode-first exploration
- animation-heavy landing page

## 14. Final Design Call

这个产品的视觉不应该像“AI 工具模板”，而应该像“帮你打赢求职战役的控制台”。
