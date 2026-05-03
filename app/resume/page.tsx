import type { Metadata } from "next";
import ResumeAnalyzer from "@/components/resume/ResumeAnalyzer";

export const metadata: Metadata = {
  title: "AI Resume Analyzer | AmanAI Lab",
  description:
    "Upload your resume and get instant AI-powered feedback tailored to AI/ML roles. ATS score, missing keywords, section analysis. Free. No login needed.",
};

export default function ResumePage() {
  return (
    <div className="pt-16">
      <ResumeAnalyzer />
    </div>
  );
}
