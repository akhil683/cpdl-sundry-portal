interface BrandBoltProps {
  className?: string;
}

export function BrandBolt({ className }: BrandBoltProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" fill="currentColor" />
    </svg>
  );
}
