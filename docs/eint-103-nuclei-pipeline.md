# 🛡️ EINT-103: Automated Pentest Pipeline (Nuclei & Linear)

Technical project specification for the Nuclei DevSecOps pipeline at Panos.ai.

For the milestone plan and timeline, see [docs/eint-501-milestone-plan.md](eint-501-milestone-plan.md).

---

## 1. Scope & Target Boundaries

The pipeline scans **network-facing AWS staging endpoints only**. Active scans target deployed web applications and APIs accessible over HTTP/HTTPS.

```
┌────────────────────────────────────────────────────────┐
│                    PROJECT SURFACE                     │
├───────────────────────────┬────────────────────────────┤
│         IN SCOPE          │        OUT OF SCOPE        │
├───────────────────────────┼────────────────────────────┤
│ • AWS Staging Endpoints   │ • Local Next.js source code│
│ • Staging APIs (Hono)     │ • Source map parsing       │
│ • Network exposed configs │ • Metabase CVE scans       │
│ • HTTP/HTTPS audits       │ • Production environments  │
└───────────────────────────┴────────────────────────────┘
```

> **Staging Isolation Policy:** Scans are executed **exclusively** against isolated staging systems. Scanning production environments is prohibited.

---

## 2. Nuclei vs. ZAP — Why Both?

Both tools scan HTTP endpoints on the same staging infrastructure, but they serve **fundamentally different purposes** and complement each other:

| Aspect | ZAP (DAST Proxy) | Nuclei (Template Scanner) |
|---|---|---|
| **Method** | Active proxy — crawls, intercepts, and fuzzes live webapp sessions | Declarative YAML templates — targeted checks without session crawling |
| **Strength** | Deep webapp session testing: auth flows, CSRF tokens, XSS injection, session hijacking | Custom config audits, CVE signature checks, secret pattern detection (`lin_api_*`), CI/CD-native JSON output |
| **Template System** | Built-in scan policies with limited customization | Fully custom YAML — we write rules specific to our stack (Hono headers, `.env` exposure, API key patterns) |
| **Output Format** | HTML/XML reports for manual review | Structured JSON → parsed by script → **auto-synced to Linear** |
| **Session Handling** | Full session management (cookies, auth tokens, multi-step flows) | Stateless HTTP requests per template |
| **Speed** | Slower (deep crawling + fuzzing) | Fast (parallel template execution, targeted checks) |

**Summary:**
- **ZAP** tests *how the app behaves* under attack (injection, session manipulation, crawl-based discovery).
- **Nuclei** tests *what the app exposes* in its configuration (missing headers, leaked files, known CVE patterns) and feeds results directly into the developer workflow via Linear.

They are **not interchangeable** — both are required for comprehensive staging security coverage.

---

## 3. Execution Environment & Local Token Setup

### Execution Modes

| Mode | When | How |
|---|---|---|
| **Primary: Local Workstation** | Always available — no dependencies on @Frank | Intern runs CLI scan + `npm run sync-tickets` locally |
| **Secondary: GitHub Actions** | When @Frank has configured repository secrets | Automated via `.github/workflows/nuclei-security-scan.yml` |

### How to Generate a Personal Linear API Token

When the repository owner (@Frank) is unavailable to configure GitHub Actions secrets, interns can run the full pipeline locally using a personal Linear API token:

1. Go to [linear.app](https://linear.app) → click your **avatar** (bottom-left corner) → **Settings**
2. In the left sidebar, click **API** → click **"Create key"**
3. Enter a name (e.g. `nuclei-sync`) → click **Create** → **copy** the `lin_api_...` token
4. In the `nuclei/` project directory, create a file called `.env`:
   ```bash
   cp .env.example .env
   ```
5. Open `.env` and add your credentials:
   ```env
   LINEAR_API_KEY=lin_api_your_key_here
   LINEAR_TEAM_ID=<your-team-id>
   ```
6. To find your Team ID, run:
   ```bash
   npx ts-node upload/list-teams.ts
   ```
7. To sync scan results to Linear, run:
   ```bash
   npm run sync-tickets
   ```

> The `.env` file is excluded from git via `.gitignore` — credentials are never committed.

---

## 4. Severity Routing

**All actionable severities** (critical, high, medium, low) create Linear tickets. Only purely informational findings (`info`) are logged locally.

| Severity | → Linear Ticket? | → `recon_summary.md`? | Rationale |
|---|---|---|---|
| **Critical** | ✅ Yes | No | Immediate triage required |
| **High** | ✅ Yes | No | Must be tracked and resolved |
| **Medium** | ✅ Yes | No | Sprint planning |
| **Low** | ✅ Yes | No | Backlog triage |
| **Info** | ❌ No | ✅ Yes | Purely informational — no action needed |

> There is **no separate file** for low-severity findings. All actionable vulnerabilities are managed in Linear.

---

## 5. Linear Project Structure & Issue Organization

All work is tracked under a single Linear project with a NIST-aligned parent issue:

```
Project: EINT-103: Nuclei DevSecOps Pipeline
│
├── Parent Issue: [ID.RA-1] EINT-103: Automated Pentest Pipeline (Nuclei & Linear)
│   ├── [DevSecOps] W1.1 – W3.4    (milestone tasks, label: milestone)
│   └── [Nuclei] <Finding> – <host> (scan findings, label: nuclei-scan)
│
├── Cycle 1: Foundation & Scoping    (June 29 – July 5)
├── Cycle 2: Custom Templates        (July 6 – July 12)
└── Cycle 3: Automation & Outputs    (July 13 – July 19)
```

### Labels
| Label | Color | Applied To |
|---|---|---|
| `milestone` | 🔵 #3498db | Planning/milestone sub-issues (`[DevSecOps] W*.x`) |
| `nuclei-scan` | 🔴 #e74c3c | Auto-created vulnerability findings (`[Nuclei] ...`) |

### Workflow States
| Order | State | Type | Purpose |
|---|---|---|---|
| 1 | **Triage** | Unstarted | New findings land here for initial review |
| 2 | **Backlog** | Backlog | Triaged but not yet planned |
| 3 | **Todo** | Unstarted | Planned for current cycle/sprint |
| 4 | **In Progress** | Started | Actively being worked on |
| 5 | **Done** | Completed | Resolved / verified |

---

## 6. Issue Lifecycle & Ticket Format

### Title Format
```
[Nuclei] <Finding Name> – <hostname>
```
Example: `[Nuclei] Missing HSTS Header – staging.panos.ai`

> **No full URL paths in titles.** The hostname is sufficient for identification. The full URL is included in the description.

### Initial State
Issues are created in **Backlog** — they require triage before being planned into a sprint.

### Priority Mapping (Linear's Wording)
| Nuclei Severity | Linear Priority | Priority Value |
|---|---|---|
| Critical | **Urgent** | 1 |
| High | **High** | 2 |
| Medium | **Medium** | 3 |
| Low | **Low** | 4 |

### Label
All auto-created findings receive the `nuclei-scan` label (not the generic `Security` label).

### Description Template
Every auto-created issue uses the following structured description:

```markdown
## Vulnerability Report

| Field | Value |
|---|---|
| **Finding** | <finding name> |
| **Severity** | <CRITICAL / HIGH / MEDIUM / LOW> |
| **Target** | <full matched URL> |
| **Hostname** | <hostname> |
| **Template** | <nuclei template-id> |

### Description
<description from the template, or 'No description available.'>

### Extracted Data
<extracted results, or 'None'>

---
*Auto-generated by nuclei-to-linear.ts*
```

### Deduplication
Before creating a ticket, the script queries all active (non-completed) issues on the team board. If an issue with the same title already exists, creation is skipped.

### Auto-Close (Vulnerability Resolution)
When a scan runs, the script compares active `[Nuclei]` issues against the current findings. If a previously reported vulnerability is **no longer detected**, the script automatically transitions the corresponding issue to **Done** — marking it as resolved.

---

## 7. Unified Severity & Gating Matrix

This is the **single source of truth** for severity handling across the entire pipeline:

| Severity | Linear Priority | Linear Action | CI/CD Exit Code | Build Gate | SLA |
|---|---|---|---|---|---|
| **Critical** | Urgent (1) | Create ticket in Backlog | `1` | ❌ Hard Fail | < 24 hours |
| **High** | High (2) | Create ticket in Backlog | `1` | ❌ Hard Fail | 3 days |
| **Medium** | Medium (3) | Create ticket in Backlog | `0` | ⚠️ Warning | Next sprint |
| **Low** | Low (4) | Create ticket in Backlog | `0` | ✅ Pass | Backlog triage |
| **Info** | — | Log to `recon_summary.md` | `0` | ✅ Pass | Informational |

> This table governs both the `nuclei-to-linear.ts` script behavior and the GitHub Actions CI/CD workflow exit codes.

---

## 8. Output Versioning

Every scan run creates a timestamped subfolder:

```
outputs/
├── .gitkeep
├── scan_2026-07-01_14-30-00/
│   ├── results.json          # Raw Nuclei JSON output
│   └── recon_summary.md      # Info-level findings table
└── scan_2026-07-02_09-15-22/
    ├── results.json
    └── recon_summary.md
```

- **Committed to git:** Scan outputs are versioned in the repository for traceability and team visibility.
- **Folder structure** is preserved via `.gitkeep` even when no scans have been run.

---

## 9. Go-Live Checklist

Each item corresponds to a step defined in the sections above:

- [ ] **Legal consent** obtained from CTO/Management for scanning staging targets (§1)
- [ ] **Staging target list** finalized and verified — no production IPs (§1)
- [ ] **Linear Project** "EINT-103" created with parent issue and cycles (§5)
- [ ] **`nuclei-scan` label** created on the team board (§5)
- [ ] **Triage workflow state** added to the team board (§5)
- [ ] **Local execution tested:** scan → `npm run sync-tickets` → tickets appear in Backlog (§3, §6)
- [ ] **Auto-close tested:** removed finding → ticket moves to Done (§6)
- [ ] **Description template** verified on created tickets (§6)
- [ ] **Documentation** pushed to GitHub in `docs/` folder (§8)
