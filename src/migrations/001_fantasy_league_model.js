// migrations/001_fantasy_league_model.js
// Usage: contentful space migration migrations/001_fantasy_league_model.js --space-id <SPACE_ID> --environment-id <ENV_ID> --management-token <CMA_TOKEN>

module.exports = function (migration) {
    // Helper: basic link validators
    const linkTo = (typeIds) => [{ linkContentType: typeIds }];
    const urlValidation = [
      {
        regexp: {
          pattern:
            '^(https?:\\/\\/)?([\\w.-]+)\\.([a-z\\.]{2,6})([\\/\\w .-]*)*\\/?(\\?.*)?$',
          flags: null
        },
        message: 'Must be a valid URL'
      }
    ];
    const hexColorValidation = [
      {
        regexp: { pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', flags: null },
        message: 'Enter a hex color like #AABBCC'
      }
    ];
  
    // ENUMS
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX'];
    const rosterSlots = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST', 'BN', 'IR'];
    const matchupStatuses = ['Scheduled', 'In-Progress', 'Final'];
    const playerStatuses = ['Active', 'Out', 'IR', 'Questionable', 'Bye'];
    const transactionTypes = ['Waiver', 'FAAB', 'Trade', 'Add', 'Drop'];
    const injuryDesignations = ['Q', 'DTD', 'OUT', 'IR', 'NA', 'None'];
    const channels = ['Email', 'Push', 'SMS', 'Webhook'];
  
    // --------------- A) CORE LEAGUE & ROSTER ---------------
  
    // Manager (User)
    const manager = migration
      .createContentType('manager')
      .name('Manager')
      .description('Human behind a team')
      .displayField('displayName');
  
    manager.createField('displayName').name('Display Name').type('Symbol').required(true);
    manager.createField('email').name('Email').type('Symbol').validations([{ unique: true }]);
    manager.createField('handle').name('Handle').type('Symbol').validations([{ unique: true }]);
    manager.createField('avatar').name('Avatar').type('Link').linkType('Asset');
    manager.createField('bio').name('Bio').type('RichText');
  
    // League
    const league = migration
      .createContentType('league')
      .name('League')
      .description('Top-level league container for a season')
      .displayField('name');
  
    league.createField('name').name('Name').type('Symbol').required(true);
    league.createField('slug').name('Slug').type('Symbol').required(true).validations([{ unique: true }]);
    league.createField('seasonYear').name('Season Year').type('Integer').required(true);
    league.createField('avatar').name('Avatar').type('Link').linkType('Asset');
    league
      .createField('scoringProfile')
      .name('Scoring Profile')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['scoringProfile']))
      .required(true);
    league
      .createField('commissioner')
      .name('Commissioner')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['manager']))
      .required(true);
    league
      .createField('divisions')
      .name('Divisions')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['division']) });
    league
      .createField('teams')
      .name('Teams')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['team']) });
    league.createField('settingsJson').name('Settings JSON').type('Object');
  
    // Division
    const division = migration
      .createContentType('division')
      .name('Division')
      .description('Organize teams for standings/tiebreakers')
      .displayField('name');
  
    division.createField('name').name('Name').type('Symbol').required(true);
    division.createField('slug').name('Slug').type('Symbol').required(true).validations([{ unique: true }]);
    division
      .createField('league')
      .name('League')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['league']))
      .required(true);
    division.createField('order').name('Order').type('Integer');
  
    // Team
    const team = migration
      .createContentType('team')
      .name('Team')
      .description('Fantasy franchise')
      .displayField('name');
  
    team.createField('name').name('Name').type('Symbol').required(true);
    team.createField('slug').name('Slug').type('Symbol').required(true).validations([{ unique: true }]);
    team
      .createField('league')
      .name('League')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['league']))
      .required(true);
    team
      .createField('division')
      .name('Division')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['division']));
    team.createField('primaryColor').name('Primary Color').type('Symbol').validations(hexColorValidation);
    team.createField('secondaryColor').name('Secondary Color').type('Symbol').validations(hexColorValidation);
    team.createField('logo').name('Logo').type('Link').linkType('Asset');
    team
      .createField('manager')
      .name('Manager')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['manager']))
      .required(true);
    team.createField('foundedYear').name('Founded Year').type('Integer');
  
    // Player (NFL)
    const player = migration
      .createContentType('player')
      .name('Player (NFL)')
      .description('NFL player reference card for fantasy')
      .displayField('fullName');
  
    player.createField('fullName').name('Full Name').type('Symbol').required(true);
    player.createField('slug').name('Slug').type('Symbol').required(true).validations([{ unique: true }]);
    player.createField('nflTeam').name('NFL Team').type('Symbol'); // You can later add a list validator of codes
    player.createField('position').name('Position').type('Symbol').validations([{ in: positions }]);
    player.createField('headshot').name('Headshot').type('Link').linkType('Asset');
    player.createField('byeWeek').name('Bye Week').type('Integer');
    player.createField('status').name('Status').type('Symbol').validations([{ in: playerStatuses }]);
  
    // Roster Entry
    const rosterEntry = migration
      .createContentType('rosterEntry')
      .name('Roster Entry')
      .description('Join Team, Player, Week, and Slot')
      .displayField('slot');
  
    rosterEntry
      .createField('team')
      .name('Team')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['team']))
      .required(true);
    rosterEntry
      .createField('player')
      .name('Player')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['player']))
      .required(true);
    rosterEntry
      .createField('week')
      .name('Week')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['week']))
      .required(true);
    rosterEntry.createField('slot').name('Slot').type('Symbol').validations([{ in: rosterSlots }]);
    rosterEntry.createField('isStarter').name('Is Starter').type('Boolean').required(false);
    rosterEntry
      .createField('acquiredVia')
      .name('Acquired Via')
      .type('Symbol')
      .validations([{ in: ['Draft', 'Waiver', 'Trade', 'FA', 'Keep'] }]);
    rosterEntry.createField('notes').name('Notes').type('Text');
  
    // Scoring Profile
    const scoringProfile = migration
      .createContentType('scoringProfile')
      .name('Scoring Profile')
      .description('Rules for computing fantasy points')
      .displayField('name');
  
    scoringProfile.createField('name').name('Name').type('Symbol').required(true);
    scoringProfile.createField('slug').name('Slug').type('Symbol').required(true).validations([{ unique: true }]);
    scoringProfile.createField('baseJson').name('Base JSON').type('Object').required(true);
    scoringProfile.createField('bonusesJson').name('Bonuses JSON').type('Object');
    scoringProfile
      .createField('tiebreakers')
      .name('Tiebreakers (ordered)')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['tiebreakerRule']) });
  
    // Tiebreaker Rule
    const tiebreakerRule = migration
      .createContentType('tiebreakerRule')
      .name('Tiebreaker Rule')
      .description('Deterministic ordering for standings')
      .displayField('label');
  
    tiebreakerRule.createField('label').name('Label').type('Symbol').required(true);
    tiebreakerRule.createField('code').name('Code').type('Symbol').required(true).validations([{ unique: true }]);
    tiebreakerRule.createField('order').name('Order').type('Integer').required(true);
    tiebreakerRule.createField('description').name('Description').type('Text');
  
    // --------------- B) SEASON / SCHEDULE / RESULTS ---------------
  
    // Season
    const season = migration
      .createContentType('season')
      .name('Season')
      .description('Annual container tying weeks, matchups, stats')
      .displayField('year');
  
    season
      .createField('league')
      .name('League')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['league']))
      .required(true);
    season.createField('year').name('Year').type('Integer').required(true);
    season.createField('startDate').name('Start Date').type('Date').required(true);
    season.createField('endDate').name('End Date').type('Date').required(true);
    season.createField('regularSeasonWeeks').name('Regular Season Weeks').type('Integer').required(true);
    season.createField('playoffWeeks').name('Playoff Weeks').type('Integer').required(true);
  
    // Week
    const week = migration
      .createContentType('week')
      .name('Week')
      .description('Regular or playoff week')
      .displayField('label');
  
    week
      .createField('season')
      .name('Season')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['season']))
      .required(true);
    week.createField('number').name('Number').type('Integer').required(true);
    week.createField('label').name('Label').type('Symbol');
    week.createField('start').name('Start').type('Date').required(true);
    week.createField('end').name('End').type('Date').required(true);
    week.createField('isPlayoffs').name('Is Playoffs').type('Boolean');
  
    // Matchup
    const matchup = migration
      .createContentType('matchup')
      .name('Matchup')
      .description('One head-to-head contest')
      .displayField('status');
  
    matchup
      .createField('season')
      .name('Season')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['season']))
      .required(true);
    matchup
      .createField('week')
      .name('Week')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['week']))
      .required(true);
    matchup
      .createField('homeTeam')
      .name('Home Team')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['team']))
      .required(true);
    matchup
      .createField('awayTeam')
      .name('Away Team')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['team']))
      .required(true);
    matchup.createField('status').name('Status').type('Symbol').validations([{ in: matchupStatuses }]).required(true);
    matchup.createField('lockTime').name('Lock Time').type('Date');
    matchup.createField('homeProjected').name('Home Projected').type('Number');
    matchup.createField('awayProjected').name('Away Projected').type('Number');
  
    // Game Result (Box Score)
    const gameResult = migration
      .createContentType('gameResult')
      .name('Game Result')
      .description('Final computed score + stat lines')
      .displayField('isFinal');
  
    gameResult
      .createField('matchup')
      .name('Matchup')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['matchup']))
      .required(true);
    gameResult.createField('homeScore').name('Home Score').type('Number');
    gameResult.createField('awayScore').name('Away Score').type('Number');
    gameResult
      .createField('homeRoster')
      .name('Home Roster (snapshot)')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['rosterEntry']) });
    gameResult
      .createField('awayRoster')
      .name('Away Roster (snapshot)')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['rosterEntry']) });
    gameResult
      .createField('playerStatLines')
      .name('Player Stat Lines')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['playerStatLine']) });
    gameResult.createField('isFinal').name('Is Final').type('Boolean').required(true);
    gameResult.createField('notes').name('Notes / Recap').type('RichText');
  
    // Player Stat Line
    const playerStatLine = migration
      .createContentType('playerStatLine')
      .name('Player Stat Line')
      .description('Per-player fantasy stats for a specific week and team')
      .displayField('fantasyPoints');
  
    playerStatLine
      .createField('player')
      .name('Player')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['player']))
      .required(true);
    playerStatLine
      .createField('team')
      .name('Team')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['team']))
      .required(true);
    playerStatLine
      .createField('week')
      .name('Week')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['week']))
      .required(true);
    playerStatLine.createField('statJson').name('Stat JSON (raw NFL stats)').type('Object').required(true);
    playerStatLine.createField('fantasyPoints').name('Fantasy Points').type('Number');
    playerStatLine
      .createField('startedInSlot')
      .name('Started In Slot')
      .type('Symbol')
      .validations([{ in: rosterSlots }]);
  
    // Standings Snapshot
    const standingsSnapshot = migration
      .createContentType('standingsSnapshot')
      .name('Standings Snapshot')
      .description('Denormalized standings table for fast rendering & history')
      .displayField('generatedAt');
  
    standingsSnapshot
      .createField('league')
      .name('League')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['league']))
      .required(true);
    standingsSnapshot
      .createField('week')
      .name('Week')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['week']))
      .required(true);
    standingsSnapshot.createField('rows').name('Rows (JSON array)').type('Object').required(true);
    standingsSnapshot.createField('generatedAt').name('Generated At').type('Date').required(true);
  
    // Transaction
    const transaction = migration
      .createContentType('transaction')
      .name('Transaction')
      .description('Trades, drops, waivers, FAAB spends')
      .displayField('type');
  
    transaction
      .createField('league')
      .name('League')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['league']))
      .required(true);
    transaction
      .createField('team')
      .name('Team')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['team']))
      .required(true);
    transaction.createField('type').name('Type').type('Symbol').validations([{ in: transactionTypes }]).required(true);
    transaction
      .createField('counterpartyTeam')
      .name('Counterparty Team')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['team']));
    transaction
      .createField('playersIn')
      .name('Players In')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['player']) });
    transaction
      .createField('playersOut')
      .name('Players Out')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['player']) });
    transaction.createField('faabDelta').name('FAAB Delta').type('Integer');
    transaction
      .createField('effectiveWeek')
      .name('Effective Week')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['week']))
      .required(true);
    transaction.createField('notes').name('Notes').type('Text');
  
    // Injury Report
    const injuryReport = migration
      .createContentType('injuryReport')
      .name('Injury Report')
      .description('Weekly injuries by player for lineup decisions')
      .displayField('designation');
  
    injuryReport
      .createField('player')
      .name('Player')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['player']))
      .required(true);
    injuryReport
      .createField('week')
      .name('Week')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['week']))
      .required(true);
    injuryReport
      .createField('designation')
      .name('Designation')
      .type('Symbol')
      .validations([{ in: injuryDesignations }])
      .required(true);
    injuryReport.createField('reportText').name('Report Text').type('Text');
    injuryReport.createField('sourceUrl').name('Source URL').type('Symbol').validations(urlValidation);
  
    // --------------- C) EDITORIAL / MEDIA / ENGAGEMENT ---------------
  
    // Weekly Recap
    const weeklyRecap = migration
      .createContentType('weeklyRecap')
      .name('Weekly Recap')
      .description('Storytelling + SEO for each week (league-wide)')
      .displayField('title');
  
    weeklyRecap
      .createField('league')
      .name('League')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['league']))
      .required(true);
    weeklyRecap
      .createField('week')
      .name('Week')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['week']))
      .required(true);
    weeklyRecap.createField('title').name('Title').type('Symbol').required(true);
    weeklyRecap.createField('slug').name('Slug').type('Symbol').required(true).validations([{ unique: true }]);
    weeklyRecap.createField('heroImage').name('Hero Image').type('Link').linkType('Asset');
    weeklyRecap.createField('body').name('Body').type('RichText').required(true);
    weeklyRecap
      .createField('matchupsFeatured')
      .name('Matchups Featured')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['matchup']) });
    weeklyRecap
      .createField('playersOfTheWeek')
      .name('Players Of The Week')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['playerStatLine']) });
  
    // Power Ranking
    const powerRanking = migration
      .createContentType('powerRanking')
      .name('Power Ranking')
      .description('Opinionated ranking with notes')
      .displayField('league');
  
    powerRanking
      .createField('league')
      .name('League')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['league']))
      .required(true);
    powerRanking
      .createField('week')
      .name('Week')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['week']))
      .required(true);
    powerRanking.createField('rows').name('Rows (JSON array)').type('Object').required(true);
    powerRanking
      .createField('author')
      .name('Author')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['manager']));
  
    // News Article / Note
    const newsArticle = migration
      .createContentType('newsArticle')
      .name('News Article / Note')
      .description('Short updates (injuries, smack talk, announcements)')
      .displayField('title');
  
    newsArticle
      .createField('league')
      .name('League')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['league']))
      .required(true);
    newsArticle.createField('title').name('Title').type('Symbol').required(true);
    newsArticle.createField('slug').name('Slug').type('Symbol').validations([{ unique: true }]);
    newsArticle.createField('body').name('Body').type('RichText').required(true);
    newsArticle
      .createField('tags')
      .name('Tags')
      .type('Array')
      .items({ type: 'Symbol' });
    newsArticle
      .createField('relatedTeams')
      .name('Related Teams')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['team']) });
    newsArticle
      .createField('relatedPlayers')
      .name('Related Players')
      .type('Array')
      .items({ type: 'Link', linkType: 'Entry', validations: linkTo(['player']) });
  
    // Media Asset (Meme / Graphic)
    const mediaAsset = migration
      .createContentType('mediaAsset')
      .name('Media Asset (Meme / Graphic)')
      .description('Centralize images, logos, clips for reuse')
      .displayField('title');
  
    mediaAsset.createField('title').name('Title').type('Symbol').required(true);
    mediaAsset.createField('image').name('Image').type('Link').linkType('Asset').required(true);
    mediaAsset.createField('altText').name('Alt Text').type('Symbol').required(true);
    mediaAsset.createField('attribution').name('Attribution').type('Symbol');
    mediaAsset
      .createField('relatedTo')
      .name('Related To')
      .type('Array')
      .items({
        type: 'Link',
        linkType: 'Entry',
        validations: linkTo([
          'team',
          'manager',
          'week',
          'newsArticle',
          'weeklyRecap',
          'powerRanking',
          'matchup'
        ])
      });
  
    // Poll
    const poll = migration
      .createContentType('poll')
      .name('Poll')
      .description('Engagement widget')
      .displayField('question');
  
    poll.createField('question').name('Question').type('Symbol').required(true);
    poll
      .createField('options')
      .name('Options')
      .type('Array')
      .items({ type: 'Symbol' })
      .required(true);
    poll
      .createField('status')
      .name('Status')
      .type('Symbol')
      .validations([{ in: ['Draft', 'Open', 'Closed'] }])
      .required(true);
    poll
      .createField('league')
      .name('League')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['league']));
    poll
      .createField('week')
      .name('Week')
      .type('Link')
      .linkType('Entry')
      .validations(linkTo(['week']));
    poll.createField('resultsJson').name('Results JSON').type('Object');
  
    // Notification Template
    const notificationTemplate = migration
      .createContentType('notificationTemplate')
      .name('Notification Template')
      .description('Templated messages for events (matchup final, waivers, etc.)')
      .displayField('key');
  
    notificationTemplate.createField('key').name('Key').type('Symbol').required(true).validations([{ unique: true }]);
    notificationTemplate
      .createField('channel')
      .name('Channel')
      .type('Symbol')
      .validations([{ in: channels }])
      .required(true);
    notificationTemplate.createField('subject').name('Subject').type('Symbol');
    notificationTemplate.createField('body').name('Body').type('Text').required(true);
    notificationTemplate.createField('examplePayload').name('Example Payload').type('Object');
  
    // --------------- EDITOR UI QUALITY-OF-LIFE ---------------
    // Slug editor controls (if available in your space)
    migration.editContentType('league').changeFieldControl('slug', 'builtin', 'slugEditor', {
      trackingFieldId: 'name'
    });
    migration.editContentType('division').changeFieldControl('slug', 'builtin', 'slugEditor', {
      trackingFieldId: 'name'
    });
    migration.editContentType('team').changeFieldControl('slug', 'builtin', 'slugEditor', {
      trackingFieldId: 'name'
    });
    migration.editContentType('player').changeFieldControl('slug', 'builtin', 'slugEditor', {
      trackingFieldId: 'fullName'
    });
    migration.editContentType('weeklyRecap').changeFieldControl('slug', 'builtin', 'slugEditor', {
      trackingFieldId: 'title'
    });
    migration.editContentType('newsArticle').changeFieldControl('slug', 'builtin', 'slugEditor', {
      trackingFieldId: 'title'
    });
  
    // Helpful helpText
    migration.editContentType('standingsSnapshot').changeFieldControl('rows', 'builtin', 'objectEditor', {
      helpText:
        'Array of objects. Each row: { teamId, wins, losses, ties, pf, pa, streak, rank, divisionRank }'
    });
    migration.editContentType('scoringProfile').changeFieldControl('baseJson', 'builtin', 'objectEditor', {
      helpText:
        'Base scoring rules. Example: { "reception": 1, "passingYardsPerPoint": 25, "passingTD": 4, "fumbleLost": -2 }'
    });
    migration.editContentType('playerStatLine').changeFieldControl('statJson', 'builtin', 'objectEditor', {
      helpText:
        'Raw NFL stats used to compute fantasy points. Example: { "passYds": 302, "passTD": 2, "int": 1, "rushYds": 28 }'
    });
  };
  