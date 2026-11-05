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
        <p className="page-description">{description}</p>
      </div>

      {facts && facts.length > 0 ? (
        <dl className="page-facts">
          {facts.map((fact) => (
            <div className="page-fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
