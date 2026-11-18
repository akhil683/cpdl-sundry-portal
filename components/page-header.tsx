interface PageFact {
  label: string;
  value: string;
}

interface PageHeaderProps {
  section: string;
  title: string;
  description: string;
  facts?: PageFact[];
}

export function PageHeader({
  section,
  title,
  description,
  facts,
}: PageHeaderProps) {
  return (
    <header className="page-intro">
      <div className="page-intro-main">
        <p className="eyebrow">{section}</p>
        <h1 className="page-title">{title}</h1>
      </div>
    </header>
  );
}
