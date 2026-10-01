export default function DistrictChart({ districts }) {
  const W = 520, rowH = 54, H = districts.length * rowH + 10, max = 100, left = 86;
  const sc = (v) => ((W - left - 30) * v) / max;

  return (
    <div className="panel">
      <h3>Supply and demand by district</h3>
      <p className="sub">Tonnes of paddy straw listed vs requested by processors</p>
      <div className="legend">
        <span><s style={{ background: "var(--green)" }} />Supply</span>
        <span><s style={{ background: "var(--straw)" }} />Demand</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Supply and demand by district">
        {districts.map((d, i) => {
          const y = i * rowH + 6;
          return (
            <g key={d.name}>
              <text x="0" y={y + 22} style={{ fill: "var(--ink)", fontSize: 13 }}>{d.name}</text>
              <rect x={left} y={y} width={sc(d.supply)} height={18} rx={3} fill="var(--green)" />
              <text x={left + sc(d.supply) + 6} y={y + 13}>{d.supply} t</text>
              <rect x={left} y={y + 24} width={Math.max(sc(d.demand), 2)} height={18} rx={3} fill="var(--straw)" />
              <text x={left + sc(d.demand) + 6} y={y + 37}>{d.demand ? `${d.demand} t` : "no demand yet"}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
