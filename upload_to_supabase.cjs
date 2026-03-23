const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Extract config natively
const envLines = fs.readFileSync('.env', 'utf-8').split('\n');
const envVars = {};
envLines.forEach(line => {
    const parts = line.split('=');
    if(parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function upload() {
    console.log("Reading CSV...");
    const csvContent = fs.readFileSync('public/market_odds.csv', 'utf-8');
    const lines = csvContent.split('\n');
    
    const rowsToInsert = [];
    
    // Start at line 1 to skip header "Game ID,Date,..."
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].trim();
        if (!row) continue;
        
        const cols = row.split(',');
        if (cols.length < 8) continue;
        
        const game_id = parseInt(cols[0], 10);
        const date = cols[1];
        const home_team = cols[2];
        const away_team = cols[3];
        const home_score = parseInt(cols[4], 10);
        const away_score = parseInt(cols[5], 10);
        const vegas_spread = cols[6] ? parseFloat(cols[6]) : null;
        const vegas_total = cols[7] ? parseFloat(cols[7]) : null;
        
        if (!isNaN(game_id)) {
            rowsToInsert.push({
                game_id,
                date,
                home_team,
                away_team,
                home_score,
                away_score,
                vegas_spread: isNaN(vegas_spread) ? null : vegas_spread,
                vegas_total: isNaN(vegas_total) ? null : vegas_total
            });
        }
    }
    
    console.log(`Found ${rowsToInsert.length} games in your CSV file.`);
    console.log(`Beginning high-speed upload to cloud Database...`);
    
    // Batch upload in increments of 50
    for(let i = 0; i < rowsToInsert.length; i += 50) {
        const chunk = rowsToInsert.slice(i, i + 50);
        const { error } = await supabase.from('historical_odds').upsert(chunk);
        
        if (error) {
            console.error("Database connection error on chunk insertion:", error.message);
        } else {
            console.log(`Successfully beamed ${i + chunk.length}/${rowsToInsert.length} games to Supabase...`);
        }
    }
    
    console.log("UPLOAD COMPLETE: All local CSV data successfully migrated into your cloud database natively!");
}

upload();
