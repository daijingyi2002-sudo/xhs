"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Filter, MapPin, Mic, Search, ShieldAlert, Sparkles } from "lucide-react";
import { plazaInsights, plazaJobPlaceholders } from "../lib/plaza-placeholder-content";
import { PlazaChrome } from "./plaza-chrome";

const companyOptions = ["全部公司", ...Array.from(new Set(plazaJobPlaceholders.map((job) => job.company)))];
const cityOptions = ["全部城市", ...Array.from(new Set(plazaJobPlaceholders.map((job) => job.city)))];

export function PlazaBoard() {
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("全部公司");
  const [city, setCity] = useState("全部城市");

  const filteredJobs = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return plazaJobPlaceholders.filter((job) => {
      const matchesKeyword = keyword
        ? [job.title, job.company, job.city, job.summary, ...job.tags].join(" ").toLowerCase().includes(keyword)
        : true;
      const matchesCompany = company === "全部公司" || job.company === company;
      const matchesCity = city === "全部城市" || job.city === city;

      return matchesKeyword && matchesCompany && matchesCity;
    });
  }, [city, company, query]);

  const featuredJobs = filteredJobs.slice(0, 6);
  const remainingJobs = filteredJobs.slice(6);

  return (
    <PlazaChrome>
      <section className="plaza-hero">
        <div>
          <p>Career Plaza</p>
          <h1>先用 50 个假岗位撑起广场结构，后续可整批替换。</h1>
          <span>
            当前内容明确标注为占位岗位线索，不宣称真实验证。模块保留筛选、岗位分析、模拟面试和面经回流入口，方便你之后把具体 50 个岗位直接替换进来。
          </span>
        </div>
        <div className="plaza-hero-panel" aria-label="广场数据概览">
          <strong>{plazaJobPlaceholders.length}</strong>
          <span>可替换岗位占位</span>
          <small>AI 产品经理单一 hero role</small>
        </div>
      </section>

      <section className="plaza-filter-bar" aria-label="岗位筛选">
        <label className="plaza-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索岗位、公司、城市或能力标签"
            type="search"
          />
        </label>
        <label>
          <Filter size={16} />
          <select value={company} onChange={(event) => setCompany(event.target.value)}>
            {companyOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <MapPin size={16} />
          <select value={city} onChange={(event) => setCity(event.target.value)}>
            {cityOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <div className="plaza-result-count">
          <strong>{filteredJobs.length}</strong>
          <span>条线索</span>
        </div>
      </section>

      <section className="plaza-section-block">
        <div className="plaza-section-head">
          <div>
            <p>Recommended Jobs</p>
            <h2>推荐岗位</h2>
          </div>
          <span>只读浏览 · 后续替换真实 50 岗位</span>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="plaza-empty">
            <strong>没有匹配的占位岗位</strong>
            <span>换一个关键词、公司或城市再试试。</span>
          </div>
        ) : (
          <>
            <div className="plaza-feature-grid">
              {featuredJobs.map((job) => (
                <article key={job.id} className="plaza-job-card plaza-job-card-featured">
                  <div className="plaza-card-topline">
                    <span className="plaza-company-mark">{job.company.slice(0, 2)}</span>
                    <span className="plaza-confidence">
                      <Sparkles size={14} />
                      {job.confidence}% Match
                    </span>
                  </div>
                  <div>
                    <p className="plaza-card-kicker">{job.sourceLabel}</p>
                    <h3>{job.title}</h3>
                    <span className="plaza-company-line">
                      <Building2 size={16} />
                      {job.company}
                      <i />
                      <MapPin size={16} />
                      {job.city}
                    </span>
                  </div>
                  <p>{job.summary}</p>
                  <div className="plaza-tag-row">
                    {job.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="plaza-reason-list">
                    {job.matchReasons.map((reason) => (
                      <span key={reason}>
                        <CheckCircle2 size={16} />
                        {reason}
                      </span>
                    ))}
                  </div>
                  <div className="plaza-risk">
                    <ShieldAlert size={16} />
                    <span>{job.riskReminder}</span>
                  </div>
                  <div className="plaza-card-actions">
                    <Link href={job.analysisHref} className="jobs-primary-action">
                      查看分析
                      <ArrowRight size={16} />
                    </Link>
                    <Link href={job.interviewHref} className="jobs-outline-action">
                      <Mic size={16} />
                      模拟面试
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {remainingJobs.length > 0 ? (
              <div className="plaza-compact-list" aria-label="更多岗位占位">
                {remainingJobs.map((job) => (
                  <Link key={job.id} href={job.analysisHref} className="plaza-compact-row">
                    <span>{job.company}</span>
                    <strong>{job.title}</strong>
                    <small>
                      {job.city} · {job.salaryBand} · {job.confidence}% Match
                    </small>
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="plaza-section-block">
        <div className="plaza-section-head">
          <div>
            <p>Interview Insights</p>
            <h2>面试经验内容</h2>
          </div>
          <span>角色优先组织 · 回流到主链路</span>
        </div>

        <div className="plaza-insight-list">
          {plazaInsights.map((insight) => (
            <article key={insight.id} className="plaza-insight-card">
              <div className="plaza-insight-visual">
                <span>{insight.company.slice(0, 2)}</span>
              </div>
              <div>
                <div className="plaza-tag-row">
                  <span>{insight.topic}</span>
                  <span>{insight.stage}</span>
                  <span>{insight.readTime}</span>
                </div>
                <h3>{insight.title}</h3>
                <p>{insight.summary}</p>
                <Link href={insight.href} className="jobs-secondary-action">
                  阅读并进入准备
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PlazaChrome>
  );
}
