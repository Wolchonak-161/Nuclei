import { LinearClient } from '@linear/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY as string });
const TEAM_ID = process.env.LINEAR_TEAM_ID as string;

async function restructure() {
    const team = await client.team(TEAM_ID);
    const states = await team.states();

    // ─── 1. Create Triage workflow state ───
    console.log('\n=== 1. Creating Triage workflow state ===');
    const existingTriage = states.nodes.find(s => s.name === 'Triage');
    let triageStateId: string;
    if (existingTriage) {
        triageStateId = existingTriage.id;
        console.log(`  ⏭️  Triage state already exists (ID: ${triageStateId})`);
    } else {
        // Linear only allows: backlog, unstarted, started, completed, canceled
        // Triage is created as 'unstarted' type, positioned before Todo
        const todoState = states.nodes.find(s => s.name === 'Todo');
        const triagePosition = todoState ? todoState.position - 0.5 : 0.5;
        const result = await client.createWorkflowState({
            teamId: TEAM_ID,
            name: 'Triage',
            type: 'unstarted',
            color: '#f59e0b',
            position: triagePosition,
        });
        const triageState = await result.workflowState;
        triageStateId = triageState!.id;
        console.log(`  ✅ Created Triage state (ID: ${triageStateId})`);
    }

    // ─── 2. Create labels ───
    console.log('\n=== 2. Creating labels ===');
    const existingLabels = await team.labels();

    let nucleiLabelId: string;
    const existingNucleiLabel = existingLabels.nodes.find(l => l.name === 'nuclei-scan');
    if (existingNucleiLabel) {
        nucleiLabelId = existingNucleiLabel.id;
        console.log(`  ⏭️  nuclei-scan label already exists (ID: ${nucleiLabelId})`);
    } else {
        const result = await client.createIssueLabel({ teamId: TEAM_ID, name: 'nuclei-scan', color: '#e74c3c' });
        const label = await result.issueLabel;
        nucleiLabelId = label!.id;
        console.log(`  ✅ Created nuclei-scan label (ID: ${nucleiLabelId})`);
    }

    let milestoneLabelId: string;
    const existingMilestoneLabel = existingLabels.nodes.find(l => l.name === 'milestone');
    if (existingMilestoneLabel) {
        milestoneLabelId = existingMilestoneLabel.id;
        console.log(`  ⏭️  milestone label already exists (ID: ${milestoneLabelId})`);
    } else {
        const result = await client.createIssueLabel({ teamId: TEAM_ID, name: 'milestone', color: '#3498db' });
        const label = await result.issueLabel;
        milestoneLabelId = label!.id;
        console.log(`  ✅ Created milestone label (ID: ${milestoneLabelId})`);
    }

    // ─── 3. Create Project ───
    console.log('\n=== 3. Creating Project ===');
    const projects = await client.projects();
    const existingProject = projects.nodes.find(p => p.name.includes('EINT-103'));
    let projectId: string;
    if (existingProject) {
        projectId = existingProject.id;
        console.log(`  ⏭️  Project already exists (ID: ${projectId})`);
    } else {
        const result = await client.createProject({
            teamIds: [TEAM_ID],
            name: 'EINT-103: Nuclei DevSecOps Pipeline',
            description: 'Automated Pentest Pipeline using Nuclei with Linear integration for vulnerability tracking. Aligned with NIST CSF ID.RA-1.',
            state: 'started',
        });
        const project = await result.project;
        projectId = project!.id;
        console.log(`  ✅ Created project "EINT-103: Nuclei DevSecOps Pipeline" (ID: ${projectId})`);
    }

    // ─── 4. Create parent issue ───
    console.log('\n=== 4. Creating parent issue ===');
    const allIssues = await client.issues({
        filter: { team: { id: { eq: TEAM_ID } } }
    });
    const existingParent = allIssues.nodes.find(i => i.title.includes('[ID.RA-1] EINT-103'));
    let parentIssueId: string;
    if (existingParent) {
        parentIssueId = existingParent.id;
        console.log(`  ⏭️  Parent issue already exists (ID: ${parentIssueId})`);
    } else {
        const backlogState = states.nodes.find(s => s.type === 'backlog');
        const result = await client.createIssue({
            teamId: TEAM_ID,
            title: '[ID.RA-1] EINT-103: Automated Pentest Pipeline (Nuclei & Linear)',
            description: `# EINT-103: Automated Pentest Pipeline\n\nParent issue for the Nuclei DevSecOps pipeline project.\n\n**NIST CSF Alignment:** ID.RA-1 (Risk Assessment)\n\n**Objective:** Implement continuous security scanning of AWS staging environments using Nuclei, with automated vulnerability tracking and lifecycle management via Linear.\n\n**Scope:** Network-facing AWS staging endpoints only (no local source code, no Metabase).\n\n## Sub-Issues\nAll milestone tasks (W1.1–W3.4) and auto-created scan findings are organized under this parent.`,
            priority: 2,
            stateId: backlogState?.id,
            projectId: projectId,
            labelIds: [milestoneLabelId],
        });
        const parentIssue = await result.issue;
        parentIssueId = parentIssue!.id;
        console.log(`  ✅ Created parent issue "${parentIssue!.identifier}: ${parentIssue!.title}"`);
    }

    // ─── 5. Reparent milestone issues (PAN-7 through PAN-16) & apply labels ───
    console.log('\n=== 5. Reparenting milestone issues & applying labels ===');
    const milestoneIssues = allIssues.nodes.filter(i => i.title.startsWith('[DevSecOps]'));
    for (const issue of milestoneIssues) {
        try {
            await client.updateIssue(issue.id, {
                parentId: parentIssueId,
                projectId: projectId,
                labelIds: [milestoneLabelId],
            });
            console.log(`  ✅ ${issue.identifier}: reparented + labeled`);
        } catch (error: any) {
            console.error(`  ❌ Failed to update ${issue.identifier}: ${error.message}`);
        }
    }

    // ─── 6. Apply nuclei-scan label to scan findings ───
    console.log('\n=== 6. Applying nuclei-scan label to findings ===');
    const nucleiFindings = allIssues.nodes.filter(i => i.title.startsWith('[Nuclei]'));
    for (const issue of nucleiFindings) {
        try {
            await client.updateIssue(issue.id, {
                parentId: parentIssueId,
                projectId: projectId,
                labelIds: [nucleiLabelId],
            });
            console.log(`  ✅ ${issue.identifier}: labeled nuclei-scan + reparented`);
        } catch (error: any) {
            console.error(`  ❌ Failed to update ${issue.identifier}: ${error.message}`);
        }
    }

    // ─── 7. Fix PAN-6 title (short format) ───
    console.log('\n=== 7. Fixing long titles ===');
    for (const issue of nucleiFindings) {
        if (issue.title.includes('https://')) {
            try {
                const url = issue.title.match(/https?:\/\/[^\s]+/)?.[0];
                if (url) {
                    const hostname = new URL(url).hostname;
                    const findingName = issue.title.replace(/\[Nuclei\]\s*/, '').replace(/\s*an\s*https?:\/\/[^\s]+/, '');
                    const newTitle = `[Nuclei] ${findingName} – ${hostname}`;
                    await client.updateIssue(issue.id, { title: newTitle });
                    console.log(`  ✅ ${issue.identifier}: "${issue.title}" → "${newTitle}"`);
                }
            } catch (error: any) {
                console.error(`  ❌ Failed to fix title for ${issue.identifier}: ${error.message}`);
            }
        }
    }

    // ─── 8. Create Cycles ───
    console.log('\n=== 8. Creating Cycles ===');
    const cycles = await team.cycles();
    
    const cycleConfigs = [
        { name: 'Week 1: Foundation & Scoping', start: '2026-06-29', end: '2026-07-05', issuePrefix: ['W1.1', 'W1.2', 'W1.3'] },
        { name: 'Week 2: Custom Templates', start: '2026-07-06', end: '2026-07-12', issuePrefix: ['W2.1', 'W2.2', 'W2.3'] },
        { name: 'Week 3: Automation & Outputs', start: '2026-07-13', end: '2026-07-19', issuePrefix: ['W3.1', 'W3.2', 'W3.3', 'W3.4'] },
    ];

    for (const config of cycleConfigs) {
        // Check if cycle with similar dates already exists
        const existing = cycles.nodes.find(c => {
            const startMatch = c.startsAt && new Date(c.startsAt).toISOString().startsWith(config.start);
            return startMatch;
        });

        let cycleId: string;
        if (existing) {
            cycleId = existing.id;
            console.log(`  ⏭️  Cycle already exists for ${config.start} (ID: ${cycleId})`);
        } else {
            try {
                const result = await client.createCycle({
                    teamId: TEAM_ID,
                    name: config.name,
                    startsAt: new Date(config.start),
                    endsAt: new Date(config.end),
                });
                const cycle = await result.cycle;
                cycleId = cycle!.id;
                console.log(`  ✅ Created cycle "${config.name}" (ID: ${cycleId})`);
            } catch (error: any) {
                console.error(`  ❌ Failed to create cycle "${config.name}": ${error.message}`);
                continue;
            }
        }

        // Assign milestone issues to cycles
        for (const prefix of config.issuePrefix) {
            const issue = milestoneIssues.find(i => i.title.includes(prefix));
            if (issue) {
                try {
                    await client.updateIssue(issue.id, { cycleId });
                    console.log(`    ✅ Assigned ${issue.identifier} to cycle`);
                } catch (error: any) {
                    console.error(`    ❌ Failed to assign ${issue.identifier}: ${error.message}`);
                }
            }
        }
    }

    // ─── 9. Delete test issues ───
    console.log('\n=== 9. Cleaning up test issues ===');
    const testIssues = allIssues.nodes.filter(i => 
        i.title === 'Medium/High severity' || 
        i.title.includes('Test Issue') ||
        i.title.includes('Pipeline Verification')
    );
    for (const issue of testIssues) {
        try {
            await client.deleteIssue(issue.id);
            console.log(`  ✅ Deleted ${issue.identifier}: "${issue.title}"`);
        } catch (error: any) {
            // Try archiving instead
            try {
                await client.updateIssue(issue.id, { trashed: true });
                console.log(`  ✅ Trashed ${issue.identifier}: "${issue.title}"`);
            } catch (error2: any) {
                console.error(`  ❌ Failed to delete/trash ${issue.identifier}: ${error2.message}`);
            }
        }
    }

    console.log('\n=== DONE ===');
    console.log('Linear board restructuring complete.');
}

restructure().catch(console.error);
