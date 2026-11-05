import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ChargedLedger } from "@/components/charged-ledger";

export const metadata: Metadata = {
  title: "Already charged",
  description:
    "Record charges that have already been applied and reconcile each charge head.",
};

export default function AlreadyChargedPage() {
  return (
    <div className="container page-shell">
      <PageHeader
        section="Sundry billing · 02"
        title="Already charged"
        description="Record charges that have already been applied. Enter each billed period and charge head; the sheet reconciles every row total into one grand total."
        facts={[
          { label: "Entry sheet", value: "Live totals" },
          { label: "Amounts", value: "INR (₹)" },
        ]}
      />
      <ChargedLedger />
    </div>
  );
}
