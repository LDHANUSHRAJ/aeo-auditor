import { getReport } from "@/lib/supabase";
import ReportView from "@/components/ReportView";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SharedReportPage({ params }: Props) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="glass-card p-12 text-center max-w-md w-full">
          <div
            className="w-14 h-14 rounded-2xl grad-red flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-white text-2xl font-black">?</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Report not found</h1>
          <p className="text-gray-400 text-sm mb-6">
            This report ID doesn&apos;t exist or may have been deleted.
          </p>
          <Link href="/audit" className="btn-primary inline-flex">
            Run a new audit →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full grad-red flex items-center justify-center">
              <span className="text-white text-xs font-black">AEO</span>
            </div>
            <span className="text-sm font-bold text-gray-700">Visibility Auditor</span>
          </Link>
          <Link href="/audit" className="btn-ghost text-sm">
            Run your own audit →
          </Link>
        </div>
        <div className="glass-card p-8 md:p-10">
          <ReportView report={report} />
        </div>
      </div>
    </div>
  );
}
