/**
 * cli.ts — Interactive REPL for GlobalForward Freight Co. Agent System
 *
 * Usage:
 *   cp .env.example .env  # add ANTHROPIC_API_KEY
 *   node --env-file=.env --import tsx/esm src/cli.ts
 *
 * Commands:
 *   Type any freight request and press Enter
 *   :agents   — list all 24 agents
 *   :help     — show example requests
 *   :clear    — clear the screen
 *   exit / quit / Ctrl+C  — quit
 */

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Orchestrator } from './orchestrator.js';
import { buildAgentRegistry } from './agents/index.js';
import { messageBus } from './messageBus.js';
import type { MessagePriority } from './types.js';

// ── ANSI colour helpers ───────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  white:  '\x1b[37m',
};

function paint(color: string, text: string) { return `${color}${text}${c.reset}`; }

// ── Agent roster for :agents command ─────────────────────────────────────────
const AGENT_ROSTER = [
  { dept: 'Executive',        agents: ['CEO', 'CFO', 'COO'] },
  { dept: 'Operations',       agents: ['Air Freight Manager', 'Ocean Freight Manager', 'Ground Transport Manager', 'Dispatch Coordinator'] },
  { dept: 'Customs',          agents: ['Customs Manager', 'Trade Compliance Officer', 'International Trade Specialist'] },
  { dept: 'Sales',            agents: ['Sales Director', 'Business Development Manager', 'Account Manager'] },
  { dept: 'Customer Service', agents: ['Customer Service Manager', 'Shipment Tracking Specialist'] },
  { dept: 'Documentation',    agents: ['Documentation Manager', 'Bill of Lading Specialist'] },
  { dept: 'Warehouse',        agents: ['Warehouse Manager', 'Inventory Control Specialist'] },
  { dept: 'Technology',       agents: ['IT Manager', 'Data Analyst'] },
  { dept: 'Risk & Insurance', agents: ['Risk Manager', 'Cargo Insurance Specialist'] },
];

const EXAMPLE_REQUESTS = [
  'Quote for 3x 40HC containers, Shanghai to Los Angeles, general cargo, FOB terms',
  'What HS code applies to lithium-ion EV batteries imported into the EU from China?',
  'Track shipment AWB 020-12345678 — it was supposed to arrive in London yesterday',
  'I need cargo insurance for $1.8M electronics shipment, Hong Kong to New York by air',
  'We need 200 sqm of temperature-controlled warehouse space in Frankfurt from next Monday',
  'What are the customs requirements to import medical devices into Brazil?',
  'Generate a bill of lading for our shipment from Busan to Rotterdam, container MSCU9876543',
  'Our carrier just cancelled the sailing — what alternatives are there on Shanghai-Rotterdam?',
  'How is our on-time delivery performance this quarter?',
  'What are the IATA DGR requirements for shipping lithium batteries?',
];

function printBanner() {
  console.clear();
  console.log(paint(c.cyan + c.bold,
    '╔══════════════════════════════════════════════════════════╗\n' +
    '║      GlobalForward Freight Co. — Agent System CLI       ║\n' +
    '║         24 Agents  ·  claude-sonnet-4-6                 ║\n' +
    '╚══════════════════════════════════════════════════════════╝'
  ));
  console.log(paint(c.dim, '\n  Type a freight request, or try :agents / :help\n'));
}

function printAgents() {
  console.log(paint(c.bold, '\n  24-Agent Roster:'));
  for (const { dept, agents } of AGENT_ROSTER) {
    console.log(`  ${paint(c.cyan, dept.padEnd(18))} ${paint(c.dim, agents.join('  ·  '))}`);
  }
  console.log();
}

function printHelp() {
  console.log(paint(c.bold, '\n  Example requests:'));
  EXAMPLE_REQUESTS.forEach((ex, i) => {
    console.log(`  ${paint(c.dim, String(i + 1).padStart(2) + '.')} ${ex}`);
  });
  console.log(paint(c.dim, '\n  Commands: :agents  :help  :clear  exit\n'));
}

// Parses an optional !urgent or !high prefix from the user's input
function parsePriority(raw: string): { request: string; priority: MessagePriority } {
  const match = raw.match(/^!(urgent|high|low)\s+/i);
  if (match) {
    return {
      request: raw.slice(match[0].length).trim(),
      priority: match[1].toLowerCase() as MessagePriority,
    };
  }
  return { request: raw.trim(), priority: 'normal' };
}

async function main() {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    console.error(paint(c.red,
      '\n  ERROR: ANTHROPIC_API_KEY is not set.\n' +
      '  Copy .env.example to .env and add your key, then re-run.\n'
    ));
    process.exit(1);
  }

  printBanner();

  const registry = buildAgentRegistry();
  const orchestrator = new Orchestrator(apiKey, registry, {
    maxHandoffDepth: 4,
    handoffTimeoutMs: 60_000,
    enableParallelRouting: false,
  });

  // ── Bus listener: print handoffs inline as they happen ───────────────────
  messageBus.subscribe((event) => {
    if (event.type === 'handoff') {
      const to = (event.payload as { toAgent: string }).toAgent;
      process.stdout.write(
        paint(c.yellow, `  ↗  handoff: ${event.agentId} → ${to}\n`)
      );
    }
  });

  const rl = readline.createInterface({ input, output, terminal: true });

  // Handle Ctrl+C gracefully
  rl.on('SIGINT', () => {
    console.log(paint(c.dim, '\n\n  Goodbye.\n'));
    rl.close();
    process.exit(0);
  });

  // ── Main REPL loop ────────────────────────────────────────────────────────
  while (true) {
    let raw: string;
    try {
      raw = await rl.question(paint(c.bold + c.cyan, 'freight') + paint(c.dim, '> '));
    } catch {
      // Thrown on Ctrl+C / stream close
      break;
    }

    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Built-in commands
    if (trimmed === 'exit' || trimmed === 'quit') {
      console.log(paint(c.dim, '\n  Goodbye.\n'));
      break;
    }
    if (trimmed === ':agents') { printAgents(); continue; }
    if (trimmed === ':help')   { printHelp();   continue; }
    if (trimmed === ':clear')  { printBanner(); continue; }

    const { request, priority } = parsePriority(trimmed);

    if (priority !== 'normal') {
      console.log(paint(c.yellow, `\n  Priority: ${priority.toUpperCase()}`));
    }

    console.log(paint(c.dim, '\n  Routing request...\n'));

    try {
      const responses = await orchestrator.handle(request, {}, priority);

      // Print the final agent's response cleanly
      const last = responses[responses.length - 1];
      if (last) {
        const agentLabel = registry.get(last.agentId)?.title ?? last.agentId;

        console.log(
          '\n' +
          paint(c.green + c.bold, `  [${agentLabel}]`) + '\n' +
          paint(c.dim, '  ' + '─'.repeat(54)) + '\n'
        );

        // Word-wrap and indent the response text
        const lines = last.content.split('\n');
        for (const line of lines) {
          console.log('  ' + line);
        }

        // Show tools used
        if (last.toolCallResults.length > 0) {
          const toolNames = [...new Set(last.toolCallResults.map(t => t.toolName))].join(', ');
          console.log(paint(c.dim, `\n  Tools used: ${toolNames}`));
        }

        // Show how many agents were involved
        if (responses.length > 1) {
          const chain = responses.map(r => registry.get(r.agentId)?.title ?? r.agentId).join(' → ');
          console.log(paint(c.dim, `  Agent chain: ${chain}`));
        }

        // Token usage
        const totalIn  = responses.reduce((s, r) => s + r.usage.inputTokens,  0);
        const totalOut = responses.reduce((s, r) => s + r.usage.outputTokens, 0);
        console.log(paint(c.dim, `  Tokens: ${totalIn} in / ${totalOut} out`));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(paint(c.red, `\n  Error: ${msg}`));
    }

    console.log();
  }

  rl.close();
}

main();
