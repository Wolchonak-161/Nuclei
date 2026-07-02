# 🧪 Panos.ai Automated Pentest Pipeline (Nuclei & Linear)

This repository contains the automated security scanning pipeline for **Panos.ai**, designed to run network-facing security scans against AWS staging environments using **Nuclei** and sync findings directly into the developers' workflow via **Linear**.

Aligned with **NIST CSF v2.0** (ID.RA-1: Risk Assessment).

---

## 📄 Documentation

| Document | Description |
|---|---|
| [EINT-103: Technical Specification](docs/eint-103-nuclei-pipeline.md) | Full project spec — scope, Nuclei vs. ZAP, Linear lifecycle, severity matrix, go-live checklist |
| [EINT-501: Milestone Plan](docs/eint-501-milestone-plan.md) | Timeline, cycles, milestones, acceptance criteria |
| [PROJEKT_KONZEPT.md](PROJEKT_KONZEPT.md) | Security strategy and legal framework (German) |
| [3_wochen_nuclei_plan.md](3_wochen_nuclei_plan.md) | 3-week internship schedule (German) |

---

## 📂 Directory Structure

```
nuclei/
├── docs/                       # Project documentation
│   ├── eint-103-nuclei-pipeline.md   # Technical specification
│   └── eint-501-milestone-plan.md    # Milestone plan
├── templates/                  # Custom YAML scan templates
│   ├── panos-hono-security-headers.yaml
│   └── panos-nextjs-config-leak.yaml
├── upload/                     # Integration & sync scripts
│   ├── nuclei-to-linear.ts    # Parses results, syncs to Linear (with auto-close)
│   ├── list-teams.ts          # Utility: fetch Linear team IDs
│   └── create-milestone-issues.ts
├── outputs/                    # Versioned scan outputs (committed to git)
│   ├── .gitkeep
│   └── scan_YYYY-MM-DD_HH-mm-ss/
│       ├── results.json       # Raw Nuclei JSON output
│       └── recon_summary.md   # Info-level findings report
├── package.json
└── tsconfig.json
```

---

## ⚙️ Setup

### 1. Install Nuclei CLI
```bash
# macOS
brew install nuclei

# Using Go
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Credentials
```bash
cp .env.example .env
```
Add your personal Linear API key and team ID (see [EINT-103 §3](docs/eint-103-nuclei-pipeline.md#3-execution-environment--local-token-setup) for step-by-step token instructions):
```env
LINEAR_API_KEY=lin_api_your_key_here
LINEAR_TEAM_ID=your_team_id_here
```

### 4. Find Your Team ID
```bash
npx ts-node upload/list-teams.ts
```

---

## 💻 Usage

### Step 1: Run Scan
```bash
nuclei -t templates/ -u https://staging.panos.ai -json-export results.json
```

### Step 2: Sync to Linear
```bash
npm run sync-tickets
```

This will:
- Create versioned output folder (`outputs/scan_YYYY-MM-DD_HH-mm-ss/`)
- Create Linear tickets for critical/high/medium/low findings (in **Backlog**)
- Skip duplicate tickets
- Auto-close tickets for resolved vulnerabilities
- Log info-level findings to `recon_summary.md`

---

## 🎟️ Linear Integration

| Feature | Detail |
|---|---|
| **Title Format** | `[Nuclei] <Finding Name> – <hostname>` |
| **Initial State** | Backlog |
| **Label** | `nuclei-scan` |
| **Priority** | Urgent (1) / High (2) / Medium (3) / Low (4) |
| **Deduplication** | Matching title check — no duplicates |
| **Auto-Close** | Resolved vulnerabilities → Done |

### Severity & Gating Matrix

| Severity | Linear Priority | CI/CD Exit | Build Gate | SLA |
|---|---|---|---|---|
| **Critical** | Urgent (1) | `1` | ❌ Hard Fail | < 24 hours |
| **High** | High (2) | `1` | ❌ Hard Fail | 3 days |
| **Medium** | Medium (3) | `0` | ⚠️ Warning | Next sprint |
| **Low** | Low (4) | `0` | ✅ Pass | Backlog triage |
| **Info** | — | `0` | ✅ Pass | Informational |

---

## 🛡️ Staging Isolation Policy

> [!IMPORTANT]
> **Never** execute scans against production environments. All automated scans target isolated **Staging** systems only.
