# VS Code Settings Changelog SOP

## Purpose

Document VS Code configuration changes with full context, rationale, and reusable learnings—so future Claude sessions can understand what happened, why, and avoid repeating mistakes.

---

## When to Use This SOP

**Use when:**
- Any VS Code settings file is modified (`settings.json`, `keybindings.json`)
- Extensions are added/removed/configured
- Workspace settings change
- A configuration bug is fixed
- Keybindings are customized

**Do NOT use when:**
- Changes are to project code files
- Minor formatting/comment changes only

---

## Prerequisites

- Access to VS Code settings
- Understanding of what changed and why
- Template location: `.vscode/change-log/_TEMPLATE.md`
- Output location: `.vscode/change-log/YYYY-MM-DD-description.md`

---

## Step-by-Step Process

### Step 1: Create the Changelog File

**File naming:** `YYYY-MM-DD-description.md`
- Use the date the change was made
- Description should be kebab-case, concise (2-4 words)
- Examples: `2026-01-04-terminal-hotkeys-passthrough.md`, `2026-01-15-add-custom-theme.md`

**Expected outcome:** Empty file created at `.vscode/change-log/YYYY-MM-DD-description.md`

### Step 2: Copy Template Structure

Copy the structure from `.vscode/change-log/_TEMPLATE.md`. Do not skip sections—each serves a purpose for future Claude sessions.

**Expected outcome:** File has all section headers from template

### Step 3: Fill Frontmatter

```yaml
---
date: YYYY-MM-DD
status: investigating | implementing | complete
files_affected: [settings.json, keybindings.json]
---
```

**Expected outcome:** Frontmatter accurately reflects current state

### Step 4: Document the Goal

Write clear success criteria as checkboxes:
- What does "done" look like?
- How will we know it worked?

**Example:**
```markdown
## Goal
Enable terminal readline shortcuts to work in VS Code's integrated terminal.

**Success Criteria:**
- [x] Ctrl+Shift+- (undo) works in terminal
- [x] Other readline shortcuts pass through
```

**Expected outcome:** Anyone can verify if the goal was achieved by checking boxes

### Step 5: Document the Problem

Include:
- **Symptoms observed** (what user/system noticed)
- **How it was discovered** (user tried X and it didn't work)
- **Impact** (what doesn't work because of this)

**Expected outcome:** Problem is clear enough to reproduce or verify

### Step 6: Document Root Cause Analysis

Explain:
- The technical reason (what's actually happening)
- Link to documentation if applicable (VS Code docs, etc.)
- Evidence that confirms this is THE cause

**Expected outcome:** Root cause is provable, not speculative

### Step 7: Document Solution Options Considered

List alternatives evaluated, even if you picked the obvious one:

| Option | How It Works | Pros | Cons | Chosen? |
|--------|-------------|------|------|---------|
| Option 1 | ... | ... | ... | YES |
| Option 2 | ... | ... | ... | NO - reason |

**Why document rejected options:** Future Claude may face similar choice. Knowing why Option 2 was rejected prevents re-evaluation.

**Expected outcome:** Decision rationale is preserved

### Step 8: Document Implementation

| File | Change |
|------|--------|
| `path/to/file` | What was changed |

Include:
- Exact setting name and value
- Location in the file (near what other settings)
- Any follow-up actions needed

**Expected outcome:** Changes are traceable and reproducible

### Step 9: Write Learnings Section

> **CRITICAL:** This is the most important section for future Claude sessions.

**The VS Code Learning Test:**
Before adding a learning, ask:
> Is this about how VS Code works, or is it just how we debugged this problem?

| Include | Exclude |
|---------|---------|
| `sendKeybindingsToShell` passes shortcuts to terminal | We checked the settings |
| Keybindings.json overrides default shortcuts | The file was in the wrong folder |
| `macOptionIsMeta` enables Alt shortcuts on Mac | We tried several things before it worked |

**Format each learning as:**
```markdown
1. **[Concise technical title]** - Detailed explanation with:
   - WHY this matters (impact/consequence)
   - How we discovered it (evidence from this changelog)
   - Link to docs if applicable
```

**Expected outcome:** Learnings are searchable and each stands alone as VS Code knowledge

### Step 10: List Open Questions

Unresolved items that need future investigation:
```markdown
## Open Questions
- [ ] Should we add more keybindings?
- [ ] Does this affect remote SSH terminals?
```

**Expected outcome:** Nothing falls through the cracks

---

## Decision Points

| Situation | Action |
|-----------|--------|
| Change is trivial (1 setting) | Still create changelog, but abbreviated (Goal + Implementation + Learnings only) |
| Multiple files affected | List all in frontmatter, document each in Implementation |
| Change reverts previous change | Reference original changelog, explain why |

---

## Quality Checks

Before marking changelog complete:

**Completeness:**
- [ ] All sections from template are addressed (or explicitly marked N/A)
- [ ] Exact setting names and values are included
- [ ] File paths are specified

**Learnings Section:**
- [ ] Each learning passes the "VS Code specific" test
- [ ] Each learning includes WHY, not just WHAT
- [ ] Each learning could stand alone without reading full changelog
- [ ] No generic debugging tips (those go in working log, not learnings)

**Future Claude Test:**
- [ ] Could a fresh Claude session understand what happened from this changelog alone?
- [ ] Is the decision rationale clear?

---

## Folder Structure

```
.vscode/
└── change-log/
    ├── vscode-changelog-sop.md       # This file
    ├── _TEMPLATE.md                   # Template to copy
    └── YYYY-MM-DD-description.md      # Individual changelogs
```

---

## VS Code Settings File Locations

| File | Path (macOS) | Purpose |
|------|--------------|---------|
| User settings | `~/Library/Application Support/Code/User/settings.json` | Global settings |
| User keybindings | `~/Library/Application Support/Code/User/keybindings.json` | Custom shortcuts |
| Workspace settings | `.vscode/settings.json` | Project-specific settings |

---

## How Future Claude Finds Learnings

To search past learnings:
```bash
grep -A 20 "## Learnings" .vscode/change-log/*.md
```

To find changelogs about specific topics:
```bash
grep -l "terminal" .vscode/change-log/*.md
```

---

## Changes
- 2026-01-04: Adapted from GitHub Actions SOP for VS Code settings
