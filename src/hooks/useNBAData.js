import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';

const LEAGUE_AVG = 115.5;
const HOME_ADVANTAGE = 3.0;
const EMA_ALPHA = 2 / (25 + 1); // ~0.077 for a 25-game EMA

// Mock data to ensure the UI ALWAYS works, even without API keys or if rate limited
const MOCK_TEAMS = [
    { id: 2, name: 'Celtics', full_name: 'Boston Celtics', abbreviation: 'BOS', off_rating: 122.5, def_rating: 110.1 },
    { id: 14, name: 'Lakers', full_name: 'Los Angeles Lakers', abbreviation: 'LAL', off_rating: 114.2, def_rating: 115.8 },
    { id: 8, name: 'Nuggets', full_name: 'Denver Nuggets', abbreviation: 'DEN', off_rating: 118.0, def_rating: 112.5 },
    { id: 16, name: 'Heat', full_name: 'Miami Heat', abbreviation: 'MIA', off_rating: 112.0, def_rating: 111.0 },
    { id: 10, name: 'Warriors', full_name: 'Golden State Warriors', abbreviation: 'GSW', off_rating: 116.5, def_rating: 114.0 },
    { id: 24, name: 'Suns', full_name: 'Phoenix Suns', abbreviation: 'PHX', off_rating: 117.2, def_rating: 116.1 }
];

export const DEFAULT_RATINGS = {
    'Atlanta Hawks': { off_rating: 116.4, def_rating: 118.4 },
    'Boston Celtics': { off_rating: 122.2, def_rating: 110.5 },
    'Brooklyn Nets': { off_rating: 114.6, def_rating: 115.4 },
    'Charlotte Hornets': { off_rating: 108.9, def_rating: 119.2 },
    'Chicago Bulls': { off_rating: 113.8, def_rating: 115.7 },
    'Cleveland Cavaliers': { off_rating: 114.7, def_rating: 112.1 },
    'Dallas Mavericks': { off_rating: 117.5, def_rating: 114.9 },
    'Denver Nuggets': { off_rating: 117.2, def_rating: 112.3 },
    'Detroit Pistons': { off_rating: 109.0, def_rating: 118.0 },
    'Golden State Warriors': { off_rating: 116.9, def_rating: 115.2 },
    'Houston Rockets': { off_rating: 113.7, def_rating: 112.8 },
    'Indiana Pacers': { off_rating: 120.5, def_rating: 117.6 },
    'LA Clippers': { off_rating: 117.9, def_rating: 114.6 },
    'Los Angeles Lakers': { off_rating: 114.8, def_rating: 114.8 },
    'Memphis Grizzlies': { off_rating: 106.8, def_rating: 113.7 },
    'Miami Heat': { off_rating: 113.3, def_rating: 111.5 },
    'Milwaukee Bucks': { off_rating: 117.6, def_rating: 116.4 },
    'Minnesota Timberwolves': { off_rating: 114.6, def_rating: 108.4 },
    'New Orleans Pelicans': { off_rating: 116.5, def_rating: 111.9 },
    'New York Knicks': { off_rating: 117.3, def_rating: 111.6 },
    'Oklahoma City Thunder': { off_rating: 118.3, def_rating: 111.0 },
    'Orlando Magic': { off_rating: 112.9, def_rating: 110.8 },
    'Philadelphia 76ers': { off_rating: 117.8, def_rating: 112.0 },
    'Phoenix Suns': { off_rating: 116.8, def_rating: 113.7 },
    'Portland Trail Blazers': { off_rating: 108.6, def_rating: 118.9 },
    'Sacramento Kings': { off_rating: 116.2, def_rating: 114.4 },
    'San Antonio Spurs': { off_rating: 109.3, def_rating: 115.6 },
    'Toronto Raptors': { off_rating: 111.4, def_rating: 118.1 },
    'Utah Jazz': { off_rating: 114.5, def_rating: 119.6 },
    'Washington Wizards': { off_rating: 110.2, def_rating: 118.9 }
};

export function useNBAData(isHistory = false) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                // Date handling
                const today = new Date();
                const targetDate = isHistory ? format(addDays(today, -1), 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd');
                const seasonStartDate = format(addDays(today, -100), 'yyyy-MM-dd'); // Rough 100 day lookback for at least 25 games

                // 1. Fetch Modifiers from Supabase
                let teamModifiers = [];
                try {
                    const res = await supabase.from('team_modifiers').select('*');
                    if (res.data) teamModifiers = res.data;
                } catch (e) {
                    // Failsafe for missing config
                }

                const modifiersMap = {};
                const defModifiersMap = {};
                const hgaMap = {};
                if (teamModifiers) {
                    teamModifiers.forEach(m => {
                        const offVal = m.off_adjustment !== undefined ? m.off_adjustment : ((m.multiplier && m.multiplier !== 1.0) ? m.multiplier : 0.0);
                        const defVal = m.def_adjustment !== undefined ? m.def_adjustment : 0.0;
                        modifiersMap[m.team_id] = offVal;
                        defModifiersMap[m.team_id] = defVal;
                        hgaMap[m.team_id] = m.hga_adjustment !== undefined ? m.hga_adjustment : 3.0;
                    });
                }

                // 2. Try fetching from BallDontLie & Odds API
                let games = [];
                const BDL_KEY = import.meta.env.VITE_BDL_API_KEY;
                const ODDS_KEY = import.meta.env.VITE_ODDS_API_KEY;

                if (BDL_KEY && ODDS_KEY) {
                    // Real API logic (wrapped in try-catch to fallback to mock)
                    try {
                        const todayStr = format(today, 'yyyy-MM-dd');
                        const endDate = isHistory ? targetDate : format(addDays(today, 10), 'yyyy-MM-dd');

                        const bdlResponse = await axios.get(`https://api.balldontlie.io/v1/games`, {
                            params: {
                                start_date: isHistory ? targetDate : todayStr,
                                end_date: isHistory ? targetDate : endDate,
                                per_page: 100
                            },
                            headers: { Authorization: BDL_KEY }
                        });
                        const oddsResponse = await axios.get(`https://api.the-odds-api.com/v4/sports/basketball_nba/odds`, {
                            params: {
                                apiKey: ODDS_KEY,
                                regions: 'us',
                                markets: 'spreads,totals',
                                bookmakers: 'draftkings'
                            }
                        });

                        const rawGames = bdlResponse.data.data;
                        const oddsEvents = oddsResponse.data;

                        // 2a. Fetch historical games team-by-team to get exactly 25 games for everyone
                        // This is more precise than a bulk fetch but requires throttling to stay under the 30/min rate limit.
                        const EVERY_TEAM_ID = Array.from({length: 30}, (_, i) => i + 1);
                        let allPastGames = [];
                        const gamesSeen = new Set();
                        
                        const delay = (ms) => new Promise(res => setTimeout(res, ms));

                        // Fetch exactly 25 games for ALL 30 teams.
                        // Throttled to 1 req every 1.5s to fit in ~45s (under the 60s limit).
                        for (let i = 0; i < EVERY_TEAM_ID.length; i++) {
                            const tId = EVERY_TEAM_ID[i];
                            try {
                                const teamGamesRes = await axios.get(`https://api.balldontlie.io/v1/games`, {
                                    params: {
                                        team_ids: [tId],
                                        start_date: seasonStartDate,
                                        end_date: format(addDays(today, -1), 'yyyy-MM-dd'),
                                        per_page: 25 
                                    },
                                    headers: { Authorization: BDL_KEY }
                                });
                                
                                const teamGames = teamGamesRes.data.data.filter(g => g.status === 'Final');
                                teamGames.forEach(g => {
                                    if (!gamesSeen.has(g.id)) {
                                        allPastGames.push(g);
                                        gamesSeen.add(g.id);
                                    }
                                });
                                
                                if (i < EVERY_TEAM_ID.length - 1) await delay(1500); 
                            } catch (err) {
                                console.warn(`Failed to fetch historical games for team ${tId}`, err.message);
                            }
                        }
                        
                        // Sort by date ascending to process EMA in order
                        allPastGames.sort((a, b) => new Date(a.date) - new Date(b.date));

                        // Calculate EMA Team Stats
                        const teamEMAStats = {};
                        
                        // Initialize with default ratings
                        Object.keys(DEFAULT_RATINGS).forEach(teamName => {
                             teamEMAStats[teamName] = {
                                 off_rating: DEFAULT_RATINGS[teamName].off_rating,
                                 def_rating: DEFAULT_RATINGS[teamName].def_rating,
                                 games_played: 0
                             };
                        });

                        allPastGames.forEach(game => {
                            if (!game.home_team_score || !game.visitor_team_score) return;
                            
                            const hName = game.home_team.full_name;
                            const aName = game.visitor_team.full_name;
                            
                            if (teamEMAStats[hName] && teamEMAStats[aName]) {
                                // "Warm Start" Logic: 
                                // If games_played < 10, use a higher alpha (0.2) to help 'anchor' catch up faster to 2026 data
                                const warmAlpha = teamEMAStats[hName].games_played < 10 ? 0.2 : EMA_ALPHA;
                                const warmAwayAlpha = teamEMAStats[aName].games_played < 10 ? 0.2 : EMA_ALPHA;

                                // Home team EMA update
                                teamEMAStats[hName].off_rating = (game.home_team_score * warmAlpha) + (teamEMAStats[hName].off_rating * (1 - warmAlpha));
                                teamEMAStats[hName].def_rating = (game.visitor_team_score * warmAlpha) + (teamEMAStats[hName].def_rating * (1 - warmAlpha));
                                teamEMAStats[hName].games_played++;
                                
                                // Away team EMA update
                                teamEMAStats[aName].off_rating = (game.visitor_team_score * warmAwayAlpha) + (teamEMAStats[aName].off_rating * (1 - warmAwayAlpha));
                                teamEMAStats[aName].def_rating = (game.home_team_score * warmAwayAlpha) + (teamEMAStats[aName].def_rating * (1 - warmAwayAlpha));
                                teamEMAStats[aName].games_played++;
                            }
                        });

                        const processedRealGames = rawGames.map(game => {
                            const bdlHome = game.home_team.full_name;
                            const bdlAway = game.visitor_team.full_name;

                            // Match with odds
                            const matchOdds = oddsEvents.find(o => o.home_team === bdlHome && o.away_team === bdlAway);

                            let vegasSpread = null;
                            let vegasTotal = null;

                            if (matchOdds && matchOdds.bookmakers && matchOdds.bookmakers.length > 0) {
                                const dk = matchOdds.bookmakers[0];
                                const spreadMarket = dk.markets.find(m => m.key === 'spreads');
                                const totalMarket = dk.markets.find(m => m.key === 'totals');

                                if (spreadMarket) {
                                    const homeOutcome = spreadMarket.outcomes.find(o => o.name === matchOdds.home_team);
                                    if (homeOutcome) vegasSpread = homeOutcome.point;
                                }
                                if (totalMarket) {
                                    vegasTotal = totalMarket.outcomes[0].point;
                                }
                            }

                            // Pass both static and EMA stats down
                            const hStaticStats = DEFAULT_RATINGS[bdlHome] || { off_rating: LEAGUE_AVG, def_rating: LEAGUE_AVG };
                            const aStaticStats = DEFAULT_RATINGS[bdlAway] || { off_rating: LEAGUE_AVG, def_rating: LEAGUE_AVG };
                            
                            const hEmaStats = teamEMAStats[bdlHome] || hStaticStats;
                            const aEmaStats = teamEMAStats[bdlAway] || aStaticStats;

                            return {
                                id: game.id,
                                date: game.date,
                                status: game.status,
                                home: {
                                    id: game.home_team.id,
                                    name: bdlHome,
                                    abbreviation: game.home_team.abbreviation,
                                    static_rating: hStaticStats,
                                    ema_rating: hEmaStats
                                },
                                away: {
                                    id: game.visitor_team.id,
                                    name: bdlAway,
                                    abbreviation: game.visitor_team.abbreviation,
                                    static_rating: aStaticStats,
                                    ema_rating: aEmaStats
                                },
                                vegas: vegasSpread !== null ? { spread: vegasSpread, total: vegasTotal } : null,
                                actual_score: game.status === 'Final' ? { home: game.home_team_score, away: game.visitor_team_score } : null
                            };
                        });

                        // We want to show games 10 days out, even if bookmakers haven't released odds yet!
                        games = processedRealGames;

                        if (games.length === 0) throw new Error("No NBA games found for the next 10 days. Falling back to mock data to show UI.");

                    } catch (apiError) {
                        console.warn("API restricted or failed, falling back to rich mock data.", apiError.message);
                        games = generateMockGames(targetDate, isHistory);
                    }
                } else {
                    // No API keys -> Mock Data
                    games = generateMockGames(targetDate, isHistory);
                }

                // 3. Mathematical Engine application
                const processedGames = games.map(game => {
                    const homeTeam = game.home;
                    const awayTeam = game.away;

                    // Manual Overrides (Additive)
                    const homeAdditive = modifiersMap[homeTeam.id] || 0.0;
                    const awayAdditive = modifiersMap[awayTeam.id] || 0.0;
                    const homeDefAdditive = defModifiersMap[homeTeam.id] || 0.0;
                    const awayDefAdditive = defModifiersMap[awayTeam.id] || 0.0;
                    const homeHGA = hgaMap[homeTeam.id] !== undefined ? hgaMap[homeTeam.id] : 3.0;

                    // --- STATIC MODEL CALCULATION ---
                    const staticHomeOff = homeTeam.static_rating.off_rating + homeAdditive;
                    const staticAwayOff = awayTeam.static_rating.off_rating + awayAdditive;
                    const staticHomeDef = homeTeam.static_rating.def_rating + homeDefAdditive;
                    const staticAwayDef = awayTeam.static_rating.def_rating + awayDefAdditive;

                    let pHomeStatic = LEAGUE_AVG * (staticHomeOff / LEAGUE_AVG) * (staticAwayDef / LEAGUE_AVG) + homeHGA;
                    let pAwayStatic = LEAGUE_AVG * (staticAwayOff / LEAGUE_AVG) * (staticHomeDef / LEAGUE_AVG);
                    
                    const staticSpread = pAwayStatic - pHomeStatic;
                    const staticTotal = pHomeStatic + pAwayStatic;
                    
                    // --- MODEL 1 (EMA) CALCULATION ---
                    const emaHomeOff = homeTeam.ema_rating.off_rating + homeAdditive;
                    const emaAwayOff = awayTeam.ema_rating.off_rating + awayAdditive;
                    const emaHomeDef = homeTeam.ema_rating.def_rating + homeDefAdditive;
                    const emaAwayDef = awayTeam.ema_rating.def_rating + awayDefAdditive;
                    
                    let pHomeEma = LEAGUE_AVG * (emaHomeOff / LEAGUE_AVG) * (emaAwayDef / LEAGUE_AVG) + homeHGA;
                    let pAwayEma = LEAGUE_AVG * (emaAwayOff / LEAGUE_AVG) * (emaHomeDef / LEAGUE_AVG);
                    
                    const emaSpread = pAwayEma - pHomeEma;
                    const emaTotal = pHomeEma + pAwayEma;

                    // Evaluate Edge based on the new Model 1
                    const edge = game.vegas ? Math.abs(emaSpread - game.vegas.spread) : 0;
                    const isValuePlay = edge >= 2.0;

                    // For history, calculate accuracy based on the new Model 1
                    let wasAccurate = null;
                    if (isHistory && game.actual_score && game.vegas) {
                        const actualSpread = game.actual_score.away - game.actual_score.home;
                        const ourPickHome = emaSpread < game.vegas.spread;
                        const actualHomeCovered = actualSpread < game.vegas.spread;
                        wasAccurate = ourPickHome === actualHomeCovered;
                    }

                    return {
                        ...game,
                        static_line: {
                            home_score: pHomeStatic,
                            away_score: pAwayStatic,
                            spread: staticSpread,
                            total: staticTotal
                        },
                        model_1_line: {
                            home_score: pHomeEma,
                            away_score: pAwayEma,
                            spread: emaSpread,
                            total: emaTotal,
                            games_sampled: homeTeam.ema_rating.games_played
                        },
                        edge,
                        isValuePlay,
                        wasAccurate
                    };
                });

                setData(processedGames);
                setLoading(false);
            } catch (err) {
                console.error("Error in useNBAData:", err);
                setError("Failed to load or process NBA data.");
                setLoading(false);
            }
        }

        fetchData();
    }, [isHistory]);

    return { data, loading, error };
}

// Helper to generate realistic mock data
function generateMockGames(date, isHistory) {
    return [
        {
            id: isHistory ? 'hist1' : 'g1',
            date: date,
            home: { ...MOCK_TEAMS[0], static_rating: MOCK_TEAMS[0], ema_rating: MOCK_TEAMS[0] }, // BOS
            away: { ...MOCK_TEAMS[1], static_rating: MOCK_TEAMS[1], ema_rating: MOCK_TEAMS[1] }, // LAL
            status: isHistory ? 'Final' : '7:30 PM EST',
            vegas: { spread: -6.5, total: 228.5 }, // BOS favored by 6.5
            actual_score: isHistory ? { home: 118, away: 110 } : null // BOS won by 8 -> covered
        },
        {
            id: isHistory ? 'hist2' : 'g2',
            date: date,
            home: { ...MOCK_TEAMS[2], static_rating: MOCK_TEAMS[2], ema_rating: MOCK_TEAMS[2] }, // DEN
            away: { ...MOCK_TEAMS[3], static_rating: MOCK_TEAMS[3], ema_rating: MOCK_TEAMS[3] }, // MIA
            status: isHistory ? 'Final' : '9:00 PM EST',
            vegas: { spread: -8.0, total: 215.0 }, // DEN favored by 8
            actual_score: isHistory ? { home: 108, away: 104 } : null // DEN won by 4 -> missed cover
        },
        {
            id: isHistory ? 'hist3' : 'g3',
            date: date,
            home: { ...MOCK_TEAMS[4], static_rating: MOCK_TEAMS[4], ema_rating: MOCK_TEAMS[4] }, // GSW
            away: { ...MOCK_TEAMS[5], static_rating: MOCK_TEAMS[5], ema_rating: MOCK_TEAMS[5] }, // PHX
            status: isHistory ? 'Final' : '10:30 PM EST',
            vegas: { spread: -2.5, total: 232.0 }, // GSW favored by 2.5
            actual_score: isHistory ? { home: 121, away: 125 } : null // Ouch
        }
    ];
}
