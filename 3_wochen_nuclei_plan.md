# 3-Wochen Praktikumsplan: Nuclei DevSecOps Integration für Panos.ai

## 🎯 Warum dieser Ansatz ideal für deinen Lebenslauf ist
Deine Einschätzung, dich auf **Nuclei** zu konzentrieren, ist goldrichtig! Nuclei ist modern, extrem schnell und der aktuelle De-facto-Standard in der agilen Security-Community (DevSecOps). 

**Was das für deinen Lebenslauf bedeutet:**
1. **Automatisierung & DevSecOps:** Du zeigst, dass du nicht nur manuell nach Fehlern suchst, sondern Security in Prozesse integrieren kannst (CI/CD).
2. **API & Tooling-Erfahrung:** Die Integration von Nuclei-Ergebnissen in **Linear** über deren API zeigt deine Fähigkeiten im Scripting und Workflow-Engineering.
3. **Spezialisierung:** Eigene YAML-Templates für spezifische Technologien (Next.js, Hono) zu schreiben, beweist tiefes technisches Verständnis.
4. **Impact:** Ein funktionierendes System, das Tickets für Entwickler erstellt, bietet echten Mehrwert für das Unternehmen, den du in Interviews quantifizieren kannst.

---

## 📅 Der 3-Wochen Projektplan

### Woche 1: Fundament & Infrastruktur-Verständnis
*Fokus: Nuclei beherrschen und die Panos.ai Staging-Umgebung verstehen.*

* **Tag 1-2: Onboarding & Setup**
  * Installation von Nuclei (CLI) und Kennenlernen der Syntax.
  * Ausführen der Standard-Community-Templates gegen eine sichere Testumgebung (z.B. `hacksplaining.com` oder lokale Test-Apps).
  * Studium der JSON-Outputs (`-json-export`), um die Datenstruktur für später zu verstehen.
* **Tag 3-4: Scoping Panos.ai**
  * Verständnis der Staging-Umgebung (Next.js Frontend, Hono API Endpoints).
  * Zusammenstellen einer Zielliste (URLs, Endpoints) für den Scan.
* **Tag 5: Erster Baseline Scan**
  * Ausführen von Nuclei gegen die Panos.ai Staging-Umgebung (mit Erlaubnis!).
  * Filtern der Ergebnisse: Identifikation von False Positives und relevanten Findings.

### Woche 2: Customization & Fokus-Templates
*Fokus: Nuclei an den spezifischen Tech-Stack von Panos.ai anpassen.*

* **Tag 1-2: Template Tuning**
  * Optimieren des Scan-Profils. Ausschließen von Templates, die für den Tech-Stack irrelevant sind (z.B. WordPress- oder PHP-Plugins), um die Scan-Zeiten drastisch zu reduzieren.
* **Tag 3-4: Eigene Templates für Hono & Next.js**
  * Schreiben eigener YAML-Templates, die auf spezifische Architektur-Muster oder bekannte Fehlkonfigurationen im aktuellen Panos.ai Code prüfen (z.B. exponierte `.env` Dateien in Next.js, fehlende Security-Header in der Hono API).
* **Tag 5: API-Fuzzing Vorbereitung**
  * Hono API-Dokumentation (OpenAPI/Swagger, falls vorhanden) nutzen, um gezielte Requests über Nuclei zu definieren.

### Woche 3: Automatisierung & Linear-Integration (Das Highlight!)
*Fokus: Ausführung automatisieren und Findings für Entwickler nutzbar machen.*

* **Tag 1-2: Parsing Script (Python/Node.js)**
  * Schreiben eines kleinen Scripts, das die Nuclei-JSON-Ergebnisse einliest.
  * Filter-Logik implementieren: Nur Schwachstellen ab Schweregrad "Medium/High" berücksichtigen, um Ticket-Spam zu vermeiden.
* **Tag 3-4: Linear API Integration**
  * Nutzung der Linear GraphQL API (oder SDK), um automatisiert Tickets im passenden Entwickler-Board anzulegen.
  * Das Script sollte deduplizieren (keine neuen Tickets für bereits gefundene Schwachstellen anlegen).
* **Tag 5: Dokumentation & Präsentation**
  * Dokumentieren des Setup-Prozesses (README) für das Team.
  * Abschlusspräsentation der Pipeline vor dem Tech-Team von Panos.ai.

---

## 🚀 Nächste Schritte für unser Projekt hier
Um dieses Projekt erfolgreich zu starten, können wir das Script für die **Linear-Integration** sowie einige **maßgeschneiderte Nuclei-Templates** gemeinsam hier im Projektordner entwickeln.
