const vscode = require('vscode');

/**
 * T043: Copy absolute path to clipboard
 * @param {object} resource - Resource with value property
 */
async function copyPath(resource) {
    if (resource && resource.value) {
        await vscode.env.clipboard.writeText(resource.value);
        vscode.window.showInformationMessage('Path copied to clipboard');
    }
}

/**
 * T044: Copy path relative to workspace root
 * @param {object} resource - Resource with value property
 */
async function copyRelativePath(resource) {
    if (resource && resource.value) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot && resource.value.startsWith(workspaceRoot)) {
            const relativePath = resource.value.replace(workspaceRoot + '/', '');
            await vscode.env.clipboard.writeText(relativePath);
            vscode.window.showInformationMessage('Relative path copied to clipboard');
        } else {
            await vscode.env.clipboard.writeText(resource.value);
            vscode.window.showInformationMessage('Path copied to clipboard (not in workspace)');
        }
    }
}

module.exports = { copyPath, copyRelativePath };
