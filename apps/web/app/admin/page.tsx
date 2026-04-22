import { adminSnapshot } from "@xhs/domain";
import { MetricCard } from "@xhs/ui";

export default function AdminPage() {
  return (
    <main className="page-stack">
      <section className="admin-grid">
        <MetricCard label="总帖子数" value={`${adminSnapshot.totalPosts}`} detail="当前看板只保留 owner 真正需要的运行态信号。" />
        <MetricCard label="总岗位数" value={`${adminSnapshot.totalRoles}`} detail="Phase 1 锁定一个 hero role，先把密度做对。" />
        <MetricCard label="监控重点" value="QR / 置信度" detail="后续重点盯 source URL 完整率和岗位线索置信度。" tone="dark" />
      </section>

      <section className="dashboard-table">
        <table>
          <thead>
            <tr>
              <th>公司</th>
              <th>帖子数量</th>
            </tr>
          </thead>
          <tbody>
            {adminSnapshot.companies.map((company) => (
              <tr key={company.companyId}>
                <td>{company.companyName}</td>
                <td>{company.postCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="dashboard-table">
        <table>
          <thead>
            <tr>
              <th>岗位</th>
              <th>帖子数量</th>
            </tr>
          </thead>
          <tbody>
            {adminSnapshot.roleOverview.map((role) => (
              <tr key={role.roleName}>
                <td>{role.roleName}</td>
                <td>{role.postCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
