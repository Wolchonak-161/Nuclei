import { LinearClient } from '@linear/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY || LINEAR_API_KEY === 'lin_api_your_key_here') {
    console.error('❌ FEHLER: Du musst zuerst deinen LINEAR_API_KEY in der .env Datei eintragen!');
    process.exit(1);
}

const linearClient = new LinearClient({ apiKey: LINEAR_API_KEY });

async function listTeams() {
    console.log('⏳ Hole Teams aus deinem Linear Workspace...');
    try {
        const teams = await linearClient.teams();
        console.log('\n--- Verfügbare Teams ---');
        for (const team of teams.nodes) {
            console.log(`\nTeam Name: ${team.name}`);
            console.log(`Team Key:  ${team.key}`);
            console.log(`Team ID:   ${team.id}`);
            console.log('------------------------');
        }
        console.log('\n✅ Kopiere die "Team ID" deines Wunsch-Teams und trage sie in die .env Datei als LINEAR_TEAM_ID ein!');
    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Teams. Ist dein API Key richtig?', error);
    }
}

listTeams().catch(console.error);
