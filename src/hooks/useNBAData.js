import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';

const LEAGUE_AVG = 115.5;
const HOME_ADVANTAGE = 3.0;

// Mock data to ensure the UI ALWAYS works, even without API keys or if rate limited
const MOCK_TEAMS = [
    { id: 1, name: 'Celtics', full_name: 'Boston Celtics', abbreviation: 'BOS', off_rating: 122.5, def_rating: 110.1 },
    { id: 2, name: 'Lakers', full_name: 'Los Angeles Lakers', abbreviation: 'LAL', off_rating: 114.2, def_rating: 115.8 },
    { id: 3, name: 'Nuggets', full_name: 'Denver Nuggets', abbreviation: 'DEN', off_rating: 118.0, def_rating: 112.5 },
    { id: 4, name: 'Heat', full_name: 'Miami Heat', abbreviation: 'MIA', off_rating: 112.0, def_rating: 111.0 },
    { id: 5, name: 'Warriors', full_name: 'Golden State Warriors', abbreviation: 'GSW', off_rating: 116.5, def_rating: 114.0 },
    { id: 6, name: 'Suns', full_name: 'Phoenix Suns', abbreviation: 'PHX', off_rating: 117.2, def_rating: 116.1 }
];

const DEFAULT_RATINGS = {
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

                // 1. Fetch Modifiers from Supabase
                let teamModifiers = [];
                try {
                    const res = await supabase.from('team_modifiers').select('*');
                    if (res.data) teamModifiers = res.data;
                } catch (e) {
                    // Failsafe for missing config
                }

                const modifiersMap = {};
                const hgaMap = {};
                if (teamModifiers) {
                    teamModifiers.forEach(m => {
                        const offVal = m.off_adjustment !== undefined ? m.off_adjustment : ((m.multiplier && m.multiplier !== 1.0) ? m.multiplier : 0.0);
                        modifiersMap[m.team_id] = offVal;
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
                        const endDate = isHistory ? targetDate : format(addDays(today, 7), 'yyyy-MM-dd');

                        const bdlResponse = await axios.get(`https://api.balldontlie.io/v1/games`, {
                            params: {
                                start_date: isHistory ? targetDate : todayStr,
                                end_date: isHistory ? targetDate : endDate
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

                            const hStats = DEFAULT_RATINGS[bdlHome] || { off_rating: LEAGUE_AVG, def_rating: LEAGUE_AVG };
                            const aStats = DEFAULT_RATINGS[bdlAway] || { off_rating: LEAGUE_AVG, def_rating: LEAGUE_AVG };

                            return {
                                id: game.id,
                                date: game.date,
                                status: game.status,
                                home: {
                                    id: game.home_team.id,
                                    name: bdlHome,
                                    abbreviation: game.home_team.abbreviation,
                                    off_rating: hStats.off_rating,
                                    def_rating: hStats.def_rating
                                },
                                away: {
                                    id: game.visitor_team.id,
                                    name: bdlAway,
                                    abbreviation: game.visitor_team.abbreviation,
                                    off_rating: aStats.off_rating,
                                    def_rating: aStats.def_rating
                                },
                                vegas: vegasSpread !== null ? { spread: vegasSpread, total: vegasTotal } : null,
                                actual_score: game.status === 'Final' ? { home: game.home_team_score, away: game.visitor_team_score } : null
                            };
                        });

                        // We want to show games 7 days out, even if bookmakers haven't released odds yet!
                        games = processedRealGames;

                        if (games.length === 0) throw new Error("No NBA games found for the next 7 days. Falling back to mock data to show UI.");

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

                    const homeOffRatingRaw = homeTeam.off_rating + homeAdditive;
                    const awayOffRatingRaw = awayTeam.off_rating + awayAdditive;

                    // Formula Application:
                    // P = LeagueAvg * (TeamOff/LeagueAvg) * (OppDef/LeagueAvg)
                    let pHome = LEAGUE_AVG * (homeOffRatingRaw / LEAGUE_AVG) * (awayTeam.def_rating / LEAGUE_AVG);
                    let pAway = LEAGUE_AVG * (awayOffRatingRaw / LEAGUE_AVG) * (homeTeam.def_rating / LEAGUE_AVG);

                    // Home Court Advantage
                    const homeHGA = hgaMap[homeTeam.id] !== undefined ? hgaMap[homeTeam.id] : 3.0;
                    pHome += homeHGA;

                    // Our Lines
                    const ourSpread = pAway - pHome; // Negative means home favorite
                    const ourTotal = pHome + pAway;

                    const edge = game.vegas ? Math.abs(ourSpread - game.vegas.spread) : 0;
                    const isValuePlay = edge >= 2.0;

                    // For history, calculate accuracy
                    let wasAccurate = null;
                    if (isHistory && game.actual_score) {
                        const actualSpread = game.actual_score.away - game.actual_score.home;
                        const vegasSign = Math.sign(game.vegas.spread);
                        const ourSign = Math.sign(ourSpread);
                        const actualSign = Math.sign(actualSpread);

                        // Did our model predict the correct winner against the spread?
                        // E.g. Vegas spread -4.5 (Favored Home), Our Spread -7.0 (We strongly favor home) -> Meaning we took Home.
                        // If actual spread is -10, we won.
                        const ourPickHome = ourSpread < game.vegas.spread;
                        const actualHomeCovered = actualSpread < game.vegas.spread;
                        wasAccurate = ourPickHome === actualHomeCovered;
                    }

                    return {
                        ...game,
                        our_line: {
                            home_score: pHome,
                            away_score: pAway,
                            spread: ourSpread,
                            total: ourTotal
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
            home: MOCK_TEAMS[0], // BOS
            away: MOCK_TEAMS[1], // LAL
            status: isHistory ? 'Final' : '7:30 PM EST',
            vegas: { spread: -6.5, total: 228.5 }, // BOS favored by 6.5
            actual_score: isHistory ? { home: 118, away: 110 } : null // BOS won by 8 -> covered
        },
        {
            id: isHistory ? 'hist2' : 'g2',
            date: date,
            home: MOCK_TEAMS[2], // DEN
            away: MOCK_TEAMS[3], // MIA
            status: isHistory ? 'Final' : '9:00 PM EST',
            vegas: { spread: -8.0, total: 215.0 }, // DEN favored by 8
            actual_score: isHistory ? { home: 108, away: 104 } : null // DEN won by 4 -> missed cover
        },
        {
            id: isHistory ? 'hist3' : 'g3',
            date: date,
            home: MOCK_TEAMS[4], // GSW
            away: MOCK_TEAMS[5], // PHX
            status: isHistory ? 'Final' : '10:30 PM EST',
            vegas: { spread: -2.5, total: 232.0 }, // GSW favored by 2.5
            actual_score: isHistory ? { home: 121, away: 125 } : null // Ouch
        }
    ];
}
