import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ConsumerDetailsCard } from "@/components/consumer-details";
import { TariffCalculator } from "@/components/tariff-calculator";

export const metadata: Metadata = {
  title: "To be charged",
  description:
    "Estimate tariff-wise electricity charges for an upcoming billing period.",
};

export default function ToBeChargedPage() {
  return (
    <div className="container page-shell">
      <PageHeader
        section="Sundry billing · 01"
        title="To be charged"
        description="Prepare a tariff-wise estimate for an upcoming billing period. Consumption is split across tariff periods and prorated to the elapsed days, and every charge head is itemised."
        facts={[
          { label: "Calculation", value: "Elapsed days" },
          { label: "Amounts", value: "INR (₹)" },
        ]}
      />
      <div className="workspace-stack">
        <ConsumerDetailsCard />
        <TariffCalculator />
      </div>
    </div>
  );
}
