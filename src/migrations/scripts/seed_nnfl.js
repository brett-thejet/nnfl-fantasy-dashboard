// scripts/seed_nnfl.js
// Seeds: managers, tiebreakers, scoring profile, league, division,
// 12 teams (from your list), 2025 season, Week 1, 6 matchups, and final scores.
//
// Usage (from project root):
//   CONTENTFUL_SPACE_ID=xxxxxx CONTENTFUL_ENV_ID=master CONTENTFUL_MANAGEMENT_TOKEN=CFPAT_xxx \
//   node scripts/seed_nnfl.js

const contentful = require('contentful-management');
const slugify = require('slugify');

// ---------- CONFIG ----------
const TEAM_NAMES = [
  'Totmouse',
  'Sick Duckers',
  "Curt's Dirt McGurts 🚮",
  'juggerNOTT',
  "Bry's Guys",
  'JustINVINCIBLE',
  'Biff’s Buffs',
  'MacDaddys',
  'Natural Lightning',
  'FGBs',
  'Hogierolls',
  'War Cows'
];

const LEAGUE_NAME = 'NNFL';
const SEASON_YEAR = 2025;
const DIVISION_NAME = 'Division A';

// ---------- HELPERS ----------
const env = {
  spaceId: process.env.CONTENTFUL_SPACE_ID,
  envId: process.env.CONTENTFUL_ENV_ID || 'master',
  token: process.env.CONTENTFUL_MANAGEMENT_TOKEN
};

function reqEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return process.env[name];
}

function makeSlug(s) {
  // Remove emoji/specials for slugs & normalize quotes
  return slugify(s, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@，、’“”#%^&?<>`´•–—🚮]/g
  });
}

function randHex() {
  // pastel-ish color
  const r = () => (128 + Math.floor(Math.random() * 127)).toString(16).padStart(2, '0');
  return `#${r()}${r()}${r()}`;
}

async function getClientEnv() {
  reqEnv('CONTENTFUL_SPACE_ID');
  reqEnv('CONTENTFUL_MANAGEMENT_TOKEN');

  const client = contentful.createClient({ accessToken: env.token });
  const space = await client.getSpace(env.spaceId);
  const theEnv = await space.getEnvironment(env.envId);
  return theEnv;
}

async function getBySlug(theEnv, typeId, slug) {
  const res = await theEnv.getEntries({
    content_type: typeId,
    'fields.slug': slug,
    limit: 1
  });
  return res.items[0];
}

async function getOne(theEnv, typeId, query = {}) {
  const res = await theEnv.getEntries({ content_type: typeId, limit: 1, ...query });
  return res.items[0];
}

async function createOrUpdateBySlug(theEnv, typeId, slug, fields) {
  const existing = await getBySlug(theEnv, typeId, slug);
  if (existing) {
    // update minimal fields that might change
    Object.keys(fields).forEach((k) => {
      existing.fields[k] = fields[k];
    });
    const updated = await existing.update();
    if (!updated.isPublished()) await updated.publish();
    return updated;
  }

  const entry = await theEnv.createEntry(typeId, { fields });
  const published = await entry.publish();
  return published;
}

async function createAndPublish(theEnv, typeId, fields) {
  const entry = await theEnv.createEntry(typeId, { fields });
  return entry.publish();
}

function l10n(value) {
  // convenience wrapper for default locale spaces
  return { 'en-US': value };
}

// ---------- MAIN ----------
(async () => {
  try {
    const envApi = await getClientEnv();
    console.log(`Connected to space=${env.spaceId}, env=${env.envId}`);

    // 1) Create Tiebreaker Rules
    const tiebreakers = [
      { label: 'Head-to-Head', code: 'HEAD_TO_HEAD', order: 1 },
      { label: 'Points For', code: 'PF', order: 2 },
      { label: 'Points Against', code: 'PA', order: 3 },
      { label: 'Division Record', code: 'DIV_REC', order: 4 }
    ];

    const tiebreakerEntries = [];
    for (const t of tiebreakers) {
      const existing = await envApi.getEntries({
        content_type: 'tiebreakerRule',
        'fields.code': t.code,
        limit: 1
      });
      let e = existing.items[0];
      if (!e) {
        e = await createAndPublish(envApi, 'tiebreakerRule', {
          label: l10n(t.label),
          code: l10n(t.code),
          order: l10n(t.order),
          description: l10n('')
        });
        console.log(`Created Tiebreaker: ${t.code}`);
      }
      tiebreakerEntries.push(e);
    }

    // 2) Scoring Profile
    const scoringSlug = makeSlug('PPR-Standard');
    const scoringProfile = await createOrUpdateBySlug(envApi, 'scoringProfile', scoringSlug, {
      name: l10n('PPR Standard'),
      slug: l10n(scoringSlug),
      baseJson: l10n({
        reception: 1,
        passingYardsPerPoint: 25,
        passingTD: 4,
        interception: -2,
        rushingYardsPerPoint: 10,
        rushingTD: 6,
        receivingYardsPerPoint: 10,
        receivingTD: 6,
        fumbleLost: -2
      }),
      bonusesJson: l10n({
        rushRec100: 3,
        pass300: 3,
        longTD: 1
      }),
      tiebreakers: l10n(
        tiebreakerEntries.map((e) => ({
          sys: { type: 'Link', linkType: 'Entry', id: e.sys.id }
        }))
      )
    });
    console.log(`Scoring Profile ready: ${scoringProfile.fields.name['en-US']}`);

    // 3) Create Managers for each team name
    const managerEntries = [];
    for (const name of TEAM_NAMES) {
      const disp = name; // simple manager display same as team name (you can customize)
      const handle = makeSlug(name);
      const got = await envApi.getEntries({
        content_type: 'manager',
        'fields.handle': handle,
        limit: 1
      });
      let m = got.items[0];
      if (!m) {
        m = await createAndPublish(envApi, 'manager', {
          displayName: l10n(disp),
          email: l10n(''), // optional
          handle: l10n(handle),
          bio: l10n({ nodeType: 'document', data: {}, content: [] })
        });
        console.log(`Created Manager: ${disp}`);
      } else if (!m.isPublished()) {
        m = await m.publish();
      }
      managerEntries.push(m);
    }

    // 4) Create League (commissioner = first manager)
    const leagueSlug = makeSlug(LEAGUE_NAME);
    const league = await createOrUpdateBySlug(envApi, 'league', leagueSlug, {
      name: l10n(LEAGUE_NAME),
      slug: l10n(leagueSlug),
      seasonYear: l10n(SEASON_YEAR),
      avatar: l10n(undefined),
      scoringProfile: l10n({
        sys: { type: 'Link', linkType: 'Entry', id: scoringProfile.sys.id }
      }),
      commissioner: l10n({
        sys: { type: 'Link', linkType: 'Entry', id: managerEntries[0].sys.id }
      }),
      divisions: l10n([]),
      teams: l10n([]),
      settingsJson: l10n({})
    });
    console.log(`League ready: ${league.fields.name['en-US']}`);

    // 5) Division
    const divisionSlug = makeSlug(DIVISION_NAME);
    const division = await createOrUpdateBySlug(envApi, 'division', divisionSlug, {
      name: l10n(DIVISION_NAME),
      slug: l10n(divisionSlug),
      league: l10n({ sys: { type: 'Link', linkType: 'Entry', id: league.sys.id } }),
      order: l10n(1)
    });
    console.log(`Division ready: ${division.fields.name['en-US']}`);

    // 6) Teams (link each to league, division, and a manager)
    const teamEntries = [];
    for (let i = 0; i < TEAM_NAMES.length; i++) {
      const teamName = TEAM_NAMES[i];
      const slug = makeSlug(teamName);
      const mgr = managerEntries[i];

      const t = await createOrUpdateBySlug(envApi, 'team', slug, {
        name: l10n(teamName),
        slug: l10n(slug),
        league: l10n({ sys: { type: 'Link', linkType: 'Entry', id: league.sys.id } }),
        division: l10n({ sys: { type: 'Link', linkType: 'Entry', id: division.sys.id } }),
        primaryColor: l10n(randHex()),
        secondaryColor: l10n(randHex()),
        logo: l10n(undefined),
        manager: l10n({ sys: { type: 'Link', linkType: 'Entry', id: mgr.sys.id } }),
        foundedYear: l10n(SEASON_YEAR)
      });
      teamEntries.push(t);
      console.log(`Team ready: ${teamName}`);
    }

    // 7) Season (2025)
    const season = await createAndPublish(envApi, 'season', {
      league: l10n({ sys: { type: 'Link', linkType: 'Entry', id: league.sys.id } }),
      year: l10n(SEASON_YEAR),
      startDate: l10n(`${SEASON_YEAR}-09-01T00:00:00Z`),
      endDate: l10n(`${SEASON_YEAR}-12-31T00:00:00Z`),
      regularSeasonWeeks: l10n(14),
      playoffWeeks: l10n(3)
    });
    console.log(`Season ${SEASON_YEAR} created.`);

    // 8) Week 1
    const week1 = await createAndPublish(envApi, 'week', {
      season: l10n({ sys: { type: 'Link', linkType: 'Entry', id: season.sys.id } }),
      number: l10n(1),
      label: l10n('Week 1'),
      start: l10n(`${SEASON_YEAR}-09-05T00:00:00Z`),
      end: l10n(`${SEASON_YEAR}-09-10T00:00:00Z`),
      isPlayoffs: l10n(false)
    });
    console.log('Week 1 created.');

    // 9) Matchups (pair teams in order: 0-1, 2-3, ... 10-11)
    const matchupEntries = [];
    for (let i = 0; i < teamEntries.length; i += 2) {
      const homeTeam = teamEntries[i];
      const awayTeam = teamEntries[i + 1];

      const matchup = await createAndPublish(envApi, 'matchup', {
        season: l10n({ sys: { type: 'Link', linkType: 'Entry', id: season.sys.id } }),
        week: l10n({ sys: { type: 'Link', linkType: 'Entry', id: week1.sys.id } }),
        homeTeam: l10n({ sys: { type: 'Link', linkType: 'Entry', id: homeTeam.sys.id } }),
        awayTeam: l10n({ sys: { type: 'Link', linkType: 'Entry', id: awayTeam.sys.id } }),
        status: l10n('Final'),
        lockTime: l10n(`${SEASON_YEAR}-09-07T17:00:00Z`),
        homeProjected: l10n(110 + Math.random() * 20),
        awayProjected: l10n(110 + Math.random() * 20)
      });
      matchupEntries.push(matchup);
      console.log(
        `Matchup: ${homeTeam.fields.name['en-US']} vs ${awayTeam.fields.name['en-US']}`
      );

      // 10) Game Result (final, random-ish scores)
      const homeScore = Math.round((95 + Math.random() * 50) * 100) / 100;
      const awayScore = Math.round((95 + Math.random() * 50) * 100) / 100;

      await createAndPublish(envApi, 'gameResult', {
        matchup: l10n({ sys: { type: 'Link', linkType: 'Entry', id: matchup.sys.id } }),
        homeScore: l10n(homeScore),
        awayScore: l10n(awayScore),
        homeRoster: l10n([]),
        awayRoster: l10n([]),
        playerStatLines: l10n([]),
        isFinal: l10n(true),
        notes: l10n({ nodeType: 'document', data: {}, content: [] })
      });
      console.log(
        `Final: ${homeTeam.fields.name['en-US']} ${homeScore} — ${awayTeam.fields.name['en-US']} ${awayScore}`
      );
    }

    // 11) Standings Snapshot (simple ranks by random PF to demo)
    const rows = teamEntries.map((t) => ({
      teamId: t.sys.id,
      wins: 0,
      losses: 0,
      ties: 0,
      pf: Math.round((800 + Math.random() * 200) * 100) / 100,
      pa: Math.round((780 + Math.random() * 220) * 100) / 100,
      streak: '—',
      rank: 0,
      divisionRank: 0
    }));
    // rank by pf
    rows.sort((a, b) => b.pf - a.pf);
    rows.forEach((r, i) => (r.rank = i + 1));

    await createAndPublish(envApi, 'standingsSnapshot', {
      league: l10n({ sys: { type: 'Link', linkType: 'Entry', id: league.sys.id } }),
      week: l10n({ sys: { type: 'Link', linkType: 'Entry', id: week1.sys.id } }),
      rows: l10n(rows),
      generatedAt: l10n(new Date().toISOString())
    });
    console.log('Standings Snapshot created.');

    console.log('\n✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
