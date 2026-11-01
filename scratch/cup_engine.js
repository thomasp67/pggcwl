/**
 * ============================================================================
 * Port Glasgow Golf Club - Winter League Cup Concept Engine
 * Standalone Simulation & Seeding / Fixture Generator
 * ============================================================================
 * 
 * COMPETITION RULES & MECHANICS:
 * 1. Eligibility & Field Selection:
 *    - Top 48 players selected by starting Handicap Index (origHCI) from Winter League members.
 *    - Player #49 acts as the official First Reserve.
 * 2. Pots & Seeding:
 *    - 48 players divided into 4 Pots of 12 by handicap range:
 *      * Pot 1: Seeds 1–12 (Championship Tier, lowest handicaps)
 *      * Pot 2: Seeds 1–12 (First Division)
 *      * Pot 3: Seeds 1–12 (Second Division)
 *      * Pot 4: Seeds 1–12 (Third Division)
 * 3. Group Stage (Weeks 1–11):
 *    - Complete round-robin within each pot (11 rounds, 6 matches per pot per week = 24 matches/week).
 *    - Standard Berger Circle Method: Week 1 begins with 1v12, 2v11, 3v10, 4v9, 5v8, 6v7.
 *    - Every player plays every other player in their pot exactly once.
 * 4. Matchplay Scoring (evaluated on weekly Stableford points):
 *    - Win: 3 points
 *    - Draw: 1 point
 *    - Loss: 0 points
 *    - Differential (Diff): Player Points - Opponent Points (accumulated across all weeks)
 * 5. Single Unified League Table:
 *    - All 48 players are placed onto a SINGLE overall league table.
 *    - Ranking hierarchy: Points DESC -> Diff DESC -> Points For (PF) DESC -> Points Against (PA) ASC -> HCI ASC.
 * 6. Knockout Phase (Weeks 12–15):
 *    - Top 16 players from the unified table qualify for single-elimination knockout:
 *      * Round of 16 (Week 12): 1v16, 2v15, 3v14, 4v13, 5v12, 6v11, 7v10, 8v9
 *      * Quarter-Finals (Week 13): 8 winners
 *      * Semi-Finals (Week 14): 4 winners
 *      * Grand Final (Week 15): 2 finalists -> Cup Champion 🏆
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// 1. Load Data & Configs
const rootDir = path.resolve(__dirname, '..');
const membersPath = path.join(rootDir, 'data', 'members.json');
const coursePath = path.join(rootDir, 'config', 'course.json');
const cupConfigPath = path.join(rootDir, 'config', 'cup.json');
const week01Path = path.join(rootDir, 'data', '01.json');

const members = JSON.parse(fs.readFileSync(membersPath, 'utf8'));
const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
const cupConfig = fs.existsSync(cupConfigPath)
  ? JSON.parse(fs.readFileSync(cupConfigPath, 'utf8'))
  : { potsCount: 4, potSize: 12, groupWeeks: 11, scoring: { winPoints: 3, drawPoints: 1, lossPoints: 0 } };

// 2. Select & Partition 48 League Players
const leagueMembers = members
  .filter(m => m.inLeague)
  .sort((a, b) => a.origHCI - b.origHCI || a.name.localeCompare(b.name));

const top48 = leagueMembers.slice(0, 48);
const reserve = leagueMembers.length > 48 ? leagueMembers[48] : null;

// Divide into 4 Pots of 12
const pots = [];
const POT_NAMES = [
  'Pot 1 (Championship Tier)',
  'Pot 2 (First Division)',
  'Pot 3 (Second Division)',
  'Pot 4 (Third Division)'
];

const enrichedTop48 = [];
for (let p = 0; p < 4; p++) {
  const potPlayers = top48.slice(p * 12, (p + 1) * 12).map((player, idx) => ({
    ...player,
    pot: p + 1,
    potName: POT_NAMES[p],
    seed: idx + 1, // Seed 1 to 12 within pot
    overallSeed: p * 12 + idx + 1
  }));
  pots.push(potPlayers);
  enrichedTop48.push(...potPlayers);
}

// 3. Generate Round-Robin Fixtures for 12 Players across 11 Weeks
function generateBergerFixtures(potPlayers) {
  const n = potPlayers.length; // 12
  const fixturesByWeek = []; // index 0 = Week 1, index 10 = Week 11
  const rotating = potPlayers.slice(1); // Seeds 2..12 (11 players)

  for (let r = 0; r < n - 1; r++) {
    const weekMatches = [];
    // Fixed Seed 1 plays top of the bottom half
    const topRow = [potPlayers[0]].concat(rotating.slice(0, (n / 2) - 1));
    const bottomRow = rotating.slice((n / 2) - 1).reverse();

    for (let i = 0; i < n / 2; i++) {
      weekMatches.push({
        home: topRow[i],
        away: bottomRow[i]
      });
    }
    fixturesByWeek.push(weekMatches);

    // Clockwise rotation of 11 players
    const last = rotating.pop();
    rotating.unshift(last);
  }
  return fixturesByWeek;
}

// Generate fixtures for each pot
const potFixtures = pots.map(pot => generateBergerFixtures(pot));

// 4. Stableford Calculation Helper (WHS playing handicap & stroke allocation)
function calculatePlayingHandicap(hci, courseConfig) {
  if (hci === null || hci === undefined || isNaN(hci)) return 0;
  const allowance = courseConfig.allowance !== undefined ? courseConfig.allowance : 1.0;
  const slopeRating = courseConfig.slopeRating !== undefined ? courseConfig.slopeRating : 113;
  const courseRating = courseConfig.courseRating !== undefined ? courseConfig.courseRating : 67.0;
  const par = courseConfig.par !== undefined ? courseConfig.par : 67;
  const strokeLimit = courseConfig.strokeLimit !== undefined ? courseConfig.strokeLimit : 36;
  const raw = allowance * (hci * (slopeRating / 113) + (courseRating - par));
  return Math.min(strokeLimit, Math.max(0, Math.round(raw)));
}

function calculateStablefordTotal(grossScores, hci, courseConfig) {
  if (!grossScores || grossScores.length === 0) return 0;
  const playingHcap = calculatePlayingHandicap(hci, courseConfig);
  let totalPts = 0;

  courseConfig.holes.forEach((hole, idx) => {
    const gross = grossScores[idx] || 0;
    if (gross > 0) {
      const strokes = Math.floor(playingHcap / 18) + (playingHcap % 18 >= hole.si ? 1 : 0);
      const pts = Math.max(0, hole.par + strokes - gross + 2);
      totalPts += pts;
    }
  });
  return totalPts;
}

// 5. Ingest Completed Weeks and Simulate Matches
// Ingest Week 1 scorecard data if present
let week01Rounds = [];
if (fs.existsSync(week01Path)) {
  const week01Data = JSON.parse(fs.readFileSync(week01Path, 'utf8'));
  week01Rounds = Array.isArray(week01Data) ? week01Data : (week01Data.rounds || []);
}

const week01ScoreMap = new Map();
week01Rounds.forEach(r => {
  const m = top48.find(p => String(p.memberId) === String(r.memberId));
  if (m) {
    const pts = calculateStablefordTotal(r.gross, m.origHCI, course);
    week01ScoreMap.set(String(m.memberId), pts);
  }
});

// 6. Build Player Records for the Unified League
const playerStats = new Map();
enrichedTop48.forEach(p => {
  playerStats.set(String(p.memberId), {
    ...p,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    pointsFor: 0,     // Total Stableford points scored
    pointsAgainst: 0, // Total Stableford points conceded
    diff: 0,          // Points For - Points Against
    cupPoints: 0,     // 3 for win, 1 for draw, 0 for loss
    matchLog: []
  });
});

// Evaluate Week 1 Matches across all 4 pots
const week01Results = [];
for (let pIdx = 0; pIdx < 4; pIdx++) {
  const potMatches = potFixtures[pIdx][0]; // Week 1 (index 0)
  potMatches.forEach(match => {
    const p1 = playerStats.get(String(match.home.memberId));
    const p2 = playerStats.get(String(match.away.memberId));

    const p1Played = week01ScoreMap.has(String(p1.memberId));
    const p2Played = week01ScoreMap.has(String(p2.memberId));
    const p1Pts = p1Played ? week01ScoreMap.get(String(p1.memberId)) : 0;
    const p2Pts = p2Played ? week01ScoreMap.get(String(p2.memberId)) : 0;
    const hasPlayed = p1Played || p2Played;

    let outcome = 'pending';
    let p1CupPts = 0;
    let p2CupPts = 0;

    if (hasPlayed) {
      p1.played += 1;
      p2.played += 1;
      p1.pointsFor += p1Pts;
      p1.pointsAgainst += p2Pts;
      p2.pointsFor += p2Pts;
      p2.pointsAgainst += p1Pts;

      // Diff to par (36 points) - if a player does not play, diff does not change
      const p1Diff = p1Played ? (p1Pts - 36) : 0;
      const p2Diff = p2Played ? (p2Pts - 36) : 0;
      if (p1Played) p1.diff += p1Diff;
      if (p2Played) p2.diff += p2Diff;

      if (p1Pts > p2Pts) {
        outcome = `${p1.name} Win`;
        p1CupPts = 3;
        p1.won += 1;
        p2.lost += 1;
      } else if (p2Pts > p1Pts) {
        outcome = `${p2.name} Win`;
        p2CupPts = 3;
        p2.won += 1;
        p1.lost += 1;
      } else {
        outcome = 'Draw';
        p1CupPts = 1;
        p2CupPts = 1;
        p1.drawn += 1;
        p2.drawn += 1;
      }
      p1.cupPoints += p1CupPts;
      p2.cupPoints += p2CupPts;
    }

    week01Results.push({
      pot: pIdx + 1,
      potName: POT_NAMES[pIdx],
      player1: p1.name,
      seed1: p1.seed,
      score1: p1Pts,
      player2: p2.name,
      seed2: p2.seed,
      score2: p2Pts,
      outcome,
      diff1: p1Played ? (p1Pts - 36) : 0,
      diff2: p2Played ? (p2Pts - 36) : 0
    });
  });
}

// 7. Sort the Unified League Table
const unifiedStandings = Array.from(playerStats.values()).sort((a, b) => {
  // 1. Most Cup Points (3-1-0)
  if (b.cupPoints !== a.cupPoints) return b.cupPoints - a.cupPoints;
  // 2. Highest Score Differential (Diff)
  if (b.diff !== a.diff) return b.diff - a.diff;
  // 3. Highest Total Stableford Points For (PF)
  if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
  // 4. Fewest Points Against (PA)
  if (a.pointsAgainst !== b.pointsAgainst) return a.pointsAgainst - b.pointsAgainst;
  // 5. Lowest Handicap Index
  return a.origHCI - b.origHCI;
});

// Assign unified positions (1 to 48)
unifiedStandings.forEach((p, idx) => {
  p.position = idx + 1;
  p.isQualifying = idx < 16;
});

// 8. Generate Projected Top 16 Knockout Tree
const top16 = unifiedStandings.slice(0, 16);
const r16Pairings = [
  { match: 1, seedA: 1, seedB: 16 },
  { match: 2, seedA: 8, seedB: 9 },
  { match: 3, seedA: 4, seedB: 13 },
  { match: 4, seedA: 5, seedB: 12 },
  { match: 5, seedA: 2, seedB: 15 },
  { match: 6, seedA: 7, seedB: 10 },
  { match: 7, seedA: 3, seedB: 14 },
  { match: 8, seedA: 6, seedB: 11 }
].map(m => ({
  ...m,
  playerA: top16[m.seedA - 1],
  playerB: top16[m.seedB - 1]
}));

// ============================================================================
// CONSOLE DEMO / TEST OUTPUT
// ============================================================================
console.log('\n================================================================');
console.log('PORT GLASGOW GOLF CLUB — WINTER LEAGUE CUP CONCEPT DEMO');
console.log('================================================================\n');

console.log(`✓ Total League Members: ${leagueMembers.length}`);
console.log(`✓ Field Size: ${top48.length} players across 4 Pots of 12`);
if (reserve) {
  console.log(`✓ Reserve Player (#49): ${reserve.name} (HCI: ${reserve.origHCI.toFixed(1)})`);
}

console.log('\n--- POT SEEDING BREAKDOWN ---');
pots.forEach((pot, idx) => {
  console.log(`\n${POT_NAMES[idx]}:`);
  pot.forEach(p => {
    console.log(`  Seed ${String(p.seed).padStart(2)}: ${p.name.padEnd(20)} | HCI: ${p.origHCI.toFixed(1).padStart(4)}`);
  });
});

console.log('\n--- WEEK 1 FIXTURES & MATCH RESULTS (SIMULATED FROM DATA/01.JSON) ---');
let currentPot = 0;
week01Results.forEach((m, idx) => {
  if (m.pot !== currentPot) {
    currentPot = m.pot;
    console.log(`\n${m.potName}:`);
  }
  const scoreStr = `${String(m.score1).padStart(2)} - ${String(m.score2).padStart(2)} pts`;
  const p1Str = `(S${m.seed1}) ${m.player1}`.padEnd(22);
  const p2Str = `(S${m.seed2}) ${m.player2}`.padEnd(22);
  const diffStr = m.diff1 >= 0 ? `+${m.diff1}` : `${m.diff1}`;
  console.log(`  Match ${idx + 1}: ${p1Str} ${scoreStr} ${p2Str} -> Result: ${m.outcome.padEnd(16)} (Diff: ${diffStr})`);
});

console.log('\n--- UNIFIED 48-PLAYER LEAGUE STANDINGS (AFTER WEEK 1) ---');
console.log('Pos | Player Name          | Pot (Seed)   | Pld | W | D | L | Diff | Pts');
console.log('----+----------------------+--------------+-----+---+---+---+------+-----');
unifiedStandings.forEach(p => {
  const posStr = String(p.position).padStart(3);
  const nameStr = p.name.padEnd(20);
  const potStr = `Pot ${p.pot} (S${p.seed})`.padEnd(12);
  const pldStr = String(p.played).padStart(3);
  const wStr = String(p.won).padStart(1);
  const dStr = String(p.drawn).padStart(1);
  const lStr = String(p.lost).padStart(1);
  const diffStr = (p.diff >= 0 ? `+${p.diff}` : `${p.diff}`).padStart(4);
  const ptsStr = String(p.cupPoints).padStart(3);
  console.log(`${posStr} | ${nameStr} | ${potStr} | ${pldStr} | ${wStr} | ${dStr} | ${lStr} | ${diffStr} | ${ptsStr}`);
});

console.log('\n--- PROJECTED TOP 16 KNOCKOUT BRACKET (WEEK 12) ---');
r16Pairings.forEach(m => {
  const aStr = `#${m.seedA} ${m.playerA.name} (${m.playerA.cupPoints}pts, Diff: ${m.playerA.diff >= 0 ? '+' : ''}${m.playerA.diff})`;
  const bStr = `#${m.seedB} ${m.playerB.name} (${m.playerB.cupPoints}pts, Diff: ${m.playerB.diff >= 0 ? '+' : ''}${m.playerB.diff})`;
  console.log(`  Match ${m.match}: ${aStr.padEnd(38)} vs ${bStr}`);
});

console.log('\n================================================================');
console.log('Simulation complete. Zero files on public UI were modified.');
console.log('================================================================\n');

// Export functions for future integration
module.exports = {
  top48: enrichedTop48,
  reserve,
  pots,
  potFixtures,
  generateBergerFixtures,
  unifiedStandings,
  r16Pairings
};
