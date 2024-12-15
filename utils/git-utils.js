const { logMessage } = require("./message-utils");
const { simpleGit, CleanOptions } = require('simple-git');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { ipcMain, app } = require('electron');

const getDivineOfficePath = (subPath = '') => {
    const basePath = app.getPath('userData');
    return path.join(basePath, subPath);
};

console.log('USER_DATA_PATH', getDivineOfficePath());

async function updateRepo(event, repoPath, subDir, branch = 'master') {
    try {
        const dirPath = path.resolve(getDivineOfficePath(subDir));

        logMessage('git-log', `Identified target path: ${dirPath}`);
        
        let git;
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            git = simpleGit({ baseDir: getDivineOfficePath() });
        } else {
            git = simpleGit({ baseDir: dirPath });
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

        logMessage('git-log', 'Finished successfully');
        return { success: true };
    } catch (error) {
        logMessage('git-log', 'An error occurred:', error.message);
        logMessage('git-log', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
    }
}

const getCommitDifference = async (repoPath, subDir, branch = 'master') => {
    try {
        const dirPath = path.resolve(getDivineOfficePath(subDir));

        if (!fs.existsSync(dirPath) || !fs.existsSync(path.join(dirPath, '.git'))) {
            throw new Error('The specified directory is not a Git repository.');
        }

        const git = simpleGit({ baseDir: dirPath });

        await git.fetch('origin', branch);

        const localBranch = await git.revparse([branch]);
        const remoteBranch = await git.revparse([`origin/${branch}`]);

        const ahead = (await git.log([`${remoteBranch}..${localBranch}`])).total;
        const behind = (await git.log([`${localBranch}..${remoteBranch}`])).total;

        logMessage('git-log', `Local branch is ${ahead} commits ahead and ${behind} commits behind the remote branch.`);

        return { success: true, ahead, behind };
    } catch (error) {
        logMessage('git-log', 'An error occurred while checking commit differences:', error.message);
        return { success: false, error: error.message };
    }
};

ipcMain.handle('update-repo', async (event, repoPath, subDir, branch = 'master') => {
    return await updateRepo(event, repoPath, subDir, branch);
});

ipcMain.handle('get-commit-difference', async (event, repoPath, subDir, branch = 'master') => {
    return await getCommitDifference(repoPath, subDir, branch);
});