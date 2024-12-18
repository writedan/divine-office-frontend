const { app, ipcMain } = require('electron');
const { execFile, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const { logMessage } = require("./message-utils");
const fs = require('fs');
const fsExtra = require('fs-extra');
const asar = require('asar');

function getRustPath() {
    if (os.platform() === 'win32') {
        return process.env.USERPROFILE + '\\.cargo\\bin';
    } else if (os.platform() === 'darwin' || os.platform() === 'linux') {
        return path.join(os.homedir(), '.cargo', 'bin'); 
    }
    return ''; 
}

ipcMain.handle('start-backend', async (event) => {
  try {
    const targetDir = path.join(app.getPath('userData'), 'backend');

    logMessage("start-backend", "Identified path", targetDir);
    
    const env = { ...process.env, PATH: `${getRustPath()}:${process.env.PATH}` };
    const cargoProcess = spawn(path.join(getRustPath(), 'cargo'), ['run', '--release'], { 
      cwd: targetDir,
      env: env 
    });

    app.on('before-quit', () => {
      if (cargoProcess) {
        console.log("Cargo kill success:", cargoProcess.kill('SIGTERM'));
      }
    });

    let output = '';
    let url = null;

    cargoProcess.stdout.on('data', (data) => {
      logMessage("start-backend", data.toString());
      output += data.toString();
      const match = output.match(/https?:\/\/[^\s]+/);
      if (match && !url) {
        url = match[0];
        logMessage("start-backend", "Identified backend URL", url);
        event.sender.send('cargo-url', { url });
      }
    });

    cargoProcess.stderr.on('data', (data) => {
      output += data.toString();
      logMessage("start-backend", data.toString());
    });

    cargoProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Cargo process exited with code ${code}`);
        event.sender.send('cargo-err', code);
      }
    });

    return { success: true, message: 'Cargo process running in the background.' };

  } catch (error) {
    console.error(error);
    logMessage("start-backend", error);
    return { success: false, error: error.message };
  }
});

function isRunningInAsar() {
    return app.getAppPath().includes(".asar");
}

// this originally tried to clone modules out of the ASAR archive but we got nowhere
// you MUST declare modules you need to "clone" in packages.json under "build.asarUnpack"
function cloneModule(mod) {
    const appPath = app.getAppPath();
    const sourcePath = path.resolve(path.join(appPath, 'node_modules', mod));
    if (isRunningInAsar()) {
        return path.join(appPath, '..', 'app.asar.unpacked', 'node_modules', mod);
    } else {
        return sourcePath;
    }
}

function copySync(source, destination) {
    logMessage('npm-package-project', 'Cloning', source, 'to', destination);
    const stats = fs.statSync(source);

    if (stats.isDirectory()) {
        fs.mkdirSync(destination, { recursive: true });

        const files = fs.readdirSync(source);
        files.forEach((file) => {
            const currentSource = path.join(source, file);
            const currentDestination = path.join(destination, file);
            copySync(currentSource, currentDestination);
        });
    } else if (stats.isFile()) {
        fs.copyFileSync(source, destination);
    }
}


ipcMain.handle('npm-package-project', async (event, projectPath) => {
    try {
        projectPath = path.join(app.getPath('userData'), projectPath);

        const nodeBinaryPath = path.join(cloneModule('node'), 'bin', 'node');
        logMessage('npm-package-project', 'Using node from:', nodeBinaryPath);

        logMessage('npm-package-project', 'Cloning npm binaries');
        const npmBinaryPath = path.join(cloneModule('npm'), 'bin', 'npm-cli.js');
        logMessage('npm-package-project', 'Using npm from: ', npmBinaryPath);

        const execProcess = (binary, args, cwd) => {
            return new Promise((resolve, reject) => {
                const customNodePath = path.dirname(binary);
                const newPath = `${customNodePath}${path.delimiter}${process.env.PATH}${path.delimiter}${path.dirname(npmBinaryPath)}`;
                
                // Only apply Rosetta fix for ARM macOS
                const needsRosetta = process.platform === 'darwin' && 
                                    process.arch === 'arm64' && 
                                    path.basename(binary).includes('node');

                let finalBinary = binary;
                let finalArgs = args;
                
                if (needsRosetta) {
                    finalBinary = '/usr/bin/arch';
                    finalArgs = ['-x86_64', binary, ...args];
                }

                logMessage('npm-package-project', 'Running', finalBinary, finalArgs.join(' '));
                logMessage('npm-package-project', 'system path: ', newPath);
                
                const child = execFile(finalBinary, finalArgs, {
                    cwd,
                    env: {
                        ...process.env,
                        PATH: newPath,
                    },
                });

                let output = '';

                child.stdout.on('data', (data) => {
                    const message = data.toString();
                    output += message;
                    logMessage("npm-package-project", message);
                });

                child.stderr.on('data', (data) => {
                    const message = data.toString();
                    output += message;
                    logMessage("npm-package-project", message);
                });

                child.on('close', (code) => {
                    if (code !== 0) {
                        reject({ success: false, error: `Process exited with code ${code}` });
                    } else {
                        resolve({ success: true });
                    }
                });

                child.on('error', (error) => {
                    console.error(error);
                    reject({ success: false, error });
                });
            });
        };

        logMessage("npm-package-project", "Starting npm install...");
        const installResult = await execProcess(nodeBinaryPath, [npmBinaryPath, 'install', '--loglevel', 'verbose'], projectPath);
        if (!installResult.success) {
            throw new Error(`npm install failed: ${installResult.error}`);
        }

        logMessage("npm-package-project", "Starting npm run package...");
        const packageResult = await execProcess(nodeBinaryPath, [npmBinaryPath, 'run', 'simple-package'], projectPath);
        if (!packageResult.success) {
            throw new Error(`npm run package failed: ${packageResult.error}`);
        }

        logMessage("npm-package-project", "Running separateAssets.js...");
        const separateAssetsPath = path.join(projectPath, 'separateAssets.js');
        const separateAssetsResult = await execProcess(nodeBinaryPath, [separateAssetsPath], projectPath);
        if (!separateAssetsResult.success) {
            throw new Error(`Running separateAssets.js failed: ${separateAssetsResult.error}`);
        }

        return {
            success: true,
            message: 'Project successfully installed, packaged, and assets separated',
        };
    } catch (error) {
        console.error(error);
        logMessage("npm-package-project", "Process failed:", JSON.stringify(error, null, 2));
        return {
            success: false,
            error: error.message || error,
        };
    }
});