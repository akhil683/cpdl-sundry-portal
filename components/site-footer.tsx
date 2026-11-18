import { BrandBolt } from "@/components/brand-bolt";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <BrandBolt className="footer-mark" />
          <span>CPDL Sundry Portal</span>
        </div>
        <p className="footer-meta">
          Chandigarh Power Distribution Limited
        </p>
      </div>
    </footer>
  );
}
