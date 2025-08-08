import Card from '../../components/Card';
import Table from '../../components/Table';
import faab from '../../data/faab.json';

export default function FAAB() {
  const columns = ['Team','Budget','Spent','Remaining','Moves'];
  const rows = faab.map(f => [f.team, `$${f.budget}`, `$${f.spent}`, `$${f.budget - f.spent}`, f.moves]);

  return (
    <>
      <h1>FAAB Tracker</h1>
      <Card>
        <Table columns={columns} rows={rows} />
      </Card>
    </>
  );
}
