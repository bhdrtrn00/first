# Self-Improvement Skill

> Capture learnings, errors, and corrections to enable continuous improvement across sessions.

## Purpose

This skill activates whenever something goes wrong, a correction is made, a gap is discovered, or a better approach is found. It logs structured entries into `.learnings/` so patterns can be detected and promoted to permanent project memory.

## Trigger Conditions

Log an entry when:
1. A command or operation fails unexpectedly
2. The user corrects the agent ("No, that's wrong…", "Actually…")
3. The user requests a capability that doesn't exist yet
4. An external API or tool returns an unexpected result
5. The agent's knowledge proves outdated or incorrect
6. A better approach is discovered for a recurring task

## Initialization

On first use, create the learnings directory:

```bash
mkdir -p .learnings
```

This creates the home for three log files:
- `.learnings/LEARNINGS.md` — corrections, insights, knowledge gaps, best practices
- `.learnings/ERRORS.md` — command failures and integration errors
- `.learnings/FEATURE_REQUESTS.md` — user-requested capabilities

## Entry Format

### LEARNINGS.md entry

```markdown
### LRN-YYYYMMDD-XXX: <short title>
- **Priority**: critical | high | medium | low
- **Status**: pending | in_progress | resolved | promoted
- **Area**: frontend | backend | infra | tests | docs | config
- **Context**: <what was happening>
- **Discovery**: <what was learned>
- **Fix / Action**: <concrete change to make>
- **Related files**: <file paths if applicable>
- **Tags**: #tag1 #tag2
```

### ERRORS.md entry

```markdown
### ERR-YYYYMMDD-XXX: <short title>
- **Priority**: critical | high | medium | low
- **Status**: pending | resolved
- **Area**: frontend | backend | infra | tests | docs | config
- **Command / operation**: `<exact command or call>`
- **Error message**: `<exact error>`
- **Root cause**: <explanation>
- **Fix**: <what resolved it>
- **Recurrence count**: 1
```

### FEATURE_REQUESTS.md entry

```markdown
### FEAT-YYYYMMDD-XXX: <short title>
- **Priority**: critical | high | medium | low
- **Status**: pending | in_progress | implemented | wont_fix
- **Area**: frontend | backend | infra | tests | docs | config
- **Request**: <what the user asked for>
- **Use case**: <why it is needed>
- **Notes**: <implementation ideas or blockers>
```

## Logging Principles

- **Log immediately** — capture while context is fresh
- **Be specific** — vague entries are useless; include exact commands, messages, and file paths
- **Cross-reference** — link related LRN/ERR/FEAT IDs
- **Increment counters** — bump `Recurrence count` when the same error recurs

## Promotion Workflow

When a learning becomes broadly applicable (recurrence ≥ 3, or high/critical priority), promote it to permanent project memory:

| Target file | What belongs there |
|---|---|
| `CLAUDE.md` | Project facts, conventions, gotchas |
| `AGENTS.md` | Workflow patterns, automation rules |
| `.github/copilot-instructions.md` | Copilot-specific context |
| `SOUL.md` / `TOOLS.md` | OpenClaw workspace guidance |

Steps to promote:
1. Copy the distilled insight (not the raw log entry) into the target file
2. Update the log entry status to `promoted`
3. Add a `Promoted to: <file>` field on the entry

## Pattern Detection

Review `.learnings/` before major tasks. If the same root cause appears across multiple entries, that is a pattern worth addressing structurally (refactor, add a lint rule, update docs) rather than logging again.

## Hook Integration (optional)

Add to `.openclaw/hooks.json` or your agent's hook config to get automatic reminders:

```json
{
  "UserPromptSubmit": "echo '💡 Check .learnings/ for relevant prior context before starting.'",
  "PostToolUse": "scripts/error-detector.sh"
}
```

## Skill Extraction

When a learning is high-value enough to share across projects, extract it as a reusable skill:
1. Write a `SKILL.md` describing the pattern and fix
2. Publish to ClawHub with `clawhub publish`
3. Reference the published skill slug in this project's `.clawhub/lock.json`

---

*Installed via `clawdhub install self-improving-agent` — source: [clawhub.ai/pskoett/self-improving-agent](https://clawhub.ai/pskoett/self-improving-agent)*
