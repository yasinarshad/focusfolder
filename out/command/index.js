/**
 * T042: Export all command functions
 */

const { copyPath, copyRelativePath } = require('./copyPath');
const {
    revealInSidebar,
    revealInFinder,
    createTemplatedFolder,
    createFCBridge,
    fcColorBridge,
    fcIconBridge,
    fcResetBridge
} = require('./bridges');

module.exports = {
    copyPath,
    copyRelativePath,
    revealInSidebar,
    revealInFinder,
    createTemplatedFolder,
    createFCBridge,
    fcColorBridge,
    fcIconBridge,
    fcResetBridge
};
