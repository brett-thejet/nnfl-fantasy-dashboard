export default function Table({ columns, rows }) {
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr>{columns.map(c => <th key={c} style={{textAlign:'left',borderBottom:'1px solid #243',padding:8}}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r,i) => (
            <tr key={i}>
              {r.map((cell,j) => <td key={j} style={{borderBottom:'1px solid #1e243b',padding:8}}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
