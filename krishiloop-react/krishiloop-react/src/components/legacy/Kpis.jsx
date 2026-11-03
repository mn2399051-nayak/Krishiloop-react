export default function Kpis({ kpis }) {
  return (
    <section className="kpis">
      {kpis.map((k) => (
        <div className="panel kpi" key={k.label}>
          <span>{k.label}</span>
          <b>{k.value}</b>
          <em>{k.note}</em>
        </div>
      ))}
    </section>
  );
}
