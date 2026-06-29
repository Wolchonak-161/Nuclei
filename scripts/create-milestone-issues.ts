import { LinearClient } from '@linear/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const LINEAR_API_KEY = process.env.LINEAR_API_KEY as string;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID as string;

if (!LINEAR_API_KEY || !LINEAR_TEAM_ID) {
    console.error('❌ ERROR: LINEAR_API_KEY und LINEAR_TEAM_ID müssen in der .env gesetzt sein.');
    process.exit(1);
}

const linearClient = new LinearClient({ apiKey: LINEAR_API_KEY });

interface MilestoneIssue {
    title: string;
    description: string;
    priority: number; // (1: Urgent, 2: High, 3: Normal, 4: Low)
}

const milestones: MilestoneIssue[] = [
    {
        title: '[DevSecOps] W1.1: Nuclei CLI Setup & Basics',
        description: `### Aufgaben:
- Installation der Nuclei CLI (über Go, Homebrew oder Binaries).
- Kennenlernen der Syntax und grundlegender Optionen.
- Ausführen erster Test-Scans gegen sichere Demoseiten (z. B. hacksplaining.com oder lokale Test-Server).
- Überprüfung des JSON-Outputs zur Vorbereitung des Parsers.`,
        priority: 3
    },
    {
        title: '[DevSecOps] W1.2: Scope-Definition & Target-Liste',
        description: `### Aufgaben:
- Identifikation aller relevanten Staging-Domains von Panos.ai (Next.js Frontend, Hono Backend, Cloud Instanzen wie Metabase).
- Erstellung einer standardisierten Target-Liste (URLs/IP-Adressen).
- Dokumentation der Test-Freigaben und Abgrenzungen.`,
        priority: 3
    },
    {
        title: '[DevSecOps] W1.3: Baseline Scan & Filterung',
        description: `### Aufgaben:
- Durchführung des ersten Baseline-Scans mit den Standard-Community-Templates von Nuclei.
- Auswertung der Ergebnisse in results.json.
- Identifizierung und Filterung von False Positives.
- Ausschluss irrelevanter Template-Klassen (z. B. WordPress, PHP), um die Scan-Zeit zu verkürzen.`,
        priority: 3
    },
    {
        title: '[DevSecOps] W2.1: Custom templates für Next.js & Supastarter',
        description: `### Aufgaben:
- Schreiben eigener YAML-Templates zur Suche nach exposed .env-Dateien.
- Erstellung von Templates zur Überprüfung exponierter Source Maps (.js.map).
- Entwicklung von Regex-basierten Scans zur Erkennung von Token-Leaks (AWS, Hubspot, Linear) in clientseitigen JS-Bundles.`,
        priority: 2
    },
    {
        title: '[DevSecOps] W2.2: Custom templates für Hono API (CORS & Headers)',
        description: `### Aufgaben:
- Schreiben von Templates zur Überprüfung von Hono API CORS-Richtlinien (z. B. Reaktion auf Origin: https://evil.com).
- Überprüfung fehlender Security-Header (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) in den HTTP-Antworten.
- Testen von Endpunkten auf unautorisierten Zugriff.`,
        priority: 2
    },
    {
        title: '[DevSecOps] W2.3: Cloud Infrastruktur-Scans',
        description: `### Aufgaben:
- Scannen der Metabase-Instanzen auf bekannte CVEs (z. B. Metabase RCE CVE-2023-38646).
- Überprüfung von AWS-S3-Buckets auf öffentliche Lese-/Schreibrechte.
- Testen auf Subdomain Takeover (z. B. verwaiste Route 53-Einträge, die auf gelöschte Amplify-Apps verweisen).`,
        priority: 2
    },
    {
        title: '[DevSecOps] W3.1: Parsing & Filtering Script',
        description: `### Aufgaben:
- Schreiben eines TS/Node.js-Skripts zum Auslesen des Nuclei JSON/JSONL-Outputs.
- Implementierung einer Filter-Logik: Ausschluss von "Info"-Meldungen von der Ticket-Erstellung (nur Medium, High, Critical weiterleiten).
- Strukturierte Aufbereitung der Findings.`,
        priority: 3
    },
    {
        title: '[DevSecOps] W3.2: Linear SDK & Deduplizierung',
        description: `### Aufgaben:
- Integration des Linear SDKs in das Parser-Skript.
- Implementierung einer Deduplizierungslogik (Abfragen offener Linear-Issues vor Ticket-Erstellung).
- Mapping der Nuclei-Schweregrade auf Linear-Schwierigkeitsstufen/Prioritäten.
- Testen der automatisierten Ticketerstellung.`,
        priority: 2
    },
    {
        title: '[DevSecOps] W3.3: CI/CD-Pipeline Automation',
        description: `### Aufgaben:
- Erstellung eines GitHub Actions Workflows, der wöchentlich oder nach jedem Deploy getriggert wird.
- Hinterlegung von API-Schlüsseln (Linear) und Target-Listen als GitHub Repository Secrets.
- Pipeline-End-to-End Test (Scan -> Parse -> Linear Ticket).`,
        priority: 2
    },
    {
        title: '[DevSecOps] W3.4: Dokumentation & Abschlusspräsentation',
        description: `### Aufgaben:
- Erstellung einer README.md mit Setup-Anleitung und Verweis auf das Sicherheitskonzept (PROJEKT_KONZEPT.md).
- Dokumentation aller geschriebenen Custom Templates.
- Vorbereitung der Abschlusspräsentation der DevSecOps Pipeline vor dem Panos.ai Team.`,
        priority: 3
    }
];

async function seedMilestones() {
    console.log(`🚀 Starte Seeding von ${milestones.length} Milestones im Linear-Board für Team-ID: ${LINEAR_TEAM_ID}...`);
    
    // Hole bereits existierende Issues, um Duplikate beim Seeding zu vermeiden
    const existingIssues = await linearClient.issues({
        filter: { team: { id: { eq: LINEAR_TEAM_ID } } }
    });
    
    for (const milestone of milestones) {
        const isDuplicate = existingIssues.nodes.some(issue => issue.title === milestone.title);
        
        if (isDuplicate) {
            console.log(`⏭️  Überspringe Duplikat: "${milestone.title}"`);
            continue;
        }
        
        try {
            await linearClient.createIssue({
                teamId: LINEAR_TEAM_ID,
                title: milestone.title,
                description: milestone.description,
                priority: milestone.priority
            });
            console.log(`✅ Ticket erfolgreich erstellt: "${milestone.title}"`);
        } catch (error) {
            console.error(`❌ Fehler beim Erstellen von "${milestone.title}":`, error);
        }
    }
    
    console.log('🎉 Seeding abgeschlossen!');
}

seedMilestones().catch(console.error);
