# 求职 Agent / 面试知识库平台 Product Brief

## Document Status

- Owner: Founder / Builder
- Review lenses applied:
  - `plan-ceo-review`
  - `plan-eng-review`
  - `plan-design-review`
- Decision mode: SELECTIVE EXPANSION
- Status: APPROVED FOR IMPLEMENTATION PLANNING

## 1. Product in One Sentence

这是一个面向校招 / 应届生的 AI 求职产品：用户先上传简历并和 Agent 对话，系统再基于候选人画像、岗位线索和面试经验知识库，推荐高匹配度的 `AI 产品经理` 岗位线索，并提供匹配分析、模拟面试和简历优化。

## 2. Why This Product Should Exist

求职产品常见的问题不是“信息不够”，而是“结构不够”：

- 用户不知道自己适合什么岗位
- 招聘信息、面经、简历优化、模拟面试分散在多个平台
- 用户很难把“看过很多帖子”转化成“下一步该做什么”

这个产品的价值不是再做一个信息聚合器，而是把以下四件事打通成一个闭环：

1. 识别用户画像
2. 推荐高置信岗位线索
3. 把岗位要求翻译成能力差距
4. 通过模拟面试和简历优化帮助用户补齐差距

## 3. Who It Is For

### Primary user

- 校招 / 应届生
- 对互联网或 AI 相关岗位感兴趣
- 希望应聘 `AI 产品经理`
- 手里可能已经有简历，但不知道怎么更有针对性地投递和准备面试

### Secondary future users

- 转行到产品方向的人
- 1-3 年经验、想转 AI 产品方向的人

这些不是 Phase 1 目标用户。

## 4. MVP Definition

Phase 1 只做一个明确主线：

`上传简历 -> Agent 咨询 -> Top 5 岗位线索推荐 -> 匹配分析 -> 模拟面试 -> 简历优化`

MVP 必须是一个真实可跑通的闭环，而不是多个半成品功能拼起来的展示板。

## 5. Core Product Decisions

### 5.1 Hero role

- Phase 1 only: `AI 产品经理`

### 5.2 Company scope

- Fixed at 15 companies
- 方向为：互联网大厂 + AI 公司

公司池：

- 字节跳动
- 腾讯
- 阿里巴巴
- 美团
- 拼多多
- 百度
- 快手
- 小米
- 小红书
- 京东
- 蚂蚁集团
- 华为
- 商汤科技
- 科大讯飞
- 寒武纪

### 5.3 Job pool wording

Phase 1 前台统一使用：

- `高置信岗位线索`

禁止使用：

- `已验证真实岗位`

原因：

- 当前岗位进入推荐池依赖于 `帖子采集 + LLM 内容复核`
- 没有人工确认，也没有第三方岗位源二次核验
- 对外叙事必须诚实，否则作品集在面试中一问就穿

### 5.4 Knowledge source

小红书在 Phase 1 同时扮演两个角色：

- 岗位线索源
- 面试经验内容源

### 5.5 Recommendation logic

- Top 5 fixed output
- Rule weights + embeddings retrieval hybrid

### 5.6 Mock interview

- LangGraph persistent state
- 实时流式
- 先部门负责人，后 HR
- 共 10 轮左右
- 每轮 2-3 句反馈
- 下一轮问题必须基于用户上一轮回答、候选人画像和岗位要求动态生成

## 6. What Makes This Product 10x Better Than a Static Job Board

1. 它不是让用户自己筛，而是先理解用户
2. 它不是只给岗位，而是解释为什么这个岗位匹配
3. 它不是只给结论，而是把差距映射到模拟面试
4. 它不是只做面试，而是把面试反馈继续流向简历优化
5. 它把分散在帖子里的非结构化经验，变成可检索、可归因、可训练交互的知识库

## 7. Phase 1 Success Criteria

以下三项权重相同：

1. 推荐岗位明显比用户自己乱投更准
2. 模拟面试确实能提供有帮助的反馈
3. 简历优化建议足够具体，能直接改 bullet

## 8. MVP Features

### User-facing

1. 邮箱密码登录
2. PDF / Word 简历上传与解析
3. Agent 托管式咨询
4. Top 5 岗位线索推荐
5. 岗位匹配分析页
6. LangGraph 模拟面试
7. 简历优化建议
8. 职场广场
9. 原帖链接二维码跳转

### Internal

1. 单页轻量管理看板
2. 总帖子数
3. 公司总览
4. 岗位总览

## 9. NOT in Scope

- 多岗位扩展: Phase 1 只证明一个主岗位闭环
- 社区发帖、评论、点赞、私信: 会把产品重心从求职闭环拉偏
- 复杂视频帖处理: OCR 和图文帖已足够验证核心价值
- 招聘平台大规模聚合: 当前产品先验证从“岗位线索”到“面试训练”的闭环
- 大模型微调 / 训练底模: 当前阶段优先用 RAG 和流程编排拿结果
- 完整后台系统: 只有一个管理看板即可
- P2P 即时互动: 明确放到后续阶段

## 10. What Already Exists

- 项目级规范入口: [AGENTS.md](C:\Users\28397\Desktop\xhs面试\AGENTS.md)
- Lotus 规则与模板基线: `C:\Users\28397\Desktop\xhs面试\Lotus`
- 已完成的核心范围澄清:
  - 用户画像
  - 岗位范围
  - 公司范围
  - 广场结构
  - 岗位线索表述

当前还没有业务代码，这是好事，因为可以先把执行方案定清楚。

## 11. Product Risks

### Risk 1: 用户不信任岗位真实性

缓解方式：

- 不夸大为“真实岗位”
- 明确标注为“高置信岗位线索”
- 在详情页解释线索来源与匹配依据

### Risk 2: 广场喧宾夺主

缓解方式：

- 广场保留只读
- 所有详情页都带回主闭环 CTA
- 首页和分析页永远优先于广场

### Risk 3: 模拟面试沦为模板问答

缓解方式：

- 必须采用状态化动态追问
- 每轮问题要参考前文与画像
- 面试官角色切换必须可感知

### Risk 4: 简历优化太泛

缓解方式：

- 输出优先级固定为 bullet 改写
- 所有建议都要绑定目标岗位
- 每条建议都指向可修改的原始经历

## 12. Product Narrative for Portfolio

面试官应该一眼看懂三件事：

1. 你不是做了一个“会聊天的页面”，而是做了一个有完整业务闭环的 AI 产品
2. 你理解求职这个场景里的信息结构、行为路径和转化节点
3. 你不仅会做前端展示，还能把知识库、推荐逻辑、LangGraph 状态机和产品路径连起来

## 13. Final Product Call

这个项目 Phase 1 不追求“像大而全的平台”，而追求“像一个足够完整、足够可信、足够会引导用户的求职 Agent”。

这是正确方向。
