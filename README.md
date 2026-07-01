# 🧪 Panos.ai Automated Pentest Pipeline (Nuclei & Linear)

This repository contains the automated security and penetration testing pipeline built for **Panos.ai**, designed to run network-facing security scans against our AWS staging environments using **Nuclei** and sync the findings directly into the developers' workflow via **Linear**.

This project aligns with the **NIST Cybersecurity Framework (CSF) v2.0** (Identify, Protect, Detect, and Respond) to ensure robust staging security.

---

## 🚀 Key Features

* **AWS Staging Scope:** Strictly network-facing audits against AWS staging URLs. No local source code parsing or Metabase dependencies.
* **Outputs Folder with Versioning:** Every run generates a timestamped sub-folder under `outputs/scan_YYYY-MM-DD_HH-mm-ss/` containing the raw `results.json` and a run-specific `recon_summary.md`.
* **Vulnerability Lifecycle (Auto-Close):** High/critical findings create Linear issues. If a vulnerability is resolved and no longer detected in subsequent runs, the sync script automatically moves the corresponding Linear ticket to `Completed`.
* **Local-First & Offline Resilence:** Scans and synchronization can be executed fully locally on intern workstations using personal Linear developer tokens—ensuring operations continue even if the owner (Frank) is offline.
* **Deduplication:** Prevents duplicate ticket spam on the developer board.

---

## 📂 Directory Structure

Aligned with the workspace structure for clear separation of tool configurations, uploads, and outputs:

```yaml
panos-ai-pentest/
├── templates/                  # Custom network-based YAML templates
│   ├── panos-hono-security-headers.yaml # Verifies HTTP response headers (HSTS, CSP, CORS)
│   └── panos-nextjs-config-leak.yaml   # Scans staging endpoints for exposed config/.env files
├── upload/                     # Integrations and ticket uploading scripts
│   ├── nuclei-to-linear.ts     # Parses results, version-saves outputs, and syncs with Linear
│   ├── list-teams.ts           # Utility to fetch available Linear Team IDs
│   └── create-milestone-issues.ts # Roadmap milestone seeder for Linear
├── outputs/                    # Versioned scan outputs folder (Run-by-Run logs)
│   ├── .gitkeep
│   └── scan_YYYY-MM-DD_HH-mm-ss/ # Run folder created dynamically by the script
│       ├── results.json        # Raw JSON output of that specific scan run
│       └── recon_summary.md    # Markdown table of low/informational findings for the run
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

### 3. Environment Configuration (Local Fallback Mode)
If the owner (Frank) is offline and cannot configure GitHub Actions secrets, you can run the pipeline locally. Create a `.env` file in the root of the project:
```bash
cp .env.example .env
```
Open `.env` and fill in your personal Linear API key and target Team ID:
```env
LINEAR_API_KEY=lin_api_your_key_here
LINEAR_TEAM_ID=your_team_id_here
```

### 4. Fetch your Linear Team ID
Run the helper script to list all teams in your workspace and find your target `Team ID`:
```bash
npx ts-node upload/list-teams.ts
```
Copy the relevant `Team ID` from the console output and paste it into your `.env` as the `LINEAR_TEAM_ID`.

---

## 💻 Usage

### Step 1: Run Nuclei Scan
Scan your staging network targets using the custom templates and export findings to a temporary JSON file:
```bash
nuclei -t templates/ -u https://staging.panos.ai -json-export results.json
```

### Step 2: Synchronize Findings & Version Logs
Run the sync script to process the results, move reports into versioned folders, and update Linear tickets:
```bash
# Default (looks for results.json in root)
npm run sync-tickets

# Custom results path
npx ts-node upload/nuclei-to-linear.ts path/to/vulnerabilities.json
```

---

## 🎟️ Linear Ticket Lifecycle & Management

The sync script automatically manages the lifecycle of issues:

* **Triage State:** New tickets start in `Todo` (mapped to target team board) with a `Security` or `DevSecOps` tag.
* **Title Format:** `[Nuclei] <Vulnerability Name> an <Target URL>`.
* **Priority Mapping:** Severity maps to Linear priority:
  - Critical $\rightarrow$ Priority 1 (Urgent)
  - High $\rightarrow$ Priority 2 (High)
  - Medium $\rightarrow$ Priority 3 (Normal)
  - Low $\rightarrow$ Priority 4 (Low)
* **Deduplication:** Prevents recreation of issues if a ticket with the same title is already active.
* **Auto-Close:** If a previously reported vulnerability is fixed (not found in the current scan results), the script automatically moves the corresponding Linear issue to `Completed` (e.g., `Done` or `Completed`).

---

## 📊 Severity & Gating Matrix

Findings are categorized and gated as follows:

| Severity | Exit Code | Build Status | Action | SLA |
| :--- | :---: | :--- | :--- | :--- |
| **Critical** | `1` | ❌ Hard Fail | Create/Sync Linear Ticket | Immediate (< 24h) |
| **High** | `1` | ❌ Hard Fail | Create/Sync Linear Ticket | Resolve within 3 days |
| **Medium** | `0` | ⚠️ Soft Fail | Create/Sync Linear Ticket | Resolve in next sprint |
| **Low** | `0` | ✅ Pass | Create/Sync Linear Ticket | Backlog triage |
| **Info** | `0` | ✅ Pass | Append to `outputs/scan_timestamp/recon_summary.md` | Review as needed |

---

## 🛡️ Staging Isolation Policy

> [!IMPORTANT]
> To prevent system disruption and database corruption, **never** execute active scanning, fuzzing, or vulnerability probes against production environments. All automated scans must target isolated **Staging** and **Testing** systems.
---

## 📄 Documentation & Resources
* For a detailed explanation of the security strategy and legal framework, read [PROJEKT_KONZEPT.md](file:///Users/tk/.gemini/antigravity/scratch/panos-ai-pentest/PROJEKT_KONZEPT.md).
* For internship milestones and deliverables, view [eint-501.md](file:///Users/tk/.gemini/antigravity/scratch/panos-ai-pentest/eint-501.md).
