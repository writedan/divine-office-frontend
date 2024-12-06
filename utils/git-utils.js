const { logMessage } = require("./message-utils");

const { simpleGit, CleanOptions } = require('simple-git');
const fs = require('fs');
const path = require('path');
const {
    ipcMain
} = require('electron');

async function updateRepo(event, repoPath, dirPath, branch='master') {
    try {
        let git;
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            git = simpleGit({
                baseDir: '.'
            });
        } else {
            git = simpleGit({
                baseDir: dirPath
            })
        }

        if (fs.existsSync(path.join(dirPath, '.git'))) {
            logMessage('git-log', 'Directory is already a Git repository.');

            const remotes = await git.getRemotes(true);
            const origin = remotes.find(remote => remote.name === 'origin');
            if (origin && origin.refs.fetch === repoPath) {
                logMessage('git-log', 'Remote origin is set correctly. Pulling latest updates...');
                await git.pull('origin', branch);
            } else {
                throw new Error(`Remote origin does not match the repoPath. Current: ${origin?.refs.fetch || 'none'}`);
            }
        } else {
            logMessage('git-log', 'Directory is not a Git repository. Cloning...');
            await git.clone(repoPath, dirPath);
        }

        return { success: true }
    } catch (error) {
        logMessage('git-log', 'An error occurred:', error.message);
        return { success: false, error: error.message }
    }
}

ipcMain.handle('update-repo', async (repoPath, dirPath, branch='master') => {
    return await updateRepo(repoPath, dirPath, branch);
})