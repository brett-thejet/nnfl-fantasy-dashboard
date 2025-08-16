import { fetchTeams } from "@/src/contentfulClient";

export default async function TeamsPage() {
  const teams = await fetchTeams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">NNFL Teams</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex flex-col items-center border rounded-lg p-4 shadow-sm"
          >
            {team.logoUrl ? (
              <img
                src={`${team.logoUrl}?w=96&h=96&fit=thumb&fm=webp&q=80`}
                alt={team.name}
                className="w-24 h-24 object-contain mb-2"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 mb-2 flex items-center justify-center">
                <span className="text-sm text-gray-500">No Logo</span>
              </div>
            )}
            <span className="font-medium">{team.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

