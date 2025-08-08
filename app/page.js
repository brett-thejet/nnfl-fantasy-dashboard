import Card from '../components/Card';
import teams from '../data/teams.json';
import faab from '../data/faab.json';

export default function Home() {
  const avgPF = Math.round(teams.reduce((a,t)=>a+t.pointsFor,0)/(teams.length||1));
  const totalSpent = faab.reduce((a,f)=>a+f.spent,0);

  return (
    <>
      <h1>NNFL Fantasy Dashboard</h1>
      <Card title="League Snapshot">
        <p>Teams: {teams.length}</p>
        <p>Average Points For: {avgPF}</p>
        <p>Total FAAB Spent: ${totalSpent}</p>
      </Card>
    </>
  );
}
