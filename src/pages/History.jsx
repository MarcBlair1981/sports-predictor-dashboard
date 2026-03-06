import React from 'react';
import { useNBAData } from '../hooks/useNBAData';
import { History as HistoryIcon, Target, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

export default function HistoryPage() {
    const { data: games, loading, error } = useNBAData(true);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-sportsbook-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium animate-pulse">Analyzing yesterday's results...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg flex items-center space-x-3">
                <XCircle />
                <span>{error}</span>
            </div>
        );
    }

    // Calculate Accuracy Stats
    const finishedGames = games.filter(g => g.actual_score && g.vegas);
    const correctPicks = finishedGames.filter(g => g.wasAccurate).length;
    const totalPicks = finishedGames.length;
    const btsPercentage = totalPicks > 0 ? (correctPicks / totalPicks) * 100 : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
                        <HistoryIcon className="text-sportsbook-accent" size={32} />
                        <span>Algorithm <span className="text-gray-300">History</span></span>
                    </h1>
                    <p className="text-gray-400">Review yesterday's predictive accuracy against Vegas closing lines.</p>
                </div>

                {totalPicks > 0 && (
                    <div className="bg-sportsbook-card border border-gray-800 rounded-2xl p-4 flex items-center gap-6 shadow-2xl">
                        <div className="p-3 bg-gray-800/50 rounded-xl">
                            <Target className={btsPercentage >= 52.4 ? "text-sportsbook-green" : "text-sportsbook-accent"} size={32} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Beat The Spread (BTS)</div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-3xl font-black ${btsPercentage >= 52.4 ? 'text-sportsbook-green' : 'text-white'}`}>
                                    {btsPercentage.toFixed(1)}%
                                </span>
                                <span className="text-gray-500 text-sm font-medium">({correctPicks}/{totalPicks})</span>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {finishedGames.length === 0 ? (
                <div className="bg-sportsbook-card p-12 rounded-2xl text-center text-gray-500 border border-gray-800 shadow-xl flex flex-col items-center gap-4">
                    <HistoryIcon size={48} className="text-gray-700 opacity-50" />
                    <p className="text-lg">No prediction data available for yesterday.</p>
                </div>
            ) : (
                <div className="bg-sportsbook-card border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50">
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800">Matchup</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 text-center">Vegas Line</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 text-center text-sportsbook-accent">Our Prediction</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 text-center">Actual Score</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 text-right">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {finishedGames.map(game => {
                                    const vegasFav = game.vegas.spread < 0 ? game.home.abbreviation : game.away.abbreviation;
                                    const vegasSpread = `${vegasFav} ${game.vegas.spread > 0 ? '+' : ''}${parseFloat(game.vegas.spread).toFixed(1)}`;

                                    const ourFav = game.our_line.spread < 0 ? game.home.abbreviation : game.away.abbreviation;
                                    const ourSpread = `${ourFav} ${game.our_line.spread > 0 ? '+' : ''}${parseFloat(game.our_line.spread).toFixed(1)}`;

                                    const homeScore = game.actual_score.home;
                                    const awayScore = game.actual_score.away;
                                    const teamWonSpread = game.wasAccurate;

                                    return (
                                        <tr key={game.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex flex-col space-y-2 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 text-xs w-8">AWAY</span>
                                                        <span>{game.away.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 text-xs w-8">HOME</span>
                                                        <span>{game.home.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-mono text-gray-300">
                                                {vegasSpread}
                                            </td>
                                            <td className="p-4 text-center font-mono text-sportsbook-accent font-bold bg-sportsbook-accent/5">
                                                {ourSpread}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center space-x-2 font-mono font-bold text-lg">
                                                    <span className={awayScore > homeScore ? 'text-white' : 'text-gray-500'}>{awayScore}</span>
                                                    <span className="text-gray-600">-</span>
                                                    <span className={homeScore > awayScore ? 'text-white' : 'text-gray-500'}>{homeScore}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {teamWonSpread ? (
                                                        <div className="bg-sportsbook-green/20 text-sportsbook-green px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-sportsbook-green/30">
                                                            <CheckCircle2 size={14} /> COVER
                                                        </div>
                                                    ) : (
                                                        <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-red-500/20">
                                                            <XCircle size={14} /> LOSS
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
