import React from 'react';
import { useNBAData } from '../hooks/useNBAData';
import { AlertCircle, TrendingUp, TrendingDown, Clock, MoveRight } from 'lucide-react';

function StatBadge({ label, value, colorClass = "text-white" }) {
    return (
        <div className="flex flex-col items-center bg-gray-800/50 rounded-lg p-2 flex-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold">{label}</span>
            <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
        </div>
    );
}

function GameCard({ game }) {
    const { home, away, our_line, vegas, edge, isValuePlay, status } = game;

    const ourFavorite = our_line.spread < 0 ? home.abbreviation : away.abbreviation;
    const ourSpreadStr = `${ourFavorite} ${our_line.spread > 0 ? '+' : ''}${parseFloat(our_line.spread).toFixed(1)}`;

    let vegasSpreadStr = 'N/A';
    if (vegas) {
        const vegasFav = vegas.spread < 0 ? home.abbreviation : away.abbreviation;
        vegasSpreadStr = `${vegasFav} ${vegas.spread > 0 ? '+' : ''}${parseFloat(vegas.spread).toFixed(1)}`;
    }

    // Time Formatter
    let displayTime = status;
    if (status && status.includes('Z')) {
        try {
            const d = new Date(status);
            const dateStr = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
            const estTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(d);
            const ukTime = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/London' }).format(d);
            displayTime = `${dateStr} • ${estTime} ET / ${ukTime} UK`;
        } catch (e) {
            // fallback
        }
    }

    return (
        <div className="bg-sportsbook-card border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all duration-300 shadow-xl group">
            {/* Header */}
            <div className="bg-gray-900/50 px-5 py-3 flex justify-between items-center border-b border-gray-800">
                <div className="flex items-center space-x-2 text-sm text-gray-400 font-medium">
                    <Clock size={16} className="text-sportsbook-accent" />
                    <span>{displayTime}</span>
                </div>
                {isValuePlay && (
                    <div className="bg-sportsbook-green/20 text-sportsbook-green text-xs px-3 py-1 rounded-full flex items-center space-x-1 font-bold animate-pulse">
                        <AlertCircle size={14} />
                        <span>High Value Play (Edge: {edge.toFixed(1)})</span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                    {/* Teams / Predicted Score */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-300 border border-gray-700">
                                    {away.abbreviation}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{away.name}</h3>
                                    <div className="text-sm text-gray-500">Away</div>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-white/90 font-mono tracking-tighter">
                                {Math.round(our_line.away_score)}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-300 border border-gray-700">
                                    {home.abbreviation}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{home.name}</h3>
                                    <div className="text-sm text-gray-500">Home</div>
                                </div>
                            </div>
                            <div className="text-3xl font-black text-white/90 font-mono tracking-tighter">
                                {Math.round(our_line.home_score)}
                            </div>
                        </div>
                    </div>

                    {/* Divider on desktop */}
                    <div className="hidden md:block w-px h-24 bg-gray-800"></div>

                    {/* Lines Comparison */}
                    <div className="flex-1 flex flex-col justify-center space-y-4">
                        <div className="flex space-x-3">
                            <StatBadge
                                label="Our Line"
                                value={ourSpreadStr}
                                colorClass="text-sportsbook-accent"
                            />
                            <StatBadge
                                label="Our Total"
                                value={`O/U ${our_line.total.toFixed(1)}`}
                                colorClass="text-sportsbook-accent"
                            />
                        </div>

                        <div className="flex space-x-3">
                            <StatBadge
                                label="Vegas Line"
                                value={vegasSpreadStr}
                                colorClass="text-gray-300"
                            />
                            <StatBadge
                                label="Vegas Total"
                                value={vegas ? `O/U ${vegas.total}` : 'N/A'}
                                colorClass="text-gray-300"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { data: games, loading, error } = useNBAData(false);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-sportsbook-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium animate-pulse">Crunching numbers...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg flex items-center space-x-3">
                <AlertCircle />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Today's <span className="text-sportsbook-accent">Projections</span></h1>
                <p className="text-gray-400">Algorithmic lines compared with real-time Vegas odds.</p>
            </header>

            {games.length === 0 ? (
                <div className="bg-sportsbook-card p-8 rounded-xl text-center text-gray-500 border border-gray-800">
                    No games scheduled for today.
                </div>
            ) : (
                <div className="grid gap-6">
                    {games.map(game => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            )}
        </div>
    );
}
