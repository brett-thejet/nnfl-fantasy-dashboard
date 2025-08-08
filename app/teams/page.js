import Card from '../../components/Card';
import Table from '../../components/Table';
import teams from '../../data/teams.json';

export default function Teams() {
  const columns = ['Logo','Team','Owner','Record','Pts For'];
  const rows = teams.map(t => [
    <img src={t.logo} alt="" width="28" height="28" style={{borderRadius:6}}/>,
    t.name, t.owner, t.record, t.pointsFor
  ]);

  return (
    <>
      <h1>Teams</h1>
      <Card>
        <Table columns={columns} rows={rows} />
      </Card>
    </>
  );
}
