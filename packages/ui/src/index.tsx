"use client";

import { motion } from "framer-motion";
import { ArrowRight, Gauge, Sparkles } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";

export function cx(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function AppFrame({ children }: PropsWithChildren) {
  return (
    <div className="app-frame">
      <div className="app-grid" />
      {children}
    </div>
  );
}

export function SiteHeader({ actions }: { actions?: ReactNode }) {
  return (
    <header className="site-header">
      <div>
        <p className="site-kicker">AI Job Search Console</p>
        <h1 className="site-wordmark">求职 Agent</h1>
      </div>
      <div className="site-header-actions">{actions}</div>
    </header>
  );
}

export function SectionBlock({
  eyebrow,
  title,
  description,
  children
}: PropsWithChildren<{ eyebrow: string; title: string; description?: string }>) {
  return (
    <section className="section-block">
      <div className="section-copy">
        <p className="section-eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        {description ? <p className="section-description">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "warm"
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "warm" | "dark";
}) {
  return (
    <div className={cx("metric-card", tone === "dark" && "metric-card-dark")}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <p className="metric-detail">{detail}</p>
    </div>
  );
}

export function LeadCard({
  company,
  title,
  score,
  summary,
  reasons,
  riskReminder,
  href
}: {
  company: string;
  title: string;
  score: number;
  summary: string;
  reasons: string[];
  riskReminder: string;
  href: string;
}) {
  return (
    <a className="lead-card" href={href}>
      <div className="lead-card-topline">
        <span className="lead-company">{company}</span>
        <span className="lead-score">
          <Gauge size={14} />
          {score}
        </span>
      </div>
      <h3 className="lead-title">{title}</h3>
      <p className="lead-summary">{summary}</p>
      <ul className="lead-reasons">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="lead-risk">风险提示: {riskReminder}</p>
      <span className="lead-action">
        进入分析
        <ArrowRight size={16} />
      </span>
    </a>
  );
}

export function ConfidenceBadge({ label, score }: { label: string; score?: number }) {
  return (
    <div className="confidence-badge">
      <Sparkles size={14} />
      <span>{label}</span>
      {typeof score === "number" ? <strong>{score}</strong> : null}
    </div>
  );
}

export function HeroPanel({ children }: PropsWithChildren) {
  return <div className="hero-panel">{children}</div>;
}

export function RouteRail({ items }: { items: string[] }) {
  return (
    <ol className="route-rail">
      {items.map((item, index) => (
        <li key={item}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <p>{item}</p>
        </li>
      ))}
    </ol>
  );
}

export function Reveal({ children, delay = 0 }: PropsWithChildren<{ delay?: number }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
