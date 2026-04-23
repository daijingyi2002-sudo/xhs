"use client";

import { useEffect, useMemo, useState } from "react";
import { getInterviewSummary, getInterviewTurns, evaluateAnswer, getNextPhase } from "@xhs/ai/interview";
import type { JobLead } from "@xhs/domain";

export function InterviewStudio({ lead }: { lead: JobLead }) {
  const turns = useMemo(() => getInterviewTurns(), []);
  const [turnIndex, setTurnIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<Array<{ answer: string; feedback: string }>>([]);
  const [streamedQuestion, setStreamedQuestion] = useState("");

  const turn = turns[turnIndex];
  const phase = getNextPhase(turnIndex);
  const finished = !turn;

  useEffect(() => {
    if (!turn) return;

    setStreamedQuestion("");
    let cursor = 0;
    const timer = window.setInterval(() => {
      cursor += 1;
      setStreamedQuestion(turn.question.slice(0, cursor));
      if (cursor >= turn.question.length) {
        window.clearInterval(timer);
      }
    }, 20);

    return () => window.clearInterval(timer);
  }, [turn]);

  function submitAnswer() {
    if (!turn || !draft.trim()) return;

    const feedback = evaluateAnswer(draft, turn);
    setAnswers((prev) => [...prev, { answer: draft, feedback }]);
    setDraft("");
    setTurnIndex((prev) => prev + 1);
  }

  const summary = finished ? getInterviewSummary() : null;

  return (
    <div className="interview-studio">
      <div className="interview-header">
        <div>
          <p className="section-eyebrow">Streaming Mock Interview</p>
          <h3>{lead.title}</h3>
        </div>
        <div className="interview-meta">
          <span>{phase === "manager" ? "部门负责人阶段" : finished ? "总结阶段" : "HR 阶段"}</span>
          <strong>{finished ? "完成" : `${String(turnIndex + 1).padStart(2, "0")} / 10`}</strong>
        </div>
      </div>

      {!finished ? (
        <>
          <div className="question-card">
            <span>当前问题</span>
            <p>{streamedQuestion}</p>
            <small>追问重点: {turn.coachingFocus}</small>
          </div>

          <div className="interview-grid">
            <div className="answer-panel">
              <label htmlFor="answer-box">你的回答</label>
              <textarea
                id="answer-box"
                rows={7}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="这里输入你的回答。下一轮问题会根据你的本轮内容继续生成。"
              />
              <button type="button" className="primary-button" onClick={submitAnswer}>
                提交本轮回答
              </button>
            </div>

            <div className="feedback-panel">
              <p className="section-eyebrow">回答记录</p>
              {answers.length === 0 ? (
                <p className="empty-copy">还没有上一轮反馈。先开始答第 1 轮。</p>
              ) : (
                answers.map((item, index) => (
                  <article key={`${item.answer}-${index}`} className="turn-log">
                    <strong>Round {index + 1}</strong>
                    <p>{item.answer}</p>
                    <small>{item.feedback}</small>
                  </article>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="summary-board">
          <div className="summary-card">
            <p className="section-eyebrow">结果总结</p>
            <h4>{summary?.overallTakeaway}</h4>
          </div>
          <div className="summary-grid">
            {summary?.scoreByDimension.map((dimension) => (
              <article key={dimension.dimension} className="metric-card">
                <span className="metric-label">{dimension.dimension}</span>
                <strong className="metric-value">{dimension.score}/10</strong>
                <p className="metric-detail">{dimension.note}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
