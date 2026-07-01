# 🧪 Panos.ai Automated Pentest Pipeline (Nuclei & Linear)

This repository contains the automated security and penetration testing pipeline built for **Panos.ai**, designed to run continuous security scans against our staging environments using **Nuclei** and sync the findings directly into the developers' workflow via **Linear**.

This project aligns with the **NIST Cybersecurity Framework (CSF) v2.0** (Identify, Protect, Detect, and Respond) to ensure robust security postures.

---

## 🚀 Key Features

* **Targeted Scanning:** Custom and community-sourced scans specifically tuned for the Panos.ai tech stack (Next.js, Hono API, AWS infrastructure, and Metabase).
* **Automatic Linear Ticketing:** Real-time extraction of vulnerabilities (Critical, High, Medium, Low) and direct conversion into Linear tasks with automatic deduplication.
* **Informational Summaries:** Lower-priority or informational findings are logged locally to a `recon_summary.md` report to prevent developer ticket-spam.
* **Zero Credentials AWS Checks:** Encourages using AWS OpenID Connect (OIDC) for scanning AWS configurations without storing persistent credentials.
* **CI/CD Gating:** Built to fail staging builds if Critical or High vulnerabilities are identified.

---

## 📂 Directory Structure

Aligned with the workspace folder structure to prevent tool clutter and keep assets modular:

```yaml
panos-ai-pentest/
├── templates/                  # Custom-tuned Nuclei YAML templates
│   ├── js-bundle-token-leakage.yaml    # Scans client-side bundles for leaked API keys
│   ├── panos-hono-security-headers.yaml # Verifies response headers (HSTS, CSP, CORS)
│   └── panos-nextjs-config-leak.yaml   # Checks for exposed Next.js .env/config files
├── scripts/                    # Scripts for automation & integration
│   ├── nuclei-to-linear.ts     # Parses results.json and synchronizes with Linear Board
│   ├── list-teams.ts           # Lists Linear Teams to retrieve your LINEAR_TEAM_ID
│   └── create-milestone-issues.ts # Helper to seed milestone tickets inside Linear
├── PROJEKT_KONZEPT.md          # Full project concept and security strategy (German)
├── 3_wochen_nuclei_plan.md     # 3-Week Internship milestone schedule (German)
├── eint-501.md                 # English Milestone Internship Plan
├── package.json                # Project dependencies and script definitions
└── tsconfig.json               # TypeScript compiler configuration
```

---

## ⚙️ Prerequisites & Setup

### 1. Install Nuclei CLI
Ensure you have the Nuclei CLI tool installed on your machine.
```bash
# macOS (using Homebrew)
brew install nuclei

# Using Go
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
```

### 2. Install Project Dependencies
Install the required Node.js libraries for the TypeScript parser and Linear integration:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the project by copying the example template:
```bash
cp .env.example .env
```
Open `.env` and fill in your Linear API key:
```env
LINEAR_API_KEY=lin_api_your_key_here
LINEAR_TEAM_ID=your_team_id_here
```

### 4. Fetch your Linear Team ID
If you do not know your target team's unique ID, run the team helper script:
```bash
npx ts-node scripts/list-teams.ts
```
Copy the relevant `Team ID` from the console output and paste it into your `.env` as the `LINEAR_TEAM_ID`.

---

## 💻 Usage

### Step 1: Run Nuclei Scan
Scan your staging targets using our custom-tuned templates and export the findings to `results.json`:
```bash
# Scan a single target using local custom templates
nuclei -t templates/ -u https://staging.panos.ai -json-export results.json
```

### Step 2: Synchronize Findings with Linear
Execute the parser script to push actionable vulnerabilities to the Linear Board:
```bash
npm run sync-tickets
```
*Note: The script defaults to parsing `results.json` in the current working directory. You can specify a custom file path using:*
```bash
npx ts-node scripts/nuclei-to-linear.ts path/to/vulnerabilities.json
```

---

## 📊 Severity & Gating Matrix

Findings are categorized and gated as follows:

| Severity | Exit Code | Build Status | Action | SLA |
| :--- | :---: | :--- | :--- | :--- |
| **Critical** | `1` | ❌ Hard Fail | Create Linear Ticket | Behave immediately (< 24h) |
| **High** | `1` | ❌ Hard Fail | Create Linear Ticket | Resolve within 3 days |
| **Medium** | `0` | ⚠️ Soft Fail | Create Linear Ticket | Resolve in next sprint |
| **Low** | `0` | ✅ Pass | Create Linear Ticket | Backlog triage |
| **Info** | `0` | ✅ Pass | Append to `recon_summary.md` | Review as needed |

---

## 🛡️ Staging Isolation Policy

> [!IMPORTANT]
> To prevent system disruption and database corruption, **never** execute active scanning, fuzzing, or vulnerability probes against production environments. All automated scans must target isolated **Staging** and **Testing** systems.

---

## 📄 Documentation & Resources
* For a detailed explanation of the security strategy and legal framework, read [PROJEKT_KONZEPT.md](file:///Users/tk/.gemini/antigravity/scratch/panos-ai-pentest/PROJEKT_KONZEPT.md).
