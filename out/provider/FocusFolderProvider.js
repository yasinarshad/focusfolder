const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Resource - TreeItem representing a file or folder in the focused view
 */
class Resource extends vscode.TreeItem {
    /**
     * @param {string} label - Display name
     * @param {vscode.TreeItemCollapsibleState} collapsibleState - Collapse state
     * @param {string} value - Absolute filesystem path
     * @param {string} contextValue - Type identifier for context menu routing
     */
    constructor(label, collapsibleState, value, contextValue) {
        super(label, collapsibleState);
        this.value = value;
        this.contextValue = contextValue;
        this.resourceUri = vscode.Uri.file(value);
        this.tooltip = value;

        // Files open on click
        if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
            this.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [this.resourceUri]
            };
        }
    }
}

/**
 * FocusFolderProvider - TreeDataProvider for the FOCUSED panel
 * Supports multiple focused folders
 */
class FocusFolderProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        // Array of focused paths (multi-folder support)
        this.focusPaths = [];

        // Sort order: 'ASC', 'DESC', 'MODIFIED', or 'MANUAL'
        this.sortOrder = 'MANUAL';

        // Drag and Drop support (v1.3)
        this.dropMimeTypes = ['application/vnd.code.tree.focusFolder'];
        this.dragMimeTypes = ['application/vnd.code.tree.focusFolder'];
    }

    /**
     * Set sort order and refresh
     * @param {'ASC' | 'DESC' | 'MODIFIED' | 'MANUAL'} order
     */
    setSortOrder(order) {
        this.sortOrder = order;
        this.refresh();
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    /**
     * Get children - returns focused roots when no element, or folder contents when element provided
     */
    getChildren(element) {
        // No folders focused - empty state
        if (this.focusPaths.length === 0) {
            return [];
        }

        // Root level - return all focused folders
        if (!element) {
            return this.focusPaths.map(folderPath => {
                const folderName = path.basename(folderPath);
                return new Resource(
                    folderName,
                    vscode.TreeItemCollapsibleState.Expanded,
                    folderPath,
                    'focusRoot'  // This triggers the inline X button
                );
            });
        }

        // Element provided - read its children
        const targetPath = element.value;

        try {
            const items = fs.readdirSync(targetPath);
            const filtered = items.filter(item => !item.startsWith('.'));

            // Pre-fetch stat info for sorting
            const itemStats = new Map();
            for (const item of filtered) {
                const fullPath = path.join(targetPath, item);
                try {
                    const stat = fs.statSync(fullPath);
                    itemStats.set(item, {
                        isDir: stat.isDirectory(),
                        mtime: stat.mtimeMs,
                        fullPath: fullPath
                    });
                } catch (e) {
                    itemStats.set(item, { isDir: false, mtime: 0, fullPath: fullPath });
                }
            }

            // Sort based on sortOrder setting
            filtered.sort((a, b) => {
                const statA = itemStats.get(a);
                const statB = itemStats.get(b);

                // Directories always first (regardless of sort order)
                if (statA.isDir && !statB.isDir) return -1;
                if (!statA.isDir && statB.isDir) return 1;

                // Then apply sortOrder
                if (this.sortOrder === 'MODIFIED') {
                    return statB.mtime - statA.mtime; // Newest first
                } else if (this.sortOrder === 'DESC') {
                    return b.toLowerCase().localeCompare(a.toLowerCase()); // Z-A
                } else {
                    // ASC or MANUAL - alphabetical (A-Z)
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                }
            });

            return filtered
                .map(item => {
                    const stat = itemStats.get(item);
                    const collapsibleState = stat.isDir
                        ? vscode.TreeItemCollapsibleState.Collapsed
                        : vscode.TreeItemCollapsibleState.None;
                    const contextValue = stat.isDir ? 'resource.dir' : 'resource';
                    return new Resource(item, collapsibleState, stat.fullPath, contextValue);
                })
                .filter(item => item !== null);
        } catch (err) {
            console.error('FocusFolderProvider.getChildren error:', err);
            return [];
        }
    }

    /**
     * Add a folder to focus (multi-folder support)
     * @param {string} folderPath - Absolute path to add
     */
    addFocus(folderPath) {
        if (!this.focusPaths.includes(folderPath)) {
            this.focusPaths.push(folderPath);
            this.refresh();
        }
    }

    /**
     * Remove a specific folder from focus
     * @param {string} folderPath - Absolute path to remove
     */
    removeFocus(folderPath) {
        const index = this.focusPaths.indexOf(folderPath);
        if (index > -1) {
            this.focusPaths.splice(index, 1);
            this.refresh();
        }
    }

    /**
     * Clear all focused folders
     */
    clearAllFocus() {
        this.focusPaths = [];
        this.refresh();
    }

    /**
     * Set all focused paths (for restoration from config)
     * @param {string[]} paths - Array of paths
     */
    setFocusPaths(paths) {
        this.focusPaths = paths.filter(p => fs.existsSync(p));
        this.refresh();
    }

    /**
     * Get current focused paths
     * @returns {string[]}
     */
    getFocusPaths() {
        return [...this.focusPaths];
    }

    /**
     * Handle drag start - serialize dragged items (v1.3)
     * Only allow dragging Resource items (files/folders inside expanded focused folders)
     * FocusRoot items should NOT be draggable - use Move Up/Down instead
     * @param {Resource[]} source - Items being dragged
     * @param {vscode.DataTransfer} dataTransfer - Data transfer object
     * @param {vscode.CancellationToken} token - Cancellation token
     */
    async handleDrag(source, dataTransfer, token) {
        // Only allow dragging Resource items (not focusRoot)
        const resourceItems = source.filter(item =>
            item.value && item.contextValue !== 'focusRoot'
        );

        if (resourceItems.length === 0) {
            return; // Don't set data transfer - prevents drag
        }

        const itemPaths = resourceItems.map(item => item.value);

        dataTransfer.set(
            'application/vnd.code.tree.focusFolder',
            new vscode.DataTransferItem(itemPaths)
        );
    }

    /**
     * Handle drop - move items to target folder (v1.3)
     * @param {Resource|undefined} target - Drop target
     * @param {vscode.DataTransfer} dataTransfer - Data transfer with dragged items
     * @param {vscode.CancellationToken} token - Cancellation token
     */
    async handleDrop(target, dataTransfer, token) {
        const draggedItem = dataTransfer.get('application/vnd.code.tree.focusFolder');
        if (!draggedItem) return;

        const sourcePaths = draggedItem.value;
        if (!sourcePaths || sourcePaths.length === 0) return;

        // Determine target folder
        let targetFolder;
        if (!target) {
            // Dropped in empty space - reject
            vscode.window.showWarningMessage('Cannot drop here - select a folder as drop target');
            return;
        }

        try {
            // Target must be a folder
            const targetStat = fs.statSync(target.value);
            if (targetStat.isDirectory()) {
                targetFolder = target.value;
            } else {
                // If target is file, use its parent folder
                targetFolder = path.dirname(target.value);
            }
        } catch (err) {
            vscode.window.showErrorMessage('Invalid drop target');
            return;
        }

        // Move each source to target folder
        for (const sourcePath of sourcePaths) {
            const destPath = path.join(targetFolder, path.basename(sourcePath));

            // Prevent dropping into itself or its child
            if (sourcePath === destPath) {
                continue;
            }
            if (destPath.startsWith(sourcePath + path.sep)) {
                vscode.window.showWarningMessage('Cannot move folder into itself');
                continue;
            }

            try {
                fs.renameSync(sourcePath, destPath);
            } catch (err) {
                vscode.window.showErrorMessage(`Failed to move ${path.basename(sourcePath)}: ${err.message}`);
            }
        }

        this.refresh();
    }
}

module.exports = FocusFolderProvider;
