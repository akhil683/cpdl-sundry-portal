"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  History as HistoryIcon,
  IndianRupee,
  Table2,
} from "lucide-react";
import { BrandBolt } from "@/components/brand-bolt";

const tabs = [
  {
    href: "/to-be-charged",
    index: "01",
    label: "To be charged",
    icon: Calculator,
  },
  {
    href: "/already-charged",
    index: "02",
    label: "Already charged",
    icon: Table2,
  },
  {
    href: "/history",
    index: "03",
    label: "History",
    icon: HistoryIcon,
  },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link
            className="brand"
            href="/to-be-charged"
            aria-label="CPDL Sundry Billing Portal — home"
          >
            <span className="brand-mark">
              <BrandBolt className="brand-bolt" />
            </span>
            <span className="brand-text">
              <span className="brand-name">CPDL</span>
              <span className="brand-sub">
                Chandigarh Power Distribution Limited
              </span>
            </span>
            <span className="brand-rule" aria-hidden="true" />
            <span className="brand-product">Sundry billing portal</span>
          </Link>

          <div className="header-meta">
            <span className="header-meta-label">Tariff schedule</span>
            <span className="header-meta-value">2026–27</span>
          </div>
        </div>
      </header>

      <nav className="primary-nav" aria-label="Billing sections">
        <div className="container nav-inner">
          <div className="nav-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;

              return (
                <Link
                  key={tab.href}
                  className="nav-tab"
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="nav-tab-index">{tab.index}</span>
                  <Icon
                    className="nav-tab-icon"
                    size={15}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="nav-context">
            <IndianRupee size={13} strokeWidth={1.8} aria-hidden="true" />
            <span>All amounts in INR</span>
          </div>
        </div>
      </nav>
    </>
  );
}
