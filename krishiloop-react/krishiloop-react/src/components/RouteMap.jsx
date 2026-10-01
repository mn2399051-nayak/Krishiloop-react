export default function RouteMap({ route }) {
  const total = route.points.reduce((a, p) => a + p.t, 0).toFixed(1);
  const line = [...route.points, route.depot].map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="panel" id="routes">
      <h3>Collection cluster</h3>
      <p className="sub">{route.points.length} farms, {total} t, about {route.km} km round trip</p>
      <svg viewBox="0 0 420 220" width="100%" role="img" aria-label="Suggested pickup route">
        <polyline points={line} fill="none" stroke="var(--straw)" strokeWidth="3" strokeDasharray="7 5" />
        {route.points.map((p, i) => (
          <g key={p.n}>
            <circle cx={p.x} cy={p.y} r={9} fill="var(--green)" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" style={{ fill: "#fff", fontWeight: 700 }}>{i + 1}</text>
            <text x={p.x} y={p.y + 26} textAnchor="middle">{p.n} {p.t}t</text>
          </g>
        ))}
        <rect x={route.depot.x - 9} y={route.depot.y - 9} width={18} height={18} rx={4} fill="var(--ink)" />
        <text x={route.depot.x} y={route.depot.y + 28} textAnchor="middle">{route.depot.n}</text>
      </svg>
    </div>
  );
}
