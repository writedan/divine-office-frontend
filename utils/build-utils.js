const { app, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const { logMessage } = require("./message-utils");

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
    const cargoProcess = spawn('cargo', ['run', '--release'], { 
      cwd: targetDir,
      env: env 
    });

    app.on('before-quit', () => {
      console.log('terminating cargo');
      if (cargoProcess) {
        console.log("erminating cargo process...", cargoProcess.kill('SIGTERM'));
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

ipcMain.handle('npm-package-project', async (event, projectPath) => {
    try {
        projectPath = path.join(app.getPath('userData'), projectPath);

        const npmPath = `"${path.join(process.cwd(), 'node_modules', '.bin', 'npm')}"`;
        logMessage("npm-package-project", "Using npm from:", npmPath);

        const spawnNpmProcess = (args) => {
            const npmProcess = spawn(npmPath, args, {
                cwd: projectPath,
                env: process.env,
                shell: true
            });

            let output = '';

            npmProcess.stdout.on('data', (data) => {
                const message = data.toString();
                output += message;
                logMessage("npm-package-project", message);
            });

            npmProcess.stderr.on('data', (data) => {
                const message = data.toString();
                output += message;
                logMessage("npm-package-project", message);
            });

            return new Promise((resolve, reject) => {
                npmProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject({ success: false, error: `Process exited with code ${code}` });
                    } else {
                        resolve({ success: true });
                    }
                });

                npmProcess.on('error', (error) => {
                    reject({ success: false, error: error.message });
                });
            });
        };

        logMessage("npm-package-project", "Starting npm install...");
        const installResult = await spawnNpmProcess(['install', '--loglevel verbose']);
        if (!installResult.success) {
            throw new Error(`npm install failed: ${installResult.error}`);
        }

        logMessage("npm-package-project", "Starting npm run package...");
        const packageResult = await spawnNpmProcess(['run', 'package']);
        if (!packageResult.success) {
            throw new Error(`npm run package failed: ${packageResult.error}`);
        }

        return {
            success: true,
            message: 'Project successfully installed and packaged'
        };

    } catch (error) {
        logMessage("npm-package-project", "Process failed:", JSON.stringify(error, null, 2));
        return {
            success: false,
            error: error
        };
    }
});