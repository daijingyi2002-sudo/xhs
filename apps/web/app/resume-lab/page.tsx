import { getResumeSuggestions } from "@xhs/ai";
import { Reveal, SectionBlock } from "@xhs/ui";

export default function ResumeLabPage() {
  const suggestions = getResumeSuggestions();

  return (
    <main className="page-stack">
      <Reveal>
        <SectionBlock
          eyebrow="Resume Bullet Rewrites"
          title="先给你能直接改的句子, 再给你结构化问题清单。"
          description="这一页故意不先给完整简历重写，而是优先输出和目标岗位最相关的 bullet 改写建议。这样用户能最快落地。"
        >
          <div className="detail-panel-stack">
            {suggestions.map((suggestion) => (
              <article key={suggestion.id} className="detail-panel">
                <p className="section-eyebrow">Original</p>
                <p className="detail-copy">{suggestion.original}</p>
                <p className="section-eyebrow" style={{ marginTop: "16px" }}>
                  Rewrite
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
