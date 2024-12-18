const { spawn } = require('child_process'); 
const fs = require('fs');
const path = require('path');
const { ipcMain } = require('electron');
const { logMessage } = require("./message-utils");
const os = require("os");
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
    const binaries = getDefaultBinaryPaths();
    return binaries.npm.length > 0 && binaries.node.length > 0;
}

function validateBinaryPath(pathToCheck) {
    try {
        const stats = fs.statSync(pathToCheck);
        return stats.isFile();
    } catch (error) {
        return false;
    }
}

function getExecutablePaths(possiblePaths) {
    const expandedPaths = possiblePaths.flatMap(p => {
        if (p.includes('*')) {
            try {
                const baseDir = path.dirname(p.replace('*', ''));
                if (!fs.existsSync(baseDir)) {
                    return [];
                }

                return fs.readdirSync(baseDir)
                    .map(entry => path.join(baseDir, entry))
                    .filter(fullPath => {
                        const pattern = new RegExp(p.replace('*', '.*'));
                        return pattern.test(fullPath);
                    });
            } catch(err) {
                console.error(err);
                return [];
            }
        }
        return [p];
    });

    return expandedPaths
        .filter(p => fs.existsSync(p))
        .map(p => path.resolve(p));
}


function getDefaultBinaryPaths() {
    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
        case 'darwin':
            return {
                node: getExecutablePaths([
                    '/usr/local/bin/node',
                    path.join(homeDir, '.nodenv/shims/node'),
                    path.join(homeDir, '.nvm/versions/node/*/bin/node'),
                    '/opt/homebrew/bin/node',
                    '/usr/local/nodejs/bin/node'
                ]),
                npm: getExecutablePaths([
                    '/usr/local/bin/npm',
                    path.join(homeDir, '.nodenv/shims/npm'),
                    path.join(homeDir, '.nvm/versions/node/*/bin/npm'),
                    '/opt/homebrew/bin/npm',
                    '/usr/local/nodejs/bin/npm'
                ])
            };

        case 'linux':
            return {
                node: getExecutablePaths([
                    '/usr/bin/node',
                    path.join(homeDir, '.nodenv/shims/node'),
                    path.join(homeDir, '.nvm/versions/node/*/bin/node'),
                    '/usr/local/bin/node',
                    '/opt/node/bin/node'
                ]),
                npm: getExecutablePaths([
                    '/usr/bin/npm',
                    path.join(homeDir, '.nodenv/shims/npm'),
                    path.join(homeDir, '.nvm/versions/node/*/bin/npm'),
                    '/usr/local/bin/npm',
                    '/opt/node/bin/npm'
                ])
            };

        case 'win32':
            return {
                node: getExecutablePaths([
                    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'nodejs\\node.exe'),
                    path.join(process.env.LOCALAPPDATA || 'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local', 'Programs\\nodejs\\node.exe'),
                    path.join(process.env.USERPROFILE || 'C:\\Users\\' + os.userInfo().username, '.nvm\\nodejs\\node.exe'),
                    'C:\\Program Files\\nodejs\\node.exe',
                    'C:\\Program Files (x86)\\nodejs\\node.exe'
                ]),
                npm: getExecutablePaths([
                    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'nodejs\\npm'),
                    path.join(process.env.LOCALAPPDATA || 'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local', 'Programs\\nodejs\\npm'),
                    path.join(process.env.USERPROFILE || 'C:\\Users\\' + os.userInfo().username, '.nvm\\nodejs\\npm'),
                    'C:\\Program Files\\nodejs\\npm',
                    'C:\\Program Files (x86)\\nodejs\\npm'
                ])
            };

        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}

function checkBinaryVersions(paths) {
    const validBinaries = {};

    for (const [type, binaryPaths] of Object.entries(paths)) {
        validBinaries[type] = binaryPaths.map(binaryPath => {
            try {
                const { execSync } = require('child_process');
                const version = execSync(`"${binaryPath}" --version`, { encoding: 'utf-8' }).trim();
                
                return {
                    path: binaryPath,
                    version: version
                };
            } catch (error) {
                return null;
            }
        }).filter(Boolean);
    }

    return validBinaries;
}

try {
    const existingPaths = getDefaultBinaryPaths();
    console.log('Existing Node.js Paths:', existingPaths.node);
    console.log('Existing npm Paths:', existingPaths.npm);

    const versionedBinaries = checkBinaryVersions(existingPaths);
    console.log('Validated Binaries:', JSON.stringify(versionedBinaries, null, 2));
} catch (error) {
    console.error('Error finding binary paths:', error.message);
}

module.exports = { 
    getDefaultBinaryPaths, 
    validateBinaryPath,
    checkBinaryVersions 
};

ipcMain.handle('enable-nvm', enableNvm);
ipcMain.handle('is-npm-installed', async (event) => {
    // try {
    //     await execCmd('nvm', ['on']);
    // } catch (err) {
    //     console.error(err);
    // }

    return await isNpmInstalled();
});

ipcMain.handle('run-nvm-installer', async (event) => {
    await runNvmInstaller();

    const verify = await isNpmInstalled();
    logMessage('npm-install', 'Install verification:', verify);
    if (!verify) {
        logMessage('npm-install', "Install verification failed. Please ensure npm is on your PATH or installed in the default location.");
    }

    return { success: verify };
});