import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { NetSummary } from "@/components/net-summary";

export const metadata: Metadata = {
  title: "Net summary",
  description:
    "Compare the amount to be charged with the amount already charged and print a net summary.",
};

export default function NetSummaryPage() {
  return (
    <div className="container page-shell net-page">
      <PageHeader
        section="Sundry billing · 03"
        title="Net / summary"
        description="Compare the amount to be charged with the amount already charged. The net amount is to be charged minus already charged, shown charge head by charge head."
        facts={[
          { label: "Net amount", value: "To be − already" },
          { label: "Output", value: "Printable PDF" },
        ]}
      />
      <NetSummary />
    </div>
  );
}
