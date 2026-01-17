# Changelog Template

> **Instructions for LLMs:** This template captures the FULL context of a VS Code settings change so future sessions can understand what happened, why, and what was learned. Be detailed - this is the single source of truth.

---
date: YYYY-MM-DD
status: investigating | implementing | complete
files_affected: [settings.json, keybindings.json]
---

# [Title of Change]

## Goal

What are we trying to accomplish? Include success criteria as checkboxes.

**Success Criteria:**
- [ ] Criteria 1
- [ ] Criteria 2

---

## Problem Statement

What's broken or needs improvement? Include:
- Symptoms observed
- How it was discovered
- Impact on the user

---

## Root Cause Analysis

What's causing the issue? Include:
- The technical explanation
- Links to relevant VS Code documentation
- Evidence that confirms this is the root cause

---

## Solution Options Considered

List alternatives you evaluated:

### Option 1: [Name]
- How it works
- Pros/cons
- Why chosen or rejected

### Option 2: [Name]
- How it works
- Pros/cons
- Why chosen or rejected

---

## Implementation

### Changes Made
| File | Change |
|------|--------|
| `~/Library/Application Support/Code/User/settings.json` | Description |

### Setting Details
```json
"setting.name": "value"
```

---

## Learnings

> **IMPORTANT:** This section is searchable by future LLMs. Write learnings as standalone insights that make sense without reading the full document.

Format each learning as:
1. **[Concise title]** - Detailed explanation with rationale. Include WHY this matters, not just WHAT happened. Reference specific evidence from this changelog.

Example:
1. **`sendKeybindingsToShell` enables terminal shortcuts** - By default, VS Code intercepts keyboard shortcuts before they reach the integrated terminal. Setting `terminal.integrated.sendKeybindingsToShell: true` passes shortcuts to the shell instead. See [VS Code Terminal Docs](https://code.visualstudio.com/docs/terminal/basics).

---

## Related Documentation

- Link to cheat sheets, guides, or external docs created
- VS Code documentation links

---

## Open Questions

- [ ] Unresolved issues for future investigation
