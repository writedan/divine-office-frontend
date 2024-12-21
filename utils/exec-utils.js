const { logMessage } = require("./message-utils");
const { spawn } = require('child_process');
const fs = require("fs");
const { ipcMain, app } = require("electron");

(function() {
    var childProcess = require("child_process");
    var oldSpawn = childProcess.spawn;
    function mySpawn() {
        console.log('spawn:', arguments);
        var result = oldSpawn.apply(this, arguments);
        return result;
    }
    childProcess.spawn = mySpawn;
})(); // hack to log spawn commands

function execCmd(stream, command, args, opts, onData) {
	return new Promise((resolve, reject) => {	
		const exec = spawn(command, args, opts);
        logMessage(stream, '[spawn]', exec);

		exec.stdout.on('data', (data) => {
            logMessage(stream, String(data));
            if (onData) onData(data);
        });

        exec.stderr.on('data', (data) => {
            logMessage(stream, String(data));
            if (onData) onData(data);
        });

        exec.on('error', (err) => {
        	logMessage(stream, err);
            reject(err);
        });

        exec.on('close', (code) => {
            if (code === 0) {
                resolve('Execution completed successfully.');
            } else {
                reject(new Error(`Execution failed with exit code ${code}.`));
            }
        });

        app.on('before-quit', () => {
          if (exec) {
            console.log(command, "kill success:", exec.kill('SIGTERM'));
          }
        });
	});
};

function validateBinaryPath(pathToCheck) {
    try {
        const stats = fs.statSync(pathToCheck);
        return stats.isFile();
    } catch (error) {
        return false;
    }
};

function getExecutablePaths(possiblePaths) {
    const expandedPaths = possiblePaths.flatMap((p) => {
        if (p.includes('*')) {
            try {
                const baseDir = String(p).split('*')[0];
                if (!fs.existsSync(baseDir)) {
                    console.log('getExecutablePaths baseDir does not exist', baseDir);
                    return [];
                }

                return fs.readdirSync(baseDir)
                    .filter((entry) => {
                        const fullPath = String(p).replace("*", entry);
                        return fs.statSync(fullPath).isFile();
                    })
                    .map((entry) => path.resolve(String(p).replace("*", entry)));
            } catch (err) {
                console.error(`Error processing wildcard path '${p}':`, err);
                return [];
            }
        }
        return [p];
    });

    return expandedPaths.filter((p) => fs.existsSync(p));
};

const os = require('os');
const path = require('path');

function getRustBinaryPaths(tool) {
    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
        case 'darwin':
            return getExecutablePaths([
                path.join(homeDir, '.cargo', 'bin', tool),
                path.join('/usr', 'local', 'bin', tool),
                path.join('/opt', 'homebrew', 'bin', tool)
            ]);

        case 'linux':
            return getExecutablePaths([
                path.join(homeDir, '.cargo', 'bin', tool),
                path.join('/usr', 'local', 'bin', tool),
                path.join('/usr', 'bin', tool)
            ]);

        case 'win32':
            return getExecutablePaths([
                path.join(process.env.USERPROFILE || path.join('C:', 'Users', os.userInfo().username), '.cargo', 'bin', `${tool}.exe`),
                path.join(process.env.LOCALAPPDATA || path.join('C:', 'Users', os.userInfo().username, 'AppData', 'Local'), 'Programs', 'Rust',`${tool}.exe`),
                path.join('C:', 'Program Files', 'Rust', `${tool}.exe`)
            ]);

        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}

function getDefaultBinaryPaths() {
    const platform = os.platform();
    const homeDir = os.homedir();
    
    switch (platform) {
        case 'darwin':
            return {
                cargo: getRustBinaryPaths('cargo'),
                divineOffice: getRustBinaryPaths('divine-office')
            };
        case 'linux':
            return {
                cargo: getRustBinaryPaths('cargo'),
                divineOffice: getRustBinaryPaths('divine-office')
            };
        case 'win32':
            return {
                cargo: getRustBinaryPaths('cargo'),
                divineOffice: getRustBinaryPaths('divine-office')
            };
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
};

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
};

try {
    const existingPaths = getDefaultBinaryPaths();
    const versionedBinaries = checkBinaryVersions(existingPaths);
    console.log('Validated Binaries:', JSON.stringify(versionedBinaries, null, 2));
} catch (error) {
    throw new Error('Error finding binary paths:' + error);
}

module.exports = { getDefaultBinaryPaths, execCmd };
ipcMain.handle('default-binary-paths', (e) => getDefaultBinaryPaths());
ipcMain.handle('exec-command', (e, stream, command, args, opts) => execCmd(stream, command, args, opts));