export default function LoginPage() {
  return (
    <main className="page-stack">
      <section className="route-grid">
        <div className="detail-panel">
          <p className="section-eyebrow">Email + Password</p>
          <h2 className="detail-title">保留你的简历、面试记录和优化历史。</h2>
          <p className="detail-copy">登录后可以继续查看咨询记录、岗位分析、模拟面试和简历改写结果。</p>
        </div>
        <form className="consultation-studio">
          <label className="composer">
            <span>邮箱</span>
            <input type="email" placeholder="name@example.com" />
          </label>
          <label className="composer">
            <span>密码</span>
            <input type="password" placeholder="至少 8 位" />
          </label>
          <button type="submit" className="primary-button">
            登录并继续
          </button>
          <p className="helper-copy">登录后会回到你上次停留的求职流程。</p>
        </form>
      </section>
    </main>
  );
}
