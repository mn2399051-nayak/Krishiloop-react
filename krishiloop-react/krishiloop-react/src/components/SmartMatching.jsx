import { useState } from "react";
import { processors, matchFactors, weights, factorNames, score } from "../data.js";

const pct = (v) => Math.round(v * 100);

export default function SmartMatching({ lots = [], onMatch = () => {} }) {
  const [selected, setSelected] = useState("P1");
  const [chosenLot, setChosenLot] = useState("L-104");
  const [saved, setSaved] = useState(false);
  const ranked = [...processors]
    .map((p) => ({ ...p, score: score(matchFactors[p.id]) }))
    .sort((a, b) => b.score - a.score);
  const chosen = processors.find((p) => p.id === selected);
  const f = matchFactors[selected];

  return (
    <div className="grid2" id="matching">
      <div className="panel">
        <h3>Best processor matches</h3>
        <p className="sub">Select a lot to see why it was matched</p>
        <select aria-label="Choose a residue lot" value={chosenLot} onChange={(e) => setChosenLot(e.target.value)} style={{width:"100%",padding:"8px",marginBottom:10,border:"1px solid var(--line)",borderRadius:7,background:"var(--panel)",color:"var(--ink)",fontSize:11}}>
          {lots.length ? [...lots].map((lot) => <option key={lot.id} value={lot.id}>{lot.id} · {lot.farmer} · {lot.est} t</option>) : <option value="L-104">L-104 · Jasmeet Kaur · 5 t</option>}
        </select>
        <div>
          {ranked.map((p) => (
            <button
              key={p.id}
              className="match"
              aria-pressed={p.id === selected}
              onClick={() => setSelected(p.id)}
            >
              <span className="score">{pct(p.score)}</span>
              <span>
                <b>{p.name}</b>
                <br />
                <span style={{ color: "var(--muted)", fontSize: 13 }}>{p.district} &middot; needs {p.need} t</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Why this match: Lot {chosenLot} to {chosen.name}</h3>
        <p className="sub">Weighted score, weights are configurable</p>
        {Object.keys(weights).map((k) => (
          <div className="bar" key={k}>
            <span>{factorNames[k]}</span>
            <div><i style={{ width: `${pct(f[k])}%` }} /></div>
            <b>{pct(f[k])}</b>
          </div>
        ))}
        <p className="sub" style={{ marginTop: 14 }}>
          Match score {pct(score(f))} out of 100, from the weighted factors above.
        </p>
        <button className="primary" style={{fontSize:10,padding:"8px 11px"}} onClick={() => { setSaved(true); onMatch(); }}>
          {saved ? "✓ Match saved" : "Save this match"}
        </button>
      </div>
    </div>
  );
}
