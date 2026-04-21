# Errors

> Command failures and integration errors captured during development.
> Managed by the `self-improving-agent` openclaw skill.

## Format

```
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

---

<!-- Add new entries below this line -->
