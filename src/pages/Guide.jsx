import React from 'react';
import { BookOpen, Map, Settings2, BarChart3, Database } from 'lucide-react';

export default function Guide() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <header className="mb-10 text-center">
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">How To Use <span className="text-sportsbook-accent">Rootz Edge</span></h1>
                <p className="text-gray-400 text-lg">A comprehensive breakdown of the core math models, definitions, and pages.</p>
            </header>

            <div className="space-y-6">

                {/* Dashboard Section */}
                <section className="bg-sportsbook-card border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <BarChart3 size={150} />
                    </div>
                    <div className="flex items-center space-x-3 mb-6 relative z-10">
                        <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30">
                            <BarChart3 className="text-blue-400" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">1. Dashboard (The Live Feed)</h2>
                    </div>
                    <div className="space-y-4 text-gray-300 relative z-10 pl-4 border-l-2 border-gray-800">
                        <p>The Dashboard displays all upcoming games for the next 10 days. It mathematically cross-references Live Vegas Odds with two independent prediction algorithms.</p>
                        
                        <div className="bg-gray-900/50 p-4 rounded-xl space-y-3">
                            <div>
                                <h4 className="text-sportsbook-light font-bold">Vegas</h4>
                                <p className="text-sm text-gray-400">The current live betting lines fetched dynamically from DraftKings. This is the "target" you are trying to beat.</p>
                            </div>
                            <div>
                                <h4 className="text-blue-400 font-bold">Model 1 (Actual Scores EMA)</h4>
                                <p className="text-sm text-gray-400">This model looks at the last 25-50 games each team played. It grabs the <strong>Actual Box Scores</strong> (how many points they physically scored/allowed) and runs them through an Exponential Moving Average (EMA). Recent games are weighted infinitely heavier than games played 2 months ago.</p>
                            </div>
                            <div>
                                <h4 className="text-purple-400 font-bold">Mkt Imp (Market Implied EMA)</h4>
                                <p className="text-sm text-gray-400">This connects directly to your custom <code>market_odds.csv</code> spreadsheet! Instead of tracking the actual final box score, this model mathematically reverse-engineers what <strong>Vegas Predicted</strong> the score would be on that day, and computes an entirely separate EMA using market intelligence. Hover over the bubble to see how much of your spreadsheet data is bleeding into the algorithm!</p>
                            </div>
                        </div>
                    </div>
                </section>


                {/* History Section */}
                <section className="bg-sportsbook-card border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Database size={150} />
                    </div>
                    <div className="flex items-center space-x-3 mb-6 relative z-10">
                        <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
                            <Database className="text-emerald-400" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">2. History (The Auditor)</h2>
                    </div>
                    <div className="space-y-4 text-gray-300 relative z-10 pl-4 border-l-2 border-gray-800">
                        <p>The History page is your time-machine. It looks dynamically at games that have already finished (Final Score) and re-runs the math algorithms retrospectively exactly as they would have been on that day.</p>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                            <li>It grades the models on "Value Plays" (Edges over 2.0).</li>
                            <li>If a model spotted a value play <strong>and</strong> successfully predicted the correct side of the outcome, it marks a green check!</li>
                            <li>Use this tab to rigorously backtest which model is currently outperforming the strict Vegas lines in recent weeks.</li>
                        </ul>
                    </div>
                </section>


                {/* Settings Section */}
                <section className="bg-sportsbook-card border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Settings2 size={150} />
                    </div>
                    <div className="flex items-center space-x-3 mb-6 relative z-10">
                        <div className="bg-orange-500/20 p-3 rounded-xl border border-orange-500/30">
                            <Settings2 className="text-orange-400" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">3. Settings (Manual Overrides)</h2>
                    </div>
                    <div className="space-y-4 text-gray-300 relative z-10 pl-4 border-l-2 border-gray-800">
                        <p>Because the models rely on a 25-50 game trailing mathematical average, they are completely "blind" to injuries that happen today (e.g. if Nikola Jokic breaks his hand this morning).</p>
                        <p>The Settings tab allows you to intervene:</p>
                        <div className="bg-gray-900/50 p-4 rounded-xl text-sm text-gray-400 space-y-2">
                            <p><strong>Example:</strong> If a star player is ruled out, you can subtract <code>-4.5</code> from their Offense Modifier. This adjustment is instantly injected straight into the final math equation globally across the Dashboard natively, forcing the overall projection downward manually to compensate for the injury.</p>
                            <div className="mt-4 p-3 bg-sportsbook-card border-l-4 border-sportsbook-accent rounded">
                                <p className="font-bold text-white mb-1">Important Clarification on Math Overrides:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-2">
                                    <li>These slider adjustments hit <strong>BOTH</strong> Model 1 and the Mkt Imp model equally and concurrently.</li>
                                    <li>The giant White Box Scores shown in the direct center of the Dashboard cards exclusively print <strong>Model 1's</strong> raw point projections natively to save space.</li>
                                    <li>However, if you look at the <strong>Mkt Imp Target Lines (Over/Under and Spread)</strong> strictly in the purple column on the far right, you will see those numbers visibly plunge by the exact same margin natively alongside Model 1!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CSV File Mention */}
                <section className="bg-sportsbook-card border border-gray-800 rounded-2xl p-6 shadow-xl mt-6 border-l-4 border-l-purple-500">
                    <h3 className="text-xl font-bold text-white mb-2">How to update your models:</h3>
                    <p className="text-gray-400 text-sm">To push new historical logic into the <strong>Mkt Imp</strong> model, simply open the `public/market_odds.csv` file natively on your computer, fill in the closing Vegas Spread & Total for past games, save the file, and refresh your browser. The app will immediately ingest the integers and ripple the math through your dashboard charts!</p>
                </section>


            </div>
        </div>
    );
}
