const axios = require('axios');
const fs = require('fs');

(async () => {
    try {
        let bulk = [];
        let cursor = null;
        let keepFetching = true;

        console.log("Fetching historical games for template...");

        while (keepFetching) {
            let res = await axios.get('https://api.balldontlie.io/v1/games', {
                params: {
                    start_date: '2026-02-15', // about 35 days ago, yielding ~50 games per team
                    end_date: '2026-03-22',
                    per_page: 100,
                    cursor: cursor
                },
                headers: { Authorization: 'dab253ed-cd11-4931-b16c-6e0227bd4cbc' }
            });

            let finals = res.data.data.filter(g => g.status === 'Final');
            bulk.push(...finals);

            if (res.data.meta && res.data.meta.next_cursor) {
                cursor = res.data.meta.next_cursor;
                await new Promise(r => setTimeout(r, 1500));
            } else {
                keepFetching = false;
            }
        }

        bulk.sort((a, b) => new Date(b.date) - new Date(a.date));

        let csv = 'Game ID,Date,Home Team,Away Team,Home Score,Away Score,Vegas Spread (Home Favored),Vegas Total (O/U)\n';
        bulk.forEach(g => {
            csv += `${g.id},${g.date.split('T')[0]},${g.home_team.full_name},${g.visitor_team.full_name},${g.home_team_score},${g.visitor_team_score},,\n`;
        });

        fs.writeFileSync('historical_vegas_odds_template.csv', csv);
        console.log(`Created template with ${bulk.length} games. Perfect for recent 50 history!`);
    } catch (e) {
        console.error("Error creating template:", e.message);
    }
})();
