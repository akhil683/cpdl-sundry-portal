"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calculator,
  History as HistoryIcon,
  Menu,
  Scale,
  Table2,
  X,
} from "lucide-react";
import { BrandBolt } from "@/components/brand-bolt";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  {
    href: "/to-be-charged",
    label: "To be charged",
    icon: Calculator,
  },
  {
    href: "/already-charged",
    label: "Already charged",
    icon: Table2,
  },
  {
    href: "/net-summary",
    label: "Net summary",
    icon: Scale,
  },
  {
    href: "/history",
    label: "History",
    icon: HistoryIcon,
  },
  {
    href: "/guide",
    label: "Guide",
    icon: BookOpen,
  },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
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
        </Link>

        <div className="header-right">
          <nav
            className={`main-nav${menuOpen ? " is-open" : ""}`}
            id="main-navigation"
            aria-label="Main sections"
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  className="main-nav-link"
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className="main-nav-icon"
                    size={15}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <ThemeToggle />

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X size={20} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
