export default function LotsTable({ lots }) {
  return (
    <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Lot</th><th>Farmer</th><th>Village</th><th>Estimated (t)</th>
              <th>Actual (t)</th><th>Available from</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => (
              <tr key={l.id}>
                <td><b>{l.id}</b></td>
                <td>{l.farmer}</td>
                <td>{l.village}</td>
                <td>{l.est.toFixed(1)}</td>
                <td>{l.act != null ? l.act.toFixed(1) : "Pending"}</td>
                <td>{l.from}</td>
              <td><span className={`tag ${l.status.split(" ")[0]}`}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}
