import type { Metadata } from "next";
import { CircleAlert, Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CalculationHistory } from "@/components/calculation-history";

export const metadata: Metadata = {
  title: "Calculation history",
  description:
    "Review sundry estimates saved in this browser and download PDF copies for your records.",
};

export default function HistoryPage() {
  return (
    <div className="container page-shell history-page">
      <PageHeader
        section="Sundry billing · 03"
        title="Calculation history"
        description="Review estimates calculated in this browser. The newest records appear first; print or save a PDF of any calculation you need to keep."
        facts={[
          { label: "Storage", value: "This browser" },
          { label: "Retention", value: "Local only" },
        ]}
      />

      <aside className="history-warning" aria-label="Local history warning">
        <div className="history-warning-icon">
          <Download size={19} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className="history-warning-copy">
          <p className="history-warning-label">
            <CircleAlert size={12} strokeWidth={2} aria-hidden="true" />
            Local storage · not permanent
          </p>
          <h2>Download a PDF copy for your records</h2>
          <p>
            Saved calculations live only in this browser. Clearing site data,
            resetting the browser or switching devices will remove them. Use{" "}
            <strong>Print / save PDF</strong> on any calculation you need to
            keep.
          </p>
        </div>
      </aside>

      <CalculationHistory />
    </div>
  );
}
