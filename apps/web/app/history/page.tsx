const historyItems = [
  {
    step: "简历上传",
    title: "resume_ai_pm_v3.pdf",
    copy: "最近一次上传的简历已经被转成候选人画像，并参与后续推荐与面试准备。"
  },
  {
    step: "岗位推荐",
    title: "Top 5 已生成",
    copy: "最近一次推荐更偏内容智能、平台型和创作者工具方向。"
  },
  {
    step: "模拟面试",
    title: "10 轮完成",
    copy: "你的用户洞察和产品结构化思考表现稳定，但商业表达需要继续强化。"
  }
];

export default function HistoryPage() {
  return (
    <main className="page-stack">
      <section className="history-grid">
        {historyItems.map((item) => (
          <article key={item.step} className="journey-card">
            <span className="journey-chip">{item.step}</span>
            <h3 className="journey-title">{item.title}</h3>
            <p className="journey-copy">{item.copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
