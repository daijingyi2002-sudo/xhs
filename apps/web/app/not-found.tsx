import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-stack">
      <div className="detail-panel">
        <p className="section-eyebrow">404</p>
        <h2 className="detail-title">这个页面还没进入当前闭环。</h2>
        <p className="detail-copy">先回到首页或岗位线索页，继续主流程。</p>
        <div className="pill-row">
          <Link href="/" className="primary-button">
            回首页
          </Link>
          <Link href="/jobs" className="ghost-button">
            去岗位线索页
          </Link>
        </div>
      </div>
    </main>
  );
}
