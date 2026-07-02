import { LinearClient } from '@linear/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY as string });
const TEAM_ID = process.env.LINEAR_TEAM_ID as string;

async function inspect() {
    const team = await client.team(TEAM_ID);
    
    // Check labels
    console.log('=== LABELS ===');
    const labels = await team.labels();
    for (const label of labels.nodes) {
        console.log(`  "${label.name}" (ID: ${label.id})`);
    }

    // Check projects
    console.log('\n=== PROJECTS ===');
    const projects = await client.projects();
    for (const p of projects.nodes) {
        console.log(`  "${p.name}" (ID: ${p.id}, State: ${p.state})`);
    }

    // Check milestones / cycles
    console.log('\n=== CYCLES ===');
    const cycles = await team.cycles();
    for (const c of cycles.nodes) {
        console.log(`  Cycle: ${c.number} | ${c.startsAt} - ${c.endsAt}`);
    }

    // Check workflow states with position
    console.log('\n=== WORKFLOW STATES (with position) ===');
    const states = await team.states();
    for (const s of states.nodes) {
        console.log(`  "${s.name}" | type: ${s.type} | position: ${s.position}`);
    }

    // Check all issues with full detail
    console.log('\n=== ALL ISSUES (detailed) ===');
    const issues = await client.issues({
        filter: { team: { id: { eq: TEAM_ID } } }
    });
    for (const issue of issues.nodes) {
        const state = await issue.state;
        const labelNodes = await issue.labels();
        const labelNames = labelNodes.nodes.map(l => l.name).join(', ') || 'none';
        console.log(`  [${state?.name}] ${issue.identifier}: ${issue.title} | Priority: ${issue.priority} | Labels: ${labelNames}`);
    }
}

inspect().catch(console.error);
