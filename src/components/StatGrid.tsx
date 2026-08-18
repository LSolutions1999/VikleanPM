type StatGridItem = {
  label: string;
  value: string;
  hint: string;
};

type StatGridProps = {
  items: StatGridItem[];
};

export function StatGrid({ items }: StatGridProps) {
  return (
    <div className="stat-grid">
      {items.map((item) => (
        <article key={item.label} className="stat-card">
          <p>{item.label}</p>
          <strong>{item.value}</strong>
          <span>{item.hint}</span>
        </article>
      ))}
    </div>
  );
}
