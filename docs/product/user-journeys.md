# User Journeys

## 1. Primary Journey

```text
[Landing]
   |
   v
[Upload Resume?] -- no --> [Start Agent Chat]
   | yes
   v
[Resume Parsed]
   |
   v
[Agent Consultation]
   |
   v
[Top 5 Role Leads]
   |
   v
[Role Fit Analysis]
   |
   v
[Mock Interview]
   |
   v
[Resume Optimization]
   |
   v
[History / Next Action]
```

## 2. Persona

### Persona A: 校招 AI 产品经理候选人

- 刚毕业或即将毕业
- 有项目经历，但不知道如何包装成“AI 产品经理”叙事
- 会看面经帖，但不会系统整理
- 不确定自己的背景是否足以投大厂或 AI 公司

## 3. Journey 1: First-Time User

### Goal

让用户在首次进入产品时，迅速感受到“这个 Agent 懂我的情况，也知道我下一步该做什么”。

### Steps

1. 进入首页
2. 看到 Agent 对话入口和简历上传入口
3. 上传简历或直接开始咨询
4. Agent 逐步问询背景、目标城市、项目、AI 理解、产品能力
5. 系统形成候选人画像
6. 输出 Top 5 岗位线索推荐

### User win condition

- 用户觉得推荐不是乱猜
- 用户知道接下来该点哪一个岗位进入深入准备

## 4. Journey 2: Role Exploration

### Goal

帮助用户判断“这个岗位为什么适合我，以及我差在哪里”。

### Steps

1. 用户点击某个岗位卡片
2. 进入岗位分析页
3. 查看：
   - 优势
   - 短板
   - JD 差距地图
   - 推荐依据
4. 点击进入模拟面试

### User win condition

- 用户从模糊的“感觉这个岗位不错”进入可执行的“我应该怎么准备”

## 5. Journey 3: Mock Interview

### Goal

用最接近真实的结构化面试体验，让用户暴露问题并获得成长。

### Steps

1. 进入模拟面试
2. 加载候选人画像、岗位上下文和相关面经知识
3. 部门负责人开始发问
4. 每轮系统动态生成下一问
5. 每轮给 2-3 句即时反馈
6. 后半段切换 HR 视角
7. 最终输出总结
8. 跳转到简历优化建议

### User win condition

- 用户感觉被真实追问
- 用户知道自己答得好的点和需要加强的点

## 6. Journey 4: Resume Optimization

### Goal

把分析和面试反馈转成对简历的具体可执行修改。

### Steps

1. 系统根据岗位要求与面试表现提炼问题
2. 输出目标岗位导向的 bullet 改写建议
3. 提供结构化问题清单
4. 允许用户回到面试或分析继续迭代

### User win condition

- 用户可以直接拿建议去改简历，而不是看一堆空话

## 7. Journey 5: Career Plaza

### Goal

在不打断主闭环的前提下，帮助用户发现更多岗位和面试内容。

### Steps

1. 进入广场
2. 看到两个栏目：
   - 推荐岗位
   - 面试经验内容
3. 按岗位筛选浏览
4. 进入内容详情
5. 扫码跳原帖或返回主链路

### User win condition

- 用户感受到内容发现的价值
- 但不会迷失在内容流里

## 8. Edge Cases

### Case 1: 用户没有简历

- 允许直接开始 Agent 咨询
- 用对话先构建基础画像

### Case 2: 简历解析失败

- 告知失败原因
- 提供重新上传
- 不阻塞后续咨询

### Case 3: 用户方向不清晰

- Agent 继续问询，不要求先选定岗位
- 推荐时解释为什么先从 AI 产品经理切入

### Case 4: 推荐证据不足

- 显示低置信提示
- 减少过度确定性的语言

### Case 5: 模拟面试答非所问

- 当轮反馈指出偏题
- 下一轮缩短问题范围，重新拉回主题

## 9. State Transitions

```text
anonymous
  -> registered
  -> resume_uploaded
  -> profile_inferred
  -> recommendations_ready
  -> analysis_opened
  -> interview_started
  -> interview_completed
  -> resume_optimized
```

## 10. UX Rules

- 首页必须先让用户动起来，而不是先解释产品
- 每一屏只服务一个主动作
- 广场永远不能比主链路更显眼
- 模拟面试的反馈不能太长，否则会破坏对话节奏
- 所有结果页都要给用户明确下一步
