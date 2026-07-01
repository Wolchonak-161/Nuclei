# 3-Wochen Praktikumsplan: Nuclei DevSecOps Integration für Panos.ai

## 🎯 Warum dieser Ansatz ideal für deinen Lebenslauf ist
Deine Entscheidung, dich auf **Nuclei** zu konzentrieren, ist goldrichtig! Nuclei ist modern, extrem schnell und der aktuelle De-facto-Standard in der agilen Security-Community (DevSecOps). 

**Was das für deinen Lebenslauf bedeutet:**
1. **Automatisierung & DevSecOps:** Du zeigst, dass du nicht nur manuell nach Fehlern suchst, sondern Security in Prozesse integrieren kannst.
2. **API & Tooling-Erfahrung:** Die Integration von Nuclei-Ergebnissen in **Linear** über deren API (inkl. automatischem Abgleich und Schließen behobener Funde) zeigt deine Fähigkeiten im Workflow-Engineering.
3. **Spezialisierung:** Eigene YAML-Templates für spezifische Technologien (Hono, Next.js) zu schreiben, beweist tiefes technisches Verständnis.
4. **Resilienz & Deployment-Unabhängigkeit:** Das Bereitstellen einer "Local-First"-Ausführung stellt sicher, dass Scans und Ticket-Uploads auch dann funktionieren, wenn CI/CD-Infrastrukturen offline sind.

---

## 📅 Der 3-Wochen Projektplan

### Woche 1: Fundament & AWS-Staging-Scoping
*Fokus: Nuclei beherrschen und die Panos.ai Staging-Netzwerkumgebung verstehen.*

* **Tag 1-2: Onboarding & Setup**
  * Installation von Nuclei (CLI) und Kennenlernen der Syntax.
  * Ausführen der Standard-Community-Templates gegen sichere Testumgebungen.
  * Studium der JSON-Outputs, um die Datenstruktur für den Parser zu verstehen.
* **Tag 3-4: Scoping Panos.ai Staging (AWS)**
  * Definition der netzwerkseitig erreichbaren Staging-Ziele (Ausschluss von lokalem Source Code und Metabase aus dem Scope).
  * Zusammenstellen der Target-Liste für das AWS-Staging-Deployment.
* **Tag 5: Erster Baseline Scan**
  * Ausführen von Nuclei gegen die definierten Staging-Netzwerk-Ziele.
  * Filtern der Ergebnisse: Identifikation von False Positives.

### Woche 2: Custom Templates für Netzwerk-Audits
*Fokus: Custom YAML-Regeln schreiben, die auf die AWS-Staging-Infrastruktur abgestimmt sind.*

* **Tag 1-2: Template Tuning & Header-Checks**
  * Optimieren des Scan-Profils: Ausschließen irrelevanter Checks.
  * Schreiben von Templates für HTTP-Security-Header (HSTS, CSP) und CORS-Richtlinien an der Hono API.
* **Tag 3-4: Network Config Exposure**
  * Schreiben von Templates, die prüfen, ob sensible Konfigurationsdateien (wie `.env`-Dateien) versehentlich über HTTP/HTTPS an den Staging-Targets abrufbar sind.
* **Tag 5: Port- und Netzwerkdienst-Audits**
  * Ausführen gezielter Scans auf offene Ports und exponierte Staging-Dienste.

### Woche 3: Versionierte Outputs & Linear Ticket Lifecycle
*Fokus: Ausführung automatisieren, Ergebnisse versionieren und Tickets synchronisieren.*

* **Tag 1-2: Parser-Skript mit versionierten Outputs**
  * Entwicklung des TypeScript-Skripts zur automatischen Ablage der Scanergebnisse und Markdown-Reports in zeitgestempelten Ordnern unter `outputs/scan_YYYY-MM-DD_HH-mm-ss/`.
* **Tag 3-4: Linear-Integration & Auto-Close**
  * Integration des Linear SDK zur automatischen Ticket-Erstellung (Deduplizierung).
  * Implementierung der Lifecycle-Logik: Automatisches Schließen (`Completed`) offener Linear-Tickets, wenn die entsprechende Schwachstelle in einem neuen Scan nicht mehr gefunden wird.
  * Setup des lokalen Run-Modus (Interns können Scans und Ticket-Syncs bei Abwesenheit des Owners vollständig lokal via eigener `.env` ausführen).
* **Tag 5: Dokumentation & Präsentation**
  * Fertigstellung der README-Dateien und Abschlusspräsentation vor dem Panos.ai Team.
