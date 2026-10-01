export default function LoopStages({ stages }) {
  const max = stages[0].tonnes;
  return (
    <section className="loop" id="loop" aria-label="Residue loop">
      {stages.map((s, i) => {
        const big = s.tonnes != null ? `${s.tonnes} t` : s.value;
        const w = s.tonnes != null ? Math.round((s.tonnes / max) * 100) : 100;
        return (
          <div className={`stage ${i === stages.length - 1 ? "last" : ""}`} key={s.label}>
            <b>{big}</b>
            <span>{s.label}</span>
            <i style={{ width: `${w}%` }} />
          </div>
        );
      })}
    </section>
  );
}
