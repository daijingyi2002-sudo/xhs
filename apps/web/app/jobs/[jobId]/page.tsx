import { FitAnalysisBoard } from "../../../components/fit-analysis-board";

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  return <FitAnalysisBoard jobId={jobId} />;
}
