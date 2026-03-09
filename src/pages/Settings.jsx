import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, CheckCircle, AlertCircle, Settings2 } from 'lucide-react';

const TEAMS = [
    { id: 1, name: 'Atlanta Hawks', abbr: 'ATL' },
    { id: 2, name: 'Boston Celtics', abbr: 'BOS' },
    { id: 3, name: 'Brooklyn Nets', abbr: 'BKN' },
    { id: 4, name: 'Charlotte Hornets', abbr: 'CHA' },
    { id: 5, name: 'Chicago Bulls', abbr: 'CHI' },
    { id: 6, name: 'Cleveland Cavaliers', abbr: 'CLE' },
    { id: 7, name: 'Dallas Mavericks', abbr: 'DAL' },
    { id: 8, name: 'Denver Nuggets', abbr: 'DEN' },
    { id: 9, name: 'Detroit Pistons', abbr: 'DET' },
    { id: 10, name: 'Golden State Warriors', abbr: 'GSW' },
    { id: 11, name: 'Houston Rockets', abbr: 'HOU' },
    { id: 12, name: 'Indiana Pacers', abbr: 'IND' },
    { id: 13, name: 'LA Clippers', abbr: 'LAC' },
    { id: 14, name: 'Los Angeles Lakers', abbr: 'LAL' },
    { id: 15, name: 'Memphis Grizzlies', abbr: 'MEM' },
    { id: 16, name: 'Miami Heat', abbr: 'MIA' },
    { id: 17, name: 'Milwaukee Bucks', abbr: 'MIL' },
    { id: 18, name: 'Minnesota Timberwolves', abbr: 'MIN' },
    { id: 19, name: 'New Orleans Pelicans', abbr: 'NOP' },
    { id: 20, name: 'New York Knicks', abbr: 'NYK' },
    { id: 21, name: 'Oklahoma City Thunder', abbr: 'OKC' },
    { id: 22, name: 'Orlando Magic', abbr: 'ORL' },
    { id: 23, name: 'Philadelphia 76ers', abbr: 'PHI' },
    { id: 24, name: 'Phoenix Suns', abbr: 'PHX' },
    { id: 25, name: 'Portland Trail Blazers', abbr: 'POR' },
    { id: 26, name: 'Sacramento Kings', abbr: 'SAC' },
    { id: 27, name: 'San Antonio Spurs', abbr: 'SAS' },
    { id: 28, name: 'Toronto Raptors', abbr: 'TOR' },
    { id: 29, name: 'Utah Jazz', abbr: 'UTA' },
    { id: 30, name: 'Washington Wizards', abbr: 'WAS' }
];

export default function Settings() {
    const [modifiers, setModifiers] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        async function fetchModifiers() {
            try {
                const { data, error } = await supabase.from('team_modifiers').select('*');
                const mods = {};
                // Fill defaults
                TEAMS.forEach(t => {
                    mods[t.id] = { off: 0.0, def: 0.0, hga: 3.0 };
                });

                if (data && !error) {
                    data.forEach(m => {
                        const offVal = m.off_adjustment !== undefined ? m.off_adjustment : ((m.multiplier && m.multiplier !== 1.0) ? m.multiplier : 0.0);
                        const defVal = m.def_adjustment !== undefined ? m.def_adjustment : 0.0;
                        const hgaVal = m.hga_adjustment !== undefined ? m.hga_adjustment : 3.0;
                        mods[m.team_id] = { off: offVal, def: defVal, hga: hgaVal };
                    });
                }
                setModifiers(mods);
            } catch (err) {
                console.error("No supabase setup", err);
            } finally {
                setLoading(false);
            }
        }
        fetchModifiers();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const updates = Object.entries(modifiers).map(([team_id, mods]) => ({
                team_id: parseInt(team_id),
                off_adjustment: parseFloat(mods.off),
                def_adjustment: parseFloat(mods.def),
                hga_adjustment: parseFloat(mods.hga),
                multiplier: parseFloat(mods.off) // Fallback for existing db constraints
            }));

            const { error } = await supabase.from('team_modifiers').upsert(updates, { onConflict: 'team_id' });

            if (error) {
                throw error;
            }
            setMessage({ type: 'success', text: 'Adjustments successfully updated in database.' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Error saving config. Did you add the columns to Supabase?' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const updateVal = (id, field, val) => {
        setModifiers(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: parseFloat(val) || 0.0
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex animate-pulse space-x-4 items-center h-48 justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-t-sportsbook-accent border-sportsbook-card animate-spin"></div>
                <span className="text-gray-400 font-mono">Loading Config...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
                        <Settings2 className="text-gray-400" />
                        <span>Algorithm <span className="text-sportsbook-accent">Overrides</span></span>
                    </h1>
                    <p className="text-gray-400">Manually adjust team offensive and defensive power ratings based on injury, momentum, or insider info.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-sportsbook-accent hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                >
                    {saving ? (
                        <div className="w-5 h-5 rounded-full border-2 border-t-white border-transparent animate-spin" />
                    ) : (
                        <Save size={20} />
                    )}
                    <span>{saving ? 'Saving...' : 'Save Matrix'}</span>
                </button>
            </header>

            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-sportsbook-green/10 border-sportsbook-green/30 text-sportsbook-green' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-semibold">{message.text}</span>
                </div>
            )}

            <div className="bg-sportsbook-card border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900/50">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800">Team</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 text-center w-32">Offensive Adj</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 text-center w-32">Defensive Adj</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 text-center w-32">Home Court Adj</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {TEAMS.map(team => (
                                <tr key={team.id} className="hover:bg-gray-800/20 transition-colors">
                                    <td className="p-4 font-medium flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold border border-gray-700">
                                            {team.abbr}
                                        </div>
                                        {team.name}
                                    </td>
                                    <td className="p-4 text-center">
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={modifiers[team.id]?.off ?? 0.0}
                                            onChange={(e) => updateVal(team.id, 'off', e.target.value)}
                                            className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 w-24 text-center focus:outline-none focus:border-sportsbook-accent focus:ring-1 focus:ring-sportsbook-accent font-mono transition-all"
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={modifiers[team.id]?.def ?? 0.0}
                                            onChange={(e) => updateVal(team.id, 'def', e.target.value)}
                                            className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 w-24 text-center focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono transition-all"
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={modifiers[team.id]?.hga ?? 3.0}
                                            onChange={(e) => updateVal(team.id, 'hga', e.target.value)}
                                            className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 w-24 text-center focus:outline-none focus:border-sportsbook-light focus:ring-1 focus:ring-sportsbook-light font-mono transition-all"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
