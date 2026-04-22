import Link from "next/link";
import { getJobLead } from "@xhs/ai";
import { InterviewStudio } from "../../../components/interview-studio";
import { notFound } from "next/navigation";

export default async function InterviewPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const lead = getJobLead(jobId);

  if (!lead) notFound();

  return (
    <main className="page-stack">
      <div className="status-bar">
        <p className="helper-copy">当前流程固定为部门负责人 6 轮 + HR 4 轮，但每一轮问题都根据上下文和上一轮回答继续生成。</p>
        <Link href="/resume-lab" className="ghost-button">
          直接看简历优化
        </Link>
      </div>
      <InterviewStudio lead={lead} />
    </main>
  );
}
