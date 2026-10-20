/**
 * Golf Winter League & Weekly Stableford Web App
 * Client-side calculation engine, dynamic week discovery, and UI renderer.
 */

(function () {
  'use strict';

  // Global State
  const state = {
    course: null,
    cutsConfig: null,
    members: [],
    weeksData: [], // Array of { weekNum, weekStr, rounds }
    latestWeek: 0,
    processedMembers: new Map(), // memberId -> processed state
    weeklyResults: new Map(), // weekNum -> Array of player round results
    lastmanConfig: {
      pointsToSurvive: 2,
      initialLives: 3,
      eligibility: 'league',
      holeOrder: 'si_desc',
      hideUnplayedEliminations: false,
      hideCompetitionSettings: false
    },
    activeTab: null,
    leaderboardWeek: 0,
    leaderboardSortCol: null, // Sort column for Winter League: 'pos', 'cut', 'round', 'avg', 'money', 'total'
    leaderboardSortDir: 'desc', // Sort direction: 'desc' (1st click) or 'asc' (2nd click)
    selectedWeek: 0,
    eclecticWeek: 0,
    eclecticScoringMode: 'nett', // 'nett' or 'points'
    eclecticSortCol: null, // 'pos', 'rounds', 'points', 'nett'
    eclecticSortDir: 'desc', // 'desc' or 'asc'
    magic2sWeek: 0,
    magic2sWeeklyPots: new Map(),
    magic2sConfig: null,
    prizesConfig: null,
    tabsConfig: null,
    lastmanWeek: 0,
    parbingoWeek: 0,
    parbingoEligibility: 'league',
    bingoMode: 'gross', // 'gross' (Gross Pars) or 'nett' (Net Birdies)
    selectedPlayerId: null,
    playersViewMode: 'profile' // 'profile' (Individual Player Details) or 'roster' (Handicap Roster Matrix)
  };

  // DOM Elements
  const elements = {
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    leagueMetaBadges: document.getElementById('league-meta-badges'),
    metaPar: document.getElementById('meta-par'),
    metaStrokeLimit: document.getElementById('meta-stroke-limit'),
    metaLatestWeek: document.getElementById('meta-latest-week'),

    tabButtons: document.querySelectorAll('.tab-btn'),
    tabNav: document.querySelector('.tab-nav'),
    mobileTabSelect: document.getElementById('mobile-tab-select'),
    viewPanels: document.querySelectorAll('.view-panel'),

    // Leaderboard
    leaderboardTbody: document.getElementById('leaderboard-tbody'),
    leaderboardSearch: document.getElementById('leaderboard-search'),
    leaderboardSubtitle: document.getElementById('leaderboard-subtitle'),
    leaderboardWeekSelect: document.getElementById('leaderboard-week-select'),
    btnLeaderboardPrev: document.getElementById('btn-leaderboard-prev'),
    btnLeaderboardNext: document.getElementById('btn-leaderboard-next'),

    // Weekly
    weekSelect: document.getElementById('week-select'),
    weeklySearch: document.getElementById('weekly-search'),
    weeklySubtitle: document.getElementById('weekly-subtitle'),
    weeklyHideNonLeague: document.getElementById('weekly-hide-non-league'),
    weeklyTbody: document.getElementById('weekly-tbody'),
    btnWeeklyPrev: document.getElementById('btn-weekly-prev'),
    btnWeeklyNext: document.getElementById('btn-weekly-next'),

    // Eclectic
    eclecticTheadTr: document.getElementById('eclectic-thead-tr'),
    eclecticTbody: document.getElementById('eclectic-tbody'),
    eclecticSearch: document.getElementById('eclectic-search'),
    eclecticHideNonLeague: document.getElementById('eclectic-hide-non-league'),
    eclecticScoringMode: document.getElementById('eclectic-scoring-mode'),
    eclecticSubtitle: document.getElementById('eclectic-subtitle'),
    eclecticWeekSelect: document.getElementById('eclectic-week-select'),
    btnEclecticPrev: document.getElementById('btn-eclectic-prev'),
    btnEclecticNext: document.getElementById('btn-eclectic-next'),

    // Magic 2's
    magic2sWeekSelect: document.getElementById('magic2s-week-select'),
    magic2sSearch: document.getElementById('magic2s-search'),
    magic2sSubtitle: document.getElementById('magic2s-subtitle'),
    magic2sHideNonLeague: document.getElementById('magic2s-hide-non-league'),
    btnMagic2sPrev: document.getElementById('btn-magic2s-prev'),
    btnMagic2sNext: document.getElementById('btn-magic2s-next'),
    magic2sDrawCard: document.getElementById('magic2s-draw-card'),
    magic2sMetricsCard: document.getElementById('magic2s-metrics-card'),
    magic2sWeeklyTableCard: document.getElementById('magic2s-weekly-table-card'),
    magic2sWeeklyTbody: document.getElementById('magic2s-weekly-tbody'),

    // Unified Player Profile & Handicap Tracker
    btnPlayersModeProfile: document.getElementById('btn-players-mode-profile'),
    btnPlayersModeRoster: document.getElementById('btn-players-mode-roster'),
    playersProfileView: document.getElementById('players-profile-view'),
    playersRosterView: document.getElementById('players-roster-view'),
    btnGotoRoster: document.getElementById('btn-goto-roster'),
    btnBackToProfile: document.getElementById('btn-back-to-profile'),

    // Handicap Tracker (Roster Subview)
    handicapTheadTr: document.getElementById('handicap-thead-tr'),
    handicapTbody: document.getElementById('handicap-tbody'),
    handicapSearch: document.getElementById('handicap-search'),
    handicapFilterLeague: document.getElementById('handicap-filter-league'),
    btnToggleCutsRules: document.getElementById('btn-toggle-cuts-rules'),
    btnCloseCutsRules: document.getElementById('btn-close-cuts-rules'),
    cutsRulesCard: document.getElementById('cuts-rules-card'),
    cutsRulesContent: document.getElementById('cuts-rules-content'),

    // Player Details (Profile Subview)
    playerSearchInput: document.getElementById('player-search-input'),
    playerSuggestions: document.getElementById('player-suggestions'),
    playerEmptyPrompt: document.getElementById('player-empty-prompt'),
    playerQuickPicks: document.getElementById('player-quick-picks'),
    playerDetailsCard: document.getElementById('player-details-card'),
    playerCardName: document.getElementById('player-card-name'),
    playerCardBadge: document.getElementById('player-card-badge'),
    playerCardMeta: document.getElementById('player-card-meta'),
    playerCardStats: document.getElementById('player-card-stats'),
    playerRoundsContainer: document.getElementById('player-rounds-container'),

    // Last Man Standing
    lastmanBanner: document.getElementById('lastman-banner'),
    lastmanSubtitle: document.getElementById('lastman-subtitle'),
    lastmanFilterStatus: document.getElementById('lastman-filter-status'),
    lastmanSearch: document.getElementById('lastman-search'),
    lastmanTheadTr: document.getElementById('lastman-thead-tr'),
    lastmanTbody: document.getElementById('lastman-tbody'),
    lastmanWeekSelect: document.getElementById('lastman-week-select'),
    btnLastmanPrev: document.getElementById('btn-lastman-prev'),
    btnLastmanNext: document.getElementById('btn-lastman-next'),
    lastmanCfgPoints: document.getElementById('lastman-cfg-points'),
    lastmanCfgOrder: document.getElementById('lastman-cfg-order'),
    lastmanCfgEligibility: document.getElementById('lastman-cfg-eligibility'),
    lastmanCfgLives: document.getElementById('lastman-cfg-lives'),
    lastmanCfgHideUnplayed: document.getElementById('lastman-cfg-hide-unplayed'),
    lastmanSettingsBar: document.getElementById('lastman-settings-bar'),
    btnResetLastmanCfg: document.getElementById('btn-reset-lastman-cfg'),

    // Bingo (Gross Pars & Net Birdies)
    btnBingoModeGross: document.getElementById('btn-bingo-mode-gross'),
    btnBingoModeNett: document.getElementById('btn-bingo-mode-nett'),
    parbingoWeekSelect: document.getElementById('parbingo-week-select'),
    btnParbingoPrev: document.getElementById('btn-parbingo-prev'),
    btnParbingoNext: document.getElementById('btn-parbingo-next'),
    parbingoFilterEligibility: document.getElementById('parbingo-filter-eligibility'),
    parbingoSearch: document.getElementById('parbingo-search'),
    parbingoBanner: document.getElementById('parbingo-banner'),
    parbingoSubtitle: document.getElementById('parbingo-subtitle'),
    parbingoTheadTr: document.getElementById('parbingo-thead-tr'),
    parbingoTbody: document.getElementById('parbingo-tbody'),

    // Local file protocol notice
    localProtocolBanner: document.getElementById('local-protocol-banner'),
    localNoticeClose: document.getElementById('local-notice-close')
  };

  /**
   * Helper: Round number to 1 decimal place with IEEE-754 precision correction
   */
  function round1(val) {
    if (val === null || val === undefined) return 0;
    return Math.round((val + Number.EPSILON) * 10) / 10;
  }

  /**
   * Helper: Extract surname for sorting
   */
  function getSurname(name) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Helper: Render Stableford point chip with user colour-coding:
   * 0 points = red
   * 1 point  = yellow
   * 2 points = light green
   * 3 points = mid green
   * 4 points = dark green
   * 5+ points = orange
   */
  function renderPointChip(pt) {
    if (pt === undefined || pt === null || pt === '-') {
      return `<span style="color: var(--text-light);">-</span>`;
    }
    const num = Number(pt);
    if (isNaN(num)) {
      return `<span>${escapeHtml(String(pt))}</span>`;
    }
    let colorClass = 'pt-0';
    if (num === 0) colorClass = 'pt-0';
    else if (num === 1) colorClass = 'pt-1';
    else if (num === 2) colorClass = 'pt-2';
    else if (num === 3) colorClass = 'pt-3';
    else if (num === 4) colorClass = 'pt-4';
    else if (num >= 5) colorClass = 'pt-5';

    return `<span class="pt-chip ${colorClass}">${num}</span>`;
  }

  /**
   * Build tooltip for a hole cell showing Gross Score, Handicap Strokes, and Stroke Index
   */
  function buildHoleTooltip(round, holeIndex) {
    if (!round) return '';
    const hole = (state.course && Array.isArray(state.course.holes)) ? state.course.holes[holeIndex] : null;
    const par = hole ? hole.par : '-';
    const si = hole ? hole.si : '-';
    const gross = (round.grossScores && round.grossScores[holeIndex] !== undefined) ? round.grossScores[holeIndex] : '-';
    const strokes = (round.holeStrokes && round.holeStrokes[holeIndex] !== undefined) ? round.holeStrokes[holeIndex] : 0;
    const pt = (round.holePoints && round.holePoints[holeIndex] !== undefined) ? round.holePoints[holeIndex] : '-';
    return `Hole ${holeIndex + 1} (Par ${par}, Stroke Index ${si}) • Gross: ${gross} • Strokes: ${strokes} • ${pt} pts`;
  }

  /**
   * Calculate Playing Handicap according to WHS Course Handicap Formula:
   * Formula: Playing Handicap = round( Allowance * ( HandicapIndex * (Slope / 113) + (CourseRating - Par) ) )
   * At Port Glasgow Golf Club:
   *   - Par: 67
   *   - Course Rating: 66.0
   *   - Slope Rating: 113
   *   - Handicap Allowance: 100% (1.0)
   * Capped at course.strokeLimit (default 36 strokes maximum).
   */
  function calculatePlayingHandicap(hci, course) {
    if (hci === null || hci === undefined || isNaN(hci)) return 0;
    if (!course) return Math.min(36, Math.max(0, Math.round(hci)));
    const allowance = course.allowance !== undefined ? course.allowance : 1.0;
    const slopeRating = course.slopeRating !== undefined ? course.slopeRating : 113;
    const courseRating = course.courseRating !== undefined ? course.courseRating : 67.0;
    const par = course.par !== undefined ? course.par : 67;
    const strokeLimit = course.strokeLimit !== undefined ? course.strokeLimit : 36;
    const raw = allowance * (hci * (slopeRating / 113) + (courseRating - par));
    const rounded = Math.round(raw);
    return Math.min(strokeLimit, rounded);
  }

  /**
   * Handicap Cut & Adjustment Engine (Configured via config/cuts.json)
   * 
   * Evaluates weekly round Stableford points (P) against player's active entering HCI:
   * 1. Handicap Relief / Increase (P < 30):
   *    Adds +0.1 to handicap index (increaseAdjustment).
   * 2. Buffer Zone (30 <= P < 36):
   *    No adjustment (0.0).
   * 3. Progressive Cut (36 <= P < 43):
   *    Cut = -1 * (baseCut + (P - 36) * cutPerPoint), capped at the tier's capCut.
   * 4. Buffer Cap Cut (P >= 43):
   *    Player receives the full maximum tier reduction (capCut, e.g. -1.0 to -2.0).
   */
  function calculateCut(totalPoints, activeHCI, cutsConfig) {
    if (!cutsConfig) return 0.0;

    const increasePts = cutsConfig.increasePoints !== undefined ? cutsConfig.increasePoints : 30;
    const increaseAdj = cutsConfig.increaseAdjustment !== undefined ? cutsConfig.increaseAdjustment : 0.1;
    const triggerPts = cutsConfig.triggerPoints !== undefined ? cutsConfig.triggerPoints : 36;
    const capPts = cutsConfig.bufferCapPoints !== undefined ? cutsConfig.bufferCapPoints : 43;
    const defaultCutPerPt = cutsConfig.defaultCutPerPoint !== undefined ? Math.abs(cutsConfig.defaultCutPerPoint) : 0.1;

    // 1. Scoring below increase threshold: handicap increases (+0.1)
    if (increasePts !== null && totalPoints < increasePts) {
      return round1(Math.abs(increaseAdj));
    }

    // 2. Buffer zone: no adjustment (0.0)
    if (totalPoints < triggerPts) {
      return 0.0;
    }

    // 3. Locate active tier based on activeHCI
    let tier = null;
    if (Array.isArray(cutsConfig.tiers) && cutsConfig.tiers.length > 0) {
      tier = cutsConfig.tiers.find(t => activeHCI >= t.minHci - 0.001 && activeHCI <= t.maxHci + 0.001);
      if (!tier) {
        if (activeHCI < cutsConfig.tiers[0].minHci) {
          tier = cutsConfig.tiers[0];
        } else {
          tier = cutsConfig.tiers[cutsConfig.tiers.length - 1];
        }
      }
    }

    const tierNum = tier ? (tier.tier || 1) : 1;
    const baseCut = tier && tier.baseCut !== undefined
      ? Math.abs(tier.baseCut)
      : (tierNum * 0.1);

    const cutPerPoint = tier && tier.cutPerPoint !== undefined
      ? Math.abs(tier.cutPerPoint)
      : defaultCutPerPt;

    const capCut = tier && tier.capCut !== undefined
      ? Math.abs(tier.capCut)
      : (1.0 + (tierNum - 1) * 0.2);

    // 4. Maximum buffer cap check (e.g. 43+ points)
    if (capPts !== null && capPts !== undefined && totalPoints >= capPts) {
      return -1 * round1(capCut);
    }

    // 5. Progressive cut calculation: baseCut + (points above trigger * cutPerPoint)
    const pointsAboveTrigger = totalPoints - triggerPts;
    const calculatedCut = baseCut + (pointsAboveTrigger * cutPerPoint);

    // Apply cap if calculated cut exceeds capCut
    const finalCut = (capCut !== null && calculatedCut > capCut) ? capCut : calculatedCut;
    return -1 * round1(finalCut);
  }

  // Default Magic 2's configuration: 20 combinations of 3 par-3 holes from course [1, 8, 11, 13, 17, 18]
  const DEFAULT_MAGIC2S_CONFIG = {
    competitionName: "Magic 2's",
    par3Holes: [1, 8, 11, 13, 17, 18],
    allowPar4And5Twos: true,
    weeks: {
      "1": [1, 8, 11],
      "2": [1, 8, 13],
      "3": [1, 8, 17],
      "4": [1, 8, 18],
      "5": [1, 11, 13],
      "6": [1, 11, 17],
      "7": [1, 11, 18],
      "8": [1, 13, 17],
      "9": [1, 13, 18],
      "10": [1, 17, 18],
      "11": [8, 11, 13],
      "12": [8, 11, 17],
      "13": [8, 11, 18],
      "14": [8, 13, 17],
      "15": [8, 13, 18],
      "16": [8, 17, 18],
      "17": [11, 13, 17],
      "18": [11, 13, 18],
      "19": [11, 17, 18],
      "20": [13, 17, 18]
    }
  };

  // Default Prizes configuration: Sweep fee £2.00, Magic 2's fee £1.00
  const DEFAULT_PRIZES_CONFIG = {
    sweep: {
      entryFee: 2.00,
      description: "Weekend Stableford Sweep prize fund (£2 per entrant) and payout percentages based on field size",
      tiers: [
        { minEntrants: 16, shares: [0.50, 0.30, 0.20], description: "16+ players: 1st 50%, 2nd 30%, 3rd 20%" },
        { minEntrants: 10, shares: [0.65, 0.35], description: "10-15 players: 1st 65%, 2nd 35%" }
      ]
    },
    magic2s: {
      entryFee: 1.00,
      eligibility: "league_only",
      description: "Magic 2's competition: £1 entry fee per round entrant. Total fund is total entrants x £1. League prize pot is league entrants x £1. Only league members are eligible to win."
    }
  };

  // Default Navigation Tabs Visibility and Ordering configuration
  const DEFAULT_TABS_CONFIG = {
    "tab-leaderboard": { "name": "Winter League", "icon": "🏆", "order": 1, "hideDesktop": false, "hideMobile": false },
    "tab-weekly": { "name": "Weekend Stableford", "icon": "📅", "order": 2, "hideDesktop": false, "hideMobile": false },
    "tab-eclectic": { "name": "Eclectic", "icon": "🎯", "order": 3, "hideDesktop": false, "hideMobile": false },
    "tab-magic2s": { "name": "Magic 2's", "icon": "🪄", "order": 4, "hideDesktop": false, "hideMobile": false },
    "tab-lastman": { "name": "Last Man Standing", "icon": "⚔️", "order": 5, "hideDesktop": false, "hideMobile": false },
    "tab-parbingo": { "name": "Bingo", "icon": "🎱", "order": 6, "hideDesktop": false, "hideMobile": false },
    "tab-player": { "name": "Player Profile", "icon": "👤", "order": 7, "hideDesktop": false, "hideMobile": false }
  };

  // Embedded sample dataset for offline / local file protocol preview (file://)
  const FALLBACK_DATA = {
    tabsConfig: DEFAULT_TABS_CONFIG,
    course: {
      par: 67,
      courseRating: 67.0,
      slopeRating: 113,
      allowance: 1.0,
      strokeLimit: 36,
      holes: [
        { hole: 1, par: 3, si: 13 },
        { hole: 2, par: 4, si: 5 },
        { hole: 3, par: 4, si: 17 },
        { hole: 4, par: 5, si: 9 },
        { hole: 5, par: 4, si: 1 },
        { hole: 6, par: 4, si: 7 },
        { hole: 7, par: 4, si: 11 },
        { hole: 8, par: 3, si: 15 },
        { hole: 9, par: 4, si: 3 },
        { hole: 10, par: 5, si: 18 },
        { hole: 11, par: 3, si: 16 },
        { hole: 12, par: 4, si: 4 },
        { hole: 13, par: 3, si: 6 },
        { hole: 14, par: 4, si: 14 },
        { hole: 15, par: 4, si: 12 },
        { hole: 16, par: 4, si: 2 },
        { hole: 17, par: 3, si: 8 },
        { hole: 18, par: 3, si: 10 }
      ]
    },
    cutsConfig: {
      triggerPoints: 36,
      bufferCapPoints: 43,
      increasePoints: 30,
      increaseAdjustment: 0.1,
      tiers: [
        { tier: 1, minHci: 0.0, maxHci: 5.0, capCut: -1.0 },
        { tier: 2, minHci: 5.1, maxHci: 10.0, capCut: -1.2 },
        { tier: 3, minHci: 10.1, maxHci: 15.0, capCut: -1.4 },
        { tier: 4, minHci: 15.1, maxHci: 20.0, capCut: -1.6 },
        { tier: 5, minHci: 20.1, maxHci: 25.0, capCut: -1.8 },
        { tier: 6, minHci: 25.1, maxHci: 99.9, capCut: -2.0 }
      ]
    },
    members: [
      { memberId: "4001584481", name: "Evan Conway", origHCI: 3.7, inLeague: true },
      { memberId: "4002937502", name: "Allan Aitchison", origHCI: 11.6, inLeague: false },
      { memberId: "4003112233", name: "Craig Ferguson", origHCI: 7.2, inLeague: true },
      { memberId: "4004556677", name: "Gordon McIntyre", origHCI: 14.3, inLeague: true },
      { memberId: "4005889900", name: "David Robertson", origHCI: 18.5, inLeague: true },
      { memberId: "4006123456", name: "Fraser Campbell", origHCI: 22.1, inLeague: true },
      { memberId: "4007654321", name: "Mark Stewart", origHCI: 9.8, inLeague: true },
      { memberId: "4008987654", name: "Callum Ross", origHCI: 15.0, inLeague: false },
      { memberId: "4009112244", name: "Scott Thomson", origHCI: 5.4, inLeague: true },
      { memberId: "4010334455", name: "Derek Miller", origHCI: 26.2, inLeague: true },
      { memberId: "4011556688", name: "Neil Henderson", origHCI: 12.0, inLeague: true },
      { memberId: "4012778899", name: "Graham Wallace", origHCI: 16.8, inLeague: true }
    ],
    weeks: [
      {
        weekNum: 1,
        weekStr: "01",
        rounds: [
          { memberId: "4001584481", gross: [3, 5, 4, 7, 4, 4, 4, 3, 5, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4002937502", gross: [4, 5, 5, 6, 5, 4, 5, 4, 5, 6, 4, 5, 4, 5, 5, 5, 4, 4] },
          { memberId: "4003112233", gross: [3, 4, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 4, 4, 4, 5, 3, 3] },
          { memberId: "4004556677", gross: [4, 5, 5, 6, 5, 5, 5, 4, 5, 6, 4, 5, 4, 5, 5, 5, 4, 3] },
          { memberId: "4005889900", gross: [4, 6, 5, 7, 5, 5, 6, 4, 6, 6, 4, 6, 4, 5, 5, 5, 4, 4] },
          { memberId: "4006123456", gross: [5, 6, 6, 7, 6, 6, 6, 4, 6, 7, 5, 6, 5, 6, 6, 6, 5, 4] },
          { memberId: "4007654321", gross: [3, 4, 5, 5, 5, 4, 4, 3, 5, 5, 4, 4, 4, 4, 5, 4, 3, 4] },
          { memberId: "4008987654", gross: [4, 5, 5, 6, 5, 5, 5, 3, 5, 6, 3, 5, 4, 5, 5, 5, 4, 4] },
          { memberId: "4009112244", gross: [3, 4, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4010334455", gross: [5, 6, 6, 7, 6, 6, 6, 5, 6, 7, 5, 6, 5, 6, 6, 6, 5, 5] },
          { memberId: "4011556688", gross: [4, 5, 4, 6, 5, 5, 5, 3, 5, 6, 4, 5, 4, 5, 4, 5, 4, 3] }
        ]
      },
      {
        weekNum: 2,
        weekStr: "02",
        rounds: [
          { memberId: "4001584481", gross: [3, 4, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4002937502", gross: [4, 5, 4, 5, 5, 4, 4, 3, 5, 5, 3, 4, 4, 4, 4, 4, 3, 3] },
          { memberId: "4003112233", gross: [3, 4, 4, 6, 5, 4, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 3] },
          { memberId: "4004556677", gross: [3, 4, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4005889900", gross: [4, 5, 4, 6, 5, 4, 5, 3, 5, 5, 4, 5, 3, 4, 4, 4, 3, 3] },
          { memberId: "4006123456", gross: [4, 5, 5, 6, 5, 5, 5, 4, 5, 6, 4, 5, 4, 5, 5, 5, 4, 3] },
          { memberId: "4007654321", gross: [3, 4, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4009112244", gross: [3, 4, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4010334455", gross: [4, 5, 5, 6, 5, 5, 5, 4, 5, 6, 4, 5, 4, 5, 5, 5, 4, 4] },
          { memberId: "4012778899", gross: [4, 5, 5, 6, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 5, 3, 3] }
        ]
      },
      {
        weekNum: 3,
        weekStr: "03",
        rounds: [
          { memberId: "4001584481", gross: [3, 4, 3, 5, 4, 4, 3, 3, 4, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4002937502", gross: [4, 5, 4, 5, 5, 4, 5, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4] },
          { memberId: "4003112233", gross: [3, 4, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4004556677", gross: [4, 5, 4, 6, 5, 4, 4, 3, 5, 5, 3, 5, 4, 4, 4, 4, 3, 3] },
          { memberId: "4005889900", gross: [4, 5, 5, 6, 5, 5, 5, 4, 5, 6, 4, 5, 3, 5, 5, 5, 3, 4] },
          { memberId: "4007654321", gross: [3, 5, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4008987654", gross: [4, 4, 5, 5, 5, 4, 5, 3, 5, 5, 4, 4, 3, 4, 5, 4, 3, 3] },
          { memberId: "4009112244", gross: [3, 4, 4, 5, 4, 4, 4, 3, 4, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4011556688", gross: [3, 5, 4, 5, 4, 4, 4, 3, 5, 5, 3, 4, 3, 4, 4, 4, 3, 3] },
          { memberId: "4012778899", gross: [4, 5, 4, 6, 5, 4, 5, 3, 5, 6, 4, 5, 3, 5, 4, 5, 3, 4] }
        ]
      }
    ],
    magic2sConfig: DEFAULT_MAGIC2S_CONFIG,
    prizesConfig: DEFAULT_PRIZES_CONFIG
  };

  /**
   * Data Discovery & Loading
   */
  async function loadData() {
    // 1. If running via file:// protocol (local preview without a web server)
    // Use window.GOLF_DATA (generated by process_raw.js from your raw CSVs)
    if (window.location.protocol === 'file:') {
      if (window.GOLF_DATA && window.GOLF_DATA.course && window.GOLF_DATA.members) {
        console.info('Running via file:// protocol. Loaded up-to-date dataset from data/data.js.');
        loadDataset(window.GOLF_DATA);
        return;
      }
      // If data.js is not present, use FALLBACK_DATA and display notice
      loadDataset(FALLBACK_DATA);
      if (elements.localProtocolBanner) {
        elements.localProtocolBanner.style.display = 'flex';
      }
      return;
    }

    try {
      // 2. Running via HTTP/HTTPS (GitHub Pages or local dev server)
      // Use cache: 'no-store' and cache-busting timestamp so Firefox NEVER serves stale cached JSON
      const ts = Date.now();
      const fetchOpts = { cache: 'no-store' };

      const fetchConfigWithFallback = async (cfgFile, legacyFile) => {
        try {
          const r1 = await fetch(`config/${cfgFile}?v=${ts}`, fetchOpts);
          if (r1.ok) return r1;
        } catch (_) {}
        if (legacyFile) {
          try {
            const r2 = await fetch(`data/${legacyFile}?v=${ts}`, fetchOpts);
            if (r2.ok) return r2;
          } catch (_) {}
        }
        return fetch(`config/${cfgFile}?v=${ts}`, fetchOpts);
      };

      const [courseRes, cutsRes, membersRes, lastmanRes, magic2sRes, prizesRes, tabsRes] = await Promise.all([
        fetchConfigWithFallback('course.json', 'course.json'),
        fetchConfigWithFallback('cuts.json', 'cuts.json'),
        fetch(`data/members.json?v=${ts}`, fetchOpts),
        fetchConfigWithFallback('lastman.json', 'lastman_config.json').catch(() => null),
        fetchConfigWithFallback('magic2s.json', 'magic2s_config.json').catch(() => null),
        fetchConfigWithFallback('prizes.json', 'prizes_config.json').catch(() => null),
        fetchConfigWithFallback('tabs.json', 'tabs.json').catch(() => null)
      ]);

      if (!courseRes.ok) throw new Error(`Could not load config/course.json (Status: ${courseRes.status})`);
      if (!cutsRes.ok) throw new Error(`Could not load config/cuts.json (Status: ${cutsRes.status})`);
      if (!membersRes.ok) throw new Error(`Could not load data/members.json (Status: ${membersRes.status})`);

      state.course = await courseRes.json();
      state.cutsConfig = await cutsRes.json();
      state.members = await membersRes.json();

      if (lastmanRes && lastmanRes.ok) {
        try {
          const cfg = await lastmanRes.json();
          state.lastmanConfig = Object.assign({}, state.lastmanConfig, cfg);
        } catch (e) {
          console.warn('Could not parse config/lastman.json', e);
        }
      }

      if (magic2sRes && magic2sRes.ok) {
        try {
          state.magic2sConfig = await magic2sRes.json();
        } catch (e) {
          console.warn('Could not parse config/magic2s.json', e);
        }
      }
      if (!state.magic2sConfig) {
        state.magic2sConfig = DEFAULT_MAGIC2S_CONFIG;
      }

      if (prizesRes && prizesRes.ok) {
        try {
          state.prizesConfig = await prizesRes.json();
        } catch (e) {
          console.warn('Could not parse config/prizes.json', e);
        }
      }
      if (!state.prizesConfig) {
        state.prizesConfig = DEFAULT_PRIZES_CONFIG;
      }

      if (tabsRes && tabsRes.ok) {
        try {
          state.tabsConfig = await tabsRes.json();
        } catch (e) {
          console.warn('Could not parse config/tabs.json', e);
        }
      }
      if (!state.tabsConfig) {
        state.tabsConfig = DEFAULT_TABS_CONFIG;
      }

      // Sequential discovery from 01.json to 20.json
      const loadedWeeks = [];
      for (let w = 1; w <= 20; w++) {
        const weekStr = String(w).padStart(2, '0');
        try {
          const res = await fetch(`data/${weekStr}.json?v=${ts}`, fetchOpts);
          if (!res.ok) {
            break; // Halt on first 404 or missing week
          }
          const weekScores = await res.json();
          loadedWeeks.push({
            weekNum: w,
            weekStr: weekStr,
            rounds: Array.isArray(weekScores) ? weekScores : []
          });
        } catch (fetchErr) {
          break;
        }
      }

      state.weeksData = loadedWeeks;
      state.latestWeek = loadedWeeks.length > 0 ? loadedWeeks[loadedWeeks.length - 1].weekNum : 0;
      state.selectedWeek = state.latestWeek;
      state.leaderboardWeek = state.latestWeek;
      state.eclecticWeek = state.latestWeek;
      state.magic2sWeek = state.latestWeek;
      state.lastmanWeek = state.latestWeek;
      state.parbingoWeek = state.latestWeek;

      // Process business logic & calculations
      processCompetitionEngine();
      updateHeaderMetadata();
      syncLastManSettingsControls();

      elements.loadingState.style.display = 'none';
      renderAllViews();
      applyTabVisibility();

    } catch (err) {
      console.warn('Network fetch failed, falling back to bundled or local dataset:', err);
      if (window.GOLF_DATA && window.GOLF_DATA.course && window.GOLF_DATA.members) {
        loadDataset(window.GOLF_DATA);
      } else {
        loadDataset(FALLBACK_DATA);
        if (elements.localProtocolBanner) {
          elements.localProtocolBanner.style.display = 'flex';
        }
      }
    }
  }

  function loadDataset(dataset) {
    state.course = dataset.course;
    state.cutsConfig = dataset.cutsConfig;
    state.members = dataset.members || [];
    state.weeksData = dataset.weeks || [];
    if (dataset.lastmanConfig) {
      state.lastmanConfig = Object.assign({}, state.lastmanConfig, dataset.lastmanConfig);
    }
    state.magic2sConfig = dataset.magic2sConfig || DEFAULT_MAGIC2S_CONFIG;
    state.prizesConfig = dataset.prizesConfig || DEFAULT_PRIZES_CONFIG;
    state.tabsConfig = dataset.tabsConfig || DEFAULT_TABS_CONFIG;
    state.latestWeek = state.weeksData.length;
    state.selectedWeek = state.latestWeek;
    state.leaderboardWeek = state.latestWeek;
    state.eclecticWeek = state.latestWeek;
    state.magic2sWeek = state.latestWeek;
    state.lastmanWeek = state.latestWeek;
    state.parbingoWeek = state.latestWeek;

    processCompetitionEngine();
    updateHeaderMetadata();
    syncLastManSettingsControls();

    elements.loadingState.style.display = 'none';
    elements.errorState.style.display = 'none';
    renderAllViews();
    applyTabVisibility();

    // Activate tab based on URL hash or first visible tab in configured order
    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    if (hash && document.getElementById(hash)) {
      activateTab(hash);
    } else {
      const ordered = getOrderedTabs();
      const isMobile = window.innerWidth <= 1024;
      const firstVis = ordered.find(t => isMobile ? !isTabHiddenOnMobile(t.id) : !isTabHiddenOnDesktop(t.id));
      if (firstVis) {
        activateTab(firstVis.id);
      }
    }
  }

  /**
   * Competition Calculation Engine
   * Chronologically simulates Week 1 to latestWeek, accumulating cuts and computing Stableford totals.
   */
  function processCompetitionEngine() {
    // Initialize member tracking map
    state.processedMembers.clear();
    state.weeklyResults.clear();

    const memberMap = new Map();
    state.members.forEach(m => {
      memberMap.set(m.memberId, {
        memberId: String(m.memberId),
        name: m.name,
        origHCI: round1(m.origHCI),
        inLeague: Boolean(m.inLeague),
        activeHCI: round1(m.origHCI),
        cumulativeCuts: 0.0,
        weeklyCuts: new Map(), // weekNum -> cut
        weeklyScores: new Map(), // weekNum -> stablefordTotal
        weeklyRounds: new Map(), // weekNum -> roundResult
        leagueScores: [] // All stableford scores achieved: { weekNum, points }
      });
    });

    // Chronological simulation week by week
    state.weeksData.forEach(weekObj => {
      const w = weekObj.weekNum;
      const weekRoundResults = [];

      // Create a lookup for week's scorecards
      const cardMap = new Map();
      weekObj.rounds.forEach(card => {
        cardMap.set(String(card.memberId), card);
      });

      memberMap.forEach((player, mId) => {
        // Player's active HCI entering Week w is origHCI + cumulativeCuts
        const enteringHCI = round1(player.origHCI + player.cumulativeCuts);
        player.activeHCI = enteringHCI;

        const playingHcap = calculatePlayingHandicap(enteringHCI, state.course);

        if (cardMap.has(mId)) {
          const card = cardMap.get(mId);
          const grossScores = card.gross || [];

          // Compute 18-hole Stableford breakdown
          const holePoints = [];
          const holeStrokes = [];
          let grossTotal = 0;
          let stablefordTotal = 0;

          state.course.holes.forEach((hole, idx) => {
            const gross = grossScores[idx] !== undefined ? grossScores[idx] : 0;
            grossTotal += gross;

            // 1. WHS Stroke Allocation based on hole Stroke Index (SI):
            // Every player receives Math.floor(playingHcap / 18) strokes on ALL holes.
            // If playingHcap % 18 >= hole.si, the player receives 1 additional handicap stroke.
            const strokes = Math.floor(playingHcap / 18) + (playingHcap % 18 >= hole.si ? 1 : 0);
            holeStrokes.push(strokes);

            // 2. Stableford Points Formula: Par + Strokes - Gross + 2 (floored at 0 points):
            // - Net Par = 2 points
            // - Net Birdie = 3 points
            // - Net Eagle = 4 points
            // - Net Albatross / Hole-in-One = 5 points
            // - Net Bogey = 1 point
            // - Net Double Bogey or worse = 0 points
            let pts = 0;
            if (gross > 0) {
              pts = Math.max(0, hole.par + strokes - gross + 2);
            }
            holePoints.push(pts);
            stablefordTotal += pts;
          });

          // Countbacks
          const b9 = holePoints.slice(9, 18).reduce((a, b) => a + b, 0);
          const b6 = holePoints.slice(12, 18).reduce((a, b) => a + b, 0);
          const b3 = holePoints.slice(15, 18).reduce((a, b) => a + b, 0);
          const h18 = holePoints[17] || 0;

          // Cut calculation for Week w
          const cutVal = calculateCut(stablefordTotal, enteringHCI, state.cutsConfig);

          // Update player's cuts and scores
          player.weeklyCuts.set(w, cutVal);
          player.weeklyScores.set(w, stablefordTotal);
          player.cumulativeCuts = round1(player.cumulativeCuts + cutVal);

          if (player.inLeague) {
            player.leagueScores.push({ weekNum: w, points: stablefordTotal });
          }

          const roundResult = {
            memberId: mId,
            name: player.name,
            inLeague: player.inLeague,
            weekNum: w,
            enteringHCI: enteringHCI,
            playingHcap: playingHcap,
            playingHandicap: playingHcap,
            grossScores: grossScores,
            grossTotal: grossTotal,
            stablefordTotal: stablefordTotal,
            b9: b9,
            b6: b6,
            b3: b3,
            h18: h18,
            holePoints: holePoints,
            holeStrokes: holeStrokes,
            cut: cutVal,
            prizeMoney: 0,
            magic2sPrize: 0
          };

          player.weeklyRounds.set(w, roundResult);
          weekRoundResults.push(roundResult);

        } else {
          // Did not participate this week: active HCI carries forward unchanged
          player.weeklyCuts.set(w, null);
          player.weeklyScores.set(w, null);
        }
      });

      // Sort and assign ranks for this week's competition
      assignWeeklyRanks(weekRoundResults);
      state.weeklyResults.set(w, weekRoundResults);
    });

    state.processedMembers = memberMap;
    calculateMagic2sPots();
  }

  /**
   * Weekly Tiebreaker Engine & Weekend Sweep Payout (Driven by config/prizes.json)
   * 
   * Sorts players using Scottish Golf / CONGU countback hierarchy:
   * 1. Highest Stableford Total
   * 2. Highest Back 9 points (Holes 10-18)
   * 3. Highest Back 6 points (Holes 13-18)
   * 4. Highest Back 3 points (Holes 16-18)
   * 5. Highest Hole 18 points
   * 6. Alphabetical by player name
   * 
   * Prize Pot Allocation Rules:
   * - Total Pot = Number of Entrants * £2.00 entry fee
   * - 16+ Entrants: 1st (50%), 2nd (30%), 3rd (20%)
   * - 10-15 Entrants: 1st (65%), 2nd (35%)
   * - Under 10 Entrants: Winner takes 100%
   * - Dead Heats / Ties: Prize shares are pooled and split equally among tied players.
   */
  function assignWeeklyRanks(results) {
    results.sort((a, b) => {
      if (b.stablefordTotal !== a.stablefordTotal) return b.stablefordTotal - a.stablefordTotal;
      if (b.b9 !== a.b9) return b.b9 - a.b9;
      if (b.b6 !== a.b6) return b.b6 - a.b6;
      if (b.b3 !== a.b3) return b.b3 - a.b3;
      if (b.h18 !== a.h18) return b.h18 - a.h18;
      return a.name.localeCompare(b.name);
    });

    // Weekend Sweep Prize Pot Rules (driven by state.prizesConfig):
    const sweepCfg = (state.prizesConfig && state.prizesConfig.sweep) ? state.prizesConfig.sweep : DEFAULT_PRIZES_CONFIG.sweep;
    const sweepFee = (sweepCfg && typeof sweepCfg.entryFee === 'number') ? sweepCfg.entryFee : 2.00;
    const entrantsCount = results.length;
    const totalPot = entrantsCount * sweepFee;

    let prizePcts = [];
    const tiers = (sweepCfg && Array.isArray(sweepCfg.tiers)) ? sweepCfg.tiers : [
      { minEntrants: 16, shares: [0.50, 0.30, 0.20] },
      { minEntrants: 10, shares: [0.65, 0.35] }
    ];
    for (const t of tiers) {
      if (entrantsCount >= t.minEntrants) {
        prizePcts = t.shares;
        break;
      }
    }

    let i = 0;
    while (i < results.length) {
      let j = i + 1;
      while (
        j < results.length &&
        results[j].stablefordTotal === results[i].stablefordTotal &&
        results[j].b9 === results[i].b9 &&
        results[j].b6 === results[i].b6 &&
        results[j].b3 === results[i].b3 &&
        results[j].h18 === results[i].h18
      ) {
        j++;
      }

      const tiedGroupSize = j - i;
      const rankStr = tiedGroupSize > 1 ? `T${i + 1}` : `${i + 1}`;

      // Calculate share of prize pool for this tied group
      let playerPrize = 0;
      if (i < prizePcts.length && totalPot > 0) {
        let groupPctSum = 0;
        for (let p = i; p < Math.min(j, prizePcts.length); p++) {
          groupPctSum += prizePcts[p];
        }
        playerPrize = Math.round(((groupPctSum / tiedGroupSize) * totalPot) * 100) / 100;
      }

      for (let k = i; k < j; k++) {
        results[k].pos = rankStr;
        results[k].numericRank = i + 1;
        results[k].prizeMoney = playerPrize;
      }
      i = j;
    }
  }

  /**
   * Main Season Leaderboard Engine (Winter League)
   * 
   * How Winter League Scoring Works:
   * 1. Eligibility:
   *    - Only registered Winter League members (inLeague === true) are included.
   * 2. Historical & Point-in-Time Standings:
   *    - Supports an optional `asOfWeek` parameter (1 to 20). When provided, only rounds
   *      played on or before that week number are evaluated, allowing users to step backward
   *      through the season to inspect historical standings after any given round.
   * 3. Best 10 Counting Scores System:
   *    - For each member, all eligible rounds up to `asOfWeek` are gathered and sorted
   *      in descending order of Stableford points.
   *    - The top 10 scores are selected (or all played scores if fewer than 10 rounds played).
   *    - Total points = sum of these top 10 counting scores.
   * 4. Active Handicap Index at target week:
   *    - Sums all weekly cuts and adjustments applied from Week 1 up to `asOfWeek`,
   *      adding them to the player's starting handicap index (origHCI).
   * 5. Sorting & Tiebreaker Cascade:
   *    - Players with at least 1 round played always place above players with 0 rounds.
   *    - Primary Sort: Highest Best 10 Total points.
   *    - Tiebreaker Cascade: If Totals are equal, the player with the higher individual
   *      best score wins. If still tied, compare 2nd best, then 3rd best, ..., down to 10th best.
   *    - Alphabetical by surname if completely identical across all 10 scores.
   * 6. Rank Assignment:
   *    - "T" prefix (e.g. T1, T2) is assigned ONLY when two or more players have identical
   *      totals AND identical scores across all 10 positions.
   * 
   * @param {number|null} asOfWeek - Week number to compute standings up to (defaults to active week)
   * @returns {Array<Object>} Sorted list of league players with ranks, totals, and best 10 scores
   */
  function getPreparedLeaderboard(asOfWeek) {
    // Determine target week: user-selected historical week, or the latest available week
    const targetWeek = asOfWeek !== undefined && asOfWeek !== null
      ? parseInt(asOfWeek, 10)
      : (state.leaderboardWeek || state.latestWeek);

    const leaguePlayers = [];

    // Step 1: Process each registered Winter League player
    state.processedMembers.forEach(player => {
      // Exclude open club members who have not joined the Winter League
      if (!player.inLeague) return;

      // Filter played rounds up to target historical week
      const eligibleScores = player.leagueScores.filter(s => s.weekNum <= targetWeek);
      const roundsCount = eligibleScores.length;

      // Sort scores descending (highest points first), breaking ties by earlier week number
      const sortedScores = [...eligibleScores].sort((a, b) => b.points - a.points || a.weekNum - b.weekNum);

      // Extract the top 10 counting scores (or all played rounds if < 10)
      const best10 = sortedScores.slice(0, 10);

      // Total points is the sum of the best 10 scores; null if 0 rounds played
      const totalScore = roundsCount > 0 ? best10.reduce((sum, s) => sum + s.points, 0) : null;

      // Accumulate handicap cuts received prior to targetWeek for entering handicap
      let enteringCuts = 0;
      for (let w = 1; w < targetWeek; w++) {
        const c = player.weeklyCuts.get(w);
        if (c !== null && c !== undefined) {
          enteringCuts += c;
        }
      }
      enteringCuts = round1(enteringCuts);
      const enteringHCI = round1(player.origHCI + enteringCuts);

      // Total cuts through targetWeek (for display in Total Cuts column)
      let cumCuts = enteringCuts;
      const thisCut = player.weeklyCuts.get(targetWeek);
      if (thisCut !== null && thisCut !== undefined) {
        cumCuts = round1(cumCuts + thisCut);
      }
      const currentHCI = round1(player.origHCI + cumCuts);

      // Playing strokes received on targetWeek
      const roundAtWeek = player.weeklyRounds ? player.weeklyRounds.get(targetWeek) : null;
      const playingStrokes = roundAtWeek
        ? roundAtWeek.playingHcap
        : calculatePlayingHandicap(enteringHCI, state.course);

      // Total points across all rounds played up to targetWeek
      const allPointsSum = eligibleScores.reduce((sum, s) => sum + s.points, 0);

      // Average score on winter league: sum of all rounds played / rounds played
      const avgScore = roundsCount > 0
        ? (allPointsSum / roundsCount).toFixed(1)
        : '-';

      // Best 10 counting average
      const countingAvg = (roundsCount > 0 && totalScore !== null && best10.length > 0)
        ? (totalScore / best10.length).toFixed(1)
        : '-';

      // Accumulate sweep and magic 2s prize money won up to targetWeek
      let sweepMoney = 0;
      let magic2sMoney = 0;
      if (player.weeklyRounds) {
        player.weeklyRounds.forEach((r, w) => {
          if (w <= targetWeek && r) {
            if (typeof r.prizeMoney === 'number') sweepMoney += r.prizeMoney;
            if (typeof r.magic2sPrize === 'number') magic2sMoney += r.magic2sPrize;
          }
        });
      }
      sweepMoney = Math.round(sweepMoney * 100) / 100;
      magic2sMoney = Math.round(magic2sMoney * 100) / 100;
      const totalMoneyWon = Math.round((sweepMoney + magic2sMoney) * 100) / 100;

      leaguePlayers.push({
        memberId: player.memberId,
        name: player.name,
        surname: getSurname(player.name),
        origHCI: player.origHCI,
        totalCuts: cumCuts,
        currentHCI: currentHCI,
        playingStrokes: playingStrokes,
        rounds: roundsCount,
        total: totalScore,
        avgScore: avgScore,
        allPointsSum: allPointsSum,
        countingAvg: countingAvg,
        overallAvg: avgScore,
        sweepMoney: sweepMoney,
        magic2sMoney: magic2sMoney,
        totalMoneyWon: totalMoneyWon,
        best10: best10,
        allScores: sortedScores
      });
    });

    // Step 2: Leaderboard Sorting Cascade
    leaguePlayers.sort((a, b) => {
      // Rule 1: Active players (rounds > 0) place ahead of 0-round players
      if (a.rounds > 0 && b.rounds === 0) return -1;
      if (a.rounds === 0 && b.rounds > 0) return 1;

      // Rule 2: If both have 0 rounds, sort alphabetically by surname
      if (a.rounds === 0 && b.rounds === 0) {
        return a.surname.localeCompare(b.surname) || a.name.localeCompare(b.name);
      }

      // Rule 3: Primary ranking by Total Stableford Points (descending)
      if (b.total !== a.total) {
        return b.total - a.total;
      }

      // Rule 4: Tiebreaker Cascade — compare best score, then 2nd best, ..., down to 10th best
      for (let k = 0; k < 10; k++) {
        const valA = a.best10[k] !== undefined ? a.best10[k].points : -1;
        const valB = b.best10[k] !== undefined ? b.best10[k].points : -1;
        if (valB !== valA) {
          return valB - valA; // Higher individual score wins the tiebreaker
        }
      }

      // Rule 5: Fallback alphabetical sort if all 10 counting scores are identical
      return a.surname.localeCompare(b.surname) || a.name.localeCompare(b.name);
    });

    // Step 3: Assign Positions (e.g. 1, 2, T3)
    const activeGroup = leaguePlayers.filter(p => p.rounds > 0);
    const zeroGroup = leaguePlayers.filter(p => p.rounds === 0);

    let i = 0;
    while (i < activeGroup.length) {
      let j = i + 1;
      // Group players who share identical totals AND identical 10-score profiles
      while (
        j < activeGroup.length &&
        activeGroup[j].total === activeGroup[i].total &&
        isAll10Identical(activeGroup[j].best10, activeGroup[i].best10)
      ) {
        j++;
      }

      const tiedGroupSize = j - i;
      const rankStr = tiedGroupSize > 1 ? `T${i + 1}` : `${i + 1}`;
      for (let k = i; k < j; k++) {
        activeGroup[k].pos = rankStr;
        activeGroup[k].numericRank = i + 1;
      }
      i = j;
    }

    // Unplayed members receive a dash position
    zeroGroup.forEach(p => {
      p.pos = '-';
      p.numericRank = 9999;
    });

    return [...activeGroup, ...zeroGroup];
  }

  function isAll10Identical(arrA, arrB) {
    for (let k = 0; k < 10; k++) {
      const aVal = arrA[k] !== undefined ? arrA[k].points : null;
      const bVal = arrB[k] !== undefined ? arrB[k].points : null;
      if (aVal !== bVal) return false;
    }
    return true;
  }

  /**
   * Update Header Metadata
   */
  function updateHeaderMetadata() {
    if (state.course) {
      if (elements.metaPar) elements.metaPar.textContent = state.course.par;
      if (elements.metaStrokeLimit) elements.metaStrokeLimit.textContent = state.course.strokeLimit;
    }
    if (elements.metaLatestWeek) {
      if (state.latestWeek > 0) {
        elements.metaLatestWeek.textContent = `Week ${state.latestWeek}`;
      } else {
        elements.metaLatestWeek.textContent = 'Pre-season';
      }
    }
  }

  /**
   * Render All Views
   */
  function renderAllViews() {
    populateLeaderboardWeekSelector();
    renderLeaderboardView();
    populateWeekSelector();
    renderWeeklyView();
    populateEclecticWeekSelector();
    renderEclecticView();
    populateMagic2sWeekSelector();
    renderMagic2sView();
    renderHandicapView();
    renderPlayerTrackerView();
    populateLastManWeekSelector();
    renderLastManView();
    populateParBingoWeekSelector();
    renderParBingoView();
  }

  /**
   * Populate Winter League Week Dropdown and sync Prev/Next buttons
   */
  function populateLeaderboardWeekSelector() {
    if (!elements.leaderboardWeekSelect) return;
    elements.leaderboardWeekSelect.innerHTML = '';
    if (state.weeksData.length === 0) {
      const opt = document.createElement('option');
      opt.value = 0;
      opt.textContent = 'No weeks recorded';
      elements.leaderboardWeekSelect.appendChild(opt);
      return;
    }

    const currentWeek = state.leaderboardWeek || state.latestWeek;
    state.weeksData.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.weekNum;
      opt.textContent = `Week ${w.weekNum}`;
      if (w.weekNum === currentWeek) {
        opt.selected = true;
      }
      elements.leaderboardWeekSelect.appendChild(opt);
    });

    updateLeaderboardNavButtons();
  }

  function updateLeaderboardNavButtons() {
    const currentWeek = state.leaderboardWeek || state.latestWeek;
    if (elements.btnLeaderboardPrev) {
      elements.btnLeaderboardPrev.disabled = currentWeek <= 1;
    }
    if (elements.btnLeaderboardNext) {
      elements.btnLeaderboardNext.disabled = currentWeek >= state.latestWeek;
    }
    if (elements.leaderboardWeekSelect && elements.leaderboardWeekSelect.value !== String(currentWeek)) {
      elements.leaderboardWeekSelect.value = String(currentWeek);
    }
  }

  /**
   * Heatmap color class resolver for Winter League counting scores (1 to 10):
   * - Vivid Green: 37+ (with 40+ as deep emerald)
   * - Medium Green: 34 - 36
   * - Lighter Green around 33: 31 - 33
   * - Yellows to 27: 28 - 30 (soft yellow) and 27 (vibrant yellow)
   * - Reds for scores below that: 24 - 26 (soft red) and < 24 (deep red)
   * 
   * @param {number} points - Stableford points
   * @returns {string} CSS class name
   */
  function getScoreHeatmapClass(points) {
    if (typeof points !== 'number' || isNaN(points)) return 'score-empty';
    if (points >= 40) return 'score-hm-40';
    if (points >= 37) return 'score-hm-37';
    if (points >= 34) return 'score-hm-34';
    if (points >= 31) return 'score-hm-31';
    if (points >= 28) return 'score-hm-28';
    if (points === 27) return 'score-hm-27';
    if (points >= 24) return 'score-hm-24';
    return 'score-hm-low';
  }

  /**
   * View 1: Main Season Leaderboard Renderer
   * Computes standings as of the active state.leaderboardWeek
   */
  function renderLeaderboardView() {
    const asOfWeek = state.leaderboardWeek || state.latestWeek;
    const list = getPreparedLeaderboard(asOfWeek);
    const query = (elements.leaderboardSearch ? elements.leaderboardSearch.value : '').trim().toLowerCase();

    let filtered = query
      ? list.filter(p => p.name.toLowerCase().includes(query))
      : list.slice();

    // Apply interactive column sort if user has clicked a sortable header
    if (state.leaderboardSortCol) {
      const col = state.leaderboardSortCol;
      const isDesc = state.leaderboardSortDir === 'desc';

      filtered.sort((a, b) => {
        let diff = 0;
        if (col === 'pos') {
          // Unplayed / unranked members are pushed to bottom in both sort directions
          const aUnplayed = a.numericRank >= 9999;
          const bUnplayed = b.numericRank >= 9999;
          if (aUnplayed && !bUnplayed) return 1;
          if (!aUnplayed && bUnplayed) return -1;
          if (aUnplayed && bUnplayed) return 0;
          diff = isDesc ? (b.numericRank - a.numericRank) : (a.numericRank - b.numericRank);
        } else if (col === 'cut') {
          diff = isDesc ? (b.totalCuts - a.totalCuts) : (a.totalCuts - b.totalCuts);
        } else if (col === 'round') {
          diff = isDesc ? (b.rounds - a.rounds) : (a.rounds - b.rounds);
        } else if (col === 'total') {
          const aTot = a.rounds > 0 ? (a.total ?? 0) : -999999;
          const bTot = b.rounds > 0 ? (b.total ?? 0) : -999999;
          if (a.rounds === 0 && b.rounds > 0) return 1;
          if (a.rounds > 0 && b.rounds === 0) return -1;
          diff = isDesc ? (bTot - aTot) : (aTot - bTot);
        } else if (col === 'avg') {
          const aAvg = (a.rounds > 0 && a.avgScore !== '-') ? parseFloat(a.avgScore) : -999999;
          const bAvg = (b.rounds > 0 && b.avgScore !== '-') ? parseFloat(b.avgScore) : -999999;
          if (a.rounds === 0 && b.rounds > 0) return 1;
          if (a.rounds > 0 && b.rounds === 0) return -1;
          diff = isDesc ? (bAvg - aAvg) : (aAvg - bAvg);
        } else if (col === 'money') {
          const aMoney = a.totalMoneyWon || 0;
          const bMoney = b.totalMoneyWon || 0;
          diff = isDesc ? (bMoney - aMoney) : (aMoney - bMoney);
        }

        // Secondary tiebreaker: position in standings
        if (diff !== 0) return diff;
        return a.numericRank - b.numericRank;
      });
    }

    // Synchronize sort indicators on table headers
    const sortThs = document.querySelectorAll('#leaderboard-table th.sortable-th');
    sortThs.forEach(th => {
      const col = th.getAttribute('data-sort');
      const icon = th.querySelector('.sort-icon');
      if (state.leaderboardSortCol === col) {
        th.classList.add('sort-active');
        if (icon) {
          icon.textContent = state.leaderboardSortDir === 'desc' ? ' ▼' : ' ▲';
        }
      } else {
        th.classList.remove('sort-active');
        if (icon) {
          icon.textContent = '';
        }
      }
    });

    // Subtitle indicator
    if (elements.leaderboardSubtitle) {
      if (asOfWeek === state.latestWeek) {
        elements.leaderboardSubtitle.textContent = 'Best 10 stableford scores';
      } else {
        elements.leaderboardSubtitle.innerHTML = `<span class="badge" style="background:#fef3c7; color:#b45309; font-weight:700; margin-right:6px;">Historical: Round ${asOfWeek}</span> Best 10 stableford scores`;
      }
    }

    // Keep nav buttons & select synchronized
    updateLeaderboardNavButtons();

    // Previous week rank lookup for movement indicator
    let prevRankMap = null;
    if (asOfWeek > 1) {
      const prevList = getPreparedLeaderboard(asOfWeek - 1);
      prevRankMap = new Map(prevList.map(p => [p.memberId, p.numericRank]));
    }

    // Render Table Rows
    elements.leaderboardTbody.innerHTML = '';
    if (filtered.length === 0) {
      elements.leaderboardTbody.innerHTML = `
        <tr>
          <td colspan="18" class="empty-state">No matching league participants found.</td>
        </tr>
      `;
      return;
    }

    filtered.forEach(p => {
      const tr = document.createElement('tr');

      let rankClass = '';
      if (p.numericRank === 1) rankClass = 'rank-top-1';
      else if (p.numericRank === 2) rankClass = 'rank-top-2';
      else if (p.numericRank === 3) rankClass = 'rank-top-3';

      let rankTitle = `Position: ${p.pos}`;
      let rankChangeHtml = '';
      if (prevRankMap && p.numericRank < 9999) {
        const prevRank = prevRankMap.get(p.memberId);
        if (prevRank !== undefined && prevRank < 9999) {
          const diff = prevRank - p.numericRank;
          if (diff > 0) {
            rankTitle += ` (▲ Up ${diff} place${diff > 1 ? 's' : ''} from Week ${asOfWeek - 1})`;
            rankChangeHtml = ` <span class="rank-change-chip rank-change-up" title="Up ${diff} place${diff > 1 ? 's' : ''} from Week ${asOfWeek - 1}">▲${diff}</span>`;
          } else if (diff < 0) {
            const absDiff = Math.abs(diff);
            rankTitle += ` (▼ Down ${absDiff} place${absDiff > 1 ? 's' : ''} from Week ${asOfWeek - 1})`;
            rankChangeHtml = ` <span class="rank-change-chip rank-change-down" title="Down ${absDiff} place${absDiff > 1 ? 's' : ''} from Week ${asOfWeek - 1}">▼${absDiff}</span>`;
          } else {
            rankTitle += ` (Unchanged from Week ${asOfWeek - 1})`;
          }
        } else {
          rankTitle += ` (New entrant in Week ${asOfWeek})`;
        }
      }

      const totalCutsHtml = p.totalCuts < 0
        ? `<span class="cut-val">${p.totalCuts.toFixed(1)}</span>`
        : (p.totalCuts > 0
            ? `<span class="increase-val">+${p.totalCuts.toFixed(1)}</span>`
            : `<span class="no-cut">0.0</span>`);

      // 10 counting scores (rendered as color-coded heatmap chips)
      let scoresHtml = '';
      for (let k = 0; k < 10; k++) {
        const s = p.best10[k];
        if (s !== undefined) {
          const hmClass = getScoreHeatmapClass(s.points);
          scoresHtml += `<td class="text-center score-col"><span class="score-chip ${hmClass}" title="Week ${s.weekNum}: ${s.points} pts">${s.points}</span></td>`;
        } else {
          scoresHtml += `<td class="text-center score-col"><span class="score-chip score-empty">-</span></td>`;
        }
      }

      const avgTip = p.rounds > 0
        ? `Season Average: ${p.avgScore} pts (${p.allPointsSum} total points / ${p.rounds} round${p.rounds > 1 ? 's' : ''} played) • Best 10 Avg: ${p.countingAvg} pts`
        : 'No rounds played';

      const moneyTip = p.totalMoneyWon > 0
        ? `Combined Winnings: £${p.totalMoneyWon.toFixed(2)} (Weekend Sweep: £${p.sweepMoney.toFixed(2)} • Magic 2s: £${p.magic2sMoney.toFixed(2)})`
        : 'No prize winnings';

      const avgDisplay = p.avgScore !== '-'
        ? `<strong style="font-variant-numeric: tabular-nums;">${p.avgScore}</strong>`
        : `<span style="color: var(--text-light);">-</span>`;

      const moneyDisplay = p.totalMoneyWon > 0
        ? `<strong style="color: #166534; font-variant-numeric: tabular-nums;">£${p.totalMoneyWon.toFixed(2)}</strong>`
        : `<span style="color: var(--text-light);">-</span>`;

      // Hi/Lo score computation for mobile column: Best score / 10th best score (e.g. 40/30)
      let hiLoHtml = '-';
      let hiLoTip = 'No rounds played';
      if (p.best10 && p.best10.length > 0) {
        const hi = p.best10[0].points;
        const lo = p.best10.length >= 10 ? p.best10[9].points : '-';
        hiLoHtml = `<strong style="font-variant-numeric: tabular-nums;">${hi}</strong><span style="opacity: 0.5; margin: 0 1px;">/</span><strong style="font-variant-numeric: tabular-nums;">${lo}</strong>`;
        hiLoTip = p.best10.length >= 10
          ? `Best Score: ${hi} pts • 10th Best Score (Floor): ${lo} pts`
          : `Best Score: ${hi} pts • (${p.best10.length}/10 counting rounds played)`;
      }

      tr.className = 'clickable-row';
      tr.title = `${rankTitle} • Click to view counting scores & scoring breakdown`;
      tr.innerHTML = `
        <td class="text-center"><span class="rank-badge ${rankClass}" title="${escapeHtml(rankTitle)}">${p.pos}</span></td>
        <td class="sticky-col-name player-name-cell">${escapeHtml(p.name)} <span class="player-hci">(${p.playingStrokes})</span>${rankChangeHtml}</td>
        <td class="text-center total-cut-cell">${totalCutsHtml}</td>
        <td class="text-center rounds-col">${p.rounds}</td>
        <td class="text-center avg-col col-desktop-only" title="${escapeHtml(avgTip)}">${avgDisplay}</td>
        <td class="text-center money-col col-desktop-only" title="${escapeHtml(moneyTip)}">${moneyDisplay}</td>
        ${scoresHtml}
        <td class="text-center total-score-cell">${p.total !== null ? p.total : '-'}</td>
        <td class="text-center hilo-col hilo-cell col-mobile-only" title="${escapeHtml(hiLoTip)}">${hiLoHtml}</td>
      `;

      tr.addEventListener('click', () => {
        toggleLeaderboardAccordion(tr, p);
      });

      elements.leaderboardTbody.appendChild(tr);
    });
  }

  /**
   * Populate Week Dropdown
   */
  function populateWeekSelector() {
    elements.weekSelect.innerHTML = '';
    if (state.weeksData.length === 0) {
      const opt = document.createElement('option');
      opt.value = 0;
      opt.textContent = 'No weeks recorded';
      elements.weekSelect.appendChild(opt);
      return;
    }

    state.weeksData.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.weekNum;
      opt.textContent = `Week ${w.weekNum}`;
      if (w.weekNum === state.selectedWeek) {
        opt.selected = true;
      }
      elements.weekSelect.appendChild(opt);
    });

    updateWeeklyNavButtons();
  }

  function updateWeeklyNavButtons() {
    const currentWeek = state.selectedWeek || state.latestWeek;
    if (elements.btnWeeklyPrev) {
      elements.btnWeeklyPrev.disabled = currentWeek <= 1;
    }
    if (elements.btnWeeklyNext) {
      elements.btnWeeklyNext.disabled = currentWeek >= state.latestWeek;
    }
    if (elements.weekSelect && elements.weekSelect.value !== String(currentWeek)) {
      elements.weekSelect.value = String(currentWeek);
    }
  }

  /**
   * View 2: Weekly Competition Renderer
   */
  function renderWeeklyView() {
    updateWeeklyNavButtons();

    const weekNum = parseInt(state.selectedWeek, 10);
    const results = state.weeklyResults.get(weekNum) || [];
    const query = (elements.weeklySearch.value || '').trim().toLowerCase();
    const hideNonLeague = elements.weeklyHideNonLeague ? elements.weeklyHideNonLeague.checked : false;

    // Subtitle with sweep pot breakdown
    if (elements.weeklySubtitle) {
      const sweepCfg = (state.prizesConfig && state.prizesConfig.sweep) ? state.prizesConfig.sweep : DEFAULT_PRIZES_CONFIG.sweep;
      const sweepFee = (sweepCfg && typeof sweepCfg.entryFee === 'number') ? sweepCfg.entryFee : 2.00;
      const entrantsCount = results.length;
      const totalPot = (entrantsCount * sweepFee).toFixed(2);
      elements.weeklySubtitle.textContent = `Individual Stableford • ${entrantsCount} entrants • Sweep Pot: £${totalPot} • Click row for scorecard`;
    }

    let filtered = results;
    if (hideNonLeague) {
      filtered = filtered.filter(r => r.inLeague);
    }
    if (query) {
      filtered = filtered.filter(r => r.name.toLowerCase().includes(query));
    }

    elements.weeklyTbody.innerHTML = '';
    if (filtered.length === 0) {
      elements.weeklyTbody.innerHTML = `
        <tr>
          <td colspan="23" class="empty-state">No scorecards found for this week.</td>
        </tr>
      `;
      return;
    }

    filtered.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'clickable-row';
      tr.title = 'Click to view hole-by-hole scorecard';

      let rankClass = '';
      if (r.numericRank === 1) rankClass = 'rank-top-1';
      else if (r.numericRank === 2) rankClass = 'rank-top-2';
      else if (r.numericRank === 3) rankClass = 'rank-top-3';

      let holeCellsHtml = '';
      if (r.holePoints && r.holePoints.length >= 18) {
        for (let h = 0; h < 18; h++) {
          const pt = r.holePoints[h] !== undefined ? r.holePoints[h] : '-';
          const tip = buildHoleTooltip(r, h);
          holeCellsHtml += `<td class="text-center hole-col" title="${escapeHtml(tip)}">${renderPointChip(pt)}</td>`;
        }
      } else {
        for (let h = 0; h < 18; h++) {
          holeCellsHtml += `<td class="text-center hole-col" style="color: var(--text-light);">-</td>`;
        }
      }

      const prizeBadgeHtml = (r.prizeMoney && r.prizeMoney > 0)
        ? ` <span class="sweep-prize-badge" title="Weekend Sweep Prize: £${r.prizeMoney.toFixed(2)}">💰 £${r.prizeMoney.toFixed(2)}</span>`
        : '';

      const cutDisplay = r.cut < 0
        ? `<span class="cut-val">${r.cut.toFixed(1)}</span>`
        : '';

      tr.innerHTML = `
        <td class="text-center"><span class="rank-badge ${rankClass}">${r.pos}</span></td>
        <td class="sticky-col-name player-name-cell">${escapeHtml(r.name)} <span class="player-hci">(${r.playingHcap})</span>${prizeBadgeHtml}</td>
        ${holeCellsHtml}
        <td class="text-center total-score-cell">${r.stablefordTotal}</td>
        <td class="text-center countback-col tiebreaker-val">(${r.b9}/${r.b6}/${r.b3})</td>
        <td class="text-center">${cutDisplay}</td>
      `;

      tr.addEventListener('click', () => {
        toggleAccordion(tr, r);
      });

      elements.weeklyTbody.appendChild(tr);
    });
  }

  /**
   * Populate Eclectic Week Dropdown and sync Prev/Next buttons
   */
  function populateEclecticWeekSelector() {
    if (!elements.eclecticWeekSelect) return;
    elements.eclecticWeekSelect.innerHTML = '';
    if (state.weeksData.length === 0) {
      const opt = document.createElement('option');
      opt.value = 0;
      opt.textContent = 'No weeks recorded';
      elements.eclecticWeekSelect.appendChild(opt);
      return;
    }

    const currentWeek = state.eclecticWeek || state.latestWeek;
    state.weeksData.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.weekNum;
      opt.textContent = `Week ${w.weekNum}`;
      if (w.weekNum === currentWeek) {
        opt.selected = true;
      }
      elements.eclecticWeekSelect.appendChild(opt);
    });

    updateEclecticNavButtons();
  }

  function updateEclecticNavButtons() {
    const currentWeek = state.eclecticWeek || state.latestWeek;
    if (elements.btnEclecticPrev) {
      elements.btnEclecticPrev.disabled = currentWeek <= 1;
    }
    if (elements.btnEclecticNext) {
      elements.btnEclecticNext.disabled = currentWeek >= state.latestWeek;
    }
    if (elements.eclecticWeekSelect && elements.eclecticWeekSelect.value !== String(currentWeek)) {
      elements.eclecticWeekSelect.value = String(currentWeek);
    }
  }

  /**
   * Build Eclectic Table Headers with Hole info & Pars
   */
  function buildEclecticThead() {
    if (!elements.eclecticTheadTr) return;
    const holes = (state.course && Array.isArray(state.course.holes)) ? state.course.holes : [];

    let html = `
      <th class="text-center pos-col sortable-th" data-sort="pos" style="width: 4%;" title="Click to sort by Position (Low to High / High to Low)"><span class="th-full">Pos</span><span class="th-short">Pos</span><span class="sort-icon"></span></th>
      <th class="sticky-col-name player-name-col" style="width: 18%;"><span class="th-full">Player Name</span><span class="th-short">Player</span></th>
      <th class="text-center rounds-col sortable-th" data-sort="rounds" style="width: 5%;" title="Click to sort by Rounds Played (High to Low / Low to High)"><span class="th-full">Rounds</span><span class="th-short">Rounds</span><span class="sort-icon"></span></th>
      <th class="text-center total-score-col points-col sortable-th" data-sort="points" style="width: 5.5%;" title="Click to sort by Eclectic Points (High to Low / Low to High)"><span class="th-full">Points</span><span class="th-short">Pts</span><span class="sort-icon"></span></th>
      <th class="text-center total-score-col nett-col sortable-th" data-sort="nett" style="width: 5.5%;" title="Click to sort by Nett Points (High to Low / Low to High)"><span class="th-full">Nett</span><span class="th-short">Nett</span><span class="sort-icon"></span></th>
    `;

    // 18 Holes
    for (let h = 0; h < 18; h++) {
      const hole = holes[h];
      const par = hole ? hole.par : '-';
      const si = hole ? hole.si : '-';
      html += `<th class="text-center hole-col" title="Hole ${h + 1} (Par ${par}, SI ${si})">${h + 1}</th>`;
    }

    elements.eclecticTheadTr.innerHTML = html;
  }

  /**
   * Eclectic Competition Calculation Engine
   * 
   * How Eclectic Scoring Works:
   * 1. Purpose:
   *    - Compiles a "dream card" for each player by taking their personal highest
   *      Stableford score recorded on each of the 18 holes across all rounds played up to `asOfWeek`.
   * 2. Scoring Modes:
   *    - 'nett' (Default Mode):
   *      Ranked primarily by Nett Score = (Eclectic Total Points - Active Playing Handicap Strokes).
   *      If two players tie on Nett, the secondary tiebreaker is Eclectic Total Points (Gross).
   *    - 'total' (Gross Points Mode):
   *      Ranked primarily by Eclectic Total Points (Gross).
   *      If two players tie on Total, the secondary tiebreaker is Nett Score.
   * 3. Countback Cascade:
   *    - If players remain tied after primary and secondary checks, the countback cascade
   *      evaluates points on Back 9 (Holes 10-18), then Back 6 (Holes 13-18), then Back 3 (Holes 16-18),
   *      and finally Hole 18.
   * 4. Handicap Adjustment at Target Week:
   *    - Cumulative cuts received up to `targetWeek` are applied to the player's starting HCI.
   *    - Playing Handicap strokes are computed using the official WHS formula for Port Glasgow Golf Club.
   * 
   * @param {number|null} asOfWeek - Historical week number (defaults to active eclectic week)
   * @param {string} scoringMode - 'nett' or 'total'
   * @returns {Array<Object>} Sorted list of players with best 18-hole scores, totals, nett, and ranks
   */
  function getPreparedEclectic(asOfWeek, scoringMode) {
    const targetWeek = asOfWeek !== undefined && asOfWeek !== null
      ? parseInt(asOfWeek, 10)
      : (state.eclecticWeek || state.latestWeek);

    const mode = scoringMode || state.eclecticScoringMode || 'nett';
    const isNettMode = mode === 'nett';

    const list = [];

    // Step 1: Evaluate each player's played rounds
    state.processedMembers.forEach(player => {
      // Gather all valid 18-hole rounds played on or before targetWeek
      const eligibleRounds = [];
      if (player.weeklyRounds) {
        player.weeklyRounds.forEach((r, w) => {
          if (w <= targetWeek && r && Array.isArray(r.holePoints) && r.holePoints.length >= 18) {
            eligibleRounds.push(r);
          }
        });
      }

      const roundsCount = eligibleRounds.length;
      const bestHoles = Array(18).fill(null);
      let outTotal = 0;
      let inTotal = 0;
      let eclecticTotal = 0;

      // Extract the highest Stableford point value achieved on each hole
      if (roundsCount > 0) {
        for (let h = 0; h < 18; h++) {
          let maxVal = null;
          for (let i = 0; i < eligibleRounds.length; i++) {
            const val = eligibleRounds[i].holePoints[h];
            if (val !== undefined && val !== null) {
              if (maxVal === null || val > maxVal) {
                maxVal = val;
              }
            }
          }
          bestHoles[h] = maxVal;
        }

        // Subtotals: Front 9 (Holes 1-9), Back 9 (Holes 10-18), and 18-Hole Total
        outTotal = bestHoles.slice(0, 9).reduce((sum, p) => sum + (p !== null ? p : 0), 0);
        inTotal = bestHoles.slice(9, 18).reduce((sum, p) => sum + (p !== null ? p : 0), 0);
        eclecticTotal = outTotal + inTotal;
      }

      // Countback metrics for tiebreaking
      const b9 = inTotal;
      const b6 = bestHoles.slice(12, 18).reduce((sum, p) => sum + (p !== null ? p : 0), 0);
      const b3 = bestHoles.slice(15, 18).reduce((sum, p) => sum + (p !== null ? p : 0), 0);
      const h18 = bestHoles[17] !== null ? bestHoles[17] : 0;

      // Compute player's active handicap and playing strokes as of targetWeek
      let cutsPriorToTarget = 0.0;
      if (player.weeklyCuts) {
        player.weeklyCuts.forEach((cutVal, w) => {
          if (w < targetWeek && cutVal !== null && cutVal !== undefined) {
            cutsPriorToTarget += cutVal;
          }
        });
      }
      const enteringHciAtWeek = round1(player.origHCI + cutsPriorToTarget);
      const roundAtWeek = player.weeklyRounds ? player.weeklyRounds.get(targetWeek) : null;
      const playingStrokesAtWeek = roundAtWeek
        ? roundAtWeek.playingHcap
        : calculatePlayingHandicap(enteringHciAtWeek, state.course);

      let cutsUpToTarget = cutsPriorToTarget;
      const thisCut = player.weeklyCuts ? player.weeklyCuts.get(targetWeek) : null;
      if (thisCut !== null && thisCut !== undefined) {
        cutsUpToTarget = round1(cutsUpToTarget + thisCut);
      }
      const activeHciAtWeek = round1(player.origHCI + cutsUpToTarget);
      const nettTotal = roundsCount > 0 ? (eclecticTotal - playingStrokesAtWeek) : null;

      list.push({
        memberId: player.memberId,
        name: player.name,
        inLeague: player.inLeague,
        currentHCI: activeHciAtWeek,
        playingStrokes: playingStrokesAtWeek,
        rounds: roundsCount,
        bestHoles: bestHoles,
        outTotal: outTotal,
        inTotal: inTotal,
        total: eclecticTotal,
        nett: nettTotal,
        b9: b9,
        b6: b6,
        b3: b3,
        h18: h18
      });
    });

    const activePlayers = list.filter(p => p.rounds > 0);
    const inactivePlayers = list.filter(p => p.rounds === 0);

    // Step 2: Sort active players based on active scoring mode and tiebreakers
    activePlayers.sort((a, b) => {
      if (isNettMode) {
        // 1. Primary: Nett DESC
        if (b.nett !== a.nett) return (b.nett ?? -999) - (a.nett ?? -999);
        // 2. Secondary tiebreak: Total DESC
        if (b.total !== a.total) return b.total - a.total;
      } else {
        // 1. Primary: Total DESC
        if (b.total !== a.total) return b.total - a.total;
        // 2. Secondary tiebreak: Nett DESC
        if (b.nett !== a.nett) return (b.nett ?? -999) - (a.nett ?? -999);
      }
      // Countback tiebreak: Back 9 > Back 6 > Back 3 > Hole 18
      if (b.b9 !== a.b9) return b.b9 - a.b9;
      if (b.b6 !== a.b6) return b.b6 - a.b6;
      if (b.b3 !== a.b3) return b.b3 - a.b3;
      if (b.h18 !== a.h18) return b.h18 - a.h18;
      return getSurname(a.name).localeCompare(getSurname(b.name)) || a.name.localeCompare(b.name);
    });

    inactivePlayers.sort((a, b) => getSurname(a.name).localeCompare(getSurname(b.name)) || a.name.localeCompare(b.name));

    // Assign rank badges with tied position support
    let i = 0;
    while (i < activePlayers.length) {
      let j = i + 1;
      while (
        j < activePlayers.length &&
        (isNettMode ? (activePlayers[j].nett === activePlayers[i].nett && activePlayers[j].total === activePlayers[i].total)
                    : (activePlayers[j].total === activePlayers[i].total && activePlayers[j].nett === activePlayers[i].nett)) &&
        activePlayers[j].b9 === activePlayers[i].b9 &&
        activePlayers[j].b6 === activePlayers[i].b6 &&
        activePlayers[j].b3 === activePlayers[i].b3 &&
        activePlayers[j].h18 === activePlayers[i].h18
      ) {
        j++;
      }

      const tiedGroupSize = j - i;
      const rankStr = tiedGroupSize > 1 ? `T${i + 1}` : `${i + 1}`;
      for (let k = i; k < j; k++) {
        activePlayers[k].pos = rankStr;
        activePlayers[k].numericRank = i + 1;
      }
      i = j;
    }

    inactivePlayers.forEach(p => {
      p.pos = '-';
      p.numericRank = 9999;
    });

    return [...activePlayers, ...inactivePlayers];
  }

  /**
   * View: Eclectic Competition Renderer
   */
  function renderEclecticView() {
    if (!elements.eclecticTbody) return;

    buildEclecticThead();

    const asOfWeek = state.eclecticWeek || state.latestWeek;
    const scoringMode = (elements.eclecticScoringMode ? elements.eclecticScoringMode.value : '') || state.eclecticScoringMode || 'nett';
    state.eclecticScoringMode = scoringMode;
    const isNettMode = scoringMode === 'nett';

    // Synchronize scoring mode dropdown if needed
    if (elements.eclecticScoringMode && elements.eclecticScoringMode.value !== scoringMode) {
      elements.eclecticScoringMode.value = scoringMode;
    }

    const list = getPreparedEclectic(asOfWeek, scoringMode);
    const query = (elements.eclecticSearch ? elements.eclecticSearch.value : '').trim().toLowerCase();

    // Subtitle indicator
    if (elements.eclecticSubtitle) {
      const modeDesc = isNettMode ? 'Winner: Nett (tiebreak by Points)' : 'Winner: Points (tiebreak by Nett)';
      if (asOfWeek === state.latestWeek) {
        elements.eclecticSubtitle.textContent = `Each member's best Stableford score recorded on each hole • ${modeDesc}`;
      } else {
        elements.eclecticSubtitle.innerHTML = `<span class="badge" style="background:#fef3c7; color:#b45309; font-weight:700; margin-right:6px;">Historical: Round ${asOfWeek}</span> State of play after Round ${asOfWeek} of ${state.latestWeek} • ${modeDesc}`;
      }
    }

    // Keep nav buttons & select synchronized
    updateEclecticNavButtons();

    // Apply Filter & Search (unplayed members hidden by default)
    const hideNonLeague = elements.eclecticHideNonLeague ? elements.eclecticHideNonLeague.checked : false;
    let filtered = list.filter(p => p.rounds > 0);

    if (hideNonLeague) {
      filtered = filtered.filter(p => p.inLeague);
    }

    if (query) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }

    // Apply interactive column sort if user has clicked a sortable header
    if (state.eclecticSortCol) {
      const col = state.eclecticSortCol;
      const isDesc = state.eclecticSortDir === 'desc';

      filtered.sort((a, b) => {
        let diff = 0;
        if (col === 'pos') {
          // Lower rank = winner: 1st click sorts smallest to largest (asc)
          const aUnplayed = a.numericRank >= 9999;
          const bUnplayed = b.numericRank >= 9999;
          if (aUnplayed && !bUnplayed) return 1;
          if (!aUnplayed && bUnplayed) return -1;
          if (aUnplayed && bUnplayed) return 0;
          diff = isDesc ? (b.numericRank - a.numericRank) : (a.numericRank - b.numericRank);
        } else if (col === 'rounds') {
          diff = isDesc ? (b.rounds - a.rounds) : (a.rounds - b.rounds);
        } else if (col === 'points') {
          const aPts = a.rounds > 0 ? (a.total ?? 0) : -999999;
          const bPts = b.rounds > 0 ? (b.total ?? 0) : -999999;
          diff = isDesc ? (bPts - aPts) : (aPts - bPts);
        } else if (col === 'nett') {
          const aNett = (a.rounds > 0 && a.nett !== null) ? a.nett : -999999;
          const bNett = (b.rounds > 0 && b.nett !== null) ? b.nett : -999999;
          diff = isDesc ? (bNett - aNett) : (aNett - bNett);
        }

        // Secondary tiebreaker: standings rank
        if (diff !== 0) return diff;
        return a.numericRank - b.numericRank;
      });
    }

    // Synchronize sort indicators on eclectic table headers
    const sortThs = document.querySelectorAll('#eclectic-table th.sortable-th');
    sortThs.forEach(th => {
      const col = th.getAttribute('data-sort');
      const icon = th.querySelector('.sort-icon');
      if (state.eclecticSortCol === col) {
        th.classList.add('sort-active');
        if (icon) {
          icon.textContent = state.eclecticSortDir === 'desc' ? ' ▼' : ' ▲';
        }
      } else {
        th.classList.remove('sort-active');
        if (icon) {
          icon.textContent = '';
        }
      }
    });

    // Previous week rank lookup for movement indicator
    let prevRankMap = null;
    if (asOfWeek > 1) {
      const prevList = getPreparedEclectic(asOfWeek - 1, scoringMode);
      prevRankMap = new Map(prevList.map(p => [p.memberId, p.numericRank]));
    }

    // Render Table Rows
    elements.eclecticTbody.innerHTML = '';
    if (filtered.length === 0) {
      elements.eclecticTbody.innerHTML = `
        <tr>
          <td colspan="23" class="empty-state">No matching members found for current filter.</td>
        </tr>
      `;
      return;
    }

    filtered.forEach(p => {
      const tr = document.createElement('tr');

      let rankClass = '';
      if (p.numericRank === 1) rankClass = 'rank-top-1';
      else if (p.numericRank === 2) rankClass = 'rank-top-2';
      else if (p.numericRank === 3) rankClass = 'rank-top-3';

      let rankTitle = `Position: ${p.pos}`;
      if (prevRankMap && p.numericRank < 9999) {
        const prevRank = prevRankMap.get(p.memberId);
        if (prevRank !== undefined && prevRank < 9999) {
          const diff = prevRank - p.numericRank;
          if (diff > 0) {
            rankTitle += ` (▲ Up ${diff} place${diff > 1 ? 's' : ''} from Week ${asOfWeek - 1})`;
          } else if (diff < 0) {
            rankTitle += ` (▼ Down ${Math.abs(diff)} place${Math.abs(diff) > 1 ? 's' : ''} from Week ${asOfWeek - 1})`;
          } else {
            rankTitle += ` (Unchanged from Week ${asOfWeek - 1})`;
          }
        } else {
          rankTitle += ` (New entrant in Week ${asOfWeek})`;
        }
      }

      // Holes 1 to 18
      let holesHtml = '';
      for (let h = 0; h < 18; h++) {
        const pt = p.bestHoles[h];
        holesHtml += `<td class="text-center hole-col">${renderPointChip(pt)}</td>`;
      }

      const totalHtml = p.rounds > 0
        ? `<strong style="color: var(--text-dark); font-size: 0.98rem; font-variant-numeric: tabular-nums;" title="Eclectic Total Stableford points">${p.total}</strong>`
        : `<span style="color: var(--text-light);">-</span>`;

      const nettHtml = (p.rounds > 0 && p.nett !== null)
        ? `<strong style="color: var(--text-dark); font-size: 0.98rem; font-variant-numeric: tabular-nums;" title="Nett Score: ${p.total} points - ${p.playingStrokes} strokes = ${p.nett}">${p.nett}</strong>`
        : `<span style="color: var(--text-light);">-</span>`;

      tr.className = 'clickable-row';
      tr.title = `${rankTitle} • Click to view eclectic scorecard breakdown`;
      tr.innerHTML = `
        <td class="text-center"><span class="rank-badge ${rankClass}" title="${escapeHtml(rankTitle)}">${p.pos}</span></td>
        <td class="sticky-col-name player-name-cell">${escapeHtml(p.name)} <span class="player-hci">(${p.playingStrokes})</span></td>
        <td class="text-center rounds-col font-bold">${p.rounds}</td>
        <td class="text-center total-score-cell points-cell">${totalHtml}</td>
        <td class="text-center total-score-cell nett-cell">${nettHtml}</td>
        ${holesHtml}
      `;

      tr.addEventListener('click', () => {
        toggleEclecticAccordion(tr, p);
      });

      elements.eclecticTbody.appendChild(tr);
    });
  }

  /**
   * Populate Magic 2's Week Dropdown and sync Prev/Next buttons
   */
  function populateMagic2sWeekSelector() {
    if (!elements.magic2sWeekSelect) return;
    elements.magic2sWeekSelect.innerHTML = '';
    if (state.weeksData.length === 0) {
      const opt = document.createElement('option');
      opt.value = 0;
      opt.textContent = 'No weeks recorded';
      elements.magic2sWeekSelect.appendChild(opt);
      return;
    }

    const currentWeek = state.magic2sWeek || state.latestWeek;
    state.weeksData.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.weekNum;
      opt.textContent = `Week ${w.weekNum}`;
      if (w.weekNum === currentWeek) {
        opt.selected = true;
      }
      elements.magic2sWeekSelect.appendChild(opt);
    });

    updateMagic2sNavButtons();
  }

  function updateMagic2sNavButtons() {
    const currentWeek = state.magic2sWeek || state.latestWeek;
    if (elements.btnMagic2sPrev) {
      elements.btnMagic2sPrev.disabled = currentWeek <= 1;
    }
    if (elements.btnMagic2sNext) {
      elements.btnMagic2sNext.disabled = currentWeek >= state.latestWeek;
    }
    if (elements.magic2sWeekSelect && elements.magic2sWeekSelect.value !== String(currentWeek)) {
      elements.magic2sWeekSelect.value = String(currentWeek);
    }
  }

  /**
   * Magic 2's Competition Engine & Prize Pot Processor
   * 
   * How Magic 2's Works:
   * 1. Entry Fee & Prize Fund Mechanics:
   *    - Driven by config/prizes.json (default £1.00 per entrant).
   *    - Total Magic 2's Fund = (Total Entrants [Open + League]) x £1.00.
   *    - Weekly League Prize Pot = (League Entrants) x £1.00.
   *    - End of Season Fund = Total Magic 2's Fund - Weekly League Prize Pot (accumulates weekly).
   * 2. Eligibility to Win:
   *    - ONLY registered Winter League members (inLeague === true) can win shares of the prize pot.
   * 3. Qualifying Holes for Magic 2's:
   *    - 3 Par 3 holes are drawn for each week from config/magic2s.json. A gross score of 2 on
   *      any of these 3 drawn holes qualifies.
   *    - Bonus Twos: Any gross score of 2 on Par 4 or Par 5 holes also qualifies as a bonus.
   * 4. Multi-Share & Equal Distribution:
   *    - Every qualifying 2 earns 1 equal share of that week's total available pot.
   *    - If a player cards two 2s on eligible holes, they receive 2 shares.
   * 5. Rollover Engine:
   *    - If no eligible 2s are scored by league members in a week, the ENTIRE pot (weekly pot + any
   *      accumulated rollover) rolls forward to the next round.
   * 
   * @returns {void} Populates state.magic2sWeeklyPots map for all weeks 1 to latestWeek
   */
  function calculateMagic2sPots() {
    state.magic2sWeeklyPots.clear();
    const cfg = state.magic2sConfig || DEFAULT_MAGIC2S_CONFIG;
    const prizesCfg = state.prizesConfig || DEFAULT_PRIZES_CONFIG;
    const magic2sFee = (prizesCfg.magic2s && typeof prizesCfg.magic2s.entryFee === 'number')
      ? prizesCfg.magic2s.entryFee
      : 1.00;
    const allowPar4and5 = (cfg && cfg.allowPar4And5Twos !== undefined) ? cfg.allowPar4And5Twos : true;
    const courseHoles = (state.course && Array.isArray(state.course.holes)) ? state.course.holes : [];

    let rollover = 0.0;
    let cumulativeEndOfSeason = 0.0;

    // Process every completed week chronologically so rollovers carry forward accurately
    for (let w = 1; w <= state.latestWeek; w++) {
      const results = state.weeklyResults.get(w) || [];
      const drawnHoles = (cfg && cfg.weeks && cfg.weeks[String(w)]) ? cfg.weeks[String(w)] : [];

      const totalEntrants = results.length;
      const leagueEntrants = results.filter(r => r.inLeague).length;
      const nonLeagueEntrants = totalEntrants - leagueEntrants;

      // 1. Magic 2's Fund: All entrants in the field contribute £1
      const magic2sFund = totalEntrants * magic2sFee;

      // 2. Weekly League Prize Pot: League members' portion
      const weeklyPrizePot = leagueEntrants * magic2sFee;

      // 3. End of Season Fund: Non-league contributions accumulate for season-end prizes
      const endOfSeasonWeekly = magic2sFund - weeklyPrizePot;
      cumulativeEndOfSeason += endOfSeasonWeekly;

      // 4. Available Weekly Prize Pot: current weekly pot + rollover from previous unwon rounds
      const rolloverIn = rollover;
      const totalAvailablePot = weeklyPrizePot + rolloverIn;

      const winners = [];
      let totalTwosInWeek = 0;

      // Evaluate each scorecard for qualifying gross 2s
      results.forEach(r => {
        // Only Winter League members are eligible to win
        if (!r || !r.inLeague || !r.grossScores) return;

        const qualifyingHoles = [];
        r.grossScores.forEach((g, idx) => {
          if (g === 2) {
            const holeNum = idx + 1;
            const holeMeta = courseHoles[idx] || { hole: holeNum, par: 4, si: 18 };
            const isPar3 = holeMeta.par === 3;
            const isDrawn = drawnHoles.includes(holeNum);
            const isBonus = allowPar4and5 && holeMeta.par >= 4;

            // Hole qualifies if it's a drawn Par 3 OR a bonus Par 4/5
            if ((isPar3 && isDrawn) || isBonus) {
              qualifyingHoles.push({
                hole: holeNum,
                par: holeMeta.par,
                si: holeMeta.si,
                isBonus: isBonus,
                strokes: (r.holeStrokes && r.holeStrokes[idx] !== undefined) ? r.holeStrokes[idx] : 0,
                points: (r.holePoints && r.holePoints[idx] !== undefined) ? r.holePoints[idx] : 0
              });
            }
          }
        });

        if (qualifyingHoles.length > 0) {
          totalTwosInWeek += qualifyingHoles.length;
          winners.push({
            weekNum: w,
            memberId: r.memberId,
            name: r.name,
            inLeague: true,
            enteringHCI: r.enteringHCI,
            playingHandicap: r.playingHandicap,
            stablefordTotal: r.stablefordTotal,
            b9: r.b9,
            b6: r.b6,
            b3: r.b3,
            h18: r.h18,
            magic2Count: qualifyingHoles.length,
            qualifyingHoles: qualifyingHoles,
            roundResult: r,
            prizeMoney: 0
          });
        }
      });

      let sharePerTwo = 0.0;
      let rolloverOut = 0.0;

      if (totalTwosInWeek > 0) {
        sharePerTwo = totalAvailablePot / totalTwosInWeek;
        winners.forEach(winner => {
          winner.prizeMoney = Math.round(winner.magic2Count * sharePerTwo * 100) / 100;
          if (winner.roundResult) {
            winner.roundResult.magic2sPrize = winner.prizeMoney;
          }
        });
        rolloverOut = 0.0;
      } else {
        // Unwon prize pot rolls over to following round
        rolloverOut = totalAvailablePot;
      }

      // Sort winners: most Magic 2s DESC, stablefordTotal DESC, countback DESC, surname ASC
      winners.sort((a, b) => {
        if (b.magic2Count !== a.magic2Count) return b.magic2Count - a.magic2Count;
        if (b.stablefordTotal !== a.stablefordTotal) return b.stablefordTotal - a.stablefordTotal;
        if (b.b9 !== a.b9) return b.b9 - a.b9;
        return getSurname(a.name).localeCompare(getSurname(b.name)) || a.name.localeCompare(b.name);
      });

      winners.forEach((wObj, idx) => {
        wObj.pos = idx + 1;
      });

      // Also collect all league members who scored ANY gross 2 this week
      const allTwosEntries = [];
      results.forEach(r => {
        if (!r || !r.inLeague || !r.grossScores) return;

        let hasAnyTwo = false;
        r.grossScores.forEach(g => {
          if (g === 2) hasAnyTwo = true;
        });

        if (hasAnyTwo) {
          const winner = winners.find(win => win.memberId === r.memberId);
          allTwosEntries.push({
            weekNum: w,
            memberId: r.memberId,
            name: r.name,
            inLeague: true,
            enteringHCI: r.enteringHCI,
            playingHandicap: r.playingHandicap,
            stablefordTotal: r.stablefordTotal,
            b9: r.b9,
            b6: r.b6,
            b3: r.b3,
            h18: r.h18,
            magic2Count: winner ? winner.magic2Count : 0,
            qualifyingHoles: winner ? winner.qualifyingHoles : [],
            roundResult: r,
            prizeMoney: winner ? winner.prizeMoney : 0
          });
        }
      });

      // Sort allTwosEntries: Magic 2 winners first (by magic2Count DESC, prizeMoney DESC, stablefordTotal DESC), then regular 2s (stablefordTotal DESC, surname ASC)
      allTwosEntries.sort((a, b) => {
        if (b.magic2Count !== a.magic2Count) return b.magic2Count - a.magic2Count;
        if (b.prizeMoney !== a.prizeMoney) return b.prizeMoney - a.prizeMoney;
        if (b.stablefordTotal !== a.stablefordTotal) return b.stablefordTotal - a.stablefordTotal;
        if (b.b9 !== a.b9) return b.b9 - a.b9;
        return getSurname(a.name).localeCompare(getSurname(b.name)) || a.name.localeCompare(b.name);
      });

      state.magic2sWeeklyPots.set(w, {
        weekNum: w,
        drawnHoles: drawnHoles,
        entryFee: magic2sFee,
        totalEntrants: totalEntrants,
        leagueEntrants: leagueEntrants,
        nonLeagueEntrants: nonLeagueEntrants,
        magic2sFund: magic2sFund,
        weeklyPrizePot: weeklyPrizePot,
        rolloverIn: rolloverIn,
        totalAvailablePot: totalAvailablePot,
        endOfSeasonWeekly: endOfSeasonWeekly,
        endOfSeasonCumulative: cumulativeEndOfSeason,
        totalTwos: totalTwosInWeek,
        sharePerTwo: sharePerTwo,
        rolloverOut: rolloverOut,
        winners: winners,
        allTwosEntries: allTwosEntries
      });

      rollover = rolloverOut;
    }
  }

  /**
   * Helper: Retrieve Magic 2's data for a specific week
   */
  function getMagic2sForWeek(weekNum) {
    if (!state.magic2sWeeklyPots.has(weekNum)) {
      calculateMagic2sPots();
    }
    return state.magic2sWeeklyPots.get(weekNum) || {
      weekNum,
      drawnHoles: [],
      entryFee: 1.0,
      totalEntrants: 0,
      leagueEntrants: 0,
      nonLeagueEntrants: 0,
      magic2sFund: 0,
      weeklyPrizePot: 0,
      rolloverIn: 0,
      totalAvailablePot: 0,
      endOfSeasonWeekly: 0,
      endOfSeasonCumulative: 0,
      totalTwos: 0,
      sharePerTwo: 0,
      rolloverOut: 0,
      winners: [],
      allTwosEntries: []
    };
  }

  /**
   * View: Magic 2's Competition Renderer (Round view)
   */
  function renderMagic2sView() {
    if (!elements.magic2sWeeklyTbody) return;

    populateMagic2sWeekSelector();

    const asOfWeek = state.magic2sWeek || state.latestWeek;
    const query = (elements.magic2sSearch ? elements.magic2sSearch.value : '').trim().toLowerCase();

    const potData = getMagic2sForWeek(asOfWeek);
    const drawnHoles = potData.drawnHoles;

    if (elements.magic2sSubtitle) {
      elements.magic2sSubtitle.innerHTML = `£${potData.entryFee.toFixed(2)} entry • League members • Par 3s: <span style="color:#64748b; font-weight:700;">⬜ Non-qualifier (Grey)</span> • <span style="color:#166534; font-weight:700;">🟩 Qualifier (Green)</span> • <span style="color:#854d0e; font-weight:700;">🟨 Magic 2 (Gold)</span>`;
    }

    // Par 3 holes list
    const cfg = state.magic2sConfig || DEFAULT_MAGIC2S_CONFIG;
    const par3Holes = (cfg && Array.isArray(cfg.par3Holes))
      ? cfg.par3Holes
      : [1, 8, 11, 13, 17, 18];

    // Helper: Build the 6 Par 3 chips for an entry
    function buildPar3ChipsHtml(entry, drawnList) {
      const chips = [];
      const grossScores = (entry.roundResult && entry.roundResult.grossScores) ? entry.roundResult.grossScores : null;

      par3Holes.forEach(h => {
        const isDrawn = drawnList.includes(h);

        if (entry.isRollover) {
          if (isDrawn) {
            chips.push(`<span class="par3-chip qualifier" title="Hole ${h} (Par 3): Qualifier for Week ${entry.weekNum}">${h}</span>`);
          } else {
            chips.push(`<span class="par3-chip non-qualifier" title="Hole ${h} (Par 3): Non-qualifier for Week ${entry.weekNum}">${h}</span>`);
          }
          return;
        }

        const g = grossScores ? grossScores[h - 1] : null;
        const scoredTwo = (g === 2);
        const isMagic = isDrawn && scoredTwo;

        if (isMagic) {
          chips.push(`<span class="par3-chip magic2" title="Hole ${h} (Par 3): MAGIC 2! Gross score: 2">${h}</span>`);
        } else if (isDrawn) {
          chips.push(`<span class="par3-chip qualifier" title="Hole ${h} (Par 3): Qualifier (Drawn) • Score: ${g !== null ? g : '-'}">${h}</span>`);
        } else {
          // Non-qualifier
          if (scoredTwo) {
            chips.push(`<span class="par3-chip non-qualifier scored-two" title="Hole ${h} (Par 3): Non-qualifier (Not drawn) • Scored 2">${h}</span>`);
          } else {
            chips.push(`<span class="par3-chip non-qualifier" title="Hole ${h} (Par 3): Non-qualifier (Not drawn) • Score: ${g !== null ? g : '-'}">${h}</span>`);
          }
        }
      });

      // Bonus Par 4 / Par 5 gross 2s
      if (!entry.isRollover && entry.qualifyingHoles) {
        entry.qualifyingHoles.forEach(q => {
          if (q.isBonus) {
            chips.push(`<span class="par3-chip magic2 bonus" title="Hole ${q.hole} (Par ${q.par}): Gross 2 on Par ${q.par} (Bonus Magic 2!)">${q.hole}</span>`);
          }
        });
      }

      return `<div class="par3-chips-wrapper">${chips.join('')}</div>`;
    }

    // Render Drawn Holes & Prize Fund Banner
    if (elements.magic2sDrawCard) {
      const chipsHtml = drawnHoles.map(h => `<span class="magic2s-draw-chip">🎯 Hole ${h} (Par 3)</span>`).join('');
      const bonusHtml = `<span class="magic2s-bonus-chip" title="Any gross 2 scored on a Par 4 or Par 5 is also eligible!">⭐ Any Par 4 / Par 5 Gross 2</span>`;

      let prizeStatusHtml = '';
      if (potData.totalTwos > 0) {
        prizeStatusHtml = `
          <span class="magic2s-pot-pill">
            League Payout: <strong>£${potData.sharePerTwo.toFixed(2)}</strong> / 2
          </span>
          <span style="color: #166534; font-weight: 700; font-size: 0.825rem;">
            ${potData.totalTwos} Magic 2${potData.totalTwos > 1 ? 's' : ''} (${potData.winners.length} winner${potData.winners.length > 1 ? 's' : ''})
          </span>
        `;
      } else {
        prizeStatusHtml = `
          <span class="magic2s-rollover-badge" title="No Magic 2s scored by league members this round. The Prize Pot rolls over to next week!">
            🚨 Pot Rolls Over to Round ${asOfWeek + 1}: £${potData.rolloverOut.toFixed(2)}
          </span>
        `;
      }

      let rolloverInBadge = '';
      if (potData.rolloverIn > 0) {
        rolloverInBadge = `<span class="magic2s-rollover-in" title="Includes £${potData.rolloverIn.toFixed(2)} rolled over from previous round">Rollover in: +£${potData.rolloverIn.toFixed(2)}</span>`;
      }

      elements.magic2sDrawCard.innerHTML = `
        <div>
          <div style="font-size: 0.78rem; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.25rem;">
            Week ${asOfWeek} Eligible Holes (Drawn Par 3s)
          </div>
          <div class="magic2s-draw-holes">
            ${chipsHtml}
            ${bonusHtml}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          ${rolloverInBadge}
          ${prizeStatusHtml}
        </div>
      `;
    }

    // Render Financial & Entrant Breakdown Metric Cards
    if (elements.magic2sMetricsCard) {
      elements.magic2sMetricsCard.innerHTML = `
        <div class="magic2s-stat-card">
          <span class="stat-label">Total Entrants</span>
          <span class="stat-val">${potData.totalEntrants}</span>
          <span class="stat-sub">Field size (Open + League)</span>
        </div>
        <div class="magic2s-stat-card">
          <span class="stat-label">League Entrants</span>
          <span class="stat-val val-blue">${potData.leagueEntrants}</span>
          <span class="stat-sub">Eligible for Magic 2's pot</span>
        </div>
        <div class="magic2s-stat-card">
          <span class="stat-label">Magic 2's Fund</span>
          <span class="stat-val">£${potData.magic2sFund.toFixed(2)}</span>
          <span class="stat-sub">${potData.totalEntrants} entrants × £${potData.entryFee.toFixed(2)}</span>
        </div>
        <div class="magic2s-stat-card highlight-pot">
          <span class="stat-label">Magic 2's Prize Pot</span>
          <span class="stat-val val-green">£${potData.totalAvailablePot.toFixed(2)}</span>
          <span class="stat-sub">${potData.leagueEntrants} league × £${potData.entryFee.toFixed(2)}${potData.rolloverIn > 0 ? ` (+£${potData.rolloverIn.toFixed(2)} roll)` : ''}</span>
        </div>
        <div class="magic2s-stat-card highlight-eos">
          <span class="stat-label">End of Season Fund</span>
          <span class="stat-val">£${potData.endOfSeasonWeekly.toFixed(2)}</span>
          <span class="stat-sub">Fund - Prize Pot (Season: £${potData.endOfSeasonCumulative.toFixed(2)})</span>
        </div>
      `;
    }

    // Collect all entries (all players who scored 2s, plus rollover weeks) from asOfWeek down to Week 1
    const allEntries = [];
    for (let w = asOfWeek; w >= 1; w--) {
      const wPotData = getMagic2sForWeek(w);
      const drawnHolesList = wPotData.drawnHoles || [];
      const twosList = (wPotData && Array.isArray(wPotData.allTwosEntries)) ? wPotData.allTwosEntries : [];

      // 1. Add all players who scored 2s in week w
      twosList.forEach(entry => {
        allEntries.push({
          ...entry,
          drawnHoles: drawnHolesList
        });
      });

      // 2. If no league member scored a Magic 2 this week, include the rollover entry
      const hasMagicWinners = wPotData && Array.isArray(wPotData.winners) && wPotData.winners.length > 0;
      if (!hasMagicWinners && wPotData) {
        const rollAmt = (typeof wPotData.rolloverOut === 'number' && wPotData.rolloverOut > 0)
          ? wPotData.rolloverOut
          : (wPotData.totalAvailablePot || 0);
        allEntries.push({
          isRollover: true,
          weekNum: w,
          name: 'No Winner',
          rolloverAmount: rollAmt,
          nextWeek: w + 1,
          drawnHoles: drawnHolesList
        });
      }
    }

    // Filter Entries (filtered by search query)
    let filtered = allEntries;
    if (query) {
      filtered = filtered.filter(entry => {
        if (entry.isRollover) {
          return 'no winner rolled over rollover'.includes(query);
        }
        return entry.name.toLowerCase().includes(query);
      });
    }

    elements.magic2sWeeklyTbody.innerHTML = '';
    if (filtered.length === 0) {
      let emptyMsg = '';
      if (allEntries.length === 0) {
        emptyMsg = `No 2's or Magic 2's records found up to Week ${asOfWeek}.`;
      } else {
        emptyMsg = `No matching 2's records found for "${escapeHtml(query)}" up to Week ${asOfWeek}.`;
      }

      elements.magic2sWeeklyTbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">${emptyMsg}</td>
        </tr>
      `;
      return;
    }

    filtered.forEach((entry) => {
      const tr = document.createElement('tr');

      if (entry.isRollover) {
        tr.className = 'magic2s-row-rollover';
        tr.title = `Week ${entry.weekNum}: No Magic 2s scored. £${entry.rolloverAmount.toFixed(2)} rolled over to Week ${entry.nextWeek}.`;

        tr.innerHTML = `
          <td class="text-center font-bold week-cell"><span class="badge-week" title="Week ${entry.weekNum}"><span class="th-full">Wk </span>${entry.weekNum}</span></td>
          <td class="sticky-col-name player-name-cell"><span class="magic2s-no-winner-badge">No Winner</span></td>
          <td class="text-center magic2s-count-cell"><span class="badge-twos-zero">0</span></td>
          <td class="text-center magic2s-details-col"><span class="magic2s-rollover-details">£${entry.rolloverAmount.toFixed(2)} Rolled Over</span></td>
          <td class="text-center font-bold magic2s-prize-cell"><span class="magic2s-rollover-amt" title="£${entry.rolloverAmount.toFixed(2)} rolled over to Week ${entry.nextWeek}">£${entry.rolloverAmount.toFixed(2)} <span class="rollover-tag">roll</span></span></td>
        `;
      } else {
        tr.className = 'clickable-row';
        tr.title = 'Click to view hole-by-hole scorecard';

        const sharesLabel = entry.magic2Count > 1 ? ` <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">(${entry.magic2Count} shares)</span>` : '';
        const magicBadge = entry.magic2Count > 0
          ? `<span class="badge-twos-count">${entry.magic2Count}</span>`
          : `<span class="badge-twos-zero" title="Scored 2, but on non-qualifier">0</span>`;
        const prizeCellContent = entry.prizeMoney > 0
          ? `<span style="color: #166534; font-size: 0.88rem;">£${entry.prizeMoney.toFixed(2)}${sharesLabel}</span>`
          : `<span style="color: var(--text-light);">-</span>`;

        const isNonMagicTwo = !entry.magic2Count || entry.magic2Count === 0;
        if (isNonMagicTwo) {
          tr.classList.add('row-non-magic-two');
        }

        const displayName = isNonMagicTwo
          ? `<span class="player-name-strike" title="Scored 2 on non-qualifying hole (Not a Magic 2)">${escapeHtml(entry.name)}</span>`
          : `<span class="player-name-magic">${escapeHtml(entry.name)}</span>`;

        tr.innerHTML = `
          <td class="text-center font-bold week-cell"><span class="badge-week" title="Week ${entry.weekNum}"><span class="th-full">Wk </span>${entry.weekNum}</span></td>
          <td class="sticky-col-name player-name-cell">${displayName} <span class="player-hci">(${entry.playingHandicap})</span></td>
          <td class="text-center magic2s-count-cell">${magicBadge}</td>
          <td class="text-center magic2s-details-col">${buildPar3ChipsHtml(entry, entry.drawnHoles)}</td>
          <td class="text-center font-bold magic2s-prize-cell">${prizeCellContent}</td>
        `;

        tr.addEventListener('click', () => {
          toggleAccordion(tr, entry.roundResult, entry);
        });
      }

      elements.magic2sWeeklyTbody.appendChild(tr);
    });
  }

  /**
   * Handicap Index Tracker View Renderer
   * 
   * How Handicap Tracking Works:
   * 1. Purpose:
   *    - Provides a club-wide matrix showing every player's starting Handicap Index (origHCI),
   *      their weekly handicap cut or adjustment in each round (W1 to W20), the cumulative total
   *      cuts received, and their resulting active current HCI.
   * 2. Cell Representation:
   *    - Played with a cut: rendered with green/emerald text (e.g. -0.4).
   *    - Played with an increase: rendered with orange/amber text (e.g. +0.1).
   *    - Played in the buffer zone (no adjustment): rendered as "0".
   *    - Did not play round: rendered as a muted gray dash "-".
   * 3. Interactive Accordion:
   *    - Clicking any row expands their full chronological adjustment log with points scored,
   *      trigger cut rules, and running HCI trajectory.
   * 
   * @returns {void}
   */
  function renderHandicapView() {
    const filter = elements.handicapFilterLeague.value; // 'all', 'league', 'cut'
    const query = (elements.handicapSearch.value || '').trim().toLowerCase();

    // Dynamically build table headers for loaded weeks
    elements.handicapTheadTr.innerHTML = `
      <th class="sticky-col-name player-name-col"><span class="th-full">Player Name</span><span class="th-short">Player</span></th>
      <th class="text-center hci-col" title="Starting Handicap Index"><span class="th-full">Start<br>HCI</span><span class="th-short">Start</span></th>
    `;

    state.weeksData.forEach(w => {
      const th = document.createElement('th');
      th.className = 'text-center week-cut-col';
      th.textContent = `W${w.weekNum}`;
      th.title = `Week ${w.weekNum} Cut / Adjustment`;
      elements.handicapTheadTr.appendChild(th);
    });

    const thCurrentHCI = document.createElement('th');
    thCurrentHCI.className = 'text-center current-hci-col';
    thCurrentHCI.innerHTML = `<span class="th-full">Current<br>HCI</span><span class="th-short">Now</span>`;
    thCurrentHCI.title = 'Current Active Handicap Index';
    elements.handicapTheadTr.appendChild(thCurrentHCI);

    const thTotalCuts = document.createElement('th');
    thTotalCuts.className = 'text-center total-cut-col';
    thTotalCuts.innerHTML = `<span class="th-full">Total<br>Cuts</span><span class="th-short">Cuts</span>`;
    thTotalCuts.title = 'Total Cuts and Adjustments';
    elements.handicapTheadTr.appendChild(thTotalCuts);

    // Prepare list of members
    const memberList = Array.from(state.processedMembers.values());

    // Apply Filter & Search
    let filtered = memberList;
    if (filter === 'league') {
      filtered = filtered.filter(m => m.inLeague);
    } else if (filter === 'cut') {
      filtered = filtered.filter(m => Math.abs(m.cumulativeCuts) > 0.001);
    }

    if (query) {
      filtered = filtered.filter(m => m.name.toLowerCase().includes(query));
    }

    // Sort alphabetically by surname
    filtered.sort((a, b) => getSurname(a.name).localeCompare(getSurname(b.name)) || a.name.localeCompare(b.name));

    elements.handicapTbody.innerHTML = '';
    if (filtered.length === 0) {
      const colSpan = 4 + state.weeksData.length;
      elements.handicapTbody.innerHTML = `
        <tr>
          <td colspan="${colSpan}" class="empty-state">No matching members found.</td>
        </tr>
      `;
      return;
    }

    filtered.forEach(m => {
      const tr = document.createElement('tr');
      const currentHCI = round1(m.origHCI + m.cumulativeCuts);

      let weeklyCellsHtml = '';
      state.weeksData.forEach(w => {
        const cut = m.weeklyCuts.get(w.weekNum);
        const score = m.weeklyScores ? m.weeklyScores.get(w.weekNum) : null;
        const played = (score !== null && score !== undefined);

        if (played) {
          const scoreTip = `Score: ${score} pts`;
          if (cut < 0) {
            weeklyCellsHtml += `<td class="text-center week-cut-col"><span class="cut-val" title="${scoreTip}">${cut.toFixed(1)}</span></td>`;
          } else if (cut > 0) {
            weeklyCellsHtml += `<td class="text-center week-cut-col"><span class="increase-val" title="${scoreTip}">+${cut.toFixed(1)}</span></td>`;
          } else {
            // Played without cut -> show 0
            weeklyCellsHtml += `<td class="text-center week-cut-col"><span class="no-cut-played" title="${scoreTip}">0</span></td>`;
          }
        } else {
          // Did not play -> show -
          weeklyCellsHtml += `<td class="text-center week-cut-col" style="color: var(--text-light);">-</td>`;
        }
      });

      const totalCutsHtml = m.cumulativeCuts < 0
        ? `<span class="cut-val">${m.cumulativeCuts.toFixed(1)}</span>`
        : (m.cumulativeCuts > 0
            ? `<span class="increase-val">+${m.cumulativeCuts.toFixed(1)}</span>`
            : `<span class="no-cut">0.0</span>`);

      const playingStrokes = calculatePlayingHandicap(currentHCI, state.course);

      tr.className = 'clickable-row';
      tr.title = `Click to view handicap cut & adjustment log`;
      tr.innerHTML = `
        <td class="sticky-col-name player-name-cell">${escapeHtml(m.name)} <span class="player-hci">(${playingStrokes})</span></td>
        <td class="text-center hci-col">${m.origHCI.toFixed(1)}</td>
        ${weeklyCellsHtml}
        <td class="text-center current-hci-col"><strong style="font-variant-numeric: tabular-nums;">${currentHCI.toFixed(1)}</strong></td>
        <td class="text-center total-cut-col">${totalCutsHtml}</td>
      `;

      tr.addEventListener('click', () => {
        toggleHandicapAccordion(tr, m);
      });

      elements.handicapTbody.appendChild(tr);
    });

    // Keep active cuts rules inspector updated
    renderCutsRulesInfo();
  }

  /**
   * Render dynamic cuts rules and tier schedule from state.cutsConfig
   */
  function renderCutsRulesInfo() {
    if (!elements.cutsRulesContent) return;
    const cfg = state.cutsConfig;
    if (!cfg) {
      elements.cutsRulesContent.innerHTML = '<p class="text-muted">No cuts configuration loaded.</p>';
      return;
    }

    const triggerPts = cfg.triggerPoints !== undefined ? cfg.triggerPoints : 36;
    const capPts = cfg.bufferCapPoints !== undefined ? cfg.bufferCapPoints : 43;
    const increasePts = cfg.increasePoints !== undefined ? cfg.increasePoints : 30;
    const increaseAdj = cfg.increaseAdjustment !== undefined ? cfg.increaseAdjustment : 0.1;
    const defaultCutPerPt = cfg.defaultCutPerPoint !== undefined ? Math.abs(cfg.defaultCutPerPoint) : 0.1;

    let tierRowsHtml = '';
    if (Array.isArray(cfg.tiers) && cfg.tiers.length > 0) {
      cfg.tiers.forEach(t => {
        const base = t.baseCut !== undefined ? Math.abs(t.baseCut) : (t.tier * 0.1);
        const perPt = t.cutPerPoint !== undefined ? Math.abs(t.cutPerPoint) : defaultCutPerPt;
        const cap = t.capCut !== undefined ? Math.abs(t.capCut) : '-';

        const midHci = (t.minHci + Math.min(t.maxHci, 36.0)) / 2;
        const cut36 = calculateCut(triggerPts, midHci, cfg);
        const cut38 = calculateCut(triggerPts + 2, midHci, cfg);
        const cut40 = calculateCut(triggerPts + 4, midHci, cfg);
        const cutCap = calculateCut(capPts, midHci, cfg);

        const rangeDisplay = t.maxHci >= 90 ? `≥ ${t.minHci.toFixed(1)}` : `${t.minHci.toFixed(1)} – ${t.maxHci.toFixed(1)}`;

        tierRowsHtml += `
          <tr>
            <td style="font-weight: 700; text-align: left;">${escapeHtml(t.name || `Tier ${t.tier}`)}</td>
            <td class="text-center">${rangeDisplay}</td>
            <td class="text-center font-bold text-danger">-${base.toFixed(1)}</td>
            <td class="text-center">-${perPt.toFixed(1)} / pt</td>
            <td class="text-center font-bold text-danger">-${typeof cap === 'number' ? cap.toFixed(1) : cap}</td>
            <td class="text-center"><span class="cut-val">${cut36.toFixed(1)}</span></td>
            <td class="text-center"><span class="cut-val">${cut38.toFixed(1)}</span></td>
            <td class="text-center"><span class="cut-val">${cut40.toFixed(1)}</span></td>
            <td class="text-center"><span class="cut-val">${cutCap.toFixed(1)}</span></td>
          </tr>
        `;
      });
    }

    elements.cutsRulesContent.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 0.6rem 0.85rem;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #1e40af;">Cut Trigger Score</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #1d4ed8;">≥ ${triggerPts} pts</div>
          <div style="font-size: 0.75rem; color: #64748b;">Tier base cut + per-point cut applied</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.6rem 0.85rem;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #475569;">Buffer Zone (No Adjustment)</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #334155;">${increasePts} – ${triggerPts - 1} pts</div>
          <div style="font-size: 0.75rem; color: #64748b;">Handicap index remains unchanged (0.0)</div>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 0.6rem 0.85rem;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #166534;">Handicap Increase</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #15803d;">&lt; ${increasePts} pts (+${increaseAdj.toFixed(1)})</div>
          <div style="font-size: 0.75rem; color: #64748b;">Handicap index increases by +${increaseAdj.toFixed(1)}</div>
        </div>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 0.6rem 0.85rem;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #991b1b;">Max Buffer Cap Score</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #b91c1c;">≥ ${capPts} pts</div>
          <div style="font-size: 0.75rem; color: #64748b;">Tier max cut (Cap) applies automatically</div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table" style="font-size: 0.85rem;">
          <thead>
            <tr>
              <th style="text-align: left;">Tier</th>
              <th class="text-center">Handicap Index</th>
              <th class="text-center" title="Cut for reaching the trigger score (${triggerPts} pts)">Base Cut (${triggerPts} pts)</th>
              <th class="text-center" title="Cut per additional point over trigger">Per Point Above ${triggerPts}</th>
              <th class="text-center" title="Maximum allowed cut in this tier">Tier Cap Cut</th>
              <th class="text-center" style="background: #f8fafc;">Sample @ ${triggerPts} pts</th>
              <th class="text-center" style="background: #f8fafc;">Sample @ ${triggerPts + 2} pts</th>
              <th class="text-center" style="background: #f8fafc;">Sample @ ${triggerPts + 4} pts</th>
              <th class="text-center" style="background: #fef2f2;">Sample @ ${capPts}+ pts</th>
            </tr>
          </thead>
          <tbody>
            ${tierRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * View 4: Player Tracker Renderer
   */
  function renderPlayerTrackerView() {
    if (!elements.playerSearchInput) return;

    if (state.selectedPlayerId && state.processedMembers.has(state.selectedPlayerId)) {
      displayPlayerRecords(state.selectedPlayerId);
    } else {
      renderPlayerQuickPicks();
    }
  }

  function renderPlayerQuickPicks() {
    if (!elements.playerQuickPicks) return;
    elements.playerEmptyPrompt.style.display = 'block';
    elements.playerDetailsCard.style.display = 'none';
    elements.playerQuickPicks.innerHTML = '';

    // Pick top 8 active players from the league
    const leaderboard = getPreparedLeaderboard().filter(p => p.rounds > 0).slice(0, 8);
    leaderboard.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-pick-btn';
      const playingStrokes = p.playingStrokes !== undefined ? p.playingStrokes : calculatePlayingHandicap(p.currentHCI, state.course);
      btn.textContent = `${p.name} (${playingStrokes})`;
      btn.addEventListener('click', () => {
        selectPlayer(p.memberId);
      });
      elements.playerQuickPicks.appendChild(btn);
    });
  }

  function renderPlayerSuggestions(query) {
    if (!elements.playerSuggestions) return;
    const q = (query || '').trim().toLowerCase();

    if (!q) {
      elements.playerSuggestions.style.display = 'none';
      elements.playerSuggestions.innerHTML = '';
      return;
    }

    const members = Array.from(state.processedMembers.values());
    const matches = members.filter(m => {
      const name = m.name.toLowerCase();
      return name.includes(q);
    });

    // Sort exact / prefix matches first, then alphabetical
    matches.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q);
      const bStarts = b.name.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

    const displayMatches = matches.slice(0, 10);

    if (displayMatches.length === 0) {
      elements.playerSuggestions.innerHTML = `
        <div style="padding: 0.75rem 1rem; color: var(--text-muted); font-size: 0.85rem; text-align: center;">
          No members matching "${escapeHtml(query)}"
        </div>
      `;
      elements.playerSuggestions.style.display = 'block';
      return;
    }

    elements.playerSuggestions.innerHTML = '';
    displayMatches.forEach(m => {
      const currentHCI = round1(m.origHCI + m.cumulativeCuts);
      const roundsCount = m.weeklyRounds ? m.weeklyRounds.size : 0;
      const item = document.createElement('div');
      item.className = 'player-suggestion-item';
      item.innerHTML = `
        <div class="suggestion-name-block">
          <strong>${escapeHtml(m.name)}</strong>
          <span class="player-hci">(${calculatePlayingHandicap(currentHCI, state.course)})</span>
        </div>
        <div class="suggestion-badge-block">
          ${m.inLeague ? '<span class="badge-league">League</span>' : '<span class="badge-open">Open</span>'}
          <span class="suggestion-rounds">${roundsCount} rds</span>
        </div>
      `;
      item.addEventListener('click', () => {
        selectPlayer(m.memberId);
      });
      elements.playerSuggestions.appendChild(item);
    });

    elements.playerSuggestions.style.display = 'block';
  }

  /**
   * Switch between Player Details and Handicap Roster subviews within the unified Player Profile tab
   * @param {'profile' | 'roster'} mode 
   */
  function switchPlayersViewMode(mode) {
    state.playersViewMode = mode;
    const isProfile = mode === 'profile';

    if (elements.btnPlayersModeProfile && elements.btnPlayersModeRoster) {
      elements.btnPlayersModeProfile.classList.toggle('active', isProfile);
      elements.btnPlayersModeRoster.classList.toggle('active', !isProfile);
    }

    if (elements.playersProfileView && elements.playersRosterView) {
      elements.playersProfileView.style.display = isProfile ? 'block' : 'none';
      elements.playersRosterView.style.display = !isProfile ? 'block' : 'none';
    }

    if (isProfile) {
      renderPlayerTrackerView();
    } else {
      renderHandicapView();
    }
  }

  function selectPlayer(memberId) {
    state.selectedPlayerId = memberId;
    const player = state.processedMembers.get(memberId);
    if (!player) return;

    if (elements.playerSearchInput) {
      elements.playerSearchInput.value = player.name;
    }
    if (elements.playerSuggestions) {
      elements.playerSuggestions.style.display = 'none';
    }

    switchPlayersViewMode('profile');
    displayPlayerRecords(memberId);
    activateTab('tab-player', true);
  }

  /**
   * Display Player Profile & Season Breakdown
   * 
   * How Player Profile Analytics Work:
   * 1. Profile Identity:
   *    - Shows player name, membership status (League Member vs Open Participant), starting HCI,
   *      current active HCI, and total season handicap adjustments.
   * 2. Key Performance Indicators (KPIs):
   *    - Rounds: Total number of rounds played across the 20-week season.
   *    - Scoring Average: Mean Stableford points per played round (total points / rounds).
   *    - Best Round: Peak single-round Stableford score registered this season.
   *    - Best 10 Total: Top 10 counting scores sum (highlighted for Winter League members).
   *    - Sweep Won: Total cumulative prize money earned from Weekend Stableford sweep pots.
   * 3. Complete Season Log:
   *    - Master list of all weeks (Week 1 through latest week).
   *    - Played rounds show full 18-hole score chips and can be clicked to view interactive scorecards.
   *    - Unplayed weeks are clearly styled in neutral gray with dash indicators.
   * 
   * @param {string} memberId - Unique player ID to display
   * @returns {void}
   */
  function displayPlayerRecords(memberId) {
    const player = state.processedMembers.get(memberId);
    if (!player) return;

    elements.playerEmptyPrompt.style.display = 'none';
    elements.playerDetailsCard.style.display = 'block';

    const currentHCI = round1(player.origHCI + player.cumulativeCuts);
    elements.playerCardName.textContent = player.name;

    if (player.inLeague) {
      elements.playerCardBadge.className = 'badge-league';
      elements.playerCardBadge.textContent = 'League Member';
    } else {
      elements.playerCardBadge.className = 'badge-open';
      elements.playerCardBadge.textContent = 'Open Participant';
    }

    // Meta chips
    const totalCutsHtml = player.cumulativeCuts < 0
      ? `<span class="cut-val">${player.cumulativeCuts.toFixed(1)}</span>`
      : (player.cumulativeCuts > 0
          ? `<span class="increase-val">+${player.cumulativeCuts.toFixed(1)}</span>`
          : `<span class="no-cut">0.0</span>`);

    elements.playerCardMeta.innerHTML = `
      <span>Start HCI: <strong>${player.origHCI.toFixed(1)}</strong></span>
      <span>•</span>
      <span>Active HCI: <strong style="color: var(--primary);">${currentHCI.toFixed(1)}</strong></span>
      <span>•</span>
      <span>Season ADJ: ${totalCutsHtml}</span>
    `;

    // Stats Pills
    const roundsList = Array.from(player.weeklyRounds.values());
    const roundsCount = roundsList.length;
    let best10Sum = 0;
    let countingWeeks = new Set();

    if (player.inLeague && player.leagueScores.length > 0) {
      const sorted = [...player.leagueScores].sort((a, b) => b.points - a.points || a.weekNum - b.weekNum);
      const top10 = sorted.slice(0, 10);
      best10Sum = top10.reduce((acc, s) => acc + s.points, 0);
      top10.forEach(s => countingWeeks.add(s.weekNum));
    }

    const totalPtsSum = roundsList.reduce((acc, r) => acc + r.stablefordTotal, 0);
    const avgPts = roundsCount > 0 ? (totalPtsSum / roundsCount).toFixed(1) : '0.0';
    const bestSingle = roundsCount > 0 ? Math.max(...roundsList.map(r => r.stablefordTotal)) : 0;

    let statsPillsHtml = `
      <div class="player-stat-pill">
        <span class="label">Rounds</span>
        <span class="value">${roundsCount}</span>
      </div>
      <div class="player-stat-pill">
        <span class="label">Average</span>
        <span class="value">${avgPts}</span>
      </div>
      <div class="player-stat-pill">
        <span class="label">Best Round</span>
        <span class="value">${bestSingle > 0 ? `${bestSingle} pts` : '-'}</span>
      </div>
    `;

    if (player.inLeague) {
      statsPillsHtml += `
        <div class="player-stat-pill" style="border-color: var(--primary-light); background: #ecfdf5;">
          <span class="label" style="color: var(--primary);">Best 10 Total</span>
          <span class="value" style="color: var(--primary);">${roundsCount > 0 ? `${best10Sum} pts` : '-'}</span>
        </div>
      `;
    }

    let totalWinnings = 0;
    roundsList.forEach(r => {
      if (r && r.prizeMoney) totalWinnings += r.prizeMoney;
    });
    if (totalWinnings > 0) {
      statsPillsHtml += `
        <div class="player-stat-pill" style="border-color: #86efac; background: #ecfdf5;">
          <span class="label" style="color: #166534;">Sweep Won</span>
          <span class="value" style="color: #166534;">£${totalWinnings.toFixed(2)}</span>
        </div>
      `;
    }

    elements.playerCardStats.innerHTML = statsPillsHtml;

    // Render Rounds Table using shared buildPlayerRoundsTableCardHtml helper
    if (elements.playerRoundsContainer) {
      elements.playerRoundsContainer.innerHTML = buildPlayerRoundsTableCardHtml(player, 'player-rounds-table');
      attachPlayerRoundsHandlers(elements.playerRoundsContainer, player);
    }
  }

  /**
   * Generates the complete HTML for the Player Rounds Table (The Full Record)
   * Shared between the Player Tracker tab and the Winter League accordion.
   * Any change to headers, columns, badges, or row layout will automatically
   * update both views.
   * 
   * @param {Object} player - Processed member object (from state.processedMembers)
   * @param {string} [tableId] - Optional DOM ID for the table
   * @returns {string} Complete HTML string for the table-card component
   */
  function buildPlayerRoundsTableCardHtml(player, tableId = '', maxWeek = null) {
    if (!player) return '';

    // Determine counting weeks for Best 10 highlight (filtered up to maxWeek if specified)
    const countingWeeks = new Set();
    if (player.inLeague && player.leagueScores && player.leagueScores.length > 0) {
      const eligible = (typeof maxWeek === 'number' && maxWeek > 0)
        ? player.leagueScores.filter(s => s.weekNum <= maxWeek)
        : player.leagueScores;
      const sorted = [...eligible].sort((a, b) => b.points - a.points || a.weekNum - b.weekNum);
      const top10 = sorted.slice(0, 10);
      top10.forEach(s => countingWeeks.add(s.weekNum));
    }

    const weeksToRender = (typeof maxWeek === 'number' && maxWeek > 0)
      ? (state.weeksData || []).filter(w => w.weekNum <= maxWeek)
      : (state.weeksData || []);

    let rowsHtml = '';
    if (weeksToRender.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="24" class="empty-state">No competition rounds recorded yet to this point.</td>
        </tr>
      `;
    } else {
      weeksToRender.forEach(w => {
        const r = player.weeklyRounds ? player.weeklyRounds.get(w.weekNum) : null;
        if (r) {
          let holeCellsHtml = '';
          if (r.holePoints && r.holePoints.length >= 18) {
            for (let h = 0; h < 18; h++) {
              const pt = r.holePoints[h] !== undefined ? r.holePoints[h] : '-';
              const tip = buildHoleTooltip(r, h);
              holeCellsHtml += `<td class="text-center hole-col" title="${escapeHtml(tip)}">${renderPointChip(pt)}</td>`;
            }
          } else {
            for (let h = 0; h < 18; h++) {
              holeCellsHtml += `<td class="text-center hole-col" style="color: var(--text-light);">-</td>`;
            }
          }

          const isCounting = countingWeeks.has(r.weekNum);
          const totalCellContent = isCounting
            ? `<span class="badge-counting-total" title="Counts toward season Best 10">${r.stablefordTotal}</span>`
            : (player.inLeague && countingWeeks.size > 0
                ? `<span class="non-counting-total" title="Non-counting round">${r.stablefordTotal}</span>`
                : `<span class="total-score-val">${r.stablefordTotal}</span>`);

          const cutDisplay = r.cut < 0
            ? `<span class="cut-val">${r.cut.toFixed(1)}</span>`
            : (r.cut > 0
                ? `<span class="increase-val">+${r.cut.toFixed(1)}</span>`
                : '');

          const sweepWinnings = typeof r.prizeMoney === 'number' ? r.prizeMoney : 0;
          const magic2sWinnings = typeof r.magic2sPrize === 'number' ? r.magic2sPrize : 0;
          const weekMoney = Math.round((sweepWinnings + magic2sWinnings) * 100) / 100;

          let moneyDisplay = '<span style="color: var(--text-light);">-</span>';
          if (weekMoney > 0) {
            const parts = [];
            if (sweepWinnings > 0) parts.push(`Sweep: £${sweepWinnings.toFixed(2)}`);
            if (magic2sWinnings > 0) parts.push(`2's: £${magic2sWinnings.toFixed(2)}`);
            const titleStr = parts.join(' • ');
            moneyDisplay = `<span class="sweep-prize-badge font-bold" title="${escapeHtml(titleStr)}">💰 £${weekMoney.toFixed(2)}</span>`;
          }

          rowsHtml += `
            <tr class="clickable-row player-round-row" data-week="${r.weekNum}" title="Click to view hole-by-hole scorecard">
              <td class="text-center font-bold week-col">${r.weekNum}</td>
              <td class="text-center hci-col">${r.enteringHCI !== undefined ? r.enteringHCI.toFixed(1) : '-'}</td>
              <td class="text-center cut-col">${cutDisplay}</td>
              <td class="text-center strokes-col font-bold">${r.playingHcap}</td>
              ${holeCellsHtml}
              <td class="text-center total-score-cell">${totalCellContent}</td>
              <td class="text-center round-money-col">${moneyDisplay}</td>
            </tr>
          `;
        } else {
          // Did not play this week -> show week row with blank cells
          let blankHoles = '';
          for (let h = 0; h < 18; h++) {
            blankHoles += `<td class="text-center hole-col" style="color: var(--text-light);">-</td>`;
          }

          rowsHtml += `
            <tr class="unplayed-week-row">
              <td class="text-center font-bold week-col" style="color: var(--text-muted);">${w.weekNum}</td>
              <td class="text-center hci-col" style="color: var(--text-light);">-</td>
              <td class="text-center cut-col"></td>
              <td class="text-center strokes-col" style="color: var(--text-light);">-</td>
              ${blankHoles}
              <td class="text-center total-score-cell" style="color: var(--text-light);">-</td>
              <td class="text-center round-money-col" style="color: var(--text-light);">-</td>
            </tr>
          `;
        }
      });
    }

    const idAttr = tableId ? ` id="${tableId}"` : '';

    return `
      <div class="table-card player-record-table-card">
        <div class="table-responsive">
          <table class="data-table player-rounds-table"${idAttr}>
            <thead>
              <tr>
                <th class="text-center week-col" style="width: 48px;">Week</th>
                <th class="text-center hci-col" style="width: 48px;" title="Entering Handicap Index">HCI</th>
                <th class="text-center cut-col" style="width: 48px;" title="Handicap adjustment earned this week">Cut</th>
                <th class="text-center strokes-col" style="width: 52px;" title="Playing handicap strokes"><span class="th-full">Strokes</span><span class="th-short">Hcap</span></th>
                <th class="text-center hole-col" title="Hole 1 points">1</th>
                <th class="text-center hole-col" title="Hole 2 points">2</th>
                <th class="text-center hole-col" title="Hole 3 points">3</th>
                <th class="text-center hole-col" title="Hole 4 points">4</th>
                <th class="text-center hole-col" title="Hole 5 points">5</th>
                <th class="text-center hole-col" title="Hole 6 points">6</th>
                <th class="text-center hole-col" title="Hole 7 points">7</th>
                <th class="text-center hole-col" title="Hole 8 points">8</th>
                <th class="text-center hole-col" title="Hole 9 points">9</th>
                <th class="text-center hole-col" title="Hole 10 points">10</th>
                <th class="text-center hole-col" title="Hole 11 points">11</th>
                <th class="text-center hole-col" title="Hole 12 points">12</th>
                <th class="text-center hole-col" title="Hole 13 points">13</th>
                <th class="text-center hole-col" title="Hole 14 points">14</th>
                <th class="text-center hole-col" title="Hole 15 points">15</th>
                <th class="text-center hole-col" title="Hole 16 points">16</th>
                <th class="text-center hole-col" title="Hole 17 points">17</th>
                <th class="text-center hole-col" title="Hole 18 points">18</th>
                <th class="text-center total-score-col" style="width: 52px;" title="Total Stableford points">Total</th>
                <th class="text-center round-money-col" style="width: 65px;" title="Combined Weekly Sweep & Magic 2's Prize Money">Money</th>
              </tr>
            </thead>
            <tbody class="player-rounds-tbody">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Attaches interactive scorecard toggle handlers to each played round row
   * in any rendered player rounds table container.
   */
  function attachPlayerRoundsHandlers(container, player) {
    if (!container || !player) return;
    const rows = container.querySelectorAll('.player-round-row');
    rows.forEach(tr => {
      const weekNum = parseInt(tr.getAttribute('data-week'), 10);
      const r = player.weeklyRounds ? player.weeklyRounds.get(weekNum) : null;
      if (r) {
        tr.addEventListener('click', (e) => {
          e.stopPropagation();
          togglePlayerAccordion(tr, r);
        });
      }
    });
  }

  function togglePlayerAccordion(tr, round) {
    const tbody = tr.parentElement;
    const isOpen = tr.classList.contains('accordion-open');
    if (tbody) {
      const existingOpen = tbody.querySelector('.clickable-row.accordion-open');
      const existingDetail = tbody.querySelector('.accordion-detail-row');
      if (existingDetail) existingDetail.remove();
      if (existingOpen) existingOpen.classList.remove('accordion-open');
    }

    if (isOpen) return;

    tr.classList.add('accordion-open');
    const detailTr = document.createElement('tr');
    detailTr.className = 'accordion-detail-row';
    const detailTd = document.createElement('td');
    detailTd.colSpan = tr.cells.length || 24;
    detailTd.innerHTML = buildScorecardTableHtml(round);
    detailTr.appendChild(detailTd);
    tr.after(detailTr);
    attachScorecardAccordionHandlers(detailTd, round);
  }

  /**
   * Scorecard Accordion Display (Inline below player row)
   */
  function toggleAccordion(tr, round, extra = null) {
    const tbody = tr.parentElement;
    const isOpen = tr.classList.contains('accordion-open');

    // Remove any currently open accordion row in this table's tbody
    if (tbody) {
      const existingOpenRows = tbody.querySelectorAll('.clickable-row.accordion-open');
      existingOpenRows.forEach(row => row.classList.remove('accordion-open'));
      const existingDetails = tbody.querySelectorAll('.accordion-detail-row');
      existingDetails.forEach(detail => detail.remove());
    }

    // If the clicked row was already open, closing is complete
    if (isOpen) {
      return;
    }

    // Open this row
    tr.classList.add('accordion-open');
    const detailTr = document.createElement('tr');
    detailTr.className = 'accordion-detail-row';
    const detailTd = document.createElement('td');
    detailTd.colSpan = tr.cells.length || 23;
    detailTd.innerHTML = buildScorecardTableHtml(round, extra);
    detailTr.appendChild(detailTd);
    tr.after(detailTr);
    attachScorecardAccordionHandlers(detailTd, round);
  }

  /**
   * Attach Interactive Handlers for Scorecard Accordion (Profile link)
   */
  function attachScorecardAccordionHandlers(detailTd, round) {
    if (!detailTd) return;

    // View full profile button
    const btnProfile = detailTd.querySelector('.btn-view-profile');
    if (btnProfile && round && round.memberId) {
      btnProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPlayer(round.memberId);
      });
    }
  }

  /**
   * Scorecard HTML Builder Engine
   * 
   * How Scorecards Work:
   * 1. Responsive Architecture:
   *    - Desktop (> 1024px): Renders a traditional horizontal scorecard showing Holes 1-9 (OUT),
   *      Holes 10-18 (IN), and Total columns for Par, Stroke Index, Handicap Strokes, Gross,
   *      Nett, and Stableford Points.
   *    - Mobile (<= 1024px, optimized for 360x760): Renders an upright vertical table with 7 equal-width
   *      columns (14.28% each): Hole, Par, SI, Gross, Strokes, Nett, Points. Fits 100% on screen
   *      with zero horizontal scrolling.
   * 2. No Return (NR) Official Golf Rules:
   *    - A gross or nett total can only be posted if every single hole in that nine was completed.
   *    - If a player records a 0 / pickup on any hole 1-9: OUT gross & nett totals display 'NR'.
   *    - If a player records a 0 / pickup on any hole 10-18: IN gross & nett totals display 'NR'.
   *    - If either nine contains an incomplete hole: TOTAL displays 'NR'.
   *    - Stableford points continue to be earned hole-by-hole regardless of pickups.
   * 3. Gross 2 Visual Highlight:
   *    - Any hole where gross score === 2 receives a distinctive emerald badge.
   * 
   * @param {Object} round - Processed round object containing grossScores, holeStrokes, holePoints
   * @returns {string} Rendered scorecard HTML string
   */
  function buildScorecardTableHtml(round, extra = null) {
    if (!state.course) return '';

    const holes = state.course.holes;
    const gross = round.grossScores || [];
    const strokes = round.holeStrokes || [];
    const points = round.holePoints || [];

    // Calculate Nett score per hole
    const nett = [];
    for (let h = 0; h < 18; h++) {
      const g = gross[h];
      const s = strokes[h] !== undefined ? strokes[h] : 0;
      if (g !== undefined && g !== null && g > 0) {
        nett.push(g - s);
      } else {
        nett.push(0);
      }
    }

    const parsOut = holes.slice(0, 9).map(h => h.par);
    const parsIn = holes.slice(9, 18).map(h => h.par);
    const outPars = parsOut.reduce((a, h) => a + h, 0);
    const inPars = parsIn.reduce((a, h) => a + h, 0);
    const totPars = outPars + inPars;

    const sisOut = holes.slice(0, 9).map(h => h.si);
    const sisIn = holes.slice(9, 18).map(h => h.si);

    const strokesOut = strokes.slice(0, 9);
    const strokesIn = strokes.slice(9, 18);
    const outStrokes = strokesOut.reduce((a, s) => a + s, 0);
    const inStrokes = strokesIn.reduce((a, s) => a + s, 0);
    const totStrokes = outStrokes + inStrokes;

    const grossOut = gross.slice(0, 9);
    const grossIn = gross.slice(9, 18);

    // Front 9 / Back 9 / Overall zero score checks
    const hasZeroGrossFront9 = grossOut.some(g => !g || g <= 0);
    const hasZeroGrossBack9 = grossIn.some(g => !g || g <= 0);
    const hasZeroGrossOverall = hasZeroGrossFront9 || hasZeroGrossBack9;

    const nrBadge = '<span style="color: #b91c1c; font-weight: 800;">NR</span>';
    const outGross = hasZeroGrossFront9 ? nrBadge : grossOut.reduce((a, g) => a + g, 0);
    const inGross = hasZeroGrossBack9 ? nrBadge : grossIn.reduce((a, g) => a + g, 0);
    const totGross = hasZeroGrossOverall ? nrBadge : (grossOut.reduce((a, g) => a + g, 0) + grossIn.reduce((a, g) => a + g, 0));

    const nettOut = nett.slice(0, 9);
    const nettIn = nett.slice(9, 18);
    const outNett = hasZeroGrossFront9 ? nrBadge : nettOut.reduce((a, n) => a + n, 0);
    const inNett = hasZeroGrossBack9 ? nrBadge : nettIn.reduce((a, n) => a + n, 0);
    const totNett = hasZeroGrossOverall ? nrBadge : (nettOut.reduce((a, n) => a + n, 0) + nettIn.reduce((a, n) => a + n, 0));

    const ptsOut = points.slice(0, 9);
    const ptsIn = points.slice(9, 18);
    const outPts = ptsOut.reduce((a, p) => a + p, 0);
    const inPts = ptsIn.reduce((a, p) => a + p, 0);
    const totPts = outPts + inPts;

    // Helper row builder for Desktop Horizontal Table
    const buildRow = (label, outArr, outTot, inArr, inTot, grandTot, isBold = false, isPoints = false, isStrokeRow = false, isGrossRow = false) => {
      let html = `<td class="sc-label-col">${label}</td>`;
      outArr.forEach(v => {
        let content;
        let cellClass = 'sc-hole-col';
        if (isPoints) {
          content = renderPointChip(v);
        } else if (v === 0 && !isStrokeRow) {
          content = `<span style="color: var(--text-light);">-</span>`;
        } else {
          if (isGrossRow && v === 2) {
            content = `<span class="score-gross-2">2</span>`;
            cellClass += ' cell-gross-2';
          } else {
            content = (v !== undefined && v !== null) ? v : '-';
          }
        }
        html += `<td class="${cellClass}">${content}</td>`;
      });
      html += `<td class="sc-subtot-col">${outTot}</td>`;
      inArr.forEach(v => {
        let content;
        let cellClass = 'sc-hole-col';
        if (isPoints) {
          content = renderPointChip(v);
        } else if (v === 0 && !isStrokeRow) {
          content = `<span style="color: var(--text-light);">-</span>`;
        } else {
          if (isGrossRow && v === 2) {
            content = `<span class="score-gross-2">2</span>`;
            cellClass += ' cell-gross-2';
          } else {
            content = (v !== undefined && v !== null) ? v : '-';
          }
        }
        html += `<td class="${cellClass}">${content}</td>`;
      });
      html += `<td class="sc-subtot-col">${inTot}</td>`;
      html += `<td class="sc-tot-col">${grandTot}</td>`;
      return `<tr ${isBold ? 'style="font-weight: 600;"' : ''}>${html}</tr>`;
    };

    // Build Vertical Mobile Scorecard Table Rows
    let vRowsHtml = '';
    for (let h = 0; h < 18; h++) {
      const holeNum = h + 1;
      const isOut = holeNum <= 9;
      const nineClass = isOut ? 'sc-nine-out' : 'sc-nine-in';
      const parVal = holes[h].par;
      const siVal = holes[h].si;
      const rcvdVal = strokes[h] !== undefined ? strokes[h] : 0;
      const gVal = gross[h];
      const nVal = nett[h];
      const pVal = points[h] !== undefined ? points[h] : 0;

      let grossDisplay;
      let grossCellClass = '';
      if (gVal === 2) {
        grossDisplay = '<span class="score-gross-2">2</span>';
        grossCellClass = ' cell-gross-2';
      } else if (gVal !== undefined && gVal !== null && gVal > 0) {
        grossDisplay = gVal;
      } else {
        grossDisplay = nrBadge;
      }

      const nettDisplay = (gVal !== undefined && gVal !== null && gVal > 0) ? nVal : nrBadge;
      const pointsDisplay = renderPointChip(pVal);

      vRowsHtml += `
        <tr class="${nineClass}">
          <td class="sc-v-hole" style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${holeNum}</td>
          <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${parVal}</td>
          <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important; color: var(--text-muted);">${siVal}</td>
          <td class="${grossCellClass}" style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${grossDisplay}</td>
          <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${rcvdVal}</td>
          <td class="font-bold" style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${nettDisplay}</td>
          <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${pointsDisplay}</td>
        </tr>
      `;

      if (holeNum === 9) {
        vRowsHtml += `
          <tr class="sc-subtot-row sc-nine-out">
            <td class="sc-v-hole" style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">OUT</td>
            <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${outPars}</td>
            <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">-</td>
            <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${outGross}</td>
            <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${outStrokes}</td>
            <td class="font-bold" style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${outNett}</td>
            <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;"><span class="score-chip score-good" style="min-width:0; width:26px; height:20px; font-size:0.72rem; padding:0; margin:0 auto; display:inline-flex;">${outPts}</span></td>
          </tr>
        `;
      }

      if (holeNum === 18) {
        vRowsHtml += `
          <tr class="sc-subtot-row sc-nine-in">
            <td class="sc-v-hole" style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">IN</td>
            <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${inPars}</td>
            <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">-</td>
            <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${inGross}</td>
            <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${inStrokes}</td>
            <td class="font-bold" style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${inNett}</td>
            <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;"><span class="score-chip score-good" style="min-width:0; width:26px; height:20px; font-size:0.72rem; padding:0; margin:0 auto; display:inline-flex;">${inPts}</span></td>
          </tr>
        `;
      }
    }

    vRowsHtml += `
      <tr class="sc-grandtot-row">
        <td class="sc-v-hole" style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">TOTAL</td>
        <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${totPars}</td>
        <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">-</td>
        <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${totGross}</td>
        <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${totStrokes}</td>
        <td class="font-bold" style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;">${totNett}</td>
        <td style="width: 14.2857% !important; text-align: center !important; box-sizing: border-box !important;"><span class="score-chip score-high" style="min-width:0; width:26px; height:20px; font-size:0.72rem; padding:0; margin:0 auto; display:inline-flex;">${totPts}</span></td>
      </tr>
    `;

    let magic2sPrizeBanner = '';
    if (extra && typeof extra.prizeMoney === 'number') {
      if (extra.prizeMoney > 0) {
        const sharesText = (extra.magic2Count > 1) ? ` <span class="shares-tag">(${extra.magic2Count} shares)</span>` : '';
        magic2sPrizeBanner = `
          <div class="accordion-magic2s-prize-banner">
            <div class="m2s-prize-left">
              <span class="m2s-prize-icon">🪄</span>
              <span class="m2s-prize-label">Magic 2's Prize Won:</span>
            </div>
            <div class="m2s-prize-right">
              <span class="m2s-prize-value">£${extra.prizeMoney.toFixed(2)}</span>${sharesText}
            </div>
          </div>
        `;
      } else {
        magic2sPrizeBanner = `
          <div class="accordion-magic2s-prize-banner no-prize">
            <div class="m2s-prize-left">
              <span class="m2s-prize-icon">ℹ️</span>
              <span class="m2s-prize-label">Magic 2's Prize:</span>
            </div>
            <div class="m2s-prize-right">
              <span class="m2s-prize-value">£0.00</span>
              <span class="m2s-prize-note">(Non-qualifying 2)</span>
            </div>
          </div>
        `;
      }
    }

    return `
      <div class="scorecard-accordion-box">
        ${magic2sPrizeBanner}
        <!-- Desktop Horizontal Scorecard View (> 1024px) -->
        <div class="table-responsive scorecard-horizontal-view">
          <table class="scorecard-detail-table">
            <thead>
              <tr>
                <th class="sc-label-col">Hole</th>
                <th class="sc-hole-col">1</th>
                <th class="sc-hole-col">2</th>
                <th class="sc-hole-col">3</th>
                <th class="sc-hole-col">4</th>
                <th class="sc-hole-col">5</th>
                <th class="sc-hole-col">6</th>
                <th class="sc-hole-col">7</th>
                <th class="sc-hole-col">8</th>
                <th class="sc-hole-col">9</th>
                <th class="sc-subtot-col">OUT</th>
                <th class="sc-hole-col">10</th>
                <th class="sc-hole-col">11</th>
                <th class="sc-hole-col">12</th>
                <th class="sc-hole-col">13</th>
                <th class="sc-hole-col">14</th>
                <th class="sc-hole-col">15</th>
                <th class="sc-hole-col">16</th>
                <th class="sc-hole-col">17</th>
                <th class="sc-hole-col">18</th>
                <th class="sc-subtot-col">IN</th>
                <th class="sc-tot-col">TOT</th>
              </tr>
            </thead>
            <tbody>
              ${buildRow('Par', parsOut, outPars, parsIn, inPars, totPars, false, false, true)}
              ${buildRow('SI', sisOut, '-', sisIn, '-', '-', false, false, true)}
              ${buildRow('Gross', grossOut, outGross, grossIn, inGross, totGross, true, false, false, true)}
              ${buildRow('Strokes', strokesOut, outStrokes, strokesIn, inStrokes, totStrokes, false, false, true)}
              ${buildRow('Nett', nettOut, outNett, nettIn, inNett, totNett, true, false, false)}
              ${buildRow('Points', ptsOut, outPts, ptsIn, inPts, totPts, true, true, false)}
            </tbody>
          </table>
        </div>

        <!-- Mobile Vertical Scorecard View (<= 1024px) -->
        <div class="scorecard-vertical-view">
          <table class="scorecard-vertical-table" style="table-layout: fixed !important; width: 100% !important; border-collapse: collapse !important;">
            <colgroup>
              <col style="width: 14.2857% !important;">
              <col style="width: 14.2857% !important;">
              <col style="width: 14.2857% !important;">
              <col style="width: 14.2857% !important;">
              <col style="width: 14.2857% !important;">
              <col style="width: 14.2857% !important;">
              <col style="width: 14.2857% !important;">
            </colgroup>
            <thead>
              <tr>
                <th style="width: 14.2857% !important; padding: 0.4rem 1px !important; box-sizing: border-box !important;">Hole</th>
                <th style="width: 14.2857% !important; padding: 0.4rem 1px !important; box-sizing: border-box !important;">Par</th>
                <th style="width: 14.2857% !important; padding: 0.4rem 1px !important; box-sizing: border-box !important;">SI</th>
                <th style="width: 14.2857% !important; padding: 0.4rem 1px !important; box-sizing: border-box !important;">Gross</th>
                <th style="width: 14.2857% !important; padding: 0.4rem 1px !important; box-sizing: border-box !important;">Strokes</th>
                <th style="width: 14.2857% !important; padding: 0.4rem 1px !important; box-sizing: border-box !important;">Nett</th>
                <th style="width: 14.2857% !important; padding: 0.4rem 1px !important; box-sizing: border-box !important;">Points</th>
              </tr>
            </thead>
            <tbody>
              ${vRowsHtml}
            </tbody>
          </table>
        </div>

        <div class="accordion-stats-bar" style="margin-top: 0.65rem;">
          <button type="button" class="quick-pick-btn btn-view-profile" style="margin-left: auto;">👤 View Full Player Profile</button>
        </div>
      </div>
    `;
  }

  /**
   * Leaderboard Accordion: Best 10 Counting Scores & Summary Breakdown
   */
  function toggleLeaderboardAccordion(tr, player) {
    const tbody = tr.parentElement;
    const isOpen = tr.classList.contains('accordion-open');

    if (tbody) {
      tbody.querySelectorAll('.clickable-row.accordion-open').forEach(r => r.classList.remove('accordion-open'));
      tbody.querySelectorAll('.accordion-detail-row').forEach(d => d.remove());
    }

    if (isOpen) return;

    const currentWeek = state.leaderboardWeek || state.latestWeek;

    tr.classList.add('accordion-open');
    const detailTr = document.createElement('tr');
    detailTr.className = 'accordion-detail-row';
    const detailTd = document.createElement('td');
    detailTd.colSpan = tr.cells.length || 15;
    detailTd.innerHTML = buildLeaderboardAccordionHtml(player, currentWeek);
    detailTr.appendChild(detailTd);
    tr.after(detailTr);

    const fullPlayer = state.processedMembers.get(player.memberId);
    if (fullPlayer) {
      attachPlayerRoundsHandlers(detailTd, fullPlayer);
    }

    const btnProfile = detailTd.querySelector('.btn-view-profile');
    if (btnProfile) {
      btnProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPlayer(player.memberId);
      });
    }
  }

  /**
   * Builds the Best 10 Counting Scores accordion card for Winter League
   * 
   * Features:
   * - Counting grid with 10 slots showing points, week number, and color chip tier.
   * - Counting scoring average and single best round highlight.
   * - Full player season record table matching Player Tracker view.
   * - Quick-navigation button to the player's full profile.
   * 
   * @param {Object} p - Prepared leaderboard player object
   * @param {number|null} [asOfWeek] - Optional active week filter (defaults to state.leaderboardWeek)
   * @returns {string} HTML string
   */
  function buildLeaderboardAccordionHtml(p, asOfWeek = null) {
    const targetWeek = (typeof asOfWeek === 'number' && asOfWeek > 0)
      ? asOfWeek
      : (state.leaderboardWeek || state.latestWeek);
    const fullPlayer = state.processedMembers.get(p.memberId);
    const fullRecordHtml = fullPlayer ? buildPlayerRoundsTableCardHtml(fullPlayer, '', targetWeek) : '';
    const allPlayedScores = p.allScores || p.best10 || [];
    let scoresChipsHtml = '';

    if (allPlayedScores.length === 0) {
      for (let k = 0; k < 10; k++) {
        scoresChipsHtml += `
          <div class="lb-counting-card lb-counting-empty" title="Open counting slot #${k + 1}">
            <span class="lb-counting-rank">#${k + 1}</span>
            <span class="score-chip score-empty">-</span>
            <span class="lb-counting-week">Open</span>
          </div>
        `;
      }
    } else {
      // 1. Counting Scores (#1 to #10)
      for (let k = 0; k < 10; k++) {
        const s = allPlayedScores[k];
        if (s !== undefined) {
          const hmClass = getScoreHeatmapClass(s.points);
          scoresChipsHtml += `
            <div class="lb-counting-card" title="Week ${s.weekNum}: ${s.points} pts (Counting Score #${k + 1})">
              <span class="lb-counting-rank">#${k + 1}</span>
              <span class="score-chip ${hmClass}">${s.points}</span>
              <span class="lb-counting-week">Wk ${s.weekNum}</span>
            </div>
          `;
        } else {
          scoresChipsHtml += `
            <div class="lb-counting-card lb-counting-empty" title="Open counting slot #${k + 1}">
              <span class="lb-counting-rank">#${k + 1}</span>
              <span class="score-chip score-empty">-</span>
              <span class="lb-counting-week">Open</span>
            </div>
          `;
        }
      }

      // 2. If player has more than 10 scores, display vertical Cut Line separator and non-counting scores (#11+) on the same line
      if (allPlayedScores.length > 10) {
        scoresChipsHtml += `
          <div class="lb-scores-v-divider" title="Cut Line: Scores #1–#10 count toward season total; scores #11+ do not count">
            <div class="lb-v-line"></div>
            <div class="lb-v-badge">CUT</div>
            <div class="lb-v-line"></div>
          </div>
        `;

        for (let k = 10; k < allPlayedScores.length; k++) {
          const s = allPlayedScores[k];
          const hmClass = getScoreHeatmapClass(s.points);
          scoresChipsHtml += `
            <div class="lb-counting-card lb-card-dropped" title="Week ${s.weekNum}: ${s.points} pts (Non-counting drop score #${k + 1})">
              <span class="lb-counting-rank">#${k + 1}</span>
              <span class="score-chip ${hmClass}">${s.points}</span>
              <span class="lb-counting-week">Wk ${s.weekNum}</span>
            </div>
          `;
        }
      }
    }

    return `
      <div class="scorecard-accordion-box">
        <div class="scorecard-accordion-header">
          <div class="sc-header-pills">
            <span class="sc-pill sc-pill-highlight" title="Season Average: ${p.avgScore} pts (${p.allPointsSum} total points / ${p.rounds} rounds) • Best 10 Avg: ${p.countingAvg} pts">Avg: <strong>${p.avgScore !== '-' ? `${p.avgScore} pts` : '-'}</strong></span>
            <span class="sc-pill sc-pill-money sc-pill-mobile-only" style="background: #ecfdf5; border-color: #86efac; color: #166534;" title="Combined Winnings: Sweep £${(p.sweepMoney || 0).toFixed(2)} + Magic 2s £${(p.magic2sMoney || 0).toFixed(2)}">💰 Won: <strong>£${(p.totalMoneyWon || 0).toFixed(2)}</strong></span>
            <span class="sc-pill">Rounds: <strong>${p.rounds}</strong></span>
            <span class="sc-pill">Current HCI: <strong>${p.currentHCI.toFixed(1)}</strong></span>
            <span class="sc-pill sc-pill-mobile-only">Total Cuts: <strong>${p.totalCuts.toFixed(1)}</strong></span>
          </div>
        </div>
        <div class="accordion-sub-section">
          <div class="accordion-sub-title text-center">Scores High to Low:</div>
          <div class="lb-counting-grid">
            ${scoresChipsHtml}
          </div>
        </div>
        <div class="accordion-sub-section" style="margin-top: 0.9rem;">
          <div class="accordion-sub-title text-center">Record to date:</div>
          ${fullRecordHtml}
        </div>
        <div class="accordion-stats-bar">
          <button type="button" class="quick-pick-btn btn-view-profile" style="margin-left: auto;">👤 View Full Player Profile</button>
        </div>
      </div>
    `;
  }

  /**
   * Eclectic Accordion: 18-Hole Best Scorecard Breakdown
   */
  function toggleEclecticAccordion(tr, player) {
    const tbody = tr.parentElement;
    const isOpen = tr.classList.contains('accordion-open');

    if (tbody) {
      tbody.querySelectorAll('.clickable-row.accordion-open').forEach(r => r.classList.remove('accordion-open'));
      tbody.querySelectorAll('.accordion-detail-row').forEach(d => d.remove());
    }

    if (isOpen) return;

    tr.classList.add('accordion-open');
    const detailTr = document.createElement('tr');
    detailTr.className = 'accordion-detail-row';
    const detailTd = document.createElement('td');
    detailTd.colSpan = tr.cells.length || 23;
    detailTd.innerHTML = buildEclecticAccordionHtml(player);
    detailTr.appendChild(detailTd);
    tr.after(detailTr);

    attachScorecardAccordionHandlers(detailTd, player);
  }

  /**
   * Builds the 18-Hole Eclectic dream card accordion breakdown
   * 
   * Features:
   * - Shows best Stableford points achieved on each of the 18 holes.
   * - Front 9 (OUT), Back 9 (IN), and 18-hole total points.
   * - Deducts active playing handicap strokes to display the official Nett score.
   * - Responsive view: horizontal on desktop, vertical 4-column card on mobile.
   * 
   * @param {Object} p - Prepared eclectic player object
   * @returns {string} HTML string
   */
  function buildEclecticAccordionHtml(p) {
    if (!state.course) return '';
    const holes = state.course.holes;
    const bestHoles = p.bestHoles || [];

    const parsOut = holes.slice(0, 9).map(h => h.par);
    const parsIn = holes.slice(9, 18).map(h => h.par);
    const outPars = parsOut.reduce((a, b) => a + b, 0);
    const inPars = parsIn.reduce((a, b) => a + b, 0);
    const totPars = outPars + inPars;

    const sisOut = holes.slice(0, 9).map(h => h.si);
    const sisIn = holes.slice(9, 18).map(h => h.si);

    const ptsOut = bestHoles.slice(0, 9);
    const ptsIn = bestHoles.slice(9, 18);
    const outPts = ptsOut.reduce((a, b) => a + (b !== null ? b : 0), 0);
    const inPts = ptsIn.reduce((a, b) => a + (b !== null ? b : 0), 0);
    const totPts = outPts + inPts;

    const buildRow = (label, outArr, outTot, inArr, inTot, grandTot, isPoints = false) => {
      let html = `<td class="sc-label-col">${label}</td>`;
      outArr.forEach(v => {
        let content;
        if (isPoints) {
          content = renderPointChip(v);
        } else {
          content = v !== undefined && v !== null ? v : '-';
        }
        html += `<td class="sc-hole-col">${content}</td>`;
      });
      html += `<td class="sc-subtot-col">${outTot}</td>`;
      inArr.forEach(v => {
        let content;
        if (isPoints) {
          content = renderPointChip(v);
        } else {
          content = v !== undefined && v !== null ? v : '-';
        }
        html += `<td class="sc-hole-col">${content}</td>`;
      });
      html += `<td class="sc-subtot-col">${inTot}</td>`;
      html += `<td class="sc-tot-col">${grandTot}</td>`;
      return `<tr>${html}</tr>`;
    };

    // Build Vertical Mobile Scorecard Table Rows for Eclectic
    let vRowsHtml = '';
    for (let h = 0; h < 18; h++) {
      const holeNum = h + 1;
      const isOut = holeNum <= 9;
      const nineClass = isOut ? 'sc-nine-out' : 'sc-nine-in';
      const parVal = holes[h].par;
      const siVal = holes[h].si;
      const pVal = bestHoles[h];
      const pointsDisplay = pVal !== null && pVal !== undefined ? renderPointChip(pVal) : '-';

      vRowsHtml += `
        <tr class="${nineClass}">
          <td class="sc-v-hole">${holeNum}</td>
          <td>${parVal}</td>
          <td style="color: var(--text-muted);">${siVal}</td>
          <td>${pointsDisplay}</td>
        </tr>
      `;

      if (holeNum === 9) {
        vRowsHtml += `
          <tr class="sc-subtot-row sc-nine-out">
            <td class="sc-v-hole">OUT</td>
            <td>${outPars}</td>
            <td>-</td>
            <td><span class="score-chip score-good">${outPts}</span></td>
          </tr>
        `;
      }

      if (holeNum === 18) {
        vRowsHtml += `
          <tr class="sc-subtot-row sc-nine-in">
            <td class="sc-v-hole">IN</td>
            <td>${inPars}</td>
            <td>-</td>
            <td><span class="score-chip score-good">${inPts}</span></td>
          </tr>
        `;
      }
    }

    vRowsHtml += `
      <tr class="sc-grandtot-row">
        <td class="sc-v-hole">TOTAL</td>
        <td>${totPars}</td>
        <td>-</td>
        <td><span class="score-chip score-high">${totPts}</span></td>
      </tr>
    `;

    return `
      <div class="scorecard-accordion-box">
        <div class="scorecard-accordion-header">
          <div class="sc-header-top">
            <span class="sc-header-name">${escapeHtml(p.name)}</span>
            <span class="sc-pill sc-pill-highlight">Points: <strong>${p.total} pts</strong></span>
          </div>
          <div class="sc-header-pills">
            <span class="sc-pill">Hcap: <strong>-${p.playingStrokes}</strong></span>
            <span class="sc-pill">Nett: <strong>${p.nett}</strong></span>
            <span class="sc-pill">Rounds: <strong>${p.rounds}</strong></span>
          </div>
        </div>

        <!-- Desktop Horizontal Scorecard View (> 1024px) -->
        <div class="table-responsive scorecard-horizontal-view">
          <table class="scorecard-detail-table">
            <thead>
              <tr>
                <th class="sc-label-col">Hole</th>
                <th class="sc-hole-col">1</th>
                <th class="sc-hole-col">2</th>
                <th class="sc-hole-col">3</th>
                <th class="sc-hole-col">4</th>
                <th class="sc-hole-col">5</th>
                <th class="sc-hole-col">6</th>
                <th class="sc-hole-col">7</th>
                <th class="sc-hole-col">8</th>
                <th class="sc-hole-col">9</th>
                <th class="sc-subtot-col">OUT</th>
                <th class="sc-hole-col">10</th>
                <th class="sc-hole-col">11</th>
                <th class="sc-hole-col">12</th>
                <th class="sc-hole-col">13</th>
                <th class="sc-hole-col">14</th>
                <th class="sc-hole-col">15</th>
                <th class="sc-hole-col">16</th>
                <th class="sc-hole-col">17</th>
                <th class="sc-hole-col">18</th>
                <th class="sc-subtot-col">IN</th>
                <th class="sc-tot-col">TOT</th>
              </tr>
            </thead>
            <tbody>
              ${buildRow('Par', parsOut, outPars, parsIn, inPars, totPars)}
              ${buildRow('Stroke Index', sisOut, '-', sisIn, '-', '-')}
              ${buildRow('Best Points', ptsOut, outPts, ptsIn, inPts, totPts, true)}
            </tbody>
          </table>
        </div>

        <!-- Mobile Vertical Scorecard View (<= 1024px) -->
        <div class="scorecard-vertical-view">
          <div class="sc-nine-filter-toggle">
            <button type="button" class="sc-nine-btn active" data-nine="all">All 18 Holes</button>
            <button type="button" class="sc-nine-btn" data-nine="out">Front 9 (Out)</button>
            <button type="button" class="sc-nine-btn" data-nine="in">Back 9 (In)</button>
          </div>
          <table class="scorecard-vertical-table">
            <thead>
              <tr>
                <th style="width: 25%;">Hole</th>
                <th style="width: 25%;">Par</th>
                <th style="width: 25%;">SI</th>
                <th style="width: 25%;">Best Pts</th>
              </tr>
            </thead>
            <tbody>
              ${vRowsHtml}
            </tbody>
          </table>
        </div>

        <div class="accordion-stats-bar" style="margin-top: 0.65rem;">
          <div class="stat-item"><span class="stat-label">Gross Points:</span> <strong>${p.total}</strong></div>
          <div class="stat-item"><span class="stat-label">Handicap Deduction:</span> <strong>-${p.playingStrokes}</strong></div>
          <div class="stat-item"><span class="stat-label">Nett Score:</span> <strong>${p.nett}</strong></div>
          <button type="button" class="quick-pick-btn btn-view-profile" style="margin-left: auto;">👤 View Full Player Profile</button>
        </div>
      </div>
    `;
  }

  /**
   * Bingo Accordion: 18-Hole Status Grid & Qualifying Scores
   */
  function toggleBingoAccordion(tr, player, holes, isNetBirdie) {
    const tbody = tr.parentElement;
    const isOpen = tr.classList.contains('accordion-open');

    if (tbody) {
      tbody.querySelectorAll('.clickable-row.accordion-open').forEach(r => r.classList.remove('accordion-open'));
      tbody.querySelectorAll('.accordion-detail-row').forEach(d => d.remove());
    }

    if (isOpen) return;

    tr.classList.add('accordion-open');
    const detailTr = document.createElement('tr');
    detailTr.className = 'accordion-detail-row';
    const detailTd = document.createElement('td');
    detailTd.colSpan = tr.cells.length || 23;
    detailTd.innerHTML = buildBingoAccordionHtml(player, holes, isNetBirdie);
    detailTr.appendChild(detailTd);
    tr.after(detailTr);

    const btnProfile = detailTd.querySelector('.btn-view-profile');
    if (btnProfile) {
      btnProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPlayer(player.memberId);
      });
    }
  }

  /**
   * Builds the 18-Hole Par Bingo / Net Birdies progress card
   * 
   * Features:
   * - Front 9 & Back 9 compact scorecard grids displaying the status of every hole.
   * - Shows best score achieved, round first completed, and special badges (gross 2, eagle/albatross).
   * - Displays uncompleted holes with target score needed.
   * 
   * @param {Object} p - Prepared bingo player object
   * @param {Array} holes - Course holes array
   * @param {boolean} isNetBirdie - True if Net Birdies mode, false if Gross Pars
   * @returns {string} HTML string
   */
  function buildBingoAccordionHtml(p, holes, isNetBirdie) {
    const completedCount = p.completedHoles.size;
    const remCount = 18 - completedCount;
    const modeName = isNetBirdie ? 'Net Birdies Bingo' : 'Gross Pars Bingo';

    function renderBingoHoleCard(h) {
      const par = holes[h] ? holes[h].par : 4;
      const si = holes[h] ? holes[h].si : '-';

      if (p.completedHoles.has(h)) {
        const entry = p.completedHoles.get(h);
        let chipClass = 'bingo-hit';
        const displayVal = isNetBirdie ? entry.nett : entry.bestGross;
        const scoreLabel = isNetBirdie ? `Nett ${entry.nett}` : `Gross ${entry.bestGross}`;
        if (isNetBirdie) {
          if (entry.isEagleOrBetter) chipClass += ' under-par';
          if (entry.isGross2) chipClass += ' gross-2';
        } else {
          if (entry.isGross2) chipClass += ' gross-2';
          else if (entry.isUnderPar) chipClass += ' under-par';
        }

        return `
          <div class="bingo-card-item bingo-card-hit" title="Hole ${h + 1} (Par ${par}, SI ${si}): ${scoreLabel} in Week ${entry.firstWeek}">
            <div class="bingo-card-hole">H${h + 1} <span class="bingo-card-sub">P${par}</span></div>
            <div class="${chipClass}">${displayVal}</div>
            <div class="bingo-card-meta">Wk ${entry.firstWeek}</div>
          </div>
        `;
      } else {
        const targetDesc = isNetBirdie ? 'Net birdie' : `Par ${par}`;
        return `
          <div class="bingo-card-item bingo-card-miss" title="Hole ${h + 1} (Par ${par}, SI ${si}): Needs ${targetDesc}">
            <div class="bingo-card-hole">H${h + 1} <span class="bingo-card-sub">P${par}</span></div>
            <div class="bingo-miss">-</div>
            <div class="bingo-card-meta">≤${targetDesc}</div>
          </div>
        `;
      }
    }

    let frontNineHtml = '';
    for (let h = 0; h < 9; h++) {
      frontNineHtml += renderBingoHoleCard(h);
    }

    let backNineHtml = '';
    for (let h = 9; h < 18; h++) {
      backNineHtml += renderBingoHoleCard(h);
    }

    return `
      <div class="scorecard-accordion-box">
        <div class="scorecard-accordion-header">
          <div class="sc-header-top">
            <span class="sc-header-name">${escapeHtml(p.name)}</span>
            <span class="sc-pill sc-pill-highlight"><strong>${completedCount} / 18 Holes</strong></span>
          </div>
          <div class="sc-header-pills">
            <span class="sc-pill">${modeName}</span>
            <span class="sc-pill">Remaining: <strong>${remCount}</strong></span>
            <span class="sc-pill">Rounds: <strong>${p.roundsPlayed}</strong></span>
            <span class="sc-pill">Current HCI: <strong>${p.currentHCI.toFixed(1)}</strong></span>
          </div>
        </div>
        <div class="accordion-sub-section">
          <div class="bingo-nine-block">
            <div class="bingo-nine-title"><span>Front 9</span> <span class="text-muted">(Holes 1–9)</span></div>
            <div class="bingo-nine-grid">
              ${frontNineHtml}
            </div>
          </div>
          <div class="bingo-nine-block" style="margin-top: 0.65rem;">
            <div class="bingo-nine-title"><span>Back 9</span> <span class="text-muted">(Holes 10–18)</span></div>
            <div class="bingo-nine-grid">
              ${backNineHtml}
            </div>
          </div>
        </div>
        <div class="accordion-stats-bar" style="margin-top: 0.65rem;">
          <div class="stat-item"><span class="stat-label">Completed:</span> <strong style="color: #166534;">${completedCount}</strong></div>
          <div class="stat-item"><span class="stat-label">Remaining:</span> <strong style="color: ${remCount > 0 ? '#b91c1c' : '#166534'};">${remCount}</strong></div>
          <div class="stat-item"><span class="stat-label">Current HCI:</span> <strong>${p.currentHCI.toFixed(1)}</strong></div>
          <button type="button" class="quick-pick-btn btn-view-profile" style="margin-left: auto;">👤 View Full Player Profile</button>
        </div>
      </div>
    `;
  }

  /**
   * Handicap Tracker Accordion: History of Weekly Handicap Adjustments
   */
  function toggleHandicapAccordion(tr, member) {
    const tbody = tr.parentElement;
    const isOpen = tr.classList.contains('accordion-open');

    if (tbody) {
      tbody.querySelectorAll('.clickable-row.accordion-open').forEach(r => r.classList.remove('accordion-open'));
      tbody.querySelectorAll('.accordion-detail-row').forEach(d => d.remove());
    }

    if (isOpen) return;

    tr.classList.add('accordion-open');
    const detailTr = document.createElement('tr');
    detailTr.className = 'accordion-detail-row';
    const detailTd = document.createElement('td');
    detailTd.colSpan = tr.cells.length || 20;
    detailTd.innerHTML = buildHandicapAccordionHtml(member);
    detailTr.appendChild(detailTd);
    tr.after(detailTr);

    const btnProfile = detailTd.querySelector('.btn-view-profile');
    if (btnProfile) {
      btnProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPlayer(member.memberId);
      });
    }
  }

  /**
   * Builds the Handicap Tracker accordion showing chronological handicap movement
   * 
   * Features:
   * - Shows starting HCI, cumulative adjustments, and current active HCI.
   * - Grid of pills for every played week with Stableford points and exact cut/increase received.
   * 
   * @param {Object} m - Member object
   * @returns {string} HTML string
   */
  function buildHandicapAccordionHtml(m) {
    const currentHCI = round1(m.origHCI + m.cumulativeCuts);
    let cutsLogHtml = '';
    let playedCount = 0;

    state.weeksData.forEach(w => {
      const cut = m.weeklyCuts ? m.weeklyCuts.get(w.weekNum) : null;
      const score = m.weeklyScores ? m.weeklyScores.get(w.weekNum) : null;
      if (score !== null && score !== undefined) {
        playedCount++;
        let cutBadge = '<span class="no-cut-played">0.0</span>';
        if (cut < 0) {
          cutBadge = `<span class="cut-val">${cut.toFixed(1)}</span>`;
        } else if (cut > 0) {
          cutBadge = `<span class="increase-val">+${cut.toFixed(1)}</span>`;
        }
        cutsLogHtml += `
          <div class="hc-week-pill">
            <span class="hc-week-label">Week ${w.weekNum}</span>
            <span class="hc-week-score">${score} pts</span>
            <span class="hc-week-cut">${cutBadge}</span>
          </div>
        `;
      }
    });

    if (!cutsLogHtml) {
      cutsLogHtml = '<p class="text-muted" style="font-size: 0.85rem; margin: 0.25rem 0;">No rounds recorded yet for this member.</p>';
    }

    return `
      <div class="scorecard-accordion-box">
        <div class="scorecard-accordion-header">
          <div class="sc-header-top">
            <span class="sc-header-name">${escapeHtml(m.name)}</span>
            <span class="sc-pill sc-pill-highlight">Current HCI: <strong>${currentHCI.toFixed(1)}</strong></span>
          </div>
          <div class="sc-header-pills">
            <span class="sc-pill">Start HCI: <strong>${m.origHCI.toFixed(1)}</strong></span>
            <span class="sc-pill">Net Adjustments: <strong>${m.cumulativeCuts.toFixed(1)}</strong></span>
            <span class="sc-pill">Rounds: <strong>${playedCount}</strong></span>
          </div>
        </div>
        <div class="accordion-sub-section">
          <div class="accordion-sub-title">Weekly Scores &amp; Handicap Cuts:</div>
          <div class="hc-weeks-grid">
            ${cutsLogHtml}
          </div>
        </div>
        <div class="accordion-stats-bar" style="margin-top: 0.65rem;">
          <div class="stat-item"><span class="stat-label">Starting HCI:</span> <strong>${m.origHCI.toFixed(1)}</strong></div>
          <div class="stat-item"><span class="stat-label">Rounds:</span> <strong>${playedCount}</strong></div>
          <div class="stat-item"><span class="stat-label">Net Adjustment:</span> <strong>${m.cumulativeCuts.toFixed(1)}</strong></div>
          <button type="button" class="quick-pick-btn btn-view-profile" style="margin-left: auto;">👤 View Full Player Profile</button>
        </div>
      </div>
    `;
  }

  /**
   * Last Man Standing Accordion: Weekly Survival Record & Elimination Log
   */
  function toggleLastManAccordion(tr, player, cfg, totalWeeks) {
    const tbody = tr.parentElement;
    const isOpen = tr.classList.contains('accordion-open');

    if (tbody) {
      tbody.querySelectorAll('.clickable-row.accordion-open').forEach(r => r.classList.remove('accordion-open'));
      tbody.querySelectorAll('.accordion-detail-row').forEach(d => d.remove());
    }

    if (isOpen) return;

    tr.classList.add('accordion-open');
    const detailTr = document.createElement('tr');
    detailTr.className = 'accordion-detail-row';
    const detailTd = document.createElement('td');
    detailTd.colSpan = tr.cells.length || (4 + totalWeeks);
    detailTd.innerHTML = buildLastManAccordionHtml(player, cfg, totalWeeks);
    detailTr.appendChild(detailTd);
    tr.after(detailTr);

    const btnProfile = detailTd.querySelector('.btn-view-profile');
    if (btnProfile) {
      btnProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPlayer(player.memberId);
      });
    }
  }

  /**
   * Builds the Last Man Standing accordion showing weekly survival history
   * 
   * Features:
   * - Shows target hole played, gross score, and Stableford points earned.
   * - Visual chips for Pass (green check), Missed with life saved (yellow heart),
   *   Out on points (red score), and Out on lives (skull).
   * - Displays remaining lives and elimination reason if knocked out.
   * 
   * @param {Object} player - Last man player object
   * @param {Object} cfg - Active last man config
   * @param {number} totalWeeks - Total number of competition rounds
   * @returns {string} HTML string
   */
  function buildLastManAccordionHtml(player, cfg, totalWeeks) {
    let historyCardsHtml = '';
    for (let w = 1; w <= totalWeeks; w++) {
      const targetHole = getTargetHoleForWeek(w, cfg.holeOrder);
      const targetSI = targetHole ? targetHole.si : '-';
      const holeNum = targetHole ? targetHole.hole : '-';
      const holePar = targetHole ? targetHole.par : '-';

      const res = player.weeklyResults.get(w);
      if (!res || res.isPastElimination || res.isPostComp) {
        historyCardsHtml += `
          <div class="lastman-week-card unplayed" title="Week ${w}: Not in competition">
            <span class="lm-wk">Wk ${w}</span>
            <span class="lm-hole-info">H${holeNum}</span>
            <span class="lm-pts"><span class="score-chip score-empty">-</span></span>
            <span class="lm-status-text">-</span>
          </div>
        `;
      } else if (res.played) {
        const isPassed = !res.isEliminated;
        const badgeClass = isPassed ? 'lm-survived' : 'lm-elim';
        const statusText = isPassed ? 'Passed ✅' : 'Out 💀';
        const chipClass = isPassed ? 'score-good' : 'score-low';
        historyCardsHtml += `
          <div class="lastman-week-card ${badgeClass}" title="Week ${w}: Hole ${holeNum} (Par ${holePar}, SI ${targetSI}) • Gross ${res.gross} &rarr; ${res.points} pts">
            <span class="lm-wk">Wk ${w}</span>
            <span class="lm-hole-info">H${holeNum}</span>
            <span class="lm-pts"><span class="score-chip ${chipClass}">${res.points}</span></span>
            <span class="lm-status-text">${statusText}</span>
          </div>
        `;
      } else {
        if (res.status === 'life_used') {
          historyCardsHtml += `
            <div class="lastman-week-card lm-life-used" title="Week ${w}: Missed week • Used 1 life (${res.livesLeft} left)">
              <span class="lm-wk">Wk ${w}</span>
              <span class="lm-hole-info">H${holeNum}</span>
              <span class="lm-pts"><span class="score-chip score-warn">💔</span></span>
              <span class="lm-status-text">Life (${res.livesLeft}❤️)</span>
            </div>
          `;
        } else {
          historyCardsHtml += `
            <div class="lastman-week-card lm-elim" title="Week ${w}: Missed week with 0 lives remaining • Eliminated">
              <span class="lm-wk">Wk ${w}</span>
              <span class="lm-hole-info">H${holeNum}</span>
              <span class="lm-pts"><span class="score-chip score-bad">💀</span></span>
              <span class="lm-status-text">Out (0❤️)</span>
            </div>
          `;
        }
      }
    }

    const statusTitle = player.status === 'winner'
      ? '👑 Champion'
      : (player.status === 'joint-winner'
          ? '🤝 Joint Champion'
          : (player.status === 'alive' ? '⚔️ Alive / Still Standing' : '💀 Eliminated'));

    return `
      <div class="scorecard-accordion-box">
        <div class="scorecard-accordion-header">
          <div class="sc-header-top">
            <span class="sc-header-name">${escapeHtml(player.name)}</span>
            <span class="sc-pill ${player.status === 'eliminated' ? 'sc-pill-danger' : 'sc-pill-highlight'}">${statusTitle}</span>
          </div>
          <div class="sc-header-pills">
            <span class="sc-pill">Current HCI: <strong>${player.currentHCI.toFixed(1)}</strong></span>
          </div>
        </div>
        ${player.eliminationReason ? `<div style="font-size:0.82rem; color:#b91c1c; font-weight:600; margin-bottom:0.6rem;">${escapeHtml(player.eliminationReason)}</div>` : ''}
        <div class="accordion-sub-section">
          <div class="accordion-sub-title">Weekly Survival History:</div>
          <div class="lastman-weeks-grid">
            ${historyCardsHtml}
          </div>
        </div>
        <div class="accordion-stats-bar" style="margin-top: 0.65rem;">
          <div class="stat-item"><span class="stat-label">HCI:</span> <strong>${player.currentHCI.toFixed(1)}</strong></div>
          <div class="stat-item"><span class="stat-label">Status:</span> <strong>${statusTitle}</strong></div>
          <button type="button" class="quick-pick-btn btn-view-profile" style="margin-left: auto;">👤 View Full Player Profile</button>
        </div>
      </div>
    `;
  }

  /**
   * Last Man Standing Calculation Engine
   * Rules:
   * - Winter League members only (inLeague: true)
   * - Week 1 starts on hole with SI 18.
   * - Players need >= 2 Stableford points on active hole to proceed.
   * - < 2 points on active hole = eliminated.
   * - Week 2 = SI 17, Week 3 = SI 16, ..., Week 18 = SI 1.
   * - Cycles back if competition goes beyond 18 weeks (Week 19 = SI 18, Week 20 = SI 17, etc.)
   * - Target SI for Week w: 18 - ((w - 1) % 18).
   * - Players get 3 lives that save them if they don't play that week:
   *   - 1st missed week: 2 lives left (saved)
   *   - 2nd missed week: 1 life left (saved)
   *   - 3rd missed week: 0 lives left (saved)
   *   - 4th missed week: eliminated (0 lives remaining)
   * - Winner is the last man standing.
   * - If all remaining players eliminated in the same week, joint winners.
   */
  /**
   * Helper: Normalize hole ordering configuration key
   * Supported options: 'si_desc' (SI 18 - SI 1), 'si_asc' (SI 1 - SI 18), 'hole_asc' (Hole 1 - Hole 18), 'hole_desc' (Hole 18 - Hole 1)
   */
  function normalizeHoleOrder(val) {
    if (!val) return 'si_desc';
    const s = String(val).toLowerCase().replace(/\s+/g, '');
    if (s.includes('18-1') || s.includes('18to1') || s.includes('desc')) {
      if (s.includes('hole')) return 'hole_desc';
      return 'si_desc';
    }
    if (s.includes('1-18') || s.includes('1to18') || s.includes('asc')) {
      if (s.includes('hole')) return 'hole_asc';
      return 'si_asc';
    }
    if (['si_desc', 'si_asc', 'hole_asc', 'hole_desc'].includes(val)) return val;
    return 'si_desc';
  }

  /**
   * Helper: Resolve active target hole for a given competition week based on progression order
   */
  function getTargetHoleForWeek(w, holeOrder) {
    if (!state.course || !state.course.holes || state.course.holes.length === 0) return null;
    const step = (w - 1) % 18;
    const order = normalizeHoleOrder(holeOrder);
    switch (order) {
      case 'si_asc': { // SI 1 - SI 18
        const targetSI = 1 + step;
        return state.course.holes.find(h => h.si === targetSI) || null;
      }
      case 'hole_asc': { // Hole 1 - Hole 18
        const targetHoleNum = 1 + step;
        return state.course.holes.find(h => h.hole === targetHoleNum) || null;
      }
      case 'hole_desc': { // Hole 18 - Hole 1
        const targetHoleNum = 18 - step;
        return state.course.holes.find(h => h.hole === targetHoleNum) || null;
      }
      case 'si_desc': // SI 18 - SI 1 (default)
      default: {
        const targetSI = 18 - step;
        return state.course.holes.find(h => h.si === targetSI) || null;
      }
    }
  }

  /**
   * Sync Last Man settings controls with active config
   */
  function syncLastManSettingsControls() {
    const cfg = state.lastmanConfig || {};
    if (elements.lastmanCfgPoints && cfg.pointsToSurvive !== undefined) {
      elements.lastmanCfgPoints.value = String(cfg.pointsToSurvive);
    }
    if (elements.lastmanCfgOrder && cfg.holeOrder) {
      elements.lastmanCfgOrder.value = normalizeHoleOrder(cfg.holeOrder);
    }
    if (elements.lastmanCfgEligibility && cfg.eligibility) {
      elements.lastmanCfgEligibility.value = String(cfg.eligibility);
    }
    if (elements.lastmanCfgLives && cfg.initialLives !== undefined) {
      elements.lastmanCfgLives.value = String(cfg.initialLives);
    }
    if (elements.lastmanCfgHideUnplayed && cfg.hideUnplayedEliminations !== undefined) {
      elements.lastmanCfgHideUnplayed.checked = Boolean(cfg.hideUnplayedEliminations);
    }
    if (elements.lastmanSettingsBar) {
      const hideSettings = Boolean(cfg.hideCompetitionSettings || cfg.hideSettingsBox || cfg.hideSettings);
      elements.lastmanSettingsBar.style.display = hideSettings ? 'none' : '';
    }
  }

  /**
   * Last Man Standing Competition Engine
   * 
   * How Last Man Standing Works:
   * 1. Sudden-Death Survival Format:
   *    - Every entrant starts alive with a set number of "lives" (default 3 lives).
   *    - In each competition week, a single target hole is designated as the active challenge.
   * 2. Hole Progression Order (Default: SI 18 down to SI 1):
   *    - Week 1 = Stroke Index 18 (easiest handicap hole)
   *    - Week 2 = Stroke Index 17, Week 3 = Stroke Index 16, ..., down to Week 18 = Stroke Index 1.
   *    - If the competition continues beyond Week 18, it cycles back (Week 19 = SI 18, Week 20 = SI 17).
   * 3. Weekly Survival Criteria:
   *    - A player who plays must score >= minPoints (default 2 Stableford points) on that week's
   *      designated target hole to SURVIVE.
   *    - If the player scores < 2 points on the target hole, they are ELIMINATED immediately.
   * 4. 3 Lives System (Absence Protection):
   *    - If a currently alive player does NOT participate in a round, they expend 1 life:
   *      - 1st missed round: 2 lives remaining (Survives)
   *      - 2nd missed round: 1 life remaining (Survives)
   *      - 3rd missed round: 0 lives remaining (Survives on final life)
   *      - 4th missed round: ELIMINATED (exhausted all lives)
   * 5. Winner Determination:
   *    - If exactly 1 player remains alive at the end of a round, they are crowned Champion.
   *    - If all remaining alive players are eliminated in the exact same week, they are declared
   *      Joint Winners.
   * 
   * @returns {Object} Competition summary: players, winners, counts, and active configuration
   */
  function calculateLastManStanding(asOfWeek) {
    if (!state.course || !state.course.holes) {
      return {
        players: [],
        competitionEnded: false,
        winningWeek: null,
        winners: [],
        aliveCount: 0,
        eliminatedCount: 0,
        totalCount: 0,
        simulatedWeek: 0,
        config: { minPoints: 2, initialLives: 3, eligibility: 'league', holeOrder: 'si_desc' }
      };
    }

    // Step 1: Read active configuration from UI controls (falling back to config/lastman.json)
    const cfg = state.lastmanConfig || {};
    const minPoints = elements.lastmanCfgPoints && elements.lastmanCfgPoints.value
      ? parseInt(elements.lastmanCfgPoints.value, 10)
      : (cfg.pointsToSurvive !== undefined ? cfg.pointsToSurvive : 2);

    const eligibility = elements.lastmanCfgEligibility && elements.lastmanCfgEligibility.value
      ? elements.lastmanCfgEligibility.value
      : (cfg.eligibility || 'league');

    const initialLives = elements.lastmanCfgLives && elements.lastmanCfgLives.value !== ""
      ? parseInt(elements.lastmanCfgLives.value, 10)
      : (cfg.initialLives !== undefined ? cfg.initialLives : 3);

    const rawOrder = elements.lastmanCfgOrder && elements.lastmanCfgOrder.value
      ? elements.lastmanCfgOrder.value
      : (cfg.holeOrder || 'si_desc');
    const holeOrder = normalizeHoleOrder(rawOrder);

    // Step 2: Establish entrant field (League only or Open to all)
    const allMembers = Array.from(state.processedMembers.values());
    const entrants = eligibility === 'all'
      ? allMembers
      : allMembers.filter(p => p.inLeague);

    // Step 3: Initialize tracking status for every entrant
    const players = entrants.map(m => {
      const currentHCI = round1(m.origHCI + m.cumulativeCuts);
      const playingStrokes = calculatePlayingHandicap(currentHCI, state.course);
      return {
        memberId: m.memberId,
        name: m.name,
        surname: getSurname(m.name),
        currentHCI: currentHCI,
        playingStrokes: playingStrokes,
        lives: initialLives,
        status: 'alive', // 'alive', 'winner', 'joint-winner', 'eliminated'
        eliminatedWeek: null,
        eliminationReason: null,
        weeklyResults: new Map()
      };
    });

    let competitionEnded = false;
    let winningWeek = null;
    let winners = [];

    const maxAvailableWeek = state.weeksData.length;
    const targetWeek = (asOfWeek !== undefined && asOfWeek !== null && asOfWeek >= 1 && asOfWeek <= maxAvailableWeek)
      ? asOfWeek
      : (state.lastmanWeek || state.latestWeek || maxAvailableWeek);

    // Step 4: Simulate each competition week chronologically up to targetWeek
    for (let w = 1; w <= targetWeek; w++) {
      const targetHole = getTargetHoleForWeek(w, holeOrder);
      const targetSI = targetHole ? targetHole.si : '-';
      const holeIdx = targetHole ? targetHole.hole - 1 : 0;

      // Alive players entering week w
      const aliveEntering = players.filter(p => p.status === 'alive');

      if (competitionEnded) {
        // Competition already finished in earlier week
        players.forEach(p => {
          if (!p.weeklyResults.has(w)) {
            p.weeklyResults.set(w, { isPostComp: true });
          }
        });
        continue;
      }

      // Evaluate each currently alive player
      aliveEntering.forEach(p => {
        const rawPlayer = state.processedMembers.get(p.memberId);
        const round = rawPlayer ? rawPlayer.weeklyRounds.get(w) : null;

        if (round) {
          const gross = round.grossScores ? round.grossScores[holeIdx] : 0;
          const pts = (round.holePoints && round.holePoints[holeIdx] !== undefined)
            ? round.holePoints[holeIdx]
            : 0;

          if (pts >= minPoints) {
            // Survives
            p.weeklyResults.set(w, {
              played: true,
              gross: gross,
              points: pts,
              livesLeft: p.lives,
              status: 'survived',
              isEliminated: false
            });
          } else {
            // Eliminated by score
            p.status = 'eliminated';
            p.eliminationType = 'score';
            p.eliminatedWeek = w;
            p.eliminationReason = `Scored ${pts} pt(s) on Hole ${targetHole ? targetHole.hole : '-'} (Par ${targetHole ? targetHole.par : '-'}, SI ${targetSI})`;
            p.weeklyResults.set(w, {
              played: true,
              gross: gross,
              points: pts,
              livesLeft: p.lives,
              status: 'eliminated_score',
              isEliminated: true
            });
          }
        } else {
          // Did not play round
          if (p.lives > 0) {
            p.lives--;
            p.weeklyResults.set(w, {
              played: false,
              gross: null,
              points: null,
              livesLeft: p.lives,
              status: 'life_used',
              isEliminated: false
            });
          } else {
            // Eliminated - out of lives
            p.status = 'eliminated';
            p.eliminationType = 'lives';
            p.eliminatedWeek = w;
            p.eliminationReason = initialLives > 0
              ? `Exhausted ${initialLives} lives (missed Week ${w})`
              : `Missed Week ${w} (0 lives competition)`;
            p.weeklyResults.set(w, {
              played: false,
              gross: null,
              points: null,
              livesLeft: 0,
              status: 'eliminated_lives',
              isEliminated: true
            });
          }
        }
      });

      // Mark previously eliminated players for this week
      players.forEach(p => {
        if (!p.weeklyResults.has(w)) {
          p.weeklyResults.set(w, { isPastElimination: true });
        }
      });

      // Check survivors after this week
      const aliveAfter = players.filter(p => p.status === 'alive');

      if (aliveAfter.length === 1) {
        competitionEnded = true;
        winningWeek = w;
        aliveAfter[0].status = 'winner';
        winners = [aliveAfter[0]];
      } else if (aliveAfter.length === 0) {
        competitionEnded = true;
        winningWeek = w;
        aliveEntering.forEach(p => {
          p.status = 'joint-winner';
        });
        winners = [...aliveEntering];
      }
    }

    // Determine rounds actually played before elimination
    players.forEach(p => {
      let playedCount = 0;
      p.weeklyResults.forEach(r => {
        if (r && r.played) playedCount++;
      });
      p.roundsPlayed = playedCount;
      p.neverPlayedBeforeElim = (p.status === 'eliminated' && p.eliminationType === 'lives' && playedCount === 0);
    });

    // Sort players for display
    players.sort((a, b) => {
      const isWinA = a.status === 'winner' || a.status === 'joint-winner';
      const isWinB = b.status === 'winner' || b.status === 'joint-winner';
      if (isWinA && !isWinB) return -1;
      if (!isWinA && isWinB) return 1;

      const isAliveA = a.status === 'alive';
      const isAliveB = b.status === 'alive';
      if (isAliveA && !isAliveB) return -1;
      if (!isAliveA && isAliveB) return 1;

      // Alive: sort by lives descending, then surname
      if (isAliveA && isAliveB) {
        if (b.lives !== a.lives) return b.lives - a.lives;
        return a.surname.localeCompare(b.surname) || a.name.localeCompare(b.name);
      }

      // Eliminated: sort by eliminatedWeek descending (survived longer is higher)
      if (b.eliminatedWeek !== a.eliminatedWeek) {
        return (b.eliminatedWeek || 0) - (a.eliminatedWeek || 0);
      }

      return a.surname.localeCompare(b.surname) || a.name.localeCompare(b.name);
    });

    const aliveCount = players.filter(p => p.status === 'alive' || p.status === 'winner' || p.status === 'joint-winner').length;
    const eliminatedCount = players.length - aliveCount;

    return {
      players,
      competitionEnded,
      winningWeek,
      winners,
      aliveCount,
      eliminatedCount,
      totalCount: players.length,
      unplayedElimCount: players.filter(p => p.neverPlayedBeforeElim).length,
      simulatedWeek: targetWeek,
      config: {
        minPoints,
        eligibility,
        initialLives,
        holeOrder
      }
    };
  }

  /**
   * Populate Last Man Standing Week Dropdown and sync Prev/Next buttons
   */
  function populateLastManWeekSelector() {
    if (!elements.lastmanWeekSelect) return;
    elements.lastmanWeekSelect.innerHTML = '';
    if (state.weeksData.length === 0) {
      const opt = document.createElement('option');
      opt.value = 0;
      opt.textContent = 'No weeks recorded';
      elements.lastmanWeekSelect.appendChild(opt);
      return;
    }

    const currentWeek = state.lastmanWeek || state.latestWeek;
    state.weeksData.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.weekNum;
      opt.textContent = `Week ${w.weekNum}`;
      if (w.weekNum === currentWeek) {
        opt.selected = true;
      }
      elements.lastmanWeekSelect.appendChild(opt);
    });

    updateLastManNavButtons();
  }

  function updateLastManNavButtons() {
    const currentWeek = state.lastmanWeek || state.latestWeek;
    if (elements.btnLastmanPrev) {
      elements.btnLastmanPrev.disabled = currentWeek <= 1;
    }
    if (elements.btnLastmanNext) {
      elements.btnLastmanNext.disabled = currentWeek >= state.latestWeek;
    }
  }

  /**
   * View 5: Last Man Standing View Renderer
   */
  function renderLastManView() {
    if (!elements.lastmanBanner || !elements.lastmanTbody || !elements.lastmanTheadTr) return;

    populateLastManWeekSelector();
    updateLastManNavButtons();

    if (elements.lastmanSettingsBar) {
      const hideSettings = Boolean(state.lastmanConfig && (state.lastmanConfig.hideCompetitionSettings || state.lastmanConfig.hideSettingsBox || state.lastmanConfig.hideSettings));
      elements.lastmanSettingsBar.style.display = hideSettings ? 'none' : '';
    }

    const asOfWeek = state.lastmanWeek || state.latestWeek;
    const data = calculateLastManStanding(asOfWeek);
    const totalWeeks = data.simulatedWeek || asOfWeek;
    const cfg = data.config;
    const eligLabel = cfg.eligibility === 'all' ? 'All Club Members' : 'Winter League Only';

    const livesLabel = `${cfg.initialLives} ${cfg.initialLives === 1 ? 'life' : 'lives'}`;
    const orderLabels = {
      si_desc: 'SI 18 - SI 1',
      si_asc: 'SI 1 - SI 18',
      hole_asc: 'Hole 1 - Hole 18',
      hole_desc: 'Hole 18 - Hole 1'
    };
    const orderLabel = orderLabels[cfg.holeOrder] || 'SI 18 - SI 1';

    // Update subtitle with round information
    if (elements.lastmanSubtitle) {
      const activeHoleInfo = totalWeeks > 0 ? getTargetHoleForWeek(totalWeeks, cfg.holeOrder) : null;
      const holeText = activeHoleInfo ? ` • Round ${totalWeeks} Target: Hole ${activeHoleInfo.hole} (SI ${activeHoleInfo.si})` : '';
      elements.lastmanSubtitle.textContent = `Survival countdown competition • Need ≥ ${cfg.minPoints} pts on active hole to proceed • Lives save missed weeks • Last man standing wins${holeText}`;
    }

    // 1. Render Banner
    if (data.competitionEnded) {
      if (data.winners.length === 1) {
        const w = data.winners[0];
        elements.lastmanBanner.innerHTML = `
          <div class="lastman-banner-winner">
            <div class="lastman-banner-icon">🏆</div>
            <div>
              <div class="lastman-banner-title">Winner: ${escapeHtml(w.name)} (${w.playingStrokes})</div>
              <div class="lastman-banner-sub">Crowned Last Man Standing in Week ${data.winningWeek}! (Rules: ≥ ${cfg.minPoints} pt(s) to qualify • ${livesLabel} • ${orderLabel} • ${eligLabel})</div>
            </div>
          </div>
        `;
      } else {
        elements.lastmanBanner.innerHTML = `
          <div class="lastman-banner-winner">
            <div class="lastman-banner-icon">🤝</div>
            <div>
              <div class="lastman-banner-title">Joint Winners: ${data.winners.map(w => `${escapeHtml(w.name)} (${w.playingStrokes})`).join(', ')}</div>
              <div class="lastman-banner-sub">Simultaneous elimination in Week ${data.winningWeek} — Joint Champions! (Rules: ≥ ${cfg.minPoints} pt(s) to qualify • ${livesLabel} • ${orderLabel} • ${eligLabel})</div>
            </div>
          </div>
        `;
      }
    } else {
      const activeHole = totalWeeks > 0
        ? getTargetHoleForWeek(totalWeeks, cfg.holeOrder)
        : getTargetHoleForWeek(1, cfg.holeOrder);

      const statusTitle = (totalWeeks < state.latestWeek)
        ? `⚔️ Standings after Round ${totalWeeks} (of ${state.latestWeek})`
        : `⚔️ In Progress (Round ${totalWeeks})`;

      elements.lastmanBanner.innerHTML = `
        <div class="lastman-banner-active">
          <div class="lastman-banner-stat">
            <span class="lastman-stat-label">Competition Status</span>
            <span class="lastman-stat-val text-success">${statusTitle}</span>
          </div>
          <div class="lastman-banner-stat">
            <span class="lastman-stat-label">Active Rules</span>
            <span class="lastman-stat-val">≥ ${cfg.minPoints} pt(s) • ${livesLabel} • ${orderLabel} • ${eligLabel}</span>
          </div>
          <div class="lastman-banner-stat">
            <span class="lastman-stat-label">Current Round Hole</span>
            <span class="lastman-stat-val">Hole ${activeHole ? activeHole.hole : '-'} (Par ${activeHole ? activeHole.par : '-'}, SI ${activeHole ? activeHole.si : '-'})</span>
          </div>
          <div class="lastman-banner-stat">
            <span class="lastman-stat-label">Still Standing</span>
            <span class="lastman-stat-val text-success">${data.aliveCount} / ${data.totalCount} Players</span>
          </div>
          <div class="lastman-banner-stat">
            <span class="lastman-stat-label">Eliminated</span>
            <span class="lastman-stat-val text-danger">${data.eliminatedCount} Players</span>
          </div>
        </div>
      `;
    }

    // 2. Render Table Header
    let theadHtml = `
      <th class="text-center pos-col" style="width: 44px;">Pos</th>
      <th class="sticky-col-name player-name-col" style="width: 180px;"><span class="th-full">Player Name</span><span class="th-short">Player</span></th>
      <th class="text-center lastman-status-col" style="width: 85px;">Status</th>
    `;

    for (let w = 1; w <= totalWeeks; w++) {
      const targetHole = getTargetHoleForWeek(w, cfg.holeOrder);
      const targetSI = targetHole ? targetHole.si : '-';
      const holeNum = targetHole ? targetHole.hole : '-';
      const holePar = targetHole ? targetHole.par : '-';
      theadHtml += `
        <th class="text-center lastman-week-col" title="Week ${w}: Hole ${holeNum} (Par ${holePar}, Stroke Index ${targetSI})">
          <div class="lastman-col-hole-head">H${holeNum}</div>
        </th>
      `;
    }

    elements.lastmanTheadTr.innerHTML = theadHtml;

    // 3. Filter Players
    const statusFilter = elements.lastmanFilterStatus ? elements.lastmanFilterStatus.value : 'all';
    const query = (elements.lastmanSearch ? elements.lastmanSearch.value : '').trim().toLowerCase();
    const hideUnplayed = elements.lastmanCfgHideUnplayed
      ? elements.lastmanCfgHideUnplayed.checked
      : Boolean(state.lastmanConfig.hideUnplayedEliminations);

    let filtered = data.players;
    if (statusFilter === 'alive') {
      filtered = filtered.filter(p => p.status === 'alive' || p.status === 'winner' || p.status === 'joint-winner');
    } else if (statusFilter === 'eliminated') {
      filtered = filtered.filter(p => p.status === 'eliminated');
    }

    if (hideUnplayed) {
      filtered = filtered.filter(p => !p.neverPlayedBeforeElim);
    }

    if (query) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }

    // 4. Render Table Body
    if (filtered.length === 0) {
      elements.lastmanTbody.innerHTML = `
        <tr>
          <td colspan="${3 + totalWeeks}" class="text-center" style="padding: 2rem; color: var(--text-muted);">
            No players found matching current filters.
          </td>
        </tr>
      `;
      return;
    }

    elements.lastmanTbody.innerHTML = '';
    filtered.forEach((player, idx) => {
      const posDisplay = player.status === 'winner'
        ? '👑 1'
        : (player.status === 'joint-winner'
            ? '🤝 T1'
            : (idx + 1));

      const statusBadge = player.status === 'winner'
        ? '<span class="lm-status-chip lm-winner">Winner 👑</span>'
        : (player.status === 'joint-winner'
            ? '<span class="lm-status-chip lm-joint">Joint 🤝</span>'
            : (player.status === 'alive'
                ? `<span class="lm-status-chip lm-alive" title="${player.lives} lives remaining">Alive ✅${cfg.initialLives > 0 ? ` (${player.lives}❤️)` : ''}</span>`
                : `<span class="lm-status-chip lm-elim" title="${escapeHtml(player.eliminationReason || '')}">Elim 💀 Wk ${player.eliminatedWeek || '-'}</span>`));

      let weekCellsHtml = '';
      for (let w = 1; w <= totalWeeks; w++) {
        const targetHole = getTargetHoleForWeek(w, cfg.holeOrder);
        const targetSI = targetHole ? targetHole.si : '-';
        const holeNum = targetHole ? targetHole.hole : '-';
        const holePar = targetHole ? targetHole.par : '-';

        const res = player.weeklyResults.get(w);
        if (!res || res.isPastElimination || res.isPostComp) {
          weekCellsHtml += `<td class="text-center lastman-cell-dash">-</td>`;
        } else if (res.played) {
          const cellTitle = res.isEliminated
            ? `Eliminated: Scored ${res.points} pt(s) on Hole ${holeNum} (Par ${holePar}, SI ${targetSI}) - Gross ${res.gross}`
            : `Hole ${holeNum} (Par ${holePar}, SI ${targetSI}): Gross ${res.gross} &rarr; ${res.points} pts`;
          weekCellsHtml += `<td class="text-center lastman-week-col" title="${escapeHtml(cellTitle)}">${renderPointChip(res.points)}</td>`;
        } else {
          // Missed week
          if (res.status === 'life_used') {
            weekCellsHtml += `
              <td class="text-center lastman-week-col">
                <span class="lastman-life-used" title="Missed Week ${w}: Used a life (${res.livesLeft} remaining)">💔</span>
              </td>
            `;
          } else {
            const outTitle = cfg.initialLives > 0
              ? `Missed Week ${w} with 0 lives remaining: Eliminated`
              : `Missed Week ${w} (0 lives competition): Eliminated`;
            weekCellsHtml += `
              <td class="text-center lastman-week-col">
                <span class="lastman-life-out" title="${escapeHtml(outTitle)}">💔</span>
              </td>
            `;
          }
        }
      }

      const tr = document.createElement('tr');
      tr.className = 'clickable-row' + (player.status === 'eliminated' ? ' lastman-row-eliminated' : '');
      tr.title = (player.eliminationReason ? player.eliminationReason + ' • ' : '') + 'Click to view survival log';
      tr.innerHTML = `
        <td class="text-center font-bold pos-col" style="color: var(--text-muted);">${posDisplay}</td>
        <td class="sticky-col-name player-name-cell">${escapeHtml(player.name)} <span class="player-hci">(${player.playingStrokes})</span></td>
        <td class="text-center lastman-status-col">${statusBadge}</td>
        ${weekCellsHtml}
      `;

      tr.addEventListener('click', () => {
        toggleLastManAccordion(tr, player, cfg, totalWeeks);
      });

      elements.lastmanTbody.appendChild(tr);
    });
  }

  /**
   * Bingo Competition Engine (Gross Pars & Net Birdies)
   * 
   * How Bingo Works:
   * 1. Dual Scoring Modes:
   *    - 'gross' (Gross Pars Mode):
   *      A hole is marked off ("hit") when the player registers a gross score equal to or
   *      better than the hole's par (gross > 0 and gross <= hole.par).
   *    - 'nett' (Net Birdies Mode):
   *      A hole is marked off ("hit") when the player registers a nett birdie or better
   *      (gross > 0 and (gross - strokes) <= hole.par - 1, or Stableford points >= 3).
   * 2. Champion / Winner Determination:
   *    - The first player to complete all 18 holes of the course is crowned Champion.
   *    - If multiple players finish in the same round, the player who achieved it in fewer
   *      total rounds played wins the tiebreaker.
   * 3. Leaderboard Ranking Hierarchy:
   *    - Tier 1: Players who achieved 18/18 Bingo (sorted by earliest week won, then fewest rounds taken).
   *    - Tier 2: Players still in progress (sorted by most holes hit DESC, then fewest rounds played ASC).
   *    - Tier 3: Unplayed players (0 rounds) placed at the bottom.
   * 4. Scorecard Accordion:
   *    - Clicking any row expands their full interactive 18-hole qualifying matrix card.
   * 
   * @param {number|null} asOfWeek - Week to compute standings up to (supports historical analysis)
   * @param {string} eligibility - 'league' (Winter League members only) or 'all' (Open to all club members)
   * @param {string} mode - 'gross' or 'nett'
   * @returns {Object} Complete bingo results: player ranking list, champion, and field metrics
   */
  function calculateParBingo(asOfWeek, eligibility, mode) {
    if (!state.course || !state.course.holes || state.course.holes.length === 0) {
      return { players: [], winner: null, totalEntrants: 0, mode: 'gross' };
    }

    const currentMode = mode || state.bingoMode || 'gross';
    const isNetBirdie = currentMode === 'nett';
    const holes = state.course.holes;
    const allMembers = Array.from(state.processedMembers.values());
    const entrants = (eligibility === 'all')
      ? allMembers
      : allMembers.filter(m => m.inLeague);

    const targetWeek = asOfWeek !== undefined && asOfWeek !== null ? asOfWeek : (state.parbingoWeek || state.latestWeek);

    // Initialize player tracking
    const playerTrackers = entrants.map(m => {
      let cutsPriorToTarget = 0.0;
      if (m.weeklyCuts) {
        m.weeklyCuts.forEach((cutVal, w) => {
          if (w < targetWeek && cutVal !== null && cutVal !== undefined) {
            cutsPriorToTarget += cutVal;
          }
        });
      }
      const enteringHCI = round1(m.origHCI + cutsPriorToTarget);
      const roundAtWeek = m.weeklyRounds ? m.weeklyRounds.get(targetWeek) : null;
      const playingStrokes = roundAtWeek
        ? roundAtWeek.playingHcap
        : calculatePlayingHandicap(enteringHCI, state.course);

      let cutsUpToTarget = cutsPriorToTarget;
      const thisCut = m.weeklyCuts ? m.weeklyCuts.get(targetWeek) : null;
      if (thisCut !== null && thisCut !== undefined) {
        cutsUpToTarget = round1(cutsUpToTarget + thisCut);
      }
      const activeHCI = round1(m.origHCI + cutsUpToTarget);

      return {
        memberId: m.memberId,
        name: m.name,
        surname: getSurname(m.name),
        inLeague: m.inLeague,
        currentHCI: activeHCI,
        playingStrokes: playingStrokes,
        roundsPlayed: 0,
        roundsAtBingo: null,
        bingoWeek: null,
        latestRound: null,
        completedHoles: new Map() // holeIdx -> { firstWeek, bestGross, nett, strokes, par, points, isGross2, isEagleOrBetter }
      };
    });

    let firstWinner = null;

    for (let w = 1; w <= targetWeek; w++) {
      playerTrackers.forEach(p => {
        const rawMember = state.processedMembers.get(p.memberId);
        const round = rawMember ? rawMember.weeklyRounds.get(w) : null;
        if (!round) return;

        p.roundsPlayed++;
        p.latestRound = round;

        const grossScores = round.grossScores || [];
        const holeStrokes = round.holeStrokes || [];
        const holePoints = round.holePoints || [];

        for (let h = 0; h < 18; h++) {
          const g = grossScores[h];
          const par = holes[h].par;
          const strokes = holeStrokes[h] !== undefined ? holeStrokes[h] : 0;
          const pts = holePoints[h] !== undefined ? holePoints[h] : 0;
          const nett = (g !== undefined && g !== null && g > 0) ? (g - strokes) : 99;

          let isHit = false;
          if (isNetBirdie) {
            // Net Birdie or better: nett score <= par - 1 (or Stableford points >= 3)
            isHit = (g > 0 && nett <= (par - 1));
          } else {
            // Gross Par or better: gross score <= par
            isHit = (g > 0 && g <= par);
          }

          if (isHit) {
            const isEagleOrBetter = isNetBirdie ? (nett <= par - 2) : (g <= par - 2);
            if (!p.completedHoles.has(h)) {
              p.completedHoles.set(h, {
                firstWeek: w,
                bestGross: g,
                nett: nett,
                strokes: strokes,
                par: par,
                points: pts,
                isGross2: (g === 2),
                isUnderPar: isNetBirdie ? (nett < par) : (g < par),
                isEagleOrBetter: isEagleOrBetter
              });
            } else {
              const existing = p.completedHoles.get(h);
              const isBetter = isNetBirdie ? (nett < existing.nett) : (g < existing.bestGross);
              if (isBetter) {
                existing.bestGross = g;
                existing.nett = nett;
                existing.strokes = strokes;
                existing.points = pts;
                existing.isGross2 = (g === 2);
                existing.isUnderPar = isNetBirdie ? (nett < par) : (g < par);
                existing.isEagleOrBetter = isEagleOrBetter;
              }
            }
          }
        }

        // Check if player just achieved Bingo (18/18 holes completed)
        if (p.completedHoles.size === 18 && p.bingoWeek === null) {
          p.bingoWeek = w;
          p.roundsAtBingo = p.roundsPlayed;
          if (!firstWinner) {
            firstWinner = p;
          }
        }
      });
    }

    // Sort players:
    // 1. Bingo completed (bingoWeek !== null) sorted by bingoWeek ASC, then roundsAtBingo ASC, then surname ASC
    // 2. In progress sorted by completedHoles.size DESC, then roundsPlayed ASC (efficiency), then surname ASC
    playerTrackers.sort((a, b) => {
      const aWon = a.bingoWeek !== null;
      const bWon = b.bingoWeek !== null;

      if (aWon && !bWon) return -1;
      if (!aWon && bWon) return 1;

      if (aWon && bWon) {
        if (a.bingoWeek !== b.bingoWeek) return a.bingoWeek - b.bingoWeek;
        if (a.roundsAtBingo !== b.roundsAtBingo) return a.roundsAtBingo - b.roundsAtBingo;
        return a.surname.localeCompare(b.surname) || a.name.localeCompare(b.name);
      }

      if (b.completedHoles.size !== a.completedHoles.size) {
        return b.completedHoles.size - a.completedHoles.size;
      }

      if (a.roundsPlayed !== b.roundsPlayed) {
        if (a.roundsPlayed === 0) return 1;
        if (b.roundsPlayed === 0) return -1;
        return a.roundsPlayed - b.roundsPlayed;
      }

      return a.surname.localeCompare(b.surname) || a.name.localeCompare(b.name);
    });

    // Assign rank positions
    let i = 0;
    while (i < playerTrackers.length) {
      if (playerTrackers[i].roundsPlayed === 0) {
        playerTrackers[i].pos = '-';
        i++;
        continue;
      }

      let j = i + 1;
      while (
        j < playerTrackers.length &&
        playerTrackers[j].roundsPlayed > 0 &&
        playerTrackers[j].bingoWeek === playerTrackers[i].bingoWeek &&
        playerTrackers[j].completedHoles.size === playerTrackers[i].completedHoles.size &&
        playerTrackers[j].roundsPlayed === playerTrackers[i].roundsPlayed
      ) {
        j++;
      }
      const tiedGroupSize = j - i;
      const rankStr = tiedGroupSize > 1 ? `T${i + 1}` : `${i + 1}`;
      for (let k = i; k < j; k++) {
        playerTrackers[k].pos = rankStr;
      }
      i = j;
    }

    return {
      players: playerTrackers,
      winner: firstWinner,
      targetWeek: targetWeek,
      totalEntrants: entrants.length,
      mode: currentMode
    };
  }

  /**
   * Populate Bingo Week Selector
   */
  function populateParBingoWeekSelector() {
    if (!elements.parbingoWeekSelect) return;
    elements.parbingoWeekSelect.innerHTML = '';
    if (state.weeksData.length === 0) {
      const opt = document.createElement('option');
      opt.value = 0;
      opt.textContent = 'No weeks recorded';
      elements.parbingoWeekSelect.appendChild(opt);
      return;
    }

    const currentWeek = state.parbingoWeek || state.latestWeek;
    state.weeksData.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.weekNum;
      opt.textContent = `Week ${w.weekNum}`;
      if (w.weekNum === currentWeek) {
        opt.selected = true;
      }
      elements.parbingoWeekSelect.appendChild(opt);
    });

    updateParBingoNavButtons();
  }

  function updateParBingoNavButtons() {
    const currentWeek = state.parbingoWeek || state.latestWeek;
    if (elements.btnParbingoPrev) {
      elements.btnParbingoPrev.disabled = currentWeek <= 1;
    }
    if (elements.btnParbingoNext) {
      elements.btnParbingoNext.disabled = currentWeek >= state.latestWeek;
    }
  }

  /**
   * View: Bingo Renderer (Gross Pars & Net Birdies)
   */
  function renderParBingoView() {
    if (!elements.parbingoTbody) return;

    populateParBingoWeekSelector();

    const asOfWeek = state.parbingoWeek || state.latestWeek;
    const eligibility = (elements.parbingoFilterEligibility ? elements.parbingoFilterEligibility.value : '') || state.parbingoEligibility || 'league';
    state.parbingoEligibility = eligibility;
    const currentMode = state.bingoMode || 'gross';
    const isNetBirdie = currentMode === 'nett';

    // Synchronize mode buttons
    if (elements.btnBingoModeGross && elements.btnBingoModeNett) {
      if (isNetBirdie) {
        elements.btnBingoModeNett.classList.add('active');
        elements.btnBingoModeGross.classList.remove('active');
      } else {
        elements.btnBingoModeGross.classList.add('active');
        elements.btnBingoModeNett.classList.remove('active');
      }
    }

    const query = (elements.parbingoSearch ? elements.parbingoSearch.value : '').trim().toLowerCase();

    // Subtitle indicator
    if (elements.parbingoSubtitle) {
      const elLabel = eligibility === 'all' ? 'All Club Members (Open)' : 'Winter League Members Only';
      const targetLabel = isNetBirdie ? 'net birdie or better' : 'gross par or better';
      const formatLabel = isNetBirdie ? 'Net scores (after handicap strokes)' : 'Gross scores only';
      if (asOfWeek === state.latestWeek) {
        elements.parbingoSubtitle.textContent = `First player to register a ${targetLabel} on every hole on the course • ${elLabel} • ${formatLabel}`;
      } else {
        elements.parbingoSubtitle.innerHTML = `<span class="badge" style="background:#fef3c7; color:#b45309; font-weight:700; margin-right:6px;">Historical: Round ${asOfWeek}</span> State of play after Round ${asOfWeek} of ${state.latestWeek} • ${targetLabel} • ${elLabel}`;
      }
    }

    const bingoData = calculateParBingo(asOfWeek, eligibility, currentMode);
    const holes = state.course ? state.course.holes : [];

    // Render Winner / Progress Banner
    if (elements.parbingoBanner) {
      const modeTitle = isNetBirdie ? 'Net Birdies Bingo' : 'Gross Pars Bingo';
      const modeTargetDesc = isNetBirdie ? 'net birdie or better' : 'gross par or better';
      if (bingoData.winner) {
        const w = bingoData.winner;
        elements.parbingoBanner.innerHTML = `
          <div class="parbingo-banner-winner">
            <div class="parbingo-banner-title">
              🏆 ${modeTitle} Champion Crowned in Week ${w.bingoWeek}!
            </div>
            <div class="parbingo-banner-subtitle">
              <strong>${escapeHtml(w.name)}</strong> is the first player to register a ${modeTargetDesc} on all 18 holes of the course!
            </div>
            <div class="parbingo-banner-stats">
              <span class="parbingo-stat-pill">Winner: <strong>${escapeHtml(w.name)}</strong></span>
              <span class="parbingo-stat-pill">Winning Round: <strong>Week ${w.bingoWeek}</strong></span>
              <span class="parbingo-stat-pill">Rounds Taken: <strong>${w.roundsAtBingo}</strong></span>
              <span class="parbingo-stat-pill">Holes: <strong>18 / 18 Completed 🎯</strong></span>
            </div>
          </div>
        `;
      } else {
        const topContender = bingoData.players.find(p => p.roundsPlayed > 0);
        const topCount = topContender ? topContender.completedHoles.size : 0;
        const leaderName = topContender ? topContender.name : 'None';
        const remHoles = 18 - topCount;
        const activeCount = bingoData.players.filter(p => p.roundsPlayed > 0).length;

        elements.parbingoBanner.innerHTML = `
          <div class="parbingo-banner-progress">
            <div class="parbingo-banner-title">
              🎱 ${modeTitle} in Progress (Through Round ${asOfWeek} of ${state.latestWeek})
            </div>
            <div class="parbingo-banner-subtitle">
              No player has completed all 18 holes yet. Current leader: <strong>${escapeHtml(leaderName)}</strong> with <strong>${topCount} / 18 holes</strong>!
            </div>
            <div class="parbingo-banner-stats">
              <span class="parbingo-stat-pill">Leader: <strong>${escapeHtml(leaderName)}</strong> (${topCount}/18)</span>
              <span class="parbingo-stat-pill">Needed to Win: <strong>${remHoles} hole${remHoles === 1 ? '' : 's'}</strong></span>
              <span class="parbingo-stat-pill">Active Players: <strong>${activeCount}</strong></span>
            </div>
          </div>
        `;
      }
    }

    // Render Table Header with Hole info
    if (elements.parbingoTheadTr) {
      let holeHeadersHtml = '';
      holes.forEach(h => {
        const subLabel = isNetBirdie ? `SI${h.si}` : `P${h.par}`;
        holeHeadersHtml += `
          <th class="text-center hole-col" title="Hole ${h.hole} • Par ${h.par} • Stroke Index ${h.si}">
            H${h.hole}<br><span style="font-size:0.7rem; font-weight:normal; opacity:0.85;">${subLabel}</span>
          </th>
        `;
      });

      const hitTitle = isNetBirdie ? 'Holes with net birdie or better (nett <= par - 1)' : 'Holes with gross par or better';
      elements.parbingoTheadTr.innerHTML = `
        <th class="text-center pos-col" style="width: 50px;">Pos</th>
        <th class="sticky-col-name player-name-col" style="width: 20%; min-width: 170px;"><span class="th-full">Player Name</span><span class="th-short">Player</span></th>
        <th class="text-center bingo-status-col" style="width: 110px;">Status</th>
        <th class="text-center rounds-col" style="width: 50px;" title="Rounds played up to Week ${asOfWeek}">Rds</th>
        ${holeHeadersHtml}
        <th class="text-center bingo-hit-col" style="width: 50px;" title="${hitTitle}">Hit</th>
        <th class="text-center bingo-rem-col" style="width: 50px;" title="Holes remaining to complete Bingo">Rem</th>
      `;
    }

    // Render Table Body
    elements.parbingoTbody.innerHTML = '';

    let displayList = bingoData.players;
    if (query) {
      displayList = displayList.filter(p => p.name.toLowerCase().includes(query));
    }

    if (displayList.length === 0) {
      elements.parbingoTbody.innerHTML = `
        <tr>
          <td colspan="23" class="empty-state">No matching players found.</td>
        </tr>
      `;
      return;
    }

    displayList.forEach(p => {
      const tr = document.createElement('tr');
      const hasRound = Boolean(p.latestRound);
      if (hasRound) {
        tr.className = 'clickable-row';
        tr.title = 'Click to view scorecard';
      }

      let rankClass = '';
      if (p.bingoWeek !== null) {
        if (p === bingoData.winner) {
          rankClass = 'rank-top-1';
        } else {
          rankClass = 'rank-top-2';
        }
      }

      // Status badge
      let statusHtml = '';
      if (p.bingoWeek !== null) {
        statusHtml = `<span class="badge-bingo-won" title="Completed all 18 holes in Week ${p.bingoWeek}!">🎉 Wk ${p.bingoWeek} BINGO</span>`;
      } else {
        statusHtml = `<span class="badge-bingo-count" title="${p.completedHoles.size} of 18 holes completed">${p.completedHoles.size} / 18</span>`;
      }

      // Hole cells
      let holeCellsHtml = '';
      for (let h = 0; h < 18; h++) {
        if (p.completedHoles.has(h)) {
          const entry = p.completedHoles.get(h);
          let chipClass = 'bingo-hit';
          let displayVal = entry.bestGross;

          if (isNetBirdie) {
            // Net Birdie display: show nett score with points and strokes in tooltip
            displayVal = entry.nett;
            if (entry.isEagleOrBetter) {
              chipClass += ' under-par';
            }
            if (entry.isGross2) {
              chipClass += ' gross-2';
            }
            const tip = `Hole ${h + 1} (Par ${entry.par}, SI ${holes[h] ? holes[h].si : '-'}): Nett ${entry.nett} (Gross ${entry.bestGross} - ${entry.strokes} stks = ${entry.points} pts) in Wk ${entry.firstWeek}`;
            holeCellsHtml += `<td class="text-center hole-col" title="${escapeHtml(tip)}"><span class="${chipClass}">${displayVal}</span></td>`;
          } else {
            // Gross Par display
            if (entry.isGross2) {
              chipClass += ' gross-2';
            } else if (entry.isUnderPar) {
              chipClass += ' under-par';
            }
            const tip = `Hole ${h + 1} (Par ${entry.par}): Gross ${entry.bestGross} in Wk ${entry.firstWeek}`;
            holeCellsHtml += `<td class="text-center hole-col" title="${escapeHtml(tip)}"><span class="${chipClass}">${displayVal}</span></td>`;
          }
        } else {
          const par = holes[h] ? holes[h].par : 4;
          const si = holes[h] ? holes[h].si : '-';
          const tip = isNetBirdie
            ? `Hole ${h + 1} (Par ${par}, SI ${si}): Needs net birdie or better`
            : `Hole ${h + 1} (Par ${par}): Needs gross par (${par}) or better`;
          holeCellsHtml += `<td class="text-center hole-col" title="${escapeHtml(tip)}"><span class="bingo-miss">-</span></td>`;
        }
      }

      const completedCount = p.completedHoles.size;
      const remCount = 18 - completedCount;

      const hitColor = completedCount === 18 ? '#166534' : 'var(--text-main)';
      const remColor = remCount === 0 ? 'var(--text-light)' : (remCount <= 3 ? '#b91c1c' : 'var(--text-muted)');
      const remWeight = remCount <= 3 && remCount > 0 ? '700' : 'normal';

      tr.innerHTML = `
        <td class="text-center pos-col"><span class="rank-badge ${rankClass}">${p.pos}</span></td>
        <td class="sticky-col-name player-name-cell">${escapeHtml(p.name)} <span class="player-hci">(${p.playingStrokes})</span></td>
        <td class="text-center bingo-status-col">${statusHtml}</td>
        <td class="text-center font-bold rounds-col" style="color: var(--text-muted);">${p.roundsPlayed}</td>
        ${holeCellsHtml}
        <td class="text-center font-bold bingo-hit-col" style="color: ${hitColor};">${completedCount}</td>
        <td class="text-center bingo-rem-col" style="color: ${remColor}; font-weight: ${remWeight};">${remCount}</td>
      `;

      if (p.roundsPlayed > 0 || hasRound) {
        tr.addEventListener('click', () => {
          toggleBingoAccordion(tr, p, holes, isNetBirdie);
        });
      }

      elements.parbingoTbody.appendChild(tr);
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Closes any open accordion rows across all tables
   */
  function closeAllAccordions() {
    document.querySelectorAll('.clickable-row.accordion-open').forEach(r => r.classList.remove('accordion-open'));
    document.querySelectorAll('.accordion-detail-row').forEach(d => d.remove());
  }

  /**
   * Resets all search inputs and view filters to default clean state
   */
  function resetAllSearchInputs(preservePlayer = false) {
    if (elements.leaderboardSearch) elements.leaderboardSearch.value = '';
    if (elements.weeklySearch) elements.weeklySearch.value = '';
    if (elements.eclecticSearch) elements.eclecticSearch.value = '';
    if (elements.magic2sSearch) elements.magic2sSearch.value = '';
    if (elements.handicapSearch) elements.handicapSearch.value = '';
    if (elements.lastmanSearch) elements.lastmanSearch.value = '';
    if (elements.parbingoSearch) elements.parbingoSearch.value = '';

    // Reset eclectic scoring mode to default 'nett' and clear sort
    state.eclecticScoringMode = 'nett';
    if (elements.eclecticScoringMode) elements.eclecticScoringMode.value = 'nett';
    state.eclecticSortCol = null;
    state.eclecticSortDir = 'desc';

    if (!preservePlayer) {
      state.selectedPlayerId = null;
      state.playersViewMode = 'profile';
      if (elements.playerSearchInput) elements.playerSearchInput.value = '';
      if (elements.playerSuggestions) elements.playerSuggestions.style.display = 'none';
      if (elements.btnPlayersModeProfile && elements.btnPlayersModeRoster) {
        elements.btnPlayersModeProfile.classList.add('active');
        elements.btnPlayersModeRoster.classList.remove('active');
      }
      if (elements.playersProfileView && elements.playersRosterView) {
        elements.playersProfileView.style.display = 'block';
        elements.playersRosterView.style.display = 'none';
      }
      renderPlayerQuickPicks();
    }
  }

  /**
   * Re-renders a specific view tab
   */
  function renderTab(tabId) {
    if (!state.weeksData || state.weeksData.length === 0) return;
    switch (tabId) {
      case 'tab-leaderboard':
        renderLeaderboardView();
        break;
      case 'tab-weekly':
        renderWeeklyView();
        break;
      case 'tab-eclectic':
        renderEclecticView();
        break;
      case 'tab-magic2s':
        renderMagic2sView();
        break;
      case 'tab-player':
        if (state.playersViewMode === 'roster') {
          renderHandicapView();
        } else {
          renderPlayerTrackerView();
        }
        break;
      case 'tab-lastman':
        renderLastManView();
        break;
      case 'tab-parbingo':
        renderParBingoView();
        break;
    }
  }

  /**
   * Unified Tab Activation (Desktop Tab Buttons & Mobile Dropdown)
   * Resets open accordions and search inputs to default when switching between screens.
   */
  function activateTab(targetTab, preservePlayer = false) {
    if (!targetTab) return;
    const prevTab = state.activeTab;
    state.activeTab = targetTab;

    const isTabSwitch = prevTab !== targetTab;

    if (isTabSwitch || !preservePlayer) {
      // 1. Close any open accordions across all screens
      closeAllAccordions();

      // 2. Reset search inputs across all screens
      resetAllSearchInputs(preservePlayer);

      // 3. Reset Winter League & Eclectic sorting to natural Pos ranking
      if (state.leaderboardSortCol !== null) {
        state.leaderboardSortCol = null;
        state.leaderboardSortDir = 'desc';
      }
      if (state.eclecticSortCol !== null) {
        state.eclecticSortCol = null;
        state.eclecticSortDir = 'desc';
      }

      // 4. Re-render the target view to guarantee clean default state
      renderTab(targetTab);
    }

    elements.tabButtons.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetTab);
    });
    elements.viewPanels.forEach(p => {
      p.classList.toggle('active', p.id === targetTab);
    });
    if (elements.mobileTabSelect && elements.mobileTabSelect.value !== targetTab) {
      const opt = elements.mobileTabSelect.querySelector(`option[value="${targetTab}"]`);
      if (opt) {
        elements.mobileTabSelect.value = targetTab;
      }
    }
  }

  /**
   * Navigation Tabs, Visibility & Dynamic Ordering Engine
   */
  const ALL_TABS = [
    { id: 'tab-leaderboard', name: 'Winter League', icon: '🏆', defaultOrder: 1 },
    { id: 'tab-weekly', name: 'Weekend Stableford', icon: '📅', defaultOrder: 2 },
    { id: 'tab-eclectic', name: 'Eclectic', icon: '🎯', defaultOrder: 3 },
    { id: 'tab-magic2s', name: 'Magic 2\'s', icon: '🪄', defaultOrder: 4 },
    { id: 'tab-lastman', name: 'Last Man Standing', icon: '⚔️', defaultOrder: 5 },
    { id: 'tab-parbingo', name: 'Bingo', icon: '🎱', defaultOrder: 6 },
    { id: 'tab-player', name: 'Player Profile', icon: '👤', defaultOrder: 7 }
  ];

  function getTabVisibilityConfig(tabId) {
    if (!state.tabsConfig) return null;
    const map = state.tabsConfig.tabs || state.tabsConfig;
    return map[tabId] || null;
  }

  function isTabHiddenOnDesktop(tabId) {
    const cfg = getTabVisibilityConfig(tabId);
    if (!cfg) return false;
    return Boolean(cfg.hideDesktop || cfg.hideOnDesktop);
  }

  function isTabHiddenOnMobile(tabId) {
    const cfg = getTabVisibilityConfig(tabId);
    if (!cfg) return false;
    return Boolean(cfg.hideMobile || cfg.hideOnMobile);
  }

  /**
   * Computes the ordered tab definitions based on config/tabs.json (explicit 'order' or key sequence).
   */
  function getOrderedTabs() {
    const rawMap = (state.tabsConfig && (state.tabsConfig.tabs || state.tabsConfig)) || {};
    const keysInConfig = Object.keys(rawMap);

    const list = ALL_TABS.map(base => {
      const cfg = rawMap[base.id] || {};
      const name = cfg.name || base.name;
      const icon = (cfg.icon && cfg.icon !== '??' && cfg.icon !== '?') ? cfg.icon : base.icon;
      let order = base.defaultOrder;
      if (typeof cfg.order === 'number') {
        order = cfg.order;
      } else if (keysInConfig.includes(base.id)) {
        order = keysInConfig.indexOf(base.id) + 1;
      }
      return {
        id: base.id,
        name: name,
        icon: icon,
        label: `${icon} ${name}`.trim(),
        order: order
      };
    });

    list.sort((a, b) => a.order - b.order);
    return list;
  }

  /**
   * Dynamically applies tab ordering and visibility rules to desktop navigation buttons
   * and the mobile dropdown selector. Switches to first visible tab if active tab is hidden.
   */
  function applyTabVisibility() {
    const isMobile = window.innerWidth <= 1024;
    const orderedTabs = getOrderedTabs();

    // 1. Desktop Tab Buttons in .tab-nav (re-ordered dynamically in DOM)
    const tabNav = elements.tabNav || document.querySelector('.tab-nav');
    if (tabNav) {
      orderedTabs.forEach(t => {
        const btn = tabNav.querySelector(`.tab-btn[data-tab="${t.id}"]`);
        if (btn) {
          btn.innerHTML = `${t.icon} ${t.name}`;
          btn.style.display = isTabHiddenOnDesktop(t.id) ? 'none' : '';
          tabNav.appendChild(btn); // Re-orders existing DOM node without losing listeners
        }
      });
    }

    // 2. Mobile Select Dropdown Options (#mobile-tab-select)
    if (elements.mobileTabSelect) {
      const currentSelected = state.activeTab || elements.mobileTabSelect.value;
      elements.mobileTabSelect.innerHTML = '';
      orderedTabs.forEach(t => {
        if (!isTabHiddenOnMobile(t.id)) {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = t.label;
          if (t.id === currentSelected) {
            opt.selected = true;
          }
          elements.mobileTabSelect.appendChild(opt);
        }
      });
    }

    // 3. Ensure the active tab is visible in the current viewport; if hidden, switch to first visible
    const currentTab = state.activeTab;
    const isCurrentHidden = isMobile ? isTabHiddenOnMobile(currentTab) : isTabHiddenOnDesktop(currentTab);
    if (isCurrentHidden || !currentTab) {
      const firstVisible = orderedTabs.find(t => isMobile ? !isTabHiddenOnMobile(t.id) : !isTabHiddenOnDesktop(t.id));
      if (firstVisible) {
        activateTab(firstVisible.id);
      }
    }
  }

  /**
   * Event Listeners Setup
   */
  function setupEventListeners() {
    // Tab Switching (Desktop buttons & mobile select)
    elements.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        activateTab(targetTab);
      });
    });

    if (elements.mobileTabSelect) {
      elements.mobileTabSelect.addEventListener('change', (e) => {
        activateTab(e.target.value);
      });
    }

    // Dynamic tab visibility responsive resize handler
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        applyTabVisibility();
      }, 100);
    });

    // Winter League table header sorting
    // 1st click: smallest to largest (asc) for 'pos' (winner first) and 'cut' (biggest cuts first)
    // 1st click: largest to smallest (desc) for 'rounds', 'avg', 'money', 'total'
    // 2nd click: reverses direction, subsequent clicks toggle back and forth
    const leaderboardSortThs = document.querySelectorAll('#leaderboard-table th.sortable-th');
    leaderboardSortThs.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (!col) return;
        if (state.leaderboardSortCol === col) {
          state.leaderboardSortDir = state.leaderboardSortDir === 'desc' ? 'asc' : 'desc';
        } else {
          state.leaderboardSortCol = col;
          // For 'pos' (lower rank = winner) and 'cut' (negative value = bigger cut),
          // 1st click sorts smallest to largest (asc). Other columns sort largest to smallest (desc).
          state.leaderboardSortDir = (col === 'cut' || col === 'pos') ? 'asc' : 'desc';
        }
        renderLeaderboardView();
      });
    });

    // Leaderboard search & week navigation
    if (elements.leaderboardSearch) {
      elements.leaderboardSearch.addEventListener('input', () => {
        renderLeaderboardView();
      });
    }

    if (elements.btnLeaderboardPrev) {
      elements.btnLeaderboardPrev.addEventListener('click', () => {
        const current = state.leaderboardWeek || state.latestWeek;
        if (current > 1) {
          state.leaderboardWeek = current - 1;
          renderLeaderboardView();
        }
      });
    }

    if (elements.btnLeaderboardNext) {
      elements.btnLeaderboardNext.addEventListener('click', () => {
        const current = state.leaderboardWeek || state.latestWeek;
        if (current < state.latestWeek) {
          state.leaderboardWeek = current + 1;
          renderLeaderboardView();
        }
      });
    }

    if (elements.leaderboardWeekSelect) {
      elements.leaderboardWeekSelect.addEventListener('change', (e) => {
        const selected = parseInt(e.target.value, 10);
        if (selected >= 1 && selected <= state.latestWeek) {
          state.leaderboardWeek = selected;
          renderLeaderboardView();
        }
      });
    }

    // Week selector and navigation
    if (elements.btnWeeklyPrev) {
      elements.btnWeeklyPrev.addEventListener('click', () => {
        const current = state.selectedWeek || state.latestWeek;
        if (current > 1) {
          state.selectedWeek = current - 1;
          renderWeeklyView();
        }
      });
    }

    if (elements.btnWeeklyNext) {
      elements.btnWeeklyNext.addEventListener('click', () => {
        const current = state.selectedWeek || state.latestWeek;
        if (current < state.latestWeek) {
          state.selectedWeek = current + 1;
          renderWeeklyView();
        }
      });
    }

    if (elements.weekSelect) {
      elements.weekSelect.addEventListener('change', (e) => {
        state.selectedWeek = parseInt(e.target.value, 10);
        renderWeeklyView();
      });
    }

    // Weekly search & non-league toggle
    if (elements.weeklySearch) {
      elements.weeklySearch.addEventListener('input', () => {
        renderWeeklyView();
      });
    }

    if (elements.weeklyHideNonLeague) {
      elements.weeklyHideNonLeague.addEventListener('change', () => {
        renderWeeklyView();
      });
    }

    // Eclectic search, filter & week navigation
    if (elements.eclecticSearch) {
      elements.eclecticSearch.addEventListener('input', () => {
        renderEclecticView();
      });
    }

    if (elements.eclecticHideNonLeague) {
      elements.eclecticHideNonLeague.addEventListener('change', () => {
        renderEclecticView();
      });
    }

    if (elements.eclecticScoringMode) {
      elements.eclecticScoringMode.addEventListener('change', (e) => {
        state.eclecticScoringMode = e.target.value;
        state.eclecticSortCol = null;
        state.eclecticSortDir = 'desc';
        renderEclecticView();
      });
    }

    // Eclectic table header sorting
    // 1st click: smallest to largest (asc) for 'pos' (winner first)
    // 1st click: largest to smallest (desc) for 'rounds', 'points', 'nett'
    // Subsequent clicks: reverse direction
    if (elements.eclecticTheadTr) {
      elements.eclecticTheadTr.addEventListener('click', (e) => {
        const th = e.target.closest('th.sortable-th');
        if (!th) return;
        const col = th.getAttribute('data-sort');
        if (!col) return;
        if (state.eclecticSortCol === col) {
          state.eclecticSortDir = state.eclecticSortDir === 'desc' ? 'asc' : 'desc';
        } else {
          state.eclecticSortCol = col;
          // 'pos' sorts low to high (asc) on first click; 'rounds', 'points', 'nett' sort high to low (desc)
          state.eclecticSortDir = (col === 'pos') ? 'asc' : 'desc';
        }
        renderEclecticView();
      });
    }

    if (elements.btnEclecticPrev) {
      elements.btnEclecticPrev.addEventListener('click', () => {
        const current = state.eclecticWeek || state.latestWeek;
        if (current > 1) {
          state.eclecticWeek = current - 1;
          renderEclecticView();
        }
      });
    }
    if (elements.btnEclecticNext) {
      elements.btnEclecticNext.addEventListener('click', () => {
        const current = state.eclecticWeek || state.latestWeek;
        if (current < state.latestWeek) {
          state.eclecticWeek = current + 1;
          renderEclecticView();
        }
      });
    }
    if (elements.eclecticWeekSelect) {
      elements.eclecticWeekSelect.addEventListener('change', (e) => {
        const selected = parseInt(e.target.value, 10);
        if (selected >= 1 && selected <= state.latestWeek) {
          state.eclecticWeek = selected;
          renderEclecticView();
        }
      });
    }

    // Magic 2's search, filter, subview & week navigation
    if (elements.magic2sSearch) {
      elements.magic2sSearch.addEventListener('input', () => {
        renderMagic2sView();
      });
    }

    if (elements.magic2sHideNonLeague) {
      elements.magic2sHideNonLeague.addEventListener('change', () => {
        renderMagic2sView();
      });
    }

    if (elements.btnMagic2sPrev) {
      elements.btnMagic2sPrev.addEventListener('click', () => {
        const current = state.magic2sWeek || state.latestWeek;
        if (current > 1) {
          state.magic2sWeek = current - 1;
          renderMagic2sView();
        }
      });
    }

    if (elements.btnMagic2sNext) {
      elements.btnMagic2sNext.addEventListener('click', () => {
        const current = state.magic2sWeek || state.latestWeek;
        if (current < state.latestWeek) {
          state.magic2sWeek = current + 1;
          renderMagic2sView();
        }
      });
    }

    if (elements.magic2sWeekSelect) {
      elements.magic2sWeekSelect.addEventListener('change', (e) => {
        const selected = parseInt(e.target.value, 10);
        if (selected >= 1 && selected <= state.latestWeek) {
          state.magic2sWeek = selected;
          renderMagic2sView();
        }
      });
    }


    // Unified Player Profile mode toggle & navigation buttons
    if (elements.btnPlayersModeProfile) {
      elements.btnPlayersModeProfile.addEventListener('click', () => {
        switchPlayersViewMode('profile');
      });
    }
    if (elements.btnPlayersModeRoster) {
      elements.btnPlayersModeRoster.addEventListener('click', () => {
        switchPlayersViewMode('roster');
      });
    }
    if (elements.btnGotoRoster) {
      elements.btnGotoRoster.addEventListener('click', () => {
        switchPlayersViewMode('roster');
      });
    }
    if (elements.btnBackToProfile) {
      elements.btnBackToProfile.addEventListener('click', () => {
        switchPlayersViewMode('profile');
      });
    }

    // Handicap filters & cuts rules inspector
    if (elements.handicapFilterLeague) {
      elements.handicapFilterLeague.addEventListener('change', () => {
        renderHandicapView();
      });
    }
    if (elements.handicapSearch) {
      elements.handicapSearch.addEventListener('input', () => {
        renderHandicapView();
      });
    }
    if (elements.btnToggleCutsRules && elements.cutsRulesCard) {
      elements.btnToggleCutsRules.addEventListener('click', () => {
        const isShown = elements.cutsRulesCard.style.display !== 'none';
        elements.cutsRulesCard.style.display = isShown ? 'none' : 'block';
        if (!isShown) {
          renderCutsRulesInfo();
        }
      });
    }
    if (elements.btnCloseCutsRules && elements.cutsRulesCard) {
      elements.btnCloseCutsRules.addEventListener('click', () => {
        elements.cutsRulesCard.style.display = 'none';
      });
    }

    // Player Tracker search and suggestions
    if (elements.playerSearchInput) {
      elements.playerSearchInput.addEventListener('input', (e) => {
        renderPlayerSuggestions(e.target.value);
      });

      elements.playerSearchInput.addEventListener('focus', (e) => {
        if (e.target.value.trim().length > 0) {
          renderPlayerSuggestions(e.target.value);
        }
      });

      elements.playerSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (elements.playerSuggestions) {
            const firstItem = elements.playerSuggestions.querySelector('.player-suggestion-item');
            if (firstItem) {
              firstItem.click();
            }
          }
        } else if (e.key === 'Escape') {
          if (elements.playerSuggestions) {
            elements.playerSuggestions.style.display = 'none';
          }
        }
      });

      // Dismiss suggestions when clicking outside
      document.addEventListener('click', (e) => {
        if (
          elements.playerSearchInput &&
          elements.playerSuggestions &&
          !elements.playerSearchInput.contains(e.target) &&
          !elements.playerSuggestions.contains(e.target)
        ) {
          elements.playerSuggestions.style.display = 'none';
        }
      });
    }

    // Last Man Standing filters and settings
    if (elements.lastmanFilterStatus) {
      elements.lastmanFilterStatus.addEventListener('change', () => {
        renderLastManView();
      });
    }
    if (elements.lastmanSearch) {
      elements.lastmanSearch.addEventListener('input', () => {
        renderLastManView();
      });
    }
    if (elements.btnLastmanPrev) {
      elements.btnLastmanPrev.addEventListener('click', () => {
        const current = state.lastmanWeek || state.latestWeek;
        if (current > 1) {
          state.lastmanWeek = current - 1;
          renderLastManView();
        }
      });
    }
    if (elements.btnLastmanNext) {
      elements.btnLastmanNext.addEventListener('click', () => {
        const current = state.lastmanWeek || state.latestWeek;
        if (current < state.latestWeek) {
          state.lastmanWeek = current + 1;
          renderLastManView();
        }
      });
    }
    if (elements.lastmanWeekSelect) {
      elements.lastmanWeekSelect.addEventListener('change', (e) => {
        const selected = parseInt(e.target.value, 10);
        if (selected >= 1 && selected <= state.latestWeek) {
          state.lastmanWeek = selected;
          renderLastManView();
        }
      });
    }
    if (elements.lastmanCfgPoints) {
      elements.lastmanCfgPoints.addEventListener('change', () => {
        renderLastManView();
      });
    }
    if (elements.lastmanCfgOrder) {
      elements.lastmanCfgOrder.addEventListener('change', () => {
        renderLastManView();
      });
    }
    if (elements.lastmanCfgEligibility) {
      elements.lastmanCfgEligibility.addEventListener('change', () => {
        renderLastManView();
      });
    }
    if (elements.lastmanCfgLives) {
      elements.lastmanCfgLives.addEventListener('change', () => {
        renderLastManView();
      });
    }
    if (elements.lastmanCfgHideUnplayed) {
      elements.lastmanCfgHideUnplayed.addEventListener('change', () => {
        renderLastManView();
      });
    }
    if (elements.btnResetLastmanCfg) {
      elements.btnResetLastmanCfg.addEventListener('click', () => {
        syncLastManSettingsControls();
        renderLastManView();
      });
    }

    // Bingo Mode toggle (Gross Pars vs Net Birdies)
    if (elements.btnBingoModeGross) {
      elements.btnBingoModeGross.addEventListener('click', () => {
        if (state.bingoMode !== 'gross') {
          state.bingoMode = 'gross';
          renderParBingoView();
        }
      });
    }

    if (elements.btnBingoModeNett) {
      elements.btnBingoModeNett.addEventListener('click', () => {
        if (state.bingoMode !== 'nett') {
          state.bingoMode = 'nett';
          renderParBingoView();
        }
      });
    }

    // Bingo filters, search & week navigation
    if (elements.btnParbingoPrev) {
      elements.btnParbingoPrev.addEventListener('click', () => {
        const current = state.parbingoWeek || state.latestWeek;
        if (current > 1) {
          state.parbingoWeek = current - 1;
          renderParBingoView();
        }
      });
    }

    if (elements.btnParbingoNext) {
      elements.btnParbingoNext.addEventListener('click', () => {
        const current = state.parbingoWeek || state.latestWeek;
        if (current < state.latestWeek) {
          state.parbingoWeek = current + 1;
          renderParBingoView();
        }
      });
    }

    if (elements.parbingoWeekSelect) {
      elements.parbingoWeekSelect.addEventListener('change', (e) => {
        const selected = parseInt(e.target.value, 10);
        if (selected >= 1 && selected <= state.latestWeek) {
          state.parbingoWeek = selected;
          renderParBingoView();
        }
      });
    }

    if (elements.parbingoFilterEligibility) {
      elements.parbingoFilterEligibility.addEventListener('change', (e) => {
        state.parbingoEligibility = e.target.value;
        renderParBingoView();
      });
    }

    if (elements.parbingoSearch) {
      elements.parbingoSearch.addEventListener('input', () => {
        renderParBingoView();
      });
    }

    // Dismiss local notice banner
    if (elements.localNoticeClose && elements.localProtocolBanner) {
      elements.localNoticeClose.addEventListener('click', () => {
        elements.localProtocolBanner.style.display = 'none';
      });
    }
  }

  // Initial Boot
  document.addEventListener('DOMContentLoaded', () => {
    // Show initial active tab & synchronize desktop buttons + mobile selector
    activateTab(state.activeTab);

    setupEventListeners();
    loadData();
  });

})();
