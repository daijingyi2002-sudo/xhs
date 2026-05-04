import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, BriefcaseBusiness, FileText, FlaskConical, History, Home, MessageCircle, Plus, Users } from "lucide-react";
import { AccountMenu } from "./account-menu";
import { BrandMark } from "./brand-mark";

const navItems = [
  { href: "/", icon: Home, label: "首页 Home" },
  { href: "/jobs", icon: BriefcaseBusiness, label: "职位 Jobs" },
  { href: "/interview/demo", icon: MessageCircle, label: "模拟面试 Interview" },
  { href: "/resume-lab", icon: FlaskConical, label: "简历实验室 Resume Lab" },
  { href: "/plaza", icon: Users, label: "广场 Plaza", active: true },
  { href: "/history", icon: History, label: "历史 History" }
];

export function PlazaChrome({ children }: { children: ReactNode }) {
  return (
    <div className="jobs-shell plaza-shell">
      <header className="jobs-mobile-bar">
        <BrandMark size="sm" />
        <AccountMenu variant="compact" />
        <strong>职业催化剂 Career Catalyst</strong>
      </header>

      <aside className="jobs-sidebar">
        <div className="jobs-sidebar-header">
          <BrandMark size="lg" />
          <AccountMenu variant="jobs" />
          <div>
            <strong>职业催化剂 Career Catalyst</strong>
            <span>AI 专家导师 Expert Mentor AI</span>
          </div>
        </div>

        <nav className="jobs-nav" aria-label="Resume plaza navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`jobs-nav-item ${item.active ? "is-active" : ""}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="jobs-sidebar-footer">
          <Link href="/" className="jobs-new-consultation">
            <Plus size={18} />
            新咨询 New Consultation
          </Link>
        </div>
      </aside>

      <main className="jobs-main">
        <div className="jobs-topbar">
          <div>
            <span>Resume Plaza</span>
            <strong>简历广场 / 职场广场</strong>
          </div>
          <div className="jobs-topbar-status">
            <Bell size={18} />
            <span>高置信岗位线索 · 占位数据</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

export function PlazaDetailChrome({ children }: { children: ReactNode }) {
  return (
    <PlazaChrome>
      <div className="plaza-detail-wrap">{children}</div>
    </PlazaChrome>
  );
}
