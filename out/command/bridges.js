const vscode = require('vscode');

/**
 * T049: Reveal resource in VS Code Explorer sidebar
 * @param {object} resource - Resource with resourceUri property
 */
async function revealInSidebar(resource) {
    if (resource && resource.resourceUri) {
        await vscode.commands.executeCommand('revealInExplorer', resource.resourceUri);
    }
}

/**
 * T050: Reveal resource in OS file manager (Finder on macOS)
 * @param {object} resource - Resource with resourceUri property
 */
async function revealInFinder(resource) {
    if (resource && resource.resourceUri) {
        await vscode.commands.executeCommand('revealFileInOS', resource.resourceUri);
    }
}

/**
 * T051: Bridge to FT extension's Create Templated Folder
 * @param {object} resource - Resource with value property
 */
async function createTemplatedFolder(resource) {
    if (resource && resource.value) {
        await vscode.commands.executeCommand('FT.createFolderStructure', resource.value);
    }
}

/**
 * T052: Folder Customization wrapper factory
 * Creates a bridge function that wraps a Folder Customization command
 * @param {string} fcCommand - The FC command to wrap
 * @returns {function} - Wrapper function
 */
function createFCBridge(fcCommand) {
    return async function(resource) {
        if (resource && resource.resourceUri) {
            // FC extension expects URI in an array
            await vscode.commands.executeCommand(fcCommand, [resource.resourceUri]);
        } else if (resource && resource.value) {
            const uri = vscode.Uri.file(resource.value);
            await vscode.commands.executeCommand(fcCommand, [uri]);
        }
    };
}

// Pre-created FC bridges
const fcColorBridge = createFCBridge('folder-customization.applyColor');
const fcIconBridge = createFCBridge('folder-customization.applyIcon');
const fcResetBridge = createFCBridge('folder-customization.reset');

module.exports = {
    revealInSidebar,
    revealInFinder,
    createTemplatedFolder,
    createFCBridge,
    fcColorBridge,
    fcIconBridge,
    fcResetBridge
};
