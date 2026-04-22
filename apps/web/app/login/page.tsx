export default function LoginPage() {
  return (
    <main className="page-stack">
      <section className="route-grid">
        <div className="detail-panel">
          <p className="section-eyebrow">Email + Password</p>
          <h2 className="detail-title">保留你的简历、面试记录和优化历史。</h2>
          <p className="detail-copy">
            Phase 1 登录只做最小闭环，目标不是做一套大而全的账户系统，而是让用户的准备过程能被连续保存下来。
          </p>
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
          <p className="helper-copy">当前为演示骨架，后续将接入 Supabase Auth。</p>
        </form>
      </section>
    </main>
  );
}
