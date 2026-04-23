import { getJobLead } from "@xhs/ai";
import { notFound } from "next/navigation";
import { MockInterviewDashboard } from "../../../components/mock-interview-dashboard";

export default function InterviewDemoPage() {
  const lead = getJobLead("lead-bytedance-strategy");

  if (!lead) {
    notFound();
  }

  return <MockInterviewDashboard lead={lead} />;
}
