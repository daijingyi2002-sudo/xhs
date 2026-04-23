import { getResumeSuggestions } from "@xhs/ai";
import { Reveal, SectionBlock } from "@xhs/ui";

export default function ResumeLabPage() {
  const suggestions = getResumeSuggestions();

  return (
    <main className="page-stack">
      <Reveal>
        <SectionBlock
          eyebrow="简历改写"
          title="先改最影响投递结果的表达。"
          description="优先看和目标岗位最相关的 bullet 改写建议，再补结构化问题清单。"
        >
          <div className="detail-panel-stack">
            {suggestions.map((suggestion) => (
              <article key={suggestion.id} className="detail-panel">
                <p className="section-eyebrow">原句</p>
                <p className="detail-copy">{suggestion.original}</p>
                <p className="section-eyebrow" style={{ marginTop: "16px" }}>
                  改写建议
                </p>
                <p className="detail-copy">{suggestion.rewritten}</p>
                <small className="plaza-small">{suggestion.reason}</small>
              </article>
            ))}
          </div>
        </SectionBlock>
      </Reveal>
    </main>
  );
}
