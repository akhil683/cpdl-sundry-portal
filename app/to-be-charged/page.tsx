import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
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
        description="Prepare a tariff-wise estimate for an upcoming billing period. Energy slabs are prorated to the elapsed days and every charge head is itemised."
        facts={[
          { label: "Calculation", value: "Elapsed days" },
          { label: "Amounts", value: "INR (₹)" },
        ]}
      />
      <TariffCalculator />
    </div>
  );
}
