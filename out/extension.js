const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const FocusFolderProvider = require('./provider/FocusFolderProvider');

let fileWatchers = [];
let clipboardPaths = [];  // Array for multi-select support
let clipboardOperation = null; // 'cut' or 'copy'

function saveConfig(provider) {
    const config = vscode.workspace.getConfiguration('focusFolder');
    config.update('focusPaths', provider.getFocusPaths(), vscode.ConfigurationTarget.Workspace);
}

function createWatcher(provider, focusPath, context) {
    const pattern = new vscode.RelativePattern(focusPath, '**/*');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidCreate(() => provider.refresh());
    watcher.onDidDelete((uri) => {
        if (uri.fsPath === focusPath) {
            provider.removeFocus(focusPath);
            saveConfig(provider);
        } else {
            provider.refresh();
        }
    });
    watcher.onDidChange(() => provider.refresh());
    context.subscriptions.push(watcher);
    return watcher;
}

function setupWatchers(provider, context) {
    fileWatchers.forEach(w => w.dispose());
    fileWatchers = [];
    provider.getFocusPaths().forEach(fp => {
        fileWatchers.push(createWatcher(provider, fp, context));
    });
}

function activate(context) {
    const provider = new FocusFolderProvider();
    const treeView = vscode.window.createTreeView('focusFolder', {
        treeDataProvider: provider,
        showCollapseAll: true,
        canSelectMany: true,
        dragAndDropController: provider
    });

    context.subscriptions.push(
        // Focus management
        vscode.commands.registerCommand('focusFolder.focusOnFolder', (uriOrResource) => {
            let folderPath;
            // Handle Explorer context (uri.fsPath)
            if (uriOrResource?.fsPath) {
                folderPath = uriOrResource.fsPath;
            }
            // Handle Focus Folder context (resource.value)
            else if (uriOrResource?.value) {
                folderPath = uriOrResource.value;
            }

            if (folderPath) {
                provider.addFocus(folderPath);
                saveConfig(provider);
                setupWatchers(provider, context);
            }
        }),
        vscode.commands.registerCommand('focusFolder.removeFocusedFolder', (resource) => {
            if (resource?.value) {
                provider.removeFocus(resource.value);
                saveConfig(provider);
                setupWatchers(provider, context);
            }
        }),
        vscode.commands.registerCommand('focusFolder.clearFocus', () => {
            provider.clearAllFocus();
            saveConfig(provider);
            fileWatchers.forEach(w => w.dispose());
            fileWatchers = [];
        }),
        vscode.commands.registerCommand('focusFolder.refresh', () => {
            provider.refresh();
        }),

        // Sort order command
        vscode.commands.registerCommand('focusFolder.sort', async () => {
            const config = vscode.workspace.getConfiguration('focusFolder');
            const current = config.get('sortOrder', 'MANUAL');

            const options = [
                { label: 'A → Z', value: 'ASC', description: current === 'ASC' ? '✓ Current' : '' },
                { label: 'Z → A', value: 'DESC', description: current === 'DESC' ? '✓ Current' : '' },
                { label: 'Latest Modified', value: 'MODIFIED', description: current === 'MODIFIED' ? '✓ Current' : '' },
                { label: 'Manual (Drag Order)', value: 'MANUAL', description: current === 'MANUAL' ? '✓ Current' : '' }
            ];

            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: `Current: ${current} - Select sort order`
            });

            if (selected) {
                await config.update('sortOrder', selected.value, vscode.ConfigurationTarget.Workspace);
                provider.setSortOrder(selected.value);
                vscode.window.showInformationMessage(`Sort: ${selected.label}`);
            }
        }),

        // Move focused folder up
        vscode.commands.registerCommand('focusFolder.moveUp', (resource) => {
            if (!resource || resource.contextValue !== 'focusRoot') return;

            const paths = provider.getFocusPaths();
            const currentIndex = paths.indexOf(resource.value);

            if (currentIndex <= 0) return; // Already at top or not found

            // Swap with previous
            [paths[currentIndex], paths[currentIndex - 1]] = [paths[currentIndex - 1], paths[currentIndex]];

            provider.setFocusPaths(paths);
            saveConfig(provider);
        }),

        // Move focused folder down
        vscode.commands.registerCommand('focusFolder.moveDown', (resource) => {
            if (!resource || resource.contextValue !== 'focusRoot') return;

            const paths = provider.getFocusPaths();
            const currentIndex = paths.indexOf(resource.value);

            if (currentIndex < 0 || currentIndex >= paths.length - 1) return; // Not found or already at bottom

            // Swap with next
            [paths[currentIndex], paths[currentIndex + 1]] = [paths[currentIndex + 1], paths[currentIndex]];

            provider.setFocusPaths(paths);
            saveConfig(provider);
        }),

        // Navigation
        vscode.commands.registerCommand('focusFolder.revealInSidebar', (resource) => {
            if (resource?.resourceUri) vscode.commands.executeCommand('revealInExplorer', resource.resourceUri);
        }),
        vscode.commands.registerCommand('focusFolder.revealInFinder', (resource) => {
            if (resource?.resourceUri) vscode.commands.executeCommand('revealFileInOS', resource.resourceUri);
        }),

        // Copy paths (multi-select support)
        vscode.commands.registerCommand('focusFolder.copyPath', (resource, selectedItems) => {
            // Use selectedItems if multi-select, otherwise single resource, fallback to treeView.selection for hotkey
            const items = selectedItems?.length > 0 ? selectedItems : (resource ? [resource] : treeView.selection);

            // Extract paths, filtering out items without value
            const paths = items
                .map(r => r?.value)
                .filter(Boolean);

            if (paths.length === 0) {
                return; // No valid paths
            }

            // Single item: no trailing newline (backward compatible)
            // Multiple items: newline-separated
            const clipboardText = paths.length === 1 ? paths[0] : paths.join('\n');

            vscode.env.clipboard.writeText(clipboardText);

            // Dynamic message
            const message = paths.length === 1
                ? 'Path copied'
                : `${paths.length} paths copied`;
            vscode.window.setStatusBarMessage(`✅ ${message}`, 2000);
        }),
        vscode.commands.registerCommand('focusFolder.copyRelativePath', (resource, selectedItems) => {
            // Use selectedItems if multi-select, otherwise single resource, fallback to treeView.selection for hotkey
            const items = selectedItems?.length > 0 ? selectedItems : (resource ? [resource] : treeView.selection);
            const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

            // Extract paths and convert to relative
            const paths = items
                .map(r => r?.value)
                .filter(Boolean)
                .map(itemPath => {
                    return root && itemPath.startsWith(root)
                        ? itemPath.replace(root + '/', '')
                        : itemPath;
                });

            if (paths.length === 0) {
                return; // No valid paths
            }

            // Single item: no trailing newline (backward compatible)
            // Multiple items: newline-separated
            const clipboardText = paths.length === 1 ? paths[0] : paths.join('\n');

            vscode.env.clipboard.writeText(clipboardText);

            // Dynamic message
            const message = paths.length === 1
                ? 'Relative path copied'
                : `${paths.length} relative paths copied`;
            vscode.window.setStatusBarMessage(`✅ ${message}`, 2000);
        }),

        // File operations
        vscode.commands.registerCommand('focusFolder.newFile', async (resource) => {
            const targetDir = resource?.value;
            if (targetDir) {
                const name = await vscode.window.showInputBox({ prompt: 'New file name' });
                if (name) {
                    const newPath = path.join(targetDir, name);
                    fs.writeFileSync(newPath, '');
                    const doc = await vscode.workspace.openTextDocument(newPath);
                    await vscode.window.showTextDocument(doc);
                    provider.refresh();
                }
            }
        }),
        vscode.commands.registerCommand('focusFolder.newFolder', async (resource) => {
            const targetDir = resource?.value;
            if (targetDir) {
                const name = await vscode.window.showInputBox({ prompt: 'New folder name' });
                if (name) {
                    fs.mkdirSync(path.join(targetDir, name), { recursive: true });
                    provider.refresh();
                }
            }
        }),
        vscode.commands.registerCommand('focusFolder.rename', async (resource) => {
            if (resource?.value) {
                const oldName = path.basename(resource.value);
                const newName = await vscode.window.showInputBox({ prompt: 'New name', value: oldName });
                if (newName && newName !== oldName) {
                    const newPath = path.join(path.dirname(resource.value), newName);
                    fs.renameSync(resource.value, newPath);
                    provider.refresh();
                }
            }
        }),
        vscode.commands.registerCommand('focusFolder.delete', async (resource) => {
            // Handle multi-select: use treeView.selection if available
            const items = resource ? [resource] : treeView.selection;
            const validItems = items.filter(r => r?.value);
            if (validItems.length > 0) {
                const names = validItems.map(r => path.basename(r.value)).join(', ');
                const confirm = await vscode.window.showWarningMessage(
                    `Move ${validItems.length} item(s) to Trash?\n${names}`,
                    { modal: true }, 'Move to Trash'
                );
                if (confirm) {
                    for (const item of validItems) {
                        await vscode.workspace.fs.delete(vscode.Uri.file(item.value), { useTrash: true, recursive: true });
                    }
                    provider.refresh();
                }
            }
        }),

        // Cut/Copy/Paste
        vscode.commands.registerCommand('focusFolder.cut', (resource) => {
            // Handle multi-select: use treeView.selection if available
            const items = resource ? [resource] : treeView.selection;
            if (items.length > 0) {
                clipboardPaths = items.filter(r => r?.value).map(r => r.value);
                clipboardOperation = 'cut';
                const names = clipboardPaths.map(p => path.basename(p)).join(', ');
                vscode.window.showInformationMessage('Cut: ' + names);
            }
        }),
        vscode.commands.registerCommand('focusFolder.copy', (resource) => {
            // Handle multi-select: use treeView.selection if available
            const items = resource ? [resource] : treeView.selection;
            if (items.length > 0) {
                clipboardPaths = items.filter(r => r?.value).map(r => r.value);
                clipboardOperation = 'copy';
                const names = clipboardPaths.map(p => path.basename(p)).join(', ');
                vscode.window.showInformationMessage('Copied: ' + names);
            }
        }),
        vscode.commands.registerCommand('focusFolder.paste', async (resource) => {
            // Handle keyboard shortcut: use treeView.selection if no resource passed
            let targetDir = resource?.value;
            if (!targetDir && treeView.selection.length > 0) {
                // Use first selected item as target
                const selected = treeView.selection[0];
                if (selected?.value) {
                    // If selected is a file, paste into its parent folder
                    try {
                        const stat = fs.statSync(selected.value);
                        targetDir = stat.isDirectory() ? selected.value : path.dirname(selected.value);
                    } catch (e) {
                        targetDir = selected.value;
                    }
                }
            }
            if (targetDir && clipboardPaths.length > 0) {
                for (const sourcePath of clipboardPaths) {
                    if (!fs.existsSync(sourcePath)) continue;
                    const destPath = path.join(targetDir, path.basename(sourcePath));
                    if (clipboardOperation === 'cut') {
                        fs.renameSync(sourcePath, destPath);
                    } else {
                        await vscode.workspace.fs.copy(
                            vscode.Uri.file(sourcePath),
                            vscode.Uri.file(destPath),
                            { overwrite: false }
                        );
                    }
                }
                if (clipboardOperation === 'cut') {
                    clipboardPaths = [];
                    clipboardOperation = null;
                }
                provider.refresh();
            }
        }),
        vscode.commands.registerCommand('focusFolder.moveToFolder', async (resource) => {
            if (resource?.value) {
                const dest = await vscode.window.showOpenDialog({
                    canSelectFolders: true,
                    canSelectFiles: false,
                    title: 'Move to folder'
                });
                if (dest?.[0]) {
                    const destPath = path.join(dest[0].fsPath, path.basename(resource.value));
                    fs.renameSync(resource.value, destPath);
                    provider.refresh();
                }
            }
        }),

        // FT & Folder Customization bridges
        vscode.commands.registerCommand('focusFolder.createTemplatedFolder', (resource) => {
            if (resource?.value) vscode.commands.executeCommand('FT.createFolderStructure', vscode.Uri.file(resource.value));
        }),
        vscode.commands.registerCommand('focusFolder.fcApplyColor', (resource) => {
            if (resource?.resourceUri) vscode.commands.executeCommand('folder-customization.setColor', resource.resourceUri);
        }),
        vscode.commands.registerCommand('focusFolder.fcApplyIcon', (resource) => {
            if (resource?.resourceUri) vscode.commands.executeCommand('folder-customization.setEmojiBadge', resource.resourceUri);
        }),
        vscode.commands.registerCommand('focusFolder.fcReset', (resource) => {
            if (resource?.resourceUri) vscode.commands.executeCommand('folder-customization.clearCustomization', resource.resourceUri);
        }),

        // Add to Yasin Favorites
        vscode.commands.registerCommand('focusFolder.addToYasinFavorites', (resource) => {
            if (resource?.resourceUri) {
                vscode.commands.executeCommand('yasinFavorites.addToFavorites', resource.resourceUri);
            } else if (resource?.value) {
                vscode.commands.executeCommand('yasinFavorites.addToFavorites', vscode.Uri.file(resource.value));
            }
        }),

        treeView
    );

    // Restore on activation
    const config = vscode.workspace.getConfiguration('focusFolder');
    const saved = config.get('focusPaths') || [];
    const legacy = config.get('currentPath');
    const sortOrder = config.get('sortOrder', 'MANUAL');
    if (legacy && !saved.includes(legacy)) saved.push(legacy);

    // Restore sort order
    provider.setSortOrder(sortOrder);

    if (saved.length > 0) {
        const valid = saved.filter(p => fs.existsSync(p));
        if (valid.length > 0) {
            provider.setFocusPaths(valid);
            saveConfig(provider);
            setupWatchers(provider, context);
        }
    }
}

function deactivate() {
    fileWatchers.forEach(w => w.dispose());
}

module.exports = { activate, deactivate };
