type StatCardProps = {
  label: string;
  value: string | number;
  accent?: string;
};

export function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <article className="stat-card">
      <span className="eyebrow" style={accent ? { color: accent } : undefined}>
        {label}
      </span>
      <strong>{value}</strong>
    </article>
  );
}
