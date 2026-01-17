# Focus Folder Extension - Complete Changelog

**Extension Name:** Focus Folder
**Publisher:** local
**Current Version:** 1.3.0
**Install Location:** `~/.vscode/extensions/local.focusfolder-1.0.0/`

---

## What This Extension Does

Focus Folder adds a **"FOCUSED" panel** to the VS Code Explorer sidebar. It lets you:
- Right-click any folder → "Focus on Folder" → see its contents in a dedicated panel
- Focus on **multiple folders** simultaneously
- Get full file operations (create, rename, delete, cut/copy/paste)
- Use keyboard shortcuts while the panel is focused
- Persist focus state across VS Code sessions

**Why it exists:** The built-in Explorer can get cluttered in large repos. This extension lets you pin specific folders for quick access without losing your place in the main tree.

---

## Architecture

```
~/.vscode/extensions/local.focusfolder-1.0.0/
├── package.json                        # Extension manifest (commands, menus, keybindings)
├── out/
│   ├── extension.js                    # Activation, command registration, FileSystemWatchers
│   └── provider/
│       └── FocusFolderProvider.js      # TreeDataProvider (the core logic)
│   └── command/
│       ├── index.js                    # Command exports
│       ├── copyPath.js                 # Copy Path / Copy Relative Path
│       └── bridges.js                  # Bridges to FT and Folder Customization extensions
```

### Key Components

| File | Purpose |
|------|---------|
| `FocusFolderProvider.js` | TreeDataProvider that reads filesystem, manages focus state |
| `extension.js` | Registers commands, sets up FileSystemWatchers, handles persistence |
| `package.json` | Declares everything VS Code needs: commands, menus, keybindings, config |

### Data Model

```javascript
// FocusFolderProvider state
focusPaths: string[]  // Array of absolute paths to focused folders

// Resource (TreeItem) properties
{
  label: string,           // Display name (basename of path)
  value: string,           // Absolute filesystem path
  resourceUri: vscode.Uri, // For icons and file type detection
  contextValue: string,    // 'focusRoot' | 'resource.dir' | 'resource'
  collapsibleState: enum,  // Expanded/Collapsed/None
  command?: object         // vscode.open for files
}
```

### Context Values (for menu routing)

| contextValue | What it is | Menu items shown |
|--------------|------------|------------------|
| `focusRoot` | Top-level focused folder | Remove from Focus, inline X button |
| `resource.dir` | Subfolder within focused tree | New File, New Folder, Paste, Folder Customization |
| `resource` | File | Cut, Copy, Rename, Delete |

---

## Version History

### v1.3.1 (2026-01-16)
**Bug fixes for context menus, hotkeys, and FT extension integration**

This patch fixes critical issues where context menu items weren't appearing for root focused folders, the Copy Path hotkey wasn't working, and Create Templated Folder was creating files in the wrong location.

**Hotkey Change**: Copy Path changed from `Alt+Cmd+C` to `Cmd+Shift+C`

#### Bug Fixes

**Context Menu Items Missing for focusRoot (BUG-1)**
- Fixed `when` clauses for 8 menu items that only matched `resource` but not `focusRoot`
- Root focused folders now show: Cut, Copy, Move to Folder, Copy Path, Copy Relative Path, Rename, Move to Trash
- Changed regex from `viewItem =~ /resource/` to `viewItem =~ /resource|focusRoot/`

**Copy Path Hotkey Not Working (BUG-2)**
- Fixed `copyPath` and `copyRelativePath` commands to use `treeView.selection` as fallback
- When invoked via hotkey, VS Code doesn't pass `resource` parameter
- Commands now check: `selectedItems` → `resource` → `treeView.selection`
- **Root cause #2**: Keybinding `when` clause had quotes around view ID (`'focusFolder'` → `focusFolder`)
- VS Code context keys don't use quotes - GitLens confirmed pattern: `focusedView == viewId`

**Create Templated Folder Creating Files in Wrong Location (BUG-3)**
- Root cause: FT extension receives string path and prepends workspace root, causing doubled paths
- Example: `/workspace/workspace/actual/path` instead of `/workspace/actual/path`
- Fix: Pass `vscode.Uri.file(resource.value)` instead of raw string `resource.value`
- FT extension handles Uri objects correctly without path manipulation

#### Files Modified

| File | Changes |
|------|---------|
| `package.json` | Updated `when` clauses for 8 menu items to include `focusRoot` |
| `out/extension.js` | Fixed copyPath/copyRelativePath fallback, fixed createTemplatedFolder to pass Uri |

#### Technical Details

**Menu When Clause Fix:**
```json
// Before (missing focusRoot)
"when": "view == focusFolder && viewItem =~ /resource/"

// After (includes focusRoot)
"when": "view == focusFolder && viewItem =~ /resource|focusRoot/"
```

**Copy Path Hotkey Fix:**
```javascript
// Before (empty array when hotkey invoked)
const items = selectedItems?.length > 0 ? selectedItems : (resource ? [resource] : []);

// After (falls back to treeView.selection)
const items = selectedItems?.length > 0 ? selectedItems : (resource ? [resource] : treeView.selection);
```

**FT Extension Bridge Fix:**
```javascript
// Before (string path - FT prepends workspace root)
vscode.commands.executeCommand('FT.createFolderStructure', resource.value);

// After (Uri object - FT uses fsPath correctly)
vscode.commands.executeCommand('FT.createFolderStructure', vscode.Uri.file(resource.value));
```

#### Learnings

1. **VS Code commands invoked via hotkey don't receive context parameters** - When a command is triggered by keyboard shortcut instead of context menu, the `resource` and `selectedItems` parameters are undefined. Always implement `treeView.selection` as a fallback for keyboard-invoked commands.

2. **FT (Fast Folder Structure) extension expects Uri objects, not strings** - When passing a string path, FT's `ts` function treats it as a relative path and concatenates it with the workspace root: `return F.Uri.parse(e+"/"+t)`. This causes doubled paths. Pass `vscode.Uri.file(path)` to avoid this.

3. **Menu `when` clause regex must explicitly include all contextValues** - The regex `/resource/` matches `resource` and `resource.dir` but NOT `focusRoot`. Each distinct contextValue that should show a menu item must be explicitly included in the regex pattern.

---

### v1.3.0 (2026-01-16)
**Major feature release: Multi-select, Drag-and-Drop, and bug fixes**

This release brings the Focus Folder extension to feature parity with the Favorites extension by adding multi-select and drag-and-drop support, plus critical bug fixes for keyboard shortcuts and context menus.

#### New Features

**Multi-Select Support (FR-5)**
- Added `canSelectMany: true` to TreeView options
- Cmd+click (Mac) / Ctrl+click (Windows/Linux) now selects multiple items
- Copy, Cut, Delete operations work on all selected items
- Clipboard now stores multiple paths (`clipboardPaths` array)

**Drag-and-Drop Support (FR-6)**
- Implemented `TreeDragAndDropController` interface in FocusFolderProvider
- Added `dropMimeTypes` and `dragMimeTypes` arrays: `['application/vnd.code.tree.focusFolder']`
- Implemented `handleDrag()` method to serialize dragged items
- Implemented `handleDrop()` method to move items to target folder
- Added `dragAndDropController: provider` to TreeView options
- Includes safety checks: prevents dropping folder into itself or its children

**Panel Icon (FR-3)**
- Added `$(target)` icon to FOCUSED panel in Explorer sidebar
- Panel now visually distinct from other Explorer panels

#### Bug Fixes

**Keybinding When Clause Fix (FR-1)**
- Changed all keybinding `when` clauses from `listFocus && view == focusFolder` to `focusedView == 'focusFolder'`
- Keyboard shortcuts (Cmd+C, Cmd+X, Cmd+V, etc.) now work correctly when FOCUSED panel has focus
- Matches the pattern used by the working Favorites extension

**Focus on Subfolder Fix (FR-2)**
- Updated `focusOnFolder` command handler to accept both:
  - `uri.fsPath` (from Explorer context menu)
  - `resource.value` (from Focus Folder context menu)
- Right-clicking a subfolder → "Focus on Folder" now works correctly

**Paste Command Keyboard Support**
- Fixed paste command to use `treeView.selection` fallback when invoked via keyboard
- Previously, Cmd+V did nothing because no `resource` was passed
- Now detects selected folder and pastes there

**Reveal in Side Bar for Focused Roots**
- Fixed menu condition regex from `/resource/` to `/resource|focusRoot/`
- "Reveal in Side Bar" and "Reveal in Finder" now appear for focused root folders

#### Files Modified

| File | Changes |
|------|---------|
| `package.json` | Keybinding when clauses, panel icon, menu conditions, version bump |
| `out/extension.js` | Multi-select handlers, paste fallback, dragAndDropController, focusOnFolder dual handler |
| `out/provider/FocusFolderProvider.js` | MIME types, handleDrag(), handleDrop() methods |

#### Technical Details

**TreeView Options (after v1.3.0):**
```javascript
const treeView = vscode.window.createTreeView('focusFolder', {
    treeDataProvider: provider,
    showCollapseAll: true,
    canSelectMany: true,           // NEW
    dragAndDropController: provider // NEW
});
```

**Keybinding Pattern (before → after):**
```json
// Before (v1.2.1) - NOT WORKING
"when": "listFocus && view == focusFolder"

// After (v1.3.0) - WORKING
"when": "focusedView == 'focusFolder'"
```

**Drag-and-Drop MIME Type:**
```javascript
this.dropMimeTypes = ['application/vnd.code.tree.focusFolder'];
this.dragMimeTypes = ['application/vnd.code.tree.focusFolder'];
```

#### Learnings

1. **`focusedView` is the correct context key for tree views** - The pattern `focusedView == 'viewId'` is what VS Code sets when a tree view has focus. The previous pattern `listFocus && view == viewId` doesn't work reliably. The Favorites extension uses `focusedView` and works correctly.

2. **TreeView keyboard commands need selection fallback** - When a command is invoked via keyboard shortcut, VS Code doesn't pass the `resource` parameter. Commands must check `treeView.selection` as a fallback to get the currently selected items.

3. **Menu condition regex must explicitly include all contextValues** - The regex `/resource/` matches `resource` and `resource.dir` but NOT `focusRoot`. Use `/resource|focusRoot/` to match all item types.

4. **TreeDragAndDropController is implemented by the provider itself** - Rather than creating a separate controller class, the TreeDataProvider implements the drag-and-drop interface directly and passes itself as `dragAndDropController`.

---

### v1.2.1 (2026-01-16)
**Fixed keyboard shortcuts and added refresh button**

Changes:
- Added `focusFolder.refresh` command with `$(refresh)` icon in panel header
- Fixed keybinding `when` clauses: changed `focusedView == 'focusFolder'` to `listFocus && view == focusFolder`

Files modified:
- `package.json` - Added refresh command, fixed keybinding when clauses

### v1.2.0 (2026-01-16)
**Full context menu parity with Favorites extension**

New commands:
- `focusFolder.newFile` - Create new file in folder
- `focusFolder.newFolder` - Create new folder
- `focusFolder.cut` - Cut file/folder to internal clipboard
- `focusFolder.copy` - Copy file/folder to internal clipboard
- `focusFolder.paste` - Paste from internal clipboard
- `focusFolder.rename` - Rename file/folder
- `focusFolder.delete` - Move to Trash (with confirmation)
- `focusFolder.moveToFolder` - Move to any folder via picker
- `focusFolder.fcApplyColor` - Apply color (Folder Customization bridge)
- `focusFolder.fcApplyIcon` - Apply icon (Folder Customization bridge)
- `focusFolder.fcReset` - Reset customization (Folder Customization bridge)

New keybindings:
- `Cmd+C` / `Ctrl+C` - Copy
- `Cmd+X` / `Ctrl+X` - Cut
- `Cmd+V` / `Ctrl+V` - Paste
- `Enter` / `F2` - Rename
- `Cmd+Backspace` / `Delete` - Move to Trash
- `Cmd+Shift+R` / `Ctrl+Shift+R` - Reveal in Finder
- `Alt+Cmd+C` / `Alt+Ctrl+C` - Copy Path

New menu structure:
```
Right-click menu groups:
├── 1_navigation     → Reveal in Side Bar, Reveal in Finder
├── 2_templated      → Create New Templated Folder (FT bridge)
├── 3_workspace      → New File..., New Folder...
├── 5_cutcopypaste   → Cut, Copy, Paste, Move to Folder
├── 6_copypath       → Copy Path, Copy Relative Path
├── 7_modification   → Rename..., Move to Trash
├── 8_foldercustom   → Folder Customization submenu
└── 9_focus          → Focus on Folder / Remove from Focus
```

Implementation details:
- Internal clipboard using `clipboardPath` and `clipboardOperation` variables
- Cut moves file on paste, Copy duplicates file on paste
- Delete uses `vscode.workspace.fs.delete()` with `useTrash: true`

Files modified:
- `package.json` - All new commands, menus, keybindings, submenu
- `extension.js` - All new command handlers

### v1.1.0 (2026-01-16)
**Multi-folder support with inline remove buttons**

Breaking changes:
- Changed from single `focusPath: string` to `focusPaths: string[]`
- Configuration key changed from `focusFolder.currentPath` to `focusFolder.focusPaths`

New features:
- Can focus on multiple folders simultaneously
- Each focused folder shows an inline X button to remove it
- "Clear All Focus" button clears everything at once

New commands:
- `focusFolder.removeFocusedFolder` - Remove single folder from focus

New methods in FocusFolderProvider:
```javascript
addFocus(folderPath)      // Add to focusPaths array
removeFocus(folderPath)   // Remove from focusPaths array
clearAllFocus()           // Clear entire array
setFocusPaths(paths)      // Set all paths (for restoration)
getFocusPaths()           // Get current paths
```

Menu additions:
- Inline X button on `focusRoot` items
- "Remove from Focus" in context menu for `focusRoot`

Files modified:
- `package.json` - New command, inline menu, config schema change
- `FocusFolderProvider.js` - Array-based state management
- `extension.js` - Updated to use new array methods

### v1.0.0 (2026-01-16)
**Initial release - MVP**

Core features:
- FOCUSED panel in Explorer sidebar
- Right-click folder → "Focus on Folder"
- Navigate within focused view (expand/collapse, open files)
- Clear Focus button in panel header
- Persistence across VS Code sessions
- FileSystemWatcher for live updates
- Copy Path / Copy Relative Path
- Reveal in Side Bar / Reveal in Finder
- Bridge to FT extension (Create Templated Folder)

Commands:
- `focusFolder.focusOnFolder`
- `focusFolder.clearFocus`
- `focusFolder.copyPath`
- `focusFolder.copyRelativePath`
- `focusFolder.revealInSidebar`
- `focusFolder.revealInFinder`
- `focusFolder.createTemplatedFolder`

Files created:
- `package.json`
- `out/extension.js`
- `out/provider/FocusFolderProvider.js`
- `out/command/copyPath.js`
- `out/command/bridges.js`
- `out/command/index.js`

---

## How to Modify

### Adding a New Command

1. **Register in package.json** under `contributes.commands`:
```json
{"command": "focusFolder.myCommand", "title": "My Command", "category": "Focus Folder"}
```

2. **Add to menu** in `contributes.menus.view/item/context`:
```json
{"command": "focusFolder.myCommand", "when": "view == focusFolder && viewItem =~ /resource/", "group": "7_modification@3"}
```

3. **Hide from command palette** (optional) in `contributes.menus.commandPalette`:
```json
{"command": "focusFolder.myCommand", "when": "false"}
```

4. **Implement handler** in `extension.js`:
```javascript
vscode.commands.registerCommand('focusFolder.myCommand', async (resource) => {
    if (resource?.value) {
        // Do something with resource.value (the file path)
    }
})
```

### Adding a Keybinding

In `package.json` under `contributes.keybindings`:
```json
{
  "command": "focusFolder.myCommand",
  "key": "cmd+shift+m",
  "mac": "cmd+shift+m",
  "win": "ctrl+shift+m",
  "linux": "ctrl+shift+m",
  "when": "listFocus && view == focusFolder"
}
```

**Important:** Use `listFocus && view == focusFolder` for the `when` clause, not `focusedView`.

### Reloading After Changes

Since this extension is installed directly (not via npm/build), changes require:
```bash
# 1. Edit files directly in ~/.vscode/extensions/local.focusfolder-1.0.0/
# 2. Reload VS Code window (Cmd+Shift+P → "Developer: Reload Window")
```

---

## Backups

All extension files are backed up at:
```
ACTION-LOG/26_01_15_2325- Focus Folder Extension/backup/
├── extension.js
├── package.json
└── provider/
    └── FocusFolderProvider.js
```

---

## Known Issues / Future Ideas

### Known Issues
- None currently identified

### Potential Enhancements
- [ ] Drag and drop support for reordering focused folders
- [ ] Drag and drop files between folders
- [ ] Search within focused view
- [ ] Custom icons per focused folder
- [ ] Quick switch between focus "presets"
- [ ] Show file count badge on focused folders

---

## Source Documents

Original spec and planning docs:
- `ACTION-LOG/26_01_15_2325- Focus Folder Extension/plan.md`
- `ACTION-LOG/26_01_15_2325- Focus Folder Extension/spec.md`
- `ACTION-LOG/26_01_15_2325- Focus Folder Extension/tasks.md`
- `ACTION-LOG/26_01_15_2325- Focus Folder Extension/data-model.md`
- `ACTION-LOG/26_01_15_2325- Focus Folder Extension/contracts/package-contributions.json`

---

## Quick Reference

### Install Location
```
~/.vscode/extensions/local.focusfolder-1.0.0/
```

### Configuration Key
```json
"focusFolder.focusPaths": ["path1", "path2"]
```

### All Commands
| Command | Description |
|---------|-------------|
| `focusFolder.focusOnFolder` | Add folder to focus |
| `focusFolder.removeFocusedFolder` | Remove folder from focus |
| `focusFolder.clearFocus` | Clear all focused folders |
| `focusFolder.refresh` | Refresh tree view |
| `focusFolder.copyPath` | Copy absolute path |
| `focusFolder.copyRelativePath` | Copy workspace-relative path |
| `focusFolder.revealInSidebar` | Show in Explorer |
| `focusFolder.revealInFinder` | Show in Finder/File Explorer |
| `focusFolder.newFile` | Create new file |
| `focusFolder.newFolder` | Create new folder |
| `focusFolder.cut` | Cut to clipboard |
| `focusFolder.copy` | Copy to clipboard |
| `focusFolder.paste` | Paste from clipboard |
| `focusFolder.rename` | Rename file/folder |
| `focusFolder.delete` | Move to Trash |
| `focusFolder.moveToFolder` | Move to chosen folder |
| `focusFolder.createTemplatedFolder` | Create from FT template |
| `focusFolder.fcApplyColor` | Apply folder color |
| `focusFolder.fcApplyIcon` | Apply folder icon |
| `focusFolder.fcReset` | Reset folder customization |

### All Keybindings (when panel focused)
| Key (Mac) | Key (Win/Linux) | Command |
|-----------|-----------------|---------|
| Cmd+C | Ctrl+C | Copy |
| Cmd+X | Ctrl+X | Cut |
| Cmd+V | Ctrl+V | Paste |
| Enter | F2 | Rename |
| Cmd+Backspace | Delete | Move to Trash |
| Cmd+Shift+R | Ctrl+Shift+R | Reveal in Finder |
| Alt+Cmd+C | Alt+Ctrl+C | Copy Path |
