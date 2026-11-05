import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container page-shell">
      <div className="card not-found-card">
        <p className="eyebrow">Error · 404</p>
        <h1 className="page-title">Page not found</h1>
        <p className="page-description">
          The page you requested is not part of the CPDL sundry billing
          workspace.
        </p>
        <div className="not-found-rule" />
        <Link className="btn btn-primary" href="/to-be-charged">
          <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
          Return to the calculator
        </Link>
      </div>
    </div>
  );
}
