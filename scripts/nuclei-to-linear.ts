import { LinearClient } from '@linear/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Lädt die Umgebungsvariablen aus der .env Datei
dotenv.config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY as string;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID as string;

if (!LINEAR_API_KEY || !LINEAR_TEAM_ID) {
    console.error('ERROR: LINEAR_API_KEY und LINEAR_TEAM_ID müssen in der .env gesetzt sein.');
    process.exit(1);
}

// Initialisiere den Linear API Client
const linearClient = new LinearClient({ apiKey: LINEAR_API_KEY });

// Typdefinition für die Struktur eines Nuclei JSON-Outputs
interface NucleiResult {
    "template-id": string;
    info: {
        name: string;
        severity: string;
        description?: string;
    };
    "matched-at": string;
    "extracted-results"?: string[];
}

async function run() {
    // Nimmt die Datei aus dem ersten Argument oder sucht nach "results.json"
    const resultsPath = path.resolve(process.cwd(), process.argv[2] || 'results.json');
    
    if (!fs.existsSync(resultsPath)) {
        console.error(`ERROR: Nuclei results Datei nicht gefunden: ${resultsPath}`);
        console.error(`Usage: npx ts-node scripts/nuclei-to-linear.ts <path-to-results.json>`);
        process.exit(1);
    }

    // Nuclei exportiert entweder ein JSON-Array (-json-export) oder JSON Lines (-jsonl)
    const fileContent = fs.readFileSync(resultsPath, 'utf-8');
    let findings: NucleiResult[] = [];
    
    try {
        // Versuch 1: Normales JSON (Array oder einzelnes Objekt)
        const parsed = JSON.parse(fileContent);
        findings = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
        // Versuch 2: JSON Lines Fallback
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            try { findings.push(JSON.parse(line)); } catch (err) {}
        }
    }
    
    // Sicherheitscheck: Verhindert Abstürze, falls Nuclei fehlerhafte oder leere Objekte zurückgibt
    const validFindings = findings.filter(f => f && f.info && f.info.severity);
    
    const actionableFindings = validFindings.filter(f => f.info.severity.toLowerCase() !== 'info');
    const infoFindings = validFindings.filter(f => f.info.severity.toLowerCase() === 'info');

    // 1. INFO-Findings verarbeiten -> Lokaler Report (recon_summary.md)
    if (infoFindings.length > 0) {
        const reconPath = path.resolve(process.cwd(), 'recon_summary.md');
        let mdContent = '# 🕵️‍♂️ Reconnaissance Summary\n\n| Template | Target | Description |\n|---|---|---|\n';
        for (const finding of infoFindings) {
            mdContent += `| ${finding["template-id"]} | ${finding["matched-at"]} | ${finding.info.name} |\n`;
        }
        fs.writeFileSync(reconPath, mdContent);
        console.log(`✅ Saved ${infoFindings.length} info findings to recon_summary.md`);
    }

    // 2. ACTIONABLE Findings verarbeiten -> Linear Tickets
    console.log(`🚀 Processing ${actionableFindings.length} actionable findings for Linear...`);
    
    // Hole bestehende Tickets aus dem Team, um Duplikate zu vermeiden
    const existingIssues = await linearClient.issues({
        filter: { team: { id: { eq: LINEAR_TEAM_ID } }, state: { type: { neq: "completed" } } }
    });

    for (const finding of actionableFindings) {
        const title = `[Nuclei] ${finding.info.name} an ${finding["matched-at"]}`;
        
        // Deduplizierung: Prüfe, ob der Titel schon existiert
        const isDuplicate = existingIssues.nodes.some(issue => issue.title === title);
        if (isDuplicate) {
            console.log(`⏭️  Skipping duplicate: ${title}`);
            continue;
        }

        const description = `
**Schwachstelle**: ${finding.info.name}
**Schweregrad**: ${finding.info.severity.toUpperCase()}
**Gefunden bei**: ${finding["matched-at"]}
**Template**: ${finding["template-id"]}

${finding.info.description ? `**Beschreibung**:\n${finding.info.description}` : ''}

${finding["extracted-results"] ? `**Extrahierte Daten**:\n\`\`\`\n${finding["extracted-results"].join('\n')}\n\`\`\`` : ''}
        `;

        // Mapping von Schweregrad auf Linear Prio
        // (1: Urgent, 2: High, 3: Normal, 4: Low)
        let priority = 0; 
        switch (finding.info.severity.toLowerCase()) {
            case 'critical': priority = 1; break;
            case 'high': priority = 2; break;
            case 'medium': priority = 3; break;
            case 'low': priority = 4; break; // Low Prio -> wandert meist automatisch ins Backlog
        }

        try {
            await linearClient.createIssue({
                teamId: LINEAR_TEAM_ID,
                title: title,
                description: description,
                priority: priority,
            });
            console.log(`🎟️  Created ticket: ${title}`);
        } catch (error) {
            console.error(`❌ Failed to create ticket for ${title}:`, error);
        }
    }
}

run().catch(console.error);
