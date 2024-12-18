const { spawn } = require('child_process'); 
const fs = require('fs');
const path = require('path');
const { ipcMain } = require('electron');
const { logMessage } = require("./message-utils");
const { runNvmInstaller } = require("./nvm-installer");

function execCmd(command, args) { 
    return new Promise((resolve, reject) => {
        logMessage('npm-install', 'Running', command, args.join(' '));

        const exec = spawn(command, args, { shell: true });

        exec.stdout.on('data', (data) => {
            logMessage('npm-install', String(data));
        });

        exec.stderr.on('data', (data) => {
            logMessage('npm-install', String(data));
        });

        exec.on('error', (err) => {
            reject(new Error(`Spawn process failed: ${err.message}`));
        });

        exec.on('close', (code) => {
            if (code === 0) {
                resolve('Execution completed successfully.');
            } else {
                reject(new Error(`Execution failed with exit code ${code}.`));
            }
        });
    });
}

async function enableNvm() {
    try {
        await execCmd('nvm', ['on']);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

async function isNpmInstalled() {
    try {
        await execCmd('npm', ['--version']);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

ipcMain.handle('enable-nvm', enableNvm);
ipcMain.handle('is-npm-installed', async (event) => {
    // try {
    //     await execCmd('nvm', ['on']);
    // } catch (err) {
    //     console.error(err);
    // }

    return await isNpmInstalled();
});
ipcMain.handle('run-nvm-installer', runNvmInstaller);